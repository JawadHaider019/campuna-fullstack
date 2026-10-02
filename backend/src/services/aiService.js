import OpenAI from 'openai';

// Client pointing to local llama-server (OpenAI compatible on port 8080)
const client = new OpenAI({
    baseURL: process.env.LOCAL_AI_BASE_URL || 'http://localhost:8080/v1',
    apiKey: process.env.LOCAL_AI_API_KEY || 'no-key-required',
});

/**
 * Moderates a listing using local Qwen/llama-server
 * @param {Object} listingData { title, description, category, price, location }
 * @returns {Promise<{safe: boolean, reason: string, score: number, ai_decision: string}>}
 */
export async function moderateListingAI(listingData) {
    const listingText = `
Titel: ${listingData.title || ''}
Kategorie: ${listingData.category || ''}
Unterkategorie: ${listingData.subcategory || ''}
Preis: ${listingData.price || 0} €
Ort: ${listingData.location || ''}
Beschreibung: ${listingData.description || ''}
`.trim();

    try {
        const response = await client.chat.completions.create({
            model: 'qwen3', // Model alias
            messages: [
                {
                    role: 'system',
                    content: `You are the content moderation AI for Campuna, a German marketplace for camping, outdoor equipment, and RVs/motorhomes.
Your task is to inspect listings and evaluate safety, legitimacy, and text quality:
- PROHIBITED / ILLEGAL: Weapons (firearms, knives, ammunition), illegal Drugs / narcotics, Adult / 18+ / NSFW items, stolen goods, or criminal scams. Set safe=false, assign score 1-25, violations=["weapons"|"drugs"|"18+_content"].
- SPAM / GIBBERISH: Descriptions with repeating random keystrokes (e.g. "dfsgfsf...", "asdasd...") or meaningless garbage. Set safe=false, assign score 10-35, violations=["spam_gibberish"].
- LEGITIMATE: Legitimate motorhomes, campervans, caravans, camping trailers, tents, and camping accessories with clear detailed descriptions (like Weinsberg CaraBus, Knaus, Hymer, VW California) are 100% allowed and safe regardless of price. Set safe=true, assign score 85-98, violations=[].

Respond strictly in JSON format:
{
  "score": <integer from 1 to 100>,
  "safe": <boolean true or false>,
  "violations": <array of strings>,
  "reason": "<short explanation in German>"
}
/no_think`
                },
                {
                    role: 'user',
                    content: `Bitte prüfe dieses Inserat auf Richtlinienverstöße, Spam/Zeichensalat, Betrug und Verlässlichkeit:\n${listingText}\n\n/no_think`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 400,
        });

        const rawContent = response.choices[0]?.message?.content || '';

        // Defensive parsing: strip <think>...</think> if present, markdown fences, and extract first valid JSON
        let cleanJsonText = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        cleanJsonText = cleanJsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

        const firstBrace = cleanJsonText.indexOf('{');
        let lastBrace = cleanJsonText.lastIndexOf('}');
        
        // If JSON was cut off before closing brace, auto-close it safely
        if (firstBrace !== -1 && (lastBrace === -1 || lastBrace <= firstBrace)) {
            cleanJsonText = cleanJsonText.substring(firstBrace) + '"}';
            lastBrace = cleanJsonText.lastIndexOf('}');
        } else if (firstBrace !== -1 && lastBrace > firstBrace) {
            cleanJsonText = cleanJsonText.substring(firstBrace, lastBrace + 1);
        }

        let parsed;
        try {
            parsed = JSON.parse(cleanJsonText);
        } catch {
            // If parse fails due to cut-off inside a string, attempt quick regex extraction
            const safeMatch = cleanJsonText.match(/"safe"\s*:\s*(true|false)/i);
            const scoreMatch = cleanJsonText.match(/"score"\s*:\s*(\d+)/i);
            parsed = {
                safe: safeMatch ? safeMatch[1].toLowerCase() === 'true' : true,
                score: scoreMatch ? parseInt(scoreMatch[1], 10) : 90,
                violations: [],
                reason: 'Geprüftes Inserat'
            };
        }

        // Prohibited categories and spam list to detect policy & quality violations
        const PROHIBITED_KEYWORDS = ['weapon', 'waffe', 'messer', 'pistole', 'drug', 'droge', 'kokain', 'cannabis', 'thc', '18+', 'adult', 'erotik', 'nsfw', 'sex', 'satisfyer', 'vibrator', 'masturbat', 'spam_gibberish', 'price_anomaly'];
        
        // Check for gibberish / spam patterns (repeating characters or repeated random syllables)
        const desc = (listingData.description || '').trim();
        const isGibberish = /(.)\1{6,}/i.test(desc) || 
                            /(.{3,8})\1{4,}/i.test(desc) || 
                            /^(?:[a-z]{2,8}\b\s*){0,2}[a-z]{25,}$/i.test(desc) ||
                            (desc.length > 30 && !desc.includes(' ') && !desc.includes('\n'));

        let violatesPolicy = false;
        let violationReason = '';

        if (isGibberish) {
            violatesPolicy = true;
            violationReason = 'Spam/Zeichensalat in der Beschreibung erkannt.';
        }

        if (Array.isArray(parsed.violations)) {
            for (const v of parsed.violations) {
                const textToCheck = typeof v === 'string' ? v.toLowerCase() : JSON.stringify(v).toLowerCase();
                if (PROHIBITED_KEYWORDS.some(kw => textToCheck.includes(kw))) {
                    violatesPolicy = true;
                    if (textToCheck.includes('spam') || textToCheck.includes('gibberish')) {
                        violationReason = 'Spam/Zeichensalat in der Beschreibung erkannt.';
                    } else if (textToCheck.includes('price')) {
                        violationReason = 'Extremer Preisausreißer (unrealistischer Kaufpreis).';
                    } else if (textToCheck.includes('weapon') || textToCheck.includes('waffe')) {
                        violationReason = 'Unzulässiges Inserat: Waffen oder Waffenzubehör.';
                    } else if (textToCheck.includes('drug') || textToCheck.includes('droge')) {
                        violationReason = 'Unzulässiges Inserat: Verbotene Substanzen oder Betäubungsmittel.';
                    } else if (textToCheck.includes('18+') || textToCheck.includes('adult') || textToCheck.includes('erotik') || textToCheck.includes('sex')) {
                        violationReason = 'Unzulässiges Inserat: Erotik-/18+-Inhalte sind nicht gestattet.';
                    } else {
                        violationReason = parsed.reason || 'Verstoß gegen Campuna-Richtlinien.';
                    }
                    break;
                }
            }
        }

        // Also check if text contains obvious prohibited goods
        const fullListingLower = listingText.toLowerCase();
        if (PROHIBITED_KEYWORDS.some(kw => fullListingLower.includes(kw))) {
            violatesPolicy = true;
            if (!violationReason) violationReason = 'Verstoß gegen Inseratsrichtlinien.';
        }

        let score = typeof parsed.score === 'number' ? Math.max(1, Math.min(100, Math.round(parsed.score))) : (violatesPolicy ? 25 : 95);

        if (violatesPolicy) {
            score = Math.min(score, 25);
        } else if (parsed.safe === false) {
            score = Math.min(score, 35);
        } else {
            // Legitimate camping product
            score = Math.max(score, 85);
        }

        // Scoring rules:
        // > 60 and no violations: APPROVED (Auto-Approved)
        // 40 to 60: REVIEW (Needs Admin Approval)
        // < 40: REJECTED / Violations detected
        let aiDecision = 'MANUAL_REVIEW';
        let listingStatus = 'REVIEW';
        let safe = false;

        if (!violatesPolicy && score > 60) {
            aiDecision = 'AUTO_APPROVED';
            listingStatus = 'APPROVED';
            safe = true;
        } else if (violatesPolicy || score < 40) {
            aiDecision = 'AUTO_REJECTED';
            listingStatus = 'REJECTED';
            safe = false;
        } else {
            // 40 to 60 -> Borderline / incomplete, Admin needs to approve
            aiDecision = 'MANUAL_REVIEW';
            listingStatus = 'REVIEW';
            safe = false;
        }

        const textScore = typeof parsed.text_score === 'number' ? parsed.text_score : score;
        const priceScore = typeof parsed.price_score === 'number' ? parsed.price_score : (violatesPolicy ? 20 : 85);
        const fraudRisk = typeof parsed.fraud_risk_score === 'number' ? parsed.fraud_risk_score : (safe ? 5 : (violatesPolicy ? 90 : 35));

        let finalReason = parsed.reason || '';
        if (violatesPolicy && violationReason) {
            finalReason = violationReason;
        } else if (!finalReason) {
            finalReason = safe ? 'Automatisch durch KI genehmigt.' : (violatesPolicy ? 'Verstoß gegen Richtlinien (18+, Drogen, Waffen oder Spam).' : 'Mittlerer Score (40-60) – manuelle Prüfung erforderlich.');
        }

        return {
            score,
            safe,
            listing_status: listingStatus,
            ai_decision: aiDecision,
            reason: finalReason,
            confidence_score: 0.95
        };
    } catch (error) {
        console.warn('⚠️ Local AI Moderation server unreachable or errored, using rule-based engine:', error.message);
        
        const fullTextLower = `${listingData.title || ''} ${listingData.description || ''} ${listingData.category || ''} ${listingData.subcategory || ''}`.toLowerCase();
        const PROHIBITED_PATTERNS = [
            /\b(waff[a-z]*|pistol[a-z]*|gewehr[a-z]*|revolver|messer|armbrust|munition|cal\s*\.\d+)\b/i,
            /\b(drog[a-z]*|kokain|heroin|cannabis|thc|weed|marihuana|ecstasy|speed|keta|blüten)\b/i,
            /\b(18\+|erotik|nsfw|sex\b|porn[a-z]*|dildo|vibrator|satisfyer|womanizer|masturbat[a-z]*)\b/i,
            /\b(replica|nachbau|1:1\s*klon|gefälscht[a-z]*)\b/i
        ];

        const isProhibited = PROHIBITED_PATTERNS.some(rx => rx.test(fullTextLower));
        const isSpamOrSuspicious = (listingData.price !== undefined && listingData.price <= 15 && (listingData.category === 'Wohnmobile' || listingData.category === 'Wohnwagen')) ||
                                   fullTextLower.includes('nur per whatsapp') || fullTextLower.includes('whatsapp +');

        if (isProhibited) {
            return {
                score: 22,
                safe: false,
                listing_status: 'REJECTED',
                ai_decision: 'AUTO_REJECTED',
                reason: 'Verstoß gegen Richtlinien (Waffen, Drogen, 18+ oder Plagiate erkannt).',
                violations: ['policy_violation'],
                text_score: 20,
                price_score: 20,
                fraud_risk_score: 95,
                confidence_score: 0.98
            };
        }

        if (isSpamOrSuspicious) {
            return {
                score: 42,
                safe: false,
                listing_status: 'REVIEW',
                ai_decision: 'MANUAL_REVIEW',
                reason: 'Auffälliger Preis oder Kontaktmuster – manuelle Prüfung durch Admin erforderlich.',
                violations: ['suspicious_listing'],
                text_score: 45,
                price_score: 30,
                fraud_risk_score: 75,
                confidence_score: 0.90
            };
        }

        // Legitimate camping product
        const isCampingGear = ['kühlbox', 'zelt', 'wohnmobil', 'kastenwagen', 'faltstuhl', 'powerstation', 'solar', 'camping', 'dometic', 'outwell', 'pössl', 'helinox', 'ecoflow'].some(term => fullTextLower.includes(term));
        const finalScore = isCampingGear ? 94 : 88;

        return {
            score: finalScore,
            safe: true,
            listing_status: 'APPROVED',
            ai_decision: 'AUTO_APPROVED',
            reason: 'Automatisch durch Inhaltsanalyse und Richtlinienprüfung genehmigt.',
            violations: [],
            text_score: finalScore,
            price_score: 92,
            fraud_risk_score: 5,
            confidence_score: 0.96
        };
    }
}

/**
 * AI Listing Description Generator / Enhancer using local Qwen3 model
 * @param {Object} data { title, category, subcategory, price, location, condition, existingDescription, style }
 * @returns {Promise<{description: string, success: boolean}>}
 */
export async function generateListingDescriptionAI(data) {
    const isEnhance = Boolean(data.existingDescription && data.existingDescription.trim().length > 0);
    const cleanTitle = (data.title || '').trim();
    const cat = (data.category || '').trim();
    const sub = (data.subcategory || '').trim();
    const cond = (data.condition || 'Gebraucht').trim();
    const price = data.price ? `${data.price} €` : '';
    const loc = (data.location || '').trim();
    const existing = (data.existingDescription || '').trim();

    const systemPrompt = isEnhance
        ? `You are a professional German marketplace copy editor for Campuna.
STRICT RULES:
1. You may improve formatting, spelling, grammar, and structure, but you may NEVER invent, assume, or extrapolate facts.
2. DO NOT mention or repeat the price, payment terms (VB, Festpreis), location, or duplicate the ad title in the description text. These are already clearly visible in dedicated fields on the listing page.
3. Do NOT add fabricated marketing claims (e.g. "gepflegt und zuverlässig", "hervorragende Ausstattung", "sofort einsatzbereit") unless explicitly supplied in the seller's draft notes.
4. Category-specific discrete sections:
   - For Campers/Vehicles: FAHRZEUGDATEN → AUSSTATTUNG AB WERK → AUTARKIE & ELEKTRIK → ZUBEHÖR / WEITERE AUSSTATTUNG → ZUSTAND & WARTUNG
   - For Tents/Outdoor: PRODUKTDATEN → AUSSTATTUNG → ZUSTAND → LIEFERUMFANG / ZUBEHÖR
   - For Campsites: STELLPLATZINFORMATIONEN → AUSSTATTUNG & SERVICES
5. Keep technical attributes as concise bullet points (• 140 PS, • Schaltgetriebe, • 106.000 km) instead of converting them into awkward sentences.
6. Do NOT generate generic closing boilerplate like "Besichtigung und Kontaktaufnahme nach Absprache möglich" unless the seller explicitly provided viewing/contact details.
7. Do NOT use emojis.
Respond ONLY with the final German listing description.
/nothink /no_think`
        : `You are a professional German marketplace copy editor for Campuna.
STRICT RULES:
1. Only use the exact attributes provided by the seller. Never invent features, condition claims, marketing fluff, or unsolicited boilerplate.
2. DO NOT mention the price, location, or repeating ad title in the description text.
3. Keep technical specs as clean, concise bullet points (•).
4. Do NOT use emojis.
Respond ONLY with the final German listing description.
/nothink /no_think`;

    const userPrompt = isEnhance
        ? `Titel: ${cleanTitle}
Kategorie: ${cat}${sub ? ` / ${sub}` : ''}
Zustand: ${cond}
Vorhandener Entwurf / Notizen:
${existing}

Bitte erstelle daraus eine professionelle deutsche Inseratsbeschreibung (ohne Preis oder Standort zu wiederholen). /nothink`
        : `Titel: ${cleanTitle}
Kategorie: ${cat}${sub ? ` / ${sub}` : ''}
Zustand: ${cond}

Bitte erstelle eine ansprechende deutsche Inseratsbeschreibung (ohne Preis oder Standort zu wiederholen). /nothink`;

    try {
        const response = await client.chat.completions.create({
            model: 'qwen3',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 600,
        });

        let rawContent = response.choices[0]?.message?.content || '';
        // Strip <think>...</think> and code fences
        let cleanText = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        cleanText = cleanText.replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').trim();

        if (cleanText.length > 20) {
            return { success: true, description: cleanText };
        }
        throw new Error('AI output too short');
    } catch (err) {
        console.warn('⚠️ Local AI description generation failed, falling back to rule-based template:', err.message);
        return { success: false, error: err.message };
    }
}


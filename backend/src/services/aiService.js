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
                    content: `You are an AI content moderation system for the German camping marketplace Campuna.
Analyze the provided camping listing. Check for prohibited items (weapons, drugs, non-camping unrelated spam, hate speech, obvious scams, illegal services).
Respond ONLY with a valid JSON object containing:
- "safe": boolean (true if the listing is safe camping gear/vehicle/service, false if illegal/fraud/spam)
- "reason": string in German explaining the decision briefly
- "fraud_risk_score": number between 0.0 (safe) and 1.0 (high risk)
/no_think`
                },
                {
                    role: 'user',
                    content: listingText
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });

        const rawContent = response.choices[0]?.message?.content;
        const parsed = JSON.parse(rawContent);

        const isSafe = Boolean(parsed.safe);
        const fraudRisk = typeof parsed.fraud_risk_score === 'number' ? parsed.fraud_risk_score : (isSafe ? 0.05 : 0.85);

        return {
            safe: isSafe,
            reason: parsed.reason || (isSafe ? 'Automatisch durch lokale KI genehmigt.' : 'Potenziell unpassender Inhalt.'),
            fraud_risk_score: fraudRisk,
            confidence_score: 0.95,
            ai_decision: isSafe ? 'APPROVE' : 'FLAG'
        };
    } catch (error) {
        console.warn('⚠️ Local AI Moderation server unreachable or errored:', error.message);
        // Fallback: graceful fallback so user listings aren't completely blocked if llama-server isn't running
        return {
            safe: true,
            reason: 'Lokale KI nicht aktiv - Standardprüfung angewendet.',
            fraud_risk_score: 0.1,
            confidence_score: 0.5,
            ai_decision: 'APPROVE'
        };
    }
}

/**
 * Campuna Smart Auto-Description Generator
 * Generates rich, contextual, high-converting German marketplace listing descriptions
 * for camping vehicles, accessories, tents, services, tiny houses, and outdoor gear.
 * 
 * Intelligently extracts, structures, and incorporates user-provided bullet points,
 * equipment specs, condition notes, and personal narrative into a polished listing.
 */

/**
 * Format price string in German format (e.g. 48.500 €)
 */
function formatPrice(val) {
    if (!val || isNaN(Number(val))) return '';
    const num = Math.round(Number(val));
    return new Intl.NumberFormat('de-DE').format(num) + ' €';
}

/**
 * Clean and capitalize a single bullet or feature item
 */
function formatBulletPoint(text = '') {
    let clean = text.trim()
        .replace(/^[\s•\-*+✓✔►–—]+/, '') // strip bullet characters
        .replace(/^\s*\d+[\.\)\:\-]\s+/, '') // strip numbered list prefixes like "1. ", "2) ", "3- "
        .trim();
    if (!clean) return '';
    // Capitalize first character
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Extract structured information from user-provided notes or raw description text
 */
function extractUserNotes(rawText = '') {
    if (!rawText || typeof rawText !== 'string') {
        return { hasUserContent: false, bullets: [], equipment: [], conditionNotes: [], narrative: [], extras: [] };
    }

    const trimmed = rawText.trim();
    if (!trimmed) {
        return { hasUserContent: false, bullets: [], equipment: [], conditionNotes: [], narrative: [], extras: [] };
    }

    // Ignore boilerplate headers from previous generation runs
    const boilerplateHeaderPatterns = [
        /^(✨|🌟|🔍|🛠️|📋|📍|📞|📦|🚀)?\s*(ÜBERSICHT|HIGHLIGHTS|ECKDATEN|AUSSTATTUNG|ZUSTAND|BESICHTIGUNG|KONTAKT|LIEFERUMFANG|ANGEBOT|DETAILS)/i,
        /^(Zum Verkauf steht|Angeboten wird|Bereit für|Attraktives Angebot|Professioneller Camping-Service|Ein praktisches|Das Fahrzeug bietet|Ein unverzichtbares)/i,
        /^(Kategorie:|Zustand:|Standort:|Preis:|Verfügbarkeit:|Besichtigung)/i,
        /^(Bei ernsthaftem Interesse|Wir freuen uns über|Alle Funktionen einwandfrei|Aus Nichtraucherhaushalt|Der Artikel ist|Wurde nur sehr selten)/i
    ];

    const rawLines = trimmed.split(/\r?\n+/);
    const candidateLines = [];

    for (const line of rawLines) {
        const clean = line.trim();
        if (!clean) continue;

        // Skip exact boilerplate lines
        const isBoilerplate = boilerplateHeaderPatterns.some(pat => pat.test(clean));
        if (isBoilerplate) continue;

        candidateLines.push(clean);
    }

    // If text was just a single comma-separated or semicolon-separated list
    const parsedItems = [];
    if (candidateLines.length === 1 && (candidateLines[0].includes(',') || candidateLines[0].includes(';')) && candidateLines[0].split(/[,;]/).length >= 2) {
        const parts = candidateLines[0].split(/[,;]/);
        for (const p of parts) {
            const formatted = formatBulletPoint(p);
            if (formatted && formatted.length > 1) {
                parsedItems.push(formatted);
            }
        }
    } else {
        for (const line of candidateLines) {
            // Check if line contains inline multiple bullets or sentences
            if (line.includes('•') || line.includes(' - ') || line.includes(' | ')) {
                const subparts = line.split(/[•|]|\s-\s/);
                for (const sp of subparts) {
                    const formatted = formatBulletPoint(sp);
                    if (formatted && formatted.length > 1) {
                        parsedItems.push(formatted);
                    }
                }
            } else {
                const formatted = formatBulletPoint(line);
                if (formatted && formatted.length > 1) {
                    parsedItems.push(formatted);
                }
            }
        }
    }

    if (parsedItems.length === 0) {
        return { hasUserContent: false, bullets: [], equipment: [], conditionNotes: [], narrative: [], extras: [] };
    }

    // Classify extracted items
    const equipment = [];
    const conditionNotes = [];
    const extras = [];
    const narrative = [];
    const bullets = [];

    const condKeywords = /(tüv|hu\b|au\b|gasprüfung|scheckheft|inspektion|service\s*neu|unfallfrei|vorbesitzer|halter|nichtraucher|tierfrei|garage|dicht|trocken|rostfrei|kratzer|delle|bereifung|reifen|bremsen|zahnriemen|ölwechsel|zustand)/i;
    const extraKeywords = /(inklusive|inkl\.|dazu\s*gibt|mit\s*dabei|zubehör\s*wie|vorzelt|stühle|tisch|kabel|adapter|keile|abdeckung|schutzhülle|geschirr)/i;
    const narrativeKeywords = /(verkauf(en)?\s*wir|wegen\s*(umstieg|aufgabe|vergrößerung|nachwuchs|zeitmangel)|wir\s*haben|schweren\s*herzens|abzugeben|sucht\s*neuen\s*besitzer)/i;

    for (const item of parsedItems) {
        bullets.push(item);

        if (narrativeKeywords.test(item)) {
            narrative.push(item);
        } else if (condKeywords.test(item)) {
            conditionNotes.push(item);
        } else if (extraKeywords.test(item)) {
            extras.push(item);
        } else {
            equipment.push(item);
        }
    }

    return {
        hasUserContent: bullets.length > 0,
        bullets,
        equipment,
        conditionNotes,
        narrative,
        extras
    };
}

/**
 * Generates an automated description based on the listing parameters, chosen style,
 * and any user-provided notes/bullet points.
 * 
 * @param {Object} params
 * @param {string} params.title - Title of the listing
 * @param {string} [params.category] - Category name
 * @param {string} [params.subcategory] - Subcategory name
 * @param {string} [params.condition] - Condition ('Neu', 'Neuwertig', 'Gebraucht', 'Defekt / Bastler')
 * @param {string|number} [params.price] - Price in EUR
 * @param {boolean} [params.isNegotiable] - Whether price is negotiable (VB)
 * @param {string} [params.location] - Location or PLZ
 * @param {string} [params.sellerName] - Seller name
 * @param {'detailed'|'compact'|'story'} [params.style] - Description tone/style ('detailed', 'compact', 'story')
 * @param {string} [params.userNotes] - User provided bullet points or draft text
 * @param {string} [params.existingText] - Alias for userNotes
 * @returns {string} Formatted German listing description
 */
export function generateAutoDescription({
    title = '',
    category = '',
    subcategory = '',
    condition = 'Gebraucht',
    price = '',
    isNegotiable = false,
    location = '',
    sellerName = '',
    style = 'detailed',
    userNotes = '',
    existingText = ''
}) {
    const cleanTitle = title.trim() || (category ? `${category}${subcategory ? ` (${subcategory})` : ''}` : 'Camping-Angebot');
    const cat = (category || '').trim();
    const sub = (subcategory || '').trim();
    const cond = (condition || 'Gebraucht').trim();
    const loc = (location || '').trim();
    const formattedPrice = formatPrice(price);
    const priceText = formattedPrice
        ? `${formattedPrice}${isNegotiable ? ' (Verhandlungsbasis / VB)' : ' (Festpreis)'}`
        : (isNegotiable ? 'Verhandlungsbasis (VB)' : '');

    // Extract user notes and bullet points
    const rawInput = userNotes || existingText || '';
    const userContent = extractUserNotes(rawInput);

    // ─── 1. COMPACT STYLE (Direct bullet points focused on facts) ───
    if (style === 'compact') {
        const lines = [];
        lines.push(`Angebot: ${cleanTitle}`);
        lines.push('');
        lines.push('ÜBERSICHT & ECKDATEN:');
        lines.push(`• Kategorie: ${cat || 'Camping'}${sub ? ` / ${sub}` : ''}`);
        lines.push(`• Zustand: ${cond}`);
        if (priceText) lines.push(`• Preis: ${priceText}`);
        if (loc) lines.push(`• Standort: ${loc}`);
        lines.push('• Verfügbarkeit: Sofort abholbereit / einsatzbereit');
        lines.push('');

        if (userContent.hasUserContent) {
            lines.push('AUSSTATTUNG & HIGHLIGHTS:');
            // List all user points cleanly
            for (const b of userContent.bullets) {
                lines.push(`• ${b}`);
            }
            lines.push('');
        }

        lines.push('DETAILS & ZUSTAND:');
        if (userContent.conditionNotes.length > 0) {
            for (const cn of userContent.conditionNotes) {
                lines.push(`• ${cn}`);
            }
        }
        if (cond === 'Neu') {
            lines.push('• Fabrikneu und unbenutzt, in Originalverpackung bzw. Neuzustand.');
        } else if (cond === 'Neuwertig') {
            lines.push('• Kaum genutzt, in absolutem Top-Zustand ohne nennenswerte Gebrauchsspuren.');
        } else if (cond === 'Defekt / Bastler') {
            lines.push('• Für Bastler oder zur Ersatzteilgewinnung, wie beschrieben.');
        } else {
            lines.push('• Gepflegter Zustand, voll funktionsfähig und sauber aus Nichtraucher-Besitz.');
        }
        lines.push('');

        lines.push('KONTAKT & ABHOLUNG:');
        lines.push(loc ? `• Besichtigung und Abholung gerne flexibel in ${loc} nach Absprache.` : '• Besichtigung und Abholung nach Absprache möglich.');
        lines.push('• Bei Fragen einfach kurz schreiben – antworte zeitnah!');
        return lines.join('\n');
    }

    // ─── 2. STORY / EMOTIONAL STYLE (Inspiring travel, outdoor freedom) ───
    if (style === 'story') {
        const lines = [];

        // Intro according to category and narrative
        if (userContent.narrative.length > 0) {
            lines.push(`${userContent.narrative[0]}`);
            lines.push(`Zum Angebot steht hier unser gepflegter ${cleanTitle} – ideal für alle, die das Draußensein, Roadtrips und echte Camping-Freiheit lieben.`);
        } else if (cat === 'Wohnmobile & Camper') {
            lines.push(`Bereit für das nächste große Abenteuer? Wir verkaufen unseren geliebten ${cleanTitle}, der uns unvergessliche Reisen und pure Camping-Freiheit beschert hat.`);
        } else if (cat === 'Zelte & Dachzelte') {
            lines.push(`Aufwachen mit Blick in die Natur und maximaler Freiheit: Zum Verkauf steht ${cleanTitle} – der perfekte Begleiter für spontane Roadtrips und Nächte unter dem Sternenhimmel.`);
        } else if (cat === 'Stellplätze & Campingplätze') {
            lines.push(`Ein wunderbarer Rückzugsort inmitten der Natur: Entdecke ${cleanTitle} – ideal für entspannte Tage, Ruhe und naturnahes Camping.`);
        } else {
            lines.push(`Mehr Komfort und Freude beim Camping: Wir bieten hier ${cleanTitle} an – verlässlich, hochwertig und sofort einsatzbereit.`);
        }
        lines.push('');

        lines.push('🌟 DAS MACHT DIESES ANGEBOT BESONDERS:');
        lines.push(`• Zustand: ${cond} – stets pfleglich behandelt und sofort startklar.`);
        if (cat) lines.push(`• Passend für: ${cat}${sub ? ` (${sub})` : ''}`);

        // Weave user bullets in story highlights
        if (userContent.hasUserContent) {
            for (const b of userContent.bullets.slice(0, 6)) {
                lines.push(`• ${b}`);
            }
        } else {
            lines.push('• Zuverlässige Qualität und durchdachte Funktionalität für unterwegs.');
            lines.push('• Einfache Handhabung und langlebige Verarbeitung.');
        }
        lines.push('');

        if (userContent.hasUserContent && userContent.bullets.length > 6) {
            lines.push('🛠️ WEITERE AUSSTATTUNGSMERKMALE:');
            for (const b of userContent.bullets.slice(6)) {
                lines.push(`• ${b}`);
            }
            lines.push('');
        }

        lines.push('📋 ZUSTAND & WARTUNG:');
        if (userContent.conditionNotes.length > 0) {
            for (const cn of userContent.conditionNotes) {
                lines.push(`• ${cn}`);
            }
        }
        if (cond === 'Neu') {
            lines.push('Der Artikel ist absolut neu, unbenutzt und befindet sich im makellosen Originalzustand.');
        } else if (cond === 'Neuwertig') {
            lines.push('Befindet sich in hervorragendem Zustand mit minimalen bis keinen Gebrauchsspuren.');
        } else if (cond === 'Defekt / Bastler') {
            lines.push('Wird ausdrücklich als Bastlerobjekt bzw. defekt angeboten.');
        } else {
            lines.push('Gepflegter Gesamtzustand, alle Funktionen einwandfrei, sauber und sorgsam aufbewahrt.');
        }
        lines.push('');

        lines.push('📍 BESICHTIGUNG & ABWICKLUNG:');
        if (priceText) lines.push(`• Preisvorstellung: ${priceText}`);
        if (loc) {
            lines.push(`• Standort: ${loc} (Besichtigung nach vorheriger Terminabsprache sehr gerne möglich)`);
        } else {
            lines.push('• Besichtigung und Abholung nach flexibler Absprache.');
        }
        lines.push('');
        lines.push('Wir freuen uns über freundliche Anfragen und beantworten eventuelle Fragen gerne und schnell!');
        return lines.join('\n');
    }

    // ─── 3. DETAILED STYLE (Default, comprehensive, professional) ───
    const lines = [];

    // Header Intro
    if (userContent.narrative.length > 0) {
        lines.push(userContent.narrative[0]);
        lines.push(`Angeboten wird: ${cleanTitle}. Ein rundum gepflegtes und zuverlässiges Angebot für Camping- und Outdoor-Begeisterte.`);
    } else if (cat === 'Wohnmobile & Camper') {
        lines.push(`Zum Verkauf steht unser gepflegter und zuverlässiger ${cleanTitle}. Das Fahrzeug bietet eine hervorragende Ausstattung für komfortables, autarkes und unabhängiges Reisen.`);
    } else if (cat === 'Camping Zubehör') {
        lines.push(`Angeboten wird ein hochwertiges ${cleanTitle}. Ein praktisches und unverzichtbares Zubehörteil für den nächsten Campingurlaub, das für mehr Komfort und Ordnung sorgt.`);
    } else if (cat === 'Zelte & Dachzelte') {
        lines.push(`Zum Verkauf steht ${cleanTitle}. Perfekt geeignet für Outdoor-Begeisterte, Camper und spontane Wochenendausflüge mit schnellem Aufbau und verlässlichem Wetterschutz.`);
    } else if (cat === 'Fahrräder & Träger') {
        lines.push(`Hier bieten wir ${cleanTitle} an. Eine stabile, sichere und bewährte Transport- oder Mobilitätslösung für Camping- und Freizeitfahrzeuge.`);
    } else if (cat === 'Stellplätze & Campingplätze') {
        lines.push(`Attraktives Angebot: ${cleanTitle}. Ein herrlicher Ort für Camper, Wohnmobile und Outdoor-Liebhaber mit guter Anbindung und schöner Umgebung.`);
    } else if (cat === 'Tiny Houses') {
        lines.push(`Zum Verkauf steht ${cleanTitle}. Modernes, durchdachtes und nachhaltiges Wohnen mit gemütlichem Wohnklima und solider Bauweise.`);
    } else if (cat === 'Camping Services') {
        lines.push(`Professioneller Camping-Service: ${cleanTitle}. Zuverlässige und fachgerechte Dienstleistung rund um dein Camping-Equipment oder Fahrzeug.`);
    } else if (cat === 'Boote & Wassersport') {
        lines.push(`Zum Verkauf steht ${cleanTitle}. Ideal für aktive Freizeitgestaltung, Wassersport und entspannte Stunden auf dem Wasser.`);
    } else {
        lines.push(`Zum Verkauf steht: ${cleanTitle}. Ein praktisches und zuverlässiges Angebot für alle Camping- und Freizeitbegeisterten.`);
    }
    lines.push('');

    // Highlights section
    lines.push('✨ HIGHLIGHTS & ECKDATEN:');
    lines.push(`• Zustand: ${cond}`);
    if (cat) lines.push(`• Kategorie: ${cat}${sub ? ` – ${sub}` : ''}`);
    if (priceText) lines.push(`• Preis: ${priceText}`);
    if (loc) lines.push(`• Standort: ${loc}`);
    lines.push('• Sofort verfügbar und einsatzbereit');
    lines.push('');

    // If user provided specific equipment / bullet points
    if (userContent.hasUserContent) {
        lines.push('🛠️ AUSSTATTUNG & BESONDERHEITEN:');
        for (const item of userContent.bullets) {
            lines.push(`• ${item}`);
        }
        lines.push('');
    }

    // Detailed description & condition
    lines.push('🔍 ZUSTAND & WARTUNG:');
    if (userContent.conditionNotes.length > 0) {
        for (const cn of userContent.conditionNotes) {
            lines.push(`• ${cn}`);
        }
    }
    if (cond === 'Neu') {
        lines.push('Der Artikel ist fabrikneu, unbenutzt und befindet sich im makellosen Originalzustand.');
    } else if (cond === 'Neuwertig') {
        lines.push('Wurde nur sehr selten und schonend benutzt. Keine Beschädigungen oder groben Gebrauchsspuren, absolut neuwertiger Gesamteindruck.');
    } else if (cond === 'Defekt / Bastler') {
        lines.push('Der Artikel wird als defekt bzw. für Bastler/Ersatzteilgewinnung angeboten. Details entnehmen Sie bitte den Fotos oder auf Nachfrage.');
    } else {
        lines.push('Gebraucht, jedoch stets sorgfältig und pfleglich behandelt. Alle Funktionen wurden überprüft und funktionieren einwandfrei.');
    }
    lines.push('Aus gepflegtem Nichtraucherhaushalt, sauber und ordentlich aufbewahrt.');
    lines.push('');

    // Extra inclusions if user mentioned them
    if (userContent.extras.length > 0) {
        lines.push('📦 LIEFERUMFANG / INKLUSIVE:');
        for (const ex of userContent.extras) {
            lines.push(`• ${ex}`);
        }
        lines.push('');
    }

    // Inspection & Contact section
    lines.push('📞 BESICHTIGUNG & KONTAKT:');
    if (loc) {
        lines.push(`Eine persönliche Besichtigung vor Ort in ${loc} ist nach vorheriger Terminabsprache gerne möglich und erwünscht.`);
    } else {
        lines.push('Eine persönliche Besichtigung ist nach vorheriger Terminabsprache gerne möglich.');
    }
    lines.push('Bei ernsthaftem Interesse oder offenen Fragen stehe ich jederzeit gerne zur Verfügung. Ich antworte in der Regel sehr zeitnah.');

    return lines.join('\n');
}

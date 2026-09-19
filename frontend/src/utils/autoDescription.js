/**
 * Campuna Smart Auto-Description Generator
 * Generates rich, contextual, high-converting German marketplace listing descriptions
 * for camping vehicles, accessories, tents, services, tiny houses, and outdoor gear.
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
 * Generates an automated description based on the listing parameters and chosen style.
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
    style = 'detailed'
}) {
    const cleanTitle = title.trim() || (category ? `${category}${subcategory ? ` (${subcategory})` : ''}` : 'Camping-Artikel');
    const cat = (category || '').trim();
    const sub = (subcategory || '').trim();
    const cond = (condition || 'Gebraucht').trim();
    const loc = (location || '').trim();
    const formattedPrice = formatPrice(price);
    const priceText = formattedPrice
        ? `${formattedPrice}${isNegotiable ? ' (Verhandlungsbasis / VB)' : ' (Festpreis)'}`
        : (isNegotiable ? 'Verhandlungsbasis (VB)' : '');

    // ─── 1. COMPACT STYLE (Quick & direct bullet points) ───
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
        lines.push('DETAILS & ZUSTAND:');
        if (cond === 'Neu') {
            lines.push('• Fabrikneu und unbenutzt, in Originalverpackung bzw. Neuzustand.');
        } else if (cond === 'Neuwertig') {
            lines.push('• Kaum genutzt, in absolutem Top-Zustand ohne nennenswerte Gebrauchsspuren.');
        } else if (cond === 'Defekt / Bastler') {
            lines.push('• Für Bastler oder zur Ersatzteilgewinnung, wie beschrieben.');
        } else {
            lines.push('• Sehr gepflegter gebrauchter Zustand, voll funktionsfähig und sauber.');
        }
        lines.push('• Alle Funktionen einwandfrei, aus tierfreiem Nichtraucher-Haushalt.');
        lines.push('');
        lines.push('KONTAKT & ABHOLUNG:');
        lines.push(loc ? `• Besichtigung und Abholung gerne flexibel in ${loc} nach Absprache.` : '• Besichtigung und Abholung nach Absprache möglich.');
        lines.push('• Bei Fragen einfach kurz schreiben – antworte zeitnah!');
        return lines.join('\n');
    }

    // ─── 2. STORY / EMOTIONAL STYLE (Inspiring, outdoor & travel focus) ───
    if (style === 'story') {
        const lines = [];

        // Intro according to category
        if (cat === 'Wohnmobile & Camper') {
            lines.push(`Bereit für das nächste große Abenteuer? Wir verkaufen unseren geliebten ${cleanTitle}, der uns unvergessliche Reisen und pure Camping-Freiheit beschert hat.`);
        } else if (cat === 'Zelte & Dachzelte') {
            lines.push(`Aufwachen mit Blick in die Natur und maximaler Freiheit: Zum Verkauf steht ${cleanTitle} – der perfekte Begleiter für spontane Roadtrips und entspannte Nächte unter dem Sternenhimmel.`);
        } else if (cat === 'Stellplätze & Campingplätze') {
            lines.push(`Ein wunderbarer Rückzugsort inmitten der Natur: Entdecke ${cleanTitle} – ideal für entspannte Tage, Ruhe und naturnahes Camping.`);
        } else {
            lines.push(`Mehr Komfort und Freude beim Camping: Wir bieten hier ${cleanTitle} an – ideal für alle, die das Draußensein und Reisen lieben.`);
        }
        lines.push('');

        lines.push('🌟 DAS MACHT DIESES ANGEBOT BESONDERS:');
        lines.push(`• Erstklassiger Zustand: ${cond} – stets pfleglich behandelt und sofort reisefertig.`);
        if (cat) lines.push(`• Passend für: ${cat}${sub ? ` (${sub})` : ''}`);
        lines.push('• Zuverlässige Qualität und durchdachte Funktionalität für unterwegs.');
        lines.push('• Einfache Handhabung und langlebige Verarbeitung.');
        lines.push('');

        lines.push('📋 ZUSTAND & HIGHLIGHTS:');
        if (cond === 'Neu') {
            lines.push('Der Artikel ist absolut neu und unbenutzt.');
        } else if (cond === 'Neuwertig') {
            lines.push('Befindet sich in hervorragendem, neuwertigem Zustand mit minimalen bis keinen Gebrauchsspuren.');
        } else if (cond === 'Defekt / Bastler') {
            lines.push('Wird ausdrücklich als Bastlerobjekt bzw. defekt angeboten.');
        } else {
            lines.push('Gepflegter Zustand mit den üblichen, leichten Gebrauchsspuren, vollkommen einsatzbereit und funktionstüchtig.');
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
    if (cat === 'Wohnmobile & Camper') {
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

    // Detailed description & condition
    lines.push('🔍 AUSSTATTUNG & ZUSTANDSBESCHREIBUNG:');
    if (cond === 'Neu') {
        lines.push('Der Artikel ist fabrikneu, unbenutzt und befindet sich im makellosen Originalzustand.');
    } else if (cond === 'Neuwertig') {
        lines.push('Wurde nur sehr selten und schonend benutzt. Keine Beschädigungen oder groben Gebrauchsspuren, absolut neuwertiger Gesamteindruck.');
    } else if (cond === 'Defekt / Bastler') {
        lines.push('Der Artikel wird als defekt bzw. für Bastler/Ersatzteilgewinnung angeboten. Details entnehmen Sie bitte den Fotos oder auf Nachfrage.');
    } else {
        lines.push('Gebraucht, jedoch stets sorgfältig und pfleglich behandelt. Alle Funktionen wurden überprüft und funktionieren einwandfrei.');
    }
    lines.push('Aus Nichtraucherhaushalt, sauber und ordentlich aufbewahrt.');
    lines.push('');

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

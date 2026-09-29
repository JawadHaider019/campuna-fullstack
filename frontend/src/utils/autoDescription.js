import api from '@/api/client';

/**
 * Campuna Category-Aware, Fact-Preserving Marketplace Description Engine
 * 
 * CORE PRINCIPLES:
 * 1. "The description engine may improve wording and structure, but it may NEVER invent or extrapolate facts."
 * 2. Category-specific section architecture (Vehicle vs. Tent vs. Campsite vs. Gear).
 * 3. Never bundle everything into one giant section. Group intelligently into:
 *    - Fahrzeugdaten / Produktdaten
 *    - Ausstattung (ab Werk / Serie)
 *    - Autarkie & Elektrik
 *    - Zubehör / Weitere Ausstattung
 *    - Zustand & Wartung
 *    - Preis
 *    - Standort
 * 4. Technical attributes are formatted as clean structured bullets (•), never awkward sentences.
 * 5. No placeholder/marketing fluff or unprovoked "Besichtigung..." boilerplate unless supplied.
 */

/**
 * Format price string in German format (e.g. 39.800 €)
 */
export function formatPrice(val) {
    if (!val || isNaN(Number(val))) return '';
    const num = Math.round(Number(val));
    return new Intl.NumberFormat('de-DE').format(num) + ' €';
}

/**
 * Normalizes text for comparison
 */
function normalizeKey(str = '') {
    return str.toLowerCase().replace(/[^a-z0-9äöüß]/gi, '').trim();
}

/**
 * Strips leading bullet symbols, numbering, and whitespace
 */
function cleanBulletText(text = '') {
    return text
        .trim()
        .replace(/^[\s•\-*+✓✔►–—\d\.\)\:\-]+/, '')
        .replace(/^[:\-–—\s]+/, '')
        .trim();
}

/**
 * Standardize German capitalization & formatting for clean bullet items
 */
function formatBulletPoint(text = '') {
    const clean = cleanBulletText(text);
    if (!clean) return '';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Regex Dictionary for Intelligent Attribute & Equipment Categorization
 */
const PATTERNS = {
    // 1. Vehicle / Core Product Specs
    vehicleSpecs: /\b(modell|basisfahrzeug|chassis|ducato|crafter|sprinter|transit|boxer|jumper|t6|t6\.1|t5|leistung|ps\b|kw\b|multijet|tdi|diesel|benzin|schaltgetriebe|automatik|automatikgetriebe|gang|erstzulassung|ez\b|baujahr|kilometerstand|laufleistung|\bkm\b|gesamtgewicht|leergewicht|zuladung|zgg|3\.500\s*kg|3500\s*kg|farbe|lackierung|schadstoffklasse|euro\s*6|umweltplakette|länge|breite|höhe|schlafplätze|sitzplätze|gurtplätze|isofix)\b/i,

    // 2. Condition & History
    conditionNotes: /\b(tüv|hu\b|au\b|gasprüfung|scheckheft|scheckheftgepflegt|inspektion|service|unfallfrei|vorbesitzer|halter|halteranzahl|nichtraucher|nichtraucherfahrzeug|tierfrei|garage|garagenfahrzeug|dicht|trocken|dichtigkeitsprüfung|rostfrei|kratzer|delle|beschädigung|nachlackierungsfrei|abnutzung|neuwertig|gebrauchsspuren|mängel)\b/i,

    // 3. Autarky, Solar, Battery & Electronics
    autarkyElectronics: /\b(lifepo4|lithium|lithiumbatterie|batterie|akku|\bah\b|300\s*ah|200\s*ah|100\s*ah|ladebooster|booster|victron|smartshunt|shunt|wechselrichter|inverter|solaranlage|solarmodul|solarpanel|watt|solar|mppt|landstrom|laderegler|powerstation|ecoflow|jackery|bluetti)\b/i,

    // 4. Factory / Main Equipment & Packages
    factoryEquipment: /\b(paket|smart-paket|media-paket|styling-paket|fiat-paket|licht-paket|winter-paket|assistenzpaket|tempomat|abstandsregeltempomat|acc|klimaanlage|klimaautomatik|standheizung|truma|dieselheizung|alde|warmwasser|boiler|head-up|head-up-display|navigationssystem|navi|rückfahrkamera|dab\+|radio|bluetooth|apple\s*carplay|android\s*auto|lederlenkrad|multifunktionslenkrad|markise|anhängerkupplung|ahk|elektrische\s*trittstufe|fliegengitter|verdunkelung|plissee)\b/i,

    // 5. Add-on Accessories & Inclusions
    accessoriesExtras: /\b(bwt|wasserfilter|filter|abwassertank|frischwassertank|zusätzliches\s*fenster|fenster|heckgarage|fahrradträger|radträger|thule|fiamma|vorzelt|sonnensegel|teppich|campingstuhl|campingtisch|auffahrkeile|keile|stromkabel|cee|gasflasche|alugas|duocontrol|monocontrol|stufe|stufe|geschirr|besteck|abdeckung|schutzhülle|matratze|topper)\b/i,

    // 6. Location identifiers
    location: /\b(standort|abholung in|plz|ort|kreis|besichtigung in|abzuholen in)\b/i,

    // 7. Price identifiers
    price: /\b(preis|festpreis|verhandlungsbasis|\bvb\b|vhs|euro|€)\b/i
};

/**
 * Extracts, cleans, and categorizes facts from raw seller notes or draft text
 */
export function extractFactualData(rawText = '', category = '') {
    if (!rawText || typeof rawText !== 'string') {
        return {
            hasFacts: false,
            introNarrative: [],
            vehicleSpecs: [],
            factoryEquipment: [],
            autarkyElectronics: [],
            accessoriesExtras: [],
            conditionNotes: [],
            otherSpecs: [],
            locationMention: '',
            priceMention: ''
        };
    }

    // Ignore boilerplate headers from previous generation runs
    const boilerplateHeaderPatterns = [
        /^(ÜBERSICHT|HIGHLIGHTS|ECKDATEN|FAHRZEUGDATEN|PRODUKTDATEN|STELLPLATZINFORMATIONEN|AUSSTATTUNG|AUSSTATTUNG AB WERK|AUTARKIE & ELEKTRIK|ZUBEHÖR|ZUBEHÖR \/ WEITERE AUSSTATTUNG|ZUSTAND|ZUSTAND & WARTUNG|PREIS|STANDORT|BESICHTIGUNG|KONTAKT|LIEFERUMFANG|ANGEBOT|DETAILS)/i,
        /^(Angebot:|Zum Verkauf steht|Hier bieten wir|Verkauft wird|Im Angebot:)/i
    ];

    const lines = rawText.split(/\r?\n+/);
    const rawItems = [];
    const introNarrative = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (boilerplateHeaderPatterns.some(pat => pat.test(trimmed))) {
            continue;
        }

        // Detect full narrative intro lines (e.g. "Wir verkaufen unseren gepflegten und umfangreich ausgestatteten...")
        if (trimmed.length > 70 && !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.includes(':')) {
            introNarrative.push(trimmed);
            continue;
        }

        // Split multi-item bullet lines
        if ((trimmed.includes('•') || trimmed.includes('|') || trimmed.includes(';') || (trimmed.includes(',') && trimmed.split(',').length >= 3)) && !trimmed.startsWith('http')) {
            const parts = trimmed.split(/[•|;]|\s*,\s*(?=[A-Z0-9])/);
            for (const p of parts) {
                const item = formatBulletPoint(p);
                if (item && item.length > 1) {
                    rawItems.push(item);
                }
            }
        } else {
            const item = formatBulletPoint(trimmed);
            if (item && item.length > 1) {
                rawItems.push(item);
            }
        }
    }

    // Deduplicate
    const seen = new Set();
    const uniqueItems = [];
    for (const item of rawItems) {
        const norm = normalizeKey(item);
        if (norm.length > 0 && !seen.has(norm)) {
            seen.add(norm);
            uniqueItems.push(item);
        }
    }

    const vehicleSpecs = [];
    const factoryEquipment = [];
    const autarkyElectronics = [];
    const accessoriesExtras = [];
    const conditionNotes = [];
    const otherSpecs = [];
    let locationMention = '';
    let priceMention = '';

    for (const item of uniqueItems) {
        if (PATTERNS.location.test(item)) {
            locationMention = item;
        } else if (PATTERNS.price.test(item) && /\d+/.test(item)) {
            priceMention = item;
        } else if (PATTERNS.autarkyElectronics.test(item)) {
            autarkyElectronics.push(item);
        } else if (PATTERNS.conditionNotes.test(item)) {
            conditionNotes.push(item);
        } else if (PATTERNS.vehicleSpecs.test(item)) {
            vehicleSpecs.push(item);
        } else if (PATTERNS.factoryEquipment.test(item)) {
            factoryEquipment.push(item);
        } else if (PATTERNS.accessoriesExtras.test(item)) {
            accessoriesExtras.push(item);
        } else {
            otherSpecs.push(item);
        }
    }

    return {
        hasFacts: uniqueItems.length > 0 || introNarrative.length > 0,
        introNarrative,
        vehicleSpecs,
        factoryEquipment,
        autarkyElectronics,
        accessoriesExtras,
        conditionNotes,
        otherSpecs,
        locationMention,
        priceMention
    };
}

/**
 * Format key-value pairs cleanly with bullet points
 * e.g. "Modell: Weinsberg CaraBus 600 MQ" or "140 PS"
 */
function formatBullet(item = '') {
    const clean = item.trim();
    return `• ${clean}`;
}

/**
 * Generate category-aware, professional German marketplace description
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
    userNotes = '',
    existingText = ''
}) {
    const rawInput = userNotes || existingText || '';
    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanSub = subcategory.trim();
    const cleanCondition = condition.trim();
    const cleanLoc = location.trim();
    const formattedPrice = formatPrice(price);

    const facts = extractFactualData(rawInput, cleanCategory);
    const sections = [];

    const isVehicle = cleanCategory.toLowerCase().includes('wohnmobil') || 
                      cleanCategory.toLowerCase().includes('camper') || 
                      cleanCategory.toLowerCase().includes('wohnwagen');
    const isTent = cleanCategory.toLowerCase().includes('zelt');
    const isCampsite = cleanCategory.toLowerCase().includes('stellplatz') || cleanCategory.toLowerCase().includes('campingplatz');

    // ─── 1. OFFER TITLE & INTRO NARRATIVE ───
    if (cleanTitle) {
        sections.push(`Angebot: ${cleanTitle}`);
    }

    if (facts.introNarrative.length > 0) {
        sections.push(facts.introNarrative.join('\n\n'));
    }

    // ─── 2. CATEGORY-SPECIFIC PRIMARY DATA SECTION ───
    if (isVehicle) {
        // VEHICLE DATA (Fahrzeugdaten)
        const vData = [];

        // Subcategory / Chassis if supplied
        if (cleanSub) {
            vData.push(formatBullet(`Aufbau / Typ: ${cleanSub}`));
        }

        // Add extracted vehicle specs
        for (const spec of facts.vehicleSpecs) {
            vData.push(formatBullet(spec));
        }

        // Add condition indicators related to vehicle history if present
        for (const cond of facts.conditionNotes) {
            if (/nichtraucher|tierfrei|garage|garagenfahrzeug|scheckheft|unfallfrei/i.test(cond)) {
                vData.push(formatBullet(cond));
            }
        }

        if (vData.length > 0) {
            sections.push(`FAHRZEUGDATEN\n${vData.join('\n')}`);
        }

        // FACTORY EQUIPMENT (Ausstattung ab Werk / Serie)
        const fEquip = [];
        for (const item of facts.factoryEquipment) {
            fEquip.push(formatBullet(item));
        }
        if (fEquip.length > 0) {
            sections.push(`AUSSTATTUNG AB WERK\n${fEquip.join('\n')}`);
        }

        // AUTARKY & ELECTRONICS (Autarkie & Elektrik)
        if (facts.autarkyElectronics.length > 0) {
            sections.push(`AUTARKIE & ELEKTRIK\n${facts.autarkyElectronics.map(formatBullet).join('\n')}`);
        }

        // ACCESSORIES & FURTHER EQUIPMENT (Zubehör / Weitere Ausstattung)
        const extras = [];
        for (const item of facts.accessoriesExtras) {
            extras.push(formatBullet(item));
        }
        for (const item of facts.otherSpecs) {
            extras.push(formatBullet(item));
        }
        if (extras.length > 0) {
            sections.push(`ZUBEHÖR / WEITERE AUSSTATTUNG\n${extras.join('\n')}`);
        }

        // REMAINING CONDITION NOTES (Zustand & Wartung - TÜV, Gasprüfung etc.)
        const techCondition = facts.conditionNotes.filter(c => !/nichtraucher|tierfrei|garage|garagenfahrzeug|scheckheft|unfallfrei/i.test(c));
        if (techCondition.length > 0) {
            sections.push(`ZUSTAND & WARTUNG\n${techCondition.map(formatBullet).join('\n')}`);
        }

    } else if (isTent) {
        // TENT / OUTDOOR SPECIFIC
        const pData = [];
        if (cleanSub) pData.push(formatBullet(`Typ: ${cleanSub}`));
        if (cleanCondition) pData.push(formatBullet(`Zustand: ${cleanCondition}`));
        for (const spec of facts.vehicleSpecs.concat(facts.otherSpecs)) {
            pData.push(formatBullet(spec));
        }
        if (pData.length > 0) {
            sections.push(`PRODUKTDATEN\n${pData.join('\n')}`);
        }

        if (facts.factoryEquipment.length > 0) {
            sections.push(`AUSSTATTUNG\n${facts.factoryEquipment.map(formatBullet).join('\n')}`);
        }
        if (facts.conditionNotes.length > 0) {
            sections.push(`ZUSTAND\n${facts.conditionNotes.map(formatBullet).join('\n')}`);
        }
        if (facts.accessoriesExtras.length > 0) {
            sections.push(`LIEFERUMFANG / ZUBEHÖR\n${facts.accessoriesExtras.map(formatBullet).join('\n')}`);
        }

    } else if (isCampsite) {
        // CAMPSITE SPECIFIC
        if (cleanLoc) {
            sections.push(`STANDORT\n${cleanLoc}`);
        }
        const siteData = [];
        if (cleanSub) siteData.push(formatBullet(`Art des Platzes: ${cleanSub}`));
        for (const spec of facts.vehicleSpecs.concat(facts.otherSpecs)) {
            siteData.push(formatBullet(spec));
        }
        if (siteData.length > 0) {
            sections.push(`STELLPLATZINFORMATIONEN\n${siteData.join('\n')}`);
        }
        if (facts.factoryEquipment.length > 0 || facts.accessoriesExtras.length > 0) {
            const equip = facts.factoryEquipment.concat(facts.accessoriesExtras);
            sections.push(`AUSSTATTUNG & SERVICES\n${equip.map(formatBullet).join('\n')}`);
        }

    } else {
        // GENERAL CAMPING EQUIPMENT / OTHER CATEGORIES
        const pData = [];
        if (cleanCategory) pData.push(formatBullet(`Kategorie: ${cleanCategory}${cleanSub ? ` (${cleanSub})` : ''}`));
        if (cleanCondition) pData.push(formatBullet(`Zustand: ${cleanCondition}`));
        for (const s of facts.vehicleSpecs.concat(facts.otherSpecs)) {
            pData.push(formatBullet(s));
        }
        if (pData.length > 0) {
            sections.push(`PRODUKTDATEN & SPEZIFIKATIONEN\n${pData.join('\n')}`);
        }

        if (facts.factoryEquipment.length > 0) {
            sections.push(`AUSSTATTUNGSMERKMALE\n${facts.factoryEquipment.map(formatBullet).join('\n')}`);
        }
        if (facts.autarkyElectronics.length > 0) {
            sections.push(`ELEKTRIK & TECHNIK\n${facts.autarkyElectronics.map(formatBullet).join('\n')}`);
        }
        if (facts.conditionNotes.length > 0) {
            sections.push(`ZUSTAND\n${facts.conditionNotes.map(formatBullet).join('\n')}`);
        }
        if (facts.accessoriesExtras.length > 0) {
            sections.push(`LIEFERUMFANG / ZUBEHÖR\n${facts.accessoriesExtras.map(formatBullet).join('\n')}`);
        }
    }

    // ─── 3. PREIS SECTION ───
    let priceOutput = '';
    if (formattedPrice) {
        priceOutput = `${formattedPrice} ${isNegotiable ? 'VB (Verhandlungsbasis)' : 'Festpreis'}`;
    } else if (isNegotiable) {
        priceOutput = 'Verhandlungsbasis (VB)';
    } else if (facts.priceMention) {
        priceOutput = facts.priceMention;
    }
    if (priceOutput) {
        sections.push(`PREIS\n${priceOutput}`);
    }

    // ─── 4. STANDORT SECTION (conflict-aware, structured field first) ───
    if (!isCampsite) {
        let finalLocation = cleanLoc;
        if (facts.locationMention && cleanLoc && !facts.locationMention.toLowerCase().includes(cleanLoc.toLowerCase()) && !cleanLoc.toLowerCase().includes(facts.locationMention.toLowerCase())) {
            finalLocation = `${cleanLoc} (Hinweis im Text: ${facts.locationMention.replace(/^Standort:?\s*/i, '')})`;
        } else if (!finalLocation && facts.locationMention) {
            finalLocation = facts.locationMention.replace(/^Standort:?\s*/i, '');
        }

        if (finalLocation) {
            sections.push(`STANDORT\n${finalLocation}`);
        }
    }

    return sections.join('\n\n');
}

/**
 * Smart Generator / Enhancer (Deterministic fact-preserving engine)
 */
export async function generateOrImproveDescription(params) {
    const rawExisting = (params.existingText || params.userNotes || params.existingDescription || params.description || '').trim();

    const factualText = generateAutoDescription({
        ...params,
        userNotes: rawExisting,
        existingText: rawExisting
    });

    return {
        text: factualText,
        mode: 'IMPROVED_FACTUAL',
        source: 'FACT_ENGINE',
        success: true
    };
}

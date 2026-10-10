/**
 * Campuna Utility Formatters
 * Consistent German formatting for conditions, prices, numbers, and dates.
 */

/**
 * Translates and normalizes listing condition into German.
 * E.g. "Like New" -> "Wie neu", "New" -> "Neu", "Good" -> "Sehr gut", "Used" -> "Gebraucht"
 */
export function formatCondition(cond) {
    if (!cond) return 'Gebraucht';
    const c = String(cond).toLowerCase().trim();

    if (c === 'like new' || c === 'like_new' || c.includes('wie neu') || c.includes('neuwertig') || c.includes('top zustand')) {
        return 'Wie neu';
    }
    if (c === 'new' || c === 'brand new' || c === 'brand_new' || c === 'neu' || c.includes('fabrikneu')) {
        return 'Neu';
    }
    if (c === 'good' || c.includes('sehr gut') || c.includes('sehr_gut')) {
        return 'Sehr gut';
    }
    if (c === 'gut') {
        return 'Gut';
    }
    if (c === 'used' || c.includes('gebraucht')) {
        return 'Gebraucht';
    }
    if (c.includes('fair') || c.includes('akzeptabel') || c.includes('zufriedenstellend')) {
        return 'Akzeptabel';
    }
    if (c.includes('defect') || c.includes('defekt') || c.includes('bastler') || c.includes('beschädigt')) {
        return 'Defekt / Bastler';
    }

    return cond;
}

/**
 * Formats price with 2 decimal places, comma, and NO thousand separator dot (e.g. 8000,00 € or 54950,00 €).
 * Returns 'Preis VB' if price is 0 or null/empty.
 */
export function formatPrice(price, includeCurrency = true) {
    if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
        return 'Preis VB';
    }
    const num = typeof price === 'number' ? price : parseFloat(price) || 0;
    if (num <= 0) return 'Preis VB';

    const formatted = num.toFixed(2).replace('.', ',');
    return includeCurrency ? `${formatted} €` : formatted;
}

/**
 * Cleans messy raw location strings by removing postal codes, street prefixes, coordinates, etc.
 * Always formats cleanly to 'City, Country' (e.g. 'Dorsten, Deutschland', 'Zürich, Schweiz').
 */
export function formatCleanLocation(location) {
    if (!location) return 'Deutschland';
    let loc = typeof location === 'string' ? location.trim() : (location.address || 'Deutschland');
    if (!loc || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(loc)) return 'Deutschland';

    const rawParts = loc.split(',').map(p => p.trim()).filter(Boolean);
    if (rawParts.length === 0) return 'Deutschland';

    const country = rawParts[rawParts.length - 1].replace(/^\d+[\s\-]*/, '').trim() || 'Deutschland';

    let cityPart = rawParts.length > 1 ? rawParts[rawParts.length - 2] : rawParts[0];

    // Strip postal codes (e.g. 5 digits, 4 digits, 2 digits like '02 Großschönau', '46286 Dorsten', '99 Erfurt')
    cityPart = cityPart.replace(/^[\d\s\-_]+/, '').trim();

    if (!cityPart) {
        for (let i = rawParts.length - 1; i >= 0; i--) {
            const candidate = rawParts[i].replace(/^[\d\s\-_]+/, '').trim();
            if (candidate && candidate.toLowerCase() !== country.toLowerCase()) {
                cityPart = candidate;
                break;
            }
        }
    }

    if (!cityPart) cityPart = country;

    if (country.toLowerCase() !== cityPart.toLowerCase() && !/^\d+$/.test(country)) {
        return `${cityPart}, ${country}`;
    }
    return cityPart;
}

/**
 * Formats views and follower counts with German locale.
 */
export function formatViews(views) {
    const count = parseInt(views || 0, 10);
    return count.toLocaleString('de-DE');
}

/**
 * Checks if a listing is marked as sold ('Verkauft' / 'SOLD').
 */
export function isListingSold(item) {
    if (!item) return false;
    const status = String(item.status || item.Status || '').trim().toUpperCase();
    const condition = String(item.condition || item['Condition item'] || '').trim().toUpperCase();
    const state = String(item.state || '').trim().toUpperCase();

    return Boolean(
        status === 'SOLD' ||
        status === 'VERKAUFT' ||
        item.is_sold === true ||
        item.sold === true ||
        item.isSold === true ||
        condition === 'VERKAUFT' ||
        condition === 'SOLD' ||
        state === 'SOLD' ||
        state === 'VERKAUFT'
    );
}

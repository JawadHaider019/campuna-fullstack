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
 * Formats price with 2 decimal places and comma WITHOUT thousand period '.' (e.g. 54950,00 € or 57900,00 €).
 */
export function formatPrice(price, includeCurrency = true) {
    const num = typeof price === 'number' ? price : parseFloat(price) || 0;
    const formatted = num.toFixed(2).replace('.', ',');
    return includeCurrency ? `${formatted} €` : formatted;
}

/**
 * Cleans messy raw location strings by removing duplicate postal codes, raw coordinates, and prefixes.
 * E.g. "46047, 46047 Oberhausen, Deutschland" -> "Oberhausen, Deutschland"
 *      "65232 Taunusstein, Deutschland" -> "Taunusstein, Deutschland"
 *      "04 Schkeuditz, Deutschland" -> "Schkeuditz, Deutschland"
 */
export function formatCleanLocation(location) {
    if (!location) return 'Deutschland';
    const loc = typeof location === 'string' ? location.trim() : (location.address || 'Deutschland');

    if (!loc || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(loc)) {
        return 'Deutschland';
    }

    const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return 'Deutschland';

    const country = parts.length > 1 ? parts[parts.length - 1] : '';
    let cityPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];

    // Strip leading postal codes / numbers
    cityPart = cityPart.replace(/^[\d\s]+/, '').trim();

    if (!cityPart || /^\d+$/.test(cityPart)) {
        for (let i = parts.length - 1; i >= 0; i--) {
            const candidate = parts[i].replace(/^[\d\s]+/, '').trim();
            if (candidate && candidate.toLowerCase() !== country.toLowerCase() && !/^\d+$/.test(candidate)) {
                cityPart = candidate;
                break;
            }
        }
    }

    if (!cityPart) cityPart = 'Deutschland';

    if (country && country.toLowerCase() !== cityPart.toLowerCase() && !/^\d+$/.test(country)) {
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

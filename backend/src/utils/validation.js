/**
 * Phone Number and Input Validation Utilities for Campuna Backend
 */

export const PHONE_VALIDATION_ERROR = 'Bitte gib eine gültige Telefonnummer ein (z. B. +49 89 1234567 oder 0170 12345678).';

/**
 * Validates German and international phone numbers according to German and E.164 standards.
 * - German national format (starts with 0): 7 to 13 digits (Festnetz min 7, Mobilfunk 10-12).
 * - German international (+49 / 0049): 8 to 15 digits total.
 * - General international (starts with +): 7 to 15 digits total.
 * - Rejects any alphabetical characters or fake repeating numbers.
 *
 * @param {string} phone
 * @param {boolean} required
 * @returns {boolean}
 */
export function isValidPhoneNumber(phone, required = false) {
    if (!phone || typeof phone !== 'string') {
        return !required;
    }
    const trimmed = phone.trim();
    if (!trimmed) {
        return !required;
    }

    // Reject any alphabets
    if (/[a-zA-Z]/.test(trimmed)) {
        return false;
    }

    // Reject disallowed characters
    const validCharPattern = /^[+]?[\d\s\-/(.)]+$/;
    if (!validCharPattern.test(trimmed)) {
        return false;
    }

    // Extract digits only
    const digitsOnly = trimmed.replace(/\D/g, '');

    // Overall sanity check on raw digits
    if (digitsOnly.length < 7 || digitsOnly.length > 17) {
        return false;
    }

    // Reject repeating identical digits (e.g. 000000000, 111111111)
    if (/^(\d)\1+$/.test(digitsOnly)) {
        return false;
    }

    // International format (+... or 00...)
    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
        const intlDigits = trimmed.startsWith('00')
            ? digitsOnly.replace(/^00/, '')
            : digitsOnly;

        // E.164 subscriber length without prefix: 7 to 15 digits
        if (intlDigits.length < 7 || intlDigits.length > 15) {
            return false;
        }

        // If German international (+49 or 0049)
        if (intlDigits.startsWith('49')) {
            const remainingDigits = intlDigits.slice(2);
            // 6 to 13 digits after 49 (e.g. Vorwahl + Rufnummer)
            if (remainingDigits.length < 6 || remainingDigits.length > 13) {
                return false;
            }
            if (/^0+$/.test(remainingDigits) || remainingDigits.startsWith('00')) {
                return false;
            }
            return true;
        }

        // North America (Country code 1 + 10-digit number = 11 digits)
        if (intlDigits.startsWith('1')) {
            return intlDigits.length === 11;
        }

        // Other international (country code 2-3 digits + local number: 8 to 15 digits total)
        return intlDigits.charAt(0) !== '0' && intlDigits.length >= 8 && intlDigits.length <= 15;
    }

    // German national format (starts with 0, not 00)
    if (trimmed.startsWith('0')) {
        // Second digit cannot be 0 for national numbers
        const secondChar = digitsOnly.charAt(1);
        if (!secondChar || secondChar === '0') {
            return false;
        }
        // German national: 7 to 13 digits
        return digitsOnly.length >= 7 && digitsOnly.length <= 13;
    }

    // Standard fallback (7 to 15 digits, cannot start with 00)
    if (digitsOnly.startsWith('00')) {
        return false;
    }
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Cleans phone number for standardized storage
 * @param {string} phone
 * @returns {string}
 */
export function cleanPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    return phone.trim();
}


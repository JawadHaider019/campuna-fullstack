/**
 * Phone Number and Input Validation Utilities for Campuna
 */

export const PHONE_VALIDATION_ERROR = 'Bitte gib eine gültige Telefonnummer ein (z. B. +49 89 1234567 oder 0170 12345678).';

/**
 * Validates German and international phone numbers.
 * Allows: +, digits, spaces, hyphens, slashes, and parentheses.
 * Requires 6 to 18 digits total.
 * Returns true if empty/undefined (optional field handling) or if valid format.
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

    // Pattern for international or national telephone format:
    // Optional leading +, allowed characters: digits, spaces, dashes, slashes, parentheses
    const phonePattern = /^(\+?\d{1,4}[\s\-/]?)?(\(?\d{1,5}\)?[\s\-/]?)?[\d\s\-/()]{4,20}$/;
    if (!phonePattern.test(trimmed)) {
        return false;
    }

    // Strip non-digits and check length
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.length >= 6 && digitsOnly.length <= 18;
}

/**
 * Cleans phone number for standardized storage or links.
 * @param {string} phone
 * @returns {string}
 */
export function cleanPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    return phone.trim();
}

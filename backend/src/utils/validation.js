/**
 * Phone Number and Input Validation Utilities for Campuna Backend
 */

export function isValidPhoneNumber(phone, required = false) {
    if (!phone || typeof phone !== 'string') {
        return !required;
    }
    const trimmed = phone.trim();
    if (!trimmed) {
        return !required;
    }

    const phonePattern = /^(\+?\d{1,4}[\s\-/]?)?(\(?\d{1,5}\)?[\s\-/]?)?[\d\s\-/()]{4,20}$/;
    if (!phonePattern.test(trimmed)) {
        return false;
    }

    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.length >= 6 && digitsOnly.length <= 18;
}

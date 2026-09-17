/**
 * Utility helper to resolve image URLs safely across the application.
 * Handles:
 * - Full remote URLs (https://...)
 * - Local backend uploads (/uploads/...) -> prepends backend host if needed
 * - Next.js public assets (/collection/..., /logo.webp)
 * - Base64 and Blob URLs
 */
export const getImageUrl = (url, fallback = '/collection/camping-zubehoer-hero.png') => {
    if (!url) return fallback;
    if (typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (!trimmed) return fallback;

    // Full URLs, data URLs, blob URLs, or local frontend public static assets
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }

    // Backend uploads path (/uploads/...)
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        const backendBase = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
            : 'http://localhost:5000';
        return `${backendBase}${cleanPath}`;
    }

    // Frontend public assets (e.g. /logo.webp, /collection/...)
    return trimmed;
};

export default getImageUrl;

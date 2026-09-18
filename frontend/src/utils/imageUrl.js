/**
 * Utility helper to resolve image URLs safely across all environments (dev & production).
 * Handles:
 * - Live client previews (blob:..., data:...)
 * - Backend uploaded files (/uploads/..., uploads/..., http://localhost:5000/uploads/..., etc.)
 * - Full remote URLs (https://images.unsplash.com/..., etc.)
 * - Protocol-relative URLs (//...)
 * - Next.js public assets (/logo.webp, /collection/..., etc.)
 * - Safe fallback placeholder
 */
export const getImageUrl = (url, fallback = '/collection/camping-zubehoer-hero.png') => {
    if (!url) return fallback;
    if (typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (!trimmed) return fallback;

    // 1. Live browser preview URLs (Blob & Data URIs)
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
        return trimmed;
    }

    // 2. Any backend uploads reference (including previously saved localhost:5000/uploads or IP/port URLs)
    const uploadsIndex = trimmed.indexOf('/uploads/');
    if (uploadsIndex !== -1 || trimmed.startsWith('uploads/')) {
        const relativeUploadPath = uploadsIndex !== -1 
            ? trimmed.substring(uploadsIndex) 
            : `/${trimmed}`;
        
        // Determine API base URL
        let apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        if (apiBase) {
            // Strip trailing /api or /
            apiBase = apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
        } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // In production browser, if NEXT_PUBLIC_API_URL is missing, use current origin
            apiBase = window.location.origin;
        } else {
            apiBase = 'http://localhost:5000';
        }

        return `${apiBase}${relativeUploadPath}`;
    }

    // 3. Protocol-relative URLs (//example.com/image.jpg)
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }

    // 4. Remote URLs (HTTPS / HTTP)
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        return trimmed;
    }

    // 5. Frontend public assets (e.g. /logo.webp, /collection/...)
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export default getImageUrl;

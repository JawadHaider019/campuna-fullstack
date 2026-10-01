/**
 * Utility helper to resolve image URLs safely across all environments (local development & live production).
 * Handles:
 * - Live client previews (blob:..., data:...)
 * - Backend uploaded files (/uploads/..., uploads/..., http://localhost:5000/uploads/..., etc.)
 * - Full remote URLs (https://images.unsplash.com/..., etc.)
 * - Protocol-relative URLs (//...)
 * - Next.js public assets (/logo.webp, /collection/..., etc.)
 * - Fallback placeholder
 */
export const getImageUrl = (url, fallback = null) => {
    if (!url) return fallback;

    // Handle object inputs (e.g., { url: '...' } or Next/Image objects)
    if (typeof url === 'object' && url !== null) {
        url = url.url || url.src || url.path || null;
        if (!url) return fallback;
    }

    if (typeof url !== 'string') return fallback;
    let trimmed = url.trim();
    if (!trimmed) return fallback;

    // Handle stringified JSON arrays (e.g. '["/uploads/123.jpg"]')
    if (trimmed.startsWith('["') || trimmed.startsWith("['")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return getImageUrl(parsed[0], fallback);
            }
        } catch {
            // Not valid JSON, continue with trimmed string
        }
    }

    // 1. Live browser preview URLs (Blob & Data URIs)
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
        return trimmed;
    }

    // Resolve API backend base URL
    let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    let apiBase = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    const isBrowser = typeof window !== 'undefined';
    const isLive = isBrowser
        ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
        : (process.env.NODE_ENV === 'production');

    // If local and no apiBase set, default to localhost:5000
    if (!apiBase && !isLive) {
        apiBase = 'http://localhost:5000';
    }

    // 2. Check for backend uploads (/uploads/...) or paths containing /uploads/
    const uploadsIndex = trimmed.indexOf('/uploads/');
    const isUploadsPath = uploadsIndex !== -1 || trimmed.startsWith('uploads/');

    if (isUploadsPath) {
        const relativeUploadPath = uploadsIndex !== -1
            ? trimmed.substring(uploadsIndex)
            : `/${trimmed}`;

        if (apiBase) {
            return `${apiBase}${relativeUploadPath}`;
        }
        return relativeUploadPath;
    }

    // 3. Protocol-relative URLs (//example.com/image.jpg)
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }

    // 4. Remote URLs (HTTPS / HTTP)
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        // If image was saved in database with localhost:5000 during dev, point to live backend
        if (trimmed.includes('localhost:5000') || trimmed.includes('127.0.0.1:5000')) {
            const subPath = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, '');
            const cleanSub = subPath.startsWith('/') ? subPath : `/${subPath}`;
            if (apiBase) {
                return `${apiBase}${cleanSub}`;
            }
            return cleanSub;
        }
        return trimmed;
    }

    // 5. Frontend public assets (e.g. /logo.webp, /collection/...)
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export default getImageUrl;

import useAuthStore from '@/store/useAuthStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    // Attach Bearer token if available
    const { accessToken } = useAuthStore.getState();
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
        body: options.body && typeof options.body === 'object'
            ? JSON.stringify(options.body)
            : options.body,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                success: false,
                error: data.error || data.message || `Fehler ${response.status}`,
                status: response.status,
            };
        }

        return { success: true, data, status: response.status };
    } catch {
        return { success: false, error: 'Netzwerkfehler. Bitte überprüfe deine Verbindung.' };
    }
}

export const api = {
    get:    (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post:   (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
    put:    (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

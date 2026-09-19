import useAuthStore from '@/store/useAuthStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Singleton promise to prevent concurrent duplicate refresh token requests
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (newToken) => {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
};

async function handleRefreshToken(refreshToken, user, login, logout) {
    if (!isRefreshing) {
        isRefreshing = true;
        try {
            const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            const refreshData = await refreshResponse.json().catch(() => ({}));

            if (refreshResponse.ok && refreshData.access_token) {
                login(user, refreshData.access_token, refreshData.refresh_token || refreshToken);
                onRefreshed(refreshData.access_token);
                return refreshData.access_token;
            } else {
                logout();
                onRefreshed(null);
                return null;
            }
        } catch (err) {
            console.warn('Token refresh failed:', err);
            logout();
            onRefreshed(null);
            return null;
        } finally {
            isRefreshing = false;
        }
    }

    return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
            resolve(newToken);
        });
    });
}

async function request(endpoint, options = {}) {
    let url = `${BASE_URL}${endpoint}`;

    // Serialize query params if provided
    if (options.params && typeof options.params === 'object') {
        const queryParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });
        const queryString = queryParams.toString();
        if (queryString) {
            url += `${url.includes('?') ? '&' : '?'}${queryString}`;
        }
    }

    // Attach Bearer token if available
    const { accessToken, refreshToken, login, logout, user } = useAuthStore.getState();
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
    };

    // Add 12s timeout controller to prevent hanging requests
    const timeout = options.timeout || 12000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
        ...options,
        signal: options.signal || controller.signal,
        headers,
        body: options.body && typeof options.body === 'object' && !isFormData
            ? JSON.stringify(options.body)
            : options.body,
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Handle automatic token refresh on 401 Unauthorized
            if (response.status === 401 && refreshToken && !options._retry) {
                options._retry = true;
                const newToken = await handleRefreshToken(refreshToken, user, login, logout);
                if (newToken) {
                    const retryHeaders = {
                        ...headers,
                        Authorization: `Bearer ${newToken}`,
                    };
                    return request(endpoint, { ...options, headers: retryHeaders, _retry: true });
                }
            }

            return {
                success: false,
                error: data.error || data.message || `Fehler ${response.status}`,
                status: response.status,
            };
        }

        return { success: true, data, status: response.status };
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { success: false, error: 'Die Server-Anfrage hat zu lange gedauert (Timeout).' };
        }
        return { success: false, error: 'Netzwerkfehler. Bitte überprüfe deine Verbindung.' };
    }
}

export const api = {
    get:    (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post:   (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
    put:    (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
    patch:  (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

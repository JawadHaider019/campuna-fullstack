import useAuthStore from '@/store/useAuthStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

    const config = {
        ...options,
        headers,
        body: options.body && typeof options.body === 'object' && !isFormData
            ? JSON.stringify(options.body)
            : options.body,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Handle automatic token refresh on 401 Unauthorized
            if (response.status === 401 && refreshToken && !options._retry) {
                options._retry = true;
                try {
                    const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    const refreshData = await refreshResponse.json().catch(() => ({}));

                    if (refreshResponse.ok && refreshData.access_token) {
                        // Save the new tokens (keep current user)
                        login(user, refreshData.access_token, refreshData.refresh_token);

                        // Retry the request with the new access token
                        const retryHeaders = {
                            ...headers,
                            Authorization: `Bearer ${refreshData.access_token}`,
                        };
                        return request(endpoint, { ...options, headers: retryHeaders });
                    } else {
                        // Refresh token is invalid/expired -> log out
                        logout();
                    }
                } catch (refreshErr) {
                    console.error("Token refresh failed:", refreshErr);
                    logout();
                }
            }

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
    patch:  (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

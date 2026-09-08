import api from './client.js';

/**
 * GET /api/favorites
 * Fetches all saved favorites for the authenticated user.
 */
export const getFavorites = async () => {
    return api.get('/favorites');
};

/**
 * POST /api/favorites/:listingId
 * Adds a listing to user's favorites.
 */
export const addFavorite = async (listingId) => {
    return api.post(`/favorites/${listingId}`);
};

/**
 * DELETE /api/favorites/:listingId
 * Removes a listing from user's favorites.
 */
export const removeFavorite = async (listingId) => {
    return api.delete(`/favorites/${listingId}`);
};

/**
 * POST /api/favorites/sync
 * Syncs an array of guest listing IDs with the server upon login.
 */
export const syncFavorites = async (listingIds) => {
    return api.post('/favorites/sync', { listingIds });
};

import api from './client.js';

/**
 * GET /api/profile/me
 * Returns the authenticated user's own profile.
 * Requires a valid access token in the store.
 */
export const getMyProfile = () => api.get('/profile/me');

/**
 * PUT /api/profile/me
 * Updates the authenticated user's profile.
 * @param {Object} updates - Fields to update (unknown fields are ignored by the server)
 */
export const updateMyProfile = (updates) => api.put('/profile/me', updates);

/**
 * GET /api/profile/:userId
 * Fetches the public profile of any user.
 * @param {string} userId
 */
export const getPublicProfile = (userId) => api.get(`/profile/${userId}`);

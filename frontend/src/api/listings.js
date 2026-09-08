import api from './client.js';

/**
 * Sends multipart form-data to create a listing.
 * @param {FormData} formData - The form data containing images and listing info.
 */
export const createListing = async (formData) => {
    return api.post('/listings', formData);
};

export const getMyListings = async () => {
    return api.get('/listings/my');
};

export const getAllListings = async () => {
    return api.get('/listings');
};

export const getListingDetail = async (id) => {
    return api.get(`/listings/${id}`);
};

/**
 * GET /api/listings/user/:userId
 * Fetches all approved listings for a given provider user.
 * @param {string} userId
 */
export const getListingsByUser = async (userId) => {
    return api.get(`/listings/user/${userId}`);
};

/**
 * POST /api/listings/:id/boost
 * Boosts a listing using Campuna Credits.
 * @param {string} id - Listing ID
 * @param {number} durationDays - 7, 14, or 30 days
 */
export const boostListing = async (id, durationDays = 7) => {
    return api.post(`/listings/${id}/boost`, { durationDays });
};


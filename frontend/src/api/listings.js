import api from './client.js';

/**
 * Sends multipart form-data to create a listing.
 * @param {FormData} formData - The form data containing images and listing info.
 */
export const createListing = async (formData) => {
    return api.post('/listings', formData);
};

/**
 * Sends multipart form-data to update an existing listing.
 * @param {string} id - Listing ID
 * @param {FormData} formData - The form data containing images and listing info.
 */
export const updateListing = async (id, formData) => {
    return api.put(`/listings/${id}`, formData);
};

/**
 * DELETE /api/listings/:id
 * Deletes a listing owned by the user.
 * @param {string} id - Listing ID
 */
export const deleteListing = async (id) => {
    return api.delete(`/listings/${id}`);
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
 * Boosts/highlights a listing using Campuna Credits or direct payment (Card, SEPA, PayPal).
 * @param {string} id - Listing ID
 * @param {number} durationDays - 7, 14, or 30 days
 * @param {string} paymentMethod - 'CREDIT' | 'CREDIT_CARD' | 'SEPA' | 'PAYPAL'
 */
export const boostListing = async (id, durationDays = 7, paymentMethod = 'CREDIT') => {
    return api.post(`/listings/${id}/boost`, { durationDays, payment_method: paymentMethod });
};

/**
 * POST /api/listings/:id/reports
 * Reports a listing with reason and description.
 * @param {string} id - Listing ID
 * @param {{ reason: string, description?: string }} data
 */
export const reportListing = async (id, data) => {
    return api.post(`/listings/${id}/reports`, data);
};


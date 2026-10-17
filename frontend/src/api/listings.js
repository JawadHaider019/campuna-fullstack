import api from './client.js';
let listingsCachePromise = null;
let lastListingsFetchTime = 0;

export const invalidateListingsCache = () => {
    listingsCachePromise = null;
    lastListingsFetchTime = 0;
};

/**
 * Sends multipart form-data to create a listing.
 * @param {FormData} formData - The form data containing images and listing info.
 */
export const createListing = async (formData) => {
    invalidateListingsCache();
    return api.post('/listings', formData);
};

/**
 * Sends multipart form-data to update an existing listing.
 * @param {string} id - Listing ID
 * @param {FormData} formData - The form data containing images and listing info.
 */
export const updateListing = async (id, formData) => {
    invalidateListingsCache();
    return api.put(`/listings/${id}`, formData);
};

/**
 * DELETE /api/listings/:id
 * Deletes a listing owned by the user.
 * @param {string} id - Listing ID
 */
export const deleteListing = async (id) => {
    invalidateListingsCache();
    return api.delete(`/listings/${id}`);
};

export const getMyListings = async () => {
    return api.get('/listings/my');
};

export const getAllListings = async (options = {}) => {
    const force = typeof options === 'boolean' ? options : options?.force === true;
    const now = Date.now();
    if (!force && listingsCachePromise && (now - lastListingsFetchTime < 15000)) {
        return listingsCachePromise;
    }
    lastListingsFetchTime = now;
    listingsCachePromise = api.get('/listings').catch((err) => {
        listingsCachePromise = null;
        throw err;
    });
    return listingsCachePromise;
};

export const getListingDetail = async (id, params = {}) => {
    return api.get(`/listings/${id}`, { params });
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
 * @param {object} [options] - Additional parameters like withdrawal_consent
 */
export const boostListing = async (id, durationDays = 7, paymentMethod = 'CREDIT', options = {}) => {
    return api.post(`/listings/${id}/boost`, {
        durationDays,
        payment_method: paymentMethod,
        withdrawal_consent: options?.withdrawal_consent,
        withdrawal_consent_at: options?.withdrawal_consent_at
    });
};

/**
 * POST /api/listings/:id/appeal
 * Submits an appeal / manual review request for a rejected listing.
 * @param {string} id - Listing ID
 * @param {{ reason: string, notes?: string }} data
 */
export const submitListingAppeal = async (id, data) => {
    return api.post(`/listings/${id}/appeal`, data);
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

/**
 * PATCH /api/listings/:id/status
 * Activates, deactivates, or pauses a listing.
 * @param {string} id - Listing ID
 * @param {string} [status] - Optional target status ('APPROVED' | 'INACTIVE' | 'SOLD')
 */
export const toggleListingStatus = async (id, status) => {
    invalidateListingsCache();
    return api.patch(`/listings/${id}/status`, { status });
};



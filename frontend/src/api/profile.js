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

export const getAllProfiles = () => api.get('/profile');

// ─── Subscription API ─────────────────────────────────────────────────────────

/** GET /api/subscriptions/plans — public: list all active plans */
export const getPlans = () => api.get('/subscriptions/plans');

/** GET /api/subscriptions/my — get current user's active subscription + plan */
export const getMySubscription = () => api.get('/subscriptions/my');

/** GET /api/subscriptions/features — get feature flags for current user */
export const getMyFeatures = () => api.get('/subscriptions/features');

/**
 * POST /api/subscriptions/subscribe
 * @param {string|object} planOrOptions — 'FREE' | 'BUSINESS' or { plan_name, payment_method, duration_months, billing_details, payment_details }
 * @param {string} [payment_method='CREDIT_CARD']
 * @param {number} [duration_months=1]
 * @param {object} [billing_details={}]
 * @param {object} [payment_details={}]
 */
export const subscribeToPlan = (planOrOptions, payment_method = 'CREDIT_CARD', duration_months = 1, billing_details = {}, payment_details = {}) => {
    if (typeof planOrOptions === 'object' && planOrOptions !== null) {
        return api.post('/subscriptions/subscribe', planOrOptions);
    }
    return api.post('/subscriptions/subscribe', {
        plan_name: planOrOptions,
        payment_method,
        duration_months,
        billing_details,
        payment_details,
    });
};

/** POST /api/subscriptions/cancel — cancel active subscription with bank verification details */
export const cancelSubscription = (details = {}) => api.post('/subscriptions/cancel', details);

/** GET /api/subscriptions/invoices — get user invoices & billing history */
export const getInvoices = () => api.get('/subscriptions/invoices');

// ─── Credit API ───────────────────────────────────────────────────────────────
export const getCreditBalance = () => api.get('/credits/balance');
export const getCreditTransactions = () => api.get('/credits/transactions');
export const earnSimulatedCredits = () => api.post('/credits/earn-simulated');
export const spendSimulatedCredits = (amount = 500, description = 'Spotlight-Boost für Inserat (Test)') =>
    api.post('/credits/spend-simulated', { amount, description });

// ─── Referral API ─────────────────────────────────────────────────────────────
export const getReferralStats = () => api.get('/referrals/stats');
export const getReferralsList = () => api.get('/referrals/list');

/**
 * Uploads a profile avatar or company logo.
 * @param {File} file - The file object to upload
 */
export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/profile/me/avatar', formData);
};

/**
 * Uploads a profile cover image.
 * @param {File} file - The file object to upload
 */
export const uploadCover = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/profile/me/cover', formData);
};




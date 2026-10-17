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

let profilesCachePromise = null;
let lastProfilesFetchTime = 0;

export const invalidateProfilesCache = () => {
    profilesCachePromise = null;
    lastProfilesFetchTime = 0;
};

export const getAllProfiles = (options = {}) => {
    const force = typeof options === 'boolean' ? options : options?.force === true;
    const now = Date.now();
    if (!force && profilesCachePromise && (now - lastProfilesFetchTime < 15000)) {
        return profilesCachePromise;
    }
    lastProfilesFetchTime = now;
    profilesCachePromise = api.get('/profile').catch((err) => {
        profilesCachePromise = null;
        throw err;
    });
    return profilesCachePromise;
};

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

/** GET /api/subscriptions/analytics — subscriber KPI performance & visual time-series */
export const getSubscriptionAnalytics = (period = '30d') => api.get(`/subscriptions/analytics?period=${period}`);

/** GET /api/subscriptions/leads — subscriber customer inquiries/leads pipeline */
export const getSubscriberLeads = () => api.get('/subscriptions/leads');

/** PATCH /api/subscriptions/leads/:id/status — update lead status & notes */
export const updateLeadStatus = (leadId, status, notes) => api.patch(`/subscriptions/leads/${leadId}/status`, { status, notes });

/** POST /api/listings/csv-import — batch import vehicle listings */
export const importListingsCsv = (listings) => api.post('/listings/csv-import', { listings });

/** GET /api/listings/export-csv — export listings as CSV string */
export const exportListingsCsv = () => api.get('/listings/export-csv');

// ─── Credit API ───────────────────────────────────────────────────────────────
export const getCreditBalance = () => api.get('/credits/balance');
export const getCreditTransactions = () => api.get('/credits/transactions');
export const purchaseCredits = (packageCredits = 500, payment_method = 'CREDIT_CARD', payment_details = {}) =>
    api.post('/credits/buy', { packageCredits, payment_method, payment_details });
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

/**
 * POST /api/profile/spotlight
 * Books or extends Homepage Spotlight for commercial users.
 * @param {{ durationDays: number, payment_method: string }} data
 */
export const bookSpotlight = (data) => api.post('/profile/spotlight', data);

// ─── Stripe API ───────────────────────────────────────────────────────────────
/**
 * POST /api/stripe/create-checkout-session
 * @param {{ type: 'SUBSCRIPTION'|'CREDIT_PURCHASE'|'SPOTLIGHT_PURCHASE', plan_name?: string, duration_months?: number, package_credits?: number, duration_days?: number, return_url?: string }} options
 */
export const createStripeCheckoutSession = (options) => api.post('/stripe/create-checkout-session', options);

/**
 * GET /api/stripe/verify-session?session_id=...
 * @param {string} sessionId
 */
export const verifyStripeSession = (sessionId) => api.get(`/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);

/**
 * POST /api/subscriptions/public-cancel
 * Public cancellation endpoint under Section 312k BGB (no login required)
 * @param {{ name?: string, email: string, contract_type?: string, contract_number?: string, cancellation_date_type?: string, reason?: string }} data
 */
export const publicCancelContract = (data) => api.post('/subscriptions/public-cancel', data);

/**
 * POST /api/subscriptions/request-verification
 * Step 1: Sends email with "Kündigung bestätigen (Das war ich)" button
 * @param {{ name?: string, email: string, contract_type?: string, contract_number?: string, cancellation_date_type?: string, reason?: string }} data
 */
export const requestCancellationVerification = (data) => api.post('/subscriptions/request-verification', data);

/**
 * POST /api/subscriptions/confirm-cancellation
 * Step 2: Executes cancellation once email link with "Das war ich" is clicked
 * @param {string} token
 */
export const confirmCancellation = (token) => api.post('/subscriptions/confirm-cancellation', { token });

/**
 * POST /api/subscriptions/revoke-cancellation
 * 1-click revocation of unauthorized or accidental cancellation
 * @param {string} token
 */
export const revokeCancellation = (token) => api.post('/subscriptions/revoke-cancellation', { token });



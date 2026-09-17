import api from './client.js';

/**
 * GET /api/admin/dashboard-stats
 * Fetches real-time platform analytics, moderation queue, user counts, and system metrics.
 */
export const getAdminDashboardStats = () => {
    return api.get('/admin/dashboard-stats');
};

/**
 * GET /api/admin/export-csv
 * Downloads all listings and seller information in CSV format.
 */
export const exportAdminDataCsv = () => {
    return api.get('/admin/export-csv', { responseType: 'blob' });
};

/**
 * POST /api/admin/batch-ai-scan
 * Runs batch AI moderation scan on unmoderated listings.
 */
export const batchAiModerationScan = () => {
    return api.post('/admin/batch-ai-scan');
};

/**
 * GET /api/admin/users
 * Lists users with search, filtering, and pagination.
 */
export const getAdminUsers = (params = {}) => {
    return api.get('/admin/users', { params });
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Toggles a user's suspended status.
 */
export const toggleUserSuspension = (userId, is_suspended) => {
    return api.patch(`/admin/users/${userId}/suspend`, { is_suspended });
};

/**
 * PATCH /api/admin/users/:id/role
 * Changes user role (USER <-> ADMIN).
 */
export const updateUserRole = (userId, role) => {
    return api.patch(`/admin/users/${userId}/role`, { role });
};

/**
 * PATCH /api/admin/users/:id/verify-email
 * Manually verifies user email.
 */
export const manuallyVerifyUserEmail = (userId) => {
    return api.patch(`/admin/users/${userId}/verify-email`);
};

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes user account.
 */
export const deleteAdminUser = (userId) => {
    return api.delete(`/admin/users/${userId}`);
};

/**
 * GET /api/admin/listings
 * Lists listings with filtering, search, and pagination.
 */
export const getAdminListings = (params = {}) => {
    return api.get('/admin/listings', { params });
};

/**
 * PATCH /api/admin/listings/:id/status
 * Moderates listing status (APPROVED, REVIEW, REJECTED, DRAFT).
 */
export const updateAdminListingStatus = (listingId, status, reason = '') => {
    return api.patch(`/admin/listings/${listingId}/status`, { status, reason });
};

/**
 * DELETE /api/admin/listings/:id
 * Permanently deletes listing.
 */
export const deleteAdminListing = (listingId) => {
    return api.delete(`/admin/listings/${listingId}`);
};

/**
 * PATCH /api/admin/listings/:id/featured
 * Toggles featured status for a listing (Campuna recommendation).
 */
export const toggleAdminListingFeatured = (listingId, featured) => {
    return api.patch(`/admin/listings/${listingId}/featured`, { featured });
};

/**
 * GET /api/admin/decisions
 * Lists all AI moderation decisions and analysis scores.
 */
export const getAdminDecisions = (params = {}) => {
    return api.get('/admin/decisions', { params });
};

/**
 * POST /api/admin/decisions/:id/simulate-scan
 * Simulates a new AI scan with customizable score.
 */
export const simulateAiScan = (listingId, target_score) => {
    return api.post(`/admin/decisions/${listingId}/simulate-scan`, { target_score });
};

/**
 * POST /api/admin/decisions/:id/admin-decision
 * Submits manual admin decision (especially for Score 50 borderline listings).
 */
export const submitAdminManualDecision = (listingId, decision, notes = '') => {
    return api.post(`/admin/decisions/${listingId}/admin-decision`, { decision, notes });
};

/**
 * GET /api/admin/reports
 * Lists all user reports on listings with filters and counts.
 */
export const getAdminReports = (params = {}) => {
    return api.get('/admin/reports', { params });
};

/**
 * GET /api/admin/reports/:id
 * Retrieves full report details and report history on a listing.
 */
export const getAdminReportDetail = (reportId) => {
    return api.get(`/admin/reports/${reportId}`);
};

/**
 * PATCH /api/admin/reports/:id
 * Updates report status (REVIEWED, DISMISSED), admin note, and optional listing/user actions.
 */
export const updateAdminReport = (reportId, data) => {
    return api.patch(`/admin/reports/${reportId}`, data);
};

/**
 * GET /api/admin/broadcasts
 * Lists all broadcast announcements with read metrics & engagement stats.
 */
export const getAdminBroadcasts = (params = {}) => {
    return api.get('/admin/broadcasts', { params });
};

/**
 * POST /api/admin/broadcasts
 * Creates and publishes a new system broadcast.
 */
export const createAdminBroadcast = (data) => {
    return api.post('/admin/broadcasts', data);
};

/**
 * PATCH /api/admin/broadcasts/:id
 * Updates an existing broadcast.
 */
export const updateAdminBroadcast = (id, data) => {
    return api.patch(`/admin/broadcasts/${id}`, data);
};

/**
 * DELETE /api/admin/broadcasts/:id
 * Permanently deletes a broadcast.
 */
export const deleteAdminBroadcast = (id) => {
    return api.delete(`/admin/broadcasts/${id}`);
};


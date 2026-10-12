import api from './client.js';

/**
 * GET /api/tips
 * Fetch public active camping tips from the backend
 */
export const getPublicTips = (params = {}) => {
    return api.get('/tips', { params });
};

/**
 * GET /api/tips/admin/all
 * Fetch all tips for admin management (active & inactive)
 */
export const getAdminTips = () => {
    return api.get('/tips/admin/all');
};

/**
 * POST /api/tips/admin/create
 * Create a new camping tip
 */
export const createAdminTip = (data) => {
    return api.post('/tips/admin/create', data);
};

/**
 * PUT /api/tips/admin/:id
 * Update an existing camping tip
 */
export const updateAdminTip = (id, data) => {
    return api.put(`/tips/admin/${id}`, data);
};

/**
 * DELETE /api/tips/admin/:id
 * Delete a camping tip
 */
export const deleteAdminTip = (id) => {
    return api.delete(`/tips/admin/${id}`);
};

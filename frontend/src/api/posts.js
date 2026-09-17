import api from './client.js';

// ─── PUBLIC ENDPOINTS ───

/**
 * GET /api/posts
 * Fetch published blog posts with optional filters (category, search, page, limit)
 */
export const getPublicPosts = (params = {}) => {
    return api.get('/posts', { params });
};

/**
 * GET /api/posts/:slug
 * Fetch single post by slug or ID
 */
export const getPublicPost = (slug) => {
    return api.get(`/posts/${slug}`);
};

// ─── ADMIN ENDPOINTS ───

/**
 * GET /api/admin/posts
 * Fetch all posts for admin (including drafts)
 */
export const getAdminPosts = (params = {}) => {
    return api.get('/admin/posts', { params });
};

/**
 * GET /api/admin/posts/:id
 * Fetch single post for editing
 */
export const getAdminPost = (id) => {
    return api.get(`/admin/posts/${id}`);
};

/**
 * POST /api/admin/posts
 * Create new post
 */
export const createPost = (data) => {
    return api.post('/admin/posts', data);
};

/**
 * PUT /api/admin/posts/:id
 * Update existing post
 */
export const updatePost = (id, data) => {
    return api.put(`/admin/posts/${id}`, data);
};

/**
 * DELETE /api/admin/posts/:id
 * Delete post
 */
export const deletePost = (id) => {
    return api.delete(`/admin/posts/${id}`);
};

/**
 * POST /api/admin/posts/upload-image
 * Upload image for post
 */
export const uploadPostImage = (formData) => {
    return api.post('/admin/posts/upload-image', formData);
};

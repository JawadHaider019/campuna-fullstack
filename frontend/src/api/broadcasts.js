import api from './client.js';

/**
 * GET /api/broadcasts
 * Retrieves all active announcements and broadcasts targeted to current user.
 */
export const getUserBroadcasts = () => {
    return api.get('/broadcasts');
};

/**
 * GET /api/broadcasts/unread-count
 * Retrieves count of unread broadcasts.
 */
export const getBroadcastsUnreadCount = () => {
    return api.get('/broadcasts/unread-count');
};

/**
 * POST /api/broadcasts/:id/read
 * Marks a specific broadcast as read.
 */
export const markBroadcastAsRead = (broadcastId) => {
    return api.post(`/broadcasts/${broadcastId}/read`);
};

/**
 * POST /api/broadcasts/mark-all-read
 * Marks all eligible broadcasts as read.
 */
export const markAllBroadcastsAsRead = () => {
    return api.post('/broadcasts/mark-all-read');
};

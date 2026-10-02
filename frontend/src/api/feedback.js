import api from './client.js';

/**
 * POST /api/feedback
 * Submit a new feedback ticket / direct message to admin.
 */
export const submitUserFeedback = (data) => {
    return api.post('/feedback', data);
};

/**
 * GET /api/feedback
 * Retrieves all feedback tickets created by the logged-in user.
 */
export const getUserFeedbackList = () => {
    return api.get('/feedback');
};

/**
 * GET /api/feedback/:id
 * Retrieves detail and conversation thread of a specific feedback ticket.
 */
export const getUserFeedbackDetail = (id) => {
    return api.get(`/feedback/${id}`);
};

/**
 * POST /api/feedback/:id/reply
 * Sends a user reply in an existing feedback thread.
 */
export const replyToFeedbackUser = (id, message) => {
    return api.post(`/feedback/${id}/reply`, { message });
};

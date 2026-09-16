import api from './client';

/**
 * Helper to unwrap standard { success: true, data: {...} } responses
 */
function unwrap(res) {
    if (res && res.success && res.data) {
        return {
            success: true,
            status: res.status,
            ...res.data
        };
    }
    return res;
}

/**
 * POST /api/conversations
 * Starts a new conversation or retrieves the existing one for a listing.
 * Optionally sends an initial message.
 */
export const createOrGetConversation = async (listingId, initialMessage = '') => {
    const res = await api.post('/conversations', {
        listing_id: listingId,
        initial_message: initialMessage
    });
    return unwrap(res);
};

/**
 * GET /api/conversations
 * Retrieves all active conversations for the logged in user.
 */
export const getConversations = async () => {
    const res = await api.get('/conversations');
    return unwrap(res);
};

/**
 * GET /api/conversations/unread-count
 * Returns total unread messages count for badges.
 */
export const getUnreadMessagesCount = async () => {
    const res = await api.get('/conversations/unread-count');
    return unwrap(res);
};

/**
 * GET /api/conversations/:id
 * Retrieves a conversation thread with all its messages and listing context.
 */
export const getConversationDetail = async (conversationId) => {
    const res = await api.get(`/conversations/${conversationId}`);
    return unwrap(res);
};

/**
 * POST /api/conversations/:id/messages
 * Sends a message in a conversation.
 */
export const sendChatMessage = async (conversationId, content) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, { content });
    return unwrap(res);
};

/**
 * PATCH /api/conversations/:id/read
 * Marks incoming unread messages as read in a conversation.
 */
export const markConversationAsRead = async (conversationId) => {
    const res = await api.patch(`/conversations/${conversationId}/read`);
    return unwrap(res);
};


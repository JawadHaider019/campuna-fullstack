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
export const createOrGetConversation = async (param1, param2 = '') => {
    const payload = typeof param1 === 'object' && param1 !== null
        ? param1
        : { listing_id: param1, initial_message: param2 };
    const res = await api.post('/conversations', payload);
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


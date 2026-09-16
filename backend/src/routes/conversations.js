import { Router } from 'express';
import {
    createOrGetConversation,
    getConversations,
    getConversationDetail,
    sendMessage,
    markConversationAsRead,
    getUnreadCount
} from '../controllers/conversations.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// GET /api/conversations/unread-count → Total unread messages across all chats
router.get('/unread-count', getUnreadCount);

// GET /api/conversations → List of user's active conversations
router.get('/', getConversations);

// POST /api/conversations → Start or fetch conversation for a listing
router.post('/', createOrGetConversation);

// GET /api/conversations/:id → Fetch thread messages & details
router.get('/:id', getConversationDetail);

// POST /api/conversations/:id/messages → Send message
router.post('/:id/messages', sendMessage);

// PATCH /api/conversations/:id/read → Mark messages as read
router.patch('/:id/read', markConversationAsRead);

export default router;

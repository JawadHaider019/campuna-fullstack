import { Router } from 'express';
import {
    getUserBroadcasts,
    getBroadcastsUnreadCount,
    markBroadcastAsRead,
    markAllBroadcastsAsRead
} from '../controllers/broadcasts.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';

const router = Router();

// GET /api/broadcasts → Fetch active broadcasts for current user or visitor
router.get('/', optionalAuthenticate, getUserBroadcasts);

// GET /api/broadcasts/unread-count → Fetch unread count for current user
router.get('/unread-count', optionalAuthenticate, getBroadcastsUnreadCount);

// POST /api/broadcasts/mark-all-read → Mark all as read
router.post('/mark-all-read', authenticate, markAllBroadcastsAsRead);

// POST /api/broadcasts/:id/read → Mark specific broadcast as read
router.post('/:id/read', authenticate, markBroadcastAsRead);

export default router;

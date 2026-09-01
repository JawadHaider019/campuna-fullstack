import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
    getPlans,
    getMySubscription,
    getMyFeatures,
    subscribe,
    cancelSubscription,
} from '../controllers/subscription.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/subscriptions/plans — list all active plans (no auth required)
router.get('/plans', getPlans);

// ── Protected ─────────────────────────────────────────────────────────────────

// GET /api/subscriptions/my — get current user's active subscription
router.get('/my', authenticate, getMySubscription);

// GET /api/subscriptions/features — get feature flags for current user
router.get('/features', authenticate, getMyFeatures);

// POST /api/subscriptions/subscribe — subscribe to a plan
router.post('/subscribe', authenticate, subscribe);

// POST /api/subscriptions/cancel — cancel active subscription
router.post('/cancel', authenticate, cancelSubscription);

export default router;

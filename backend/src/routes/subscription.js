import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
    getPlans,
    getMySubscription,
    getMyFeatures,
    subscribe,
    cancelSubscription,
    getInvoices,
    getSubscriptionAnalytics,
    getSubscriberLeads,
    updateLeadStatus,
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

// GET /api/subscriptions/invoices — get user invoices & billing history
router.get('/invoices', authenticate, getInvoices);

// GET /api/subscriptions/analytics — subscriber KPI performance & visual time-series
router.get('/analytics', authenticate, getSubscriptionAnalytics);

// GET /api/subscriptions/leads — subscriber customer inquiries/leads pipeline
router.get('/leads', authenticate, getSubscriberLeads);

// PATCH /api/subscriptions/leads/:id/status — update lead inquiry status & notes
router.patch('/leads/:id/status', authenticate, updateLeadStatus);

// POST /api/subscriptions/subscribe — subscribe to a plan
router.post('/subscribe', authenticate, subscribe);

// POST /api/subscriptions/cancel — cancel active subscription
router.post('/cancel', authenticate, cancelSubscription);

export default router;


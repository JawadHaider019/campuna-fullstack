import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import {
    getPlans,
    publicCancelContract,
    revokeCancellation,
    requestCancellationVerification,
    confirmCancellation,
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

// POST /api/subscriptions/public-cancel — public cancellation under Section 312k BGB (with optional auth detection)
router.post('/public-cancel', optionalAuthenticate, publicCancelContract);

// POST /api/subscriptions/request-verification — Step 1: sends email with "Kündigung bestätigen (Das war ich)" button
router.post('/request-verification', requestCancellationVerification);

// POST /api/subscriptions/confirm-cancellation — Step 2: executes cancellation once email link is clicked
router.post('/confirm-cancellation', confirmCancellation);
router.get('/confirm-cancellation', confirmCancellation);

// POST & GET /api/subscriptions/revoke-cancellation — 1-click reversal of unauthorized/accidental cancellation
router.post('/revoke-cancellation', revokeCancellation);
router.get('/revoke-cancellation', revokeCancellation);

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


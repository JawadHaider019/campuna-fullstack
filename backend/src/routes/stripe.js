import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
    createCheckoutSession,
    verifySession,
} from '../controllers/stripe.js';

const router = Router();

// Create Stripe Checkout Session (requires auth)
router.post('/create-checkout-session', authenticate, createCheckoutSession);

// Verify completed Stripe Checkout Session (public / callback)
router.get('/verify-session', verifySession);

export default router;

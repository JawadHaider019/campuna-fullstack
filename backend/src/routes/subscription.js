import { Router } from 'express';
import { getPlans, getMySubscription, upgradeToBusiness, cancelSubscription } from '../controllers/subscription.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/plans', getPlans);
router.get('/me', authenticate, getMySubscription);
router.post('/upgrade', authenticate, upgradeToBusiness);
router.post('/cancel', authenticate, cancelSubscription);

export default router;

import { Router } from 'express';
import { getReferralStats, getReferralsList } from '../controllers/referral.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/stats', authenticate, getReferralStats);
router.get('/list', authenticate, getReferralsList);

export default router;

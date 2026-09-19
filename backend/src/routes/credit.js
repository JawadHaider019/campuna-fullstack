import { Router } from 'express';
import { getBalance, getTransactions, earnSimulatedCredits, spendSimulatedCredits, purchaseCredits } from '../controllers/credit.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.post('/buy', authenticate, purchaseCredits);
router.post('/earn-simulated', authenticate, earnSimulatedCredits);
router.post('/spend-simulated', authenticate, spendSimulatedCredits);

export default router;

import { Router } from 'express';
import { getBalance, getTransactions, earnSimulatedCredits } from '../controllers/credit.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.post('/earn-simulated', authenticate, earnSimulatedCredits);

export default router;

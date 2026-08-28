import { Router } from 'express';
import { register, getVerificationStatus, login } from '../controllers/auth.js';

const router = Router();

// POST /api/register
router.post('/register', register);
// POST /api/login
router.post('/login', login);
// GET /api/verify-status
router.get('/verify-status', getVerificationStatus);

export default router;

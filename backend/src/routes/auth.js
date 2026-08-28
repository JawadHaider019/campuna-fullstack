import { Router } from 'express';
import { register, getVerificationStatus, login, logout, refresh } from '../controllers/auth.js';

const router = Router();

// POST /api/register
router.post('/register', register);
// POST /api/login
router.post('/login', login);
// POST /api/logout
router.post('/logout', logout);
// POST /api/refresh
router.post('/refresh', refresh);
// GET /api/verify-status
router.get('/verify-status', getVerificationStatus);

export default router;

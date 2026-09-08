import { Router } from 'express';
import { 
    register, 
    getVerificationStatus, 
    login, 
    logout, 
    refresh, 
    verifyEmail,
    requestPasswordReset,
    verifyResetOtp,
    resetPassword
} from '../controllers/auth.js';

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
// POST /api/verify-email
router.post('/verify-email', verifyEmail);

// Password Reset endpoints
// POST /api/forgot-password
router.post('/forgot-password', requestPasswordReset);
// POST /api/verify-reset-otp
router.post('/verify-reset-otp', verifyResetOtp);
// POST /api/reset-password
router.post('/reset-password', resetPassword);

export default router;

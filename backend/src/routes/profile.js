import { Router } from 'express';
import { getMyProfile, updateMyProfile, getPublicProfile } from '../controllers/profile.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticate, getMyProfile);

// PUT  /api/profile/me      → update own profile
router.put('/me', authenticate, updateMyProfile);

// GET  /api/profile/:userId → public profile of any user
router.get('/:userId', getPublicProfile);

export default router;

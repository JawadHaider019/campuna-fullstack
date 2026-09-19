import { Router } from 'express';
import { getMyProfile, updateMyProfile, getPublicProfile, uploadAvatar, uploadCover, getAllProfiles, bookSpotlight } from '../controllers/profile.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

// GET  /api/profile         → list all profiles (public)
router.get('/', getAllProfiles);

router.get('/me', authenticate, getMyProfile);

// PUT  /api/profile/me      → update own profile
router.put('/me', authenticate, updateMyProfile);

// POST /api/profile/spotlight → book or extend Homepage Spotlight
router.post('/spotlight', authenticate, bookSpotlight);

// POST /api/profile/me/avatar → upload/update avatar or company logo
router.post('/me/avatar', authenticate, uploadSingle, uploadAvatar);

// POST /api/profile/me/cover  → upload/update cover photo
router.post('/me/cover', authenticate, uploadSingle, uploadCover);


// GET  /api/profile/:userId → public profile of any user
router.get('/:userId', getPublicProfile);

export default router;

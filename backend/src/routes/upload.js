import { Router } from 'express';
import { uploadSingle, uploadImage } from '../controllers/upload.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// POST /api/upload/image
// Multi-part form-data: key must be 'image'
router.post('/image', authenticate, uploadSingle, uploadImage);

export default router;

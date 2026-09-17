import express from 'express';
import {
    getPublicPosts,
    getPublicPostBySlug,
    getAdminPosts,
    getAdminPostById,
    createPost,
    updatePost,
    deletePost,
    uploadPostImage
} from '../controllers/posts.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { uploadSingleSafe } from '../middleware/upload.js';

const router = express.Router();

// ─── PUBLIC ROUTES ───
router.get('/', getPublicPosts);
router.get('/:slug', getPublicPostBySlug);

// ─── ADMIN ROUTES (Protected) ───
router.get('/admin/all', authenticate, requireAdmin, getAdminPosts);
router.get('/admin/:id', authenticate, requireAdmin, getAdminPostById);
router.post('/admin/create', authenticate, requireAdmin, createPost);
router.put('/admin/:id', authenticate, requireAdmin, updatePost);
router.delete('/admin/:id', authenticate, requireAdmin, deletePost);
router.post('/admin/upload-image', authenticate, requireAdmin, uploadSingleSafe, uploadPostImage);

export default router;

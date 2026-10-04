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
import { authenticate, requireBlogAdmin } from '../middleware/authenticate.js';
import { uploadSingleSafe } from '../middleware/upload.js';

const router = express.Router();

// ─── PUBLIC ROUTES ───
router.get('/', getPublicPosts);
router.get('/:slug', getPublicPostBySlug);

// ─── ADMIN ROUTES (Protected - Accessible by ADMIN & BLOG_ADMIN) ───
router.get('/admin/all', authenticate, requireBlogAdmin, getAdminPosts);
router.get('/admin/:id', authenticate, requireBlogAdmin, getAdminPostById);
router.post('/admin/create', authenticate, requireBlogAdmin, createPost);
router.put('/admin/:id', authenticate, requireBlogAdmin, updatePost);
router.delete('/admin/:id', authenticate, requireBlogAdmin, deletePost);
router.post('/admin/upload-image', authenticate, requireBlogAdmin, uploadSingleSafe, uploadPostImage);

export default router;

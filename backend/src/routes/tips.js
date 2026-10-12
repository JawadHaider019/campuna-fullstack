import express from 'express';
import {
    getPublicTips,
    getAdminTips,
    createTip,
    updateTip,
    deleteTip
} from '../controllers/tips.js';
import { authenticate, requireBlogAdmin } from '../middleware/authenticate.js';

const router = express.Router();

// ─── PUBLIC ROUTES ───
router.get('/', getPublicTips);

// ─── ADMIN ROUTES (Accessible by ADMIN & BLOG_ADMIN) ───
router.get('/admin/all', authenticate, requireBlogAdmin, getAdminTips);
router.post('/admin/create', authenticate, requireBlogAdmin, createTip);
router.put('/admin/:id', authenticate, requireBlogAdmin, updateTip);
router.delete('/admin/:id', authenticate, requireBlogAdmin, deleteTip);

export default router;

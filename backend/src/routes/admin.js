import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import {
    getAdminUsers,
    toggleUserSuspension,
    manuallyVerifyUserEmail,
    deleteAdminUser
} from '../controllers/adminUsers.js';
import {
    getAdminListings,
    updateAdminListingStatus,
    deleteAdminListing,
    toggleAdminListingFeatured
} from '../controllers/adminListings.js';
import {
    getAdminDecisions,
    simulateAiScan,
    submitAdminManualDecision
} from '../controllers/adminDecisions.js';
import {
    getAdminDashboardStats,
    exportAdminDataCsv,
    batchAiModerationScan
} from '../controllers/adminDashboard.js';
import {
    getAdminReports,
    getAdminReportDetail,
    updateAdminReportStatus
} from '../controllers/listingReports.js';
import {
    getAdminBroadcasts,
    createAdminBroadcast,
    updateAdminBroadcast,
    deleteAdminBroadcast
} from '../controllers/broadcasts.js';
import {
    getAdminPosts,
    getAdminPostById,
    createPost,
    updatePost,
    deletePost,
    uploadPostImage
} from '../controllers/posts.js';
import { uploadSingleSafe } from '../middleware/upload.js';

const router = express.Router();

// All admin routes require valid auth + ADMIN role
router.use(authenticate, requireAdmin);

// Blog posts endpoints
router.get('/posts', getAdminPosts);
router.get('/posts/:id', getAdminPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/upload-image', uploadSingleSafe, uploadPostImage);

// Dashboard stats and tools
router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/export-csv', exportAdminDataCsv);
router.post('/batch-ai-scan', batchAiModerationScan);

// Broadcasts (Rundschreiben) endpoints
router.get('/broadcasts', getAdminBroadcasts);
router.post('/broadcasts', createAdminBroadcast);
router.patch('/broadcasts/:id', updateAdminBroadcast);
router.delete('/broadcasts/:id', deleteAdminBroadcast);

// Reports moderation endpoints
router.get('/reports', getAdminReports);
router.get('/reports/:id', getAdminReportDetail);
router.patch('/reports/:id', updateAdminReportStatus);

// User management endpoints
router.get('/users', getAdminUsers);
router.patch('/users/:id/suspend', toggleUserSuspension);
router.patch('/users/:id/verify-email', manuallyVerifyUserEmail);
router.delete('/users/:id', deleteAdminUser);

// Listing moderation endpoints
router.get('/listings', getAdminListings);
router.patch('/listings/:id/status', updateAdminListingStatus);
router.patch('/listings/:id/featured', toggleAdminListingFeatured);
router.delete('/listings/:id', deleteAdminListing);

// AI Decisions & Simulation endpoints
router.get('/decisions', getAdminDecisions);
router.post('/decisions/:id/simulate-scan', simulateAiScan);
router.post('/decisions/:id/admin-decision', submitAdminManualDecision);

export default router;


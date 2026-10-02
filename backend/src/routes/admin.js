import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import {
    getAdminUsers,
    getAdminUserById,
    toggleUserSuspension,
    manuallyVerifyUserEmail,
    deleteAdminUser,
    updateUserProviderCategory
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
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/suspend', toggleUserSuspension);
router.patch('/users/:id/verify-email', manuallyVerifyUserEmail);
router.patch('/users/:id/provider-category', updateUserProviderCategory);
router.delete('/users/:id', deleteAdminUser);

// Listing moderation endpoints
router.get('/listings', getAdminListings);
router.patch('/listings/:id/status', updateAdminListingStatus);
router.patch('/listings/:id/featured', toggleAdminListingFeatured);
router.delete('/listings/:id', deleteAdminListing);

import {
    grantAdminBenefit,
    applyCommercialTransitionPeriod,
    getAdminUserListings
} from '../controllers/adminBenefits.js';

// AI Decisions & Simulation endpoints
router.get('/decisions', getAdminDecisions);
router.post('/decisions/:id/simulate-scan', simulateAiScan);
router.post('/decisions/:id/admin-decision', submitAdminManualDecision);

// Complimentary Benefits & Goodwill endpoints
router.post('/benefits/grant', grantAdminBenefit);
router.post('/benefits/apply-transition-period', applyCommercialTransitionPeriod);
router.get('/benefits/user-listings/:userId', getAdminUserListings);

import {
    getAdminFeedbackList,
    getAdminFeedbackDetail,
    replyToFeedbackAdmin,
    updateAdminFeedbackStatus
} from '../controllers/feedback.js';

// Feedback & User Inquiries moderation endpoints
router.get('/feedback', getAdminFeedbackList);
router.get('/feedback/:id', getAdminFeedbackDetail);
router.post('/feedback/:id/reply', replyToFeedbackAdmin);
router.patch('/feedback/:id/status', updateAdminFeedbackStatus);

export default router;


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

const router = express.Router();

// All admin routes require valid auth + ADMIN role
router.use(authenticate, requireAdmin);

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

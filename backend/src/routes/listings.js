import { Router } from 'express';
import {
    createListing,
    updateListing,
    deleteListing,
    getMyListings,
    getAllListings,
    getListingDetail,
    getListingsByUser,
    boostListing,
    importListingsFromCsv,
    exportListingsToCsv,
} from '../controllers/listings.js';
import { createListingReport } from '../controllers/listingReports.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// GET /api/listings/my → Retrieve own listings
router.get('/my', authenticate, getMyListings);

// GET /api/listings/export-csv → Export own listings as CSV
router.get('/export-csv', authenticate, exportListingsToCsv);

// GET /api/listings/user/:userId → Retrieve all approved listings by a specific user (public)
router.get('/user/:userId', getListingsByUser);

// GET /api/listings → Retrieve all approved listings (public)
router.get('/', getAllListings);

// GET /api/listings/:id → Retrieve listing detail by ID or Slug (public if approved, creator/admin if unapproved)
router.get('/:id', optionalAuthenticate, getListingDetail);

// POST /api/listings/csv-import → Batch import listings via CSV
router.post('/csv-import', authenticate, importListingsFromCsv);

// POST /api/listings → Create listing
router.post('/', authenticate, uploadMultiple, createListing);

// PUT /api/listings/:id → Update listing (requires authentication & re-triggers moderation review)
router.put('/:id', authenticate, uploadMultiple, updateListing);

// DELETE /api/listings/:id → Delete listing (owner or admin)
router.delete('/:id', authenticate, deleteListing);

// POST /api/listings/:id/boost → Boost listing with Campuna Credits
router.post('/:id/boost', authenticate, boostListing);

// POST /api/listings/:id/reports → Report a listing
router.post('/:id/reports', authenticate, createListingReport);

export default router;


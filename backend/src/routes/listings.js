import { Router } from 'express';
import { createListing, getMyListings, getAllListings, getListingDetail, getListingsByUser } from '../controllers/listings.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// GET /api/listings/my → Retrieve own listings
router.get('/my', authenticate, getMyListings);

// GET /api/listings/user/:userId → Retrieve all approved listings by a specific user (public)
router.get('/user/:userId', getListingsByUser);

// GET /api/listings → Retrieve all approved listings (public)
router.get('/', getAllListings);

// GET /api/listings/:id → Retrieve listing detail by ID (public)
router.get('/:id', getListingDetail);

// POST /api/listings → Create listing
router.post('/', authenticate, uploadMultiple, createListing);

export default router;

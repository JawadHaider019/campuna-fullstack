import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from '../controllers/favorites.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// GET /api/favorites → Retrieve all saved listings for user
router.get('/', authenticate, getFavorites);

// POST /api/favorites/sync → Sync guest favorite IDs after login
router.post('/sync', authenticate, syncFavorites);

// POST /api/favorites/:listingId → Add listing to favorites
router.post('/:listingId', authenticate, addFavorite);

// DELETE /api/favorites/:listingId → Remove listing from favorites
router.delete('/:listingId', authenticate, removeFavorite);

export default router;

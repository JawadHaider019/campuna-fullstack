import pool from '../config/database.js';

// Ensure the favorites table and indexes exist in PostgreSQL
const initFavoritesTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, listing_id)
            );
            CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
        `);
        console.log('✅ Favorites table verified in PostgreSQL');
    } catch (err) {
        console.error('⚠️ Favorites table initialization notice:', err.message);
    }
};

// Run table check on startup
initFavoritesTable();

/**
 * GET /api/favorites
 * Retrieves all saved listings for the authenticated user.
 */
export const getFavorites = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const result = await pool.query(
            `SELECT 
                f.listing_id,
                f.created_at as favorited_at,
                l.id,
                l.title,
                l.slug,
                l.description,
                l.category,
                l.subcategory,
                l.price,
                l.negotiable,
                l.location,
                l.condition,
                l.type_of_offer,
                l.status,
                l.images,
                l.created_at,
                u.user_type as seller_type
            FROM favorites f
            JOIN listings l ON f.listing_id = l.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC`,
            [userId]
        );

        const favoriteIds = result.rows.map(r => r.listing_id);
        const listings = result.rows.map(r => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            description: r.description,
            category: r.category,
            subcategory: r.subcategory,
            price: r.price ? parseFloat(r.price) : 0,
            negotiable: r.negotiable,
            location: r.location,
            condition: r.condition,
            type_of_offer: r.type_of_offer,
            status: r.status,
            images: r.images || [],
            seller: {
                type: r.seller_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                verified: true
            },
            favorited_at: r.favorited_at
        }));

        return res.status(200).json({
            success: true,
            favoriteIds,
            listings
        });
    } catch (error) {
        console.error('❌ getFavorites error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Favoriten.' });
    }
};

/**
 * POST /api/favorites/:listingId
 * Adds a listing to the authenticated user's favorites.
 */
export const addFavorite = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { listingId } = req.params;

        if (!listingId) {
            return res.status(400).json({ success: false, error: 'Listing-ID erforderlich.' });
        }

        await pool.query(
            `INSERT INTO favorites (user_id, listing_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, listing_id) DO NOTHING`,
            [userId, listingId]
        );

        return res.status(200).json({
            success: true,
            message: 'Inserat erfolgreich auf Merkzettel gespeichert.',
            isFavorite: true,
            listingId
        });
    } catch (error) {
        console.error('❌ addFavorite error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Speichern des Favoriten.' });
    }
};

/**
 * DELETE /api/favorites/:listingId
 * Removes a listing from the authenticated user's favorites.
 */
export const removeFavorite = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { listingId } = req.params;

        if (!listingId) {
            return res.status(400).json({ success: false, error: 'Listing-ID erforderlich.' });
        }

        await pool.query(
            `DELETE FROM favorites
             WHERE user_id = $1 AND listing_id = $2`,
            [userId, listingId]
        );

        return res.status(200).json({
            success: true,
            message: 'Inserat aus Merkzettel entfernt.',
            isFavorite: false,
            listingId
        });
    } catch (error) {
        console.error('❌ removeFavorite error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Entfernen des Favoriten.' });
    }
};

/**
 * POST /api/favorites/sync
 * Syncs a list of offline/guest favorite IDs into the authenticated user's account.
 */
export const syncFavorites = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { listingIds } = req.body;

        if (Array.isArray(listingIds) && listingIds.length > 0) {
            for (const listingId of listingIds) {
                if (typeof listingId === 'string' && listingId.trim()) {
                    await pool.query(
                        `INSERT INTO favorites (user_id, listing_id)
                         VALUES ($1, $2)
                         ON CONFLICT (user_id, listing_id) DO NOTHING`,
                        [userId, listingId.trim()]
                    ).catch(() => {});
                }
            }
        }

        // Return updated list
        return getFavorites(req, res);
    } catch (error) {
        console.error('❌ syncFavorites error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler bei der Synchronisierung der Favoriten.' });
    }
};

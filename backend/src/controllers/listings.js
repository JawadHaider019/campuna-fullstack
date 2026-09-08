import pool from '../config/database.js';
import { db } from '../prisma/db.js';
import { getUserFeatures } from './subscription.js';

/**
 * POST /api/listings
 * Creates a new listing for the authenticated user.
 * Validates active listing limits derived from the user's active subscription plan.
 * Uses uploadMultiple middleware to process attached images.
 */
export const createListing = async (req, res) => {
    try {
        const { id } = req.user;
        const { title, price, description, category, subcategory, location, isNegotiable } = req.body;

        // 1. Validate required fields
        if (!title || !price || !category || !location) {
            return res.status(400).json({ success: false, error: 'Bitte füllen Sie alle Pflichtfelder aus.' });
        }

        // 2. Count current active + pending listings
        const countRes = await pool.query(
            `SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND status IN ('APPROVED', 'REVIEW')`,
            [id]
        );
        const activeCount = parseInt(countRes.rows[0]?.count || 0, 10);

        // 3. Fetch subscription-based listing limit
        const features = await getUserFeatures(id);
        const limit = features.listing_limit; // -1 = unlimited

        if (limit !== -1 && activeCount >= limit) {
            return res.status(403).json({
                success: false,
                error: `Du hast das Limit von ${limit} aktiven Anzeigen erreicht. Upgrade auf Business, um unbegrenzt Anzeigen zu erstellen.`,
                upgrade_required: true,
                current_plan: features.plan_name,
                listing_limit: limit,
            });
        }

        // 4. Parse incoming data
        const parsedPrice = parseInt(price, 10);
        if (isNaN(parsedPrice)) {
            return res.status(400).json({ success: false, error: 'Ungültiger Preis angegeben.' });
        }

        const negotiable = isNegotiable === 'true' || isNegotiable === true;

        // 5. Handle image uploads
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            const PORT = process.env.PORT || 5000;
            const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');

            for (const file of req.files) {
                imageUrls.push(`${host}/uploads/${file.filename}`);
            }
        }

        const slug = title
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // 6. Create Listing in single table
        const insertRes = await pool.query(
            `INSERT INTO listings (
                user_id, title, slug, description, price, negotiable, location,
                condition, category, subcategory, status, featured, boosted_until, images, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'REVIEW', false, NULL, $11, NOW(), NOW()
            ) RETURNING *`,
            [
                id,
                title,
                slug,
                description || '',
                parsedPrice,
                negotiable,
                location,
                req.body.condition || 'Gebraucht',
                category,
                subcategory || '',
                imageUrls
            ]
        );

        const listing = insertRes.rows[0];
        const remainingForBadge = Math.max(0, 3 - (activeCount + 1));
        const badgeUnlocked = (activeCount + 1) >= 3;

        return res.status(201).json({
            success: true,
            message: 'Anzeige erfolgreich erstellt.',
            listing,
            pioneer_badge_info: {
                active_approved_count: activeCount + 1,
                remaining_for_badge: remainingForBadge,
                badge_unlocked: badgeUnlocked
            }
        });

    } catch (error) {
        console.error('❌ createListing error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Erstellen der Anzeige.' });
    }
};

/**
 * GET /api/listings/my
 * Retrieves all listings for the authenticated user with computed boost and featured states.
 */
export const getMyListings = async (req, res) => {
    try {
        const { id } = req.user;

        const query = `
            SELECT 
                l.*,
                (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) as is_boosted
            FROM listings l
            WHERE l.user_id = $1
            ORDER BY l.created_at DESC
        `;
        const result = await pool.query(query, [id]);

        const listings = result.rows.map(row => {
            let imagesArray = [];
            if (Array.isArray(row.images)) {
                imagesArray = row.images;
            } else if (typeof row.images === 'string') {
                try {
                    imagesArray = JSON.parse(row.images);
                } catch {
                    imagesArray = [row.images];
                }
            }

            return {
                ...row,
                price: parseFloat(row.price) || 0,
                featured: Boolean(row.featured),
                is_boosted: Boolean(row.is_boosted),
                images: imagesArray
            };
        });

        return res.status(200).json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('❌ getMyListings error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Anzeigen.' });
    }
};

/**
 * GET /api/listings
 * Retrieves all approved listings (public), sorted by Boosted & Featured priority, then created_at.
 */
export const getAllListings = async (req, res) => {
    try {
        const query = `
            SELECT 
                l.id,
                l.user_id,
                l.title,
                l.slug,
                l.description,
                l.price,
                l.negotiable,
                l.location,
                l.condition,
                l.category,
                l.subcategory,
                l.status,
                l.featured,
                l.boosted_until,
                (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) as is_boosted,
                l.images,
                l.created_at,
                l.updated_at,
                u.user_type as seller_type,
                pp.first_name,
                pp.last_name,
                cp.company_name
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            WHERE l.status = 'APPROVED'
            ORDER BY 
                (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) DESC,
                l.featured DESC,
                l.created_at DESC
        `;
        const result = await pool.query(query);

        const mappedListings = result.rows.map(row => {
            const isCommercial = row.seller_type === 'COMMERCIAL';
            const sellerName = isCommercial
                ? (row.company_name || 'Gewerblicher Anbieter')
                : (`${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Privatanbieter');

            let imagesArray = [];
            if (Array.isArray(row.images)) {
                imagesArray = row.images;
            } else if (typeof row.images === 'string') {
                try {
                    imagesArray = JSON.parse(row.images);
                } catch {
                    imagesArray = [row.images];
                }
            }

            return {
                id: row.id,
                user_id: row.user_id,
                title: row.title,
                slug: row.slug,
                description: row.description || '',
                price: parseFloat(row.price) || 0,
                negotiable: Boolean(row.negotiable),
                location: row.location || 'Deutschland',
                condition: row.condition || 'Gebraucht',
                category: row.category || 'Allgemein',
                subcategory: row.subcategory || '',
                status: row.status,
                featured: Boolean(row.featured),
                boosted_until: row.boosted_until,
                is_boosted: Boolean(row.is_boosted),
                images: imagesArray,
                created_at: row.created_at,
                updated_at: row.updated_at,
                seller: {
                    name: sellerName,
                    type: isCommercial ? 'Gewerblich' : 'Privat',
                    verified: true
                }
            };
        });

        return res.status(200).json({
            success: true,
            listings: mappedListings
        });
    } catch (error) {
        console.error('❌ getAllListings error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Anzeigen.' });
    }
};

/**
 * GET /api/listings/:id
 * Retrieves listing detail by ID or Slug, including owner details and boost/featured status.
 */
export const getListingDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        let query;
        let params;
        if (uuidRegex.test(id)) {
            query = `SELECT l.*, (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) as is_boosted FROM listings l WHERE l.id = $1`;
            params = [id];
        } else {
            query = `SELECT l.*, (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) as is_boosted FROM listings l WHERE l.slug = $1`;
            params = [id];
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }

        const listing = result.rows[0];

        // Retrieve profile details based on account type
        const userRes = await pool.query('SELECT user_type, role, email FROM users WHERE id = $1', [listing.user_id]);
        const user = userRes.rows[0] || {};

        let profile = null;
        if (user.user_type === 'COMMERCIAL') {
            const cpRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [listing.user_id]);
            profile = cpRes.rows[0];
        } else {
            const ppRes = await pool.query('SELECT * FROM private_profiles WHERE user_id = $1', [listing.user_id]);
            profile = ppRes.rows[0];
        }

        const sellerType = user.user_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat';
        const sellerName = user.user_type === 'COMMERCIAL'
            ? (profile?.company_name || 'Gewerblicher Anbieter')
            : (`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Privatverkäufer');

        const achRes = await pool.query('SELECT * FROM user_achievements WHERE user_id = $1', [listing.user_id]);
        const achievements = achRes.rows || [];

        let imagesArray = [];
        if (Array.isArray(listing.images)) {
            imagesArray = listing.images;
        } else if (typeof listing.images === 'string') {
            try {
                imagesArray = JSON.parse(listing.images);
            } catch {
                imagesArray = [listing.images];
            }
        }

        return res.status(200).json({
            success: true,
            listing: {
                ...listing,
                price: parseFloat(listing.price) || 0,
                featured: Boolean(listing.featured),
                boosted_until: listing.boosted_until,
                is_boosted: Boolean(listing.is_boosted),
                images: imagesArray,
                seller: {
                    name: sellerName,
                    type: sellerType,
                    verified: true,
                    achievements
                }
            }
        });
    } catch (error) {
        console.error('❌ getListingDetail error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Anzeige.' });
    }
};

/**
 * GET /api/listings/user/:userId
 * Retrieves all approved listings for a given user (public).
 */
export const getListingsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT 
                l.*,
                (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) as is_boosted
            FROM listings l
            WHERE l.user_id = $1 AND l.status = 'APPROVED'
            ORDER BY 
                (l.boosted_until IS NOT NULL AND l.boosted_until > NOW()) DESC,
                l.featured DESC,
                l.created_at DESC
        `;
        const result = await pool.query(query, [userId]);

        const listings = result.rows.map(row => {
            let imagesArray = [];
            if (Array.isArray(row.images)) {
                imagesArray = row.images;
            } else if (typeof row.images === 'string') {
                try {
                    imagesArray = JSON.parse(row.images);
                } catch {
                    imagesArray = [row.images];
                }
            }

            return {
                ...row,
                price: parseFloat(row.price) || 0,
                featured: Boolean(row.featured),
                is_boosted: Boolean(row.is_boosted),
                images: imagesArray
            };
        });

        return res.status(200).json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('❌ getListingsByUser error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Anzeigen.' });
    }
};

/**
 * POST /api/listings/:id/boost
 * Allows a seller to boost their listing using Campuna Credits (CC).
 * Packages: 7 days = 500 CC, 14 days = 900 CC, 30 days = 1800 CC
 */
export const boostListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { durationDays = 7 } = req.body;

        const parsedDays = parseInt(durationDays, 10);
        const PRICING = {
            7: 500,
            14: 900,
            30: 1800
        };

        const cost = PRICING[parsedDays] || Math.round(parsedDays * (500 / 7));
        if (!cost || cost <= 0) {
            return res.status(400).json({ success: false, error: 'Ungültige Boost-Dauer angegeben.' });
        }

        // Check listing exists & belongs to user
        const listingResult = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
        if (listingResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }

        const listing = listingResult.rows[0];
        if (listing.user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Keine Berechtigung für dieses Inserat.' });
        }

        if (listing.status !== 'APPROVED' && listing.status !== 'REVIEW') {
            return res.status(400).json({
                success: false,
                error: 'Nur freigegebene oder in Prüfung befindliche Inserate können geboostet werden.'
            });
        }

        // Check credit balance
        const balanceRes = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM credit_transactions WHERE user_id = $1',
            [userId]
        );
        const currentBalance = parseInt(balanceRes.rows[0]?.balance || 0, 10);

        if (currentBalance < cost) {
            return res.status(400).json({
                success: false,
                error: `Nicht genügend Campuna Credits vorhanden. Du benötigst ${cost.toLocaleString('de-DE')} CC (${currentBalance.toLocaleString('de-DE')} CC verfügbar).`,
                balance: currentBalance,
                required: cost
            });
        }

        // Calculate new boosted_until
        let newBoostedUntil;
        const currentBoosted = listing.boosted_until ? new Date(listing.boosted_until) : null;
        const now = new Date();

        if (currentBoosted && currentBoosted > now) {
            // Extend existing boost
            newBoostedUntil = new Date(currentBoosted.getTime() + parsedDays * 24 * 60 * 60 * 1000);
        } else {
            // New boost starting from now
            newBoostedUntil = new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000);
        }

        // Ledger entry in credit_transactions
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
                userId,
                -cost,
                'FEATURE_SPEND',
                `${parsedDays}-Tage Spotlight-Boost für Inserat "${listing.title}" (-${cost} CC)`
            ]
        );

        // Update listing boosted_until
        const updateRes = await pool.query(
            `UPDATE listings
             SET boosted_until = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newBoostedUntil.toISOString(), id]
        );

        const updatedListing = updateRes.rows[0];
        const newBalance = currentBalance - cost;

        return res.status(200).json({
            success: true,
            message: `Dein Inserat "${listing.title}" wurde erfolgreich für ${parsedDays} Tage geboostet!`,
            listing: {
                ...updatedListing,
                featured: Boolean(updatedListing.featured),
                is_boosted: true
            },
            boosted_until: updatedListing.boosted_until,
            new_balance: newBalance,
            spent_credits: cost
        });

    } catch (error) {
        console.error('❌ boostListing error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Boosten des Inserats.' });
    }
};

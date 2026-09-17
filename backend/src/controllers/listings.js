import pool from '../config/database.js';
import { db } from '../prisma/db.js';
import { getUserFeatures } from './subscription.js';
import crypto from 'crypto';

/**
 * POST /api/listings
 * Creates a new listing for the authenticated user.
 * Validates active listing limits derived from the user's active subscription plan.
 * Uses uploadMultiple middleware to process attached images.
 */
export const createListing = async (req, res) => {
    try {
        const { id, role } = req.user;
        const isAdmin = role === 'ADMIN';
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

        // 3. Fetch subscription-based listing limit (bypassed for ADMIN)
        if (!isAdmin) {
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
        } else {
            // Ensure admin exists in users and company_profiles for foreign key constraints
            await pool.query(
                `INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
                 VALUES ($1, $2, 'admin_account', 'ADMIN', 'COMMERCIAL', TRUE, FALSE, NOW(), NOW())
                 ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', user_type = 'COMMERCIAL', email_verified = TRUE`,
                [id, req.user.email || 'admin@campuna.com']
            ).catch(() => {});

            await pool.query(
                `INSERT INTO company_profiles (user_id, company_name, updated_at)
                 VALUES ($1, 'Campuna Official', NOW())
                 ON CONFLICT (user_id) DO NOTHING`,
                [id]
            ).catch(() => {});
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

        const listingId = crypto.randomUUID();
        const initialStatus = isAdmin ? 'APPROVED' : 'REVIEW';

        // 6. Create Listing in single table
        const insertRes = await pool.query(
            `INSERT INTO listings (
                id, user_id, title, slug, description, price, negotiable, location,
                condition, category, subcategory, status, featured, boosted_until, images, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NULL, $13, NOW(), NOW()
            ) RETURNING *`,
            [
                listingId,
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
                initialStatus,
                imageUrls
            ]
        );

        const listing = insertRes.rows[0];

        // 7. Insert initial listing_moderation record
        try {
            await pool.query(
                `INSERT INTO listing_moderation (
                    id, listing_id, ai_score, ai_decision, confidence_score,
                    text_score, image_score, price_score, fraud_risk_score,
                    ai_reasons, status, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    $10::jsonb,
                    $11, NOW(), NOW()
                ) ON CONFLICT (listing_id) DO NOTHING`,
                [
                    crypto.randomUUID(),
                    listing.id,
                    isAdmin ? 99 : 50,
                    isAdmin ? 'APPROVE' : 'MANUAL_REVIEW',
                    isAdmin ? 1.0 : 0.50,
                    isAdmin ? 99 : 60,
                    isAdmin ? 99 : 60,
                    isAdmin ? 99 : 60,
                    0,
                    isAdmin
                        ? JSON.stringify(['Direkt freigegeben durch Administrator.'])
                        : JSON.stringify(['Neues Inserat eingereicht - wartet auf manuelle Prüfung.']),
                    isAdmin ? 'APPROVED' : 'PENDING'
                ]
            );
        } catch (modErr) {
            console.warn('Notice: initial listing_moderation creation:', modErr.message);
        }

        const remainingForBadge = Math.max(0, 3 - (activeCount + 1));
        const badgeUnlocked = (activeCount + 1) >= 3;

        return res.status(201).json({
            success: true,
            message: isAdmin ? 'Anzeige erfolgreich erstellt und direkt freigegeben.' : 'Anzeige erfolgreich erstellt.',
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
            WHERE l.status = 'APPROVED' AND (u.is_suspended IS FALSE OR u.is_suspended IS NULL)
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

        // Access Control: Non-approved listings are strictly visible ONLY to the creator (owner) and admins
        if (listing.status !== 'APPROVED') {
            const isOwner = req.user && (String(req.user.id).toLowerCase() === String(listing.user_id).toLowerCase());
            const isAdmin = req.user && (req.user.role === 'ADMIN');

            if (!isOwner && !isAdmin) {
                return res.status(404).json({
                    success: false,
                    error: 'Inserat nicht gefunden oder noch nicht freigegeben.'
                });
            }
        }

        // Retrieve profile details based on account type
        const userRes = await pool.query('SELECT user_type, role, email, is_suspended FROM users WHERE id = $1', [listing.user_id]);
        const user = userRes.rows[0] || {};

        if (user.is_suspended) {
            const isAdmin = req.user && (req.user.role === 'ADMIN');
            if (!isAdmin) {
                return res.status(404).json({
                    success: false,
                    error: 'Dieses Inserat ist nicht mehr verfügbar, da das Verkäuferkonto gesperrt wurde.'
                });
            }
        }

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

        // Check if seller is suspended
        const userCheck = await pool.query('SELECT is_suspended FROM users WHERE id = $1', [userId]);
        if (userCheck.rowCount === 0 || userCheck.rows[0].is_suspended) {
            return res.status(404).json({ success: false, error: 'Verkäufer nicht gefunden oder gesperrt.' });
        }

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

/**
 * PUT /api/listings/:id
 * Updates an existing listing owned by the authenticated user.
 * Sets status to 'REVIEW' so it requires admin moderation approval.
 * Handles preserved existing images + newly uploaded image files.
 */
export const updateListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, price, description, category, subcategory, location, isNegotiable, condition, existing_images } = req.body;

        // 1. Fetch listing and verify ownership
        const existingRes = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
        if (existingRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }

        const existingListing = existingRes.rows[0];
        if (existingListing.user_id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Keine Berechtigung zum Bearbeiten dieses Inserats.' });
        }

        // 2. Validate required fields
        if (!title || !price || !category || !location) {
            return res.status(400).json({ success: false, error: 'Bitte füllen Sie alle Pflichtfelder aus.' });
        }

        const parsedPrice = parseInt(price, 10);
        if (isNaN(parsedPrice)) {
            return res.status(400).json({ success: false, error: 'Ungültiger Preis angegeben.' });
        }

        const negotiable = isNegotiable === 'true' || isNegotiable === true;

        // 3. Process existing images kept by user
        let retainedImages = [];
        if (existing_images) {
            if (Array.isArray(existing_images)) {
                retainedImages = existing_images;
            } else if (typeof existing_images === 'string') {
                try {
                    const parsed = JSON.parse(existing_images);
                    if (Array.isArray(parsed)) {
                        retainedImages = parsed;
                    } else {
                        retainedImages = [existing_images];
                    }
                } catch {
                    retainedImages = [existing_images];
                }
            }
        }

        // 4. Process new uploaded files
        const newUploadedUrls = [];
        if (req.files && req.files.length > 0) {
            const PORT = process.env.PORT || 5000;
            const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');

            for (const file of req.files) {
                newUploadedUrls.push(`${host}/uploads/${file.filename}`);
            }
        }

        const finalImages = [...retainedImages, ...newUploadedUrls];

        // 5. Generate slug if title changed or if slug missing
        let slug = existingListing.slug;
        if (!slug || existingListing.title !== title) {
            slug = title
                .toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        const isAdmin = req.user.role === 'ADMIN';
        const targetStatus = isAdmin ? (existingListing.status || 'APPROVED') : 'REVIEW';

        // 6. Update listing: Set status to 'REVIEW' for regular users or preserve for ADMIN
        const updateRes = await pool.query(
            `UPDATE listings
             SET title = $1,
                 slug = $2,
                 description = $3,
                 price = $4,
                 negotiable = $5,
                 location = $6,
                 condition = $7,
                 category = $8,
                 subcategory = $9,
                 images = $10,
                 status = $11,
                 reviewed_by_id = CASE WHEN $12 = TRUE THEN $13 ELSE NULL END,
                 reviewed_by_type = CASE WHEN $12 = TRUE THEN 'ADMIN' ELSE NULL END,
                 reviewed_at = CASE WHEN $12 = TRUE THEN NOW() ELSE NULL END,
                 updated_at = NOW()
             WHERE id = $14
             RETURNING *`,
            [
                title,
                slug,
                description || '',
                parsedPrice,
                negotiable,
                location,
                condition || 'Gebraucht',
                category,
                subcategory || '',
                finalImages,
                targetStatus,
                isAdmin,
                isAdmin ? userId : null,
                id
            ]
        );

        const updatedListing = updateRes.rows[0];

        // 7. Upsert listing_moderation record
        try {
            if (isAdmin) {
                await pool.query(
                    `INSERT INTO listing_moderation (
                        listing_id, ai_score, ai_decision, confidence_score, text_score, image_score, price_score, fraud_risk_score, ai_reasons, status, updated_at
                    ) VALUES (
                        $1, 99, 'APPROVE', 1.0, 99, 99, 99, 0, '["Inserat wurde von einem Administrator aktualisiert und freigegeben."]'::jsonb, 'APPROVED', NOW()
                    )
                    ON CONFLICT (listing_id) DO UPDATE SET
                        status = 'APPROVED',
                        ai_decision = 'APPROVE',
                        ai_reasons = '["Inserat wurde von einem Administrator aktualisiert und freigegeben."]'::jsonb,
                        reviewed_at = NOW(),
                        updated_at = NOW()`,
                    [id]
                );
            } else {
                await pool.query(
                    `INSERT INTO listing_moderation (
                        listing_id, ai_score, ai_decision, confidence_score, text_score, image_score, price_score, fraud_risk_score, ai_reasons, status, updated_at
                    ) VALUES (
                        $1, 50, 'MANUAL_REVIEW', 0.50, 50, 50, 50, 10, '["Inserat wurde vom Verkäufer überarbeitet und erfordert erneute Prüfung."]'::jsonb, 'PENDING', NOW()
                    )
                    ON CONFLICT (listing_id) DO UPDATE SET
                        status = 'PENDING',
                        ai_decision = 'MANUAL_REVIEW',
                        ai_reasons = '["Inserat wurde vom Verkäufer überarbeitet und erfordert erneute Prüfung."]'::jsonb,
                        admin_notes = NULL,
                        reviewed_at = NULL,
                        updated_at = NOW()`,
                    [id]
                );
            }
        } catch (modErr) {
            console.warn('Notice: listing_moderation update on listing edit:', modErr.message);
        }

        return res.status(200).json({
            success: true,
            message: isAdmin ? 'Inserat erfolgreich aktualisiert.' : 'Inserat erfolgreich aktualisiert. Es befindet sich nun zur Prüfung in der Moderation.',
            listing: {
                ...updatedListing,
                price: parseFloat(updatedListing.price) || 0,
                images: Array.isArray(updatedListing.images) ? updatedListing.images : []
            }
        });

    } catch (error) {
        console.error('❌ updateListing error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren der Anzeige.' });
    }
};

/**
 * POST /api/listings/csv-import
 * Batch imports vehicle / equipment listings from parsed CSV data.
 * Validates plan limits (or allows unlimited for Business subscribers).
 */
export const importListingsFromCsv = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { listings = [] } = req.body;

        if (!Array.isArray(listings) || listings.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Keine Inserate-Daten im CSV-Format gefunden oder Datei ist leer.',
            });
        }

        // Check user's subscription features
        const features = await getUserFeatures(userId);
        const limit = features.listing_limit; // -1 = unlimited

        // Count current active + pending listings
        const countRes = await pool.query(
            `SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND status IN ('APPROVED', 'REVIEW')`,
            [userId]
        );
        const currentActiveCount = parseInt(countRes.rows[0]?.count || 0, 10);

        if (limit !== -1 && (currentActiveCount + listings.length) > limit) {
            return res.status(403).json({
                success: false,
                error: `Das Kontingent von ${limit} Inseraten reicht nicht für ${listings.length} neue Einträge aus. Bitte upgrade auf den Campuna Business-Tarif für unbegrenzten CSV-Import.`,
                upgrade_required: true,
                current_plan: features.plan_name,
                listing_limit: limit,
            });
        }

        const insertedListings = [];
        const errors = [];

        for (let i = 0; i < listings.length; i++) {
            const item = listings[i];
            const title = String(item.title || item.Titel || '').trim();
            const priceRaw = String(item.price || item.Preis || '0').replace(/[^0-9.]/g, '');
            const parsedPrice = parseInt(priceRaw, 10) || 0;
            const category = String(item.category || item.Kategorie || 'Wohnmobile & Camper').trim();
            const subcategory = String(item.subcategory || item.Unterkategorie || '').trim();
            const location = String(item.location || item.Standort || 'Deutschland').trim();
            const description = String(item.description || item.Beschreibung || '').trim();
            const condition = String(item.condition || item.Zustand || 'Gebraucht').trim();
            const imageUrls = item.images
                ? (Array.isArray(item.images) ? item.images : String(item.images).split(';').map(s => s.trim()))
                : ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600'];

            if (!title) {
                errors.push(`Zeile ${i + 1}: Titel fehlt.`);
                continue;
            }

            const slug = title
                .toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') + `-${Date.now() % 10000}-${i}`;

            const listingId = crypto.randomUUID();

            const insertRes = await pool.query(
                `INSERT INTO listings (
                    id, user_id, title, slug, description, price, negotiable, location,
                    condition, category, subcategory, status, featured, boosted_until, images, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, 'APPROVED', false, NULL, $11, NOW(), NOW()
                ) RETURNING *`,
                [
                    listingId,
                    userId,
                    title,
                    slug,
                    description || 'Fahrzeugdetails und Ausstattung auf Anfrage beim Händler.',
                    parsedPrice,
                    location,
                    condition,
                    category,
                    subcategory,
                    imageUrls
                ]
            );

            insertedListings.push(insertRes.rows[0]);
        }

        return res.status(201).json({
            success: true,
            message: `Erfolgreich ${insertedListings.length} Inserat${insertedListings.length > 1 ? 'e' : ''} per CSV importiert!`,
            imported_count: insertedListings.length,
            listings: insertedListings,
            errors,
        });

    } catch (err) {
        console.error('❌ importListingsFromCsv error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim CSV-Import der Inserate.' });
    }
};

/**
 * GET /api/listings/export-csv
 * Exports the authenticated user's listings formatted as CSV.
 */
export const exportListingsToCsv = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const result = await pool.query(
            `SELECT id, title, category, subcategory, price, location, condition, status, created_at 
             FROM listings 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        const rows = result.rows;
        const headers = ['ID', 'Titel', 'Kategorie', 'Unterkategorie', 'Preis_EUR', 'Standort', 'Zustand', 'Status', 'Erstellt_Am'];
        const csvRows = [headers.join(';')];

        for (const r of rows) {
            const rowValues = [
                `"${r.id}"`,
                `"${(r.title || '').replace(/"/g, '""')}"`,
                `"${(r.category || '').replace(/"/g, '""')}"`,
                `"${(r.subcategory || '').replace(/"/g, '""')}"`,
                `"${r.price || 0}"`,
                `"${(r.location || '').replace(/"/g, '""')}"`,
                `"${(r.condition || '').replace(/"/g, '""')}"`,
                `"${r.status || 'REVIEW'}"`,
                `"${new Date(r.created_at).toISOString().split('T')[0]}"`,
            ];
            csvRows.push(rowValues.join(';'));
        }

        const csvString = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="campuna_inserate_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.status(200).send(csvString);

    } catch (err) {
        console.error('❌ exportListingsToCsv error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Exportieren der Inserate als CSV.' });
    }
};


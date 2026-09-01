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
        const userListings = await db.orm.public.Listing
            .where({ user_id: id })
            .all();
        const activeListings = userListings.filter(l => l.status === 'APPROVED' || l.status === 'REVIEW');
        const activeCount = activeListings.length;

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
        const listing = await db.orm.public.Listing.create({
            user_id: id,
            title,
            slug,
            description: description || '',
            price: parsedPrice,
            negotiable,
            location,
            condition: req.body.condition || 'Gebraucht',
            category,
            subcategory: subcategory || '',
            status: 'REVIEW',
            reviewed_by_type: null,
            reviewed_by_id: null,
            reviewed_at: null,
            images: imageUrls
        });

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
 * Retrieves all listings for the authenticated user.
 */
export const getMyListings = async (req, res) => {
    try {
        const { id } = req.user;

        const listings = await db.orm.public.Listing
            .where({ user_id: id })
            .all();

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
 * Retrieves all approved listings (public), including their basic seller details.
 */
export const getAllListings = async (req, res) => {
    try {
        const listings = await db.orm.public.Listing
            .where({ status: 'APPROVED' })
            .include('user')
            .all();

        const mappedListings = listings.map(l => ({
            ...l,
            seller: {
                type: l.user?.account_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                verified: true
            }
        }));

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
 * Retrieves listing detail by ID, including owner details and their profile name.
 */
export const getListingDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if query is a UUID or a title slug
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        let listing = null;
        if (uuidRegex.test(id)) {
            listing = await db.orm.public.Listing
                .where({ id })
                .include('user')
                .first();
        } else {
            listing = await db.orm.public.Listing
                .where({ slug: id })
                .include('user')
                .first();
        }

        if (!listing) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }

        // Retrieve profile details based on account type
        let profile = null;
        if (listing.user?.account_type === 'COMMERCIAL') {
            profile = await db.orm.public.CompanyProfile
                .where({ user_id: listing.user_id })
                .first();
        } else {
            profile = await db.orm.public.PrivateProfile
                .where({ user_id: listing.user_id })
                .first();
        }

        const sellerType = listing.user?.account_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat';
        const sellerName = listing.user?.account_type === 'COMMERCIAL'
            ? (profile?.company_name || 'Gewerblicher Anbieter')
            : (`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Privatverkäufer');

        const achievements = await db.orm.public.UserAchievement
            .where({ user_id: listing.user_id })
            .all();

        return res.status(200).json({
            success: true,
            listing: {
                ...listing,
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

        const listings = await db.orm.public.Listing
            .where({ user_id: userId, status: 'APPROVED' })
            .all();

        return res.status(200).json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('❌ getListingsByUser error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Anzeigen.' });
    }
};

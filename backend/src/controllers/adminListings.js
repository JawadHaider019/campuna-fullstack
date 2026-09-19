import pool from '../config/database.js';
import { checkAndAwardPioneerBadge } from './badge.js';
import { checkAndAwardReferralCreditsOnApproval } from './referral.js';

/**
 * GET /api/admin/listings
 * Lists all listings for admin moderation with filtering, search, and pagination.
 */
export const getAdminListings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = '',
            status = 'ALL',
            category = 'ALL',
            user_type = 'ALL'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
        const offset = (pageNum - 1) * limitNum;

        // Dynamic WHERE conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchParam = `%${search.trim().toLowerCase()}%`;
            params.push(searchParam);
            conditions.push(`(
                LOWER(l.title) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.description, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.location, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.category, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.subcategory, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(u.email, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.first_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.last_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(cp.company_name, '')) LIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        if (status && status !== 'ALL') {
            params.push(status);
            conditions.push(`l.status = $${paramIndex}`);
            paramIndex++;
        }

        if (category && category !== 'ALL') {
            params.push(category);
            conditions.push(`l.category = $${paramIndex}`);
            paramIndex++;
        }

        if (user_type && user_type !== 'ALL') {
            params.push(user_type);
            conditions.push(`u.user_type = $${paramIndex}`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Main Query
        const mainQuery = `
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
                l.reviewed_by_id,
                l.reviewed_by_type,
                l.reviewed_at,
                l.created_at,
                l.updated_at,
                -- Seller user data
                u.email as seller_email,
                u.user_type as seller_type,
                u.role as seller_role,
                pp.first_name as private_first_name,
                pp.last_name as private_last_name,
                pp.profile_image_url as private_avatar,
                cp.company_name,
                cp.logo_url as company_logo,
                cp.phone as company_phone,
                cp.tier as company_tier
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN l.status = 'REVIEW' THEN 1
                    WHEN l.status = 'APPROVED' THEN 2
                    WHEN l.status = 'REJECTED' THEN 3
                    ELSE 4
                END ASC,
                l.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limitNum, offset);

        // Count Query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
        `;

        // Overall Summary Stats Query
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_listings,
                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'REVIEW' THEN 1 END) as review_count,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
                COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN price ELSE 0 END), 0) as total_active_value
            FROM listings
        `;

        // Distinct Categories Query
        const categoriesQuery = `
            SELECT DISTINCT category 
            FROM listings 
            WHERE category IS NOT NULL AND category != ''
            ORDER BY category ASC
        `;

        const [listingsResult, countResult, summaryResult, categoriesResult] = await Promise.all([
            pool.query(mainQuery, params),
            pool.query(countQuery, params.slice(0, paramIndex - 1)),
            pool.query(summaryQuery),
            pool.query(categoriesQuery)
        ]);

        const totalItems = parseInt(countResult.rows[0]?.total || 0, 10);
        const totalPages = Math.ceil(totalItems / limitNum);

        // Format listings
        const formattedListings = listingsResult.rows.map(row => {
            const isCommercial = row.seller_type === 'COMMERCIAL';
            const sellerName = isCommercial
                ? (row.company_name || 'Gewerblicher Händler')
                : (`${row.private_first_name || ''} ${row.private_last_name || ''}`.trim() || 'Privatanbieter');

            const sellerAvatar = isCommercial ? row.company_logo : row.private_avatar;

            // Ensure images is always an array
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
                status: row.status || 'REVIEW',
                featured: Boolean(row.featured),
                boosted_until: row.boosted_until,
                is_boosted: Boolean(row.is_boosted),
                images: imagesArray,
                reviewed_by_id: row.reviewed_by_id,
                reviewed_by_type: row.reviewed_by_type,
                reviewed_at: row.reviewed_at,
                created_at: row.created_at,
                updated_at: row.updated_at,
                seller: {
                    name: sellerName,
                    email: row.seller_email || '',
                    type: isCommercial ? 'COMMERCIAL' : 'PRIVATE',
                    avatar: sellerAvatar || '',
                    phone: row.company_phone || '',
                    tier: row.company_tier || 'FREE'
                }
            };
        });

        const summaryRow = summaryResult.rows[0] || {};
        const availableCategories = categoriesResult.rows.map(r => r.category);

        return res.status(200).json({
            success: true,
            listings: formattedListings,
            pagination: {
                total: totalItems,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages || 1
            },
            summary: {
                totalListings: parseInt(summaryRow.total_listings || 0, 10),
                approvedCount: parseInt(summaryRow.approved_count || 0, 10),
                reviewCount: parseInt(summaryRow.review_count || 0, 10),
                rejectedCount: parseInt(summaryRow.rejected_count || 0, 10),
                draftCount: parseInt(summaryRow.draft_count || 0, 10),
                totalActiveValue: parseFloat(summaryRow.total_active_value || 0)
            },
            categories: availableCategories
        });

    } catch (error) {
        console.error('❌ getAdminListings error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Inserate.'
        });
    }
};

/**
 * PATCH /api/admin/listings/:id/status
 * Moderates a listing (APPROVED, REVIEW, REJECTED).
 */
export const updateAdminListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const validStatuses = ['APPROVED', 'REVIEW', 'REJECTED', 'DRAFT'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültiger Status angegeben. Erlaubt: APPROVED, REVIEW, REJECTED, DRAFT.'
            });
        }

        const adminId = req.user?.id || null;

        let result;
        try {
            result = await pool.query(
                `UPDATE listings
                 SET status = $1,
                     reviewed_by_id = $2,
                     reviewed_by_type = 'ADMIN',
                     reviewed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                [status, adminId, id]
            );
        } catch (dbErr) {
            console.warn('⚠️ Fallback query for updateAdminListingStatus:', dbErr.message);
            result = await pool.query(
                `UPDATE listings
                 SET status = $1,
                     reviewed_by_id = NULL,
                     reviewed_by_type = 'ADMIN',
                     reviewed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [status, id]
            );
        }

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inserat nicht gefunden.'
            });
        }

        const updatedListing = result.rows[0];

        // Sync moderation record
        try {
            await pool.query(`
                INSERT INTO listing_moderation (
                    listing_id, ai_score, ai_decision, status, admin_notes, reviewed_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (listing_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    admin_notes = EXCLUDED.admin_notes,
                    reviewed_at = NOW(),
                    updated_at = NOW()
            `, [
                id,
                status === 'APPROVED' ? 95 : 15,
                status === 'APPROVED' ? 'AUTO_APPROVED' : 'AUTO_REJECTED',
                status === 'APPROVED' ? 'APPROVED_BY_ADMIN' : 'REJECTED_BY_ADMIN',
                reason || `Status geändert auf "${status}" durch Administrator`
            ]);
        } catch (modErr) {
            // Non-critical
        }

        // If newly approved, check and potentially award Pioneer badge & referral credits to seller
        if (status === 'APPROVED' && updatedListing.user_id) {
            checkAndAwardPioneerBadge(updatedListing.user_id).catch(() => {});
            checkAndAwardReferralCreditsOnApproval(updatedListing.user_id).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `Status des Inserats erfolgreich auf "${status}" aktualisiert.`,
            listing: updatedListing
        });

    } catch (error) {
        console.error('❌ updateAdminListingStatus error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Fehler beim Aktualisieren des Inseratstatus.'
        });
    }
};

/**
 * DELETE /api/admin/listings/:id
 * Permanently deletes a listing.
 */
export const deleteAdminListing = async (req, res) => {
    try {
        const { id } = req.params;

        // Clean favorites first
        await pool.query('DELETE FROM favorites WHERE listing_id = $1', [id]).catch(() => {});

        const result = await pool.query('DELETE FROM listings WHERE id = $1 RETURNING id, title', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inserat nicht gefunden.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Inserat wurde erfolgreich gelöscht.'
        });

    } catch (error) {
        console.error('❌ deleteAdminListing error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Löschen des Inserats.'
        });
    }
};

/**
 * PATCH /api/admin/listings/:id/featured
 * Toggles a listing's featured status (Campuna recommendation).
 */
export const toggleAdminListingFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const isFeatured = Boolean(featured);

        const result = await pool.query(
            `UPDATE listings
             SET featured = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [isFeatured, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inserat nicht gefunden.'
            });
        }

        const updatedListing = result.rows[0];

        return res.status(200).json({
            success: true,
            message: isFeatured ? 'Inserat als "Empfohlen" markiert.' : 'Empfehlung entfernt.',
            listing: {
                ...updatedListing,
                featured: Boolean(updatedListing.featured),
                is_boosted: Boolean(updatedListing.boosted_until && new Date(updatedListing.boosted_until) > new Date())
            }
        });

    } catch (error) {
        console.error('❌ toggleAdminListingFeatured error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Ändern des Featured-Status.'
        });
    }
};

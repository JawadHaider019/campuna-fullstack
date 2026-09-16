import pool from '../config/database.js';
import crypto from 'crypto';

const VALID_REASONS = [
    'SCAM',
    'FALSE_INFORMATION',
    'PROHIBITED_CONTENT',
    'INAPPROPRIATE_IMAGE',
    'WRONG_CATEGORY',
    'NO_LONGER_AVAILABLE',
    'OTHER'
];

const VALID_STATUSES = ['PENDING', 'REVIEWED', 'DISMISSED'];

function parseImages(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return [raw];
        }
    }
    return [];
}

/**
 * POST /api/listings/:id/reports
 * Creates a user report for a specific listing.
 * Authenticated user only.
 */
export const createListingReport = async (req, res) => {
    try {
        const listingId = req.params.id;
        const reporterId = req.user.id;
        const { reason, description } = req.body;

        // 1. Validate reason
        if (!reason || !VALID_REASONS.includes(reason)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültiger Grund für die Meldung angegeben.'
            });
        }

        // 2. Fetch listing to ensure it exists and get seller info
        const listingRes = await pool.query(
            `SELECT id, user_id, title, status FROM listings WHERE id = $1`,
            [listingId]
        );

        if (listingRes.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Das gemeldete Inserat wurde nicht gefunden.'
            });
        }

        const listing = listingRes.rows[0];

        // 3. Prevent reporting own listing
        if (String(listing.user_id).toLowerCase() === String(reporterId).toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: 'Du kannst dein eigenes Inserat nicht melden.'
            });
        }

        // 4. Duplicate Check: User can only report a listing once
        const existingReport = await pool.query(
            `SELECT id, status, created_at FROM listing_reports WHERE listing_id = $1 AND reporter_id = $2`,
            [listingId, reporterId]
        );

        if (existingReport.rowCount > 0) {
            return res.status(409).json({
                success: false,
                error: 'Du hast dieses Inserat bereits gemeldet. Unser Moderationsteam prüft den Fall.'
            });
        }

        // 5. Insert new report
        const reportId = crypto.randomUUID();
        const insertRes = await pool.query(
            `INSERT INTO listing_reports (
                id, listing_id, reporter_id, reason, description, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
            RETURNING *`,
            [reportId, listingId, reporterId, reason, description ? description.trim() : null]
        );

        return res.status(201).json({
            success: true,
            message: 'Vielen Dank für deinen Hinweis. Unser Moderationsteam prüft dieses Angebot schnellstmöglich.',
            report: insertRes.rows[0]
        });

    } catch (error) {
        console.error('❌ createListingReport error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Übermitteln der Meldung.'
        });
    }
};

/**
 * GET /api/admin/reports
 * Retrieves paginated listing reports with filters and aggregated statistics.
 * Admin only.
 */
export const getAdminReports = async (req, res) => {
    try {
        const { status, reason, search, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let whereConditions = [];
        let params = [];

        if (status && status !== 'ALL') {
            params.push(status);
            whereConditions.push(`lr.status = $${params.length}`);
        }

        if (reason && reason !== 'ALL') {
            params.push(reason);
            whereConditions.push(`lr.reason = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            whereConditions.push(`(
                l.title ILIKE $${params.length} OR 
                lr.description ILIKE $${params.length} OR
                u_rep.email ILIKE $${params.length} OR
                u_sel.email ILIKE $${params.length} OR
                cp_s.company_name ILIKE $${params.length} OR
                pp_s.first_name ILIKE $${params.length} OR
                pp_s.last_name ILIKE $${params.length}
            )`);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                lr.id,
                lr.listing_id,
                lr.reporter_id,
                lr.reason,
                lr.description,
                lr.status,
                lr.reviewed_by_id,
                lr.reviewed_at,
                lr.admin_note,
                lr.created_at,
                lr.updated_at,
                -- Listing details
                l.title as listing_title,
                l.slug as listing_slug,
                l.price as listing_price,
                l.images as listing_images,
                l.location as listing_location,
                l.status as listing_status,
                l.user_id as seller_id,
                -- Seller details
                u_sel.email as seller_email,
                u_sel.user_type as seller_type,
                u_sel.is_suspended as seller_is_suspended,
                pp_s.first_name as seller_first_name,
                pp_s.last_name as seller_last_name,
                cp_s.company_name as seller_company_name,
                -- Reporter details
                u_rep.email as reporter_email,
                u_rep.user_type as reporter_type,
                pp_r.first_name as reporter_first_name,
                pp_r.last_name as reporter_last_name,
                cp_r.company_name as reporter_company_name,
                -- Reviewer details
                u_rev.email as reviewer_email,
                -- AI Moderation Score if available
                lm.ai_score,
                lm.ai_decision,
                lm.fraud_risk_score,
                -- Total reports on this same listing
                (SELECT COUNT(*)::int FROM listing_reports WHERE listing_id = lr.listing_id) as total_reports_for_listing
            FROM listing_reports lr
            JOIN listings l ON lr.listing_id = l.id
            JOIN users u_sel ON l.user_id = u_sel.id
            LEFT JOIN private_profiles pp_s ON u_sel.id = pp_s.user_id
            LEFT JOIN company_profiles cp_s ON u_sel.id = cp_s.user_id
            JOIN users u_rep ON lr.reporter_id = u_rep.id
            LEFT JOIN private_profiles pp_r ON u_rep.id = pp_r.user_id
            LEFT JOIN company_profiles cp_r ON u_rep.id = cp_r.user_id
            LEFT JOIN users u_rev ON lr.reviewed_by_id = u_rev.id
            LEFT JOIN listing_moderation lm ON l.id = lm.listing_id
            ${whereClause}
            ORDER BY 
                CASE WHEN lr.status = 'PENDING' THEN 1 ELSE 2 END,
                lr.created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        params.push(parseInt(limit, 10), offset);

        const result = await pool.query(query, params);

        // Fetch aggregate stats for admin badges
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
                COUNT(*) FILTER (WHERE status = 'REVIEWED')::int as reviewed,
                COUNT(*) FILTER (WHERE status = 'DISMISSED')::int as dismissed,
                COUNT(*) FILTER (WHERE reason = 'SCAM')::int as scam_count,
                COUNT(*) FILTER (WHERE reason = 'FALSE_INFORMATION')::int as false_info_count
            FROM listing_reports
        `);

        const stats = statsRes.rows[0] || {
            total: 0,
            pending: 0,
            reviewed: 0,
            dismissed: 0,
            scam_count: 0,
            false_info_count: 0
        };

        const reports = result.rows.map(row => {
            const images = parseImages(row.listing_images);
            const sellerName = row.seller_type === 'COMMERCIAL'
                ? (row.seller_company_name || 'Händler')
                : (`${row.seller_first_name || ''} ${row.seller_last_name || ''}`.trim() || row.seller_email);

            const reporterName = row.reporter_type === 'COMMERCIAL'
                ? (row.reporter_company_name || 'Händler')
                : (`${row.reporter_first_name || ''} ${row.reporter_last_name || ''}`.trim() || row.reporter_email);

            return {
                id: row.id,
                listing_id: row.listing_id,
                reporter_id: row.reporter_id,
                reason: row.reason,
                description: row.description,
                status: row.status,
                reviewed_by_id: row.reviewed_by_id,
                reviewed_at: row.reviewed_at,
                admin_note: row.admin_note,
                created_at: row.created_at,
                updated_at: row.updated_at,
                total_reports_for_listing: row.total_reports_for_listing,
                listing: {
                    id: row.listing_id,
                    title: row.listing_title,
                    slug: row.listing_slug,
                    price: parseFloat(row.listing_price) || 0,
                    location: row.listing_location || 'Deutschland',
                    main_image: images[0] || null,
                    images,
                    status: row.listing_status,
                    seller_id: row.seller_id,
                    seller_name: sellerName,
                    seller_email: row.seller_email,
                    seller_type: row.seller_type,
                    seller_is_suspended: row.seller_is_suspended,
                    ai_score: row.ai_score,
                    ai_decision: row.ai_decision,
                    fraud_risk_score: row.fraud_risk_score
                },
                reporter: {
                    id: row.reporter_id,
                    name: reporterName,
                    email: row.reporter_email,
                    type: row.reporter_type
                },
                reviewer: row.reviewed_by_id ? {
                    id: row.reviewed_by_id,
                    email: row.reviewer_email
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            reports,
            stats,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

    } catch (error) {
        console.error('❌ getAdminReports error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Meldungen.'
        });
    }
};

/**
 * GET /api/admin/reports/:id
 * Retrieves full report details including history of all reports on this listing.
 * Admin only.
 */
export const getAdminReportDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const reportRes = await pool.query(
            `SELECT lr.*, l.title as listing_title, l.slug as listing_slug, l.price, l.images, l.status as listing_status, l.user_id as seller_id
             FROM listing_reports lr
             JOIN listings l ON lr.listing_id = l.id
             WHERE lr.id = $1`,
            [id]
        );

        if (reportRes.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Meldung nicht gefunden.'
            });
        }

        const report = reportRes.rows[0];

        // Fetch other reports on the same listing
        const relatedReportsRes = await pool.query(
            `SELECT lr.id, lr.reason, lr.description, lr.status, lr.created_at, u.email as reporter_email
             FROM listing_reports lr
             JOIN users u ON lr.reporter_id = u.id
             WHERE lr.listing_id = $1 AND lr.id <> $2
             ORDER BY lr.created_at DESC`,
            [report.listing_id, id]
        );

        return res.status(200).json({
            success: true,
            report: {
                ...report,
                images: parseImages(report.images),
                other_reports: relatedReportsRes.rows
            }
        });

    } catch (error) {
        console.error('❌ getAdminReportDetail error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Meldungsdetails.'
        });
    }
};

/**
 * PATCH /api/admin/reports/:id
 * Moderates a report:
 * - Updates status to 'REVIEWED' or 'DISMISSED'
 * - Records admin note, reviewed_by, and timestamp
 * - Optionally executes listing action (e.g. deactivate/reject listing) or suspends the seller
 * Admin only.
 */
export const updateAdminReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const { status, admin_note, listing_action, suspend_seller } = req.body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültiger Status angegeben.'
            });
        }

        // 1. Fetch current report
        const reportRes = await pool.query(
            `SELECT lr.*, l.user_id as seller_id, l.title as listing_title
             FROM listing_reports lr
             JOIN listings l ON lr.listing_id = l.id
             WHERE lr.id = $1`,
            [id]
        );

        if (reportRes.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Meldung nicht gefunden.'
            });
        }

        const currentReport = reportRes.rows[0];

        // 2. Update report status
        const updateRes = await pool.query(
            `UPDATE listing_reports
             SET status = $1,
                 reviewed_by_id = $2,
                 reviewed_at = NOW(),
                 admin_note = $3,
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, adminId, admin_note ? admin_note.trim() : null, id]
        );

        const updatedReport = updateRes.rows[0];

        // 3. Optional Listing Action (e.g., Reject/Deactivate)
        if (listing_action === 'REJECT') {
            await pool.query(
                `UPDATE listings 
                 SET status = 'REJECTED', 
                     reviewed_by_type = 'ADMIN', 
                     reviewed_by_id = $1, 
                     reviewed_at = NOW(), 
                     updated_at = NOW() 
                 WHERE id = $2`,
                [adminId, currentReport.listing_id]
            );

            // Also mark all other pending reports for this listing as REVIEWED
            await pool.query(
                `UPDATE listing_reports
                 SET status = 'REVIEWED',
                     reviewed_by_id = $1,
                     reviewed_at = NOW(),
                     admin_note = COALESCE(admin_note, 'Automatisch abgeschlossen durch Inserat-Sperrung.'),
                     updated_at = NOW()
                 WHERE listing_id = $2 AND status = 'PENDING'`,
                [adminId, currentReport.listing_id]
            );
        } else if (listing_action === 'APPROVE') {
            await pool.query(
                `UPDATE listings 
                 SET status = 'APPROVED', 
                     reviewed_by_type = 'ADMIN', 
                     reviewed_by_id = $1, 
                     reviewed_at = NOW(), 
                     updated_at = NOW() 
                 WHERE id = $2`,
                [adminId, currentReport.listing_id]
            );
        }

        // 4. Optional Seller Action (Suspend account)
        if (suspend_seller === true && currentReport.seller_id) {
            await pool.query(
                `UPDATE users SET is_suspended = true, updated_at = NOW() WHERE id = $1`,
                [currentReport.seller_id]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Meldung erfolgreich bearbeitet.',
            report: updatedReport
        });

    } catch (error) {
        console.error('❌ updateAdminReportStatus error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Aktualisieren der Meldung.'
        });
    }
};

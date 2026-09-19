import pool from '../config/database.js';
import { checkAndAwardPioneerBadge } from './badge.js';
import { checkAndAwardReferralCreditsOnApproval } from './referral.js';

/**
 * GET /api/admin/decisions
 * Lists all AI moderation decisions for listings with filtering and stats.
 */
export const getAdminDecisions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            filter = 'ALL', // 'ALL', 'MANUAL_REVIEW', 'AUTO_APPROVED', 'AUTO_REJECTED', 'PENDING'
            search = ''
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchParam = `%${search.trim().toLowerCase()}%`;
            params.push(searchParam);
            conditions.push(`(
                LOWER(l.title) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.location, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(l.category, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(u.email, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.first_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.last_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(cp.company_name, '')) LIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        if (filter === 'MANUAL_REVIEW') {
            // Only listings that are genuinely pending manual review (not yet approved or rejected)
            conditions.push(`(
                l.status NOT IN ('APPROVED', 'REJECTED')
                AND COALESCE(m.status, 'PENDING') NOT IN ('APPROVED', 'APPROVED_BY_ADMIN', 'REJECTED', 'REJECTED_BY_ADMIN')
                AND (
                    l.status = 'REVIEW'
                    OR COALESCE(m.status, 'PENDING') = 'PENDING'
                    OR m.ai_decision = 'MANUAL_REVIEW'
                    OR (m.ai_score >= 31 AND m.ai_score < 75)
                )
            )`);
        } else if (filter === 'AUTO_APPROVED' || filter === 'APPROVED') {
            // All approved listings (both AI auto-approved and manually approved by admin)
            conditions.push(`(
                l.status = 'APPROVED'
                OR COALESCE(m.status, '') IN ('APPROVED', 'APPROVED_BY_ADMIN')
                OR (l.status NOT IN ('REJECTED', 'REVIEW') AND (m.ai_decision = 'AUTO_APPROVED' OR m.ai_score >= 75))
            )`);
        } else if (filter === 'AUTO_REJECTED' || filter === 'REJECTED') {
            // All rejected listings (both AI auto-rejected and manually rejected by admin)
            conditions.push(`(
                l.status = 'REJECTED'
                OR COALESCE(m.status, '') IN ('REJECTED', 'REJECTED_BY_ADMIN')
                OR (l.status != 'APPROVED' AND (m.ai_decision = 'AUTO_REJECTED' OR m.ai_score <= 30))
            )`);
        } else if (filter === 'PENDING') {
            conditions.push(`(
                l.status NOT IN ('APPROVED', 'REJECTED')
                AND COALESCE(m.status, 'PENDING') = 'PENDING'
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Query combining listings and AI moderation decisions
        const mainQuery = `
            SELECT 
                l.id as listing_id,
                l.title,
                l.price,
                l.negotiable,
                l.location,
                l.condition,
                l.category,
                l.subcategory,
                l.status as listing_status,
                l.images,
                l.created_at,
                -- Moderation decision data
                m.id as moderation_id,
                COALESCE(m.ai_score, 50) as ai_score,
                COALESCE(m.ai_decision, 'MANUAL_REVIEW') as ai_decision,
                COALESCE(m.confidence_score, 0.50) as confidence_score,
                COALESCE(m.text_score, 50) as text_score,
                COALESCE(m.image_score, 50) as image_score,
                COALESCE(m.price_score, 50) as price_score,
                COALESCE(m.fraud_risk_score, 15) as fraud_risk_score,
                COALESCE(m.ai_reasons, '[]'::jsonb) as ai_reasons,
                COALESCE(m.status, 'PENDING') as moderation_status,
                m.admin_notes,
                m.reviewed_at,
                -- Seller information
                u.id as seller_id,
                u.email as seller_email,
                u.user_type as seller_type,
                pp.first_name as private_first_name,
                pp.last_name as private_last_name,
                pp.profile_image_url as private_avatar,
                cp.company_name,
                cp.logo_url as company_logo
            FROM listings l
            LEFT JOIN listing_moderation m ON l.id = m.listing_id
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN l.status NOT IN ('APPROVED', 'REJECTED') AND (m.status = 'PENDING' OR m.ai_decision = 'MANUAL_REVIEW' OR l.status = 'REVIEW') THEN 1
                    ELSE 2
                END ASC,
                l.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limitNum, offset);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM listings l
            LEFT JOIN listing_moderation m ON l.id = m.listing_id
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
        `;

        // Stats Query
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_processed,
                COUNT(CASE WHEN (
                    l.status NOT IN ('APPROVED', 'REJECTED')
                    AND COALESCE(m.status, 'PENDING') NOT IN ('APPROVED', 'APPROVED_BY_ADMIN', 'REJECTED', 'REJECTED_BY_ADMIN')
                    AND (
                        l.status = 'REVIEW'
                        OR COALESCE(m.status, 'PENDING') = 'PENDING'
                        OR m.ai_decision = 'MANUAL_REVIEW'
                        OR (m.ai_score >= 31 AND m.ai_score < 75)
                    )
                ) THEN 1 END) as manual_review_count,
                COUNT(CASE WHEN (
                    l.status = 'APPROVED'
                    OR COALESCE(m.status, '') IN ('APPROVED', 'APPROVED_BY_ADMIN')
                    OR (l.status NOT IN ('REJECTED', 'REVIEW') AND (m.ai_decision = 'AUTO_APPROVED' OR m.ai_score >= 75))
                ) THEN 1 END) as auto_approved_count,
                COUNT(CASE WHEN (
                    l.status = 'REJECTED'
                    OR COALESCE(m.status, '') IN ('REJECTED', 'REJECTED_BY_ADMIN')
                    OR (l.status != 'APPROVED' AND (m.ai_decision = 'AUTO_REJECTED' OR m.ai_score <= 30))
                ) THEN 1 END) as auto_rejected_count,
                COALESCE(AVG(m.ai_score), 50) as avg_score
            FROM listings l
            LEFT JOIN listing_moderation m ON l.id = m.listing_id
        `;

        const [results, countRes, summaryRes] = await Promise.all([
            pool.query(mainQuery, params),
            pool.query(countQuery, params.slice(0, paramIndex - 1)),
            pool.query(summaryQuery)
        ]);

        const totalItems = parseInt(countRes.rows[0]?.total || 0, 10);
        const totalPages = Math.ceil(totalItems / limitNum);

        const items = results.rows.map(row => {
            const isCommercial = row.seller_type === 'COMMERCIAL';
            const sellerName = isCommercial
                ? (row.company_name || 'Gewerblicher Händler')
                : (`${row.private_first_name || ''} ${row.private_last_name || ''}`.trim() || 'Privatanbieter');

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

            let reasonsArray = [];
            if (Array.isArray(row.ai_reasons)) {
                reasonsArray = row.ai_reasons;
            } else if (typeof row.ai_reasons === 'string') {
                try {
                    reasonsArray = JSON.parse(row.ai_reasons);
                } catch {
                    reasonsArray = [row.ai_reasons];
                }
            }

            return {
                id: row.listing_id,
                moderation_id: row.moderation_id,
                title: row.title,
                price: parseFloat(row.price) || 0,
                negotiable: Boolean(row.negotiable),
                location: row.location || 'Deutschland',
                condition: row.condition || 'Gebraucht',
                category: row.category || 'Allgemein',
                subcategory: row.subcategory || '',
                listing_status: row.listing_status,
                images: imagesArray,
                created_at: row.created_at,
                ai: {
                    score: parseInt(row.ai_score, 10),
                    decision: row.ai_decision,
                    confidence: parseFloat(row.confidence_score) || 0.5,
                    text_score: parseInt(row.text_score, 10),
                    image_score: parseInt(row.image_score, 10),
                    price_score: parseInt(row.price_score, 10),
                    fraud_risk_score: parseInt(row.fraud_risk_score, 10),
                    reasons: reasonsArray,
                    moderation_status: row.moderation_status,
                    admin_notes: row.admin_notes || '',
                    reviewed_at: row.reviewed_at
                },
                seller: {
                    id: row.seller_id,
                    name: sellerName,
                    email: row.seller_email,
                    type: isCommercial ? 'COMMERCIAL' : 'PRIVATE',
                    avatar: isCommercial ? row.company_logo : row.private_avatar
                }
            };
        });

        const summaryRow = summaryRes.rows[0] || {};

        return res.status(200).json({
            success: true,
            decisions: items,
            pagination: {
                total: totalItems,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages || 1
            },
            summary: {
                totalProcessed: parseInt(summaryRow.total_processed || 0, 10),
                manualReviewCount: parseInt(summaryRow.manual_review_count || 0, 10),
                autoApprovedCount: parseInt(summaryRow.auto_approved_count || 0, 10),
                autoRejectedCount: parseInt(summaryRow.auto_rejected_count || 10),
                avgScore: Math.round(parseFloat(summaryRow.avg_score || 50))
            }
        });

    } catch (error) {
        console.error('❌ getAdminDecisions error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der KI-Entscheidungen.'
        });
    }
};

/**
 * POST /api/admin/decisions/:id/simulate-scan
 * Simulates a new AI analysis with customizable or randomized score breakdown.
 */
export const simulateAiScan = async (req, res) => {
    try {
        const { id } = req.params;
        const { target_score } = req.body;

        // Check if listing exists
        const listingRes = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
        if (listingRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }
        const listing = listingRes.rows[0];

        // Determine score (either target provided, or generated)
        let score = target_score !== undefined ? parseInt(target_score, 10) : 50;
        if (isNaN(score)) score = 50;

        let decision = 'MANUAL_REVIEW';
        let confidence = 0.50;
        let textScore = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10 - 5)));
        let imageScore = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 12 - 6)));
        let priceScore = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 8 - 4)));
        let fraudRisk = Math.max(0, 100 - score);
        let reasons = [];
        let newListingStatus = listing.status;

        if (score >= 75) {
            decision = 'AUTO_APPROVED';
            confidence = 0.95;
            newListingStatus = 'APPROVED';
            reasons = [
                `Hohe Konformität festgestellt (Gesamtscore ${score}/100)`,
                'Textbeschreibung ist detailliert, präzise und frei von verbotenen Begriffen',
                'Produktbilder sind klar, authentisch und weisen keine Duplikate auf',
                'Preis liegt im optimalen Marktdurchschnitt der Kategorie'
            ];
        } else if (score <= 30) {
            decision = 'AUTO_REJECTED';
            confidence = 0.92;
            newListingStatus = 'REJECTED';
            reasons = [
                `Kritische Auffälligkeiten erkannt (Gesamtscore ${score}/100)`,
                'Möglicher Spam- oder unvollständiger Textaufbau erkannt',
                'Bildauflösung unzureichend oder Verstoß gegen Inhaltsrichtlinien',
                'Auffällige Preisabweichung zum Marktwert (> 70% Differenz)'
            ];
        } else {
            // Score around 50 -> Needs Manual Admin Review!
            decision = 'MANUAL_REVIEW';
            confidence = 0.50;
            newListingStatus = 'REVIEW';
            reasons = [
                `Score ${score}/100: Borderline-Einstufung – Weder klare Freigabe noch Ablehnung möglich`,
                'Bildqualität akzeptabel, aber fehlende Detailaufnahmen',
                'Preis weicht leicht vom Durchschnitt ab – Plausibilität unklar',
                '👉 Manuelle Prüfung und finale Freigabe durch Administrator erforderlich'
            ];
        }

        // Upsert into listing_moderation
        const upsertRes = await pool.query(`
            INSERT INTO listing_moderation (
                listing_id, ai_score, ai_decision, confidence_score,
                text_score, image_score, price_score, fraud_risk_score,
                ai_reasons, status, reviewed_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ON CONFLICT (listing_id) DO UPDATE SET
                ai_score = EXCLUDED.ai_score,
                ai_decision = EXCLUDED.ai_decision,
                confidence_score = EXCLUDED.confidence_score,
                text_score = EXCLUDED.text_score,
                image_score = EXCLUDED.image_score,
                price_score = EXCLUDED.price_score,
                fraud_risk_score = EXCLUDED.fraud_risk_score,
                ai_reasons = EXCLUDED.ai_reasons,
                status = EXCLUDED.status,
                reviewed_at = NOW(),
                updated_at = NOW()
            RETURNING *
        `, [
            id,
            score,
            decision,
            confidence,
            textScore,
            imageScore,
            priceScore,
            fraudRisk,
            JSON.stringify(reasons),
            decision === 'MANUAL_REVIEW' ? 'PENDING' : 'AUTO_RESOLVED'
        ]);

        // Sync status back to listing
        await pool.query('UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2', [newListingStatus, id]);

        if (newListingStatus === 'APPROVED' && listing.user_id) {
            checkAndAwardPioneerBadge(listing.user_id).catch(() => {});
            checkAndAwardReferralCreditsOnApproval(listing.user_id).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `KI-Simulation abgeschlossen (Score: ${score}/100 -> ${decision})`,
            moderation: upsertRes.rows[0],
            listing_status: newListingStatus
        });

    } catch (error) {
        console.error('❌ simulateAiScan error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler bei der KI-Simulation.'
        });
    }
};

/**
 * POST /api/admin/decisions/:id/admin-decision
 * Allows admin to give final manual approval or rejection (for Score 50 borderline listings).
 */
export const submitAdminManualDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, notes } = req.body; // decision: 'APPROVED' | 'REJECTED'

        if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültige Entscheidung. Erlaubt: APPROVED oder REJECTED.'
            });
        }

        const adminId = req.user?.id || null;
        const moderationStatus = decision === 'APPROVED' ? 'APPROVED_BY_ADMIN' : 'REJECTED_BY_ADMIN';

        // 1. Update listing with fallback for foreign key constraint
        let listingRes;
        try {
            listingRes = await pool.query(
                `UPDATE listings
                 SET status = $1,
                     reviewed_by_id = $2,
                     reviewed_by_type = 'ADMIN',
                     reviewed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                [decision, adminId, id]
            );
        } catch (fkErr) {
            console.warn('⚠️ Fallback query for submitAdminManualDecision:', fkErr.message);
            listingRes = await pool.query(
                `UPDATE listings
                 SET status = $1,
                     reviewed_by_id = NULL,
                     reviewed_by_type = 'ADMIN',
                     reviewed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [decision, id]
            );
        }

        if (listingRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
        }

        const listing = listingRes.rows[0];

        // 2. Update moderation log (upsert)
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
                decision === 'APPROVED' ? 95 : 15,
                decision === 'APPROVED' ? 'AUTO_APPROVED' : 'AUTO_REJECTED',
                moderationStatus,
                notes || `Manuell ${decision === 'APPROVED' ? 'freigegeben' : 'abgelehnt'} durch Admin`
            ]);
        } catch (modErr) {
            console.warn('Notice: listing_moderation update:', modErr.message);
        }

        if (decision === 'APPROVED' && listing.user_id) {
            checkAndAwardPioneerBadge(listing.user_id).catch(() => {});
            checkAndAwardReferralCreditsOnApproval(listing.user_id).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `Inserat wurde durch Administrator erfolgreich ${decision === 'APPROVED' ? 'freigegeben' : 'abgelehnt'}.`,
            listing
        });

    } catch (error) {
        console.error('❌ submitAdminManualDecision error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Fehler beim Speichern der Admin-Entscheidung.'
        });
    }
};

import pool from '../config/database.js';
import crypto from 'crypto';
import { emitNewFeedback, emitFeedbackReply } from '../socket.js';

const VALID_CATEGORIES = ['GENERAL', 'FEATURE', 'SUPPORT', 'ISSUE', 'COMMERCIAL'];
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'REPLIED', 'RESOLVED'];

// ─────────────────────────────────────────────────────────────────────────────
// USER CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/feedback
 * Submit a feedback or direct inquiry to Campuna Admin from account dashboard.
 */
export const submitUserFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category = 'GENERAL', subject, message } = req.body;

        if (!subject || !subject.trim() || !message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Betreff und Nachricht dürfen nicht leer sein.'
            });
        }

        const validCategory = VALID_CATEGORIES.includes(category) ? category : 'GENERAL';
        const feedbackId = crypto.randomUUID();

        const insertRes = await pool.query(`
            INSERT INTO user_feedback (id, user_id, category, subject, message, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'OPEN', NOW(), NOW())
            RETURNING *
        `, [
            feedbackId,
            userId,
            validCategory,
            subject.trim(),
            message.trim()
        ]);

        const feedback = insertRes.rows[0];

        // Fetch user information for real-time notification
        const userRes = await pool.query(`
            SELECT 
                u.id, u.email, u.user_type,
                pp.first_name, pp.last_name, pp.profile_image_url as private_avatar,
                cp.company_name, cp.logo_url as company_logo
            FROM users u
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            WHERE u.id = $1
        `, [userId]);

        const userRow = userRes.rows[0] || {};
        const isCommercial = userRow.user_type === 'COMMERCIAL';
        const userName = isCommercial
            ? (userRow.company_name || 'Gewerblicher Partner')
            : (`${userRow.first_name || ''} ${userRow.last_name || ''}`.trim() || userRow.email?.split('@')[0] || 'Camper');

        const broadcastPayload = {
            ...feedback,
            user_name: userName,
            user_email: userRow.email,
            user_type: userRow.user_type,
            user_avatar: isCommercial ? userRow.company_logo : userRow.private_avatar
        };

        try {
            emitNewFeedback(broadcastPayload);
        } catch (socketErr) {
            console.warn('Socket feedback emit error:', socketErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Vielen Dank für dein Feedback! Das Campuna-Team wird sich schnellstmöglich bei dir melden.',
            feedback: broadcastPayload
        });

    } catch (error) {
        console.error('❌ submitUserFeedback error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Übermitteln deines Feedbacks.' });
    }
};

/**
 * GET /api/feedback
 * Returns list of user's own submitted feedbacks with replies summary.
 */
export const getUserFeedbackList = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                f.id,
                f.category,
                f.subject,
                f.message,
                f.status,
                f.created_at,
                f.updated_at,
                COALESCE(r_count.count, 0)::int as replies_count,
                COALESCE(unread.count, 0)::int as unread_replies_count,
                lm.message as last_reply_content,
                lm.sender_role as last_reply_role,
                lm.created_at as last_reply_at
            FROM user_feedback f
            LEFT JOIN (
                SELECT feedback_id, COUNT(*) as count
                FROM user_feedback_replies
                GROUP BY feedback_id
            ) r_count ON f.id = r_count.feedback_id
            LEFT JOIN (
                SELECT feedback_id, COUNT(*) as count
                FROM user_feedback_replies
                WHERE sender_role = 'ADMIN' AND is_read = false
                GROUP BY feedback_id
            ) unread ON f.id = unread.feedback_id
            LEFT JOIN LATERAL (
                SELECT message, sender_role, created_at
                FROM user_feedback_replies
                WHERE feedback_id = f.id
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            WHERE f.user_id = $1
            ORDER BY f.updated_at DESC
        `;

        const result = await pool.query(query, [userId]);

        return res.status(200).json({
            success: true,
            feedbacks: result.rows
        });

    } catch (error) {
        console.error('❌ getUserFeedbackList error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden deiner Feedback-Nachrichten.' });
    }
};

/**
 * GET /api/feedback/:id
 * Retrieve details of a specific feedback and all conversation replies.
 * Automatically marks unread admin replies as read for the user.
 */
export const getUserFeedbackDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const fbRes = await pool.query(`
            SELECT * FROM user_feedback 
            WHERE id = $1 AND user_id = $2
        `, [id, userId]);

        if (fbRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Feedback-Eintrag nicht gefunden.' });
        }

        const feedback = fbRes.rows[0];

        // Mark admin replies as read
        await pool.query(`
            UPDATE user_feedback_replies
            SET is_read = true
            WHERE feedback_id = $1 AND sender_role = 'ADMIN' AND is_read = false
        `, [id]);

        // Fetch replies
        const repliesRes = await pool.query(`
            SELECT 
                r.id,
                r.feedback_id,
                r.sender_id,
                r.sender_role,
                r.message,
                r.is_read,
                r.created_at
            FROM user_feedback_replies r
            WHERE r.feedback_id = $1
            ORDER BY r.created_at ASC
        `, [id]);

        return res.status(200).json({
            success: true,
            feedback,
            replies: repliesRes.rows
        });

    } catch (error) {
        console.error('❌ getUserFeedbackDetail error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Feedback-Details.' });
    }
};

/**
 * POST /api/feedback/:id/reply
 * User responds to an ongoing feedback thread.
 */
export const replyToFeedbackUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Die Antwort darf nicht leer sein.' });
        }

        // Verify feedback ownership
        const fbRes = await pool.query(`
            SELECT id, status, subject FROM user_feedback 
            WHERE id = $1 AND user_id = $2
        `, [id, userId]);

        if (fbRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Feedback-Eintrag nicht gefunden.' });
        }

        const replyId = crypto.randomUUID();
        const replyRes = await pool.query(`
            INSERT INTO user_feedback_replies (id, feedback_id, sender_id, sender_role, message, is_read, created_at)
            VALUES ($1, $2, $3, 'USER', $4, false, NOW())
            RETURNING *
        `, [replyId, id, userId, message.trim()]);

        const newReply = replyRes.rows[0];

        // Update feedback status to OPEN and updated_at
        await pool.query(`
            UPDATE user_feedback 
            SET status = 'OPEN', updated_at = NOW() 
            WHERE id = $1
        `, [id]);

        try {
            emitFeedbackReply({
                feedbackId: id,
                reply: newReply,
                recipientUserId: null,
                senderRole: 'USER'
            });
        } catch (socketErr) {
            console.warn('Socket feedback reply emit error:', socketErr.message);
        }

        return res.status(201).json({
            success: true,
            reply: newReply
        });

    } catch (error) {
        console.error('❌ replyToFeedbackUser error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Senden der Antwort.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/feedback
 * Returns list of all user feedback items with search, filters, pagination and summary.
 */
export const getAdminFeedbackList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = 'ALL',
            category = 'ALL',
            user_type = 'ALL'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchParam = `%${search.trim().toLowerCase()}%`;
            params.push(searchParam);
            conditions.push(`(
                LOWER(f.subject) LIKE $${paramIndex} OR
                LOWER(f.message) LIKE $${paramIndex} OR
                LOWER(u.email) LIKE $${paramIndex} OR
                LOWER(COALESCE(cp.company_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.first_name || ' ' || pp.last_name, '')) LIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        if (status && status !== 'ALL' && VALID_STATUSES.includes(status)) {
            params.push(status);
            conditions.push(`f.status = $${paramIndex}`);
            paramIndex++;
        }

        if (category && category !== 'ALL' && VALID_CATEGORIES.includes(category)) {
            params.push(category);
            conditions.push(`f.category = $${paramIndex}`);
            paramIndex++;
        }

        if (user_type && user_type !== 'ALL') {
            params.push(user_type);
            conditions.push(`u.user_type = $${paramIndex}`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const mainQuery = `
            SELECT 
                f.id,
                f.user_id,
                f.category,
                f.subject,
                f.message,
                f.status,
                COALESCE(f.is_favorite, false) as is_favorite,
                COALESCE(f.priority, 'MEDIUM') as priority,
                f.admin_note,
                f.created_at,
                f.updated_at,
                u.email as user_email,
                u.user_type,
                u.email_verified,
                u.is_suspended,
                pp.first_name,
                pp.last_name,
                pp.profile_image_url as private_avatar,
                cp.company_name,
                cp.logo_url as company_logo,
                cp.tier as company_tier,
                COALESCE(r_count.count, 0)::int as replies_count,
                COALESCE(unread.count, 0)::int as unread_user_replies_count,
                COALESCE(l_count.count, 0)::int as user_listings_count,
                lm.message as last_reply_content,
                lm.sender_role as last_reply_role,
                lm.created_at as last_reply_at
            FROM user_feedback f
            JOIN users u ON f.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            LEFT JOIN (
                SELECT feedback_id, COUNT(*) as count
                FROM user_feedback_replies
                GROUP BY feedback_id
            ) r_count ON f.id = r_count.feedback_id
            LEFT JOIN (
                SELECT feedback_id, COUNT(*) as count
                FROM user_feedback_replies
                WHERE sender_role = 'USER' AND is_read = false
                GROUP BY feedback_id
            ) unread ON f.id = unread.feedback_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as count
                FROM listings
                GROUP BY user_id
            ) l_count ON f.user_id = l_count.user_id
            LEFT JOIN LATERAL (
                SELECT message, sender_role, created_at
                FROM user_feedback_replies
                WHERE feedback_id = f.id
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            ${whereClause}
            ORDER BY 
                CASE WHEN f.status = 'OPEN' THEN 1 WHEN f.status = 'IN_PROGRESS' THEN 2 WHEN f.status = 'REPLIED' THEN 3 ELSE 4 END ASC,
                f.updated_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limitNum, offset);

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM user_feedback f
            JOIN users u ON f.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
        `;

        const summaryQuery = `
            SELECT 
                COUNT(*)::int as total_feedback,
                COUNT(CASE WHEN status = 'OPEN' THEN 1 END)::int as open_count,
                COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as in_progress_count,
                COUNT(CASE WHEN status = 'REPLIED' THEN 1 END)::int as replied_count,
                COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END)::int as resolved_count
            FROM user_feedback
        `;

        const [itemsResult, countResult, summaryResult] = await Promise.all([
            pool.query(mainQuery, params),
            pool.query(countQuery, params.slice(0, paramIndex - 1)),
            pool.query(summaryQuery)
        ]);

        const total = countResult.rows[0]?.total || 0;
        const totalPages = Math.ceil(total / limitNum) || 1;

        const formattedFeedbacks = itemsResult.rows.map(row => {
            const isCommercial = row.user_type === 'COMMERCIAL';
            const userName = isCommercial
                ? (row.company_name || 'Gewerblicher Partner')
                : (`${row.first_name || ''} ${row.last_name || ''}`.trim() || row.user_email?.split('@')[0] || 'Privatnutzer');

            return {
                id: row.id,
                user_id: row.user_id,
                category: row.category,
                subject: row.subject,
                message: row.message,
                status: row.status,
                admin_note: row.admin_note,
                created_at: row.created_at,
                updated_at: row.updated_at,
                replies_count: row.replies_count,
                unread_user_replies_count: row.unread_user_replies_count,
                user: {
                    id: row.user_id,
                    name: userName,
                    email: row.user_email,
                    user_type: row.user_type,
                    avatar: isCommercial ? row.company_logo : row.private_avatar,
                    tier: row.company_tier || (isCommercial ? 'FREE' : 'PRIVATE'),
                    email_verified: Boolean(row.email_verified),
                    is_suspended: Boolean(row.is_suspended),
                    listings_count: row.user_listings_count
                },
                last_reply: row.last_reply_content ? {
                    content: row.last_reply_content,
                    role: row.last_reply_role,
                    created_at: row.last_reply_at
                } : null
            };
        });

        const summary = summaryResult.rows[0] || {
            total_feedback: 0,
            open_count: 0,
            in_progress_count: 0,
            replied_count: 0,
            resolved_count: 0
        };

        return res.status(200).json({
            success: true,
            feedbacks: formattedFeedbacks,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages
            },
            summary
        });

    } catch (error) {
        console.error('❌ getAdminFeedbackList error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Abrufen der Feedback-Liste.' });
    }
};

/**
 * GET /api/admin/feedback/:id
 * Retrieve feedback details, full user profile and message thread for admin.
 * Marks user replies as read.
 */
export const getAdminFeedbackDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const fbRes = await pool.query(`
            SELECT 
                f.id,
                f.user_id,
                f.category,
                f.subject,
                f.message,
                f.status,
                f.admin_note,
                f.created_at,
                f.updated_at,
                u.email as user_email,
                u.user_type,
                u.email_verified,
                u.is_suspended,
                u.created_at as user_created_at,
                pp.first_name,
                pp.last_name,
                pp.phone as private_phone,
                pp.location as private_location,
                pp.profile_image_url as private_avatar,
                cp.company_name,
                cp.phone as company_phone,
                cp.location as company_location,
                cp.logo_url as company_logo,
                cp.tier as company_tier,
                cp.is_strategic_partner
            FROM user_feedback f
            JOIN users u ON f.user_id = u.id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            WHERE f.id = $1
        `, [id]);

        if (fbRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Feedback-Eintrag nicht gefunden.' });
        }

        const row = fbRes.rows[0];
        const isCommercial = row.user_type === 'COMMERCIAL';
        const userName = isCommercial
            ? (row.company_name || 'Gewerblicher Partner')
            : (`${row.first_name || ''} ${row.last_name || ''}`.trim() || row.user_email?.split('@')[0] || 'Privatnutzer');

        // Mark unread user replies as read for admin
        await pool.query(`
            UPDATE user_feedback_replies
            SET is_read = true
            WHERE feedback_id = $1 AND sender_role = 'USER' AND is_read = false
        `, [id]);

        // Fetch replies
        const repliesRes = await pool.query(`
            SELECT 
                r.id,
                r.feedback_id,
                r.sender_id,
                r.sender_role,
                r.message,
                r.is_read,
                r.created_at
            FROM user_feedback_replies r
            WHERE r.feedback_id = $1
            ORDER BY r.created_at ASC
        `, [id]);

        // Fetch user's active listings count
        const listCountRes = await pool.query(`
            SELECT COUNT(*)::int as count FROM listings WHERE user_id = $1
        `, [row.user_id]);

        return res.status(200).json({
            success: true,
            feedback: {
                id: row.id,
                user_id: row.user_id,
                category: row.category,
                subject: row.subject,
                message: row.message,
                status: row.status,
                admin_note: row.admin_note,
                created_at: row.created_at,
                updated_at: row.updated_at,
                user: {
                    id: row.user_id,
                    name: userName,
                    email: row.user_email,
                    user_type: row.user_type,
                    phone: isCommercial ? row.company_phone : row.private_phone,
                    location: isCommercial ? row.company_location : row.private_location,
                    avatar: isCommercial ? row.company_logo : row.private_avatar,
                    tier: row.company_tier || (isCommercial ? 'FREE' : 'PRIVATE'),
                    is_strategic_partner: Boolean(row.is_strategic_partner),
                    email_verified: Boolean(row.email_verified),
                    is_suspended: Boolean(row.is_suspended),
                    created_at: row.user_created_at,
                    listings_count: listCountRes.rows[0]?.count || 0
                }
            },
            replies: repliesRes.rows
        });

    } catch (error) {
        console.error('❌ getAdminFeedbackDetail error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Feedback-Details.' });
    }
};

/**
 * POST /api/admin/feedback/:id/reply
 * Admin replies to a user's feedback ticket.
 */
export const replyToFeedbackAdmin = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { message, status = 'REPLIED' } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Die Antwort darf nicht leer sein.' });
        }

        const fbRes = await pool.query('SELECT * FROM user_feedback WHERE id = $1', [id]);
        if (fbRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Feedback-Eintrag nicht gefunden.' });
        }

        const feedback = fbRes.rows[0];
        const newStatus = VALID_STATUSES.includes(status) ? status : 'REPLIED';

        const replyId = crypto.randomUUID();
        const replyRes = await pool.query(`
            INSERT INTO user_feedback_replies (id, feedback_id, sender_id, sender_role, message, is_read, created_at)
            VALUES ($1, $2, $3, 'ADMIN', $4, false, NOW())
            RETURNING *
        `, [replyId, id, adminId, message.trim()]);

        const newReply = replyRes.rows[0];

        // Update feedback status and updated_at timestamp
        await pool.query(`
            UPDATE user_feedback 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2
        `, [newStatus, id]);

        // Realtime notification to user
        try {
            emitFeedbackReply({
                feedbackId: id,
                reply: newReply,
                recipientUserId: feedback.user_id,
                senderRole: 'ADMIN'
            });
        } catch (socketErr) {
            console.warn('Socket feedback admin reply error:', socketErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Antwort erfolgreich übermittelt.',
            reply: newReply,
            status: newStatus
        });

    } catch (error) {
        console.error('❌ replyToFeedbackAdmin error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Senden der Admin-Antwort.' });
    }
};

/**
 * PATCH /api/admin/feedback/:id/status
 * Update status or admin note of a feedback ticket.
 */
export const updateAdminFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note, is_favorite, priority } = req.body;

        const fbRes = await pool.query('SELECT * FROM user_feedback WHERE id = $1', [id]);
        if (fbRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Feedback-Eintrag nicht gefunden.' });
        }

        const existing = fbRes.rows[0];
        const newStatus = status && VALID_STATUSES.includes(status) ? status : existing.status;
        const newNote = admin_note !== undefined ? (admin_note ? admin_note.trim() : null) : existing.admin_note;
        const newFavorite = typeof is_favorite === 'boolean' ? is_favorite : (existing.is_favorite ?? false);
        const newPriority = ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : (existing.priority || 'MEDIUM');

        const updateRes = await pool.query(`
            UPDATE user_feedback
            SET status = $1, admin_note = $2, is_favorite = $3, priority = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `, [newStatus, newNote, newFavorite, newPriority, id]);

        return res.status(200).json({
            success: true,
            message: 'Feedback-Status erfolgreich aktualisiert.',
            feedback: updateRes.rows[0]
        });

    } catch (error) {
        console.error('❌ updateAdminFeedbackStatus error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren des Status.' });
    }
};

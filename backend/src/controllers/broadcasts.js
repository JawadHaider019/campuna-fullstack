import pool from '../config/database.js';
import crypto from 'crypto';

const VALID_TARGET_TYPES = ['ALL', 'PRIVATE', 'COMMERCIAL'];
const VALID_PRIORITIES = ['NORMAL', 'IMPORTANT', 'URGENT'];

// ─────────────────────────────────────────────────────────────────────────────
// USER CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/broadcasts
 * Returns all active broadcasts targeted to the current user (or public if unauthenticated).
 * Includes read status (is_read: boolean) per broadcast.
 */
export const getUserBroadcasts = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        const userType = req.user?.user_type || 'PRIVATE';

        let query;
        let params;

        if (userId) {
            query = `
                SELECT 
                    b.id,
                    b.title,
                    b.content,
                    b.target_type,
                    b.priority,
                    b.action_url,
                    b.action_label,
                    b.is_active,
                    b.published_at,
                    b.expires_at,
                    b.created_at,
                    (br.read_at IS NOT NULL) AS is_read,
                    br.read_at
                FROM broadcasts b
                LEFT JOIN broadcast_reads br 
                    ON b.id = br.broadcast_id AND br.user_id = $1
                WHERE b.is_active = TRUE
                  AND b.published_at <= NOW()
                  AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  AND (b.target_type = 'ALL' OR b.target_type = $2)
                ORDER BY 
                    CASE 
                        WHEN b.priority = 'URGENT' THEN 1 
                        WHEN b.priority = 'IMPORTANT' THEN 2 
                        ELSE 3 
                    END ASC,
                    b.published_at DESC
            `;
            params = [userId, userType];
        } else {
            // Unauthenticated visitor: Only general 'ALL' public broadcasts
            query = `
                SELECT 
                    b.id,
                    b.title,
                    b.content,
                    b.target_type,
                    b.priority,
                    b.action_url,
                    b.action_label,
                    b.is_active,
                    b.published_at,
                    b.expires_at,
                    b.created_at,
                    false AS is_read,
                    NULL AS read_at
                FROM broadcasts b
                WHERE b.is_active = TRUE
                  AND b.published_at <= NOW()
                  AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  AND b.target_type = 'ALL'
                ORDER BY 
                    CASE 
                        WHEN b.priority = 'URGENT' THEN 1 
                        WHEN b.priority = 'IMPORTANT' THEN 2 
                        ELSE 3 
                    END ASC,
                    b.published_at DESC
            `;
            params = [];
        }

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            broadcasts: result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                target_type: row.target_type,
                priority: row.priority,
                action_url: row.action_url,
                action_label: row.action_label,
                published_at: row.published_at,
                created_at: row.created_at,
                is_read: Boolean(row.is_read),
                read_at: row.read_at
            }))
        });

    } catch (error) {
        console.error('❌ getUserBroadcasts error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Mitteilungen.' });
    }
};

/**
 * GET /api/broadcasts/unread-count
 * Returns total count of unread broadcasts for current user.
 */
export const getBroadcastsUnreadCount = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({ success: true, unread_count: 0 });
        }

        const userId = req.user.id;
        const userType = req.user.user_type || 'PRIVATE';

        const result = await pool.query(`
            SELECT COUNT(b.id)::int AS count
            FROM broadcasts b
            LEFT JOIN broadcast_reads br 
                ON b.id = br.broadcast_id AND br.user_id = $1
            WHERE b.is_active = TRUE
              AND b.published_at <= NOW()
              AND (b.expires_at IS NULL OR b.expires_at > NOW())
              AND (b.target_type = 'ALL' OR b.target_type = $2)
              AND br.id IS NULL
        `, [userId, userType]);

        const unreadCount = result.rows[0]?.count || 0;

        return res.status(200).json({
            success: true,
            unread_count: unreadCount
        });

    } catch (error) {
        console.error('❌ getBroadcastsUnreadCount error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Abrufen der ungelesenen Mitteilungen.' });
    }
};

/**
 * POST /api/broadcasts/:id/read
 * Marks a specific broadcast as read for current user.
 */
export const markBroadcastAsRead = async (req, res) => {
    try {
        const { id: broadcastId } = req.params;
        const userId = req.user.id;

        await pool.query(`
            INSERT INTO broadcast_reads (id, broadcast_id, user_id, read_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (broadcast_id, user_id) DO UPDATE SET read_at = NOW()
        `, [crypto.randomUUID(), broadcastId, userId]);

        return res.status(200).json({
            success: true,
            message: 'Mitteilung als gelesen markiert.'
        });

    } catch (error) {
        console.error('❌ markBroadcastAsRead error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren des Lesestatus.' });
    }
};

/**
 * POST /api/broadcasts/mark-all-read
 * Marks all eligible active broadcasts as read for current user.
 */
export const markAllBroadcastsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.user_type || 'PRIVATE';

        await pool.query(`
            INSERT INTO broadcast_reads (id, broadcast_id, user_id, read_at)
            SELECT gen_random_uuid(), b.id, $1, NOW()
            FROM broadcasts b
            LEFT JOIN broadcast_reads br 
                ON b.id = br.broadcast_id AND br.user_id = $1
            WHERE b.is_active = TRUE
              AND b.published_at <= NOW()
              AND (b.expires_at IS NULL OR b.expires_at > NOW())
              AND (b.target_type = 'ALL' OR b.target_type = $2)
              AND br.id IS NULL
            ON CONFLICT (broadcast_id, user_id) DO NOTHING
        `, [userId, userType]);

        return res.status(200).json({
            success: true,
            message: 'Alle Mitteilungen als gelesen markiert.'
        });

    } catch (error) {
        console.error('❌ markAllBroadcastsAsRead error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Markieren aller Mitteilungen.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/broadcasts
 * Lists all broadcasts with real-time engagement analytics (reads, target audience, rate %).
 * Admin only.
 */
export const getAdminBroadcasts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            target_type = 'ALL',
            priority = 'ALL',
            is_active = 'ALL'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        // Dynamic WHERE conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchParam = `%${search.trim().toLowerCase()}%`;
            params.push(searchParam);
            conditions.push(`(
                LOWER(b.title) LIKE $${paramIndex} OR
                LOWER(b.content) LIKE $${paramIndex} OR
                LOWER(COALESCE(b.action_label, '')) LIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        if (target_type && target_type !== 'ALL') {
            params.push(target_type);
            conditions.push(`b.target_type = $${paramIndex}`);
            paramIndex++;
        }

        if (priority && priority !== 'ALL') {
            params.push(priority);
            conditions.push(`b.priority = $${paramIndex}`);
            paramIndex++;
        }

        if (is_active === 'TRUE' || is_active === 'true' || is_active === true) {
            conditions.push(`b.is_active = TRUE`);
        } else if (is_active === 'FALSE' || is_active === 'false' || is_active === false) {
            conditions.push(`b.is_active = FALSE`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Fetch total user audience counts by account type
        const audienceRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total_users,
                COUNT(CASE WHEN user_type = 'PRIVATE' THEN 1 END)::int AS private_users,
                COUNT(CASE WHEN user_type = 'COMMERCIAL' THEN 1 END)::int AS commercial_users
            FROM users 
            WHERE role != 'ADMIN' AND is_suspended = FALSE
        `);
        const audience = audienceRes.rows[0] || { total_users: 1, private_users: 1, commercial_users: 1 };

        // 2. Main Broadcasts Query with Read Counts
        const mainQuery = `
            SELECT 
                b.id,
                b.title,
                b.content,
                b.target_type,
                b.priority,
                b.action_url,
                b.action_label,
                b.created_by,
                b.is_active,
                b.published_at,
                b.expires_at,
                b.created_at,
                b.updated_at,
                COALESCE(r_stats.read_count, 0)::int AS read_count
            FROM broadcasts b
            LEFT JOIN (
                SELECT broadcast_id, COUNT(*)::int AS read_count
                FROM broadcast_reads
                GROUP BY broadcast_id
            ) r_stats ON b.id = r_stats.broadcast_id
            ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limitNum, offset);

        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM broadcasts b
            ${whereClause}
        `;

        // Overall stats query
        const summaryQuery = `
            SELECT 
                COUNT(*)::int AS total_broadcasts,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END)::int AS active_broadcasts,
                COALESCE((SELECT COUNT(*) FROM broadcast_reads), 0)::int AS total_reads
            FROM broadcasts
        `;

        const [itemsResult, countResult, summaryResult] = await Promise.all([
            pool.query(mainQuery, params),
            pool.query(countQuery, params.slice(0, paramIndex - 1)),
            pool.query(summaryQuery)
        ]);

        const totalItems = countResult.rows[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);

        // Format items with audience calculation
        const formattedBroadcasts = itemsResult.rows.map(row => {
            let targetAudience = audience.total_users;
            if (row.target_type === 'PRIVATE') targetAudience = audience.private_users;
            if (row.target_type === 'COMMERCIAL') targetAudience = audience.commercial_users;
            targetAudience = Math.max(1, targetAudience);

            const readPercentage = Math.min(100, Math.round((row.read_count / targetAudience) * 100));

            return {
                id: row.id,
                title: row.title,
                content: row.content,
                target_type: row.target_type,
                priority: row.priority,
                action_url: row.action_url || '',
                action_label: row.action_label || '',
                is_active: Boolean(row.is_active),
                published_at: row.published_at,
                expires_at: row.expires_at,
                created_at: row.created_at,
                updated_at: row.updated_at,
                metrics: {
                    read_count: row.read_count,
                    target_audience: targetAudience,
                    read_percentage: readPercentage
                }
            };
        });

        const summaryRow = summaryResult.rows[0] || {};
        const totalBroadcasts = summaryRow.total_broadcasts || 0;
        const totalReads = summaryRow.total_reads || 0;
        const avgReadRate = totalBroadcasts > 0 
            ? Math.round((totalReads / (totalBroadcasts * Math.max(1, audience.total_users))) * 100) 
            : 0;

        return res.status(200).json({
            success: true,
            broadcasts: formattedBroadcasts,
            pagination: {
                total: totalItems,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages || 1
            },
            summary: {
                totalBroadcasts,
                activeBroadcasts: summaryRow.active_broadcasts || 0,
                totalReads,
                avgReadRate: Math.min(100, avgReadRate),
                totalAudience: audience.total_users,
                privateAudience: audience.private_users,
                commercialAudience: audience.commercial_users
            }
        });

    } catch (error) {
        console.error('❌ getAdminBroadcasts error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Rundschreiben.' });
    }
};

/**
 * POST /api/admin/broadcasts
 * Creates a new broadcast announcement.
 * Admin only.
 */
export const createAdminBroadcast = async (req, res) => {
    try {
        const adminId = req.user.id;
        const {
            title,
            content,
            target_type = 'ALL',
            priority = 'NORMAL',
            action_url,
            action_label,
            is_active = true,
            published_at,
            expires_at
        } = req.body;

        if (!title || !title.trim() || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Titel und Inhalt sind Pflichtfelder.'
            });
        }

        const validTarget = VALID_TARGET_TYPES.includes(target_type) ? target_type : 'ALL';
        const validPriority = VALID_PRIORITIES.includes(priority) ? priority : 'NORMAL';

        const broadcastId = crypto.randomUUID();
        const pubDate = published_at ? new Date(published_at) : new Date();
        const expDate = expires_at ? new Date(expires_at) : null;

        const result = await pool.query(`
            INSERT INTO broadcasts (
                id, title, content, target_type, priority,
                action_url, action_label, created_by, is_active,
                published_at, expires_at, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
            ) RETURNING *
        `, [
            broadcastId,
            title.trim(),
            content.trim(),
            validTarget,
            validPriority,
            action_url ? action_url.trim() : null,
            action_label ? action_label.trim() : null,
            adminId,
            Boolean(is_active),
            pubDate,
            expDate
        ]);

        return res.status(201).json({
            success: true,
            message: 'Rundschreiben erfolgreich veröffentlicht.',
            broadcast: result.rows[0]
        });

    } catch (error) {
        console.error('❌ createAdminBroadcast error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Erstellen des Rundschreibens.' });
    }
};

/**
 * PATCH /api/admin/broadcasts/:id
 * Updates an existing broadcast announcement.
 * Admin only.
 */
export const updateAdminBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            target_type,
            priority,
            action_url,
            action_label,
            is_active,
            published_at,
            expires_at
        } = req.body;

        // 1. Check if broadcast exists
        const checkRes = await pool.query('SELECT * FROM broadcasts WHERE id = $1', [id]);
        if (checkRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Rundschreiben nicht gefunden.' });
        }
        const existing = checkRes.rows[0];

        const updatedTitle = title !== undefined ? title.trim() : existing.title;
        const updatedContent = content !== undefined ? content.trim() : existing.content;
        const updatedTarget = target_type && VALID_TARGET_TYPES.includes(target_type) ? target_type : existing.target_type;
        const updatedPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : existing.priority;
        const updatedActionUrl = action_url !== undefined ? (action_url ? action_url.trim() : null) : existing.action_url;
        const updatedActionLabel = action_label !== undefined ? (action_label ? action_label.trim() : null) : existing.action_label;
        const updatedIsActive = is_active !== undefined ? Boolean(is_active) : existing.is_active;
        const updatedPubDate = published_at !== undefined ? (published_at ? new Date(published_at) : existing.published_at) : existing.published_at;
        const updatedExpDate = expires_at !== undefined ? (expires_at ? new Date(expires_at) : null) : existing.expires_at;

        const updateRes = await pool.query(`
            UPDATE broadcasts
            SET title = $1,
                content = $2,
                target_type = $3,
                priority = $4,
                action_url = $5,
                action_label = $6,
                is_active = $7,
                published_at = $8,
                expires_at = $9,
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [
            updatedTitle,
            updatedContent,
            updatedTarget,
            updatedPriority,
            updatedActionUrl,
            updatedActionLabel,
            updatedIsActive,
            updatedPubDate,
            updatedExpDate,
            id
        ]);

        return res.status(200).json({
            success: true,
            message: 'Rundschreiben erfolgreich aktualisiert.',
            broadcast: updateRes.rows[0]
        });

    } catch (error) {
        console.error('❌ updateAdminBroadcast error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren des Rundschreibens.' });
    }
};

/**
 * DELETE /api/admin/broadcasts/:id
 * Permanently deletes a broadcast and cascades read receipts.
 * Admin only.
 */
export const deleteAdminBroadcast = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM broadcasts WHERE id = $1 RETURNING id, title', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Rundschreiben nicht gefunden.' });
        }

        return res.status(200).json({
            success: true,
            message: `Rundschreiben "${result.rows[0].title}" wurde erfolgreich gelöscht.`
        });

    } catch (error) {
        console.error('❌ deleteAdminBroadcast error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Löschen des Rundschreibens.' });
    }
};

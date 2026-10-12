import pool from '../config/database.js';

// Helper: Automatically generate / format display date relative to now
const getAutomaticDate = (createdAt, customDate) => {
    if (customDate && customDate !== 'Gestern' && customDate !== 'Heute' && !customDate.startsWith('Vor ')) {
        return customDate;
    }
    if (!createdAt) return customDate || 'Heute';

    const now = new Date();
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return customDate || 'Heute';

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfCreated) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays <= 6) return `Vor ${diffDays} Tagen`;

    return created.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── PUBLIC ENDPOINTS ───

/**
 * GET /api/tips
 * Returns public active camping tips with optional category or search filtering.
 */
export const getPublicTips = async (req, res) => {
    try {
        const { category, search, limit = 50 } = req.query;

        let query = `
            SELECT id, category, display_date AS date, title, description, position, created_at
            FROM camping_tips
            WHERE is_active = TRUE
        `;
        const params = [];
        let paramIndex = 1;

        if (category && category !== 'all' && category !== 'Alle') {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (search && search.trim()) {
            query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        query += ` ORDER BY position ASC, created_at DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit, 10));

        const result = await pool.query(query, params);

        const tips = result.rows.map(t => ({
            ...t,
            date: getAutomaticDate(t.created_at, t.date)
        }));

        return res.status(200).json({
            success: true,
            tips,
            total: tips.length
        });
    } catch (err) {
        console.error('❌ getPublicTips error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Camping-Tipps.'
        });
    }
};

// ─── ADMIN ENDPOINTS ───

/**
 * GET /api/tips/admin/all
 */
export const getAdminTips = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, category, display_date AS date, title, description, position, is_active, created_at, updated_at
            FROM camping_tips
            ORDER BY position ASC, created_at DESC
        `);

        const tips = result.rows.map(t => ({
            ...t,
            date: getAutomaticDate(t.created_at, t.date)
        }));

        return res.status(200).json({
            success: true,
            tips
        });
    } catch (err) {
        console.error('❌ getAdminTips error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Tipps im Admin-Bereich.'
        });
    }
};

/**
 * POST /api/tips/admin/create
 */
export const createTip = async (req, res) => {
    try {
        const { category, display_date, title, description, position = 0, is_active = true } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                error: 'Kategorie, Titel und Beschreibung sind erforderlich.'
            });
        }

        // Date is automatically created as 'Heute' (Today)
        const autoDate = (display_date && display_date.trim()) || 'Heute';

        const insertRes = await pool.query(
            `INSERT INTO camping_tips (category, display_date, title, description, position, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id, category, display_date AS date, title, description, position, is_active, created_at`,
            [category, autoDate, title, description, Number(position) || 0, Boolean(is_active)]
        );

        const createdTip = {
            ...insertRes.rows[0],
            date: getAutomaticDate(insertRes.rows[0].created_at, insertRes.rows[0].date)
        };

        return res.status(201).json({
            success: true,
            tip: createdTip,
            message: 'Tipp erfolgreich erstellt.'
        });
    } catch (err) {
        console.error('❌ createTip error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Erstellen des Tipps.'
        });
    }
};

/**
 * PUT /api/tips/admin/:id
 */
export const updateTip = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, display_date, title, description, position, is_active } = req.body;

        const updateRes = await pool.query(
            `UPDATE camping_tips
             SET category = COALESCE($1, category),
                 display_date = COALESCE($2, display_date),
                 title = COALESCE($3, title),
                 description = COALESCE($4, description),
                 position = COALESCE($5, position),
                 is_active = COALESCE($6, is_active),
                 updated_at = NOW()
             WHERE id = $7
             RETURNING id, category, display_date AS date, title, description, position, is_active, updated_at`,
            [category, display_date, title, description, position, is_active, id]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Tipp nicht gefunden.' });
        }

        return res.status(200).json({
            success: true,
            tip: updateRes.rows[0],
            message: 'Tipp erfolgreich aktualisiert.'
        });
    } catch (err) {
        console.error('❌ updateTip error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Aktualisieren des Tipps.'
        });
    }
};

/**
 * DELETE /api/tips/admin/:id
 */
export const deleteTip = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteRes = await pool.query('DELETE FROM camping_tips WHERE id = $1 RETURNING id', [id]);

        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Tipp nicht gefunden.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipp erfolgreich gelöscht.'
        });
    } catch (err) {
        console.error('❌ deleteTip error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Löschen des Tipps.'
        });
    }
};

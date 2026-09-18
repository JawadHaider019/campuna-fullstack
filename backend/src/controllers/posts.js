import pool from '../config/database.js';

// Helper to generate a clean URL slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Helper to estimate reading time from markdown content
const calculateReadTime = (content) => {
    if (!content) return '1 Min.';
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return `${minutes} Min.`;
};

// ─── PUBLIC ENDPOINTS ───

// GET /api/posts
export const getPublicPosts = async (req, res) => {
    try {
        const { category, search, tag, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let query = `
            SELECT id, title, slug, excerpt, category, tags, image_url, images,
                   author_name, author_avatar, read_time, featured, created_at, updated_at
            FROM blog_posts
            WHERE status = 'published'
        `;
        const params = [];
        let paramIndex = 1;

        if (category && category !== 'all' && category !== 'Alle') {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (tag) {
            query += ` AND $${paramIndex} = ANY(tags)`;
            params.push(tag);
            paramIndex++;
        }

        if (search && search.trim()) {
            query += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Count total matching
        const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_posts`;
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count, 10);

        query += ` ORDER BY featured DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit, 10), offset);

        const { rows: posts } = await pool.query(query, params);

        // Fetch distinct available categories
        const catRes = await pool.query(`
            SELECT DISTINCT category FROM blog_posts WHERE status = 'published' AND category IS NOT NULL ORDER BY category ASC
        `);
        const categories = catRes.rows.map(r => r.category);

        return res.json({
            success: true,
            posts,
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            categories
        });
    } catch (err) {
        console.error('Error fetching public posts:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Laden der Beiträge' });
    }
};

// GET /api/posts/:slug
export const getPublicPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // Try lookup by slug or id
        const query = `
            SELECT * FROM blog_posts 
            WHERE (slug = $1 OR id::text = $1) AND status = 'published'
            LIMIT 1
        `;
        const { rows } = await pool.query(query, [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Beitrag nicht gefunden' });
        }

        const post = rows[0];

        // Fetch up to 3 related posts in the same category or latest
        const relatedQuery = `
            SELECT id, title, slug, excerpt, category, image_url, author_name, read_time, created_at
            FROM blog_posts
            WHERE status = 'published' AND id != $1 AND (category = $2 OR category IS NOT NULL)
            ORDER BY (category = $2) DESC, created_at DESC
            LIMIT 3
        `;
        const relatedRes = await pool.query(relatedQuery, [post.id, post.category]);

        return res.json({
            success: true,
            post,
            relatedPosts: relatedRes.rows
        });
    } catch (err) {
        console.error('Error fetching post by slug:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Laden des Beitrags' });
    }
};

// ─── ADMIN ENDPOINTS ───

// GET /api/admin/posts
export const getAdminPosts = async (req, res) => {
    try {
        const { search, status, category } = req.query;

        let query = `SELECT * FROM blog_posts WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (category && category !== 'all') {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (search && search.trim()) {
            query += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC`;
        const { rows: posts } = await pool.query(query, params);

        // Stats summary
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'published') as published,
                COUNT(*) FILTER (WHERE status = 'draft') as draft
            FROM blog_posts
        `);

        return res.json({
            success: true,
            posts,
            stats: {
                total: parseInt(statsRes.rows[0].total, 10),
                published: parseInt(statsRes.rows[0].published, 10),
                draft: parseInt(statsRes.rows[0].draft, 10)
            }
        });
    } catch (err) {
        console.error('Error fetching admin posts:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Laden der Admin-Beiträge' });
    }
};

// GET /api/admin/posts/:id
export const getAdminPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Beitrag nicht gefunden' });
        }

        return res.json({ success: true, post: rows[0] });
    } catch (err) {
        console.error('Error fetching admin post by id:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Laden des Beitrags' });
    }
};

// POST /api/admin/posts
export const createPost = async (req, res) => {
    try {
        const {
            title,
            slug: customSlug,
            excerpt,
            content,
            category = 'Campuna blogs',
            tags = [],
            image_url,
            images = [],
            author_name = 'Campuna Redaktion',
            author_avatar = '/logo.webp',
            read_time,
            featured = false,
            status = 'published'
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Ein Titel ist erforderlich.' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Der Beitragsinhalt darf nicht leer sein.' });
        }

        // Generate base slug
        let finalSlug = customSlug && customSlug.trim() 
            ? generateSlug(customSlug) 
            : generateSlug(title);

        if (!finalSlug) {
            finalSlug = 'beitrag-' + Date.now();
        }

        // Ensure slug uniqueness
        const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [finalSlug]);
        if (slugCheck.rows.length > 0) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        const calculatedReadTime = read_time || calculateReadTime(content);
        const finalExcerpt = excerpt && excerpt.trim() ? excerpt.trim() : content.substring(0, 160).replace(/[#*`_]/g, '') + '...';

        const insertQuery = `
            INSERT INTO blog_posts (
                title, slug, excerpt, content, category, tags, image_url, images,
                author_name, author_avatar, read_time, featured, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const { rows } = await pool.query(insertQuery, [
            title.trim(),
            finalSlug,
            finalExcerpt,
            content,
            category,
            Array.isArray(tags) ? tags : [],
            image_url || null,
            Array.isArray(images) ? images : (image_url ? [image_url] : []),
            author_name || 'Campuna Redaktion',
            author_avatar || '/logo.webp',
            calculatedReadTime,
            Boolean(featured),
            status || 'published'
        ]);

        return res.status(201).json({
            success: true,
            message: status === 'draft' ? 'Entwurf gespeichert!' : 'Beitrag erfolgreich veröffentlicht!',
            post: rows[0]
        });
    } catch (err) {
        console.error('Error creating post:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Beitrags: ' + err.message });
    }
};

// PUT /api/admin/posts/:id
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug: customSlug,
            excerpt,
            content,
            category,
            tags,
            image_url,
            images,
            author_name,
            author_avatar,
            read_time,
            featured,
            status
        } = req.body;

        // Check if post exists
        const existing = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Beitrag nicht gefunden' });
        }

        const current = existing.rows[0];

        // Slug handling
        let finalSlug = current.slug;
        if (customSlug && customSlug !== current.slug) {
            finalSlug = generateSlug(customSlug);
            const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [finalSlug, id]);
            if (slugCheck.rows.length > 0) {
                finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
            }
        }

        const newContent = content !== undefined ? content : current.content;
        const newReadTime = read_time !== undefined ? read_time : (content ? calculateReadTime(newContent) : current.read_time);

        const updateQuery = `
            UPDATE blog_posts SET
                title = COALESCE($1, title),
                slug = $2,
                excerpt = COALESCE($3, excerpt),
                content = COALESCE($4, content),
                category = COALESCE($5, category),
                tags = COALESCE($6, tags),
                image_url = COALESCE($7, image_url),
                images = COALESCE($8, images),
                author_name = COALESCE($9, author_name),
                author_avatar = COALESCE($10, author_avatar),
                read_time = $11,
                featured = COALESCE($12, featured),
                status = COALESCE($13, status),
                updated_at = NOW()
            WHERE id = $14
            RETURNING *
        `;

        const { rows } = await pool.query(updateQuery, [
            title !== undefined ? title.trim() : null,
            finalSlug,
            excerpt !== undefined ? excerpt : null,
            content !== undefined ? content : null,
            category !== undefined ? category : null,
            tags !== undefined ? (Array.isArray(tags) ? tags : []) : null,
            image_url !== undefined ? image_url : null,
            images !== undefined ? (Array.isArray(images) ? images : []) : null,
            author_name !== undefined ? author_name : null,
            author_avatar !== undefined ? author_avatar : null,
            newReadTime,
            featured !== undefined ? Boolean(featured) : null,
            status !== undefined ? status : null,
            id
        ]);

        return res.json({
            success: true,
            message: 'Beitrag erfolgreich aktualisiert!',
            post: rows[0]
        });
    } catch (err) {
        console.error('Error updating post:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Beitrags: ' + err.message });
    }
};

// DELETE /api/admin/posts/:id
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id, title', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Beitrag nicht gefunden' });
        }

        return res.json({
            success: true,
            message: `Beitrag "${result.rows[0].title}" wurde gelöscht.`
        });
    } catch (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Löschen des Beitrags' });
    }
};

// POST /api/admin/posts/upload-image
export const uploadPostImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
        }

        const relativeUrl = `/uploads/${req.file.filename}`;
        const imageUrl = relativeUrl;

        return res.json({
            success: true,
            imageUrl,
            relativeUrl,
            filename: req.file.filename,
            message: 'Bild erfolgreich hochgeladen!'
        });
    } catch (err) {
        console.error('Error uploading post image:', err);
        return res.status(500).json({ success: false, message: 'Fehler beim Hochladen des Bildes' });
    }
};


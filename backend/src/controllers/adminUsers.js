import pool from '../config/database.js';

/**
 * GET /api/admin/users
 * Returns paginated users with comprehensive profile data, listing counts, and system metrics.
 * Requires: authenticate + requireAdmin
 */
export const getAdminUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            user_type = 'ALL',
            role = 'ALL',
            status = 'ALL'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        // Build dynamic WHERE clause
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchParam = `%${search.trim().toLowerCase()}%`;
            params.push(searchParam);
            conditions.push(`(
                LOWER(u.email) LIKE $${paramIndex} OR
                LOWER(u.referral_code) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.first_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(pp.last_name, '')) LIKE $${paramIndex} OR
                LOWER(COALESCE(cp.company_name, '')) LIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        // Exclude system admin from customer list
        conditions.push(`u.role != 'ADMIN'`);

        if (user_type && user_type !== 'ALL') {
            params.push(user_type);
            conditions.push(`u.user_type = $${paramIndex}`);
            paramIndex++;
        }

        if (status === 'ACTIVE') {
            conditions.push(`u.is_suspended = FALSE AND u.email_verified = TRUE`);
        } else if (status === 'SUSPENDED') {
            conditions.push(`u.is_suspended = TRUE`);
        } else if (status === 'UNVERIFIED') {
            conditions.push(`u.email_verified = FALSE`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Main User Query with Left Joins for Profiles, Listings Count & Pioneer Badge
        const mainQuery = `
            SELECT 
                u.id,
                u.email,
                u.role,
                u.user_type,
                u.referral_code,
                u.email_verified,
                u.is_suspended,
                u.created_at,
                u.updated_at,
                -- Private profile data
                pp.first_name as private_first_name,
                pp.last_name as private_last_name,
                pp.profile_image_url as private_avatar,
                pp.location as private_location,
                -- Company profile data
                cp.company_name,
                cp.first_name as company_first_name,
                cp.last_name as company_last_name,
                cp.logo_url as company_logo,
                cp.location as company_location,
                cp.phone as company_phone,
                cp.website_url as company_website,
                cp.tier as company_tier,
                -- Aggregate counts
                COALESCE(listing_stats.total_listings, 0) as total_listings,
                COALESCE(listing_stats.active_listings, 0) as active_listings,
                COALESCE(pioneer_stat.has_pioneer, FALSE) as has_pioneer_badge
            FROM users u
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as total_listings,
                    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as active_listings
                FROM listings
                GROUP BY user_id
            ) listing_stats ON u.id = listing_stats.user_id
            LEFT JOIN (
                SELECT 
                    user_id,
                    TRUE as has_pioneer
                FROM user_achievements
                WHERE badge_key = 'CAMPUNA_PIONEER'
                GROUP BY user_id
            ) pioneer_stat ON u.id = pioneer_stat.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limitNum, offset);

        // Count Query for matching filter
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            ${whereClause}
        `;

        // Overall Summary Stats Query (Excluding system admin)
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN user_type = 'COMMERCIAL' THEN 1 END) as total_commercial,
                COUNT(CASE WHEN user_type = 'PRIVATE' THEN 1 END) as total_private,
                COUNT(CASE WHEN is_suspended = TRUE THEN 1 END) as total_suspended,
                COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as total_unverified
            FROM users
            WHERE role != 'ADMIN'
        `;

        const [usersResult, countResult, summaryResult] = await Promise.all([
            pool.query(mainQuery, params),
            pool.query(countQuery, params.slice(0, paramIndex - 1)),
            pool.query(summaryQuery)
        ]);

        const totalItems = parseInt(countResult.rows[0]?.total || 0, 10);
        const totalPages = Math.ceil(totalItems / limitNum);

        // Format user items
        const formattedUsers = usersResult.rows.map(row => {
            const isCommercial = row.user_type === 'COMMERCIAL';
            const displayName = isCommercial 
                ? (row.company_name || `${row.company_first_name || ''} ${row.company_last_name || ''}`.trim() || 'Gewerblicher Anbieter')
                : (`${row.private_first_name || ''} ${row.private_last_name || ''}`.trim() || 'Privatnutzer');

            const avatarUrl = isCommercial ? (row.company_logo || '') : (row.private_avatar || '');
            const location = isCommercial ? (row.company_location || '') : (row.private_location || '');

            return {
                id: row.id,
                email: row.email,
                role: row.role,
                user_type: row.user_type,
                name: displayName,
                avatar: avatarUrl,
                location: location,
                phone: row.company_phone || '',
                website: row.company_website || '',
                tier: row.company_tier || 'FREE',
                referral_code: row.referral_code,
                email_verified: row.email_verified,
                is_suspended: row.is_suspended,
                total_listings: parseInt(row.total_listings, 10),
                active_listings: parseInt(row.active_listings, 10),
                has_pioneer_badge: Boolean(row.has_pioneer_badge),
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });

        const summaryRow = summaryResult.rows[0] || {};

        return res.status(200).json({
            success: true,
            users: formattedUsers,
            pagination: {
                total: totalItems,
                page: pageNum,
                limit: limitNum,
                totalPages
            },
            summary: {
                totalUsers: parseInt(summaryRow.total_users || 0, 10),
                totalCommercial: parseInt(summaryRow.total_commercial || 0, 10),
                totalPrivate: parseInt(summaryRow.total_private || 0, 10),
                totalSuspended: parseInt(summaryRow.total_suspended || 0, 10),
                totalAdmins: parseInt(summaryRow.total_admins || 0, 10),
                totalUnverified: parseInt(summaryRow.total_unverified || 0, 10)
            }
        });

    } catch (error) {
        console.error('❌ getAdminUsers error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Abrufen der Benutzerliste.'
        });
    }
};

/**
 * GET /api/admin/users/:id
 * Returns single user details with full profile, all listings, and achievements.
 */
export const getAdminUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Security check: validate UUID pattern
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!id || !uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültige Benutzer-ID.'
            });
        }

        const userQuery = `
            SELECT 
                u.id,
                u.email,
                u.role,
                u.user_type,
                u.referral_code,
                u.email_verified,
                u.is_suspended,
                u.created_at,
                u.updated_at,
                -- Private profile
                pp.first_name as private_first_name,
                pp.last_name as private_last_name,
                pp.profile_image_url as private_avatar,
                pp.location as private_location,
                pp.bio as private_bio,
                -- Company profile
                cp.company_name,
                cp.first_name as company_first_name,
                cp.last_name as company_last_name,
                cp.logo_url as company_logo,
                cp.cover_image_url as company_cover,
                cp.location as company_location,
                cp.phone as company_phone,
                cp.website_url as company_website,
                cp.bio as company_description,
                cp.tier as company_tier,
                -- Credits
                COALESCE((SELECT SUM(amount) FROM credit_transactions WHERE user_id = u.id), 0) as credit_balance,
                -- Pioneer
                COALESCE((SELECT TRUE FROM user_achievements WHERE user_id = u.id AND badge_key = 'CAMPUNA_PIONEER' LIMIT 1), FALSE) as has_pioneer_badge
            FROM users u
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            WHERE u.id = $1
        `;

        const userRes = await pool.query(userQuery, [id]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden.'
            });
        }

        const row = userRes.rows[0];
        const isCommercial = row.user_type === 'COMMERCIAL';
        const displayName = isCommercial 
            ? (row.company_name || `${row.company_first_name || ''} ${row.company_last_name || ''}`.trim() || 'Gewerblicher Anbieter')
            : (`${row.private_first_name || ''} ${row.private_last_name || ''}`.trim() || 'Privatnutzer');

        // Fetch user listings
        const listingsRes = await pool.query(`
            SELECT id, title, slug, price, status, images, location, created_at
            FROM listings
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [id]);

        const listings = listingsRes.rows.map(l => {
            let imgs = [];
            if (Array.isArray(l.images)) {
                imgs = l.images;
            } else if (typeof l.images === 'string') {
                const raw = l.images.trim();
                if (raw.startsWith('{') && raw.endsWith('}')) {
                    imgs = raw.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
                } else {
                    try { imgs = JSON.parse(raw); } catch { imgs = [raw]; }
                }
            }
            return {
                ...l,
                main_image: imgs[0] || '/collection/wohnmobile-hero.png',
                price: parseFloat(l.price) || 0
            };
        });

        return res.status(200).json({
            success: true,
            user: {
                id: row.id,
                email: row.email,
                role: row.role,
                user_type: row.user_type,
                name: displayName,
                avatar: isCommercial ? (row.company_logo || '') : (row.private_avatar || ''),
                cover: isCommercial ? (row.company_cover || '') : '',
                location: isCommercial ? (row.company_location || '') : (row.private_location || ''),
                phone: row.company_phone || '',
                website: row.company_website || '',
                bio: isCommercial ? (row.company_description || '') : (row.private_bio || ''),
                tier: row.company_tier || 'FREE',
                referral_code: row.referral_code,
                email_verified: row.email_verified,
                is_suspended: row.is_suspended,
                credit_balance: parseInt(row.credit_balance || 0, 10),
                has_pioneer_badge: Boolean(row.has_pioneer_badge),
                total_listings: listings.length,
                active_listings: listings.filter(l => l.status === 'APPROVED').length,
                created_at: row.created_at,
                updated_at: row.updated_at,
                listings
            }
        });

    } catch (error) {
        console.error('❌ getAdminUserById error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Abrufen der Benutzerdetails.'
        });
    }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Toggles suspension status for a user.
 */
export const toggleUserSuspension = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_suspended } = req.body;

        if (typeof is_suspended !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Feld "is_suspended" (boolean) ist erforderlich.'
            });
        }

        // Prevent self-suspension of the currently logged in admin
        if (req.user.id === id && is_suspended) {
            return res.status(400).json({
                success: false,
                error: 'Du kannst dein eigenes Administratorkonto nicht sperren.'
            });
        }

        const result = await pool.query(
            `UPDATE users 
             SET is_suspended = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, email, is_suspended`,
            [is_suspended, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden.'
            });
        }

        return res.status(200).json({
            success: true,
            message: is_suspended 
                ? 'Benutzerkonto wurde erfolgreich gesperrt.' 
                : 'Benutzerkonto wurde erfolgreich reaktiviert.',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ toggleUserSuspension error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Aktualisieren des Kontostatus.'
        });
    }
};

/**
 * PATCH /api/admin/users/:id/role
 * Changes the role of a user (ADMIN <-> USER).
 */
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'USER'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Gültige Rolle (ADMIN oder USER) erforderlich.'
            });
        }

        // Prevent admin from demoting themselves
        if (req.user.id === id && role !== 'ADMIN') {
            return res.status(400).json({
                success: false,
                error: 'Du kannst deine eigenen Administratorrechte nicht entziehen.'
            });
        }

        const result = await pool.query(
            `UPDATE users 
             SET role = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, email, role`,
            [role, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Rolle erfolgreich auf "${role}" gesetzt.`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ updateUserRole error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Ändern der Rolle.'
        });
    }
};

/**
 * PATCH /api/admin/users/:id/verify-email
 * Manually verifies a user's email address.
 */
export const manuallyVerifyUserEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE users 
             SET email_verified = TRUE, updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, email, email_verified`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'E-Mail-Adresse wurde erfolgreich manuell verifiziert.',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ manuallyVerifyUserEmail error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler bei der E-Mail-Verifizierung.'
        });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes a user and cascades associated records.
 */
export const deleteAdminUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                error: 'Du kannst dein eigenes Konto nicht im Admin-Bereich löschen.'
            });
        }

        // Cascade delete all associated user records safely
        await pool.query('DELETE FROM private_profiles WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM company_profiles WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM favorites WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM credit_transactions WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM user_subscriptions WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM listing_moderation WHERE user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM listings WHERE user_id = $1', [id]).catch(() => {});
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Benutzer nicht gefunden.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Benutzerkonto und alle zugehörigen Daten wurden erfolgreich gelöscht.'
        });

    } catch (error) {
        console.error('❌ deleteAdminUser error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Fehler beim Löschen des Benutzers.'
        });
    }
};

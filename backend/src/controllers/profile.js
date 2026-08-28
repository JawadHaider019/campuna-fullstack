import { db } from '../prisma/db.js';

// ─── Allowed update fields per profile type ──────────────────────────────────

const PRIVATE_ALLOWED_FIELDS = [
    'first_name',
    'last_name',
    'bio',
    'location',
    'profile_image_url',
    'cover_image_url',
];

const COMPANY_ALLOWED_FIELDS = [
    'company_name',
    'bio',
    'location',
    'company_email',
    'company_address',
    'impressum',
    'privacy_policy_url',
    'phone',
    'vat_id',
    'website_url',
    'instagram_url',
    'facebook_url',
    'logo_url',
    'cover_image_url',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Picks only the allowed fields from the request body.
 * Strips any keys not in the allowed list.
 */
const pickFields = (body, allowedFields) => {
    return Object.fromEntries(
        Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/profile/me
 * Returns the authenticated user's profile (private or company).
 * Requires: authenticate middleware
 */
export const getMyProfile = async (req, res) => {
    try {
        const { id, user_type } = req.user;

        if (user_type === 'PRIVATE') {
            const profile = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            return res.status(200).json({
                success: true,
                profile_type: 'PRIVATE',
                profile,
            });
        }

        if (user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            return res.status(200).json({
                success: true,
                profile_type: 'COMMERCIAL',
                profile,
            });
        }

        return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });

    } catch (error) {
        console.error('❌ getMyProfile error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * PUT /api/profile/me
 * Updates the authenticated user's profile.
 * Only whitelisted fields are applied — unknown keys are silently ignored.
 * Requires: authenticate middleware
 */
export const updateMyProfile = async (req, res) => {
    try {
        const { id, user_type } = req.user;

        if (user_type === 'PRIVATE') {
            const updates = pickFields(req.body, PRIVATE_ALLOWED_FIELDS);

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine gültigen Felder zum Aktualisieren angegeben.',
                    allowed_fields: PRIVATE_ALLOWED_FIELDS,
                });
            }

            const updated = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .update(updates);

            return res.status(200).json({
                success: true,
                message: 'Profil erfolgreich aktualisiert.',
                profile: updated,
            });
        }

        if (user_type === 'COMMERCIAL') {
            const updates = pickFields(req.body, COMPANY_ALLOWED_FIELDS);

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine gültigen Felder zum Aktualisieren angegeben.',
                    allowed_fields: COMPANY_ALLOWED_FIELDS,
                });
            }

            const updated = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .update(updates);

            return res.status(200).json({
                success: true,
                message: 'Firmenprofil erfolgreich aktualisiert.',
                profile: updated,
            });
        }

        return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });

    } catch (error) {
        console.error('❌ updateMyProfile error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * GET /api/profile/:userId
 * Returns a public view of any user's profile.
 * Sensitive fields (email, vat_id, impressum) are excluded from the response.
 */
export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await db.orm.public.User
            .where((u) => u.id.eq(userId))
            .first();

        if (!user || user.is_suspended) {
            return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
        }

        if (user.user_type === 'PRIVATE') {
            const profile = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(userId))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            // Public view — exclude internal/sensitive fields
            const { id, user_id, created_at, updated_at, ...publicFields } = profile;

            return res.status(200).json({
                success: true,
                profile_type: 'PRIVATE',
                profile: publicFields,
            });
        }

        if (user.user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(userId))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            // Public view — exclude sensitive business fields
            const { id, user_id, created_at, updated_at, vat_id, impressum, company_email, ...publicFields } = profile;

            return res.status(200).json({
                success: true,
                profile_type: 'COMMERCIAL',
                profile: publicFields,
            });
        }

        return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });

    } catch (error) {
        console.error('❌ getPublicProfile error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

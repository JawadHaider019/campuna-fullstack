import { db } from '../prisma/db.js';
import { checkAndAwardPioneerBadge } from './badge.js';

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
    'first_name',
    'last_name',
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

        // Auto-check/award Pioneer Badge when loading dashboard profile
        await checkAndAwardPioneerBadge(id).catch(err => {
            console.error('Auto Pioneer check error:', err.message);
        });

        // Query user achievements
        const achievements = await db.orm.public.UserAchievement
            .where({ user_id: id })
            .all();

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
                achievements,
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
                achievements,
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
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            const updates = pickFields(req.body, COMPANY_ALLOWED_FIELDS);

            // Gating validation based on subscription tier
            if (profile.tier === 'FREE') {
                // Block cover image updates
                if (updates.cover_image_url && updates.cover_image_url !== profile.cover_image_url) {
                    return res.status(403).json({
                        success: false,
                        error: 'Das Hintergrundbild ist ein exklusives Business-Feature. Bitte aktualisiere dein Abonnement.'
                    });
                }
                // Enforce 150 character limit on description
                if (updates.bio && updates.bio.length > 150) {
                    return res.status(400).json({
                        success: false,
                        error: 'Beschreibung auf 150 Zeichen begrenzt im Free-Tarif.'
                    });
                }
            } else {
                // Enforce 1000 character limit on description for Business users
                if (updates.bio && updates.bio.length > 1000) {
                    return res.status(400).json({
                        success: false,
                        error: 'Beschreibung auf 1000 Zeichen begrenzt.'
                    });
                }
            }

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

        const achievements = await db.orm.public.UserAchievement
            .where({ user_id: userId })
            .all();

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
                profile: { ...publicFields, member_since: user.created_at },
                achievements,
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
                profile: { ...publicFields, member_since: user.created_at },
                achievements,
            });
        }

        return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });

    } catch (error) {
        console.error('❌ getPublicProfile error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/profile/me/avatar
 * Handles profile image (avatar) or company logo uploads.
 * Uses uploadSingle middleware.
 */
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }

        const { id, user_type } = req.user;

        // Generate full URL
        const PORT = process.env.PORT || 5000;
        const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');
        const fileUrl = `${host}/uploads/${req.file.filename}`;

        if (user_type === 'PRIVATE') {
            const profile = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .update({ profile_image_url: fileUrl });
        } else if (user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .update({ logo_url: fileUrl });
        } else {
            return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Bild erfolgreich hochgeladen.',
            url: fileUrl
        });

    } catch (error) {
        console.error('❌ uploadAvatar error:', error.message);
        return res.status(500).json({ success: false, error: 'Upload fehlgeschlagen.' });
    }
};

/**
 * POST /api/profile/me/cover
 * Handles cover image uploads.
 * Uses uploadSingle middleware.
 * Gated feature for COMMERCIAL (Business tier only) and PRIVATE users.
 */
export const uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }

        const { id, user_type } = req.user;

        // Generate full URL
        const PORT = process.env.PORT || 5000;
        const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');
        const fileUrl = `${host}/uploads/${req.file.filename}`;

        if (user_type === 'PRIVATE') {
            const profile = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .update({ cover_image_url: fileUrl });
        } else if (user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            // Gating: Block cover image uploads for free tier
            if (profile.tier === 'FREE') {
                return res.status(403).json({
                    success: false,
                    error: 'Das Hintergrundbild ist ein exklusives Business-Feature. Bitte aktualisiere dein Abonnement.'
                });
            }

            await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .update({ cover_image_url: fileUrl });
        } else {
            return res.status(400).json({ success: false, error: 'Unbekannter Kontotyp.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Hintergrundbild erfolgreich hochgeladen.',
            url: fileUrl
        });

    } catch (error) {
        console.error('❌ uploadCover error:', error.message);
        return res.status(500).json({ success: false, error: 'Upload fehlgeschlagen.' });
    }
};

/**
 * GET /api/profile
 * Returns a public list of all active user profiles with their listing counts.
 */
export const getAllProfiles = async (req, res) => {
    try {
        const users = await db.orm.public.User
            .where({
                is_suspended: false,
                user_type: 'COMMERCIAL'
            })
            .all();
        
        const profiles = [];
        for (const u of users) {
            let profileObj = null;
            if (u.user_type === 'COMMERCIAL') {
                profileObj = await db.orm.public.CompanyProfile.where({ user_id: u.id }).first();
            } else {
                profileObj = await db.orm.public.PrivateProfile.where({ user_id: u.id }).first();
            }
            
            if (profileObj) {
                const listings = await db.orm.public.Listing
                    .where({ user_id: u.id, status: 'APPROVED' })
                    .all();
                
                const name = u.user_type === 'COMMERCIAL'
                    ? (profileObj.company_name || 'Gewerblicher Anbieter')
                    : `${profileObj.first_name || ''} ${profileObj.last_name || ''}`.trim() || 'Privatverkäufer';
                    
                profiles.push({
                    id: u.id,
                    name,
                    logo: profileObj.avatar_url || profileObj.logo_url || profileObj.profile_image_url || '',
                    coverImage: profileObj.cover_image_url || profileObj.cover_url || '',
                    description: profileObj.bio || '',
                    listingsCount: listings.length,
                    type: u.user_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'
                });
            }
        }
        
        return res.status(200).json({
            success: true,
            profiles
        });
    } catch (error) {
        console.error('❌ getAllProfiles error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Profile.' });
    }
};

import { db } from '../prisma/db.js';
import { checkAndAwardPioneerBadge } from './badge.js';

// ─── Allowed update fields per profile type ──────────────────────────────────

const PRIVATE_ALLOWED_FIELDS = [
    'first_name',
    'last_name',
    'bio',
    'location',
    'profile_image_url',
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
        const { id, user_type, role } = req.user;

        // Auto-check/award Pioneer Badge when loading dashboard profile (standard users)
        if (role !== 'ADMIN') {
            await checkAndAwardPioneerBadge(id).catch(err => {
                console.error('Auto Pioneer check error:', err.message);
            });
        }

        // Admin Account Profile
        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                profile_type: 'PRIVATE',
                profile: {
                    first_name: req.user.name?.split(' ')[0] || 'Campuna',
                    last_name: req.user.name?.split(' ').slice(1).join(' ') || 'Admin',
                    bio: 'Systemadministrator bei Campuna',
                    location: 'Berlin, Deutschland',
                    profile_image_url: null,
                    created_at: req.user.created_at || new Date().toISOString(),
                },
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    role: 'ADMIN',
                    user_type: 'PRIVATE',
                    referral_code: 'CAMPUNA-ADMIN',
                    referred_by_code: null,
                    is_referred: false,
                },
                achievements: [
                    { badge_key: 'CAMPUNA_PIONEER', position: 1 }
                ],
            });
        }

        // Query user record
        const user = await db.orm.public.User
            .where({ id })
            .first();

        // Query user achievements
        const achievements = await db.orm.public.UserAchievement
            .where({ user_id: id })
            .all();

        const userData = {
            id: user?.id,
            email: user?.email,
            role: user?.role,
            user_type: user?.user_type || 'PRIVATE',
            referral_code: user?.referral_code,
            referred_by_code: user?.referred_by_code,
            is_referred: !!user?.referred_by_code,
        };

        if (user_type === 'COMMERCIAL') {
            let profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                profile = await db.orm.public.CompanyProfile.create({
                    user_id: id,
                    company_name: user?.email?.split('@')[0] || 'Mein Unternehmen',
                    tier: 'FREE'
                });
            }

            return res.status(200).json({
                success: true,
                profile_type: 'COMMERCIAL',
                profile,
                user: userData,
                achievements,
            });
        }

        // Default to PRIVATE for all other users
        let profile = await db.orm.public.PrivateProfile
            .where((p) => p.user_id.eq(id))
            .first();

        if (!profile) {
            profile = await db.orm.public.PrivateProfile.create({
                user_id: id,
                first_name: user?.email?.split('@')[0] || 'Camper',
                last_name: '',
            });
        }

        return res.status(200).json({
            success: true,
            profile_type: 'PRIVATE',
            profile,
            user: userData,
            achievements,
        });

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
        const { id, user_type, role } = req.user;

        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                message: 'Administrator-Profil erfolgreich gespeichert.',
                profile: {
                    first_name: req.body.first_name || 'Campuna',
                    last_name: req.body.last_name || 'Admin',
                    bio: req.body.bio || 'Systemadministrator bei Campuna',
                    location: req.body.location || 'Berlin, Deutschland',
                },
            });
        }

        if (user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            const user = await db.orm.public.User
                .where({ id })
                .first()
                .catch(() => null);
            const isReferred = !!user?.referred_by_code;

            const updates = pickFields(req.body, COMPANY_ALLOWED_FIELDS);

            // Gating validation based on subscription tier
            if (profile.tier === 'FREE') {
                if (updates.cover_image_url && updates.cover_image_url !== profile.cover_image_url) {
                    return res.status(403).json({
                        success: false,
                        error: 'Das Hintergrundbild ist ein exklusives Business-Feature. Bitte aktualisiere dein Abonnement.'
                    });
                }
                
                const allowedLimit = 500;
                if (updates.bio && updates.bio.length > allowedLimit) {
                    return res.status(400).json({
                        success: false,
                        error: `Die Unternehmensbeschreibung ist im kostenlosen Tarif auf ${allowedLimit} Zeichen begrenzt.`
                    });
                }
            } else {
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

        // PRIVATE fallback
        const updates = pickFields(req.body, PRIVATE_ALLOWED_FIELDS);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Keine gültigen Felder zum Aktualisieren angegeben.',
                allowed_fields: PRIVATE_ALLOWED_FIELDS,
            });
        }

        if (updates.bio && updates.bio.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Die Beschreibung ist im kostenlosen Tarif auf 500 Zeichen begrenzt.'
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

        // Default fallback for any other user type (ADMIN, etc.)
        const fallbackProfile = await db.orm.public.PrivateProfile
            .where((p) => p.user_id.eq(userId))
            .first();

        if (!fallbackProfile) {
            return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
        }

        const { id, user_id, created_at, updated_at, ...publicFields } = fallbackProfile;

        return res.status(200).json({
            success: true,
            profile_type: 'PRIVATE',
            profile: { ...publicFields, member_since: user.created_at },
            achievements,
        });

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

        const { id, user_type, role } = req.user;

        // Generate full URL
        const PORT = process.env.PORT || 5000;
        const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');
        const fileUrl = `${host}/uploads/${req.file.filename}`;

        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                message: 'Administrator-Foto erfolgreich hochgeladen.',
                url: fileUrl
            });
        }

        if (user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (profile) {
                await db.orm.public.CompanyProfile
                    .where((p) => p.user_id.eq(id))
                    .update({ logo_url: fileUrl });
            }
        } else {
            // Default to PRIVATE
            const profile = await db.orm.public.PrivateProfile
                .where((p) => p.user_id.eq(id))
                .first();

            if (profile) {
                await db.orm.public.PrivateProfile
                    .where((p) => p.user_id.eq(id))
                    .update({ profile_image_url: fileUrl });
            }
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

        const { id, user_type, role } = req.user;

        // Generate full URL
        const PORT = process.env.PORT || 5000;
        const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');
        const fileUrl = `${host}/uploads/${req.file.filename}`;

        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                message: 'Hintergrundbild erfolgreich hochgeladen.',
                url: fileUrl
            });
        }

        if (user_type === 'COMMERCIAL') {
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
            return res.status(403).json({
                success: false,
                error: 'Hintergrundbilder sind nur für gewerbliche Konten verfügbar.'
            });
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

import { db } from '../prisma/db.js';
import pool from '../config/database.js';
import crypto from 'crypto';
import { checkAndAwardPioneerBadge } from './badge.js';
import { checkAndAwardReferralCreditsOnCommercialProfile } from './referral.js';
import { isValidPhoneNumber } from '../utils/validation.js';

// ─── Allowed update fields per profile type ──────────────────────────────────

const PRIVATE_ALLOWED_FIELDS = [
    'first_name',
    'last_name',
    'bio',
    'location',
    'phone',
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
    'linkedin_url',
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

        // Ensure referral_code is never null
        let referralCode = user?.referral_code;
        if (!referralCode && user) {
            referralCode = 'CAMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
            await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [referralCode, user.id]).catch(() => {});
        }

        // Query user achievements
        const achievements = await db.orm.public.UserAchievement
            .where({ user_id: id })
            .all();

        const userData = {
            id: user?.id,
            email: user?.email,
            role: user?.role,
            user_type: user?.user_type || 'PRIVATE',
            referral_code: referralCode,
            referred_by_code: user?.referred_by_code,
            is_referred: !!user?.referred_by_code,
        };

        if (user_type === 'COMMERCIAL') {
            const rawCpRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [id]);
            let profile = rawCpRes.rows[0];

            if (!profile) {
                const insertRes = await pool.query(
                    `INSERT INTO company_profiles (user_id, company_name, tier, created_at, updated_at)
                     VALUES ($1, $2, 'FREE', NOW(), NOW())
                     RETURNING *`,
                    [id, user?.email?.split('@')[0] || 'Mein Unternehmen']
                );
                profile = insertRes.rows[0];
            }

            const spotlightUntil = profile?.spotlight_until ? new Date(profile.spotlight_until) : null;
            const now = new Date();
            const hasPaidSpotlight = Boolean(spotlightUntil && spotlightUntil > now) || Boolean(profile?.is_strategic_partner);
            const spotlightDaysLeft = spotlightUntil && spotlightUntil > now 
                ? Math.ceil((spotlightUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            const hasLogo = Boolean(profile?.logo_url && profile.logo_url.trim());
            const hasCover = Boolean(profile?.cover_image_url && profile.cover_image_url.trim());
            const hasBio = Boolean(profile?.bio && profile.bio.trim().length >= 20);
            const hasPhone = Boolean(profile?.phone && profile.phone.trim());
            const hasLocation = Boolean((profile?.location && profile.location.trim()) || (profile?.company_address && profile.company_address.trim()));
            const isVerified = Boolean(user?.email_verified);
            const allMet = hasLogo && hasCover && hasBio && hasPhone && hasLocation && isVerified;

            const isSpotlightActive = hasPaidSpotlight && allMet;
            const isSpotlightPaused = hasPaidSpotlight && !allMet;

            const spotlightRequirements = {
                has_logo: hasLogo,
                has_cover: hasCover,
                has_description: hasBio,
                has_phone: hasPhone,
                has_location: hasLocation,
                is_verified: isVerified,
                is_commercial: true,
                all_met: allMet
            };

            return res.status(200).json({
                success: true,
                profile_type: 'COMMERCIAL',
                profile: {
                    ...profile,
                    is_spotlight_active: isSpotlightActive,
                    is_spotlight_paused: isSpotlightPaused,
                    has_paid_spotlight: hasPaidSpotlight,
                    spotlight_days_left: spotlightDaysLeft,
                },
                spotlight: {
                    is_active: isSpotlightActive,
                    is_paused: isSpotlightPaused,
                    has_paid_spotlight: hasPaidSpotlight,
                    spotlight_until: profile?.spotlight_until || null,
                    days_left: spotlightDaysLeft,
                    requirements: spotlightRequirements
                },
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
            const rawCpRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [id]);
            const profile = rawCpRes.rows[0];

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            const activeSub = await db.orm.public.Subscription
                .where({ user_id: id, status: 'ACTIVE' })
                .include('plan')
                .first()
                .catch(() => null);

            const isBusiness = profile.tier === 'BUSINESS' || profile.is_strategic_partner || activeSub?.plan?.name === 'BUSINESS';
            const updates = pickFields(req.body, COMPANY_ALLOWED_FIELDS);

            // Cover image gating: Custom cover images are exclusively for Business profiles
            if (!isBusiness && updates.cover_image_url !== undefined) {
                delete updates.cover_image_url;
            }

            // Bio limit gating based on subscription tier
            if (!isBusiness) {
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

            if (updates.phone !== undefined && updates.phone !== null && String(updates.phone).trim() !== '') {
                if (!isValidPhoneNumber(String(updates.phone))) {
                    return res.status(400).json({
                        success: false,
                        error: 'Bitte geben Sie eine gültige Telefonnummer ein.'
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

            const fields = Object.keys(updates);
            const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
            const values = fields.map(f => updates[f]);
            const updateRes = await pool.query(
                `UPDATE company_profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $${fields.length + 1} RETURNING *`,
                [...values, id]
            );
            const updated = updateRes.rows[0];

            checkAndAwardPioneerBadge(id).catch(() => {});
            checkAndAwardReferralCreditsOnCommercialProfile(id).catch(() => {});

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

        if (updates.phone !== undefined && updates.phone !== null && String(updates.phone).trim() !== '') {
            if (!isValidPhoneNumber(String(updates.phone))) {
                return res.status(400).json({
                    success: false,
                    error: 'Bitte geben Sie eine gültige Telefonnummer ein.'
                });
            }
        }

        const updated = await db.orm.public.PrivateProfile
            .where((p) => p.user_id.eq(id))
            .update(updates);

        checkAndAwardPioneerBadge(id).catch(() => {});

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
            const rawCpRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
            const profile = rawCpRes.rows[0];

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Profil nicht gefunden.' });
            }

            const activeSub = await db.orm.public.Subscription
                .where({ user_id: userId, status: 'ACTIVE' })
                .include('plan')
                .first()
                .catch(() => null);

            const isBusiness = profile.tier === 'BUSINESS' || profile.is_strategic_partner || activeSub?.plan?.name === 'BUSINESS';
            const spotlightUntil = profile?.spotlight_until ? new Date(profile.spotlight_until) : null;
            const now = new Date();
            const hasPaidSpotlight = Boolean(spotlightUntil && spotlightUntil > now) || Boolean(profile?.is_strategic_partner);
            const hasLogo = Boolean(profile?.logo_url && profile.logo_url.trim());
            const hasCover = Boolean(profile?.cover_image_url && profile.cover_image_url.trim());
            const hasBio = Boolean(profile?.bio && profile.bio.trim().length >= 20);
            const hasPhone = Boolean(profile?.phone && profile.phone.trim());
            const hasLocation = Boolean((profile?.location && profile.location.trim()) || (profile?.company_address && profile.company_address.trim()));
            const isVerified = Boolean(user?.email_verified);
            const isSpotlightActive = hasPaidSpotlight && hasLogo && hasCover && hasBio && hasPhone && hasLocation && isVerified;

            // Public view — exclude sensitive business fields
            const { id, user_id, created_at, updated_at, vat_id, impressum, company_email, ...publicFields } = profile;

            // Free commercial accounts do not expose custom cover image
            if (!isBusiness) {
                publicFields.cover_image_url = null;
            }

            return res.status(200).json({
                success: true,
                profile_type: 'COMMERCIAL',
                profile: { 
                    ...publicFields, 
                    is_business: isBusiness, 
                    is_spotlight_active: isSpotlightActive,
                    spotlight_until: profile?.spotlight_until || null,
                    member_since: user.created_at 
                },
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

        // Generate portable relative URL
        const fileUrl = `/uploads/${req.file.filename}`;

        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                message: 'Administrator-Foto erfolgreich hochgeladen.',
                url: fileUrl
            });
        }

        if (user_type === 'COMMERCIAL') {
            await pool.query(
                'UPDATE company_profiles SET logo_url = $1, updated_at = NOW() WHERE user_id = $2',
                [fileUrl, id]
            );
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
 * Exclusively gated for COMMERCIAL accounts on BUSINESS tier.
 */
export const uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }

        const { id, user_type, role } = req.user;

        // Generate portable relative URL
        const fileUrl = `/uploads/${req.file.filename}`;

        if (role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                message: 'Hintergrundbild erfolgreich hochgeladen.',
                url: fileUrl
            });
        }

        if (user_type === 'COMMERCIAL') {
            const rawCpRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [id]);
            const profile = rawCpRes.rows[0];

            if (!profile) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            const activeSub = await db.orm.public.Subscription
                .where({ user_id: id, status: 'ACTIVE' })
                .include('plan')
                .first()
                .catch(() => null);

            const isBusiness = profile.tier === 'BUSINESS' || profile.is_strategic_partner || activeSub?.plan?.name === 'BUSINESS';

            if (!isBusiness) {
                return res.status(403).json({
                    success: false,
                    error: 'Das individuelle Hintergrundbild ist exklusiv im Business-Tarif (29 €/Monat) verfügbar.'
                });
            }

            await pool.query(
                'UPDATE company_profiles SET cover_image_url = $1, updated_at = NOW() WHERE user_id = $2',
                [fileUrl, id]
            );
        } else {
            return res.status(403).json({
                success: false,
                error: 'Hintergrundbilder sind nur für gewerbliche Business-Konten verfügbar.'
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
 * POST /api/profile/spotlight
 * Books or extends Homepage Spotlight for a commercial profile.
 * Packages: 7 days = 14,99 € (1500 CC), 14 days = 24,99 € (2500 CC), 30 days = 39,99 € (4000 CC).
 * Requires complete profile: Logo, Cover, Bio >= 20 chars, Phone, Location/Address, Verified Commercial user.
 */
export const bookSpotlight = async (req, res) => {
    try {
        const userId = req.user.id;
        const { durationDays = 7, payment_method = 'CREDIT' } = req.body;

        const parsedDays = parseInt(durationDays, 10);
        const PRICING_CC = {
            7: 1500,   // 14,99 €
            14: 2500,  // 24,99 €
            30: 4000   // 39,99 €
        };

        const PRICING_EUR = {
            7: '14,99 €',
            14: '24,99 €',
            30: '39,99 €'
        };

        const cost = PRICING_CC[parsedDays];
        const priceEur = PRICING_EUR[parsedDays];

        if (!cost || !priceEur) {
            return res.status(400).json({
                success: false,
                error: 'Ungültige Spotlight-Dauer angegeben (erlaubt: 7, 14 oder 30 Tage).'
            });
        }

        // 1. Fetch user & verify commercial account
        const userRes = await pool.query('SELECT id, email, user_type, email_verified, is_suspended FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }
        const user = userRes.rows[0];

        if (user.user_type !== 'COMMERCIAL') {
            return res.status(403).json({
                success: false,
                error: 'Campuna Spotlight ist exklusiv für gewerbliche Anbieter verfügbar.'
            });
        }

        if (!user.email_verified) {
            return res.status(400).json({
                success: false,
                error: 'Bitte bestätige zuerst deine E-Mail-Adresse, um Spotlight buchen zu können.'
            });
        }

        // 2. Fetch company profile & validate completeness
        const profileRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
        }
        const profile = profileRes.rows[0];

        const hasLogo = Boolean(profile.logo_url && profile.logo_url.trim());
        const hasCover = Boolean(profile.cover_image_url && profile.cover_image_url.trim());
        const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 20);
        const hasPhone = Boolean(profile.phone && profile.phone.trim());
        const hasLocation = Boolean((profile.location && profile.location.trim()) || (profile.company_address && profile.company_address.trim()));

        const missing = [];
        if (!hasLogo) missing.push('Firmenlogo / Profilbild');
        if (!hasCover) missing.push('Titelbild / Banner');
        if (!hasBio) missing.push('Unternehmensbeschreibung (mind. 20 Zeichen)');
        if (!hasPhone) missing.push('Telefonnummer');
        if (!hasLocation) missing.push('Standort / Adresse');

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Für die Spotlight-Präsenz auf der Startseite muss dein Profil vollständig gepflegt sein. Fehlende Angaben: ${missing.join(', ')}.`,
                missing_requirements: missing,
                requirements_met: false
            });
        }

        // 3. Process payment
        const normMethod = (payment_method || 'CREDIT').toUpperCase();
        let newBalance = 0;

        if (normMethod === 'CREDIT') {
            const balanceRes = await pool.query(
                'SELECT COALESCE(SUM(amount), 0) as balance FROM credit_transactions WHERE user_id = $1',
                [userId]
            );
            const currentBalance = parseInt(balanceRes.rows[0]?.balance || 0, 10);

            if (currentBalance < cost) {
                return res.status(400).json({
                    success: false,
                    error: `Nicht genügend Campuna Credits vorhanden. Du benötigst ${cost.toLocaleString('de-DE')} CC (${currentBalance.toLocaleString('de-DE')} CC verfügbar).`,
                    balance: currentBalance,
                    required: cost
                });
            }

            await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, $2, 'FEATURE_SPEND', $3, NOW())`,
                [
                    userId,
                    -cost,
                    `${parsedDays}-Tage Campuna Spotlight für "${profile.company_name || user.email}" (-${cost.toLocaleString('de-DE')} CC)`
                ]
            );
            newBalance = currentBalance - cost;
        } else {
            let methodLabel = 'Kreditkarte';
            if (normMethod === 'SEPA') methodLabel = 'SEPA-Lastschrift';
            else if (normMethod === 'PAYPAL') methodLabel = 'PayPal';
            else if (normMethod === 'DIRECT') methodLabel = 'Direktzahlung';

            await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, 0, 'DIRECT_SPOTLIGHT_PAYMENT', $2, NOW())`,
                [
                    userId,
                    `${parsedDays}-Tage Campuna Spotlight für "${profile.company_name || user.email}" (${priceEur} bezahlt via ${methodLabel})`
                ]
            );
        }

        // 4. Calculate new spotlight_until
        let newSpotlightUntil;
        const currentSpotlight = profile.spotlight_until ? new Date(profile.spotlight_until) : null;
        const now = new Date();

        if (currentSpotlight && currentSpotlight > now) {
            newSpotlightUntil = new Date(currentSpotlight.getTime() + parsedDays * 24 * 60 * 60 * 1000);
        } else {
            newSpotlightUntil = new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000);
        }

        // 5. Update company_profiles spotlight_until
        await pool.query(
            `UPDATE company_profiles
             SET spotlight_until = $1, updated_at = NOW()
             WHERE user_id = $2`,
            [newSpotlightUntil.toISOString(), userId]
        );

        const daysLeft = Math.ceil((newSpotlightUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
            success: true,
            message: `Glückwunsch! Dein Unternehmen "${profile.company_name}" ist jetzt für ${parsedDays} Tage im Campuna Spotlight auf der Startseite aktiv.`,
            spotlight_until: newSpotlightUntil.toISOString(),
            is_active: true,
            days_left: daysLeft,
            new_balance: newBalance,
            payment_method: normMethod,
            spent_credits: normMethod === 'CREDIT' ? cost : 0
        });

    } catch (error) {
        console.error('❌ bookSpotlight error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Buchen des Spotlight-Pakets.' });
    }
};

/**
 * GET /api/profile
 * Returns a public list of all active user profiles with their listing counts and spotlight eligibility.
 */
export const getAllProfiles = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                COALESCE(cp.company_name, 'Gewerblicher Anbieter') as name,
                COALESCE(cp.logo_url, '') as logo,
                CASE 
                    WHEN cp.tier = 'BUSINESS' OR sub.id IS NOT NULL OR cp.is_strategic_partner = TRUE 
                    THEN COALESCE(cp.cover_image_url, '') 
                    ELSE '' 
                END as "coverImage",
                COALESCE(cp.bio, '') as description,
                COALESCE(cp.location, 'Deutschland') as location,
                COALESCE(cp.phone, '') as phone,
                COALESCE(cp.company_address, '') as "companyAddress",
                COALESCE(l_count.count, 0)::int as "listingsCount",
                'Gewerblich' as type,
                CASE 
                    WHEN cp.tier = 'BUSINESS' OR sub.id IS NOT NULL OR cp.is_strategic_partner = TRUE THEN TRUE
                    ELSE FALSE 
                END as "isBusiness",
                CASE 
                    WHEN ((cp.spotlight_until IS NOT NULL AND cp.spotlight_until > NOW()) OR cp.is_strategic_partner = TRUE)
                     AND u.email_verified IS TRUE
                     AND cp.logo_url IS NOT NULL AND cp.logo_url != ''
                     AND cp.cover_image_url IS NOT NULL AND cp.cover_image_url != ''
                     AND LENGTH(COALESCE(cp.bio, '')) >= 20
                     AND (cp.phone IS NOT NULL AND cp.phone != '')
                     AND (COALESCE(cp.location, '') != '' OR COALESCE(cp.company_address, '') != '')
                    THEN TRUE
                    ELSE FALSE
                END as "isSpotlightEligible"
            FROM users u
            JOIN company_profiles cp ON cp.user_id = u.id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as count 
                FROM listings 
                WHERE status = 'APPROVED' 
                GROUP BY user_id
            ) l_count ON l_count.user_id = u.id
            LEFT JOIN (
                SELECT s.user_id, s.id
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.status = 'ACTIVE' AND p.name = 'BUSINESS'
            ) sub ON sub.user_id = u.id
            WHERE (u.is_suspended IS FALSE OR u.is_suspended IS NULL) AND u.user_type = 'COMMERCIAL'
            ORDER BY "isSpotlightEligible" DESC, "isBusiness" DESC, "listingsCount" DESC, u.created_at DESC
            LIMIT 50;
        `;
        const result = await pool.query(query);

        return res.status(200).json({
            success: true,
            profiles: result.rows || []
        });
    } catch (error) {
        console.error('❌ getAllProfiles error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Profile.' });
    }
};


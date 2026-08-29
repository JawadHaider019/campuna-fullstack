import { db } from '../prisma/db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables. Set it in your .env file.');
}
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalizeEmail = (email) => email.toLowerCase().trim();

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
};

const generateReferralCode = () =>
    'CAMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

/**
 * Issue Access Token (15 min) + Refresh Token (30 days) after login
 */
const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET + '_refresh', { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

/**
 * Issue short-lived email verification token (24h) — embedded in verification link
 */
const generateVerificationToken = (userId) =>
    jwt.sign({ id: userId, purpose: 'email-verification' }, JWT_SECRET, { expiresIn: '24h' });

/**
 * Delete an unverified user and all associated records (profiles, referrals)
 */
const deleteUnverifiedUser = async (userId) => {
    await db.transaction(async (tx) => {
        await tx.execute(
            tx.sql.public.private_profiles.delete()
                .where((f, fns) => fns.eq(f.user_id, userId)).build()
        ).catch(() => { });

        await tx.execute(
            tx.sql.public.company_profiles.delete()
                .where((f, fns) => fns.eq(f.user_id, userId)).build()
        ).catch(() => { });

        await tx.execute(
            tx.sql.public.referrals.delete()
                .where((f, fns) => fns.or(fns.eq(f.referrer_id, userId), fns.eq(f.referred_id, userId))).build()
        ).catch(() => { });

        await tx.execute(
            tx.sql.public.users.delete()
                .where((f, fns) => fns.eq(f.id, userId)).build()
        );
    });
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/register
 * Creates a new user, hashes password, issues a verification token.
 * No login tokens are issued — user must verify email first.
 */
export const register = async (req, res) => {
    try {
        const {
            email,
            password,
            account_type,
            first_name,
            last_name,
            company_name,
            company_email,
            website_url,
            impressum,
            referred_by_code,
        } = req.body;

        if (!email || !password || !account_type) {
            return res.status(400).json({ success: false, error: 'Email, Passwort und Kontotyp sind erforderlich.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const normalizedAccountType = account_type.toUpperCase();

        if (!['PRIVATE', 'COMMERCIAL'].includes(normalizedAccountType)) {
            return res.status(400).json({ success: false, error: 'Ungültiger Kontotyp. Muss PRIVATE oder COMMERCIAL sein.' });
        }

        const existingUser = await db.orm.public.User
            .where((u) => u.email.eq(normalizedEmail))
            .first();

        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Diese E-Mail-Adresse ist bereits registriert.' });
        }

        const result = await db.transaction(async (tx) => {
            const newUser = await tx.orm.public.User.create({
                email: normalizedEmail,
                password_hash: hashPassword(password),
                role: 'USER',
                user_type: normalizedAccountType,
                referral_code: generateReferralCode(),
                referred_by_code: referred_by_code ? referred_by_code.trim().toUpperCase() : null,
                email_verified: false,
            });

            if (normalizedAccountType === 'PRIVATE') {
                await tx.orm.public.PrivateProfile.create({
                    user_id: newUser.id,
                    first_name: first_name || '',
                    last_name: last_name || '',
                });
            } else {
                await tx.orm.public.CompanyProfile.create({
                    user_id: newUser.id,
                    company_name: company_name || '',
                    company_email: company_email || null,
                    website_url: website_url || null,
                    first_name: first_name || null,
                    last_name: last_name || null,
                });
            }

            if (referred_by_code) {
                const referrer = await tx.orm.public.User
                    .where((u) => u.referral_code.eq(referred_by_code.trim().toUpperCase()))
                    .first();
                if (referrer) {
                    await tx.orm.public.Referral.create({
                        referrer_id: referrer.id,
                        referred_id: newUser.id,
                        status: 'PENDING',
                    });
                }
            }

            return newUser;
        });

        const verificationToken = generateVerificationToken(result.id);

        // TODO: send verification email
        // e.g. https://campuna.de/de/email-bestaetigen?token=${verificationToken}
        console.log(`✅ User registered: ${result.email} (ID: ${result.id})`);

        return res.status(201).json({
            success: true,
            message: 'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.',
            verification_token: verificationToken,
            user: {
                id: result.id,
                email: result.email,
                role: result.role,
                account_type: result.user_type,
                referral_code: result.referral_code,
            },
        });

    } catch (error) {
        console.error('❌ Registration error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' });
    }
};

/**
 * GET /api/verify-status?email=...
 * Polls email verification status. If unverified and > 24h old, the account is deleted.
 */
export const getVerificationStatus = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, error: 'E-Mail-Parameter fehlt.' });
        }

        const user = await db.orm.public.User
            .where((u) => u.email.eq(normalizeEmail(email)))
            .first();

        if (!user) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }

        if (!user.email_verified) {
            const isExpired = (Date.now() - new Date(user.created_at).getTime()) > VERIFICATION_EXPIRY_MS;
            if (isExpired) {
                await deleteUnverifiedUser(user.id);
                return res.status(410).json({
                    success: false,
                    error: 'Registrierung abgelaufen. Bitte erstelle dein Konto erneut.',
                });
            }
        }

        return res.status(200).json({
            success: true,
            email_verified: user.email_verified,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                account_type: user.user_type,
                referral_code: user.referral_code,
            },
        });

    } catch (error) {
        console.error('❌ Verification status error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/login
 * Verifies credentials, checks email_verified and suspension.
 * Issues Access Token (15m) + Refresh Token (30d) on success.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'E-Mail und Passwort sind erforderlich.' });
        }

        const user = await db.orm.public.User
            .where((u) => u.email.eq(normalizeEmail(email)))
            .first();

        // Generic error — don't reveal whether email exists
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ success: false, error: 'Ungültige E-Mail-Adresse oder Passwort.' });
        }

        if (user.is_suspended) {
            return res.status(403).json({ success: false, error: 'Dein Konto wurde gesperrt. Bitte kontaktiere den Support.' });
        }

        if (!user.email_verified) {
            const isExpired = (Date.now() - new Date(user.created_at).getTime()) > VERIFICATION_EXPIRY_MS;
            if (isExpired) {
                await deleteUnverifiedUser(user.id);
                return res.status(410).json({
                    success: false,
                    error: 'Deine Registrierung ist abgelaufen (24-Stunden-Frist überschritten). Bitte registriere dich erneut.',
                });
            }
            return res.status(403).json({
                success: false,
                email_verified: false,
                error: 'Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.',
            });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        return res.status(200).json({
            success: true,
            message: 'Login erfolgreich.',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                account_type: user.user_type,
                referral_code: user.referral_code,
            },
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/logout
 * Logs out the user by returning a success message.
 * The client will discard the tokens.
 */
export const logout = async (req, res) => {
    try {
        // Since we are using stateless JWTs, we just return success.
        // If we implement a token blacklist, we can store blacklisted tokens here.
        return res.status(200).json({
            success: true,
            message: 'Erfolgreich abgemeldet.'
        });
    } catch (error) {
        console.error('❌ Logout error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/refresh
 * Exchanges a valid refresh token for a fresh access & refresh token pair.
 */
export const refresh = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ success: false, error: 'Refresh-Token ist erforderlich.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refresh_token, JWT_SECRET + '_refresh');
        } catch {
            return res.status(401).json({ success: false, error: 'Ungültiger oder abgelaufener Refresh-Token.' });
        }

        const user = await db.orm.public.User
            .where((u) => u.id.eq(decoded.id))
            .first();

        if (!user) {
            return res.status(401).json({ success: false, error: 'Benutzer existiert nicht.' });
        }

        if (user.is_suspended) {
            return res.status(403).json({ success: false, error: 'Konto ist gesperrt.' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        return res.status(200).json({
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    } catch (error) {
        console.error('❌ Refresh token error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/verify-email
 * Verifies email using verification token. Updates user.email_verified = true.
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token ist erforderlich.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, error: 'Ungültiger oder abgelaufener Verifizierungstoken.' });
        }

        if (decoded.purpose !== 'email-verification') {
            return res.status(400).json({ success: false, error: 'Ungültiger Token-Typ.' });
        }

        const user = await db.orm.public.User
            .where((u) => u.id.eq(decoded.id))
            .first();

        if (!user) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }

        if (user.email_verified) {
            return res.status(200).json({ success: true, message: 'E-Mail-Adresse ist bereits verifiziert.' });
        }

        // Set email_verified to true
        await db.orm.public.User
            .where((u) => u.id.eq(user.id))
            .update({ email_verified: true });

        return res.status(200).json({
            success: true,
            message: 'E-Mail-Adresse erfolgreich verifiziert!',
        });

    } catch (error) {
        console.error('❌ Email verification error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};



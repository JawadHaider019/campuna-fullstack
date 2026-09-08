import 'dotenv/config';
import { db } from '../prisma/db.js';
import pool from '../config/database.js';
import crypto from 'crypto';
import { checkAndAwardPioneerBadge } from './badge.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetOtpEmail } from '../services/email.services.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables. Set it in your .env file.');
}
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// ─── Initialize Dedicated Admins & Password Reset Tables in PostgreSQL ───────────────────────────
const initAdminsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT DEFAULT 'Campuna Admin',
                role TEXT DEFAULT 'ADMIN',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                reset_token TEXT,
                is_used BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_reset_email ON password_reset_tokens(email);
        `);
        console.log('✅ Dedicated admins & password_reset_tokens tables verified in PostgreSQL');

        // Auto-purge any admin rows previously in the users table
        const rawEnvEmail = process.env.ADMIN_EMAIL || '';
        const envAdminEmail = rawEnvEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();
        if (envAdminEmail) {
            await pool.query(`
                DELETE FROM company_profiles WHERE company_name = 'Campuna Administration'
                  OR user_id IN (SELECT id FROM users WHERE role = 'ADMIN' OR email = $1)
            `, [envAdminEmail]).catch(() => {});

            await pool.query(`
                DELETE FROM private_profiles 
                WHERE user_id IN (SELECT id FROM users WHERE role = 'ADMIN' OR email = $1)
            `, [envAdminEmail]).catch(() => {});

            await pool.query(`
                DELETE FROM users WHERE role = 'ADMIN' OR email = $1
            `, [envAdminEmail]).catch(() => {});
        }
    } catch (err) {
        console.error('⚠️ Admins table initialization notice:', err.message);
    }
};
initAdminsTable();

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
 * Issue Access Token (30 days for admin, 7 days for users) + Refresh Token (30 days)
 */
const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    const expiresIn = user.role === 'ADMIN' ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET + '_refresh', { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

/**
 * Issue short-lived email verification token (15m) — embedded in verification link
 */
const generateVerificationToken = (userId) =>
    jwt.sign({ id: userId, purpose: 'email-verification' }, JWT_SECRET, { expiresIn: '15m' });

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

/**
 * Periodic background job: Purge unverified user accounts older than 15 minutes
 */
const cleanupExpiredUnverifiedUsers = async () => {
    try {
        const expiredRes = await pool.query(`
            SELECT id, email FROM users
            WHERE email_verified = false
              AND role != 'ADMIN'
              AND created_at < NOW() - INTERVAL '15 minutes'
        `);

        for (const u of expiredRes.rows) {
            console.log(`⏱️ Purging expired unverified user (>15 min): ${u.email} (${u.id})`);
            await deleteUnverifiedUser(u.id);
        }
    } catch (err) {
        console.error('⚠️ Cleanup unverified users error:', err.message);
    }
};

// Run cleanup immediately and then periodically every 2 minutes
setInterval(cleanupExpiredUnverifiedUsers, 2 * 60 * 1000);
cleanupExpiredUnverifiedUsers();

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

        // Send verification email via Resend
        if (process.env.RESEND_API_KEY) {
            sendVerificationEmail(result.email, verificationToken)
                .then(() => console.log(`📧 Verification email sent via Resend to ${result.email}`))
                .catch((err) => console.warn(`⚠️ Warning: Failed to send verification email to ${result.email}:`, err.message));
        } else {
            console.log(`ℹ️ [Resend] RESEND_API_KEY not set in .env. Verification token: ${verificationToken}`);
        }

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

        const inputEmail = normalizeEmail(email);
        const inputPassword = String(password).trim();

        // 1. Check if login matches .env ADMIN credentials (strip any quotes/spaces)
        const rawEnvEmail = process.env.ADMIN_EMAIL || '';
        const rawEnvPass = process.env.ADMIN_PASSWORD || '';
        const envAdminEmail = rawEnvEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();
        const envAdminPassword = rawEnvPass.replace(/^["']|["']$/g, '').trim();

        if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail && inputPassword === envAdminPassword) {
            console.log(`👑 Admin login matched for ${inputEmail} via dedicated admins table`);

            // Find or provision admin in dedicated 'admins' table
            let adminResult = await pool.query('SELECT * FROM admins WHERE email = $1', [inputEmail]);
            let adminRecord = adminResult.rows[0];

            if (!adminRecord) {
                const insertRes = await pool.query(
                    `INSERT INTO admins (email, password_hash, name, role)
                     VALUES ($1, $2, 'Campuna Admin', 'ADMIN')
                     RETURNING *`,
                    [inputEmail, hashPassword(inputPassword)]
                );
                adminRecord = insertRes.rows[0];
            } else {
                await pool.query(
                    `UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
                    [hashPassword(inputPassword), adminRecord.id]
                );
            }

            const { accessToken, refreshToken } = generateTokens({
                id: adminRecord.id,
                email: adminRecord.email,
                role: 'ADMIN'
            });

            return res.status(200).json({
                success: true,
                message: 'Admin-Login erfolgreich.',
                access_token: accessToken,
                refresh_token: refreshToken,
                user: {
                    id: adminRecord.id,
                    email: adminRecord.email,
                    role: 'ADMIN',
                    name: adminRecord.name || 'Campuna Admin',
                },
            });
        }

        // 2. Standard user login check
        const user = await db.orm.public.User
            .where((u) => u.email.eq(inputEmail))
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
                    error: 'Deine Registrierung ist nach 15 Minuten abgelaufen. Dein Konto wurde gelöscht. Bitte erstelle dein Konto erneut.',
                });
            }
            return res.status(403).json({
                success: false,
                email_verified: false,
                error: 'Bitte bestätige deine E-Mail-Adresse innerhalb von 15 Minuten, bevor du dich anmeldest.',
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
            // Check if token expired
            if (err.name === 'TokenExpiredError') {
                const expiredDecoded = jwt.decode(token);
                if (expiredDecoded?.id) {
                    await deleteUnverifiedUser(expiredDecoded.id).catch(() => {});
                }
                return res.status(410).json({
                    success: false,
                    error: 'Der Verifizierungslink ist nach 15 Minuten abgelaufen. Dein Konto wurde gelöscht. Bitte registriere dich erneut.'
                });
            }
            return res.status(400).json({ success: false, error: 'Ungültiger oder abgelaufener Verifizierungslink.' });
        }

        if (decoded.purpose !== 'email-verification') {
            return res.status(400).json({ success: false, error: 'Ungültiger Token-Typ.' });
        }

        const user = await db.orm.public.User
            .where((u) => u.id.eq(decoded.id))
            .first();

        if (!user) {
            return res.status(404).json({ success: false, error: 'Benutzerkonto nicht gefunden oder Frist abgelaufen.' });
        }

        if (user.email_verified) {
            return res.status(200).json({ success: true, message: 'E-Mail-Adresse ist bereits verifiziert.' });
        }

        // Check if user was created > 15 minutes ago
        const isExpired = (Date.now() - new Date(user.created_at).getTime()) > VERIFICATION_EXPIRY_MS;
        if (isExpired) {
            await deleteUnverifiedUser(user.id);
            return res.status(410).json({
                success: false,
                error: 'Die 15-Minuten-Frist ist abgelaufen. Dein unvollständiges Konto wurde gelöscht. Bitte registriere dich erneut.'
            });
        }

        // Set email_verified to true
        await db.orm.public.User
            .where((u) => u.id.eq(user.id))
            .update({ email_verified: true });

        // Trigger Pioneer Badge check
        await checkAndAwardPioneerBadge(user.id).catch(err => {
            console.error('Pioneer check during email verification error:', err.message);
        });

        return res.status(200).json({
            success: true,
            message: 'E-Mail-Adresse erfolgreich verifiziert!',
        });

    } catch (error) {
        console.error('❌ Email verification error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * POST /api/forgot-password
 * Generates a 6-digit OTP code, stores it in password_reset_tokens with 15m expiration,
 * and sends it via Resend email.
 */
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, error: 'E-Mail-Adresse ist erforderlich.' });
        }

        const normalizedEmail = normalizeEmail(email);

        // Check if user or admin exists
        const user = await db.orm.public.User
            .where((u) => u.email.eq(normalizedEmail))
            .first();

        const adminRes = await pool.query('SELECT id, email FROM admins WHERE LOWER(email) = $1', [normalizedEmail]);

        if (!user && adminRes.rowCount === 0) {
            // For security, don't leak user existence directly, but return clear feedback
            return res.status(404).json({
                success: false,
                error: 'Kein Konto mit dieser E-Mail-Adresse gefunden.'
            });
        }

        // Generate 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Invalidate previous OTPs for this email
        await pool.query(
            'UPDATE password_reset_tokens SET is_used = TRUE WHERE LOWER(email) = $1 AND is_used = FALSE',
            [normalizedEmail]
        );

        // Save new OTP with 15 minutes expiration
        await pool.query(
            `INSERT INTO password_reset_tokens (email, otp_code, expires_at, is_used)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes', FALSE)`,
            [normalizedEmail, otpCode]
        );

        console.log(`🔑 [Password Reset OTP] Email: ${normalizedEmail} | OTP Code: ${otpCode}`);

        // Send OTP email via Resend
        if (process.env.RESEND_API_KEY) {
            sendPasswordResetOtpEmail(normalizedEmail, otpCode)
                .then(() => console.log(`📧 Password reset OTP sent to ${normalizedEmail}`))
                .catch((err) => console.warn(`⚠️ Warning: Failed to send OTP email to ${normalizedEmail}:`, err.message));
        } else {
            console.log(`ℹ️ [Resend] RESEND_API_KEY not set in .env. Password Reset OTP for ${normalizedEmail}: ${otpCode}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Ein 6-stelliger Bestätigungscode wurde an deine E-Mail gesendet.'
        });

    } catch (error) {
        console.error('❌ requestPasswordReset error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Anfordern des Bestätigungscodes.' });
    }
};

/**
 * POST /api/verify-reset-otp
 * Verifies the 6-digit OTP code and returns a temporary reset token.
 */
export const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'E-Mail und Bestätigungscode sind erforderlich.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const cleanOtp = otp.toString().trim();

        const tokenRes = await pool.query(
            `SELECT id, email, otp_code, expires_at, is_used
             FROM password_reset_tokens
             WHERE LOWER(email) = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [normalizedEmail, cleanOtp]
        );

        if (tokenRes.rowCount === 0) {
            return res.status(400).json({
                success: false,
                error: 'Ungültiger oder abgelaufener Bestätigungscode.'
            });
        }

        const record = tokenRes.rows[0];

        // Generate temporary reset token (30m validity)
        const resetToken = jwt.sign(
            { id: record.id, email: normalizedEmail, purpose: 'password-reset' },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        // Update token record with reset_token
        await pool.query(
            'UPDATE password_reset_tokens SET reset_token = $1 WHERE id = $2',
            [resetToken, record.id]
        );

        return res.status(200).json({
            success: true,
            reset_token: resetToken,
            message: 'Code erfolgreich bestätigt. Du kannst nun dein neues Passwort festlegen.'
        });

    } catch (error) {
        console.error('❌ verifyResetOtp error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Überprüfen des Codes.' });
    }
};

/**
 * POST /api/reset-password
 * Resets user's password using the verified reset_token.
 */
export const resetPassword = async (req, res) => {
    try {
        const { email, reset_token, new_password } = req.body;

        if (!email || !reset_token || !new_password) {
            return res.status(400).json({ success: false, error: 'Alle Felder sind erforderlich.' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
        }

        const normalizedEmail = normalizeEmail(email);

        // Verify JWT reset token
        let decoded;
        try {
            decoded = jwt.verify(reset_token, JWT_SECRET);
        } catch {
            return res.status(400).json({ success: false, error: 'Ungültiger oder abgelaufener Reset-Token.' });
        }

        if (decoded.purpose !== 'password-reset' || normalizeEmail(decoded.email) !== normalizedEmail) {
            return res.status(400).json({ success: false, error: 'Ungültiger Reset-Token.' });
        }

        // Check if token in database is valid and not used
        const tokenRes = await pool.query(
            `SELECT id FROM password_reset_tokens
             WHERE LOWER(email) = $1 AND reset_token = $2 AND is_used = FALSE
             LIMIT 1`,
            [normalizedEmail, reset_token]
        );

        if (tokenRes.rowCount === 0) {
            return res.status(400).json({ success: false, error: 'Dieser Reset-Token wurde bereits verwendet oder ist ungültig.' });
        }

        const newHash = hashPassword(new_password);

        // Update in users table
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2',
            [newHash, normalizedEmail]
        );

        // Also update in admins table if admin
        await pool.query(
            'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2',
            [newHash, normalizedEmail]
        );

        // Mark reset token as used
        await pool.query(
            'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = $1',
            [tokenRes.rows[0].id]
        );

        console.log(`✅ Password successfully reset for ${normalizedEmail}`);

        return res.status(200).json({
            success: true,
            message: 'Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt anmelden.'
        });

    } catch (error) {
        console.error('❌ resetPassword error:', error.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Zurücksetzen des Passworts.' });
    }
};



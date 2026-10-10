import { db } from '../prisma/db.js';
import pool from '../config/database.js';

/**
 * Checks if a company profile meets all required completeness criteria:
 * - company_name (non-empty)
 * - phone (non-empty)
 * - location or company_address (non-empty)
 * - bio (at least 20 characters)
 * - logo_url (non-empty)
 */
export const isCompanyProfileComplete = (profile) => {
    if (!profile) return false;
    const hasName = Boolean(profile.company_name && profile.company_name.trim());
    const hasPhone = Boolean(profile.phone && profile.phone.trim());
    const hasLocation = Boolean((profile.location && profile.location.trim()) || (profile.company_address && profile.company_address.trim()));
    const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 20);
    const hasLogo = Boolean(profile.logo_url && profile.logo_url.trim());
    return hasName && hasPhone && hasLocation && hasBio && hasLogo;
};

/**
 * Core Referral Evaluation Engine.
 * Evaluates pending referral qualifications strictly according to Campuna rules:
 * 
 * 1. Private User:
 *    - Referral code registered + Email verified + 1st Listing approved & active
 *    - Reward: 500 Credits to Referrer ONLY.
 * 
 * 2. Commercial Free:
 *    - Referral code registered + Email verified + Complete company profile + 1st Listing approved & active
 *    - Reward: 1,000 Credits to Referrer ONLY.
 * 
 * 3. Commercial Business:
 *    - Referral code registered + Email verified + Complete company profile + 1st Successful Business subscription payment
 *    - (No listing required for paid Business subscriber)
 *    - Reward: 1,000 Credits to Referrer ONLY.
 * 
 * Strict Anti-Fraud & Idempotency:
 * - Only the referrer receives credits (no signup bonus to referred user).
 * - Each referral can only be rewarded once (atomic UPDATE WHERE status = 'PENDING').
 * - Self-referrals and duplicate accounts are blocked.
 */
export const evaluateAndAwardReferral = async (userId) => {
    try {
        if (!userId) return false;

        // 1. Fetch user status
        const userRes = await pool.query(
            'SELECT id, email, user_type, email_verified FROM users WHERE id = $1',
            [userId]
        );
        if (userRes.rows.length === 0) return false;
        const user = userRes.rows[0];

        // Rule: Email must be verified
        if (!user.email_verified) {
            return false;
        }

        // 2. Fetch pending referral record
        const pendingRefRes = await pool.query(
            `SELECT r.*, u.email as referrer_email, u.referral_code as referrer_code 
             FROM referrals r
             JOIN users u ON u.id = r.referrer_id
             WHERE r.referred_id = $1 AND r.status = 'PENDING'
             LIMIT 1`,
            [userId]
        );

        if (pendingRefRes.rows.length === 0) return false;
        const ref = pendingRefRes.rows[0];

        // Rule: Anti-fraud self-referral prevention
        if (
            ref.referrer_id === userId ||
            (ref.referrer_email && ref.referrer_email.toLowerCase() === (user.email || '').toLowerCase())
        ) {
            await pool.query("UPDATE referrals SET status = 'CANCELLED' WHERE id = $1", [ref.id]);
            console.warn(`[Referral Anti-Fraud] Cancelled self-referral for user ${userId}`);
            return false;
        }

        const userType = user.user_type || 'PRIVATE';

        // ── CASE A: Private User (500 Credits) ────────────────────────────────
        if (userType === 'PRIVATE') {
            const approvedListingsRes = await pool.query(
                "SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND status = 'APPROVED'",
                [userId]
            );
            const approvedCount = parseInt(approvedListingsRes.rows[0]?.count || 0, 10);
            if (approvedCount < 1) return false;

            // Atomically mark referral COMPLETED
            const updateRes = await pool.query(
                "UPDATE referrals SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING' RETURNING id",
                [ref.id]
            );
            if (updateRes.rows.length === 0) return false; // Already processed

            // Award 500 CC to Referrer ONLY
            await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, 500, 'REFERRAL_REWARD', $2, NOW())`,
                [ref.referrer_id, `Empfehlungsbonus für freigeschaltetes Inserat von ${user.email} (+500 CC)`]
            );

            console.log(`🎉 Referral completed: Referrer ${ref.referrer_email} received 500 CC for ${user.email}.`);
            return true;
        }

        // ── CASE B: Commercial User (1,000 Credits) ───────────────────────────
        if (userType === 'COMMERCIAL') {
            const profileRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
            if (profileRes.rows.length === 0) return false;
            const profile = profileRes.rows[0];

            // Company profile must be complete
            if (!isCompanyProfileComplete(profile)) {
                return false;
            }

            const companyName = profile.company_name || user.email || 'Gewerblicher Partner';

            // Path 1: Paid Business Subscription
            const paidSubRes = await pool.query(
                `SELECT id, amount_paid_cents, status 
                 FROM subscriptions 
                 WHERE user_id = $1 AND status = 'ACTIVE' AND amount_paid_cents > 0
                 LIMIT 1`,
                [userId]
            );
            const hasPaidBusiness = paidSubRes.rows.length > 0;

            // Path 2: Free Tier with at least 1 Approved Listing
            const approvedListingsRes = await pool.query(
                "SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND status = 'APPROVED'",
                [userId]
            );
            const approvedCount = parseInt(approvedListingsRes.rows[0]?.count || 0, 10);
            const hasApprovedListing = approvedCount >= 1;

            if (!hasPaidBusiness && !hasApprovedListing) {
                return false;
            }

            // Atomically mark referral COMPLETED
            const updateRes = await pool.query(
                "UPDATE referrals SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING' RETURNING id",
                [ref.id]
            );
            if (updateRes.rows.length === 0) return false; // Already processed

            const rewardDesc = hasPaidBusiness
                ? `Empfehlungsbonus für Business-Abonnement von ${companyName} (+1.000 CC)`
                : `Empfehlungsbonus für gewerblichen Partner (Free) von ${companyName} (+1.000 CC)`;

            // Award 1,000 CC to Referrer ONLY
            await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, 1000, 'REFERRAL_REWARD', $2, NOW())`,
                [ref.referrer_id, rewardDesc]
            );

            console.log(`🎉 Commercial Referral completed: Referrer ${ref.referrer_email} received 1.000 CC for ${companyName} (${hasPaidBusiness ? 'Business' : 'Free + Inserat'}).`);
            return true;
        }

        return false;
    } catch (err) {
        console.error('evaluateAndAwardReferral error:', err.message);
        return false;
    }
};

/**
 * Triggers referral evaluation when a listing is approved.
 */
export const checkAndAwardReferralCreditsOnApproval = async (userId) => {
    return evaluateAndAwardReferral(userId);
};

/**
 * Triggers referral evaluation when a commercial profile is updated.
 */
export const checkAndAwardReferralCreditsOnCommercialProfile = async (userId) => {
    return evaluateAndAwardReferral(userId);
};

/**
 * Triggers referral evaluation when a Business subscription payment succeeds.
 */
export const checkAndAwardReferralCreditsOnBusinessSubscription = async (userId) => {
    return evaluateAndAwardReferral(userId);
};

/**
 * Triggers referral evaluation when email is verified.
 */
export const checkAndAwardReferralCreditsOnEmailVerification = async (userId) => {
    return evaluateAndAwardReferral(userId);
};

/**
 * GET /api/referrals/stats
 */
export const getReferralStats = async (req, res) => {
    try {
        const { id } = req.user;

        const referrals = await db.orm.public.Referral
            .where((r) => r.referrer_id.eq(id))
            .all();

        const pendingCount = referrals.filter(r => r.status === 'PENDING').length;
        const completedCount = referrals.filter(r => r.status === 'COMPLETED').length;

        return res.status(200).json({
            success: true,
            stats: {
                total: referrals.length,
                pending: pendingCount,
                completed: completedCount
            }
        });
    } catch (err) {
        console.error('getReferralStats error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Referral-Statistik.' });
    }
};

/**
 * GET /api/referrals/list
 */
export const getReferralsList = async (req, res) => {
    try {
        const { id } = req.user;

        const referrals = await db.orm.public.Referral
            .where((r) => r.referrer_id.eq(id))
            .all();

        // Populate referred user email and registration details
        const list = [];
        for (const ref of referrals) {
            const referredUser = await db.orm.public.User
                .where((u) => u.id.eq(ref.referred_id))
                .first();

            if (referredUser) {
                let displayName = referredUser.email;
                if (referredUser.user_type === 'PRIVATE') {
                    const profile = await db.orm.public.PrivateProfile
                        .where((p) => p.user_id.eq(ref.referred_id))
                        .first();
                    if (profile) {
                        displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || referredUser.email;
                    }
                } else {
                    const profile = await db.orm.public.CompanyProfile
                        .where((p) => p.user_id.eq(ref.referred_id))
                        .first();
                    if (profile) {
                        displayName = profile.company_name || referredUser.email;
                    }
                }

                list.push({
                    id: ref.id,
                    referred_email: referredUser.email,
                    referred_name: displayName,
                    referred_type: referredUser.user_type,
                    status: ref.status,
                    created_at: ref.created_at
                });
            }
        }

        return res.status(200).json({ success: true, referrals: list });
    } catch (err) {
        console.error('getReferralsList error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Referral-Liste.' });
    }
};

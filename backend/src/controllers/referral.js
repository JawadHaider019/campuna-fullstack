import { db } from '../prisma/db.js';
import pool from '../config/database.js';

/**
 * Checks if a user has a PENDING referral and awards 100 CC to both referrer and user
 * upon their 1st listing approval (status = 'APPROVED').
 */
export const checkAndAwardReferralCreditsOnApproval = async (userId) => {
    try {
        if (!userId) return false;

        // 1. Verify that user has at least 1 APPROVED listing
        const approvedRes = await pool.query(
            "SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND status = 'APPROVED'",
            [userId]
        );
        const count = parseInt(approvedRes.rows[0]?.count || 0, 10);
        if (count < 1) return false;

        // 2. Check for an active PENDING referral for this user
        const pendingRef = await pool.query(
            `SELECT r.*, u.email as referrer_email, u.referral_code as referrer_code 
             FROM referrals r
             JOIN users u ON u.id = r.referrer_id
             WHERE r.referred_id = $1 AND r.status = 'PENDING'
             LIMIT 1`,
            [userId]
        );

        if (pendingRef.rows.length === 0) return false;

        const ref = pendingRef.rows[0];
        const userEmailRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const userEmail = userEmailRes.rows[0]?.email || 'Nutzer';

        // 3. Mark referral as COMPLETED
        await pool.query('UPDATE referrals SET status = $1 WHERE id = $2', ['COMPLETED', ref.id]);

        // 4. Award 100 CC to Referrer
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 100, 'REFERRAL_REWARD', $2, NOW())`,
            [ref.referrer_id, `Empfehlungsbonus für freigeschaltetes Inserat von ${userEmail} (+100 CC)`]
        );

        // 5. Award 100 CC to Referred User (Creator)
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 100, 'REFERRAL_SIGNUP_BONUS', $2, NOW())`,
            [userId, `Willkommensbonus für erstes freigeschaltetes Inserat (+100 CC)`]
        );

        console.log(`🎉 Referral completed upon listing approval: Both ${ref.referrer_email} and ${userEmail} received 100 CC.`);
        return true;
    } catch (err) {
        console.error('checkAndAwardReferralCreditsOnApproval error:', err.message);
        return false;
    }
};

/**
 * Checks if a COMMERCIAL user has a PENDING referral and awards 100 CC to both referrer and user
 * upon completing their company profile (company_name, phone, location/address, bio >= 20, logo_url).
 */
export const checkAndAwardReferralCreditsOnCommercialProfile = async (userId) => {
    try {
        if (!userId) return false;

        // 1. Check user type and profile
        const userRes = await pool.query('SELECT id, email, user_type, email_verified FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return false;
        const user = userRes.rows[0];

        if (user.user_type !== 'COMMERCIAL') return false;

        const profileRes = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
        if (profileRes.rows.length === 0) return false;
        const profile = profileRes.rows[0];

        // Check completeness
        const hasName = Boolean(profile.company_name && profile.company_name.trim());
        const hasPhone = Boolean(profile.phone && profile.phone.trim());
        const hasLocation = Boolean((profile.location && profile.location.trim()) || (profile.company_address && profile.company_address.trim()));
        const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 20);
        const hasLogo = Boolean(profile.logo_url && profile.logo_url.trim());

        if (!hasName || !hasPhone || !hasLocation || !hasBio || !hasLogo) {
            return false;
        }

        // 2. Check for an active PENDING referral for this user
        const pendingRef = await pool.query(
            `SELECT r.*, u.email as referrer_email, u.referral_code as referrer_code 
             FROM referrals r
             JOIN users u ON u.id = r.referrer_id
             WHERE r.referred_id = $1 AND r.status = 'PENDING'
             LIMIT 1`,
            [userId]
        );

        if (pendingRef.rows.length === 0) return false;

        const ref = pendingRef.rows[0];
        const userEmail = user.email || 'Gewerblicher Partner';
        const companyName = profile.company_name || userEmail;

        // 3. Mark referral as COMPLETED
        await pool.query('UPDATE referrals SET status = $1 WHERE id = $2', ['COMPLETED', ref.id]);

        // 4. Award 100 CC to Referrer
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 100, 'REFERRAL_REWARD', $2, NOW())`,
            [ref.referrer_id, `Empfehlungsbonus für vollständiges Unternehmensprofil von ${companyName} (+100 CC)`]
        );

        // 5. Award 100 CC to Referred Commercial User
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 100, 'REFERRAL_SIGNUP_BONUS', $2, NOW())`,
            [userId, `Willkommensbonus für vollständiges Firmenprofil (+100 CC)`]
        );

        console.log(`🎉 Commercial Referral completed: Both ${ref.referrer_email} and ${companyName} received 100 CC.`);
        return true;
    } catch (err) {
        console.error('checkAndAwardReferralCreditsOnCommercialProfile error:', err.message);
        return false;
    }
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
                        displayName = `${profile.first_name} ${profile.last_name}`.trim() || referredUser.email;
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

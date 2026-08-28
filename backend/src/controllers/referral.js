import { db } from '../prisma/db.js';

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

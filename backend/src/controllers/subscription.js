import { db } from '../prisma/db.js';

/**
 * GET /api/subscriptions/plans
 */
export const getPlans = async (req, res) => {
    try {
        const plans = await db.orm.public.Plan.all();
        return res.status(200).json({ success: true, plans });
    } catch (err) {
        console.error('getPlans error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Pläne.' });
    }
};

/**
 * GET /api/subscriptions/me
 */
export const getMySubscription = async (req, res) => {
    try {
        const { id, user_type } = req.user;
        if (user_type !== 'COMMERCIAL') {
            return res.status(403).json({ success: false, error: 'Nur für gewerbliche Konten verfügbar.' });
        }

        const sub = await db.orm.public.Subscription
            .where((s) => s.user_id.eq(id))
            .first();

        const profile = await db.orm.public.CompanyProfile
            .where((p) => p.user_id.eq(id))
            .first();

        return res.status(200).json({
            success: true,
            subscription: sub || null,
            tier: profile?.tier || 'FREE',
            is_strategic_partner: profile?.is_strategic_partner || false
        });
    } catch (err) {
        console.error('getMySubscription error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Abonnement-Status.' });
    }
};

/**
 * POST /api/subscriptions/upgrade
 */
export const upgradeToBusiness = async (req, res) => {
    try {
        const { id, user_type } = req.user;
        if (user_type !== 'COMMERCIAL') {
            return res.status(403).json({ success: false, error: 'Nur für gewerbliche Konten verfügbar.' });
        }

        const businessPlan = await db.orm.public.Plan
            .where((p) => p.name.eq('BUSINESS'))
            .first();

        if (!businessPlan) {
            return res.status(404).json({ success: false, error: 'Business-Plan-Definition nicht gefunden.' });
        }

        // Calculate credit balance
        const txs = await db.orm.public.CreditTransaction
            .where((t) => t.user_id.eq(id))
            .all();
        const balance = txs.reduce((sum, t) => sum + t.amount, 0);

        const planPrice = businessPlan.price_monthly; // 2900 credits (€29.00)
        let paymentType = 'CARD_SIMULATION';

        // Perform transactional upgrade
        const result = await db.transaction(async (tx) => {
            // Deduct credits if balance is sufficient
            if (balance >= planPrice) {
                await tx.orm.public.CreditTransaction.create({
                    user_id: id,
                    amount: -planPrice,
                    type: 'SUBSCRIPTION_SPEND',
                    description: 'Upgrade auf Business-Tarif (Campuna Credits)',
                });
                paymentType = 'CREDIT_LEDGER';
            } else {
                // Otherwise, simulate external card payment success
                console.log(`[Billing] Insufficient credits (${balance}). Simulating successful credit card checkout for user ${id}`);
            }

            // Create or update subscription
            const currentSub = await tx.orm.public.Subscription
                .where((s) => s.user_id.eq(id))
                .first();

            const now = new Date();
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);

            const startStr = now.toISOString();
            const endStr = oneMonthLater.toISOString();

            let sub;
            if (currentSub) {
                sub = await tx.orm.public.Subscription
                    .where((s) => s.id.eq(currentSub.id))
                    .update({
                        plan_id: businessPlan.id,
                        status: 'ACTIVE',
                        current_period_start: startStr,
                        current_period_end: endStr,
                    });
            } else {
                sub = await tx.orm.public.Subscription.create({
                    user_id: id,
                    plan_id: businessPlan.id,
                    status: 'ACTIVE',
                    current_period_start: startStr,
                    current_period_end: endStr,
                });
            }

            // Update company profile tier to BUSINESS
            await tx.orm.public.CompanyProfile
                .where((p) => p.user_id.eq(id))
                .update({
                    tier: 'BUSINESS'
                });

            // Check for referral attribution reward
            const pendingReferral = await tx.orm.public.Referral
                .where((r) => r.referred_id.eq(id))
                .where((r) => r.status.eq('PENDING'))
                .first();

            if (pendingReferral) {
                // Update referral status to COMPLETED
                await tx.orm.public.Referral
                    .where((r) => r.id.eq(pendingReferral.id))
                    .update({ status: 'COMPLETED' });

                // Credit the referrer with 15,00 € (1500 credits)
                await tx.orm.public.CreditTransaction.create({
                    user_id: pendingReferral.referrer_id,
                    amount: 1500, // €15.00
                    type: 'REFERRAL_EARN',
                    description: 'Prämie für erfolgreiche Einladung von einem gewerblichen Partner (Business Upgrade)',
                });
                console.log(`[Referral] User ${id} upgraded to Business. Referrer ${pendingReferral.referrer_id} awarded 1500 credits.`);
            }

            return sub;
        });

        return res.status(200).json({
            success: true,
            message: 'Erfolgreich auf Business-Tarif aktualisiert!',
            payment_method: paymentType,
            subscription: result
        });

    } catch (err) {
        console.error('upgradeToBusiness error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Upgrade-Prozess.' });
    }
};

/**
 * POST /api/subscriptions/cancel
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { id, user_type } = req.user;
        if (user_type !== 'COMMERCIAL') {
            return res.status(403).json({ success: false, error: 'Nur für gewerbliche Konten verfügbar.' });
        }

        const sub = await db.orm.public.Subscription
            .where((s) => s.user_id.eq(id))
            .first();

        if (!sub) {
            return res.status(404).json({ success: false, error: 'Kein aktives Abonnement gefunden.' });
        }

        const updated = await db.orm.public.Subscription
            .where((s) => s.id.eq(sub.id))
            .update({
                status: 'CANCELLED' // Keeps active until current period end in real scenarios
            });

        // Downgrade profile tier back to FREE
        await db.orm.public.CompanyProfile
            .where((p) => p.user_id.eq(id))
            .update({
                tier: 'FREE'
            });

        return res.status(200).json({
            success: true,
            message: 'Abonnement erfolgreich gekündigt.',
            subscription: updated
        });
    } catch (err) {
        console.error('cancelSubscription error:', err);
        return res.status(500).json({ success: false, error: 'Fehler bei der Kündigung.' });
    }
};

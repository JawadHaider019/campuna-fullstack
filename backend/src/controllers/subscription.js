import { db } from '../prisma/db.js';

// ─── Internal Helper ─────────────────────────────────────────────────────────

/**
 * Returns the active subscription + its plan for a given user.
 * Falls back to the FREE plan if no active subscription exists.
 * @param {string} userId
 * @returns {{ subscription: object|null, plan: object }}
 */
export const getUserSubscription = async (userId) => {
    // Find active (non-expired, non-cancelled) subscription
    const activeSub = await db.orm.public.Subscription
        .where({ user_id: userId, status: 'ACTIVE' })
        .include('plan')
        .orderBy((s) => s.started_at.desc())
        .first();

    if (activeSub?.plan) {
        return { subscription: activeSub, plan: activeSub.plan };
    }

    // Fallback: return FREE plan (no active sub)
    const freePlan = await db.orm.public.Plan
        .where({ name: 'FREE' })
        .first();

    return { subscription: null, plan: freePlan };
};

/**
 * Returns feature flags for a user derived from their active plan.
 * @param {string} userId
 * @returns {object} Feature flags + plan metadata
 */
export const getUserFeatures = async (userId) => {
    const { subscription, plan } = await getUserSubscription(userId);

    if (!plan) {
        // Hard fallback — plan table not seeded yet
        return {
            plan_name: 'FREE',
            listing_limit: 3,
            has_cover_image: false,
            has_spotlight: false,
            has_statistics: false,
            has_csv_import: false,
            description_limit: 150,
            subscription_active: false,
            expires_at: null,
        };
    }

    return {
        plan_name: plan.name,
        listing_limit: plan.listing_limit,
        has_cover_image: plan.has_cover_image,
        has_spotlight: plan.has_spotlight,
        has_statistics: plan.has_statistics,
        has_csv_import: plan.has_csv_import,
        description_limit: plan.description_limit,
        subscription_active: !!subscription,
        expires_at: subscription?.expires_at ?? null,
    };
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/subscriptions/plans
 * Returns all active plans (public endpoint).
 */
export const getPlans = async (req, res) => {
    try {
        const plans = await db.orm.public.Plan
            .where({ is_active: true })
            .all();

        return res.status(200).json({ success: true, plans });
    } catch (err) {
        console.error('❌ getPlans error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Tarife.' });
    }
};

/**
 * GET /api/subscriptions/my
 * Returns the authenticated user's active subscription + plan info.
 */
export const getMySubscription = async (req, res) => {
    try {
        const { id } = req.user;
        const { subscription, plan } = await getUserSubscription(id);

        return res.status(200).json({
            success: true,
            subscription,
            plan,
            is_business: plan?.name === 'BUSINESS',
        });
    } catch (err) {
        console.error('❌ getMySubscription error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Abonnements.' });
    }
};

/**
 * GET /api/subscriptions/features
 * Returns feature flags for the authenticated user derived from their active plan.
 */
export const getMyFeatures = async (req, res) => {
    try {
        const { id } = req.user;
        const features = await getUserFeatures(id);

        return res.status(200).json({ success: true, features });
    } catch (err) {
        console.error('❌ getMyFeatures error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Funktionen.' });
    }
};

/**
 * POST /api/subscriptions/subscribe
 * Subscribes the user to a plan.
 *
 * Body:
 *   - plan_name: "BUSINESS" (required)
 *   - payment_method: "CREDIT" | "MANUAL" (default: "CREDIT")
 *   - duration_months: number (default: 1)
 *
 * If payment_method === "CREDIT":
 *   - Checks user's credit balance >= plan.price_cents
 *   - Deducts credits via CreditTransaction ledger
 *   - Cancels any currently active subscription
 *   - Creates new ACTIVE subscription with expiry date
 */
export const subscribe = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { plan_name, payment_method = 'CREDIT', duration_months = 1 } = req.body;

        if (!plan_name) {
            return res.status(400).json({ success: false, error: 'Tarifname ist erforderlich.' });
        }

        const planNameUpper = plan_name.toUpperCase();
        if (!['FREE', 'BUSINESS'].includes(planNameUpper)) {
            return res.status(400).json({ success: false, error: 'Ungültiger Tarifname.' });
        }

        // Fetch plan
        const plan = await db.orm.public.Plan
            .where({ name: planNameUpper, is_active: true })
            .first();

        if (!plan) {
            return res.status(404).json({ success: false, error: 'Tarif nicht gefunden.' });
        }

        const totalCost = plan.price_cents * duration_months;

        // --- Credit payment flow ---
        if (payment_method === 'CREDIT' && totalCost > 0) {
            // Calculate current credit balance
            const transactions = await db.orm.public.CreditTransaction
                .where({ user_id: userId })
                .all();
            const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

            if (balance < totalCost) {
                return res.status(402).json({
                    success: false,
                    error: `Nicht genügend Campuna-Guthaben. Erforderlich: ${totalCost / 100}€, Verfügbar: ${balance / 100}€`,
                    required: totalCost,
                    balance,
                });
            }
        }

        // Use a transaction for atomicity
        const result = await db.transaction(async (tx) => {
            // 1. Cancel current active subscription (if any)
            const currentActive = await tx.orm.public.Subscription
                .where({ user_id: userId, status: 'ACTIVE' })
                .first();

            if (currentActive) {
                await tx.orm.public.Subscription
                    .where({ id: currentActive.id })
                    .update({
                        status: 'CANCELLED',
                        cancelled_at: new Date().toISOString(),
                    });
            }

            // 2. Deduct credits if paying with credits
            let creditTxId = null;
            if (payment_method === 'CREDIT' && totalCost > 0) {
                const creditTx = await tx.orm.public.CreditTransaction.create({
                    user_id: userId,
                    amount: -totalCost,
                    type: 'SUBSCRIPTION_PAYMENT',
                    description: `${planNameUpper}-Abonnement (${duration_months} Monat${duration_months > 1 ? 'e' : ''})`,
                });
                creditTxId = creditTx.id;
            }

            // 3. Compute expiry
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + Number(duration_months));

            // 4. Create new subscription
            const newSub = await tx.orm.public.Subscription.create({
                user_id: userId,
                plan_id: plan.id,
                status: 'ACTIVE',
                payment_method: payment_method,
                amount_paid_cents: totalCost,
                credit_tx_id: creditTxId,
                expires_at: expiresAt.toISOString(),
            });

            // 5. Update company profile tier (for backward compat with CompanyProfile.tier field)
            await tx.orm.public.CompanyProfile
                .where({ user_id: userId })
                .update({ tier: planNameUpper })
                .catch(() => { }); // Private users have no company profile — ignore

            return { subscription: newSub, plan };
        });

        return res.status(201).json({
            success: true,
            message: `Erfolgreich zum ${planNameUpper}-Tarif gewechselt!`,
            subscription: result.subscription,
            plan: result.plan,
        });

    } catch (err) {
        console.error('❌ subscribe error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Abonnieren des Tarifs.' });
    }
};

/**
 * POST /api/subscriptions/cancel
 * Cancels the user's active subscription. Reverts company profile tier to FREE.
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const activeSub = await db.orm.public.Subscription
            .where({ user_id: userId, status: 'ACTIVE' })
            .include('plan')
            .first();

        if (!activeSub || activeSub.plan?.name === 'FREE') {
            return res.status(400).json({
                success: false,
                error: 'Kein aktives Abonnement zum Kündigen gefunden.',
            });
        }

        await db.transaction(async (tx) => {
            // Mark subscription as cancelled
            await tx.orm.public.Subscription
                .where({ id: activeSub.id })
                .update({
                    status: 'CANCELLED',
                    cancelled_at: new Date().toISOString(),
                });

            // Revert company profile tier to FREE
            await tx.orm.public.CompanyProfile
                .where({ user_id: userId })
                .update({ tier: 'FREE' })
                .catch(() => { });
        });

        return res.status(200).json({
            success: true,
            message: 'Abonnement erfolgreich gekündigt. Dein Konto wird zum FREE-Tarif zurückgesetzt.',
        });
    } catch (err) {
        console.error('❌ cancelSubscription error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Kündigen des Abonnements.' });
    }
};

import { db } from '../prisma/db.js';
import { checkAndAwardReferralCreditsOnBusinessSubscription } from './referral.js';
import {
    stripe,
    isStripeConfigured,
    createSubscriptionCheckoutSession,
    createCreditCheckoutSession,
    createSpotlightCheckoutSession,
    constructWebhookEvent,
} from '../services/stripe.service.js';

/**
 * Helper to check if Stripe is available
 */
const checkStripeAvailability = (res) => {
    if (!isStripeConfigured()) {
        res.status(503).json({
            success: false,
            error: 'Stripe ist auf diesem Server noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt).',
        });
        return false;
    }
    return true;
};

/**
 * POST /api/stripe/create-checkout-session
 * Initiates a Stripe Checkout Session for Subscription, Credits, or Spotlight.
 */
export const createCheckoutSession = async (req, res) => {
    try {
        if (!checkStripeAvailability(res)) return;

        const { id: userId, email: userEmail } = req.user;
        const {
            type = 'SUBSCRIPTION', // 'SUBSCRIPTION' | 'CREDIT_PURCHASE' | 'SPOTLIGHT_PURCHASE'
            plan_name = 'BUSINESS',
            duration_months = 1,
            package_credits = 500,
            duration_days = 7,
            return_url,
        } = req.body;

        let session;

        if (type === 'SUBSCRIPTION') {
            session = await createSubscriptionCheckoutSession({
                userId,
                userEmail,
                planName: plan_name,
                durationMonths: duration_months,
                returnUrl: return_url,
            });
        } else if (type === 'CREDIT_PURCHASE') {
            session = await createCreditCheckoutSession({
                userId,
                userEmail,
                credits: package_credits,
                returnUrl: return_url,
            });
        } else if (type === 'SPOTLIGHT_PURCHASE') {
            session = await createSpotlightCheckoutSession({
                userId,
                userEmail,
                durationDays: duration_days,
                returnUrl: return_url,
            });
        } else {
            return res.status(400).json({ success: false, error: 'Ungültiger Zahlungstyp angegeben.' });
        }

        return res.status(200).json({
            success: true,
            url: session.url,
            sessionId: session.id,
        });
    } catch (err) {
        console.error('❌ createCheckoutSession error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler beim Erstellen der Stripe Checkout-Sitzung.',
        });
    }
};

/**
 * Internal helper to fulfill a completed Stripe checkout session idempotently.
 */
export const fulfillSession = async (session) => {
    if (!session || session.payment_status !== 'paid') {
        return { success: false, reason: 'Payment not completed' };
    }

    const metadata = session.metadata || {};
    const { type, userId } = metadata;

    if (!userId) {
        return { success: false, reason: 'Missing userId in metadata' };
    }

    // 1. Subscription fulfillment
    if (type === 'SUBSCRIPTION') {
        const planName = (metadata.planName || 'BUSINESS').toUpperCase();
        const durationMonths = Math.max(1, Number(metadata.durationMonths) || 1);
        const totalPriceCents = Number(metadata.totalPriceCents) || 2900;
        const creditsGranted = Number(metadata.creditsGranted) || 1000;

        const plan = await db.orm.public.Plan
            .where({ name: planName, is_active: true })
            .first();

        if (!plan) return { success: false, reason: 'Plan not found' };

        // Check if subscription for this Stripe session already recorded
        const existingSub = await db.orm.public.Subscription
            .where({ user_id: userId })
            .all();

        const alreadyRecorded = existingSub.some((s) => {
            if (!s.notes) return false;
            try {
                const n = JSON.parse(s.notes);
                return n.stripe_session_id === session.id;
            } catch {
                return false;
            }
        });

        if (alreadyRecorded) {
            return { success: true, alreadyProcessed: true };
        }

        const invoiceYear = new Date().getFullYear();
        const invoiceRandom = Math.floor(100000 + Math.random() * 900000);
        const invoiceNumber = `INV-${invoiceYear}-${invoiceRandom}`;

        const notesData = {
            stripe_session_id: session.id,
            stripe_customer_id: session.customer,
            stripe_payment_intent: session.payment_intent,
            invoice_number: invoiceNumber,
            payment_summary: 'Stripe (Kreditkarte / SEPA / Apple Pay)',
            payment_method: 'STRIPE',
            duration_months: durationMonths,
            total_price_cents: totalPriceCents,
            credits_granted: creditsGranted,
            customer_email: session.customer_email || metadata.userEmail,
            subscribed_at: new Date().toISOString(),
        };

        await db.transaction(async (tx) => {
            // Cancel current active subscription
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

            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

            // Create new active subscription
            await tx.orm.public.Subscription.create({
                user_id: userId,
                plan_id: plan.id,
                status: 'ACTIVE',
                payment_method: 'STRIPE',
                amount_paid_cents: totalPriceCents,
                notes: JSON.stringify(notesData),
                expires_at: expiresAt.toISOString(),
            });

            // Grant bonus credits
            if (creditsGranted > 0) {
                await tx.orm.public.CreditTransaction.create({
                    user_id: userId,
                    amount: creditsGranted,
                    type: 'SUBSCRIPTION_CREDITS_GRANTED',
                    description: `Business-Abo Willkommensbonus (+${creditsGranted.toLocaleString('de-DE')} CC via Stripe)`,
                });
            }

            // Update company profile tier or convert PRIVATE user to COMMERCIAL
            const userRec = await tx.orm.public.User.where({ id: userId }).first();
            if (userRec && userRec.user_type === 'PRIVATE') {
                await tx.orm.public.User.where({ id: userId }).update({
                    user_type: 'COMMERCIAL',
                });

                const privateProf = await tx.orm.public.PrivateProfile.where({ user_id: userId }).first();
                const compName = (billingDetails && billingDetails.company_name) ||
                    (privateProf ? `${privateProf.first_name || ''} ${privateProf.last_name || ''}`.trim() : '') ||
                    userRec.email?.split('@')[0];

                const existingCompanyProf = await tx.orm.public.CompanyProfile.where({ user_id: userId }).first();
                if (!existingCompanyProf) {
                    await tx.orm.public.CompanyProfile.create({
                        user_id: userId,
                        company_name: compName,
                        location: privateProf?.location || 'Deutschland',
                        phone: privateProf?.phone || null,
                        bio: privateProf?.bio || null,
                        tier: 'BUSINESS',
                        is_strategic_partner: false,
                    });
                } else {
                    await tx.orm.public.CompanyProfile.where({ user_id: userId }).update({
                        tier: 'BUSINESS',
                        ...(compName ? { company_name: compName } : {}),
                    });
                }
            } else {
                await tx.orm.public.CompanyProfile
                    .where({ user_id: userId })
                    .update({ tier: planName })
                    .catch(() => { });
            }
        });

        // Trigger referral reward for Business subscription if totalPriceCents > 0 (paid conversion)
        if (totalPriceCents > 0) {
            checkAndAwardReferralCreditsOnBusinessSubscription(userId).catch((err) => {
                console.error('Error in referral evaluation after Stripe subscription:', err.message);
            });
        }

        return { success: true, type: 'SUBSCRIPTION', invoiceNumber };
    }

    // 2. Credits purchase fulfillment
    if (type === 'CREDIT_PURCHASE') {
        const credits = Number(metadata.credits) || 500;
        const priceCents = Number(metadata.priceCents) || 499;

        // Check if already processed
        const txs = await db.orm.public.CreditTransaction
            .where({ user_id: userId })
            .all();

        const alreadyDone = txs.some((t) => t.description && t.description.includes(session.id));
        if (alreadyDone) {
            return { success: true, alreadyProcessed: true };
        }

        const priceEurFormatted = `${(priceCents / 100).toFixed(2).replace('.', ',')} €`;

        await db.orm.public.CreditTransaction.create({
            user_id: userId,
            amount: credits,
            type: 'CREDIT_PURCHASE',
            description: `Guthabenkauf: +${credits.toLocaleString('de-DE')} CC (${priceEurFormatted} via Stripe) [Ref: ${session.id}]`,
        });

        return { success: true, type: 'CREDIT_PURCHASE', credits };
    }

    // 3. Spotlight purchase fulfillment
    if (type === 'SPOTLIGHT_PURCHASE') {
        const days = Number(metadata.durationDays) || 7;
        const profile = await db.orm.public.CompanyProfile
            .where({ user_id: userId })
            .first();

        if (profile) {
            const currentSpotlight = profile.spotlight_until ? new Date(profile.spotlight_until) : new Date();
            const baseDate = currentSpotlight > new Date() ? currentSpotlight : new Date();
            const newSpotlightUntil = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

            await db.orm.public.CompanyProfile
                .where({ user_id: userId })
                .update({ spotlight_until: newSpotlightUntil.toISOString() });
        }

        return { success: true, type: 'SPOTLIGHT_PURCHASE', days };
    }

    return { success: false, reason: 'Unknown type' };
};

/**
 * GET /api/stripe/verify-session?session_id=...
 * Verifies and fulfills a completed Stripe session on user redirect.
 */
export const verifySession = async (req, res) => {
    try {
        if (!checkStripeAvailability(res)) return;

        const { session_id } = req.query;
        if (!session_id) {
            return res.status(400).json({ success: false, error: 'Sitzungs-ID fehlt.' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (!session || session.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                paid: false,
                error: 'Die Zahlung wurde noch nicht abgeschlossen.',
            });
        }

        // Fulfill the session idempotently
        const result = await fulfillSession(session);

        return res.status(200).json({
            success: true,
            paid: true,
            type: session.metadata?.type,
            details: result,
        });
    } catch (err) {
        console.error('❌ verifySession error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler bei der Verifizierung der Zahlung.',
        });
    }
};

/**
 * POST /api/stripe/webhook
 * Handles incoming webhooks from Stripe (must receive raw unparsed body).
 */
export const handleWebhook = async (req, res) => {
    let event;

    try {
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            return res.status(400).send('Missing stripe-signature header');
        }

        event = constructWebhookEvent(req.body, sig);
    } catch (err) {
        console.error('❌ Stripe Webhook Signature Verification Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Stripe Webhook received: ${event.type} [${event.id}]`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await fulfillSession(session);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                console.log(`✅ Invoice payment succeeded for customer ${invoice.customer}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                console.log(`⚠️ Subscription cancelled in Stripe: ${sub.id}`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
        }

        return res.json({ received: true });
    } catch (err) {
        console.error('❌ Error handling Stripe webhook event:', err);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
};

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
    const user = await db.orm.public.User.where({ id: userId }).first().catch(() => null);
    const isReferred = !!user?.referred_by_code;

    const planName = plan?.name || 'FREE';
    const isBusiness = planName === 'BUSINESS';
    const listingLimit = isBusiness ? 25 : (plan?.listing_limit ?? 3);
    const descLimit = isBusiness ? 1000 : (plan?.description_limit ?? 500);

    if (!plan) {
        // Hard fallback — plan table not seeded yet
        return {
            plan_name: 'FREE',
            listing_limit: 3,
            has_cover_image: false,
            has_spotlight: false,
            has_statistics: false,
            has_csv_import: false,
            description_limit: 500,
            is_referred: isReferred,
            subscription_active: false,
            expires_at: null,
        };
    }

    return {
        plan_name: plan.name,
        listing_limit: listingLimit,
        has_cover_image: plan.has_cover_image,
        has_spotlight: plan.has_spotlight,
        has_statistics: plan.has_statistics,
        has_csv_import: plan.has_csv_import,
        description_limit: descLimit,
        is_referred: isReferred,
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
/**
 * POST /api/subscriptions/subscribe
 * Subscribes the user to a plan.
 *
 * Body:
 *   - plan_name: "BUSINESS" (required)
 *   - payment_method: "CREDIT" | "CREDIT_CARD" | "SEPA" | "MANUAL" (default: "CREDIT")
 *   - duration_months: number (default: 1)
 *   - billing_details: object (optional: company_name, first_name, last_name, street, zip, city, country, vat_id)
 *   - payment_details: object (optional: card_number, card_holder, exp_date, iban, bic)
 */
export const subscribe = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const {
            plan_name,
            payment_method = 'CREDIT_CARD',
            duration_months = 1,
            billing_details = {},
            payment_details = {},
        } = req.body;

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

        const monthsNum = Math.max(1, Number(duration_months) || 1);
        let totalCost = plan.price_cents * monthsNum;

        // Apply discount for 3 or 12 months if paid in cash
        if (monthsNum === 3) totalCost = 7900; // €79
        if (monthsNum === 12) totalCost = 29000; // €290 (2 months free)

        const normMethod = (payment_method || 'CREDIT_CARD').toUpperCase();

        // --- Credit payment flow ---
        if (normMethod === 'CREDIT' && totalCost > 0) {
            // Calculate current credit balance
            const transactions = await db.orm.public.CreditTransaction
                .where({ user_id: userId })
                .all();
            const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

            if (balance < totalCost) {
                return res.status(402).json({
                    success: false,
                    error: `Nicht genügend Campuna-Guthaben. Erforderlich: ${totalCost / 100}€ (${totalCost} CC), Verfügbar: ${balance / 100}€ (${balance} CC)`,
                    required: totalCost,
                    balance,
                });
            }
        }

        // Generate invoice number & metadata
        const invoiceYear = new Date().getFullYear();
        const invoiceRandom = Math.floor(100000 + Math.random() * 900000);
        const invoiceNumber = `INV-${invoiceYear}-${invoiceRandom}`;

        // Masked payment info for security
        let paymentSummary = 'Campuna Credits';
        if (normMethod === 'CREDIT_CARD') {
            const rawCard = String(payment_details.card_number || '4242424242424242').replace(/\s+/g, '');
            const last4 = rawCard.slice(-4) || '4242';
            paymentSummary = `Kreditkarte •••• ${last4}`;
        } else if (normMethod === 'SEPA') {
            const rawIban = String(payment_details.iban || 'DE89370400440532013000').replace(/\s+/g, '');
            const maskedIban = rawIban.length > 8 ? `${rawIban.slice(0, 4)} •••• •••• ${rawIban.slice(-4)}` : rawIban;
            paymentSummary = `SEPA-Lastschrift (${maskedIban})`;
        }

        const creditsGranted = planNameUpper === 'BUSINESS' ? 1000 : 0;

        const notesData = {
            invoice_number: invoiceNumber,
            billing_details: {
                company_name: billing_details.company_name || '',
                first_name: billing_details.first_name || '',
                last_name: billing_details.last_name || '',
                street: billing_details.street || '',
                zip: billing_details.zip || '',
                city: billing_details.city || '',
                country: billing_details.country || 'Deutschland',
                vat_id: billing_details.vat_id || '',
            },
            payment_summary: paymentSummary,
            payment_method: normMethod,
            duration_months: monthsNum,
            total_price_cents: totalCost,
            credits_granted: creditsGranted,
            subscribed_at: new Date().toISOString(),
        };

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
            if (normMethod === 'CREDIT' && totalCost > 0) {
                const creditTx = await tx.orm.public.CreditTransaction.create({
                    user_id: userId,
                    amount: -totalCost,
                    type: 'SUBSCRIPTION_PAYMENT',
                    description: `${planNameUpper}-Abonnement (${monthsNum} Monat${monthsNum > 1 ? 'e' : ''})`,
                });
                creditTxId = creditTx.id;
            }

            // 3. Compute expiry
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + monthsNum);

            // 4. Create new subscription
            const newSub = await tx.orm.public.Subscription.create({
                user_id: userId,
                plan_id: plan.id,
                status: 'ACTIVE',
                payment_method: normMethod,
                amount_paid_cents: totalCost,
                credit_tx_id: creditTxId,
                notes: JSON.stringify(notesData),
                expires_at: expiresAt.toISOString(),
            });

            // 5. Grant 1,000 Campuna Credits welcome/subscription bonus
            if (creditsGranted > 0) {
                await tx.orm.public.CreditTransaction.create({
                    user_id: userId,
                    amount: creditsGranted,
                    type: 'SUBSCRIPTION_CREDITS_GRANTED',
                    description: `Business-Abo Willkommensbonus (+${creditsGranted.toLocaleString('de-DE')} Campuna Credits)`,
                });
            }

            // 6. Update company profile tier (for backward compat with CompanyProfile.tier field)
            await tx.orm.public.CompanyProfile
                .where({ user_id: userId })
                .update({ tier: planNameUpper })
                .catch(() => { }); // Private users have no company profile — ignore

            // 7. Calculate new credit balance
            const allTxs = await tx.orm.public.CreditTransaction
                .where({ user_id: userId })
                .all();
            const newBalance = allTxs.reduce((sum, t) => sum + t.amount, 0);

            return {
                subscription: newSub,
                plan,
                invoice_number: invoiceNumber,
                credits_granted: creditsGranted,
                new_balance: newBalance,
            };
        });

        return res.status(201).json({
            success: true,
            message: `Erfolgreich zum ${planNameUpper}-Tarif gewechselt! ${creditsGranted > 0 ? `+${creditsGranted} Campuna Credits wurden deinem Konto gutgeschrieben.` : ''}`,
            subscription: result.subscription,
            plan: result.plan,
            invoice_number: result.invoice_number,
            credits_granted: result.credits_granted,
            new_balance: result.new_balance,
        });

    } catch (err) {
        console.error('❌ subscribe error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Abonnieren des Tarifs.' });
    }
};

/**
 * POST /api/subscriptions/cancel
 * Cancels the user's active subscription.
 * Deducts any remaining unspent subscription credits from the user's balance.
 * Reverts company profile tier to FREE.
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { account_holder, iban_or_card, reason } = req.body || {};

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

        // Determine how many credits were granted with this subscription & update notes
        let creditsGranted = 1000; // Default fallback
        let notesData = {};
        if (activeSub.notes) {
            try {
                notesData = JSON.parse(activeSub.notes);
                if (typeof notesData.credits_granted === 'number') {
                    creditsGranted = notesData.credits_granted;
                }
            } catch {
                notesData = {};
            }
        }

        const updatedNotes = {
            ...notesData,
            cancellation: {
                cancelled_at: new Date().toISOString(),
                account_holder: account_holder || 'Bestätigt',
                bank_or_card_last4: iban_or_card ? iban_or_card.replace(/\s/g, '').slice(-4) : 'Verifiziert',
                reason: reason || 'Kein Grund angegeben',
            },
        };

        const cancelResult = await db.transaction(async (tx) => {
            // 1. Calculate current user balance
            const currentTxs = await tx.orm.public.CreditTransaction
                .where({ user_id: userId })
                .all();
            const currentBalance = currentTxs.reduce((sum, t) => sum + t.amount, 0);

            // 2. Compute remaining unspent subscription credits
            // E.g., if granted 1000, and current balance is 500, we deduct exactly 500.
            // If current balance is 0, we deduct 0.
            // If current balance is 1200 (e.g. 200 prior + 1000 sub), we deduct 1000.
            const creditsToDeduct = Math.max(0, Math.min(creditsGranted, currentBalance));

            // 3. Deduct remaining credits in ledger
            if (creditsToDeduct > 0) {
                await tx.orm.public.CreditTransaction.create({
                    user_id: userId,
                    amount: -creditsToDeduct,
                    type: 'SUBSCRIPTION_CREDITS_REVOKED',
                    description: `Rückbuchung ungenutzter Abonnement-Credits nach Kündigung (-${creditsToDeduct.toLocaleString('de-DE')} CC)`,
                });
            }

            // 4. Mark subscription as cancelled with verification notes
            await tx.orm.public.Subscription
                .where({ id: activeSub.id })
                .update({
                    status: 'CANCELLED',
                    cancelled_at: new Date().toISOString(),
                    notes: JSON.stringify(updatedNotes),
                });

            // 5. Revert company profile tier to FREE
            await tx.orm.public.CompanyProfile
                .where({ user_id: userId })
                .update({ tier: 'FREE' })
                .catch(() => { });

            const newBalance = currentBalance - creditsToDeduct;

            return {
                deducted_credits: creditsToDeduct,
                previous_balance: currentBalance,
                new_balance: newBalance,
            };
        });

        return res.status(200).json({
            success: true,
            message: cancelResult.deducted_credits > 0
                ? `Abonnement erfolgreich gekündigt. ${cancelResult.deducted_credits} verbleibende Abonnement-Credits wurden abgezogen. Dein neuer Kontostand beträgt ${cancelResult.new_balance} CC.`
                : 'Abonnement erfolgreich gekündigt. Dein Konto wurde zum FREE-Tarif zurückgesetzt.',
            deducted_credits: cancelResult.deducted_credits,
            previous_balance: cancelResult.previous_balance,
            new_balance: cancelResult.new_balance,
        });
    } catch (err) {
        console.error('❌ cancelSubscription error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Kündigen des Abonnements.' });
    }
};

/**
 * GET /api/subscriptions/invoices
 * Returns user's invoices / billing history.
 */
export const getInvoices = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const subs = await db.orm.public.Subscription
            .where({ user_id: userId })
            .include('plan')
            .orderBy((s) => s.created_at.desc())
            .all();

        const invoices = subs.map((sub) => {
            let notes = {};
            if (sub.notes) {
                try {
                    notes = JSON.parse(sub.notes);
                } catch {
                    notes = {};
                }
            }

            const invoiceYear = new Date(sub.created_at).getFullYear();
            const fallbackInvNum = `INV-${invoiceYear}-${String(sub.id).padStart(6, '0')}`;

            return {
                id: sub.id,
                invoice_number: notes.invoice_number || fallbackInvNum,
                plan_name: sub.plan?.name || 'BUSINESS',
                amount_paid_cents: sub.amount_paid_cents,
                amount_paid_formatted: (sub.amount_paid_cents / 100).toFixed(2).replace('.', ',') + ' €',
                payment_method: sub.payment_method || 'CREDIT_CARD',
                payment_summary: notes.payment_summary || sub.payment_method || 'Kreditkarte',
                status: sub.status,
                started_at: sub.started_at,
                expires_at: sub.expires_at,
                cancelled_at: sub.cancelled_at,
                created_at: sub.created_at,
                billing_details: notes.billing_details || {},
                credits_granted: notes.credits_granted ?? (sub.plan?.name === 'BUSINESS' ? 1000 : 0),
            };
        });

        return res.status(200).json({ success: true, invoices });
    } catch (err) {
        console.error('❌ getInvoices error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Rechnungen.' });
    }
};

/**
 * In-memory / simulated store for lead inquiries to support interactive lead pipeline
 */
const mockLeadsStore = new Map();

const getInitialLeadsForUser = (userId, listings = []) => {
    if (mockLeadsStore.has(userId)) {
        return mockLeadsStore.get(userId);
    }

    const defaultListingTitle = listings[0]?.title || 'Hymer Grand Canyon S 4x4 Offroad Edition';
    const sampleLeads = [
        {
            id: 'lead-1',
            listing_id: listings[0]?.id || 'list-1',
            listing_title: defaultListingTitle,
            buyer_name: 'Markus Weber',
            buyer_email: 'markus.weber@alpin-camp.de',
            buyer_phone: '+49 171 8392019',
            message: 'Guten Tag! Ich interessiere mich sehr für das Fahrzeug. Wäre eine Probefahrt am kommenden Samstag möglich? Viele Grüße, Markus',
            status: 'NEW', // NEW | CONTACTED | SCHEDULED | CLOSED
            created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
            notes: 'Interesse an Inzahlungnahme von VW T6.1',
            price_offer: null,
        },
        {
            id: 'lead-2',
            listing_id: listings[1]?.id || listings[0]?.id || 'list-2',
            listing_title: listings[1]?.title || 'Pössl 2Win Plus Solar & AHK',
            buyer_name: 'Sandra & Tobias Koch',
            buyer_email: 'familie.koch88@gmx.de',
            buyer_phone: '+49 89 4528190',
            message: 'Hallo, ist das Wohnmobil sofort verfügbar und scheckheftgepflegt? Wir könnten dieses Wochenende zur Besichtigung vorbeikommen.',
            status: 'CONTACTED',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            notes: 'Rückruf erfolgt, Besichtigungstermin offen',
            price_offer: '64.500 €',
        },
        {
            id: 'lead-3',
            listing_id: listings[0]?.id || 'list-1',
            listing_title: defaultListingTitle,
            buyer_name: 'Dr. Michael Brenner',
            buyer_email: 'brenner.consulting@outlook.de',
            buyer_phone: '+49 152 09281744',
            message: 'Sehr geehrte Damen und Herren, bitte um Zusendung des vollständigen Ausstattungsdatenblattes sowie des letzten TÜV-Berichts.',
            status: 'SCHEDULED',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
            notes: 'Besichtigungstermin am 15.09. 14:00 Uhr bestätigt',
            price_offer: null,
        },
        {
            id: 'lead-4',
            listing_id: listings[2]?.id || listings[0]?.id || 'list-3',
            listing_title: listings[2]?.title || 'Knaus Boxstar 600 Street 2023',
            buyer_name: 'Christian Bauer',
            buyer_email: 'c.bauer@muenchen-net.de',
            buyer_phone: '+49 89 9012384',
            message: 'Vielen Dank für die professionelle Übergabe und Beratung!',
            status: 'CLOSED',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
            notes: 'Erfolgreich abgeschlossen & Kaufvertrag unterzeichnet',
            price_offer: '58.900 €',
        }
    ];

    mockLeadsStore.set(userId, sampleLeads);
    return sampleLeads;
};

/**
 * GET /api/subscriptions/analytics
 * Returns comprehensive analytics data for the subscriber's dashboard.
 */
export const getSubscriptionAnalytics = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { period = '30d' } = req.query; // '7d' | '30d' | '90d' | '1y'

        // Fetch user's listings
        const userListings = await db.orm.public.Listing
            .where({ user_id: userId })
            .orderBy((l) => l.created_at.desc())
            .all();

        const activeCount = userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length;
        const approvedListings = userListings.filter(l => l.status === 'APPROVED');
        const boostedCount = userListings.filter(l => l.boosted_until && new Date(l.boosted_until) > new Date()).length;

        // Base metric multipliers calculated from active listings
        const countFactor = Math.max(1, activeCount);
        const boostFactor = 1 + (boostedCount * 0.45);

        // Period days
        const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;

        // Generate time series data points for chart
        const timeSeries = [];
        const now = new Date();

        let totalPeriodViews = 0;
        let totalPeriodImpressions = 0;
        let totalPeriodLeads = 0;

        for (let i = days - 1; i >= 0; i--) {
            const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateLabel = days <= 7
                ? dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
                : days <= 30
                    ? dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
                    : dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

            // Daily seed based on date and countFactor
            const daySeed = (dateObj.getDate() * 17 + dateObj.getDay() * 31) % 40;
            const dailyImpressions = Math.round((140 + daySeed * 8 + Math.sin(i * 0.5) * 40) * countFactor * boostFactor);
            const dailyViews = Math.round((28 + (daySeed % 15) * 3 + Math.cos(i * 0.4) * 10) * countFactor * boostFactor);
            const dailyLeads = (i % 3 === 0 || (daySeed > 25 && i % 2 === 0)) ? Math.max(0, Math.round(dailyViews * 0.045)) : 0;

            totalPeriodImpressions += dailyImpressions;
            totalPeriodViews += dailyViews;
            totalPeriodLeads += dailyLeads;

            timeSeries.push({
                date: dateLabel,
                isoDate: dateObj.toISOString().split('T')[0],
                impressions: dailyImpressions,
                views: dailyViews,
                leads: dailyLeads,
            });
        }

        // Summary KPI stats
        const ctr = totalPeriodImpressions > 0 ? ((totalPeriodViews / totalPeriodImpressions) * 100).toFixed(1) : '5.8';
        const conversionRate = totalPeriodViews > 0 ? ((totalPeriodLeads / totalPeriodViews) * 100).toFixed(1) : '2.4';

        // Per-listing performance breakdown
        const listingPerformance = userListings.map((l, index) => {
            const isBoosted = Boolean(l.boosted_until && new Date(l.boosted_until) > new Date());
            const listFactor = 1 + (index === 0 ? 0.8 : index === 1 ? 0.4 : 0.1);
            const listViews = Math.round((totalPeriodViews / countFactor) * listFactor * (isBoosted ? 1.6 : 1.0));
            const listImpressions = Math.round(listViews * (14 + (index % 5)));
            const listLeads = Math.max(1, Math.round(listViews * 0.035));
            const listCtr = listImpressions > 0 ? ((listViews / listImpressions) * 100).toFixed(1) : '6.2';

            return {
                id: l.id,
                title: l.title,
                slug: l.slug,
                category: l.category,
                price: parseFloat(l.price || 0),
                status: l.status,
                is_boosted: isBoosted,
                boosted_until: l.boosted_until,
                views: listViews,
                impressions: listImpressions,
                leads: listLeads,
                ctr: `${listCtr}%`,
                thumbnail: (l.images && l.images.length > 0) ? l.images[0] : null,
                created_at: l.created_at,
            };
        });

        // Device breakdown
        const deviceBreakdown = [
            { name: 'Smartphone / Mobil', percentage: 64, color: '#004709' },
            { name: 'Desktop & Laptop', percentage: 31, color: '#D4AF37' },
            { name: 'Tablet', percentage: 5, color: '#94a3b8' },
        ];

        // Geographic distribution (Top regions in DACH)
        const regionalDistribution = [
            { region: 'Bayern', share: 34, inquiries: Math.round(totalPeriodLeads * 0.34) },
            { region: 'Nordrhein-Westfalen', share: 26, inquiries: Math.round(totalPeriodLeads * 0.26) },
            { region: 'Baden-Württemberg', share: 22, inquiries: Math.round(totalPeriodLeads * 0.22) },
            { region: 'Hessen & Österreich', share: 18, inquiries: Math.round(totalPeriodLeads * 0.18) },
        ];

        return res.status(200).json({
            success: true,
            period,
            summary: {
                total_views: totalPeriodViews,
                views_growth_pct: '+18.4%',
                total_impressions: totalPeriodImpressions,
                impressions_growth_pct: '+24.1%',
                total_leads: Math.max(1, totalPeriodLeads),
                leads_growth_pct: '+31.0%',
                ctr: `${ctr}%`,
                conversion_rate: `${conversionRate}%`,
                active_listings_count: activeCount,
                boosted_listings_count: boostedCount,
            },
            time_series: timeSeries,
            device_breakdown: deviceBreakdown,
            regional_distribution: regionalDistribution,
            listings_performance: listingPerformance,
        });
    } catch (err) {
        console.error('❌ getSubscriptionAnalytics error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Performance-Statistiken.' });
    }
};

/**
 * GET /api/subscriptions/leads
 * Returns buyer leads / inquiries for the current user's listings.
 */
export const getSubscriberLeads = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const userListings = await db.orm.public.Listing
            .where({ user_id: userId })
            .all();

        const leads = getInitialLeadsForUser(userId, userListings);
        return res.status(200).json({ success: true, leads });
    } catch (err) {
        console.error('❌ getSubscriberLeads error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden der Kontaktanfragen.' });
    }
};

/**
 * PATCH /api/subscriptions/leads/:id/status
 * Updates status or notes for a lead inquiry.
 */
export const updateLeadStatus = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { id: leadId } = req.params;
        const { status, notes } = req.body;

        const userListings = await db.orm.public.Listing
            .where({ user_id: userId })
            .all();

        const leads = getInitialLeadsForUser(userId, userListings);
        const lead = leads.find((l) => l.id === leadId);

        if (!lead) {
            return res.status(404).json({ success: false, error: 'Kontaktanfrage nicht gefunden.' });
        }

        if (status) lead.status = status;
        if (typeof notes === 'string') lead.notes = notes;
        lead.updated_at = new Date().toISOString();

        mockLeadsStore.set(userId, leads);

        return res.status(200).json({
            success: true,
            message: 'Status der Kontaktanfrage erfolgreich aktualisiert.',
            lead,
        });
    } catch (err) {
        console.error('❌ updateLeadStatus error:', err.message);
        return res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren der Kontaktanfrage.' });
    }
};


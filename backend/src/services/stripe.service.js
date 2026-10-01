import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe instance if key is present
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        appInfo: {
            name: 'Campuna Marketplace',
            version: '1.0.0',
        },
    })
    : null;

/**
 * Returns whether Stripe is configured with a valid API key.
 */
export const isStripeConfigured = () => Boolean(stripe);

/**
 * Ensures Stripe is configured, otherwise throws a descriptive Error.
 */
const requireStripe = () => {
    if (!stripe) {
        throw new Error('Stripe ist noch nicht konfiguriert. Bitte hinterlege STRIPE_SECRET_KEY in der .env-Datei.');
    }
    return stripe;
};

/**
 * Credit package pricing definitions (in EUR cents).
 */
export const CREDIT_PACKAGES = {
    500: { priceCents: 499, priceEur: '4,99 €', name: '500 Campuna Credits (7-Tage Highlight)' },
    800: { priceCents: 799, priceEur: '7,99 €', name: '800 Campuna Credits (14-Tage Highlight)' },
    1300: { priceCents: 1299, priceEur: '12,99 €', name: '1.300 Campuna Credits (30-Tage Highlight)' },
    2500: { priceCents: 2499, priceEur: '24,99 €', name: '2.500 Campuna Credits (Spar-Paket)' },
};

/**
 * Creates a Stripe Checkout Session for Campuna Business subscription.
 *
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {string} params.userEmail - User Email address
 * @param {string} [params.planName='BUSINESS'] - 'BUSINESS'
 * @param {number} [params.durationMonths=1] - 1, 3, or 12
 * @param {string} [params.returnUrl] - Frontend return base URL
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const createSubscriptionCheckoutSession = async ({
    userId,
    userEmail,
    planName = 'BUSINESS',
    durationMonths = 1,
    returnUrl,
}) => {
    const s = requireStripe();
    const months = Math.max(1, Number(durationMonths) || 1);
    const frontendBase = returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Pricing calculation
    let unitAmount = 2900; // 29.00 EUR
    let description = '1 Monat Campuna Business Mitgliedschaft';

    if (months === 3) {
        unitAmount = 7900; // 79.00 EUR
        description = '3 Monate Campuna Business Mitgliedschaft (8 € Ersparnis)';
    } else if (months === 12) {
        unitAmount = 29000; // 290.00 EUR
        description = '12 Monate Campuna Business Mitgliedschaft (2 Monate gratis)';
    }

    const session = await s.checkout.sessions.create({
        mode: 'payment',
        locale: 'de',
        adaptive_pricing: {
            enabled: false,
        },
        customer_email: userEmail,
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Campuna Business (${months === 1 ? '1 Monat' : `${months} Monate`})`,
                        description: `${description} inklusive 1.000 Campuna Credits Bonus, unbegrenzter Inserate & Händler-Tools.`,
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            },
        ],
        metadata: {
            type: 'SUBSCRIPTION',
            userId,
            userEmail,
            planName: planName.toUpperCase(),
            durationMonths: String(months),
            totalPriceCents: String(unitAmount),
            creditsGranted: '1000',
        },
        success_url: `${frontendBase}/abo/kasse?session_id={CHECKOUT_SESSION_ID}&stripe_success=true`,
        cancel_url: `${frontendBase}/abo/kasse?cancelled=true`,
    });

    return session;
};

/**
 * Creates a Stripe Checkout Session for purchasing Campuna Credits.
 *
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {string} params.userEmail - User Email address
 * @param {number} params.credits - Credits amount (500, 800, 1300, 2500)
 * @param {string} [params.returnUrl] - Frontend return base URL
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const createCreditCheckoutSession = async ({
    userId,
    userEmail,
    credits = 500,
    returnUrl,
}) => {
    const s = requireStripe();
    const numCredits = Number(credits) || 500;
    const frontendBase = returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    const pkg = CREDIT_PACKAGES[numCredits] || {
        priceCents: Math.round(numCredits * 0.998),
        priceEur: `${(numCredits / 100).toFixed(2).replace('.', ',')} €`,
        name: `${numCredits.toLocaleString('de-DE')} Campuna Credits`,
    };

    const session = await s.checkout.sessions.create({
        mode: 'payment',
        locale: 'de',
        adaptive_pricing: {
            enabled: false,
        },
        customer_email: userEmail,
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: pkg.name,
                        description: `Guthaben-Aufladung: +${numCredits.toLocaleString('de-DE')} Campuna Credits (CC) für Inserate-Highlights & Spotlight.`,
                    },
                    unit_amount: pkg.priceCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            type: 'CREDIT_PURCHASE',
            userId,
            userEmail,
            credits: String(numCredits),
            priceCents: String(pkg.priceCents),
        },
        success_url: `${frontendBase}/mein-konto?tab=credits&stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendBase}/mein-konto?tab=credits&stripe_cancelled=true`,
    });

    return session;
};

/**
 * Creates a Stripe Checkout Session for Spotlight booking.
 *
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {string} params.userEmail - User Email address
 * @param {number} params.durationDays - Duration in days (e.g. 7, 14, 30)
 * @param {string} [params.returnUrl] - Frontend return base URL
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const createSpotlightCheckoutSession = async ({
    userId,
    userEmail,
    durationDays = 7,
    returnUrl,
}) => {
    const s = requireStripe();
    const days = Math.max(1, Number(durationDays) || 7);
    const frontendBase = returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Pricing: 7 days = €7.00 (700 cents), 14 days = €12.00 (1200 cents), 30 days = €20.00 (2000 cents)
    let unitAmount = days * 100;
    if (days === 14) unitAmount = 1200;
    if (days === 30) unitAmount = 2000;

    const session = await s.checkout.sessions.create({
        mode: 'payment',
        locale: 'de',
        adaptive_pricing: {
            enabled: false,
        },
        customer_email: userEmail,
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Homepage-Spotlight (${days} Tage)`,
                        description: `Exklusive Platzierung deines Unternehmensprofils direkt auf der Campuna-Startseite für ${days} Tage.`,
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            },
        ],
        metadata: {
            type: 'SPOTLIGHT_PURCHASE',
            userId,
            userEmail,
            durationDays: String(days),
            priceCents: String(unitAmount),
        },
        success_url: `${frontendBase}/mein-konto?tab=overview&spotlight_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendBase}/mein-konto?tab=overview&spotlight_cancelled=true`,
    });

    return session;
};

/**
 * Constructs and verifies a Stripe Webhook event from raw buffer and signature header.
 *
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {Stripe.Event}
 */
export const constructWebhookEvent = (rawBody, signature) => {
    const s = requireStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET ist nicht in der .env-Datei konfiguriert.');
    }

    return s.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

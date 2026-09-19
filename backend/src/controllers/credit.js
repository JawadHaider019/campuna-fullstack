import { db } from '../prisma/db.js';

/**
 * GET /api/credits/balance
 */
export const getBalance = async (req, res) => {
    try {
        const { id } = req.user;
        const transactions = await db.orm.public.CreditTransaction
            .where((t) => t.user_id.eq(id))
            .all();

        const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

        return res.status(200).json({ success: true, balance });
    } catch (err) {
        console.error('getBalance error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Abrufen des Guthabens.' });
    }
};

/**
 * GET /api/credits/transactions
 */
export const getTransactions = async (req, res) => {
    try {
        const { id } = req.user;
        const transactions = await db.orm.public.CreditTransaction
            .where((t) => t.user_id.eq(id))
            .orderBy((t) => t.created_at.desc())
            .all();

        return res.status(200).json({ success: true, transactions });
    } catch (err) {
        console.error('getTransactions error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Transaktionsverlaufs.' });
    }
};

/**
 * POST /api/credits/spend-simulated
 * Utility endpoint for testing: spends simulated credits (e.g. 500 CC) from ledger.
 */
export const spendSimulatedCredits = async (req, res) => {
    try {
        const { id } = req.user;
        const { amount = 500, description = 'Spotlight-Boost für Inserat (Test)' } = req.body;
        const spendAmount = Math.abs(Number(amount) || 500);

        // Check current balance
        const transactions = await db.orm.public.CreditTransaction
            .where((t) => t.user_id.eq(id))
            .all();
        const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

        if (balance < spendAmount) {
            return res.status(400).json({
                success: false,
                error: `Nicht genügend Guthaben vorhanden (${balance} CC verfügbar, ${spendAmount} CC benötigt).`,
                balance,
            });
        }

        const tx = await db.orm.public.CreditTransaction.create({
            user_id: id,
            amount: -spendAmount,
            type: 'FEATURE_SPEND',
            description: `${description} (-${spendAmount} CC)`,
        });

        const newBalance = balance - spendAmount;

        return res.status(200).json({
            success: true,
            message: `${spendAmount} CC erfolgreich ausgegeben!`,
            transaction: tx,
            new_balance: newBalance,
        });
    } catch (err) {
        console.error('spendSimulatedCredits error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Ausgeben des Testguthabens.' });
    }
};

/**
 * POST /api/credits/earn-simulated
 * Utility endpoint for testing: adds simulated credits (€29.00 / 2900 credits) to ledger.
 */
export const earnSimulatedCredits = async (req, res) => {
    try {
        const { id } = req.user;
        const amount = 2900; // €29.00 in credits

        const tx = await db.orm.public.CreditTransaction.create({
            user_id: id,
            amount: amount,
            type: 'PROMOTIONAL_EARN',
            description: 'Test-Guthaben gutgeschrieben (€29.00)',
        });

        return res.status(201).json({
            success: true,
            message: 'Simuliertes Guthaben erfolgreich gutgeschrieben!',
            transaction: tx
        });
    } catch (err) {
        console.error('earnSimulatedCredits error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Gutschreiben des Testguthabens.' });
    }
};

/**
 * POST /api/credits/buy
 * Purchases Campuna Credits package (500 CC, 800 CC, 1.300 CC, 2.500 CC)
 * Payment methods: CREDIT_CARD, SEPA, PAYPAL, DIRECT
 */
export const purchaseCredits = async (req, res) => {
    try {
        const { id } = req.user;
        const { packageCredits = 500, payment_method = 'CREDIT_CARD' } = req.body;

        const credits = parseInt(packageCredits, 10);
        const PACKAGES = {
            500: { priceCents: 499, priceEur: '4,99 €', label: '7-Tage Inserat-Highlight Paket' },
            800: { priceCents: 799, priceEur: '7,99 €', label: '14-Tage Inserat-Highlight Paket' },
            1300: { priceCents: 1299, priceEur: '12,99 €', label: '30-Tage Inserat-Highlight Paket' },
            2500: { priceCents: 2499, priceEur: '24,99 €', label: 'Spar-Paket (2.500 CC)' },
        };

        const pkg = PACKAGES[credits] || {
            priceCents: Math.round(credits * 0.998),
            priceEur: `${((credits / 100)).toFixed(2).replace('.', ',')} €`,
            label: `${credits.toLocaleString('de-DE')} Campuna Credits`
        };

        if (credits <= 0) {
            return res.status(400).json({ success: false, error: 'Ungültiges Guthaben-Paket angegeben.' });
        }

        const normMethod = (payment_method || 'CREDIT_CARD').toUpperCase();
        let methodLabel = 'Kreditkarte';
        if (normMethod === 'SEPA') methodLabel = 'SEPA-Lastschrift';
        else if (normMethod === 'PAYPAL') methodLabel = 'PayPal';

        // Add credit transaction to ledger
        const tx = await db.orm.public.CreditTransaction.create({
            user_id: id,
            amount: credits,
            type: 'CREDIT_PURCHASE',
            description: `Guthabenkauf: +${credits.toLocaleString('de-DE')} CC (${pkg.priceEur} bezahlt via ${methodLabel})`,
        });

        // Compute new balance
        const transactions = await db.orm.public.CreditTransaction
            .where((t) => t.user_id.eq(id))
            .all();
        const newBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

        return res.status(200).json({
            success: true,
            message: `Erfolgreich ${credits.toLocaleString('de-DE')} Campuna Credits aufgeladen!`,
            transaction: tx,
            new_balance: newBalance,
            package: {
                credits,
                priceEur: pkg.priceEur,
                priceCents: pkg.priceCents
            }
        });
    } catch (err) {
        console.error('purchaseCredits error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Kauf des Guthaben-Pakets.' });
    }
};

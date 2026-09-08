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

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
            .order((t) => t.created_at.desc())
            .all();

        return res.status(200).json({ success: true, transactions });
    } catch (err) {
        console.error('getTransactions error:', err);
        return res.status(500).json({ success: false, error: 'Fehler beim Laden des Transaktionsverlaufs.' });
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

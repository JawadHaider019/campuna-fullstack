import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the Bearer access token in the Authorization header.
 * On success, attaches the full user record to `req.user` and calls next().
 *
 * Errors:
 *  401 — missing or invalid / expired token
 *  403 — account suspended
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Kein Zugriffstoken angegeben.',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({
                success: false,
                error: 'Ungültiger oder abgelaufener Token. Bitte erneut anmelden.',
            });
        }

        const user = await db.orm.public.User
            .where((u) => u.id.eq(decoded.id))
            .first();

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Benutzer nicht gefunden.',
            });
        }

        if (user.is_suspended) {
            return res.status(403).json({
                success: false,
                error: 'Dein Konto wurde gesperrt. Bitte kontaktiere den Support.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

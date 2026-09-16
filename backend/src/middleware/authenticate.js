import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.js';
import pool from '../config/database.js';

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

        // Check if token belongs to an admin from the dedicated 'admins' table
        if (decoded.role === 'ADMIN') {
            const adminRes = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
            const admin = adminRes.rows[0];
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Administrator nicht gefunden.',
                });
            }
            delete admin.password_hash;
            req.user = admin;
            return next();
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

        delete user.password_hash;
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        return res.status(500).json({ success: false, error: 'Ein Fehler ist aufgetreten.' });
    }
};

/**
 * Ensures the authenticated user has the 'ADMIN' role.
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Zugriff verweigert. Dieser Bereich ist nur für Administratoren zugänglich.',
        });
    }
    next();
};

/**
 * Optional authentication middleware:
 * If an Authorization header is provided, verifies token and attaches req.user.
 * If no token or invalid token is provided, proceeds normally with req.user = null.
 */
export const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            req.user = null;
            return next();
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            req.user = null;
            return next();
        }

        if (decoded.role === 'ADMIN') {
            const adminRes = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
            const admin = adminRes.rows[0];
            if (admin) {
                delete admin.password_hash;
                req.user = admin;
            } else {
                req.user = null;
            }
            return next();
        }

        const user = await db.orm.public.User
            .where((u) => u.id.eq(decoded.id))
            .first();

        if (user && !user.is_suspended) {
            delete user.password_hash;
            req.user = user;
        } else {
            req.user = null;
        }

        return next();
    } catch {
        req.user = null;
        return next();
    }
};



/**
 * Role-based authorization guard.
 * Must be used AFTER the `authenticate` middleware (requires req.user).
 *
 * Usage:
 *   router.get('/admin/panel', authenticate, authorize('ADMIN'), handler)
 *   router.get('/profile',     authenticate, authorize('USER', 'ADMIN'), handler)
 *
 * @param {...string} roles - Accepted roles (e.g. 'ADMIN', 'USER')
 */
export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Nicht authentifiziert.',
        });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Zugriff verweigert. Du hast keine Berechtigung für diese Aktion.',
        });
    }

    next();
};

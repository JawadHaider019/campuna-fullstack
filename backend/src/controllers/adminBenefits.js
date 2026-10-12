import pool from '../config/database.js';
import { toJsDate } from '../utils/temporal.js';

/**
 * Helper to calculate expiration date from preset duration or custom date
 * Supports ISO strings, YYYY-MM-DD, and German date format DD.MM.YYYY
 * Returns a Temporal.Instant object for Prisma 8 / Postgres compatibility
 */
const calculateExpiryDate = (durationDays, customEndDate) => {
    if (customEndDate) {
        // Handle German date format e.g. "11.10.2026" or "11 . 10 . 2026"
        if (typeof customEndDate === 'string' && customEndDate.includes('.')) {
            const parts = customEndDate.split('.').map(p => p.trim());
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                const d = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
                if (!isNaN(d.getTime())) return Temporal.Instant.fromEpochMilliseconds(d.getTime());
            }
        }
        const d = new Date(customEndDate);
        if (!isNaN(d.getTime())) return Temporal.Instant.fromEpochMilliseconds(d.getTime());
    }
    const days = Math.max(1, Number(durationDays) || 30);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return Temporal.Instant.fromEpochMilliseconds(date.getTime());
};

/**
 * Internal helper to send a system notification message to a user's inbox
 */
export const sendSystemNotificationToUser = async (userId, title, content) => {
    try {
        const adminRes = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
        if (adminRes.rows.length === 0) return null;
        const adminId = adminRes.rows[0].id;
        if (adminId === userId) return null;

        // Check if a conversation between admin and user exists
        let convRes = await pool.query(
            `SELECT id FROM conversations 
             WHERE (buyer_id = $1 AND seller_id = $2) OR (buyer_id = $2 AND seller_id = $1) 
             LIMIT 1`,
            [userId, adminId]
        );

        let convId = convRes.rows[0]?.id;

        if (!convId) {
            // Find any listing of user or admin to associate
            const listRes = await pool.query(
                `SELECT id FROM listings WHERE user_id = $1 OR user_id = $2 LIMIT 1`,
                [userId, adminId]
            );
            if (listRes.rows.length > 0) {
                const newConvRes = await pool.query(
                    `INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
                     VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
                     RETURNING id`,
                    [listRes.rows[0].id, adminId, userId]
                );
                convId = newConvRes.rows[0]?.id;
            }
        }

        if (convId) {
            await pool.query(
                `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, FALSE, NOW())`,
                [convId, adminId, `🔔 **${title}**\n\n${content}`]
            );
        }
    } catch (err) {
        console.warn('⚠️ Could not send inbox message:', err.message);
    }
};

/**
 * POST /api/admin/benefits/grant
 * Manually grant complimentary benefits (Free Business, Free Boost, Spotlight, or Credits) to a user.
 */
export const grantAdminBenefit = async (req, res) => {
    try {
        const {
            user_id,
            benefit_type, // 'BUSINESS_SUBSCRIPTION' | 'LISTING_BOOST' | 'SPOTLIGHT' | 'CREDITS'
            duration_days = 30,
            custom_end_date,
            listing_id,
            credits_amount = 500,
            admin_note = 'Kulanz / Partner-Vorteil durch Administration',
        } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'Benutzer-ID ist erforderlich.' });
        }

        const userRes = await pool.query(
            `SELECT u.id, u.email, u.user_type, u.role, cp.id AS company_profile_id, cp.tier AS company_tier 
             FROM users u 
             LEFT JOIN company_profiles cp ON cp.user_id = u.id 
             WHERE u.id = $1`,
            [user_id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }

        const targetUser = userRes.rows[0];
        const expiresAt = calculateExpiryDate(duration_days, custom_end_date);
        const expiryFormatted = toJsDate(expiresAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        let resultData = {};

        // ── 1. BUSINESS SUBSCRIPTION (Free of charge - Commercial accounts only) ──
        if (benefit_type === 'BUSINESS_SUBSCRIPTION') {
            const isPrivate = (targetUser.user_type === 'PRIVATE' || targetUser.account_type === 'PRIVATE');
            if (isPrivate) {
                return res.status(400).json({
                    success: false,
                    error: 'Campuna Business Tarife sind gewerblichen Konten vorbehalten. Für Privatnutzer stehen Inserate-Boosts und Campuna Credits zur Verfügung.'
                });
            }

            const planRes = await pool.query("SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1");
            if (planRes.rows.length === 0) {
                return res.status(500).json({ success: false, error: 'Business-Tarif nicht in der Datenbank gefunden.' });
            }
            const businessPlanId = planRes.rows[0].id;

            // Deactivate any existing active subscriptions
            await pool.query(
                `UPDATE subscriptions 
                 SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW() 
                 WHERE user_id = $1 AND status = 'ACTIVE'`,
                [user_id]
            );

            // Create complimentary subscription
            const notesJson = JSON.stringify({
                type: 'COMPLIMENTARY_GRANT',
                granted_by_admin: req.user?.email || 'Administration',
                reason: admin_note,
                auto_renew: false,
                is_complimentary: true,
            });

            const subInsertRes = await pool.query(
                `INSERT INTO subscriptions (
                    user_id, plan_id, status, started_at, expires_at, payment_method, amount_paid_cents, notes, created_at, updated_at
                ) VALUES ($1, $2, 'ACTIVE', NOW(), $3, 'ADMIN_GRANT', 0, $4, NOW(), NOW())
                RETURNING *`,
                [user_id, businessPlanId, expiresAt, notesJson]
            );
            const newSub = subInsertRes.rows[0];

            // Ensure company profile has BUSINESS tier
            if (targetUser.company_profile_id) {
                await pool.query(
                    `UPDATE company_profiles SET tier = 'BUSINESS', updated_at = NOW() WHERE user_id = $1`,
                    [user_id]
                );
            }

            // Send notification message to user
            await sendSystemNotificationToUser(
                user_id,
                'Campuna Business kostenlos freigeschaltet!',
                `Hallo!\n\nDas Campuna-Team hat dir als besonderen Partner-Vorteil **Campuna Business** kostenlos bis zum **${expiryFormatted}** freigeschaltet.\n\nDu genießt ab sofort alle Premium-Funktionen:\n- Unbegrenzte Inserate\n- Firmenprofil mit Titelbild & Verlinkung\n- Detaillierte Statistiken & Lead-Übersicht\n\n📌 **Wichtig:** Dieser Vorteil endet am ${expiryFormatted} automatisch und geht **nicht** in ein kostenpflichtiges Abonnement über. Du musst dir also keine Sorgen um automatische Abbuchungen machen.\n\nGrund / Anmerkung: *${admin_note}*`
            );

            resultData = { subscription: newSub, expires_at: expiresAt };
        }

        // ── 2. LISTING BOOST / HIGHLIGHT ──
        else if (benefit_type === 'LISTING_BOOST') {
            if (!listing_id) {
                return res.status(400).json({ success: false, error: 'Bitte wähle ein Inserat aus.' });
            }

            const listingRes = await pool.query(
                `SELECT id, title FROM listings WHERE id = $1 AND user_id = $2 LIMIT 1`,
                [listing_id, user_id]
            );

            if (listingRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Inserat nicht gefunden oder gehört nicht zu diesem Benutzer.' });
            }
            const listing = listingRes.rows[0];

            await pool.query(
                `UPDATE listings SET featured = TRUE, boosted_until = $1, updated_at = NOW() WHERE id = $2`,
                [expiresAt, listing_id]
            );

            // Send notification
            await sendSystemNotificationToUser(
                user_id,
                'Kostenloser Inserate-Boost aktiviert!',
                `Gute Nachrichten! Dein Inserat **"${listing.title}"** wurde von der Campuna-Administration kostenlos bis zum **${expiryFormatted}** hervorgehoben (Boost).\n\nEs wird nun priorisiert in den Suchergebnissen dargestellt.\n\nAnmerkung: *${admin_note}*`
            );

            resultData = { listing_id, boosted_until: expiresAt };
        }

        // ── 3. SPOTLIGHT (Homepage - Commercial accounts only) ──
        else if (benefit_type === 'SPOTLIGHT') {
            const isPrivate = (targetUser.user_type === 'PRIVATE' || targetUser.account_type === 'PRIVATE');
            if (isPrivate || !targetUser.company_profile_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Homepage-Spotlights sind gewerblichen Profilen mit Firmenprofil vorbehalten. Für Privatnutzer stehen Inserate-Boosts und Campuna Credits zur Verfügung.'
                });
            }

            await pool.query(
                `UPDATE company_profiles SET spotlight_until = $1, updated_at = NOW() WHERE user_id = $2`,
                [expiresAt, user_id]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Homepage-Spotlight kostenlos freigeschaltet!',
                `Dein Unternehmensprofil wurde von der Administration kostenlos bis zum **${expiryFormatted}** im **Campuna Spotlight** auf der Startseite platziert!\n\nAnmerkung: *${admin_note}*`
            );

            resultData = { spotlight_until: expiresAt };
        }

        // ── 4. CAMPUNA CREDITS GUTSCHRIFT ──
        else if (benefit_type === 'CREDITS') {
            const amount = Math.max(1, Number(credits_amount) || 500);

            const txRes = await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, $2, 'ADMIN_GRANT', $3, NOW())
                 RETURNING *`,
                [user_id, amount, admin_note || 'Gutschrift durch Campuna Administration']
            );
            const tx = txRes.rows[0];

            const balRes = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) AS balance FROM credit_transactions WHERE user_id = $1`,
                [user_id]
            );
            const newBalance = Number(balRes.rows[0].balance);

            await sendSystemNotificationToUser(
                user_id,
                `+${amount.toLocaleString('de-DE')} Campuna Credits gutgeschrieben!`,
                `Die Campuna-Administration hat deinem Konto soeben **+${amount.toLocaleString('de-DE')} CC** gutgeschrieben.\n\nNeuer Kontostand: **${newBalance.toLocaleString('de-DE')} CC**\n\nGrund: *${admin_note}*`
            );

            resultData = { transaction: tx, new_balance: newBalance };
        } else {
            return res.status(400).json({ success: false, error: 'Ungültiger Vorteil-Typ.' });
        }

        return res.status(200).json({
            success: true,
            message: `Vorteil (${benefit_type}) wurde erfolgreich kostenlos zugewiesen!`,
            data: resultData,
        });
    } catch (err) {
        console.error('❌ grantAdminBenefit error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler beim Zuweisen des Vorteils.',
        });
    }
};

/**
 * POST /api/admin/benefits/apply-transition-period
 * Activates a 3-month complimentary Campuna Business transition period for all existing commercial users.
 */
export const applyCommercialTransitionPeriod = async (req, res) => {
    try {
        const commercialUsersRes = await pool.query(
            `SELECT u.id, cp.id AS company_profile_id 
             FROM users u 
             LEFT JOIN company_profiles cp ON cp.user_id = u.id 
             WHERE u.user_type = 'COMMERCIAL'`
        );

        const planRes = await pool.query("SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1");
        if (planRes.rows.length === 0) {
            return res.status(500).json({ success: false, error: 'Business-Tarif nicht gefunden.' });
        }
        const businessPlanId = planRes.rows[0].id;

        const transitionDays = 90; // 3 months
        const date = new Date();
        date.setDate(date.getDate() + transitionDays);
        const expiresAt = Temporal.Instant.fromEpochMilliseconds(date.getTime());
        const expiryFormatted = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        let updatedCount = 0;

        for (const user of commercialUsersRes.rows) {
            const activeSub = await pool.query(
                `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
                [user.id]
            );

            if (activeSub.rows.length === 0) {
                const notesJson = JSON.stringify({
                    type: 'MIGRATION_3_MONTH_TRANSITION',
                    is_transition_period: true,
                    is_complimentary: true,
                    auto_renew: false,
                    expires_at: expiresAt.toString(),
                });

                await pool.query(
                    `INSERT INTO subscriptions (
                        user_id, plan_id, status, started_at, expires_at, payment_method, amount_paid_cents, notes, created_at, updated_at
                    ) VALUES ($1, $2, 'ACTIVE', NOW(), $3, 'TRANSITION_PERIOD', 0, $4, NOW(), NOW())`,
                    [user.id, businessPlanId, expiresAt, notesJson]
                );

                if (user.company_profile_id) {
                    await pool.query(
                        `UPDATE company_profiles SET tier = 'BUSINESS', updated_at = NOW() WHERE user_id = $1`,
                        [user.id]
                    );
                }

                await sendSystemNotificationToUser(
                    user.id,
                    'Deine 3-monatige Campuna Business Übergangsphase ist aktiv!',
                    `Willkommen auf dem neuen Campuna!\n\nAls geschätzter gewerblicher Partner schenken wir dir eine **3-monatige Übergangsphase mit allen Vorteilen von Campuna Business völlig kostenlos** (gültig bis zum **${expiryFormatted}**).\n\nAlle deine gewohnten professionellen Profilfunktionen (individuelles Titelbild, Unternehmensdarstellung, Händler-Tools & Lead-Pipeline) bleiben in dieser Zeit uneingeschränkt aktiv.\n\n📌 **Wichtige Information zur fairen Umstellung:**\n- Nach Ablauf dieser 3 Monate kannst du frei entscheiden, ob du für **29 €/Monat** bei Campuna Business bleiben möchtest oder kostenfrei auf das Basis-Profil (**Business Free**) wechselst.\n- Es erfolgt **KEINE automatische Verlängerung und KEINE Abbuchung**.\n- Deine Unternehmensdaten und Inserate bleiben in jedem Fall vollständig erhalten.\n\nWir wünschen dir weiterhin viel Erfolg auf Campuna!\nDein Campuna-Team`
                );

                updatedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            message: `3-monatige Übergangsphase wurde für ${updatedCount} gewerbliche Partner erfolgreich aktiviert.`,
            affected_users: updatedCount,
            expires_at: expiresAt,
        });
    } catch (err) {
        console.error('❌ applyCommercialTransitionPeriod error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler beim Aktivieren der Übergangsphase.',
        });
    }
};

/**
 * GET /api/admin/benefits/user-listings/:userId
 * Returns listings of a specific user for benefit selection in modal.
 */
export const getAdminUserListings = async (req, res) => {
    try {
        const { userId } = req.params;
        const resList = await pool.query(
            `SELECT id, title, status, featured, boosted_until 
             FROM listings 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            listings: resList.rows.map(l => ({
                id: l.id,
                title: l.title,
                status: l.status,
                featured: l.featured,
                boosted_until: l.boosted_until,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

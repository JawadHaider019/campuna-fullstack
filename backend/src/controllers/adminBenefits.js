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
export const sendSystemNotificationToUser = async (userId, title, content, preferredAdminId = null) => {
    try {
        let adminId = preferredAdminId;
        if (!adminId) {
            const adminRes = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
            if (adminRes.rows.length === 0) return null;
            adminId = adminRes.rows[0].id;
        }
        if (adminId === userId) return null;

        // Check if an existing direct conversation between an admin and this user exists (listing_id IS NULL)
        let convRes = await pool.query(
            `SELECT c.id 
             FROM conversations c
             JOIN users u ON (u.id = c.buyer_id OR u.id = c.seller_id)
             WHERE (c.buyer_id = $1 OR c.seller_id = $1)
               AND u.role = 'ADMIN'
               AND c.listing_id IS NULL
             ORDER BY c.created_at ASC
             LIMIT 1`,
            [userId]
        );

        let convId = convRes.rows[0]?.id;

        if (!convId) {
            // Create a clean direct conversation (listing_id is NULL) between admin and user
            const newConvRes = await pool.query(
                `INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
                 VALUES (gen_random_uuid(), NULL, $1, $2, NOW(), NOW())
                 RETURNING id`,
                [adminId, userId]
            );
            convId = newConvRes.rows[0]?.id;
        }

        if (convId) {
            await pool.query(
                `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, FALSE, NOW())`,
                [convId, adminId, `🔔 **${title}**\n\n${content}`]
            );
            await pool.query(
                `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
                [convId]
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

            // Check if user already has an active subscription
            const activeSubRes = await pool.query(
                `SELECT id, expires_at FROM subscriptions 
                 WHERE user_id = $1 AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1`,
                [user_id]
            );
            if (activeSubRes.rows.length > 0) {
                const activeSub = activeSubRes.rows[0];
                const expiryFormattedStr = activeSub.expires_at 
                    ? new Date(activeSub.expires_at).toLocaleDateString('de-DE') 
                    : 'unbegrenzt';
                return res.status(400).json({
                    success: false,
                    error: `Dieser Benutzer hat bereits ein aktives Business-Abonnement (gültig bis ${expiryFormattedStr}). Bitte beende das aktuelle Abonnement zuerst, bevor du eine neue Laufzeit zuweist.`
                });
            }

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
                `SELECT id, title, boosted_until FROM listings WHERE id = $1 AND user_id = $2 LIMIT 1`,
                [listing_id, user_id]
            );

            if (listingRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Inserat nicht gefunden oder gehört nicht zu diesem Benutzer.' });
            }
            const listing = listingRes.rows[0];

            // Check if listing is already boosted
            if (listing.boosted_until && new Date(listing.boosted_until) > new Date()) {
                const boostFormattedStr = new Date(listing.boosted_until).toLocaleDateString('de-DE');
                return res.status(400).json({
                    success: false,
                    error: `Das Inserat "${listing.title}" ist bereits bis zum ${boostFormattedStr} geboostet. Bitte beende den aktuellen Boost zuerst, um eine neue Laufzeit zuzuweisen.`
                });
            }

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

            // Check if spotlight is already active
            const activeSpotRes = await pool.query(
                `SELECT spotlight_until FROM company_profiles WHERE user_id = $1 LIMIT 1`,
                [user_id]
            );
            if (activeSpotRes.rows[0]?.spotlight_until && new Date(activeSpotRes.rows[0].spotlight_until) > new Date()) {
                const spotFormattedStr = new Date(activeSpotRes.rows[0].spotlight_until).toLocaleDateString('de-DE');
                return res.status(400).json({
                    success: false,
                    error: `Homepage-Spotlight ist für dieses Profil bereits aktiv bis zum ${spotFormattedStr}. Bitte beende die Platzierung zuerst oder nutze 'Laufzeit verlängern'.`
                });
            }

            // 1. Update company_profiles: set spotlight_until AND tier = 'BUSINESS'
            await pool.query(
                `UPDATE company_profiles SET spotlight_until = $1, tier = 'BUSINESS', updated_at = NOW() WHERE user_id = $2`,
                [expiresAt, user_id]
            );

            // 2. Also automatically grant/ensure active Campuna Business subscription for this period!
            const planRes = await pool.query("SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1");
            const businessPlanId = planRes.rows[0]?.id;

            const activeSubRes = await pool.query(
                `SELECT id, expires_at FROM subscriptions 
                 WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
                [user_id]
            );

            if (activeSubRes.rows.length > 0) {
                const activeSub = activeSubRes.rows[0];
                const curSubExpiry = activeSub.expires_at ? new Date(activeSub.expires_at) : null;
                const newExpiryDate = toJsDate(expiresAt);
                if (!curSubExpiry || curSubExpiry < newExpiryDate) {
                    await pool.query(
                        `UPDATE subscriptions 
                         SET expires_at = $1, updated_at = NOW() 
                         WHERE id = $2`,
                        [expiresAt, activeSub.id]
                    );
                }
            } else if (businessPlanId) {
                const notesJson = JSON.stringify({
                    type: 'COMPLIMENTARY_GRANT_WITH_SPOTLIGHT',
                    granted_by_admin: req.user?.email || 'Administration',
                    reason: `Automatisch inklusive zu Homepage-Spotlight: ${admin_note}`,
                    auto_renew: false,
                    is_complimentary: true,
                });
                await pool.query(
                    `INSERT INTO subscriptions (
                        user_id, plan_id, status, started_at, expires_at, payment_method, amount_paid_cents, notes, created_at, updated_at
                    ) VALUES ($1, $2, 'ACTIVE', NOW(), $3, 'ADMIN_GRANT', 0, $4, NOW(), NOW())`,
                    [user_id, businessPlanId, expiresAt, notesJson]
                );
            }

            await sendSystemNotificationToUser(
                user_id,
                'Homepage-Spotlight & Campuna Business freigeschaltet!',
                `Dein Unternehmensprofil wurde von der Administration kostenlos bis zum **${expiryFormatted}** im **Campuna Spotlight** auf der Startseite platziert!\n\nZusätzlich hast du für diesen Zeitraum vollen Zugriff auf alle Vorteile der **Campuna Business**-Mitgliedschaft (Cover-Bild, Händler-Tools, unbegrenzte Inserate).\n\nAnmerkung: *${admin_note}*`
            );

            resultData = { spotlight_until: expiresAt, tier: 'BUSINESS' };
        }

        // ── 4. CAMPUNA CREDITS GUTSCHRIFT ODER ERSTATTUNG / KORREKTUR ──
        else if (benefit_type === 'CREDITS' || benefit_type === 'CREDIT_REFUND') {
            const rawAmount = Number(credits_amount);
            const isDeduction = benefit_type === 'CREDIT_REFUND' || rawAmount < 0;
            const amount = isDeduction ? -Math.abs(rawAmount || 500) : Math.abs(rawAmount || 500);
            const txType = isDeduction ? 'CREDIT_REFUND' : 'ADMIN_GRANT';

            // Check current balance if deducting
            if (isDeduction) {
                const balCheck = await pool.query(
                    `SELECT COALESCE(SUM(amount), 0) AS balance FROM credit_transactions WHERE user_id = $1`,
                    [user_id]
                );
                const curBal = Number(balCheck.rows[0]?.balance || 0);
                if (curBal <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: `Der Benutzer hat aktuell kein verfügbares Credit-Guthaben (${curBal} CC). Ein Abzug ist nicht möglich.`
                    });
                }
            }

            const txRes = await pool.query(
                `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING *`,
                [
                    user_id,
                    amount,
                    txType,
                    admin_note || (isDeduction ? 'Credit-Rückbuchung / Erstattung durch Administration' : 'Gutschrift durch Campuna Administration')
                ]
            );
            const tx = txRes.rows[0];

            const balRes = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) AS balance FROM credit_transactions WHERE user_id = $1`,
                [user_id]
            );
            const newBalance = Number(balRes.rows[0].balance);

            const notifTitle = isDeduction
                ? `${Math.abs(amount).toLocaleString('de-DE')} Campuna Credits erstattet / angepasst`
                : `+${amount.toLocaleString('de-DE')} Campuna Credits gutgeschrieben!`;
            const notifContent = isDeduction
                ? `Aufgrund einer Erstattung oder manuellen Anpassung wurden von deinem Konto **${amount.toLocaleString('de-DE')} CC** abgebucht.\n\nNeuer Kontostand: **${newBalance.toLocaleString('de-DE')} CC**\n\nBegründung: *${admin_note || 'Erstattung / Korrektur'}*`
                : `Die Campuna-Administration hat deinem Konto soeben **+${amount.toLocaleString('de-DE')} CC** gutgeschrieben.\n\nNeuer Kontostand: **${newBalance.toLocaleString('de-DE')} CC**\n\nGrund: *${admin_note}*`;

            await sendSystemNotificationToUser(
                user_id,
                notifTitle,
                notifContent
            );

            resultData = { transaction: tx, new_balance: newBalance };
        } else {
            return res.status(400).json({ success: false, error: 'Ungültiger Vorteil-Typ.' });
        }

        // Record in admin_benefit_grants audit ledger
        try {
            let detailsObj = {};
            if (benefit_type === 'BUSINESS_SUBSCRIPTION') {
                detailsObj = { plan: 'BUSINESS', expires_at: toJsDate(expiresAt) };
            } else if (benefit_type === 'LISTING_BOOST') {
                detailsObj = { listing_id, listing_title: resultData.listing_id, expires_at: toJsDate(expiresAt) };
            } else if (benefit_type === 'SPOTLIGHT') {
                detailsObj = { expires_at: toJsDate(expiresAt) };
            } else if (benefit_type === 'CREDITS') {
                detailsObj = { amount: Number(credits_amount) || 500, transaction_id: resultData.transaction?.id };
            }

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                    user_id,
                    benefit_type,
                    JSON.stringify(detailsObj),
                    admin_note || 'Kulanz / Partner-Vorteil durch Administration',
                    req.user?.email || 'Administration',
                    benefit_type === 'CREDITS' ? null : toJsDate(expiresAt)
                ]
            );
        } catch (logErr) {
            console.warn('⚠️ Could not log to admin_benefit_grants:', logErr.message);
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

                try {
                    await pool.query(
                        `INSERT INTO admin_benefit_grants (
                            user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at
                        ) VALUES ($1, 'BUSINESS_SUBSCRIPTION', $2, $3, $4, $5, NOW())`,
                        [
                            user.id,
                            JSON.stringify({ plan: 'BUSINESS', is_transition_period: true, expires_at: toJsDate(expiresAt) }),
                            '3-Monate Übergangsphase für gewerbliche Partner',
                            req.user?.email || 'Administration',
                            toJsDate(expiresAt)
                        ]
                    );
                } catch (logErr) {
                    // Ignore duplicate or logging errors
                }

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
            listings: resList.rows.map(l => {
                const isBoosted = Boolean(l.boosted_until && new Date(l.boosted_until) > new Date());
                return {
                    id: l.id,
                    title: l.title,
                    status: l.status,
                    featured: l.featured,
                    boosted_until: l.boosted_until,
                    is_boosted: isBoosted
                };
            }),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * POST /api/admin/benefits/cancel
 * Cancels / revokes an active admin benefit (Business subscription, Spotlight, or Listing Boost).
 */
export const cancelAdminBenefit = async (req, res) => {
    try {
        const {
            user_id,
            benefit_type, // 'BUSINESS_SUBSCRIPTION' | 'SPOTLIGHT' | 'LISTING_BOOST'
            listing_id,
            admin_note = 'Vorzeitig durch Administration beendet'
        } = req.body;

        if (!user_id || !benefit_type) {
            return res.status(400).json({ success: false, error: 'Benutzer-ID und Vorteil-Typ sind erforderlich.' });
        }

        const userRes = await pool.query(
            `SELECT u.id, u.email, u.user_type, cp.id AS company_profile_id 
             FROM users u 
             LEFT JOIN company_profiles cp ON cp.user_id = u.id 
             WHERE u.id = $1`,
            [user_id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }

        const adminEmail = req.user?.email || 'Administration';

        // 1. Cancel Business Subscription
        if (benefit_type === 'BUSINESS_SUBSCRIPTION') {
            await pool.query(
                `UPDATE subscriptions 
                 SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW() 
                 WHERE user_id = $1 AND status = 'ACTIVE'`,
                [user_id]
            );

            // Revert company profile tier to FREE
            if (userRes.rows[0].company_profile_id) {
                await pool.query(
                    `UPDATE company_profiles SET tier = 'FREE', updated_at = NOW() WHERE user_id = $1`,
                    [user_id]
                );
            }

            // Record in audit ledger
            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, created_at
                ) VALUES ($1, 'BUSINESS_SUBSCRIPTION_CANCELLED', '{"action":"CANCELLED"}', $2, $3, NOW())`,
                [user_id, admin_note, adminEmail]
            );

            // Notify user
            await sendSystemNotificationToUser(
                user_id,
                'Campuna Business Vorteil beendet',
                `Dein kostenloses Campuna Business-Abonnement wurde vorzeitig durch die Administration beendet.\n\nGrund / Anmerkung: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: 'Campuna Business Abonnement wurde erfolgreich vorzeitig beendet.'
            });
        }

        // 2. Cancel Spotlight
        else if (benefit_type === 'SPOTLIGHT') {
            await pool.query(
                `UPDATE company_profiles SET spotlight_until = NULL, updated_at = NOW() WHERE user_id = $1`,
                [user_id]
            );

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, created_at
                ) VALUES ($1, 'SPOTLIGHT_CANCELLED', '{"action":"CANCELLED"}', $2, $3, NOW())`,
                [user_id, admin_note, adminEmail]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Homepage-Spotlight Platzierung beendet',
                `Deine Homepage-Spotlight Platzierung wurde vorzeitig beendet.\n\nGrund: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: 'Homepage-Spotlight Platzierung wurde erfolgreich beendet.'
            });
        }

        // 3. Cancel Listing Boost
        else if (benefit_type === 'LISTING_BOOST') {
            if (!listing_id) {
                return res.status(400).json({ success: false, error: 'Bitte gib die Inserats-ID an.' });
            }

            const listRes = await pool.query(
                `SELECT title FROM listings WHERE id = $1 AND user_id = $2`,
                [listing_id, user_id]
            );

            if (listRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
            }

            await pool.query(
                `UPDATE listings SET featured = FALSE, boosted_until = NULL, updated_at = NOW() WHERE id = $1`,
                [listing_id]
            );

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, created_at
                ) VALUES ($1, 'LISTING_BOOST_CANCELLED', $2, $3, $4, NOW())`,
                [user_id, JSON.stringify({ listing_id, title: listRes.rows[0].title }), admin_note, adminEmail]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Inserate-Boost beendet',
                `Der Boost für dein Inserat "${listRes.rows[0].title}" wurde beendet.\n\nGrund: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: `Boost für "${listRes.rows[0].title}" wurde erfolgreich beendet.`
            });
        }

        return res.status(400).json({ success: false, error: 'Ungültiger Vorteil-Typ.' });
    } catch (err) {
        console.error('❌ cancelAdminBenefit error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler beim Beenden des Vorteils.'
        });
    }
};

/**
 * POST /api/admin/benefits/extend
 * Extends the duration of an active benefit (Business Subscription, Spotlight, or Listing Boost).
 */
export const extendAdminBenefit = async (req, res) => {
    try {
        const {
            user_id,
            benefit_type,
            listing_id,
            duration_days = 30,
            custom_end_date,
            admin_note = 'Laufzeitverlängerung durch Administration',
        } = req.body;

        if (!user_id || !benefit_type) {
            return res.status(400).json({ success: false, error: 'Benutzer-ID und Vorteil-Typ sind erforderlich.' });
        }

        const adminEmail = req.user?.email || 'Administration';
        const addDays = parseInt(duration_days, 10) || 30;

        // 1. EXTEND BUSINESS SUBSCRIPTION
        if (benefit_type === 'BUSINESS_SUBSCRIPTION') {
            const subRes = await pool.query(
                `SELECT id, expires_at FROM subscriptions 
                 WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
                [user_id]
            );

            if (subRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Kein aktives Abonnement gefunden, das verlängert werden kann.' });
            }

            const currentSub = subRes.rows[0];
            const now = new Date();
            let baseDate = currentSub.expires_at ? new Date(currentSub.expires_at) : now;
            if (baseDate < now) baseDate = now;

            let newExpiry;
            if (custom_end_date) {
                newExpiry = new Date(custom_end_date);
            } else {
                newExpiry = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);
            }

            await pool.query(
                `UPDATE subscriptions 
                 SET expires_at = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [newExpiry.toISOString(), currentSub.id]
            );

            // Ensure company profile tier remains BUSINESS
            await pool.query(
                `UPDATE company_profiles SET tier = 'BUSINESS', updated_at = NOW() WHERE user_id = $1`,
                [user_id]
            );

            const expiryFormatted = newExpiry.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at
                ) VALUES ($1, 'BUSINESS_SUBSCRIPTION', $2, $3, $4, $5, NOW())`,
                [
                    user_id,
                    JSON.stringify({ action: 'EXTENDED', extended_by_days: addDays, new_expires_at: newExpiry.toISOString() }),
                    admin_note,
                    adminEmail,
                    newExpiry.toISOString()
                ]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Campuna Business Laufzeit verlängert!',
                `Gute Nachrichten!\n\nDein kostenloses **Campuna Business** Abonnement wurde von der Administration verlängert.\n\n📅 **Neues Gültigkeitsdatum:** ${expiryFormatted}\n\nGrund: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: `Campuna Business wurde erfolgreich bis zum ${expiryFormatted} verlängert.`,
                new_expires_at: newExpiry.toISOString()
            });
        }

        // 2. EXTEND SPOTLIGHT
        else if (benefit_type === 'SPOTLIGHT') {
            const profileRes = await pool.query(
                `SELECT spotlight_until FROM company_profiles WHERE user_id = $1 LIMIT 1`,
                [user_id]
            );

            if (profileRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Firmenprofil nicht gefunden.' });
            }

            const now = new Date();
            let baseDate = profileRes.rows[0].spotlight_until ? new Date(profileRes.rows[0].spotlight_until) : now;
            if (baseDate < now) baseDate = now;

            let newSpotlight;
            if (custom_end_date) {
                newSpotlight = new Date(custom_end_date);
            } else {
                newSpotlight = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);
            }

            // Update company profile spotlight_until AND ensure tier = 'BUSINESS'
            await pool.query(
                `UPDATE company_profiles 
                 SET spotlight_until = $1, tier = 'BUSINESS', updated_at = NOW() 
                 WHERE user_id = $2`,
                [newSpotlight.toISOString(), user_id]
            );

            // Also extend active BUSINESS subscription if needed
            const subRes = await pool.query(
                `SELECT id, expires_at FROM subscriptions 
                 WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
                [user_id]
            );
            if (subRes.rows.length > 0) {
                const curSub = subRes.rows[0];
                const curSubExpiry = curSub.expires_at ? new Date(curSub.expires_at) : null;
                if (!curSubExpiry || curSubExpiry < newSpotlight) {
                    await pool.query(
                        `UPDATE subscriptions 
                         SET expires_at = $1, updated_at = NOW() 
                         WHERE id = $2`,
                        [newSpotlight.toISOString(), curSub.id]
                    );
                }
            } else {
                const planRes = await pool.query("SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1");
                const businessPlanId = planRes.rows[0]?.id;
                if (businessPlanId) {
                    const notesJson = JSON.stringify({
                        type: 'COMPLIMENTARY_GRANT_WITH_SPOTLIGHT',
                        granted_by_admin: adminEmail,
                        reason: `Verlängerung zu Homepage-Spotlight: ${admin_note}`,
                        auto_renew: false,
                        is_complimentary: true,
                    });
                    await pool.query(
                        `INSERT INTO subscriptions (
                            user_id, plan_id, status, started_at, expires_at, payment_method, amount_paid_cents, notes, created_at, updated_at
                        ) VALUES ($1, $2, 'ACTIVE', NOW(), $3, 'ADMIN_GRANT', 0, $4, NOW(), NOW())`,
                        [user_id, businessPlanId, newSpotlight.toISOString(), notesJson]
                    );
                }
            }

            const expiryFormatted = newSpotlight.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at
                ) VALUES ($1, 'SPOTLIGHT', $2, $3, $4, $5, NOW())`,
                [
                    user_id,
                    JSON.stringify({ action: 'EXTENDED', extended_by_days: addDays, new_expires_at: newSpotlight.toISOString() }),
                    admin_note,
                    adminEmail,
                    newSpotlight.toISOString()
                ]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Homepage-Spotlight & Business verlängert!',
                `Deine **Homepage-Spotlight** Platzierung und dein **Campuna Business**-Status wurden erfolgreich bis zum **${expiryFormatted}** verlängert.\n\nGrund: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: `Homepage-Spotlight (inkl. Business) wurde erfolgreich bis zum ${expiryFormatted} verlängert.`,
                new_expires_at: newSpotlight.toISOString()
            });
        }

        // 3. EXTEND LISTING BOOST
        else if (benefit_type === 'LISTING_BOOST') {
            if (!listing_id) {
                return res.status(400).json({ success: false, error: 'Bitte gib die Inserats-ID an.' });
            }

            const listRes = await pool.query(
                `SELECT title, boosted_until FROM listings WHERE id = $1 AND user_id = $2`,
                [listing_id, user_id]
            );

            if (listRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Inserat nicht gefunden.' });
            }

            const now = new Date();
            let baseDate = listRes.rows[0].boosted_until ? new Date(listRes.rows[0].boosted_until) : now;
            if (baseDate < now) baseDate = now;

            let newBoosted;
            if (custom_end_date) {
                newBoosted = new Date(custom_end_date);
            } else {
                newBoosted = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);
            }

            await pool.query(
                `UPDATE listings 
                 SET featured = TRUE, boosted_until = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [newBoosted.toISOString(), listing_id]
            );

            const expiryFormatted = newBoosted.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

            await pool.query(
                `INSERT INTO admin_benefit_grants (
                    user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at
                ) VALUES ($1, 'LISTING_BOOST', $2, $3, $4, $5, NOW())`,
                [
                    user_id,
                    JSON.stringify({ action: 'EXTENDED', listing_id, title: listRes.rows[0].title, extended_by_days: addDays, new_expires_at: newBoosted.toISOString() }),
                    admin_note,
                    adminEmail,
                    newBoosted.toISOString()
                ]
            );

            await sendSystemNotificationToUser(
                user_id,
                'Inserate-Boost verlängert!',
                `Der Boost für dein Inserat "${listRes.rows[0].title}" wurde bis zum **${expiryFormatted}** verlängert.\n\nGrund: *${admin_note}*`
            );

            return res.status(200).json({
                success: true,
                message: `Boost für "${listRes.rows[0].title}" wurde erfolgreich bis zum ${expiryFormatted} verlängert.`,
                new_expires_at: newBoosted.toISOString()
            });
        }

        return res.status(400).json({ success: false, error: 'Ungültiger Vorteil-Typ.' });
    } catch (err) {
        console.error('❌ extendAdminBenefit error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Fehler beim Verlängern des Vorteils.'
        });
    }
};

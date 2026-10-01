import { db } from '../prisma/db.js';

/**
 * Helper to calculate expiration date from preset duration or custom date
 */
const calculateExpiryDate = (durationDays, customEndDate) => {
    if (customEndDate) {
        const d = new Date(customEndDate);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
    const days = Math.max(1, Number(durationDays) || 30);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

/**
 * Internal helper to send a system notification message to a user's inbox
 */
export const sendSystemNotificationToUser = async (userId, title, content) => {
    try {
        // Find or create a conversation with the admin / system
        const adminUser = await db.orm.public.User
            .where({ role: 'ADMIN' })
            .first()
            .catch(() => null);

        if (!adminUser || adminUser.id === userId) return null;

        // Check if a conversation between admin and user exists
        let conversation = await db.orm.public.Conversation
            .where({
                buyer_id: userId,
                seller_id: adminUser.id,
            })
            .first()
            .catch(() => null);

        if (!conversation) {
            conversation = await db.orm.public.Conversation
                .where({
                    buyer_id: adminUser.id,
                    seller_id: userId,
                })
                .first()
                .catch(() => null);
        }

        // If still no conversation, create one linked to any listing or null
        if (!conversation) {
            const anyListing = await db.orm.public.Listing
                .where({ user_id: userId })
                .first()
                .catch(() => null);

            if (anyListing) {
                conversation = await db.orm.public.Conversation.create({
                    listing_id: anyListing.id,
                    buyer_id: adminUser.id,
                    seller_id: userId,
                }).catch(() => null);
            }
        }

        if (conversation) {
            await db.orm.public.Message.create({
                conversation_id: conversation.id,
                sender_id: adminUser.id,
                content: `🔔 **${title}**\n\n${content}`,
                is_read: false,
            }).catch(() => null);
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

        const targetUser = await db.orm.public.User
            .where({ id: user_id })
            .include('company_profile')
            .include('private_profile')
            .first();

        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
        }

        const expiresAt = calculateExpiryDate(duration_days, custom_end_date);
        const expiryFormatted = new Date(expiresAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        let resultData = {};

        // ── 1. BUSINESS SUBSCRIPTION (Free of charge - Commercial accounts only) ──
        if (benefit_type === 'BUSINESS_SUBSCRIPTION') {
            if (targetUser.account_type === 'PRIVATE') {
                return res.status(400).json({
                    success: false,
                    error: 'Campuna Business Tarife sind gewerblichen Konten vorbehalten. Für Privatnutzer stehen Inserate-Boosts und Campuna Credits zur Verfügung.'
                });
            }

            const businessPlan = await db.orm.public.Plan
                .where({ name: 'BUSINESS' })
                .first();

            if (!businessPlan) {
                return res.status(500).json({ success: false, error: 'Business-Tarif nicht in der Datenbank gefunden.' });
            }

            // Deactivate any existing active subscriptions
            const activeSubs = await db.orm.public.Subscription
                .where({ user_id, status: 'ACTIVE' })
                .all();

            for (const sub of activeSubs) {
                await db.orm.public.Subscription
                    .where((s) => s.id.eq(sub.id))
                    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() });
            }

            // Create complimentary subscription
            const newSub = await db.orm.public.Subscription.create({
                user_id,
                plan_id: businessPlan.id,
                status: 'ACTIVE',
                started_at: new Date().toISOString(),
                expires_at: expiresAt,
                payment_method: 'ADMIN_GRANT',
                amount_paid_cents: 0,
                notes: JSON.stringify({
                    type: 'COMPLIMENTARY_GRANT',
                    granted_by_admin: req.user.email,
                    reason: admin_note,
                    auto_renew: false,
                    is_complimentary: true,
                }),
            });

            // Ensure company profile has BUSINESS tier
            if (targetUser.company_profile) {
                await db.orm.public.CompanyProfile
                    .where((cp) => cp.user_id.eq(user_id))
                    .update({ tier: 'BUSINESS' });
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

            const listing = await db.orm.public.Listing
                .where({ id: listing_id, user_id })
                .first();

            if (!listing) {
                return res.status(404).json({ success: false, error: 'Inserat nicht gefunden oder gehört nicht zu diesem Benutzer.' });
            }

            await db.orm.public.Listing
                .where((l) => l.id.eq(listing_id))
                .update({
                    featured: true,
                    boosted_until: expiresAt,
                });

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
            if (targetUser.account_type === 'PRIVATE' || !targetUser.company_profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Homepage-Spotlights sind gewerblichen Profilen mit Firmenprofil vorbehalten. Für Privatnutzer stehen Inserate-Boosts und Campuna Credits zur Verfügung.'
                });
            }

            await db.orm.public.CompanyProfile
                .where((cp) => cp.user_id.eq(user_id))
                .update({ spotlight_until: expiresAt });

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

            const tx = await db.orm.public.CreditTransaction.create({
                user_id,
                amount,
                type: 'ADMIN_GRANT',
                description: admin_note || 'Gutschrift durch Campuna Administration',
            });

            const allTx = await db.orm.public.CreditTransaction
                .where({ user_id })
                .all();
            const newBalance = allTx.reduce((sum, t) => sum + t.amount, 0);

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
        const commercialUsers = await db.orm.public.User
            .where({ user_type: 'COMMERCIAL' })
            .include('company_profile')
            .all();

        const businessPlan = await db.orm.public.Plan
            .where({ name: 'BUSINESS' })
            .first();

        if (!businessPlan) {
            return res.status(500).json({ success: false, error: 'Business-Tarif nicht gefunden.' });
        }

        const transitionDays = 90; // 3 months
        const date = new Date();
        date.setDate(date.getDate() + transitionDays);
        const expiresAt = date.toISOString();
        const expiryFormatted = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        let updatedCount = 0;

        for (const user of commercialUsers) {
            // Check if already has an active subscription
            const existingActive = await db.orm.public.Subscription
                .where({ user_id: user.id, status: 'ACTIVE' })
                .first();

            if (!existingActive) {
                // Grant 3-month transition subscription
                await db.orm.public.Subscription.create({
                    user_id: user.id,
                    plan_id: businessPlan.id,
                    status: 'ACTIVE',
                    started_at: new Date().toISOString(),
                    expires_at: expiresAt,
                    payment_method: 'TRANSITION_PERIOD',
                    amount_paid_cents: 0,
                    notes: JSON.stringify({
                        type: 'MIGRATION_3_MONTH_TRANSITION',
                        is_transition_period: true,
                        is_complimentary: true,
                        auto_renew: false,
                        expires_at: expiresAt,
                    }),
                });

                if (user.company_profile) {
                    await db.orm.public.CompanyProfile
                        .where((cp) => cp.user_id.eq(user.id))
                        .update({ tier: 'BUSINESS' });
                }

                // Send transition notification message to their inbox
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
        const listings = await db.orm.public.Listing
            .where({ user_id: userId })
            .all();

        return res.status(200).json({
            success: true,
            listings: listings.map(l => ({
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

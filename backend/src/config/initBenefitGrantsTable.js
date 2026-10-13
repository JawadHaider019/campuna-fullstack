import pool from './database.js';

export const initBenefitGrantsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_benefit_grants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                benefit_type VARCHAR(50) NOT NULL,
                details JSONB DEFAULT '{}'::jsonb,
                admin_note TEXT,
                granted_by VARCHAR(255) DEFAULT 'Administration',
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_admin_benefit_grants_user_id ON admin_benefit_grants(user_id);
            CREATE INDEX IF NOT EXISTS idx_admin_benefit_grants_type ON admin_benefit_grants(benefit_type);
        `);

        // Backfill active spotlight grants from company_profiles if not already logged
        await pool.query(`
            INSERT INTO admin_benefit_grants (user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at)
            SELECT 
                cp.user_id, 
                'SPOTLIGHT', 
                jsonb_build_object('spotlight_until', cp.spotlight_until), 
                'Homepage-Spotlight Platziert', 
                'System / Admin', 
                cp.spotlight_until, 
                NOW()
            FROM company_profiles cp
            WHERE cp.spotlight_until IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM admin_benefit_grants abg 
                WHERE abg.user_id = cp.user_id AND abg.benefit_type = 'SPOTLIGHT'
              );
        `);

        // Backfill active complimentary subscriptions if not already logged
        await pool.query(`
            INSERT INTO admin_benefit_grants (user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at)
            SELECT 
                s.user_id,
                'BUSINESS_SUBSCRIPTION',
                jsonb_build_object('payment_method', s.payment_method, 'subscription_id', s.id),
                COALESCE((s.notes::jsonb->>'reason'), 'Kostenloses Business-Abonnement / Übergangsphase'),
                COALESCE((s.notes::jsonb->>'granted_by_admin'), 'Administration'),
                s.expires_at,
                s.created_at
            FROM subscriptions s
            WHERE s.payment_method IN ('ADMIN_GRANT', 'TRANSITION_PERIOD')
              AND NOT EXISTS (
                SELECT 1 FROM admin_benefit_grants abg 
                WHERE abg.user_id = s.user_id AND abg.benefit_type = 'BUSINESS_SUBSCRIPTION'
              );
        `);

        // Backfill credit transactions of type ADMIN_GRANT if not already logged
        await pool.query(`
            INSERT INTO admin_benefit_grants (user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at)
            SELECT 
                ct.user_id,
                'CREDITS',
                jsonb_build_object('amount', ct.amount, 'transaction_id', ct.id),
                ct.description,
                'Administration',
                NULL,
                ct.created_at
            FROM credit_transactions ct
            WHERE ct.type = 'ADMIN_GRANT'
              AND NOT EXISTS (
                SELECT 1 FROM admin_benefit_grants abg 
                WHERE abg.user_id = ct.user_id AND abg.benefit_type = 'CREDITS' AND (abg.details->>'transaction_id')::text = ct.id::text
              );
        `);

        // Backfill boosted listings if any
        await pool.query(`
            INSERT INTO admin_benefit_grants (user_id, benefit_type, details, admin_note, granted_by, expires_at, created_at)
            SELECT 
                l.user_id,
                'LISTING_BOOST',
                jsonb_build_object('listing_id', l.id, 'title', l.title),
                'Inserate-Boost hervorgehoben',
                'Administration',
                l.boosted_until,
                NOW()
            FROM listings l
            WHERE l.boosted_until IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM admin_benefit_grants abg 
                WHERE abg.user_id = l.user_id AND abg.benefit_type = 'LISTING_BOOST' AND (abg.details->>'listing_id')::text = l.id::text
              );
        `);

    } catch (err) {
        console.warn('⚠️ admin_benefit_grants init warning:', err.message);
    }
};

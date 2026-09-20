import 'dotenv/config';
import pool from './database.js';
import crypto from 'crypto';

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

async function main() {
    console.log('1. Creating admins table...');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT DEFAULT 'Campuna Admin',
            role TEXT DEFAULT 'ADMIN',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('✅ admins table created/verified');

    // Ensure all columns and defaults exist on listings table
    await pool.query(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        ALTER TABLE listings ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by_type TEXT;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by_id UUID;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
        ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_reviewed_by_id_fkey;
        ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
        ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS spotlight_until TIMESTAMPTZ;
    `).catch((err) => console.log('Notice on listings/company columns:', err.message));

    // Ensure plans table exists and has updated configuration
    await pool.query(`
        CREATE TABLE IF NOT EXISTS plans (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            price_cents INTEGER DEFAULT 0,
            listing_limit INTEGER DEFAULT 3,
            has_cover_image BOOLEAN DEFAULT FALSE,
            has_spotlight BOOLEAN DEFAULT FALSE,
            has_statistics BOOLEAN DEFAULT FALSE,
            has_csv_import BOOLEAN DEFAULT FALSE,
            description_limit INTEGER DEFAULT 500,
            is_active BOOLEAN DEFAULT TRUE,
            description TEXT
        );

        INSERT INTO plans (name, price_cents, listing_limit, has_cover_image, has_spotlight, has_statistics, has_csv_import, description_limit, is_active, description)
        VALUES 
            ('FREE', 0, 3, FALSE, FALSE, FALSE, FALSE, 500, TRUE, 'Kostenloser Basiszugang für Unternehmen (bis zu 3 aktive Inserate).'),
            ('BUSINESS', 2900, 25, TRUE, FALSE, TRUE, TRUE, 1000, TRUE, 'Campuna Business – Bis zu 25 Inserate, Titelbild, Händler-Präsenz & Statistiken für 29 € / Monat.')
        ON CONFLICT (name) DO UPDATE SET 
            price_cents = EXCLUDED.price_cents,
            listing_limit = EXCLUDED.listing_limit,
            has_cover_image = EXCLUDED.has_cover_image,
            has_spotlight = EXCLUDED.has_spotlight,
            has_statistics = EXCLUDED.has_statistics,
            has_csv_import = EXCLUDED.has_csv_import,
            description_limit = EXCLUDED.description_limit,
            description = EXCLUDED.description;
    `).catch((err) => console.log('Notice on plans sync:', err.message));

    // Ensure subscriptions table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_id INTEGER NOT NULL REFERENCES plans(id),
            status VARCHAR(50) DEFAULT 'ACTIVE',
            started_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ,
            payment_method VARCHAR(50),
            amount_paid_cents INTEGER DEFAULT 0,
            credit_tx_id INTEGER,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `).catch(() => {});

    // Grant 3-month Business welcome promo to existing commercial users without active subscription
    await pool.query(`
        INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, notes, created_at, updated_at)
        SELECT u.id, p.id, 'ACTIVE', NOW(), NOW() + INTERVAL '90 days', 'PROMO', '3 Monate Campuna Business Willkommensphase', NOW(), NOW()
        FROM users u
        CROSS JOIN plans p
        WHERE u.user_type = 'COMMERCIAL'
          AND p.name = 'BUSINESS'
          AND NOT EXISTS (
              SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'ACTIVE'
          );
    `).catch((err) => console.log('Notice on commercial promo subscription sync:', err.message));

    await pool.query(`
        CREATE TABLE IF NOT EXISTS listing_moderation (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
            ai_score INTEGER DEFAULT 50,
            ai_decision VARCHAR(50) DEFAULT 'MANUAL_REVIEW',
            confidence_score NUMERIC(5,2) DEFAULT 0.50,
            text_score INTEGER DEFAULT 50,
            image_score INTEGER DEFAULT 50,
            price_score INTEGER DEFAULT 50,
            fraud_risk_score INTEGER DEFAULT 15,
            ai_reasons JSONB DEFAULT '[]'::jsonb,
            status VARCHAR(50) DEFAULT 'PENDING',
            admin_notes TEXT,
            reviewed_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_moderation_listing_id ON listing_moderation(listing_id);
    `).catch(() => {});

    const rawEnvEmail = process.env.ADMIN_EMAIL || 'admin@campuna.com';
    const rawEnvPass = process.env.ADMIN_PASSWORD || 'AdminCampuna';
    const adminEmail = rawEnvEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();
    const adminPass = rawEnvPass.replace(/^["']|["']$/g, '').trim();

    console.log(`2. Provisioning admin in 'admins' table for ${adminEmail}...`);
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
    if (existing.rows.length === 0) {
        await pool.query(
            `INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, 'Campuna Admin', 'ADMIN')`,
            [adminEmail, hashPassword(adminPass)]
        );
        console.log('✅ Admin inserted into admins table');
    } else {
        await pool.query(
            `UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
            [hashPassword(adminPass), adminEmail]
        );
        console.log('✅ Admin password hash updated in admins table');
    }

    console.log('3. Synchronizing admin record to users and company_profiles tables...');
    await pool.query(`
        INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
        VALUES ($1, $2, $3, 'ADMIN', 'COMMERCIAL', TRUE, FALSE, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'ADMIN', user_type = 'COMMERCIAL', email_verified = TRUE;
    `, [existing.rows[0]?.id || (await pool.query('SELECT id FROM admins WHERE email = $1', [adminEmail])).rows[0]?.id, adminEmail, hashPassword(adminPass)]).catch((err) => console.log('Notice on users sync:', err.message));

    const finalAdminId = existing.rows[0]?.id || (await pool.query('SELECT id FROM admins WHERE email = $1', [adminEmail])).rows[0]?.id;
    if (finalAdminId) {
        await pool.query(`
            INSERT INTO company_profiles (user_id, company_name, tier, updated_at)
            VALUES ($1, 'Campuna Club', 'BUSINESS', NOW())
            ON CONFLICT (user_id) DO UPDATE SET company_name = 'Campuna Club', tier = 'BUSINESS';
        `, [finalAdminId]).catch((err) => console.log('Notice on company_profiles sync:', err.message));

        // Ensure official Campuna Club listings exist for admin
        const clubListings = [
            {
                title: 'Campuna Club: VW Grand California 680 Automatik',
                slug: 'campuna-club-vw-grand-california-680-automatik',
                description: 'Offizielles Campuna Club Fahrzeug: VW Grand California 680 mit 177 PS Automatik, Vollausstattung, 4 Schlafplätze, Solaranlage und Standheizung. Werkstattgeprüft.',
                price: 79900,
                location: 'München, Deutschland',
                category: 'Wohnmobile & Camper',
                subcategory: 'Kastenwagen & Van',
                images: [
                    'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=800&q=80'
                ]
            },
            {
                title: 'Campuna Club: Knaus Sport 500 EU Silver Selection',
                slug: 'campuna-club-knaus-sport-500-eu-silver-selection',
                description: 'Gepflegter Familien-Wohnwagen mit Einzelbetten, Mover, Vorzelt und 100er-Zulassung. Direkt vom Campuna Club verifiziert und sofort einsatzbereit.',
                price: 21900,
                location: 'Stuttgart, Deutschland',
                category: 'Wohnwagen & Caravans',
                subcategory: 'Wohnwagen',
                images: [
                    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'
                ]
            },
            {
                title: 'Campuna Club: EcoFlow DELTA Pro 3600Wh Powerstation',
                slug: 'campuna-club-ecoflow-delta-pro-3600wh-powerstation',
                description: 'High-End Powerstation für autarkes Camping und Reisen. 3.600 Wh Kapazität, 3.600W AC-Ausgang, superschnelles Laden. Neuwertig im Originalkarton.',
                price: 2499,
                location: 'Hamburg, Deutschland',
                category: 'Camping Zubehör',
                subcategory: 'Elektrik & Solar',
                images: [
                    'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80'
                ]
            }
        ];

        for (const cl of clubListings) {
            const check = await pool.query('SELECT id FROM listings WHERE slug = $1', [cl.slug]);
            if (check.rowCount === 0) {
                const lid = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO listings (
                        id, user_id, title, slug, description, price, negotiable, location,
                        condition, category, subcategory, status, featured, images, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, false, $7,
                        'Sehr gut', $8, $9, 'APPROVED', true, $10, NOW(), NOW()
                    )`,
                    [
                        lid,
                        finalAdminId,
                        cl.title,
                        cl.slug,
                        cl.description,
                        cl.price,
                        cl.location,
                        cl.category,
                        cl.subcategory,
                        cl.images
                    ]
                ).catch((err) => console.log('Notice on inserting club listing:', err.message));
            }
        }
    }

    console.log('✅ Admin and Campuna Club verified');

    const checkAdmins = await pool.query('SELECT id, email, name, role FROM admins');
    console.log('📊 Current admins table rows:', checkAdmins.rows.length);

    const checkUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Current users table count:', checkUsers.rows[0].count);
}

main().catch(err => {
    console.error('Notice in initAdminTable:', err.message);
});

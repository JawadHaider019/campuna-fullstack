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
    `).catch((err) => console.log('Notice on listings columns:', err.message));

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
            INSERT INTO company_profiles (user_id, company_name, updated_at)
            VALUES ($1, 'Campuna Official', NOW())
            ON CONFLICT (user_id) DO NOTHING;
        `, [finalAdminId]).catch((err) => console.log('Notice on company_profiles sync:', err.message));
    }

    console.log('✅ Admin successfully synchronized into users and company_profiles tables');

    const checkAdmins = await pool.query('SELECT id, email, name, role FROM admins');
    console.log('📊 Current admins table rows:', checkAdmins.rows.length);

    const checkUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Current users table count:', checkUsers.rows[0].count);
}

main().catch(err => {
    console.error('Notice in initAdminTable:', err.message);
});

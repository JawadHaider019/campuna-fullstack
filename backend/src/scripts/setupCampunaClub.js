import pool from '../config/database.js';

async function main() {
    try {
        console.log('🔄 Setting up Campuna Club business profile for admin...');

        // 1. Find all admin accounts
        const adminRes = await pool.query("SELECT id, email FROM users WHERE role = 'ADMIN'");
        console.log(`Found ${adminRes.rows.length} admin accounts in users table.`);

        for (const admin of adminRes.rows) {
            // Update user_type to COMMERCIAL for Business Profile
            await pool.query("UPDATE users SET user_type = 'COMMERCIAL' WHERE id = $1", [admin.id]);

            // Upsert company_profile with 'Campuna Club' and BUSINESS tier
            await pool.query(`
                INSERT INTO company_profiles (
                    user_id, company_name, tier, bio, location, phone, website_url, logo_url, created_at, updated_at
                ) VALUES (
                    $1, 'Campuna Club', 'BUSINESS',
                    'Offizielle Angebote, geprüfte Fahrzeuge & Camping-Equipment direkt vom Campuna Club.',
                    'Deutschland', '+49 30 12345678', 'https://campuna.de', '/logo.webp', NOW(), NOW()
                )
                ON CONFLICT (user_id) DO UPDATE SET 
                    company_name = 'Campuna Club',
                    tier = 'BUSINESS',
                    bio = 'Offizielle Angebote, geprüfte Fahrzeuge & Camping-Equipment direkt vom Campuna Club.',
                    location = 'Deutschland',
                    website_url = 'https://campuna.de',
                    logo_url = '/logo.webp',
                    updated_at = NOW()
            `, [admin.id]);

            console.log(`✅ Updated Admin ${admin.email} (ID: ${admin.id}) to Campuna Club Business Profile.`);
        }

        // Also check if admin exists in admins table and sync
        const adminsTableRes = await pool.query("SELECT id, email FROM admins");
        for (const a of adminsTableRes.rows) {
            await pool.query(`
                INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
                VALUES ($1, $2, 'admin_hash', 'ADMIN', 'COMMERCIAL', TRUE, FALSE, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', user_type = 'COMMERCIAL', email_verified = TRUE
            `, [a.id, a.email]).catch(() => {});

            await pool.query(`
                INSERT INTO company_profiles (
                    user_id, company_name, tier, bio, location, phone, website_url, logo_url, created_at, updated_at
                ) VALUES (
                    $1, 'Campuna Club', 'BUSINESS',
                    'Offizielle Angebote, geprüfte Fahrzeuge & Camping-Equipment direkt vom Campuna Club.',
                    'Deutschland', '+49 30 12345678', 'https://campuna.de', '/logo.webp', NOW(), NOW()
                )
                ON CONFLICT (user_id) DO UPDATE SET 
                    company_name = 'Campuna Club',
                    tier = 'BUSINESS',
                    updated_at = NOW()
            `, [a.id]).catch(() => {});
        }

        // Check listings created by admin
        const listingsRes = await pool.query(`
            SELECT l.id, l.title, u.email, cp.company_name 
            FROM listings l 
            JOIN users u ON l.user_id = u.id 
            LEFT JOIN company_profiles cp ON u.id = cp.user_id 
            WHERE u.role = 'ADMIN'
        `);
        console.log(`📊 Total listings owned by Campuna Club (Admin): ${listingsRes.rows.length}`);
        listingsRes.rows.forEach(l => console.log(`  - [${l.id}] ${l.title} (Seller: ${l.company_name})`));

        console.log('🎉 Campuna Club setup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during Campuna Club setup:', err);
        process.exit(1);
    }
}

main();

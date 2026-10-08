import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pool from '../config/database.js';

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

async function seed() {
  console.log('🌱 Starting Campuna Master Database Seeding...\n');

  try {
    // ----------------------------------------------------
    // 1. Seed & Sync Subscription Plans
    // ----------------------------------------------------
    console.log('1️⃣  Seeding Subscription Plans...');
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
        ('BUSINESS', 2900, 25, TRUE, FALSE, TRUE, TRUE, 1000, TRUE, 'Campuna Business – Bis zu 25 aktive Inserate, Firmen-Cover, Händler-Präsenz & Statistiken für 29 € / Monat.')
      ON CONFLICT (name) DO UPDATE SET 
        price_cents = EXCLUDED.price_cents,
        listing_limit = EXCLUDED.listing_limit,
        has_cover_image = EXCLUDED.has_cover_image,
        has_spotlight = EXCLUDED.has_spotlight,
        has_statistics = EXCLUDED.has_statistics,
        has_csv_import = EXCLUDED.has_csv_import,
        description_limit = EXCLUDED.description_limit,
        description = EXCLUDED.description;
    `);
    console.log('   ✅ Plans seeded (FREE, BUSINESS).');

    // ----------------------------------------------------
    // 2. Seed Default Admins
    // ----------------------------------------------------
    console.log('2️⃣  Seeding Admin & CMS Credentials...');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campuna.com').trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASSWORD || 'AdminCampuna').trim();
    const cmsEmail = (process.env.CMS_ADMIN_EMAIL || 'cmsadmin@campuna.com').trim().toLowerCase();
    const cmsPass = (process.env.CMS_ADMIN_PASSWORD || 'CMSCampuna').trim();

    await pool.query(`
      INSERT INTO admins (email, password_hash, name, role, updated_at)
      VALUES ($1, $2, 'Campuna Admin', 'ADMIN', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN', updated_at = NOW();
    `, [adminEmail, hashPassword(adminPass)]);

    await pool.query(`
      INSERT INTO admins (email, password_hash, name, role, updated_at)
      VALUES ($1, $2, 'Campuna CMS Redaktion', 'BLOG_ADMIN', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'BLOG_ADMIN', updated_at = NOW();
    `, [cmsEmail, hashPassword(cmsPass)]);
    console.log('   ✅ Admins verified (Superadmin & CMS Redaktion).');

    // ----------------------------------------------------
    // 3. Seed Pioneer Achievements from Legacy Users
    // ----------------------------------------------------
    console.log('3️⃣  Seeding Campuna Pioneer Badges & Achievements...');
    const usersJsonPath = path.resolve(process.cwd(), '../previous data/export_All-Users-modified--_2026-10-08_11-04-42.json');
    let pioneerAwarded = 0;

    if (fs.existsSync(usersJsonPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));

      let pioneerPosition = 1;
      for (const u of usersData) {
        const isPioneer = u['Campuna Pioneer'] === 'ja' || u['Campuna Pioneer'] === 'yes' || u['Campuna Pioneer'] === 'true';
        if (isPioneer && u.email && u.email.trim()) {
          const userRes = await pool.query('SELECT id, created_at FROM users WHERE email = $1', [u.email.trim().toLowerCase()]);
          if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const earnedAt = userRes.rows[0].created_at || new Date();

            const achRes = await pool.query(`
              INSERT INTO user_achievements (user_id, badge_key, position, earned_at)
              VALUES ($1, 'CAMPUNA_PIONEER', $2, $3)
              ON CONFLICT (user_id, badge_key) DO UPDATE SET position = EXCLUDED.position
              RETURNING id;
            `, [userId, pioneerPosition++, earnedAt]);

            if (achRes.rowCount > 0) pioneerAwarded++;
          }
        }
      }
      console.log(`   ✅ Seeded ${pioneerAwarded} Campuna Pioneer badges in user_achievements.`);
    } else {
      console.log('   ⚠️ Legacy users JSON not found, skipping Pioneer achievements seed.');
    }

    // ----------------------------------------------------
    // 4. Seed Commercial Promo Subscriptions
    // ----------------------------------------------------
    console.log('4️⃣  Synchronizing Commercial Subscriptions...');
    const promoSubRes = await pool.query(`
      INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, notes, created_at, updated_at)
      SELECT u.id, p.id, 'ACTIVE', NOW(), NOW() + INTERVAL '90 days', 'PROMO', '3 Monate Campuna Business Willkommensphase', NOW(), NOW()
      FROM users u
      INNER JOIN plans p ON p.name = 'BUSINESS'
      WHERE u.user_type = 'COMMERCIAL'
        AND NOT EXISTS (
            SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'ACTIVE'
        );
    `);
    console.log(`   ✅ Active commercial subscriptions verified (+${promoSubRes.rowCount || 0} updated).`);

    // ----------------------------------------------------
    // 5. Final Summary
    // ----------------------------------------------------
    console.log('\n📊 Seeding Complete! Current Database Summary:');
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM private_profiles) as private_profiles_count,
        (SELECT COUNT(*) FROM company_profiles) as company_profiles_count,
        (SELECT COUNT(*) FROM listings) as listings_count,
        (SELECT COUNT(*) FROM blog_posts) as blog_posts_count,
        (SELECT COUNT(*) FROM conversations) as conversations_count,
        (SELECT COUNT(*) FROM messages) as messages_count,
        (SELECT COUNT(*) FROM user_achievements) as achievements_count,
        (SELECT COUNT(*) FROM plans) as plans_count,
        (SELECT COUNT(*) FROM admins) as admins_count
    `);
    
    const row = counts.rows[0];
    console.log(`   • Users: ${row.users_count} (Private: ${row.private_profiles_count}, Commercial: ${row.company_profiles_count})`);
    console.log(`   • Pioneer Achievements: ${row.achievements_count}`);
    console.log(`   • Inserate / Listings: ${row.listings_count}`);
    console.log(`   • Blog Posts: ${row.blog_posts_count}`);
    console.log(`   • Chats: ${row.conversations_count} conversations, ${row.messages_count} messages`);
    console.log(`   • Plans: ${row.plans_count} | Admins: ${row.admins_count}`);
    console.log('\n✨ Database is fully seeded and synchronized!');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    await pool.end();
    process.exit(1);
  }
}

seed();

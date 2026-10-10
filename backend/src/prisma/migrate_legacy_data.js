import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pool from '../config/database.js';

// Password hashing utility (PBKDF2 sha512)
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password || 'Campuna2026!', salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Safe date parsing helper
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Normalize image URLs (convert Bubble protocol-relative // to https://)
const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
};

// Find previous data folder across common execution contexts
function findPreviousDataDir() {
  const candidates = [
    path.resolve(process.cwd(), 'previous data'),
    path.resolve(process.cwd(), '../previous data'),
    path.resolve(process.cwd(), 'backend/previous data'),
    path.resolve(process.cwd(), 'src/prisma/previous data'),
    path.resolve(process.cwd(), '../backend/previous data')
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return null;
}

// Find a file by prefix in the data folder
function findJsonFile(dir, prefix) {
  if (!dir || !fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const match = files.find(f => f.toLowerCase().includes(prefix.toLowerCase()) && f.endsWith('.json'));
  return match ? path.join(dir, match) : null;
}

async function ensureAllTablesExist() {
  console.log('🛠️  Ensuring database schema & tables exist...');
  
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'USER',
      user_type VARCHAR(50) DEFAULT 'PRIVATE',
      email_verified BOOLEAN DEFAULT TRUE,
      is_suspended BOOLEAN DEFAULT FALSE,
      referral_code VARCHAR(50) UNIQUE,
      referred_by_code VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Private Profiles
    CREATE TABLE IF NOT EXISTS private_profiles (
      id SERIAL PRIMARY KEY,
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(100) DEFAULT '',
      last_name VARCHAR(100) DEFAULT '',
      bio TEXT,
      location VARCHAR(255),
      phone VARCHAR(100),
      profile_image_url TEXT,
      cover_image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Company Profiles
    CREATE TABLE IF NOT EXISTS company_profiles (
      id SERIAL PRIMARY KEY,
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      company_name VARCHAR(255) DEFAULT '',
      bio TEXT,
      location VARCHAR(255),
      tier VARCHAR(50) DEFAULT 'FREE',
      is_strategic_partner BOOLEAN DEFAULT FALSE,
      company_email VARCHAR(255),
      company_address TEXT,
      impressum TEXT,
      privacy_policy_url TEXT,
      phone VARCHAR(100),
      vat_id VARCHAR(100),
      website_url TEXT,
      instagram_url TEXT,
      facebook_url TEXT,
      linkedin_url TEXT,
      logo_url TEXT,
      cover_image_url TEXT,
      spotlight_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Subscription Plans
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

    -- 5. Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES plans(id),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      payment_method VARCHAR(50) DEFAULT 'PROMO',
      amount_paid_cents INTEGER DEFAULT 0,
      credit_tx_id INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. User Achievements / Badges
    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      badge_key VARCHAR(100) NOT NULL,
      position INTEGER,
      earned_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_badge UNIQUE (user_id, badge_key)
    );

    -- 7. Credit Transactions
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 8. Listings
    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT,
      description TEXT NOT NULL,
      category_id UUID,
      subcategory_id UUID,
      category VARCHAR(150),
      subcategory VARCHAR(150),
      price NUMERIC(12,2) DEFAULT 0,
      negotiable BOOLEAN DEFAULT FALSE,
      location VARCHAR(255),
      phone VARCHAR(100),
      condition VARCHAR(100),
      type_of_offer VARCHAR(100) DEFAULT 'Ich biete',
      status VARCHAR(50) DEFAULT 'APPROVED',
      featured BOOLEAN DEFAULT FALSE,
      boosted_until TIMESTAMPTZ,
      reviewed_by_type VARCHAR(50),
      reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      images TEXT[] DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    DO $$ BEGIN
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;

    -- 9. Listing Moderation
    CREATE TABLE IF NOT EXISTS listing_moderation (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      ai_score INTEGER DEFAULT 88,
      ai_decision VARCHAR(50) DEFAULT 'AUTO_APPROVED',
      confidence_score NUMERIC(5,2) DEFAULT 0.95,
      text_score INTEGER DEFAULT 90,
      image_score INTEGER DEFAULT 85,
      price_score INTEGER DEFAULT 90,
      fraud_risk_score INTEGER DEFAULT 5,
      ai_reasons JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(50) DEFAULT 'AUTO_RESOLVED',
      admin_notes TEXT,
      reviewed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 10. Conversations & Messages
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
      buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
      seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 11. Blog Posts
    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'Campuna blogs',
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      image_url TEXT,
      images TEXT[] DEFAULT ARRAY[]::TEXT[],
      author_name VARCHAR(100) DEFAULT 'Campuna Redaktion',
      author_avatar TEXT DEFAULT '/logo.webp',
      read_time VARCHAR(50) DEFAULT '5 Min.',
      featured BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'published',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 12. Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name VARCHAR(100),
      author_avatar TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 13. Admins
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(100) DEFAULT 'Admin',
      role VARCHAR(50) DEFAULT 'ADMIN',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Schema tables verified.');
}

async function migrate() {
  console.log('🚀 Starting Full Campuna Legacy Data Migration & ETL Pipeline...\n');

  const dataDir = findPreviousDataDir();
  if (!dataDir) {
    console.error('❌ Could not locate "previous data" folder! Please ensure the folder exists.');
    process.exit(1);
  }
  console.log(`📁 Located legacy data directory: ${dataDir}\n`);

  try {
    await ensureAllTablesExist();

    // Map to keep track of Bubble unique ID -> PostgreSQL UUID
    const emailToUserIdMap = new Map();
    const bubbleListingIdToUuidMap = new Map();
    const bubbleConversationIdToUuidMap = new Map();

    // ----------------------------------------------------
    // 1. Migrate Users & Profiles
    // ----------------------------------------------------
    console.log('\n👤 1. Migrating Users & Profiles...');
    const usersFile = findJsonFile(dataDir, 'All-Users');
    let usersMigrated = 0;
    let pioneerAwarded = 0;
    let businessSubsCreated = 0;

    if (usersFile) {
      const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      console.log(`   Found ${usersData.length} users in legacy file.`);

      let pioneerPosition = 1;

      for (const u of usersData) {
        const rawEmail = (u.email || '').trim().toLowerCase();
        if (!rawEmail) continue;

        const isCommercial = (u['User Type'] || '').toLowerCase().includes('gewerblich');
        const userType = isCommercial ? 'COMMERCIAL' : 'PRIVATE';
        const role = (u['Role'] || '').toLowerCase() === 'admin' ? 'ADMIN' : 'USER';
        const isSuspended = (u['Is suspended/Blocked'] || '').toLowerCase() === 'ja';
        const emailVerified = (u['emailConfirmed?'] || '').toLowerCase() === 'ja' || true;
        const createdAt = parseDate(u['Creation Date']);
        const updatedAt = parseDate(u['Modified Date']);

        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [rawEmail]);
        let userId;

        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          await pool.query(`
            UPDATE users SET 
              user_type = $1,
              email_verified = $2,
              updated_at = $3
            WHERE id = $4;
          `, [userType, emailVerified, updatedAt, userId]);
        } else {
          userId = crypto.randomUUID();
          await pool.query(`
            INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
          `, [
            userId,
            rawEmail,
            hashPassword('Campuna2026!'),
            role,
            userType,
            emailVerified,
            isSuspended,
            createdAt,
            updatedAt
          ]);
        }
        emailToUserIdMap.set(rawEmail, userId);
        usersMigrated++;

        // Handle Profile
        const username = (u.username || '').trim();
        const firstName = (u['First name'] || (username.includes(' ') ? username.split(' ')[0] : username)).trim();
        const lastName = (u['Last name'] || (username.includes(' ') ? username.split(' ').slice(1).join(' ') : '')).trim();
        const bio = (u.Bio || '').trim() || null;
        const location = (u.Address || u['BU - Full address'] || '').trim() || null;
        const phone = (u.Phone || u['BU - phone'] || '').trim() || null;
        const avatarUrl = formatImageUrl(u['Logo/Profile']);
        const coverUrl = formatImageUrl(u.Cover);

        if (isCommercial) {
          const companyName = (u['BU - Company name'] || username || 'Campuna Partner').trim();
          const companyEmail = (u['BU - Company email'] || rawEmail).trim();
          const companyAddress = (u['BU - Full address'] || location || '').trim();
          const impressum = (u['BU - Impressum '] || '').trim() || null;
          const vatId = (u['BU - VAT ID'] || '').trim() || null;
          const website = (u.Website || '').trim() || null;
          const instagram = (u.Instagram || '').trim() || null;
          const facebook = (u.Facebook || '').trim() || null;

          await pool.query(`
            INSERT INTO company_profiles (
              user_id, company_name, first_name, last_name, bio, location,
              company_email, company_address, impressum, phone, vat_id,
              website_url, instagram_url, facebook_url, logo_url, cover_image_url,
              tier, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'BUSINESS', $17, $18)
            ON CONFLICT (user_id) DO UPDATE SET
              company_name = EXCLUDED.company_name,
              bio = EXCLUDED.bio,
              location = EXCLUDED.location,
              company_email = EXCLUDED.company_email,
              company_address = EXCLUDED.company_address,
              impressum = EXCLUDED.impressum,
              phone = EXCLUDED.phone,
              vat_id = EXCLUDED.vat_id,
              website_url = EXCLUDED.website_url,
              instagram_url = EXCLUDED.instagram_url,
              facebook_url = EXCLUDED.facebook_url,
              logo_url = EXCLUDED.logo_url,
              cover_image_url = EXCLUDED.cover_image_url,
              tier = 'BUSINESS',
              updated_at = EXCLUDED.updated_at;
          `, [
            userId, companyName, firstName, lastName, bio, location,
            companyEmail, companyAddress, impressum, phone, vatId,
            website, instagram, facebook, avatarUrl, coverUrl,
            createdAt, updatedAt
          ]);

          // Commercial Subscription Promo
          const planRes = await pool.query("SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1");
          if (planRes.rows.length > 0) {
            const planId = planRes.rows[0].id;
            const subRes = await pool.query(`
              INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, notes, created_at, updated_at)
              SELECT $1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '90 days', 'PROMO', '3 Monate Campuna Business Willkommensphase', NOW(), NOW()
              WHERE NOT EXISTS (
                SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'ACTIVE'
              )
              RETURNING id;
            `, [userId, planId]);
            if (subRes.rowCount > 0) businessSubsCreated++;
          }
        } else {
          await pool.query(`
            INSERT INTO private_profiles (
              user_id, first_name, last_name, bio, location, phone,
              profile_image_url, cover_image_url, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (user_id) DO UPDATE SET
              first_name = EXCLUDED.first_name,
              last_name = EXCLUDED.last_name,
              bio = EXCLUDED.bio,
              location = EXCLUDED.location,
              phone = EXCLUDED.phone,
              profile_image_url = EXCLUDED.profile_image_url,
              cover_image_url = EXCLUDED.cover_image_url,
              updated_at = EXCLUDED.updated_at;
          `, [
            userId, firstName, lastName, bio, location, phone,
            avatarUrl, coverUrl, createdAt, updatedAt
          ]);
        }

        // Pioneer Badge Award
        const isPioneer = (u['Campuna Pioneer'] || '').toLowerCase() === 'ja' ||
                          (u['Campuna Pioneer'] || '').toLowerCase() === 'yes' ||
                          (u['Campuna Pioneer'] || '').toLowerCase() === 'true';

        if (isPioneer) {
          const achRes = await pool.query(`
            INSERT INTO user_achievements (user_id, badge_key, position, earned_at)
            VALUES ($1, 'CAMPUNA_PIONEER', $2, $3)
            ON CONFLICT (user_id, badge_key) DO UPDATE SET position = EXCLUDED.position
            RETURNING id;
          `, [userId, pioneerPosition++, createdAt]);
          if (achRes.rowCount > 0) pioneerAwarded++;
        }

        // Initial Credits
        const credits = parseInt(u.Cradits || '0', 10);
        if (!isNaN(credits) && credits > 0) {
          await pool.query(`
            INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
            VALUES ($1, $2, 'BONUS', 'Legacy Account Credit Balance', $3);
          `, [userId, credits, createdAt]);
        }
      }
      console.log(`   ✅ Migrated ${usersMigrated} Users, ${pioneerAwarded} Pioneer Badges, ${businessSubsCreated} Business Subscriptions.`);
    }

    // ----------------------------------------------------
    // 2. Migrate Marketplace Listings
    // ----------------------------------------------------
    console.log('\n📦 2. Migrating Listings & Media...');
    const listingsFile = findJsonFile(dataDir, 'All-Listings');
    let listingsMigrated = 0;

    if (listingsFile) {
      const listingsData = JSON.parse(fs.readFileSync(listingsFile, 'utf8'));
      console.log(`   Found ${listingsData.length} listings in legacy file.`);

      for (const item of listingsData) {
        const creatorEmail = (item.Creator || '').trim().toLowerCase();
        let userId = emailToUserIdMap.get(creatorEmail);

        // Fallback: If creator user doesn't exist, create a stub or assign to default admin
        if (!userId) {
          const fallbackEmail = creatorEmail || 'inserent@campuna.de';
          const stubRes = await pool.query(`
            INSERT INTO users (email, password_hash, role, user_type, created_at, updated_at)
            VALUES ($1, $2, 'USER', 'PRIVATE', NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
            RETURNING id;
          `, [fallbackEmail, hashPassword('Campuna2026!')]);
          userId = stubRes.rows[0].id;
          emailToUserIdMap.set(fallbackEmail, userId);
        }

        const title = (item.title || 'Camping Inserat').trim();
        const description = (item.description || '').trim() || title;
        const category = (item.Category || 'Ausrüstung und Zubehör').trim();
        const subcategory = (item['Sub - Category'] || '').trim() || null;
        const price = parseFloat(item.price || '0') || 0;
        const negotiable = (item['Negotiable Price?'] || '').toLowerCase() === 'yes';
        const location = (item['location geo'] || item.location || '').trim() || 'Deutschland';
        const condition = (item['Condition item'] || 'Gebraucht').trim();
        const typeOfOffer = (item['Type of offer'] || 'Ich biete').trim();
        const viewsCount = parseInt(item.views || '0', 10) || 0;
        const featured = (item.Featured || '').toLowerCase() === 'ja' || (item.Featured || '').toLowerCase() === 'yes';
        const createdAt = parseDate(item['Creation Date']);
        const updatedAt = parseDate(item['Modified Date']);

        // Process images
        const imagesRaw = item.images ? item.images.split(',') : [];
        const imagesList = [];
        
        // If there's a Main Image, put it first
        const mainImg = formatImageUrl(item['Main Image']);
        if (mainImg) imagesList.push(mainImg);

        for (const img of imagesRaw) {
          const formatted = formatImageUrl(img);
          if (formatted && !imagesList.includes(formatted)) {
            imagesList.push(formatted);
          }
        }

        // Status mapping
        let status = 'APPROVED';
        const rawStatus = (item.status || item['Sold status'] || '').toLowerCase();
        if (rawStatus.includes('entwurf') || rawStatus.includes('draft')) {
          status = 'DRAFT';
        } else if (rawStatus.includes('prüfung') || rawStatus.includes('review') || rawStatus.includes('pending')) {
          status = 'REVIEW';
        }

        // Generate slug
        const baseSlug = title
          .toLowerCase()
          .replace(/[äÄ]/g, 'ae')
          .replace(/[öÖ]/g, 'oe')
          .replace(/[üÜ]/g, 'ue')
          .replace(/[ß]/g, 'ss')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        // Check if listing already exists for this user to prevent duplicates on migration re-runs
        const existingListing = await pool.query(
          'SELECT id FROM listings WHERE user_id = $1 AND title = $2 LIMIT 1',
          [userId, title]
        );
        if (existingListing.rows.length > 0) {
          if (item['unique id']) {
            bubbleListingIdToUuidMap.set(item['unique id'].trim(), existingListing.rows[0].id);
          }
          continue;
        }

        // Generate listing UUID
        const newListingId = crypto.randomUUID();

        await pool.query(`
          INSERT INTO listings (
            id, user_id, title, slug, description, category, subcategory,
            price, negotiable, location, condition, type_of_offer,
            status, featured, images, views_count, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
        `, [
          newListingId, userId, title, slug, description, category, subcategory,
          price, negotiable, location, condition, typeOfOffer,
          status, featured, imagesList, viewsCount, createdAt, updatedAt
        ]);

        listingsMigrated++;

        if (item['unique id']) {
          bubbleListingIdToUuidMap.set(item['unique id'].trim(), newListingId);
        }

        // Create initial listing moderation score
        const aiScore = status === 'APPROVED' ? 92 : 50;
        const modId = crypto.randomUUID();
        await pool.query(`
          INSERT INTO listing_moderation (
            id, listing_id, ai_score, ai_decision, confidence_score,
            text_score, image_score, price_score, fraud_risk_score,
            ai_reasons, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 0.95, 90, 85, 90, 5, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING;
        `, [
          modId,
          newListingId,
          aiScore,
          status === 'APPROVED' ? 'AUTO_APPROVED' : 'MANUAL_REVIEW',
          JSON.stringify(['Altdatenbestand aus Campuna Plattform erfolgreich migriert']),
          status === 'APPROVED' ? 'AUTO_RESOLVED' : 'PENDING',
          createdAt,
          updatedAt
        ]);
      }
      console.log(`   ✅ Migrated ${listingsMigrated} Listings and configured moderation records.`);
    }

    // ----------------------------------------------------
    // 3. Migrate Conversations & Messages
    // ----------------------------------------------------
    console.log('\n💬 3. Migrating Conversations & Messages...');
    const convFile = findJsonFile(dataDir, 'All-Conversations');
    const msgFile = findJsonFile(dataDir, 'ALL-Messages');
    let convsMigrated = 0;
    let msgsMigrated = 0;

    if (convFile) {
      const convData = JSON.parse(fs.readFileSync(convFile, 'utf8'));
      console.log(`   Found ${convData.length} conversations in legacy file.`);

      for (const c of convData) {
        const members = (c.Members || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
        const creatorEmail = (c.Creator || members[0] || '').trim().toLowerCase();
        const otherEmail = members.find(m => m !== creatorEmail) || members[1] || creatorEmail;

        const buyerId = emailToUserIdMap.get(creatorEmail);
        const sellerId = emailToUserIdMap.get(otherEmail);

        if (!buyerId || !sellerId || buyerId === sellerId) continue;

        let listingId = null;
        if (c.Listing && bubbleListingIdToUuidMap.has(c.Listing.trim())) {
          listingId = bubbleListingIdToUuidMap.get(c.Listing.trim());
        }

        const createdAt = parseDate(c['Creation Date']);
        const updatedAt = parseDate(c['Modified Date']);
        const convId = crypto.randomUUID();

        await pool.query(`
          INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [convId, listingId, buyerId, sellerId, createdAt, updatedAt]);

        convsMigrated++;

        if (c['unique id']) {
          bubbleConversationIdToUuidMap.set(c['unique id'].trim(), convId);
        }
      }
      console.log(`   ✅ Migrated ${convsMigrated} Conversations.`);
    }

    if (msgFile) {
      const msgData = JSON.parse(fs.readFileSync(msgFile, 'utf8'));
      console.log(`   Found ${msgData.length} messages in legacy file.`);

      for (const m of msgData) {
        const bubbleConvId = (m.Conversation || '').trim();
        const convId = bubbleConversationIdToUuidMap.get(bubbleConvId);
        const senderEmail = (m.Creator || '').trim().toLowerCase();
        const senderId = emailToUserIdMap.get(senderEmail);

        if (!convId || !senderId) continue;

        const content = (m.Content || '').trim();
        if (!content) continue;

        const isRead = (m.Read || '').includes(senderEmail) && (m.Read || '').split(',').length > 1;
        const createdAt = parseDate(m['Creation Date']);
        const msgId = crypto.randomUUID();

        await pool.query(`
          INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [msgId, convId, senderId, content, isRead, createdAt]);

        msgsMigrated++;
      }
      console.log(`   ✅ Migrated ${msgsMigrated} Messages.`);
    }

    // ----------------------------------------------------
    // 4. Migrate Blog Posts & Content Blocks
    // ----------------------------------------------------
    console.log('\n📝 4. Migrating Blog Posts & Content Blocks...');
    const postsFile = findJsonFile(dataDir, 'All-Posts');
    const blocksFile = findJsonFile(dataDir, 'Content-Blocks');
    let postsMigrated = 0;

    if (postsFile) {
      const postsData = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
      const blocksData = blocksFile ? JSON.parse(fs.readFileSync(blocksFile, 'utf8')) : [];

      console.log(`   Found ${postsData.length} blog posts and ${blocksData.length} content blocks.`);

      // Group blocks by Parent Post ID and sort by Position
      const blocksByPost = new Map();
      for (const b of blocksData) {
        const parent = (b['Parent Post'] || '').trim();
        if (!parent) continue;
        if (!blocksByPost.has(parent)) blocksByPost.set(parent, []);
        blocksByPost.get(parent).push(b);
      }

      for (const p of postsData) {
        const title = (p.Title || '').trim();
        if (!title) continue;

        const slug = (p.Slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
        const excerpt = (p['Description SEO'] || '').trim() || null;
        const imageUrl = formatImageUrl(p['Featured Image']);
        const tags = (p.Tags || '').split(',').map(t => t.trim()).filter(Boolean);
        const createdAt = parseDate(p['Creation Date']);
        const updatedAt = parseDate(p['Updated Date'] || p['Modified Date']);

        // Stitch together content blocks into rich HTML/Markdown
        const postId = (p['unique id'] || '').trim();
        const postBlocks = (blocksByPost.get(postId) || []).sort((a, b) => {
          return (parseInt(a.Position || '0', 10) || 0) - (parseInt(b.Position || '0', 10) || 0);
        });

        let fullContent = '';
        const postImages = [];
        if (imageUrl) postImages.push(imageUrl);

        if (postBlocks.length > 0) {
          for (const block of postBlocks) {
            const bType = (block.Type || '').toLowerCase();
            const bText = (block.Text || '').trim();
            const bImg = formatImageUrl(block.Image);

            if (bImg && !postImages.includes(bImg)) {
              postImages.push(bImg);
            }

            if (bType.includes('heading 2')) {
              fullContent += `\n\n## ${bText}\n\n`;
            } else if (bType.includes('heading 3')) {
              fullContent += `\n\n### ${bText}\n\n`;
            } else if (bType.includes('image') && bImg) {
              fullContent += `\n\n![${block['Alt Tag'] || title}](${bImg})\n\n`;
              if (bText) fullContent += `${bText}\n\n`;
            } else if (bText) {
              // Clean BBCode style tags like [b], [highlight=transparent], [ul], [li], etc.
              const cleanText = bText
                .replace(/\[highlight=[^\]]*\]/gi, '')
                .replace(/\[\/highlight\]/gi, '')
                .replace(/\[b\]/gi, '**')
                .replace(/\[\/b\]/gi, '**')
                .replace(/\[ml\]/gi, '')
                .replace(/\[\/ml\]/gi, '')
                .replace(/\[ul\]/gi, '')
                .replace(/\[\/ul\]/gi, '')
                .replace(/\[ol\]/gi, '')
                .replace(/\[\/ol\]/gi, '')
                .replace(/\[li[^\]]*\]/gi, '\n* ')
                .replace(/\[\/li\]/gi, '');
              fullContent += `${cleanText}\n\n`;
            }
          }
        } else {
          fullContent = excerpt || title;
        }

        const existingPost = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
        if (existingPost.rows.length > 0) {
          await pool.query(`
            UPDATE blog_posts SET
              title = $1,
              content = $2,
              excerpt = $3,
              image_url = $4,
              images = $5,
              updated_at = $6
            WHERE slug = $7;
          `, [title, fullContent.trim(), excerpt, imageUrl, postImages, updatedAt, slug]);
        } else {
          const blogId = crypto.randomUUID();
          await pool.query(`
            INSERT INTO blog_posts (
              id, title, slug, excerpt, content, category, tags,
              image_url, images, author_name, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'Campuna Ratgeber', $6, $7, $8, 'Campuna Redaktion', 'published', $9, $10);
          `, [blogId, title, slug, excerpt, fullContent.trim(), tags, imageUrl, postImages, createdAt, updatedAt]);
        }

        postsMigrated++;
      }
      console.log(`   ✅ Migrated ${postsMigrated} Blog Posts with formatted content.`);
    }

    // ----------------------------------------------------
    // 5. Migrate Reviews
    // ----------------------------------------------------
    console.log('\n⭐ 5. Migrating Reviews...');
    const reviewsFile = findJsonFile(dataDir, 'All-Reviews');
    let reviewsMigrated = 0;

    if (reviewsFile) {
      const reviewsData = JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
      for (const r of reviewsData) {
        const creatorEmail = (r.Creator || '').trim().toLowerCase();
        const authorId = emailToUserIdMap.get(creatorEmail) || null;
        const authorName = (r['Author name'] || 'Campuna Camper').trim();
        const rating = parseInt(r.Rating || '5', 10) || 5;
        const comment = (r.Comment || r.Review || '').trim();
        const createdAt = parseDate(r['Creation Date']);

        if (comment) {
          const reviewId = crypto.randomUUID();
          await pool.query(`
            INSERT INTO reviews (id, author_id, author_name, rating, comment, created_at)
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [reviewId, authorId, authorName, rating, comment, createdAt]);
          reviewsMigrated++;
        }
      }
      console.log(`   ✅ Migrated ${reviewsMigrated} Reviews.`);
    }

    // ----------------------------------------------------
    // 6. Ensure Master Admins
    // ----------------------------------------------------
    console.log('\n👑 6. Syncing Default Admin Credentials...');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campuna.com').trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASSWORD || 'AdminCampuna').trim();
    const cmsEmail = (process.env.CMS_ADMIN_EMAIL || 'cmsadmin@campuna.com').trim().toLowerCase();
    const cmsPass = (process.env.CMS_ADMIN_PASSWORD || 'CMSCampuna').trim();

    await pool.query(`
      INSERT INTO admins (email, password_hash, name, role, updated_at)
      VALUES ($1, $2, 'Campuna Administrator', 'ADMIN', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN', updated_at = NOW();
    `, [adminEmail, hashPassword(adminPass)]);

    await pool.query(`
      INSERT INTO admins (email, password_hash, name, role, updated_at)
      VALUES ($1, $2, 'Campuna CMS Redaktion', 'BLOG_ADMIN', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'BLOG_ADMIN', updated_at = NOW();
    `, [cmsEmail, hashPassword(cmsPass)]);
    console.log('   ✅ Superadmin & CMS Redaktion accounts synchronized.');

    // ----------------------------------------------------
    // 7. Migration Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    const finalCounts = await pool.query(`
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
    
    const row = finalCounts.rows[0];
    console.log(`📊 Database Statistics:`);
    console.log(`   • Users: ${row.users_count} (Private: ${row.private_profiles_count}, Commercial: ${row.company_profiles_count})`);
    console.log(`   • Pioneer Achievements: ${row.achievements_count}`);
    console.log(`   • Marketplace Listings: ${row.listings_count}`);
    console.log(`   • Blog Posts: ${row.blog_posts_count}`);
    console.log(`   • Conversations: ${row.conversations_count}`);
    console.log(`   • Chat Messages: ${row.messages_count}`);
    console.log(`   • Subscription Plans: ${row.plans_count} | Admins: ${row.admins_count}`);
    console.log('====================================================\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Critical error during migration:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();

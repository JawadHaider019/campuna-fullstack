import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_listings,
      COUNT(CASE WHEN l.featured = true THEN 1 END) as featured_true,
      COUNT(CASE WHEN l.boosted_until IS NOT NULL AND l.boosted_until > NOW() THEN 1 END) as boosted_active,
      COUNT(CASE WHEN cp.id IS NOT NULL THEN 1 END) as commercial_listings,
      COUNT(CASE WHEN cp.id IS NOT NULL AND cp.tier = 'BUSINESS' THEN 1 END) as business_tier_listings,
      COUNT(CASE WHEN cp.id IS NOT NULL AND (l.featured = true OR (l.boosted_until IS NOT NULL AND l.boosted_until > NOW())) THEN 1 END) as commercial_and_boosted
    FROM listings l
    LEFT JOIN company_profiles cp ON l.user_id = cp.user_id
  `);
  console.log('Stats:', stats.rows[0]);

  const companyStats = await pool.query(`
    SELECT cp.id, cp.company_name, cp.tier, cp.subscription_status, COUNT(l.id) as listing_count
    FROM company_profiles cp
    LEFT JOIN listings l ON l.user_id = cp.user_id
    GROUP BY cp.id, cp.company_name, cp.tier, cp.subscription_status
  `);
  console.log('Companies:', companyStats.rows);

  process.exit(0);
}

check();

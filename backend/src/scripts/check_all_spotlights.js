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
  const res = await pool.query(`
    SELECT 
      COUNT(*) as total_companies,
      COUNT(CASE WHEN spotlight_until IS NOT NULL AND spotlight_until > NOW() THEN 1 END) as active_spotlight_count,
      COUNT(CASE WHEN tier = 'BUSINESS' THEN 1 END) as business_tier_count
    FROM company_profiles
  `);
  console.log('Spotlight profile stats:', res.rows[0]);

  const list = await pool.query(`
    SELECT id, company_name, spotlight_until, tier
    FROM company_profiles
    ORDER BY company_name ASC
  `);
  console.log('Company profiles with spotlight_until:');
  console.log(list.rows);

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});

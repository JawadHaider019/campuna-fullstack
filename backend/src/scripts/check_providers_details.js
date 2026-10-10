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
  const query = `
    SELECT 
      cp.*,
      u.email,
      u.role,
      u.user_type
    FROM company_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.company_name ILIKE '%TS Caravan%' 
       OR cp.company_name ILIKE '%Desidus%' 
       OR cp.company_name ILIKE '%Nalux%' 
       OR cp.company_name ILIKE '%Carav%'
  `;
  const res = await pool.query(query);
  console.log('Company Profile query (columns & values):');
  console.log(res.rows);

  const listingsQuery = `
    SELECT 
      l.id, l.title, l.status, l.featured, l.boosted_until, l.created_at,
      cp.company_name
    FROM listings l
    JOIN company_profiles cp ON l.user_id = cp.user_id
    WHERE cp.company_name ILIKE '%TS Caravan%' 
       OR cp.company_name ILIKE '%Desidus%' 
       OR cp.company_name ILIKE '%Nalux%' 
       OR cp.company_name ILIKE '%Carav%'
  `;
  const lRes = await pool.query(listingsQuery);
  console.log('\nListings:');
  console.log(lRes.rows);

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});

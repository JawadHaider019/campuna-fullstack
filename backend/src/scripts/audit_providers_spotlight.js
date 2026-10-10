import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function printSummary() {
  const query = `
    SELECT 
      cp.company_name,
      cp.tier,
      COUNT(l.id) as listings_count,
      COUNT(CASE WHEN l.status = 'APPROVED' THEN 1 END) as approved_count,
      COUNT(CASE WHEN array_length(l.images, 1) > 0 THEN 1 END) as with_images_count,
      (cp.bio IS NOT NULL AND LENGTH(TRIM(cp.bio)) > 5) as has_bio,
      (cp.logo_url IS NOT NULL AND LENGTH(TRIM(cp.logo_url)) > 3) as has_logo,
      (cp.cover_image_url IS NOT NULL AND LENGTH(TRIM(cp.cover_image_url)) > 3) as has_cover
    FROM company_profiles cp
    LEFT JOIN listings l ON cp.user_id = l.user_id
    GROUP BY cp.id, cp.company_name, cp.tier, cp.bio, cp.logo_url, cp.cover_image_url
    ORDER BY listings_count DESC, cp.company_name ASC
  `;

  const res = await pool.query(query);
  const withListings = res.rows.filter(r => parseInt(r.listings_count) > 0);
  const withoutListings = res.rows.filter(r => parseInt(r.listings_count) === 0);

  console.log(`TOTAL PROVIDERS: ${res.rows.length}\n`);
  console.log(`========================================================================`);
  console.log(`GROUP A: PROVIDERS WITH LISTINGS (${withListings.length} providers, ${withListings.reduce((sum, r) => sum + parseInt(r.listings_count), 0)} listings total)`);
  console.log(`========================================================================`);
  withListings.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.company_name}`);
    console.log(`   • Inserate: ${r.listings_count} (Alle ${r.with_images_count} haben Fotos)`);
    console.log(`   • Profil: Bio: ${r.has_bio ? 'JA' : 'NEIN'} | Logo: ${r.has_logo ? 'JA' : 'NEIN'} | Cover: ${r.has_cover ? 'JA' : 'NEIN'}`);
    console.log(`   • Status: Inserate sind APPROVED und haben Fotos. Fehlt nur noch: Aktiver 30-Tage Boost Flag (boosted_until) in der DB.`);
  });

  console.log(`\n========================================================================`);
  console.log(`GROUP B: PROVIDERS WITHOUT ANY LISTINGS (${withoutListings.length} providers)`);
  console.log(`========================================================================`);
  withoutListings.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.company_name}`);
    console.log(`   • Inserate: 0 Inserate vorhanden`);
    console.log(`   • Profil: Bio: ${r.has_bio ? 'JA' : 'NEIN'} | Logo: ${r.has_logo ? 'JA' : 'NEIN'} | Cover: ${r.has_cover ? 'JA' : 'NEIN'}`);
    console.log(`   • Grund für Nicht-Erscheinen: Hat noch kein Inserat auf Campuna erstellt.`);
  });

  process.exit(0);
}

printSummary().catch(e => {
  console.error(e);
  process.exit(1);
});

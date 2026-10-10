import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkEligibility() {
  const res = await pool.query(`
    SELECT 
      cp.company_name,
      (cp.spotlight_until IS NOT NULL AND cp.spotlight_until > NOW()) as has_valid_spotlight,
      u.email_verified,
      (cp.logo_url IS NOT NULL AND cp.logo_url != '') as has_logo,
      (cp.cover_image_url IS NOT NULL AND cp.cover_image_url != '') as has_cover,
      (LENGTH(COALESCE(cp.bio, '')) >= 20) as has_bio_20,
      (cp.phone IS NOT NULL AND cp.phone != '') as has_phone,
      (COALESCE(cp.location, '') != '' OR COALESCE(cp.company_address, '') != '') as has_location,
      CASE 
          WHEN ((cp.spotlight_until IS NOT NULL AND cp.spotlight_until > NOW()) OR cp.is_strategic_partner = TRUE)
           AND u.email_verified IS TRUE
           AND cp.logo_url IS NOT NULL AND cp.logo_url != ''
           AND cp.cover_image_url IS NOT NULL AND cp.cover_image_url != ''
           AND LENGTH(COALESCE(cp.bio, '')) >= 20
           AND (cp.phone IS NOT NULL AND cp.phone != '')
           AND (COALESCE(cp.location, '') != '' OR COALESCE(cp.company_address, '') != '')
          THEN TRUE
          ELSE FALSE
      END as is_spotlight_eligible
    FROM users u
    JOIN company_profiles cp ON cp.user_id = u.id
    WHERE u.user_type = 'COMMERCIAL'
    ORDER BY is_spotlight_eligible DESC, cp.company_name ASC
  `);

  console.log(`\n======================================================`);
  console.log(`PROVIDER SPOTLIGHT ELIGIBILITY BREAKDOWN (${res.rows.length} total):`);
  console.log(`======================================================`);

  const eligible = res.rows.filter(r => r.is_spotlight_eligible);
  const notEligible = res.rows.filter(r => !r.is_spotlight_eligible);

  console.log(`\n✅ ELIGIBLE PROVIDERS (${eligible.length}):`);
  eligible.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.company_name}`);
  });

  console.log(`\n❌ NOT ELIGIBLE PROVIDERS (${notEligible.length}) & WHY:`);
  notEligible.forEach((r, idx) => {
    const missing = [];
    if (!r.has_valid_spotlight) missing.push('Kein gültiges spotlight_until');
    if (!r.email_verified) missing.push('E-Mail nicht verifiziert (email_verified = false)');
    if (!r.has_logo) missing.push('Kein Logo hochgeladen');
    if (!r.has_cover) missing.push('Kein Cover-Bild hochgeladen');
    if (!r.has_bio_20) missing.push('Bio fehlt oder ist unter 20 Zeichen');
    if (!r.has_phone) missing.push('Keine Telefonnummer hinterlegt');
    if (!r.has_location) missing.push('Kein Standort/Adresse');

    console.log(`${idx + 1}. ${r.company_name}`);
    console.log(`   ❌ Fehlt: ${missing.join(', ')}`);
  });

  process.exit(0);
}

checkEligibility().catch(e => {
  console.error(e);
  process.exit(1);
});

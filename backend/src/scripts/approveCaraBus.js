import pool from '../config/database.js';

async function approveCaraBus() {
    const listingId = 'e71ce238-86fc-4c48-99c4-1439198ef493';
    await pool.query("UPDATE listings SET status = 'APPROVED', updated_at = NOW() WHERE id = $1", [listingId]);
    await pool.query("UPDATE listing_moderation SET ai_score = 95, ai_decision = 'AUTO_APPROVED', status = 'APPROVED', ai_reasons = '[\"Legitimes Camping-Fahrzeug mit vollständiger Ausstattung\"]'::jsonb, updated_at = NOW() WHERE listing_id = $1", [listingId]);
    console.log('✅ Weinsberg CaraBus listing approved!');
    process.exit(0);
}

approveCaraBus().catch(err => {
    console.error(err);
    process.exit(1);
});

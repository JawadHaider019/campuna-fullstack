import pool from '../config/database.js';

async function updateCaraBus() {
    try {
        const id = 'b19bb39f-359f-4fb3-975f-480a9ff55dcb';
        const res = await pool.query(
            `UPDATE listings 
             SET status = 'REJECTED', updated_at = NOW() 
             WHERE id = $1 OR title ILIKE '%CaraBus%' 
             RETURNING id, title, status`,
            [id]
        );
        console.log('Updated listings:', res.rows);

        for (const row of res.rows) {
            await pool.query(
                `INSERT INTO listing_moderation (
                    id, listing_id, ai_score, ai_decision, confidence_score,
                    text_score, image_score, price_score, fraud_risk_score,
                    ai_reasons, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, 10, 'AUTO_REJECTED', 0.95,
                    10, 85, 10, 95,
                    $2::jsonb, 'REJECTED', NOW(), NOW()
                ) ON CONFLICT (listing_id) DO UPDATE SET
                    ai_score = 10,
                    ai_decision = 'AUTO_REJECTED',
                    status = 'REJECTED',
                    ai_reasons = $2::jsonb,
                    fraud_risk_score = 95,
                    updated_at = NOW()`,
                [
                    row.id,
                    JSON.stringify(['Die Beschreibung enthält nur randomisierte Zeichen (Zeichensalat) und einen extremen Preisausreißer (3.980.000 €).'])
                ]
            );
        }
        console.log('✅ Moderation records successfully updated.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

updateCaraBus();

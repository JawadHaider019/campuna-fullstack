import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';

async function inspectAndEvaluate() {
    try {
        const res = await pool.query(`
            SELECT l.id, l.title, l.price, l.status, l.location, l.category, l.description,
                   m.ai_score, m.ai_reasons, m.status as mod_status
            FROM listings l
            LEFT JOIN listing_moderation m ON l.id = m.listing_id
            WHERE l.id IN ('021b737e-10c0-41e2-9c3e-1b72993f32b2', 'b19bb39f-359f-4fb3-975f-480a9ff55dcb')
        `);

        console.log('Current DB state for both listings:');
        for (const row of res.rows) {
            console.log('\n--- Listing:', row.id, '---');
            console.log('Title:', row.title);
            console.log('Price:', row.price, '€');
            console.log('Status in listings table:', row.status);
            console.log('Location:', row.location);
            console.log('Description (first 80 chars):', row.description?.slice(0, 80));

            // Run fresh AI moderation evaluation on each listing
            const aiRes = await moderateListingAI({
                title: row.title,
                description: row.description,
                price: row.price,
                location: row.location,
                category: row.category
            });

            console.log('Fresh AI Evaluation Result:');
            console.log('  Safe:', aiRes.safe);
            console.log('  Score:', aiRes.score);
            console.log('  Listing Status:', aiRes.listing_status);
            console.log('  AI Decision:', aiRes.ai_decision);
            console.log('  Reason:', aiRes.reason);

            // Update database with the accurate reason & status for this specific listing
            await pool.query(`
                UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2
            `, [aiRes.listing_status, row.id]);

            await pool.query(`
                INSERT INTO listing_moderation (
                    id, listing_id, ai_score, ai_decision, confidence_score,
                    text_score, image_score, price_score, fraud_risk_score,
                    ai_reasons, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1::uuid, $2, $3, 0.95,
                    $2, 85, 85, 10,
                    $4::jsonb, $5, NOW(), NOW()
                ) ON CONFLICT (listing_id) DO UPDATE SET
                    ai_score = $2,
                    ai_decision = $3,
                    status = $5,
                    ai_reasons = $4::jsonb,
                    updated_at = NOW()
            `, [row.id, aiRes.score, aiRes.ai_decision, JSON.stringify([aiRes.reason]), aiRes.listing_status]);
        }

        console.log('\n✅ Successfully re-evaluated and stored accurate reasons for each listing.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectAndEvaluate();

import 'dotenv/config';
import pool from './database.js';

/**
 * Initializes listing_moderation table and seeds AI simulation scores for existing listings.
 */
export async function initModerationTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS listing_moderation (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
                ai_score INTEGER DEFAULT 50,
                ai_decision VARCHAR(50) DEFAULT 'MANUAL_REVIEW',
                confidence_score NUMERIC(5,2) DEFAULT 0.50,
                text_score INTEGER DEFAULT 50,
                image_score INTEGER DEFAULT 50,
                price_score INTEGER DEFAULT 50,
                fraud_risk_score INTEGER DEFAULT 15,
                ai_reasons JSONB DEFAULT '[]'::jsonb,
                status VARCHAR(50) DEFAULT 'PENDING',
                admin_notes TEXT,
                reviewed_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✅ listing_moderation table verified in PostgreSQL');

        // Check and populate initial simulation entries for listings that don't have a moderation entry yet
        const listings = await pool.query('SELECT id, title, price, status, category FROM listings');

        for (const l of listings.rows) {
            const existing = await pool.query('SELECT id FROM listing_moderation WHERE listing_id = $1', [l.id]);
            if (existing.rows.length === 0) {
                // If listing is currently REVIEW, give it the target Score = 50 (Needs Manual Decision)
                // If listing is APPROVED, give it Score = 88 (Auto Approved)
                const isReview = l.status === 'REVIEW';
                const aiScore = isReview ? 50 : 88;
                const aiDecision = isReview ? 'MANUAL_REVIEW' : 'AUTO_APPROVED';
                const textScore = isReview ? 55 : 92;
                const imageScore = isReview ? 48 : 86;
                const priceScore = isReview ? 50 : 90;
                const fraudRisk = isReview ? 35 : 5;
                const reasons = isReview ? [
                    'Score 50: Borderline-Einstufung – Bildqualität & Preisstruktur uneindeutig',
                    'Textlänge ausreichend, aber unvollständige Fahrzeugmerkmale',
                    'Manuelle Überprüfung durch Administrator erforderlich'
                ] : [
                    'Hohe Textqualität & Plausibilität (92/100)',
                    'Bilder geprüft: Keine Duplikate oder anstößigen Inhalte (86/100)',
                    'Preis entspricht Marktdurchschnitt (90/100)'
                ];

                await pool.query(`
                    INSERT INTO listing_moderation (
                        listing_id, ai_score, ai_decision, confidence_score,
                        text_score, image_score, price_score, fraud_risk_score,
                        ai_reasons, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    l.id,
                    aiScore,
                    aiDecision,
                    isReview ? 0.50 : 0.94,
                    textScore,
                    imageScore,
                    priceScore,
                    fraudRisk,
                    JSON.stringify(reasons),
                    isReview ? 'PENDING' : 'AUTO_RESOLVED'
                ]);
            }
        }
        console.log('✅ Initial AI moderation simulation data seeded');

    } catch (err) {
        console.error('⚠️ initModerationTable notice:', err.message);
    }
}

// Auto-run if executed directly
if (process.argv[1]?.includes('initModerationTable.js')) {
    initModerationTable().then(() => process.exit(0)).catch(() => process.exit(1));
}

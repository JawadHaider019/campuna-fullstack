import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function createTestListings() {
    try {
        // 1. Get a non-admin user
        const userRes = await pool.query("SELECT id, email FROM users WHERE role = 'USER' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error('No regular user found. Please check database.');
            process.exit(1);
        }
        const testUser = userRes.rows[0];
        console.log('Using User for test listings:', testUser.email);

        const testCases = [
            {
                type: 'SAFE (Legitimate Camping -> Score > 60)',
                title: 'Outwell Familienzelt 4 Personen Nevada 4PE',
                category: 'Zelte',
                subcategory: 'Familienzelte',
                price: 380,
                location: 'Hamburg',
                description: 'Verkaufen unser sehr gepflegtes Outwell Familienzelt für 4 Personen. Vollständig wasserdicht mit 6000mm Wassersäule, inkl. Packtasche und Heringen.'
            },
            {
                type: 'PROHIBITED (Weapons / Dangerous -> Score < 40)',
                title: 'Taktisches Militär Kampfmesser und 9mm Pistole',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 250,
                location: 'Frankfurt',
                description: 'Verkaufe scharfes Kampfmesser und Pistole ohne Erlaubnis. Barzahlung bei Übergabe.'
            },
            {
                type: 'BORDERLINE / VAGUE (Score 40-60 -> Flag for Admin)',
                title: 'Karton mit Kellerfund Zubehörteilen',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 20,
                location: 'Dresden',
                description: 'Kiste aus Kellerfund. Vielleicht Campingteile dabei oder auch nicht. Keine Ahnung ob es noch geht. Ungeprüft an Selbstabholer.'
            }
        ];

        for (const tc of testCases) {
            console.log('\n========================================');
            console.log('Creating Test Listing:', tc.type);
            console.log('Title:', tc.title);
            
            // Run AI Moderation
            const aiResult = await moderateListingAI(tc);
            console.log('AI Decision:', aiResult.ai_decision);
            console.log('AI Score:', aiResult.score, '/ 100');
            console.log('Listing Status:', aiResult.listing_status);
            console.log('Reason:', aiResult.reason);
            console.log('Violations:', aiResult.violations);

            const listingId = crypto.randomUUID();
            const slug = tc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + listingId.slice(0, 8);

            // Insert listing
            await pool.query(
                `INSERT INTO listings (
                    id, user_id, title, slug, description, price, negotiable, location,
                    condition, category, subcategory, status, featured, images, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, 'Gebraucht', $8, $9, $10, false, ARRAY[]::text[], NOW(), NOW())`,
                [
                    listingId,
                    testUser.id,
                    tc.title,
                    slug,
                    tc.description,
                    tc.price,
                    tc.location,
                    tc.category,
                    tc.subcategory,
                    aiResult.listing_status
                ]
            );

            // Insert listing_moderation
            await pool.query(
                `INSERT INTO listing_moderation (
                    id, listing_id, ai_score, ai_decision, confidence_score,
                    text_score, image_score, price_score, fraud_risk_score,
                    ai_reasons, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, NOW(), NOW())`,
                [
                    crypto.randomUUID(),
                    listingId,
                    aiResult.score,
                    aiResult.ai_decision,
                    aiResult.confidence_score || 0.95,
                    aiResult.text_score || aiResult.score,
                    85,
                    aiResult.price_score || 85,
                    aiResult.fraud_risk_score || 10,
                    JSON.stringify([aiResult.reason]),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : 'PENDING'
                ]
            );

            console.log(`✅ Saved: Listing ID = ${listingId}`);
        }

        console.log('\n🎉 All 3 listings successfully created and evaluated by AI!');
        process.exit(0);
    } catch (err) {
        console.error('Error in createTestListings:', err);
        process.exit(1);
    }
}

createTestListings();

import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function testNamedProducts() {
    try {
        const userRes = await pool.query("SELECT id, email FROM users WHERE role = 'USER' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error('No regular user found.');
            process.exit(1);
        }
        const testUser = userRes.rows[0];
        console.log('Using User for testing:', testUser.email);

        const testItems = [
            {
                category_test: 'ADULT TOY BRAND BY REAL NAME (Without saying 18+)',
                title: 'Satisfyer Pro 2 Next Generation Vibrator Neu & OVP',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 35,
                location: 'Köln',
                description: 'Verkaufe originalverpackten Satisfyer Pro 2 mit Druckwellen-Technologie und Akku. Unbenutzt in Folie.'
            },
            {
                category_test: 'ADULT NOVELTY BRAND BY REAL NAME (Without saying 18+)',
                title: 'Womanizer Premium Eco Pleasure Air Masturbator',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 80,
                location: 'Stuttgart',
                description: 'Hochwertiges Womanizer Pleasure Air Gerät mit Smart Silence Funktion, inklusive Ladekabel und Aufbewahrungsbeutel.'
            },
            {
                category_test: 'LEGITIMATE CAMPING GEAR BY REAL BRAND NAME',
                title: 'Petromax Feuertopf ft6 Dutch Oven aus Gusseisen',
                category: 'Zubehör',
                subcategory: 'Campingküche',
                price: 75,
                location: 'Nürnberg',
                description: 'Original Petromax Feuertopf ft6 mit Planboden. Eingebrannt und sofort einsatzbereit für Lagerfeuer und Gasgrill.'
            }
        ];

        for (const item of testItems) {
            console.log('\n==================================================');
            console.log('Test Scenario:', item.category_test);
            console.log('Title:', item.title);

            const aiResult = await moderateListingAI(item);
            console.log('-> AI Decision:', aiResult.ai_decision);
            console.log('-> AI Score:', aiResult.score, '/ 100');
            console.log('-> Listing Status:', aiResult.listing_status);
            console.log('-> Reason:', aiResult.reason);
            console.log('-> Violations:', aiResult.violations);

            const listingId = crypto.randomUUID();
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + listingId.slice(0, 8);

            await pool.query(
                `INSERT INTO listings (
                    id, user_id, title, slug, description, price, negotiable, location,
                    condition, category, subcategory, status, featured, images, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, 'Neu', $8, $9, $10, false, ARRAY[]::text[], NOW(), NOW())`,
                [
                    listingId,
                    testUser.id,
                    item.title,
                    slug,
                    item.description,
                    item.price,
                    item.location,
                    item.category,
                    item.subcategory,
                    aiResult.listing_status
                ]
            );

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
                    aiResult.score > 60 ? 90 : 20,
                    aiResult.price_score || 85,
                    aiResult.fraud_risk_score || 10,
                    JSON.stringify([aiResult.reason]),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : 'PENDING'
                ]
            );

            console.log(`✅ Saved: Listing ID = ${listingId}`);
        }

        console.log('\n🎉 Real product brand recognition test completed!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testNamedProducts();

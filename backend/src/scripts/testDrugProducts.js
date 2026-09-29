import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function testDrugAndNarcoticProducts() {
    try {
        const userRes = await pool.query("SELECT id, email FROM users WHERE role = 'USER' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error('No user found in database.');
            process.exit(1);
        }
        const testUser = userRes.rows[0];
        console.log('Using User for testing:', testUser.email);

        const testItems = [
            {
                test_label: 'SUBSTANCE / NARCOTICS BRAND BY NAME (Cocaine slang / MDMA)',
                title: 'Reines Kokain Flakes & Ecstasy Pillen Punisher',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 180,
                location: 'Berlin',
                description: 'Verkaufe reine Kolumbien Flakes und Blue Punisher Pillen für Party am Campingplatz. Schnelle Übergabe.'
            },
            {
                test_label: 'PRESCRIPTION OPIOID / DRUG (Oxycodon / Tilidin)',
                title: 'Oxycodon 80mg & Tilidin Tropfen Schmerzmittel',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 90,
                location: 'Hamburg',
                description: 'Originalverpackte Blister Oxycodon 80mg und Tilidin Tropfen ohne Rezept abzugeben für die Reiseapotheke.'
            },
            {
                test_label: 'LEGITIMATE FIRST AID CAMPING KIT (Safe Medical Gear)',
                title: 'Care Plus Erste-Hilfe-Set Waterproof Camping Notfallset',
                category: 'Zubehör',
                subcategory: 'Sicherheit',
                price: 39,
                location: 'München',
                description: 'Wasserdichtes Care Plus Erste-Hilfe-Set mit Verbandsmaterial, Blasenpflaster, Rettungsdecke und Zeckenzange für Outdoor-Touren.'
            }
        ];

        for (const item of testItems) {
            console.log('\n==================================================');
            console.log('Scenario:', item.test_label);
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
                    aiResult.score > 60 ? 90 : 15,
                    aiResult.price_score || 85,
                    aiResult.fraud_risk_score || 10,
                    JSON.stringify([aiResult.reason]),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : 'PENDING'
                ]
            );

            console.log(`✅ Saved in DB: Listing ID = ${listingId}`);
        }

        console.log('\n🎉 Drug & Narcotics test completed!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testDrugAndNarcoticProducts();

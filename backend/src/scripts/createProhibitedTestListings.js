import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function createProhibitedAndAdultTestListings() {
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
                type: '18+ ADULT / NSFW ITEM',
                title: 'Erotisches 18+ Zubehör für Campingurlaub zu zweit',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 45,
                location: 'Berlin',
                description: 'Verkaufe unbenutztes 18+ Erotikspielzeug und Adult-Accessoires für aufregende Nächte im Wohnmobil. Nur an Volljährige ab 18 Jahren.'
            },
            {
                type: 'ILLEGAL DRUGS / NARCOTICS',
                title: 'Cannabis Gras & THC Vapes für Festival Camping',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 120,
                location: 'Frankfurt',
                description: 'Biete potente THC Buds und Vapes für Festival-Camper. Schneller Versand im diskreten Päckchen oder Barzahlung vor Ort.'
            },
            {
                type: 'ILLEGAL WEAPON / EXPLOSIVES',
                title: 'Glock 17 Schusswaffe & Polenböller Feuerwerk',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 500,
                location: 'Dortmund',
                description: 'Verkaufe Pistole mit Munition und extrem laute illegale Polenböller ohne Zulassung für Camping-Selbstschutz.'
            }
        ];

        for (const tc of testCases) {
            console.log('\n========================================');
            console.log('Testing Category:', tc.type);
            console.log('Title:', tc.title);
            
            // Run AI Moderation
            const aiResult = await moderateListingAI(tc);
            console.log('-> AI Decision:', aiResult.ai_decision);
            console.log('-> AI Score:', aiResult.score, '/ 100');
            console.log('-> Listing Status:', aiResult.listing_status);
            console.log('-> Reason:', aiResult.reason);
            console.log('-> Violations Detected:', aiResult.violations);

            const listingId = crypto.randomUUID();
            const slug = tc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + listingId.slice(0, 8);

            // Insert listing
            await pool.query(
                `INSERT INTO listings (
                    id, user_id, title, slug, description, price, negotiable, location,
                    condition, category, subcategory, status, featured, images, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, 'Neu', $8, $9, $10, false, ARRAY[]::text[], NOW(), NOW())`,
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
                    20,
                    aiResult.price_score || 20,
                    aiResult.fraud_risk_score || 90,
                    JSON.stringify([aiResult.reason]),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : 'PENDING'
                ]
            );

            console.log(`✅ Saved in DB: Listing ID = ${listingId}`);
        }

        console.log('\n🎉 All 18+ and illegal test listings successfully processed!');
        process.exit(0);
    } catch (err) {
        console.error('Error in createProhibitedAndAdultTestListings:', err);
        process.exit(1);
    }
}

createProhibitedAndAdultTestListings();

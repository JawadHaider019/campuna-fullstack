import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function testTenProducts() {
    try {
        const userRes = await pool.query("SELECT id, email FROM users WHERE role = 'USER' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error('No regular user found.');
            process.exit(1);
        }
        const testUser = userRes.rows[0];
        console.log('Testing with User:', testUser.email);

        const testItems = [
            // 1. Legitimate High-End Camping Product
            {
                expected: 'AUTO_APPROVED (Safe Camping Gear)',
                title: 'Dometic CFX3 45 Kompressor-Kühlbox 46L 12V/230V',
                category: 'Zubehör',
                subcategory: 'Kühlen & Heizen',
                price: 749,
                location: 'München',
                description: 'Verkaufe neuwertige Dometic CFX3 45 Liter tragbare Kompressorkühlbox mit App-Steuerung, WiFi und Bluetooth. Perfekt für Wohnmobil und Camping.'
            },
            // 2. Legitimate Family Camping Tent
            {
                expected: 'AUTO_APPROVED (Safe Camping Gear)',
                title: 'Outwell Nevada 5P 5-Personen Familien-Campingzelt',
                category: 'Zelte',
                subcategory: 'Familienzelte',
                price: 490,
                location: 'Hamburg',
                description: 'Geräumiges Tunnelzelt für 5 Personen mit Quick & Quiet Türen, getöntem Panoramafenster und dunklen Schlafkabinen. Nur 2 Urlaube genutzt.'
            },
            // 3. Legitimate Caravan/Camper Van
            {
                expected: 'AUTO_APPROVED (Safe Vehicle)',
                title: 'Pössl 2Win Plus Citroën Jumper 160 PS L2H2 Wohnmobil',
                category: 'Wohnmobile',
                subcategory: 'Kastenwagen',
                price: 48500,
                location: 'Dresden',
                description: 'Pössl Kastenwagen Baujahr 2021 mit Anhängerkupplung, Markise, Solaranlage 150W, Navigation und Rückfahrkamera. TÜV neu bis 05/2027.'
            },
            // 4. Legitimate Camping Accessory
            {
                expected: 'AUTO_APPROVED (Safe Camping Gear)',
                title: 'Helinox Chair One ultraleichter Faltstuhl schwarz',
                category: 'Zubehör',
                subcategory: 'Campingmöbel',
                price: 85,
                location: 'Freiburg',
                description: 'Ultraleichter Campingstuhl von Helinox, Gewicht unter 1kg, Packmaß sehr kompakt. Ideal für Rucksackreisen und Campingbusse.'
            },
            // 5. Prohibited: Weapon / Self-defense item
            {
                expected: 'AUTO_REJECTED (Weapons & Defense)',
                title: 'Walther PPQ M2 T4E RAM CO2 Pistole Cal .43 Selbstschutz & Paintball',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 180,
                location: 'Frankfurt',
                description: 'Verkaufe Walther PPQ M2 Magfed CO2 Waffe mit 8-Schuss Magazin und Hartgummigeschossen für Heimverteidigung und Zielschießen.'
            },
            // 6. Prohibited: Drugs / Narcotics
            {
                expected: 'AUTO_REJECTED (Drugs / Illicit Substances)',
                title: 'Cali Weed Gelato 41 10g Premium Cannabis Blüten THC',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 110,
                location: 'Berlin',
                description: '10g Cali Strain importiert, starkes Aroma, diskreter Versand per Einschreiben. Höchste Qualität.'
            },
            // 7. Prohibited: Adult Brand / Sex Toy
            {
                expected: 'AUTO_REJECTED (Adult Toy / Erotic Content)',
                title: 'Lelo Smart Wand 2 Large Massage & Body Vibrator OVP',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 120,
                location: 'Düsseldorf',
                description: 'Lelo Ganzkörper-Massagegerät mit wiederaufladbarem Akku und 10 Vibrationsmustern. 100% wasserdicht und unbenutzt.'
            },
            // 8. Borderline / Low Quality / Suspicious Pricing (Manual Review candidate)
            {
                expected: 'MANUAL_REVIEW or REJECTED (Suspicious / Incomplete)',
                title: 'Wohnmobil günstig zu verkaufen',
                category: 'Wohnmobile',
                subcategory: 'Integrierte',
                price: 10,
                location: 'Berlin',
                description: 'Auto steht gut da, bitte nur per WhatsApp +49151234567 kontaktieren kein Anruf.'
            },
            // 9. Legitimate Camping Tech / Solar
            {
                expected: 'AUTO_APPROVED (Safe Camping Solar Gear)',
                title: 'EcoFlow Delta 2 Powerstation 1024Wh mit 220W Solarpanel',
                category: 'Zubehör',
                subcategory: 'Elektronik & Solar',
                price: 899,
                location: 'Nürnberg',
                description: 'EcoFlow Delta 2 tragbare Powerstation mit LFP-Batterie und faltbarem 220W bifazialem Solarmodul. Inklusive aller Originalkabel.'
            },
            // 10. Prohibited: Replica / Fake Luxury
            {
                expected: 'AUTO_REJECTED or MANUAL_REVIEW (Counterfeit / Replica)',
                title: 'Replica Rolex Submariner Date 1:1 Klon Automatic Uhr',
                category: 'Zubehör',
                subcategory: 'Sonstiges',
                price: 350,
                location: 'Leipzig',
                description: 'Hochwertige 1:1 Kopie Rolex Taucheruhr mit Schweizer Automatikwerk Klon, Saphirglas und Keramiklünette.'
            }
        ];

        const summaryResults = [];

        for (let i = 0; i < testItems.length; i++) {
            const item = testItems[i];
            console.log(`\n================== [Product ${i + 1} of 10] ==================`);
            console.log(`📌 Title: "${item.title}"`);
            console.log(`🎯 Expected: ${item.expected}`);
            console.log(`💶 Price: €${item.price} | Category: ${item.category} > ${item.subcategory}`);

            const aiResult = await moderateListingAI(item);
            console.log(`🤖 AI Decision: [${aiResult.ai_decision}]`);
            console.log(`📊 AI Score: ${aiResult.score} / 100`);
            console.log(`🚦 Listing Status: ${aiResult.listing_status}`);
            console.log(`💬 Reason: ${aiResult.reason}`);

            const listingId = crypto.randomUUID();
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + listingId.slice(0, 8);

            await pool.query(
                `INSERT INTO listings (
                    id, user_id, title, slug, description, price, negotiable, location,
                    condition, category, subcategory, status, featured, images, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, 'Gebraucht', $8, $9, $10, false, ARRAY[]::text[], NOW(), NOW())`,
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
                    aiResult.fraud_risk_score || (aiResult.score > 60 ? 5 : 85),
                    JSON.stringify([aiResult.reason]),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : 'PENDING'
                ]
            );

            summaryResults.push({
                index: i + 1,
                title: item.title,
                decision: aiResult.ai_decision,
                status: aiResult.listing_status,
                score: aiResult.score,
                reason: aiResult.reason,
                expected: item.expected
            });
        }

        console.log('\n\n========================================================================================');
        console.log('                          📊 FINAL TEST RESULTS SUMMARY (10 PRODUCTS)');
        console.log('========================================================================================');
        console.table(summaryResults.map(r => ({
            '#': r.index,
            'Product Title': r.title.length > 35 ? r.title.slice(0, 32) + '...' : r.title,
            'Score': `${r.score}/100`,
            'AI Decision': r.decision,
            'Status': r.status,
            'Expected': r.expected.slice(0, 25)
        })));

        process.exit(0);
    } catch (err) {
        console.error('Error running 10 test products:', err);
        process.exit(1);
    }
}

testTenProducts();

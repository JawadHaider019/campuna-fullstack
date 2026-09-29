import pool from '../config/database.js';
import { moderateListingAI } from '../services/aiService.js';
import crypto from 'crypto';

async function createTenTestListings() {
    console.log('🚀 Generating 10 Test Listings & Running AI Moderation Engine...\n');

    try {
        // 1. Get or create a test user
        let userRes = await pool.query("SELECT id, email FROM users WHERE role = 'USER' LIMIT 1");
        let testUser;
        if (userRes.rows.length === 0) {
            const newUserId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO users (id, email, password_hash, role, user_type, email_verified, created_at, updated_at)
                 VALUES ($1, 'tester_ai@campuna.de', 'hash_test', 'USER', 'PRIVATE', true, NOW(), NOW())`,
                [newUserId]
            );
            testUser = { id: newUserId, email: 'tester_ai@campuna.de' };
        } else {
            testUser = userRes.rows[0];
        }

        console.log(`👤 Using Seller User: ${testUser.email} (${testUser.id})\n`);

        const testListings = [
            // 1. SAFE - Premium Campervan
            {
                expected: 'APPROVED (Safe)',
                title: 'VW T6.1 California Ocean 4Motion DSG Automatik',
                category: 'Wohnmobile & Camper',
                subcategory: 'Kastenwagen & Campervans',
                price: 68500,
                location: 'München',
                description: 'Verkaufen unseren wunderschönen VW California Ocean T6.1 mit 199 PS, Allradantrieb, Aufstelldach mit Komfortbett, Standheizung, Markise, integrierter Küchenzeile und Kühlschrank. Scheckheftgepflegt, Nichtraucherfahrzeug, sofort reisebereit für den nächsten Campingurlaub.'
            },
            // 2. SAFE - Family Tent
            {
                expected: 'APPROVED (Safe)',
                title: 'Outwell Nevada 5PE Familienzelt 5 Personen',
                category: 'Zelte',
                subcategory: 'Familienzelte',
                price: 499,
                location: 'Köln',
                description: 'Großzügiges 5-Personen Tunnelzelt mit abgedunkelten Schlafkabinen (Premier Bedrooms), Quick & Quiet Mesh-Innentüren und 6000 mm Wassersäule. Nur zwei Saisons im Sommerurlaub genutzt, absolut dicht, sauber und trocken gelagert. Inklusive Bodenplane und robuster Heringe.'
            },
            // 3. SAFE - Camping Kitchen & Cooker
            {
                expected: 'APPROVED (Safe)',
                title: 'Campingaz 2-Flammen Gaskocher Bistro & Faltbare Campingküche',
                category: 'Campingzubehör',
                subcategory: 'Kochen & Grillen',
                price: 95,
                location: 'Nürnberg',
                description: 'Kompakter Campingaz 2-Flammen-Kocher mit Piezozündung plus passendem Berger Campingküchen-Schrank mit Windschutz und Alurahmen. Voll funktionsfähig, ideal für Wohnwagen-Vorzelte oder Zelturlaub.'
            },
            // 4. SAFE - Portable Power Station
            {
                expected: 'APPROVED (Safe)',
                title: 'EcoFlow Delta 2 Powerstation 1024Wh Solargenerator',
                category: 'Campingzubehör',
                subcategory: 'Elektronik & Solar',
                price: 750,
                location: 'Stuttgart',
                description: 'Verkaufe tragbare Powerstation EcoFlow Delta 2 mit LiFePO4-Akku (3000+ Ladezyklen). 1800W Dauerleistung, ideal für Autark-Camping, Kompressorkühlbox und Kaffeemaschine. Zustand wie neu mit Originalkarton und 12V Ladekabel.'
            },
            // 5. PROHIBITED - Weapons / Combat Gear
            {
                expected: 'REJECTED (Weapons violation)',
                title: 'Taktisches Militär Kampfmesser 25cm & Glock 17 Pistole 9mm',
                category: 'Campingzubehör',
                subcategory: 'Sonstiges',
                price: 450,
                location: 'Frankfurt am Main',
                description: 'Verkaufe scharfes Jagd- und Kampfmesser mit Kydexscheide und Glock 17 Selbstladepistole inklusive 2 Magazinen und Munition. Nur Barzahlung bei heimlicher Übergabe.'
            },
            // 6. PROHIBITED - Illegal Drugs / Narcotics
            {
                expected: 'REJECTED (Drugs violation)',
                title: 'Cali Gras Weed Cannabis Buds & MDMA Partydrogen für Festival Camping',
                category: 'Campingzubehör',
                subcategory: 'Sonstiges',
                price: 120,
                location: 'Berlin',
                description: 'Habe noch 20g feinstes Cali Weed / Marihuana und Ecstasy Pillen übrig vom Campingurlaub. Schneller diskreter Postversand oder Abholung am Bahnhof.'
            },
            // 7. PROHIBITED - Adult / NSFW / 18+
            {
                expected: 'REJECTED (Adult / 18+ violation)',
                title: 'Erotik DVD Sammlung & 18+ Sexspielzeug für Paare im Wohnmobil',
                category: 'Campingzubehör',
                subcategory: 'Sonstiges',
                price: 60,
                location: 'Dortmund',
                description: 'Verkaufen diverse gebrauchte 18+ Erotikfilme, Hardcore Pornos und Erotikartikel aus dem Camper. Nur für Erwachsene ab 18 Jahren.'
            },
            // 8. BORDERLINE / VAGUE - Suspicious vague bundle
            {
                expected: 'FLAGGED / PENDING (Vague / Low Quality)',
                title: 'Kiste voller Zeug Kellerfund keine Garantie',
                category: 'Campingzubehör',
                subcategory: 'Sonstiges',
                price: 25,
                location: 'Leipzig',
                description: 'Karton aus Kellerauflösung. Vielleicht irgendwas für Zelt oder Garten drin oder Schrott. Keine Ahnung ob es funktioniert. Nur Abholung.'
            },
            // 9. SAFE - Caravan / Wohnwagen
            {
                expected: 'APPROVED (Safe)',
                title: 'Knaus Sport 500 EU Wohnwagen mit Mover und Vorzelt',
                category: 'Wohnwagen',
                subcategory: 'Familienwohnwagen',
                price: 18900,
                location: 'Hannover',
                description: 'Sehr gepflegter Knaus Sport 500 EU mit 2 Einzelbetten (umbaubar zur großen Liegewiese), Rundsitzgruppe, Truma Therme, Mover für leichtes Rangieren und DWT Ganzjahres-Vorzelt. TÜV und Gasprüfung neu bis 05/2026, 100 km/h Zulassung.'
            },
            // 10. SAFE - Roof Tent / Dachzelt
            {
                expected: 'APPROVED (Safe)',
                title: 'iKamper Skycamp 3.0 4X Hartschalen-Dachzelt',
                category: 'Dachzelte',
                subcategory: 'Hartschalen-Dachzelte',
                price: 3400,
                location: 'Freiburg',
                description: 'Original iKamper Skycamp 3.0 Dachzelt in schwarz glänzend. Platz für bis zu 4 Personen, Aufbau in unter 1 Minute durch Gasdruckfedern. Inklusive Komfortmatratze, Teleskopleiter und Sturmsicherung.'
            }
        ];

        const resultsSummary = [];

        for (let i = 0; i < testListings.length; i++) {
            const item = testListings[i];
            const num = i + 1;
            console.log(`--------------------------------------------------------------------------------`);
            console.log(`[${num}/10] Testing: "${item.title}"`);
            console.log(`       Category: ${item.category} | Price: ${item.price} € | Expectation: ${item.expected}`);

            // 1. Run AI Moderation Service
            const aiStart = Date.now();
            const aiResult = await moderateListingAI(item);
            const durationMs = Date.now() - aiStart;

            console.log(`       🤖 AI Verdict: Status = [${aiResult.listing_status}] | Decision = [${aiResult.ai_decision}] | Score = ${aiResult.score}/100 (${durationMs}ms)`);
            console.log(`       💬 AI Reason: ${aiResult.reason || 'Keine Beanstandung'}`);
            if (aiResult.violations && aiResult.violations.length > 0) {
                console.log(`       ⚠️ Violations: ${JSON.stringify(aiResult.violations)}`);
            }

            // 2. Insert into database (listings table)
            const listingId = crypto.randomUUID();
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + listingId.slice(0, 6);

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

            // 3. Insert into listing_moderation ledger
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
                    aiResult.fraud_risk_score || (aiResult.score < 40 ? 90 : 10),
                    JSON.stringify([aiResult.reason || 'Automatische KI-Prüfung']),
                    aiResult.listing_status === 'APPROVED' ? 'APPROVED' : (aiResult.listing_status === 'REJECTED' ? 'REJECTED' : 'PENDING')
                ]
            );

            resultsSummary.push({
                num,
                title: item.title,
                category: item.category,
                price: `${item.price} €`,
                expected: item.expected,
                aiStatus: aiResult.listing_status,
                aiScore: aiResult.score,
                decision: aiResult.ai_decision,
                reason: aiResult.reason,
                violations: (aiResult.violations || []).join(', ') || 'None',
                id: listingId
            });
        }

        console.log(`\n================================================================================`);
        console.log(`📊 AI MODERATION RESULTS OVERVIEW (10 LISTINGS CREATED)`);
        console.log(`================================================================================`);
        console.table(resultsSummary.map(r => ({
            '#': r.num,
            'Title': r.title.length > 35 ? r.title.slice(0, 32) + '...' : r.title,
            'Price': r.price,
            'Status': r.aiStatus,
            'Score': `${r.aiScore}/100`,
            'Decision': r.decision,
            'Violations': r.violations
        })));

        console.log('\n✅ All 10 listings have been evaluated by AI & stored in PostgreSQL database with full moderation audit records!');

    } catch (err) {
        console.error('❌ Error creating test listings:', err);
    } finally {
        await pool.end();
    }
}

createTenTestListings();

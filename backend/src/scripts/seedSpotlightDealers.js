import pool from '../config/database.js';
import crypto from 'crypto';

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

async function seedSpotlightDealers() {
    try {
        console.log('🚀 Starting Spotlight Dealers DB enrichment...');

        // 1. Find test user IDs
        const testUsersRes = await pool.query(`
            SELECT id FROM users 
            WHERE email LIKE 'test-%@campuna-test.de' 
               OR email LIKE 'test-4c3ea3c0%' 
               OR email LIKE 'test-333bfdd0%'
               OR email LIKE 'test-cf5df4bf%'
               OR email LIKE 'test-ef86e34f%'
               OR email LIKE 'test-56f39aa5%'
               OR email LIKE 'test-63abbba1%'
               OR email LIKE 'test-55e1a742%'
               OR email LIKE 'test-2bfa05e9%'
               OR email LIKE 'test-8054d0ef%'
        `);

        const testIds = testUsersRes.rows.map(r => r.id);

        if (testIds.length > 0) {
            console.log(`Found ${testIds.length} test accounts to clean up.`);
            await pool.query('DELETE FROM credit_transactions WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM listing_moderation WHERE listing_id IN (SELECT id FROM listings WHERE user_id = ANY($1::uuid[]))', [testIds]);
            await pool.query('DELETE FROM listings WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM subscriptions WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM user_achievements WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM company_profiles WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM private_profiles WHERE user_id = ANY($1::uuid[])', [testIds]);
            await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [testIds]);
            console.log(`🧹 Cleaned up ${testIds.length} automated test accounts and their relations.`);
        }

        // 2. Define top German commercial dealers
        const dealers = [
            {
                email: 'caravan-bayern@campuna.de',
                company_name: 'Caravan Center Bayern GmbH',
                logo_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=1200&q=80',
                bio: 'Offizieller Vertragshändler für Hymer, Dethleffs und Pössl im Großraum München. Über 25 Jahre Erfahrung in Verkauf, Meisterwerkstatt und Camping-Zubehör.',
                location: 'München, Bayern',
                company_address: 'Wasserburger Landstraße 140, 81827 München',
                phone: '+49 89 4523910',
                website_url: 'https://caravan-center-bayern.de',
            },
            {
                email: 'alpencamper@campuna.de',
                company_name: 'AlpenCamper Allgäu',
                logo_url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
                bio: 'Spezialist für allradgetriebene 4x4 Offroad-Campervans, Expeditionsmobile und maßgeschneiderte Campingausbauten im Allgäu.',
                location: 'Kempten, Allgäu',
                company_address: 'Allgäuer Straße 88, 87435 Kempten',
                phone: '+49 831 960240',
                website_url: 'https://alpencamper-allgaeu.de',
            },
            {
                email: 'kontakt@camper-nrw.de',
                company_name: 'Camper Manufaktur NRW',
                logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
                bio: 'Individuelle Van-Ausbauten, Nachrüstung von Solaranlagen, Standheizungen & LiFePO4-Batteriesystemen für höchste Autarkie.',
                location: 'Köln, NRW',
                company_address: 'Oskar-Jäger-Straße 170, 50825 Köln',
                phone: '+49 221 890456',
                website_url: 'https://camper-manufaktur-nrw.de',
            },
            {
                email: 'info@campingwelt-nord.de',
                company_name: 'Campingwelt Nord GmbH',
                logo_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
                bio: 'Dein Vertragspartner für Wohnwagen, Vorzelte & Campingzubehör an der Nordseeküste. Fachberatung und Meister-Werkstattservice.',
                location: 'Husum, Schleswig-Holstein',
                company_address: 'Industriestraße 12, 25813 Husum',
                phone: '+49 4841 77230',
                website_url: 'https://campingwelt-nord.de',
            },
            {
                email: 'info@schwarzwald-reisemobile.de',
                company_name: 'Schwarzwald Reisemobile GmbH',
                logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
                bio: 'Große Auswahl an neuen und jungen gebrauchten Reisemobilen führender deutscher Hersteller. Meisterwerkstatt & Dichtigkeitsprüfungen.',
                location: 'Freiburg im Breisgau',
                company_address: 'Bötzinger Straße 24, 79111 Freiburg',
                phone: '+49 761 458920',
                website_url: 'https://schwarzwald-reisemobile.de',
            },
            {
                email: 'kontakt@berlin-vanlife.de',
                company_name: 'Berlin Vanlife & Caravaning',
                logo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
                cover_image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
                bio: 'Dein moderner Ansprechpartner für urbane Camper, Kastenwagen und innovative Camping-Ausrüstung in der Hauptstadtregion.',
                location: 'Berlin / Brandenburg',
                company_address: 'Holzhauser Straße 142, 13509 Berlin',
                phone: '+49 30 6543210',
                website_url: 'https://berlin-vanlife.de',
            }
        ];

        const passwordHash = hashPassword('CampunaDealer2026!');

        for (const d of dealers) {
            // Check if user exists
            let uRes = await pool.query('SELECT id FROM users WHERE email = $1', [d.email]);
            let userId;

            if (uRes.rows.length === 0) {
                const newId = crypto.randomUUID();
                const insUser = await pool.query(`
                    INSERT INTO users (id, email, password_hash, role, user_type, email_verified, is_suspended, created_at, updated_at)
                    VALUES ($1, $2, $3, 'USER', 'COMMERCIAL', TRUE, FALSE, NOW(), NOW())
                    RETURNING id
                `, [newId, d.email, passwordHash]);
                userId = insUser.rows[0].id;
                console.log(`✨ Created user ${d.email} (${userId})`);
            } else {
                userId = uRes.rows[0].id;
                await pool.query(`
                    UPDATE users 
                    SET email_verified = TRUE, is_suspended = FALSE, user_type = 'COMMERCIAL'
                    WHERE id = $1
                `, [userId]);
            }

            // Upsert company profile
            const cpRes = await pool.query('SELECT id FROM company_profiles WHERE user_id = $1', [userId]);
            const spotlightExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

            if (cpRes.rows.length === 0) {
                await pool.query(`
                    INSERT INTO company_profiles (
                        user_id, company_name, logo_url, cover_image_url, bio,
                        location, company_address, phone, website_url,
                        tier, is_strategic_partner, spotlight_until, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9,
                        'BUSINESS', TRUE, $10, NOW(), NOW()
                    )
                `, [
                    userId, d.company_name, d.logo_url, d.cover_image_url, d.bio,
                    d.location, d.company_address, d.phone, d.website_url,
                    spotlightExpiry
                ]);
                console.log(`🏢 Created company profile for "${d.company_name}"`);
            } else {
                await pool.query(`
                    UPDATE company_profiles SET
                        company_name = $1,
                        logo_url = $2,
                        cover_image_url = $3,
                        bio = $4,
                        location = $5,
                        company_address = $6,
                        phone = $7,
                        website_url = $8,
                        tier = 'BUSINESS',
                        is_strategic_partner = TRUE,
                        spotlight_until = $9,
                        updated_at = NOW()
                    WHERE user_id = $10
                `, [
                    d.company_name, d.logo_url, d.cover_image_url, d.bio,
                    d.location, d.company_address, d.phone, d.website_url,
                    spotlightExpiry, userId
                ]);
                console.log(`🔄 Updated company profile for "${d.company_name}"`);
            }
        }

        // Verify spotlight query
        const checkQuery = `
            SELECT 
                u.id,
                cp.company_name,
                cp.location,
                cp.phone,
                LENGTH(cp.bio) as bio_len,
                cp.spotlight_until,
                cp.is_strategic_partner
            FROM company_profiles cp
            JOIN users u ON u.id = cp.user_id
            WHERE u.user_type = 'COMMERCIAL'
            ORDER BY cp.company_name;
        `;
        const checkRes = await pool.query(checkQuery);
        console.log('\n📊 Updated Commercial Profiles:');
        console.table(checkRes.rows);

        console.log('\n✅ Spotlight Dealers seeded & verified successfully!');
    } catch (e) {
        console.error('❌ Error seeding spotlight dealers:', e);
    } finally {
        process.exit(0);
    }
}

seedSpotlightDealers();

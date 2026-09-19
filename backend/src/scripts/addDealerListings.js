import pool from '../config/database.js';

async function addListingsForDealers() {
    try {
        console.log('Adding realistic listings for dealers...');

        // Schwarzwald Reisemobile
        const swRes = await pool.query("SELECT id FROM users WHERE email = 'info@schwarzwald-reisemobile.de'");
        if (swRes.rows.length > 0) {
            const swId = swRes.rows[0].id;
            const count = await pool.query('SELECT COUNT(*) FROM listings WHERE user_id = $1', [swId]);
            if (parseInt(count.rows[0].count, 10) === 0) {
                await pool.query(`
                    INSERT INTO listings (
                        id, user_id, title, slug, description, category, vehicle_type,
                        price, location, status, images, moderation_status, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1,
                        'Bürstner Lyseo TD 690 G Harmony Line Automatik',
                        'buerstner-lyseo-td-690-g-harmony-line',
                        'Top gepflegtes Teilintegriertes Wohnmobil mit Einzelbetten, großer Heckgarage und umfangreicher Sonderausstattung.',
                        'VEHICLE', 'MOTORHOME', 74900, 'Freiburg im Breisgau', 'APPROVED',
                        ARRAY['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'],
                        'APPROVED', NOW(), NOW()
                    ),
                    (
                        gen_random_uuid(), $1,
                        'Carado T447 Edition 15 - 9-Gang Automatik 160 PS',
                        'carado-t447-edition-15-automatik',
                        'Geräumiges Familien-Wohnmobil mit Raumbad, L-Sitzgruppe und Hubbett. Sofort verfügbar.',
                        'VEHICLE', 'MOTORHOME', 68500, 'Freiburg im Breisgau', 'APPROVED',
                        ARRAY['https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=800&q=80'],
                        'APPROVED', NOW(), NOW()
                    )
                `, [swId]);
                console.log('✅ Added 2 listings for Schwarzwald Reisemobile');
            }
        }

        // Berlin Vanlife
        const bvRes = await pool.query("SELECT id FROM users WHERE email = 'kontakt@berlin-vanlife.de'");
        if (bvRes.rows.length > 0) {
            const bvId = bvRes.rows[0].id;
            const count = await pool.query('SELECT COUNT(*) FROM listings WHERE user_id = $1', [bvId]);
            if (parseInt(count.rows[0].count, 10) === 0) {
                await pool.query(`
                    INSERT INTO listings (
                        id, user_id, title, slug, description, category, vehicle_type,
                        price, location, status, images, moderation_status, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1,
                        'Mercedes-Benz Sprinter 4x4 Offgrid Camper Adventure Edition',
                        'mercedes-sprinter-4x4-offgrid-camper',
                        'Autarker 4x4 Offroad-Campervan mit Lithium-Power, Induktionskochfeld, Warmwasser-Außendusche und Seilwinde.',
                        'VEHICLE', 'CAMPERVAN', 89900, 'Berlin / Brandenburg', 'APPROVED',
                        ARRAY['https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=800&q=80'],
                        'APPROVED', NOW(), NOW()
                    ),
                    (
                        gen_random_uuid(), $1,
                        'Ford Nugget Plus Hochdach 185 PS Automatik',
                        'ford-nugget-plus-hochdach-automatik',
                        'Der Klassiker mit 2-Raum-Konzept, festem WC im Heck und Standheizung. Perfekter Alltags- und Reisecamper.',
                        'VEHICLE', 'CAMPERVAN', 59900, 'Berlin / Brandenburg', 'APPROVED',
                        ARRAY['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
                        'APPROVED', NOW(), NOW()
                    )
                `, [bvId]);
                console.log('✅ Added 2 listings for Berlin Vanlife');
            }
        }

        console.log('🎉 All dealer listings updated!');
    } catch (e) {
        console.error('Error adding listings:', e);
    } finally {
        process.exit(0);
    }
}

addListingsForDealers();

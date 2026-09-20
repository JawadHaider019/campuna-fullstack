import pool from '../config/database.js';
import crypto from 'crypto';

async function seedClubListings() {
    try {
        const adminRes = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
        if (adminRes.rowCount === 0) {
            console.log('No admin user found.');
            return;
        }
        const adminId = adminRes.rows[0].id;

        const sampleListings = [
            {
                title: 'Campuna Club: VW Grand California 680 Automatik',
                slug: 'campuna-club-vw-grand-california-680',
                description: 'Offizielles Campuna Club Fahrzeug: VW Grand California 680 mit 177 PS Automatik, Vollausstattung, 4 Schlafplätze, Solaranlage und Standheizung. Werkstattgeprüft.',
                price: 79900,
                location: 'München, Deutschland',
                category: 'Wohnmobile & Camper',
                subcategory: 'Kastenwagen & Van',
                images: [
                    'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=800&q=80'
                ]
            },
            {
                title: 'Campuna Club: Knaus Sport 500 EU Silver Selection',
                slug: 'campuna-club-knaus-sport-500-eu',
                description: 'Gepflegter Familien-Wohnwagen mit Einzelbetten, Mover, Vorzelt und 100er-Zulassung. Direkt vom Campuna Club verifiziert und sofort einsatzbereit.',
                price: 21900,
                location: 'Stuttgart, Deutschland',
                category: 'Wohnwagen & Caravans',
                subcategory: 'Wohnwagen',
                images: [
                    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'
                ]
            },
            {
                title: 'Campuna Club: EcoFlow DELTA Pro 3600Wh Powerstation',
                slug: 'campuna-club-ecoflow-delta-pro-3600wh',
                description: 'High-End Powerstation für autarkes Camping und Reisen. 3.600 Wh Kapazität, 3.600W AC-Ausgang, superschnelles Laden. Neuwertig im Originalkarton.',
                price: 2499,
                location: 'Hamburg, Deutschland',
                category: 'Camping Zubehör',
                subcategory: 'Elektrik & Solar',
                images: [
                    'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80'
                ]
            }
        ];

        for (const item of sampleListings) {
            const check = await pool.query('SELECT id FROM listings WHERE slug = $1', [item.slug]);
            if (check.rowCount === 0) {
                const lid = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO listings (
                        id, user_id, title, slug, description, price, negotiable, location,
                        condition, category, subcategory, status, featured, images, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, false, $7,
                        'Sehr gut', $8, $9, 'APPROVED', true, $10, NOW(), NOW()
                    )`,
                    [
                        lid,
                        adminId,
                        item.title,
                        item.slug,
                        item.description,
                        item.price,
                        item.location,
                        item.category,
                        item.subcategory,
                        item.images
                    ]
                );
                console.log('✅ Created Campuna Club Listing:', item.title);
            } else {
                console.log('ℹ️  Listing already exists:', item.title);
            }
        }
    } catch (err) {
        console.error('Error seeding club listings:', err);
    } finally {
        await pool.end();
    }
}

seedClubListings();

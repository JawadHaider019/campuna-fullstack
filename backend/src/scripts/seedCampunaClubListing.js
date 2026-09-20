import pool from '../config/database.js';
import crypto from 'crypto';

async function seedCampunaClubListing() {
    try {
        console.log('🔄 Checking admin user for Campuna Club listing...');
        const adminRes = await pool.query("SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1");
        if (adminRes.rowCount === 0) {
            console.error('❌ No admin user found.');
            process.exit(1);
        }

        const adminId = adminRes.rows[0].id;

        // Ensure company_profile has Campuna Club & BUSINESS tier
        await pool.query(`
            INSERT INTO company_profiles (user_id, company_name, tier, bio, website_url, logo_url, phone, updated_at)
            VALUES ($1, 'Campuna Club', 'BUSINESS', 'Offizieller Marktplatz- & Club-Auftritt von Campuna.', 'https://campuna.com', '/logo.webp', '+49 89 12345678', NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                company_name = 'Campuna Club',
                tier = 'BUSINESS',
                bio = 'Offizieller Marktplatz- & Club-Auftritt von Campuna.',
                logo_url = '/logo.webp',
                updated_at = NOW()
        `, [adminId]);

        // Check if admin already has a listing
        const existingListing = await pool.query("SELECT id, title FROM listings WHERE user_id = $1 LIMIT 1", [adminId]);
        if (existingListing.rowCount > 0) {
            console.log(`✅ Admin already has listing: "${existingListing.rows[0].title}" (ID: ${existingListing.rows[0].id})`);
            process.exit(0);
        }

        const listingId = crypto.randomUUID();
        const title = 'Campuna Club Edition: Hymer Grand Canyon S 4x4 Offroad Camper';
        const slug = 'campuna-club-edition-hymer-grand-canyon-s-4x4-offroad-camper';
        const description = `⭐ Offizielles Angebot vom Campuna Club (Business-Profil)

Erlebe maximale Freiheit mit der exklusiven Campuna Club Edition des Hymer Grand Canyon S auf Mercedes-Benz Sprinter 4x4 Basis.

Ausstattung & Highlights:
- Allradantrieb (4x4) mit Geländeuntersetzung & All-Terrain Bereifung
- 190 PS Turbodiesel mit 9G-Tronic Automatikgetriebe
- 320W Solaranlage & 200Ah Lithium-Eisenphosphat (LiFePO4) Aufbaubatterie
- Autarkie-Paket für bis zu 5 Tage netzunabhängiges Stehen
- Diesel-Standheizung mit Höhenkit & Fußbodenheizung
- Kompressor-Kühlschrank 90L mit Gefrierfach
- Integrierte Nasszelle mit Warmwasserdusche & Kassetten-Toilette
- 2 Schlafplätze im Heck + optionales Aufstelldach

Garantie & Service:
- Inklusive 24 Monate Campuna Premium Garantie
- Werkstattgeprüft mit vollständigem Übergabeprotokoll
- Sofort verfügbar zur Probefahrt & Abholung

Besichtigung nach Vereinbarung möglich.`;

        const images = [
            'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200',
            'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?w=1200',
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200'
        ];

        await pool.query(`
            INSERT INTO listings (
                id, user_id, title, slug, description, price, negotiable, location, phone,
                condition, category, subcategory, status, featured, boosted_until, images, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, 'APPROVED', true, NOW() + INTERVAL '30 days', $13, NOW(), NOW()
            )
        `, [
            listingId,
            adminId,
            title,
            slug,
            description,
            98500,
            true,
            'München',
            '+49 89 12345678',
            'Neuwertig',
            'Wohnmobile & Camper',
            'Kastenwagen & Van',
            images
        ]);

        console.log(`🎉 Created official Campuna Club listing: "${title}" (ID: ${listingId})`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error seeding Campuna Club listing:', err);
        process.exit(1);
    }
}

seedCampunaClubListing();

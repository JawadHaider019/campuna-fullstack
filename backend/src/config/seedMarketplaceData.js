import pool from './database.js';
import crypto from 'crypto';

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

/**
 * Seeds the database with rich, authentic German marketplace data
 * including real listings, pending review queue items, approved items across the last 7 days,
 * commercial dealers, private sellers, and AI moderation scores.
 */
export async function seedMarketplaceData() {
    console.log('🌱 Seeding realistic Campuna Marketplace data...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Default Password Hash
        const passwordHash = hashPassword('Campuna2026!');

        // 2. Insert Commercial Dealers
        const commercialUsers = [
            {
                email: 'caravan-bayern@campuna.de',
                companyName: 'Caravan Center Bayern GmbH',
                location: 'München, Bayern',
                isStrategicPartner: true,
                tier: 'BUSINESS',
                logo: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80',
                coverImage: 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=1200&q=80',
                bio: 'Offizieller Vertragshändler für Hymer, Dethleffs und Pössl im Großraum München. Über 25 Jahre Erfahrung in Verkauf, Meisterwerkstatt und Camping-Zubehör.',
                phone: '+49 89 4523910',
                address: 'Wasserburger Landstr. 142, 81827 München'
            },
            {
                email: 'alpencamper@campuna.de',
                companyName: 'AlpenCamper Allgäu',
                location: 'Kempten, Bayern',
                isStrategicPartner: true,
                tier: 'BUSINESS',
                logo: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80',
                coverImage: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
                bio: 'Spezialist für allradgetriebene 4x4 Offroad-Campervans, Expeditionsmobile und maßgeschneiderte Campingausbauten im Allgäu.',
                phone: '+49 831 960240',
                address: 'Allgäuer Str. 88, 87435 Kempten'
            },
            {
                email: 'info@campingwelt-nord.de',
                companyName: 'Campingwelt Nord GmbH',
                location: 'Hamburg',
                isStrategicPartner: false,
                tier: 'BUSINESS',
                logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
                coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
                bio: 'Dein Vertragspartner für Wohnwagen, Vorzelte & Campingzubehör an der Nordseeküste. Fachberatung und Meister-Werkstattservice.',
                phone: '+49 4841 77230',
                address: 'Kieler Str. 301, 22525 Hamburg'
            },
            {
                email: 'kontakt@camper-nrw.de',
                companyName: 'Camper Manufaktur NRW',
                location: 'Köln, NRW',
                isStrategicPartner: false,
                tier: 'BUSINESS',
                logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
                bio: 'Premium Individualausbauten für Kastenwagen und Bullis. Exklusive Solaranlagen, Aufstelldächer und Lithium-Bordnetze in Köln.',
                phone: '+49 221 890456',
                address: 'Aachener Str. 512, 50933 Köln'
            }
        ];

        const insertedCommercialUserIds = [];

        for (const c of commercialUsers) {
            const uid = crypto.randomUUID();
            const userRes = await client.query(`
                INSERT INTO users (id, email, password_hash, role, user_type, email_verified, created_at, updated_at)
                VALUES ($1, $2, $3, 'USER', 'COMMERCIAL', TRUE, NOW() - INTERVAL '15 days', NOW())
                ON CONFLICT (email) DO UPDATE SET email_verified = TRUE
                RETURNING id;
            `, [uid, c.email, passwordHash]);

            const userId = userRes.rows[0].id;
            insertedCommercialUserIds.push(userId);

            await client.query(`
                INSERT INTO company_profiles (
                    user_id, company_name, location, company_address, logo_url, cover_image_url, bio, phone, is_strategic_partner, spotlight_until, tier, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '30 days', $10, NOW() - INTERVAL '15 days', NOW())
                ON CONFLICT (user_id) DO UPDATE SET 
                    company_name = EXCLUDED.company_name,
                    is_strategic_partner = EXCLUDED.is_strategic_partner,
                    tier = EXCLUDED.tier,
                    logo_url = EXCLUDED.logo_url,
                    cover_image_url = EXCLUDED.cover_image_url,
                    bio = EXCLUDED.bio,
                    phone = EXCLUDED.phone,
                    spotlight_until = EXCLUDED.spotlight_until,
                    location = EXCLUDED.location,
                    company_address = EXCLUDED.company_address;
            `, [userId, c.companyName, c.location, c.address, c.logo, c.coverImage, c.bio, c.phone, c.isStrategicPartner, c.tier]);

            // Add active subscription if BUSINESS
            if (c.tier === 'BUSINESS') {
                await client.query(`
                    INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, amount_paid_cents, payment_method, created_at, updated_at)
                    VALUES ($1, 2, 'ACTIVE', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 2900, 'CREDIT', NOW() - INTERVAL '10 days', NOW())
                    ON CONFLICT DO NOTHING;
                `, [userId]);
            }
        }

        // 3. Insert Private Users
        const privateUsers = [
            {
                email: 'markus.weber@campuna-user.de',
                firstName: 'Markus',
                lastName: 'Weber',
                location: 'Freiburg, Baden-Württemberg',
                isPioneer: true,
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                daysAgo: 6
            },
            {
                email: 'sophie.becker@campuna-user.de',
                firstName: 'Sophie',
                lastName: 'Becker',
                location: 'Hannover, Niedersachsen',
                isPioneer: true,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                daysAgo: 4
            },
            {
                email: 'thomas.schmidt@campuna-user.de',
                firstName: 'Thomas',
                lastName: 'Schmidt',
                location: 'Nürnberg, Bayern',
                isPioneer: false,
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
                daysAgo: 3
            },
            {
                email: 'laura.hoffmann@campuna-user.de',
                firstName: 'Laura',
                lastName: 'Hoffmann',
                location: 'Dresden, Sachsen',
                isPioneer: true,
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
                daysAgo: 2
            },
            {
                email: 'michael.wagner@campuna-user.de',
                firstName: 'Michael',
                lastName: 'Wagner',
                location: 'Frankfurt am Main, Hessen',
                isPioneer: false,
                avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
                daysAgo: 1
            },
            {
                email: 'elena.fischer@campuna-user.de',
                firstName: 'Elena',
                lastName: 'Fischer',
                location: 'Augsburg, Bayern',
                isPioneer: false,
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
                daysAgo: 0
            }
        ];

        const insertedPrivateUserIds = [];

        for (const p of privateUsers) {
            const uid = crypto.randomUUID();
            const userRes = await client.query(`
                INSERT INTO users (id, email, password_hash, role, user_type, email_verified, created_at, updated_at)
                VALUES ($1, $2, $3, 'USER', 'PRIVATE', TRUE, NOW() - ($4 || ' days')::interval, NOW())
                ON CONFLICT (email) DO UPDATE SET email_verified = TRUE
                RETURNING id;
            `, [uid, p.email, passwordHash, p.daysAgo]);

            const userId = userRes.rows[0].id;
            insertedPrivateUserIds.push(userId);

            await client.query(`
                INSERT INTO private_profiles (user_id, first_name, last_name, location, profile_image_url, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::interval, NOW())
                ON CONFLICT (user_id) DO UPDATE SET 
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    profile_image_url = EXCLUDED.profile_image_url;
            `, [userId, p.firstName, p.lastName, p.location, p.avatar, p.daysAgo]);

            // Add Pioneer Badge if eligible
            if (p.isPioneer) {
                await client.query(`
                    INSERT INTO user_achievements (user_id, badge_key, position, earned_at)
                    VALUES ($1, 'CAMPUNA_PIONEER', 1, NOW() - ($2 || ' days')::interval);
                `, [userId, p.daysAgo]);
            }

            // Add Credit Transactions
            await client.query(`
                INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
                VALUES ($1, 500, 'BONUS', 'Willkommens-Guthaben & Pioneer Registrierung', NOW() - ($2 || ' days')::interval);
            `, [userId, p.daysAgo]);
        }

        // 4. Safe Seeding: Never delete existing listings to protect user-created and admin listings

        // 5. Rich German Marketplace Listings
        const allListings = [
            // ─── PENDING REVIEW QUEUE (4 Items needing manual approval, score ~50) ───
            {
                title: "Knaus Boxstar 600 Street Campervan - 160 PS Automatik",
                category: "Wohnmobile & Camper",
                subcategory: "Kastenwagen",
                price: 54900,
                location: "München, Bayern",
                status: "REVIEW",
                featured: true,
                images: ["https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80"],
                description: "Sehr gepflegter Knaus Boxstar 600 Street aus 1. Hand. 160 PS Diesel mit 9-Gang Wandlerautomatik. Solaranlage 150W, Markise, Rückfahrkamera, Truma Combi 6D Dieselheizung.",
                userId: insertedCommercialUserIds[0],
                daysAgo: 0,
                aiScore: 52,
                aiDecision: "MANUAL_REVIEW",
                fraudRiskScore: 25,
                aiReasons: [
                    "Score 52: Hochpreisiges Neuinserat – Detaillierter Service-Nachweis zur manuellen Sichtung empfohlen",
                    "3 Außenaufnahmen verifiziert, Innenraumfotos werden ergänzt",
                    "Manuelle Freigabe durch Administrator erforderlich"
                ]
            },
            {
                title: "Dethleffs c'go 495 QSK Familienwohnwagen mit Stockbetten",
                category: "Wohnwagen & Caravans",
                subcategory: "Familienwohnwagen",
                price: 18500,
                location: "Köln, NRW",
                status: "REVIEW",
                featured: false,
                images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"],
                description: "Idealer Wohnwagen für Familien mit bis zu 6 Schlafplätzen. Mover inklusive, 100 km/h Zulassung, Dichtigkeitsprüfung lückenlos.",
                userId: insertedPrivateUserIds[0],
                daysAgo: 0,
                aiScore: 48,
                aiDecision: "MANUAL_REVIEW",
                fraudRiskScore: 30,
                aiReasons: [
                    "Score 48: Preis ca. 15% unter regionalem Marktdurchschnitt",
                    "Plausibilitätsprüfung durch Administrator empfohlen",
                    "Standort und Kontaktdaten plausibel"
                ]
            },
            {
                title: "Thule Velospace XT 3 Fahrradträger für 3 E-Bikes",
                category: "Fahrräder & Träger",
                subcategory: "Kupplungsträger",
                price: 480,
                location: "Frankfurt am Main, Hessen",
                status: "REVIEW",
                featured: false,
                images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80"],
                description: "Verkaufe unseren kaum genutzten Thule Velospace XT 3 Träger. Belastbar bis 60kg, ideal für schwere E-Bikes. Abklappbar mit Fußpedal.",
                userId: insertedPrivateUserIds[1],
                daysAgo: 0,
                aiScore: 50,
                aiDecision: "MANUAL_REVIEW",
                fraudRiskScore: 18,
                aiReasons: [
                    "Score 50: Borderline-Einstufung – Bildqualität ausreichend, Seriennummer nicht im Foto erkennbar",
                    "Textqualität und Preisstruktur stimmig",
                    "Freigabe nach manueller Kurzsichtung"
                ]
            },
            {
                title: "Exklusiver Natur-Stellplatz mit Seeblick am Chiemsee",
                category: "Stellplätze & Campingplätze",
                subcategory: "Privatstellplatz",
                price: 25,
                location: "Prien am Chiemsee, Bayern",
                status: "REVIEW",
                featured: true,
                images: ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"],
                description: "Ruhiger Stellplatz auf einer Wiese mit direktem Blick auf den See. Strom (16A), Frischwasser und WLAN vorhanden. Nur für autarke Camper.",
                userId: insertedPrivateUserIds[2],
                daysAgo: 1,
                aiScore: 54,
                aiDecision: "MANUAL_REVIEW",
                fraudRiskScore: 20,
                aiReasons: [
                    "Score 54: Standort verifiziert, Überprüfung der gewerblichen Stellplatz-Zulassung empfohlen",
                    "Exzellente Fotodokumentation",
                    "Manuelle Prüfung für Featured-Platzierung"
                ]
            },

            // ─── APPROVED LISTINGS (Distributed over last 6 days for rich 7-day ingestion chart) ───
            {
                title: "VW T6.1 California Ocean 4Motion DSG - Vollausstattung",
                category: "Wohnmobile & Camper",
                subcategory: "Campervan",
                price: 68500,
                location: "München, Bayern",
                status: "APPROVED",
                featured: true,
                images: ["https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80"],
                description: "Traumhafter California Ocean 4Motion mit elektrohydraulischem Aufstelldach, Standheizung, Doppelverglasung, AHK abnehmbar und Markise.",
                userId: insertedCommercialUserIds[0],
                daysAgo: 0,
                aiScore: 94,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 2,
                aiReasons: ["Hohe Textqualität & Händler-Verifizierung", "Perfekte Fahrzeugfotos und vollständige FIN", "Auto-Freigabe erteilt"]
            },
            {
                title: "Pössl 2Win Plus Citroën Jumper 140PS - All-In Paket",
                category: "Wohnmobile & Camper",
                subcategory: "Kastenwagen",
                price: 49900,
                location: "Kempten, Bayern",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80"],
                description: "Kompakter Alleskönner mit Querbett im Heck, Raumbad, Kompressorkühlschrank und Truma Gasheizung. Scheckheftgepflegt.",
                userId: insertedCommercialUserIds[1],
                daysAgo: 1,
                aiScore: 91,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 4,
                aiReasons: ["Geprüfter Händler", "Preis entspricht Marktwert", "Auto-Freigabe erteilt"]
            },
            {
                title: "Dometic CFX3 45 Kompressor-Kühlbox 12V/230V",
                category: "Camping Zubehör",
                subcategory: "Kühlung & Küche",
                price: 620,
                location: "Hamburg",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80"],
                description: "Leistungsstarke 40L Kompressorkühlbox, kühlt bis -22°C. App-Steuerung per WLAN/Bluetooth. Wie neu, nur 2 Urlaube genutzt.",
                userId: insertedCommercialUserIds[2],
                daysAgo: 1,
                aiScore: 89,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 5,
                aiReasons: ["Echtes Foto & Zubehör vollständig", "Gute Beschreibung", "Auto-Freigabe erteilt"]
            },
            {
                title: "Vorzelt Isabella Capri North G18 Umlauflänge 975 cm",
                category: "Camping Zubehör",
                subcategory: "Vorzelte & Markisen",
                price: 1150,
                location: "Köln, NRW",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80"],
                description: "Leichtes Reisevorzelt mit CarbonX Gestänge. Atmungsaktives Isacryl-Gewebe, schnell aufzubauen und sturmfest.",
                userId: insertedCommercialUserIds[3],
                daysAgo: 2,
                aiScore: 92,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 3,
                aiReasons: ["Hochwertiges Vorzelt", "Marktüblicher Preis", "Auto-Freigabe erteilt"]
            },
            {
                title: "iKamper Skycamp 3.0 4X Dachzelt All-Black Edition",
                category: "Zelte & Dachzelte",
                subcategory: "Hartschalen-Dachzelt",
                price: 3450,
                location: "Dresden, Sachsen",
                status: "APPROVED",
                featured: true,
                images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80"],
                description: "Dachzelt für bis zu 4 Personen. Aufbau in unter 1 Minute dank Gasdruckfedern. Inklusive Komfort-Matratze und Leiterverlängerung.",
                userId: insertedPrivateUserIds[3],
                daysAgo: 2,
                aiScore: 95,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 2,
                aiReasons: ["Top-Zustand, vollständige Beschreibung", "Verifizierter Pioneer Verkäufer", "Auto-Freigabe erteilt"]
            },
            {
                title: "Outwell Parkville 200 Busvorzelt aufblasbar",
                category: "Zelte & Dachzelte",
                subcategory: "Busvorzelte",
                price: 490,
                location: "Freiburg, Baden-Württemberg",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80"],
                description: "Freistehendes Luft-Busvorzelt mit Vordach. 6.000 mm Wassersäule, einfacher Aufbau mit Doppelhubpumpe.",
                userId: insertedPrivateUserIds[0],
                daysAgo: 3,
                aiScore: 88,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 6,
                aiReasons: ["Plausibler Preis", "Originalfotos", "Auto-Freigabe erteilt"]
            },
            {
                title: "Tiny House Mobilheim 4 Season Winterfest 24qm",
                category: "Tiny Houses",
                subcategory: "Mobilheime",
                price: 34500,
                location: "Kempten, Bayern",
                status: "APPROVED",
                featured: true,
                images: ["https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"],
                description: "Komplett winterfestes Tiny House auf Vlemmix Trailer. Fußbodenheizung, Duschbad, Küchenzeile und Schlafloft.",
                userId: insertedCommercialUserIds[1],
                daysAgo: 3,
                aiScore: 93,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 3,
                aiReasons: ["Geprüfter Händler", "Vollständige Baudokumentation", "Auto-Freigabe erteilt"]
            },
            {
                title: "Fendt Bianco Activ 515 SD Modell 2024",
                category: "Wohnwagen & Caravans",
                subcategory: "Reisewohnwagen",
                price: 28900,
                location: "Leipzig, Sachsen",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80"],
                description: "Neuwertiger Fendt Wohnwagen mit Heckbad und Queensbett. Truma Combi 4, Alufelgen, Safety-Paket.",
                userId: insertedCommercialUserIds[0],
                daysAgo: 4,
                aiScore: 96,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 1,
                aiReasons: ["Neuwertiger Wohnwagen", "Scheckheftgepflegt", "Auto-Freigabe erteilt"]
            },
            {
                title: "Jackery Solargenerator 1000 Pro + 2x 80W Solarpanel",
                category: "Camping Zubehör",
                subcategory: "Elektrik & Solar",
                price: 899,
                location: "Dresden, Sachsen",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=1200&q=80"],
                description: "1002 Wh LiFePO4 Powerstation mit 1000W Dauerleistung. Schnelles Laden über Solar in ca. 1,8 Stunden.",
                userId: insertedPrivateUserIds[3],
                daysAgo: 4,
                aiScore: 90,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 5,
                aiReasons: ["Vollständiges Set mit Rechnung", "Garantie vorhanden", "Auto-Freigabe erteilt"]
            },
            {
                title: "Campingbus Ausbau & Elektrik-Service (Solar & LiFePO4)",
                category: "Dienstleistungen",
                subcategory: "Werkstatt & Ausbau",
                price: 95,
                location: "Nürnberg, Bayern",
                status: "APPROVED",
                featured: true,
                images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"],
                description: "Professionelle Nachrüstung von Lithium-Batterien, Wechselrichtern, Ladeboostern und Solaranlagen für Wohnmobile und Campervans.",
                userId: insertedCommercialUserIds[3],
                daysAgo: 5,
                aiScore: 94,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 2,
                aiReasons: ["Fachwerkstatt mit Meisterbrief", "Klare Leistungsbeschreibung", "Auto-Freigabe erteilt"]
            },
            {
                title: "Hymer B-Klasse MasterLine I 780 Mercedes Sprinter",
                category: "Wohnmobile & Camper",
                subcategory: "Vollintegriert",
                price: 119000,
                location: "München, Bayern",
                status: "APPROVED",
                featured: true,
                images: ["https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80"],
                description: "Luxus-Liner auf Mercedes Sprinter Basis mit SLC-Chassis. Alde Warmwasserheizung, Doppelboden, Lederpolsterung, Sat-Anlage.",
                userId: insertedCommercialUserIds[0],
                daysAgo: 5,
                aiScore: 98,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 1,
                aiReasons: ["Premium-Fahrzeug mit Zertifikat", "Autorisierter Vertragshändler", "Auto-Freigabe erteilt"]
            },
            {
                title: "Eriba Touring Troll 530 Rockabilly Edition",
                category: "Wohnwagen & Caravans",
                subcategory: "Kultwohnwagen",
                price: 24500,
                location: "Hannover, Niedersachsen",
                status: "APPROVED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"],
                description: "Sondermodell im coolen 50er Jahre Retro-Look. Zweifarblackierung rot/weiß, Hubdach, Fliegengittertür, Antischlingerkupplung.",
                userId: insertedPrivateUserIds[1],
                daysAgo: 6,
                aiScore: 92,
                aiDecision: "AUTO_APPROVED",
                fraudRiskScore: 3,
                aiReasons: ["Originalzustand ohne Mängel", "TÜV & Gasprüfung neu", "Auto-Freigabe erteilt"]
            },

            // ─── REJECTED LISTINGS (Spam or Policy Violations) ───
            {
                title: "SUPER BILLIG ROLEX & IPHONE AUS CHINA",
                category: "Camping Zubehör",
                subcategory: "Allgemein",
                price: 10,
                location: "Berlin",
                status: "REJECTED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80"],
                description: "Kauf jetzt billig Uhren und Handys super Qualität WhatsApp +86123456789.",
                userId: insertedPrivateUserIds[4],
                daysAgo: 2,
                aiScore: 12,
                aiDecision: "AUTO_REJECTED",
                fraudRiskScore: 95,
                aiReasons: ["Themenfremder Spam auf Camping-Plattform", "Verdacht auf Phishing / Produktfälschung", "Auto-Abgelehnt"]
            },
            {
                title: "Wohnmobil kostenlos zu verschenken gegen Vorauszahlung Spedition",
                category: "Wohnmobile & Camper",
                subcategory: "Wohnmobil",
                price: 0,
                location: "Hamburg",
                status: "REJECTED",
                featured: false,
                images: ["https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80"],
                description: "Muss aus England verschifft werden, bitte 500 Euro vorab überweisen per Western Union.",
                userId: insertedPrivateUserIds[4],
                daysAgo: 3,
                aiScore: 18,
                aiDecision: "AUTO_REJECTED",
                fraudRiskScore: 98,
                aiReasons: ["Klassisches Vorschussbetrugs-Muster", "Gesperrte Zahlungsarten gefordert", "Auto-Abgelehnt"]
            }
        ];

        // 6. Insert all listings and their moderation records (if not already existing)
        for (const item of allListings) {
            const existingCheck = await client.query(`SELECT id FROM listings WHERE title = $1 LIMIT 1`, [item.title]);
            if (existingCheck.rowCount > 0) {
                continue; // Skip already existing listing
            }

            const listId = crypto.randomUUID();
            const slug = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.random().toString(36).substring(2, 6)}`;
            
            const listingRes = await client.query(`
                INSERT INTO listings (
                    id, user_id, title, slug, description, price, location, category, subcategory, 
                    status, featured, images, created_at, updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, 
                    $10, $11, $12, NOW() - ($13 || ' days')::interval, NOW()
                )
                RETURNING id;
            `, [
                listId,
                item.userId,
                item.title,
                slug,
                item.description,
                item.price,
                item.location,
                item.category,
                item.subcategory,
                item.status,
                item.featured,
                item.images,
                item.daysAgo
            ]);

            const listingId = listingRes.rows[0].id;
            const modId = crypto.randomUUID();

            // Moderation record
            await client.query(`
                INSERT INTO listing_moderation (
                    id, listing_id, ai_score, ai_decision, confidence_score, text_score, image_score, 
                    price_score, fraud_risk_score, ai_reasons, status, reviewed_at, created_at, updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, 
                    $8, $9, $10, $11, NOW() - ($12 || ' days')::interval, NOW() - ($12 || ' days')::interval, NOW()
                )
                ON CONFLICT (listing_id) DO NOTHING;
            `, [
                modId,
                listingId,
                item.aiScore,
                item.aiDecision,
                (item.aiScore / 100).toFixed(2),
                Math.min(100, item.aiScore + 5),
                Math.max(10, item.aiScore - 3),
                Math.max(10, item.aiScore),
                item.fraudRiskScore,
                JSON.stringify(item.aiReasons),
                item.status === 'APPROVED' ? 'AUTO_RESOLVED' : (item.status === 'REJECTED' ? 'AUTO_REJECTED' : 'PENDING'),
                item.daysAgo
            ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully seeded ${allListings.length} marketplace listings, commercial partners, and moderation data!`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding marketplace data:', err);
        throw err;
    } finally {
        client.release();
    }
}

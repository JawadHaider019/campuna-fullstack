/**
 * Campuna Realistic Static Marketplace Data
 * Matches the exact static listings and dummy data from the screenshot
 * with hyper-relevant camping images for each item.
 */

export const STATIC_USERS = [
    {
        id: 'usr_alpen_caravan',
        slug: 'alpen-caravan-reisemobile-gmbh',
        name: 'Alpen Caravan & Reisemobile GmbH',
        company_name: 'Alpen Caravan & Reisemobile GmbH',
        contact_person: 'Markus Huber',
        account_type: 'COMMERCIAL',
        sellerType: 'Gewerblich',
        verified: true,
        email: 'info@alpencaravan-muenchen.de',
        phone: '+49 89 7412980',
        website: 'https://www.alpencaravan-muenchen.de',
        location: 'München, Bayern',
        address: 'Am Olympiapark 12, 80809 München',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1513313778780-9ae4807465f0?auto=format&fit=crop&w=1400&q=80',
        rating: 4.9,
        reviewsCount: 48,
        listingsCount: 4,
        memberSince: '2022-04-10',
        description: 'Ihr Fachpartner für Wohnmobile, Kastenwagen und Wohnwagen. Wir bieten Neufahrzeuge und geprüfte Gebrauchtwagen.',
        badges: ['Verifizierter Händler', 'Meisterwerkstatt', 'Top Bewertung']
    },
    {
        id: 'usr_gas_and_go',
        slug: 'gas-and-go-berlin',
        name: 'GAS&GO Mobiler Gasservice',
        company_name: 'GAS&GO Mobiler Gasservice Berlin',
        contact_person: 'Karsten Lehmann',
        account_type: 'COMMERCIAL',
        sellerType: 'Gewerblich',
        verified: true,
        email: 'service@gasandgo-berlin.de',
        phone: '+49 30 8912400',
        location: 'Berlin',
        address: 'Berlin',
        logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1400&q=80',
        rating: 5.0,
        reviewsCount: 29,
        listingsCount: 2,
        memberSince: '2023-02-11',
        description: 'Zertifizierter mobiler Gasservice für Wohnmobile, Caravans und Boote nach G607 und G608.',
        badges: ['Zertifizierter Betrieb', 'Gewerblich verifiziert', 'Schnelle Antwort']
    },
    {
        id: 'usr_stefan_bergmann',
        slug: 'stefan-laura-bergmann',
        name: 'Stefan & Laura Bergmann',
        account_type: 'PRIVATE',
        sellerType: 'Privat',
        verified: true,
        email: 'stefan.bergmann.camp@gmx.de',
        phone: '+49 176 8923411',
        location: 'Freiburg im Breisgau, Baden-Württemberg',
        address: 'Freiburg im Breisgau',
        logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1400&q=80',
        rating: 4.9,
        reviewsCount: 14,
        listingsCount: 2,
        memberSince: '2023-03-20',
        description: 'Leidenschaftliche Camper seit über 10 Jahren.',
        badges: ['Privatverkäufer', 'E-Mail bestätigt']
    },
    {
        id: 'usr_max_weidinger',
        slug: 'max-weidinger',
        name: "Maximilian 'Max' Weidinger",
        account_type: 'PRIVATE',
        sellerType: 'Privat',
        verified: true,
        email: 'max.weidinger.outdoor@web.de',
        phone: '+49 151 4459021',
        location: 'Köln, Nordrhein-Westfalen',
        address: 'Köln',
        logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80',
        rating: 4.8,
        reviewsCount: 9,
        listingsCount: 2,
        memberSince: '2024-06-01',
        description: 'Outdoor- und Vanlife-Liebhaber.',
        badges: ['Privatverkäufer', 'Aktiver Camper']
    }
];

export const STATIC_LISTINGS = [
    // 1. Hobby 600
    {
        id: 'lst_hobby_600',
        slug: 'hobby-600-braunsbach-hb60',
        title: 'Hobby 600',
        category: 'Wohnmobile & Camper',
        subcategory: 'Teilintegriert',
        price: 18000,
        pricePeriod: 'Preis',
        location: 'Braunsbach, Baden-Württemberg',
        displayLocation: 'Braunsbach, Baden-Württemberg',
        condition: 'Gebraucht',
        isNegotiable: false,
        is_boosted: false,
        featured: false,
        rating: 4.8,
        reviewsCount: 12,
        publishedDate: '15.09.2026',
        anzeigeNr: 'CP-6001',
        seller_user_id: 'usr_stefan_bergmann',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Braunsbach, Baden-Württemberg'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Gebraucht', 'Ich biete', 'Kult-Wohnmobil', 'Gepflegt'],
        description: 'Klassischer Hobby 600 in gepflegtem Liebhaber-Zustand. Solide Technik, gemütlicher Ausbau und sofort einsatzbereit für die nächste Reise.'
    },

    // 2. Mobile Gasprüfung G607 und G608
    {
        id: 'lst_gas_and_go',
        slug: 'mobile-gasprufung-g607-und-g608-berlin-gg07',
        title: 'Mobile Gasprüfung G607 und G608',
        category: 'Camping Services',
        subcategory: 'Reparatur & Wartung',
        price: 75,
        pricePeriod: 'Preis',
        location: 'Berlin',
        displayLocation: 'Berlin',
        condition: 'Neu',
        isNegotiable: false,
        is_boosted: true,
        featured: false,
        rating: 5.0,
        reviewsCount: 22,
        publishedDate: '15.09.2026',
        anzeigeNr: 'CP-6072',
        seller_user_id: 'usr_gas_and_go',
        seller: {
            name: 'GAS&GO Mobiler Gasservice',
            verified: true,
            type: 'Gewerblich',
            location: 'Berlin'
        },
        listing_user_type: 'Gewerblich',
        images: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Neu', 'Reparatur & Wartung', 'Ich biete', 'Zertifiziert'],
        description: 'Zertifizierte mobile Gasprüfung nach G607 für Wohnmobile und Wohnwagen sowie G608 für Boote direkt vor Ort in Berlin und Umland.'
    },

    // 3. Adria Altea 472PK
    {
        id: 'lst_adria_altea',
        slug: 'adria-altea-472pk-moenchengladbach-aa47',
        title: 'Adria Altea 472PK',
        category: 'Wohnmobile & Camper',
        subcategory: 'Wohnwagen',
        price: 18900,
        pricePeriod: 'Preis',
        location: 'Mönchengladbach, Nordrhein-Westfalen',
        displayLocation: 'Mönchengladbach, NRW',
        condition: 'Sehr gut',
        isNegotiable: true,
        is_boosted: false,
        featured: false,
        rating: 4.9,
        reviewsCount: 15,
        publishedDate: '14.09.2026',
        anzeigeNr: 'CP-4723',
        seller_user_id: 'usr_stefan_bergmann',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Mönchengladbach'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1627664819818-e147d6221422?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1513313778780-9ae4807465f0?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Sehr gut', 'Ich biete', 'Familien-Grundriss', 'Stockbetten'],
        description: 'Moderner Familienwohnwagen Adria Altea 472PK mit Etagenbetten für Kinder und Doppelbett für Eltern. Leicht und sehr gepflegt.'
    },

    // 4. Carthago c tourer 150 QB
    {
        id: 'lst_carthago_150',
        slug: 'carthago-c-tourer-150-qb-dortmund-ct15',
        title: 'Carthago c tourer 150 QB',
        category: 'Wohnmobile & Camper',
        subcategory: 'Vollintegriert',
        price: 79900,
        pricePeriod: 'Preis',
        location: 'Dortmund, Nordrhein-Westfalen',
        displayLocation: 'Dortmund, NRW',
        condition: 'Like New',
        isNegotiable: false,
        is_boosted: true,
        featured: false,
        rating: 4.95,
        reviewsCount: 18,
        publishedDate: '14.09.2026',
        anzeigeNr: 'CP-1504',
        seller_user_id: 'usr_alpen_caravan',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Dortmund'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1513313778780-9ae4807465f0?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Like New', 'Ich biete', 'Queensbett', 'Vollintegriert'],
        description: 'Premium-Wohnmobil Carthago c-tourer 150 QB. Luxuriöses Queensbett im Heck, geräumiges Raumbad und Doppelboden-Isolierung.'
    },

    // 5. Wohnwagen Tabbert Puccini 560
    {
        id: 'lst_tabbert_puccini',
        slug: 'wohnwagen-tabbert-puccini-560-sonsbeck-tp56',
        title: 'Wohnwagen Tabbert Puccini 560',
        category: 'Wohnmobile & Camper',
        subcategory: 'Wohnwagen',
        price: 35000,
        pricePeriod: 'Preis',
        location: 'Sonsbeck, Nordrhein-Westfalen',
        displayLocation: 'Sonsbeck, NRW',
        condition: 'Sehr gut',
        isNegotiable: true,
        is_boosted: false,
        featured: false,
        rating: 4.85,
        reviewsCount: 11,
        publishedDate: '13.09.2026',
        anzeigeNr: 'CP-5605',
        seller_user_id: 'usr_stefan_bergmann',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Sonsbeck'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Sehr gut', 'Wohnwagen', 'Ich biete', 'Oberklasse Caravaning'],
        description: 'Exklusiver Luxus-Wohnwagen Tabbert Puccini 560 mit Rundsitzgruppe, Vorzelt und erstklassiger Tabbert-Qualität.'
    },

    // 6. Schlauchboot stabil, sehr gepflegt
    {
        id: 'lst_schlauchboot',
        slug: 'schlauchboot-stabil-sehr-gepflegt-marktrodach-sb69',
        title: 'Schlauchboot stabil, sehr gepflegt',
        category: 'Boote & Wassersport',
        subcategory: 'Motorboote',
        price: 690,
        pricePeriod: 'Preis',
        location: 'Marktrodach, Bayern',
        displayLocation: 'Marktrodach, Bayern',
        condition: 'Sehr gut',
        isNegotiable: true,
        is_boosted: false,
        featured: false,
        rating: 4.7,
        reviewsCount: 7,
        publishedDate: '12.09.2026',
        anzeigeNr: 'CP-6906',
        seller_user_id: 'usr_max_weidinger',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Marktrodach'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Motorboote', 'Ich biete', 'Aluboden', 'Paddel inkl.'],
        description: 'Robustes Schlauchboot mit festem Aluboden und Motorspiegel. Inklusive Sitzbänken, Paddeln und Tragetasche.'
    },

    // 7. LMC Explorer Sportline i655 G
    {
        id: 'lst_lmc_explorer',
        slug: 'lmc-explorer-sportline-i655-g-duisburg-lmc65',
        title: 'LMC Explorer Sportline i655 G',
        category: 'Wohnmobile & Camper',
        subcategory: 'Wohnmobile',
        price: 51999,
        pricePeriod: 'Preis',
        location: 'Duisburg Süd, Nordrhein-Westfalen',
        displayLocation: 'Duisburg Süd, NRW',
        condition: 'Gebraucht',
        isNegotiable: true,
        is_boosted: false,
        featured: false,
        rating: 4.8,
        reviewsCount: 14,
        publishedDate: '11.09.2026',
        anzeigeNr: 'CP-6557',
        seller_user_id: 'usr_alpen_caravan',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Duisburg Süd'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1513313778780-9ae4807465f0?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Gebraucht', 'Wohnmobile', 'Ich biete', 'LLT-Aufbau'],
        description: 'Vollintegriertes Wohnmobil LMC Explorer Sportline i655 G mit Heckgarage, Einzelbetten und holzfreier LLT-Technik.'
    },

    // 8. VW T6 Camper Van Bulli, GPS
    {
        id: 'lst_vw_t6_bulli',
        slug: 'vw-t6-camper-van-bulli-gps-erfurt-vt63',
        title: 'VW T6 Camper Van Bulli, GPS',
        category: 'Wohnmobile & Camper',
        subcategory: 'Campingbusse & Vans',
        price: 32500,
        pricePeriod: 'Preis',
        location: 'Erfurt, Thüringen',
        displayLocation: 'Erfurt, Thüringen',
        condition: 'Sehr gut',
        isNegotiable: true,
        is_boosted: true,
        featured: false,
        rating: 4.9,
        reviewsCount: 16,
        publishedDate: '10.09.2026',
        anzeigeNr: 'CP-3258',
        seller_user_id: 'usr_max_weidinger',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Erfurt'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Sehr gut', 'Campingbusse & Vans', 'Ich biete', 'Aufstelldach'],
        description: 'Zweifarbiger VW T6 Camper Van mit Schlafdach/Aufstelldach, Küchenzeile, Standheizung und Navigationssystem.'
    },

    // 9. Fendt Apero Bianco 495
    {
        id: 'lst_fendt_apero',
        slug: 'fendt-apero-bianco-495-herzogenaurach-fb49',
        title: 'Fendt Apero Bianco 495',
        category: 'Wohnmobile & Camper',
        subcategory: 'Wohnwagen',
        price: 79,
        pricePeriod: 'pro Tag',
        location: 'Herzogenaurach, Bayern',
        displayLocation: 'Herzogenaurach, Bayern',
        condition: 'Neu',
        isNegotiable: false,
        is_boosted: true,
        featured: false,
        rating: 4.95,
        reviewsCount: 20,
        publishedDate: '09.09.2026',
        anzeigeNr: 'CP-4959',
        seller_user_id: 'usr_alpen_caravan',
        seller: {
            name: 'Gewerblicher Anbieter',
            verified: true,
            type: 'Gewerblich',
            location: 'Herzogenaurach'
        },
        listing_user_type: 'Gewerblich',
        images: [
            'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Neu', 'Wohnwagen', 'Ich biete', 'Mietfahrzeug'],
        description: 'Neuer Fendt Apero Bianco 495 Wohnwagen zur Miete ab 79 € pro Tag. Modernes Design, gemütliche Betten und voll ausgestattete Küche.'
    },

    // 10. Westfield Ambassador 2
    {
        id: 'lst_westfield_ambassador',
        slug: 'westfield-ambassador-2-trebbin-wa22',
        title: 'Westfield Ambassador 2',
        category: 'Camping Zubehör',
        subcategory: 'Möbel & Einrichtung',
        price: 22,
        pricePeriod: 'Preis',
        location: 'Trebbin, Brandenburg',
        displayLocation: 'Trebbin, Brandenburg',
        condition: 'Like New',
        isNegotiable: false,
        is_boosted: false,
        featured: false,
        rating: 4.8,
        reviewsCount: 8,
        publishedDate: '08.09.2026',
        anzeigeNr: 'CP-2210',
        seller_user_id: 'usr_max_weidinger',
        seller: {
            name: 'Privatverkäufer',
            verified: true,
            type: 'Privat',
            location: 'Trebbin'
        },
        listing_user_type: 'Privat',
        images: [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Like New', 'Möbel & Einrichtung', 'Ich biete'],
        description: 'Westfield Ambassador 2 Camping-Klappstuhl / Beinauflage in neuwertigem Zustand. Hochwertiges 3D Mesh-Gewebe, wetterfest und atmungsaktiv.'
    }
];

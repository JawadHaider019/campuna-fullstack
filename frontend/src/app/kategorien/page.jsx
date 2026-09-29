'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Backpack, 
    Truck, 
    Tent, 
    Bike, 
    Trees, 
    Wrench, 
    Home as HomeIcon, 
    Key, 
    Sailboat, 
    ArrowRight, 
    CheckCircle2, 
    ChevronDown,
    Tag,
    Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import ScrollSectionWrapper from '@/app/components/ScrollSectionWrapper';

// Helper to escape characters for safe JSON-LD embedding (XSS protection)
function safeJsonLd(obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

const CATEGORIES_DATA = [
    {
        id: '1',
        name: 'Camping-Zubehör',
        slug: 'camping-zubehoer',
        cleanUrl: '/kategorie/camping-zubehoer',
        tag: 'AUSRÜSTUNG & ZUBEHÖR',
        icon: Backpack,
        desc: 'Auf Campuna findest du Campingzubehör für Wohnmobile, Wohnwagen, Camper und Zelte. Von Vorzelten und Markisen über bequeme Campingmöbel bis hin zu Solartechnik, Sanitärlösungen und Outdoor-Equipment: Entdecke passende Angebote für deine nächste Tour.',
        subcategories: ['Vorzelte & Markisen', 'Campingmöbel', 'Küche & Grillen', 'Elektrik & Solar', 'Sanitär & Wasser', 'Sonstiges Zubehör']
    },
    {
        id: '2',
        name: 'Wohnmobile & Camper',
        slug: 'wohnmobile-camper',
        cleanUrl: '/kategorie/wohnmobile-camper',
        tag: 'FAHRZEUGE',
        icon: Truck,
        desc: 'Finde dein nächstes mobiles Zuhause oder verkaufe dein Reisefahrzeug. Entdecke gepflegte Kastenwagen, wendige Campervans, geräumige Teil- und Vollintegrierte sowie klassische Wohnwagen von privaten Campern und geprüften Fachhändlern aus ganz Deutschland.',
        subcategories: ['Kastenwagen', 'Alkoven', 'Teilintegriert', 'Vollintegriert', 'Wohnwagen', 'Sonstige Fahrzeuge']
    },
    {
        id: '3',
        name: 'Zelte & Dachzelte',
        slug: 'zelte-dachzelte',
        cleanUrl: '/kategorie/zelte-dachzelte',
        tag: 'UNTERKÜNFTE & ZELTE',
        icon: Tent,
        desc: 'Für echte Freiheit in der Natur: Ob praktisches Dachzelt für den spontanen Wochenendtrip, geräumiges Familienzelt für den Sommerurlaub oder kompaktes Trekkingzelt. Hier findest du neue und gebrauchte Zelte sowie passendes Montagezubehör.',
        subcategories: ['Dachzelte', 'Wurfzelte', 'Familienzelte', 'Kuppelzelte', 'Tunnelzelte']
    },
    {
        id: '4',
        name: 'Fahrräder & Träger',
        slug: 'fahrraeder-traeger',
        cleanUrl: '/kategorie/fahrraeder-traeger',
        tag: 'MOBILITÄT',
        icon: Bike,
        desc: 'Bleib auch am Urlaubsort mobil und flexibel. Finde stabile Heckträger, Deichselträger für Wohnwagen und Kupplungsträger für schwere E-Bikes sowie praktische Klapp- und Falträder, die problemlos in jede Heckgarage passen.',
        subcategories: ['Fahrradträger', 'E-Bikes', 'Mountainbikes', 'Falträder']
    },
    {
        id: '5',
        name: 'Stellplätze & Campingplätze',
        slug: 'stellplaetze',
        cleanUrl: '/kategorie/stellplaetze',
        tag: 'ÜBERNACHTUNG',
        icon: Trees,
        desc: 'Entdecke naturnahe Stellplätze, idyllische Campingplätze und private Übernachtungsmöglichkeiten für Wohnmobile, Caravans und Zelte. Du besitzt ein freies Grundstück oder einen Stellplatz? Inseriere ihn unkompliziert für Gäste.',
        subcategories: ['Stellplätze', 'Campingplätze', 'Private Stellplätze']
    },
    {
        id: '6',
        name: 'Camping-Services',
        slug: 'camping-services',
        cleanUrl: '/kategorie/camping-services',
        tag: 'DIENSTLEISTUNGEN',
        icon: Wrench,
        desc: 'Fachgerechte Unterstützung rund um dein Fahrzeug und deine Ausrüstung: Von Gasprüfungen nach G 607 über Dichtigkeitsmessungen und Solarnachrüstungen bis hin zu professioneller Fahrzeugaufbereitung und individuellem Van-Ausbau.',
        subcategories: ['Reparatur & Wartung', 'Fahrzeugaufbereitung', 'Tuning & Ausbau', 'Transport']
    },
    {
        id: '7',
        name: 'Tiny Houses',
        slug: 'tiny-houses',
        cleanUrl: '/kategorie/tiny-houses',
        tag: 'WOHNEN & FREIZEIT',
        icon: HomeIcon,
        desc: 'Minimalistisches und nachhaltiges Wohnen im Grünen: Entdecke bezugsfertige Tiny Houses, winterfeste Mobilheime, gemütliche Bauwagen und modulare Wohnlösungen für Camping-Grundstücke, Ferienanlagen und dauerhaftes Wohnen.',
        subcategories: ['Mobilheime', 'Tiny Houses', 'Bauwagen']
    },
    {
        id: '8',
        name: 'Mieten & Vermieten',
        slug: 'mieten-vermieten',
        cleanUrl: '/kategorie/mieten-vermieten',
        tag: 'VERMIETUNG',
        icon: Key,
        desc: 'Das passende Reisefahrzeug einfach mieten oder das eigene Wohnmobil in ungenutzten Wochen vermieten: Finde transparente Mietangebote für Kastenwagen, Alkoven und Wohnwagen direkt von privaten Vermietern und regionalen Vermietstationen.',
        subcategories: ['Wohnmobil mieten', 'Wohnwagen mieten', 'Zubehör mieten']
    },
    {
        id: '9',
        name: 'Boote & Wassersport',
        slug: 'boote-wassersport',
        cleanUrl: '/kategorie/boote-wassersport',
        tag: 'WASSERSPORT',
        icon: Sailboat,
        desc: 'Kombiniere Camping mit Abenteuern auf dem Wasser: Finde Motorboote, wendige Schlauchboote, Kajaks, Kanus, Stand-Up-Paddleboards (SUPs) sowie Sicherheitsausrüstung und Außenbordmotoren für deinen nächsten Urlaub am See oder Meer.',
        subcategories: ['Motorboote', 'Segelboote', 'Schlauchboote', 'Kajaks & SUPs', 'Wassersportausrüstung', 'Zubehör & Sonstiges']
    }
];

const POPULAR_SEARCHES = [
    { label: 'Wohnmobil gebraucht kaufen', href: '/kategorie/wohnmobile-camper' },
    { label: 'Vorzelt für Wohnwagen', href: '/kategorie/camping-zubehoer' },
    { label: 'Dachzelt', href: '/kategorie/zelte-dachzelte' },
    { label: 'Tiny House kaufen', href: '/kategorie/tiny-houses' },
    { label: 'Kastenwagen gebraucht', href: '/kategorie/wohnmobile-camper' },
    { label: 'Stellplatz Wohnmobil', href: '/kategorie/stellplaetze' },
    { label: 'Gasprüfung Wohnmobil', href: '/kategorie/camping-services' },
    { label: 'Fahrradträger Wohnmobil', href: '/kategorie/fahrraeder-traeger' }
];

const HUB_FAQS = [
    {
        id: 'hub_faq_1',
        question: 'Welche Kategorien gibt es auf Campuna?',
        answer: 'Campuna hat neun Kategorien: Camping-Zubehör, Wohnmobile und Camper, Zelte und Dachzelte, Fahrräder und Träger, Stellplätze und Campingplätze, Camping-Services, Tiny Houses, Mieten und Vermieten sowie Boote und Wassersport. So findest du alles rund ums Camping an einem Ort.'
    },
    {
        id: 'hub_faq_2',
        question: 'In welche Kategorie gehört mein Inserat?',
        answer: 'Wähle die Kategorie, in der Käufer dein Angebot suchen würden: Fahrzeuge unter Wohnmobile und Camper, Ausrüstung unter Camping-Zubehör, Übernachtungsplätze unter Stellplätze und Campingplätze. Beim Erstellen deines Inserats schlägt dir Campuna die passende Unterkategorie vor. Die Kategorie kannst du später jederzeit ändern.'
    },
    {
        id: 'hub_faq_3',
        question: 'Kann ich in allen Kategorien kostenlos inserieren?',
        answer: 'Ja. Private Inserate sind in allen neun Kategorien kostenlos, ohne Provision und ohne versteckte Gebühren. Gewerbliche Anbieter wie Händler, Vermieter oder Werkstätten präsentieren sich mit einem Anbieterprofil. Die Konditionen dafür findest du auf der Seite Preise.'
    },
    {
        id: 'hub_faq_4',
        question: 'Was ist der Unterschied zwischen Marktplatz und Kategorien?',
        answer: 'Der Marktplatz zeigt dir alle aktuellen Inserate aus ganz Deutschland in einer Liste mit Filtern. Die Kategorien führen dich direkt zu einem Themenbereich, zum Beispiel nur Wohnmobile oder nur Zelte. Beide Wege führen zu denselben Angeboten, du startest nur unterschiedlich.'
    }
];

// Structured Data Schemas
const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Startseite",
            "item": "https://campuna.de/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Kategorien",
            "item": "https://campuna.de/kategorien"
        }
    ]
};

const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://campuna.de/kategorien#collection",
    "url": "https://campuna.de/kategorien",
    "name": "Alle Camping-Kategorien im Überblick",
    "inLanguage": "de-DE",
    "isPartOf": {
        "@id": "https://campuna.de/#website"
    },
    "about": {
        "@id": "https://campuna.de/#organization"
    },
    "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": 9,
        "itemListElement": CATEGORIES_DATA.map((cat, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": cat.name,
            "url": `https://campuna.de${cat.cleanUrl}`
        }))
    }
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://campuna.de/kategorien#faq",
    "mainEntity": HUB_FAQS.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
        }
    }))
};

// Reusable Category Card (Memoized for optimal 60/120 FPS scrolling)
const CategoryDetailCard = React.memo(function CategoryDetailCard({ cat, index }) {
    const Icon = cat.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (index % 3) * 0.08, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="bg-white border border-forest/10 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 group will-change-transform"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-colors duration-300">
                            <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-gold">
                            {cat.tag}
                        </span>
                    </div>
                </div>

                <h3 className="font-display text-xl font-bold text-forest group-hover:text-gold transition-colors duration-200">
                    <Link href={cat.cleanUrl}>
                        {cat.name}
                    </Link>
                </h3>

                <p className="font-sans text-xs text-charcoal/75 leading-relaxed font-light">
                    {cat.desc}
                </p>

                {/* Subcategory Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                    {cat.subcategories.map((sub, sIdx) => (
                        <Link
                            key={sIdx}
                            href={cat.cleanUrl}
                            className="text-[10px] font-sans font-medium text-charcoal/70 bg-sand/40 hover:bg-forest hover:text-white px-2.5 py-1 rounded-md transition-colors duration-200 border border-forest/5"
                        >
                            {sub}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-forest/5">
                <Link
                    href={cat.cleanUrl}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors duration-200 group/link"
                >
                    <span>Zur Kategorie</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-1.5 transition-transform text-gold" />
                </Link>
            </div>
        </motion.div>
    );
});

export default function KategorienHubPage() {
    const [openFaqId, setOpenFaqId] = useState('hub_faq_1');

    const toggleFaq = useCallback((id) => {
        setOpenFaqId(prev => prev === id ? null : id);
    }, []);

    // Memoize JSON-LD structured schemas to prevent unnecessary recalculations
    const jsonLdData = React.useMemo(() => ({
        breadcrumb: safeJsonLd(breadcrumbSchema),
        collection: safeJsonLd(collectionSchema),
        faq: safeJsonLd(faqSchema)
    }), []);

    return (
        <>
            {/* Schema.org Structured Data with XSS-safe serialization */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdData.breadcrumb }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdData.collection }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdData.faq }}
            />

            <div className="bg-white min-h-screen relative font-sans text-charcoal">
                
                {/* ── 1. HERO SECTION (Compact cinematic style matching Inserate & Category pages) ── */}
                <motion.section
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="relative min-h-[32vh] sm:min-h-[36vh] md:min-h-[40vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 shadow-xl border border-forest/10 will-change-transform"
                >
                    {/* Background Cinematic Image with Zoom Animation */}
                    <div className="absolute inset-0 z-0">
                        <motion.div
                            initial={{ scale: 1.12, opacity: 0 }}
                            animate={{ scale: 1.0, opacity: 1 }}
                            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full h-full"
                        >
                            <img
                                src="/hero-campuna.webp"
                                alt="Alle Camping-Kategorien auf Campuna"
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                        {/* Deep luxurious multi-layered gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />
                    </div>

                    {/* Floating Sparkles Background Effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.12),transparent_50%)] pointer-events-none" />

                    {/* Hero Content */}
                    <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 sm:py-10 flex flex-col justify-center items-center w-full text-center">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="font-sans text-[9px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block mb-2"
                        >
                            KATEGORIEN
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
                            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 drop-shadow-xl leading-[1.15]"
                        >
                            Camping hat viele Seiten.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-beige to-white">
                                Wir bringen sie zusammen.
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="font-sans text-xs sm:text-sm md:text-base text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                        >
                            Campuna bündelt alles rund ums Camping in neun Kategorien: von Fahrzeugen über Ausrüstung bis zu Stellplätzen und Services. Wähle deine Kategorie und entdecke Angebote aus ganz Deutschland, oder inseriere kostenlos, was du abgeben möchtest.
                        </motion.p>
                    </div>
                </motion.section>

                {/* ── 2. BREADCRUMBS BELOW HERO ── */}
                <ScrollSectionWrapper delay={0.05}>
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-2">
                        <Breadcrumbs items={[{ label: 'Kategorien', href: '/kategorien' }]} variant="light" />
                    </div>
                </ScrollSectionWrapper>

                {/* ── 3. MAIN CONTENT CONTAINER ── */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 sm:space-y-16">

                    {/* 3.1 Quick Category Icon Strip */}
                    <ScrollSectionWrapper delay={0.08}>
                        <div className="flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-9 gap-2.5 sm:gap-3 pb-3 lg:pb-0 no-scrollbar snap-x items-stretch">
                            {CATEGORIES_DATA.map((cat, index) => {
                                const Icon = cat.icon;
                                return (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.03, duration: 0.4 }}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        className="bg-white border border-forest/10 hover:border-gold/50 p-2.5 sm:p-3.5 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col items-center justify-center text-center cursor-pointer min-w-[105px] sm:min-w-[120px] lg:min-w-0 lg:w-full min-h-[105px] sm:min-h-[115px] shrink-0 lg:shrink snap-start"
                                    >
                                        <Link
                                            href={cat.cleanUrl}
                                            className="flex flex-col items-center justify-center text-center w-full h-full"
                                        >
                                            <div className="p-2.5 rounded-xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-all duration-300 mb-2 shrink-0 shadow-inner">
                                                <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                                            </div>
                                            <span className="font-display text-[10.5px] sm:text-xs font-semibold text-charcoal group-hover:text-forest leading-tight tracking-tight line-clamp-2 h-[2.2em] flex items-center justify-center text-center">
                                                {cat.name}
                                            </span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ScrollSectionWrapper>

                    {/* 3.2 Trust & Stats Strip */}
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="bg-forest text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md border border-forest/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center sm:text-left text-xs font-sans">
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                    <span><strong>9 Kategorien</strong> für alles rund ums Camping</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                    <span>Angebote aus <strong>ganz Deutschland</strong></span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                    <span>Private Inserate <strong>kostenlos & ohne Provision</strong></span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                    <span><strong>Direkter Kontakt</strong> ohne Zwischenhändler</span>
                                </div>
                            </div>
                        </div>
                    </ScrollSectionWrapper>

                    {/* 3.3 Detailed Category Exploration Grid */}
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="space-y-8">
                            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    ALLE KATEGORIEN
                                </span>
                                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                    Finde deinen Bereich
                                </h2>
                                <p className="font-sans text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                                    Jede Kategorie hat eigene Unterkategorien und Filter. Hier siehst du auf einen Blick, was wohin gehört und was dich in jedem Bereich erwartet.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {CATEGORIES_DATA.map((cat, idx) => (
                                    <CategoryDetailCard key={cat.id} cat={cat} index={idx} />
                                ))}
                            </div>
                        </div>
                    </ScrollSectionWrapper>

                    {/* 3.4 Popular Searches */}
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="bg-sand/30 border border-forest/10 rounded-3xl p-6 sm:p-8 space-y-4">
                            <div className="space-y-1">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    BELIEBTE SUCHEN
                                </span>
                                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest">
                                    Wonach andere gerade suchen
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {POPULAR_SEARCHES.map((search, idx) => (
                                    <Link
                                        key={idx}
                                        href={search.href}
                                        className="bg-white border border-forest/10 hover:border-gold hover:text-forest text-charcoal px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
                                    >
                                        {search.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ScrollSectionWrapper>

                    {/* 3.5 Seller CTA Banner (with decorative right-side icons matching CTA.jsx) */}
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden bg-gradient-to-br from-forest via-forest to-[#143d29] px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-16 shadow-xl border border-white/5 group">
                            {/* Subtle background glows */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-black/40 rounded-full blur-3xl pointer-events-none" />

                            {/* Grid Layout splits visual content */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

                                {/* Left Column: Headline, text and Action */}
                                <div className="lg:col-span-8 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
                                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                        VERKAUFEN
                                    </span>

                                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                                        Egal welche Kategorie: Dein Inserat ist in Minuten online.
                                    </h2>

                                    <p className="font-sans text-sm sm:text-base text-sand/85 font-light leading-relaxed max-w-xl pb-2">
                                        Wähle die passende Kategorie, lade Fotos hoch, fertig. Privat kostenlos, ohne Provision.
                                    </p>

                                    <Link
                                        href="/registrieren"
                                        className="relative w-full max-w-[300px] sm:w-[300px] bg-gradient-to-r from-gold to-beige hover:brightness-110 text-forest font-sans font-bold py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] sm:text-[12px] uppercase tracking-wider shadow-lg active:scale-95 mx-auto lg:mx-0 cursor-pointer"
                                    >
                                        <span>Kostenlos inserieren</span>
                                        <ArrowRight className="w-4 h-4 absolute right-5 shrink-0" />
                                    </Link>
                                </div>

                                {/* Right Column: Decorative Selling Icon Graphics (Matching CTA.jsx aesthetic) */}
                                <div className="relative lg:col-span-4 hidden lg:block items-center justify-center lg:justify-end">
                                    <div className="absolute top-0 -right-20 flex items-center justify-center text-gold/20 transform -rotate-12 group-hover:text-gold/30 transition-colors duration-700 pointer-events-none">
                                        <Tag className="w-48 h-48 sm:w-64 sm:h-64 stroke-[1.2]" />
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 flex items-center justify-center text-gold/15 transform rotate-12 group-hover:text-gold/25 transition-colors duration-700 pointer-events-none">
                                        <Sparkles className="w-28 h-28 sm:w-36 sm:h-36 stroke-[1.2]" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </ScrollSectionWrapper>

                    {/* 3.6 FAQ Accordion Section */}
                    <ScrollSectionWrapper delay={0.05}>
                        <section id="faq" className="py-10 sm:py-16 bg-white relative overflow-hidden scroll-mt-24">
                            <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    HÄUFIG GESTELLTE FRAGEN
                                </span>
                                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                    Häufige Fragen zu den Kategorien
                                </h2>
                                <p className="font-sans text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                                    Wichtige Informationen und Tipps zu den Camping-Bereichen auf Campuna, kurz beantwortet.
                                </p>
                            </div>

                            <div className="max-w-5xl mx-auto space-y-4">
                                {HUB_FAQS.map((faq, idx) => {
                                    const isOpen = openFaqId === faq.id;
                                    return (
                                        <motion.div
                                            key={faq.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05, duration: 0.35 }}
                                            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen
                                                ? 'border-gold bg-sand/20 shadow-md'
                                                : 'border-forest/10 bg-white hover:border-forest/30'
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleFaq(faq.id)}
                                                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                            >
                                                <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                                    {faq.question}
                                                </span>
                                                <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-gold/10 text-gold' : 'bg-sand text-forest'}`}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    >
                                                        <div className="px-6 sm:px-8 pb-6 font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line">
                                                            {faq.answer}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    </ScrollSectionWrapper>

                </main>
            </div>
        </>
    );
}

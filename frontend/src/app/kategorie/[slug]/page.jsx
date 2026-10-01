'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Eye, Search, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/data';
import { getAllListings } from '@/api/listings';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import CategoriesSection from '@/app/components/CategoriesSection';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import ScrollSectionWrapper from '@/app/components/ScrollSectionWrapper';
import { getImageUrl } from '@/utils/imageUrl';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import { isListingBoosted } from '@/utils/sellerBadge';

// ─── XSS-Safe JSON-LD Serializer ─────────────────────────────────────────────
function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

// ─── Map URL Slugs to Internal Category Names ────────────────────────────────
const SLUG_TO_CATEGORY = {
    'ausrüstung-und-zubehör': 'Camping Zubehör',
    'ausruestung-und-zubehoer': 'Camping Zubehör',
    'camping-zubehoer': 'Camping Zubehör',
    'fahrzeuge': 'Wohnmobile & Camper',
    'wohnmobile-camper': 'Wohnmobile & Camper',
    'zelte-and-dachzelte': 'Zelte & Dachzelte',
    'zelte-dachzelte': 'Zelte & Dachzelte',
    'fahrräder-träger': 'Fahrräder & Träger',
    'fahrraeder-traeger': 'Fahrräder & Träger',
    'campingplätze-stellplätze': 'Stellplätze & Campingplätze',
    'campingplaetze-stellplaetze': 'Stellplätze & Campingplätze',
    'stellplaetze': 'Stellplätze & Campingplätze',
    'dienstleistungen': 'Camping Services',
    'camping-services': 'Camping Services',
    'tiny-houses': 'Tiny Houses',
    'mieten-vermieten': 'Mieten & Vermieten',
    'boote-wassersport': 'Boote & Wassersport',
};

const CATEGORY_SUBCATEGORIES = {
    'Camping Zubehör': [
        'Vorzelte & Markisen',
        'Campingmöbel',
        'Küche & Grillen',
        'Elektrik & Solar',
        'Sanitär & Wasser',
        'Sonstiges Zubehör'
    ],
    'Wohnmobile & Camper': [
        'Kastenwagen',
        'Alkoven',
        'Teilintegriert',
        'Vollintegriert',
        'Wohnwagen',
        'Sonstige Fahrzeuge'
    ],
    'Zelte & Dachzelte': [
        'Dachzelte',
        'Wurfzelte',
        'Familienzelte',
        'Kuppelzelte',
        'Tunnelzelte'
    ],
    'Fahrräder & Träger': [
        'Fahrradträger',
        'E-Bikes',
        'Mountainbikes',
        'Falträder'
    ],
    'Stellplätze & Campingplätze': [
        'Stellplätze',
        'Campingplätze',
        'Private Stellplätze'
    ],
    'Camping Services': [
        'Reparatur & Wartung',
        'Fahrzeugaufbereitung',
        'Tuning & Ausbau',
        'Transport'
    ],
    'Tiny Houses': [
        'Mobilheime',
        'Tiny Houses',
        'Bauwagen'
    ],
    'Mieten & Vermieten': [
        'Wohnmobil mieten',
        'Wohnwagen mieten',
        'Zubehör mieten'
    ],
    'Boote & Wassersport': [
        'Motorboote',
        'Segelboote',
        'Schlauchboote',
        'Kajaks & SUPs',
        'Wassersportausrüstung',
        'Zubehör & Sonstiges'
    ]
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildListingSlug(title = '', id = '') {
    const cleanTitle = title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return cleanTitle || id;
}

function formatLocation(location) {
    if (!location) return 'Deutschland';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) return location.address;
    return 'Deutschland';
}

function mapListing(item) {
    let rawImages = [];
    const mainImg = item['Main Image'] || item.MainImage;
    if (mainImg) {
        rawImages.push(mainImg);
    }
    if (item.images && Array.isArray(item.images)) {
        item.images.forEach(img => {
            if (img && img !== mainImg && !rawImages.includes(img)) {
                rawImages.push(img);
            }
        });
    } else if (item.images && typeof item.images === 'string') {
        if (item.images !== mainImg) {
            rawImages.push(item.images);
        }
    }

    let images = rawImages
        .filter(Boolean)
        .map(url => {
            url = url.startsWith('//') ? `https:${url}` : url;
            if (/\.heic$/i.test(url.split('?')[0]) && url.includes('cdn.bubble.io')) {
                url = url.replace(
                    /(https:\/\/[^/]+\.cdn\.bubble\.io\/)(f[0-9x]+\/)/,
                    '$1cdn-cgi/image/f=auto,fit=cover/$2'
                );
            }
            return getImageUrl(url, null);
        })
        .filter(Boolean);

    let category = item.category || item.Category || 'Camping Zubehör';
    if (category === 'Ausrüstung und Zubehör') category = 'Camping Zubehör';

    const id = item.id || item._id || 'listing-item';
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const rating = item.rating || parseFloat((4.5 + (sum % 6) * 0.1).toFixed(1));

    const location = item['location geo']?.address || item.location || 'Deutschland';
    const displayLocation = formatLocation(location);
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    
    let pricePeriod = item.pricePeriod || 'Preis';
    if (!item.pricePeriod) {
        if (category === 'Mieten & Vermieten' || (item.subcategory && item.subcategory.toLowerCase().includes('mieten')) || (item['Sub - Category'] && item['Sub - Category'].toLowerCase().includes('mieten'))) {
            pricePeriod = 'pro Tag';
        } else if (category === 'Wohnmobile & Camper' || category === 'Tiny Houses') {
            pricePeriod = 'Kaufpreis';
        }
    }

    const features = [];
    if (item.condition || item['Condition item']) {
        const rawCond = item.condition || item['Condition item'];
        const condMapping = { 'New': 'Neu', 'Used': 'Gebraucht', 'Good': 'Sehr gut' };
        features.push(condMapping[rawCond] || rawCond);
    }
    if (item.subcategory || item['Sub - Category']) {
        features.push(item.subcategory || item['Sub - Category']);
    }
    if (item['Type of offer']) {
        features.push(item['Type of offer']);
    }
    if (Array.isArray(item.features) && item.features.length > 0) {
        item.features.forEach(f => {
            if (!features.includes(f)) features.push(f);
        });
    }
    if (features.length === 0) {
        features.push('Camping');
    }

    const resolvedSellerType = item.listing_user_type || item.seller?.type || (category === 'Mieten & Vermieten' || (item.subcategory && item.subcategory.toLowerCase().includes('mieten')) ? 'Gewerblich' : 'Privat');
    const sellerName = item.seller?.name || (resolvedSellerType === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer');
    const isPioneer = Boolean(item.is_pioneer || item.seller?.is_pioneer || item.seller?.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER'));

    const sellerRole = item.seller_role || item.role || item.seller?.role || '';
    const isAdmin = Boolean(
        sellerRole === 'ADMIN' ||
        item.is_admin === true ||
        item.seller?.is_admin === true ||
        item.is_campuna_club === true ||
        item.seller?.is_campuna_club === true
    );

    const isBoosted = Boolean(
        item.is_boosted ||
        (item.boosted_until && new Date(item.boosted_until) > new Date()) ||
        isAdmin
    );
    const isFeatured = Boolean(item.featured);

    const sellerTier = isAdmin ? 'ADMIN' : (
        item.seller?.tier ||
        item.company_tier ||
        item.seller_tier ||
        item.tier ||
        'FREE'
    );

    return {
        id,
        slug: item.slug || buildListingSlug(item.title || '', id),
        title: item.title || item.description || 'Camping Angebot',
        category,
        subCategory: item.subcategory || item['Sub - Category'] || '',
        price,
        pricePeriod,
        location,
        displayLocation,
        rating,
        reviewsCount: (sum % 15) + 3,
        images,
        seller_role: sellerRole,
        role: sellerRole,
        is_admin: isAdmin,
        is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club),
        is_pioneer: isPioneer,
        seller: {
            name: isAdmin ? 'Campuna' : sellerName,
            verified: true,
            type: isAdmin ? 'Admin' : resolvedSellerType,
            tier: sellerTier,
            role: sellerRole,
            is_admin: isAdmin,
            is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club),
            is_pioneer: isPioneer,
            achievements: item.seller?.achievements || (isPioneer ? [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }] : [])
        },
        listing_user_type: isAdmin ? 'Admin' : resolvedSellerType,
        seller_tier: sellerTier,
        company_tier: sellerTier,
        tier: sellerTier,
        features,
        isExclusive: sum % 3 === 0,
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted,
        created_at: item.created_at
    };
}

import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';

// ─── Memoized Listing Card Component ─────────────────────────────────────────
const ListingCard = memo(function ListingCard({ item }) {
    const router = useRouter();
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgIdx, setImgIdx] = useState(0);
    const [imgFailed, setImgFailed] = useState(false);

    const handleImgError = useCallback(() => {
        if (item.images && imgIdx < item.images.length - 1) {
            setImgIdx(i => i + 1);
        } else {
            setImgFailed(true);
        }
    }, [imgIdx, item.images]);

    const handleCardClick = useCallback(() => {
        const slug = item.slug || buildListingSlug(item.title, item.id);
        router.push(`/inserate/${encodeURIComponent(slug)}`);
    }, [item.slug, item.title, item.id, router]);

    const displayLoc = item.displayLocation || item.location || '';
    const cityOnly = displayLoc.split(',')[0].trim();
    const isBoosted = isListingBoosted(item);
    const hasImage = item.images && item.images.length > 0 && !imgFailed;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={handleCardClick}
            className={`group relative flex flex-col rounded-[16px] sm:rounded-[24px] overflow-hidden transition-all duration-300 cursor-pointer h-full select-none will-change-transform ${isBoosted
                ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)]'
                : 'bg-white border border-forest/5 hover:border-forest/10 hover:shadow-xl'
                }`}
        >
            {/* Image Area */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                {hasImage ? (
                    <img
                        src={item.images[imgIdx]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none will-change-transform"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={handleImgError}
                    />
                ) : (
                    <ListingImagePlaceholder category={item.category} />
                )}

                {/* Top badge row */}
                <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-center justify-between z-20 gap-1.5">
                    <ListingBadgesRow item={item} />

                    <button
                        type="button"
                        aria-label={isFavorite ? 'Von Merkzettel entfernen' : 'Auf den Merkzettel'}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                        className={`w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer pointer-events-auto shrink-0 ${isFavorite
                            ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                            : 'bg-white/80 hover:bg-white text-forest hover:text-rose-500 hover:scale-110'
                            }`}
                    >
                        <Heart className={`w-3 sm:w-4 h-3 sm:h-4 ${isFavorite ? 'fill-current text-white' : ''}`} />
                    </button>
                </div>

                {/* Location overlay */}
                <div className="absolute bottom-2 sm:bottom-4 right-0 inset-x-2 sm:inset-x-4 flex items-center justify-end pointer-events-none text-white/90 max-w-full z-10">
                    <div className="bg-black/40 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] flex items-center gap-1 truncate max-w-[90%]">
                        <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gold shrink-0" />
                        <span className="truncate">
                            <span className="inline md:hidden">{cityOnly}</span>
                            <span className="hidden md:inline">{displayLoc}</span>
                        </span>
                    </div>
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white text-forest px-4 sm:px-5 py-2 sm:py-3 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                        <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        <span>Inserat ansehen</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="font-display text-xs sm:text-base lg:text-lg font-bold text-black group-hover:text-gold transition-colors duration-200 mb-1.5 sm:mb-2 line-clamp-2 leading-tight">
                        {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {item.features.slice(0, 2).map((feat, idx) => (
                            <span
                                key={idx}
                                className="text-[8px] sm:text-[10px] text-charcoal/60 bg-sand px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-forest/5"
                            >
                                {feat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="pt-1.5 sm:pt-2 border-t border-forest/5 flex items-end justify-between">
                    <div>
                        <span className="block text-[8px] sm:text-[10px] uppercase tracking-widest text-charcoal/40 font-mono">
                            {item.pricePeriod}
                        </span>
                        <span className="font-display text-sm sm:text-xl font-extrabold text-forest">
                            {item.price > 0 ? `${item.price.toLocaleString('de-DE')} €` : 'Preis VB'}
                        </span>
                    </div>
                    <span className="font-sans text-[8px] sm:text-xs font-bold text-forest group-hover:text-gold flex items-center space-x-1 transition-colors">
                        <span>Details</span>
                        <span className="transform group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

// ─── Main Category Page Component ────────────────────────────────────────────
export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug ? decodeURIComponent(params.slug) : '';
    const categoryName = SLUG_TO_CATEGORY[slug] || '';

    const categoryInfo = CATEGORIES.find(c => c.name === categoryName || c.slug === slug) || {};

    const heroTitle = categoryInfo.heroTitle || categoryName || 'Alle Angebote';
    const heroSubtitle = categoryInfo.heroSubtitle || '';

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(20);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [openFaqId, setOpenFaqId] = useState('cat_faq_0');

    const subcategories = categoryName ? (CATEGORY_SUBCATEGORIES[categoryName] || []) : [];

    // Reset pagination and search when category changes
    useEffect(() => {
        setVisibleCount(20);
        setSearchKeyword('');
        setSelectedSubcategory('');
    }, [slug]);

    useEffect(() => {
        let active = true;
        const fetchCategoryListings = async () => {
            setLoading(true);
            try {
                const res = await getAllListings();
                let all = [];
                if (res.success && Array.isArray(res.data?.listings)) {
                    all = res.data.listings.map(mapListing).filter(Boolean);
                }

                const filtered = categoryName
                    ? all.filter(l => l.category.toLowerCase() === categoryName.toLowerCase())
                    : all;

                // Deduplicate
                const seen = new Set();
                const uniqueFiltered = filtered.filter(item => {
                    const key = item?.id || item?.slug || item?.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                if (active) setListings(uniqueFiltered);
            } catch (err) {
                console.error('Error fetching category listings from database:', err);
                if (active) setListings([]);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchCategoryListings();
        return () => { active = false; };
    }, [slug, categoryName]);

    const handleResetFilters = useCallback(() => {
        setSearchKeyword('');
        setSelectedSubcategory('');
    }, []);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + 20);
    }, []);

    const handleToggleFaq = useCallback((faqId) => {
        setOpenFaqId(prev => prev === faqId ? null : faqId);
    }, []);

    // In-category filtering & priority sorting
    const displayedListings = useMemo(() => {
        const filtered = listings.filter(item => {
            if (selectedSubcategory) {
                const cleanSub = selectedSubcategory.toLowerCase().trim();
                const itemSub = (item.subCategory || item.subcategory || '').toLowerCase().trim();
                const features = Array.isArray(item.features) ? item.features.map(f => String(f).toLowerCase()) : [];
                const featuresText = features.join(' ');
                const titleText = (item.title || '').toLowerCase();
                const descText = (item.description || '').toLowerCase();
                const fullItemContent = `${itemSub} ${featuresText} ${titleText} ${descText}`;

                let matchesSub = false;
                if (itemSub && (itemSub === cleanSub || itemSub.includes(cleanSub) || cleanSub.includes(itemSub))) {
                    matchesSub = true;
                } else if (features.some(f => f === cleanSub || f.includes(cleanSub) || cleanSub.includes(f))) {
                    matchesSub = true;
                } else {
                    const tokens = cleanSub
                        .split(/[\s&,/+]+/)
                        .map(t => t.trim())
                        .filter(t => t.length > 2);

                    matchesSub = tokens.some(tok => {
                        if (fullItemContent.includes(tok)) return true;
                        const stem = tok.replace(/(e|en|er|n|s)$/i, '');
                        return stem.length >= 3 && fullItemContent.includes(stem);
                    });
                }

                if (!matchesSub) return false;
            }
            if (searchKeyword.trim()) {
                const kw = searchKeyword.toLowerCase().trim();
                const tokens = kw.split(/\s+/).filter(Boolean);
                const text = [
                    item.title || '',
                    item.description || '',
                    item.subCategory || item.subcategory || '',
                    ...(Array.isArray(item.features) ? item.features : []),
                    item.location || '',
                    item.displayLocation || ''
                ].join(' ').toLowerCase();
                if (!tokens.every(tok => text.includes(tok))) return false;
            }
            return true;
        });

        const isItemBoosted = (item) => Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));

        return filtered.sort((a, b) => {
            const aBoost = isItemBoosted(a) ? 1 : 0;
            const bBoost = isItemBoosted(b) ? 1 : 0;
            if (bBoost !== aBoost) return bBoost - aBoost;

            const aFeat = a.featured ? 1 : 0;
            const bFeat = b.featured ? 1 : 0;
            if (bFeat !== aFeat) return bFeat - aFeat;

            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
    }, [listings, selectedSubcategory, searchKeyword]);

    const faqs = categoryInfo.faqs || [];

    const categoryStructuredData = useMemo(() => ({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                name: heroTitle,
                description: heroSubtitle || `Entdecke aktuelle Angebote in der Kategorie ${categoryName} auf Campuna.`,
                url: `https://campuna.de/kategorie/${slug}`,
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: displayedListings.length,
                    itemListElement: displayedListings.slice(0, 10).map((item, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: item.title,
                        url: `https://campuna.de/inserate/${item.slug || item.id}`
                    }))
                }
            },
            ...(faqs.length > 0 ? [{
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer
                    }
                }))
            }] : [])
        ]
    }), [heroTitle, heroSubtitle, categoryName, slug, displayedListings, faqs]);

    return (
        <>
            {/* Schema.org Structured Data (CollectionPage + FAQPage) with XSS safe serialization */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(categoryStructuredData) }}
            />
            <div className="bg-white min-h-screen relative font-sans text-charcoal overflow-x-hidden">
                {/* ── 1. HERO SECTION (Identical cinematic style as Inserate Hero) ── */}
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
                                alt={`${heroTitle} - Camping-Marktplatz Deutschland`}
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                        {/* Deep luxurious multi-layered gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />
                    </div>

                    {/* Floating Glow Effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.12),transparent_50%)] pointer-events-none" />

                    {/* Hero Content */}
                    <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 sm:py-10 flex flex-col justify-center items-center w-full text-center">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="font-sans text-[9px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-gold block mb-2"
                        >
                            {categoryName ? `Kategorie • ${categoryName}` : 'Camping-Marktplatz Deutschland'}
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-xl leading-tight"
                        >
                            {heroTitle}
                        </motion.h1>
                        {heroSubtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.35 }}
                                className="font-sans text-xs sm:text-sm md:text-base text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                            >
                                {heroSubtitle}
                            </motion.p>
                        )}
                    </div>
                </motion.section>

                {/* ── Breadcrumbs below Hero ── */}
                <ScrollSectionWrapper delay={0.05}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                        <Breadcrumbs
                            items={[
                                { label: 'Inserate', href: '/inserate' },
                                { label: categoryName || heroTitle }
                            ]}
                            variant="light"
                        />
                    </div>
                </ScrollSectionWrapper>

                {/* ── Subcategory Pills Bar ── */}
                {subcategories.length > 0 && (
                    <ScrollSectionWrapper delay={0.08}>
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSubcategory('')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${selectedSubcategory === ''
                                        ? 'bg-forest text-white shadow-sm'
                                        : 'bg-sand/40 hover:bg-sand/70 text-charcoal/80 border border-forest/10'
                                        }`}
                                >
                                    Alle ({listings.length})
                                </button>
                                {subcategories.map((sub, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? '' : sub)}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${selectedSubcategory === sub
                                            ? 'bg-forest text-white shadow-sm'
                                            : 'bg-sand/30 hover:bg-sand/60 text-charcoal/80 border border-forest/10'
                                            }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </ScrollSectionWrapper>
                )}

                {/* ── Products Grid ── */}
                <ScrollSectionWrapper delay={0.1}>
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-forest/5">
                            <span className="text-xs font-mono text-charcoal/60 uppercase tracking-widest">
                                {displayedListings.length} {displayedListings.length === 1 ? 'Inserat' : 'Inserate'} in dieser Kategorie
                            </span>
                            {(searchKeyword || selectedSubcategory) && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="text-xs font-bold text-gold hover:text-forest uppercase tracking-wider cursor-pointer"
                                >
                                    Filter zurücksetzen
                                </button>
                            )}
                        </div>

                        {loading ? (
                            // Skeleton
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="rounded-[16px] sm:rounded-[24px] overflow-hidden border border-forest/5 animate-pulse">
                                        <div className="aspect-[16/9] bg-sand/40" />
                                        <div className="p-3 sm:p-4 space-y-3">
                                            <div className="h-5 bg-sand/60 rounded-full w-3/4" />
                                            <div className="h-3 bg-sand/40 rounded-full w-1/2" />
                                            <div className="h-6 bg-sand/60 rounded-full w-1/3 mt-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayedListings.length === 0 ? (
                            <div className="text-center py-20 bg-sand/20 rounded-[32px] border border-dashed border-forest/10 px-4">
                                <Search className="w-10 h-10 text-forest/40 mx-auto mb-3" />
                                <p className="font-display text-lg text-forest font-bold mb-2">
                                    Keine passenden Inserate gefunden
                                </p>
                                <p className="text-xs text-charcoal/60 max-w-md mx-auto mb-6">
                                    Probiere einen anderen Suchbegriff oder setze die Unterkategorie zurück, um alle Angebote dieser Kategorie zu sehen.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="bg-forest text-sand text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full hover:bg-gold hover:text-forest transition-colors duration-300 cursor-pointer"
                                >
                                    Alle Inserate dieser Kategorie anzeigen
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {displayedListings.slice(0, visibleCount).map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                            viewport={{ once: true, margin: '-40px' }}
                                            transition={{ delay: (idx % 4) * 0.08, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                                            className="h-full"
                                        >
                                            <ListingCard item={item} />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {displayedListings.length > visibleCount && (
                                    <div className="flex justify-center mt-12 mb-4">
                                        <button
                                            type="button"
                                            onClick={handleLoadMore}
                                            className="bg-forest text-white text-xs font-semibold uppercase tracking-wider py-4 px-8 rounded-full border border-forest/10 shadow-md hover:bg-gold hover:text-forest hover:border-gold hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer font-sans"
                                        >
                                            Mehr Angebote laden
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </ScrollSectionWrapper>

                {/* ── Category Description / SEO Section ── */}
                {categoryInfo.seoHeading && categoryInfo.seoParagraphs && categoryInfo.seoParagraphs.length > 0 && (
                    <ScrollSectionWrapper delay={0.05}>
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="bg-gradient-to-br from-sand/50 to-beige/30 rounded-[32px] border border-forest/10 p-8 md:p-12 shadow-sm font-sans">
                                <h2 className="font-display text-2xl font-extrabold text-forest mb-2">
                                    {categoryInfo.seoHeading}
                                </h2>
                                <div className="space-y-2 text-charcoal/85 text-xs md:text-sm leading-relaxed font-light">
                                    {categoryInfo.seoParagraphs.map((para, idx) => (
                                        <p key={idx} className={idx === 0 ? 'font-semibold text-forest/90' : ''}>
                                            {para}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </ScrollSectionWrapper>
                )}

                {/* ── Category FAQ Section (AEO & Search Intent) ── */}
                {faqs.length > 0 && (
                    <ScrollSectionWrapper delay={0.05}>
                        <section id="faq" className="py-10 sm:py-16 bg-white relative overflow-hidden scroll-mt-24">
                            {/* Decorative background element */}
                            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sand/30 rounded-full blur-3xl pointer-events-none opacity-50" />

                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                                {/* Section Header */}
                                <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                        HÄUFIG GESTELLTE FRAGEN
                                    </span>
                                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                        Fragen & Antworten zu {categoryName || 'dieser Kategorie'}
                                    </h2>
                                    <p className="font-sans text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                                        Wichtige Informationen und Tipps zu {categoryName || 'Angeboten dieser Kategorie'}, kurz beantwortet.
                                    </p>
                                </div>

                                {/* FAQ Accordion List */}
                                <div className="max-w-5xl mx-auto space-y-4">
                                    {faqs.map((faq, idx) => {
                                        const faqId = `cat_faq_${idx}`;
                                        const isOpen = openFaqId === faqId;
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 15 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen
                                                    ? 'border-gold bg-sand/20 shadow-md'
                                                    : 'border-forest/10 bg-white hover:border-forest/30'
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleFaq(faqId)}
                                                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                                >
                                                    <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                                        {faq.question}
                                                    </span>
                                                    <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-gold/10 text-gold' : 'bg-sand text-forest'}`}>
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </button>

                                                {/* Accordion Animated Body */}
                                                <AnimatePresence initial={false}>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                        >
                                                            <div className="px-8 md:px-10 pb-6 font-sans text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line">
                                                                {faq.answer}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </ScrollSectionWrapper>
                )}
            </div>

            <ScrollSectionWrapper delay={0.05}>
                <div className="pb-12 bg-white">
                    <CategoriesSection
                        excludeCategory={categoryName}
                        showHeader={true}
                        isDocked={false}
                        badge="ENTDECKEN"
                        title="Weitere Kategorien entdecken"
                        align="center"
                        titleClassName="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-forest leading-tight"
                    />
                </div>
            </ScrollSectionWrapper>
        </>
    );
}

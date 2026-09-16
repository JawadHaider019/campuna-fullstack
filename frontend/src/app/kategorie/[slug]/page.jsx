'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MapPin, ShieldCheck, Eye, ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '@/data';
import { getAllListings } from '@/api/listings';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import CategoriesSection from '@/app/components/CategoriesSection';

// Map URL slugs → internal category names
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

// Map API listing to the normalized shape
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
            return url;
        });

    if (images.length === 0) {
        images.push('/hero.webp');
    }

    let category = item.category || item.Category || 'Camping Zubehör';
    if (category === 'Ausrüstung und Zubehör') category = 'Camping Zubehör';

    let id = item.id || item._id || String(Math.random());
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
        seller: {
            name: sellerName,
            verified: true,
            type: resolvedSellerType,
        },
        listing_user_type: resolvedSellerType,
        features,
        isExclusive: sum % 3 === 0,
        featured: Boolean(item.featured),
        boosted_until: item.boosted_until,
        is_boosted: Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date())),
        created_at: item.created_at
    };
}

// ─── The Card component ────────────────────────────────────────────────────────
function ListingCard({ item }) {
    const router = useRouter();
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgIdx, setImgIdx] = useState(0);
    const handleImgError = () => {
        if (imgIdx < item.images.length - 1) {
            setImgIdx(i => i + 1);
        }
    };

    const handleCardClick = () => {
        const slug = item.slug || buildListingSlug(item.title, item.id);
        router.push(`/inserate/${slug}`);
    };

    const displayLoc = item.displayLocation || item.location || '';
    const cityOnly = displayLoc.split(',')[0].trim();

    const isBoosted = Boolean(
        item.is_boosted || 
        (item.boosted_until && new Date(item.boosted_until) > new Date())
    );
    const isFeatured = Boolean(item.featured);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={handleCardClick}
            className="group relative flex flex-col bg-white rounded-[16px] sm:rounded-[24px] overflow-hidden border border-forest/5 hover:border-forest/10 hover:shadow-xl transition-all duration-300 cursor-pointer h-full select-none"
        >
            {/* Image Area */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                <img
                    src={item.images[imgIdx]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={handleImgError}
                />

                {/* Top badge row */}
                <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-center justify-between z-20 gap-1.5">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pointer-events-none">
                        {/* 🚀 Boosted Badge */}
                        {isBoosted && (
                            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 text-[7px] sm:text-[8px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg border border-yellow-100/90 flex items-center gap-1 backdrop-blur-md">
                                <span>🚀</span>
                                <span>BOOSTED</span>
                            </span>
                        )}

                        {/* Seller Type Badge */}
                        <span className="bg-forest/90 flex items-center gap-0.5 sm:gap-1 justify-center text-white text-[7px] sm:text-[8px] font-semibold uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md backdrop-blur-md pointer-events-none">
                            <ShieldCheck className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" />
                            {item.listing_user_type || item.seller?.type || 'Privat'}
                        </span>
                    </div>

                    <button
                        type="button"
                        aria-label={isFavorite ? "Von Merkzettel entfernen" : "Auf den Merkzettel"}
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
}

// ─── Main CategoryPage ──────────────────────────────────────────────────────────
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
    const [wishlistedIds, setWishlistedIds] = useState([]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');

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

                if (active) setListings(filtered);
            } catch (err) {
                console.error("Error fetching category listings from database:", err);
                if (active) setListings([]);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchCategoryListings();
        return () => { active = false; };
    }, [slug, categoryName]);

    const handleToggleWishlist = (id) => {
        setWishlistedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // In-category filtering & priority sorting
    const displayedListings = useMemo(() => {
        const filtered = listings.filter(item => {
            if (selectedSubcategory) {
                const sub = selectedSubcategory.toLowerCase();
                const matchesSub =
                    (item.subCategory && item.subCategory.toLowerCase().includes(sub)) ||
                    (Array.isArray(item.features) && item.features.some(f => f.toLowerCase().includes(sub))) ||
                    (item.title && item.title.toLowerCase().includes(sub));
                if (!matchesSub) return false;
            }
            if (searchKeyword.trim()) {
                const kw = searchKeyword.toLowerCase().trim();
                const text = [
                    item.title || '',
                    item.description || '',
                    ...(Array.isArray(item.features) ? item.features : []),
                    item.location || '',
                    item.displayLocation || ''
                ].join(' ').toLowerCase();
                if (!text.includes(kw)) return false;
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

    return (
        <>
            <div className="bg-white min-h-screen relative font-sans text-charcoal">
                {/* ── Hero Banner ── */}
                <section
                    className="relative mt-20 sm:mt-20 md:mt-20 pt-10 pb-14 px-4 mx-4 overflow-hidden rounded-4xl"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 60%, rgba(0, 0, 0, 0.95) 100%), url('/hero.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="max-w-7xl mx-auto">
                        {/* Back button */}
                        <button
                            onClick={() => router.push('/')}
                            className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors group cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Zurück zur Startseite
                        </button>

                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block mb-2">
                            {categoryName ? 'Kategorie' : 'Alle Angebote'}
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow-lg">
                            {heroTitle}
                        </h1>
                        {heroSubtitle && (
                            <p className="text-white/90 text-sm sm:text-base max-w-7xl mt-3 mb-4 font-sans leading-relaxed drop-shadow-md">
                                {heroSubtitle}
                            </p>
                        )}

                        {/* Search & Subcategory filter in Hero */}
                        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-3xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder={`In ${categoryName || 'Kategorie'} suchen...`}
                                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white placeholder-white/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold font-medium"
                                />
                                {searchKeyword && (
                                    <button
                                        onClick={() => setSearchKeyword('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => router.push(`/inserate?cat=${encodeURIComponent(categoryName)}`)}
                                className="bg-gold hover:bg-white text-forest font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Alle Filter öffnen
                            </button>
                        </div>

                    </div>
                </section>

                {/* ── Subcategory Pills Bar ── */}
                {subcategories.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 pt-6 pb-2">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                            <button
                                onClick={() => setSelectedSubcategory('')}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                    selectedSubcategory === ''
                                        ? 'bg-forest text-white shadow-sm'
                                        : 'bg-sand/40 hover:bg-sand/70 text-charcoal/80 border border-forest/10'
                                }`}
                            >
                                Alle ({listings.length})
                            </button>
                            {subcategories.map((sub, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? '' : sub)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                                        selectedSubcategory === sub
                                            ? 'bg-forest text-white shadow-sm'
                                            : 'bg-sand/30 hover:bg-sand/60 text-charcoal/80 border border-forest/10'
                                    }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Products Grid ── */}
                <section className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-forest/5">
                        <span className="text-xs font-mono text-charcoal/60 uppercase tracking-widest">
                            {displayedListings.length} {displayedListings.length === 1 ? 'Inserat' : 'Inserate'} in dieser Kategorie
                        </span>
                        {(searchKeyword || selectedSubcategory) && (
                            <button
                                onClick={() => {
                                    setSearchKeyword('');
                                    setSelectedSubcategory('');
                                }}
                                className="text-xs font-bold text-gold hover:text-forest uppercase tracking-wider cursor-pointer"
                            >
                                Filter zurücksetzen
                            </button>
                        )}
                    </div>

                    {loading ? (
                        // Skeleton
                        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
                                onClick={() => {
                                    setSearchKeyword('');
                                    setSelectedSubcategory('');
                                }}
                                className="bg-forest text-sand text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full hover:bg-gold hover:text-forest transition-colors duration-300 cursor-pointer"
                            >
                                Alle Inserate dieser Kategorie anzeigen
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 min-[350px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                {displayedListings.slice(0, visibleCount).map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                                    >
                                        <ListingCard item={item} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {displayedListings.length > visibleCount && (
                                <div className="flex justify-center mt-12 mb-4">
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 20)}
                                        className="bg-forest text-white text-xs font-semibold uppercase tracking-wider py-4 px-8 rounded-full border border-forest/10 shadow-md hover:bg-gold hover:text-forest hover:border-gold hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer font-sans"
                                    >
                                        Mehr Angebote laden
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ── Category Description / SEO Section ── */}
                {categoryInfo.seoHeading && categoryInfo.seoParagraphs && categoryInfo.seoParagraphs.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 py-8">
                        <div className="bg-gradient-to-br from-sand/50 to-beige/30 rounded-[32px] border border-forest/10 p-8 md:p-12 shadow-sm font-sans">
                            <h2 className="font-display text-2xl font-extrabold text-forest mb-2">
                                {categoryInfo.seoHeading}
                            </h2>
                            <div className="space-y-2 text-charcoal/85 text-xs md:text-sm leading-relaxed font-light">
                                {categoryInfo.seoParagraphs.map((para, idx) => (
                                    <p key={idx} className={idx === 0 ? "font-semibold text-forest/90" : ""}>
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            </div>
            <div className="py-12 bg-white border-t border-forest/5">
                <CategoriesSection
                    excludeCategory={categoryName}
                    badge="ENTDECKEN"
                    title="Beliebte Bereiche"
                    align="center"
                    titleClassName="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-black"
                />
            </div>
        </>
    );
}


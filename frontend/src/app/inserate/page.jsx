'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    MapPin,
    ShieldCheck,
    Eye,
    ArrowLeft,
    SlidersHorizontal,
    X,
    Search,
    Filter,
    Rocket,
    PlusCircle,
    ChevronDown,
    ArrowRight,
    CheckCircle2,
    Compass,
    ShieldAlert,
    Tag,
    ShoppingBag,
    BookOpen,
    Layers
} from 'lucide-react';
import { getAllListings } from '@/api/listings';
import { CATEGORIES, STATIC_LISTINGS } from '@/data';
import CategoriesSection from '@/app/components/CategoriesSection';
import PriceRangeSlider from '@/app/components/PriceRangeSlider';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getImageUrl } from '@/utils/imageUrl';
import CircleLoader from '@/app/components/CircleLoader';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import { isListingBoosted } from '@/utils/sellerBadge';
import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';

// Map API subcategory or tags to pre-defined mapping
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

// German state mapping for flexible Standort search
const STATE_MAP = {
    'bw': 'baden-württemberg',
    'by': 'bayern',
    'be': 'berlin',
    'bb': 'brandenburg',
    'hb': 'bremen',
    'hh': 'hamburg',
    'he': 'hessen',
    'mv': 'mecklenburg-vorpommern',
    'ni': 'niedersachsen',
    'nds': 'niedersachsen',
    'nrw': 'nordrhein-westfalen',
    'rp': 'rheinland-pfalz',
    'rlp': 'rheinland-pfalz',
    'sl': 'saarland',
    'sn': 'sachsen',
    'st': 'sachsen-anhalt',
    'th': 'thüringen'
};

export function normalizeLocString(str = '') {
    return String(str)
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function matchLocation(item, queryLocation) {
    if (!queryLocation || !queryLocation.trim()) return true;
    const rawLoc = queryLocation.toLowerCase().trim();

    const expandedQuery = STATE_MAP[rawLoc] || rawLoc;
    const normQuery = normalizeLocString(expandedQuery);
    const queryTokens = normQuery.split(/\s+/).filter(Boolean);

    const fullItemLoc = [
        item.location || '',
        item.displayLocation || '',
        item.seller?.location || '',
        item.seller?.address || ''
    ].join(' ');

    let normItemLoc = normalizeLocString(fullItemLoc);

    // Expand state abbreviations into item location string
    Object.entries(STATE_MAP).forEach(([abbr, fullName]) => {
        const normFullName = normalizeLocString(fullName);
        if (normItemLoc.includes(normFullName)) {
            normItemLoc += ' ' + abbr;
        }
    });

    if (normItemLoc.includes(normQuery) || normItemLoc.includes(normalizeLocString(rawLoc))) {
        return true;
    }

    return queryTokens.every(tok => normItemLoc.includes(tok));
}

export function matchAnbieter(item, appliedAnbieter) {
    if (!appliedAnbieter || appliedAnbieter === 'all') return true;
    const filter = appliedAnbieter.toLowerCase();

    const rawType = (
        item.listing_user_type ||
        item.seller?.type ||
        item.seller_type ||
        (item.seller?.company_name ? 'Gewerblich' : '') ||
        ''
    ).toLowerCase();

    const isCommercial =
        rawType.includes('gewerb') ||
        rawType.includes('commercial') ||
        rawType.includes('business') ||
        rawType.includes('company') ||
        rawType.includes('händler') ||
        rawType.includes('haendler') ||
        rawType === 'commercial';

    const isPrivate =
        rawType.includes('privat') ||
        rawType.includes('private') ||
        rawType === 'private' ||
        (!isCommercial && rawType !== '');

    if (filter === 'privat') return isPrivate && !isCommercial;
    if (filter === 'gewerblich') return isCommercial;
    return true;
}

export function matchSubcategory(item, appliedSubcat) {
    if (!appliedSubcat || !appliedSubcat.trim()) return true;
    const cleanSub = appliedSubcat.toLowerCase().trim();

    const itemSub = (item.subCategory || item.subcategory || '').toLowerCase().trim();
    const features = Array.isArray(item.features) ? item.features.map(f => String(f).toLowerCase()) : [];
    const featuresText = features.join(' ');
    const titleText = (item.title || '').toLowerCase();
    const descText = (item.description || '').toLowerCase();

    // 1. Exact or direct substring match
    if (itemSub && (itemSub === cleanSub || itemSub.includes(cleanSub) || cleanSub.includes(itemSub))) return true;
    if (features.some(f => f === cleanSub || f.includes(cleanSub) || cleanSub.includes(f))) return true;

    // 2. Tokenized match (e.g. "Vorzelte & Markisen" -> ["vorzelte", "markisen"])
    const tokens = cleanSub
        .split(/[\s&,/+]+/)
        .map(t => t.trim())
        .filter(t => t.length > 2);

    const fullItemContent = `${itemSub} ${featuresText} ${titleText} ${descText}`;

    return tokens.some(tok => {
        if (fullItemContent.includes(tok)) return true;
        const stem = tok.replace(/(e|en|er|n|s)$/i, '');
        return stem.length >= 3 && fullItemContent.includes(stem);
    });
}

// Sort options
const SORT_OPTIONS = [
    { value: 'newest', label: 'Neueste zuerst' },
    { value: 'price_asc', label: 'Preis aufsteigend' },
    { value: 'price_desc', label: 'Preis absteigend' },
];

export function resolveCategory(catInput = '') {
    if (!catInput) return '';
    const clean = String(catInput).trim().toLowerCase();

    if (
        clean === 'ausrüstung-und-zubehör' ||
        clean === 'ausruestung-und-zubehoer' ||
        clean === 'camping-zubehoer' ||
        clean === 'camping zubehör' ||
        clean === 'zubehör' ||
        clean === 'camping-zubehör' ||
        clean === 'ausrüstung und zubehör' ||
        clean === 'ausrüstung & zubehör' ||
        clean.includes('zubeh') ||
        clean.includes('ausruest') ||
        clean.includes('ausrüst')
    ) {
        return 'Camping Zubehör';
    }
    if (
        clean === 'fahrzeuge' ||
        clean === 'wohnmobile-camper' ||
        clean === 'wohnmobile & camper' ||
        clean === 'wohnmobile und camper' ||
        clean === 'wohnmobil' ||
        clean === 'wohnmobile' ||
        clean === 'wohnmobile-und-camper' ||
        clean.includes('wohnmobil') ||
        clean.includes('camper') ||
        clean.includes('fahrzeug') ||
        clean.includes('kastenwagen') ||
        clean.includes('wohnwagen')
    ) {
        return 'Wohnmobile & Camper';
    }
    if (
        clean === 'zelte-and-dachzelte' ||
        clean === 'zelte-dachzelte' ||
        clean === 'zelte & dachzelte' ||
        clean === 'zelte' ||
        clean === 'dachzelte' ||
        clean === 'dachzelt' ||
        clean === 'zelte-und-dachzelte' ||
        clean.includes('zelt')
    ) {
        return 'Zelte & Dachzelte';
    }
    if (
        clean === 'fahrräder-träger' ||
        clean === 'fahrraeder-traeger' ||
        clean === 'fahrräder & träger' ||
        clean === 'fahrräder' ||
        clean === 'fahrrad' ||
        clean === 'fahrraeder-und-traeger' ||
        clean.includes('fahrrad') ||
        clean.includes('fahrräder') ||
        clean.includes('fahrraeder') ||
        clean.includes('träger') ||
        clean.includes('traeger')
    ) {
        return 'Fahrräder & Träger';
    }
    if (
        clean === 'campingplätze-stellplätze' ||
        clean === 'stellplaetze' ||
        clean === 'stellplätze & campingplätze' ||
        clean === 'stellplätze und campingplätze' ||
        clean === 'stellplätze' ||
        clean === 'campingplätze' ||
        clean === 'campingplaetze-stellplaetze' ||
        clean === 'stellplaetze-und-campingplaetze' ||
        clean.includes('stellplatz') ||
        clean.includes('stellplätze') ||
        clean.includes('campingplatz') ||
        clean.includes('campingplätze')
    ) {
        return 'Stellplätze & Campingplätze';
    }
    if (
        clean === 'dienstleistungen' ||
        clean === 'camping-services' ||
        clean === 'camping services' ||
        clean === 'services' ||
        clean === 'service' ||
        clean.includes('service') ||
        clean.includes('dienstleistung')
    ) {
        return 'Camping Services';
    }
    if (
        clean === 'tiny-houses' ||
        clean === 'tiny houses' ||
        clean === 'tiny house' ||
        clean === 'tiny-house' ||
        clean.includes('tiny') ||
        clean.includes('mobilheim')
    ) {
        return 'Tiny Houses';
    }
    if (
        clean === 'mieten-vermieten' ||
        clean === 'mieten & vermieten' ||
        clean === 'mieten und vermieten' ||
        clean === 'mieten' ||
        clean === 'vermieten' ||
        clean === 'mieten-und-vermieten' ||
        clean.includes('miet')
    ) {
        return 'Mieten & Vermieten';
    }
    if (
        clean === 'boote-wassersport' ||
        clean === 'boote & wassersport' ||
        clean === 'boote und wassersport' ||
        clean === 'boote' ||
        clean === 'wassersport' ||
        clean === 'boote-und-wassersport' ||
        clean.includes('boot') ||
        clean.includes('wasser')
    ) {
        return 'Boote & Wassersport';
    }

    const matched = CATEGORIES.find(
        (c) => c.slug === clean || c.name.toLowerCase() === clean
    );
    if (matched) return matched.name;

    return catInput;
}

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
    if (!item) return null;

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

    let rawCat = item.category || item.Category || 'Camping Zubehör';
    let category = resolveCategory(rawCat);

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

    // Check if negotiable via flag, description or title
    const isNegotiable =
        item.negotiable === true ||
        item.isNegotiable === true ||
        item.title?.toLowerCase().includes('vb') ||
        item.title?.toLowerCase().includes('verhand') ||
        item.description?.toLowerCase().includes('vb') ||
        item.description?.toLowerCase().includes('verhand') ||
        item['Price - type']?.toLowerCase().includes('negotiable') ||
        false;

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
        description: item.description || '',
        category,
        price,
        pricePeriod,
        location,
        displayLocation,
        rating,
        reviewsCount: item.reviewsCount || ((sum % 15) + 3),
        images,
        seller_role: sellerRole,
        role: sellerRole,
        is_admin: isAdmin,
        is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club),
        seller: {
            name: isAdmin ? 'Campuna' : sellerName,
            verified: true,
            type: isAdmin ? 'Admin' : resolvedSellerType,
            tier: sellerTier,
            role: sellerRole,
            is_admin: isAdmin,
            is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club)
        },
        listing_user_type: isAdmin ? 'Admin' : resolvedSellerType,
        seller_tier: sellerTier,
        company_tier: sellerTier,
        tier: sellerTier,
        features,
        isExclusive: item.isExclusive !== undefined ? item.isExclusive : (sum % 3 === 0),
        isNegotiable,
        subCategory: item.subcategory || item['Sub - Category'] || '',
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted,
        created_at: item.created_at
    };
}

// ─── Individual Listing Card Component ────────────
const ListingCard = React.memo(function ListingCard({ item, index = 0 }) {
    const router = useRouter();
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgIdx, setImgIdx] = useState(0);
    const [imgFailed, setImgFailed] = useState(false);
    
    const handleImgError = React.useCallback(() => {
        if (item.images && imgIdx < item.images.length - 1) {
            setImgIdx(i => i + 1);
        } else {
            setImgFailed(true);
        }
    }, [imgIdx, item.images]);

    const handleCardClick = React.useCallback(() => {
        const slug = item.slug || buildListingSlug(item.title, item.id);
        router.push(`/inserate/${slug}`);
    }, [item.slug, item.title, item.id, router]);

    const displayLoc = item.displayLocation || item.location || '';
    const cityOnly = displayLoc.split(',')[0].trim();
    const isBoosted = isListingBoosted(item);
    const hasImage = item.images && item.images.length > 0 && !imgFailed;

    // Row-by-row staggered delay calculation (3 columns per row on desktop)
    const staggerDelay = (index % 3) * 0.08;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ 
                duration: 0.5, 
                delay: staggerDelay, 
                ease: [0.21, 0.47, 0.32, 0.98] 
            }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={handleCardClick}
            className={`group relative flex flex-col rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer h-full select-none will-change-transform ${isBoosted
                    ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)]'
                    : 'bg-white border border-forest/5 hover:border-forest/10 hover:shadow-xl'
                }`}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand/20">
                {hasImage ? (
                    <img
                        src={item.images[imgIdx]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={handleImgError}
                    />
                ) : (
                    <ListingImagePlaceholder category={item.category} />
                )}

                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 gap-2">
                    <ListingBadgesRow item={item} />

                    <button
                        type="button"
                        aria-label={isFavorite ? "Von Merkzettel entfernen" : "Auf den Merkzettel"}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer pointer-events-auto shrink-0 ${isFavorite
                            ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
                            : 'bg-white/75 hover:bg-white text-forest hover:text-rose-500 hover:scale-105'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-white' : ''}`} />
                    </button>
                </div>

                {/* Location Tag */}
                <div className="absolute bottom-3 right-3 flex items-center pointer-events-none text-white/95 max-w-[85%] z-10">
                    <div className="bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-[8.5px] flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 text-gold shrink-0" />
                        <span className="truncate">
                            <span className="inline md:hidden">{cityOnly}</span>
                            <span className="hidden md:inline">{displayLoc}</span>
                        </span>
                    </div>
                </div>

                {/* Hover overlay button */}
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white text-forest px-4.5 py-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inserat ansehen</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3.5 md:p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                    <h3 className="font-display text-xs md:text-sm lg:text-base font-bold text-black group-hover:text-gold transition-colors duration-200 mb-1.5 line-clamp-2 leading-snug">
                        {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                        {item.features?.slice(0, 2).map((feat, idx) => (
                            <span
                                key={idx}
                                className="text-[8px] md:text-[9.5px] text-charcoal/65 bg-sand px-2 py-0.5 rounded-md border border-forest/5 whitespace-nowrap"
                            >
                                {feat}
                            </span>
                        ))}
                        {item.isNegotiable && (
                            <span className="text-[8px] md:text-[9.5px] text-forest bg-beige/40 px-2 py-0.5 rounded-md border border-forest/5 font-semibold">
                                VB
                            </span>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-forest/5 flex items-end justify-between">
                    <div>
                        <span className="block text-[8px] md:text-[9.5px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1">
                            {item.pricePeriod}
                        </span>
                        <span className="font-display text-xs md:text-base lg:text-lg font-extrabold text-forest">
                            {item.price > 0 ? `${item.price.toLocaleString('de-DE')} €` : 'Preis VB'}
                        </span>
                    </div>
                    <span className="font-sans text-[9px] md:text-xs font-bold text-forest group-hover:text-gold flex items-center space-x-0.5 transition-colors">
                        <span>Details</span>
                        <span className="transform group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

// ─── Main Content Component (Consuming Search Params) ─────────────────────────────────
function ListingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    // Search state variables (filters in form)
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isVerhandelbar, setIsVerhandelbar] = useState(false);
    const [anbieter, setAnbieter] = useState('all'); // 'all', 'privat', 'gewerblich'
    const [kategorie, setKategorie] = useState('');
    const [unterkategorie, setUnterkategorie] = useState('');
    const [keyword, setKeyword] = useState('');
    const [standort, setStandort] = useState('');

    // Applied filter state (triggered on Suchen click or URL query params change)
    const [appliedFilters, setAppliedFilters] = useState({
        minPrice: '',
        maxPrice: '',
        isVerhandelbar: false,
        anbieter: 'all',
        kategorie: '',
        unterkategorie: '',
        keyword: '',
        standort: '',
    });

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishlistedIds, setWishlistedIds] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [openFaq, setOpenFaq] = useState('faq_0');

    const toggleFaq = (id) => {
        setOpenFaq(prev => prev === id ? null : id);
    };

    // Sync state with URL search parameters
    const syncUrlParams = (newFilters, newSort = sortBy) => {
        const params = new URLSearchParams();
        if (newFilters.keyword) params.set('kw', newFilters.keyword);
        if (newFilters.kategorie) params.set('cat', newFilters.kategorie);
        if (newFilters.unterkategorie) params.set('subcat', newFilters.unterkategorie);
        if (newFilters.standort) params.set('loc', newFilters.standort);
        if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
        if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
        if (newFilters.anbieter && newFilters.anbieter !== 'all') params.set('anbieter', newFilters.anbieter);
        if (newFilters.isVerhandelbar) params.set('vb', 'true');
        if (newSort && newSort !== 'newest') params.set('sort', newSort);

        const query = params.toString();
        const targetUrl = query ? `/inserate?${query}` : '/inserate';
        window.history.replaceState(null, '', targetUrl);
    };

    // Initialize filters from search parameters
    useEffect(() => {
        const kw = searchParams.get('kw') || searchParams.get('q') || searchParams.get('search') || searchParams.get('keyword') || '';
        const rawCat = searchParams.get('cat') || searchParams.get('category') || searchParams.get('kategorie') || '';
        const loc = searchParams.get('loc') || searchParams.get('location') || searchParams.get('standort') || '';
        const minP = searchParams.get('minPrice') || searchParams.get('min') || searchParams.get('min_price') || '';
        const maxP = searchParams.get('maxPrice') || searchParams.get('max') || searchParams.get('max_price') || '';
        const anb = searchParams.get('anbieter') || searchParams.get('provider') || searchParams.get('type') || 'all';
        const sub = searchParams.get('subcat') || searchParams.get('subcategory') || searchParams.get('unterkategorie') || '';
        const isVb = searchParams.get('vb') === 'true' || searchParams.get('isVerhandelbar') === 'true';
        const sort = searchParams.get('sort') || searchParams.get('sortBy') || 'newest';

        const resolvedCatName = resolveCategory(rawCat);

        setKeyword(kw);
        setKategorie(resolvedCatName);
        setUnterkategorie(sub);
        setStandort(loc);
        setMinPrice(minP);
        setMaxPrice(maxP);
        setAnbieter(anb);
        setIsVerhandelbar(isVb);
        setSortBy(sort);

        // Apply immediately on load or searchParams change
        setAppliedFilters({
            minPrice: minP,
            maxPrice: maxP,
            isVerhandelbar: isVb,
            anbieter: anb,
            kategorie: resolvedCatName,
            unterkategorie: sub,
            keyword: kw,
            standort: loc
        });
    }, [searchParams]);

    // Fetch listings (API exclusively from database)
    useEffect(() => {
        let active = true;
        setLoading(true);

        const fetchData = async () => {
            try {
                const res = await getAllListings();
                let list = [];
                if (res.success && Array.isArray(res.data?.listings) && res.data.listings.length > 0) {
                    list = res.data.listings.map(mapListing).filter(Boolean);
                } else {
                    list = STATIC_LISTINGS.map(mapListing).filter(Boolean);
                }

                // Deduplicate listings by unique key (id or slug)
                const seen = new Set();
                const uniqueList = list.filter(item => {
                    const key = item?.id || item?.slug || item?.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                if (active) setListings(uniqueList);
            } catch (err) {
                console.error("Error fetching listings from database:", err);
                const fallbackList = STATIC_LISTINGS.map(mapListing).filter(Boolean);
                const seen = new Set();
                const uniqueFallback = fallbackList.filter(item => {
                    const key = item?.id || item?.slug || item?.title;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                if (active) setListings(uniqueFallback);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => { active = false; };
    }, []);

    // Live Price Filter Change (instantly updates results & URL without needing to click search)
    const handlePriceChange = (newMin, newMax) => {
        setMinPrice(newMin);
        setMaxPrice(newMax);
        const updated = {
            ...appliedFilters,
            minPrice: newMin,
            maxPrice: newMax,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live Anbieter filter change (instant response)
    const handleAnbieterChange = (newAnbieter) => {
        setAnbieter(newAnbieter);
        const updated = {
            ...appliedFilters,
            anbieter: newAnbieter,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live Category filter change (instant response + resets subcategory)
    const handleCategoryChange = (newCat) => {
        setKategorie(newCat);
        setUnterkategorie('');
        const updated = {
            ...appliedFilters,
            kategorie: newCat,
            unterkategorie: '',
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live Subcategory filter change (instant response)
    const handleSubcategoryChange = (newSub) => {
        setUnterkategorie(newSub);
        const updated = {
            ...appliedFilters,
            unterkategorie: newSub,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live Keyword filter change (instant response)
    const handleKeywordChange = (newKw) => {
        setKeyword(newKw);
        const updated = {
            ...appliedFilters,
            keyword: newKw,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live Standort filter change (instant response)
    const handleStandortChange = (newLoc) => {
        setStandort(newLoc);
        const updated = {
            ...appliedFilters,
            standort: newLoc,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Live VB toggle
    const handleVerhandelbarChange = (checked) => {
        setIsVerhandelbar(checked);
        const updated = {
            ...appliedFilters,
            isVerhandelbar: checked,
        };
        setAppliedFilters(updated);
        syncUrlParams(updated);
        setVisibleCount(12);
    };

    // Handle Search Submission (for Keyword & Standort input forms)
    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const newFilters = {
            minPrice,
            maxPrice,
            isVerhandelbar,
            anbieter,
            kategorie,
            unterkategorie,
            keyword,
            standort
        };
        setAppliedFilters(newFilters);
        syncUrlParams(newFilters);
        setVisibleCount(12);
        setIsMobileFilterOpen(false);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setIsVerhandelbar(false);
        setAnbieter('all');
        setKategorie('');
        setUnterkategorie('');
        setKeyword('');
        setStandort('');

        const emptyFilters = {
            minPrice: '',
            maxPrice: '',
            isVerhandelbar: false,
            anbieter: 'all',
            kategorie: '',
            unterkategorie: '',
            keyword: '',
            standort: '',
        };
        setAppliedFilters(emptyFilters);
        syncUrlParams(emptyFilters);
        setVisibleCount(12);
        setIsMobileFilterOpen(false);
    };

    // Current subcategories based on selected category in filter form
    const currentSubcategories = kategorie ? (CATEGORY_SUBCATEGORIES[kategorie] || []) : [];

    // Wishlist toggle
    const handleToggleWishlist = (id) => {
        setWishlistedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Filter listings list based on appliedFilters
    const filteredListings = useMemo(() => {
        return listings.filter((item) => {
            // 1. Min Price
            if (appliedFilters.minPrice) {
                const min = parseFloat(appliedFilters.minPrice);
                if (!isNaN(min) && item.price < min && item.price > 0) return false;
            }
            // 2. Max Price
            if (appliedFilters.maxPrice) {
                const max = parseFloat(appliedFilters.maxPrice);
                if (!isNaN(max) && item.price > max) return false;
            }
            // 3. Preis Verhandelbar
            if (appliedFilters.isVerhandelbar && !item.isNegotiable) {
                return false;
            }
            // 4. Anbieter (Privat vs Gewerblich)
            if (!matchAnbieter(item, appliedFilters.anbieter)) {
                return false;
            }
            // 5. Kategorie
            if (appliedFilters.kategorie) {
                const resolvedAppliedCat = resolveCategory(appliedFilters.kategorie);
                const resolvedItemCat = resolveCategory(item.category);
                if (resolvedAppliedCat.toLowerCase() !== resolvedItemCat.toLowerCase()) {
                    return false;
                }
            }
            // 6. Unterkategorie
            if (!matchSubcategory(item, appliedFilters.unterkategorie)) {
                return false;
            }
            // 7. Keyword search (Title, Description, Category, Subcategory, Features, Location, Seller Name)
            if (appliedFilters.keyword) {
                const kw = appliedFilters.keyword.toLowerCase().trim();
                const tokens = kw.split(/\s+/).filter(Boolean);

                const fullContent = [
                    item.title || '',
                    item.description || '',
                    item.category || '',
                    item.subCategory || '',
                    ...(Array.isArray(item.features) ? item.features : []),
                    item.seller?.name || '',
                    item.location || '',
                    item.displayLocation || ''
                ].join(' ').toLowerCase();

                const matchesAllTokens = tokens.every(token => fullContent.includes(token));
                if (!matchesAllTokens) return false;
            }
            // 8. Location (Standort)
            if (!matchLocation(item, appliedFilters.standort)) {
                return false;
            }

            return true;
        });
    }, [listings, appliedFilters]);

    // Sort filtered listings
    const sortedListings = useMemo(() => {
        const list = [...filteredListings];
        if (sortBy === 'price_asc') return list.sort((a, b) => a.price - b.price);
        if (sortBy === 'price_desc') return list.sort((a, b) => b.price - a.price);

        const isItemBoosted = (item) => Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));

        return list.sort((a, b) => {
            const aBoost = isItemBoosted(a) ? 1 : 0;
            const bBoost = isItemBoosted(b) ? 1 : 0;
            if (bBoost !== aBoost) return bBoost - aBoost;

            const aFeat = a.featured ? 1 : 0;
            const bFeat = b.featured ? 1 : 0;
            if (bFeat !== aFeat) return bFeat - aFeat;

            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
    }, [filteredListings, sortBy]);

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        syncUrlParams(appliedFilters, newSort);
    };

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal">

            {/* ── 1. HERO SECTION (Compact cinematic style) ── */}
            <section
                className="relative min-h-[32vh] sm:min-h-[36vh] md:min-h-[40vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 shadow-xl border border-forest/10"
            >
                {/* Background Cinematic Image with Zoom Animation */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/hero-campuna.webp"
                            alt="Camping-Inserate und Marktplatz Deutschland"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                    {/* Deep luxurious multi-layered gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
                </div>

                {/* Floating Sparkles Background Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.08),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 sm:py-10 flex flex-col justify-center items-center w-full text-center">
                    <span className="font-sans text-[9px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-gold block mb-2">
                        Camping-Marktplatz Deutschland
                    </span>
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-xl leading-tight"
                    >
                        Camping-Inserate <span className="text-gold">aus ganz Deutschland</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-xs sm:text-sm md:text-base text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Entdecke aktuelle Camping-Angebote für Wohnmobile, Wohnwagen, Campingzubehör, Stellplätze, Services, Tiny Houses und mehr. Von privaten und gewerblichen Anbietern auf Campuna, täglich neu.
                    </motion.p>
                </div>
            </section>

            {/* ── Breadcrumbs below Hero ── */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-1">
                <Breadcrumbs
                    items={appliedFilters.kategorie ? [{ label: 'Inserate', href: '/inserate' }, { label: appliedFilters.kategorie }] : [{ label: 'Inserate' }]}
                    variant="light"
                />
            </div>

            {/* ── Main content grid ── */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* ── Filters: Desktop Sidebar with Scroll/Mount Animation ── */}
                    <motion.aside 
                        initial={{ opacity: 0, x: -25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="hidden lg:block lg:col-span-1 self-start sticky top-24 bg-sand/30 border border-forest/10 rounded-2xl p-5 xl:p-6 shadow-sm"
                    >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5 xl:gap-2 pb-4 border-b border-forest/10 mb-6">
                            <span className="font-display text-base font-bold text-forest flex items-center gap-2 whitespace-nowrap">
                                <Filter className="w-4 h-4 text-gold shrink-0" />
                                <span className="whitespace-nowrap">Filter anpassen</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="text-[11px] font-semibold text-charcoal/50 hover:text-gold uppercase tracking-wider transition-colors cursor-pointer text-left xl:text-right whitespace-nowrap"
                            >
                                Zurücksetzen
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="space-y-6">

                            {/* Keyword / Stichwort */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                    Marke, Modell, Stichwort...
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => handleKeywordChange(e.target.value)}
                                        placeholder="Z.B. Morelo, Zelt, Solar, Tiny House..."
                                        className="w-full pl-10 pr-9 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium"
                                    />
                                    {keyword && (
                                        <button
                                            type="button"
                                            onClick={() => handleKeywordChange('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal p-0.5 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Price range */}
                            <div>
                                <PriceRangeSlider
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    setMinPrice={setMinPrice}
                                    setMaxPrice={setMaxPrice}
                                    onChange={handlePriceChange}
                                />

                                <label className="mt-3.5 flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isVerhandelbar}
                                        onChange={(e) => handleVerhandelbarChange(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-forest/15 text-forest focus:ring-transparent focus:ring-offset-0 transition-colors cursor-pointer accent-forest"
                                    />
                                    <span className="text-[11px] font-semibold text-charcoal/70 hover:text-charcoal">
                                        Preis verhandelbar (VB)
                                    </span>
                                </label>
                            </div>

                            {/* Provider (Anbieter) */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                    Anbieter
                                </label>
                                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-full border border-forest/15">
                                    {[
                                        { key: 'all', label: 'Alle' },
                                        { key: 'privat', label: 'Privat' },
                                        { key: 'gewerblich', label: 'Gewerblich' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => handleAnbieterChange(opt.key)}
                                            className={`py-1.5 px-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${anbieter === opt.key
                                                ? 'bg-forest text-white shadow-xs'
                                                : 'text-charcoal/65 hover:text-charcoal hover:bg-sand/40'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category (Kategorie) */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                    Kategorie
                                </label>
                                <select
                                    value={kategorie}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium cursor-pointer"
                                >
                                    <option value="">Alle Kategorien</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-Category (Unterkategorie) */}
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${kategorie ? 'text-forest/90' : 'text-charcoal/30'
                                    }`}>
                                    Unterkategorie
                                </label>
                                <select
                                    value={unterkategorie}
                                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                                    disabled={!kategorie}
                                    className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white disabled:bg-sand/30 disabled:text-charcoal/30 text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium cursor-pointer"
                                >
                                    <option value="">Alle Unterkategorien</option>
                                    {currentSubcategories.map((sub, i) => (
                                        <option key={i} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Location (Standort) */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                    Standort / PLZ / Bundesland
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                    <input
                                        type="text"
                                        value={standort}
                                        onChange={(e) => handleStandortChange(e.target.value)}
                                        placeholder="Ort, PLZ oder Bundesland (z.B. Kempten, NRW, München)..."
                                        className="w-full pl-10 pr-9 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium"
                                    />
                                    {standort && (
                                        <button
                                            type="button"
                                            onClick={() => handleStandortChange('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal p-0.5 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Submit searching */}
                            <button
                                type="submit"
                                className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3.5 px-6 rounded-full shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                <Search className="w-4 h-4" />
                                Filter anwenden
                            </button>

                        </form>
                    </motion.aside>

                    {/* ── Results Area ── */}
                    <section className="lg:col-span-3">

                        {/* Filter Toggle, Search count & Sort bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-forest/5 mb-6">
                            <div className="space-y-1.5">
                                <h2 className="font-display text-xl sm:text-2xl font-black text-forest uppercase tracking-tight">
                                    {appliedFilters.kategorie ? appliedFilters.kategorie : 'Alle Inserate'}
                                </h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-mono text-charcoal/60 uppercase tracking-widest">
                                        {sortedListings.length} {sortedListings.length === 1 ? 'Inserat' : 'Inserate'} gefunden
                                    </span>

                                    {loading && (
                                        <span className="inline-block w-2.5 h-2.5 border-2 border-forest border-t-transparent rounded-full animate-spin ml-2" />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Mobile Filter Trigger */}
                                <button
                                    onClick={() => setIsMobileFilterOpen(true)}
                                    className="lg:hidden flex items-center justify-center gap-2 px-4.5 py-2.5 border border-forest/15 bg-sand/30 hover:bg-sand/65 text-charcoal rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-forest" />
                                    Filter
                                </button>

                                {/* Sorting Select */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="px-4 py-2.5 border border-forest/15 rounded-full bg-sand/30 text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-1.5 focus:ring-forest/20 text-charcoal cursor-pointer"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active filters display */}
                        {(appliedFilters.keyword ||
                            appliedFilters.kategorie ||
                            appliedFilters.unterkategorie ||
                            appliedFilters.standort ||
                            appliedFilters.anbieter !== 'all' ||
                            appliedFilters.minPrice ||
                            appliedFilters.maxPrice ||
                            appliedFilters.isVerhandelbar) && (
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                    <span className="text-[10px] font-bold text-forest uppercase tracking-widest py-1">
                                        Aktive Filter:
                                    </span>

                                    {appliedFilters.keyword && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            "{appliedFilters.keyword}"
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setKeyword('');
                                                    const updated = { ...appliedFilters, keyword: '' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {appliedFilters.kategorie && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            Kategorie: {appliedFilters.kategorie}
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setKategorie('');
                                                    setUnterkategorie('');
                                                    const updated = { ...appliedFilters, kategorie: '', unterkategorie: '' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {appliedFilters.unterkategorie && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            Unterkategorie: {appliedFilters.unterkategorie}
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setUnterkategorie('');
                                                    const updated = { ...appliedFilters, unterkategorie: '' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {appliedFilters.standort && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            Ort: {appliedFilters.standort}
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setStandort('');
                                                    const updated = { ...appliedFilters, standort: '' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {appliedFilters.anbieter && appliedFilters.anbieter !== 'all' && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            Anbieter: {appliedFilters.anbieter === 'privat' ? 'Privat' : 'Gewerblich'}
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setAnbieter('all');
                                                    const updated = { ...appliedFilters, anbieter: 'all' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            Preis: {appliedFilters.minPrice ? `${Number(appliedFilters.minPrice).toLocaleString('de-DE')} €` : '0 €'} – {appliedFilters.maxPrice ? `${Number(appliedFilters.maxPrice).toLocaleString('de-DE')} €` : 'Beliebig'}
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setMinPrice('');
                                                    setMaxPrice('');
                                                    const updated = { ...appliedFilters, minPrice: '', maxPrice: '' };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    {appliedFilters.isVerhandelbar && (
                                        <span className="inline-flex items-center gap-1.5 bg-sand border border-forest/10 rounded-full px-3 py-1 text-[10.5px] font-semibold text-charcoal/80">
                                            VB verhandelbar
                                            <X
                                                className="w-3.5 h-3.5 text-charcoal/50 hover:text-rose-600 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setIsVerhandelbar(false);
                                                    const updated = { ...appliedFilters, isVerhandelbar: false };
                                                    setAppliedFilters(updated);
                                                    syncUrlParams(updated);
                                                }}
                                            />
                                        </span>
                                    )}

                                    <button
                                        onClick={handleResetFilters}
                                        className="text-[10.5px] font-bold text-gold hover:text-forest uppercase tracking-wider py-1 ml-1 cursor-pointer transition-colors"
                                    >
                                        Alle löschen
                                    </button>
                                </div>
                            )}

                        {/* Products Grid */}
                        {loading && listings.length === 0 ? (
                            // Skeleton Loader
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl overflow-hidden border border-forest/5 animate-pulse bg-white">
                                        <div className="aspect-[16/10] bg-sand/45" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-5 bg-sand/50 rounded-full w-3/4 animate-pulse" />
                                            <div className="h-3.5 bg-sand/35 rounded-full w-1/2 animate-pulse" />
                                            <div className="h-6 bg-sand/50 rounded-full w-1/3 mt-4 animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedListings.length === 0 ? (
                            // Empty State
                            <div className="text-center py-20 px-4 bg-sand/20 rounded-[32px] border border-dashed border-forest/10 flex flex-col items-center justify-center">
                                {appliedFilters.keyword ||
                                    appliedFilters.kategorie ||
                                    appliedFilters.unterkategorie ||
                                    appliedFilters.standort ||
                                    (appliedFilters.anbieter && appliedFilters.anbieter !== 'all') ||
                                    appliedFilters.minPrice ||
                                    appliedFilters.maxPrice ||
                                    appliedFilters.isVerhandelbar ? (
                                    <Search className="w-12 h-12 text-forest/45 mb-4" />
                                ) : (
                                    <Sparkles className="w-12 h-12 text-forest/45 mb-4" />
                                )}

                                <p className="font-display text-lg font-bold text-forest mb-2">
                                    {appliedFilters.keyword ||
                                        appliedFilters.kategorie ||
                                        appliedFilters.unterkategorie ||
                                        appliedFilters.standort ||
                                        (appliedFilters.anbieter && appliedFilters.anbieter !== 'all') ||
                                        appliedFilters.minPrice ||
                                        appliedFilters.maxPrice ||
                                        appliedFilters.isVerhandelbar
                                        ? 'Keine Inserate gefunden'
                                        : 'Noch keine Inserate vorhanden'}
                                </p>

                                <p className="font-sans text-xs text-charcoal/60 max-w-sm mb-6 font-light">
                                    {appliedFilters.keyword ||
                                        appliedFilters.kategorie ||
                                        appliedFilters.unterkategorie ||
                                        appliedFilters.standort ||
                                        (appliedFilters.anbieter && appliedFilters.anbieter !== 'all') ||
                                        appliedFilters.minPrice ||
                                        appliedFilters.maxPrice ||
                                        appliedFilters.isVerhandelbar
                                        ? 'Es gibt keine Camping-Anzeigen, die deinen aktuellen Filtern entsprechen. Du kannst die Filter zurücksetzen oder selbst ein Inserat aufgeben.'
                                        : 'Aktuell sind noch keine Angebote in diesem Bereich veröffentlicht. Sei der Erste und erstelle jetzt kostenlos dein Inserat!'}
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    {(appliedFilters.keyword ||
                                        appliedFilters.kategorie ||
                                        appliedFilters.unterkategorie ||
                                        appliedFilters.standort ||
                                        (appliedFilters.anbieter && appliedFilters.anbieter !== 'all') ||
                                        appliedFilters.minPrice ||
                                        appliedFilters.maxPrice ||
                                        appliedFilters.isVerhandelbar) && (
                                            <button
                                                onClick={handleResetFilters}
                                                className="w-full sm:w-auto bg-white hover:bg-forest/5 text-forest border border-forest/20 hover:border-forest/40 transition-all text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-xs cursor-pointer"
                                            >
                                                Alle Filter zurücksetzen
                                            </button>
                                        )}

                                    <button
                                        onClick={() => router.push(isLoggedIn ? '/mein-konto?n=yes&tab=create_listing' : '/registrieren?redirect=/mein-konto?n=yes%26tab=create_listing')}
                                        className="w-full sm:w-auto bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 text-xs font-bold uppercase tracking-wider py-3.5 px-7 rounded-full shadow-md cursor-pointer flex items-center justify-center gap-2 font-sans"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>{isLoggedIn ? 'Inserat erstellen' : 'Kostenlos inserieren'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Listings Grid
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
                                    {sortedListings.slice(0, visibleCount).map((item, idx) => (
                                        <div key={item.id} className="h-full">
                                            <ListingCard item={item} index={idx} />
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Button & Crawler-Safe Pagination Fallback */}
                                {sortedListings.length > visibleCount && (
                                    <div className="flex flex-col items-center justify-center mt-12 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVisibleCount(prev => prev + 12)}
                                            className="bg-forest text-white text-xs font-semibold uppercase tracking-wider py-4 px-10 rounded-full border border-forest/10 shadow-md hover:bg-gold hover:text-forest hover:border-gold hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer font-sans"
                                        >
                                            Weitere Angebote laden
                                        </button>
                                        <p className="text-xs text-charcoal/50 font-light">
                                            Oder blättern:{' '}
                                            <a href="/inserate?seite=2" className="text-forest hover:text-gold underline font-medium">
                                                Seite 2 ansehen
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                </div>
            </main>

            {/* ── Popular Searches (Beliebte Suchen with Scroll & Staggered Animation) ── */}
            <motion.section 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8"
            >
                <div className="relative overflow-hidden bg-white border border-forest/10 rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg shadow-forest/5">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-forest/5">
                        <div>
                            <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block mb-1.5">
                                Schnellnavigation
                            </span>
                            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-forest">
                                Beliebte Suchen & Kategorien
                            </h2>
                        </div>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/60 max-w-md font-light">
                            Direkter Schnellzugriff auf die am häufigsten gesuchten Camping-Bereiche in ganz Deutschland.
                        </p>
                    </div>

                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.04, delayChildren: 0.1 }
                            }
                        }}
                        className="relative z-10 flex flex-wrap gap-2.5"
                    >
                        {[
                            { label: 'Wohnmobil gebraucht kaufen', href: '/kategorie/wohnmobile-camper', icon: Compass },
                            { label: 'Campervan kaufen', href: '/kategorie/wohnmobile-camper', icon: Compass },
                            { label: 'Wohnwagen kaufen', href: '/kategorie/wohnmobile-camper', icon: Compass },
                            { label: 'Wohnmobile bis 20.000 €', href: '/inserate?maxPrice=20000&kategorie=Wohnmobile+%26+Camper', icon: Tag },
                            { label: 'Dachzelte', href: '/kategorie/zelte-dachzelte', icon: Layers },
                            { label: 'Vorzelte', href: '/kategorie/camping-zubehoer', icon: Layers },
                            { label: 'Stellplätze', href: '/kategorie/stellplaetze-campingplaetze', icon: Compass },
                            { label: 'Tiny Houses', href: '/kategorie/tiny-houses', icon: Compass },
                            { label: 'Gasprüfung & Werkstatt', href: '/kategorie/camping-services', icon: ShoppingBag },
                            { label: 'Wohnmobil verkaufen', href: '/anzeige-erstellen', icon: ArrowRight },
                        ].map((chip, idx) => {
                            const Icon = chip.icon;
                            return (
                                <motion.a
                                    key={idx}
                                    href={chip.href}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.9, y: 10 },
                                        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
                                    }}
                                    whileHover={{ y: -2, scale: 1.02, transition: { duration: 0.15 } }}
                                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand/30 hover:bg-forest text-forest hover:text-white border border-forest/10 hover:border-forest text-xs font-semibold tracking-tight transition-all duration-200 shadow-2xs hover:shadow-md active:scale-95"
                                >
                                    <Icon className="w-3.5 h-3.5 text-gold group-hover:text-gold transition-colors" />
                                    <span>{chip.label}</span>
                                </motion.a>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Trust Strip with Scroll Animation ── */}
            <motion.section 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4"
            >
                <div className="relative overflow-hidden bg-forest text-white rounded-[28px] py-6 px-6 sm:px-8 md:px-10 shadow-xl border border-white/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-center">
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-2xl bg-white/10 text-gold shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-display text-sm font-bold text-white mb-0.5">
                                    Direkter Kontakt
                                </h4>
                                <p className="font-sans text-xs text-white/70 font-light leading-snug">
                                    Schnelle, persönliche Kommunikation direkt zwischen Käufer und Verkäufer.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-2xl bg-white/10 text-gold shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-display text-sm font-bold text-white mb-0.5">
                                    Kostenlos für Privat
                                </h4>
                                <p className="font-sans text-xs text-white/70 font-light leading-snug">
                                    Private Inserate sind 100% kostenfrei, ohne Provision oder versteckte Gebühren.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-2xl bg-white/10 text-gold shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-display text-sm font-bold text-white mb-0.5">
                                    Sicher handeln
                                </h4>
                                <p className="font-sans text-xs text-white/70 font-light leading-snug">
                                    Praxistipps für Kaufvertrag & Probefahrt:{' '}
                                    <a href="/sicher-handeln" className="text-gold underline hover:text-white transition-colors font-medium">
                                        Ratgeber lesen
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ── Expanded SEO Text Block (~420 words) with Smooth Scroll Animation ── */}
            <motion.section 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 mb-4"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-sand/40 via-white to-sand/20 rounded-[28px] sm:rounded-[32px] md:rounded-[40px] border border-forest/10 p-6 sm:p-8 md:p-10 lg:p-12 shadow-sm font-sans space-y-8">
                    {/* Header with Title & Intro */}
                    <div className="max-w-3xl space-y-3">
                        <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Marktplatz Ratgeber & Orientierung
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-forest tracking-tight leading-tight">
                            Camping-Inserate auf Campuna entdecken
                        </h2>
                        <p className="font-medium text-forest/90 text-xs sm:text-sm md:text-base leading-relaxed">
                            Campuna ist dein Camping-Marktplatz für Fahrzeuge, Zubehör, Services, Stellplätze, Vermietung und vieles mehr.
                        </p>
                        <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-light pt-1">
                            Hier findest du aktuelle Inserate von privaten Verkäufern und gewerblichen Anbietern aus ganz Deutschland. Du suchst einen gebrauchten Campervan oder brauchst die richtige Ausrüstung für deine nächste Tour? Du möchtest deinen Campingplatz bewerben oder suchst spezialisierte Camping-Profis wie eine Werkstatt oder einen Gasprüfer? All das findest du auf dieser Seite an einem Ort.
                        </p>
                    </div>

                    {/* 3 Interactive Highlight Cards (Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 border border-forest/10 shadow-xs hover:shadow-xl hover:border-gold/40 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="p-3 rounded-2xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-colors duration-300 w-fit mb-4">
                                    <Search className="w-5 h-5" />
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-bold text-forest mb-2.5">
                                    So findest du das richtige Angebot
                                </h3>
                                <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light">
                                    Nutze die gezielten Filter nach Marke, Modell, Preis, Zustand und Standort. Beliebte Marken wie Hymer, Knaus oder VW California lassen sich direkt über das Stichwortfeld finden. Entdecke Angebote direkt in <a href="/kategorie/wohnmobile-camper" className="text-forest underline hover:text-gold font-medium">Wohnmobile & Camper</a>, <a href="/kategorie/camping-zubehoer" className="text-forest underline hover:text-gold font-medium">Camping-Zubehör</a> oder <a href="/kategorie/zelte-dachzelte" className="text-forest underline hover:text-gold font-medium">Zelte & Dachzelte</a>.
                                </p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-forest/5">
                                <a href="/kategorien" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest group-hover:text-gold transition-colors">
                                    <span>Kategorien durchstöbern</span>
                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 border border-forest/10 shadow-xs hover:shadow-xl hover:border-gold/40 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="p-3 rounded-2xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-colors duration-300 w-fit mb-4">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-bold text-forest mb-2.5">
                                    Von privat oder vom Händler kaufen
                                </h3>
                                <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light">
                                    Bei Campuna siehst du auf den ersten Blick, ob ein Angebot von einer Privatperson oder einem gewerblichen Händler stammt. Nutze den Anbieter-Filter für deine persönliche Präferenz. Wertvolle Hinweise für die Besichtigung und den Kaufvertrag findest du auf unserer Seite <a href="/sicher-handeln" className="text-forest underline hover:text-gold font-medium">Sicher handeln</a>.
                                </p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-forest/5">
                                <a href="/sicher-handeln" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest group-hover:text-gold transition-colors">
                                    <span>Tipps für sicheres Handeln</span>
                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 border border-forest/10 shadow-xs hover:shadow-xl hover:border-gold/40 transition-all duration-300 flex flex-col justify-between sm:col-span-2 lg:col-span-1"
                        >
                            <div>
                                <div className="p-3 rounded-2xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-colors duration-300 w-fit mb-4">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-bold text-forest mb-2.5">
                                    Selbst verkaufen: kostenlos inserieren
                                </h3>
                                <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light">
                                    Private Inserate sind auf Campuna komplett kostenfrei und ohne Provision. Erstelle in wenigen Minuten dein Inserat mit Fotos, detaillierter Beschreibung und Preisvorstellung über <a href="/anzeige-erstellen" className="text-forest underline hover:text-gold font-medium">Inserat erstellen</a> und erfahre mehr unter <a href="/so-funktioniert-campuna" className="text-forest underline hover:text-gold font-medium">So funktioniert Campuna</a>.
                                </p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-forest/5">
                                <a href="/anzeige-erstellen" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest group-hover:text-gold transition-colors">
                                    <span>Jetzt Inserat aufgeben</span>
                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>
            {/* ── Categories Section Carousel (Clean non-docked layout without negative margin overlap) ── */}
            <section className="py-12 sm:py-16 px-4 bg-sand/20 border-t border-forest/5">
                <div className="max-w-7xl mx-auto mb-8 text-center">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold block mb-2">
                        STÖBERN
                    </span>
                    <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                        Nach Kategorie filtern
                    </h2>
                    <p className="font-sans text-xs sm:text-sm text-charcoal/65 mt-2 max-w-xl mx-auto font-light">
                        Wähle deinen Bereich und entdecke passende Angebote in ganz Deutschland.
                    </p>
                </div>
                <CategoriesSection isDocked={false} showHeader={false} />
            </section>


            {/* ── FAQ Accordion Section (Matching FaqSection.jsx UI) ── */}
            <section id="faq" className="py-10 sm:py-16 bg-white relative overflow-hidden scroll-mt-24">
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sand/30 rounded-full blur-3xl pointer-events-none opacity-50" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Häufig gestellte Fragen
                        </span>
                        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                            Häufige Fragen zu den Inseraten
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                            Die wichtigsten Antworten rund um die Suche, Preise und Kontaktaufnahme auf Campuna.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-4">
                        {[
                            {
                                id: 'faq_0',
                                q: 'Wie finde ich das passende Camping-Inserat?',
                                a: 'Nutze die Filter auf dieser Seite: Suche nach Marke, Modell oder Stichwort, grenze den Preis ein und wähle Kategorie, Anbieter und Ort. Mit der Sortierung siehst du die neuesten oder günstigsten Angebote zuerst. Über die Kategorien unten kommst du direkt zu Wohnmobilen, Zelten, Zubehör und mehr.',
                            },
                            {
                                id: 'faq_1',
                                q: 'Was bedeutet Privat oder Gewerblich bei einem Inserat?',
                                a: 'Privat bedeutet, dass eine Privatperson verkauft, meist ohne Gewährleistung. Gewerblich bedeutet, dass ein Händler oder Dienstleister mit Firmenprofil anbietet. Auf Campuna findest du beide Arten von Anbietern und kannst gezielt danach filtern.',
                            },
                            {
                                id: 'faq_2',
                                q: 'Was bedeutet VB beim Preis?',
                                a: 'VB steht für Verhandlungsbasis. Der angegebene Preis ist ein Vorschlag des Anbieters, über den du fair verhandeln kannst. Nutze dafür die direkte Nachricht an den Verkäufer und vereinbare am besten eine Besichtigung vor dem Kauf.',
                            },
                            {
                                id: 'faq_3',
                                q: 'Wie erstelle ich selbst ein Inserat auf Campuna?',
                                a: 'Lege ein kostenloses Konto an, wähle die passende Kategorie und stelle dein Angebot mit Fotos, Beschreibung und Preis ein. Private Inserate sind kostenlos, ohne Provision. Eine Anleitung findest du unter So funktioniert Campuna.',
                            },
                        ].map((faq, idx) => {
                            const isOpen = openFaq === faq.id;
                            return (
                                <motion.div
                                    key={faq.id}
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
                                        onClick={() => toggleFaq(faq.id)}
                                        className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                    >
                                        <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                            {faq.q}
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
                                                <div className="px-6 sm:px-8 pb-5 font-sans text-xs sm:text-sm text-charcoal/75 leading-relaxed font-light whitespace-pre-line border-t border-forest/10 pt-3">
                                                    {faq.a}
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


            {/* ── Mobile Filter slide-in drawer ── */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-55 flex flex-col lg:hidden border-l border-forest/10"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-forest/10 flex items-center justify-between bg-sand/30 flex-nowrap gap-2">
                                <span className="font-display text-base font-bold text-forest flex items-center gap-2 whitespace-nowrap shrink-0">
                                    <Filter className="w-4 h-4 text-gold shrink-0" />
                                    <span>Filter anpassen</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="p-1 px-2 rounded-full border border-forest/10 hover:bg-forest hover:text-white transition-colors cursor-pointer shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scrollable Filters */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Keyword */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                        Marke, Modell, Stichwort...
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => handleKeywordChange(e.target.value)}
                                            placeholder="Z.B. Morelo, Zelt, Solar, Tiny House..."
                                            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium"
                                        />
                                        {keyword && (
                                            <button
                                                type="button"
                                                onClick={() => handleKeywordChange('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal p-0.5 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Price range */}
                                <div>
                                    <PriceRangeSlider
                                        minPrice={minPrice}
                                        maxPrice={maxPrice}
                                        setMinPrice={setMinPrice}
                                        setMaxPrice={setMaxPrice}
                                        onChange={handlePriceChange}
                                    />

                                    <label className="mt-3.5 flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isVerhandelbar}
                                            onChange={(e) => handleVerhandelbarChange(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-forest/15 text-forest focus:ring-transparent focus:ring-offset-0 transition-colors accent-forest"
                                        />
                                        <span className="text-[11px] font-semibold text-charcoal/70">
                                            Preis verhandelbar (VB)
                                        </span>
                                    </label>
                                </div>

                                {/* Provider (Anbieter) */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                        Anbieter
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 bg-sand/30 p-1 rounded-full border border-forest/15">
                                        {[
                                            { key: 'all', label: 'Alle' },
                                            { key: 'privat', label: 'Privat' },
                                            { key: 'gewerblich', label: 'Gewerblich' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => handleAnbieterChange(opt.key)}
                                                className={`py-1.5 px-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${anbieter === opt.key
                                                    ? 'bg-forest text-white shadow-xs'
                                                    : 'text-charcoal/65 hover:text-charcoal hover:bg-sand/40'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category (Kategorie) */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                        Kategorie
                                    </label>
                                    <select
                                        value={kategorie}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium cursor-pointer"
                                    >
                                        <option value="">Alle Kategorien</option>
                                        {CATEGORIES.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sub-Category (Unterkategorie) */}
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${kategorie ? 'text-forest/90' : 'text-charcoal/30'
                                        }`}>
                                        Unterkategorie
                                    </label>
                                    <select
                                        value={unterkategorie}
                                        onChange={(e) => handleSubcategoryChange(e.target.value)}
                                        disabled={!kategorie}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white disabled:bg-sand/30 disabled:text-charcoal/30 text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium cursor-pointer"
                                    >
                                        <option value="">Alle Unterkategorien</option>
                                        {currentSubcategories.map((sub, i) => (
                                            <option key={i} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location (Standort) */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest/90 mb-2">
                                        Standort / PLZ / Bundesland
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                        <input
                                            type="text"
                                            value={standort}
                                            onChange={(e) => handleStandortChange(e.target.value)}
                                            placeholder="Ort, PLZ oder Bundesland (z.B. Kempten, NRW, München)..."
                                            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-1.5 focus:ring-forest/20 transition-all font-medium"
                                        />
                                        {standort && (
                                            <button
                                                type="button"
                                                onClick={() => handleStandortChange('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal p-0.5 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Drawer Actions */}
                            <div className="p-5 border-t border-forest/10 bg-sand/30 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="flex-1 whitespace-nowrap bg-white border border-forest/20 hover:border-forest/40 text-charcoal text-[11px] font-bold uppercase tracking-wider py-3.5 rounded-full text-center transition-all cursor-pointer"
                                >
                                    Zurücksetzen
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSearchSubmit}
                                    className="flex-1 whitespace-nowrap bg-forest hover:bg-gold hover:text-forest text-white text-[11px] font-bold uppercase tracking-wider py-3.5 rounded-full text-center transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    Filter anwenden
                                </button>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}

// ─── Default Page Export wrapped with Suspense ─────────────────────────────────────────
export default function InseratePage() {
    return (
        <Suspense fallback={
            <CircleLoader size="lg" color="forest" fullPage />
        }>
            <ListingsContent />
        </Suspense>
    );
}


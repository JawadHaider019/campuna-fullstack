import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, MapPin, Eye, Search, 
    Compass, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { getImageUrl } from '@/utils/imageUrl';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import { isListingBoosted } from '@/utils/sellerBadge';
import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';
import { formatPrice, formatCleanLocation } from '@/utils/formatters';

/**
 * Safely generate deterministic URL slug without prototype pollution or XSS vectors
 */
function buildListingSlug(title = '', id = '') {
    const cleanTitle = String(title || '')
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const cleanId = String(id || '').trim();
    return cleanTitle ? `${cleanTitle}-${cleanId}` : cleanId;
}

/**
 * Normalize and sanitize listing object from API or Zustand store
 */
function normalizeListing(item) {
    if (!item || typeof item !== 'object') return null;

    const id = String(item.id || item._id || '').trim();
    if (!id) return null;

    const title = String(item.title || item.description || 'Camping Angebot').trim();
    const category = String(item.category || item.Category || 'Camping Zubehör').trim();
    const subcategory = String(item.subcategory || item.sub_category || item['Sub - Category'] || '').trim();
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const pricePeriod = String(item.pricePeriod || item.price_period || (item.rental_duration ? 'Miete' : 'Kaufpreis')).trim();
    const location = String(item.location || 'Deutschland').trim();
    const displayLocation = String(item.displayLocation || item.location || 'Deutschland').trim();
    const slug = item.slug ? String(item.slug).trim() : buildListingSlug(title, id);

    let rawImages = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        rawImages = item.images;
    } else if (typeof item.images === 'string' && item.images.trim()) {
        try {
            const parsed = JSON.parse(item.images);
            rawImages = Array.isArray(parsed) ? parsed : [item.images];
        } catch {
            rawImages = [item.images];
        }
    } else if (item['Main Image']) {
        rawImages = [item['Main Image']];
    }
    
    // Sanitize image URLs and filter out invalid values
    const images = rawImages
        .map(img => getImageUrl(img, null))
        .filter(Boolean);

    const sellerType = item.seller?.type || item.listing_user_type || item.user_type || (item.company_name ? 'Gewerblich' : 'Privat');
    const sellerTier = item.seller?.tier || item.company_tier || item.seller_tier || item.tier || 'FREE';

    let features = [];
    if (Array.isArray(item.features) && item.features.length > 0) {
        features = item.features.map(f => String(f).trim()).filter(Boolean);
    } else {
        if (item.condition) features.push(String(item.condition).trim());
        if (subcategory) features.push(subcategory);
        if (category && !features.includes(category)) features.push(category);
    }
    if (features.length === 0) {
        features = ['Camping'];
    }

    const isBoosted = isListingBoosted(item);
    const isFeatured = Boolean(item.featured);

    return {
        id,
        slug,
        title,
        category,
        subcategory,
        price,
        pricePeriod,
        location,
        displayLocation,
        images,
        seller: {
            name: item.seller?.name || item.company_name || (sellerType === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatanbieter'),
            type: sellerType,
            tier: sellerTier,
            verified: true,
            achievements: item.seller?.achievements || (item.is_pioneer ? [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }] : [])
        },
        seller_tier: sellerTier,
        company_tier: sellerTier,
        tier: sellerTier,
        features,
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted,
        isNegotiable: Boolean(item.is_negotiable || item.isNegotiable || item.negotiable),
        is_pioneer: Boolean(item.is_pioneer || item.seller?.is_pioneer),
        is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club)
    };
}

// ─── Marketplace-Matched Favorite Listing Card ──────────────────────────────
const FavoriteListingCard = memo(function FavoriteListingCard({ item: rawItem, onRemove }) {
    const router = useRouter();
    const item = useMemo(() => normalizeListing(rawItem), [rawItem]);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgIdx, setImgIdx] = useState(0);
    const [imgFailed, setImgFailed] = useState(false);

    const handleImgError = useCallback(() => {
        if (item?.images && imgIdx < item.images.length - 1) {
            setImgIdx(i => i + 1);
        } else {
            setImgFailed(true);
        }
    }, [imgIdx, item?.images]);

    const handleCardClick = useCallback(() => {
        if (!item?.slug) return;
        router.push(`/inserate/${encodeURIComponent(item.slug)}`);
    }, [item?.slug, router]);

    const handleRemoveClick = useCallback((e) => {
        e.stopPropagation();
        if (!item?.id) return;
        if (onRemove) {
            onRemove(item.id);
        } else {
            toggleFavorite(item);
        }
    }, [item, onRemove, toggleFavorite]);

    if (!item) return null;

    const displayLoc = formatCleanLocation(item.displayLocation || item.location || '');
    const isBoosted = item.is_boosted;
    const hasImage = item.images && item.images.length > 0 && !imgFailed;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3 }}
            onClick={handleCardClick}
            className={`group relative flex flex-col rounded-[20px] md:rounded-[24px] overflow-hidden transition-all duration-300 cursor-pointer h-full select-none will-change-transform ${
                isBoosted
                    ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)]'
                    : 'bg-white border border-forest/10 hover:border-forest/20 hover:shadow-xl'
            }`}
        >
            {/* Image Area */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand/20">
                {hasImage ? (
                    <img
                        src={item.images[imgIdx]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none will-change-transform"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={handleImgError}
                    />
                ) : (
                    <ListingImagePlaceholder category={item.category} />
                )}

                {/* Top Badge Row */}
                <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 flex items-center justify-between z-20 gap-2">
                    <ListingBadgesRow item={item} />

                    <button
                        type="button"
                        aria-label="Von Merkzettel entfernen"
                        onClick={handleRemoveClick}
                        title="Vom Merkzettel entfernen"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer pointer-events-auto shrink-0 bg-rose-500 text-white hover:bg-rose-600 scale-105 hover:scale-110 active:scale-95"
                    >
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-white" />
                    </button>
                </div>

                {/* Location overlay */}
                <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 flex items-center pointer-events-none text-white/95 max-w-[85%] z-10">
                    <div className="bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-[8.5px] sm:text-[9px] flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gold shrink-0" />
                        <span className="truncate">{displayLoc}</span>
                    </div>
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white text-forest px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inserat ansehen</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                    <h3 className="font-display text-xs sm:text-sm lg:text-base font-bold text-black group-hover:text-gold transition-colors duration-200 mb-2 line-clamp-2 leading-snug">
                        {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                        {item.features?.slice(0, 2).map((feat, idx) => (
                            <span
                                key={idx}
                                className="text-[8px] sm:text-[9.5px] text-charcoal/65 bg-sand px-2 py-0.5 rounded-md border border-forest/5 whitespace-nowrap"
                            >
                                {feat}
                            </span>
                        ))}
                        {item.isNegotiable && (
                            <span className="text-[8px] sm:text-[9.5px] text-forest bg-beige/40 px-2 py-0.5 rounded-md border border-forest/5 font-semibold">
                                VB
                            </span>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-forest/5 flex items-end justify-between">
                    <div>
                        <span className="block text-[8px] sm:text-[9.5px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1">
                            {item.pricePeriod}
                        </span>
                        <span className="font-display text-sm sm:text-base lg:text-lg font-extrabold text-forest">
                            {item.price > 0 ? formatPrice(item.price) : 'Preis VB'}
                        </span>
                    </div>
                    <span className="font-sans text-[9px] sm:text-xs font-bold text-forest group-hover:text-gold flex items-center space-x-0.5 transition-colors">
                        <span>Details</span>
                        <span className="transform group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

FavoriteListingCard.displayName = 'FavoriteListingCard';

export default function AccountFavoritesTab({ onNavigateToListings }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [mounted, setMounted] = useState(false);

    const favoriteListings = useFavoritesStore((state) => state.favoriteListings);
    const removeFavoriteItem = useFavoritesStore((state) => state.removeFavoriteItem);
    const fetchFavorites = useFavoritesStore((state) => state.fetchFavorites);

    useEffect(() => {
        setMounted(true);
        fetchFavorites();
    }, [fetchFavorites]);

    const categories = useMemo(() => {
        const set = new Set();
        (favoriteListings || []).forEach(item => {
            if (item?.category) set.add(String(item.category).trim());
        });
        return ['ALL', ...Array.from(set)];
    }, [favoriteListings]);

    const filteredFavorites = useMemo(() => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        return (favoriteListings || []).filter((item) => {
            if (!item) return false;
            const matchesSearch = !cleanSearch || 
                (item.title && String(item.title).toLowerCase().includes(cleanSearch)) ||
                (item.location && String(item.location).toLowerCase().includes(cleanSearch)) ||
                (item.description && String(item.description).toLowerCase().includes(cleanSearch));

            const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [favoriteListings, searchTerm, categoryFilter]);

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-5 sm:space-y-6 max-w-[1700px] mx-auto"
        >
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-beige">
                <div className="flex items-center gap-3 min-w-0">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.4, ease: 'backOut' }}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0 shadow-xs"
                    >
                        <Heart className="w-5 h-5 fill-rose-500" />
                    </motion.div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-forest tracking-tight">
                                Mein Merkzettel
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 font-mono shadow-xs">
                                {favoriteListings.length} {favoriteListings.length === 1 ? 'Inserat' : 'Inserate'}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-charcoal/60 mt-0.5 font-medium">
                            Deine gespeicherten Fahrzeuge, Zubehör und Campingangebote im Überblick
                        </p>
                    </div>
                </div>

                {favoriteListings.length > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/inserate')}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-forest bg-[#faf8f3] hover:bg-sand border border-beige hover:border-gold/50 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                    >
                        <Compass className="w-3.5 h-3.5 text-gold-dark" />
                        <span>Weitere Inserate entdecken</span>
                    </motion.button>
                )}
            </div>

            {/* Filter and Search Toolbar */}
            {favoriteListings.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3 bg-[#faf8f3] p-2.5 sm:p-3 rounded-2xl border border-beige shadow-xs"
                >
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Merkzettel durchsuchen (Titel, Ort, Modell)..."
                            className="w-full bg-white border border-beige rounded-xl pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all shadow-xs"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-sm font-bold cursor-pointer w-5 h-5 flex items-center justify-center rounded-full hover:bg-sand/60 transition-colors"
                                title="Suche löschen"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {categories.length > 2 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
                            {categories.map((cat) => (
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                                        categoryFilter === cat
                                            ? 'bg-forest text-sand shadow-xs font-black ring-1 ring-gold/40'
                                            : 'bg-white text-charcoal/70 hover:text-forest hover:bg-sand/40 border border-beige'
                                    }`}
                                >
                                    {cat === 'ALL' ? 'Alle Kategorien' : cat}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Main Content List / Grid */}
            {favoriteListings.length === 0 ? (
                /* Empty state */
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12 sm:py-16 bg-[#faf8f3] rounded-3xl border border-dashed border-forest/15 px-4 sm:px-6 max-w-2xl mx-auto my-4 sm:my-6"
                >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-rose-100 shadow-sm">
                        <Heart className="w-8 h-8 sm:w-10 sm:h-10 fill-rose-500" />
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-forest mb-2">
                        Dein Merkzettel ist noch leer
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal/65 max-w-md mx-auto mb-6 leading-relaxed font-sans">
                        Klicke bei einem interessanten Inserat einfach auf das Herz-Symbol, um es für später zu speichern und jederzeit schnell wiederzufinden.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/inserate')}
                        className="bg-forest hover:bg-[#004709] text-sand text-xs sm:text-sm font-bold uppercase tracking-wider py-3 sm:py-3.5 px-6 sm:px-8 rounded-full shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                        <Compass className="w-4 h-4 text-gold" />
                        <span>Jetzt Camping-Inserate entdecken</span>
                    </motion.button>
                </motion.div>
            ) : filteredFavorites.length === 0 ? (
                /* No search results */
                <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 sm:py-14 bg-[#faf8f3] rounded-2xl sm:rounded-3xl border border-beige p-6"
                >
                    <AlertCircle className="w-8 h-8 text-charcoal/40 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-charcoal">Keine passenden Inserate für "{searchTerm}" gefunden.</p>
                    <button
                        onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }}
                        className="mt-3 text-xs sm:text-sm text-forest underline font-bold cursor-pointer hover:text-gold-dark transition-colors"
                    >
                        Filter zurücksetzen
                    </button>
                </motion.div>
            ) : (
                /* Grid of Favorites with Responsive Columns & Staggered Animations */
                <motion.div 
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.06
                            }
                        }
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredFavorites.map((item) => (
                            <FavoriteListingCard
                                key={item.id}
                                item={item}
                                onRemove={removeFavoriteItem}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
}

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Heart, MapPin, ShieldCheck, Eye, ArrowRight, ChevronLeft, ChevronRight, Rocket, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllListings } from '@/api/listings';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { STATIC_LISTINGS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import { ListingBadgesRow } from '@/app/components/ListingBadge';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80';

function normalizeListing(item) {
    if (!item) return null;

    const id = item.id || item._id || String(Math.random());
    const title = item.title || item.description || "Camping Angebot";
    const category = item.category || item.Category || 'Camping Zubehör';
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const pricePeriod = item.pricePeriod || 'Preis';
    const location = item.location || "Deutschland";

    let images = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        images = item.images;
    } else if (typeof item.images === 'string') {
        images = [item.images];
    } else if (item["Main Image"]) {
        images = [item["Main Image"]];
    }
    if (images.length === 0) {
        images = [DEFAULT_IMAGE];
    }
    images = images.map(img => getImageUrl(img, DEFAULT_IMAGE));

    const sellerRole = item.seller_role || item.role || item.seller?.role || '';
    const isAdmin = Boolean(
        sellerRole === 'ADMIN' ||
        item.is_admin === true ||
        item.seller?.is_admin === true ||
        item.is_campuna_club === true ||
        item.seller?.is_campuna_club === true
    );

    const sellerType = isAdmin ? 'Admin' : (item.seller?.type || item.listing_user_type || item.seller_type || 'Privat');
    const sellerTier = isAdmin ? 'ADMIN' : (item.seller?.tier || item.company_tier || item.seller_tier || item.tier || 'FREE');

    let features = [];
    if (Array.isArray(item.features) && item.features.length > 0) {
        features = item.features;
    } else {
        if (item.condition) features.push(item.condition);
        if (item.subcategory) features.push(item.subcategory);
    }
    if (features.length === 0) {
        features = ['Camping'];
    }

    const isBoosted = Boolean(
        item.is_boosted || 
        (item.boosted_until && new Date(item.boosted_until) > new Date()) ||
        isAdmin
    );
    const isFeatured = Boolean(item.featured);

    return {
        id,
        title,
        category,
        price,
        pricePeriod,
        location,
        images,
        sellerType,
        seller_type: sellerType,
        seller_role: sellerRole,
        role: sellerRole,
        is_admin: isAdmin,
        is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club),
        seller_tier: sellerTier,
        company_tier: sellerTier,
        tier: sellerTier,
        seller: {
            name: item.seller?.name || item.seller_name || (isAdmin ? 'Campuna' : (sellerType === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatanbieter')),
            type: sellerType,
            tier: sellerTier,
            role: sellerRole,
            is_admin: isAdmin,
            is_campuna_club: Boolean(item.is_campuna_club || item.seller?.is_campuna_club),
            verified: true
        },
        features,
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted
    };
}

const ListingCard = React.memo(({ item: rawItem, onCardClick }) => {
    const item = useMemo(() => normalizeListing(rawItem), [rawItem]);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgSrc, setImgSrc] = useState(item?.images[0] || DEFAULT_IMAGE);
    const tagsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        if (tagsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
        }
    }, []);

    useEffect(() => {
        checkScroll();
        const timer = setTimeout(checkScroll, 200);
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScroll);
        };
    }, [item?.features, checkScroll]);

    if (!item) return null;

    const scrollTags = (e, direction) => {
        e.stopPropagation();
        if (tagsRef.current) {
            const scrollAmount = direction === 'left' ? -90 : 90;
            tagsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div
            onClick={() => onCardClick(item)}
            className={`listing-card group relative flex-shrink-0 w-[300px] md:w-[320px] flex flex-col h-full rounded-[24px] overflow-hidden transition-all duration-300 select-none cursor-pointer ${
                item.is_boosted
                    ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)]'
                    : 'bg-white border border-forest/5 hover:border-forest/10 hover:shadow-lg'
            }`}
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                <img
                    src={imgSrc}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                    loading="lazy"
                    onError={() => setImgSrc(DEFAULT_IMAGE)}
                />
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer pointer-events-auto shrink-0 ${isFavorite
                            ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                            : 'bg-white/80 hover:bg-white text-forest hover:text-rose-500 hover:scale-110'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-white' : ''}`} />
                    </button>
                </div>
                <div className="absolute bottom-4 right-0 inset-x-4 flex items-center justify-end pointer-events-none text-white/90 z-10">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                        <span>{item.location}</span>
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white text-forest px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                        <Eye className="w-4 h-4" />
                        <span>Inserat ansehen</span>
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="font-display text-md font-semibold text-black group-hover:text-gold transition-colors duration-200 mb-2 line-clamp-1">
                        {item.title}
                    </h3>
                    <div className="relative group/tags mb-2" onClick={(e) => e.stopPropagation()}>
                        {canScrollLeft && (
                            <button
                                type="button"
                                onClick={(e) => scrollTags(e, 'left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-white/90 hover:bg-white text-forest shadow rounded-full flex items-center justify-center border border-forest/10 transition-all duration-200"
                                aria-label="Scroll tags left"
                            >
                                <ChevronLeft className="w-2.5 h-2.5" />
                            </button>
                        )}
                        <div
                            ref={tagsRef}
                            onScroll={checkScroll}
                            className="flex overflow-x-auto gap-1.5 no-scrollbar scroll-smooth"
                        >
                            {item.features.map((feat, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] text-charcoal/60 bg-sand px-2 py-1 rounded-md border border-forest/5 whitespace-nowrap shrink-0 select-none"
                                >
                                    {feat}
                                </span>
                            ))}
                        </div>
                        {canScrollRight && (
                            <button
                                type="button"
                                onClick={(e) => scrollTags(e, 'right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-white/90 hover:bg-white text-forest shadow rounded-full flex items-center justify-center border border-forest/10 transition-all duration-200"
                                aria-label="Scroll tags right"
                            >
                                <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
                    <span className="block text-[10px] uppercase tracking-widest text-charcoal/40 font-mono">
                        {item.pricePeriod}
                    </span>
                    <span className="font-display text-lg font-bold text-forest">
                        {item.price.toLocaleString('de-DE')} €
                    </span>
                </div>
            </div>
        </div>
    );
});

ListingCard.displayName = 'ListingCard';

export default function Listing({
    listings: propListings,
    isLoading = false,
    wishlistedIds = [],
    onToggleWishlist,
    selectedCategoryFilter,
    searchQuery,
    searchLocation,
    badge = "ZUM STÖBERN",
    title = "Camping-Angebote auf Campuna",
    subtitle = "Entdecke wechselnde Inserate von Campern, Anbietern und Unternehmen."
}) {
    const router = useRouter();
    const rowRef1 = useRef(null);
    const rowRef2 = useRef(null);
    const [rowConstraints1, setRowConstraints1] = useState(0);
    const [rowConstraints2, setRowConstraints2] = useState(0);
    const [apiListings, setApiListings] = useState([]);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await getAllListings();
                if (res.success && Array.isArray(res.data?.listings)) {
                    setApiListings(res.data.listings);
                } else {
                    setApiListings([]);
                }
            } catch (err) {
                console.error("Error loading listings from database:", err);
                setApiListings([]);
            }
        };
        fetchListings();
    }, []);

    const activeListings = useMemo(() => {
        if (propListings && propListings.length > 0) {
            return propListings;
        }
        if (apiListings && apiListings.length > 0) {
            return apiListings;
        }
        return STATIC_LISTINGS;
    }, [apiListings, propListings]);

    const filteredListings = useMemo(() => {
        return activeListings.filter((rawItem) => {
            const item = normalizeListing(rawItem);
            if (!item) return false;
            if (selectedCategoryFilter && item.category !== selectedCategoryFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const inTitle = item.title.toLowerCase().includes(query);
                const inFeatures = item.features.some(f => f.toLowerCase().includes(query));
                if (!inTitle && !inFeatures) return false;
            }
            if (searchLocation) {
                const loc = searchLocation.toLowerCase();
                if (!item.location.toLowerCase().includes(loc)) return false;
            }
            return true;
        });
    }, [activeListings, selectedCategoryFilter, searchQuery, searchLocation]);

    const { row1Listings, row2Listings } = useMemo(() => {
        if (filteredListings.length <= 1) {
            return { row1Listings: filteredListings, row2Listings: [] };
        }
        const countPerRow = Math.ceil(filteredListings.length / 2);
        return {
            row1Listings: filteredListings.slice(0, countPerRow),
            row2Listings: filteredListings.slice(countPerRow)
        };
    }, [filteredListings]);

    const dirRef1 = useRef(1);
    const dirRef2 = useRef(-1);
    const isHoveredRef1 = useRef(false);
    const isHoveredRef2 = useRef(false);
    const isDraggingRef1 = useRef(false);
    const isDraggingRef2 = useRef(false);

    useEffect(() => {
        const measure = () => {
            if (rowRef1.current) {
                setRowConstraints1(Math.max(0, rowRef1.current.scrollWidth - rowRef1.current.offsetWidth));
            }
            if (rowRef2.current) {
                setRowConstraints2(Math.max(0, rowRef2.current.scrollWidth - rowRef2.current.offsetWidth));
            }
        };
        const timer = setTimeout(measure, 100);
        window.addEventListener('resize', measure);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', measure);
        };
    }, [row1Listings, row2Listings]);

    const handleCardClick = useCallback((item) => {
         const titleSlug = item.slug || (item.title
             ? item.title
                 .toLowerCase()
                 .replace(/ä/g, 'ae')
                 .replace(/ö/g, 'oe')
                 .replace(/ü/g, 'ue')
                 .replace(/ß/g, 'ss')
                 .replace(/[^a-z0-9]+/g, '-')
                 .replace(/^-+|-+$/g, '')
             : item.id);
         router.push(`/inserate/${titleSlug}`);
     }, [router]);

    const x1 = useMotionValue(0);
    const x2 = useMotionValue(0);

    useEffect(() => {
        if (rowConstraints1 > 0) {
            x1.set(-rowConstraints1);
            dirRef1.current = 1;
        } else {
            x1.set(0);
        }
    }, [row1Listings, rowConstraints1, x1]);

    useEffect(() => {
        if (rowConstraints2 > 0) {
            x2.set(0);
            dirRef2.current = -1;
        } else {
            x2.set(0);
        }
    }, [row2Listings, rowConstraints2, x2]);

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        const loop = (time) => {
            const delta = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;

            if (row1Listings.length > 0 && !isHoveredRef1.current && !isDraggingRef1.current && rowConstraints1 > 0) {
                let currentX1 = x1.get() + dirRef1.current * 20 * delta;
                if (dirRef1.current === -1 && currentX1 <= -rowConstraints1) {
                    currentX1 = -rowConstraints1;
                    dirRef1.current = 1;
                } else if (dirRef1.current === 1 && currentX1 >= 0) {
                    currentX1 = 0;
                    dirRef1.current = -1;
                }
                x1.set(currentX1);
            } else if (rowConstraints1 <= 0) {
                x1.set(0);
            }

            if (row2Listings.length > 0 && !isHoveredRef2.current && !isDraggingRef2.current && rowConstraints2 > 0) {
                let currentX2 = x2.get() + dirRef2.current * 20 * delta;
                if (dirRef2.current === -1 && currentX2 <= -rowConstraints2) {
                    currentX2 = -rowConstraints2;
                    dirRef2.current = 1;
                } else if (dirRef2.current === 1 && currentX2 >= 0) {
                    currentX2 = 0;
                    dirRef2.current = -1;
                }
                x2.set(currentX2);
            } else if (rowConstraints2 <= 0) {
                x2.set(0);
            }

            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [row1Listings, row2Listings, rowConstraints1, rowConstraints2, x1, x2]);

    return (
        <section id="exclusive-offers" className="py-10 sm:py-16 bg-white scroll-mt-24 overflow-hidden">
            <div className="max-w-8xl mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                    <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            {badge}
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-black">
                            {title}
                        </h2>
                        <p className="font-sans text-sm text-charcoal/60 leading-relaxed font-light">
                            {subtitle}
                        </p>
                    </div>
                    <div className="hidden lg:block">
                        <button onClick={() => router.push('/inserate')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer">
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Inserate</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-5 relative">
                        <div className="flex gap-5 overflow-hidden">
                            {[1, 2, 3, 4].map(n => (
                                <div key={`sk1-${n}`} className="flex-shrink-0 w-[300px] md:w-[320px] h-[300px] bg-sand/30 animate-pulse rounded-[24px] border border-forest/5 p-4 flex flex-col justify-between">
                                    <div className="w-full h-40 bg-sand/60 rounded-[16px]" />
                                    <div className="space-y-2 mt-4">
                                        <div className="h-5 bg-sand/60 rounded w-3/4" />
                                        <div className="h-4 bg-sand/40 rounded w-1/2" />
                                    </div>
                                    <div className="h-6 bg-sand/60 rounded w-1/3 mt-4" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-20 bg-sand/30 rounded-[32px] border border-dashed border-forest/10">
                        <p className="font-display text-lg text-forest/70 mb-4">
                            Keine Inserate entsprechen Ihren Filterkriterien.
                        </p>
                        <button
                            onClick={() => router.push('/inserate')}
                            className="bg-forest text-sand text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full hover:bg-gold hover:text-forest transition-colors duration-300"
                        >
                            Alle Inserate ansehen
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 relative">
                        <div className="hidden md:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        {/* Row 1 */}
                        {row1Listings.length > 0 && (
                            <div 
                                className="relative overflow-hidden pb-1 cursor-grab active:cursor-grabbing" 
                                ref={rowRef1}
                                onMouseEnter={() => { isHoveredRef1.current = true; }}
                                onMouseLeave={() => { isHoveredRef1.current = false; }}
                                onPointerEnter={() => { isHoveredRef1.current = true; }}
                                onPointerLeave={() => { isHoveredRef1.current = false; }}
                            >
                                <motion.div
                                    drag="x"
                                    dragConstraints={{ right: 0, left: -rowConstraints1 }}
                                    style={{ x: x1 }}
                                    onDragStart={() => { isDraggingRef1.current = true; isHoveredRef1.current = true; }}
                                    onDragEnd={() => { isDraggingRef1.current = false; }}
                                    onMouseEnter={() => { isHoveredRef1.current = true; }}
                                    onMouseLeave={() => { isHoveredRef1.current = false; }}
                                    onPointerEnter={() => { isHoveredRef1.current = true; }}
                                    onPointerLeave={() => { isHoveredRef1.current = false; }}
                                    className="flex gap-5 w-max"
                                >
                                    {row1Listings.map((item, idx) => (
                                        <ListingCard
                                            key={`${item.id}-r1-${idx}`}
                                            item={item}
                                            onCardClick={handleCardClick}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {/* Row 2 */}
                        {row2Listings.length > 0 && (
                            <div 
                                className="relative overflow-hidden pb-1 cursor-grab active:cursor-grabbing" 
                                ref={rowRef2}
                                onMouseEnter={() => { isHoveredRef2.current = true; }}
                                onMouseLeave={() => { isHoveredRef2.current = false; }}
                                onPointerEnter={() => { isHoveredRef2.current = true; }}
                                onPointerLeave={() => { isHoveredRef2.current = false; }}
                            >
                                <motion.div
                                    drag="x"
                                    dragConstraints={{ right: 0, left: -rowConstraints2 }}
                                    style={{ x: x2 }}
                                    onDragStart={() => { isDraggingRef2.current = true; isHoveredRef2.current = true; }}
                                    onDragEnd={() => { isDraggingRef2.current = false; }}
                                    onMouseEnter={() => { isHoveredRef2.current = true; }}
                                    onMouseLeave={() => { isHoveredRef2.current = false; }}
                                    onPointerEnter={() => { isHoveredRef2.current = true; }}
                                    onPointerLeave={() => { isHoveredRef2.current = false; }}
                                    className="flex gap-5 w-max"
                                >
                                    {row2Listings.map((item, idx) => (
                                        <ListingCard
                                            key={`${item.id}-r2-${idx}`}
                                            item={item}
                                            onCardClick={handleCardClick}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        <div className="mt-7 flex justify-center lg:hidden">
                            <button onClick={() => router.push('/inserate')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer">
                                <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Inserate</span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

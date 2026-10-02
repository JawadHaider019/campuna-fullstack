'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    MapPin,
    ShieldCheck,
    Check,
    Eye,
    Heart,
    Flame,
    Tag
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllListings } from '@/api/listings';
import { STATIC_LISTINGS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';

export default function FeaturedShowcaseSection() {
    const router = useRouter();
    const [featuredItem, setFeaturedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const isFavorite = useFavoritesStore((state) => state.isFavorite(featuredItem?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

    useEffect(() => {
        let isMounted = true;
        const fetchFeatured = async () => {
            try {
                const res = await getAllListings();
                const listingList = res.data?.listings || res.listings || (Array.isArray(res.data) ? res.data : []);

                if (Array.isArray(listingList) && listingList.length > 0) {
                    // Priority 1: Boosted / Featured listing with at least one image
                    // Priority 2: Any approved listing with images
                    // Priority 3: First available approved listing in DB
                    const candidate = listingList.find(l => (l.is_boosted || l.featured) && (l.images?.length > 0 || l['Main Image']))
                        || listingList.find(l => (l.images?.length > 0 || l['Main Image']))
                        || listingList[0];

                    if (candidate && isMounted) {
                        let imgs = [];
                        if (Array.isArray(candidate.images) && candidate.images.length > 0) {
                            imgs = candidate.images;
                        } else if (typeof candidate.images === 'string') {
                            try {
                                imgs = JSON.parse(candidate.images);
                            } catch {
                                imgs = [candidate.images];
                            }
                        } else if (candidate['Main Image']) {
                            imgs = [candidate['Main Image']];
                        }

                        imgs = (imgs || []).filter(Boolean).map(url => getImageUrl(url, null)).filter(Boolean);

                        const rawPrice = typeof candidate.price === 'number' ? candidate.price : parseFloat(candidate.price) || 0;
                        const candidateSlug = candidate.slug || (candidate.title ? candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : candidate.id);

                        setFeaturedItem({
                            id: candidate.id || candidateSlug,
                            slug: candidateSlug,
                            title: candidate.title || 'Camping Angebot',
                            category: candidate.category || 'Wohnmobile & Camper',
                            condition: candidate.condition || 'Gepflegter Zustand',
                            price: rawPrice,
                            pricePeriod: candidate.negotiable ? 'Verhandlungsbasis' : 'Kaufpreis',
                            location: candidate.location || 'Deutschland',
                            description: candidate.description || 'Top Angebot auf Campuna.',
                            images: imgs,
                            seller: candidate.seller || {
                                name: candidate.listing_user_type === 'COMMERCIAL' ? 'Gewerblicher Anbieter' : 'Privater Verkäufer',
                                type: candidate.listing_user_type || 'Gewerblich',
                                verified: true
                            },
                            is_boosted: Boolean(candidate.is_boosted || candidate.featured)
                        });
                    }
                }
            } catch (err) {
                console.error("Error loading featured listing from DB:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchFeatured();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <section id="featured-showcase" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-sand/20 scroll-mt-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2">
                        <div className="h-4 w-36 bg-sand/60 rounded-full mx-auto animate-pulse" />
                        <div className="h-8 sm:h-10 w-3/4 max-w-md bg-sand/60 rounded-2xl mx-auto animate-pulse" />
                        <div className="h-4 w-5/6 max-w-lg bg-sand/40 rounded-full mx-auto animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center">
                        <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] bg-sand/40 animate-pulse border border-forest/5 w-full" />
                        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
                            <div className="h-6 w-44 bg-sand/60 rounded-full animate-pulse" />
                            <div className="h-8 sm:h-10 w-5/6 bg-sand/60 rounded-2xl animate-pulse" />
                            <div className="h-16 sm:h-20 w-full bg-sand/40 rounded-2xl animate-pulse" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="h-12 bg-sand/40 rounded-xl animate-pulse" />
                                <div className="h-12 bg-sand/40 rounded-xl animate-pulse" />
                            </div>
                            <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="h-10 w-32 bg-sand/50 rounded-xl animate-pulse" />
                                <div className="h-12 w-full sm:w-44 bg-sand/50 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!featuredItem) {
        return null;
    }

    const targetUrl = `/inserate/${featuredItem.slug || featuredItem.id}`;
    const primaryImage = featuredItem.images?.[0];
    const showPlaceholder = !primaryImage || imageError;

    return (
        <section id="featured-showcase" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-sand/20 scroll-mt-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-12 space-y-2 px-2">
                    <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-gold block">
                        Highlights & Entdeckungen
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-forest leading-tight whitespace-normal lg:whitespace-nowrap">
                        <span className="block sm:inline">Campuna </span>
                        <span>Fundstück der Woche</span>
                    </h2>
                    <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/70 max-w-xl mx-auto font-light leading-relaxed">
                        Entdecke besondere Camping-Fahrzeuge, Zubehör und Ausrüstung aus unserer Community.
                    </p>
                </div>

                {/* 2-Column Split Hero (Image on Left/Top, Clean Editorial Content on Right/Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center">

                    {/* Left Column (6 cols): Responsive Product Image Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 relative rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full group cursor-pointer shadow-md sm:shadow-lg lg:shadow-xl border border-forest/10 bg-sand/30"
                        onClick={() => router.push(targetUrl)}
                    >
                        {/* Real DB Image or Brand Placeholder */}
                        {!showPlaceholder ? (
                            <img
                                src={primaryImage}
                                alt={featuredItem.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                loading="lazy"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <ListingImagePlaceholder category={featuredItem.category} size="lg" />
                        )}

                        {/* Top Action Tags */}
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
                            <button
                                type="button"
                                aria-label="Favorit speichern"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(featuredItem);
                                }}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${isFavorite
                                    ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
                                    : 'bg-white/90 hover:bg-white text-forest hover:text-rose-500 hover:scale-105 border border-forest/10'
                                    }`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-white' : ''}`} />
                            </button>
                        </div>

                        {/* Bottom Location Tag */}
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center text-forest max-w-[calc(100%-1.5rem)]">
                            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full text-forest text-xs flex items-center gap-1.5 border border-forest/10 shadow-md min-w-0">
                                <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-forest shrink-0" />
                                <span className="font-semibold text-[10px] sm:text-xs truncate max-w-[180px] sm:max-w-xs">{featuredItem.location}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column (6 cols): Clean Editorial Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-5 lg:space-y-6"
                    >
                        {/* Campuna Fundstück der Woche Badge & Headline */}
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest text-gold text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-xs max-w-full">
                                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    <span className="truncate">Campuna Fundstück der Woche</span>
                                </span>
                            </div>

                            {/* Headline (Capped at 2 lines with ellipsis, breaks words cleanly on small mobile) */}
                            <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight leading-snug sm:leading-tight line-clamp-2 break-words" title={featuredItem.title}>
                                {featuredItem.title}
                            </h3>

                            {/* Description (Capped at 3-4 lines with ellipsis across screen sizes) */}
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/75 leading-relaxed font-light line-clamp-3 sm:line-clamp-4 break-words">
                                {featuredItem.description}
                            </p>
                        </div>

                        {/* Real Listing Attributes from DB (Responsive 2-column on tablet/desktop, compact cards on mobile) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                            {/* 1. Category */}
                            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/70 border border-forest/5 shadow-xs min-w-0">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0">
                                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-charcoal/45 block leading-none mb-0.5">Kategorie</span>
                                    <span className="font-semibold truncate block text-forest text-xs sm:text-sm">{featuredItem.category || 'Camping & Fahrzeuge'}</span>
                                </div>
                            </div>

                            {/* 2. Condition */}
                            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/70 border border-forest/5 shadow-xs min-w-0">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-charcoal/45 block leading-none mb-0.5">Zustand</span>
                                    <span className="font-semibold truncate block text-forest text-xs sm:text-sm">{featuredItem.condition || 'Gepflegt / Sehr gut'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Price & Primary Action (Responsive stacking on mobile, row on tablet/desktop) */}
                        <div className="pt-4 sm:pt-5 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex sm:block items-baseline justify-between sm:justify-start">
                                <span className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-charcoal/50 font-mono leading-none mb-1">
                                    {featuredItem.pricePeriod}
                                </span>
                                <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest">
                                    {featuredItem.price > 0 ? `${featuredItem.price.toLocaleString('de-DE')} €` : 'Preis VB'}
                                </span>
                            </div>

                            <button
                                onClick={() => router.push(targetUrl)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest hover:bg-gold text-white hover:text-forest font-sans font-bold text-xs sm:text-sm uppercase tracking-wider px-5 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer active:scale-95 shrink-0"
                            >
                                <span>Inserat ansehen</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>

                    </motion.div>

                </div>

            </div>
        </section>
    );
}

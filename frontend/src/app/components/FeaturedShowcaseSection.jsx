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
            <section id="featured-showcase" className="py-10 sm:py-14 md:py-20 bg-sand/20 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
                        <div className="lg:col-span-6 rounded-2xl sm:rounded-[32px] aspect-[4/3] bg-sand/40 animate-pulse border border-forest/5" />
                        <div className="lg:col-span-6 space-y-4">
                            <div className="h-6 w-32 bg-sand/60 rounded-full animate-pulse" />
                            <div className="h-10 w-3/4 bg-sand/60 rounded-2xl animate-pulse" />
                            <div className="h-20 w-full bg-sand/40 rounded-2xl animate-pulse" />
                            <div className="h-12 w-48 bg-sand/50 rounded-full animate-pulse" />
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
        <section id="featured-showcase" className="py-10 sm:py-14 md:py-20 bg-sand/20 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-14 space-y-2 px-2">
                    <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block">
                        Highlights & Empfehlungen
                    </span>
                    <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest leading-tight">
                        Ausgewähltes Inserat der Woche
                    </h2>
                    <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/70 max-w-xl mx-auto font-light leading-relaxed">
                        Entdecke besonders gefragte Camping-Fahrzeuge und Ausrüstung mit geprüften Angaben und sofortiger Verfügbarkeit.
                    </p>
                </div>

                {/* 2-Column Split Hero (Image on Left/Top, Clean Editorial Content on Right/Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
                    
                    {/* Left Column (6 cols): Responsive Product Image Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 relative rounded-2xl sm:rounded-[32px] md:rounded-[36px] overflow-hidden aspect-[4/3] sm:aspect-[16/11] md:aspect-[4/3] w-full group cursor-pointer shadow-lg sm:shadow-xl border border-forest/10 bg-sand/30"
                        onClick={() => router.push(targetUrl)}
                    >
                        {/* Real DB Image or Brand Placeholder */}
                        {!showPlaceholder ? (
                            <img
                                src={primaryImage}
                                alt={featuredItem.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[0.8s] ease-out"
                                loading="lazy"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <ListingImagePlaceholder category={featuredItem.category} size="lg" />
                        )}

                        {/* Top Action Tags */}
                        <div className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 z-20">
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
                        <div className="absolute bottom-3.5 sm:bottom-5 left-3.5 sm:left-5 z-20 flex items-center text-forest">
                            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full text-forest text-xs flex items-center gap-1.5 border border-forest/10 shadow-md">
                                <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-forest shrink-0" />
                                <span className="font-semibold text-[10px] sm:text-[11px] truncate max-w-[180px] sm:max-w-none">{featuredItem.location}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column (6 cols): Clean Editorial Info without outer card wrapper */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6"
                    >
                        {/* Bestseller Badge & Headline */}
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest text-gold text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-xs">
                                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>Bestseller Inserat</span>
                                </span>
                            </div>

                            {/* Headline (Capped at exactly 2 lines with ellipsis) */}
                            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-forest tracking-tight leading-[1.2] line-clamp-2" title={featuredItem.title}>
                                {featuredItem.title}
                            </h3>

                            {/* Description (Capped at exactly 3 lines with ellipsis across all screen sizes) */}
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/75 leading-relaxed font-light line-clamp-3">
                                {featuredItem.description}
                            </p>
                        </div>

                        {/* Real Listing Attributes from DB (Stacked in a vertical column) */}
                        <div className="flex flex-col space-y-2.5 sm:space-y-3 pt-1">
                            {/* 1. Category */}
                            <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-charcoal/85">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest text-gold flex items-center justify-center shrink-0 shadow-xs">
                                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-charcoal/40 block leading-none mb-0.5">Kategorie</span>
                                    <span className="font-semibold truncate block text-forest text-xs sm:text-sm">{featuredItem.category || 'Camping & Fahrzeuge'}</span>
                                </div>
                            </div>

                            {/* 2. Condition */}
                            <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-charcoal/85">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest text-gold flex items-center justify-center shrink-0 shadow-xs">
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-charcoal/40 block leading-none mb-0.5">Zustand</span>
                                    <span className="font-semibold truncate block text-forest text-xs sm:text-sm">{featuredItem.condition || 'Gepflegt / Sehr gut'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Price & Primary/Secondary Actions */}
                        <div className="pt-4 sm:pt-6 border-t border-forest/10 flex flex-row items-center justify-between gap-4">
                            <div>
                                <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1">
                                    {featuredItem.pricePeriod}
                                </span>
                                <span className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest">
                                    {featuredItem.price > 0 ? `${featuredItem.price.toLocaleString('de-DE')} €` : 'Preis VB'}
                                </span>
                            </div>

                            <button
                                onClick={() => router.push(targetUrl)}
                                className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-gold text-white hover:text-forest font-sans font-bold text-xs sm:text-sm uppercase tracking-wider px-5 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer active:scale-95 shrink-0"
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

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, MapPin, ShieldCheck, Eye, Trash2, Search, Sparkles, 
    Rocket, Star, ArrowRight, Filter, Compass, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { getImageUrl } from '@/utils/imageUrl';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import { isListingBoosted } from '@/utils/sellerBadge';

function buildListingSlug(title = '', id = '') {
    const cleanTitle = title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return cleanTitle ? `${cleanTitle}-${id}` : id;
}

export default function AccountFavoritesTab({ onNavigateToListings }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [mounted, setMounted] = useState(false);

    const favoriteListings = useFavoritesStore((state) => state.favoriteListings);
    const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
    const removeFavoriteItem = useFavoritesStore((state) => state.removeFavoriteItem);
    const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
    const fetchFavorites = useFavoritesStore((state) => state.fetchFavorites);
    const loading = useFavoritesStore((state) => state.loading);

    useEffect(() => {
        setMounted(true);
        fetchFavorites();
    }, [fetchFavorites]);

    const categories = useMemo(() => {
        const set = new Set();
        (favoriteListings || []).forEach(item => {
            if (item.category) set.add(item.category);
        });
        return ['ALL', ...Array.from(set)];
    }, [favoriteListings]);

    const filteredFavorites = useMemo(() => {
        return (favoriteListings || []).filter((item) => {
            const matchesSearch = !searchTerm || 
                (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [favoriteListings, searchTerm, categoryFilter]);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-beige">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
                        <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-forest tracking-tight">
                                Mein Merkzettel
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 font-mono">
                                {favoriteListings.length} {favoriteListings.length === 1 ? 'Inserat' : 'Inserate'}
                            </span>
                        </div>
                        <p className="text-xs text-charcoal/60 mt-0.5 font-medium">
                            Deine gespeicherten Fahrzeuge, Zubehör und Campingangebote im Überblick
                        </p>
                    </div>
                </div>

                {favoriteListings.length > 0 && (
                    <button
                        onClick={clearFavorites}
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Merkzettel leeren</span>
                    </button>
                )}
            </div>

            {/* Filter and Search Toolbar */}
            {favoriteListings.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#faf8f3] p-3 rounded-2xl border border-beige">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Merkzettel durchsuchen (Titel, Ort)..."
                            className="w-full bg-white border border-beige rounded-xl pl-9 pr-4 py-2 text-xs text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-xs font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {categories.length > 2 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                                        categoryFilter === cat
                                            ? 'bg-forest text-sand shadow-xs'
                                            : 'bg-white text-charcoal/60 hover:text-forest border border-beige'
                                    }`}
                                >
                                    {cat === 'ALL' ? 'Alle Kategorien' : cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content List / Grid */}
            {favoriteListings.length === 0 ? (
                /* Empty state */
                <div className="text-center py-16 bg-[#faf8f3] rounded-3xl border border-dashed border-forest/15 px-6 max-w-2xl mx-auto my-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                        <Heart className="w-8 h-8 fill-rose-500" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-forest mb-2">
                        Dein Merkzettel ist noch leer
                    </h3>
                    <p className="text-xs text-charcoal/65 max-w-md mx-auto mb-6 leading-relaxed font-sans">
                        Wenn du auf ein Herz-Symbol bei einem Inserat klickst, wird es hier dauerhaft in deinem Benutzerkonto gespeichert.
                    </p>
                    <button
                        onClick={() => router.push('/inserate')}
                        className="bg-forest hover:bg-[#004709] text-sand text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Compass className="w-4 h-4 text-gold" />
                        <span>Jetzt Camping-Inserate entdecken</span>
                    </button>
                </div>
            ) : filteredFavorites.length === 0 ? (
                /* No search results */
                <div className="text-center py-12 bg-[#faf8f3] rounded-2xl border border-beige p-6">
                    <AlertCircle className="w-8 h-8 text-charcoal/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-charcoal">Keine Inserate für "{searchTerm}" gefunden.</p>
                    <button
                        onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }}
                        className="mt-3 text-xs text-forest underline font-bold cursor-pointer"
                    >
                        Filter zurücksetzen
                    </button>
                </div>
            ) : (
                /* Grid of Favorites */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4.5">
                    <AnimatePresence>
                        {filteredFavorites.map((item) => {
                            const rawImg = Array.isArray(item.images) && item.images.length > 0
                                ? item.images[0]
                                : (typeof item.images === 'string' ? item.images : '/hero.webp');
                            const slug = item.slug || buildListingSlug(item.title, item.id);
                            const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
                            const isBoosted = isListingBoosted(item);

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className={`group rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                                        isBoosted
                                            ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_16px_-2px_rgba(202,152,43,0.16)] hover:shadow-[0_6px_20px_-2px_rgba(202,152,43,0.24)]'
                                            : 'bg-white border border-beige hover:border-forest/25 hover:shadow-md'
                                    }`}
                                >
                                    <div>
                                        {/* Compact Image Area */}
                                        <div 
                                            className="relative h-36 w-full bg-sand/30 overflow-hidden cursor-pointer"
                                            onClick={() => router.push(`/inserate/${slug}`)}
                                        >
                                            <img
                                                src={getImageUrl(rawImg)}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => { e.currentTarget.src = '/hero.webp'; }}
                                            />
                                            
                                            {/* Badges */}
                                            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                                                <ListingBadgesRow item={item} size="xs" />
                                            </div>

                                            {/* Remove Favorite Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFavoriteItem(item.id);
                                                }}
                                                title="Aus Merkzettel entfernen"
                                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 hover:bg-rose-500 hover:text-white text-rose-500 flex items-center justify-center transition-all shadow-md cursor-pointer group/fav z-10"
                                            >
                                                <Heart className="w-3.5 h-3.5 fill-current transition-transform group-hover/fav:scale-110" />
                                            </button>

                                            {/* Location Pill */}
                                            {item.location && (
                                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] text-white/95 z-10">
                                                    <MapPin className="w-2.5 h-2.5 text-gold shrink-0" />
                                                    <span className="truncate max-w-[110px]">{item.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-3.5 space-y-1.5 font-sans">
                                            {item.category && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-forest/70 block">
                                                    {item.category}
                                                </span>
                                            )}
                                            <h4 
                                                onClick={() => router.push(`/inserate/${slug}`)}
                                                className="font-display text-xs sm:text-sm font-bold text-charcoal group-hover:text-forest transition-colors line-clamp-1 leading-snug cursor-pointer"
                                                title={item.title}
                                            >
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Footer / Price & Action */}
                                    <div className="p-3 pt-2 border-t border-beige flex items-center justify-between mt-1">
                                        <div>
                                            <span className="block text-[8px] uppercase tracking-widest text-charcoal/40 font-mono">
                                                {item.pricePeriod || 'Kaufpreis'}
                                            </span>
                                            <span className="font-display text-sm sm:text-base font-black text-forest">
                                                {priceNum > 0 ? `${priceNum.toLocaleString('de-DE')} €` : 'Preis VB'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => router.push(`/inserate/${slug}`)}
                                            className="bg-forest hover:bg-gold hover:text-forest text-sand text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>Ansehen</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, ShieldCheck, Eye, Trash2, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import CategoriesSection from '@/app/components/CategoriesSection';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import { getImageUrl } from '@/utils/imageUrl';
import CircleLoader from '@/app/components/CircleLoader';
import { ListingBadgesRow } from '@/app/components/ListingBadge';

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

export default function FavoritesPage() {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const favoriteListings = useFavoritesStore(state => state.favoriteListings);
    const favoriteIds = useFavoritesStore(state => state.favoriteIds);
    const removeFavoriteItem = useFavoritesStore(state => state.removeFavoriteItem);
    const clearFavorites = useFavoritesStore(state => state.clearFavorites);
    const fetchFavorites = useFavoritesStore(state => state.fetchFavorites);
    const isLoggedIn = useAuthStore(state => state.isLoggedIn);

    useEffect(() => {
        setMounted(true);
        if (isLoggedIn) {
            router.replace('/mein-konto?tab=favoriten');
        }
    }, [isLoggedIn, router]);

    const count = mounted ? (favoriteListings.length > 0 ? favoriteListings.length : favoriteIds.length) : 0;

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal">
            {/* Hero Header */}
            <section
                className="relative mt-20 sm:mt-20 md:mt-20 pt-10 pb-12 px-4 mx-4 overflow-hidden rounded-4xl"
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 60%, rgba(0, 0, 0, 0.95) 100%), url('/hero.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                            Merkzettel
                        </span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-lg">
                        Deine gespeicherten Inserate
                    </h1>
                    <p className="text-white/90 text-sm sm:text-base max-w-2xl font-light leading-relaxed drop-shadow-md">
                        {count > 0 
                            ? `Du hast ${count} ${count === 1 ? 'Angebot' : 'Angebote'} auf deinem Merkzettel gespeichert.`
                            : 'Behalte interessante Camping-Fahrzeuge, Zubehör und Stellplätze im Blick.'}
                    </p>

                    {!isLoggedIn && mounted && (
                        <div className="mt-6 inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-xs">
                            <Sparkles className="w-4 h-4 text-gold shrink-0" />
                            <span>
                                <strong>Tipp:</strong> <a href="/login" className="underline font-bold text-gold hover:text-white">Melde dich an</a>, um deine Favoriten auf allen Geräten zu synchronisieren.
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Breadcrumbs below Hero ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-1">
                <Breadcrumbs
                    items={[{ label: 'Merkzettel' }]}
                    variant="light"
                />
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                {!mounted ? (
                    <div className="py-20">
                        <CircleLoader size="lg" color="forest" />
                    </div>
                ) : !isLoggedIn ? (
                    /* Not logged in state */
                    <div className="text-center py-20 bg-sand/20 rounded-[32px] border border-dashed border-forest/15 px-6 max-w-3xl mx-auto">
                        <div className="w-16 h-16 bg-gold/15 text-gold-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/30">
                            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-forest mb-2">
                            Anmeldung erforderlich
                        </h2>
                        <p className="text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto mb-6 leading-relaxed">
                            Um Inserate auf deinem persönlichen Merkzettel zu speichern und auf all deinen Geräten abzurufen, musst du angemeldet sein.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => router.push('/login?redirect=/favoriten')}
                                className="w-full sm:w-auto bg-forest hover:bg-[#004d0a] text-sand text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-full shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-gold" />
                                Jetzt anmelden
                            </button>
                            <button
                                onClick={() => router.push('/inserate')}
                                className="w-full sm:w-auto bg-white hover:bg-sand/40 text-charcoal text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-full border border-beige transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Search className="w-4 h-4" />
                                Inserate durchsuchen
                            </button>
                        </div>
                    </div>
                ) : favoriteListings.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-20 bg-sand/20 rounded-[32px] border border-dashed border-forest/15 px-6 max-w-3xl mx-auto">
                        <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-forest mb-2">
                            Dein Merkzettel ist leer
                        </h2>
                        <p className="text-xs sm:text-sm text-charcoal/65 max-w-md mx-auto mb-6 leading-relaxed">
                            Klicke einfach auf das Herz-Symbol bei einem Inserat, um es hier für später zu speichern.
                        </p>
                        <button
                            onClick={() => router.push('/inserate')}
                            className="bg-forest hover:bg-gold hover:text-forest text-white text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-full shadow-lg transition-all duration-300 inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Search className="w-4 h-4" />
                            Jetzt Inserate entdecken
                        </button>
                    </div>
                ) : (
                    /* Listings grid */
                    <div>
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-forest/5">
                            <span className="text-xs font-mono text-charcoal/60 uppercase tracking-widest">
                                {favoriteListings.length} {favoriteListings.length === 1 ? 'Gespeichertes Inserat' : 'Gespeicherte Inserate'}
                            </span>
                            <button
                                onClick={clearFavorites}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Alle löschen
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {favoriteListings.map((item) => {
                                const previewImg = Array.isArray(item.images) && item.images.length > 0
                                    ? item.images[0]
                                    : (typeof item.images === 'string' ? item.images : '/hero.webp');
                                const slug = item.slug || buildListingSlug(item.title, item.id);
                                const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-white rounded-3xl overflow-hidden border border-forest/10 hover:border-forest/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Image */}
                                            <div className="relative aspect-[16/9] bg-sand/30 overflow-hidden cursor-pointer" onClick={() => router.push(`/inserate/${slug}`)}>
                                                <img
                                                    src={getImageUrl(previewImg)}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { e.currentTarget.src = '/hero.webp'; }}
                                                />
                                                <div className="absolute top-3 left-3 pointer-events-none z-10">
                                                    <ListingBadgesRow item={item} />
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFavoriteItem(item.id);
                                                    }}
                                                    title="Von Merkzettel entfernen"
                                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-rose-500 flex items-center justify-center transition-all shadow-md cursor-pointer group/btn"
                                                >
                                                    <Heart className="w-4 h-4 fill-current" />
                                                </button>
                                            </div>

                                            {/* Details */}
                                            <div className="p-4">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-gold block mb-1">
                                                    {item.category || 'Camping'}
                                                </span>
                                                <h3 
                                                    onClick={() => router.push(`/inserate/${slug}`)}
                                                    className="font-display text-sm font-bold text-forest hover:text-gold transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
                                                >
                                                    {item.title}
                                                </h3>
                                                {item.location && (
                                                    <div className="flex items-center gap-1 text-[11px] text-charcoal/60 mb-2">
                                                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span className="truncate">{item.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-4 pt-0 border-t border-forest/5 flex items-center justify-between">
                                            <div>
                                                <span className="block text-[8px] uppercase tracking-widest text-charcoal/40 font-mono">
                                                    {item.pricePeriod || 'Kaufpreis'}
                                                </span>
                                                <span className="font-display text-base font-extrabold text-forest">
                                                    {priceNum > 0 ? `${priceNum.toLocaleString('de-DE')} €` : 'Preis VB'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => router.push(`/inserate/${slug}`)}
                                                className="bg-forest hover:bg-gold hover:text-forest text-white text-[10px] font-bold uppercase tracking-wider py-2 px-3.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Ansehen
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Categories Section */}
            <div className="py-12 bg-white border-t border-forest/5">
                <CategoriesSection
                    badge="ENTDECKEN"
                    title="Weitere Camping-Kategorien"
                    align="center"
                    titleClassName="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-forest"
                />
            </div>
        </div>
    );
}

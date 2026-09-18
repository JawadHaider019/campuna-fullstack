'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    MapPin,
    Star,
    ArrowRight,
    ArrowLeft,
    Building2,
    Package,
    Sparkles,
    CheckCircle2,
    Filter,
    X
} from 'lucide-react';
import { getAllProfiles } from '@/api/profile';
import { PROVIDERS } from '@/data';
import { useAuthStore } from '@/store/useAuthStore';
import CategoriesSection from '@/app/components/CategoriesSection';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80';
const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

function slugifyName(name = '') {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildProviderSlug(name = '', id = '') {
    const slug = slugifyName(name);
    return id ? `${slug}-${id}` : slug;
}

// ─── Provider Card Component ──────────────────────────────────────────────────────────
function ProviderCard({ partner }) {
    const router = useRouter();
    const [coverSrc, setCoverSrc] = useState(getImageUrl(partner.coverImage, DEFAULT_COVER));
    const [logoSrc, setLogoSrc] = useState(getImageUrl(partner.logo, DEFAULT_LOGO));

    const isPioneer = Boolean(partner.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER'));

    const handleCardClick = () => {
        const slug = buildProviderSlug(partner.name, partner.id);
        router.push(`/anbieter/${slug}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={handleCardClick}
            className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-forest/10 hover:border-forest/25 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full select-none"
        >
            {/* Cover Banner */}
            <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-sand/30">
                <img
                    src={coverSrc}
                    alt={`${partner.name} Cover`}
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    onError={() => setCoverSrc(DEFAULT_COVER)}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Top Badge: Pioneer (only if earned) */}
                {isPioneer && (
                    <div className="absolute top-3.5 right-3.5 z-10">
                        <PioneerBadge variant="forest" size="xs" text="Pioneer" className="shadow-lg backdrop-blur-xs" />
                    </div>
                )}
            </div>

            {/* Logo Avatar overlapping cover & Content */}
            <div className="relative px-5 pt-0 pb-5 flex flex-col flex-1 justify-between">
                <div className="flex items-end justify-between -mt-10 mb-3">
                    <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg border-2 border-white ring-2 ring-forest/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <img
                            src={logoSrc}
                            alt={`${partner.name} Logo`}
                            className="w-full h-full object-cover rounded-full bg-sand/20"
                            onError={() => setLogoSrc(DEFAULT_LOGO)}
                        />
                    </div>

                    {partner.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full text-amber-900 font-bold text-xs shadow-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{partner.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Provider Info */}
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-charcoal group-hover:text-forest transition-colors duration-200 line-clamp-1">
                            {partner.name}
                        </h3>
                    </div>

                    {/* Location & Type below heading */}
                    <div className="flex items-center gap-1.5 text-xs text-charcoal/65 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="line-clamp-1">{partner.location || 'Deutschland'}</span>
                        {partner.type && (
                            <>
                                <span className="text-charcoal/30 shrink-0">•</span>
                                <span className="text-[10px] font-semibold text-forest bg-forest/5 px-2 py-0.5 rounded-full border border-forest/10 shrink-0">
                                    {partner.type}
                                </span>
                            </>
                        )}
                    </div>

                    <p className="font-sans text-xs text-charcoal/70 leading-relaxed font-light line-clamp-2 pt-1">
                        {partner.description || 'Spezialisierter Anbieter für Camping, Wohnmobile & Ausrüstung auf Campuna.'}
                    </p>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 pt-3.5 border-t border-forest/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-forest font-semibold text-xs">
                        <Package className="w-3.5 h-3.5 text-forest/70" />
                        <span>
                            {partner.listingsCount === 1 ? '1 Inserat' : `${partner.listingsCount || 0} Inserate`}
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-forest group-hover:text-gold group-hover:translate-x-1 transition-all duration-200">
                        <span>Profil ansehen</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Content Component ────────────────────────────────────────────────────────────
function ProvidersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn } = useAuthStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [sortBy, setSortBy] = useState('listings'); // 'listings', 'rating', 'name'

    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize from URL search query if provided
    useEffect(() => {
        const q = searchParams.get('q') || '';
        if (q) setSearchTerm(q);
    }, [searchParams]);

    // Fetch Providers from API with fallback to static mock data
    useEffect(() => {
        let active = true;
        setLoading(true);

        const fetchProvidersData = async () => {
            try {
                const res = await getAllProfiles();
                if (res.success && Array.isArray(res.data?.profiles) && res.data.profiles.length > 0) {
                    // Combine or map backend profiles
                    const backendProfiles = res.data.profiles.map(p => ({
                        id: p.id,
                        name: p.name,
                        logo: p.logo || DEFAULT_LOGO,
                        coverImage: p.coverImage || DEFAULT_COVER,
                        description: p.description || '',
                        listingsCount: p.listingsCount || 0,
                        rating: 4.9,
                        location: p.location || 'Deutschland',
                        type: p.type || 'Gewerblich',
                        achievements: p.achievements || []
                    }));

                    // Merge with mock providers so showcase is complete
                    const merged = [...backendProfiles];
                    PROVIDERS.forEach(mockP => {
                        if (!merged.some(m => m.name.toLowerCase() === mockP.name.toLowerCase())) {
                            merged.push(mockP);
                        }
                    });

                    if (active) setProviders(merged);
                } else {
                    if (active) setProviders(PROVIDERS);
                }
            } catch (err) {
                console.warn('Falling back to static mock providers:', err);
                if (active) setProviders(PROVIDERS);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProvidersData();
        return () => { active = false; };
    }, []);

    // Filtered & Sorted Providers List
    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const inName = p.name?.toLowerCase().includes(term);
                const inDesc = p.description?.toLowerCase().includes(term);
                const inLoc = p.location?.toLowerCase().includes(term);
                if (!inName && !inDesc && !inLoc) return false;
            }
            if (selectedLocation !== 'all') {
                if (p.location?.toLowerCase() !== selectedLocation.toLowerCase()) return false;
            }
            return true;
        });
    }, [providers, searchTerm, selectedLocation]);

    const sortedProviders = useMemo(() => {
        const list = [...filteredProviders];
        if (sortBy === 'listings') {
            return list.sort((a, b) => (b.listingsCount || 0) - (a.listingsCount || 0));
        }
        if (sortBy === 'rating') {
            return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        if (sortBy === 'name') {
            return list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
        }
        return list;
    }, [filteredProviders, sortBy]);

    // Unique locations for filter
    const locationsList = useMemo(() => {
        const locs = new Set();
        providers.forEach(p => {
            if (p.location && p.location !== 'Deutschland') locs.add(p.location);
        });
        return Array.from(locs);
    }, [providers]);

    const handleReset = () => {
        setSearchTerm('');
        setSelectedLocation('all');
        setSortBy('listings');
    };

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal">

            {/* ── Hero Banner ── */}
            <section
                className="relative mt-20 pt-12 pb-16 px-4 mx-4 md:mx-6 lg:mx-8 overflow-hidden rounded-3xl md:rounded-4xl"
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,61,3,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0, 0, 0, 0.92) 100%), url('/hero.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <span className="font-sans text-[9px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                        CAMPUNA PARTNER & NETZWERK
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-xl leading-tight">
                        Camping-Anbieter & Spezialisten
                    </h1>
                    <p className="text-white/90 text-sm md:text-base max-w-3xl leading-relaxed mt-2 font-sans font-light drop-shadow-md">
                        Entdecke zertifizierte Fachhändler, Ausbauer, Werkstätten, Vermieter und Campingplatzbetreiber in ganz Deutschland. Finde den richtigen Partner für dein nächstes Camping-Abenteuer.
                    </p>

                    {/* Action buttons */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={() => router.push(isLoggedIn ? '/mein-konto' : '/register?type=commercial')}
                            className="bg-gold hover:bg-white text-forest font-bold text-xs uppercase tracking-wider py-3.5 px-7 rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2"
                        >
                            <Building2 className="w-4 h-4" />
                            Kostenlos Anbieter werden
                        </button>
                        <button
                            onClick={() => router.push('/inserate')}
                            className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 font-bold text-xs uppercase tracking-wider py-3.5 px-7 rounded-full transition-all duration-300 cursor-pointer"
                        >
                            Alle Inserate durchsuchen
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Breadcrumbs below Hero ── */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-1">
                <Breadcrumbs
                    items={[{ label: 'Camping-Anbieter' }]}
                    variant="light"
                />
            </div>

            {/* ── Main Content Area ── */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">

                {/* Filter & Search Header */}
                <div className="bg-sand/30 border border-forest/10 rounded-2xl p-4 sm:p-6 mb-10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        {/* Search Input */}
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Anbieter, Name, Spezialisierung..."
                                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-1.5 focus:ring-forest/20 font-medium"
                            />
                        </div>

                        {/* Location Select */}
                        <div>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 font-medium cursor-pointer"
                            >
                                <option value="all">Alle Standorte</option>
                                {locationsList.map((loc, idx) => (
                                    <option key={idx} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Select */}
                        <div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs rounded-full border border-forest/15 bg-white text-charcoal focus:outline-none focus:ring-1.5 focus:ring-forest/20 font-medium cursor-pointer"
                            >
                                <option value="listings">Meiste Inserate</option>
                                <option value="rating">Beste Bewertung</option>
                                <option value="name">Name (A – Z)</option>
                            </select>
                        </div>

                    </div>

                    {/* Active filter count & reset */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-forest/5 text-xs">
                        <span className="font-mono text-charcoal/60 uppercase tracking-widest text-[11px]">
                            {sortedProviders.length} {sortedProviders.length === 1 ? 'Anbieter' : 'Anbieter'} gefunden
                        </span>

                        {(searchTerm || selectedLocation !== 'all' || sortBy !== 'listings') && (
                            <button
                                onClick={handleReset}
                                className="text-gold hover:text-forest font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Filter zurücksetzen
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Providers Grid ── */}
                {loading ? (
                    // Skeleton Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-3xl overflow-hidden border border-forest/5 animate-pulse bg-white">
                                <div className="h-36 bg-sand/50" />
                                <div className="p-5 space-y-3">
                                    <div className="w-20 h-20 rounded-full bg-sand/60 -mt-12 mb-3 border-2 border-white" />
                                    <div className="h-5 bg-sand/60 rounded-full w-3/4" />
                                    <div className="h-3.5 bg-sand/40 rounded-full w-1/3" />
                                    <div className="h-3.5 bg-sand/40 rounded-full w-full" />
                                    <div className="h-3.5 bg-sand/40 rounded-full w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedProviders.length === 0 ? (
                    // Empty state
                    <div className="text-center py-20 px-4 bg-sand/20 rounded-[32px] border border-dashed border-forest/10 flex flex-col items-center justify-center">
                        <Building2 className="w-12 h-12 text-forest/40 mb-4" />
                        <p className="font-display text-lg font-bold text-forest mb-2">
                            Keine Anbieter gefunden
                        </p>
                        <p className="font-sans text-xs text-charcoal/60 max-w-sm mb-6 font-light">
                            Es wurden keine Partner gefunden, die deinen Suchkriterien entsprechen. Probiere einen anderen Suchbegriff.
                        </p>
                        <button
                            onClick={handleReset}
                            className="bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 text-xs font-bold uppercase tracking-wider py-3.5 px-7 rounded-full shadow-md cursor-pointer"
                        >
                            Alle Anbieter anzeigen
                        </button>
                    </div>
                ) : (
                    // Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                        {sortedProviders.map((partner, idx) => (
                            <ProviderCard key={`${partner.id || partner.name}-${idx}`} partner={partner} />
                        ))}
                    </div>
                )}

            </main>


            {/* ── Categories Section Carousel ── */}
            <section className="py-16 px-4 bg-sand/20 border-t border-forest/5">
                <div className="max-w-7xl mx-auto mb-10 text-center">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold block mb-2">
                        ENTDECKEN
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
                        Passende Angebote nach Kategorie
                    </h2>
                </div>
                <CategoriesSection showHeader={false} />
            </section>

        </div>
    );
}

// ─── Default Page Export wrapped in Suspense ───────────────────────────────────────────
export default function AllProvidersPage() {
    return (
        <Suspense fallback={
            <CircleLoader size="lg" color="forest" fullPage />
        }>
            <ProvidersContent />
        </Suspense>
    );
}

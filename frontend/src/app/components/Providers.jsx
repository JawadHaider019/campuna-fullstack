'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import {
    ArrowRight,
    ShieldCheck,
    Building2,
    Truck,
    MapPin,
    Compass,
    Wrench,
    Hammer,
    ShoppingBag,
    Building,
    Home,
    Anchor,
    Sparkles,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllProfiles } from '@/api/profile';
import { useAuthStore } from '@/store/useAuthStore';
import { getImageUrl } from '@/utils/imageUrl';
import { PROVIDER_CATEGORIES } from '@/data';
import AuthRequiredModal from './AuthRequiredModal';
import PioneerBadge from './PioneerBadge';

const CATEGORY_ICONS = {
    Truck,
    MapPin,
    Compass,
    Wrench,
    Hammer,
    ShoppingBag,
    Building,
    Home,
    Anchor,
    Building2
};

function getCategoryIcon(iconName) {
    return CATEGORY_ICONS[iconName] || Building2;
}

const ProviderCard = React.memo(({ partner, onPartnerClick, onAuthRequired, router }) => {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const hasCover = Boolean(partner.coverImage);
    const hasLogo = Boolean(partner.logo);
    const coverUrl = hasCover ? getImageUrl(partner.coverImage) : null;
    const logoUrl = hasLogo ? getImageUrl(partner.logo) : null;

    const handleCardClick = () => {
        const nameSlug = partner.name
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const targetUrl = `/anbieter/${nameSlug}-${partner.id}`;
        if (onPartnerClick) onPartnerClick(partner.name);

        if (!isLoggedIn) {
            if (onAuthRequired) {
                onAuthRequired(targetUrl);
            } else {
                router.push(`/login?returnUrl=${encodeURIComponent(targetUrl)}`);
            }
            return;
        }

        router.push(targetUrl);
    };

    return (
        <div
            onClick={handleCardClick}
            className="provider-card group relative flex-shrink-0 w-[290px] sm:w-[320px] md:w-[340px] rounded-[28px] overflow-hidden cursor-pointer bg-white border-2 border-forest/10 hover:border-gold shadow-none hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 select-none flex flex-col justify-between"
        >
            {/* Top Cover Image Area */}
            <div className="relative h-[145px] sm:h-[160px] w-full bg-gradient-to-br from-forest via-[#133821] to-[#0a2213] overflow-hidden">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Building2 className="w-16 h-16 text-gold" />
                    </div>
                )}

                {/* Subtle Image Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Pioneer Badge on Cover */}
                {partner.isPioneer && (
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                        <PioneerBadge variant="forest" size="xs" text="Campuna Pioneer" />
                    </div>
                )}
            </div>

            {/* Overlapping Floating Circular Brand Avatar */}
            <div className="relative px-5 -mt-8 sm:-mt-9 md:-mt-10 z-10 flex items-end">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-sand to-gold p-1 shadow-md border-1 border-gold/40 group-hover:border-gold group-hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={`${partner.name} Logo`}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-forest to-[#0d381e] text-sand flex items-center justify-center font-display font-bold text-lg sm:text-xl">
                            {partner.name?.slice(0, 2).toUpperCase() || 'CP'}
                        </div>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="px-5 pt-3 pb-5 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-1.5">
                    {partner.providerCategory && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold block truncate">
                            {partner.providerCategory}
                        </span>
                    )}

                    <h3 className="font-display text-base sm:text-lg font-bold text-forest group-hover:text-gold transition-colors line-clamp-1 leading-snug">
                        {partner.name}
                    </h3>

                    <p className="font-sans text-xs text-charcoal/70 leading-relaxed font-light line-clamp-2">
                        {partner.description || 'Dein verifizierter Partner für Camping und Caravaning auf Campuna.'}
                    </p>
                </div>

                {/* Footer Action Row */}
                <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest">
                        <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                        <span>
                            {partner.listingsCount === 1 ? '1 Inserat' : `${partner.listingsCount || 0} Inserate`}
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest text-sand group-hover:bg-gold group-hover:text-forest text-xs font-bold transition-all duration-300 shadow-sm">
                        <span>Profil ansehen</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
});

ProviderCard.displayName = 'ProviderCard';

export default function Providers({ onPartnerClick, isLoggedIn }) {
    const router = useRouter();
    const rowRef = useRef(null);
    const [constraints, setConstraints] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const [authModalState, setAuthModalState] = useState({ isOpen: false, returnUrl: '' });

    const { user } = useAuthStore();
    const [providersList, setProvidersList] = useState([]);

    useEffect(() => {
        const loadProviders = async () => {
            try {
                const res = await getAllProfiles();
                if (res.success && Array.isArray(res.data?.profiles)) {
                    // STRICT REQUIREMENT: Only show providers that have fulfilled all requirements
                    // (isSpotlightEligible === true) and deduplicate by user ID
                    const seenIds = new Set();
                    const validSpotlightList = [];

                    for (const p of res.data.profiles) {
                        if (p.isSpotlightEligible && !seenIds.has(p.id)) {
                            seenIds.add(p.id);
                            validSpotlightList.push(p);
                        }
                    }

                    setProvidersList(validSpotlightList);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('campuna-spotlight-status', { detail: { hasSpotlight: validSpotlightList.length > 0 } }));
                    }
                } else {
                    setProvidersList([]);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('campuna-spotlight-status', { detail: { hasSpotlight: false } }));
                    }
                }
            } catch (err) {
                console.error("Error loading providers:", err);
                setProvidersList([]);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('campuna-spotlight-status', { detail: { hasSpotlight: false } }));
                }
            }
        };
        loadProviders();
    }, [user?.id]);

    const x = useMotionValue(0);
    const dirRef = useRef(-1);
    const isHoveredRef = useRef(false);
    const isDraggingRef = useRef(false);
    const cardWidthRef = useRef(360);

    useEffect(() => {
        const measureCard = () => {
            if (!rowRef.current) return;
            const card = rowRef.current.querySelector('.provider-card');
            if (card) {
                cardWidthRef.current = card.getBoundingClientRect().width;
            }
            setConstraints(Math.max(0, rowRef.current.scrollWidth - rowRef.current.offsetWidth));
            setIsDesktop(window.innerWidth >= 1024);
        };

        const timer = setTimeout(measureCard, 100);
        window.addEventListener('resize', measureCard);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', measureCard);
        };
    }, [providersList]);

    const shouldSlide = !isDesktop || providersList.length > 3;

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        let isVisible = true;

        const handleVisibilityChange = () => {
            isVisible = document.visibilityState === 'visible';
            if (isVisible) lastTime = performance.now();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting && document.visibilityState === 'visible';
                if (isVisible) lastTime = performance.now();
            },
            { rootMargin: '100px' }
        );

        if (rowRef.current) {
            observer.observe(rowRef.current);
        }

        const loop = (time) => {
            if (isVisible) {
                const delta = Math.min((time - lastTime) / 1000, 0.1);
                lastTime = time;

                if (shouldSlide && constraints > 0 && providersList.length > 0) {
                    if (!isHoveredRef.current && !isDraggingRef.current) {
                        let currentX = x.get() + dirRef.current * 25 * delta;
                        if (dirRef.current === -1 && currentX <= -constraints) {
                            currentX = -constraints;
                            dirRef.current = 1;
                        } else if (dirRef.current === 1 && currentX >= 0) {
                            currentX = 0;
                            dirRef.current = -1;
                        }
                        x.set(currentX);
                    }
                } else {
                    x.set(0);
                }
            } else {
                lastTime = time;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            observer.disconnect();
        };
    }, [providersList.length, constraints, x, shouldSlide]);

    const handleCategoryNavigation = (slug) => {
        if (!slug || slug === 'all') {
            router.push('/anbieter');
        } else {
            router.push(`/anbieter?category=${encodeURIComponent(slug)}`);
        }
    };

    return (
        <section id="anbieter" className="py-10 sm:py-16 bg-sand relative overflow-x-hidden scroll-mt-24 border-t border-forest/5">
            <div className="max-w-8xl mx-auto px-6 md:px-12">

                {/* ── 1. GENERAL PROVIDER DIRECTORY SECTION HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-5">
                    <div className="space-y-2 max-w-3xl">
                        <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-gold block">
                            CAMPUNA ANBIETER
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
                            Camping-Anbieter entdecken
                        </h2>
                        <p className="font-sans text-sm text-charcoal/65 leading-relaxed font-light">
                            Finde verifizierte Händler, Werkstätten, Vermieter, Campingplätze und Fachbetriebe in ganz Deutschland oder präsentiere dein eigenes Unternehmen im Campuna-Verzeichnis.
                        </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 shrink-0 pb-1">
                        <button
                            onClick={() => router.push(isLoggedIn ? '/abo' : '/registrieren?type=commercial')}
                            className="text-xs font-bold uppercase tracking-widest text-gold hover:text-forest transition-colors cursor-pointer"
                        >
                            Anbieter werden
                        </button>
                        <span className="text-charcoal/30">•</span>
                        <button
                            onClick={() => router.push('/anbieter')}
                            className="group flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer"
                        >
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* ── 2. GENERAL PROVIDER CATEGORIES (Entry into Directory) ── */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center sm:justify-center gap-2 sm:gap-2.5 mb-10 sm:mb-12">
                    {/* Tab "Alle Bereiche" */}
                    <button
                        type="button"
                        onClick={() => handleCategoryNavigation('all')}
                        className="group relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold tracking-tight bg-white/90 hover:bg-white text-forest border border-forest/10 hover:border-gold hover:shadow-xs transition-all duration-200 w-full sm:w-auto shrink-0 cursor-pointer"
                    >
                        <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="truncate">Alle Bereiche</span>
                        <ArrowRight className="hidden sm:inline-block w-3 h-3 text-charcoal/40 group-hover:text-forest group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Individual Category Chips */}
                    {PROVIDER_CATEGORIES.map((cat) => {
                        const Icon = getCategoryIcon(cat.iconName);

                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryNavigation(cat.slug)}
                                className="group relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-full text-[11.5px] sm:text-xs font-medium tracking-tight bg-white/90 hover:bg-white text-charcoal/80 hover:text-forest border border-forest/10 hover:border-gold hover:shadow-xs transition-all duration-200 w-full sm:w-auto shrink-0 cursor-pointer"
                            >
                                <Icon className="w-3.5 h-3.5 text-forest/70 group-hover:text-gold transition-colors shrink-0" />
                                <span className="truncate">{cat.shortName || cat.name}</span>
                                <ArrowRight className="hidden sm:inline-block w-3 h-3 text-charcoal/30 group-hover:text-forest group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                            </button>
                        );
                    })}
                </div>

                {/* ── 3. SPOTLIGHT SUB-SECTION ── */}
                <div id="campuna-spotlight" className="pt-8 border-t border-forest/10 scroll-mt-24">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/15 text-forest border border-gold/30 text-[10px] font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3 text-gold" />
                                <span>IM SPOTLIGHT</span>
                            </div>
                            <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-forest">
                                Ausgewählte Anbieter mit besonderer Präsenz auf Campuna
                            </h3>
                            <p className="font-sans text-xs sm:text-sm text-charcoal/60 font-light">
                                Empfohlene Fachpartner und Betriebe mit verifizierter Premium-Präsenz.
                            </p>
                        </div>
                    </div>

                    {/* Spotlight Sliding Carousel / Cards */}
                    {providersList.length > 0 ? (
                        <div className="relative">
                            {shouldSlide && (
                                <>
                                    <div className="hidden md:block absolute inset-y-0 left-0 w-24 lg:w-32 bg-gradient-to-r from-sand via-sand/80 to-transparent z-10 pointer-events-none" />
                                    <div className="hidden md:block absolute inset-y-0 right-0 w-24 lg:w-32 bg-gradient-to-l from-sand via-sand/80 to-transparent z-10 pointer-events-none" />
                                </>
                            )}

                            <div
                                className={`relative overflow-x-hidden ${shouldSlide ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                ref={rowRef}
                                onMouseEnter={() => { isHoveredRef.current = true; }}
                                onMouseLeave={() => { isHoveredRef.current = false; }}
                                onPointerEnter={() => { isHoveredRef.current = true; }}
                                onPointerLeave={() => { isHoveredRef.current = false; }}
                            >
                                <motion.div
                                    drag={shouldSlide ? "x" : false}
                                    dragConstraints={shouldSlide ? { right: 0, left: -constraints } : { right: 0, left: 0 }}
                                    style={shouldSlide ? { x } : { x: 0 }}
                                    onDragStart={() => { isDraggingRef.current = true; isHoveredRef.current = true; }}
                                    onDragEnd={() => { isDraggingRef.current = false; }}
                                    onMouseEnter={() => { isHoveredRef.current = true; }}
                                    onMouseLeave={() => { isHoveredRef.current = false; }}
                                    onPointerEnter={() => { isHoveredRef.current = true; }}
                                    onPointerLeave={() => { isHoveredRef.current = false; }}
                                    className={shouldSlide
                                        ? "flex gap-5 sm:gap-6 w-max px-4 sm:px-16 md:px-32 py-2 sm:py-4"
                                        : "flex gap-5 sm:gap-6 justify-center w-full py-2 sm:py-4"
                                    }
                                >
                                    {providersList.map((partner, idx) => (
                                        <ProviderCard
                                            key={`${partner.id}-${idx}`}
                                            partner={partner}
                                            onPartnerClick={onPartnerClick}
                                            onAuthRequired={(url) => setAuthModalState({ isOpen: true, returnUrl: url })}
                                            router={router}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        /* Fallback Card when no spotlight partner is active */
                        <div className="bg-white rounded-3xl border border-forest/10 p-8 sm:p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-sand/60 text-forest mx-auto flex items-center justify-center border border-forest/5 shadow-2xs">
                                <Building2 className="w-7 h-7 text-gold" />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="font-display text-base sm:text-lg font-bold text-forest">
                                    Jetzt als Partner im Spotlight präsentieren
                                </h4>
                                <p className="font-sans text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto font-light leading-relaxed">
                                    Präsentiere dein Camping-Unternehmen prominent auf der Campuna Startseite und im bundesweiten Anbieterverzeichnis.
                                </p>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push(isLoggedIn ? '/abo' : '/registrieren?type=commercial')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-forest text-sand hover:bg-forest/90 hover:text-gold text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                                >
                                    <span>Jetzt Anbieter werden</span>
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 4. FOOTER ACTION BAR (Mobile Only) ── */}
                <div className="mt-8 pt-4 flex md:hidden items-center justify-center gap-3 text-xs">
                    <button
                        onClick={() => router.push(isLoggedIn ? '/abo' : '/registrieren?type=commercial')}
                        className="font-bold uppercase tracking-widest text-gold hover:text-forest transition-colors cursor-pointer"
                    >
                        Anbieter werden
                    </button>
                    <span className="text-charcoal/30">•</span>
                    <button
                        onClick={() => router.push('/anbieter')}
                        className="group flex items-center space-x-1.5 font-bold uppercase tracking-widest text-forest cursor-pointer"
                    >
                        <span className="pb-0.5 border-b border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter ansehen</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* ── Standard Auth Required Modal ── */}
            <AuthRequiredModal
                isOpen={authModalState.isOpen}
                onClose={() => setAuthModalState({ isOpen: false, returnUrl: '' })}
                context="profile"
                returnUrl={authModalState.returnUrl}
            />
        </section>
    );
}

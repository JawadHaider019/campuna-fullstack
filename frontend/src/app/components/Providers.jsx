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
    const tabsRef = useRef(null);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);
    const [constraints, setConstraints] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const [authModalState, setAuthModalState] = useState({ isOpen: false, returnUrl: '' });
    const [selectedCategory, setSelectedCategory] = useState('all');

    const { user } = useAuthStore();
    const [providersList, setProvidersList] = useState([]);

    const checkTabsScroll = useCallback(() => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
            setCanScrollTabsLeft(scrollLeft > 6);
            setCanScrollTabsRight(scrollLeft + clientWidth < scrollWidth - 6);
        }
    }, []);

    const scrollTabs = (direction) => {
        if (tabsRef.current) {
            const amount = direction === 'left' ? -260 : 260;
            tabsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        checkTabsScroll();
        const el = tabsRef.current;
        if (el) {
            el.addEventListener('scroll', checkTabsScroll, { passive: true });
            window.addEventListener('resize', checkTabsScroll);
            return () => {
                el.removeEventListener('scroll', checkTabsScroll);
                window.removeEventListener('resize', checkTabsScroll);
            };
        }
    }, [checkTabsScroll, providersList]);

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

    // Filter providers by selected category tab
    const filteredProviders = useMemo(() => {
        if (selectedCategory === 'all') return providersList;
        const sel = selectedCategory.toLowerCase();
        return providersList.filter(p => {
            const pCat = (p.providerCategory || '').toLowerCase();
            return pCat.includes(sel) || sel.includes(pCat);
        });
    }, [providersList, selectedCategory]);

    const x = useMotionValue(0);
    const dirRef = useRef(-1);
    const isHoveredRef = useRef(false);
    const isDraggingRef = useRef(false);
    const cardWidthRef = useRef(360);

    // Reset carousel position when category changes
    useEffect(() => {
        x.set(0);
    }, [selectedCategory, x]);

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
    }, [filteredProviders]);

    const shouldSlide = !isDesktop || filteredProviders.length > 3;

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

                if (shouldSlide && constraints > 0 && filteredProviders.length > 0) {
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
    }, [filteredProviders.length, constraints, x, shouldSlide]);

    const selectedCategoryObj = PROVIDER_CATEGORIES.find(c => c.name === selectedCategory || c.id === selectedCategory);

    return (
        <section id="campuna-spotlight" className="py-10 sm:py-16 bg-sand relative overflow-x-hidden scroll-mt-24 border-t border-forest/5">
            <div className="max-w-8xl mx-auto px-6 md:px-12">

                {/* ── 1. MAIN PROVIDER SECTION HEADER (Matched to Listing.jsx) ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                    <div className="space-y-2 max-w-3xl">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            CAMPUNA SPOTLIGHT
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
                            Camping-Anbieter im Spotlight
                        </h2>
                        <p className="font-sans text-sm text-charcoal/60 leading-relaxed font-light">
                            Hier zeigen wir gewerbliche Anbieter, die Campuna mit aufbauen: Händler, Vermieter, Werkstätten und Hersteller. Du bist selbst Anbieter? Dann präsentiere dein Unternehmen mit einem eigenen Profil.
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
                            className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer"
                        >
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* ── 2. CATEGORY TABS ROW ABOVE THE CARDS (Smooth Horizontal Scroll) ── */}
                <div className="relative mb-6 group/tabs">
                    {/* Left Scroll Chevron (Desktop & Tablet) */}
                    {canScrollTabsLeft && (
                        <button
                            type="button"
                            onClick={() => scrollTabs('left')}
                            aria-label="Nach links scrollen"
                            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/95 hover:bg-white text-forest shadow-md rounded-full items-center justify-center border border-forest/10 transition-all duration-200 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}

                    {/* Scrollable Tabs Track */}
                    <div
                        ref={tabsRef}
                        onWheel={(e) => {
                            if (tabsRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                                tabsRef.current.scrollLeft += e.deltaY;
                            }
                        }}
                        className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
                    >
                        {/* Tab "Alle" */}
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`group relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer ${
                                selectedCategory === 'all'
                                    ? 'bg-forest text-white shadow-md'
                                    : 'bg-white/90 hover:bg-white text-charcoal/75 hover:text-forest border border-forest/10 hover:border-forest/25'
                            }`}
                        >
                            <Sparkles className={`w-3.5 h-3.5 ${selectedCategory === 'all' ? 'text-gold' : 'text-charcoal/40 group-hover:text-forest'}`} />
                            <span>Alle Bereiche</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                selectedCategory === 'all' ? 'bg-white/20 text-gold' : 'bg-sand text-charcoal/60 border border-forest/5'
                            }`}>
                                {providersList.length}
                            </span>
                        </button>

                        {/* Individual Category Tabs */}
                        {PROVIDER_CATEGORIES.map((cat) => {
                            const Icon = getCategoryIcon(cat.iconName);
                            const isSelected = selectedCategory === cat.name;
                            const countInCat = providersList.filter(p => (p.providerCategory || '').toLowerCase().includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes((p.providerCategory || '').toLowerCase())).length;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`group relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-200 shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-forest text-white shadow-md'
                                            : 'bg-white/90 hover:bg-white text-charcoal/75 hover:text-forest border border-forest/10 hover:border-forest/25'
                                    }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-gold' : 'text-charcoal/40 group-hover:text-gold'}`} />
                                    <span>{cat.shortName || cat.name}</span>
                                    {countInCat > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isSelected ? 'bg-white/20 text-gold' : 'bg-sand text-charcoal/60 border border-forest/5'
                                        }`}>
                                            {countInCat}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Scroll Chevron (Desktop & Tablet) */}
                    {canScrollTabsRight && (
                        <button
                            type="button"
                            onClick={() => scrollTabs('right')}
                            aria-label="Nach rechts scrollen"
                            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/95 hover:bg-white text-forest shadow-md rounded-full items-center justify-center border border-forest/10 transition-all duration-200 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* ── 3. SPOTLIGHT SLIDING CAROUSEL / CARDS ── */}
                {filteredProviders.length > 0 ? (
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
                                {filteredProviders.map((partner, idx) => (
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
                    /* Fallback Card when category has no active spotlight partner */
                    <div className="bg-white rounded-3xl border border-forest/10 p-8 sm:p-10 text-center max-w-xl mx-auto shadow-xs space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-sand/60 text-forest mx-auto flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-forest">
                            Keine Anbieter gefunden
                        </h3>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/60 max-w-md mx-auto font-light leading-relaxed">
                            In dieser Kategorie sind aktuell keine Spotlight-Anbieter verfügbar.
                        </p>
                    </div>
                )}

                {/* Mobile Bottom Action */}
                <div className="mt-8 flex md:hidden items-center justify-center gap-3">
                    <button
                        onClick={() => router.push(isLoggedIn ? '/abo' : '/registrieren?type=commercial')}
                        className="text-xs font-bold uppercase tracking-widest text-gold hover:text-forest transition-colors cursor-pointer"
                    >
                        Anbieter werden
                    </button>
                    <span className="text-charcoal/30">•</span>
                    <button
                        onClick={() => router.push('/anbieter')}
                        className="group flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer"
                    >
                        <span className="pb-0.5 border-b border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter</span>
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

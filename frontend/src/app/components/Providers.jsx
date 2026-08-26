'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PROVIDERS } from '@/data';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80';
const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

const ProviderCard = React.memo(({ partner, onPartnerClick, router }) => {
    const [coverSrc, setCoverSrc] = useState(partner.coverImage || DEFAULT_COVER);
    const [logoSrc, setLogoSrc] = useState(partner.logo || DEFAULT_LOGO);

    const handleCardClick = () => {
        if (onPartnerClick) onPartnerClick(partner.name);
        const nameSlug = partner.name
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        router.push(`/provider_details/${nameSlug || partner.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="provider-card group relative flex-shrink-0 w-[360px] sm:w-[370px] md:w-[500px] lg:w-[550px] h-[150px] sm:h-[180px] md:h-[210px] lg:h-[240px] rounded-[24px] sm:rounded-[32px] overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-500 select-none border border-white/10 flex"
        >
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={coverSrc}
                    alt={partner.name}
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                    onError={() => setCoverSrc(DEFAULT_COVER)}
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/65 transition-colors duration-500" />
            </div>

            {/* LEFT PANEL (35%) — Centered Circular Logo */}
            <div className="relative z-10 flex items-center justify-center p-3 sm:p-4 shrink-0" style={{ width: '35%' }}>
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-30">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/20" />
                    <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/10" />
                </div>

                <div className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-white shadow-md border-2 border-white/10 overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                    <img
                        src={logoSrc}
                        alt={`${partner.name} Logo`}
                        className="w-full h-full object-cover"
                        onError={() => setLogoSrc(DEFAULT_LOGO)}
                    />
                </div>
            </div>

            {/* RIGHT PANEL (65%) — Text Content */}
            <div className="relative z-10 py-4 pr-3 sm:pr-4 pl-0 flex flex-col justify-center items-start text-left shrink-0" style={{ width: '65%' }}>
                <div className="flex flex-col items-start text-left">
                    <h3 className="font-display text-[18px] sm:text-[18px] md:text-xl lg:text-2xl font-extrabold text-white leading-tight tracking-tight group-hover:text-gold transition-colors duration-300">
                        {partner.name}
                    </h3>
                    <p className="font-sans text-[10px] sm:text-xs md:text-sm text-white/75 leading-relaxed font-light mt-1 line-clamp-2 sm:line-clamp-3">
                        {partner.description || 'Dein Partner für Camping Abenteuer.'}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 w-full">
                    <div className="inline-flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-white shadow-sm shrink-0">
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" />
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide">
                            {partner.listingsCount || 1} online
                        </span>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-forest flex items-center justify-center transform group-hover:translate-x-1 group-hover:bg-gold transition-all duration-300 shadow-md shrink-0">
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 rounded-[24px] sm:rounded-[32px] transition-all duration-500 pointer-events-none z-20" />
        </div>
    );
});

ProviderCard.displayName = 'ProviderCard';

export default function Providers({ onPartnerClick, isLoggedIn }) {
    const router = useRouter();
    const rowRef = useRef(null);
    const [constraints, setConstraints] = useState(0);

    const providersList = PROVIDERS || [];

    const x = useMotionValue(0);
    const isHoveredRef = useRef(false);
    const isDraggingRef = useRef(false);
    const cardWidthRef = useRef(360);
    const gap = 16;

    useEffect(() => {
        const measureCard = () => {
            if (!rowRef.current) return;
            const card = rowRef.current.querySelector('.provider-card');
            if (card) {
                cardWidthRef.current = card.getBoundingClientRect().width;
            }
            setConstraints(Math.max(0, rowRef.current.scrollWidth - rowRef.current.offsetWidth));
        };

        const timer = setTimeout(measureCard, 100);
        window.addEventListener('resize', measureCard);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', measureCard);
        };
    }, [providersList]);

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();

        const loop = (time) => {
            const delta = (time - lastTime) / 1000;
            lastTime = time;

            if (providersList.length > 0 && !isHoveredRef.current && !isDraggingRef.current) {
                const step = cardWidthRef.current + gap;
                const maxMove = step * providersList.length;
                let currentX = x.get() - 30 * delta;
                while (currentX <= -maxMove) {
                    currentX += maxMove;
                }
                while (currentX > 0) {
                    currentX -= maxMove;
                }
                x.set(currentX);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [providersList.length, x]);

    return (
        <section id="campuna-spotlight" className="py-10 sm:py-16 bg-sand relative overflow-x-hidden scroll-mt-24">
            <div className="max-w-8xl mx-auto px-6 md:px-12">
                {/* Section header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                    <div className="space-y-1">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            CAMPUNA SPOTLIGHT
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
                            Camping-Anbieter im Spotlight
                        </h2>
                        <div className="w-16 h-0.5 bg-gold rounded-full mt-4 mx-auto md:mx-0" />
                    </div>

                    <div className="hidden lg:flex items-center space-x-6">
                        <button
                            onClick={() => router.push(isLoggedIn ? '/my_account?n=yes' : '/signup_login')}
                            className="text-charcoal/60 hover:text-forest text-[11px] font-sans font-semibold transition-colors border-b border-transparent hover:border-forest/30 pb-0.5"
                        >
                            Auch Anbieter werden
                        </button>
                        <button onClick={() => router.push('/provider_details/vtmcamping')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest">
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="hidden md:block absolute inset-y-0 left-0 w-24 lg:w-32 bg-gradient-to-r from-sand via-sand/35 to-transparent z-10 pointer-events-none" />
                    <div className="hidden md:block absolute inset-y-0 right-0 w-24 lg:w-32 bg-gradient-to-l from-sand via-sand/35 to-transparent z-10 pointer-events-none" />

                    {providersList.length > 0 && (
                        <div className="relative overflow-x-hidden cursor-grab active:cursor-grabbing" ref={rowRef}>
                            <motion.div
                                drag="x"
                                dragConstraints={{ right: 0, left: -constraints }}
                                style={{ x }}
                                onDragStart={() => { isDraggingRef.current = true; }}
                                onDragEnd={() => { isDraggingRef.current = false; }}
                                onMouseEnter={() => { isHoveredRef.current = true; }}
                                onMouseLeave={() => { isHoveredRef.current = false; }}
                                className="flex gap-4 w-max px-4 sm:px-16 md:px-32 py-4 sm:py-6"
                            >
                                {[...providersList, ...providersList].map((partner, idx) => (
                                    <ProviderCard
                                        key={`${partner.id}-${idx}`}
                                        partner={partner}
                                        onPartnerClick={onPartnerClick}
                                        router={router}
                                    />
                                ))}
                            </motion.div>
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6 lg:hidden">
                        <button
                            onClick={() => router.push(isLoggedIn ? '/my_account?n=yes' : '/signup_login')}
                            className="text-charcoal/60 hover:text-forest text-[11px] font-sans font-semibold transition-colors border-b border-transparent hover:border-forest/30 pb-0.5"
                        >
                            Auch Anbieter werden
                        </button>
                        <button onClick={() => router.push('/provider_details/vtmcamping')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest">
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Anbieter</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

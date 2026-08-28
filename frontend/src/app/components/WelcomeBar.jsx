'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Tent, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function WelcomeBar({ isLoggedIn: propIsLoggedIn }) {
    const storeIsLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const isLoggedIn = propIsLoggedIn ?? storeIsLoggedIn;
    const [scrolled, setScrolled] = useState(false);
    const [hideOnFooter, setHideOnFooter] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        // Create an observer to detect footer
        const footerObserver = new IntersectionObserver(
            ([entry]) => {
                setHideOnFooter(entry.isIntersecting);
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px 50px 0px'
            }
        );

        const footer = document.getElementById('footer');
        if (footer) footerObserver.observe(footer);

        window.addEventListener('scroll', toggleVisibility);
        toggleVisibility();

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
            if (footer) footerObserver.unobserve(footer);
        };
    }, []);

    const isTop = !scrolled;

    return (
        <AnimatePresence mode="wait">
            {isTop ? (
                // TOP BAR VERSION
                <motion.div
                    key="top-banner"
                    initial={{ y: -120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -120, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed top-0 left-0 w-full z-[100] bg-forest text-sand"
                >
                    <div className="w-[calc(100%-1rem)] max-w-5xl mx-auto flex flex-row items-center gap-2 sm:gap-4 px-4 py-3 sm:px-7 sm:py-3">

                        <div className="sm:flex hidden shrink-0 w-12 h-12 rounded-2xl bg-forest border border-gold/20 flex items-center justify-center shadow-inner">
                            <Tent className="w-6 h-6 text-sand" />
                        </div>

                        <div className="flex-1 text-left">
                            <p className="font-display text-xs sm:text-base font-bold text-white leading-snug flex items-center justify-start gap-2 flex-wrap">
                                {isLoggedIn ? 'Du möchtest etwas anbieten?' : 'Private Anzeigen kostenlos einstellen'}
                                {!isLoggedIn && <span className="text-base sm:text-lg hidden sm:block">👋</span>}
                                {!isLoggedIn && (
                                    <span className="hidden sm:inline-flex items-center gap-1 bg-sand/20 text-sand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gold/20">
                                        <Sparkles className="w-2.5 h-2.5" /> Neu
                                    </span>
                                )}
                            </p>
                            <p className="font-sans text-[10px] sm:text-xs text-white/80 leading-relaxed">
                                {isLoggedIn
                                    ? 'Erstelle dein nächstes Inserat in wenigen Schritten.'
                                    : 'Verkaufe Campingzubehör, Fahrzeuge und mehr – schnell und unkompliziert.'}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push(isLoggedIn ? '/mein-konto?n=yes' : '/register')}
                            className="shrink-0 flex items-center gap-1 bg-sand hover:brightness-110 text-forest font-sans font-bold text-[8px] sm:text-[10px] uppercase tracking-wider px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-all duration-300 hover:scale-[1.03] shadow-lg whitespace-nowrap"
                        >
                            {isLoggedIn ? 'Inserat erstellen' : 'Jetzt inserieren'}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </motion.div>
            ) : !hideOnFooter && (
                // BOTTOM CARD VERSION
                <motion.div
                    key="bottom-banner"
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-1rem)] max-w-5xl"
                >
                    <div className="relative flex flex-row items-center gap-2 sm:gap-4 bg-forest/80 backdrop-blur-xl border border-white/10 rounded-[20px] sm:rounded-[28px] px-4 py-3 sm:px-7 sm:py-5 shadow-[0_24px_64px_-12px_rgba(0,99,13,0.45)]">

                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-24 h-24 bg-gold/20 rounded-full blur-[32px] pointer-events-none" />

                        <div className="sm:flex hidden shrink-0 w-12 h-12 rounded-2xl bg-forest border border-gold/20 flex items-center justify-center shadow-inner">
                            <Tent className="w-6 h-6 text-sand" />
                        </div>

                        <div className="flex-1 text-left">
                            <p className="font-display text-xs sm:text-base font-bold text-white leading-snug flex items-center justify-start gap-2 flex-wrap">
                                {isLoggedIn ? 'Du möchtest etwas anbieten?' : 'Private Anzeigen kostenlos einstellen'}
                                {!isLoggedIn && <span className="text-base sm:text-lg hidden sm:block">👋</span>}
                                {!isLoggedIn && (
                                    <span className="hidden sm:inline-flex items-center gap-1 bg-sand/20 text-sand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gold/20">
                                        <Sparkles className="w-2.5 h-2.5" /> Neu
                                    </span>
                                )}
                            </p>
                            <p className="font-sans text-[10px] sm:text-xs text-white/80 leading-relaxed">
                                {isLoggedIn
                                    ? 'Erstelle dein nächstes Inserat in wenigen Schritten.'
                                    : 'Verkaufe Campingzubehör, Fahrzeuge und mehr – schnell und unkompliziert.'}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push(isLoggedIn ? '/mein-konto?n=yes' : '/register')}
                            className="shrink-0 flex items-center gap-1 bg-sand hover:brightness-110 text-forest font-sans font-bold text-[8px] sm:text-[10px] uppercase tracking-wider px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-all duration-300 hover:scale-[1.03] shadow-lg whitespace-nowrap"
                        >
                            {isLoggedIn ? 'Inserat erstellen' : 'Jetzt inserieren'}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

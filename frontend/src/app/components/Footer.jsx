'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { CATEGORIES } from '@/data';
import { useAuthStore } from '@/store/useAuthStore';

const CATEGORY_SLUGS = {
    'Camping Zubehör': 'ausrüstung-und-zubehör',
    'Wohnmobile & Camper': 'fahrzeuge',
    'Zelte & Dachzelte': 'zelte-and-dachzelte',
    'Fahrräder & Träger': 'fahrräder-träger',
    'Stellplätze & Campingplätze': 'campingplätze-stellplätze',
    'Camping Services': 'dienstleistungen',
    'Tiny Houses': 'tiny-houses',
    'Mieten & Vermieten': 'mieten-vermieten',
    'Boote & Wassersport': 'boote-wassersport'
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.18,
            delayChildren: 0.05
        }
    }
};

const layerVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
    }
};

export default function Footer() {
    const user = useAuthStore((state) => state.user);

    const footerRef = useRef(null);
    const controls = useAnimation();
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = footerRef.current;
        if (!el) return;
        const trigger = () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;
            controls.start('visible');
        };
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { trigger(); observer.disconnect(); } },
            { threshold: 0, rootMargin: '0px' }
        );
        const raf = requestAnimationFrame(() => {
            observer.observe(el);
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) { trigger(); observer.disconnect(); }
        });
        return () => { cancelAnimationFrame(raf); observer.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <footer
            id="footer"
            ref={footerRef}
            className="relative bg-gradient-to-b from-[#F9F7F1] via-[#F4EFE6] to-[#ECE3D4] text-charcoal pt-16 pb-8 border-t border-forest/10"
        >
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-forest/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={controls}
                className="max-w-7xl mx-auto px-6 md:px-12 relative z-10"
            >
                <motion.div
                    variants={layerVariants}
                    className="bg-white/20 backdrop-blur-xs border border-forest/5 rounded-2xl p-4 sm:p-5 mb-12 text-center w-full"
                >
                    <p className="font-sans text-xs sm:text-sm md:text-[14.5px] text-charcoal/75 leading-relaxed font-light">
                        <span className="font-semibold text-forest">Campuna, dein Camping-Marktplatz.</span> Campuna ist Deutschlands Plattform rund ums Camping: Wohnmobile und Camper, Wohnwagen, Zelte und Dachzelte, Campingzubehör, Stellplätze und Campingplätze, Tiny Houses, Boote sowie Camping-Services, zum Kaufen, Verkaufen und Entdecken an einem Ort.
                    </p>
                </motion.div>

                <motion.div
                    variants={layerVariants}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-10 items-start pb-12 border-b border-forest/10"
                >
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <Link href="/" title="Zur Startseite" className="flex items-start group cursor-pointer inline-flex self-start">
                            <Image src="/logo.webp" alt="Campuna - Dein Camping-Marktplatz" width={140} height={40} className="h-[38px] w-[135px] object-contain group-hover:opacity-85 transition-opacity" />
                            <span className="text-2xl sm:text-3xl font-normal text-forest ml-0.5 -mt-1 select-none leading-none">®</span>
                        </Link>
                        <p className="font-sans text-sm text-charcoal/75 font-normal leading-relaxed max-w-sm">
                            Von Campern für Camper. Der spezialisierte Marktplatz für die deutschsprachige Camping-Community.
                        </p>
                        <div className="pt-2 text-[12px] text-charcoal/65 font-sans leading-relaxed">
                            <p>Campuna • Erfurt, Thüringen, Deutschland</p>
                            <p className="mt-0.5">E-Mail: <a href="mailto:info@campuna.de" className="hover:text-forest underline transition-colors">info@campuna.de</a></p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="font-sans text-xs font-bold text-forest tracking-[0.25em] uppercase pb-1 border-b border-forest/10 inline-block">Navigation</h3>
                        <ul className="space-y-2.5 font-sans text-sm text-charcoal/75">
                            <li><Link href="/" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Startseite</Link></li>
                            <li><Link href="/inserate" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Alle Angebote</Link></li>
                            <li><Link href="/anbieter" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Anbieter</Link></li>
                            <li><Link href="/abo" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Campuna Business</Link></li>
                            <li><Link href="/uber-campuna" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Über uns</Link></li>
                            <li><Link href="/so-funktioniert-campuna" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">So funktioniert's</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="font-sans text-xs font-bold text-forest tracking-[0.25em] uppercase pb-1 border-b border-forest/10 inline-block">Kategorien</h3>
                        <ul className="space-y-2 font-sans text-[13px] text-charcoal/75">
                            {CATEGORIES.map((cat) => {
                                const slug = CATEGORY_SLUGS[cat.name] || cat.slug || '';
                                return (
                                    <li key={cat.id}>
                                        <Link href={'/kategorie/' + slug} className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">
                                            {cat.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="font-sans text-xs font-bold text-forest tracking-[0.25em] uppercase pb-1 border-b border-forest/10 inline-block">Support & Tools</h3>
                        <ul className="space-y-2.5 font-sans text-sm text-charcoal/75">
                            <li><Link href="/faq-hilfe" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Hilfe & FAQ</Link></li>
                            <li><Link href="/zuladungsrechner" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Zuladungsrechner</Link></li>
                            <li><Link href="/reisekostenrechner" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Reisebudget-Rechner</Link></li>
                            <li><Link href="/kontakt" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Kontakt & Feedback</Link></li>
                            <li><Link href="/sicher-handeln" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Sicher handeln</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="font-sans text-xs font-bold text-forest tracking-[0.25em] uppercase pb-1 border-b border-forest/10 inline-block">Rechtliches</h3>
                        <ul className="space-y-2.5 font-sans text-sm text-charcoal/75">
                            <li><Link href="/agb" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">AGB</Link></li>
                            <li><Link href="/nutzungsbedingungen" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Nutzungsbedingungen</Link></li>
                            <li><Link href="/datenschutz" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Datenschutz</Link></li>
                            <li><Link href="/impressum" className="hover:text-forest hover:translate-x-1 inline-flex items-center transition-all duration-200">Impressum</Link></li>
                        </ul>
                    </div>
                </motion.div>

                <motion.div
                    variants={layerVariants}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-charcoal/70 font-sans"
                >
                    <p className="text-center sm:text-left font-normal">
                        © 2026 Campuna®. Alle Rechte vorbehalten.
                    </p>
                    <div className="flex items-center gap-3 justify-center">
                        <a href="https://www.instagram.com/campuna.de/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/80 border border-forest/10 hover:border-forest/30 text-forest hover:bg-forest hover:text-sand flex items-center justify-center transition-all duration-200 shadow-xs" aria-label="Instagram">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                        <a href="https://www.tiktok.com/@campuna.de" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/80 border border-forest/10 hover:border-forest/30 text-forest hover:bg-forest hover:text-sand flex items-center justify-center transition-all duration-200 shadow-xs" aria-label="TikTok">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@campuna?si=YU8ngbf058KMRVy0" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/80 border border-forest/10 hover:border-forest/30 text-forest hover:bg-forest hover:text-sand flex items-center justify-center transition-all duration-200 shadow-xs" aria-label="YouTube">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61580574896053" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/80 border border-forest/10 hover:border-forest/30 text-forest hover:bg-forest hover:text-sand flex items-center justify-center transition-all duration-200 shadow-xs" aria-label="Facebook">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </footer>
    );
}
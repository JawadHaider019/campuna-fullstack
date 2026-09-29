'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Compass, Users, Layers, ShieldCheck, Heart, Sparkles, CheckCircle2, ChevronsDown } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const CTA = lazy(() => import('../components/CTA'));

const VALUE_CARDS = [
    {
        title: 'Camping im Mittelpunkt',
        icon: Compass,
        desc: 'Bei Campuna ist Camping nicht nur eine Kategorie unter vielen. Die ganze Plattform dreht sich darum.',
    },
    {
        title: 'Alles an einem Ort',
        icon: Layers,
        desc: 'Angebote, Anbieter, Orte, Vermietung, Services, Wissen und praktische Helfer wachsen Schritt für Schritt zusammen.',
    },
    {
        title: 'Von Campern gemacht',
        icon: Heart,
        desc: 'Wir bauen die Campingplattform, die wir selbst vermisst haben.',
    },
    {
        title: 'Offen für alle Seiten',
        icon: Users,
        desc: 'Private Camper, Händler, Campingplätze, Vermieter und Serviceanbieter gehören zur selben Camping-Welt.',
    },
    {
        title: 'Einfach und transparent',
        icon: ShieldCheck,
        desc: 'Campuna soll klar bleiben und ohne unnötige Hürden funktionieren.',
    },
    {
        title: 'Campuna wächst mit dir',
        icon: Sparkles,
        desc: 'Jedes Inserat, jeder Anbieter und jeder aktive Camper macht die Plattform ein Stück wertvoller.',
    },
];

const COLORS = ['#143D29', '#C8A96B', '#E11D48', '#6366F1', '#059669', '#D97706'];

export default function AboutPage() {
    // Scroll-triggered shine on the story image
    const shineRef = useRef(null);
    const isShineInView = useInView(shineRef, { once: false, amount: 0.3 });
    const shineControls = useAnimation();

    useEffect(() => {
        if (isShineInView) {
            shineControls.set({ left: '-100%' });
            shineControls.start({
                left: '150%',
                transition: { duration: 1.0, ease: 'easeOut', delay: 0.2 }
            });
        }
    }, [isShineInView, shineControls]);

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-x-hidden">
            {/* 1. HERO SECTION */}
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[60vh] md:min-h-[65vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 mx-4 md:mx-8 lg:mx-12 shadow-2xl border border-forest/10 will-change-transform"
            >
                {/* Background Cinematic Image with Zoom Animation */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/about_hero.webp"
                            alt="Camper sitzen abends vor ihrem Campingbus in den Hügeln"
                            className="w-full h-full object-cover will-change-transform"
                            loading="eager"
                            decoding="async"
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                    {/* Deep luxurious multi-layered gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
                </div>

                {/* Floating Radial Background Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.08),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center w-full">
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-[28px] sm:text-4xl md:text-5xl font-bold tracking-tight animate-text-shine mb-6 drop-shadow-lg leading-tight text-center"
                    >
                        Wir wollen Camping <span className="text-gold">an einem Ort</span> zusammenbringen.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-md md:text-lg text-sand/85 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md text-center"
                    >
                        Campuna ist entstanden, weil wir selbst einen Ort vermisst haben, an dem Angebote, Anbieter, Campingplätze, Wissen und praktische Helfer rund ums Camping zusammenkommen.
                    </motion.p>

                    {/* Scroll Down Button with continuous glow */}
                    <div className="relative mt-8 flex items-center justify-center">
                        <motion.span
                            className="absolute inset-0 rounded-full bg-forest/40 blur-md"
                            animate={{
                                scale: [1, 1.35, 1],
                                opacity: [0.5, 0.15, 0.5],
                            }}
                            transition={{
                                duration: 2.2,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        />
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1,
                                y: [0, 6, 0]
                            }}
                            transition={{
                                opacity: { delay: 0.4, duration: 0.6 },
                                y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                            }}
                            onClick={() => {
                                const nextSection = document.getElementById('warum');
                                if (nextSection) {
                                    nextSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="relative overflow-hidden flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/20 bg-forest/80 text-white cursor-pointer shadow-lg outline-none font-sans text-[11px] sm:text-xs uppercase tracking-widest font-semibold active:scale-95 transition-transform"
                            aria-label="Mehr über uns erfahren"
                        >
                            <motion.span
                                className="absolute top-0 h-full w-[45%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] pointer-events-none"
                                animate={{ left: ['-60%', '140%'] }}
                                transition={{
                                    duration: 1.4,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatDelay: 2.5,
                                }}
                            />
                            <span>Mehr über uns erfahren</span>
                            <ChevronsDown className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </motion.section>

            {/* ── Breadcrumbs below Hero ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0"
            >
                <Breadcrumbs
                    items={[{ label: 'Über Campuna' }]}
                    variant="light"
                />
            </motion.div>

            {/* SEO Marketplace Strip */}
            <section className="pt-6 sm:pt-8 relative z-20">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="bg-white rounded-[28px] sm:rounded-[36px] border border-forest/10 shadow-[0_8px_40px_-8px_rgba(20,61,41,0.08)] px-6 sm:px-10 py-6 sm:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 will-change-transform"
                    >
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-forest"></span>
                            </span>
                            <h3 className="font-display text-base sm:text-lg font-bold tracking-wide text-forest">
                                Dein Camping-Marktplatz für Deutschland
                            </h3>
                        </div>
                        <p className="pl-6 sm:pl-0 font-sans text-sm text-charcoal/60 font-light leading-relaxed sm:text-right">
                            Die spezialisierte Plattform für Wohnmobile, Wohnwagen, Campingzubehör, Stellplätze, Vermietung und Services rund ums Camping.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* 2. "WARUM ES CAMPUNA GIBT" SECTION */}
            <section id="warum" className="py-10 sm:py-16 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Story text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="lg:col-span-7 space-y-6 sm:space-y-8 will-change-transform"
                        >
                            <div className="space-y-2">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    Die Geschichte
                                </span>
                                <h2 className="font-display text-[26px] sm:text-[40px] font-bold tracking-tight text-forest leading-tight">
                                    Warum es Campuna gibt
                                </h2>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: 48 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="h-0.5 bg-gold rounded-full"
                                />
                            </div>

                            <div className="font-sans text-[15px] sm:text-[16px] text-charcoal/80 space-y-6 leading-relaxed font-light">
                                <p>
                                    Camping ist ein riesiges Thema. Digital ist es trotzdem über viele Orte verstreut: Fahrzeuge stehen auf allgemeinen Kleinanzeigen-Portalen, Tipps verstecken sich in Gruppen und Foren, Campingplätze haben eigene Verzeichnisse, Zubehör und Services liegen wieder woanders.
                                </p>
                                <p className="font-medium text-forest">
                                    Wir wollten einen Ort schaffen, an dem Camping nicht nur eine Kategorie unter vielen ist. Einen Ort, an dem sich alles ums Camping dreht. Genau dafür haben wir Campuna gebaut.
                                </p>
                                <p>
                                    Heute findest du auf Campuna private und gewerbliche <a href="/inserate" className="text-forest font-medium underline underline-offset-4 decoration-gold/60 hover:text-gold hover:decoration-gold transition-colors">Angebote</a>, Campingplätze, Vermietungen, Services, Wissen und praktische Camping-Helfer.
                                </p>
                                <p>
                                    Unsere Idee geht weiter. Wir bauen die Campingplattform, die wir selbst vermisst haben. Das Fundament steht. Jetzt wächst Campuna mit jedem Camper, jedem Inserat, jedem Anbieter und jedem Campingplatz.
                                </p>
                            </div>
                        </motion.div>

                        {/* Visual element */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="lg:col-span-5 relative group cursor-pointer will-change-transform"
                        >
                            <div className="absolute inset-0 bg-gold/10 rounded-[32px] sm:rounded-[40px] transform rotate-3 translate-x-2 translate-y-2 -z-10 group-hover:rotate-1 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-500" />

                            <div ref={shineRef} className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] shadow-2xl border border-forest/10 aspect-[1/1] bg-sand/5">
                                <img
                                    src="/about_founder.webp"
                                    alt="Camper genießt den Abend an einem See"
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                                    loading="lazy"
                                    decoding="async"
                                />

                                <motion.div
                                    className="absolute top-0 h-full w-[50%] pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg]"
                                    initial={{ left: '-100%' }}
                                    animate={shineControls}
                                />

                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                                    <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000 ease-out" />
                                </div>

                                <div className="absolute bottom-4 left-4 z-10">
                                    <div className="inline-flex items-center gap-2 py-2 px-4 sm:py-3 sm:px-6 rounded-2xl bg-sand/85 backdrop-blur-sm border border-forest/10 font-sans text-forest font-bold tracking-wide uppercase text-[10px] sm:text-xs hover:bg-sand transition-colors duration-300 shadow-lg">
                                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold animate-pulse" />
                                        <span>CAMPUNA WÄCHST MIT DIR.</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. TODAY / VISION COMPARISON */}
            <section className="py-10 sm:py-16 bg-sand/40 relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-2"
                    >
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Status & Zukunft
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest leading-tight">
                            Wo Campuna heute steht
                        </h2>
                        <p className="font-sans text-sm text-charcoal/60 leading-relaxed font-light">
                            Wie Campuna aufgebaut ist und wohin die Reise geht.
                        </p>
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: 64 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-0.5 bg-gold mx-auto rounded-full mt-4"
                        />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Today Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="px-6 py-8 sm:p-8 rounded-[32px] bg-white border border-forest/10 shadow-[0_16px_40px_-10px_rgba(20,61,41,0.04)] hover:shadow-[0_20px_50px_-8px_rgba(20,61,41,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group cursor-pointer relative overflow-hidden will-change-transform"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-forest/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div>
                                <h3 className="font-display text-xl sm:text-2xl font-bold text-forest mb-6 flex items-center gap-2.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-forest"></span>
                                    </span>
                                    Heute auf Campuna
                                </h3>

                                <ul className="space-y-5 font-sans text-sm text-charcoal/80 leading-relaxed font-light">
                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-forest/5 text-forest group-hover/item:bg-forest group-hover/item:text-white transition-all duration-300 shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>Spezialisierter Marktplatz für den Kauf und Verkauf von Fahrzeugen und Campingausrüstung.</span>
                                    </motion.li>

                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-forest/5 text-forest group-hover/item:bg-forest group-hover/item:text-white transition-all duration-300 shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>Gewerbliche Anbieter wie Werkstätten, Vermieter und Serviceprofis mit eigenen Profilen und Angeboten.</span>
                                    </motion.li>

                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-forest/5 text-forest group-hover/item:bg-forest group-hover/item:text-white transition-all duration-300 shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>Campingplätze und Stellplätze mit Informationen und passenden Angeboten.</span>
                                    </motion.li>

                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-forest/5 text-forest group-hover/item:bg-forest group-hover/item:text-white transition-all duration-300 shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>Camping-Wissen und Tools wie der <a href="/zuladungsrechner" className="text-forest font-medium underline underline-offset-2 hover:text-gold transition-colors">Zuladungsrechner</a> und der <a href="/reisekostenrechner" className="text-forest font-medium underline underline-offset-2 hover:text-gold transition-colors">Reisebudget-Rechner</a> für entspannte Touren.</span>
                                    </motion.li>
                                </ul>
                            </div>
                        </motion.div>

                        {/* Vision Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                            className="px-6 py-8 sm:p-8 rounded-[32px] bg-gradient-to-br from-forest to-[#143d29] text-white border border-white/5 shadow-xl hover:shadow-[0_20px_50px_-8px_rgba(20,61,41,0.2)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group cursor-pointer relative overflow-hidden will-change-transform"
                        >
                            <motion.div
                                className="absolute top-0 h-full w-[45%] pointer-events-none bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                                style={{ skewX: -25 }}
                                animate={{
                                    left: ['-60%', '140%'],
                                }}
                                transition={{
                                    duration: 2.2,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatDelay: 5,
                                }}
                            />

                            <div>
                                <h3 className="font-display text-xl sm:text-2xl font-bold text-gold mb-6 flex items-center gap-2.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold"></span>
                                    </span>
                                    Unsere Vision
                                </h3>

                                <ul className="space-y-5 font-sans text-sm text-sand/85 leading-relaxed font-light">
                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-white/5 text-gold group-hover/item:bg-gold group-hover/item:text-forest transition-all duration-300 shrink-0 mt-0.5">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span>Immer mehr Bereiche der Camping-Welt sinnvoll und digital an einem Ort zusammenbringen.</span>
                                    </motion.li>

                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-white/5 text-gold group-hover/item:bg-gold group-hover/item:text-forest transition-all duration-300 shrink-0 mt-0.5">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span>Eine faire und transparente Community, in der gewerbliche Partner, Händler und private Camper partnerschaftlich handeln.</span>
                                    </motion.li>

                                    <motion.li
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        className="flex items-start gap-3.5 group/item"
                                    >
                                        <div className="p-1 rounded-lg bg-white/5 text-gold group-hover/item:bg-gold group-hover/item:text-forest transition-all duration-300 shrink-0 mt-0.5">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span>Gemeinsam wachsen: Jede neue Funktion und jeder neue Anbieter richtet sich nach dem Feedback der Community.</span>
                                    </motion.li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. SIX VALUE CARDS */}
            <section className="pt-10 sm:pt-16 pb-2 sm:pb-10 bg-white relative overflow-hidden">
                {/* Ambient background accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/4 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-forest/4 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    {/* Section Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-center mb-14 space-y-2"
                    >
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Unsere Werte
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest leading-tight">
                            Was uns wichtig ist
                        </h2>
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: 64 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-0.5 bg-gold mx-auto rounded-full mt-4"
                        />
                    </motion.div>

                    {/* Pipeline Diagram with Rich Cards */}
                    <div className="hidden md:block relative w-full max-w-6xl mx-auto">
                        {/* Full-Section Overlay SVG Streams */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            <svg
                                viewBox="0 0 1000 680"
                                preserveAspectRatio="none"
                                className="w-full h-full overflow-visible"
                            >
                                <defs>
                                    {VALUE_CARDS.map((_, i) => (
                                        <linearGradient key={i} id={`d-stream-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor={COLORS[i]} />
                                            <stop offset="100%" stopColor={COLORS[i]} stopOpacity="0.4" />
                                        </linearGradient>
                                    ))}
                                    <filter id="d-glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="4" result="b" />
                                        <feComposite in="SourceGraphic" in2="b" operator="over" />
                                    </filter>
                                </defs>

                                {/* 6 Bezier Streams Anchored at Right Edge of Cards (56% = X=560) → Far-Right Hub (89% = X=890, Y=340) */}
                                {[
                                    { path: 'M 560,50 C 680,50 810,340 890,340' },
                                    { path: 'M 560,166 C 680,166 810,340 890,340' },
                                    { path: 'M 560,282 C 680,282 810,340 890,340' },
                                    { path: 'M 560,398 C 680,398 810,340 890,340' },
                                    { path: 'M 560,514 C 680,514 810,340 890,340' },
                                    { path: 'M 560,630 C 680,630 810,340 890,340' }
                                ].map((item, i) => (
                                    <g key={i}>
                                        <path
                                            d={item.path}
                                            fill="none"
                                            stroke={COLORS[i]}
                                            strokeWidth="8"
                                            strokeOpacity="0.16"
                                            vectorEffect="non-scaling-stroke"
                                            filter="url(#d-glow-effect)"
                                        />
                                        <path
                                            d={item.path}
                                            fill="none"
                                            stroke={`url(#d-stream-${i})`}
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <motion.path
                                            d={item.path}
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth="2.5"
                                            strokeDasharray="18 110"
                                            strokeLinecap="round"
                                            vectorEffect="non-scaling-stroke"
                                            animate={{ strokeDashoffset: [128, -128] }}
                                            transition={{ duration: 2.6 + i * 0.2, repeat: Infinity, ease: 'linear' }}
                                        />
                                    </g>
                                ))}
                            </svg>
                        </div>

                        {/* Main Content Grid - Side-by-Side ROW */}
                        <div className="flex flex-row items-center justify-between gap-0 relative z-10">
                            {/* LEFT: 6 Value Cards (56% Width) */}
                            <div className="w-[56%] space-y-4">
                                {VALUE_CARDS.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -25 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, margin: '-30px' }}
                                            transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                                            className="group relative bg-white border border-forest/10 rounded-[24px] p-5 shadow-sm hover:shadow-[0_16px_40px_-10px_rgba(20,61,41,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-[100px] flex flex-col justify-center will-change-transform"
                                        >
                                            <div className="flex items-center justify-between gap-2 pl-2">
                                                <h3 className="font-display text-lg font-bold text-forest leading-snug">
                                                    {item.title}
                                                </h3>

                                                <div
                                                    className="flex w-8 h-8 rounded-full items-center justify-center shrink-0 shadow-2xs"
                                                    style={{ backgroundColor: `${COLORS[index]}15` }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: COLORS[index] }} />
                                                </div>
                                            </div>

                                            <p className="font-sans text-sm text-charcoal/70 leading-relaxed font-light pl-2 mt-1">
                                                {item.desc}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* RIGHT: Campuna Hub (44% Width) */}
                            <div className="flex w-[44%] items-center justify-end pr-14">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7 }}
                                    className="relative flex items-center justify-center will-change-transform"
                                >
                                    <motion.div
                                        className="w-28 h-28 rounded-full border-2 border-dashed border-forest/30 flex items-center justify-center"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <motion.div
                                        className="absolute w-22 h-22 rounded-full border-2 border-gold/50"
                                        animate={{ scale: [1, 1.22, 1], opacity: [0.7, 0.2, 0.7] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    <div className="absolute w-16 h-16 rounded-full bg-white border-4 border-forest shadow-xl flex items-center justify-center overflow-hidden">
                                        <img src="/fav.webp" alt="Campuna" className="w-9 h-9 object-contain" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE DIAGRAM (Visible only on mobile: block md:hidden) */}
                    <div className="block md:hidden relative w-full max-w-md mx-auto px-2">
                        {/* TOP: Logo / Hub */}
                        <div className="flex flex-col items-center relative z-10 mb-1">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="relative flex items-center justify-center z-10 will-change-transform"
                            >
                                <motion.div
                                    className="w-20 h-20 rounded-full border-2 border-dashed border-forest/30 flex items-center justify-center bg-white/50 backdrop-blur-xs"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                                />
                                <motion.div
                                    className="absolute w-16 h-16 rounded-full border-2 border-gold/50"
                                    animate={{ scale: [1, 1.22, 1], opacity: [0.7, 0.2, 0.7] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <div className="absolute w-12 h-12 rounded-full bg-white border-3 border-forest shadow-xl flex items-center justify-center overflow-hidden z-10">
                                    <img src="/fav.webp" alt="Campuna" className="w-7 h-7 object-contain" />
                                </div>
                            </motion.div>

                            {/* Pipe Connecting Logo Bottom to 1st Card Top (Runs behind) */}
                            <div className="relative flex justify-center items-center h-14 w-full pointer-events-none -my-3 z-0">
                                <svg className="w-8 h-full overflow-visible" viewBox="0 0 24 56">
                                    <defs>
                                        <linearGradient id="v-pipe-logo-0" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#143D29" />
                                            <stop offset="100%" stopColor={COLORS[0]} />
                                        </linearGradient>
                                    </defs>
                                    <line x1="12" y1="0" x2="12" y2="56" stroke="#143D29" strokeWidth="8" strokeOpacity="0.45" strokeLinecap="round" />
                                    <line x1="12" y1="0" x2="12" y2="56" stroke="url(#v-pipe-logo-0)" strokeWidth="4" strokeLinecap="round" />
                                    <motion.line
                                        x1="12"
                                        y1="0"
                                        x2="12"
                                        y2="56"
                                        stroke="#ffffff"
                                        strokeWidth="3"
                                        strokeDasharray="12 28"
                                        strokeLinecap="round"
                                        animate={{ strokeDashoffset: [40, -40] }}
                                        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* CARDS & PIPES VERTICAL FLOW */}
                        <div className="flex flex-col items-center w-full">
                            {VALUE_CARDS.map((item, index) => {
                                const Icon = item.icon;
                                const cardColor = COLORS[index];
                                const nextColor = COLORS[index + 1] || COLORS[index];
                                const isLast = index === VALUE_CARDS.length - 1;

                                return (
                                    <React.Fragment key={index}>
                                        {/* Card */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: '-20px' }}
                                            transition={{ duration: 0.4, delay: index * 0.06 }}
                                            className="group relative z-10 bg-white border border-forest/10 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all duration-300 w-full will-change-transform"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                                                    style={{ backgroundColor: `${cardColor}15` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: cardColor }} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-display text-base font-bold text-forest leading-snug">
                                                        {item.title}
                                                    </h3>
                                                    <p className="font-sans text-xs text-charcoal/70 leading-relaxed font-light mt-1">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Pipe connecting bottom of card[index] to top of card[index + 1] */}
                                        {!isLast && (
                                            <div className="relative flex justify-center items-center h-14 w-full pointer-events-none -my-3 z-0">
                                                <svg className="w-8 h-full overflow-visible" viewBox="0 0 24 56">
                                                    <defs>
                                                        <linearGradient id={`v-pipe-card-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" stopColor={cardColor} />
                                                            <stop offset="100%" stopColor={nextColor} />
                                                        </linearGradient>
                                                    </defs>
                                                    <line x1="12" y1="0" x2="12" y2="56" stroke={cardColor} strokeWidth="8" strokeOpacity="0.45" strokeLinecap="round" />
                                                    <line x1="12" y1="0" x2="12" y2="56" stroke={`url(#v-pipe-card-${index})`} strokeWidth="4" strokeLinecap="round" />
                                                    <motion.line
                                                        x1="12"
                                                        y1="0"
                                                        x2="12"
                                                        y2="56"
                                                        stroke="#ffffff"
                                                        strokeWidth="3"
                                                        strokeDasharray="12 28"
                                                        strokeLinecap="round"
                                                        animate={{ strokeDashoffset: [40, -40] }}
                                                        transition={{ duration: 1.6 + index * 0.1, repeat: Infinity, ease: 'linear' }}
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.8 }}
                        className="p-6 text-center space-y-2"
                    >
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest leading-tight">
                            Das Fundament steht.{' '}
                            <span className="text-gold text-sm sm:text-3xl md:text-4xl tracking-[0.2px] font-medium block sm:inline">
                                Was daraus wird, entsteht mit deiner Hilfe.
                            </span>
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/70 max-w-2xl mx-auto leading-relaxed font-light">
                            Campuna ist noch nicht am Ziel. Genau deshalb ist jetzt der richtige Moment, von Anfang an dabei zu sein.
                        </p>
                        <p className="font-display text-base sm:text-lg text-forest font-semibold pt-3 tracking-wide">
                            „Campuna wächst mit dir. Sei von Anfang an dabei.“
                        </p>
                    </motion.div>
                </div>
            </section>

            <Suspense fallback={<div className="py-12 bg-sand/30 animate-pulse rounded-2xl mx-4 my-8" />}>
                <CTA />
            </Suspense>
        </div>
    );
}

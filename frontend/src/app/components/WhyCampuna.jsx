'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, Award, Play, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const TRUST_PILLARS = [
    {
        id: '01',
        icon: Sparkles,
        title: 'Camping an einem Ort',
        desc: 'Angebote, Anbieter, Wissen und Werkzeuge: Du musst nicht mehr zwischen fünf Portalen springen. Auf Campuna findest du alles rund ums Camping gebündelt an einem Ort.'
    },
    {
        id: '02',
        icon: ShieldCheck,
        title: 'Von Campern gemacht',
        desc: 'Hinter Campuna steht ein Team, das selbst campt. Deshalb bauen wir genau die Funktionen, die uns unterwegs gefehlt haben, von der Umkreissuche bis zum Zuladungsrechner.'
    },
    {
        id: '03',
        icon: Award,
        title: 'Campuna wächst mit dir',
        desc: 'Mit jedem Inserat, jedem Anbieter und jedem Ratgeber-Artikel wird die Plattform nützlicher. Deine Angebote und dein Feedback machen Campuna jeden Tag ein Stück besser.'
    }
];

export default function WhyCampuna() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent background scrolling while video modal is open
    useEffect(() => {
        if (isPlaying) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isPlaying]);

    return (
        <section id="why-campuna" className="py-16 md:py-24 bg-forest relative overflow-hidden scroll-mt-24 border-t border-b border-white/10 text-white">
            {/* Subtle Ambient Background Gradients */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
                    <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block">
                        Vertrauen & Vorteile
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                        Warum Campuna?
                    </h2>
                    <div className="space-y-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-light">
                        <p className="text-white/85">
                            Camping findet heute an vielen verschiedenen Orten statt. Angebote hier, Tipps dort, Campingplätze wieder woanders.
                        </p>

                        <p className="text-gold font-semibold">
                            Unsere Idee ist einfach: Wir wollen Camping an einem Ort zusammenbringen.
                        </p>

                        <p className="text-white/85">
                            Das Fundament steht. Jetzt wächst Campuna mit jedem Camper, jedem Inserat, jedem Anbieter und jedem Campingplatz weiter.
                        </p>

                        <p className="text-gold font-bold text-base sm:text-lg tracking-wide pt-1">
                            Campuna wächst mit euch.
                        </p>
                    </div>
                </div>

                {/* 2-Column Split Layout: USPs on Left, Interactive Video Showcase + Mission Card on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

                    {/* Left Column (7 cols): Core Trust Pillars */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            {TRUST_PILLARS.map((pillar, index) => {
                                const Icon = pillar.icon;
                                return (
                                    <motion.div
                                        key={pillar.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-gold/40 hover:bg-white/[0.14] p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-start gap-4 sm:gap-5 group"
                                    >
                                        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 text-gold group-hover:bg-gold group-hover:text-forest transition-all duration-300 shrink-0 shadow-inner">
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-gold transition-colors">
                                                    {pillar.title}
                                                </h3>
                                                <span className="font-mono text-xs font-bold text-white/25 group-hover:text-gold/60 transition-colors">
                                                    {pillar.id}
                                                </span>
                                            </div>
                                            <p className="font-sans text-xs sm:text-sm text-white/75 leading-relaxed font-light">
                                                {pillar.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column (5 cols): Cinematic Video Card + Mission Statement Box */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        {/* Video Showcase */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative aspect-video lg:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-black group cursor-pointer"
                            onClick={() => setIsPlaying(true)}
                        >
                            {/* YouTube Thumbnail Background */}
                            <img
                                src="https://img.youtube.com/vi/7VLlgt1Rgr4/maxresdefault.jpg"
                                alt="Campuna Vorstellungsvideo"
                                loading="lazy"
                                className="w-full h-full object-cover brightness-80 group-hover:scale-105 group-hover:brightness-95 transition-all duration-700 ease-out"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/40 to-black/30 pointer-events-none" />

                            {/* Play Button & Overlay Content */}
                            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 z-10">


                                <div className="self-center my-auto">
                                    <motion.button
                                        type="button"
                                        aria-label="Campuna Video abspielen"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-forest hover:bg-gold hover:text-forest flex items-center justify-center transition-all duration-300 shadow-2xl shadow-black/50 group/btn"
                                    >
                                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                                    </motion.button>
                                </div>

                                <div className="text-left">
                                    <p className="font-display font-bold text-white text-sm sm:text-base leading-snug">
                                        Camping an einem Ort zusammenbringen.
                                    </p>

                                </div>
                            </div>
                        </motion.div>

                        {/* Dedicated Mission & Story Card */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-gold/40 hover:bg-white/[0.14] rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300 space-y-3">
                            <p className="font-sans text-xs sm:text-sm text-sand/90 font-light leading-relaxed">
                                Vom Wohnmobil-Kauf über praktisches Zubehör bis hin zu Ratgebern und Stellplätzen: <span className="text-gold font-medium">Campuna vereint die gesamte Camping-Community</span> auf einer modernen, transparenten Plattform – von Campern für Camper entwickelt.
                            </p>
                            <div className="pt-1 border-t border-white/10">
                                <Link
                                    href="/uber-campuna"
                                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-gold transition-colors group"
                                >
                                    <span>Mehr über uns erfahren</span>
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-gold" />
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Video Modal Player (Portal to document.body with ultimate z-index) */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isPlaying && (
                        <motion.div
                            key="video-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-12"
                        >
                            <div
                                onClick={() => setIsPlaying(false)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-5xl aspect-video rounded-[28px] overflow-hidden shadow-2xl z-10 bg-black border border-white/10"
                            >
                                <button
                                    onClick={() => setIsPlaying(false)}
                                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-forest flex items-center justify-center transition-all border border-white/20 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <iframe
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/7VLlgt1Rgr4?autoplay=1&rel=0&start=4"
                                    title="Das ist Campuna"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </section>
    );
}

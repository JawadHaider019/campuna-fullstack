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
                <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-4">
                    <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] text-gold block">
                        Vertrauen & Vision
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                        Warum Campuna?
                    </h2>
                    <div className="space-y-2.5 font-sans text-[14px] sm:text-[16px] md:text-[18px] text-white/75 leading-relaxed font-light max-w-2xl mx-auto pt-1">
                        <p>
                            Camping findet heute an vielen verschiedenen Orten statt: Angebote hier, Tipps dort, Campingplätze wieder woanders.
                        </p>
                        <p className="text-white/90 font-normal">
                            Unsere Idee ist einfach: <span className="text-gold font-semibold">Wir wollen Camping an einem Ort zusammenbringen.</span>
                        </p>
                        <p>
                            Das Fundament steht. Jetzt wächst Campuna mit jedem Camper, jedem Inserat, jedem Anbieter und jedem Campingplatz weiter.
                        </p>
                        <p className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-beige to-white text-sm sm:text-base tracking-wide pt-1">
                            Campuna wächst mit euch.
                        </p>
                    </div>
                </div>

                {/* Shared Wide Container for Video & Cards with Matching Width */}
                <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
                    {/* Wide Video Showcase */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-black group cursor-pointer"
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
                        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 z-10">
                            <div className="self-center my-auto">
                                <motion.button
                                    type="button"
                                    aria-label="Campuna Video abspielen"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-forest hover:bg-gold hover:text-forest flex items-center justify-center transition-all duration-300 shadow-2xl shadow-black/50 group/btn cursor-pointer"
                                >
                                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
                                </motion.button>
                            </div>

                            <div className="text-center">
                                <p className="font-display font-bold text-white text-sm sm:text-base tracking-wide leading-snug">
                                    Camping an einem Ort zusammenbringen.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3 Trust Pillars in a Single Balanced Row matching video width */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
                        {TRUST_PILLARS.map((pillar, index) => {
                            const Icon = pillar.icon;
                            return (
                                <motion.div
                                    key={pillar.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="bg-white/5 border border-white/10 hover:border-gold/40 p-6 sm:p-7 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 text-gold group-hover:bg-gold group-hover:text-forest transition-all duration-300 shrink-0 shadow-inner">
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-white/35 group-hover:text-gold transition-colors px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                                                {pillar.id}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-gold transition-colors">
                                            {pillar.title}
                                        </h3>
                                        <p className="font-sans text-xs sm:text-sm text-white/75 leading-relaxed font-light">
                                            {pillar.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
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

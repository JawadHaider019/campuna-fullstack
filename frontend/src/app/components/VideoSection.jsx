'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';

export default function VideoSection() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section id="video-section" className="py-10 sm:py-16 bg-forest relative overflow-hidden">
            {/* Cinematic Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/10 rounded-full blur-[160px] pointer-events-none opacity-40 shrink-0" />
            <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-black/40 rounded-full blur-[100px] pointer-events-none shrink-0" />

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">

                {/* Section Header with Manifesto Style */}
                <div className="max-w-4xl mx-auto mb-8 space-y-6">
                    <div className="space-y-2">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block"
                        >
                            Das ist Campuna
                        </motion.span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight max-w-3xl mx-auto">
                            Wir bauen die Campingplattform, die wir selbst vermisst haben.
                        </h2>
                    </div>

                    <div className="font-sans text-sm sm:text-base md:text-lg text-sand/80 max-w-xl mx-auto leading-relaxed font-light space-y-3">
                        <p>
                            Camping findet heute an vielen verschiedenen Orten statt. Angebote hier, Tipps dort, Campingplätze wieder woanders.
                        </p>
                        <p className="pt-1 text-white font-medium">
                            Unsere Idee ist einfach: <span className="text-gold">Wir wollen Camping an einem Ort zusammenbringen.</span>
                        </p>
                        <p className="pt-1">
                            Das Fundament steht. Jetzt wächst Campuna mit jedem Camper, jedem Inserat, jedem Anbieter und jedem Campingplatz weiter.
                        </p>
                        <p className="text-gold font-semibold text-lg sm:text-xl pt-2">
                            Campuna wächst mit euch.
                        </p>
                    </div>
                </div>

                {/* Cinematic Video Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative max-w-4xl mx-auto aspect-video rounded-[40px] overflow-hidden shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] border border-white/5 bg-black group"
                >
                    {/* YouTube Thumbnail Background */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://img.youtube.com/vi/7VLlgt1Rgr4/maxresdefault.jpg"
                            alt="Campuna Video Vorschau"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-[6s] ease-out"
                        />
                    </div>

                    {/* Cinematic Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-black/30 z-10 pointer-events-none" />

                    {/* Center Play Button */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <motion.button
                            type="button"
                            aria-label="Campuna Video abspielen"
                            onClick={() => setIsPlaying(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-forest hover:bg-gold hover:text-forest flex items-center justify-center transition-all duration-500 shadow-2xl relative group/btn"
                        >
                            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover/btn:bg-gold/20 transition-all duration-500" />
                            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current translate-x-1" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Cinematic Modal Player */}
            <AnimatePresence>
                {isPlaying && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPlaying(false)}
                            className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-7xl aspect-video rounded-[32px] overflow-hidden shadow-[0_64px_120px_-15px_rgba(0,0,0,0.8)] z-10 bg-black border border-white/5"
                        >
                            <button
                                onClick={() => setIsPlaying(false)}
                                className="absolute top-8 right-8 z-20 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-white hover:text-forest flex items-center justify-center transition-all border border-white/10 hover:border-white group"
                            >
                                <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
                            </button>

                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/7VLlgt1Rgr4?autoplay=1&rel=0&start=4"
                                title="Das ist Campuna"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </section>
    );
}

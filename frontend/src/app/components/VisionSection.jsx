'use client';

import React from 'react';
import { motion } from 'framer-motion';

const VisionSection = React.memo(function VisionSection() {
    return (
        <section className="relative z-30 mx-4 md:mx-8 lg:mx-12 -mt-16 sm:-mt-32 text-center pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-auto relative bg-white border border-forest/10 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 md:p-12 shadow-[0_20px_50px_-15px_rgba(20,61,41,0.08)] text-charcoal overflow-hidden group max-w-7xl mx-auto"
            >
                {/* Subtle Background Glow Accent */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-forest/5 rounded-full blur-3xl pointer-events-none" />

                {/* Main Headline */}
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-forest mb-4 leading-[1.2] max-w-4xl mx-auto">
                    Das Fundament steht.{' '}
                    <span className="text-gold font-medium block sm:inline">
                        Jetzt bringen wir Campuna gemeinsam zum Leben.
                    </span>
                </h2>

                {/* Subtitle / Description */}
                <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/70 max-w-3xl mx-auto leading-relaxed font-light">
                    Wir bauen die Campingplattform, die wir selbst vermisst haben – gemeinsam mit Campern, privaten Anbietern, Händlern, Campingplätzen und Dienstleistern.
                </p>
            </motion.div>
        </section>
    );
});

export default VisionSection;

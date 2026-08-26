'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CTA({ onSellClick }) {
    const router = useRouter();

    const handleClick = () => {
        if (onSellClick) {
            onSellClick();
        } else {
            router.push('/create_listing');
        }
    };

    return (
        <section id="seller-cta" className="pb-5 sm:pb-8 bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-forest via-forest to-[#143d29] px-8 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-16 shadow-lg border border-white/5"
                >
                    {/* Subtle background glows */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-black/40 rounded-full blur-3xl pointer-events-none" />

                    {/* Grid Layout splits visual content */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

                        {/* Left Column: Headline and text */}
                        <div className="lg:col-span-8 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
                            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                Anbieter werden
                            </span>

                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                                Werde Teil von Campuna.
                            </h2>

                            <p className="font-sans text-sm sm:text-base text-sand/85 font-light leading-relaxed max-w-xl pb-2">
                                Du verkaufst, vermietest oder bietest etwas rund ums Camping an? Sei von Anfang an dabei und erreiche Camper auf einer Plattform, die sich ausschließlich um Camping dreht.
                            </p>

                            <button
                                onClick={handleClick}
                                className="relative w-full max-w-[320px] sm:w-[320px] bg-gradient-to-r from-gold to-beige hover:brightness-110 text-forest font-sans font-bold py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] uppercase tracking-wider shadow-lg hover:scale-[1.02] mx-auto lg:mx-0 cursor-pointer"
                            >
                                <span>INSERAT ERSTELLEN – KOSTENLOS</span>
                                <ArrowRight className="w-4 h-4 absolute right-5 shrink-0" />
                            </button>
                        </div>

                        {/* Right Column: Decorative Icon Graphics */}
                        <div className="relative lg:col-span-4 hidden lg:block items-center justify-center lg:justify-end">
                            <div className="absolute top-0 -right-30 flex items-center justify-center text-gold/80 transform -rotate-12 group-hover:scale-110 transition-all duration-700">
                                <Mail className="w-40 h-40 sm:w-80 sm:h-80 stroke-[1.5]" />
                            </div>
                            <div className="absolute bottom-30 -right-25 flex items-center justify-center text-gold/80 transform -rotate-12 group-hover:scale-110 transition-all duration-700">
                                <Mail className="w-40 h-40 sm:w-80 sm:h-80 stroke-[1.5]" />
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}

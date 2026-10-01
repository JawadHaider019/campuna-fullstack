'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Truck,
    MapPin,
    Compass,
    Wrench,
    Hammer,
    ShoppingBag,
    Building,
    Home,
    Anchor,
    Building2,
    ArrowRight,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { PROVIDER_CATEGORIES } from '@/data';

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

export default function ProviderDiscoverySection() {
    const router = useRouter();

    return (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-sand/20 to-white relative overflow-hidden border-t border-forest/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.35em] text-gold block">
                                CAMPUNA PARTNER & FACHBETRIEBE
                            </span>
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-charcoal leading-tight">
                            Anbieter rund ums <span className="text-forest">Camping entdecken</span>
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/70 font-light leading-relaxed">
                            Campuna verbindet Camper mit spezialisierten Händlern, Werkstätten, Vermietern, Ausbauern und Campingplätzen in ganz Deutschland.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/registrieren?type=commercial"
                            className="text-xs font-bold uppercase tracking-wider text-charcoal/60 hover:text-forest transition-colors hidden sm:block"
                        >
                            Anbieter werden
                        </Link>
                        <span className="text-charcoal/30 hidden sm:block">•</span>
                        <Link
                            href="/anbieter"
                            className="group inline-flex items-center gap-2 bg-forest hover:bg-[#093519] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <span>Alle Anbieter ansehen</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Category Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                    {PROVIDER_CATEGORIES.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.iconName);
                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-20px" }}
                                transition={{ duration: 0.35, delay: idx * 0.04 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                onClick={() => router.push(`/anbieter?category=${cat.slug}`)}
                                className="group relative bg-white border border-forest/10 hover:border-forest/30 rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-sand/60 group-hover:bg-forest text-forest group-hover:text-gold flex items-center justify-center transition-colors duration-300 shadow-2xs">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-charcoal/30 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300" />
                                    </div>

                                    <div>
                                        <h3 className="font-display text-sm sm:text-base font-bold text-charcoal group-hover:text-forest transition-colors line-clamp-1">
                                            {cat.name}
                                        </h3>
                                        <p className="font-sans text-[11px] text-charcoal/60 leading-snug line-clamp-2 mt-1 font-light">
                                            {cat.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-forest/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-forest/80 group-hover:text-forest">
                                    <span>Fachbetriebe finden</span>
                                    <span className="text-gold group-hover:translate-x-0.5 transition-transform">→</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Mobile Bottom CTA */}
                <div className="mt-6 flex sm:hidden items-center justify-center gap-3">
                    <Link
                        href="/anbieter"
                        className="w-full text-center bg-forest text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md"
                    >
                        Alle Anbieter ansehen
                    </Link>
                </div>

            </div>
        </section>
    );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { CATEGORIES } from '@/data';

export default function Hero({ searchRef, isLoggedIn: propIsLoggedIn }) {
    const [mounted, setMounted] = useState(false);
    const storeIsLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const isLoggedIn = mounted ? (propIsLoggedIn ?? storeIsLoggedIn) : false;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const router = useRouter();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = React.useCallback((e) => {
        if (e) e.preventDefault();

        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('kw', searchQuery.trim());
        if (selectedCategory.trim()) params.set('cat', selectedCategory.trim());

        const queryString = params.toString();
        router.push(queryString ? `/inserate?${queryString}` : '/inserate');
    }, [searchQuery, selectedCategory, router]);

    return (
        <section
            id="hero"
            className="relative min-h-[80vh] md:min-h-[82vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[38px] md:rounded-[40px] lg:rounded-[48px] mt-24 sm:mt-28 mb-0 mx-4 md:mx-8 lg:mx-12 shadow-2xl"
        >
            {/* Background Cinematic Image with Zoom Animation */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1.0, opacity: 1 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    className="w-full h-full"
                >
                    <picture className="w-full h-full">
                        <source media="(max-width: 768px)" srcSet="/hero.webp" />
                        <img
                            src="/hero.webp"
                            alt="Campingplatz an einem See in Deutschland mit Wohnmobilen und Zelten"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </picture>
                </motion.div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-forest/40 to-black/50" />
            </div>

            {/* Floating Sparkles Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.12),transparent_50%)] pointer-events-none" />

            {/* Hero Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 flex flex-col justify-between w-full h-full min-h-[72vh] md:min-h-[78vh]">
                {/* Top spacing helper */}
                <div className="hidden lg:block h-4" />

                {/* Central Content Column */}
                <div className="text-center max-w-6xl w-full mx-auto my-auto pt-6 pb-4">
                    {/* Luxury Hero Headline: Clear desktop hierarchy (48-54px) & mobile responsive */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="font-display font-bold tracking-tight text-white mb-4 w-full mx-auto"
                    >
                        <span className="block text-base sm:text-lg md:text-xl lg:text-[24px] xl:text-[28px] font-medium text-sand/90 tracking-wide mb-1 sm:mb-1.5 lg:whitespace-nowrap">
                            Dein Camping-Marktplatz:
                        </span>

                        {/* Mobile & Tablet: Clean 2 lines */}
                        <span className="block lg:hidden text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-gold via-beige to-white mt-1">
                            <span className="block">Wir bringen Camping</span>
                            <span className="block">an einem Ort zusammen.</span>
                        </span>

                        {/* Laptop & Desktop: High-impact main message 48-54px */}
                        <span className="hidden lg:block text-[44px] xl:text-[50px] 2xl:text-[54px] font-bold leading-[1.12] text-transparent bg-clip-text bg-gradient-to-r from-gold via-beige to-white mt-1 lg:whitespace-nowrap drop-shadow-sm">
                            Wir bringen Camping an einem Ort zusammen.
                        </span>
                    </motion.h1>

                    {/* Editorial Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="font-sans text-xs sm:text-sm md:text-base text-sand/90 leading-relaxed max-w-2xl mx-auto mb-6 font-light"
                    >
                        Angebote, Anbieter, Wissen und praktische Helfer rund ums Camping. Auf Campuna kaufst und verkaufst du Wohnmobile, Wohnwagen, Zelte, Zubehör, Stellplätze und mehr, privat oder gewerblich, in ganz Deutschland.
                    </motion.p>

                    {/* Action Buttons: Camping entdecken + Anbieter finden */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6"
                    >
                        <motion.button
                            onClick={() => router.push('/inserate')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="bg-gradient-to-r from-gold to-beige text-forest hover:brightness-110 font-sans font-bold py-3 px-6 sm:px-7 rounded-full shadow-lg transform transition-all duration-300 text-xs tracking-wider cursor-pointer"
                        >
                            Camping entdecken
                        </motion.button>
                        <motion.button
                            onClick={() => router.push('/anbieter')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 hover:border-gold font-sans font-bold py-3 px-5 sm:px-6 rounded-full shadow-lg transform transition-all duration-300 text-xs tracking-wider cursor-pointer flex items-center gap-2"
                        >
                            <Building2 className="w-3.5 h-3.5 text-gold" />
                            <span>Anbieter finden</span>
                        </motion.button>
                    </motion.div>

                    {/* Advanced Multi-Field Search Bar (Keyword + Category + Search button) */}
                    <motion.div
                        ref={searchRef}
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="w-full max-w-3xl mx-auto mb-4"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="bg-black/35 backdrop-blur-2xl border border-white/20 p-2 sm:p-2.5 rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 transition-all duration-300 hover:border-gold/40 hover:bg-black/45"
                        >
                            {/* 1. Keyword Input */}
                            <div className="flex items-center space-x-2.5 px-3.5 py-2 flex-1 border-b md:border-b-0 md:border-r border-white/10">
                                <Search className="w-4 h-4 text-gold shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Was suchst du? z. B. Wohnmobil, Dachzelt, Stellplatz..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-white placeholder-sand/70 focus:outline-none w-full font-sans text-xs sm:text-sm font-medium"
                                />
                            </div>

                            {/* 2. Category Selector */}
                            <div className="flex items-center space-x-2 px-3.5 py-2 flex-1 md:max-w-[260px]">
                                <Layers className="w-4 h-4 text-gold/80 shrink-0" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent text-white focus:outline-none w-full font-sans text-xs sm:text-sm font-medium cursor-pointer [&>option]:bg-forest [&>option]:text-white"
                                >
                                    <option value="">Alle Kategorien</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Search Submit Button */}
                            <button
                                type="submit"
                                aria-label="Suche starten"
                                className="bg-gradient-to-r from-gold to-beige text-forest hover:brightness-110 font-sans font-bold py-3.5 px-5 md:p-3.5 rounded-2xl md:rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-xs sm:text-sm uppercase tracking-wider mt-1 md:mt-0"
                            >
                                <Search className="w-4 h-4 shrink-0" />
                                <span className="md:hidden font-bold">Angebote finden</span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}



'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers } from 'lucide-react';
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

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('kw', searchQuery.trim());
        if (selectedCategory.trim()) params.set('cat', selectedCategory.trim());

        const queryString = params.toString();
        router.push(queryString ? `/inserate?${queryString}` : '/inserate');
    };

    return (
        <section
            id="hero"
            className="relative min-h-[85vh] md:min-h-[88vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-37 sm:mt-37 mb-12 mx-4 md:mx-8 lg:mx-12 shadow-2xl border border-forest/10"
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
                            alt="Cinematic luxury camping under starry night"
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
                <div className="text-center max-w-4xl mx-auto my-auto pt-6 pb-4">
                    {/* Luxury Large Headline */}
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 leading-[1.1]">
                        Wir bringen Camping{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-beige to-white">
                            an einem Ort zusammen.
                        </span>
                    </h1>

                    {/* Editorial Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="font-sans text-sm sm:text-md md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto mb-8 font-light"
                    >
                        Angebote, Anbieter, Campingplätze, Wissen und praktische Helfer rund ums Camping – auf einer spezialisierten Plattform, die gemeinsam mit der Community wächst.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-8"
                    >
                        <motion.button
                            onClick={() => {
                                const element = document.getElementById('tool');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full sm:w-auto bg-gradient-to-r from-gold to-beige text-forest hover:brightness-110 font-sans font-bold py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 text-[12px] tracking-wider cursor-pointer"
                        >
                            Camping Helfer
                        </motion.button>
                        <motion.button
                            onClick={() => router.push(isLoggedIn ? '/mein-konto?n=yes' : '/register')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 font-sans font-semibold py-3 px-6 rounded-full transition-all duration-300 text-[12px] tracking-wider cursor-pointer"
                        >
                            {isLoggedIn ? 'Inserat erstellen' : 'Kostenlos inserieren'}
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
                                    placeholder="Was suchst du? (z.B. Morelo, Dachzelt...)"
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
                                className="bg-gradient-to-r from-gold to-beige text-forest hover:brightness-110 font-sans font-bold py-3 px-7 rounded-2xl md:rounded-full shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 shrink-0 cursor-pointer active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
                            >
                                <Search className="w-4 h-4" />
                                <span>Suchen</span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}



'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    Compass,
    Calculator,
    ArrowRight,
    Wrench,
    Fuel,
    Scale,
    X,

} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PayloadCalculator from './PayloadCalculator';
import BudgetCalculator from './BudgetCalculator';
import { BLOG_POSTS } from '@/data';
import { getAllListings } from '@/api/listings';
import { getImageUrl } from '@/utils/imageUrl';

const DEFAULT_INSP_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';

export default function ToolsSection() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('featured');
    const [selectedTip, setSelectedTip] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeTool, setActiveTool] = useState('payload');
    const [dbFeatured, setDbFeatured] = useState([]);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 640px)');
        setIsMobile(media.matches);
        const listener = (e) => setIsMobile(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    useEffect(() => {
        getAllListings().then(res => {
            if (res.success && Array.isArray(res.data?.listings) && res.data.listings.length > 0) {
                const approvedListings = res.data.listings.filter(l => l.status === 'APPROVED');
                
                // Priority: High quality (has images, description >= 30 chars, valid price)
                const qualityListings = approvedListings.filter(l => 
                    (l.images && l.images.length > 0) &&
                    (l.description && l.description.trim().length >= 30) &&
                    (parseFloat(l.price) > 0)
                );
                
                // Prefer boosted first, then quality candidate, then fallback
                const chosen = qualityListings.find(l => l.is_boosted) || qualityListings[0] || approvedListings[0] || res.data.listings[0];
                
                if (chosen) {
                    setDbFeatured([{
                        id: chosen.id,
                        title: chosen.title || 'Camping Angebot',
                        description: chosen.description || '',
                        category: chosen.category || 'Camping Zubehör',
                        price: parseFloat(chosen.price) || 0,
                        pricePeriod: chosen.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                        images: chosen.images && chosen.images.length > 0 ? chosen.images : [DEFAULT_INSP_IMAGE],
                        features: [chosen.condition, chosen.subcategory, chosen.location].filter(Boolean)
                    }]);
                }
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const handleOpenToolsTab = (e) => {
            if (e?.detail?.tab) {
                setActiveTab(e.detail.tab);
            } else {
                setActiveTab('tools');
            }
            if (e?.detail?.tool) {
                setActiveTool(e.detail.tool);
            }
        };

        window.addEventListener('open-campuna-tools-tab', handleOpenToolsTab);

        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash === '#camping-helfer' || hash === '#tools' || hash === '#helfer') {
                setActiveTab('tools');
            }
        }

        return () => {
            window.removeEventListener('open-campuna-tools-tab', handleOpenToolsTab);
        };
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const featured = dbFeatured;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tips':
                return (
                    <motion.div
                        key="tips"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {BLOG_POSTS.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => setSelectedTip(post)}
                                className="bg-white rounded-3xl p-5 border border-forest/5 shadow-md hover:shadow-xl hover:border-forest/10 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:scale-[1.01]"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                            {post.category}
                                        </span>
                                        <span className="text-[11px] text-charcoal/40 font-mono">{post.date}</span>
                                    </div>
                                    <h3 className="font-display text-base font-bold text-forest transition-colors duration-200 mb-2 leading-snug line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="font-sans text-[13px] text-charcoal/70 leading-relaxed font-light line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-forest/5 flex items-center justify-between">
                                    <span className="text-[11px] text-charcoal/40">{post.readTime} Lesezeit</span>
                                    <span className="text-xs font-bold text-gold flex items-center gap-1">
                                        Lesen <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );

            case 'featured':
                return (
                    <motion.div
                        key="featured"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                    >
                        <p className="px-4 font-sans text-xs sm:text-sm text-charcoal/70 font-light">
                            Ein Inserat, das uns aufgefallen ist und das wir euch hier besonders zeigen möchten.
                        </p>
                        <div className="grid grid-cols-1 px-4 gap-6">
                            {featured.map((insp) => (
                                <motion.div
                                    key={insp.id}
                                    onClick={() => router.push(`/inserate/${insp.id}`)}
                                    className="group bg-white rounded-3xl overflow-hidden border border-forest/5 flex flex-col sm:flex-row cursor-pointer min-h-[280px] w-full relative shadow-sm hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="relative w-full sm:w-[40%] h-48 sm:h-auto overflow-hidden bg-sand/10">
                                        <img
                                            src={getImageUrl(insp.images?.[0], DEFAULT_INSP_IMAGE)}
                                            alt={insp.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.currentTarget.src = DEFAULT_INSP_IMAGE; }}
                                        />
                                        <span className="absolute top-3 left-3 rounded-full bg-forest/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                                            Ausgewählt
                                        </span>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold block mb-1">
                                                {insp.category}
                                            </span>
                                            <h3 className="font-display sm:text-xl text-lg font-bold text-forest leading-snug mb-2 group-hover:text-gold transition-colors duration-200">
                                                {insp.title}
                                            </h3>
                                            <p className="font-sans sm:text-sm text-xs text-charcoal/70 leading-relaxed font-light mb-4 line-clamp-2">
                                                {insp.description || 'Ein exklusives Camping-Highlight aus unserer Community.'}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mb-2.5">
                                                {insp.features?.map((feat, idx) => (
                                                    <span key={idx} className="bg-sand text-forest font-mono text-[10px] font-bold py-0.5 px-2 rounded">
                                                        #{feat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-forest/5 flex items-center justify-between mt-auto">
                                            <div>
                                                <span className="block text-[9px] uppercase tracking-widest text-charcoal/40 font-mono">
                                                    {insp.pricePeriod}
                                                </span>
                                                <span className="font-display text-base font-extrabold text-forest">
                                                    {insp.price ? `${insp.price.toLocaleString('de-DE')} €` : 'Auf Anfrage'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/inserate/${insp.id}`);
                                                }}
                                                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors duration-200 cursor-pointer"
                                            >
                                                <span>Zum Inserat</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gold" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'community':
                return (
                    <motion.div
                        key="community"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="min-h-[250px] flex flex-col items-center justify-center text-center p-8 bg-sand/20 rounded-3xl border border-forest/10 mt-6 md:p-12">
                            <div className="bg-forest/10 p-4 rounded-full text-forest mb-4 animate-pulse">
                                <Wrench className="w-8 h-8" />
                            </div>
                            <h3 className="font-display text-lg font-bold text-forest mb-2">
                                Tool in Entwicklung
                            </h3>
                            <p className="font-sans text-xs sm:text-sm text-charcoal/60 max-w-sm leading-relaxed font-light">
                                Unser Community-Fragen Bereich befindet sich aktuell in der Entwicklung und steht Ihnen in Kürze zur Verfügung.
                            </p>
                        </div>
                    </motion.div>
                );

            case 'tools':
                return (
                    <motion.div
                        key="tools"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-3xl border border-forest/5 shadow-md p-4 sm:p-6"
                    >
                        {/* Tool Selection Tabs */}
                        <div className="flex border-b border-forest/10 pb-4 mb-4 gap-3 sm:gap-4">
                            <button
                                onClick={() => setActiveTool('payload')}
                                className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTool === 'payload'
                                    ? 'bg-forest text-white shadow-md'
                                    : 'text-charcoal/60 hover:bg-sand hover:text-forest'
                                    }`}
                            >
                                <Scale className="w-4 h-4 shrink-0" />
                                <span className="block sm:hidden">Zuladung </span>
                                <span className="hidden sm:block">Zuladungsrechner (z.G.G.)</span>
                            </button>
                            <button
                                onClick={() => setActiveTool('costs')}
                                className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTool === 'costs'
                                    ? 'bg-forest text-white shadow-md'
                                    : 'text-charcoal/60 hover:bg-sand hover:text-forest'
                                    }`}
                            >
                                <Fuel className="w-4 h-4 shrink-0" />
                                <span className="block sm:hidden">Camping-Budget</span>
                                <span className="hidden sm:block">Camping-Reisebudget-Rechner</span>
                            </button>
                        </div>

                        {activeTool === 'payload' ? (
                            <div className="mt-4">
                                <PayloadCalculator compact={true} />
                                <div className="mt-6 pt-4 border-t border-forest/10 flex justify-center">
                                    <Link
                                        href="/zuladungsrechner"
                                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors"
                                    >
                                        <span>Zur Vollversion</span>
                                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gold" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <BudgetCalculator compact={true} />
                                <div className="mt-6 pt-4 border-t border-forest/10 flex justify-center">
                                    <Link
                                        href="/reisekostenrechner"
                                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors"
                                    >
                                        <span>Zur Vollversion</span>
                                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gold" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <section id="tool" className="py-10 sm:py-16 bg-sand/15 border-t border-b border-forest/5 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div className="space-y-3">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Entdecke Campuna
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                            Camping-Wissen & Nützliche Tools
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/70 max-w-xl font-light">
                            Praktische Helfer, Empfehlungen und Wissen für deinen Campingalltag – weil Campuna mehr sein soll als nur Kaufen und Verkaufen.
                        </p>
                    </div>
                </div>

                {/* Categories Tab Navigation */}
                <div className="flex flex-nowrap border-b border-forest/10 mb-8 gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => handleTabChange('featured')}
                        className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-2.5 sm:px-5 text-[11px] sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300 shrink-0 ${activeTab === 'featured' ? 'text-forest' : 'text-charcoal/50 hover:text-forest'
                            }`}
                    >
                        <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="block sm:hidden">Fundstück</span>
                        <span className="hidden sm:block">Unser Campuna-Fundstück</span>
                        {activeTab === 'featured' && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('tips')}
                        className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-2.5 sm:px-5 text-[11px] sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300 shrink-0 ${activeTab === 'tips' ? 'text-forest' : 'text-charcoal/50 hover:text-forest'
                            }`}
                    >
                        <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="block sm:hidden">Tipps</span>
                        <span className="hidden sm:block">Camping-Tipps</span>
                        {activeTab === 'tips' && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('tools')}
                        className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-2.5 sm:px-5 text-[11px] sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300 shrink-0 ${activeTab === 'tools' ? 'text-forest' : 'text-charcoal/50 hover:text-forest'
                            }`}
                    >
                        <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="block sm:hidden">Helfer</span>
                        <span className="hidden sm:block">Camping-Helfer</span>
                        {activeTab === 'tools' && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                </div>

                {/* Tab Content Window */}
                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {renderTabContent()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Premium Tip Popup Modal */}
            <AnimatePresence>
                {selectedTip && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedTip(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-forest/10 flex flex-col gap-5 overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedTip(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-sand/50 text-forest hover:bg-forest hover:text-gold transition-all duration-300 animate-none cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                    {selectedTip.category}
                                </span>
                                <span className="text-xs text-charcoal/40 font-mono">{selectedTip.date}</span>
                            </div>

                            <h3 className="font-display text-xl sm:text-2xl font-bold text-forest leading-snug pr-8 mt-1">
                                {selectedTip.title}
                            </h3>

                            <div className="border-t border-forest/5 pt-4">
                                <p className="font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light whitespace-pre-line">
                                    {selectedTip.excerpt}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight, ChevronDown, Scale, Fuel, HelpCircle, BookOpen, Layers } from 'lucide-react';
import PayloadCalculator from './PayloadCalculator';
import BudgetCalculator from './BudgetCalculator';
import { TOOLS_DATA, TOOLS_LIST } from '@/data/toolsData';

export default function CampingHelfer({ currentToolKey = 'zuladungsrechner' }) {
    const router = useRouter();
    const tool = TOOLS_DATA[currentToolKey] || TOOLS_DATA.zuladungsrechner;
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal">
            {/* Top Header & Hero Area */}
            <div className="pt-20 sm:pt-24 px-3 sm:px-6 md:px-12 max-w-8xl mx-auto">


                <section
                    className="relative rounded-3xl sm:rounded-4xl p-6 sm:p-10 md:p-12 overflow-hidden border border-forest/10"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(16, 42, 28, 0.88) 0%, rgba(20, 50, 34, 0.78) 60%, rgba(10, 28, 18, 0.95) 100%), url('/hero-campuna.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >

                    {/* Header Title & Subtitle */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 text-left">
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-gold bg-gold/15 backdrop-blur-md border border-gold/30 px-3 py-1 rounded-full mb-2">
                                Kostenloses Camping-Tool
                            </span>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-md">
                                {tool.title}
                            </h1>
                            <p className="font-sans text-xs sm:text-sm text-white/90 font-light mt-2 max-w-2xl leading-relaxed drop-shadow-sm">
                                {tool.heroSubtitle}
                            </p>
                        </div>

                        {/* Right side Container: Icon display */}
                        <div className="flex flex-wrap items-center gap-4 shrink-0 self-start lg:self-auto">
                            <div className="hidden sm:flex p-3.5 sm:p-4 bg-white/10 backdrop-blur-md border border-white/20 text-gold rounded-2xl shrink-0 shadow-lg items-center justify-center">
                                {tool.calculatorType === 'payload' ? (
                                    <Scale className="w-16 h-16 sm:w-20 sm:h-20 text-gold" />
                                ) : (
                                    <Fuel className="w-16 h-16 sm:w-20 sm:h-20 text-gold" />
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Main Calculator Workspace */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10">
                {tool.calculatorType === 'payload' ? (
                    <PayloadCalculator />
                ) : (
                    <BudgetCalculator />
                )}
            </div>

            {/* Integrated Guides & FAQ Section */}
            <div className="bg-sand/15 border-t border-b border-forest/5 py-12 sm:py-16 text-left">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
                    {/* Section Header */}
                    <div className="mb-10 text-center max-w-3xl mx-auto">
                        <span className="font-sans text-[10px] mb-3 font-bold uppercase tracking-[0.4em] text-gold block">
                            Ratgeber & Expertenwissen</span>

                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-forest">
                            Alles was du zu {tool.shortTitle} wissen musst
                        </h2>
                    </div>

                    {/* Guides Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                        {tool.guides.map((guide, idx) => (
                            <div
                                key={idx}
                                className="group bg-white rounded-2xl p-6 sm:p-8 border border-forest/10 hover:border-gold shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <h3 className="font-display text-lg sm:text-xl font-bold text-forest group-hover:text-gold transition-colors duration-300 mb-3 flex items-center gap-2">
                                    {guide.title}
                                </h3>
                                {guide.text && (
                                    <p className="text-sm text-charcoal/70 leading-relaxed font-light mb-3">
                                        {guide.text}
                                    </p>
                                )}
                                {guide.bulletPoints && (
                                    <ul className="space-y-2.5 mt-3">
                                        {guide.bulletPoints.map((pt, pIdx) => (
                                            <li key={pIdx} className="text-sm text-charcoal/75 leading-relaxed">
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* FAQ Accordion Section */}
                    {tool.faqs && tool.faqs.length > 0 && (
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    Häufig gestellte Fragen
                                </span>
                                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-forest">
                                    FAQ zum {tool.shortTitle}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {tool.faqs.map((faq, idx) => {
                                    const isOpen = openFaqIndex === idx;
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`group border rounded-[24px] transition-all duration-500 overflow-hidden ${isOpen
                                                ? 'border-forest/20 bg-sand/10 shadow-xl shadow-forest/5'
                                                : 'border-forest/5 bg-white hover:border-forest/15 hover:shadow-lg'
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                                            >
                                                <div className="flex items-center space-x-5">
                                                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-forest text-white' : 'bg-sand text-forest group-hover:bg-forest/5 text-forest/40 group-hover:text-forest'
                                                        }`}>
                                                        <HelpCircle className="w-5 h-5" />
                                                    </div>
                                                    <span className={`font-display text-md md:text-lg font-bold tracking-tight transition-colors duration-300 ${isOpen ? 'text-forest' : 'text-forest/70 group-hover:text-forest'
                                                        }`}>
                                                        {faq.question}
                                                    </span>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-gold text-forest' : 'bg-sand/50 text-forest/30'
                                                        }`}
                                                >
                                                    <ChevronDown className="w-5 h-5" />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    >
                                                        <div className="px-8 md:px-10 pb-6 pt-1 font-sans text-base text-charcoal/70 leading-relaxed font-light whitespace-pre-line border-t border-forest/5">
                                                            {faq.answer}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scalable Cross-Internal Links Footer */}
            <div className="bg-sand/30 py-10 border-t border-forest/10 text-charcoal text-left">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="font-display font-bold text-forest text-base mb-1">
                                Entdecke weitere Camping-Helfer Tools & Marktplatz-Kategorien
                            </h3>
                            <p className="text-xs text-charcoal/60">
                                Wir erweitern unsere Tools stetig für deinen perfekten Campingurlaub.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {TOOLS_LIST.filter(t => t.id !== tool.id).map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => router.push(`/${t.slug}`)}
                                    className="px-4 py-2 bg-white rounded-full border border-forest/10 text-xs font-bold text-forest hover:bg-forest hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
                                >
                                    {t.shortTitle}
                                </button>
                            ))}
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-forest text-white rounded-full text-xs font-bold hover:bg-gold hover:text-forest transition-all duration-300 shadow-sm cursor-pointer"
                            >
                                Alle Inserate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

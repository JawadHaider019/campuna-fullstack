'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import PayloadCalculator from './PayloadCalculator';
import BudgetCalculator from './BudgetCalculator';
import Breadcrumbs from './Breadcrumbs';
import ScrollSectionWrapper from './ScrollSectionWrapper';
import { TOOLS_DATA, TOOLS_LIST } from '@/data/toolsData';

export default function CampingHelfer({ currentToolKey = 'zuladungsrechner' }) {
    const router = useRouter();
    const tool = useMemo(() => TOOLS_DATA[currentToolKey] || TOOLS_DATA.zuladungsrechner, [currentToolKey]);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    const toggleFaq = useCallback((index) => {
        setOpenFaqIndex(prev => (prev === index ? null : index));
    }, []);

    const otherTools = useMemo(() => TOOLS_LIST.filter(t => t.id !== tool.id), [tool.id]);

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-x-hidden">
            {/* ── 1. HERO SECTION ── */}
            <motion.section
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[34vh] sm:min-h-[40vh] md:min-h-[46vh] flex items-center justify-center overflow-hidden rounded-[20px] sm:rounded-[32px] md:rounded-[44px] mt-16 sm:mt-20 mx-3 sm:mx-6 md:mx-10 lg:mx-12 shadow-xl border border-forest/10 will-change-transform"
            >
                {/* Background Cinematic Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                    >
                        <img
                            src="/hero-campuna.webp"
                            alt={`${tool.title} – Campuna Camping Helfer`}
                            className="w-full h-full object-cover select-none"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </motion.div>
                    {/* Multi-layered gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/85 pointer-events-none" />
                </div>

                {/* Floating Glow Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.18),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="inline-flex items-center gap-1.5 sm:gap-2 py-1 px-3.5 sm:py-1.5 sm:px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-2 sm:mb-3"
                    >
                        <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gold" />
                        Kostenloses Camping-Tool
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 drop-shadow-xl leading-tight"
                    >
                        {tool.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="font-sans text-xs sm:text-sm md:text-base lg:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md px-2"
                    >
                        {tool.heroSubtitle}
                    </motion.p>
                </div>
            </motion.section>

            {/* ── Breadcrumbs below Hero ── */}
            <ScrollSectionWrapper delay={0.04}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-2">
                    <Breadcrumbs
                        items={[
                            { label: 'Camping-Tools', href: '/#tool' },
                            { label: tool.shortTitle || tool.title }
                        ]}
                        variant="light"
                    />
                </div>
            </ScrollSectionWrapper>

            {/* ── Main Calculator Workspace ── */}
            <ScrollSectionWrapper delay={0.06}>
                <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
                    {tool.calculatorType === 'payload' ? (
                        <PayloadCalculator />
                    ) : (
                        <BudgetCalculator />
                    )}
                </div>
            </ScrollSectionWrapper>

            {/* ── Integrated Guides & FAQ Section ── */}
            {tool.guides && tool.guides.length > 0 && (
                <ScrollSectionWrapper delay={0.06}>
                    <div className="border-t border-b border-forest/5 py-10 sm:py-16 text-left">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Section Header */}
                            <div className="mb-8 sm:mb-12 text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    RATGEBER & EXPERTENWISSEN
                                </span>
                                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                    Alles was du zu {tool.shortTitle} wissen musst
                                </h2>
                            </div>

                            {/* Guides Grid - Responsive Alternation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
                                {tool.guides.map((guide, idx) => {
                                    const isGreenMobile = idx % 2 === 1;
                                    const isGreenDesktop = idx === 1 || idx === 2;

                                    const cardBg = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'bg-gradient-to-br from-forest via-forest to-[#143d29] text-white border-forest/20 hover:border-gold/60'
                                            : 'bg-gradient-to-br from-forest via-forest to-[#143d29] text-white border-forest/20 hover:border-gold/60 md:bg-none md:bg-white md:text-charcoal md:border-forest/10 md:hover:border-gold/50'
                                        : isGreenDesktop
                                            ? 'bg-white text-charcoal border-forest/10 hover:border-gold/50 md:bg-gradient-to-br md:from-forest md:via-forest md:to-[#143d29] md:text-white md:border-forest/20 md:hover:border-gold/60'
                                            : 'bg-white text-charcoal border-forest/10 hover:border-gold/50';

                                    const headingColor = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'text-white group-hover:text-gold'
                                            : 'text-white group-hover:text-gold md:text-forest md:group-hover:text-gold'
                                        : isGreenDesktop
                                            ? 'text-forest group-hover:text-gold md:text-white md:group-hover:text-gold'
                                            : 'text-forest group-hover:text-gold';

                                    const textColor = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'text-sand/90'
                                            : 'text-sand/90 md:text-charcoal/70'
                                        : isGreenDesktop
                                            ? 'text-charcoal/70 md:text-sand/90'
                                            : 'text-charcoal/70';

                                    const borderTopColor = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'border-white/10'
                                            : 'border-white/10 md:border-forest/5'
                                        : isGreenDesktop
                                            ? 'border-forest/5 md:border-white/10'
                                            : 'border-forest/5';

                                    const bulletTextColor = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'text-white/90'
                                            : 'text-white/90 md:text-charcoal/75'
                                        : isGreenDesktop
                                            ? 'text-charcoal/75 md:text-white/90'
                                            : 'text-charcoal/75';

                                    const checkColor = isGreenMobile
                                        ? isGreenDesktop
                                            ? 'text-gold'
                                            : 'text-gold md:text-forest'
                                        : isGreenDesktop
                                            ? 'text-forest md:text-gold'
                                            : 'text-forest';

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.4, delay: idx * 0.06 }}
                                            className={`group rounded-2xl sm:rounded-3xl p-5 sm:p-8 border shadow-xs hover:shadow-lg transition-all duration-300 will-change-transform flex flex-col justify-between ${cardBg}`}
                                        >
                                            <div>
                                                <h3 className={`font-display text-base sm:text-xl font-bold mb-2 sm:mb-3 flex items-center gap-2 transition-colors duration-300 ${headingColor}`}>
                                                    {guide.title}
                                                </h3>
                                                {guide.text && (
                                                    <p className={`text-xs sm:text-sm leading-relaxed font-light mb-3 sm:mb-4 ${textColor}`}>
                                                        {guide.text}
                                                    </p>
                                                )}
                                            </div>

                                            {guide.bulletPoints && (
                                                <ul className={`space-y-1.5 sm:space-y-2 mt-2 pt-3 border-t ${borderTopColor}`}>
                                                    {guide.bulletPoints.map((pt, pIdx) => (
                                                        <li
                                                            key={pIdx}
                                                            className={`text-xs sm:text-sm leading-relaxed font-light flex items-start gap-2 ${bulletTextColor}`}
                                                        >
                                                            <span className={`font-bold ${checkColor}`}>✓</span>
                                                            <span>{pt.replace(/^✓\s*/, '')}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* FAQ Accordion Section */}
                            {tool.faqs && tool.faqs.length > 0 && (
                                <div className="max-w-4xl mx-auto">
                                    <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2">
                                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                            HÄUFIG GESTELLTE FRAGEN
                                        </span>
                                        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                            FAQ zum {tool.shortTitle}
                                        </h2>
                                        <p className="font-sans text-xs sm:text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                                            Die wichtigsten Fragen und Antworten zu unserem {tool.shortTitle}, kurz und verständlich zusammengefasst.
                                        </p>
                                    </div>

                                    <div className="space-y-3 sm:space-y-4">
                                        {tool.faqs.map((faq, idx) => {
                                            const isOpen = openFaqIndex === idx;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: idx * 0.04, duration: 0.35 }}
                                                    className={`border rounded-2xl overflow-hidden transition-all duration-300 will-change-transform ${
                                                        isOpen
                                                            ? 'border-gold bg-sand/20 shadow-xs'
                                                            : 'border-forest/10 bg-white hover:border-forest/30'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFaq(idx)}
                                                        className="w-full text-left p-4 sm:p-6 flex items-center justify-between gap-3 focus:outline-none cursor-pointer select-none"
                                                        aria-expanded={isOpen}
                                                    >
                                                        <span className="font-display text-sm sm:text-lg font-bold text-forest leading-snug">
                                                            {faq.question}
                                                        </span>
                                                        <div
                                                            className={`p-1.5 sm:p-2 rounded-full transition-transform duration-300 shrink-0 ${
                                                                isOpen ? 'rotate-180 bg-gold/10 text-gold' : 'bg-sand text-forest'
                                                            }`}
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </button>

                                                    <AnimatePresence initial={false}>
                                                        {isOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                            >
                                                                <div className="px-4 sm:px-8 md:px-10 pb-5 pt-1 font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line border-t border-forest/5">
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
                </ScrollSectionWrapper>
            )}

            {/* ── Scalable Cross-Internal Links CTA Box ── */}
            <section className="py-8 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative rounded-[28px] sm:rounded-[44px] overflow-hidden bg-gradient-to-br from-forest via-forest to-[#143d29] px-5 py-8 sm:px-12 sm:py-14 shadow-xl border border-white/10 will-change-transform"
                    >
                        {/* Subtle background glows */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/40 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10 text-center lg:text-left">
                            <div className="space-y-2 max-w-xl">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-gold block">
                                    CAMPING HELFER & MARKTPLATZ
                                </span>
                                <h3 className="font-display text-xl sm:text-3xl font-extrabold text-white leading-tight">
                                    Entdecke weitere Camping-Helfer Tools & Marktplatz-Kategorien
                                </h3>
                                <p className="font-sans text-xs sm:text-sm text-sand/85 font-light leading-relaxed">
                                    Wir erweitern unsere Tools stetig für deinen perfekten Campingurlaub.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 shrink-0 w-full sm:w-auto">
                                {otherTools.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => router.push(`/${t.slug}`)}
                                        className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 font-bold text-xs uppercase tracking-wider py-3 px-5 sm:py-3.5 sm:px-6 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <span>{t.shortTitle}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gold" />
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => router.push('/inserate')}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3 px-6 sm:py-3.5 sm:px-7 rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-gold/25 hover:scale-105 active:scale-95 cursor-pointer font-sans"
                                >
                                    <span>Alle Inserate</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

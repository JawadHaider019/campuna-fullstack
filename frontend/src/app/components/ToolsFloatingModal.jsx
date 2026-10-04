'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    X,
    Scale,
    Fuel,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import PayloadCalculator from './PayloadCalculator';
import BudgetCalculator from './BudgetCalculator';

export default function ToolsFloatingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTool, setActiveTool] = useState('payload');
    const [showFloatingBtn, setShowFloatingBtn] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const heroEl = document.getElementById('hero');
            if (heroEl) {
                const rect = heroEl.getBoundingClientRect();
                // Only show once scrolled past hero section
                setShowFloatingBtn(rect.bottom < 100);
            } else {
                // If on a page without hero section, show after small scroll
                setShowFloatingBtn(window.scrollY > 300);
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleOpenToolsModal = (e) => {
            if (e?.detail?.tool) {
                setActiveTool(e.detail.tool);
            }
            setIsOpen(true);
        };

        window.addEventListener('open-campuna-tools-tab', handleOpenToolsModal);
        window.addEventListener('open-campuna-tools-modal', handleOpenToolsModal);
        return () => {
            window.removeEventListener('open-campuna-tools-tab', handleOpenToolsModal);
            window.removeEventListener('open-campuna-tools-modal', handleOpenToolsModal);
        };
    }, []);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Simple Rounded Floating Action Button with silky-smooth floating and glowing waves */}
            <AnimatePresence>
                {showFloatingBtn && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 16 }}
                        transition={{ type: "spring", damping: 24, stiffness: 260 }}
                        className="fixed right-5 sm:right-7 bottom-20 sm:bottom-24 z-[80] flex items-center justify-center pointer-events-auto select-none"
                    >
                        {/* Dedicated Inner Floating Container for pure, smooth continuous bobbing */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 3.8,
                                ease: "easeInOut"
                            }}
                            className="relative flex items-center justify-center will-change-transform"
                        >
                            {/* Outer Slow Breathing Glow Halo (Smoothly expands big and small) */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.28, 1],
                                    opacity: [0.25, 0.65, 0.25]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3.6,
                                    ease: "easeInOut"
                                }}
                                className="absolute -inset-2.5 rounded-full bg-gold/40 blur-lg pointer-events-none will-change-transform"
                            />

                            {/* Inner Soft Pulsing Halo (Smoothly breathes in harmony) */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.4, 0.8, 0.4]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3.6,
                                    ease: "easeInOut"
                                }}
                                className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-md pointer-events-none will-change-transform"
                            />

                            <motion.button
                                type="button"
                                onClick={() => setIsOpen(true)}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.94 }}
                                className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-forest via-[#1e3d2f] to-[#12281e] text-sand hover:from-gold hover:to-[#b89548] hover:text-forest flex items-center justify-center transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_20px_rgba(200,169,107,0.3)] border-2 border-gold/75 hover:border-white cursor-pointer group z-10"
                                aria-label="Camping Rechner öffnen"
                                title="Camping-Rechner: Jetzt berechnen"
                            >
                                <Calculator className="w-6 h-6 text-gold group-hover:text-white transition-all duration-300 group-hover:rotate-6" />

                                {/* High-Contrast Clear Tooltip Tag on the side (desktop/tablet only) */}
                                <div className="hidden sm:block absolute right-full mr-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap select-none pointer-events-none">
                                    {/* Glow halo behind tooltip */}
                                    <div className="absolute inset-0 bg-gold/30 rounded-full blur-md -z-10" />

                                    <div className="relative px-3.5 py-1.5 rounded-full bg-forest/95 text-sand text-[11px] font-bold tracking-wider uppercase shadow-[0_6px_25px_rgba(0,0,0,0.45)] border border-gold/80 group-hover:bg-gold group-hover:text-forest transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                                        <span className="font-sans font-extrabold text-white group-hover:text-forest tracking-wider drop-shadow-sm flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-gold group-hover:text-forest" />
                                            Berechnen
                                        </span>

                                        {/* Arrow pointer */}
                                        <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-[1px] border-[5px] border-transparent border-l-forest group-hover:border-l-gold transition-colors" />
                                    </div>
                                </div>
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* High z-index Wide Modal Dialog */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                        />

                        {/* Extra Wide Modal Dialog Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                            className="relative w-full max-w-6xl bg-white border border-forest/15 rounded-[28px] sm:rounded-[36px] shadow-2xl p-5 sm:p-8 md:p-10 z-10 my-auto max-h-[92vh] flex flex-col overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-forest/5 hover:bg-forest hover:text-white text-forest flex items-center justify-center transition-all cursor-pointer z-20 shadow-sm"
                                aria-label="Schließen"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 sm:pb-5 border-b border-forest/10 gap-3 sm:gap-4 pr-10 sm:pr-12">
                                <div className="space-y-1 sm:space-y-1.5 max-w-xl">
                                    <span className="font-sans text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.35em] text-gold block flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Praktische Helfer
                                    </span>
                                    <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-forest">
                                        Camping-Rechner & Tools
                                    </h2>
                                    <p className="font-sans text-[11px] sm:text-xs md:text-sm text-charcoal/70 font-light leading-relaxed">
                                        Berechne Zuladung und Reisekosten schnell und unkompliziert für deine nächste Tour.
                                    </p>
                                </div>

                                {/* Tool Switcher Tabs (Responsive full-width on mobile / compact on desktop) */}
                                <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 bg-forest/5 p-1 sm:p-1.5 rounded-2xl border border-forest/10 w-full sm:w-auto shrink-0">
                                    <button
                                        onClick={() => setActiveTool('payload')}
                                        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                            activeTool === 'payload'
                                                ? 'bg-forest text-white shadow-md'
                                                : 'text-charcoal/70 hover:text-forest'
                                        }`}
                                    >
                                        <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-gold" />
                                        <span className="truncate">Zuladungsrechner</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('costs')}
                                        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                            activeTool === 'costs'
                                                ? 'bg-forest text-white shadow-md'
                                                : 'text-charcoal/70 hover:text-forest'
                                        }`}
                                    >
                                        <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-gold" />
                                        <span className="truncate">Reisekostenrechner</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Tool Body */}
                            <div className="overflow-y-auto flex-1 py-4 pr-1 sm:pr-2 scrollbar-thin">
                                <AnimatePresence mode="wait">
                                    {activeTool === 'payload' ? (
                                        <motion.div
                                            key="payload-tool"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <PayloadCalculator compact={true} />
                                            <div className="mt-6 pt-4 border-t border-forest/10 flex justify-end">
                                                <Link
                                                    href="/zuladungsrechner"
                                                    onClick={() => setIsOpen(false)}
                                                    className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors"
                                                >
                                                    <span>Rechner auf ganzer Seite öffnen</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gold" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="costs-tool"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <BudgetCalculator compact={true} />
                                            <div className="mt-6 pt-4 border-t border-forest/10 flex justify-end">
                                                <Link
                                                    href="/reisekostenrechner"
                                                    onClick={() => setIsOpen(false)}
                                                    className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors"
                                                >
                                                    <span>Rechner auf ganzer Seite öffnen</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gold" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

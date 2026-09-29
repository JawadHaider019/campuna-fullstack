'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    ArrowRight,
    Fuel,
    Scale
} from 'lucide-react';
import Link from 'next/link';
import PayloadCalculator from './PayloadCalculator';
import BudgetCalculator from './BudgetCalculator';

export default function ToolsSection() {
    const [activeTool, setActiveTool] = useState('payload');

    useEffect(() => {
        const handleOpenToolsTab = (e) => {
            if (e?.detail?.tool) {
                setActiveTool(e.detail.tool);
            }
        };

        window.addEventListener('open-campuna-tools-tab', handleOpenToolsTab);
        return () => {
            window.removeEventListener('open-campuna-tools-tab', handleOpenToolsTab);
        };
    }, []);

    return (
        <section id="tool" className="py-12 sm:py-16 bg-sand/20 border-t border-b border-forest/5 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="space-y-2">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Praktische Helfer
                        </span>
                        <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-forest">
                            Camping-Wissen & nützliche Tools
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-charcoal/70 max-w-2xl font-light">
                            Praktische Helfer für deine Planung: Mit dem Zuladungsrechner prüfst du das Gewicht deines Wohnmobils oder Wohnwagens, mit dem Reisebudget-Rechner planst du die Kosten deiner nächsten Tour. Dazu findest du im Campuna-Ratgeber ehrliche Tipps rund ums Kaufen, Verkaufen und Campen.
                        </p>
                    </div>

                    {/* Quick switch tabs */}
                    <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-forest/10 shadow-sm self-start md:self-auto">
                        <button
                            onClick={() => setActiveTool('payload')}
                            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                activeTool === 'payload'
                                    ? 'bg-forest text-white shadow-md'
                                    : 'text-charcoal/60 hover:text-forest'
                            }`}
                        >
                            <Scale className="w-4 h-4 shrink-0" />
                            <span>Zuladungsrechner</span>
                        </button>
                        <button
                            onClick={() => setActiveTool('costs')}
                            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                activeTool === 'costs'
                                    ? 'bg-forest text-white shadow-md'
                                    : 'text-charcoal/60 hover:text-forest'
                            }`}
                        >
                            <Fuel className="w-4 h-4 shrink-0" />
                            <span>Camping-Reisebudget-Rechner</span>
                        </button>
                    </div>
                </div>

                {/* Tool Container */}
                <div className="bg-white rounded-3xl border border-forest/10 shadow-lg p-5 sm:p-8">
                    <AnimatePresence mode="wait">
                        {activeTool === 'payload' ? (
                            <motion.div
                                key="payload"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PayloadCalculator compact={true} />
                                <div className="mt-6 pt-4 border-t border-forest/10 flex justify-end">
                                    <Link
                                        href="/zuladungsrechner"
                                        className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest hover:text-gold transition-colors"
                                    >
                                        <span>Rechner auf ganzer Seite öffnen</span>
                                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gold" />
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="costs"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <BudgetCalculator compact={true} />
                                <div className="mt-6 pt-4 border-t border-forest/10 flex justify-end">
                                    <Link
                                        href="/reisekostenrechner"
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
            </div>
        </section>
    );
}

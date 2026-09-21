'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '@/data';

const FaqSection = React.memo(function FaqSection() {
    const [openId, setOpenId] = useState('faq_1');

    const toggleFAQ = (id) => {
        setOpenId(openId === id ? null : id);
    };

    const faqList = FAQS || [];

    return (
        <section id="faq" className="py-10 sm:py-16 bg-white relative overflow-hidden scroll-mt-24">
            {/* Decorative background element */}
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sand/30 rounded-full blur-3xl pointer-events-none opacity-50" />

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                        Häufig gestellte Fragen
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                        Alles, was du über Campuna wissen musst
                    </h2>
                    <p className="font-sans text-sm text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                        Du hast Fragen zur Buchung, Vermietung oder Sicherheit? Hier findest du die Antworten auf die wichtigsten Fragen.
                    </p>
                </div>

                {/* FAQ Accordion List */}
                <div className="max-w-5xl mx-auto space-y-4">
                    {faqList.map((faq, idx) => {
                        const isOpen = openId === faq.id;
                        return (
                            <motion.div
                                key={faq.id}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen
                                    ? 'border-gold bg-sand/20 shadow-md'
                                    : 'border-forest/10 bg-white hover:border-forest/30'
                                    }`}
                            >
                                <button
                                    onClick={() => toggleFAQ(faq.id)}
                                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                        {faq.question}
                                    </span>
                                    <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-gold/10 text-gold' : 'bg-sand text-forest'}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>

                                {/* Accordion Animated Body */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        >
                                            <div className="px-8 md:px-10 pb-4 font-sans text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line">
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
        </section>
    );
});

export default FaqSection;

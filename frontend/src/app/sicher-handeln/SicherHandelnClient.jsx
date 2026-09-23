'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ShieldCheck,
    HeartHandshake,
    MessageCircle,
    Truck,
    AlertTriangle,
    Flag,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import CTA from '../components/CTA';

const SAFETY_PILLARS = [
    {
        number: '01',
        title: 'Respektvoller Umgang',
        desc: 'Campuna lebt von einem wertschätzenden Umgang miteinander. Beleidigungen, Betrug oder absichtliches Fehlverhalten haben hier keinen Platz.',
        icon: HeartHandshake,
        color: '#00630D',
        badge: 'Gemeinschaft & Vertrauen',
    },
    {
        number: '02',
        title: 'Kontakt vor dem Handel',
        desc: 'Nimm dir Zeit für den Austausch mit dem Käufer oder Verkäufer. Stelle Fragen und kläre wichtige Details, bevor ihr euch auf einen Handel einigt.',
        icon: MessageCircle,
        color: '#C8A96B',
        badge: 'Klarheit schaffen',
    },
    {
        number: '03',
        title: 'Übergabe und Bezahlung',
        desc: 'Viele Camper entscheiden sich für eine persönliche Übergabe. So kann die Ware direkt angeschaut werden und beide Seiten wissen, worauf sie sich einlassen. Wenn Versand vereinbart wird, solltet ihr gemeinsam eine Lösung wählen, mit der sich beide Seiten wohlfühlen.',
        icon: Truck,
        color: '#059669',
        badge: 'Sicherer Abschluss',
    },
    {
        number: '04',
        title: 'Vorsicht bei ungewöhnlichen Angeboten',
        desc: 'Sei aufmerksam bei ungewöhnlich günstigen Preisen oder ungewöhnlichen Zahlungswünschen. Ein gesundes Gefühl und ein kurzer Austausch helfen oft, Missverständnisse zu vermeiden.',
        icon: AlertTriangle,
        color: '#D97706',
        badge: 'Wachsam bleiben',
    },
    {
        number: '05',
        title: 'Anzeigen melden',
        desc: 'Wenn dir eine Anzeige oder ein Verhalten verdächtig vorkommt, kannst du sie jederzeit melden. Der Hinweis wird überprüft, damit Campuna ein fairer Ort für alle bleibt.',
        icon: Flag,
        color: '#E11D48',
        badge: 'Gemeinsamer Schutz',
    },
];

export default function SicherHandelnClient() {
    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION (Without bottom shadow) */}
            <section className="relative min-h-[48vh] md:min-h-[54vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10">
                {/* Background Cinematic Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/about_hero.webp"
                            alt="Sicher handeln auf Campuna"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.15),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-4"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                        Sicherheit & Vertrauen
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Sicher handeln auf <span className="text-gold">Campuna</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md space-y-2"
                    >
                        <p>
                            Beim Kaufen und Verkaufen über Campuna handeln Nutzer direkt miteinander.
                        </p>
                        <p className="text-white font-medium">
                            Mit ein paar einfachen Regeln bleibt der Austausch fair, respektvoll und sicher für alle.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Sicher handeln' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN SAFETY CARDS SECTION */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="space-y-6 sm:space-y-8">
                    {SAFETY_PILLARS.map((pillar, idx) => {
                        const IconComponent = pillar.icon;
                        return (
                            <motion.div
                                key={pillar.number}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.08 }}
                                className="bg-sand/30 hover:bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-forest/10 hover:border-gold/40 shadow-xs hover:shadow-[0_16px_40px_-10px_rgba(20,61,41,0.08)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-start gap-5">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-1"
                                        style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                                    >
                                        <IconComponent className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark font-sans">
                                                {pillar.badge}
                                            </span>
                                            <span className="text-xs text-charcoal/40 font-bold font-sans">
                                                • {pillar.number}
                                            </span>
                                        </div>
                                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest leading-snug">
                                            {pillar.title}
                                        </h2>
                                        <p className="font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light max-w-3xl">
                                            {pillar.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Closing Manifesto Box */}
                <div className="mt-14 bg-sand/40 rounded-3xl p-8 sm:p-10 border border-forest/10 text-center space-y-3">
                    <span className="inline-flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest">
                        <Sparkles className="w-4 h-4 text-gold" />
                        Gemeinsam für einen fairen Marktplatz
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-forest">
                        Campuna funktioniert am besten, wenn alle offen, ehrlich und respektvoll miteinander umgehen.
                    </h3>
                    <p className="font-sans text-sm sm:text-base text-charcoal/70 max-w-xl mx-auto leading-relaxed font-light">
                        So entsteht ein Marktplatz, auf dem Camper gerne handeln.
                    </p>
                </div>
            </main>

            {/* 3. STANDARD CAMPUNA CTA */}
            <div className="pt-2 pb-6">
                <CTA />
            </div>
        </div>
    );
}

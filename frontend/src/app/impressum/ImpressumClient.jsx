'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Scale,
    ShieldCheck,
    ExternalLink
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ImpressumClient() {
    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION (Without bottom shadow) */}
            <section className="relative min-h-[44vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10">
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
                            alt="Impressum Campuna"
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
                        <Scale className="w-3.5 h-3.5 text-gold" />
                        Rechtliche Angaben
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Impressum
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Angaben gemäß § 5 DDG und § 18 Abs. 2 MStV
                    </motion.p>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Impressum' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN IMPRESSUM CONTENT */}
            <main className="max-w-5xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">
                    
                    {/* Anbieterkennzeichnung */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark font-sans block">
                                    Diensteanbieter
                                </span>
                                <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                                    Angaben gemäß § 5 DDG
                                </h2>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
                            <p className="font-bold text-forest text-base">LMR Solutions Ronny Voigt</p>
                            <p><strong>Inhaber:</strong> Ronny Voigt</p>
                            <div className="flex items-start gap-2 pt-1">
                                <MapPin className="w-4 h-4 text-forest shrink-0 mt-1" />
                                <div>
                                    <p>Premnitzer Straße 8</p>
                                    <p>99091 Erfurt</p>
                                    <p>Deutschland</p>
                                </div>
                            </div>
                            <div className="pt-2 space-y-1 border-t border-forest/10">
                                <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-forest shrink-0" />
                                    <span><strong>Telefon:</strong> +49 163 1516518</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-forest shrink-0" />
                                    <span>
                                        <strong>E-Mail:</strong>{' '}
                                        <a href="mailto:kontakt@campuna.de" className="text-forest underline font-medium hover:text-gold transition-colors">
                                            kontakt@campuna.de
                                        </a>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* Verantwortlich für den Inhalt */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
                        </h2>
                        <div className="bg-white p-5 rounded-2xl border border-forest/10 space-y-1 text-sm sm:text-base">
                            <p className="font-bold text-forest">Ronny Voigt</p>
                            <p>Premnitzer Straße 8</p>
                            <p>99091 Erfurt</p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* Verbraucherstreitbeilegung */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            Verbraucherstreitbeilegung
                        </h2>
                        <p>
                            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* Haftung für Inhalte und Links */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            Haftung für Inhalte und Links
                        </h2>
                        <p>
                            Wir sind für die Inhalte unserer Webseiten nach den Maßgaben der allgemeinen Gesetze verantwortlich. Soweit wir auf unserer Internetseite auf Inhalte Dritter verweisen oder verlinken, übernehmen wir für deren Aktualität, Richtigkeit und Vollständigkeit keine Gewähr. Für die Inhalte der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
                        </p>
                        <p>
                            Sollten Ihnen rechtswidrige oder bedenkliche Inhalte auffallen, bitten wir Sie um einen entsprechenden Hinweis.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* Rechtliche Unterstützung */}
                    <section className="space-y-2 bg-sand/50 p-5 rounded-2xl border border-forest/10">
                        <p className="text-xs sm:text-sm text-charcoal/70">
                            Rechtstexte erstellt mit Unterstützung von:{' '}
                            <strong className="text-forest">Recht 24/7 Schröder Rechtsanwaltsgesellschaft mbH</strong>
                        </p>
                    </section>

                </div>
            </main>
        </div>
    );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    UserPlus,
    PlusCircle,
    MessageSquare,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Coins,
    Rocket,
    TrendingUp,
    Eye,
    CheckCircle2
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const STEPS = [
    {
        number: '01',
        title: 'Schritt 1 – Registrieren',
        desc: 'Erstelle kostenlos ein Konto und bestätige deine E-Mail-Adresse. Das dauert nur zwei Minuten.',
        icon: UserPlus,
        color: '#00630D',
        badge: 'Kostenlos & schnell',
        linkText: 'Jetzt registrieren',
        linkHref: '/registrieren',
    },
    {
        number: '02',
        title: 'Schritt 2 – Anzeige erstellen oder stöbern',
        desc: 'Stelle deine Campingausrüstung ein oder entdecke Anzeigen anderer Camper. Fotos hochladen, Beschreibung hinzufügen und Preis festlegen – fertig.',
        icon: PlusCircle,
        color: '#C8A96B',
        badge: 'Einfach & direkt',
        linkText: 'Anzeige aufgeben',
        linkHref: '/anzeige-erstellen',
    },
    {
        number: '03',
        title: 'Schritt 3 – Kontakt aufnehmen und handeln',
        desc: 'Wenn dich etwas interessiert, schreibe dem Anbieter direkt eine Nachricht. Ihr klärt alles miteinander und entscheidet selbst, wie ihr den Handel abschließt.',
        icon: MessageSquare,
        color: '#059669',
        badge: 'Ohne Zwischenhändler',
        linkText: 'Angebote entdecken',
        linkHref: '/inserate',
    },
];

const BOOST_FEATURES = [
    {
        icon: TrendingUp,
        title: 'Höhere Platzierung',
        desc: 'Dein Inserat erscheint ganz oben in den Suchergebnissen und Kategorien.',
    },
    {
        icon: Eye,
        title: 'Bis zu 5x mehr Aufrufe',
        desc: 'Mehr interessierte Camper sehen dein Angebot direkt auf den ersten Blick.',
    },
    {
        icon: Sparkles,
        title: 'Goldenes Hervorgehoben-Badge',
        desc: 'Ein optischer Blickfang hebt dein Angebot sofort von Standard-Inseraten ab.',
    },
];

export default function HowCampunaWorksClient() {
    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION */}
            <section className="relative min-h-[52vh] md:min-h-[58vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10">
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
                            alt="So funktioniert Campuna"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.15),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-14 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-4"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                        Konto & Marktplatz
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 drop-shadow-lg leading-tight"
                    >
                        So funktioniert <span className="text-gold">Campuna</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Campuna ist Deutschlands Camping-Marktplatz für private und gewerbliche Anbieter. Hier findest du Wohnmobile, Wohnwagen, Campingbusse, Campingzubehör, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen – einfach, direkt und ohne Zwischenhändler.
                    </motion.p>

                    {/* Action button */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-8 flex items-center justify-center w-full"
                    >
                        <Link
                            href="/anzeige-erstellen"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-gold/25 hover:scale-105 cursor-pointer"
                        >
                            <span>Kostenlos Inserieren</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'So funktioniert Campuna' }]}
                    variant="light"
                />
            </div>

            {/* 2. THE 3 STEP CARDS */}
            <section className="py-12 sm:py-16 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                        {STEPS.map((step, idx) => {
                            const IconComponent = step.icon;
                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                                    className="group relative bg-sand/30 hover:bg-white rounded-[32px] p-8 border border-forest/10 hover:border-gold/40 shadow-sm hover:shadow-[0_20px_50px_-10px_rgba(20,61,41,0.12)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Card Top: Number & Icon */}
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="font-display text-4xl sm:text-5xl font-black text-forest/20 group-hover:text-gold transition-colors duration-300">
                                                {step.number}
                                            </span>
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xs"
                                                style={{ backgroundColor: `${step.color}15`, color: step.color }}
                                            >
                                                <IconComponent className="w-7 h-7" />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mb-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark font-sans block mb-1">
                                                {step.badge}
                                            </span>
                                            <h2 className="font-display text-xl sm:text-2xl font-bold text-forest leading-snug">
                                                {step.title}
                                            </h2>
                                        </div>

                                        {/* Description */}
                                        <p className="font-sans text-sm sm:text-[15px] text-charcoal/75 leading-relaxed font-light">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Action link */}
                                    <div className="mt-8 pt-4 border-t border-forest/10">
                                        <Link
                                            href={step.linkHref}
                                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest group-hover:text-gold transition-colors"
                                        >
                                            <span>{step.linkText}</span>
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. SO FUNKTIONIERT DAS INSERAT-BOOSTEN (NEW SECTION) */}
            <section className="py-12 sm:py-16 bg-sand/30 border-y border-forest/10 relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="max-w-3xl mb-10 space-y-2">
                        <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold block">
                            Mehr Sichtbarkeit & Reichweite
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest">
                            Wie funktioniert das Inserat-Boosten?
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/70 leading-relaxed font-light">
                            Möchtest du deine Campingausrüstung oder dein Fahrzeug besonders schnell verkaufen? Mit der Boost-Funktion platzierst du dein Inserat ganz oben im Marktplatz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {BOOST_FEATURES.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/10 shadow-sm flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-display text-lg font-bold text-forest mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* How to activate a boost */}
                    <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-1.5 max-w-2xl">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-forest font-sans block">
                                Flexibel & einfach aktivierbar
                            </span>
                            <h3 className="font-display text-lg sm:text-xl font-bold text-forest">
                                Boost jederzeit für 7, 14 oder 30 Tage aktivieren
                            </h3>
                            <p className="font-sans text-xs sm:text-sm text-charcoal/70 font-light leading-relaxed">
                                Wähle in deinem Kundenkonto unter <strong>„Meine Inserate“</strong> einfach die Option <strong>„Hervorheben“</strong> oder nutze gesammelte Campuna Credits.
                            </p>
                        </div>
                        <Link
                            href="/boosten"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-forest to-[#1e613c] hover:brightness-110 text-white font-bold py-3 px-6 rounded-full text-xs uppercase tracking-wider transition-all shrink-0 shadow-md"
                        >
                            <Rocket className="w-4 h-4 text-gold" />
                            <span>Inserat hervorheben</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 4. KOSTEN / TRANSPARENCY SECTION */}
            <section className="py-12 sm:py-16 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Text Content */}
                        <div className="lg:col-span-7 space-y-5">
                            <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold block">
                                Transparenz
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-forest">
                                Kosten
                            </h2>
                            <div className="w-16 h-0.5 bg-gold rounded-full" />

                            <div className="space-y-4 font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light">
                                <p className="text-base sm:text-lg font-medium text-forest leading-relaxed">
                                    Für Privatpersonen bleibt das Inserieren kostenlos. Campuna soll ein fairer Camping-Marktplatz bleiben – transparent, einfach und ohne versteckte Gebühren. Für mehr Sichtbarkeit bieten wir optional Premium- und Spotlight-Funktionen an.
                                </p>
                                <p>
                                    Erstelle kostenlos ein Inserat oder entdecke Angebote anderer Camper und Anbieter. Ob Wohnmobil, Wohnwagen, Campingzubehör, Stellplatz, Campingplatz oder Vermietung – Fotos hochladen, Beschreibung ergänzen und Angebot veröffentlichen.
                                </p>
                                <p className="text-charcoal/70 text-xs sm:text-sm">
                                    Campuna ist Deutschlands Camping-Marktplatz für Wohnmobile, Wohnwagen, Campingbusse, Campingzubehör, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen rund ums Camping. Entdecke Angebote von privaten und gewerblichen Anbietern – alles an einem Ort.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-3">
                                <Link
                                    href="/anzeige-erstellen"
                                    className="inline-flex items-center gap-2 bg-forest hover:bg-forest/90 text-white font-semibold py-3 px-6 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-md hover:scale-105"
                                >
                                    <span>Kostenlose Anzeige erstellen</span>
                                    <ArrowRight className="w-4 h-4 text-gold" />
                                </Link>
                                <Link
                                    href="/registrieren"
                                    className="inline-flex items-center gap-2 bg-sand hover:bg-sand/80 text-forest border border-forest/20 font-semibold py-3 px-6 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-300"
                                >
                                    <span>Konto registrieren</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Quick Summary Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-sand/30 rounded-[32px] p-8 border border-forest/10 shadow-lg space-y-6">
                                <div className="border-b border-forest/10 pb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest">
                                                <Coins className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-display text-lg font-bold text-forest">Privatpersonen</h3>
                                        </div>
                                        <span className="text-xl font-black text-forest font-sans">0 €</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-charcoal/70 font-light">
                                        Kostenlos inserieren, unbegrenzt nachfragen und direkt verhandeln.
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold-dark">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-display text-lg font-bold text-forest">Gewerbliche Anbieter</h3>
                                        </div>
                                        <span className="text-sm font-bold text-gold-dark font-sans">Transparent</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-charcoal/70 font-light">
                                        Kostenloser Einstieg oder professionelles Business-Abo mit erweiterten Funktionen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

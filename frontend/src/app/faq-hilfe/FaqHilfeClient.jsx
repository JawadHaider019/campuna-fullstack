'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ChevronDown,
    HelpCircle,
    Mail,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Coins,
    UserCheck,
    Car,
    Tent
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import ScrollSectionWrapper from '../components/ScrollSectionWrapper';
import CTA from '../components/CTA';

const FAQ_SECTIONS = [
    {
        category: 'Allgemein',
        icon: Sparkles,
        items: [
            {
                id: 'allgemein-1',
                question: 'Was ist Campuna?',
                answer: 'Campuna ist Deutschlands spezialisierter Camping-Marktplatz. Hier findest du Wohnmobile, Wohnwagen, Campingbusse, Campingzubehör, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen – alles rund ums Camping an einem zentralen Ort.'
            },
            {
                id: 'allgemein-2',
                question: 'Für wen ist Campuna geeignet?',
                answer: 'Campuna richtet sich an alle Campingbegeisterten – egal ob Einsteiger, erfahrene Camper, private Verkäufer oder gewerbliche Händler und Vermieter. Wenn du etwas rund ums Camping kaufen, verkaufen oder mieten möchtest, bist du hier genau richtig.'
            },
            {
                id: 'allgemein-3',
                question: 'Was kann ich auf Campuna inserieren und finden?',
                answer: 'Auf Campuna findest du Wohnmobile, Wohnwagen, Campingbusse, Zubehör, Outdoor-Equipment, Dachzelte, Boote, Wassersportartikel, Stellplätze, Campingplätze, Vermietungsangebote sowie handwerkliche Services & Reparaturen.'
            },
            {
                id: 'allgemein-4',
                question: 'Warum Campuna statt allgemeiner Kleinanzeigen?',
                answer: 'Campuna wurde speziell für Camper entwickelt. Statt zwischen fachfremden Anzeigen zu suchen, findest du hier eine zielgerichtete Camping-Community mit campingspezifischen Filterkriterien, Fahrzeugdaten und Zubehör-Kategorien.'
            },
            {
                id: 'allgemein-5',
                question: 'Ist Campuna für Privatpersonen kostenlos?',
                answer: 'Ja! Für Privatpersonen ist das Erstellen von Inseraten kostenlos. Auch das Suchen und Kontaktieren anderer Mitglieder ist uneingeschränkt kostenlos. Für noch schnellere Verkäufe bieten wir optionale Boost-Funktionen an.'
            },
            {
                id: 'allgemein-6',
                question: 'Ist Campuna am Kaufvertrag beteiligt?',
                answer: 'Nein. Campuna stellt die Plattform bereit und bringt Camper direkt zusammen. Kauf, Bezahlung, Besichtigung, Übergabe oder Versand erfolgen eigenverantwortlich und direkt zwischen Käufer und Verkäufer.'
            }
        ]
    },
    {
        category: 'Konto & Inserate',
        icon: UserCheck,
        items: [
            {
                id: 'nutzung-1',
                question: 'Wie registriere ich mich bei Campuna?',
                answer: 'Klicke oben rechts auf „Registrieren“, gib deine Daten ein und bestätige deine E-Mail-Adresse über den Bestätigungslink. Das dauert nur etwa zwei Minuten.'
            },
            {
                id: 'nutzung-2',
                question: 'Wie erstelle ich ein Inserat?',
                answer: 'Klicke auf „Anzeige erstellen“, wähle die passende Kategorie, lade hochauflösende Fotos hoch, beschreibe dein Angebot und setze deinen Wunschpreis fest.'
            },
            {
                id: 'nutzung-3',
                question: 'Wie kontaktiere ich einen Verkäufer?',
                answer: 'Klicke auf dem Inserat auf „Nachricht schreiben“. Unser integriertes Echtzeit-Nachrichtensystem leitet deine Anfrage direkt und sicher an den Anbieter weiter.'
            },
            {
                id: 'nutzung-4',
                question: 'Wie bearbeite oder lösche ich ein Inserat?',
                answer: 'In deinem Profil unter „Meine Inserate“ kannst du deine Anzeigen jederzeit bearbeiten, pausieren, hervorheben oder nach erfolgreichem Verkauf löschen.'
            }
        ]
    },
    {
        category: 'Sicherheit & Boosts',
        icon: ShieldCheck,
        items: [
            {
                id: 'sicherheit-1',
                question: 'Wie melde ich ein verdächtiges Inserat?',
                answer: 'Unter jeder Anzeige findest du die Schaltfläche „Anzeige melden“. Unser Moderationsteam prüft jede Meldung zeitnah und ergreift entsprechende Maßnahmen.'
            },
            {
                id: 'sicherheit-2',
                question: 'Wie funktioniert das Inserat-Boosten?',
                answer: 'Mit einem Boost erhält dein Inserat eine bevorzugte Sichtbarkeit und prominentere Platzierung in relevanten Kategorien und Suchergebnissen sowie ein optisches Hervorgehoben-Badge.'
            },
            {
                id: 'sicherheit-3',
                question: 'Was sind Campuna Credits?',
                answer: 'Campuna Credits sind interne Bonuspunkte, die du z. B. durch erfolgreiche Weiterempfehlungen oder Aktionen sammelst und flexibel für Inserate-Boosts einlösen kannst (100 CC = 1,00 €).'
            },
            {
                id: 'sicherheit-4',
                question: 'Was ist das Campuna Pioneer-Programm?',
                answer: 'Die ersten 300 aktiven Camper, die ihr Profil vervollständigen und geprüfte Inserate erstellen, erhalten das permanente Pioneer-Abzeichen auf ihren Inseraten sowie einen Credit-Bonus.'
            }
        ]
    }
];

export default function FaqHilfeClient() {
    const [selectedCategory, setSelectedCategory] = useState('Alle');
    const [openId, setOpenId] = useState('allgemein-1');

    const toggleItem = useCallback((id) => {
        setOpenId(prev => prev === id ? null : id);
    }, []);

    // Filtered FAQ Items by Category
    const filteredSections = useMemo(() => {
        return FAQ_SECTIONS.map(section => {
            if (selectedCategory !== 'Alle' && section.category !== selectedCategory) {
                return null;
            }
            return section;
        }).filter(Boolean);
    }, [selectedCategory]);

    const allCategories = ['Alle', ...FAQ_SECTIONS.map(s => s.category)];

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-x-hidden">
            {/* ── 1. HERO SECTION ── */}
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[36vh] sm:min-h-[42vh] md:min-h-[48vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 shadow-xl border border-forest/10 will-change-transform"
            >
                {/* Background Cinematic Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.12, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                    >
                        <img
                            src="/hero-campuna.webp"
                            alt="Hilfe & FAQ bei Campuna - Camping Marktplatz"
                            className="w-full h-full object-cover"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
                </div>

                {/* Floating Glow Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.15),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-14 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-3"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-gold" />
                        Support & Antworten
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-xl leading-tight"
                    >
                        Hilfe & <span className="text-gold">FAQ</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="font-sans text-xs sm:text-sm md:text-base lg:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md mb-6"
                    >
                        Hier findest du Antworten auf die häufigsten Fragen rund um Campuna, Inserate, Registrierung, Sicherheit und Boosts.
                    </motion.p>

                    {/* Contact Action Button in Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="flex items-center justify-center w-full"
                    >
                        <Link
                            href="/kontakt"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-gold/25 hover:scale-105 active:scale-95 cursor-pointer font-sans"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Kontakt aufnehmen</span>
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Breadcrumbs ── */}
            <ScrollSectionWrapper delay={0.05}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                    <Breadcrumbs
                        items={[{ label: 'Hilfe & FAQ' }]}
                        variant="light"
                    />
                </div>
            </ScrollSectionWrapper>

            {/* ── Category Filter Pills ── */}
            <ScrollSectionWrapper delay={0.08}>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {allCategories.map((cat, idx) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-forest text-white shadow-sm'
                                            : 'bg-sand/30 hover:bg-sand/60 text-charcoal/80 border border-forest/10'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </ScrollSectionWrapper>

            {/* ── 2. MAIN ACCORDION SECTION ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="space-y-10 sm:space-y-12">
                    {filteredSections.map((section) => (
                        <section key={section.category} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                                    {section.category}
                                </h2>
                                <div className="h-0.5 flex-1 bg-forest/10 rounded-full" />
                            </div>

                            <div className="space-y-3.5">
                                {section.items.map((item, idx) => {
                                    const isOpen = openId === item.id;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.35, delay: idx * 0.04 }}
                                            className={`border rounded-2xl overflow-hidden transition-all duration-300 will-change-transform ${
                                                isOpen
                                                    ? 'border-gold bg-sand/20 shadow-md'
                                                    : 'border-forest/10 bg-white hover:border-forest/30'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleItem(item.id)}
                                                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                                aria-expanded={isOpen}
                                            >
                                                <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                                    {item.question}
                                                </span>
                                                <div
                                                    className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${
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
                                                        transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    >
                                                        <div className="px-6 pb-6 pt-1 font-sans text-xs sm:text-sm text-charcoal/80 leading-relaxed font-light whitespace-pre-line border-t border-forest/5">
                                                            {item.answer}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* ── 3. STANDARD CAMPUNA CTA SECTION ── */}
            <ScrollSectionWrapper delay={0.05}>
                <div className="pt-2 pb-8">
                    <CTA />
                </div>
            </ScrollSectionWrapper>
        </div>
    );
}

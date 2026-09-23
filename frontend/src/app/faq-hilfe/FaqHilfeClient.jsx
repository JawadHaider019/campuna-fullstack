'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ChevronDown,
    Sparkles,
    HelpCircle,
    Mail,
    ArrowRight
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import CTA from '../components/CTA';

const FAQ_SECTIONS = [
    {
        category: 'Allgemein',
        items: [
            {
                id: 'allgemein-1',
                question: 'Was ist Campuna?',
                answer: 'Campuna ist Deutschlands Camping-Marktplatz. Hier findest du Wohnmobile, Wohnwagen, Campingbusse, Campingzubehör, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen – alles rund ums Camping an einem Ort.'
            },
            {
                id: 'allgemein-2',
                question: 'Für wen ist Campuna geeignet?',
                answer: 'Campuna richtet sich an alle Campingbegeisterten – egal ob Anfänger, erfahrene Camper, private Verkäufer, gewerbliche Anbieter oder Vermieter. Wenn du etwas rund ums Camping kaufen, verkaufen oder entdecken möchtest, bist du hier genau richtig.'
            },
            {
                id: 'allgemein-3',
                question: 'Was kann ich auf Campuna finden?',
                answer: 'Auf Campuna findest du Fahrzeuge, Campingzubehör, Outdoor-Ausrüstung, Boote, Wassersportartikel, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen. Unser Ziel ist es, alles rund ums Camping auf einer Plattform zusammenzubringen.'
            },
            {
                id: 'allgemein-4',
                question: 'Warum Campuna statt allgemeiner Kleinanzeigen?',
                answer: 'Campuna wurde speziell für Camper entwickelt. Statt zwischen tausenden fachfremden Anzeigen zu suchen, findest du hier ausschließlich Angebote rund ums Camping. Das macht die Suche einfacher, übersichtlicher und relevanter.'
            },
            {
                id: 'allgemein-5',
                question: 'Ist Campuna kostenlos?',
                answer: 'Ja. Für Privatpersonen ist das Inserieren aktuell kostenlos. Auch das Stöbern auf der Plattform und das Kontaktieren anderer Nutzer ist kostenlos. Später können optionale Zusatzfunktionen wie Premium oder Spotlight angeboten werden, die Nutzung von Campuna bleibt jedoch grundsätzlich kostenlos.'
            },
            {
                id: 'allgemein-6',
                question: 'Wie funktioniert Campuna?',
                answer: 'Registriere dich kostenlos, erstelle dein Inserat oder entdecke interessante Angebote. Über das integrierte Nachrichtensystem kannst du Käufer und Verkäufer direkt kontaktieren und den Handel eigenständig organisieren. Campuna stellt die Plattform bereit und bringt Camper zusammen.'
            },
            {
                id: 'allgemein-7',
                question: 'Ist Campuna am Kauf beteiligt?',
                answer: 'Nein. Campuna stellt ausschließlich die Plattform zur Verfügung und vermittelt den Kontakt zwischen Käufern und Verkäufern. Kauf, Bezahlung, Versand oder Übergabe erfolgen direkt zwischen den beteiligten Personen. Campuna tritt dabei nicht als Verkäufer oder Vertragspartner auf.'
            }
        ]
    },
    {
        category: 'Nutzung',
        items: [
            {
                id: 'nutzung-1',
                question: 'Wie registriere ich mich?',
                answer: 'Erstelle kostenlos ein Benutzerkonto und bestätige deine E-Mail-Adresse. Danach kannst du sofort Inserate erstellen, Nachrichten schreiben und alle Funktionen von Campuna nutzen.'
            },
            {
                id: 'nutzung-2',
                question: 'Wie erstelle ich ein Inserat?',
                answer: 'Wähle die passende Kategorie, lade Bilder hoch, ergänze Titel, Beschreibung und Preis und veröffentliche dein Inserat. So können andere Camper dein Angebot sofort finden.'
            },
            {
                id: 'nutzung-3',
                question: 'Wie kontaktiere ich einen Anbieter?',
                answer: 'Wenn dich ein Angebot interessiert, kannst du den Anbieter direkt über das integrierte Nachrichtensystem kontaktieren. Ihr besprecht alle weiteren Details persönlich miteinander.'
            },
            {
                id: 'nutzung-4',
                question: 'Wie melde ich eine Anzeige?',
                answer: 'Unter jeder Anzeige findest du einen „Anzeige melden”-Button. Wenn dir etwas ungewöhnlich oder unseriös erscheint, kannst du uns darüber informieren. Wir prüfen jede Meldung sorgfältig.'
            },
            {
                id: 'nutzung-5',
                question: 'Wie ändere ich mein Profil?',
                answer: 'Öffne dein Benutzerkonto und gehe in den Profilbereich. Dort kannst du deine persönlichen Daten, dein Profilbild sowie weitere Informationen jederzeit aktualisieren.'
            },
            {
                id: 'nutzung-6',
                question: 'Wie lösche ich mein Konto?',
                answer: 'Wenn du dein Benutzerkonto nicht mehr nutzen möchtest, kannst du es in den Kontoeinstellungen dauerhaft löschen. Beachte bitte, dass dabei auch deine Inserate und Nachrichten entfernt werden.'
            }
        ]
    }
];

export default function FaqHilfeClient() {
    const [openId, setOpenId] = useState('allgemein-1');

    const toggleItem = (id) => {
        setOpenId(openId === id ? null : id);
    };

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
                            alt="Hilfe & FAQ bei Campuna"
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
                        <HelpCircle className="w-3.5 h-3.5 text-gold" />
                        Support & Antworten
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Hilfe & <span className="text-gold">FAQ</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Hier findest du Antworten auf die häufigsten Fragen rund um Campuna. Wenn deine Frage nicht dabei ist, schreib uns gerne über die Kontaktseite.
                    </motion.p>

                    {/* Single Contact Us Button in Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-6 flex items-center justify-center w-full"
                    >
                        <Link
                            href="/contact_kontakt"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-gold/25 hover:scale-105 cursor-pointer"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Kontakt aufnehmen</span>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Hilfe & FAQ' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN ACCORDION SECTION */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="space-y-10 sm:space-y-12">
                    {FAQ_SECTIONS.map((section) => (
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
                                            initial={{ opacity: 0, y: 15 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                                            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                                                isOpen
                                                    ? 'border-gold bg-sand/20 shadow-md'
                                                    : 'border-forest/10 bg-white hover:border-forest/30'
                                            }`}
                                        >
                                            <button
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
                                                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    >
                                                        <div className="px-6 pb-6 pt-1 font-sans text-sm sm:text-[15px] text-charcoal/80 leading-relaxed font-light whitespace-pre-line border-t border-forest/5">
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

            {/* 3. STANDARD CAMPUNA CTA SECTION */}
            <div className="pt-2 pb-6">
                <CTA />
            </div>
        </div>
    );
}

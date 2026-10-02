'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    FileText,
    BarChart2,
    Crown,
    Check,
    CheckCircle2,
    X,
    CreditCard
} from 'lucide-react';

export default function AccountSubscriptionTab({
    subDetails = {},
    userListings = [],
    onOpenCancelModal = () => {},
    onUpgradeClick = () => {},
    TabHeader = null
}) {
    const isBusiness = Boolean(subDetails?.is_business);
    const activeListingsCount = userListings.filter(l => ['APPROVED', 'REVIEW', 'AKTIV'].includes(l.status)).length;
    const remainingFreeListings = Math.max(0, 10 - activeListingsCount);
    const progressPercent = isBusiness ? 100 : Math.min(100, Math.round((activeListingsCount / 10) * 100));

    return (
        <motion.div
            key="tab-finanzen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
        >
            {/* Top Tab Header */}
            {TabHeader ? (
                <TabHeader
                    title="Abonnement"
                    subtitle="Dein aktueller Tarif, Inserate-Limits und verfügbare Campuna Mitgliedschaften"
                    icon={CreditCard}
                />
            ) : (
                <div className="flex items-center gap-3 pb-4 border-b border-beige">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest shrink-0">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-forest tracking-tight">Abonnement</h1>
                        <p className="text-xs text-charcoal/60 mt-0.5 font-medium">Dein aktueller Tarif, Inserate-Limits und verfügbare Campuna Mitgliedschaften</p>
                    </div>
                </div>
            )}

            {/* ── 1. TOP SECTION: MEIN AKTUELLER TARIF & LIMITS ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-beige shadow-xs space-y-6 relative overflow-hidden"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-beige">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest to-[#002204] flex items-center justify-center text-gold shadow-md shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-black text-forest">
                                    {isBusiness ? 'Campuna Business Plan' : 'Business Free Plan'}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isBusiness ? 'bg-emerald-100 text-emerald-800' : 'bg-forest/10 text-forest'}`}>
                                    {isBusiness ? 'Business' : 'Basis'}
                                </span>
                            </div>
                            <p className="text-xs text-charcoal/60 mt-0.5 font-medium">
                                {isBusiness 
                                    ? `Monatlich 29,00 € • Automatische Verlängerung am: ${subDetails.expires_at ? new Date(subDetails.expires_at).toLocaleDateString('de-DE') : 'in 30 Tagen'}`
                                    : '0,00 € / Monat • Dauerhaft kostenloser Basis-Tarif für Unternehmen & professionelle Anbieter'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {isBusiness ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={onOpenCancelModal}
                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                                Abonnement kündigen
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={onUpgradeClick}
                                className="px-5 py-2.5 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center gap-2 cursor-pointer group"
                            >
                                <span>Auf Business upgraden (29 €)</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Quota & Limits Visualizer Bento Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {/* Metric 1: Aktive Inserate */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-4.5 bg-[#faf8f3] rounded-2xl border border-beige hover:border-gold/40 transition-all space-y-2 shadow-2xs"
                    >
                        <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gold-dark" /> Aktive Inserate
                        </span>
                        <div className="text-lg sm:text-xl font-black text-charcoal font-sans">
                            {activeListingsCount} {activeListingsCount === 1 ? 'Inserat online' : 'Inserate online'}
                        </div>
                        <p className="text-[11px] text-charcoal/60 leading-relaxed">
                            {isBusiness
                                ? 'Deine Inserate profitieren von maximaler Reichweite und Telemetrie.'
                                : 'Deine aktuell auf Campuna veröffentlichten Anzeigen.'}
                        </p>
                    </motion.div>

                    {/* Metric 2: Performance-Analytics */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-4.5 bg-[#faf8f3] rounded-2xl border border-beige hover:border-gold/40 transition-all space-y-2 shadow-2xs"
                    >
                        <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5 text-gold-dark" /> Performance & Analytics
                        </span>
                        <div className="text-lg sm:text-xl font-black text-charcoal font-sans">
                            {isBusiness ? 'Live Telemetrie & Cockpit' : 'Basis-Aufrufe'}
                        </div>
                        <p className="text-[11px] text-charcoal/60 leading-relaxed">
                            {isBusiness
                                ? 'Echtzeit-Telemetrie, Klickraten (CTR), Lead-Tracking & Category-Share.'
                                : 'Einfache Zähler für Aufrufe und Merkliste deiner Anzeigen.'}
                        </p>
                    </motion.div>

                    {/* Metric 3: Cover & Branding */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-4.5 bg-[#faf8f3] rounded-2xl border border-beige hover:border-gold/40 transition-all space-y-2 shadow-2xs sm:col-span-2 lg:col-span-1"
                    >
                        <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-gold-dark" /> Firmenprofil & Branding
                        </span>
                        <div className="text-lg sm:text-xl font-black text-charcoal">
                            {isBusiness ? 'Firmen-Cover & Siegel' : 'Standard Profil'}
                        </div>
                        <p className="text-[11px] text-charcoal/60 leading-relaxed">
                            {isBusiness
                                ? 'Individuelles Firmen-Cover, 1.000 Zeichen Bio & Spotlight-Berechtigung.'
                                : '500 Zeichen Kurzprofil ohne individuelles Cover & ohne Spotlight.'}
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* ── 2. MIDDLE SECTION: VERFÜGBARE TARIFE IM VERGLEICH ── */}
            <div className="space-y-4 pt-2">
                <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-forest font-sans">Tarife für Unternehmen & professionelle Anbieter</h3>
                    <p className="text-xs text-charcoal/60 font-sans">Wähle die passende Lösung für dein Unternehmen und deine Campingangebote</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                    {/* Plan Card 1: Business Free */}
                    <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                            !isBusiness 
                                ? 'bg-white border-2 border-forest/40 shadow-sm relative ring-1 ring-forest/10' 
                                : 'bg-white border border-beige shadow-xs hover:border-forest/30'
                        }`}
                    >
                        <div className="space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                <div>
                                    <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block font-sans">Basis-Einstieg</span>
                                    <h4 className="text-xl font-black text-charcoal font-sans">Business Free</h4>
                                </div>
                                {!isBusiness ? (
                                    <span className="px-3 py-1 bg-forest/10 text-forest text-[10px] font-black uppercase rounded-full border border-forest/20 flex items-center gap-1">
                                        <Check className="w-3 h-3 text-forest" /> Aktiver Tarif
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-stone-100 text-charcoal/50 text-[10px] font-bold uppercase rounded-full">
                                        Kostenlos
                                    </span>
                                )}
                            </div>

                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl sm:text-4xl font-black text-charcoal font-mono">0 €</span>
                                    <span className="text-xs text-charcoal/60 font-medium">/ dauerhaft kostenlos</span>
                                </div>
                                <p className="text-xs text-charcoal/60 mt-1.5 font-sans leading-relaxed">Kostenloser Einstieg für Unternehmen und professionelle Anbieter rund ums Camping.</p>
                            </div>

                            <ul className="space-y-2.5 pt-3 border-t border-beige text-xs text-charcoal/80 font-sans">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span><strong>Kostenlose Inserate</strong> aufgeben</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Basis-Statistiken (Aufrufe & Merkliste)</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>500 Zeichen Unternehmensbeschreibung</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Inserate mit Credits hervorheben (ab 4,99 €)</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Direkte Kundenanfragen per Chat & Formular</span>
                                </li>
                                <li className="flex items-center gap-2.5 text-charcoal/40">
                                    <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                    <span className="line-through">Keine Spotlight-Buchung möglich</span>
                                </li>
                                <li className="flex items-center gap-2.5 text-charcoal/40">
                                    <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                    <span className="line-through">Kein individuelles Firmen-Cover</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6">
                            {!isBusiness ? (
                                <div className="w-full py-3 px-4 bg-[#faf8f3] text-charcoal/70 rounded-xl text-xs font-bold text-center border border-beige cursor-default">
                                    Aktuell aktiv
                                </div>
                            ) : (
                                <div className="w-full py-3 px-4 bg-stone-50 text-charcoal/40 rounded-xl text-xs font-medium text-center border border-beige">
                                    Enthalten als Basis
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Plan Card 2: Campuna Business */}
                    <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative overflow-hidden ${
                            isBusiness
                                ? 'bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-sand border-2 border-gold shadow-lg ring-2 ring-gold/30'
                                : 'bg-white border-2 border-gold shadow-sm hover:shadow-xl hover:border-gold/80'
                        }`}
                    >
                        {/* Glowing accent backdrop */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

                        {/* Top Ribbon / Badge */}
                        <div className="absolute top-0 right-0 z-10">
                            <span className="bg-gradient-to-r from-gold via-[#dfbe7f] to-gold text-forest text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                                {isBusiness ? 'Aktiver Plan' : 'Empfohlen für gewerbliche Anbieter'}
                            </span>
                        </div>

                        <div className="space-y-5 relative z-10">
                            <div className={`flex items-center justify-between pb-3 border-b ${isBusiness ? 'border-white/15' : 'border-beige'}`}>
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isBusiness ? 'text-gold' : 'text-gold-dark'}`}>
                                        Gewerbe-Upgrade
                                    </span>
                                    <h4 className={`text-xl font-black font-sans ${isBusiness ? 'text-white' : 'text-forest'}`}>
                                        Campuna Business
                                    </h4>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-3xl sm:text-4xl font-black font-mono ${isBusiness ? 'text-gold' : 'text-forest'}`}>29,00 €</span>
                                    <span className={`text-xs font-medium ${isBusiness ? 'text-sand/80' : 'text-charcoal/60'}`}>/ Monat (inkl. MwSt.)</span>
                                </div>
                                <p className={`text-xs mt-1.5 font-sans leading-relaxed ${isBusiness ? 'text-sand/70' : 'text-charcoal/60'}`}>
                                    Für Unternehmen und professionelle Anbieter rund ums Camping.
                                </p>
                            </div>

                            <ul className={`space-y-2.5 pt-3 border-t text-xs font-sans ${isBusiness ? 'border-white/15 text-sand/90' : 'border-beige text-charcoal/80'}`}>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>Maximale Reichweite</strong> für alle deine Inserate</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>Echtzeit Performance-Analytics</strong> & Live-Telemetrie</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>Professionelles Firmen-Cover & Logo</strong></span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>1.000 Zeichen</strong> Firmenbeschreibung</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>Präsenz im Verzeichnis</strong> für Camping-Anbieter</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span><strong>Spotlight-Berechtigung:</strong> Exklusiv buchbare Spotlight-Slots</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusiness ? 'text-gold' : 'text-emerald-600'}`} />
                                    <span>Monatlich flexibel kündbar</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 relative z-10">
                            {isBusiness ? (
                                <div className="w-full py-3 px-4 bg-gold/20 text-gold rounded-xl text-xs font-black uppercase tracking-wider text-center border border-gold/40 flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span>Dein aktiver Business-Tarif</span>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={onUpgradeClick}
                                    className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center justify-center gap-2 cursor-pointer group"
                                >
                                    <span>Jetzt auf Business upgraden</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

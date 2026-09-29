'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Award,
    Sparkles,
    CheckCircle2,
    Crown,
    Check,
    Plus,
    Pencil
} from 'lucide-react';
import PioneerBadge from '@/app/components/PioneerBadge';

export default function AccountPioneerTab({
    pioneerBadge = false,
    isCommercial = false,
    commercialPioneerCriteria = null,
    isProfileComplete = false,
    approvedListingsCount = 0,
    user = null,
    onNavigateToEditProfile = () => {},
    onCreateListing = () => {},
    TabHeader = null
}) {
    // Sanitized count of approved listings
    const safeApprovedCount = useMemo(() => {
        const count = Number(approvedListingsCount);
        return isNaN(count) ? 0 : Math.max(0, count);
    }, [approvedListingsCount]);

    // Qualification checklist evaluation for Private Accounts
    const privateCriteriaList = useMemo(() => {
        return [
            {
                id: 'profile',
                label: 'Profil vollständig ausgefüllt',
                detail: 'Vorname, Nachname, Bio und Standort hinterlegt',
                met: Boolean(isProfileComplete)
            },
            {
                id: 'listings',
                label: 'Mindestens 3 freigegebene Inserate',
                detail: 'Von der Moderation geprüft & veröffentlicht',
                met: safeApprovedCount >= 3,
                value: `${safeApprovedCount} / 3`
            },
            {
                id: 'verified',
                label: 'Konto verifiziert',
                detail: 'E-Mail-Adresse erfolgreich bestätigt',
                met: Boolean(user?.email_verified)
            }
        ];
    }, [isProfileComplete, safeApprovedCount, user?.email_verified]);

    // Active criteria array resolution
    const currentCriteria = useMemo(() => {
        if (isCommercial && commercialPioneerCriteria?.list && Array.isArray(commercialPioneerCriteria.list)) {
            return commercialPioneerCriteria.list;
        }
        return privateCriteriaList;
    }, [isCommercial, commercialPioneerCriteria, privateCriteriaList]);

    // Met criteria count
    const metCount = useMemo(() => {
        if (isCommercial && typeof commercialPioneerCriteria?.metCount === 'number') {
            return commercialPioneerCriteria.metCount;
        }
        return currentCriteria.filter(c => Boolean(c.met)).length;
    }, [isCommercial, commercialPioneerCriteria, currentCriteria]);

    const totalCount = useMemo(() => {
        return Math.max(1, currentCriteria.length);
    }, [currentCriteria]);

    // Progress percentage bounded safely between 0 and 100
    const progressPercent = useMemo(() => {
        if (pioneerBadge) return 100;
        return Math.min(100, Math.max(0, Math.round((metCount / totalCount) * 100)));
    }, [pioneerBadge, metCount, totalCount]);

    // Check if profile needs completion
    const needsProfile = useMemo(() => {
        return !(isCommercial ? commercialPioneerCriteria?.isProfileOnlyComplete : isProfileComplete);
    }, [isCommercial, commercialPioneerCriteria?.isProfileOnlyComplete, isProfileComplete]);

    // Listings remaining calculation
    const listingsNeeded = useMemo(() => {
        return Math.max(0, 3 - safeApprovedCount);
    }, [safeApprovedCount]);

    // Safe callbacks with event cancellation
    const handleEditProfileClick = useCallback((e) => {
        e?.preventDefault();
        onNavigateToEditProfile();
    }, [onNavigateToEditProfile]);

    const handleCreateListingClick = useCallback((e) => {
        e?.preventDefault();
        onCreateListing();
    }, [onCreateListing]);

    return (
        <motion.div
            key="tab-pioneer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
        >
            {/* Top Tab Header */}
            {TabHeader ? (
                <TabHeader
                    title={pioneerBadge ? "Campuna Pioneer Status" : "Campuna Pioneer Badge erhalten"}
                    subtitle={
                        pioneerBadge
                            ? "Exklusiver Status & dauerhafte Auszeichnung für die ersten 300 aktiven Campuna Mitglieder"
                            : "Werde einer der ersten 300 Campuna Pioniere und sichere dir deinen dauerhaften Pioneer-Status."
                    }
                    icon={Award}
                    badge={
                        pioneerBadge ? (
                            <PioneerBadge size="sm" text="Campuna Pioneer" />
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30 flex items-center gap-1.5 shadow-2xs font-sans">
                                <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
                                <span>{metCount} / {totalCount} Kriterien</span>
                            </span>
                        )
                    }
                />
            ) : null}

            {/* ── 1. PIONEER HERO CARD (Cinematic Luxury Bento Card) ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-sand shadow-lg relative overflow-hidden border border-gold/25"
            >
                {/* Ambient dynamic glows */}
                <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 relative z-10">
                    <div className="space-y-3 text-center md:text-left max-w-xl">
                        <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-sand/15 backdrop-blur-md border border-white/15 text-gold text-[10px] sm:text-[11px] font-black uppercase tracking-widest font-sans">
                            <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                            <span>Streng Limitiert auf 300 Mitglieder</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight font-sans">
                            Campuna Pioneer Award
                        </h2>

                        <p className="text-xs sm:text-sm text-sand/85 leading-relaxed font-sans">
                            Als Pioneer gehörst du zu den ersten 300 aktiven Mitgliedern der Campuna Plattform. Dein Profil und deine Inserate erhalten dauerhaft das goldene Pioneer-Siegel als besondere Anerkennung für dein frühes Engagement auf Campuna.
                        </p>

                        {/* Visual Progress Bar (if not yet awarded) */}
                        {!pioneerBadge && (
                            <div className="pt-2 space-y-1.5 max-w-md mx-auto md:mx-0">
                                <div className="flex items-center justify-between text-[11px] font-sans">
                                    <span className="text-sand/70 font-medium">Pioneer-Qualifikation</span>
                                    <span className="text-gold font-mono font-black">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-gold via-gold-light to-amber-300 rounded-full shadow-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center justify-center self-center md:self-auto relative p-2">
                        <motion.div
                            animate={{ scale: [1, 1.04, 1], rotate: [0, 2, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                            className="relative flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-gold/25 rounded-full blur-2xl transform scale-110 pointer-events-none" />
                            <PioneerBadge variant="hero" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ── 2. TWO-COLUMN BENTO GRID: CRITERIA & PRIVILEGES ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                
                {/* Left Column (6 cols): Qualification Checklist */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="lg:col-span-6 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Qualifikations-Kriterien</h3>
                                <p className="text-[11px] text-charcoal/50 font-medium font-sans">Automatische Freischaltung bei Erfüllung</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-forest bg-forest/5 px-2.5 py-1 rounded-full border border-forest/10">
                            {metCount} / {totalCount} Erfüllt
                        </span>
                    </div>

                    {/* Criteria Item List */}
                    <div className="space-y-3">
                        {currentCriteria.map((item, idx) => (
                            <motion.div
                                key={item.id || idx}
                                whileHover={{ x: 2 }}
                                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                                    item.met
                                        ? 'bg-emerald-50/60 border-emerald-200/80 text-forest'
                                        : 'bg-[#faf8f3] border-beige text-charcoal'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            item.met ? 'bg-forest text-gold shadow-2xs' : 'bg-stone-200 text-stone-400'
                                        }`}
                                    >
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-bold text-xs sm:text-sm block font-sans truncate">{item.label}</span>
                                        <span className="text-[11px] text-charcoal/60 block font-sans mt-0.5">{item.detail}</span>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <span
                                        className={`font-black font-mono text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded-md ${
                                            item.met
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-stone-200/60 text-charcoal/60'
                                        }`}
                                    >
                                        {item.value || (item.met ? 'Erfüllt' : 'Ausstehend')}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Action Button Section */}
                    <div className="pt-2">
                        {pioneerBadge ? (
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs font-sans"
                            >
                                <Sparkles className="w-4 h-4 text-gold-dark shrink-0" />
                                <span>Glückwunsch! Du bist Campuna Pioneer</span>
                            </motion.div>
                        ) : needsProfile ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={handleEditProfileClick}
                                className="w-full bg-forest hover:bg-[#004d0a] text-sand py-3 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-sans"
                            >
                                <Pencil className="w-4 h-4 text-gold" />
                                <span>Profil jetzt vervollständigen</span>
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={handleCreateListingClick}
                                className="w-full bg-forest hover:bg-[#004d0a] text-sand py-3 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-sans"
                            >
                                <Plus className="w-4 h-4 text-gold" />
                                <span>Jetzt Inserat schalten ({listingsNeeded} erforderlich)</span>
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Right Column (6 cols): Pioneer Privileges */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className="lg:col-span-6 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0">
                                <Crown className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Exklusive Vorteile</h3>
                                <p className="text-[11px] text-charcoal/50 font-medium font-sans">Dauerhafte Auszeichnung & Vorteile</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="p-4 bg-[#faf8f3] hover:bg-sand/30 rounded-2xl border border-beige space-y-1.5 transition-colors shadow-2xs"
                        >
                            <h5 className="font-bold text-charcoal text-xs sm:text-sm flex items-center gap-2 font-sans">
                                <Crown className="w-4 h-4 text-gold-dark shrink-0" />
                                <span>Goldener Badge im Profil & Inseraten</span>
                            </h5>
                            <p className="text-[11px] sm:text-xs text-charcoal/65 leading-relaxed font-sans pl-6">
                                Dein Account sticht mit einem exklusiven Siegel hervor und zeichnet dich als frühen Unterstützer und aktives Mitglied der ersten Stunde aus.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -2 }}
                            className="p-4 bg-[#faf8f3] hover:bg-sand/30 rounded-2xl border border-beige space-y-1.5 transition-colors shadow-2xs"
                        >
                            <h5 className="font-bold text-charcoal text-xs sm:text-sm flex items-center gap-2 font-sans">
                                <Sparkles className="w-4 h-4 text-gold-dark shrink-0" />
                                <span>1.000 CC Einmal-Bonus (10 € Gegenwert)</span>
                            </h5>
                            <p className="text-[11px] sm:text-xs text-charcoal/65 leading-relaxed font-sans pl-6">
                                Einmalige Prämie von 1.000 Campuna Credits direkt nach erfolgreicher Qualifikation (nutzbar für Inserate-Highlights{isCommercial ? ' & Spotlight-Buchungen' : ''}).
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -2 }}
                            className="p-4 bg-[#faf8f3] hover:bg-sand/30 rounded-2xl border border-beige space-y-1.5 transition-colors shadow-2xs"
                        >
                            <h5 className="font-bold text-charcoal text-xs sm:text-sm flex items-center gap-2 font-sans">
                                <Award className="w-4 h-4 text-gold-dark shrink-0" />
                                <span>Dauerhafter Pioneer-Status</span>
                            </h5>
                            <p className="text-[11px] sm:text-xs text-charcoal/65 leading-relaxed font-sans pl-6">
                                Als Pioneer bleibt dein Ehrenstatus dauerhaft erhalten – streng limitiert auf die ersten 300 aktiven Mitglieder auf Campuna.
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

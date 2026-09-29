'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift,
    Receipt,
    Users,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Clock,
    Share2,
    Copy,
    Check,
    Coins,
    ShieldCheck
} from 'lucide-react';
import CoinIcon from '@/app/components/CoinIcon';
import toast from 'react-hot-toast';

const CREDIT_PACKAGES = [
    { credits: 500, priceEur: '4,99 €', label: '7 Tage Inserat-Highlight', popular: false },
    { credits: 800, priceEur: '7,99 €', label: '14 Tage Inserat-Highlight', popular: true },
    { credits: 1300, priceEur: '12,99 €', label: '30 Tage Inserat-Highlight', popular: false },
    { credits: 2500, priceEur: '24,99 €', label: '2.500 CC Guthaben', popular: false },
];

export default function AccountCreditsTab({
    creditBalance = 0,
    referralStats = {},
    referralsList = [],
    creditTransactions = [],
    isCommercial = false,
    user = null,
    onOpenBuyCreditModal = () => {},
    TabHeader = null,
    ReferralQuickBadge = null
}) {
    const [copiedLink, setCopiedLink] = useState(false);

    // Safe numeric balance calculation
    const safeBalance = useMemo(() => {
        const val = Number(creditBalance);
        return isNaN(val) ? 0 : Math.max(0, val);
    }, [creditBalance]);

    const formattedBalance = useMemo(() => {
        return safeBalance.toLocaleString('de-DE');
    }, [safeBalance]);

    const eurEquivalent = useMemo(() => {
        return (safeBalance * 0.01).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }, [safeBalance]);

    // Referral link builder with safe origin resolution
    const referralCode = user?.referral_code || user?.referralCode || user?.id?.substring(0, 8) || '';
    const referralUrl = useMemo(() => {
        if (!referralCode) return '';
        const origin = typeof window !== 'undefined' && window.location?.origin 
            ? window.location.origin 
            : 'https://campuna.de';
        return `${origin}/de/registrieren?ref=${encodeURIComponent(referralCode)}`;
    }, [referralCode]);

    const handleCopyReferral = useCallback((e) => {
        e?.stopPropagation();
        if (!referralUrl) {
            toast.error('Kein Empfehlungs-Link vorhanden');
            return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(referralUrl)
                .then(() => {
                    setCopiedLink(true);
                    toast.success('Empfehlungslink in Zwischenablage kopiert!');
                    setTimeout(() => setCopiedLink(false), 2000);
                })
                .catch(() => {
                    toast.error('Kopieren fehlgeschlagen');
                });
        }
    }, [referralUrl]);

    return (
        <motion.div
            key="tab-credits"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
        >
            {/* Top Tab Header */}
            {TabHeader ? (
                <TabHeader
                    title="Campuna Credits & Empfehlungen"
                    subtitle={
                        isCommercial
                            ? "Nutze Credits flexibel für Inserate-Highlights & Spotlight-Buchungen und sichere dir neue durch Weiterempfehlungen"
                            : "Nutze Credits flexibel für Inserate-Highlights und sichere dir neue durch Weiterempfehlungen"
                    }
                    icon={Gift}
                    action={
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold-dark px-3.5 py-1.5 rounded-full text-xs font-black font-mono shadow-xs"
                        >
                            <CoinIcon size="sm" />
                            <span>{formattedBalance} CC</span>
                        </motion.div>
                    }
                />
            ) : null}

            {/* ── 1. WALLET BALANCE HERO CARD (Cinematic Luxury Bento Style) ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 text-sand shadow-lg relative overflow-hidden border border-gold/25"
            >
                <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1 space-y-2.5 text-left min-w-0">
                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-sand/15 backdrop-blur-md border border-white/15 text-gold text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-sans">
                            <Sparkles className="w-3 h-3 text-gold" />
                            Verfügbares Guthaben
                        </span>

                        <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-gold tracking-tight drop-shadow-xs">
                            {formattedBalance} CC
                        </div>

                        <p className="text-xs sm:text-sm text-sand/85 leading-relaxed max-w-xl font-sans pt-1">
                            1 Credit = 1 Cent Gegenwert (100 CC = 1,00 €). Verwende Credits flexibel für Inserate-Highlights{isCommercial ? ' sowie exklusive Spotlight-Buchungen' : ''}.
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center relative p-2 self-center sm:self-auto">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.03, 1] }}
                            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                            className="relative flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-gold/25 rounded-full blur-2xl transform scale-110 pointer-events-none" />
                            <img
                                src="/coin.png"
                                alt="Campuna Credits Coin"
                                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-[0_12px_30px_rgba(200,169,107,0.5)] select-none pointer-events-none"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ── 2. METRIC OVERVIEW CARDS (Responsive Bento Grid) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-4.5 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center space-y-1"
                >
                    <span className="text-[10px] sm:text-[11px] font-bold text-charcoal/50 uppercase tracking-wider font-sans">Gesamt Eingeladen</span>
                    <p className="text-2xl sm:text-3xl font-black text-forest font-mono">{referralStats?.total || 0}</p>
                    <span className="text-[10px] text-charcoal/40 font-sans">Empfehlungen über deinen Code</span>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-4.5 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center space-y-1"
                >
                    <span className="text-[10px] sm:text-[11px] font-bold text-charcoal/50 uppercase tracking-wider font-sans">Ausstehend</span>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{referralStats?.pending || 0}</p>
                    <span className="text-[10px] text-charcoal/40 font-sans">Wartet auf erstes Inserat / Profil</span>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-4.5 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center space-y-1"
                >
                    <span className="text-[10px] sm:text-[11px] font-bold text-charcoal/50 uppercase tracking-wider font-sans">Erfolgreich Vergütet</span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">{referralStats?.completed || 0}</p>
                    <span className="text-[10px] text-charcoal/40 font-sans">Gutschrift auf deinem Konto</span>
                </motion.div>
            </div>

            {/* ── 3. SHARE HUB & INVITATIONS SECTION (2 Columns) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                {/* Left Column (7 cols): Referral Link & Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                                <Gift className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Freunde & Partner einladen</h3>
                                <p className="text-[11px] text-charcoal/50 font-medium font-sans">Verteile deinen persönlichen Einladungscode</p>
                            </div>
                        </div>
                    </div>

                    {referralCode ? (
                        <div className="space-y-4">
                            {ReferralQuickBadge ? (
                                <ReferralQuickBadge code={referralCode} />
                            ) : (
                                <div className="p-4 rounded-2xl bg-[#faf8f3] border border-beige space-y-3 shadow-2xs">
                                    <label className="text-xs font-bold text-charcoal flex items-center gap-1.5 font-sans">
                                        <Share2 className="w-3.5 h-3.5 text-forest" />
                                        Dein persönlicher Empfehlungslink
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={referralUrl}
                                            className="flex-1 px-3.5 py-2.5 bg-white border border-beige rounded-xl text-xs font-mono text-charcoal/80 focus:outline-hidden select-all"
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            type="button"
                                            onClick={handleCopyReferral}
                                            className="px-3.5 py-2.5 bg-forest hover:bg-[#004d0a] text-sand font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                                            title="In die Zwischenablage kopieren"
                                        >
                                            {copiedLink ? <Check className="w-3.5 h-3.5 text-gold" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedLink ? 'Kopiert!' : 'Kopieren'}</span>
                                        </motion.button>
                                    </div>
                                    <p className="text-[11px] text-charcoal/50 leading-relaxed font-sans">
                                        Sobald sich jemand über deinen Link anmeldet und qualifiziert (1. freigeschaltetes Inserat oder vollständiges Profil), erhaltet ihr beide sofort Credit-Gutschriften!
                                    </p>
                                </div>
                            )}

                            {/* Quick 3-Step Guide */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="p-3.5 bg-[#faf8f3] rounded-xl border border-beige text-left space-y-1 shadow-2xs"
                                >
                                    <span className="text-xs font-black text-forest font-mono block">1. Teilen</span>
                                    <p className="text-[11px] text-charcoal/70 leading-relaxed font-sans">Gib deinen Link oder Code an Camping-Freunde und Partner weiter.</p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="p-3.5 bg-[#faf8f3] rounded-xl border border-beige text-left space-y-1 shadow-2xs"
                                >
                                    <span className="text-xs font-black text-forest font-mono block">2. Registrieren</span>
                                    <p className="text-[11px] text-charcoal/70 leading-relaxed font-sans">Dein Kontakt meldet sich mit deinem Code bei Campuna an.</p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="p-3.5 bg-[#faf8f3] rounded-xl border border-beige text-left space-y-1 shadow-2xs"
                                >
                                    <span className="text-xs font-black text-forest font-mono block">3. Belohnung</span>
                                    <p className="text-[11px] text-charcoal/70 leading-relaxed font-sans">Privat: 500 CC nach 1. Inserat. Gewerblich: 1.000 CC nach Firmenprofil.</p>
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-charcoal/40 font-sans py-4 text-center">Kein Empfehlungscode verfügbar.</p>
                    )}
                </motion.div>

                {/* Right Column (5 cols): Invites Activity List */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Deine Einladungen</h3>
                                <p className="text-[11px] text-charcoal/50 font-medium font-sans">{referralsList.length} Einladungen registriert</p>
                            </div>
                        </div>
                    </div>

                    {referralsList.length === 0 ? (
                        <div className="py-8 text-center bg-[#faf8f3] rounded-2xl border border-dashed border-beige p-6 space-y-2">
                            <p className="text-xs text-charcoal/60 font-medium font-sans">Noch keine Einladungen vorhanden.</p>
                            <p className="text-[11px] text-charcoal/40 font-sans">Teile deinen Code mit Camping-Freunden & Partnern!</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {referralsList.map((ref) => (
                                <motion.div
                                    key={ref.id}
                                    whileHover={{ x: 2 }}
                                    className="flex items-center justify-between p-3 bg-[#faf8f3] hover:bg-sand/50 rounded-xl border border-beige text-xs transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-charcoal font-sans">{ref.referred_name || 'Campuna Mitglied'}</p>
                                        <p className="text-[10px] text-charcoal/50 uppercase font-sans mt-0.5">{ref.referred_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ref.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {ref.status === 'COMPLETED' ? 'Erfolgreich' : 'Ausstehend'}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── 4. GUTHABEN AUFLADEN (CREDITS-PAKETE) ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5"
            >
                <div className="flex items-center justify-between pb-3 border-b border-beige">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0">
                            <CoinIcon size="sm" />
                        </div>
                        <div>
                            <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Guthaben aufladen (Credits-Pakete)</h3>
                            <p className="text-[11px] text-charcoal/50 font-medium font-sans">Kaufe Campuna Credits für flexible Inserate-Highlights{isCommercial ? ' & Spotlight-Buchungen' : ''}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    {CREDIT_PACKAGES.map((pkg) => (
                        <motion.div
                            key={pkg.credits}
                            whileHover={{ y: -3, scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative bg-[#faf8f3] hover:bg-white shadow-2xs ${
                                pkg.popular ? 'border-forest/60 ring-2 ring-forest/15 shadow-sm' : 'border-beige hover:border-gold/50'
                            }`}
                        >
                            {pkg.popular && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-forest text-sand tracking-tight shadow-xs">
                                    Beliebt
                                </span>
                            )}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 font-mono font-black text-lg sm:text-xl text-forest">
                                    <CoinIcon size="sm" />
                                    <span>{pkg.credits.toLocaleString('de-DE')} CC</span>
                                </div>
                                <div className="text-sm sm:text-base font-bold text-charcoal font-sans">{pkg.priceEur}</div>
                                <p className="text-[11px] text-charcoal/60 leading-tight pt-1 font-sans">{pkg.label}</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => onOpenBuyCreditModal(pkg.credits)}
                                className="mt-4 w-full bg-forest hover:bg-[#004d0a] text-sand py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Jetzt aufladen</span>
                                <ArrowRight className="w-3.5 h-3.5 text-gold" />
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── 5. TRANSAKTIONSVERLAUF (LEDGER ACTIVITY AUDIT) ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4"
            >
                <div className="flex items-center justify-between pb-3 border-b border-beige">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-charcoal text-sm sm:text-base font-sans">Guthaben- & Transaktionsverlauf</h3>
                            <p className="text-[11px] text-charcoal/50 font-medium font-sans">Vollständiger Audit-Verlauf aller Gutschriften & Ausgaben</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-charcoal/60">
                        {creditTransactions.length} {creditTransactions.length === 1 ? 'Eintrag' : 'Einträge'}
                    </span>
                </div>

                {creditTransactions.length === 0 ? (
                    <div className="py-8 text-center bg-[#faf8f3] rounded-2xl border border-dashed border-beige p-6 space-y-1">
                        <p className="text-xs text-charcoal/60 font-medium font-sans">Noch keine Transaktionen aufgezeichnet.</p>
                        <p className="text-[11px] text-charcoal/40 font-sans">Sobald du Guthaben auflädst, Freunde einlädst oder Inserate hervorhebst, erscheinen die Einträge hier.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {creditTransactions.map((tx) => {
                            const isPositive = tx.amount > 0;
                            const isZero = tx.amount === 0;
                            return (
                                <motion.div
                                    key={tx.id}
                                    whileHover={{ x: 2 }}
                                    className="flex items-center justify-between p-3.5 bg-[#faf8f3] hover:bg-sand/40 rounded-xl border border-beige text-xs gap-3 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-charcoal truncate font-sans">{tx.description || tx.type}</p>
                                        <p className="text-[10px] text-charcoal/50 font-mono mt-0.5">
                                            {new Date(tx.created_at).toLocaleDateString('de-DE', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className={`font-mono font-black text-xs ${
                                            isPositive ? 'text-emerald-700' : isZero ? 'text-forest' : 'text-rose-600'
                                        }`}>
                                            {isPositive ? `+${tx.amount.toLocaleString('de-DE')} CC` : isZero ? 'Direktzahlung' : `${tx.amount.toLocaleString('de-DE')} CC`}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

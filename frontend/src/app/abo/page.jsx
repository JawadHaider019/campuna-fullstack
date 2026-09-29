'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    getPlans,
    getMySubscription,
    getMyFeatures,
    subscribeToPlan,
    cancelSubscription,
    getCreditBalance,
} from '@/api/profile';
import { toast } from 'react-hot-toast';
import {
    Check, X, Zap, Star, FileText,
    BarChart2, Loader2, Crown, ArrowRight,
    AlertTriangle, ChevronDown, Shield, Sparkles, Mail
} from 'lucide-react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import ScrollSectionWrapper from '@/app/components/ScrollSectionWrapper';

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_ROWS = [
    { key: 'listing_limit', label: 'Aktive Inserate gleichzeitig', icon: FileText, freeValue: 'Bis zu 10 Inserate', bizValue: 'Unbegrenzt Inserate' },
    { key: 'has_statistics', label: 'Performance-Analytics & Telemetrie', icon: BarChart2, freeValue: 'Basis-Statistiken', bizValue: 'Vollständige Live-Analytics & CTR' },
    { key: 'description_limit', label: 'Beschreibungslänge', icon: FileText, freeValue: '500 Zeichen', bizValue: '1.000 Zeichen' },
    { key: 'has_cover_image', label: 'Individuelles Firmen-Cover & Logo', icon: Shield, freeValue: false, bizValue: true },
    { key: 'directory_listing', label: 'Präsenz im Camping-Anbieter-Verzeichnis', icon: Crown, freeValue: false, bizValue: true },
    { key: 'business_badge', label: 'Exklusives goldenes Business-Siegel', icon: Sparkles, freeValue: false, bizValue: true },
    { key: 'spotlight_eligible', label: 'Spotlight-Buchungsberechtigung', icon: Zap, freeValue: false, bizValue: true },
    { key: 'support', label: 'Persönlicher Support', icon: Shield, freeValue: 'E-Mail Support', bizValue: 'Prioritärer Business-Support' },
    { key: 'contract', label: 'Laufzeit & Kündigung', icon: FileText, freeValue: 'Dauerhaft kostenlos', bizValue: 'Monatlich flexibel kündbar' },
];

const TESTIMONIALS = [
    { name: 'Camping Müller GmbH', text: 'Mit dem Business-Tarif haben wir unsere Buchungen um 40% gesteigert. Die unbegrenzten Inserate und die professionellen Business-Tools machen einen riesigen Unterschied!', plan: 'Business' },
    { name: 'Outdoor Reisen Wagner', text: 'Die Reichweite und die detaillierten Statistiken haben uns geholfen, stetig neue Kunden zu gewinnen. Absolut empfehlenswert.', plan: 'Business' },
    { name: 'CamperWorld Bayern', text: 'Die Statistiken zeigen uns genau, welche Anzeigen funktionieren. Ein echter Gamechanger für unser Marketing.', plan: 'Business' },
];

const FAQ = [
    { q: 'Wofür kann ich Campuna Credits einsetzen?', a: 'Campuna Credits (1 CC = €0,01) können flexibel für 7-, 14- oder 30-Tage Inserat-Reichweiten-Boosts sowie Spotlight-Platzierungen genutzt werden. Das Business-Abonnement (€29/Monat) wird regulär via SEPA-Lastschrift oder Kreditkarte abgerechnet.' },
    { q: 'Was passiert mit meinen Anzeigen, wenn ich kündige?', a: 'Deine bestehenden Anzeigen bleiben erhalten, du kannst jedoch keine neuen mehr erstellen, sobald du das kostenlose Limit von 10 Anzeigen erreicht hast.' },
    { q: 'Kann ich monatlich kündigen?', a: 'Ja! Du kannst dein Business-Abonnement jederzeit kündigen. Es läuft noch bis zum Ende des gebuchten Zeitraums.' },
    { q: 'Gibt es einen Rabatt für mehrere Monate?', a: 'Ja! Beim 3-Monats-Paket sparst du gegenüber dem Einzelmonat, und beim Jahresplan erhältst du 2 Gratismonate (€290/Jahr).' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureCheck = React.memo(function FeatureCheck({ value, format }) {
    if (typeof value === 'boolean') {
        return value
            ? <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest/10 mx-auto shrink-0"><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-forest" /></span>
            : <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-charcoal/5 mx-auto shrink-0"><X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-charcoal/25" /></span>;
    }
    return <span className="text-xs sm:text-sm font-semibold text-charcoal font-sans text-center leading-snug whitespace-nowrap px-1">{format ? format(value) : value}</span>;
});

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function AboPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    const [plans, setPlans] = useState([]);
    const [features, setFeatures] = useState(null);
    const [creditBalance, setCreditBalance] = useState(0);
    const [subscribing, setSubscribing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [selectedMonths, setSelectedMonths] = useState(1);
    const [cancelVerification, setCancelVerification] = useState({
        account_holder: '',
        iban_or_card: '',
        reason: 'Bedarf vorübergehend gedeckt',
        confirm_clawback: false,
    });

    useEffect(() => { 
        setMounted(true); 
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let active = true;

        const load = async () => {
            try {
                const plansRes = await getPlans();
                if (active && plansRes?.success) {
                    setPlans(plansRes.data?.plans || []);
                }

                if (isLoggedIn) {
                    const [featRes, credRes] = await Promise.all([
                        getMyFeatures().catch(() => null),
                        getCreditBalance().catch(() => null),
                    ]);
                    if (active) {
                        if (featRes?.success) setFeatures(featRes.data?.features || null);
                        if (credRes?.success) setCreditBalance(credRes.data?.balance ?? 0);
                    }
                }
            } catch (err) {
                console.error('Failed to load subscription data:', err);
            }
        };

        load();
        return () => { active = false; };
    }, [mounted, isLoggedIn]);

    const businessPlan = useMemo(() => plans.find(p => p.name === 'BUSINESS'), [plans]);
    const freePlan = useMemo(() => plans.find(p => p.name === 'FREE'), [plans]);
    const isOnBusiness = (features?.plan_name ?? 'FREE') === 'BUSINESS';
    const totalCost = (businessPlan?.price_cents ?? 2900) * selectedMonths;
    const canAffordWithCredits = creditBalance >= totalCost;

    const reloadSub = useCallback(async () => {
        const [featRes, credRes] = await Promise.all([
            getMyFeatures().catch(() => null),
            getCreditBalance().catch(() => null),
        ]);
        if (featRes?.success) setFeatures(featRes.data?.features || null);
        if (credRes?.success) setCreditBalance(credRes.data?.balance ?? 0);
    }, []);

    const handleSubscribe = async () => {
        if (!isLoggedIn) { 
            router.push('/login?redirect=/abo'); 
            return; 
        }
        if (subscribing || !canAffordWithCredits) return;

        setSubscribing(true);
        const toastId = toast.loading('Abonnement wird aktiviert...');
        try {
            const res = await subscribeToPlan('BUSINESS', 'CREDIT', selectedMonths);
            if (res?.success) {
                toast.success(`Business-Tarif für ${selectedMonths} Monat${selectedMonths > 1 ? 'e' : ''} erfolgreich aktiviert!`, { id: toastId });
                setUpgradeModalOpen(false);
                await reloadSub();
            } else {
                toast.error(res?.error || 'Fehler beim Aktivieren des Tarifs.', { id: toastId });
            }
        } catch {
            toast.error('Netzwerkfehler. Bitte versuche es später erneut.', { id: toastId });
        } finally {
            setSubscribing(false);
        }
    };

    const handleAutofillCancelBank = () => {
        setCancelVerification({
            account_holder: 'MAXIMILIAN SCHNEIDER',
            iban_or_card: 'DE89 3704 0044 0532 0130 00',
            reason: 'Bedarf vorübergehend gedeckt',
            confirm_clawback: true,
        });
        toast.success('Hinterlegte Test-Bankdaten übernommen!');
    };

    const handleCancel = async (e) => {
        if (e) e.preventDefault();
        const trimmedHolder = cancelVerification.account_holder?.trim();
        const trimmedIban = cancelVerification.iban_or_card?.trim();

        if (!trimmedHolder || !trimmedIban) {
            toast.error('Bitte gib den Namen des Kontoinhabers und deine IBAN / Kartennummer zur Bestätigung ein.');
            return;
        }
        if (!cancelVerification.confirm_clawback) {
            toast.error('Bitte bestätige die Rückbuchung der ungenutzten Credits durch Aktivieren der Checkbox.');
            return;
        }

        setCancelling(true);
        const toastId = toast.loading('Kündigung wird verarbeitet...');
        try {
            const res = await cancelSubscription({
                account_holder: trimmedHolder,
                iban_or_card: trimmedIban,
                reason: cancelVerification.reason || 'Bedarf vorübergehend gedeckt',
                confirm_clawback: true,
            });

            if (res?.success) {
                toast.success(res.message || 'Abonnement erfolgreich gekündigt.', { id: toastId, duration: 5000 });
                setCancelModalOpen(false);
                setCancelVerification({
                    account_holder: '',
                    iban_or_card: '',
                    reason: 'Bedarf vorübergehend gedeckt',
                    confirm_clawback: false,
                });
                await reloadSub();
            } else {
                toast.error(res?.error || 'Kündigung fehlgeschlagen.', { id: toastId });
            }
        } catch {
            toast.error('Netzwerkfehler. Bitte versuche es später erneut.', { id: toastId });
        } finally {
            setCancelling(false);
        }
    };

    const openUpgrade = useCallback(() => {
        isLoggedIn ? router.push('/abo/kasse') : router.push('/login?redirect=/abo/kasse');
    }, [isLoggedIn, router]);

    const toggleFaq = useCallback((idx) => {
        setOpenFaqIndex(prev => prev === idx ? null : idx);
    }, []);

    return (
        <div className="min-h-screen bg-sand font-sans text-charcoal overflow-x-hidden">

            {/* ── 1. HERO SECTION (Identical cinematic style as Inserate & other pages) ── */}
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[38vh] sm:min-h-[44vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 shadow-xl border border-forest/10 will-change-transform"
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
                            alt="Campuna Business - Tarife für gewerbliche Campinganbieter"
                            className="w-full h-full object-cover"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </motion.div>
                    {/* Deep luxurious multi-layered gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/85" />
                </div>

                {/* Floating Glow Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.18),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-14 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-3"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                        Campuna Business
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 drop-shadow-xl leading-tight"
                    >
                        Mehr Sichtbarkeit.<br />
                        <span className="text-gold font-bold">Mehr Buchungen.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="font-sans text-xs sm:text-sm md:text-base lg:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md mb-6"
                    >
                        Das Business-Abo gibt deinem Unternehmen den professionellen Auftritt, den es verdient — mit unbegrenzten Inseraten, Firmen-Cover, Business-Tools und exklusiver Spotlight-Berechtigung.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                    >
                        {isLoggedIn && isOnBusiness ? (
                            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full px-7 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider">
                                <Check className="w-4 h-4 text-gold" />
                                <span>Business-Tarif aktiv</span>
                            </span>
                        ) : (
                            <button
                                id="btn-hero-upgrade"
                                onClick={openUpgrade}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold px-8 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/25 hover:scale-105 active:scale-95 cursor-pointer group"
                            >
                                <span>Jetzt upgraden</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                            </button>
                        )}
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Breadcrumbs below Hero ── */}
            <ScrollSectionWrapper delay={0.05}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                    <Breadcrumbs
                        items={[{ label: 'Business-Tarife' }]}
                        variant="light"
                    />
                </div>
            </ScrollSectionWrapper>

            {/* ── Main Layout Container (7xl) ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">

                {/* ── Status Banner (Only for Active Business Subscribers) ── */}
                {isLoggedIn && isOnBusiness && (
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-forest/5 border-forest/20">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-forest/15 text-forest">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-bold text-charcoal font-sans text-sm">
                                    Business-Tarif aktiv
                                </h2>
                                <p className="text-xs text-charcoal/55 font-sans mt-0.5">
                                    Läuft bis: {features?.expires_at ? new Date(features.expires_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Unbegrenzt'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setCancelModalOpen(true)}
                                    className="text-xs text-red-400 hover:text-red-600 font-sans underline underline-offset-2 transition-colors cursor-pointer"
                                >
                                    Abo kündigen
                                </button>
                            </div>
                        </div>
                    </ScrollSectionWrapper>
                )}

                {/* ── Pricing Cards ── */}
                <ScrollSectionWrapper delay={0.08}>
                    <section>
                        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                PREISE & TARIFE
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                Einfache, transparente Preise
                            </h2>
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                                Starte kostenlos. Wachse mit dem Business-Abo für maximale Reichweite.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">

                            {/* FREE Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45 }}
                                className={`bg-white rounded-3xl border p-6 sm:p-8 flex flex-col justify-between shadow-sm will-change-transform ${!isOnBusiness && isLoggedIn ? 'border-charcoal/25 ring-2 ring-charcoal/10' : 'border-beige/70'}`}
                            >
                                <div>
                                    <div className="mb-6">
                                        <span className="inline-flex items-center gap-1.5 bg-charcoal/5 text-charcoal/70 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
                                            Free
                                        </span>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl sm:text-5xl font-black text-charcoal font-sans">0 €</span>
                                            <span className="text-charcoal/40 font-sans text-sm mb-1.5">/ Monat</span>
                                        </div>
                                        <p className="text-charcoal/60 font-sans text-xs sm:text-sm leading-relaxed font-light">
                                            Für Privatpersonen und gewerbliche Anbieter mit bis zu 10 Inseraten.
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {[
                                            'Bis zu 10 aktive Inserate gleichzeitig',
                                            'Basis-Statistiken (Aufrufe & Merkliste)',
                                            'Firmenprofil (500 Zeichen)',
                                            'Credits mit Empfehlungen (500-1.000 CC)',
                                            'Normale Sichtbarkeit',
                                            'Kontaktformular für Kunden',
                                            'Eigener Referral-Code'
                                        ].map((f) => (
                                            <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-charcoal/75 font-sans">
                                                <Check className="w-4 h-4 text-charcoal/35 shrink-0" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className={`w-full py-3.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans ${!isOnBusiness && isLoggedIn ? 'bg-charcoal/5 text-charcoal/50' : 'bg-sand text-charcoal/50'}`}>
                                    {!isOnBusiness && isLoggedIn ? 'Aktueller Tarif' : 'Kostenlos starten'}
                                </div>
                            </motion.div>

                            {/* BUSINESS Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: 0.1 }}
                                className="bg-gradient-to-br from-forest via-forest to-[#143d29] rounded-3xl border border-forest/30 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-forest/20 will-change-transform"
                            >
                                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

                                <div>
                                    <div className="relative mb-6">
                                        <span className="inline-flex items-center gap-1.5 bg-gold/20 text-gold rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 border border-gold/30">
                                            <Sparkles className="w-3.5 h-3.5" /> Business
                                        </span>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl sm:text-5xl font-black text-white font-sans">29 €</span>
                                            <span className="text-white/60 font-sans text-sm mb-1.5">/ Monat</span>
                                        </div>
                                        <p className="text-white/70 font-sans text-xs sm:text-sm leading-relaxed font-light">
                                            Für Unternehmen und professionelle Anbieter rund ums Camping.
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-8 relative">
                                        {[
                                            'Unbegrenzt aktive Inserate',
                                            'Echtzeit Performance-Analytics & Live-Telemetrie',
                                            'Professionelles Firmen-Cover & Logo',
                                            'Erweitertes Firmenprofil (1.000 Zeichen)',
                                            'Präsenz im Verzeichnis für Camping-Anbieter',
                                            'Lead-Management & Interessenten-Tracking',
                                            'Monatlich flexibel kündbar',
                                        ].map((f) => (
                                            <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90 font-sans">
                                                <Check className="w-4 h-4 text-gold shrink-0" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {isOnBusiness && isLoggedIn ? (
                                    <div className="relative w-full py-3.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans bg-white/10 text-white border border-white/20">
                                        Aktueller Tarif
                                    </div>
                                ) : (
                                    <button
                                        id="btn-card-upgrade"
                                        onClick={openUpgrade}
                                        className="relative w-full py-4 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest transition-all duration-300 shadow-lg hover:shadow-gold/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                                    >
                                        <span>{isLoggedIn ? 'Jetzt upgraden' : 'Registrieren & upgraden'}</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                    </button>
                                )}
                            </motion.div>
                        </div>
                    </section>
                </ScrollSectionWrapper>

                {/* ── Feature Comparison Section ── */}
                <ScrollSectionWrapper delay={0.08}>
                    <section>
                        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                FEATURE-ÜBERSICHT
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                Detaillierter Vergleich
                            </h2>
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                                Alle Funktionen und Leistungen auf einen Blick
                            </p>
                        </div>

                        {/* ── Mobile View: Single Unified Comparison Card (md:hidden) ── */}
                        <div className="md:hidden bg-white rounded-3xl border border-beige/60 shadow-sm overflow-hidden divide-y divide-beige/40">
                            {FEATURE_ROWS.map((row) => {
                                const { key, label, icon: Icon, format, freeValue, bizValue } = row;
                                const freeVal = freeValue !== undefined ? freeValue : (freePlan ? freePlan[key] : undefined);
                                const bizVal = bizValue !== undefined ? bizValue : (businessPlan ? businessPlan[key] : undefined);
                                return (
                                    <div key={key} className="p-4 space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-forest/5 flex items-center justify-center text-forest shrink-0">
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-xs sm:text-sm text-charcoal font-sans">{label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Free Box */}
                                            <div className="bg-sand/30 rounded-xl p-2.5 flex flex-col items-center justify-center text-center border border-beige/40">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal/50 mb-0.5 font-sans">
                                                    Free
                                                </span>
                                                <div className="text-xs font-semibold text-charcoal font-sans min-h-[22px] flex items-center justify-center">
                                                    {freeVal !== undefined && <FeatureCheck value={freeVal} format={format} />}
                                                </div>
                                            </div>
                                            {/* Business Box */}
                                            <div className="bg-forest/[0.04] rounded-xl p-2.5 flex flex-col items-center justify-center text-center border border-forest/20">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-forest font-sans">
                                                        Business
                                                    </span>
                                                    <Sparkles className="w-2.5 h-2.5 text-gold" />
                                                </div>
                                                <div className="text-xs font-bold text-forest font-sans min-h-[22px] flex items-center justify-center">
                                                    {bizVal !== undefined && <FeatureCheck value={bizVal} format={format} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Desktop View: Full Comparison Table (hidden md:block) ── */}
                        <div className="hidden md:block w-full bg-white rounded-3xl border border-beige/60 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-sand/50 border-b border-beige/60">
                                <div className="p-5 text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans flex items-center">
                                    Feature
                                </div>
                                <div className="p-5 text-center text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans border-l border-beige/40 flex items-center justify-center">
                                    Free
                                </div>
                                <div className="p-5 text-center text-xs font-bold text-forest uppercase tracking-wider font-sans border-l border-beige/40 bg-forest/[0.04] flex items-center justify-center">
                                    Business
                                </div>
                            </div>

                            {FEATURE_ROWS.map((row, i) => {
                                const { key, label, icon: Icon, format, freeValue, bizValue } = row;
                                const freeVal = freeValue !== undefined ? freeValue : (freePlan ? freePlan[key] : undefined);
                                const bizVal = bizValue !== undefined ? bizValue : (businessPlan ? businessPlan[key] : undefined);
                                return (
                                    <div
                                        key={key}
                                        className={`grid grid-cols-[1.4fr_1fr_1fr] ${
                                            i < FEATURE_ROWS.length - 1 ? 'border-b border-beige/40' : ''
                                        } hover:bg-sand/15 transition-colors`}
                                    >
                                        <div className="p-5 flex items-center gap-3 text-sm font-medium text-charcoal font-sans">
                                            <Icon className="w-4 h-4 text-charcoal/40 shrink-0" />
                                            <span className="leading-tight">{label}</span>
                                        </div>
                                        <div className="p-5 flex items-center justify-center border-l border-beige/40 text-center">
                                            {freeVal !== undefined && <FeatureCheck value={freeVal} format={format} />}
                                        </div>
                                        <div className="p-5 flex items-center justify-center border-l border-beige/40 bg-forest/[0.02] text-center">
                                            {bizVal !== undefined && <FeatureCheck value={bizVal} format={format} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </ScrollSectionWrapper>

                {/* ── Testimonials ── */}
                <ScrollSectionWrapper delay={0.08}>
                    <section>
                        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                ERFAHRUNGSBERICHTE
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                Was unsere Kunden sagen
                            </h2>
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                                Echte Erfahrungen von gewerblichen Anbietern auf Campuna
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {TESTIMONIALS.map((t, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08, duration: 0.4 }}
                                    className="bg-white rounded-3xl border border-beige/70 p-6 sm:p-7 space-y-4 shadow-sm hover:shadow-md transition-shadow will-change-transform flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex gap-1 mb-3">
                                            {[0, 1, 2, 3, 4].map((s) => (
                                                <Star key={s} className="w-4 h-4 text-gold fill-gold" />
                                            ))}
                                        </div>
                                        <p className="text-xs sm:text-sm text-charcoal/75 font-sans leading-relaxed italic font-light">
                                            &ldquo;{t.text}&rdquo;
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-beige/40">
                                        <span className="text-xs font-bold text-charcoal font-sans">{t.name}</span>
                                        <span className="text-[10px] text-forest font-bold uppercase tracking-wider bg-forest/10 px-2.5 py-0.5 rounded-full">{t.plan}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </ScrollSectionWrapper>

                {/* ── FAQ ── */}
                <ScrollSectionWrapper delay={0.08}>
                    <section id="faq">
                        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                HÄUFIG GESTELLTE FRAGEN
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest">
                                Alles, was du über Campuna wissen musst
                            </h2>
                            <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                                Du hast Fragen zur Buchung, Vermietung oder den Tarifen? Hier findest du die Antworten.
                            </p>
                        </div>

                        <div className="max-w-5xl mx-auto space-y-4">
                            {FAQ.map((item, idx) => {
                                const isOpen = openFaqIndex === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                                        className={`border rounded-2xl overflow-hidden transition-all duration-300 will-change-transform ${isOpen
                                            ? 'border-gold bg-sand/20 shadow-md'
                                            : 'border-forest/10 bg-white hover:border-forest/30'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                        >
                                            <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                                {item.q}
                                            </span>
                                            <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-gold/10 text-gold' : 'bg-sand text-forest'}`}>
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
                                                    transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                >
                                                    <div className="px-8 md:px-10 pb-6 pt-1 font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line border-t border-forest/5">
                                                        {item.a}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                </ScrollSectionWrapper>

                {/* ── Final CTA (Styled exactly as CTA.jsx) ── */}
                {!isOnBusiness && (
                    <ScrollSectionWrapper delay={0.05}>
                        <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-forest via-forest to-[#143d29] px-8 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-16 shadow-xl border border-white/10 will-change-transform">
                            {/* Subtle background glows */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-black/40 rounded-full blur-3xl pointer-events-none" />

                            {/* Grid Layout splits visual content */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">

                                {/* Left Column: Headline, text and button */}
                                <div className="lg:col-span-8 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
                                    <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                        JETZT DURCHSTARTEN
                                    </span>

                                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                                        Bereit durchzustarten?
                                    </h2>

                                    <p className="font-sans text-sm sm:text-base text-sand/85 font-light leading-relaxed max-w-xl pb-2">
                                        Schließe dich hunderten von Campinganbietern an, die mit Campuna Business wachsen und mehr Reichweite erzielen.
                                    </p>

                                    <button
                                        id="btn-cta-upgrade"
                                        onClick={openUpgrade}
                                        className="relative w-full max-w-[320px] sm:w-[320px] bg-gradient-to-r from-gold to-beige hover:brightness-110 text-forest font-sans font-bold py-4 px-6 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] sm:text-[12px] uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] mx-auto lg:mx-0 cursor-pointer group"
                                    >
                                        <span>{isLoggedIn ? 'Jetzt upgraden' : 'Jetzt kostenlos starten'}</span>
                                        <ArrowRight className="w-4 h-4 absolute right-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>

                                {/* Right Column: Decorative Graphic */}
                                <div className="relative lg:col-span-4 hidden lg:block items-center justify-center lg:justify-end">
                                    <div className="absolute top-0 -right-20 flex items-center justify-center text-gold/30 transform -rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                        <Sparkles className="w-48 h-48 stroke-[1.2]" />
                                    </div>
                                    <div className="absolute bottom-4 -right-10 flex items-center justify-center text-gold/20 transform -rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                        <Crown className="w-36 h-36 stroke-[1.2]" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </ScrollSectionWrapper>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MODALS — AnimatePresence + motion.div
            ══════════════════════════════════════════════════════════════ */}

            {/* ── Upgrade Modal ── */}
            <AnimatePresence>
                {upgradeModalOpen && (
                    <motion.div
                        key="upgrade-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            onClick={() => !subscribing && setUpgradeModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            key="upgrade-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-beige/60 relative z-10 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-forest to-forest/90 px-6 pt-8 pb-6 relative overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />
                                <button
                                    onClick={() => !subscribing && setUpgradeModalOpen(false)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-3 relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-gold" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white font-sans">Business aktivieren</h3>
                                        <p className="text-xs text-white/60 font-sans">Wähle deinen Zeitraum</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Duration Selector */}
                                <div>
                                    <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans block mb-3">Laufzeit</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 3, 6].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMonths(m)}
                                                className={`py-3 rounded-xl text-sm font-bold font-sans transition-all border ${selectedMonths === m
                                                    ? 'bg-forest text-sand border-forest'
                                                    : 'bg-sand text-charcoal/60 border-beige hover:border-forest/30'}`}
                                            >
                                                {m} {m === 1 ? 'Monat' : 'Monate'}
                                                {m > 1 && <span className="block text-[9px] opacity-60 mt-0.5">€{(29 * m).toFixed(0)} gesamt</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cost Summary */}
                                <div className="bg-sand/50 border border-beige/60 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-charcoal/60 font-sans">Business × {selectedMonths} {selectedMonths === 1 ? 'Monat' : 'Monate'}</span>
                                        <span className="font-bold text-charcoal font-sans">€{(29 * selectedMonths).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-t border-beige/50 pt-2">
                                        <span className="text-charcoal/60 font-sans flex items-center gap-1.5">
                                            <img src="/coin.png" className="w-4 h-4" alt="CC" />
                                            Credits erforderlich
                                        </span>
                                        <span className={`font-bold font-sans ${canAffordWithCredits ? 'text-forest' : 'text-red-500'}`}>
                                            {totalCost} CC
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-charcoal/40 font-sans">
                                        <span>Dein Guthaben</span>
                                        <span className={creditBalance >= totalCost ? 'text-forest' : 'text-red-400'}>
                                            {creditBalance} CC {creditBalance < totalCost && `(fehlen ${totalCost - creditBalance} CC)`}
                                        </span>
                                    </div>
                                </div>

                                {!canAffordWithCredits && (
                                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 font-sans leading-relaxed">
                                            Nicht genug Campuna Credits vorhanden. Bitte wähle eine kürzere Laufzeit oder lade dein Guthaben auf.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2 pt-1">
                                    <button
                                        id="btn-modal-subscribe-credit"
                                        onClick={handleSubscribe}
                                        disabled={subscribing || !canAffordWithCredits}
                                        className="w-full flex items-center justify-center gap-2 bg-forest hover:bg-forest/90 disabled:opacity-40 text-sand py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm font-sans"
                                    >
                                        {subscribing
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird aktiviert…</>
                                            : <><img src="/coin.png" className="w-4 h-4" alt="CC" /> Mit Credits bezahlen</>}
                                    </button>

                                    <button
                                        onClick={() => setUpgradeModalOpen(false)}
                                        disabled={subscribing}
                                        className="w-full py-3 rounded-xl text-xs font-semibold text-charcoal/50 hover:text-charcoal hover:bg-sand transition-all font-sans"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Cancel Confirmation Modal ── */}
            <AnimatePresence>
                {cancelModalOpen && (
                    <motion.div
                        key="cancel-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            onClick={() => !cancelling && setCancelModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            key="cancel-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige/60 relative z-10 p-6 sm:p-8 text-left space-y-5 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-beige/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-charcoal font-sans">Abonnement kündigen</h3>
                                        <p className="text-[11px] text-charcoal/50 font-sans">Sicherheitsverifikation & Bestätigung</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAutofillCancelBank}
                                    className="text-[10px] font-bold text-forest bg-forest/5 hover:bg-forest/15 border border-forest/20 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 font-sans cursor-pointer"
                                    title="Füllt die hinterlegten Test-Bankdaten automatisch ein"
                                >
                                    <Sparkles className="w-3 h-3 text-gold-dark" />
                                    <span>Test-Bankdaten</span>
                                </button>
                            </div>

                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-sans space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                    <img src="/coin.png" className="w-4 h-4" alt="CC" />
                                    <span>Rückbuchung ungenutzter Credits</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Ungenutzte Bonus-Credits aus deinem 1.000 Campuna Credits Willkommenspaket (bis zu {Math.min(1000, Number(creditBalance) || 0).toLocaleString('de-DE')} CC) werden bei der Kündigung automatisch vom CC-Konto abgezogen.
                                </p>
                            </div>

                            {/* Bank Verification Form */}
                            <div className="space-y-3 bg-sand/30 border border-beige/80 rounded-2xl p-4">
                                <div className="flex items-center gap-2 pb-1 border-b border-beige/60 text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans">
                                    <Shield className="w-3.5 h-3.5 text-forest" />
                                    <span>Hinterlegte Zahlungsdaten bestätigen</span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-charcoal/60 uppercase tracking-wider font-sans">
                                        Name des Kontoinhabers / Karteninhabers *
                                    </label>
                                    <input
                                        type="text"
                                        value={cancelVerification.account_holder}
                                        onChange={e => setCancelVerification(v => ({ ...v, account_holder: e.target.value }))}
                                        placeholder="z.B. Maximilian Schneider"
                                        className="w-full bg-white border border-beige rounded-xl px-3.5 py-2 text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-charcoal/60 uppercase tracking-wider font-sans">
                                        IBAN oder Kartennummer (Zahlungsmittel) *
                                    </label>
                                    <input
                                        type="text"
                                        value={cancelVerification.iban_or_card}
                                        onChange={e => setCancelVerification(v => ({ ...v, iban_or_card: e.target.value }))}
                                        placeholder="z.B. DE89 3704 0044 0532 0130 00 oder 4242 4242 4242 4242"
                                        className="w-full bg-white border border-beige rounded-xl px-3.5 py-2 text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                        required
                                    />
                                </div>

                                <label className="flex items-start gap-2.5 pt-1 text-[11px] text-charcoal/70 font-sans cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cancelVerification.confirm_clawback}
                                        onChange={e => setCancelVerification(v => ({ ...v, confirm_clawback: e.target.checked }))}
                                        className="mt-0.5 rounded text-forest focus:ring-forest cursor-pointer"
                                    />
                                    <span>
                                        Ich bestätige die Kündigung und die Rückbuchung ungenutzter Credits.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setCancelModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-sand hover:bg-beige text-charcoal text-xs font-bold uppercase tracking-wider transition-all font-sans cursor-pointer"
                                >
                                    Abo behalten
                                </button>
                                <button
                                    id="btn-confirm-cancel"
                                    onClick={handleCancel}
                                    disabled={cancelling || !cancelVerification.account_holder?.trim() || !cancelVerification.iban_or_card?.trim() || !cancelVerification.confirm_clawback}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all font-sans cursor-pointer"
                                >
                                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Jetzt kündigen'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
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
    AlertTriangle, ChevronDown, Shield, Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/app/components/Breadcrumbs';

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_ROWS = [
    { key: 'listing_limit', label: 'Aktive Anzeigen', icon: FileText, format: (v) => v === -1 ? 'Unbegrenzt' : `${v} Anzeigen` },
    { key: 'description_limit', label: 'Beschreibungslänge', icon: FileText, format: (v) => `${v} Zeichen` },
    {
        key: 'credits',
        label: 'Campuna Credits',
        icon: Sparkles,
        freeValue: '0 CC (100 CC mit Referral)',
        bizValue: '1.000 CC',
    },
    { key: 'has_statistics', label: 'Performance-Statistiken', icon: BarChart2, format: (v) => v },
];

const TESTIMONIALS = [
    { name: 'Camping Müller GmbH', text: 'Mit dem Business-Tarif haben wir unsere Buchungen um 40% gesteigert. Die unbegrenzten Anzeigen machen einen riesigen Unterschied!', plan: 'Business' },
    { name: 'Outdoor Reisen Wagner', text: 'Die Reichweite und die detaillierten Statistiken haben uns geholfen, stetig neue Kunden zu gewinnen. Absolut empfehlenswert.', plan: 'Business' },
    { name: 'CamperWorld Bayern', text: 'Die Statistiken zeigen uns genau, welche Anzeigen funktionieren. Ein echter Gamechanger für unser Marketing.', plan: 'Business' },
];

const FAQ = [
    { q: 'Wie bezahle ich mit Campuna Credits?', a: 'Du kannst Campuna Credits (CC) sammeln durch Empfehlungen und Aktionen. 2900 CC entsprechen einem Monat Business-Tarif (€29). Wenn du genug Credits hast, wird das Abonnement direkt von deinem Guthaben abgezogen.' },
    { q: 'Was passiert mit meinen Anzeigen, wenn ich kündige?', a: 'Deine bestehenden Anzeigen bleiben erhalten, du kannst jedoch keine neuen mehr erstellen, sobald du das kostenlose Limit von 3 Anzeigen erreicht hast.' },
    { q: 'Kann ich monatlich kündigen?', a: 'Ja! Du kannst dein Business-Abonnement jederzeit kündigen. Es läuft noch bis zum Ende des gebuchten Zeitraums.' },
    { q: 'Gibt es einen Rabatt für mehrere Monate?', a: 'Wir arbeiten gerade an Jahresplänen. Melde dich für unseren Newsletter an, um als Erster informiert zu werden.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureCheck = ({ value, format }) => {
    if (typeof value === 'boolean') {
        return value
            ? <span className="flex items-center justify-center w-6 h-6 rounded-full bg-forest/10 mx-auto"><Check className="w-3.5 h-3.5 text-forest" /></span>
            : <span className="flex items-center justify-center w-6 h-6 rounded-full bg-charcoal/5 mx-auto"><X className="w-3.5 h-3.5 text-charcoal/25" /></span>;
    }
    return <span className="text-sm font-semibold text-charcoal font-sans text-center">{format ? format(value) : value}</span>;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AboPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    const [plans, setPlans] = useState([]);
    const [features, setFeatures] = useState(null);
    const [creditBalance, setCreditBalance] = useState(0);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;
        const load = async () => {
            setLoading(true);
            try {
                const plansRes = await getPlans();
                if (plansRes.success) setPlans(plansRes.data.plans || []);

                if (isLoggedIn) {
                    const [featRes, credRes] = await Promise.all([
                        getMyFeatures().catch(() => null),
                        getCreditBalance().catch(() => null),
                    ]);
                    if (featRes?.success) setFeatures(featRes.data.features);
                    if (credRes?.success) setCreditBalance(credRes.data.balance ?? 0);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [mounted, isLoggedIn]);

    const businessPlan = plans.find(p => p.name === 'BUSINESS');
    const freePlan = plans.find(p => p.name === 'FREE');
    const isOnBusiness = (features?.plan_name ?? 'FREE') === 'BUSINESS';
    const totalCost = (businessPlan?.price_cents ?? 2900) * selectedMonths;
    const canAffordWithCredits = creditBalance >= totalCost;

    const reloadSub = async () => {
        const [featRes, credRes] = await Promise.all([
            getMyFeatures().catch(() => null),
            getCreditBalance().catch(() => null),
        ]);
        if (featRes?.success) setFeatures(featRes.data.features);
        if (credRes?.success) setCreditBalance(credRes.data.balance ?? 0);
    };

    const handleSubscribe = async () => {
        if (!isLoggedIn) { router.push('/login'); return; }
        setSubscribing(true);
        const toastId = toast.loading('Abonnement wird aktiviert...');
        try {
            const res = await subscribeToPlan('BUSINESS', 'CREDIT', selectedMonths);
            if (res.success) {
                toast.success(`Business-Tarif für ${selectedMonths} Monat${selectedMonths > 1 ? 'e' : ''} aktiviert!`, { id: toastId });
                setUpgradeModalOpen(false);
                await reloadSub();
            } else {
                toast.error(res.error || 'Fehler beim Aktivieren.', { id: toastId });
            }
        } catch {
            toast.error('Netzwerkfehler. Bitte erneut versuchen.', { id: toastId });
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
        if (!cancelVerification.account_holder?.trim() || !cancelVerification.iban_or_card?.trim()) {
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
            const res = await cancelSubscription(cancelVerification);
            if (res.success) {
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
                toast.error(res.error || 'Kündigung fehlgeschlagen.', { id: toastId });
            }
        } catch {
            toast.error('Netzwerkfehler.', { id: toastId });
        } finally {
            setCancelling(false);
        }
    };

    const openUpgrade = () => isLoggedIn ? router.push('/abo/kasse') : router.push('/login?redirect=/abo/kasse');

    // ── Loading / SSR guard ──
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest to-forest/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-sand animate-spin" />
                    </div>
                    <p className="text-charcoal/50 font-sans text-sm">Wird geladen…</p>
                </div>
            </div>
        );
    }

    // ── Render ──
    return (
        <div className="min-h-screen bg-sand">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-forest via-forest/95 to-charcoal pt-32 pb-24">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
                    <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block mb-4">
                        Campuna Business
                    </span>
                    <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-6">
                        Mehr Sichtbarkeit.<br />
                        <span className="text-gold font-medium">Mehr Buchungen.</span>
                    </h1>
                    <p className="font-sans text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                        Das Business-Abo gibt deinem Unternehmen den professionellen Auftritt, den es verdient — mit unbegrenzten Anzeigen und detaillierten Statistiken.
                    </p>

                    <div>
                        {isLoggedIn && isOnBusiness ? (
                            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-full px-6 py-3 text-sm font-semibold">
                                <Check className="w-4 h-4 text-gold" />
                                Business-Tarif aktiv
                            </span>
                        ) : (
                            <button
                                id="btn-hero-upgrade"
                                onClick={openUpgrade}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black px-8 py-4 rounded-full text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/25 hover:scale-105 active:scale-95 cursor-pointer group"
                            >
                                <span>Jetzt upgraden</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Breadcrumbs below Hero ── */}
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Business-Tarife' }]}
                    variant="light"
                />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 space-y-20">

                {/* ── Status Banner ── */}
                {isLoggedIn && (
                    <div className={`rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isOnBusiness ? 'bg-forest/5 border-forest/20' : 'bg-gold/5 border-gold/20'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isOnBusiness ? 'bg-forest/15 text-forest' : 'bg-gold/20 text-gold-dark'}`}>
                            {isOnBusiness ? <Sparkles className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-charcoal font-sans text-sm">
                                {isOnBusiness ? 'Business-Tarif aktiv' : 'Du nutzt aktuell den kostenlosen Tarif'}
                            </h2>
                            <p className="text-xs text-charcoal/55 font-sans mt-0.5">
                                {isOnBusiness
                                    ? `Läuft bis: ${features?.expires_at ? new Date(features.expires_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Unbegrenzt'}`
                                    : `Du hast ${features?.listing_limit ?? 3} Anzeigen-Slots. Upgrade auf Business für unbegrenzte Anzeigen.`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-white border border-beige rounded-full px-3 py-1.5">
                                <img src="/coin.png" className="w-4 h-4" alt="CC" />
                                <span className="text-xs font-bold text-gold-dark font-sans">{creditBalance} CC</span>
                            </div>
                            {isOnBusiness && (
                                <button
                                    onClick={() => setCancelModalOpen(true)}
                                    className="text-xs text-red-400 hover:text-red-600 font-sans underline underline-offset-2 transition-colors cursor-pointer"
                                >
                                    Kündigen
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Pricing Cards ── */}
                <section>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Preise & Tarife
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                            Einfache, transparente Preise
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Starte kostenlos. Wachse mit Business.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

                        {/* FREE Card */}
                        <div className={`bg-white rounded-3xl border p-8 flex flex-col ${!isOnBusiness && isLoggedIn ? 'border-charcoal/20 ring-2 ring-charcoal/10' : 'border-beige/60'}`}>
                            <div className="mb-6">
                                <span className="inline-flex items-center gap-1.5 bg-charcoal/5 text-charcoal/60 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
                                    Free
                                </span>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-black text-charcoal font-sans">€0</span>
                                    <span className="text-charcoal/40 font-sans text-sm mb-2">/ Monat</span>
                                </div>
                                <p className="text-charcoal/55 font-sans text-sm leading-relaxed">
                                    Für Privatpersonen und kleine Anbieter. Ideal zum Einstieg.
                                </p>
                            </div>

                            <ul className="space-y-3 flex-1 mb-8">
                                {['Bis zu 3 aktive Anzeigen', 'Firmenprofil (500 Zeichen)', '0 CC Startguthaben (100 CC with Referral)', 'Normale Sichtbarkeit', 'Kontaktformular für Kunden', 'Eigener Referral-Code'].map((f) => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-charcoal/70 font-sans">
                                        <Check className="w-4 h-4 text-charcoal/30 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className={`w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans ${!isOnBusiness && isLoggedIn ? 'bg-charcoal/5 text-charcoal/40' : 'bg-sand text-charcoal/40'}`}>
                                {!isOnBusiness && isLoggedIn ? 'Aktueller Tarif' : 'Kostenlos starten'}
                            </div>
                        </div>

                        {/* BUSINESS Card */}
                        <div className="bg-gradient-to-br from-forest to-forest/90 rounded-3xl border border-forest p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-forest/20">
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

                            <div className="relative mb-6">
                                <span className="inline-flex items-center gap-1.5 bg-gold/20 text-gold rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 border border-gold/30">
                                    <Sparkles className="w-3 h-3" /> Business
                                </span>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-black text-white font-sans">€29</span>
                                    <span className="text-white/50 font-sans text-sm mb-2">/ Monat</span>
                                </div>
                                <p className="text-white/60 font-sans text-sm leading-relaxed">
                                    Für professionelle Campinganbieter, die wachsen wollen.
                                </p>
                            </div>

                            <ul className="space-y-3 flex-1 mb-8 relative">
                                {[
                                    'Unbegrenzte Anzeigen',
                                    '+ 1.000 Campuna Credits Willkommensbonus',
                                    'Erweitertes Firmenprofil (1000 Zeichen)',
                                    'Performance-Statistiken & Analytics',
                                ].map((f) => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/85 font-sans">
                                        <Check className="w-4 h-4 text-gold shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {isOnBusiness && isLoggedIn ? (
                                <div className="relative w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans bg-white/10 text-white border border-white/20">
                                    Aktueller Tarif
                                </div>
                            ) : (
                                <button
                                    id="btn-card-upgrade"
                                    onClick={openUpgrade}
                                    className="relative w-full py-3.5 rounded-xl text-center text-xs font-black uppercase tracking-wider font-sans bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-gold/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                                >
                                    <span>{isLoggedIn ? 'Jetzt upgraden' : 'Registrieren & upgraden'}</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Feature Table ── */}
                <section>
                    <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                        <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Feature-Übersicht
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                            Detaillierter Vergleich
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Alle Features auf einen Blick
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-beige/60 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-3 bg-sand/50 border-b border-beige/60">
                            <div className="p-5 text-xs font-bold text-charcoal/40 uppercase tracking-widest font-sans">Feature</div>
                            <div className="p-5 text-center text-xs font-bold text-charcoal/40 uppercase tracking-widest font-sans border-l border-beige/40">Free</div>
                            <div className="p-5 text-center text-xs font-bold text-forest uppercase tracking-widest font-sans border-l border-beige/40">Business</div>
                        </div>

                        {FEATURE_ROWS.map((row, i) => {
                            const { key, label, icon: Icon, format, freeValue, bizValue } = row;
                            const freeVal = freeValue !== undefined ? freeValue : (freePlan ? freePlan[key] : undefined);
                            const bizVal = bizValue !== undefined ? bizValue : (businessPlan ? businessPlan[key] : undefined);
                            return (
                                <div key={key} className={`grid grid-cols-3 ${i < FEATURE_ROWS.length - 1 ? 'border-b border-beige/40' : ''}`}>
                                    <div className="p-5 flex items-center gap-2.5 text-sm font-medium text-charcoal font-sans">
                                        <Icon className="w-4 h-4 text-charcoal/30 shrink-0" />
                                        {label}
                                    </div>
                                    <div className="p-5 flex items-center justify-center border-l border-beige/40">
                                        {freeVal !== undefined && <FeatureCheck value={freeVal} format={format} />}
                                    </div>
                                    <div className="p-5 flex items-center justify-center border-l border-beige/40 bg-forest/[0.02]">
                                        {bizVal !== undefined && <FeatureCheck value={bizVal} format={format} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Testimonials ── */}
                <section>
                    <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                        <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Erfahrungsberichte
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                            Was unsere Kunden sagen
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Echte Erfahrungen von Business-Nutzern
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-beige/60 p-6 space-y-4">
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4].map((s) => (
                                        <Star key={s} className="w-4 h-4 text-gold" style={{ fill: 'currentColor' }} />
                                    ))}
                                </div>
                                <p className="text-sm text-charcoal/70 font-sans leading-relaxed italic">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-beige/40">
                                    <span className="text-xs font-bold text-charcoal font-sans">{t.name}</span>
                                    <span className="text-[10px] text-forest font-bold uppercase tracking-wider bg-forest/10 px-2 py-0.5 rounded-full">{t.plan}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section id="faq">
                    <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                        <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Häufig gestellte Fragen
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-forest">
                            Alles, was du über Campuna wissen musst
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
                            Du hast Fragen zur Buchung, Vermietung oder den Tarifen? Hier findest du die Antworten auf die wichtigsten Fragen.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {FAQ.map((item, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <motion.div
                                    key={idx}
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
                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                        className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                                    >
                                        <span className="font-display text-base sm:text-lg font-bold text-forest leading-snug">
                                            {item.q}
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
                                                <div className="px-8 md:px-10 pb-6 font-sans text-sm text-charcoal/70 leading-relaxed font-light whitespace-pre-line">
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

                {/* ── Final CTA ── */}
                {!isOnBusiness && (
                    <section className="bg-gradient-to-br from-forest to-charcoal rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
                        <div className="relative max-w-3xl mx-auto space-y-3">
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                Jetzt durchstarten
                            </span>
                            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                                Bereit durchzustarten?
                            </h2>
                            <p className="font-sans text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed font-light pb-4">
                                Schließe dich hunderten von Campinganbietern an, die mit Campuna Business wachsen.
                            </p>
                            <button
                                id="btn-cta-upgrade"
                                onClick={openUpgrade}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black px-10 py-4 rounded-full text-sm uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-gold/30 hover:scale-105 active:scale-95 cursor-pointer group"
                            >
                                <span>{isLoggedIn ? 'Jetzt upgraden' : 'Kostenlos registrieren'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MODALS — AnimatePresence + motion.div only used here
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
                                    className="flex-1 py-3 rounded-xl bg-sand hover:bg-beige text-charcoal text-xs font-bold uppercase tracking-wider transition-all font-sans"
                                >
                                    Abo behalten
                                </button>
                                <button
                                    id="btn-confirm-cancel"
                                    onClick={handleCancel}
                                    disabled={cancelling || !cancelVerification.account_holder?.trim() || !cancelVerification.iban_or_card?.trim() || !cancelVerification.confirm_clawback}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all font-sans"
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

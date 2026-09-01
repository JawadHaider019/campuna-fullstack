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
    BarChart2, Upload, Loader2, Crown, ArrowRight,
    AlertTriangle, ChevronDown, Image,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_ROWS = [
    { key: 'listing_limit', label: 'Aktive Anzeigen', icon: FileText, format: (v) => v === -1 ? 'Unbegrenzt' : `${v} Anzeigen` },
    { key: 'description_limit', label: 'Beschreibungslänge', icon: FileText, format: (v) => `${v} Zeichen` },
    { key: 'has_cover_image', label: 'Hintergrundbild', icon: Image, format: (v) => v },
    { key: 'has_spotlight', label: 'Spotlight-Sichtbarkeit', icon: Star, format: (v) => v },
    { key: 'has_statistics', label: 'Performance-Statistiken', icon: BarChart2, format: (v) => v },
    { key: 'has_csv_import', label: 'CSV / API-Import', icon: Upload, format: (v) => v },
];

const TESTIMONIALS = [
    { name: 'Camping Müller GmbH', text: 'Mit dem Business-Tarif haben wir unsere Buchungen um 40% gesteigert. Die Spotlight-Platzierung macht einen riesigen Unterschied!', plan: 'Business' },
    { name: 'Outdoor Reisen Wagner', text: 'Der Import-Export von Anzeigen spart uns jeden Monat Stunden an Arbeit. Absolut empfehlenswert.', plan: 'Business' },
    { name: 'CamperWorld Bayern', text: 'Die Statistiken zeigen uns genau, welche Anzeigen funktionieren. Ein echter Gamechanger für unser Marketing.', plan: 'Business' },
];

const FAQ = [
    { q: 'Wie bezahle ich mit Campuna Credits?', a: 'Du kannst Campuna Credits (CC) sammeln durch Empfehlungen und Aktionen. 2900 CC entsprechen einem Monat Business-Tarif (€29). Wenn du genug Credits hast, wird das Abonnement direkt von deinem Guthaben abgezogen.' },
    { q: 'Was passiert mit meinen Anzeigen, wenn ich kündige?', a: 'Deine bestehenden Anzeigen bleiben erhalten, du kannst jedoch keine neuen mehr erstellen, sobald du das kostenlose Limit von 3 Anzeigen erreicht hast.' },
    { q: 'Kann ich monatlich kündigen?', a: 'Ja! Du kannst dein Business-Abonnement jederzeit kündigen. Es läuft noch bis zum Ende des gebuchten Zeitraums.' },
    { q: 'Gibt es einen Rabatt für mehrere Monate?', a: 'Wir arbeiten gerade an Jahresplänen. Melde dich für unseren Newsletter an, um als Erster informiert zu werden.' },
    { q: 'Ist das Hintergrundbild für alle sichtbar?', a: 'Ja! Dein Cover-Bild wird auf deinem öffentlichen Unternehmensprofil angezeigt und gibt deiner Marke eine professionelle Präsenz auf Campuna.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureCheck = ({ value, format }) => {
    if (typeof value === 'boolean') {
        return value
            ? <span className="flex items-center justify-center w-6 h-6 rounded-full bg-forest/10 mx-auto"><Check className="w-3.5 h-3.5 text-forest" /></span>
            : <span className="flex items-center justify-center w-6 h-6 rounded-full bg-charcoal/5 mx-auto"><X className="w-3.5 h-3.5 text-charcoal/25" /></span>;
    }
    return <span className="text-sm font-semibold text-charcoal font-sans">{format(value)}</span>;
};

// CSS accordion — no AnimatePresence/motion inside .map()
const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-beige/60 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-sand/30 transition-colors"
            >
                <span className="text-sm font-semibold text-charcoal font-sans pr-4">{q}</span>
                <span
                    className="shrink-0 transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <ChevronDown className="w-4 h-4 text-charcoal/40" />
                </span>
            </button>
            <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{ maxHeight: open ? '300px' : '0px', opacity: open ? 1 : 0 }}
            >
                <p className="px-5 pb-4 pt-1 text-sm text-charcoal/60 font-sans leading-relaxed border-t border-beige/40 bg-sand/20">
                    {a}
                </p>
            </div>
        </div>
    );
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
    const [selectedMonths, setSelectedMonths] = useState(1);

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
                toast.success(`Business-Tarif für ${selectedMonths} Monat${selectedMonths > 1 ? 'e' : ''} aktiviert! 🎉`, { id: toastId });
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

    const handleCancel = async () => {
        setCancelling(true);
        const toastId = toast.loading('Abonnement wird gekündigt...');
        try {
            const res = await cancelSubscription();
            if (res.success) {
                toast.success('Abonnement erfolgreich gekündigt.', { id: toastId });
                setCancelModalOpen(false);
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

    const openUpgrade = () => isLoggedIn ? setUpgradeModalOpen(true) : router.push('/login');

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

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <span className="inline-flex items-center gap-2 bg-gold/20 text-gold border border-gold/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6">
                        <Crown className="w-3.5 h-3.5" />
                        Campuna Business
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-sans leading-tight mb-4">
                        Mehr Sichtbarkeit.<br />
                        <span className="text-gold">Mehr Buchungen.</span>
                    </h1>
                    <p className="text-lg text-white/60 font-sans max-w-xl mx-auto mb-8 leading-relaxed">
                        Das Business-Abo gibt deinem Unternehmen den professionellen Auftritt, den es verdient — mit unbegrenzten Anzeigen, Spotlight und detaillierten Statistiken.
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
                                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-charcoal font-bold px-8 py-4 rounded-full text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Jetzt upgraden
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">

                {/* ── Status Banner ── */}
                {isLoggedIn && (
                    <div className={`rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isOnBusiness ? 'bg-forest/5 border-forest/20' : 'bg-gold/5 border-gold/20'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isOnBusiness ? 'bg-forest/15 text-forest' : 'bg-gold/20 text-gold-dark'}`}>
                            {isOnBusiness ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-charcoal font-sans text-sm">
                                {isOnBusiness ? '✓ Business-Tarif aktiv' : 'Du nutzt aktuell den kostenlosen Tarif'}
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
                                    className="text-xs text-red-400 hover:text-red-600 font-sans underline underline-offset-2 transition-colors"
                                >
                                    Kündigen
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Pricing Cards ── */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-charcoal font-sans mb-3">
                            Einfache, transparente Preise
                        </h2>
                        <p className="text-charcoal/55 font-sans">Starte kostenlos. Wachse mit Business.</p>
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
                                {['Bis zu 3 aktive Anzeigen', 'Basis-Firmenprofil', 'Normale Sichtbarkeit', 'Kontaktformular für Kunden', 'Eigener Referral-Code'].map((f) => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-charcoal/70 font-sans">
                                        <Check className="w-4 h-4 text-charcoal/30 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className={`w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans ${!isOnBusiness && isLoggedIn ? 'bg-charcoal/5 text-charcoal/40' : 'bg-sand text-charcoal/40'}`}>
                                {!isOnBusiness && isLoggedIn ? '✓ Aktueller Tarif' : 'Kostenlos starten'}
                            </div>
                        </div>

                        {/* BUSINESS Card */}
                        <div className="bg-gradient-to-br from-forest to-forest/90 rounded-3xl border border-forest p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-forest/20">
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

                            <div className="relative mb-6">
                                <span className="inline-flex items-center gap-1.5 bg-gold/20 text-gold rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 border border-gold/30">
                                    <Crown className="w-3 h-3" /> Business
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
                                    'Erweitertes Firmenprofil (1000 Zeichen)',
                                    'Custom Cover-Bild / Banner',
                                    'Spotlight-Sichtbarkeit im Marktplatz',
                                    'Performance-Statistiken & Analytics',
                                    'CSV / API-Import für Anzeigen',
                                ].map((f) => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/85 font-sans">
                                        <Check className="w-4 h-4 text-gold shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {isOnBusiness && isLoggedIn ? (
                                <div className="relative w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans bg-white/10 text-white border border-white/20">
                                    ✓ Aktueller Tarif
                                </div>
                            ) : (
                                <button
                                    id="btn-card-upgrade"
                                    onClick={openUpgrade}
                                    className="relative w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider font-sans bg-gold hover:bg-gold-dark text-charcoal transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
                                >
                                    {isLoggedIn ? 'Jetzt upgraden' : 'Registrieren & upgraden'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Feature Table ── */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-charcoal font-sans mb-2">Detaillierter Vergleich</h2>
                        <p className="text-charcoal/50 font-sans text-sm">Alle Features auf einen Blick</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-beige/60 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-3 bg-sand/50 border-b border-beige/60">
                            <div className="p-5 text-xs font-bold text-charcoal/40 uppercase tracking-widest font-sans">Feature</div>
                            <div className="p-5 text-center text-xs font-bold text-charcoal/40 uppercase tracking-widest font-sans border-l border-beige/40">Free</div>
                            <div className="p-5 text-center text-xs font-bold text-forest uppercase tracking-widest font-sans border-l border-beige/40">Business</div>
                        </div>

                        {FEATURE_ROWS.map(({ key, label, icon: Icon, format }, i) => {
                            const freeVal = freePlan ? freePlan[key] : undefined;
                            const bizVal = businessPlan ? businessPlan[key] : undefined;
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

                {/* ── Credits Section ── */}
                {isLoggedIn && !isOnBusiness && (
                    <section className="bg-gradient-to-r from-gold/10 to-gold/5 rounded-3xl border border-gold/25 p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center shrink-0">
                                <img src="/coin.png" className="w-9 h-9" alt="CC" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-charcoal font-sans mb-1">Mit Campuna Credits bezahlen</h3>
                                <p className="text-sm text-charcoal/60 font-sans leading-relaxed">
                                    Du hast <strong className="text-gold-dark">{creditBalance} CC</strong>. Business kostet <strong>2900 CC / Monat</strong>.{' '}
                                    {canAffordWithCredits
                                        ? 'Du hast genug Credits für ein Upgrade!'
                                        : `Dir fehlen noch ${2900 - creditBalance} CC.`}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                                <button
                                    id="btn-credits-upgrade"
                                    onClick={() => setUpgradeModalOpen(true)}
                                    disabled={!canAffordWithCredits}
                                    className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark disabled:opacity-40 disabled:hover:bg-gold text-charcoal font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-wider transition-all"
                                >
                                    <img src="/coin.png" className="w-4 h-4" alt="CC" />
                                    Mit Credits upgraden
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Testimonials ── */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-charcoal font-sans mb-2">Was unsere Kunden sagen</h2>
                        <p className="text-charcoal/50 font-sans text-sm">Echte Erfahrungen von Business-Nutzern</p>
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
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black text-charcoal font-sans mb-2">Häufige Fragen</h2>
                        <p className="text-charcoal/50 font-sans text-sm">Alles, was du über das Business-Abo wissen musst</p>
                    </div>
                    <div className="max-w-2xl mx-auto space-y-3">
                        {FAQ.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                    </div>
                </section>

                {/* ── Final CTA ── */}
                {!isOnBusiness && (
                    <section className="bg-gradient-to-br from-forest to-charcoal rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-black text-white font-sans mb-4">
                                Bereit durchzustarten?
                            </h2>
                            <p className="text-white/60 font-sans mb-8 max-w-md mx-auto leading-relaxed">
                                Schließe dich hunderten von Campinganbietern an, die mit Campuna Business wachsen.
                            </p>
                            <button
                                id="btn-cta-upgrade"
                                onClick={openUpgrade}
                                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-charcoal font-bold px-10 py-4 rounded-full text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-105"
                            >
                                {isLoggedIn ? 'Jetzt upgraden' : 'Kostenlos registrieren'}
                                <ArrowRight className="w-4 h-4" />
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
                    <div key="upgrade-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="upgrade-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                                        <Crown className="w-6 h-6 text-gold" />
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
                    </div>
                )}
            </AnimatePresence>

            {/* ── Cancel Confirmation Modal ── */}
            <AnimatePresence>
                {cancelModalOpen && (
                    <div key="cancel-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="cancel-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !cancelling && setCancelModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            key="cancel-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-beige/60 relative z-10 p-7 text-center space-y-5"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-7 h-7 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-charcoal font-sans mb-2">Abonnement kündigen?</h3>
                                <p className="text-sm text-charcoal/60 font-sans leading-relaxed">
                                    Du verlierst den Zugriff auf alle Business-Features. Deine Anzeigen bleiben erhalten, aber du kannst keine neuen mehr über das Limit hinaus erstellen.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCancelModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-sand hover:bg-beige text-charcoal text-xs font-bold uppercase tracking-wider transition-all font-sans"
                                >
                                    Behalten
                                </button>
                                <button
                                    id="btn-confirm-cancel"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all font-sans"
                                >
                                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Ja, kündigen'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    getMyProfile,
    subscribeToPlan,
    getCreditBalance,
    createStripeCheckoutSession,
    verifyStripeSession,
} from '@/api/profile';
import { toast } from 'react-hot-toast';
import {
    CreditCard, Building2, Shield, Check, Lock, Sparkles,
    Crown, ArrowRight, ArrowLeft, Loader2, AlertCircle, MapPin
} from 'lucide-react';

export default function CheckoutBillingPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form & Plan State
    const [selectedDuration, setSelectedDuration] = useState(1); // 1, 3, or 12 months
    const [paymentMethod, setPaymentMethod] = useState('STRIPE'); // 'STRIPE' | 'CREDIT'
    const [creditBalance, setCreditBalance] = useState(0);

    // Billing Details
    const [billingDetails, setBillingDetails] = useState({
        company_name: '',
        first_name: '',
        last_name: '',
        street: '',
        zip: '',
        city: '',
        country: 'Deutschland',
        vat_id: '',
    });

    const [agreedToTerms, setAgreedToTerms] = useState(true);

    // Processing & Success State
    const [isProcessing, setIsProcessing] = useState(false);
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isLoggedIn) {
            router.push('/login?redirect=/abo/kasse');
            return;
        }

        const loadInitial = async () => {
            setLoading(true);
            try {
                const [profRes, credRes] = await Promise.all([
                    getMyProfile().catch(() => null),
                    getCreditBalance().catch(() => null),
                ]);

                if (profRes?.success) {
                    const p = profRes.data.profile || {};
                    setBillingDetails({
                        company_name: p.company_name || '',
                        first_name: p.first_name || '',
                        last_name: p.last_name || '',
                        street: p.company_address || '',
                        zip: '',
                        city: p.location || '',
                        country: 'Deutschland',
                        vat_id: p.vat_id || '',
                    });
                }

                if (credRes?.success) {
                    setCreditBalance(credRes.data?.balance ?? 0);
                }

                // Check for Stripe redirect return
                if (typeof window !== 'undefined') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const sessionId = urlParams.get('session_id');
                    const isStripeSuccess = urlParams.get('stripe_success') === 'true' || urlParams.get('success') === 'true';
                    const isCancelled = urlParams.get('cancelled') === 'true';

                    if (isCancelled) {
                        toast.error('Zahlungsvorgang über Stripe wurde abgebrochen.');
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else if (sessionId && isStripeSuccess) {
                        try {
                            const verifyRes = await verifyStripeSession(sessionId);
                            if (verifyRes.success && verifyRes.data?.paid) {
                                const details = verifyRes.data.details || {};
                                setSuccessData({
                                    invoice_number: details.invoiceNumber || 'INV-' + Math.floor(100000 + Math.random() * 900000),
                                    plan_name: 'Campuna Business',
                                    credits_granted: 1000,
                                    new_balance: (credRes?.data?.balance ?? 0) + 1000,
                                    amount_paid: '29,00 €',
                                    duration: '1 Monat',
                                    payment_method: 'Stripe (Kreditkarte / SEPA / Apple Pay)',
                                    billing_name: (profRes?.data?.profile?.first_name ? `${profRes.data.profile.first_name} ${profRes.data.profile.last_name}` : 'Campuna Partner'),
                                    company_name: profRes?.data?.profile?.company_name || '',
                                });
                                toast.success('🎉 Stripe-Zahlung erfolgreich! Business-Tarif ist jetzt aktiv.');
                            }
                        } catch (err) {
                            console.error('Verify error:', err);
                        }
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitial();
    }, [mounted, isLoggedIn, router]);

    // Pricing calculation
    const getPricing = () => {
        if (selectedDuration === 12) {
            return {
                baseGross: 290.00,
                net: (290 / 1.19).toFixed(2),
                vat: (290 - 290 / 1.19).toFixed(2),
                savings: '58,00 € Ersparnis (2 Monate gratis)',
                monthlyEquiv: '24,17 €',
                creditsRequired: 29000,
            };
        }
        if (selectedDuration === 3) {
            return {
                baseGross: 79.00,
                net: (79 / 1.19).toFixed(2),
                vat: (79 - 79 / 1.19).toFixed(2),
                savings: '8,00 € Ersparnis',
                monthlyEquiv: '26,33 €',
                creditsRequired: 7900,
            };
        }
        return {
            baseGross: 29.00,
            net: (29 / 1.19).toFixed(2),
            vat: (29 - 29 / 1.19).toFixed(2),
            savings: null,
            monthlyEquiv: '29,00 €',
        };
    };

    const priceInfo = getPricing();

    // Submit Checkout
    const handleSubmitCheckout = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error('Bitte akzeptiere die AGB und Datenschutzbestimmungen.');
            return;
        }

        // Stripe Checkout is the exclusive payment method for Business Subscriptions
        setIsProcessing(true);
        const toastId = toast.loading('Stripe Checkout wird vorbereitet...');
        try {
            const res = await createStripeCheckoutSession({
                type: 'SUBSCRIPTION',
                plan_name: 'BUSINESS',
                duration_months: selectedDuration,
                return_url: window.location.origin,
            });

            if (res.success && res.data?.url) {
                toast.success('Weiterleitung zu Stripe...', { id: toastId });
                window.location.href = res.data.url;
            } else {
                toast.error(res.error || res.data?.error || 'Fehler beim Starten von Stripe Checkout.', { id: toastId });
                setIsProcessing(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Stripe Checkout konnte nicht gestartet werden.', { id: toastId });
            setIsProcessing(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest to-forest/60 flex items-center justify-center shadow-lg">
                        <Loader2 className="w-8 h-8 text-sand animate-spin" />
                    </div>
                    <p className="text-charcoal/60 font-sans text-sm font-medium">Kassensystem wird geladen…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-20">
            {/* Top Navigation / Breadcrumb */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
                <button
                    onClick={() => router.push('/abo')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-charcoal/60 hover:text-forest uppercase tracking-wider transition-colors mb-4 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zu den Tarifen
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-beige/60 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-gold/20 text-gold-dark border border-gold/30 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                            <Lock className="w-3 h-3 text-gold-dark" />
                            Sichere 256-Bit SSL Kasse & Stripe Zahlungsabwicklung
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-charcoal font-sans">
                            Business-Abonnement abschließen
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── LEFT COLUMN: Form Inputs (7/12) ── */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Step 1: Duration Selector */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-beige/70 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-forest text-sand flex items-center justify-center font-bold text-xs font-sans">1</span>
                                    <h2 className="text-lg font-bold text-charcoal font-sans">Laufzeit wählen</h2>
                                </div>
                                <span className="text-xs text-charcoal/50 font-sans">Jederzeit monatlich kündbar</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { months: 1, label: '1 Monat', price: '29,00 €', sub: '/ Monat', badge: null },
                                    { months: 3, label: '3 Monate', price: '79,00 €', sub: '26,33 € / Mon.', badge: 'Spart 8 €' },
                                    { months: 12, label: '12 Monate', price: '290,00 €', sub: '24,17 € / Mon.', badge: '2 Mon. gratis' },
                                ].map(item => (
                                    <div
                                        key={item.months}
                                        onClick={() => setSelectedDuration(item.months)}
                                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${selectedDuration === item.months
                                            ? 'border-forest bg-forest/5 shadow-md ring-2 ring-forest/10'
                                            : 'border-beige hover:border-forest/40 bg-sand/20'}`}
                                    >
                                        {item.badge && (
                                            <span className="absolute -top-2.5 right-3 bg-gold text-charcoal font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                                {item.badge}
                                            </span>
                                        )}
                                        <div>
                                            <span className="text-xs font-bold text-charcoal/70 uppercase tracking-wider block mb-1 font-sans">{item.label}</span>
                                            <span className="text-xl font-black text-forest font-sans block">{item.price}</span>
                                        </div>
                                        <span className="text-[11px] text-charcoal/50 font-sans mt-2 block">{item.sub}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Billing Address */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-beige/70 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-forest text-sand flex items-center justify-center font-bold text-xs font-sans">2</span>
                                    <h2 className="text-lg font-bold text-charcoal font-sans">Rechnungsadresse</h2>
                                </div>
                                <span className="text-xs text-charcoal/50 font-sans flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-gold-dark" /> Für ordentliche Rechnung
                                </span>
                            </div>

                            <div className="space-y-3.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Firmenname (optional)</label>
                                        <div className="relative">
                                            <Building2 className="w-4 h-4 text-charcoal/35 absolute left-3.5 top-3" />
                                            <input
                                                type="text"
                                                value={billingDetails.company_name}
                                                onChange={e => setBillingDetails(d => ({ ...d, company_name: e.target.value }))}
                                                placeholder="z.B. AlpenCamp Bayern GmbH"
                                                className="w-full bg-sand/40 border border-beige rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">USt-IdNr. (optional)</label>
                                        <input
                                            type="text"
                                            value={billingDetails.vat_id}
                                            onChange={e => setBillingDetails(d => ({ ...d, vat_id: e.target.value }))}
                                            placeholder="z.B. DE123456789"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Vorname</label>
                                        <input
                                            type="text"
                                            value={billingDetails.first_name}
                                            onChange={e => setBillingDetails(d => ({ ...d, first_name: e.target.value }))}
                                            placeholder="Vorname"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Nachname</label>
                                        <input
                                            type="text"
                                            value={billingDetails.last_name}
                                            onChange={e => setBillingDetails(d => ({ ...d, last_name: e.target.value }))}
                                            placeholder="Nachname"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Straße & Hausnummer</label>
                                    <input
                                        type="text"
                                        value={billingDetails.street}
                                        onChange={e => setBillingDetails(d => ({ ...d, street: e.target.value }))}
                                        placeholder="z.B. Campingstraße 12"
                                        className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">PLZ</label>
                                        <input
                                            type="text"
                                            value={billingDetails.zip}
                                            onChange={e => setBillingDetails(d => ({ ...d, zip: e.target.value }))}
                                            placeholder="80331"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Stadt</label>
                                        <input
                                            type="text"
                                            value={billingDetails.city}
                                            onChange={e => setBillingDetails(d => ({ ...d, city: e.target.value }))}
                                            placeholder="München"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Payment Method */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-beige/70 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-forest text-sand flex items-center justify-center font-bold text-xs font-sans">3</span>
                                    <h2 className="text-lg font-bold text-charcoal font-sans">Zahlungsabwicklung via Stripe</h2>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                                    <Shield className="w-4 h-4" /> 256-Bit SSL Verschlüsselt
                                </div>
                            </div>

                            {/* Stripe Info Card */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#635BFF]/10 via-white to-sand/40 border border-[#635BFF]/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#635BFF] text-white">
                                            Stripe Checkout
                                        </span>
                                        <span className="text-xs font-bold text-charcoal font-sans">Sichere & zertifizierte Zahlung</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-charcoal/60">
                                        <CreditCard className="w-4 h-4 text-[#635BFF]" />
                                    </div>
                                </div>
                                <p className="text-xs text-charcoal/70 leading-relaxed font-sans">
                                    Abonnements werden sicher über die offizielle Stripe Checkout-Seite abgerechnet. Du kannst bequem per <strong>Kreditkarte (Visa, Mastercard, American Express)</strong>, <strong>SEPA-Lastschrift</strong>, <strong>Apple Pay</strong> oder <strong>Google Pay</strong> bezahlen.
                                </p>
                                <div className="pt-2 border-t border-beige/60 flex flex-wrap items-center gap-2 text-[11px] text-charcoal/60">
                                    <span className="px-2 py-0.5 bg-white border border-beige rounded-md font-medium">💳 Kreditkarte</span>
                                    <span className="px-2 py-0.5 bg-white border border-beige rounded-md font-medium">🏦 SEPA-Lastschrift</span>
                                    <span className="px-2 py-0.5 bg-white border border-beige rounded-md font-medium">🍎 Apple Pay</span>
                                    <span className="px-2 py-0.5 bg-white border border-beige rounded-md font-medium">📱 Google Pay</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN: Order Summary & Checkout Action (5/12) ── */}
                    <div className="lg:col-span-5 space-y-6 sticky top-28">

                        {/* Order Summary Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-forest/20 relative overflow-hidden">
                            {/* Decorative gradient glow */}
                            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gold/15 blur-2xl pointer-events-none" />

                            <div className="pb-5 border-b border-beige/60">
                                <span className="inline-flex items-center gap-1.5 bg-forest text-sand rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                                    <Crown className="w-3 h-3 text-gold" /> Bestellübersicht
                                </span>
                                <h3 className="text-2xl font-black text-charcoal font-sans">
                                    Campuna Business
                                </h3>
                                <p className="text-xs text-charcoal/50 font-sans mt-0.5">
                                    Professionelles Firmenprofil, Lead-Analytics & Business-Tools
                                </p>
                            </div>

                            {/* Features list */}
                            <ul className="space-y-2 py-4 pb-5 border-b border-beige/60 text-xs font-sans text-charcoal/75">
                                {[
                                    'Bis zu 25 Inserate inklusive (weitere auf Anfrage)',
                                    'Maximale Sichtbarkeit für alle deine Inserate',
                                    'Echtzeit Performance-Analytics & Cockpit-Telemetrie',
                                    'Professionelles Firmen-Cover & Logo',
                                    'Erweitertes Firmenprofil (1.000 Zeichen)',
                                    'Präsenz im Verzeichnis für Camping-Anbieter',
                                    'Monatlich flexibel kündbar',
                                ].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-forest shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Price Breakdown */}
                            <div className="py-4 space-y-2 text-xs font-sans">
                                <div className="flex justify-between text-charcoal/60">
                                    <span>Laufzeit</span>
                                    <span className="font-bold text-charcoal">{selectedDuration === 1 ? '1 Monat' : `${selectedDuration} Monate`}</span>
                                </div>
                                <div className="flex justify-between text-charcoal/60">
                                    <span>Nettobetrag</span>
                                    <span>{priceInfo.net.replace('.', ',')} €</span>
                                </div>
                                <div className="flex justify-between text-charcoal/60">
                                    <span>19% MwSt.</span>
                                    <span>{priceInfo.vat.replace('.', ',')} €</span>
                                </div>
                                {priceInfo.savings && (
                                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        <span>Rabatt</span>
                                        <span>{priceInfo.savings}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-beige/80 flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-charcoal uppercase">Gesamtbetrag (Brutto)</span>
                                    <span className="text-2xl font-black text-forest">{priceInfo.baseGross.toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="pt-2 pb-4">
                                <label className="flex items-start gap-2.5 text-[11px] text-charcoal/60 font-sans cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="mt-0.5 rounded text-forest focus:ring-forest cursor-pointer"
                                    />
                                    <span>
                                        Ich akzeptiere die <a href="#" className="underline text-charcoal/80">AGB</a> und habe die <a href="#" className="underline text-charcoal/80">Datenschutzbestimmungen</a> zur Kenntnis genommen.
                                    </span>
                                </label>
                            </div>

                            {/* Action Button */}
                            <button
                                type="submit"
                                id="btn-submit-order"
                                disabled={isProcessing || (paymentMethod === 'CREDIT' && creditBalance < priceInfo.creditsRequired)}
                                className={`w-full py-4 px-6 rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 ${
                                    paymentMethod === 'STRIPE'
                                        ? 'bg-[#635BFF] hover:bg-[#534be8] text-white'
                                        : 'bg-forest hover:bg-forest/90 text-sand'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Wird verarbeitet…</span>
                                    </>
                                ) : paymentMethod === 'STRIPE' ? (
                                    <>
                                        <span>Sicher mit Stripe bezahlen</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                ) : (
                                    <>
                                        <span>Mit Campuna Credits bezahlen</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>

                            <div className="mt-4 pt-4 border-t border-beige/60 flex items-center justify-center gap-4 text-[10px] text-charcoal/40 font-sans uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-gold-dark" /> Stripe SSL 256-Bit</span>
                                <span>•</span>
                                <span>DSGVO Konform</span>
                                <span>•</span>
                                <span>Sofort aktiv</span>
                            </div>
                        </div>

                    </div>

                </form>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUCCESS & INVOICE CELEBRATION MODAL
            ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {successData && (
                    <motion.div
                        key="success-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige/60 relative z-10 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-forest via-forest/95 to-charcoal px-7 pt-8 pb-7 text-white text-center relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gold/20 blur-2xl" />
                                <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Crown className="w-8 h-8 text-gold" />
                                </div>
                                <span className="inline-block bg-gold/25 text-gold border border-gold/40 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">
                                    Aktivierung Erfolgreich
                                </span>
                                <h3 className="text-2xl md:text-3xl font-black font-sans">
                                    Willkommen bei Campuna Business!
                                </h3>
                                <p className="text-white/70 font-sans text-xs mt-1">
                                    Dein Konto wurde erfolgreich auf den Business-Tarif umgestellt.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-7 space-y-5">
                                {/* Credit Bonus Box */}
                                <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-forest/5 border border-gold/40 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src="/coin.png" className="w-10 h-10 drop-shadow" alt="CC" />
                                        <div>
                                            <span className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wider font-sans block">Gutgeschriebener Bonus</span>
                                            <span className="text-xl font-black text-gold-dark font-sans">+{(Number(successData?.credits_granted) || 1000).toLocaleString('de-DE')} CC</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wider font-sans block">Neuer Kontostand</span>
                                        <span className="text-lg font-bold text-forest font-sans">{(Number(successData?.new_balance) || 0).toLocaleString('de-DE')} CC</span>
                                    </div>
                                </div>

                                {/* Invoice Details Card */}
                                <div className="bg-sand/30 border border-beige/70 rounded-2xl p-4 space-y-2 text-xs font-sans">
                                    <div className="flex justify-between items-center pb-2 border-b border-beige/60">
                                        <span className="text-charcoal/60">Rechnungsnummer:</span>
                                        <span className="font-mono font-bold text-charcoal">{successData.invoice_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60">Tarif & Laufzeit:</span>
                                        <span className="font-bold text-charcoal">{successData.plan_name} ({successData.duration})</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60">Bezahlt via:</span>
                                        <span className="font-medium text-charcoal">{successData.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60">Betrag:</span>
                                        <span className="font-bold text-forest">{successData.amount_paid}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60">Rechnungsempfänger:</span>
                                        <span className="font-medium text-charcoal">{successData.company_name || successData.billing_name}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 pt-2">
                                    <button
                                        onClick={() => router.push('/mein-konto')}
                                        className="w-full bg-forest hover:bg-forest/90 text-sand py-3.5 rounded-2xl font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Zu Mein Konto</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => router.push('/anzeige-erstellen')}
                                        className="w-full bg-gold hover:bg-gold-dark text-charcoal py-3.5 rounded-2xl font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Erstes Business-Inserat erstellen</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

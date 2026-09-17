'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    getMyProfile,
    getMySubscription,
    getMyFeatures,
    subscribeToPlan,
    getCreditBalance,
} from '@/api/profile';
import { toast } from 'react-hot-toast';
import {
    CreditCard, Building2, Shield, Check, Lock, Sparkles,
    Crown, ArrowRight, ArrowLeft, Loader2, FileText, CheckCircle2,
    Zap, AlertCircle, Download, Printer, User, MapPin
} from 'lucide-react';

export default function CheckoutBillingPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form & Plan State
    const [selectedDuration, setSelectedDuration] = useState(1); // 1, 3, or 12 months
    const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD'); // 'CREDIT_CARD' | 'SEPA' | 'CREDIT'
    const [creditBalance, setCreditBalance] = useState(0);
    const [userProfile, setUserProfile] = useState(null);

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

    // Payment Details
    const [cardDetails, setCardDetails] = useState({
        card_holder: '',
        card_number: '',
        exp_date: '',
        cvc: '',
    });

    const [sepaDetails, setSepaDetails] = useState({
        account_holder: '',
        iban: '',
        bic: '',
    });

    const [agreedToTerms, setAgreedToTerms] = useState(true);

    // Processing & Success State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
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
                    setUserProfile(p);
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
                    setCardDetails(prev => ({
                        ...prev,
                        card_holder: (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.company_name || 'MAXIMILIAN SCHNEIDER').toUpperCase()
                    }));
                    setSepaDetails(prev => ({
                        ...prev,
                        account_holder: (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.company_name || 'Maximilian Schneider')
                    }));
                }

                if (credRes?.success) {
                    setCreditBalance(credRes.data?.balance ?? 0);
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
            creditsRequired: 2900,
        };
    };

    const priceInfo = getPricing();

    // 1-Click Dummy Data Autofill
    const handleAutofillDummy = () => {
        setBillingDetails({
            company_name: 'AlpenCamp Bayern GmbH',
            first_name: 'Maximilian',
            last_name: 'Schneider',
            street: 'Campingstraße 12a',
            zip: '80331',
            city: 'München',
            country: 'Deutschland',
            vat_id: 'DE314892019',
        });
        setCardDetails({
            card_holder: 'MAXIMILIAN SCHNEIDER',
            card_number: '4242 4242 4242 4242',
            exp_date: '12/28',
            cvc: '123',
        });
        setSepaDetails({
            account_holder: 'Maximilian Schneider',
            iban: 'DE89 3704 0044 0532 0130 00',
            bic: 'GENODEF1M01',
        });
        toast.success('Dummy-Testdaten erfolgreich ausgefüllt!');
    };

    // Format Card Number input with spaces
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardDetails(prev => ({ ...prev, card_number: formatted }));
    };

    // Format Expiration MM/YY
    const handleExpChange = (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 2) {
            val = val.slice(0, 2) + '/' + val.slice(2);
        }
        setCardDetails(prev => ({ ...prev, exp_date: val }));
    };

    // Format IBAN input with spaces
    const handleIbanChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 22);
        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setSepaDetails(prev => ({ ...prev, iban: formatted }));
    };

    // Submit Checkout
    const handleSubmitCheckout = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error('Bitte akzeptiere die AGB und Datenschutzbestimmungen.');
            return;
        }

        // Basic validations
        if (!billingDetails.first_name || !billingDetails.last_name || !billingDetails.street || !billingDetails.zip || !billingDetails.city) {
            toast.error('Bitte fülle alle Pflichtfelder der Rechnungsadresse aus (oder nutze den Test-Autofill).');
            return;
        }

        if (paymentMethod === 'CREDIT_CARD') {
            if (!cardDetails.card_number || cardDetails.card_number.replace(/\s/g, '').length < 16) {
                toast.error('Bitte gib eine gültige 16-stellige Kreditkartennummer ein (z.B. 4242 4242 4242 4242).');
                return;
            }
        } else if (paymentMethod === 'SEPA') {
            if (!sepaDetails.iban || sepaDetails.iban.replace(/\s/g, '').length < 15) {
                toast.error('Bitte gib eine gültige IBAN ein (z.B. DE89 3704 0044 0532 0130 00).');
                return;
            }
        } else if (paymentMethod === 'CREDIT') {
            if (creditBalance < priceInfo.creditsRequired) {
                toast.error(`Nicht genügend Campuna Credits vorhanden. Erforderlich: ${priceInfo.creditsRequired} CC, Verfügbar: ${creditBalance} CC`);
                return;
            }
        }

        setIsProcessing(true);
        setProcessingStep(1);

        try {
            // Step 1: Simulated SSL Handshake & Auth
            await new Promise(r => setTimeout(r, 600));
            setProcessingStep(2);

            // Step 2: API Call
            const payload = {
                plan_name: 'BUSINESS',
                payment_method: paymentMethod,
                duration_months: selectedDuration,
                billing_details: billingDetails,
                payment_details: paymentMethod === 'CREDIT_CARD' ? cardDetails : (paymentMethod === 'SEPA' ? sepaDetails : {}),
            };

            const res = await subscribeToPlan(payload);

            if (res.success) {
                setProcessingStep(3);
                await new Promise(r => setTimeout(r, 500));
                setProcessingStep(4);
                await new Promise(r => setTimeout(r, 400));

                setSuccessData({
                    invoice_number: res.data?.invoice_number || 'INV-' + Math.floor(100000 + Math.random() * 900000),
                    plan_name: 'Campuna Business',
                    credits_granted: res.data?.credits_granted ?? 1000,
                    new_balance: res.data?.new_balance ?? 0,
                    amount_paid: priceInfo.baseGross.toFixed(2).replace('.', ',') + ' €',
                    duration: selectedDuration === 1 ? '1 Monat' : `${selectedDuration} Monate`,
                    payment_method: paymentMethod === 'CREDIT_CARD' ? 'Kreditkarte' : (paymentMethod === 'SEPA' ? 'SEPA-Lastschrift' : 'Campuna Credits'),
                    billing_name: `${billingDetails.first_name} ${billingDetails.last_name}`,
                    company_name: billingDetails.company_name,
                });
                toast.success('Business-Abonnement erfolgreich aktiviert!');
            } else {
                toast.error(res.error || 'Zahlung fehlgeschlagen. Bitte prüfe deine Eingaben.');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('Netzwerkfehler bei der Kaufabwicklung.');
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
                            Sichere 256-Bit SSL Kasse
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-charcoal font-sans">
                            Business-Abonnement abschließen
                        </h1>
                    </div>

                    {/* Quick 1-Click Autofill Button */}
                    <button
                        type="button"
                        onClick={handleAutofillDummy}
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold/25 to-gold/10 hover:from-gold/35 hover:to-gold/20 border border-gold/40 text-charcoal font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all hover:scale-105 cursor-pointer self-start md:self-auto"
                        title="Füllt automatisch realistische Dummy-Daten für Rechnungsadresse und Zahlung ein"
                    >
                        <Sparkles className="w-4 h-4 text-gold-dark" />
                        <span>Test-Daten einfügen</span>
                    </button>
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
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Vorname *</label>
                                        <input
                                            type="text"
                                            required
                                            value={billingDetails.first_name}
                                            onChange={e => setBillingDetails(d => ({ ...d, first_name: e.target.value }))}
                                            placeholder="Vorname"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Nachname *</label>
                                        <input
                                            type="text"
                                            required
                                            value={billingDetails.last_name}
                                            onChange={e => setBillingDetails(d => ({ ...d, last_name: e.target.value }))}
                                            placeholder="Nachname"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Straße & Hausnummer *</label>
                                    <input
                                        type="text"
                                        required
                                        value={billingDetails.street}
                                        onChange={e => setBillingDetails(d => ({ ...d, street: e.target.value }))}
                                        placeholder="z.B. Musterstraße 42"
                                        className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">PLZ *</label>
                                        <input
                                            type="text"
                                            required
                                            value={billingDetails.zip}
                                            onChange={e => setBillingDetails(d => ({ ...d, zip: e.target.value }))}
                                            placeholder="80331"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Stadt *</label>
                                        <input
                                            type="text"
                                            required
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
                                    <h2 className="text-lg font-bold text-charcoal font-sans">Zahlungsart wählen</h2>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                                    <Shield className="w-4 h-4" /> Verschlüsselt
                                </div>
                            </div>

                            {/* Payment Method Tabs */}
                            <div className="grid grid-cols-3 gap-2 p-1 bg-sand/40 border border-beige rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'CREDIT_CARD'
                                        ? 'bg-forest text-sand shadow-sm'
                                        : 'text-charcoal/60 hover:text-charcoal'}`}
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Kreditkarte</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('SEPA')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'SEPA'
                                        ? 'bg-forest text-sand shadow-sm'
                                        : 'text-charcoal/60 hover:text-charcoal'}`}
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>SEPA Lastschrift</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('CREDIT')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'CREDIT'
                                        ? 'bg-forest text-sand shadow-sm'
                                        : 'text-charcoal/60 hover:text-charcoal'}`}
                                >
                                    <img src="/coin.png" className="w-3.5 h-3.5" alt="CC" />
                                    <span>CC Credits</span>
                                </button>
                            </div>

                            {/* Option A: Credit Card Form + Interactive Visual Card */}
                            {paymentMethod === 'CREDIT_CARD' && (
                                <div className="space-y-4 pt-1">
                                    {/* Visual Card Preview */}
                                    <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl p-5 text-white bg-gradient-to-tr from-charcoal via-forest to-forest/80 shadow-xl overflow-hidden flex flex-col justify-between border border-white/20">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gold/20 blur-xl pointer-events-none" />
                                        <div className="flex justify-between items-center relative z-10">
                                            <span className="font-display font-black text-sm tracking-widest text-gold uppercase">Campuna Pay</span>
                                            <span className="text-xs font-bold tracking-widest text-white/60">TEST CARD</span>
                                        </div>
                                        <div className="relative z-10 space-y-1">
                                            <div className="text-lg font-mono tracking-wider text-white">
                                                {cardDetails.card_number || '•••• •••• •••• ••••'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end relative z-10 text-[10px] uppercase font-sans">
                                            <div>
                                                <span className="text-white/50 block text-[8px]">Inhaber</span>
                                                <span className="font-bold tracking-wider">{cardDetails.card_holder || 'MAX MUSTERMANN'}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/50 block text-[8px]">Gültig bis</span>
                                                <span className="font-bold tracking-wider">{cardDetails.exp_date || 'MM/YY'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card inputs */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Karteninhaber *</label>
                                            <input
                                                type="text"
                                                required
                                                value={cardDetails.card_holder}
                                                onChange={e => setCardDetails(c => ({ ...c, card_holder: e.target.value.toUpperCase() }))}
                                                placeholder="MAX MUSTERMANN"
                                                className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans uppercase"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Kartennummer *</label>
                                            <div className="relative">
                                                <CreditCard className="w-4 h-4 text-charcoal/35 absolute left-3.5 top-3" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={cardDetails.card_number}
                                                    onChange={handleCardNumberChange}
                                                    placeholder="4242 4242 4242 4242"
                                                    className="w-full bg-sand/40 border border-beige rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Ablaufdatum (MM/YY) *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={cardDetails.exp_date}
                                                    onChange={handleExpChange}
                                                    placeholder="12/28"
                                                    className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">CVC / CVV *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={4}
                                                    value={cardDetails.cvc}
                                                    onChange={e => setCardDetails(c => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                                    placeholder="123"
                                                    className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Option B: SEPA Direct Debit */}
                            {paymentMethod === 'SEPA' && (
                                <div className="space-y-3.5 pt-1">
                                    <div className="bg-sand/30 border border-beige/60 rounded-2xl p-4 text-xs text-charcoal/70 leading-relaxed font-sans">
                                        Mit der Angabe deiner Kontodaten ermächtigst du Campuna, Zahlungen von deinem Konto mittels Lastschrift einzuziehen.
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">Kontoinhaber *</label>
                                        <input
                                            type="text"
                                            required
                                            value={sepaDetails.account_holder}
                                            onChange={e => setSepaDetails(s => ({ ...s, account_holder: e.target.value }))}
                                            placeholder="Maximilian Schneider"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">IBAN *</label>
                                        <input
                                            type="text"
                                            required
                                            value={sepaDetails.iban}
                                            onChange={handleIbanChange}
                                            placeholder="DE89 3704 0044 0532 0130 00"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider font-sans">BIC (optional)</label>
                                        <input
                                            type="text"
                                            value={sepaDetails.bic}
                                            onChange={e => setSepaDetails(s => ({ ...s, bic: e.target.value.toUpperCase() }))}
                                            placeholder="GENODEF1M01"
                                            className="w-full bg-sand/40 border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Option C: Campuna Credits */}
                            {paymentMethod === 'CREDIT' && (
                                <div className="space-y-4 pt-1">
                                    <div className="bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src="/coin.png" className="w-10 h-10" alt="CC" />
                                            <div>
                                                <span className="text-xs text-charcoal/60 font-sans block">Dein aktuelles Guthaben:</span>
                                                <span className="text-xl font-black text-gold-dark font-sans">{(Number(creditBalance) || 0).toLocaleString('de-DE')} CC</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-charcoal/60 font-sans block">Erforderlich:</span>
                                            <span className="text-lg font-bold text-forest font-sans">{(Number(priceInfo?.creditsRequired) || 2900).toLocaleString('de-DE')} CC</span>
                                        </div>
                                    </div>

                                    {(Number(creditBalance) || 0) < (Number(priceInfo?.creditsRequired) || 0) ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 font-sans leading-relaxed">
                                                Dein Credit-Guthaben reicht für diese Buchung leider nicht aus (fehlen noch {Math.max(0, (Number(priceInfo?.creditsRequired) || 0) - (Number(creditBalance) || 0)).toLocaleString('de-DE')} CC). Bitte wähle <strong>Kreditkarte</strong> oder <strong>SEPA</strong> für die Zahlung.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                                            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                            <p className="text-xs text-emerald-800 font-sans">
                                                Perfekt! Der Betrag wird automatisch von deinem CC-Konto abgebucht.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    Unbegrenzte Inserate & Performance-Statistiken
                                </p>
                            </div>

                            {/* Welcome Bonus Highlight Badge */}
                            <div className="my-5 bg-gradient-to-r from-amber-500/10 via-gold/15 to-forest/10 border border-gold/40 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gold/25 flex items-center justify-center shrink-0">
                                    <img src="/coin.png" className="w-6 h-6" alt="Bonus CC" />
                                </div>
                                <div>
                                    <span className="text-xs font-black text-gold-dark uppercase tracking-wider block font-sans">
                                        + 1.000 Campuna Credits Willkommensbonus
                                    </span>
                                    <span className="text-[11px] text-charcoal/70 font-sans block leading-tight">
                                        Sofortige Gutschrift auf dein Konto bei Aktivierung!
                                    </span>
                                </div>
                            </div>

                            {/* Features list */}
                            <ul className="space-y-2 pb-5 border-b border-beige/60 text-xs font-sans text-charcoal/75">
                                {[
                                    'Unbegrenzt aktive Inserate',
                                    'Erweitertes Firmenprofil (1.000 Zeichen)',
                                    'Detaillierte Besucher- & Klickstatistiken',
                                    '+ 1.000 Campuna Credits inklusive',
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

                            {/* Submit Button */}
                            <button
                                type="submit"
                                id="btn-submit-order"
                                disabled={isProcessing || (paymentMethod === 'CREDIT' && creditBalance < priceInfo.creditsRequired)}
                                className="w-full bg-forest hover:bg-forest/90 disabled:opacity-50 text-sand py-4 px-6 rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Wird verarbeitet…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Kostenpflichtig abonnieren</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>

                            <div className="mt-4 pt-4 border-t border-beige/60 flex items-center justify-center gap-4 text-[10px] text-charcoal/40 font-sans uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-gold-dark" /> SSL 256-Bit</span>
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
                PROCESSING MODAL
            ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isProcessing && !successData && (
                    <motion.div
                        key="processing-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-beige/60 relative z-10 p-8 text-center space-y-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center mx-auto text-forest">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-xl font-black text-charcoal font-sans">Abonnement wird eingerichtet</h3>
                                <p className="text-xs text-charcoal/60 font-sans">Bitte schließe das Fenster nicht.</p>
                            </div>

                            {/* Processing steps */}
                            <div className="space-y-2 text-left bg-sand/30 p-4 rounded-2xl border border-beige/60 text-xs font-sans">
                                <div className={`flex items-center gap-2 ${processingStep >= 1 ? 'text-forest font-bold' : 'text-charcoal/40'}`}>
                                    {processingStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>Zahlungsdaten verifizieren</span>
                                </div>
                                <div className={`flex items-center gap-2 ${processingStep >= 2 ? 'text-forest font-bold' : 'text-charcoal/40'}`}>
                                    {processingStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : (processingStep === 2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-charcoal/20" />)}
                                    <span>Rechnung & Beleg generieren</span>
                                </div>
                                <div className={`flex items-center gap-2 ${processingStep >= 3 ? 'text-forest font-bold' : 'text-charcoal/40'}`}>
                                    {processingStep > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : (processingStep === 3 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-charcoal/20" />)}
                                    <span>+ 1.000 Campuna Credits gutschreiben</span>
                                </div>
                                <div className={`flex items-center gap-2 ${processingStep >= 4 ? 'text-forest font-bold' : 'text-charcoal/40'}`}>
                                    {processingStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-charcoal/20" />}
                                    <span>Business-Status aktivieren</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

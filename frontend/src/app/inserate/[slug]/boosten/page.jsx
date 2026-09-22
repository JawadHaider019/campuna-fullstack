'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    CheckCircle2,
    ShieldCheck,
    ArrowLeft,
    CreditCard,
    Building2,
    Sparkles,
    Check,
    Flame,
    TrendingUp,
    Eye,
    Clock,
    AlertCircle,
    ExternalLink,
    ChevronRight,
    MapPin,
    Calendar,
    HelpCircle
} from 'lucide-react';
import { getListingDetail, boostListing, getMyListings } from '@/api/listings';
import { getCreditBalance } from '@/api/profile';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUrl';
import CoinIcon from '@/app/components/CoinIcon';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80';

const BOOST_PACKAGES = [
    {
        days: 7,
        name: 'Basis Push',
        priceEur: '4,99 €',
        costCC: 500,
        eurValue: 4.99,
        tagline: 'Ideal für das Wochenende & schnelle Verkäufe',
        popular: false
    },
    {
        days: 14,
        name: 'Empfehlung',
        priceEur: '7,99 €',
        costCC: 800,
        eurValue: 7.99,
        tagline: '20% Ersparnis – Unser meistgewähltes Paket',
        popular: true,
        badge: 'Bestseller'
    },
    {
        days: 30,
        name: 'Maximaler Erfolg',
        priceEur: '12,99 €',
        costCC: 1300,
        eurValue: 12.99,
        tagline: 'Volle Monatspräsenz & maximale Klicks',
        popular: false,
        badge: 'Bester Wert'
    }
];

export default function BoostListingPage() {
    const params = useParams();
    const router = useRouter();
    const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const currentUser = useAuthStore((state) => state.user);

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listing, setListing] = useState(null);
    const [creditBalance, setCreditBalance] = useState(0);

    // Form state
    const [selectedDays, setSelectedDays] = useState(14);
    const [paymentMethod, setPaymentMethod] = useState('CREDIT'); // 'CREDIT' | 'CREDIT_CARD' | 'SEPA' | 'PAYPAL'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [boostResult, setBoostResult] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load listing details & credit balance
    useEffect(() => {
        if (!mounted || !isLoggedIn) return;

        let active = true;
        setLoading(true);

        const loadData = async () => {
            try {
                // 1. Fetch listing by slug or ID
                const listingRes = await getListingDetail(rawSlug);
                let loadedListing = null;

                if (listingRes?.success && listingRes.data) {
                    loadedListing = listingRes.data.listing || listingRes.data;
                } else {
                    // Fallback: try finding in user's listings
                    const myRes = await getMyListings();
                    if (myRes?.success && Array.isArray(myRes.data?.listings)) {
                        loadedListing = myRes.data.listings.find(
                            l => String(l.id) === String(rawSlug) || l.slug === rawSlug
                        );
                    }
                }

                if (active) {
                    if (loadedListing) {
                        setListing(loadedListing);
                    }
                }

                // 2. Fetch credit balance
                try {
                    const balRes = await getCreditBalance();
                    if (balRes?.success && active) {
                        const bal = Number(balRes.data?.balance || 0);
                        setCreditBalance(bal);
                        if (bal >= 800) {
                            setPaymentMethod('CREDIT');
                        } else {
                            setPaymentMethod('CREDIT_CARD');
                        }
                    }
                } catch {
                    // Ignore balance fetch error
                }
            } catch (err) {
                console.error('Error loading boost page data:', err);
                toast.error('Fehler beim Laden des Inserats.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, [mounted, isLoggedIn, rawSlug]);

    const activePackage = useMemo(() => {
        return BOOST_PACKAGES.find(p => p.days === selectedDays) || BOOST_PACKAGES[1];
    }, [selectedDays]);

    const isOwner = useMemo(() => {
        if (!listing || !currentUser) return false;
        return (
            String(listing.user_id) === String(currentUser.id) ||
            String(listing.owner_user_id) === String(currentUser.id) ||
            String(listing.ownerUserId) === String(currentUser.id) ||
            currentUser.role === 'ADMIN'
        );
    }, [listing, currentUser]);

    const isCurrentlyBoosted = useMemo(() => {
        if (!listing) return false;
        return Boolean(
            listing.is_boosted ||
            (listing.boosted_until && new Date(listing.boosted_until) > new Date())
        );
    }, [listing]);

    const calculatedEndDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + selectedDays);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }, [selectedDays]);

    const hasEnoughCredits = creditBalance >= activePackage.costCC;

    // Handle Boost Execution
    const handleExecuteBoost = async (e) => {
        if (e) e.preventDefault();
        if (!listing?.id) return;

        if (paymentMethod === 'CREDIT' && !hasEnoughCredits) {
            toast.error(`Nicht genügend Credits (${creditBalance} CC vorhanden, ${activePackage.costCC} CC benötigt).`);
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(
            paymentMethod === 'CREDIT'
                ? 'Campuna Credits werden abgebucht...'
                : `Zahlung von ${activePackage.priceEur} wird abgewickelt...`
        );

        try {
            const res = await boostListing(listing.id, selectedDays, paymentMethod);
            if (res?.success || res?.data?.success) {
                toast.success(`🎉 Inserat erfolgreich für ${selectedDays} Tage hervorgehoben!`, { id: toastId });
                setBoostResult(res.data);
                setIsSuccess(true);
                if (res.data?.new_balance !== undefined) {
                    setCreditBalance(res.data.new_balance);
                }
            } else {
                toast.error(res?.error || res?.data?.error || 'Hervorheben fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            console.error('Boost error:', err);
            toast.error(err.response?.data?.error || err.message || 'Hervorheben fehlgeschlagen.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-sand/30 flex items-center justify-center p-4">
                <AuthRequiredModal
                    isOpen={true}
                    onClose={() => router.push(`/inserate/${encodeURIComponent(rawSlug)}`)}
                    context="boost"
                    returnUrl={`/inserate/${encodeURIComponent(rawSlug)}/boosten`}
                />
            </div>
        );
    }

    if (loading) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-[#faf8f3] pt-28 pb-16 px-4">
                <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-forest/10 shadow-sm text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h2 className="text-xl font-bold text-charcoal">Inserat nicht gefunden</h2>
                    <p className="text-xs text-charcoal/60">
                        Das angeforderte Inserat konnte nicht geladen werden oder existiert nicht.
                    </p>
                    <Link
                        href="/mein-konto?tab=inserate"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-sand hover:bg-gold hover:text-forest transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zu meinen Inseraten
                    </Link>
                </div>
            </div>
        );
    }

    // Success Screen
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#faf8f3] pt-24 sm:pt-28 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-6 sm:p-10 border border-beige shadow-xl text-center space-y-6"
                    >
                        {/* Big Confetti Rocket Icon */}
                        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-300/40">
                            <Rocket className="w-10 h-10" />
                            <Sparkles className="w-6 h-6 text-amber-600 absolute -top-2 -right-2 animate-bounce" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                                Erfolgreich aktiviert
                            </span>
                            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-charcoal">
                                Dein Inserat ist jetzt hervorgehoben!
                            </h1>
                            <p className="text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto leading-relaxed font-light">
                                Dein Angebot profitiert ab sofort von maximaler Sichtbarkeit, Top-Platzierung in Suchergebnissen und dem goldenen Hervorgehoben-Badge.
                            </p>
                        </div>

                        {/* Summary Details Card */}
                        <div className="p-4 bg-sand/40 rounded-2xl border border-beige/80 text-left space-y-3 max-w-md mx-auto text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-forest/10">
                                <span className="text-charcoal/60">Inserat:</span>
                                <span className="font-bold text-charcoal truncate max-w-[200px]">{listing.title}</span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-forest/10">
                                <span className="text-charcoal/60">Laufzeit:</span>
                                <span className="font-bold text-forest">{selectedDays} Tage (bis {calculatedEndDate})</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-charcoal/60">Zahlungsart:</span>
                                <span className="font-bold text-charcoal">
                                    {paymentMethod === 'CREDIT' ? `${activePackage.costCC.toLocaleString('de-DE')} CC (Credits)` : activePackage.priceEur}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                            <Link
                                href={`/inserate/${encodeURIComponent(listing.slug || listing.id)}`}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-forest text-sand hover:bg-gold hover:text-forest transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                            >
                                <Eye className="w-4 h-4" />
                                Inserat ansehen
                            </Link>

                            <Link
                                href="/mein-konto?tab=inserate"
                                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-sand/50 text-charcoal hover:bg-sand border border-forest/15 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Zu meinen Inseraten
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    const listingImage = listing.images?.[0]?.url || listing.images?.[0] || listing.image_url || DEFAULT_IMAGE;

    return (
        <div className="min-h-screen bg-[#fcfbf9] font-sans text-charcoal pt-24 sm:pt-28 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* ── Breadcrumbs & Back Navigation ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-forest/5">
                    <Breadcrumbs
                        items={[
                            { label: 'Mein Konto', href: '/mein-konto' },
                            { label: 'Meine Inserate', href: '/mein-konto?tab=inserate' },
                            { label: 'Inserat hervorheben', href: '#' }
                        ]}
                    />

                    <Link
                        href="/mein-konto?tab=inserate"
                        className="inline-flex items-center gap-2 text-xs font-bold text-charcoal/60 hover:text-forest transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Übersicht
                    </Link>
                </div>

                {/* ── Page Header Banner ── */}
                <div className="bg-gradient-to-r from-forest via-[#1e613c] to-forest rounded-3xl p-6 sm:p-10 text-sand shadow-lg border border-gold/30 relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent pointer-events-none" />
                    
                    <div className="max-w-2xl space-y-3 relative z-10">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-gold/20 text-gold px-3 py-1 rounded-full border border-gold/40">
                            <Rocket className="w-3.5 h-3.5 text-gold" />
                            Reichweiten-Turbo & Top-Platzierung
                        </span>

                        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                            Mehr Sichtbarkeit & schnellere Käufer für dein Inserat
                        </h1>

                        <p className="text-xs sm:text-sm text-sand/80 leading-relaxed font-light">
                            Hervorgehobene Inserate werden in der Campuna-Suche und in passenden Kategorien ganz oben ausgespielt und stechen durch das goldene Hervorgehoben-Badge sofort ins Auge.
                        </p>
                    </div>
                </div>

                {/* ── Already Boosted Notice (if active) ── */}
                {isCurrentlyBoosted && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                            <strong className="font-bold">Dieses Inserat ist aktuell bereits aktiv hervorgehoben</strong>
                            {listing.boosted_until && (
                                <span> (bis {new Date(listing.boosted_until).toLocaleDateString('de-DE')})</span>
                            )}. Durch erneutes Buchen verlängerst du die Hervorhebungs-Laufzeit nahtlos.
                        </div>
                    </div>
                )}

                {/* ── Main Two-Column Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── LEFT COLUMN (Steps 1 & 2: Packages & Payment) ── */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Selected Listing Summary Card */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-sm flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-forest/5 overflow-hidden border border-forest/10 shrink-0">
                                <img
                                    src={getImageUrl(listingImage)}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block mb-0.5">
                                    Ausgewähltes Inserat
                                </span>
                                <h3 className="font-display font-bold text-sm sm:text-base text-charcoal truncate">
                                    {listing.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-display font-extrabold text-forest text-sm sm:text-base">
                                        {listing.price ? `${parseFloat(listing.price).toLocaleString('de-DE')} €` : 'Preis auf Anfrage'}
                                    </span>
                                    {listing.location && (
                                        <span className="text-[11px] text-charcoal/60 flex items-center gap-0.5 truncate">
                                            <MapPin className="w-3 h-3 text-forest shrink-0" />
                                            {listing.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* STEP 1: Choose Duration Package */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-beige shadow-sm space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-forest/5">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-full bg-forest text-sand flex items-center justify-center text-xs font-black">
                                        1
                                    </span>
                                    <h2 className="font-display font-bold text-base sm:text-lg text-charcoal">
                                        Laufzeit für die Hervorhebung wählen
                                    </h2>
                                </div>
                                <span className="text-xs text-charcoal/50 font-medium">
                                    {selectedDays} Tage ausgewählt
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {BOOST_PACKAGES.map((pkg) => {
                                    const isSelected = selectedDays === pkg.days;
                                    return (
                                        <div
                                            key={pkg.days}
                                            onClick={() => setSelectedDays(pkg.days)}
                                            className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none text-left ${
                                                isSelected
                                                    ? 'border-forest bg-forest/[0.03] shadow-md ring-2 ring-forest/20'
                                                    : 'border-beige hover:border-forest/30 bg-[#faf8f3] hover:bg-sand/30'
                                            }`}
                                        >
                                            {pkg.badge && (
                                                <span className={`absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs ${
                                                    pkg.popular
                                                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950'
                                                        : 'bg-forest text-sand'
                                                }`}>
                                                    {pkg.badge}
                                                </span>
                                            )}

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-charcoal/70">
                                                        {pkg.name}
                                                    </span>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'border-forest bg-forest text-white' : 'border-charcoal/30'
                                                    }`}>
                                                        {isSelected && <Check className="w-2.5 h-2.5" />}
                                                    </div>
                                                </div>

                                                <span className="font-display text-xl sm:text-2xl font-extrabold text-charcoal block">
                                                    {pkg.days} Tage
                                                </span>

                                                <div className="pt-1">
                                                    <span className="text-base font-extrabold text-forest block font-display">
                                                        {pkg.priceEur}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-gold-dark block">
                                                        oder {pkg.costCC.toLocaleString('de-DE')} CC
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-charcoal/60 leading-tight pt-3 border-t border-forest/5 mt-3">
                                                {pkg.tagline}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP 2: Payment Method Selection */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-beige shadow-sm space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-forest/5">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-full bg-forest text-sand flex items-center justify-center text-xs font-black">
                                        2
                                    </span>
                                    <h2 className="font-display font-bold text-base sm:text-lg text-charcoal">
                                        Zahlungsmethode wählen
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* 1. Campuna Credits */}
                                <div
                                    onClick={() => setPaymentMethod('CREDIT')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3 select-none ${
                                        paymentMethod === 'CREDIT'
                                            ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                            : 'border-beige bg-[#faf8f3] hover:bg-sand/30'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold-dark flex items-center justify-center shrink-0 mt-0.5">
                                        <CoinIcon size="md" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs sm:text-sm text-charcoal">
                                                Campuna Credits
                                            </span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                paymentMethod === 'CREDIT' ? 'border-forest bg-forest text-white' : 'border-charcoal/30'
                                            }`}>
                                                {paymentMethod === 'CREDIT' && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-charcoal/70 mt-0.5">
                                            Guthaben: <strong className="text-forest font-mono">{creditBalance.toLocaleString('de-DE')} CC</strong>
                                        </p>
                                        {!hasEnoughCredits ? (
                                            <span className="text-[10px] font-bold text-rose-600 block mt-1">
                                                Guthaben zu gering (fehlen {(activePackage.costCC - creditBalance).toLocaleString('de-DE')} CC)
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-emerald-800 block mt-0.5">
                                                ✓ 1-Klick Sofort-Aktivierung
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Kreditkarte */}
                                <div
                                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3 select-none ${
                                        paymentMethod === 'CREDIT_CARD'
                                            ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                            : 'border-beige bg-[#faf8f3] hover:bg-sand/30'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs sm:text-sm text-charcoal">
                                                Kreditkarte
                                            </span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                paymentMethod === 'CREDIT_CARD' ? 'border-forest bg-forest text-white' : 'border-charcoal/30'
                                            }`}>
                                                {paymentMethod === 'CREDIT_CARD' && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-charcoal/60 mt-0.5">
                                            Visa, Mastercard, Amex
                                        </p>
                                    </div>
                                </div>

                                {/* 3. PayPal */}
                                <div
                                    onClick={() => setPaymentMethod('PAYPAL')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3 select-none ${
                                        paymentMethod === 'PAYPAL'
                                            ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                            : 'border-beige bg-[#faf8f3] hover:bg-sand/30'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs sm:text-sm text-charcoal">
                                                PayPal
                                            </span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                paymentMethod === 'PAYPAL' ? 'border-forest bg-forest text-white' : 'border-charcoal/30'
                                            }`}>
                                                {paymentMethod === 'PAYPAL' && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-charcoal/60 mt-0.5">
                                            Einfach & Käuferschutz
                                        </p>
                                    </div>
                                </div>

                                {/* 4. SEPA */}
                                <div
                                    onClick={() => setPaymentMethod('SEPA')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3 select-none ${
                                        paymentMethod === 'SEPA'
                                            ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                            : 'border-beige bg-[#faf8f3] hover:bg-sand/30'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs sm:text-sm text-charcoal">
                                                SEPA-Lastschrift
                                            </span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                paymentMethod === 'SEPA' ? 'border-forest bg-forest text-white' : 'border-charcoal/30'
                                            }`}>
                                                {paymentMethod === 'SEPA' && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-charcoal/60 mt-0.5">
                                            Bequemer Bankeinzug
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* ── RIGHT COLUMN (Live Preview & Sticky Order Summary) ── */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">

                        {/* Live Card Preview Box */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="w-4 h-4" />
                                    Live-Vorschau der Hervorhebung
                                </span>
                                <span className="text-[10px] text-charcoal/50">So sehen es Käufer</span>
                            </div>

                            {/* Simulated Boosted Listing Card */}
                            <div className="rounded-2xl overflow-hidden border border-amber-300/60 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.22)] bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] relative">
                                <div className="relative aspect-[16/10] w-full bg-sand/30">
                                    <img
                                        src={getImageUrl(listingImage)}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Simulated Boost Badge */}
                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                        <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-yellow-100/90 flex items-center gap-1">
                                            <Rocket className="w-3 h-3 text-slate-950" />
                                            <span>HERVORGEHOBEN</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 space-y-1.5">
                                    <h4 className="font-display font-bold text-xs sm:text-sm text-charcoal truncate">
                                        {listing.title}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="font-display font-extrabold text-forest text-sm">
                                            {listing.price ? `${parseFloat(listing.price).toLocaleString('de-DE')} €` : 'VB'}
                                        </span>
                                        <span className="text-[10px] text-charcoal/60">
                                            {listing.location || 'Deutschland'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary & Checkout Box */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-beige shadow-lg space-y-5">
                            <h3 className="font-display font-bold text-lg text-charcoal pb-3 border-b border-forest/5">
                                Zusammenfassung
                            </h3>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-charcoal/70">Gewählte Laufzeit:</span>
                                    <span className="font-bold text-charcoal">{selectedDays} Tage</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-charcoal/70">Aktiv bis:</span>
                                    <span className="font-bold text-forest">{calculatedEndDate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-charcoal/70">Zahlungsart:</span>
                                    <span className="font-bold text-charcoal">
                                        {paymentMethod === 'CREDIT'
                                            ? 'Campuna Credits'
                                            : paymentMethod === 'CREDIT_CARD'
                                            ? 'Kreditkarte'
                                            : paymentMethod === 'PAYPAL'
                                            ? 'PayPal'
                                            : 'SEPA-Lastschrift'}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-forest/5 flex items-baseline justify-between">
                                    <div>
                                        <span className="block text-sm font-bold text-charcoal">Gesamtbetrag</span>
                                        <span className="text-[10px] text-charcoal/50">inkl. 19% MwSt.</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-display text-2xl font-extrabold text-forest block">
                                            {paymentMethod === 'CREDIT'
                                                ? `${activePackage.costCC.toLocaleString('de-DE')} CC`
                                                : activePackage.priceEur}
                                        </span>
                                        {paymentMethod === 'CREDIT' && (
                                            <span className="text-[10px] text-charcoal/50 font-mono">
                                                entspricht {activePackage.priceEur}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                type="button"
                                onClick={handleExecuteBoost}
                                disabled={isSubmitting || (paymentMethod === 'CREDIT' && !hasEnoughCredits)}
                                className="w-full bg-forest hover:bg-gold text-sand hover:text-forest transition-colors duration-300 font-sans font-bold py-4 px-6 rounded-2xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        <span>Wird aktiviert...</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" />
                                        <span>Jetzt für {selectedDays} Tage hervorheben</span>
                                    </>
                                )}
                            </button>

                            {/* Trust badges */}
                            <div className="pt-2 space-y-1.5 border-t border-forest/5 text-[10px] text-charcoal/60">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Sofortige Freischaltung ohne Wartezeit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Sichere 256-Bit SSL-Verschlüsselung</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

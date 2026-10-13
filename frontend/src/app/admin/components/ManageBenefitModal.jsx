'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift,
    Crown,
    Rocket,
    Sparkles,
    Coins,
    X,
    ShieldCheck,
    Clock,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import {
    grantAdminBenefit,
    cancelAdminBenefit,
    extendAdminBenefit,
    getAdminUserDetail,
    getAdminUserListings
} from '@/api/admin';
import { toast } from 'react-hot-toast';
import { getFriendlyErrorMessage } from '@/utils/validation';

export default function ManageBenefitModal({
    isOpen,
    onClose,
    user: initialUser,
    onSuccess
}) {
    const [fullUser, setFullUser] = useState(null);
    const [userListings, setUserListings] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form selection
    const [benefitType, setBenefitType] = useState('BUSINESS_SUBSCRIPTION');
    const [durationDays, setDurationDays] = useState(30);
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedListingId, setSelectedListingId] = useState('');
    const [creditsAmount, setCreditsAmount] = useState(500);
    const [adminNote, setAdminNote] = useState('Kulanz / Partner-Vorteil durch Administration');

    // Action states
    const [grantingBenefit, setGrantingBenefit] = useState(false);
    const [cancellingBenefit, setCancellingBenefit] = useState(false);
    const [extendingBenefitLoading, setExtendingBenefitLoading] = useState(false);
    const [confirmCancelType, setConfirmCancelType] = useState(null);

    const targetUser = fullUser || initialUser;
    const isCommercial = targetUser?.user_type === 'COMMERCIAL';

    // Fetch full user and listings whenever modal opens
    const refreshModalData = useCallback(async () => {
        if (!initialUser?.id) return;
        setLoadingDetails(true);
        try {
            const [detailRes, listingsRes] = await Promise.all([
                getAdminUserDetail(initialUser.id).catch(() => null),
                getAdminUserListings(initialUser.id).catch(() => null)
            ]);

            const fetchedUser = detailRes?.data?.user || detailRes?.user || null;
            if (fetchedUser) {
                setFullUser(fetchedUser);
            }

            const fetchedListings = listingsRes?.data?.listings || listingsRes?.listings || fetchedUser?.listings || [];
            setUserListings(fetchedListings);

            if (fetchedListings.length > 0) {
                setSelectedListingId(prev => {
                    if (prev && fetchedListings.some(l => l.id === prev)) return prev;
                    const firstUnboosted = fetchedListings.find(l => !l.is_boosted && !(l.boosted_until && new Date(l.boosted_until) > new Date()));
                    return firstUnboosted?.id || fetchedListings[0].id;
                });
            }
        } catch (err) {
            console.warn('Could not refresh benefit modal user data:', err);
        } finally {
            setLoadingDetails(false);
        }
    }, [initialUser?.id]);

    useEffect(() => {
        if (isOpen && initialUser?.id) {
            setFullUser(initialUser);
            setConfirmCancelType(null);
            setDurationDays(30);
            setCustomEndDate('');
            setCreditsAmount(500);

            const isComm = initialUser.user_type === 'COMMERCIAL';
            setBenefitType(isComm ? 'BUSINESS_SUBSCRIPTION' : 'LISTING_BOOST');
            setAdminNote('Kulanz / Partner-Vorteil durch Administration');

            refreshModalData();
        }
    }, [isOpen, initialUser, refreshModalData]);

    if (!isOpen || !targetUser) return null;

    // Detect Active Benefits
    const spotlightData = targetUser.benefits?.spotlight || null;
    const isSpotlightActive = Boolean(
        spotlightData?.active ||
        (targetUser.company_spotlight_until && new Date(targetUser.company_spotlight_until) > new Date())
    );
    const spotlightExpiry = spotlightData?.expires_at || targetUser.company_spotlight_until;

    const compSub = targetUser.benefits?.complimentary_subscription || null;
    const isSubActive = Boolean(
        (compSub &&
        compSub.status === 'ACTIVE' &&
        (!compSub.expires_at || new Date(compSub.expires_at) > new Date())) ||
        isSpotlightActive
    );

    const boostedListings = (targetUser.benefits?.boosted_listings || []).filter(
        l => l.boosted_until && new Date(l.boosted_until) > new Date()
    );

    const hasAnyActiveBenefits = Boolean(
        isSubActive || isSpotlightActive || boostedListings.length > 0
    );

    // Determine if the currently selected benefit is active
    let isCurrentTypeAlreadyActive = false;
    let currentTypeActiveReason = '';
    let currentTypeExpiresAt = null;

    if (benefitType === 'BUSINESS_SUBSCRIPTION' && isSubActive) {
        isCurrentTypeAlreadyActive = true;
        currentTypeExpiresAt = compSub?.expires_at || spotlightExpiry;
        currentTypeActiveReason = compSub?.payment_method === 'TRANSITION_PERIOD'
            ? 'Campuna Business (Übergangsphase)'
            : (isSpotlightActive && !compSub?.expires_at ? 'Campuna Business (Inklusive durch Homepage-Spotlight)' : 'Campuna Business (Gratis Partner)');
    } else if (benefitType === 'SPOTLIGHT' && isSpotlightActive) {
        isCurrentTypeAlreadyActive = true;
        currentTypeExpiresAt = spotlightExpiry;
        currentTypeActiveReason = 'Homepage-Spotlight Platziert';
    } else if (benefitType === 'LISTING_BOOST') {
        const selectedListing = userListings.find(l => l.id === selectedListingId);
        if (selectedListing && selectedListing.boosted_until && new Date(selectedListing.boosted_until) > new Date()) {
            isCurrentTypeAlreadyActive = true;
            currentTypeExpiresAt = selectedListing.boosted_until;
            currentTypeActiveReason = `Boost für "${selectedListing.title}"`;
        }
    }

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getRemainingText = (isoString) => {
        if (!isoString) return '';
        const diffMs = new Date(isoString) - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'läuft heute ab';
        if (diffDays === 1) return 'noch 1 Tag';
        return `noch ${diffDays} Tage`;
    };

    // Calculate new expiration date preview for either new grant or extension
    const calculateNewExpiryDate = (currentExpiryIso, days, customDate) => {
        if (customDate) {
            return new Date(customDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        const now = new Date();
        let base = currentExpiryIso ? new Date(currentExpiryIso) : now;
        if (base < now) base = now;
        const next = new Date(base.getTime() + (Number(days) || 30) * 24 * 60 * 60 * 1000);
        return next.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // ── Handle Extension of Current Active Benefit ──
    const handleExtendCurrentBenefit = async (e) => {
        e?.preventDefault();
        if (!isCurrentTypeAlreadyActive) return;

        setExtendingBenefitLoading(true);
        const toastId = toast.loading('Laufzeit wird verlängert...');

        try {
            const payload = {
                user_id: targetUser.id,
                benefit_type: benefitType,
                listing_id: benefitType === 'LISTING_BOOST' ? selectedListingId : undefined,
                duration_days: customEndDate ? undefined : durationDays,
                custom_end_date: customEndDate || undefined,
                admin_note: adminNote.trim() || 'Laufzeitverlängerung durch Administration'
            };

            const res = await extendAdminBenefit(payload);

            if (res.data?.success || res.success) {
                toast.success(res.data?.message || '🎉 Laufzeit wurde erfolgreich verlängert!', { id: toastId });
                await refreshModalData();
                onSuccess?.();
            } else {
                toast.error(getFriendlyErrorMessage(res.data?.error || res.error, 'Laufzeit konnte nicht verlängert werden.'), { id: toastId });
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'Fehler beim Verlängern der Laufzeit.'), { id: toastId });
        } finally {
            setExtendingBenefitLoading(false);
        }
    };

    // ── Handle Granting New Benefit ──
    const handleGrant = async (e) => {
        e?.preventDefault();
        if (isCurrentTypeAlreadyActive) {
            toast.error('Dieser Vorteil ist bereits aktiv. Bitte nutze die Schaltfläche "Laufzeit verlängern".');
            return;
        }

        if (benefitType === 'LISTING_BOOST' && !selectedListingId) {
            toast.error('Bitte wähle ein Inserat aus.');
            return;
        }

        setGrantingBenefit(true);
        const toastId = toast.loading('Vorteil wird zugewiesen...');

        try {
            const payload = {
                user_id: targetUser.id,
                benefit_type: benefitType,
                duration_days: customEndDate ? undefined : durationDays,
                custom_end_date: customEndDate || undefined,
                listing_id: benefitType === 'LISTING_BOOST' ? selectedListingId : undefined,
                credits_amount: benefitType === 'CREDITS' ? creditsAmount : undefined,
                admin_note: adminNote.trim() || 'Kulanz / Partner-Vorteil durch Administration'
            };

            const res = await grantAdminBenefit(payload);

            if (res.data?.success || res.success) {
                toast.success(res.data?.message || '🎉 Vorteil wurde erfolgreich kostenlos zugewiesen!', { id: toastId });
                await refreshModalData();
                onSuccess?.();
            } else {
                toast.error(getFriendlyErrorMessage(res.data?.error || res.error, 'Vorteil konnte nicht zugewiesen werden.'), { id: toastId });
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'Fehler beim Zuweisen des Vorteils.'), { id: toastId });
        } finally {
            setGrantingBenefit(false);
        }
    };

    // ── Handle Cancelling Current Active Benefit ──
    const handleCancelCurrentBenefit = async () => {
        setCancellingBenefit(true);
        const toastId = toast.loading('Vorteil wird vorzeitig beendet...');

        try {
            const payload = {
                user_id: targetUser.id,
                benefit_type: benefitType,
                listing_id: benefitType === 'LISTING_BOOST' ? selectedListingId : undefined,
                admin_note: 'Vorzeitig durch Administration beendet'
            };

            const res = await cancelAdminBenefit(payload);

            if (res.data?.success || res.success) {
                toast.success(res.data?.message || 'Vorteil wurde erfolgreich beendet.', { id: toastId });
                setConfirmCancelType(null);
                await refreshModalData();
                onSuccess?.();
            } else {
                toast.error(getFriendlyErrorMessage(res.data?.error || res.error, 'Vorteil konnte nicht beendet werden.'), { id: toastId });
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'Fehler beim Beenden des Vorteils.'), { id: toastId });
        } finally {
            setCancellingBenefit(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] p-4 sm:p-6 text-white relative shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            aria-label="Schließen"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 sm:gap-3.5 pr-8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gold/20 text-gold flex items-center justify-center font-bold text-lg sm:text-xl border border-gold/30 shrink-0 shadow-inner">
                                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <h3 className="text-sm sm:text-lg font-black text-white leading-tight font-display">
                                        Kostenlosen Vorteil zuweisen
                                    </h3>
                                    {hasAnyActiveBenefits && (
                                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                                            Vorteile aktiv
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                                    <p className="text-[11px] sm:text-xs text-sand/90 truncate max-w-[200px] sm:max-w-[300px]">
                                        Für: <strong className="text-white">{targetUser.name || targetUser.email}</strong>
                                    </p>
                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full ${
                                        isCommercial ? 'bg-gold text-forest' : 'bg-white/20 text-sand'
                                    }`}>
                                        {isCommercial ? 'Gewerblicher Partner' : 'Privatnutzer'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Modal Content */}
                    <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-slate-700">

                        {/* Description */}
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            {isCommercial
                                ? 'Gewerbliche Partner-Vorteile: Du kannst dem Händler eine kostenlose Business-Mitgliedschaft, Homepage-Spotlights (inkl. Business), Inserate-Boosts oder Campuna Credits zuweisen oder aktive Vorteile direkt verlängern.'
                                : 'Privatnutzer-Vorteile: Du kannst kostenlose Inserate-Boosts oder Campuna Credits zuweisen.'
                            }
                        </p>

                        {/* ─── 1. BENEFIT TYPE SELECTION (NEVER DISABLED CARDS) ─── */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                1. Art des Vorteils wählen:
                            </label>
                            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 sm:gap-2.5">

                                {/* Commercial: Business Subscription */}
                                {isCommercial && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBenefitType('BUSINESS_SUBSCRIPTION');
                                            setConfirmCancelType(null);
                                            if (isSubActive) {
                                                setAdminNote('Laufzeitverlängerung durch Administration');
                                            }
                                        }}
                                        className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                                            benefitType === 'BUSINESS_SUBSCRIPTION'
                                                ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Crown className="w-4 h-4 text-gold shrink-0" />
                                                <span className="text-xs font-bold text-slate-900 truncate">Campuna Business</span>
                                            </div>
                                            {isSubActive && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                                    Aktiv
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 truncate block">
                                            {isSubActive ? `Aktiv bis ${formatDate(compSub?.expires_at || spotlightExpiry)}` : 'Kostenlose Mitgliedschaft'}
                                        </span>
                                    </button>
                                )}

                                {/* Available for both: Listing Boost */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBenefitType('LISTING_BOOST');
                                        setConfirmCancelType(null);
                                    }}
                                    className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                                        benefitType === 'LISTING_BOOST'
                                            ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Rocket className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span className="text-xs font-bold text-slate-900 truncate">Inserate-Highlight</span>
                                        </div>
                                        {boostedListings.length > 0 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                                                {boostedListings.length} aktiv
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 truncate block">Kostenloser Boost / Top</span>
                                </button>

                                {/* Commercial: Homepage Spotlight */}
                                {isCommercial && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBenefitType('SPOTLIGHT');
                                            setConfirmCancelType(null);
                                            if (isSpotlightActive) {
                                                setAdminNote('Laufzeitverlängerung durch Administration');
                                            }
                                        }}
                                        className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                                            benefitType === 'SPOTLIGHT'
                                                ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                                <span className="text-xs font-bold text-slate-900 truncate">Homepage-Spotlight</span>
                                            </div>
                                            {isSpotlightActive && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                                                    Aktiv
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 truncate block">
                                            {isSpotlightActive
                                                ? `Aktiv bis ${formatDate(spotlightExpiry)}`
                                                : 'Startseiten-Präsenz (inkl. Business)'}
                                        </span>
                                    </button>
                                )}

                                {/* Available for both: Credits */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBenefitType('CREDITS');
                                        setConfirmCancelType(null);
                                    }}
                                    className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                                        benefitType === 'CREDITS'
                                            ? 'border-forest bg-forest/10 ring-2 ring-forest/30 shadow-xs'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span className="text-xs font-bold text-slate-900 truncate">Credits Gutschrift</span>
                                        </div>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                                            Guthaben
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 truncate block">Campuna Credits (CC)</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── ACTIVE BENEFIT STATUS BANNER ─── */}
                        {isCurrentTypeAlreadyActive && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 sm:p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300/80 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-amber-950 text-xs truncate">
                                            {currentTypeActiveReason} ist aktuell aktiv
                                        </p>
                                        <p className="text-[11px] text-amber-800 mt-0.5">
                                            Gültig bis: <strong className="font-mono text-slate-900">{formatDate(currentTypeExpiresAt)}</strong>
                                            <span className="font-semibold text-amber-900 ml-1.5">({getRemainingText(currentTypeExpiresAt)})</span>
                                        </p>
                                    </div>
                                </div>
                                <span className="self-start sm:self-center text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                    Verlängerung bereit
                                </span>
                            </motion.div>
                        )}

                        {/* ─── LISTING SELECTION (Only for Listing Boost) ─── */}
                        {benefitType === 'LISTING_BOOST' && (
                            <div className="space-y-1.5 bg-slate-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
                                <label className="text-[11px] font-bold text-slate-700 block">
                                    Zu boostendes Inserat wählen:
                                </label>
                                {userListings.length === 0 ? (
                                    <div className="text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                                        Dieser Benutzer hat aktuell keine Inserate erstellt.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedListingId}
                                        onChange={(e) => setSelectedListingId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans cursor-pointer truncate"
                                    >
                                        {userListings.map((l) => {
                                            const isBoosted = Boolean(l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date()));
                                            return (
                                                <option key={l.id} value={l.id}>
                                                    {l.title} {isBoosted ? `(Geboostet bis ${formatDate(l.boosted_until)})` : `(${l.status})`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* ─── CREDITS AMOUNT (Only for Credits) ─── */}
                        {benefitType === 'CREDITS' && (
                            <div className="space-y-2 bg-slate-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
                                <label className="text-[11px] font-bold text-slate-700 block">
                                    Anzahl Campuna Credits:
                                </label>
                                <div className="grid grid-cols-2 min-[440px]:grid-cols-4 gap-1.5 sm:gap-2">
                                    {[500, 1000, 2500, 5000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setCreditsAmount(amt)}
                                            className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                                                creditsAmount === amt
                                                    ? 'bg-forest text-sand border-forest'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            +{amt.toLocaleString('de-DE')} CC
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    value={creditsAmount}
                                    onChange={(e) => setCreditsAmount(Number(e.target.value))}
                                    placeholder="Individueller Betrag"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
                                />
                            </div>
                        )}

                        {/* ─── 2. DURATION SELECTOR (ALWAYS ACTIVE - USED FOR GRANT & RENEW) ─── */}
                        {benefitType !== 'CREDITS' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        2. Laufzeit / Gültigkeit:
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        {isCurrentTypeAlreadyActive ? 'Wird zur aktiven Laufzeit addiert' : 'Keine automatische Verlängerung'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                    {[
                                        { days: 7, label: isCurrentTypeAlreadyActive ? '+7 Tage' : '7 Tage' },
                                        { days: 14, label: isCurrentTypeAlreadyActive ? '+14 Tage' : '14 Tage' },
                                        { days: 30, label: isCurrentTypeAlreadyActive ? '+1 Monat' : '1 Monat' },
                                        { days: 90, label: isCurrentTypeAlreadyActive ? '+3 Monate' : '3 Monate' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.days}
                                            type="button"
                                            onClick={() => {
                                                setDurationDays(preset.days);
                                                setCustomEndDate('');
                                            }}
                                            className={`py-2 px-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                                                durationDays === preset.days && !customEndDate
                                                    ? 'bg-forest text-sand border-forest shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-1 pt-0.5">
                                    <label className="text-[10px] font-semibold text-slate-500 block">
                                        Oder individuelles Enddatum festlegen (optional):
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30 cursor-pointer"
                                    />
                                </div>

                                {/* Dynamic Expiry Preview */}
                                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px]">
                                    <span className="text-slate-600 font-medium">
                                        {isCurrentTypeAlreadyActive ? 'Neues Gültigkeitsdatum nach Verlängerung:' : 'Gültig bis:'}
                                    </span>
                                    <span className="font-extrabold text-emerald-800 font-mono flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{calculateNewExpiryDate(currentTypeExpiresAt, durationDays, customEndDate)}</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ─── 3. ADMIN NOTE ─── */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                3. Anmerkung / Grund (wird im Audit & der Benachrichtigung erfasst):
                            </label>
                            <input
                                type="text"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="z.B. Kulanz wegen Support-Anfrage / Partner-Aktion"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
                            />
                        </div>

                        {/* Security Banner */}
                        <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-[11px] text-emerald-800 leading-relaxed flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                                Dieser Vorteil wird <strong>100% kostenlos</strong> zugewiesen und <strong>endet automatisch</strong> nach Ablauf des Zeitraums. Es findet <strong>keine automatische Abbuchung</strong> statt.
                            </span>
                        </div>

                    </div>

                    {/* ─── FOOTER ACTIONS (FULLY RESPONSIVE) ─── */}
                    <div className="p-3 sm:p-5 border-t border-slate-100 bg-[#FBFBFC] shrink-0">
                        {/* DESKTOP VIEW (sm and up) */}
                        <div className="hidden sm:flex items-center justify-between gap-3">
                            {/* Left: Abbrechen & Cancel Benefit */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Abbrechen
                                </button>

                                {isCurrentTypeAlreadyActive && (
                                    confirmCancelType === benefitType ? (
                                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-xl">
                                            <span className="text-[10px] font-bold text-rose-700 px-1">Wirklich beenden?</span>
                                            <button
                                                type="button"
                                                onClick={handleCancelCurrentBenefit}
                                                disabled={cancellingBenefit}
                                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                                            >
                                                {cancellingBenefit ? 'Beende...' : 'Ja, beenden'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmCancelType(null)}
                                                className="px-1.5 py-1 bg-white text-slate-600 text-[11px] rounded-lg border border-slate-200 cursor-pointer"
                                            >
                                                Nein
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmCancelType(benefitType)}
                                            disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                            className="px-3.5 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                            title="Aktiven Vorteil vorzeitig beenden"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Vorteil beenden</span>
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Right: Assign (Disabled if active) & Extend */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGrant}
                                    disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit || isCurrentTypeAlreadyActive || (benefitType === 'LISTING_BOOST' && !selectedListingId)}
                                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        isCurrentTypeAlreadyActive
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80 shadow-none'
                                            : 'bg-forest text-sand hover:bg-[#004d0a] cursor-pointer shadow-md'
                                    }`}
                                    title={isCurrentTypeAlreadyActive ? 'Vorteil ist bereits aktiv. Nutze den Verlängern-Button daneben.' : 'Vorteil kostenlos zuweisen'}
                                >
                                    {grantingBenefit ? (
                                        <div className="w-3.5 h-3.5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Gift className={`w-3.5 h-3.5 ${isCurrentTypeAlreadyActive ? 'text-slate-400' : 'text-gold'}`} />
                                    )}
                                    <span>
                                        {isCurrentTypeAlreadyActive
                                            ? 'Bereits aktiv'
                                            : 'Vorteil kostenlos zuweisen'}
                                    </span>
                                </button>

                                {isCurrentTypeAlreadyActive && (
                                    <button
                                        type="button"
                                        onClick={handleExtendCurrentBenefit}
                                        disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                        className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-forest text-sand hover:bg-[#004d0a] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap"
                                    >
                                        {extendingBenefitLoading ? (
                                            <div className="w-3.5 h-3.5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Clock className="w-3.5 h-3.5 text-gold" />
                                        )}
                                        <span>Laufzeit verlängern</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* MOBILE VIEW (Screens below sm: 640px - Perfectly aligned 2-column grid) */}
                        <div className="sm:hidden flex flex-col gap-2 w-full">
                            {isCurrentTypeAlreadyActive ? (
                                <>
                                    {/* Mobile Row 1: Assign (Disabled) & Extend (Primary) side-by-side with full 50/50 width */}
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <button
                                            type="button"
                                            disabled={true}
                                            className="w-full py-2.5 px-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80 flex items-center justify-center gap-1.5 select-none"
                                        >
                                            <Gift className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">Bereits aktiv</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleExtendCurrentBenefit}
                                            disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                            className="w-full py-2.5 px-2 rounded-xl text-xs font-bold bg-forest text-sand hover:bg-[#004d0a] shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                                        >
                                            {extendingBenefitLoading ? (
                                                <div className="w-3.5 h-3.5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                                            )}
                                            <span className="truncate">Laufzeit verlängern</span>
                                        </button>
                                    </div>

                                    {/* Mobile Row 2: Abbrechen & Vorteil beenden side-by-side with full 50/50 width */}
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                            className="w-full py-2.5 px-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center"
                                        >
                                            Abbrechen
                                        </button>

                                        {confirmCancelType === benefitType ? (
                                            <div className="flex items-center justify-between gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={handleCancelCurrentBenefit}
                                                    disabled={cancellingBenefit}
                                                    className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg text-center"
                                                >
                                                    {cancellingBenefit ? '...' : 'Ja, beenden'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmCancelType(null)}
                                                    className="px-2 py-1 bg-white text-slate-600 text-[11px] rounded-lg border border-slate-200"
                                                >
                                                    Nein
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmCancelType(benefitType)}
                                                disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                                className="w-full py-2.5 px-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                <span className="truncate">Vorteil beenden</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* When not active: Symmetrical 50/50 grid */
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit}
                                        className="w-full py-2.5 px-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center"
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleGrant}
                                        disabled={grantingBenefit || extendingBenefitLoading || cancellingBenefit || (benefitType === 'LISTING_BOOST' && !selectedListingId)}
                                        className="w-full py-2.5 px-2 rounded-xl text-xs font-bold bg-forest text-sand hover:bg-[#004d0a] shadow-md flex items-center justify-center gap-1.5"
                                    >
                                        {grantingBenefit ? (
                                            <div className="w-3.5 h-3.5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Gift className="w-3.5 h-3.5 text-gold shrink-0" />
                                        )}
                                        <span className="truncate">Zuweisen</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Mail,
    Phone,
    Globe,
    MapPin,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    Building2,
    User,
    Coins,
    Tag,
    Trash2,
    UserCheck,
    UserX,
    ExternalLink,
    Copy,
    Check,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import {
    getAdminUserDetail,
    toggleUserSuspension,
    manuallyVerifyUserEmail,
    deleteAdminUser,
    grantAdminBenefit,
    updateUserProviderCategory
} from '@/api/admin';
import { toast } from 'react-hot-toast';
import PioneerBadge from '@/app/components/PioneerBadge';
import { getImageUrl } from '@/utils/imageUrl';
import { Crown, Rocket, Gift, X } from 'lucide-react';
import { PROVIDER_CATEGORIES } from '@/data';

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Grant Benefit State
    const [benefitModalOpen, setBenefitModalOpen] = useState(false);
    const [benefitType, setBenefitType] = useState('LISTING_BOOST');
    const [durationDays, setDurationDays] = useState(30);
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedListingId, setSelectedListingId] = useState('');
    const [creditsAmount, setCreditsAmount] = useState(500);
    const [adminNote, setAdminNote] = useState('Kulanz / Partner-Vorteil durch Administration');
    const [grantingBenefit, setGrantingBenefit] = useState(false);

    const fetchUser = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await getAdminUserDetail(userId);
            const userData = res?.data?.user || res?.user || (res?.data?.success && res?.data?.user);
            if (userData) {
                setUser(userData);
            } else {
                console.error('User fetch returned unformatted data:', res);
                toast.error(res?.data?.error || res?.error || 'Benutzer nicht gefunden.');
            }
        } catch (error) {
            console.error('Failed to load user details:', error);
            toast.error('Fehler beim Laden der Benutzerdetails.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleToggleSuspend = async () => {
        if (!user) return;
        setActionLoading(true);
        const newStatus = !user.is_suspended;
        const toastId = toast.loading(newStatus ? 'Benutzer wird gesperrt...' : 'Benutzer wird reaktiviert...');
        try {
            const res = await toggleUserSuspension(user.id, newStatus);
            if (res.success || res.data?.success) {
                toast.success(
                    res.data?.message || (newStatus ? `Konto wurde gesperrt.` : `Konto wurde reaktiviert.`),
                    { id: toastId }
                );
                setUser(prev => ({ ...prev, is_suspended: newStatus }));
            } else {
                toast.error(res.error || res.data?.error || 'Aktion fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Aktion fehlgeschlagen.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!user) return;
        setActionLoading(true);
        const toastId = toast.loading('E-Mail wird verifiziert...');
        try {
            const res = await manuallyVerifyUserEmail(user.id);
            if (res.success || res.data?.success) {
                toast.success(res.data?.message || 'E-Mail wurde verifiziert.', { id: toastId });
                setUser(prev => ({ ...prev, email_verified: true }));
            } else {
                toast.error(res.error || res.data?.error || 'Verifizierung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Verifizierung fehlgeschlagen.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;
        setActionLoading(true);
        const toastId = toast.loading('Benutzer wird gelöscht...');
        try {
            const res = await deleteAdminUser(user.id);
            if (res.success || res.data?.success) {
                toast.success(res.data?.message || 'Benutzer wurde gelöscht.', { id: toastId });
                router.push('/admin/benutzer');
            } else {
                toast.error(res.error || res.data?.error || 'Löschen fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Löschen fehlgeschlagen.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCategory = async (newCategory) => {
        if (!user || !newCategory) return;
        const toastId = toast.loading('Kategorie wird aktualisiert...');
        try {
            const res = await updateUserProviderCategory(user.id, newCategory);
            if (res.data?.success || res.success) {
                toast.success(res.data?.message || 'Anbieterkategorie erfolgreich aktualisiert!', { id: toastId });
                setUser(prev => ({ ...prev, provider_category: newCategory }));
            } else {
                toast.error(res.data?.error || res.error || 'Fehler beim Aktualisieren.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Aktualisieren.', { id: toastId });
        }
    };

    const handleOpenBenefitModal = () => {
        if (!user) return;
        const isCommercial = user.user_type === 'COMMERCIAL';
        const defaultType = isCommercial ? 'BUSINESS_SUBSCRIPTION' : 'LISTING_BOOST';
        setBenefitType(defaultType);
        setDurationDays(30);
        setCustomEndDate('');
        setSelectedListingId(user.listings && user.listings.length > 0 ? user.listings[0].id : '');
        if (!isCommercial && (!user.listings || user.listings.length === 0)) {
            setBenefitType('CREDITS');
        }
        setCreditsAmount(500);
        setAdminNote('Kulanz / Partner-Vorteil durch Administration');
        setBenefitModalOpen(true);
    };

    const handleGrantBenefit = async (e) => {
        e?.preventDefault();
        if (!user) return;

        if (benefitType === 'LISTING_BOOST' && !selectedListingId) {
            toast.error('Bitte wähle ein Inserat aus.');
            return;
        }

        setGrantingBenefit(true);
        const toastId = toast.loading('Vorteil wird zugewiesen...');

        try {
            const payload = {
                user_id: user.id,
                benefit_type: benefitType,
                duration_days: customEndDate ? undefined : durationDays,
                custom_end_date: customEndDate || undefined,
                listing_id: benefitType === 'LISTING_BOOST' ? selectedListingId : undefined,
                credits_amount: benefitType === 'CREDITS' ? creditsAmount : undefined,
                admin_note: adminNote.trim() || 'Kulanz / Partner-Vorteil durch Administration',
            };

            const res = await grantAdminBenefit(payload);

            if (res.data?.success || res.success) {
                toast.success(res.data?.message || '🎉 Vorteil wurde erfolgreich kostenlos zugewiesen!', { id: toastId });
                setBenefitModalOpen(false);
                fetchUser();
            } else {
                toast.error(res.data?.error || res.error || 'Zuweisung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Zuweisen des Vorteils.', { id: toastId });
        } finally {
            setGrantingBenefit(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        toast.success('In die Zwischenablage kopiert!');
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(price || 0);
    }, []);

    const formatDate = useCallback((isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }, []);

    if (loading) {
        return (
            <div className="w-full max-w-[1440px] mx-auto py-20 text-center">
                <div className="inline-flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-forest" />
                    <span className="text-xs font-bold text-slate-500">Benutzerdaten werden geladen...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="w-full max-w-[1440px] mx-auto py-20 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Benutzer nicht gefunden</h3>
                <p className="text-xs text-slate-500">Der aufgerufene Benutzer existiert nicht oder wurde gelöscht.</p>
                <Link
                    href="/admin/benutzer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-forest text-sand text-xs font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zurück zur Übersicht</span>
                </Link>
            </div>
        );
    }

    const isCommercial = user.user_type === 'COMMERCIAL';
    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-6 pb-12 px-3 sm:px-6 font-sans">
            
            {/* ─── Back Navigation Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <Link
                    href="/admin/benutzer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E8EAEF] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Zurück zur Benutzerverwaltung</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchUser}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#E8EAEF] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer w-fit"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest' : ''}`} />
                        <span>Aktualisieren</span>
                    </button>
                </div>
            </div>

            {/* ─── Luxury User Profile Banner ─── */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] rounded-3xl p-5 sm:p-7 md:p-8 text-white relative overflow-hidden shadow-lg border border-forest/30"
            >
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                        {user.avatar ? (
                            <img
                                src={getImageUrl(user.avatar)}
                                alt={user.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-md shrink-0 bg-white"
                            />
                        ) : (
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-extrabold text-xl sm:text-2xl ring-4 ring-white/20 shadow-md shrink-0 ${
                                isAdmin
                                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white'
                                    : isCommercial
                                        ? 'bg-gradient-to-tr from-forest to-[#002b05] text-white'
                                        : 'bg-white/15 text-sand'
                            }`}>
                                {user.name.slice(0, 2).toUpperCase()}
                            </div>
                        )}

                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-black font-sans text-white tracking-tight break-words">
                                    {user.name}
                                </h1>
                                {user.has_pioneer_badge && (
                                    <PioneerBadge size="sm" text="Pioneer" />
                                )}
                                {isAdmin && (
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gold text-forest shrink-0">
                                        ADMIN
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-sand/80 font-mono break-all">
                                {user.email}
                            </p>

                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-0.5">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-sand">
                                    {isCommercial ? 'Gewerbliches Profil' : 'Privater Verkäufer'}
                                </span>
                                {user.is_suspended ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                                        Konto Gesperrt
                                    </span>
                                ) : user.email_verified ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                                        E-Mail Verifiziert
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                                        E-Mail Ausstehend
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Profile Actions */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-2 xl:pt-0 border-t xl:border-t-0 border-white/10">
                        <button
                            onClick={handleOpenBenefitModal}
                            className="px-3.5 sm:px-4 py-2 rounded-xl bg-gold text-forest font-black text-xs transition-all cursor-pointer shadow-md hover:brightness-105 active:scale-95 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
                        >
                            <Sparkles className="w-3.5 h-3.5 fill-forest" />
                            <span>Vorteil schenken</span>
                        </button>
                        {!user.email_verified && (
                            <button
                                onClick={handleVerifyEmail}
                                disabled={actionLoading}
                                className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>E-Mail verifizieren</span>
                            </button>
                        )}
                        <button
                            onClick={handleToggleSuspend}
                            disabled={actionLoading}
                            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center ${
                                user.is_suspended
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30'
                            }`}
                        >
                            {user.is_suspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>{user.is_suspended ? 'Reaktivieren' : 'Sperren'}</span>
                        </button>
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            disabled={actionLoading}
                            className="px-3.5 sm:px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-400/40 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Löschen</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ─── User Metrics Bento Grid ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                        Inserate Gesamt
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-sans">
                        {user.total_listings || 0}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 mt-1 block truncate">
                        {user.active_listings || 0} aktiv
                    </span>
                </div>

                <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                        Campuna Credits
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-forest mt-1 font-sans flex items-center gap-1.5 flex-wrap">
                        <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-gold shrink-0" />
                        <span>{user.credit_balance || 0} CC</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-1 block truncate">
                        Wert: {formatPrice((user.credit_balance || 0) * 0.01)}
                    </span>
                </div>

                <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                        Referral-Code
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 bg-[#F4F5F7] px-2 py-0.5 rounded-lg border border-[#E2E5EA]">
                            {user.referral_code || '-'}
                        </span>
                        {user.referral_code && (
                            <button
                                onClick={() => copyToClipboard(user.referral_code)}
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Direktempfehlungen</span>
                </div>

                <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                        Mitglied seit
                    </span>
                    <div className="text-sm sm:text-base md:text-lg font-extrabold text-slate-800 mt-1 font-sans flex items-center gap-1.5 truncate">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDate(user.created_at)}</span>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 truncate block mt-1">ID: {user.id}</span>
                </div>
            </div>

            {/* ─── Profile Details & Bio ─── */}
            <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Profildaten & Kontaktdaten
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Standort</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                            <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
                            <span className="truncate">{user.location || 'Keine Angabe'}</span>
                        </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Telefon</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                            <Phone className="w-3.5 h-3.5 text-forest shrink-0" />
                            <span className="truncate">{user.phone || 'Keine Angabe'}</span>
                        </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Webseite</span>
                        {user.website ? (
                            <a
                                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 font-bold text-forest hover:underline truncate"
                            >
                                <Globe className="w-3.5 h-3.5 text-forest shrink-0" />
                                <span className="truncate">{user.website}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                        ) : (
                            <span className="font-bold text-slate-400">Keine Angabe</span>
                        )}
                    </div>

                    {isCommercial && (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-sand/30 border border-gold/30 space-y-1.5 sm:col-span-2 md:col-span-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-forest font-black uppercase tracking-wider block">
                                    🏢 Anbieterkategorie (Admin-Zuweisung)
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                    Aktuell: <strong className="text-slate-800">{user.provider_category || 'Wohnmobil- & Wohnwagenhändler'}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={user.provider_category || 'Wohnmobil- & Wohnwagenhändler'}
                                    onChange={(e) => handleUpdateCategory(e.target.value)}
                                    className="w-full sm:w-auto flex-1 bg-white border border-forest/20 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-forest/30 cursor-pointer shadow-2xs"
                                >
                                    {PROVIDER_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name} ({cat.description})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {user.bio && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Über das Profil / Beschreibung</span>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                    </div>
                )}
            </div>

            {/* ─── Listings by this user ─── */}
            <div className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                            Inserate des Nutzers ({user.listings?.length || 0})
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Alle Angebote, die unter diesem Konto erstellt wurden.</p>
                    </div>
                </div>

                {user.listings?.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-bold">Dieser Benutzer hat noch keine Inserate eingestellt.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {user.listings.map((item) => (
                            <div
                                key={item.id}
                                className="border border-[#E8EAEF] rounded-2xl p-3 sm:p-3.5 bg-[#FBFBFC] hover:bg-white hover:border-forest/40 transition-all shadow-2xs space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200 flex items-center justify-center">
                                        {item.main_image ? (
                                            <img
                                                src={getImageUrl(item.main_image)}
                                                alt={item.title || 'Inserat'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <Tag className="w-5 h-5 text-slate-400 opacity-40" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                                            {item.title}
                                        </h4>
                                        <div className="text-xs font-extrabold text-forest mt-0.5">
                                            {formatPrice(item.price)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                                            <span className={`font-bold px-1.5 py-0.2 rounded-md ${
                                                item.status === 'APPROVED'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : item.status === 'REJECTED'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                            <span>•</span>
                                            <span className="truncate">{item.location || 'Deutschland'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                                    <span className="text-slate-400 font-mono text-[10px]">{formatDate(item.created_at)}</span>
                                    {item.slug && (
                                        <Link
                                            href={`/inserate/${item.slug}`}
                                            target="_blank"
                                            className="text-forest hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
                                        >
                                            <span>Öffnen</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Delete Confirmation Modal ─── */}
            <AnimatePresence>
                {deleteModalOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-center space-y-4"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-7 h-7" />
                            </div>

                            <div>
                                <h3 className="text-base font-black text-slate-900 font-display">
                                    Benutzer unwiderruflich löschen?
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                    Möchtest du das Konto von <strong className="text-slate-900">{user.email}</strong> und alle damit verbundenen {user.total_listings} Inserate endgültig löschen?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    <span>Endgültig löschen</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Grant Complimentary Benefit Modal ─── */}
            <AnimatePresence>
                {benefitModalOpen && user && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] p-6 text-white relative">
                                <button
                                    onClick={() => setBenefitModalOpen(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center font-bold text-xl border border-gold/30">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight font-display">
                                            Kostenlosen Vorteil zuweisen
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-sand/80 truncate max-w-[240px]">
                                                Für: <strong className="text-white">{user.email}</strong>
                                            </p>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                user.user_type === 'COMMERCIAL'
                                                    ? 'bg-gold text-forest'
                                                    : 'bg-white/20 text-sand'
                                            }`}>
                                                {user.user_type === 'COMMERCIAL' ? 'Gewerblicher Partner' : 'Privatnutzer'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleGrantBenefit} className="p-6 space-y-5 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
                                
                                {/* Info Box tailored to account type */}
                                {user.user_type === 'COMMERCIAL' ? (
                                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                                        <Crown className="w-4 h-4 text-gold-dark shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Gewerbliche Partner-Vorteile</strong>: Du kannst dem Händler eine kostenlose Business-Mitgliedschaft, Homepage-Spotlights, Inserate-Boosts oder Campuna Credits zuweisen.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Privatnutzer-Vorteile</strong>: Private Konten inserieren kostenfrei und benötigen kein Business-Abo. Du kannst Inserate-Highlights (Boosts) oder Campuna Credits vergeben.
                                        </span>
                                    </div>
                                )}

                                {/* 1. Benefit Type Selector */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        1. Art des Vorteils wählen:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        
                                        {/* Commercial-only: Business Subscription */}
                                        {user.user_type === 'COMMERCIAL' && (
                                            <button
                                                type="button"
                                                onClick={() => setBenefitType('BUSINESS_SUBSCRIPTION')}
                                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                                    benefitType === 'BUSINESS_SUBSCRIPTION'
                                                        ? 'border-forest bg-forest/10 ring-2 ring-forest/20 text-forest font-bold'
                                                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Crown className="w-4 h-4 text-gold" />
                                                    <span className="text-xs font-bold">Campuna Business</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-normal">Kostenlose Mitgliedschaft</span>
                                            </button>
                                        )}

                                        {/* Available for both: Listing Boost */}
                                        <button
                                            type="button"
                                            onClick={() => setBenefitType('LISTING_BOOST')}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                                benefitType === 'LISTING_BOOST'
                                                    ? 'border-forest bg-forest/10 ring-2 ring-forest/20 text-forest font-bold'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Rocket className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-bold">Inserate-Highlight</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-normal">Kostenloser Boost / Top</span>
                                        </button>

                                        {/* Commercial-only: Homepage Spotlight */}
                                        {user.user_type === 'COMMERCIAL' && (
                                            <button
                                                type="button"
                                                onClick={() => setBenefitType('SPOTLIGHT')}
                                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                                    benefitType === 'SPOTLIGHT'
                                                        ? 'border-forest bg-forest/10 ring-2 ring-forest/20 text-forest font-bold'
                                                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                                    <span className="text-xs font-bold">Homepage-Spotlight</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-normal">Startseiten-Präsenz</span>
                                            </button>
                                        )}

                                        {/* Available for both: Credits */}
                                        <button
                                            type="button"
                                            onClick={() => setBenefitType('CREDITS')}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                                benefitType === 'CREDITS'
                                                    ? 'border-forest bg-forest/10 ring-2 ring-forest/20 text-forest font-bold'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <img src="/coin.png" className="w-4 h-4" alt="CC" />
                                                <span className="text-xs font-bold">Credits Gutschrift</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-normal">Campuna Credits (CC)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. If Listing Boost: Listing Selector */}
                                {benefitType === 'LISTING_BOOST' && (
                                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            Zu boostendes Inserat wählen:
                                        </label>
                                        {!user.listings || user.listings.length === 0 ? (
                                            <div className="text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                                                Dieser Benutzer hat aktuell keine Inserate erstellt.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedListingId}
                                                onChange={(e) => setSelectedListingId(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans cursor-pointer"
                                            >
                                                {user.listings.map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.title} ({l.status})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* 3. If Credits: Amount input */}
                                {benefitType === 'CREDITS' && (
                                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            Anzahl Campuna Credits:
                                        </label>
                                        <div className="flex gap-2">
                                            {[500, 1000, 2500, 5000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => setCreditsAmount(amt)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

                                {/* 4. Duration Selector (for Subscriptions, Boosts, Spotlight) */}
                                {benefitType !== 'CREDITS' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                                2. Laufzeit / Gültigkeit:
                                            </label>
                                            <span className="text-[10px] text-slate-400">Keine automatische Verlängerung</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { days: 7, label: '7 Tage' },
                                                { days: 14, label: '14 Tage' },
                                                { days: 30, label: '1 Monat' },
                                                { days: 90, label: '3 Monate' },
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

                                        <div className="space-y-1 pt-1">
                                            <label className="text-[10px] font-semibold text-slate-500">
                                                Oder individuelles Enddatum festlegen (optional):
                                            </label>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 5. Admin Note */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
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
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 leading-relaxed flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>
                                        Dieser Vorteil wird <strong>100% kostenlos</strong> zugewiesen und <strong>endet automatisch</strong> nach Ablauf des Zeitraums. Es findet <strong>keine automatische Abbuchung</strong> statt.
                                    </span>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setBenefitModalOpen(false)}
                                        disabled={grantingBenefit}
                                        className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={grantingBenefit}
                                        className="px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {grantingBenefit ? (
                                            <div className="w-4 h-4 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Gift className="w-4 h-4 text-gold" />
                                        )}
                                        <span>Vorteil kostenlos zuweisen</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

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
    deleteAdminUser
} from '@/api/admin';
import { toast } from 'react-hot-toast';
import PioneerBadge from '@/app/components/PioneerBadge';
import { getImageUrl } from '@/utils/imageUrl';

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1 sm:col-span-2 md:col-span-1 min-w-0">
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
                                                src={getImageUrl(item.main_image, '/collection/camping-zubehoer-hero.png')}
                                                alt={item.title || 'Inserat'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = '/collection/camping-zubehoer-hero.png';
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                                <h3 className="text-base font-black text-slate-900">
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

        </div>
    );
}

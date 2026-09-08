'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
    getMyProfile,
    updateMyProfile,
    getMySubscription,
    getMyFeatures,
    subscribeToPlan,
    cancelSubscription,
    getCreditBalance,
    getReferralStats,
    getReferralsList,
    uploadAvatar,
    uploadCover,
    getInvoices,
    earnSimulatedCredits,
    spendSimulatedCredits,
} from '@/api/profile';
import { getMyListings, boostListing } from '@/api/listings';
import { logoutUser } from '@/api/auth';
import { toast } from 'react-hot-toast';
import CoinIcon from '@/app/components/CoinIcon';
import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2, Plus, Award, AlertTriangle, Sparkles,
    Crown, Calendar, ArrowRight, Receipt, Download, Printer, CreditCard,
    Rocket, Eye, LayoutDashboard, Gift, Users, CheckCircle2, Zap, ExternalLink,
    Clock, TrendingUp, Bell, Search, ShieldCheck, Compass, CheckCircle
} from 'lucide-react';

// ─── Sub-Components ───────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 'lg', onUploadClick, isPioneer = false }) => {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';
    const sizeClasses = size === 'lg'
        ? 'w-24 h-24 md:w-28 md:h-28 text-3xl'
        : size === 'md'
            ? 'w-14 h-14 text-lg'
            : 'w-10 h-10 text-sm';

    return (
        <div className={`relative ${sizeClasses} flex-shrink-0 group`}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={`${sizeClasses} rounded-full object-cover border-2 border-beige shadow-sm`}
                />
            ) : (
                <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-forest via-[#004709] to-[#002204] border-2 border-beige shadow-sm flex items-center justify-center`}>
                    <span className="text-sand font-bold font-sans tracking-wider">{initials}</span>
                </div>
            )}

            {onUploadClick && (
                <button
                    type="button"
                    onClick={onUploadClick}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-full border-2 border-white flex items-center justify-center hover:bg-gold-dark text-forest hover:text-white transition-all shadow-md cursor-pointer hover:scale-110"
                    title="Foto ändern (Max. 5 MB)"
                >
                    <Camera className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const FormField = ({ label, value, editValue, isEditing, onChange, type = 'text', placeholder, icon: Icon, multiline = false, maxLength }) => {
    if (isEditing) {
        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        {Icon && <Icon className="w-3.5 h-3.5 text-forest" />} {label}
                    </label>
                    {maxLength && (
                        <span className="text-[10px] font-mono text-charcoal/40">
                            {(editValue || '').length} / {maxLength}
                        </span>
                    )}
                </div>
                {multiline ? (
                    <textarea
                        value={editValue ?? ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        rows={3}
                        className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none font-sans transition-all"
                    />
                ) : (
                    <input
                        type={type}
                        value={editValue ?? ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-sans transition-all"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-charcoal/50 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                {Icon && <Icon className="w-3.5 h-3.5 text-gold-dark" />} {label}
            </span>
            <span className={`text-sm font-sans ${value ? 'text-charcoal font-medium' : 'text-charcoal/40 italic'}`}>
                {value || `Kein ${label} angegeben`}
            </span>
        </div>
    );
};

const ReferralQuickBadge = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Empfehlungscode kopiert!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={copy}
            className="flex items-center gap-2 bg-[#faf8f3] hover:bg-sand border border-beige hover:border-gold rounded-2xl px-3 py-2 transition-all group w-full text-left cursor-pointer shadow-xs"
        >
            <div className="w-7 h-7 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                <Gift className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-charcoal/50 font-bold uppercase tracking-wider">Dein Empfehlungscode</span>
                <span className="font-mono text-xs font-black text-forest tracking-wide">{code || '—'}</span>
            </div>
            <div className="ml-auto pl-1">
                {copied ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <Check className="w-3 h-3" /> Kopiert
                    </span>
                ) : (
                    <span className="text-charcoal/40 group-hover:text-forest transition-colors p-1">
                        <Copy className="w-3.5 h-3.5" />
                    </span>
                )}
            </div>
        </button>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeinKontoPage() {
    const router = useRouter();
    const { isLoggedIn, user, accessToken, logout } = useAuthStore();

    // Active Navigation Tab
    // 'dashboard' | 'inserate' | 'finanzen' | 'credits' | 'pioneer'
    const [activeTab, setActiveTab] = useState('dashboard');

    // Profile & User State
    const [profile, setProfile] = useState(null);
    const [profileType, setProfileType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState({});
    const [mounted, setMounted] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [achievements, setAchievements] = useState([]);

    // Subscriptions & Billing
    const [subDetails, setSubDetails] = useState({ plan_name: 'FREE', is_business: false });
    const [creditBalance, setCreditBalance] = useState(0);
    const [referralsList, setReferralsList] = useState([]);
    const [referralStats, setReferralStats] = useState({ total: 0, pending: 0, completed: 0 });
    const [upgrading, setUpgrading] = useState(false);

    // Invoices
    const [invoices, setInvoices] = useState([]);
    const [invoicesModalOpen, setInvoicesModalOpen] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Clawback Subscription Cancel Modal
    const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false);
    const [cancellingSub, setCancellingSub] = useState(false);
    const [cancelVerification, setCancelVerification] = useState({
        account_holder: '',
        iban_or_card: '',
        reason: 'Bedarf vorübergehend gedeckt',
        confirm_clawback: false,
    });

    // Inserate Management State
    const [userListings, setUserListings] = useState([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingSearch, setListingSearch] = useState('');
    const [listingStatusFilter, setListingStatusFilter] = useState('ALL');
    const [limitModalOpen, setLimitModalOpen] = useState(false);

    // Boost Modal State
    const [selectedListingForBoost, setSelectedListingForBoost] = useState(null);
    const [boostModalOpen, setBoostModalOpen] = useState(false);
    const [boostDuration, setBoostDuration] = useState(7); // 7, 14, 30 days
    const [boosting, setBoosting] = useState(false);

    // Pioneer Award Modal
    const [badgeModalOpen, setBadgeModalOpen] = useState(false);

    // Refs
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Helper data computed
    const displayName = useMemo(() => {
        if (!profile) return user?.email?.split('@')[0] || 'Camper';
        if (profileType === 'COMMERCIAL') {
            return profile.company_name || profile.first_name || 'Gewerblicher Anbieter';
        }
        return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Camper';
    }, [profile, profileType, user]);

    const avatarSrc = useMemo(() => {
        if (!profile) return null;
        return profileType === 'COMMERCIAL'
            ? profile.logo_url || profile.profile_image_url
            : profile.profile_image_url;
    }, [profile, profileType]);

    const pioneerBadge = useMemo(() => {
        return (achievements || []).find(a => a.badge_key === 'CAMPUNA_PIONEER') || null;
    }, [achievements]);

    const isProfileComplete = useMemo(() => {
        if (!profile) return false;
        if (profileType === 'COMMERCIAL') {
            return Boolean(profile.company_name && profile.bio && profile.location);
        }
        return Boolean(profile.first_name && profile.last_name && profile.bio);
    }, [profile, profileType]);

    const filteredListings = useMemo(() => {
        return userListings.filter(l => {
            const matchesSearch = !listingSearch ||
                (l.title && l.title.toLowerCase().includes(listingSearch.toLowerCase())) ||
                (l.category && l.category.toLowerCase().includes(listingSearch.toLowerCase()));

            const matchesStatus =
                listingStatusFilter === 'ALL' ||
                (listingStatusFilter === 'BOOSTED' ? (l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date())) : l.status === listingStatusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [userListings, listingSearch, listingStatusFilter]);

    // ─── Initial Load & Hydration ─────────────────────────────────────────────

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            if (!isLoggedIn || !accessToken) {
                const timer = setTimeout(() => {
                    router.replace('/login');
                }, 100);
                return () => clearTimeout(timer);
            }
            if (user?.role === 'ADMIN') {
                router.replace('/admin');
            }
        }
    }, [mounted, isLoggedIn, accessToken, user, router]);

    const loadAllAccountData = async () => {
        if (user?.role === 'ADMIN') {
            router.replace('/admin');
            return;
        }

        try {
            setLoading(true);
            const profileRes = await getMyProfile();
            if (profileRes.success) {
                setProfile(profileRes.data.profile);
                setProfileType(profileRes.data.profile_type);
                setDraft(profileRes.data.profile);
                setAchievements(profileRes.data.achievements || []);

                const subRes = await getMySubscription().catch(() => null);
                if (subRes && subRes.success) {
                    setSubDetails({
                        plan_name: subRes.data.plan?.name ?? 'FREE',
                        is_business: subRes.data.is_business ?? false,
                        expires_at: subRes.data.subscription?.expires_at ?? null,
                    });
                }
            } else {
                toast.error(profileRes.error || 'Profil konnte nicht geladen werden.');
            }

            // Load Credit balance
            const creditRes = await getCreditBalance().catch(() => null);
            if (creditRes && creditRes.success) {
                setCreditBalance(creditRes.data?.balance ?? 0);
            }

            // Load Referrals
            const refStatsRes = await getReferralStats().catch(() => null);
            if (refStatsRes && refStatsRes.success) {
                setReferralStats(refStatsRes.data.stats);
            }
            const refListRes = await getReferralsList().catch(() => null);
            if (refListRes && refListRes.success) {
                setReferralsList(refListRes.data.referrals || []);
            }

            // Load Listings
            setListingsLoading(true);
            const listingsRes = await getMyListings().catch(() => null);
            if (listingsRes && listingsRes.success) {
                setUserListings(listingsRes.data.listings || []);
            }
            setListingsLoading(false);
        } catch (err) {
            console.error('Error loading account data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && isLoggedIn) {
            if (user?.role === 'ADMIN') {
                router.replace('/admin');
                return;
            }
            loadAllAccountData();
        }
    }, [mounted, isLoggedIn, user]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleCreateListingClick = () => {
        const limit = 3;
        const activeApprovedListings = userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status));
        const isBusinessUser = subDetails.is_business;
        const isAtLimit = !isBusinessUser && activeApprovedListings.length >= limit;

        if (isAtLimit) {
            setLimitModalOpen(true);
        } else {
            router.push('/anzeige-erstellen');
        }
    };

    const handleEdit = () => {
        setDraft({ ...profile });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraft({ ...profile });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading('Profil wird aktualisiert...');
        try {
            const res = await updateMyProfile(draft);
            if (res.success) {
                setProfile(res.data.profile);
                setIsEditing(false);
                toast.success('Profil erfolgreich gespeichert!', { id: toastId });
            } else {
                toast.error(res.error || 'Speichern fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Netzwerkfehler.', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.');
            return;
        }

        const toastId = toast.loading('Profilbild wird hochgeladen...');
        try {
            const res = await uploadAvatar(file);
            if (res.success) {
                const url = res.data.url;
                setDraft(prev => ({
                    ...prev,
                    [profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url']: url,
                }));
                setProfile(prev => ({
                    ...prev,
                    [profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url']: url,
                }));
                toast.success('Profilbild erfolgreich aktualisiert!', { id: toastId });
            } else {
                toast.error(res.error || 'Upload fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error('Netzwerkfehler beim Upload.', { id: toastId });
        }
    };

    const handleCoverUpload = async (e) => {
        if (profileType !== 'COMMERCIAL') return;
        if (!subDetails.is_business) {
            toast.error('Das Hintergrundbild ist ein exklusives Business-Feature!');
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.');
            return;
        }

        const toastId = toast.loading('Hintergrundbild wird hochgeladen...');
        try {
            const res = await uploadCover(file);
            if (res.success) {
                setDraft(prev => ({ ...prev, cover_image_url: res.data.url }));
                setProfile(prev => ({ ...prev, cover_image_url: res.data.url }));
                toast.success('Hintergrundbild erfolgreich hochgeladen!', { id: toastId });
            } else {
                toast.error(res.error || 'Upload fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error('Netzwerkfehler beim Upload.', { id: toastId });
        }
    };

    const handleOpenBoostModal = (listing) => {
        setSelectedListingForBoost(listing);
        setBoostDuration(7);
        setBoostModalOpen(true);
    };

    const handleExecuteBoost = async () => {
        if (!selectedListingForBoost) return;
        const PRICING = { 7: 500, 14: 900, 30: 1800 };
        const cost = PRICING[boostDuration] || 500;

        if ((Number(creditBalance) || 0) < cost) {
            toast.error(`Nicht genügend Credits (${creditBalance} CC vorhanden, ${cost} CC benötigt).`);
            return;
        }

        setBoosting(true);
        const toastId = toast.loading('Inserat wird geboostet...');
        try {
            const res = await boostListing(selectedListingForBoost.id, boostDuration);
            if (res.success || res.data?.success) {
                toast.success('Inserat erfolgreich geboostet! 🚀', { id: toastId });
                setUserListings(prev => prev.map(l => {
                    if (l.id === selectedListingForBoost.id) {
                        return {
                            ...l,
                            boosted_until: res.data?.boosted_until,
                            is_boosted: true
                        };
                    }
                    return l;
                }));
                if (res.data?.new_balance !== undefined) {
                    setCreditBalance(res.data.new_balance);
                }
                setBoostModalOpen(false);
                setSelectedListingForBoost(null);
            } else {
                toast.error(res.error || res.data?.error || 'Boosten fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Boosten fehlgeschlagen.', { id: toastId });
        } finally {
            setBoosting(false);
        }
    };

    const handleOpenInvoices = async () => {
        setInvoicesModalOpen(true);
        setLoadingInvoices(true);
        try {
            const res = await getInvoices();
            if (res.success) {
                setInvoices(res.data.invoices || []);
            }
        } catch (err) {
            toast.error('Rechnungen konnten nicht geladen werden.');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleAutofillCancelBank = () => {
        const holder = (profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.company_name || user?.email?.split('@')[0] || 'Maximilian Schneider');

        setCancelVerification({
            account_holder: holder,
            iban_or_card: 'DE89 3704 0044 0532 0130 00',
            reason: 'Bedarf vorübergehend gedeckt',
            confirm_clawback: true,
        });
        toast.success('Test-Bankdaten übernommen!', { icon: '💳' });
    };

    const handleCancelSubscriptionConfirm = async (e) => {
        if (e) e.preventDefault();
        if (!cancelVerification.account_holder?.trim() || !cancelVerification.iban_or_card?.trim()) {
            toast.error('Bitte Kontoinhaber und IBAN eingeben.');
            return;
        }
        if (!cancelVerification.confirm_clawback) {
            toast.error('Bitte die Rückbuchung der Credits bestätigen.');
            return;
        }

        setCancellingSub(true);
        const toastId = toast.loading('Kündigung wird verarbeitet...');
        try {
            const res = await cancelSubscription(cancelVerification);
            if (res.success) {
                toast.success(res.message || 'Abonnement gekündigt.', { id: toastId, duration: 5000 });
                setCancelSubModalOpen(false);
                setCancelVerification({
                    account_holder: '',
                    iban_or_card: '',
                    reason: 'Bedarf vorübergehend gedeckt',
                    confirm_clawback: false,
                });
                loadAllAccountData();
            } else {
                toast.error(res.error || 'Kündigung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error('Netzwerkfehler.', { id: toastId });
        } finally {
            setCancellingSub(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error('Logout error:', err);
        }
        logout();
        router.push('/');
        toast.success('Erfolgreich abgemeldet.');
    };

    // ─── Loading View & Guards ───────────────────────────────────────────────────

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-beige">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest to-[#002204] flex items-center justify-center shadow-md">
                        <Loader2 className="w-7 h-7 text-gold animate-spin" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-charcoal font-sans">Konto-Zentrale wird geladen</h3>
                        <p className="text-xs text-charcoal/50 font-sans mt-0.5">Campuna Profil & Services...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (user?.role === 'ADMIN') {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center p-4 font-sans">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-beige max-w-md text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest to-[#002204] flex items-center justify-center shadow-md">
                        <ShieldCheck className="w-7 h-7 text-gold" />
                    </div>
                    <div>
                        <h3 className="font-bold text-charcoal text-lg">Admin-Konto</h3>
                        <p className="text-xs text-charcoal/60 mt-1">
                            Administratoren verwalten alle Plattformfunktionen über das zentrale Administrations-Portal.
                        </p>
                    </div>
                    <button
                        onClick={() => router.replace('/admin')}
                        className="w-full bg-forest hover:bg-[#004d0a] text-sand py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                        Zum Admin-Portal wechseln
                    </button>
                </div>
            </div>
        );
    }

    // Fallback profile if profile data is still syncing
    const effectiveProfile = profile || {
        first_name: user?.email?.split('@')[0] || 'Camper',
        last_name: '',
        bio: 'Willkommen bei Campuna!',
        location: 'Deutschland',
        created_at: new Date().toISOString(),
    };

    // Navigation Items
    const navItems = [
        { id: 'dashboard', label: 'Mein Profil & Übersicht', icon: LayoutDashboard },
        { id: 'inserate', label: 'Meine Inserate', icon: Rocket, count: userListings.length },
        { id: 'finanzen', label: 'Abonnement & Finanzen', icon: Receipt, badge: subDetails.is_business ? 'Business' : 'Free' },
        { id: 'credits', label: 'Campuna Credits', icon: Gift, count: `${Number(creditBalance).toLocaleString('de-DE')} CC` },
        { id: 'pioneer', label: 'Pioneer Status', icon: Award, highlight: Boolean(pioneerBadge) },
    ];

    return (
        <div className="h-screen bg-sand text-charcoal font-sans flex flex-col overflow-hidden">

            {/* Hidden File Upload Inputs */}
            <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
            />
            {profileType === 'COMMERCIAL' && (
                <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                />
            )}

            {/* ── TOP FULL-WIDTH NAVBAR ── */}
            <header className="shrink-0 z-40 w-full bg-white backdrop-blur-md border-b border-beige">
                <div className="w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Brand Logo */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <Link href="/" className="flex items-center gap-1 group cursor-pointer" title="Zur Startseite">
                            <img
                                src="/logo.webp"
                                alt="Campuna"
                                className="h-6 sm:h-8 w-auto object-contain"
                            />
                            <span className="text-lg sm:text-2xl font-normal text-forest leading-none select-none">®</span>
                        </Link>
                    </div>

                    {/* Right: Top Bar Actions */}
                    <div className="flex items-center gap-2 sm:gap-3.5">
                        {/* Credits Pill (Desktop only: md:flex) */}
                        <button
                            onClick={() => setActiveTab('credits')}
                            className="hidden md:flex items-center gap-1.5 sm:gap-2 bg-[#faf8f3] hover:bg-sand border border-beige hover:border-gold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-3xl transition-all cursor-pointer shadow-xs"
                            title="Zu deinen Campuna Credits"
                        >
                            <CoinIcon size="sm" />
                            <span className="hidden sm:inline text-xs font-bold text-charcoal/60 font-sans uppercase tracking-wider">Credits:</span>
                            <span className="text-[11px] sm:text-xs font-black text-forest font-mono">{Number(creditBalance).toLocaleString('de-DE')} CC</span>
                        </button>

                        {/* Create Ad CTA Button (Desktop only: md:flex) */}
                        <button
                            id="btn-quick-create-listing"
                            type="button"
                            onClick={handleCreateListingClick}
                            className="hidden md:flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-3xl text-xs font-bold text-sand bg-forest hover:bg-[#004d0a] transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold shrink-0" />
                            <span className="hidden xs:inline sm:inline">Inserieren</span>
                        </button>

                        {/* Mobile User Icon & Logout (Visible only on mobile < md) */}
                        <div className="flex md:hidden items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('dashboard')}
                                className="cursor-pointer transition-transform active:scale-95"
                                title="Mein Profil"
                            >
                                <Avatar
                                    src={avatarSrc}
                                    name={displayName}
                                    size="sm"
                                    isPioneer={Boolean(pioneerBadge)}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="p-2 text-charcoal/60 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-beige bg-[#faf8f3]"
                                title="Abmelden"
                            >
                                <LogOut className="w-4 h-4 text-rose-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN DASHBOARD CONTAINER ── */}
            <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col bg-white">

                {/* ── MOBILE HORIZONTAL TAB STRIP (Visible only on mobile/tablet < lg) ── */}
                <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-3 shrink-0 border-b border-beige bg-white">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${isActive
                                    ? 'bg-forest text-sand shadow-sm shadow-forest/20 font-black'
                                    : 'bg-white text-charcoal/70 hover:bg-[#faf8f3] border border-beige'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-forest'}`} />
                                <span className="whitespace-nowrap">{item.label}</span>
                                {item.count !== undefined && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#faf8f3] text-charcoal/60 border border-beige'
                                        }`}>
                                        {item.count}
                                    </span>
                                )}
                                {item.badge && (
                                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-gold text-forest' : 'bg-gold/20 text-gold-dark'
                                        }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── MAIN DASHBOARD GRID (Sidebar + Content Hub) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden h-full">

                    {/* ── 1. LEFT SIDEBAR NAVIGATION (Admin Style, Full Height Fixed on side) ── */}
                    <aside className="hidden lg:flex flex-col lg:col-span-2 bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-white rounded-r-3xl p-5 shadow-xl border border-gold/20 justify-between shrink-0 h-full overflow-hidden">

                        <div className="space-y-6">
                            {/* Navigation Header */}
                            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/50">
                                <span className="text-[10px] font-mono tracking-[0.3em] text-white uppercase font-semibold block">
                                    NAVIGATION
                                </span>
                            </div>

                            {/* Nav Items */}
                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                                                ? 'bg-gold text-forest font-bold shadow-md shadow-gold/20'
                                                : 'text-sand/75 hover:text-white hover:bg-white/10 font-medium'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest' : 'text-sand/60 group-hover:text-gold'}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {item.count !== undefined && (
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 ${isActive
                                                    ? 'bg-forest text-sand'
                                                    : 'bg-white/10 text-gold border border-gold/30'
                                                    }`}>
                                                    {item.count}
                                                </span>
                                            )}

                                            {item.badge && (
                                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-black shrink-0 ${isActive
                                                    ? 'bg-forest text-gold'
                                                    : 'bg-gold/20 text-gold border border-gold/40'
                                                    }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Upgrade Widget & Bottom Account Section */}
                        <div className="space-y-4">
                            {!subDetails.is_business && (
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                    <div className="flex items-center gap-1.5 text-gold">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Campuna Club</span>
                                    </div>
                                    <p className="text-[11px] text-sand/80 font-sans leading-relaxed">
                                        Unbegrenzte Inserate & Reichweiten-Boosts freischalten.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/abo/kasse')}
                                        className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-black text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <span>Upgrade</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Bottom User Account Pill (Admin Style) */}
                            <div className="space-y-2.5 pt-4 border-t border-white/10">
                                <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold px-1 block">
                                    BENUTZERKONTO
                                </span>

                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 truncate min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-bold text-xs flex items-center justify-center ring-2 ring-gold/40 shadow-sm shrink-0 overflow-hidden">
                                            {avatarSrc ? (
                                                <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{displayName ? displayName.slice(0, 2).toUpperCase() : 'CU'}</span>
                                            )}
                                        </div>
                                        <div className="truncate text-left">
                                            <h5 className="text-xs font-bold text-white truncate leading-tight">
                                                {displayName}
                                            </h5>
                                            <p className="text-[10px] font-mono text-gold/70 truncate">
                                                {profileType === 'COMMERCIAL' ? 'gewerblich' : 'privat'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        title="Abmelden"
                                        className="p-1.5 text-sand/50 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </aside>

                    {/* ── 2. RIGHT MAIN UNIFIED CONTAINER CANVAS (All sections housed inside) ── */}
                    <div className="lg:col-span-10 flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6  min-w-0">
                        <main className="w-full space-y-6 ">

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 1: DASHBOARD OVERVIEW & PROFILE
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-4">

                                    {/* Top Profile Showcase Hero Card */}
                                    <div className="bg-[#faf8f3] rounded-[2rem] shadow-xs border border-beige overflow-hidden relative">

                                        {/* Cover Banner for Commercial Users */}
                                        {profileType === 'COMMERCIAL' && (
                                            <div className="relative h-44 sm:h-52 bg-gradient-to-r from-[#004709] via-[#002204] to-[#040805] overflow-hidden group">
                                                {(isEditing ? draft?.cover_image_url : profile?.cover_image_url) ? (
                                                    <img
                                                        src={isEditing ? draft?.cover_image_url : profile?.cover_image_url}
                                                        alt="Cover"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                                        <Compass className="w-24 h-24 stroke-[1]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                                {isEditing && (
                                                    !subDetails.is_business ? (
                                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1.5 text-white p-4 text-center z-10 backdrop-blur-xs">
                                                            <Crown className="w-5 h-5 text-gold" />
                                                            <span className="font-bold text-xs uppercase tracking-wider">Hintergrundbild erfordert Business Plan</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => router.push('/abo/kasse')}
                                                                className="bg-gold hover:bg-gold-dark text-charcoal px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer mt-1 shadow-md"
                                                            >
                                                                Upgrade auf Business
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => coverInputRef.current?.click()}
                                                            className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 text-white font-semibold text-xs cursor-pointer z-10"
                                                        >
                                                            <Camera className="w-5 h-5 animate-pulse text-gold" />
                                                            <span>Hintergrundbild ändern</span>
                                                            <span className="text-[9px] text-white/70">(Max. 5 MB)</span>
                                                        </button>
                                                    )
                                                )}

                                                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gold text-forest shadow-sm flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5" /> Gewerblich
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${subDetails.is_business ? 'bg-forest text-sand border border-gold/30' : 'bg-white text-charcoal'}`}>
                                                        {subDetails.is_business ? '★ Business' : 'Free'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profile Details Header Section */}
                                        <div className={`p-6 sm:p-8 ${profileType === 'COMMERCIAL' ? '-mt-12 sm:-mt-14 relative z-20 pt-0' : ''}`}>

                                            {/* View / Edit Mode */}
                                            {isEditing ? (
                                                <div className="space-y-6 pt-2">
                                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                                        <Avatar
                                                            src={avatarSrc}
                                                            name={displayName}
                                                            size="lg"
                                                            onUploadClick={() => avatarInputRef.current?.click()}
                                                            isPioneer={Boolean(pioneerBadge)}
                                                        />

                                                        <div className="flex-1 space-y-4 w-full">
                                                            {profileType === 'PRIVATE' ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <FormField label="Vorname" value={profile?.first_name} editValue={draft.first_name}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, first_name: v }))}
                                                                        placeholder="Vorname" icon={User} />
                                                                    <FormField label="Nachname" value={profile?.last_name} editValue={draft.last_name}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, last_name: v }))}
                                                                        placeholder="Nachname" icon={User} />
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <FormField label="Firmenname" value={profile?.company_name} editValue={draft.company_name}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, company_name: v }))}
                                                                        placeholder="z.B. Alpine Camper GmbH" icon={Building2} />
                                                                    <FormField label="Telefon" value={profile?.phone} editValue={draft.phone}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, phone: v }))}
                                                                        placeholder="+49 30 ..." icon={Phone} type="tel" />
                                                                </div>
                                                            )}

                                                            <FormField
                                                                label="Über mich / Firmen-Info"
                                                                value={profile?.bio}
                                                                editValue={draft.bio}
                                                                isEditing={true}
                                                                onChange={v => setDraft(d => ({ ...d, bio: v }))}
                                                                placeholder={subDetails.is_business ? "Beschreibe dein Angebot (bis zu 1.000 Zeichen)..." : "Beschreibe dein Angebot (bis zu 500 Zeichen)..."}
                                                                multiline
                                                                maxLength={subDetails.is_business ? 1000 : 500}
                                                            />

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <FormField label="Standort" value={profile?.location} editValue={draft.location}
                                                                    isEditing={true} onChange={v => setDraft(d => ({ ...d, location: v }))}
                                                                    placeholder="z.B. München, Bayern" icon={MapPin} />

                                                                {profileType === 'COMMERCIAL' && (
                                                                    <FormField label="Website" value={profile?.website_url} editValue={draft.website_url}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, website_url: v }))}
                                                                        placeholder="https://meine-firma.de" icon={Globe} type="url" />
                                                                )}
                                                            </div>

                                                            {profileType === 'COMMERCIAL' && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-beige">
                                                                    <FormField label="Instagram URL" value={profile?.instagram_url} editValue={draft.instagram_url}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, instagram_url: v }))}
                                                                        placeholder="https://instagram.com/..." icon={AtSign} type="url" />
                                                                    <FormField label="Facebook URL" value={profile?.facebook_url} editValue={draft.facebook_url}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, facebook_url: v }))}
                                                                        placeholder="https://facebook.com/..." icon={Share2} type="url" />
                                                                    <FormField label="USt-IdNr." value={profile?.vat_id} editValue={draft.vat_id}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, vat_id: v }))}
                                                                        placeholder="DE123456789" icon={Shield} />
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-end gap-3 pt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancel}
                                                                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-charcoal/70 bg-[#faf8f3] hover:bg-sand transition-all cursor-pointer border border-beige"
                                                                >
                                                                    Abbrechen
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    id="btn-save-profile"
                                                                    onClick={handleSave}
                                                                    disabled={saving}
                                                                    className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-forest text-sand hover:bg-[#004d0a] transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                                                                >
                                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Save className="w-4 h-4 text-gold" />}
                                                                    <span>{saving ? 'Speichern...' : 'Profil speichern'}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-4 pr-10 sm:pr-12">
                                                    <Avatar
                                                        src={avatarSrc}
                                                        name={displayName}
                                                        size="lg"
                                                        isPioneer={Boolean(pioneerBadge)}
                                                    />

                                                    <div className="flex-1 text-center sm:text-left space-y-3 min-w-0 w-full">
                                                        <div className="space-y-2 max-w-2xl w-full">
                                                            {/* User Name & Badges */}
                                                            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                                                <h2 className="text-xl sm:text-3xl font-black text-forest tracking-tight">
                                                                    {displayName}
                                                                </h2>

                                                                {pioneerBadge ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBadgeModalOpen(true)}
                                                                        className="inline-flex items-center gap-1.5 bg-gold/20 border border-gold/40 text-gold-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-gold/30 transition-all shadow-xs"
                                                                    >
                                                                        <Crown className="w-3.5 h-3.5 text-gold-dark" />
                                                                        <span>Pioneer #{pioneerBadge.position || '300'}</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBadgeModalOpen(true)}
                                                                        className="inline-flex items-center gap-1 bg-[#faf8f3] border border-beige hover:border-gold text-charcoal/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                                                                    >
                                                                        <Award className="w-3.5 h-3.5 text-gold-dark" />
                                                                        <span>Pioneer Award holen</span>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Bio (Directly below name, top of address & email, no separate box) */}
                                                            {profile?.bio && (
                                                                <div className="text-xs sm:text-sm text-charcoal/80 leading-relaxed text-center sm:text-left pt-0.5">
                                                                    {profile.bio.length <= 250 || isBioExpanded ? (
                                                                        <span>{profile.bio}</span>
                                                                    ) : (
                                                                        <span>{profile.bio.slice(0, 250)}...</span>
                                                                    )}
                                                                    {profile.bio.length > 250 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                                                                            className="text-forest hover:underline font-bold text-xs ml-2 inline-block cursor-pointer"
                                                                        >
                                                                            {isBioExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Contact Details & Address (Below Bio) */}
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-charcoal/60 pt-1">
                                                                {profile?.location && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <MapPin className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                                                                        {profile.location}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1.5">
                                                                    <Mail className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                                                                    <span className="truncate max-w-[200px] sm:max-w-none">{user?.email}</span>
                                                                </span>
                                                                {profile?.phone && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Phone className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                                                                        {profile.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Social / Web links for Commercial */}
                                                        {profileType === 'COMMERCIAL' && (profile?.website_url || profile?.instagram_url || profile?.facebook_url) && (
                                                            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 flex-wrap">
                                                                {profile.website_url && (
                                                                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#faf8f3] hover:bg-sand border border-beige px-3 py-1.5 rounded-xl text-xs font-bold text-forest transition-all">
                                                                        <Globe className="w-3.5 h-3.5 text-gold-dark" /> Website
                                                                    </a>
                                                                )}
                                                                {profile.instagram_url && (
                                                                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#faf8f3] hover:bg-sand border border-beige px-3 py-1.5 rounded-xl text-xs font-bold text-forest transition-all">
                                                                        <AtSign className="w-3.5 h-3.5 text-gold-dark" /> Instagram
                                                                    </a>
                                                                )}
                                                                {profile.facebook_url && (
                                                                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#faf8f3] hover:bg-sand border border-beige px-3 py-1.5 rounded-xl text-xs font-bold text-forest transition-all">
                                                                        <Share2 className="w-3.5 h-3.5 text-gold-dark" /> Facebook
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Edit Button (Always top right on every device) */}
                                                    <button
                                                        id="btn-edit-profile"
                                                        onClick={handleEdit}
                                                        className="absolute top-0 right-0 flex items-center justify-center bg-[#faf8f3] hover:bg-sand border border-beige hover:border-forest/40 text-forest p-2.5 rounded-2xl transition-all shadow-xs cursor-pointer group"
                                                        title="Profil bearbeiten"
                                                    >
                                                        <Edit3 className="w-4 h-4 text-gold-dark group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── EXECUTIVE TWO-COLUMN WIDGETS GRID ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                                        {/* Left Column: Quick Listings Hub (7 cols) */}
                                        <div className="md:col-span-7 space-y-6">

                                            {/* Active Listings Card */}
                                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-beige space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                            <Rocket className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-charcoal text-sm">Meine Inserate</h3>
                                                            <p className="text-[11px] text-charcoal/50 font-medium">
                                                                {userListings.length} {userListings.length === 1 ? 'Angebot online' : 'Angebote online'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('inserate')}
                                                        className="text-xs font-bold text-forest hover:text-gold-dark flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                        <span>Alle verwalten</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Listings preview list */}
                                                {listingsLoading ? (
                                                    <div className="py-12 flex justify-center">
                                                        <Loader2 className="w-7 h-7 animate-spin text-forest" />
                                                    </div>
                                                ) : userListings.length === 0 ? (
                                                    <div className="bg-[#faf8f3] border border-dashed border-beige rounded-2xl p-6 text-center space-y-3">
                                                        <p className="text-xs text-charcoal/60 font-medium">Du hast noch keine Fahrzeuge oder Zubehör inseriert.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateListingClick}
                                                            className="inline-flex items-center gap-1.5 bg-forest text-sand px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#004d0a] transition-all shadow-sm"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 text-gold" /> Erstes Inserat schalten
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {userListings.slice(0, 3).map((item) => {
                                                            const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                                                            const img = item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500';

                                                            return (
                                                                <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-[#faf8f3] hover:bg-sand border border-beige rounded-2xl transition-all">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <img src={img} alt={item.title} className="w-14 h-14 rounded-xl object-cover border border-white shadow-xs shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <span className={`px-2 py-0.2 rounded-md text-[9px] font-black uppercase ${item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                                    {item.status === 'APPROVED' ? 'Veröffentlicht' : 'In Prüfung'}
                                                                                </span>
                                                                                {isBoosted && (
                                                                                    <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-gold/20 text-gold-dark flex items-center gap-0.5">
                                                                                        Geboostet
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <h4 className="font-bold text-xs text-charcoal truncate mt-0.5">{item.title}</h4>
                                                                            <span className="text-xs font-black text-forest font-mono">
                                                                                {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenBoostModal(item)}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gold/15 border border-beige hover:border-gold text-[10px] font-bold text-charcoal transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                                            title="Mit Campuna Credits boosten"
                                                                        >
                                                                            <Rocket className="w-3 h-3 text-gold-dark" />
                                                                            <span>Boosten</span>
                                                                        </button>
                                                                        <Link
                                                                            href={`/inserate/${item.slug || item.id}`}
                                                                            className="p-1.5 rounded-xl bg-white hover:bg-sand border border-beige text-charcoal/60 hover:text-forest transition-all"
                                                                            title="Inserat ansehen"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent Activity Timeline Widget */}
                                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-beige space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
                                                            <Clock className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-charcoal text-sm">Letzte Aktivitäten</h3>
                                                            <p className="text-[11px] text-charcoal/50 font-medium">Status & Plattform-Ereignisse</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 text-xs">
                                                    <div className="flex items-start gap-3 p-3 bg-[#faf8f3] rounded-2xl border border-beige">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-charcoal">Konto erfolgreich verifiziert</p>
                                                            <p className="text-[11px] text-charcoal/60">Du kannst Angebote einstellen und mit Käufern chatten.</p>
                                                        </div>
                                                        <span className="text-[10px] text-charcoal/40 shrink-0">Aktiv</span>
                                                    </div>

                                                    {subDetails.is_business && (
                                                        <div className="flex items-start gap-3 p-3 bg-[#faf8f3] rounded-2xl border border-beige">
                                                            <div className="w-6 h-6 rounded-full bg-gold/20 text-gold-dark flex items-center justify-center shrink-0 mt-0.5">
                                                                <Crown className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-charcoal">Campuna Business Status aktiv</p>
                                                                <p className="text-[11px] text-charcoal/60">Unbegrenzte Inserate und Premium Support freigeschaltet.</p>
                                                            </div>
                                                            <span className="text-[10px] text-emerald-600 font-bold shrink-0">Premium</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-start gap-3 p-3 bg-[#faf8f3] rounded-2xl border border-beige">
                                                        <div className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                                                            <Gift className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-charcoal">Campuna Credits Wallet bereit</p>
                                                            <p className="text-[11px] text-charcoal/60">{Number(creditBalance).toLocaleString('de-DE')} CC verfügbar für Boosts & Spotlight.</p>
                                                        </div>
                                                        <span className="text-[10px] text-charcoal/40 shrink-0">Live</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Right Column: Business & Credits Summary (5 cols) */}
                                        <div className="md:col-span-5 space-y-6">

                                            {/* Business Plan Card */}
                                            <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-[2rem] p-6 text-sand shadow-md space-y-4 relative overflow-hidden border border-gold/20">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                                                        <Crown className="w-3.5 h-3.5" /> Abonnement
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-sand">
                                                        {subDetails.is_business ? 'Business Aktiv' : 'Kostenloser Tarif'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h4 className="text-xl font-black text-white">{subDetails.is_business ? 'Campuna Business Plan' : 'Free Standard Plan'}</h4>
                                                    <p className="text-xs text-sand/80 mt-1 leading-relaxed">
                                                        {subDetails.is_business
                                                            ? 'Volle Händler-Sichtbarkeit und unbegrenzte Fahrzeug-Angebote.'
                                                            : 'Erstelle bis zu 3 aktive Inserate auf Campuna.'}
                                                    </p>
                                                </div>

                                                {/* Benefits Checklist */}
                                                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-sand/90">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>{subDetails.is_business ? 'Unbegrenzte Inserate' : 'Maximal 3 aktive Inserate'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>{subDetails.is_business ? 'Individuelles Cover-Hintergrundbild' : 'Standard Profilansicht'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>{subDetails.is_business ? '1.000 Zeichen Profilbeschreibung' : '500 Zeichen Kurzprofil'}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="pt-3 space-y-2">
                                                    {subDetails.is_business ? (
                                                        <div className="space-y-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleOpenInvoices}
                                                                className="w-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                            >
                                                                <Receipt className="w-3.5 h-3.5 text-gold" />
                                                                <span>Rechnungen ansehen</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCancelSubModalOpen(true)}
                                                                className="w-full text-center text-[11px] text-sand/60 hover:text-rose-300 transition-colors py-1 cursor-pointer"
                                                            >
                                                                Abonnement kündigen
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push('/abo/kasse')}
                                                            className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                                                        >
                                                            <span>Auf Business Upgraden (29 €)</span>
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Credits & Referral Widget Card */}
                                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-beige space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark shadow-xs">
                                                            <CoinIcon size="md" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-charcoal text-sm">Credits & Freunde</h3>
                                                            <p className="text-[11px] text-charcoal/50 font-medium">Guthaben für Boosts</p>
                                                        </div>
                                                    </div>

                                                    <span className="text-sm font-black font-mono text-forest">
                                                        {Number(creditBalance).toLocaleString('de-DE')} CC
                                                    </span>
                                                </div>

                                                <p className="text-xs text-charcoal/60 leading-relaxed">
                                                    Lade andere Camper oder Händler ein und erhalte sofort Campuna Credits für jede erfolgreiche Registrierung.
                                                </p>

                                                {user?.referral_code && (
                                                    <ReferralQuickBadge code={user.referral_code} />
                                                )}

                                                <div className="pt-2 flex items-center justify-between text-xs border-t border-beige">
                                                    <span className="text-charcoal/50">Erfolgreiche Einladungen:</span>
                                                    <span className="font-black text-charcoal font-mono">{referralStats.completed || 0}</span>
                                                </div>
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                            TAB 2: MEINE INSERATE (DEDICATED LISTINGS MANAGER)
                           ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'inserate' && (
                                <div className="space-y-6">

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-beige">
                                        <div>
                                            <h2 className="text-xl font-black text-forest">Meine Inserate verwalten</h2>
                                            <p className="text-xs text-charcoal/60 mt-0.5">Übersicht aller deiner eingestellten Camping-Fahrzeuge & Zubehör</p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCreateListingClick}
                                            className="flex items-center gap-2 bg-forest text-sand hover:bg-[#004d0a] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 text-gold" />
                                            <span>Neues Inserat erstellen</span>
                                        </button>
                                    </div>

                                    {/* Filter & Search Toolbar */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                        {/* Status Pills (Scrollable on mobile) */}
                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto -mx-1 px-1">
                                            {[
                                                { id: 'ALL', label: `Alle (${userListings.length})` },
                                                { id: 'APPROVED', label: `Veröffentlicht (${userListings.filter(l => l.status === 'APPROVED').length})` },
                                                { id: 'REVIEW', label: `In Prüfung (${userListings.filter(l => l.status === 'REVIEW').length})` },
                                                { id: 'BOOSTED', label: `Geboostet 🚀` },
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setListingStatusFilter(tab.id)}
                                                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${listingStatusFilter === tab.id
                                                        ? 'bg-forest text-sand shadow-sm'
                                                        : 'bg-[#faf8f3] text-charcoal/70 hover:bg-sand border border-beige'
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>


                                    </div>

                                    {/* Listings Grid */}
                                    {listingsLoading ? (
                                        <div className="py-16 flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-forest" />
                                        </div>
                                    ) : filteredListings.length === 0 ? (
                                        <div className="py-16 text-center bg-[#faf8f3] rounded-3xl border border-dashed border-beige p-8 space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto text-forest">
                                                <Rocket className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-charcoal text-sm">Keine Inserate gefunden</h3>
                                            <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                                                {listingSearch || listingStatusFilter !== 'ALL'
                                                    ? 'Keine Ergebnisse für deine Filtereinstellungen.'
                                                    : 'Erstelle jetzt dein erstes Inserat und erreiche Tausende Camper!'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {filteredListings.map((item) => {
                                                const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                                                const img = item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600';

                                                return (
                                                    <div key={item.id} className="bg-white border border-beige hover:border-forest/40 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                                                        <div>
                                                            <div className="relative aspect-[16/9] bg-stone-100">
                                                                <img src={img} alt={item.title} className="w-full h-full object-cover" />
                                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-xs ${item.status === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}`}>
                                                                        {item.status === 'APPROVED' ? 'Veröffentlicht' : 'In Prüfung'}
                                                                    </span>
                                                                    {isBoosted && (
                                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest shadow-xs flex items-center gap-1">
                                                                            Geboostet
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="p-4 space-y-2">
                                                                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-charcoal/50">
                                                                    <span>{item.category || 'Wohnmobil'}</span>
                                                                    {item.location && <span className="truncate max-w-[120px]">{item.location}</span>}
                                                                </div>
                                                                <h4 className="font-bold text-sm text-charcoal line-clamp-1">{item.title}</h4>
                                                                <div className="text-base font-black text-forest font-mono">
                                                                    {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                                    {item.negotiable && <span className="text-[10px] font-sans font-normal text-charcoal/40 ml-1">VB</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 pt-0 flex items-center justify-between gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenBoostModal(item)}
                                                                className="flex-1 flex items-center justify-center gap-1.5 bg-[#faf8f3] hover:bg-gold/15 border border-beige hover:border-gold text-forest py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                            >
                                                                <Rocket className="w-3.5 h-3.5 text-gold-dark" />
                                                                <span>Boosten</span>
                                                            </button>

                                                            <Link
                                                                href={`/inserate/${item.slug || item.id}`}
                                                                className="flex items-center justify-center gap-1 bg-forest hover:bg-[#004d0a] text-sand py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                            >
                                                                <span>Ansehen</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                            TAB 3: ABONNEMENT & RECHNUNGEN
                           ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'finanzen' && (
                                <div className="space-y-6">

                                    {/* Plan Status Hero */}
                                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-beige space-y-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-beige">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gold-dark">Dein Tarif</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${subDetails.is_business ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
                                                        {subDetails.is_business ? 'Aktiv' : 'Kostenlos'}
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl font-black text-forest mt-1">
                                                    {subDetails.is_business ? 'Campuna Business Plan' : 'Campuna Free Standard Plan'}
                                                </h2>
                                            </div>

                                            {subDetails.is_business ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setCancelSubModalOpen(true)}
                                                    className="px-4 py-2 rounded-full text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-200"
                                                >
                                                    Abonnement kündigen
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => router.push('/abo/kasse')}
                                                    className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal transition-all shadow-md cursor-pointer"
                                                >
                                                    Jetzt auf Business upgraden (29 €)
                                                </button>
                                            )}
                                        </div>

                                        {/* Features Table / Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-2">
                                                <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider">Aktive Funktionen</h4>
                                                <ul className="space-y-1.5 text-xs text-charcoal/80">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>{subDetails.is_business ? 'Unbegrenzt aktive Inserate' : 'Bis zu 3 aktive Inserate'}</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>{subDetails.is_business ? 'Händler-Profil mit Logo & Cover' : 'Basis-Profil'}</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>{subDetails.is_business ? 'Direkte Kundenkontakt-Tools' : 'Standard Kontaktformular'}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-2">
                                                <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider">Abrechnungs-Details</h4>
                                                <p className="text-xs text-charcoal/60 leading-relaxed">
                                                    {subDetails.is_business
                                                        ? `Dein Abonnement verlängert sich monatlich automatisch. Nächste Abrechnung: ${subDetails.expires_at ? new Date(subDetails.expires_at).toLocaleDateString('de-DE') : 'In 30 Tagen'}.`
                                                        : 'Du nutzt derzeit das kostenfreie Inserieren. Bei Bedarf kannst du jederzeit flexibel auf Business wechseln.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoices Section */}
                                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-beige space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                            <div className="flex items-center gap-2.5">
                                                <Receipt className="w-5 h-5 text-gold-dark" />
                                                <h3 className="font-black text-charcoal text-lg">Rechnungen & Zahlungsbelege</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleOpenInvoices}
                                                className="px-4 py-1.5 rounded-full text-xs font-bold text-forest bg-[#faf8f3] hover:bg-sand border border-beige transition-all cursor-pointer"
                                            >
                                                Aktualisieren
                                            </button>
                                        </div>

                                        <p className="text-xs text-charcoal/60 leading-relaxed">
                                            Hier findest du alle Rechnungen für deine Business-Tarife und Zusatzbuchungen inklusive ausgewiesener 19% MwSt. als PDF.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={handleOpenInvoices}
                                            className="inline-flex items-center gap-2 bg-forest text-sand px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#004d0a] transition-all shadow-md cursor-pointer"
                                        >
                                            <Receipt className="w-4 h-4 text-gold" />
                                            <span>Alle Rechnungen & PDF-Belege öffnen</span>
                                        </button>
                                    </div>

                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                            TAB 4: CAMPUNA CREDITS & EMPFEHLUNGEN
                           ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'credits' && (
                                <div className="space-y-6">

                                    {/* Wallet Hero Card */}
                                    <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-[2rem] p-5 sm:p-8 text-sand shadow-md relative overflow-hidden border border-gold/20">
                                        {/* Subtle Background Ambient Glow */}
                                        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

                                        <div className="flex flex-row items-center justify-between gap-4 sm:gap-4 relative z-10">
                                            {/* Left: Balance & Wallet info */}
                                            <div className="flex-1 space-y-2 sm:space-y-3 text-left min-w-0">
                                                <div>
                                                    <span className="text-[11px] sm:text-xs text-sand/70 font-sans uppercase tracking-wider block">Aktuelles Guthaben:</span>
                                                    <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black font-mono text-gold mt-0.5 tracking-tight">
                                                        {Number(creditBalance).toLocaleString('de-DE')} CC
                                                    </div>
                                                </div>

                                                <p className="text-[11px] sm:text-xs md:text-sm text-sand/80 leading-relaxed max-w-xl">
                                                    Campuna Credits kannst du für Inserate-Boosts . Verdiene Credits, indem du Freunde und Händler einlädst! und Business-Abonnements einlösen!
                                                </p>
                                            </div>

                                            {/* Right: Big 3D Golden Coin Asset (Row on all devices) */}
                                            <div className="shrink-0 flex items-center justify-center relative p-1 sm:p-2">
                                                <div className="absolute inset-0 bg-gold/25 rounded-full blur-xl sm:blur-2xl transform scale-90 pointer-events-none" />
                                                <img
                                                    src="/coin.png"
                                                    alt="Campuna Credits"
                                                    className="w-20 h-20 xs:w-24 xs:h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain drop-shadow-[0_10px_25px_rgba(200,169,107,0.45)] select-none pointer-events-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Referral Engine Box */}
                                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-beige space-y-6">
                                        <div className="pb-4 border-b border-beige">
                                            <h3 className="text-lg font-black text-forest">Freunde & Händler einladen</h3>
                                            <p className="text-xs text-charcoal/60 mt-0.5">Verteile deinen persönlichen Code und erhalte automatisch Prämien-Credits.</p>
                                        </div>

                                        {user?.referral_code ? (
                                            <div className="space-y-4">
                                                <ReferralQuickBadge code={user.referral_code} />

                                                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                                                    <div className="p-2.5 sm:p-4 bg-[#faf8f3] rounded-2xl border border-beige text-center flex flex-col items-center justify-center">
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-charcoal/50 uppercase tracking-wider leading-tight">Gesamt Eingeladen</span>
                                                        <p className="text-base sm:text-2xl font-black text-forest font-mono mt-1">{referralStats.total || 0}</p>
                                                    </div>
                                                    <div className="p-2.5 sm:p-4 bg-[#faf8f3] rounded-2xl border border-beige text-center flex flex-col items-center justify-center">
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-charcoal/50 uppercase tracking-wider leading-tight">Ausstehend</span>
                                                        <p className="text-base sm:text-2xl font-black text-amber-700 font-mono mt-1">{referralStats.pending || 0}</p>
                                                    </div>
                                                    <div className="p-2.5 sm:p-4 bg-[#faf8f3] rounded-2xl border border-beige text-center flex flex-col items-center justify-center">
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-charcoal/50 uppercase tracking-wider leading-tight">Erfolgreich Vergütet</span>
                                                        <p className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-1">{referralStats.completed || 0}</p>
                                                    </div>
                                                </div>

                                                {/* Invites list */}
                                                <div className="pt-4 border-t border-beige space-y-3">
                                                    <h4 className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
                                                        Deine Einladungen ({referralsList.length})
                                                    </h4>

                                                    {referralsList.length === 0 ? (
                                                        <p className="text-xs text-charcoal/40 italic py-2">Noch keine Einladungen vorgenommen.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {referralsList.map((ref) => (
                                                                <div key={ref.id} className="flex items-center justify-between p-3 bg-[#faf8f3] rounded-2xl border border-beige text-xs">
                                                                    <div>
                                                                        <p className="font-bold text-charcoal">{ref.referred_name || 'Campuna Mitglied'}</p>
                                                                        <p className="text-[10px] text-charcoal/50 uppercase">{ref.referred_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}</p>
                                                                    </div>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${ref.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                        {ref.status === 'COMPLETED' ? 'Erfolgreich' : 'Ausstehend'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-charcoal/40">Kein Empfehlungscode verfügbar.</p>
                                        )}
                                    </div>

                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                            TAB 5: PIONEER STATUS
                           ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'pioneer' && (
                                <div className="space-y-6">
                                    <div className="text-center max-w-xl mx-auto space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gold to-sand flex items-center justify-center mx-auto shadow-md border-4 border-white">
                                            <Crown className="w-10 h-10 text-forest" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-widest text-gold-dark">Exklusives Mitglied</span>
                                            <h2 className="text-2xl sm:text-3xl font-black text-forest mt-1">Campuna Pioneer Award</h2>
                                        </div>
                                        <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                                            Der <strong>Pioneer Award</strong> ist streng limitiert auf die ersten <strong>300 qualifizierten Mitglieder</strong> von Campuna. Als Pioneer genießt du dauerhaftes Vertrauen und exklusive Abzeichen.
                                        </p>
                                    </div>

                                    {/* Progress Checklist */}
                                    <div className="bg-[#faf8f3] p-6 rounded-3xl border border-beige space-y-4 max-w-xl mx-auto">
                                        <h4 className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">Qualifikations-Fortschritt</h4>

                                        <div className="space-y-3 text-xs">
                                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isProfileComplete ? 'bg-forest' : 'bg-stone-300'}`}>
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                    <span className="font-bold text-charcoal">Profil vollständig ausgefüllt</span>
                                                </div>
                                                <span className={`font-black uppercase text-[10px] ${isProfileComplete ? 'text-emerald-600' : 'text-charcoal/40'}`}>
                                                    {isProfileComplete ? 'Erfüllt' : 'Ausstehend'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${userListings.filter(l => l.status === 'APPROVED').length >= 3 ? 'bg-forest' : 'bg-stone-300'}`}>
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                    <span className="font-bold text-charcoal">Mindestens 3 freigegebene Inserate</span>
                                                </div>
                                                <span className="font-black font-mono text-forest">
                                                    {userListings.filter(l => l.status === 'APPROVED').length} / 3
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2 text-center">
                                            {pioneerBadge ? (
                                                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-gold-dark" />
                                                    <span>Glückwunsch! Du bist Pioneer #{pioneerBadge.position || '1'}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleCreateListingClick}
                                                    className="bg-forest text-sand px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#004d0a] transition-all shadow-md cursor-pointer"
                                                >
                                                    Inserat erstellen & Qualifizieren
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}

                        </main>
                    </div>

                </div>

            </div>

            {/* ═════════════════════════════════════════════════════════════════════════
                ALL MODALS PRESERVED & ENHANCED WITH UNIFIED THEME
               ═════════════════════════════════════════════════════════════════════════ */}

            {/* 1. Boost with Credits Modal */}
            <AnimatePresence>
                {boostModalOpen && selectedListingForBoost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-beige p-6 space-y-5 relative"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                <div className="flex items-center gap-2">
                                    <Rocket className="w-5 h-5 text-gold-dark" />
                                    <h3 className="font-black text-charcoal text-lg">Inserat Boosten</h3>
                                </div>
                                <button onClick={() => setBoostModalOpen(false)} className="text-charcoal/40 hover:text-charcoal p-1 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs text-charcoal/70 leading-relaxed">
                                    Wähle die Laufzeit für den <strong>Reichweiten-Boost</strong> deines Inserats <em>"{selectedListingForBoost.title}"</em>:
                                </p>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    {[
                                        { days: 7, cost: 500 },
                                        { days: 14, cost: 900 },
                                        { days: 30, cost: 1800 },
                                    ].map(pkg => (
                                        <button
                                            key={pkg.days}
                                            type="button"
                                            onClick={() => setBoostDuration(pkg.days)}
                                            className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${boostDuration === pkg.days ? 'border-forest bg-forest text-sand shadow-md' : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand'}`}
                                        >
                                            <span className="text-xs font-black block">{pkg.days} Tage</span>
                                            <span className={`text-[11px] font-mono font-bold ${boostDuration === pkg.days ? 'text-gold' : 'text-forest'}`}>{pkg.cost} CC</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-3 bg-[#faf8f3] rounded-2xl border border-beige flex items-center justify-between text-xs">
                                    <span className="text-charcoal/60">Dein Guthaben:</span>
                                    <span className="font-mono font-black text-forest">{Number(creditBalance).toLocaleString('de-DE')} CC</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleExecuteBoost}
                                    disabled={boosting}
                                    className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {boosting ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Rocket className="w-4 h-4 text-gold" />}
                                    <span>{boosting ? 'Wird geboostet...' : 'Jetzt Boosten'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBoostModalOpen(false)}
                                    className="px-4 bg-[#faf8f3] text-charcoal hover:bg-sand rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer border border-beige"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Limit Reached Modal */}
            <AnimatePresence>
                {limitModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-beige p-6 space-y-5 text-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="font-black text-charcoal text-lg">Inserate-Limit erreicht (3 / 3)</h3>
                                <p className="text-xs text-charcoal/70 leading-relaxed mt-1">
                                    Im kostenfreien Tarif können maximal 3 Inserate gleichzeitig aktiv sein. Mit <strong>Campuna Business</strong> kannst du unbegrenzt inserieren!
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setLimitModalOpen(false); router.push('/abo/kasse'); }}
                                    className="flex-1 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                >
                                    Auf Business Upgraden
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLimitModalOpen(false)}
                                    className="px-4 bg-[#faf8f3] text-charcoal rounded-2xl text-xs font-bold uppercase cursor-pointer border border-beige"
                                >
                                    Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Invoices Modal */}
            <AnimatePresence>
                {invoicesModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-beige p-6 space-y-4 max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-gold-dark" />
                                    <h3 className="font-black text-charcoal text-lg">Rechnungen & Belege</h3>
                                </div>
                                <button onClick={() => setInvoicesModalOpen(false)} className="text-charcoal/40 hover:text-charcoal p-1 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {loadingInvoices ? (
                                    <div className="py-12 flex justify-center">
                                        <Loader2 className="w-7 h-7 animate-spin text-forest" />
                                    </div>
                                ) : invoices.length === 0 ? (
                                    <p className="text-xs text-charcoal/40 text-center py-10">Keine Rechnungen vorhanden.</p>
                                ) : (
                                    invoices.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between p-3.5 bg-[#faf8f3] rounded-2xl border border-beige text-xs">
                                            <div>
                                                <p className="font-black text-charcoal">{inv.invoice_number || `INV-${inv.id}`}</p>
                                                <p className="text-[10px] text-charcoal/40">{new Date(inv.date || inv.created_at).toLocaleDateString('de-DE')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-forest font-mono">{(inv.amount_cents / 100).toFixed(2)} €</p>
                                                <span className="text-[9px] text-emerald-700 font-bold uppercase">Bezahlt (19% MwSt.)</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-2 text-right border-t border-beige">
                                <button
                                    onClick={() => setInvoicesModalOpen(false)}
                                    className="bg-[#faf8f3] hover:bg-sand px-5 py-2 rounded-full text-xs font-bold uppercase cursor-pointer border border-beige"
                                >
                                    Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Cancel Subscription Modal */}
            <AnimatePresence>
                {cancelSubModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                <h3 className="font-black text-rose-600 text-lg">Abonnement kündigen</h3>
                                <button onClick={() => setCancelSubModalOpen(false)} className="text-charcoal/40 hover:text-charcoal p-1 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                Bitte bestätige deine Kontodaten zur Authentifizierung der Kündigung:
                            </p>

                            <button
                                type="button"
                                onClick={handleAutofillCancelBank}
                                className="w-full text-center py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                ⚡ Test-Bankdaten automatisch ausfüllen
                            </button>

                            <form onSubmit={handleCancelSubscriptionConfirm} className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-bold text-charcoal/60 uppercase">Kontoinhaber</label>
                                    <input
                                        type="text"
                                        value={cancelVerification.account_holder}
                                        onChange={e => setCancelVerification(v => ({ ...v, account_holder: e.target.value }))}
                                        className="w-full bg-[#faf8f3] border border-beige rounded-xl px-3 py-2 text-xs text-charcoal mt-1 focus:border-forest"
                                        placeholder="Vor- und Nachname"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-charcoal/60 uppercase">IBAN / Kartennummer</label>
                                    <input
                                        type="text"
                                        value={cancelVerification.iban_or_card}
                                        onChange={e => setCancelVerification(v => ({ ...v, iban_or_card: e.target.value }))}
                                        className="w-full bg-[#faf8f3] border border-beige rounded-xl px-3 py-2 text-xs text-charcoal mt-1 font-mono focus:border-forest"
                                        placeholder="DE89 ..."
                                    />
                                </div>

                                <label className="flex items-center gap-2 pt-2 text-xs text-charcoal/70 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cancelVerification.confirm_clawback}
                                        onChange={e => setCancelVerification(v => ({ ...v, confirm_clawback: e.target.checked }))}
                                        className="rounded text-forest focus:ring-forest"
                                    />
                                    <span>Ich bestätige die Deaktivierung aller Business-Funktionen.</span>
                                </label>

                                <div className="flex gap-2 pt-3">
                                    <button
                                        type="submit"
                                        disabled={cancellingSub}
                                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                                    >
                                        {cancellingSub ? 'Wird gekündigt...' : 'Kündigung bestätigen'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCancelSubModalOpen(false)}
                                        className="px-4 bg-[#faf8f3] text-charcoal rounded-xl text-xs font-bold uppercase cursor-pointer border border-beige"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. Pioneer Badge Modal */}
            <AnimatePresence>
                {badgeModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-beige p-6 space-y-5 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold to-sand flex items-center justify-center mx-auto shadow-md border-2 border-beige">
                                <Crown className="w-8 h-8 text-forest" />
                            </div>

                            <div>
                                <h3 className="font-black text-charcoal text-xl">Campuna Pioneer Status</h3>
                                <p className="text-xs text-charcoal/70 leading-relaxed mt-2">
                                    {pioneerBadge
                                        ? `Glückwunsch! Du bist offizieller Campuna Pioneer an Position #${pioneerBadge.position || '1'}. Danke für deine frühe Unterstützung!`
                                        : 'Fülle dein Profil vollständig aus und erstelle mindestens 3 freigegebene Inserate, um dir einen der ersten 300 Pioneer-Plätze zu sichern.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setBadgeModalOpen(false)}
                                className="w-full bg-forest text-sand hover:bg-[#004d0a] py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                            >
                                Verstanden
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

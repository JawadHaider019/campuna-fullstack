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
import UserDashboard from './components/UserDashboard';


import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2, Plus, Award, AlertTriangle, Sparkles,
    Crown, Calendar, ArrowRight, Receipt, Download, Printer, CreditCard,
    Rocket, Eye, LayoutDashboard, Gift, Users, CheckCircle2, Zap, ExternalLink,
    Clock, TrendingUp, Bell, Search, ShieldCheck, Compass, CheckCircle, Pencil, Send,
    FileSpreadsheet
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
                    className={`${sizeClasses} rounded-full object-cover border-4 border-white shadow-md bg-white`}
                />
            ) : (
                <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-forest via-[#004709] to-[#002204] border-4 border-white shadow-md bg-white flex items-center justify-center`}>
                    <span className="text-sand font-bold font-sans tracking-wider">{initials}</span>
                </div>
            )}

            {onUploadClick && (
                <button
                    type="button"
                    onClick={onUploadClick}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-full border-2 border-white flex items-center justify-center hover:bg-gold-dark text-forest hover:text-white transition-all shadow-md cursor-pointer hover:scale-110 z-20"
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

const TabHeader = ({ title, subtitle, icon: Icon, badge, action }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-beige">
        <div className="flex items-center gap-3 min-w-0">
            {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-forest tracking-tight">
                        {title}
                    </h1>
                    {badge}
                </div>
                {subtitle && (
                    <p className="text-xs text-charcoal/60 mt-0.5 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
        {action && <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
);

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

    // Pending Image Uploads (Staged locally until 'Save' is clicked)
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
    const [pendingCoverFile, setPendingCoverFile] = useState(null);

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
        const source = isEditing ? draft : profile;
        if (!source) return null;
        return profileType === 'COMMERCIAL'
            ? source.logo_url || source.profile_image_url
            : source.profile_image_url;
    }, [profile, draft, isEditing, profileType]);

    const pioneerBadge = useMemo(() => {
        return (achievements || []).find(a => a.badge_key === 'CAMPUNA_PIONEER') || null;
    }, [achievements]);

    const approvedListingsCount = useMemo(() => {
        return userListings.filter(l => l.status === 'APPROVED').length;
    }, [userListings]);

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
                    const isBusiness = subRes.data.is_business ?? false;
                    setSubDetails({
                        plan_name: subRes.data.plan?.name ?? 'FREE',
                        is_business: isBusiness,
                        expires_at: subRes.data.subscription?.expires_at ?? null,
                    });
                    if (isBusiness) {
                        setActiveTab(prev => (prev === 'dashboard' ? 'business_cockpit' : prev));
                    }
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
        setPendingAvatarFile(null);
        setPendingCoverFile(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraft({ ...profile });
        setPendingAvatarFile(null);
        setPendingCoverFile(null);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading('Profil wird gespeichert...');
        try {
            const payload = { ...draft };

            // 1. Upload pending avatar/logo file if newly chosen
            if (pendingAvatarFile) {
                const avatarRes = await uploadAvatar(pendingAvatarFile);
                if (avatarRes && avatarRes.success) {
                    const url = avatarRes.data.url;
                    if (profileType === 'COMMERCIAL') {
                        payload.logo_url = url;
                    } else {
                        payload.profile_image_url = url;
                    }
                } else {
                    toast.error(avatarRes?.error || 'Profilbild-Upload fehlgeschlagen.', { id: toastId });
                    setSaving(false);
                    return;
                }
            } else if (payload[profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url']?.startsWith('blob:')) {
                // Revert blob preview to previous profile URL if no new upload
                payload[profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url'] =
                    profile?.[profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url'] || null;
            }

            // 2. Upload pending cover image file if newly chosen
            if (pendingCoverFile) {
                const coverRes = await uploadCover(pendingCoverFile);
                if (coverRes && coverRes.success) {
                    payload.cover_image_url = coverRes.data.url;
                } else {
                    toast.error(coverRes?.error || 'Hintergrundbild-Upload fehlgeschlagen.', { id: toastId });
                    setSaving(false);
                    return;
                }
            } else if (payload.cover_image_url?.startsWith('blob:')) {
                payload.cover_image_url = profile?.cover_image_url || null;
            }

            // 3. Save profile changes to backend
            const res = await updateMyProfile(payload);
            if (res.success) {
                setProfile(res.data.profile);
                setDraft(res.data.profile);
                setPendingAvatarFile(null);
                setPendingCoverFile(null);
                setIsEditing(false);
                toast.success('Profil erfolgreich gespeichert!', { id: toastId });
            } else {
                toast.error(res.error || 'Speichern fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Netzwerkfehler beim Speichern.', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Bitte lade eine gültige Bilddatei (JPEG, PNG, WEBP) hoch.');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPendingAvatarFile(file);
        setDraft(prev => ({
            ...prev,
            [profileType === 'COMMERCIAL' ? 'logo_url' : 'profile_image_url']: previewUrl,
        }));
        toast.success('Bild ausgewählt. Klicke auf "Profil speichern", um es zu übernehmen.');
        e.target.value = '';
    };

    const handleCoverUpload = (e) => {
        if (profileType !== 'COMMERCIAL') return;
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Bitte lade eine gültige Bilddatei (JPEG, PNG, WEBP) hoch.');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPendingCoverFile(file);
        setDraft(prev => ({ ...prev, cover_image_url: previewUrl }));
        toast.success('Hintergrundbild ausgewählt. Klicke auf "Profil speichern", um es zu übernehmen.');
        e.target.value = '';
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
        ...(subDetails.is_business ? [
            {
                id: 'business_cockpit',
                label: 'Dashboard',
                icon: LayoutDashboard,
                badge: 'PRO',
                highlight: true,
            }
        ] : []),
        { id: 'dashboard', label: subDetails.is_business ? 'Mein Profil' : 'Mein Profil & Übersicht', icon: User },
        { id: 'inserate', label: 'Meine Inserate', icon: Rocket, count: userListings.length },
        { id: 'finanzen', label: 'Abonnement', icon: Crown, badge: subDetails.is_business ? 'Business' : 'Free' },
        { id: 'credits', label: 'Campuna Credits', icon: Gift, count: `${Number(creditBalance).toLocaleString('de-DE')} CC` },
        { id: 'pioneer', label: pioneerBadge ? `Pioneer #${pioneerBadge.position || '300'}` : 'Badge erhalten', icon: Award, highlight: true },
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

                {/* ── MAIN DASHBOARD CONTAINER (Sidebar + Content Hub) ── */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden h-full">

                    {/* ── 1. LEFT SIDEBAR NAVIGATION (Admin Style, Full Height Fixed on side) ── */}
                    <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-white  pr-5 py-4 shadow-xl border border-gold/20 justify-between shrink-0 h-full overflow-hidden">

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
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-3xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                                                ? 'bg-gold text-forest font-bold shadow-md shadow-gold/20'
                                                : 'text-sand/75 hover:text-white hover:bg-white/10 font-medium'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest' : 'text-sand/60 group-hover:text-gold'}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>


                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Upgrade Widget & Bottom Account Section */}
                        <div className="space-y-3 pl-2">
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
                    <div className="flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 min-w-0">
                        <main className="w-full space-y-6">

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 0: PREMIUM BUSINESS DASHBOARD (FOR SUBSCRIBERS)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'business_cockpit' && (
                                subDetails.is_business ? (
                                    <UserDashboard
                                        subDetails={subDetails}
                                        profile={profile}
                                        profileType={profileType}
                                        creditBalance={creditBalance}
                                        userListings={userListings}
                                        onRefreshData={loadAllAccountData}
                                        onOpenInvoices={handleOpenInvoices}
                                        onOpenCancelModal={() => setCancelSubModalOpen(true)}
                                        onOpenBoostModal={handleOpenBoostModal}
                                        onCreateListing={handleCreateListingClick}
                                        user={user}
                                    />
                                ) : (

                                    <div className="space-y-6">
                                        <TabHeader
                                            title="Campuna Business Cockpit"
                                            subtitle="Schalte professionelle Händler-Werkzeuge, unbegrenzte Inserate und Live-Analysen frei"
                                            icon={Crown}
                                            badge={
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gold/20 text-gold-dark border border-gold/40">
                                                    Upgrade verfügbar
                                                </span>
                                            }
                                        />

                                        {/* Business Teaser Hero */}
                                        <div className="rounded-3xl bg-gradient-to-br from-[#003808] via-[#002204] to-[#011403] border border-gold/30 p-8 text-white shadow-xl relative overflow-hidden space-y-6">
                                            <Crown className="absolute right-6 bottom-4 w-60 h-60 text-white/[0.03] pointer-events-none stroke-[1]" />
                                            <div className="relative z-10 max-w-2xl space-y-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-gold text-forest shadow-md">
                                                    <Sparkles className="w-3.5 h-3.5 fill-forest" />
                                                    Exklusiv für Händler & Power-Seller
                                                </span>
                                                <h2 className="text-3xl sm:text-4xl font-black text-sand font-display tracking-tight">
                                                    Maximiere deinen Camping-Erfolg mit dem Campuna Business Plan
                                                </h2>
                                                <p className="text-sm text-sand/80 leading-relaxed font-sans">
                                                    Erhalte Zugriff auf unbegrenzte Fahrzeug-Inserate, automatisierte CSV-Bestandsimporte, Echtzeit-Reichweitenanalysen, direkte Käufer-Leads und 1.000 monatliche Campuna Credits.
                                                </p>
                                                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push('/abo/kasse')}
                                                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-forest font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-gold/30 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <span>Jetzt Business freischalten (29 € / Monat)</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 4 Pillars Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <Rocket className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">∞ Unbegrenzte Inserate</h4>
                                                    <p className="text-xs text-sand/60">Keine 3-Inserate-Begrenzung mehr. Schalte deinen kompletten Fahrzeugbestand.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Echtzeit-KPI Analysen</h4>
                                                    <p className="text-xs text-sand/60">Detaillierte Aufruf- und Lead-Statistiken, CTR und regionale Besucherdaten.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <FileSpreadsheet className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">CSV Bulk-Import</h4>
                                                    <p className="text-xs text-sand/60">Importiere hunderte Fahrzeuge mit einem Klick per CSV-Datei.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Händler-Siegel & Cover</h4>
                                                    <p className="text-xs text-sand/60">Eigenes Schaufenster-Cover, 1.000 Zeichen Bio und verifiziertes Händler-Siegel.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 1: DASHBOARD OVERVIEW & PROFILE
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Mein Profil & Übersicht"
                                        subtitle="Verwalte deine persönlichen Profildaten, aktiven Inserate und Mitgliedschaft"
                                        icon={LayoutDashboard}

                                        action={
                                            !isEditing ? (
                                                <button
                                                    id="btn-edit-profile"
                                                    type="button"
                                                    onClick={handleEdit}
                                                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-sand border border-beige hover:border-gold/50 text-forest font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-full transition-all shadow-xs cursor-pointer group w-full sm:w-auto"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-gold-dark group-hover:scale-110 transition-transform" />
                                                    <span>Profil bearbeiten</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <button
                                                        type="button"
                                                        onClick={handleCancel}
                                                        className="flex-1 sm:flex-initial bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-full transition-all cursor-pointer"
                                                    >
                                                        Abbrechen
                                                    </button>
                                                    <button
                                                        type="button"
                                                        id="btn-save-profile"
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="flex-1 sm:flex-initial bg-forest hover:bg-[#004d0a] text-sand font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Save className="w-4 h-4 text-gold" />}
                                                        <span>{saving ? 'Speichern...' : 'Profil speichern'}</span>
                                                    </button>
                                                </div>
                                            )
                                        }
                                    />

                                    {/* Top Profile Showcase Hero Card */}

                                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-beige overflow-hidden relative">
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
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => coverInputRef.current?.click()}
                                                        className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 text-white font-semibold text-xs cursor-pointer z-10"
                                                    >
                                                        <Camera className="w-5 h-5 animate-pulse text-gold" />
                                                        <span>Hintergrundbild ändern</span>
                                                        <span className="text-[9px] text-white/70">(Max. 5 MB)</span>
                                                    </button>
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

                                        {/* Profile Details Section */}
                                        <div className="p-6 sm:p-7 relative">
                                            {isEditing ? (
                                                <div className="space-y-6">
                                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                                        <div className="shrink-0">
                                                            <Avatar
                                                                src={avatarSrc}
                                                                name={displayName}
                                                                size="lg"
                                                                onUploadClick={() => avatarInputRef.current?.click()}
                                                                isPioneer={Boolean(pioneerBadge)}
                                                            />
                                                        </div>

                                                        <div className="flex-1 space-y-4 w-full min-w-0">
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
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                                    <div className="shrink-0">
                                                        <Avatar
                                                            src={avatarSrc}
                                                            name={displayName}
                                                            size="lg"
                                                            isPioneer={Boolean(pioneerBadge)}
                                                        />
                                                    </div>

                                                    <div className="flex-1 text-center sm:text-left space-y-3 min-w-0 w-full">
                                                        <div className="space-y-2 max-w-2xl w-full">
                                                            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                                                <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-forest tracking-tight">
                                                                    {displayName}
                                                                </h2>

                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#faf8f3] text-charcoal/70 border border-beige">
                                                                    {profileType === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}
                                                                </span>

                                                                {pioneerBadge ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBadgeModalOpen(true)}
                                                                        className="inline-flex items-center gap-1.5 bg-gold/20 border border-gold/40 text-gold-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-gold/30 transition-all shadow-xs"
                                                                        title="Dein Campuna Pioneer Badge Status"
                                                                    >
                                                                        <Crown className="w-3.5 h-3.5 text-gold-dark" />
                                                                        <span>Pioneer #{pioneerBadge.position || '300'}</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBadgeModalOpen(true)}
                                                                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold/20 via-amber-100/80 to-sand border border-gold/50 hover:border-gold text-forest px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-105 hover:shadow-md shadow-xs group"
                                                                        title="Klicke hier, um dir den Campuna Pioneer Badge zu sichern"
                                                                    >
                                                                        <Sparkles className="w-3.5 h-3.5 text-gold-dark group-hover:rotate-12 transition-transform" />
                                                                        <span>Badge erhalten</span>
                                                                    </button>
                                                                )}
                                                            </div>

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
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2-Column Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                        {/* Left Column (7 cols) */}
                                        <div className="lg:col-span-7 space-y-6">
                                            {/* Active Listings Quick Hub */}
                                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-beige">
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
                                                                        <Link
                                                                            href={`/anzeige-erstellen?edit=${item.id}`}
                                                                            className="p-1.5 rounded-xl bg-white hover:bg-sand border border-beige text-charcoal/70 hover:text-forest transition-all"
                                                                            title="Inserat bearbeiten"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenBoostModal(item)}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gold/15 border border-beige hover:border-gold text-[10px] font-bold text-charcoal transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                                            title="Mit Campuna Credits boosten"
                                                                        >
                                                                            <Rocket className="w-3 h-3 text-gold-dark" />
                                                                            <span className="hidden sm:inline">Boosten</span>
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
                                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-beige">
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

                                        {/* Right Column (5 cols) */}
                                        <div className="lg:col-span-5 space-y-6">
                                            {/* Business Plan Card */}
                                            <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-sand shadow-md space-y-4 relative overflow-hidden border border-gold/20">
                                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
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

                                                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-sand/90">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>{subDetails.is_business ? 'Unbegrenzte Inserate' : 'Maximal 3 aktive Inserate'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>Individuelles Cover-Hintergrundbild</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                        <span>{subDetails.is_business ? '1.000 Zeichen Profilbeschreibung' : '500 Zeichen Kurzprofil'}</span>
                                                    </div>
                                                </div>

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
                                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-beige">
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
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Meine Inserate verwalten"
                                        subtitle="Übersicht, Bearbeitung und Reichweiten-Steuerung deiner Camping-Fahrzeuge & Zubehör"
                                        icon={Rocket}
                                        action={
                                            <button
                                                type="button"
                                                onClick={handleCreateListingClick}
                                                className="flex items-center justify-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer w-full sm:w-auto"
                                            >
                                                <Plus className="w-4 h-4 text-gold" />
                                                <span>Neues Inserat erstellen</span>
                                            </button>
                                        }
                                    />

                                    {/* 4 Metric Overview Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-beige shadow-xs flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                                                <Rocket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">Gesamt Inserate</span>
                                                <span className="text-lg sm:text-xl font-black text-charcoal font-mono">{userListings.length}</span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-beige shadow-xs flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 shrink-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">Veröffentlicht</span>
                                                <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                                                    {userListings.filter(l => l.status === 'APPROVED').length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-beige shadow-xs flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">In Prüfung</span>
                                                <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                                                    {userListings.filter(l => l.status === 'REVIEW').length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-beige shadow-xs flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">Geboostet</span>
                                                <span className="text-lg sm:text-xl font-black text-gold-dark font-mono">
                                                    {userListings.filter(l => l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date())).length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filter & Search Toolbar */}
                                    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-beige shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                                        {/* Status Pills */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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

                                        {/* Search Box */}
                                        <div className="relative w-full md:w-72">
                                            <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={listingSearch}
                                                onChange={e => setListingSearch(e.target.value)}
                                                placeholder="Suche nach Titel oder Kategorie..."
                                                className="w-full bg-[#faf8f3] border border-beige rounded-xl pl-9 pr-8 py-1.5 text-xs text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-forest"
                                            />
                                            {listingSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setListingSearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Listings Grid */}
                                    {listingsLoading ? (
                                        <div className="py-20 flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-forest" />
                                        </div>
                                    ) : filteredListings.length === 0 ? (
                                        <div className="py-16 text-center bg-white rounded-2xl sm:rounded-3xl border border-dashed border-beige p-8 space-y-3 shadow-xs">
                                            <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto text-forest">
                                                <Rocket className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-charcoal text-sm sm:text-base">Keine Inserate gefunden</h3>
                                            <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                                                {listingSearch || listingStatusFilter !== 'ALL'
                                                    ? 'Keine Ergebnisse für deine aktuellen Filtereinstellungen.'
                                                    : 'Erstelle jetzt dein erstes Inserat und erreiche tausende Camping-Interessierte!'}
                                            </p>
                                            {(!listingSearch && listingStatusFilter === 'ALL') && (
                                                <button
                                                    type="button"
                                                    onClick={handleCreateListingClick}
                                                    className="inline-flex items-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer mt-2"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-gold" />
                                                    <span>Erstes Inserat erstellen</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                                            {filteredListings.map((item) => {
                                                const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                                                const img = item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600';

                                                return (
                                                    <div key={item.id} className="bg-white border border-beige hover:border-forest/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                                                        <div>
                                                            <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
                                                                <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-xs ${item.status === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}`}>
                                                                        {item.status === 'APPROVED' ? 'Veröffentlicht' : 'In Prüfung'}
                                                                    </span>
                                                                    {isBoosted && (
                                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest shadow-xs flex items-center gap-1">
                                                                            <Zap className="w-3 h-3" /> Geboostet
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="absolute bottom-2.5 left-3 z-10">
                                                                    <span className="px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/60 backdrop-blur-xs text-white">
                                                                        {item.category || 'Camping'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="p-4 sm:p-5 space-y-2">
                                                                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-charcoal/50">
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3 text-gold-dark" />
                                                                        <span className="truncate max-w-[150px]">{item.location || 'Deutschland'}</span>
                                                                    </span>
                                                                    <span>CP-{item.id.slice(-4).toUpperCase()}</span>
                                                                </div>
                                                                <h4 className="font-bold text-sm text-charcoal line-clamp-1 group-hover:text-forest transition-colors">
                                                                    {item.title}
                                                                </h4>
                                                                <div className="flex items-baseline gap-1.5 pt-0.5">
                                                                    <span className="text-base font-black text-forest font-mono">
                                                                        {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                                    </span>
                                                                    {item.negotiable && (
                                                                        <span className="text-[10px] font-bold text-gold-dark bg-gold/15 px-1.5 py-0.2 rounded">
                                                                            VB
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 sm:p-5 pt-0 border-t border-beige/60 mt-2 flex items-center justify-between gap-2">
                                                            <Link
                                                                href={`/anzeige-erstellen?edit=${item.id}`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 bg-[#faf8f3] hover:bg-forest hover:text-sand text-charcoal border border-beige py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                                title="Inserat bearbeiten"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                <span>Bearbeiten</span>
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenBoostModal(item)}
                                                                className="flex-1 flex items-center justify-center gap-1.5 bg-gold/15 hover:bg-gold text-forest border border-gold/40 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                                title="Mit Campuna Credits boosten"
                                                            >
                                                                <Rocket className="w-3.5 h-3.5 text-gold-dark" />
                                                                <span>Boosten</span>
                                                            </button>

                                                            <Link
                                                                href={`/inserate/${item.slug || item.id}`}
                                                                className="p-2 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 hover:text-forest rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                                                                title="Inserat ansehen"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
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
                            {/* ═════════════════════════════════════════════════════════════
                                TAB 3: ABONNEMENT (SUBSCRIPTIONS & PLANS)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'finanzen' && (
                                <div className="space-y-6">
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Abonnement"
                                        subtitle="Dein aktueller Tarif, Inserate-Limits und verfügbare Campuna Mitgliedschaften"
                                        icon={Crown}
                                        badge={
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${subDetails.is_business ? 'bg-emerald-100 text-emerald-800' : 'bg-[#faf8f3] text-charcoal/70 border border-beige'}`}>
                                                {subDetails.is_business ? 'Business Aktiv' : 'Kostenloser Tarif'}
                                            </span>
                                        }
                                    />

                                    {/* ── 1. TOP SECTION: MEIN AKTUELLER TARIF & LIMITS ── */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-beige shadow-xs space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-beige">
                                            <div className="flex items-start sm:items-center gap-3.5">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest to-[#002204] flex items-center justify-center text-gold shadow-md shrink-0">
                                                    <Crown className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h2 className="text-lg sm:text-xl font-black text-forest">
                                                            {subDetails.is_business ? 'Campuna Business Plan' : 'Free Standard Plan'}
                                                        </h2>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${subDetails.is_business ? 'bg-emerald-100 text-emerald-800' : 'bg-forest/10 text-forest'}`}>
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Aktiv
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-charcoal/60 mt-0.5 font-medium">
                                                        {subDetails.is_business 
                                                            ? `Monatlich 29,00 € • Automatische Verlängerung am: ${subDetails.expires_at ? new Date(subDetails.expires_at).toLocaleDateString('de-DE') : 'in 30 Tagen'}`
                                                            : '0,00 € / Monat • Dauerhaft kostenloser Basis-Tarif für Camper & Händler'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                {subDetails.is_business ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenInvoices}
                                                            className="px-4 py-2 bg-[#faf8f3] hover:bg-sand text-charcoal border border-beige rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 text-forest" />
                                                            <span>Rechnungen</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCancelSubModalOpen(true)}
                                                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            Abonnement kündigen
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push('/abo/kasse')}
                                                        className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <span>Auf Business Upgraden (29 €)</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quota & Limits Visualizer Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Metric 1: Inserate Limit */}
                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px]">Inserate-Kontingent</span>
                                                    <span className="font-black text-forest font-mono">
                                                        {subDetails.is_business ? '∞ Unbegrenzt' : `${userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length} / 3 Inserate`}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                {!subDetails.is_business ? (
                                                    <div className="space-y-1.5">
                                                        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length >= 3
                                                                        ? 'bg-rose-500'
                                                                        : userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length === 2
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-forest'
                                                                }`}
                                                                style={{
                                                                    width: `${Math.min(100, Math.round((userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length / 3) * 100))}%`
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-charcoal/60">
                                                            {userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length >= 3
                                                                ? 'Limit erreicht. Upgrade auf Business für unbegrenzte Inserate.'
                                                                : `Noch ${Math.max(0, 3 - userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length)} freie Inserat-Plätze verfügbar.`}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span>Keine Inserate-Begrenzung aktiv</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Metric 2: Profil-Beschreibung */}
                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-2">
                                                <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px]">Beschreibungslänge</span>
                                                <div className="text-xl font-black text-charcoal font-mono">
                                                    {subDetails.is_business ? '1.000 Zeichen' : '500 Zeichen'}
                                                </div>
                                                <p className="text-[11px] text-charcoal/60">
                                                    {subDetails.is_business
                                                        ? 'Erweiterte Unternehmens- & Fahrzeugbeschreibung freigeschaltet.'
                                                        : 'Standard-Kurzprofil für private Anbieter & Basis-Accounts.'}
                                                </p>
                                            </div>

                                            {/* Metric 3: Cover & Branding */}
                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-2">
                                                <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px]">Profil-Branding</span>
                                                <div className="text-xl font-black text-charcoal">
                                                    {subDetails.is_business ? 'Individuelles Cover' : 'Standard Profil'}
                                                </div>
                                                <p className="text-[11px] text-charcoal/60">
                                                    {subDetails.is_business
                                                        ? 'Eigenes Titelbild, Logo & Händler-Impressum aktiv.'
                                                        : 'Basis-Layout ohne benutzerdefiniertes Hintergrundbild.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── 2. MIDDLE SECTION: VERFÜGBARE TARIFE IM VERGLEICH (OTHER PLANS) ── */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black text-forest">Verfügbare Tarife & Mitgliedschaften</h3>
                                            <p className="text-xs text-charcoal/60">Wähle den idealen Plan für deine Camping-Angebote und Reichweite</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                                            {/* Plan Card 1: Free Standard */}
                                            <div className={`rounded-2xl sm:rounded-3xl p-6 flex flex-col justify-between transition-all ${
                                                !subDetails.is_business 
                                                    ? 'bg-white border-2 border-forest/40 shadow-sm relative' 
                                                    : 'bg-white border border-beige shadow-xs hover:border-forest/20'
                                            }`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">Basis-Mitgliedschaft</span>
                                                            <h4 className="text-xl font-black text-charcoal">Free Standard</h4>
                                                        </div>
                                                        {!subDetails.is_business ? (
                                                            <span className="px-3 py-1 bg-forest/10 text-forest text-[10px] font-black uppercase rounded-full border border-forest/20 flex items-center gap-1">
                                                                <Check className="w-3 h-3 text-forest" /> Aktiver Tarif
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-stone-100 text-charcoal/50 text-[10px] font-bold uppercase rounded-full">
                                                                Kostenlos
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-3xl font-black text-charcoal font-mono">0 €</span>
                                                            <span className="text-xs text-charcoal/60 font-medium">/ dauerhaft kostenlos</span>
                                                        </div>
                                                        <p className="text-xs text-charcoal/60 mt-1">Perfekt für Privatpersonen und gelegentliche Verkäufer.</p>
                                                    </div>

                                                    <div className="space-y-2.5 pt-3 border-t border-beige text-xs text-charcoal/80">
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span><strong>Bis zu 3 aktive Inserate</strong> gleichzeitig</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>500 Zeichen Profilbeschreibung</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>Standard-Anbieterprofil & Profilbild</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>Direkte Kundenanfragen per Chat</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-charcoal/40">
                                                            <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                                            <span className="line-through">Individuelles Hintergrund-Cover</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-charcoal/40">
                                                            <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                                            <span className="line-through">Unbegrenzte Inserate</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-6">
                                                    {!subDetails.is_business ? (
                                                        <div className="w-full py-2.5 px-4 bg-[#faf8f3] text-charcoal/70 rounded-xl text-xs font-bold text-center border border-beige cursor-default">
                                                            Aktuell aktiv
                                                        </div>
                                                    ) : (
                                                        <div className="w-full py-2.5 px-4 bg-stone-50 text-charcoal/40 rounded-xl text-xs font-medium text-center border border-beige">
                                                            Enthalten als Basis
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Plan Card 2: Campuna Business */}
                                            <div className={`rounded-2xl sm:rounded-3xl p-6 flex flex-col justify-between transition-all relative overflow-hidden ${
                                                subDetails.is_business
                                                    ? 'bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-sand border-2 border-gold shadow-md'
                                                    : 'bg-white border-2 border-gold shadow-sm hover:shadow-md'
                                            }`}>
                                                {/* Top Ribbon / Badge */}
                                                <div className="absolute top-0 right-0">
                                                    <span className="bg-gradient-to-r from-gold to-gold-dark text-charcoal text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                                                        {subDetails.is_business ? 'Aktiver Plan' : 'Empfohlen'}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className={`flex items-center justify-between pb-3 border-b ${subDetails.is_business ? 'border-white/15' : 'border-beige'}`}>
                                                        <div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${subDetails.is_business ? 'text-gold' : 'text-gold-dark'}`}>
                                                                Pro-Mitgliedschaft
                                                            </span>
                                                            <h4 className={`text-xl font-black ${subDetails.is_business ? 'text-white' : 'text-forest'}`}>
                                                                Campuna Business
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className={`text-3xl font-black font-mono ${subDetails.is_business ? 'text-gold' : 'text-forest'}`}>29,00 €</span>
                                                            <span className={`text-xs font-medium ${subDetails.is_business ? 'text-sand/80' : 'text-charcoal/60'}`}>/ Monat (inkl. MwSt.)</span>
                                                        </div>
                                                        <p className={`text-xs mt-1 ${subDetails.is_business ? 'text-sand/70' : 'text-charcoal/60'}`}>
                                                            Für gewerbliche Händler, Vermieter & Viel-Inserenten.
                                                        </p>
                                                    </div>

                                                    <div className={`space-y-2.5 pt-3 border-t text-xs ${subDetails.is_business ? 'border-white/15 text-sand/90' : 'border-beige text-charcoal/80'}`}>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Unbegrenzt viele aktive Inserate</strong></span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>1.000 Zeichen</strong> erweiterte Profilbeschreibung</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Individuelles Hintergrund-Cover</strong> im Händlerprofil</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span>Vollständiges Händler-Impressum & USt-IdNr.</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span>Direkter Telefon- & Chat-Kontakt für Kunden</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span>Monatlich flexibel kündbar (auch mit 2.900 CC zahlbar)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-6">
                                                    {subDetails.is_business ? (
                                                        <div className="w-full py-3 px-4 bg-gold/20 text-gold rounded-xl text-xs font-black uppercase tracking-wider text-center border border-gold/40 flex items-center justify-center gap-2">
                                                            <Check className="w-4 h-4" />
                                                            <span>Dein aktiver Business-Tarif</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push('/abo/kasse')}
                                                            className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <span>Jetzt auf Business upgraden</span>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── 3. BOTTOM SECTION: RECHNUNGEN & BELEGE ── */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest shrink-0">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-charcoal text-sm sm:text-base">Rechnungen & Zahlungsbelege</h3>
                                                <p className="text-xs text-charcoal/60 mt-0.5">
                                                    Lade alle Rechnungen mit ausgewiesener 19% MwSt. jederzeit bequem als PDF herunter.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleOpenInvoices}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest hover:bg-[#004d0a] text-sand py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer shrink-0"
                                        >
                                            <Receipt className="w-4 h-4 text-gold" />
                                            <span>Rechnungen anzeigen</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 4: CAMPUNA CREDITS & EMPFEHLUNGEN
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'credits' && (
                                <div className="space-y-6">
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Campuna Credits & Freunde"
                                        subtitle="Nutze deine gesammelten Credits für Inserate-Boosts und verdiene neue durch Weiterempfehlungen"
                                        icon={Gift}
                                        action={
                                            <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold-dark px-3.5 py-1.5 rounded-full text-xs font-black font-mono shadow-xs">
                                                <CoinIcon size="sm" />
                                                <span>{Number(creditBalance).toLocaleString('de-DE')} CC</span>
                                            </div>
                                        }
                                    />

                                    {/* Wallet Balance Hero Card */}
                                    <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-sand shadow-md relative overflow-hidden border border-gold/20">
                                        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

                                        <div className="flex flex-row items-center justify-between gap-4 relative z-10">
                                            <div className="flex-1 space-y-2 text-left min-w-0">
                                                <span className="text-[11px] sm:text-xs text-sand/70 font-sans uppercase tracking-wider block">Verfügbares Guthaben</span>
                                                <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-gold tracking-tight">
                                                    {Number(creditBalance).toLocaleString('de-DE')} CC
                                                </div>
                                                <p className="text-xs sm:text-sm text-sand/80 leading-relaxed max-w-xl pt-1">
                                                    1 Credit = 1 Cent Gegenwert. Verwende Credits flexibel für 7-, 14- oder 30-Tage Reichweiten-Boosts deiner Inserate.
                                                </p>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-center relative p-1 sm:p-2">
                                                <div className="absolute inset-0 bg-gold/25 rounded-full blur-xl transform scale-90 pointer-events-none" />
                                                <img
                                                    src="/coin.png"
                                                    alt="Campuna Credits"
                                                    className="w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_10px_25px_rgba(200,169,107,0.45)] select-none pointer-events-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="p-4 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider">Gesamt Eingeladen</span>
                                            <p className="text-xl sm:text-2xl font-black text-forest font-mono mt-1">{referralStats.total || 0}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider">Ausstehend</span>
                                            <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">{referralStats.pending || 0}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-beige shadow-xs text-center flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider">Erfolgreich Vergütet</span>
                                            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">{referralStats.completed || 0}</p>
                                        </div>
                                    </div>

                                    {/* 2-Column Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                        {/* Left Column (7 cols): Share Hub */}
                                        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5">
                                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                        <Gift className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-charcoal text-sm">Freunde & Händler einladen</h3>
                                                        <p className="text-[11px] text-charcoal/50 font-medium">Verteile deinen persönlichen Einladungscode</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {user?.referral_code ? (
                                                <div className="space-y-4">
                                                    <ReferralQuickBadge code={user.referral_code} />

                                                    {/* Quick 3-Step Guide */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">1. Teilen</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Gib deinen Code an Freunde oder Händler weiter.</p>
                                                        </div>
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">2. Anmelden</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Dein Kontakt registriert sich mit deinem Code.</p>
                                                        </div>
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">3. Belohnung</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Du erhältst automatisch Credits gutgeschrieben.</p>
                                                        </div>
                                                    </div>

                                                    {/* Direct Share Buttons */}
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        <a
                                                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Melde dich auf Campuna mit meinem Empfehlungscode ${user.referral_code} an: https://campuna.de/registrieren?ref=${user.referral_code}`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                            <span>WhatsApp</span>
                                                        </a>
                                                        <a
                                                            href={`mailto:?subject=Einladung zu Campuna&body=${encodeURIComponent(`Hallo,\n\nich lade dich herzlich zu Campuna ein. Nutze meinen Empfehlungscode: ${user.referral_code}\n\nLink: https://campuna.de/registrieren?ref=${user.referral_code}`)}`}
                                                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            <Mail className="w-3.5 h-3.5 text-forest" />
                                                            <span>E-Mail</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-charcoal/40">Kein Empfehlungscode verfügbar.</p>
                                            )}
                                        </div>

                                        {/* Right Column (5 cols): Invites List */}
                                        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-charcoal text-sm">Deine Einladungen</h3>
                                                        <p className="text-[11px] text-charcoal/50 font-medium">{referralsList.length} Einladungen registriert</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {referralsList.length === 0 ? (
                                                <div className="py-8 text-center bg-[#faf8f3] rounded-2xl border border-dashed border-beige p-6 space-y-2">
                                                    <p className="text-xs text-charcoal/60 font-medium">Noch keine Einladungen vorhanden.</p>
                                                    <p className="text-[11px] text-charcoal/40">Teile deinen Code mit Camping-Freunden!</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                    {referralsList.map((ref) => (
                                                        <div key={ref.id} className="flex items-center justify-between p-3 bg-[#faf8f3] rounded-xl border border-beige text-xs">
                                                            <div>
                                                                <p className="font-bold text-charcoal">{ref.referred_name || 'Campuna Mitglied'}</p>
                                                                <p className="text-[10px] text-charcoal/50 uppercase">{ref.referred_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}</p>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ref.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                {ref.status === 'COMPLETED' ? 'Erfolgreich' : 'Ausstehend'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 5: PIONEER STATUS
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'pioneer' && (
                                <div className="space-y-6">
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title={pioneerBadge ? "Campuna Pioneer Status" : "Campuna Pioneer Badge erhalten"}
                                        subtitle={pioneerBadge ? "Exklusiver Status & dauerhafte Vorteile für die ersten 300 qualifizierten Campuna Mitglieder" : "Werde einer der ersten 300 Pioniere auf Campuna und sichere dir lebenslange Vorteile für dein Profil & deine Inserate"}
                                        icon={Award}
                                        badge={
                                            pioneerBadge ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gold/20 text-gold-dark border border-gold/40 flex items-center gap-1.5 shadow-xs">
                                                    <Crown className="w-3.5 h-3.5" /> Pioneer #{pioneerBadge.position || '300'}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-gold-dark" /> Badge erhalten (In Qualifikation)
                                                </span>
                                            )
                                        }
                                    />

                                    {/* Pioneer Hero Card */}
                                    <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-sand shadow-md relative overflow-hidden border border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-2 text-center sm:text-left max-w-xl">
                                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gold flex items-center justify-center sm:justify-start gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" /> Streng Limitiert auf 300 Mitglieder
                                            </span>
                                            <h2 className="text-2xl sm:text-3xl font-black text-white">Campuna Pioneer Award</h2>
                                            <p className="text-xs sm:text-sm text-sand/80 leading-relaxed">
                                                Als Pioneer gehörst du zu den ersten 300 geprüften Mitgliedern der Campuna Plattform. Dein Profil und deine Inserate erhalten dauerhaft den goldenen Pioneer-Badge für maximales Vertrauen.
                                            </p>
                                        </div>

                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-gold to-sand flex items-center justify-center shadow-lg border-4 border-white/20 shrink-0">
                                            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-forest" />
                                        </div>
                                    </div>

                                    {/* 2-Column Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                        {/* Left Column (6 cols): Qualification Checklist */}
                                        <div className="lg:col-span-6 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5">
                                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-charcoal text-sm">Qualifikations-Kriterien</h3>
                                                        <p className="text-[11px] text-charcoal/50 font-medium">Automatische Freischaltung bei Erfüllung</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-xs">
                                                <div className="flex items-center justify-between p-3.5 bg-[#faf8f3] rounded-2xl border border-beige">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isProfileComplete ? 'bg-forest' : 'bg-stone-300'}`}>
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-charcoal block">Profil vollständig ausgefüllt</span>
                                                            <span className="text-[11px] text-charcoal/50">Name, Bio und Standort hinterlegt</span>
                                                        </div>
                                                    </div>
                                                    <span className={`font-black uppercase text-[10px] ${isProfileComplete ? 'text-emerald-600' : 'text-charcoal/40'}`}>
                                                        {isProfileComplete ? 'Erfüllt' : 'Ausstehend'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3.5 bg-[#faf8f3] rounded-2xl border border-beige">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${approvedListingsCount >= 3 ? 'bg-forest' : 'bg-stone-300'}`}>
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-charcoal block">Mindestens 3 freigegebene Inserate</span>
                                                            <span className="text-[11px] text-charcoal/50">Von der Moderation genehmigt</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-black font-mono text-forest">
                                                        {approvedListingsCount} / 3
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3.5 bg-[#faf8f3] rounded-2xl border border-beige">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-forest">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-charcoal block">Konto verifiziert</span>
                                                            <span className="text-[11px] text-charcoal/50">Authentifiziertes Benutzerkonto</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-black uppercase text-[10px] text-emerald-600">
                                                        Erfüllt
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                {pioneerBadge ? (
                                                    <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-gold-dark" />
                                                        <span>Glückwunsch! Du bist Pioneer #{pioneerBadge.position || '1'}</span>
                                                    </div>
                                                ) : !isProfileComplete ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsEditing(true); setActiveTab('dashboard'); }}
                                                        className="w-full bg-forest hover:bg-[#004d0a] text-sand py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <Pencil className="w-4 h-4 text-gold" />
                                                        <span>Profil jetzt vervollständigen</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateListingClick}
                                                        className="w-full bg-forest hover:bg-[#004d0a] text-sand py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4 text-gold" />
                                                        <span>Jetzt Inserat schalten & qualifizieren ({Math.max(0, 3 - approvedListingsCount)} erforderlich)</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column (6 cols): Pioneer Privileges */}
                                        <div className="lg:col-span-6 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark">
                                                        <Crown className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-charcoal text-sm">Exklusive Vorteile</h3>
                                                        <p className="text-[11px] text-charcoal/50 font-medium">Dauerhafte Auszeichnungen</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-xs text-charcoal/80">
                                                <div className="p-3.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                                    <h5 className="font-bold text-charcoal flex items-center gap-1.5">
                                                        <Crown className="w-3.5 h-3.5 text-gold-dark" /> Goldener Badge im Profil & Inseraten
                                                    </h5>
                                                    <p className="text-[11px] text-charcoal/60 leading-relaxed">
                                                        Dein Account sticht mit einem exklusiven Siegel hervor und signalisiert Käufern maximale Zuverlässigkeit.
                                                    </p>
                                                </div>

                                                <div className="p-3.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                                    <h5 className="font-bold text-charcoal flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-gold-dark" /> Bevorzugte Platzierung
                                                    </h5>
                                                    <p className="text-[11px] text-charcoal/60 leading-relaxed">
                                                        Deine Angebote erhalten automatische Sichtbarkeits-Boni im Campuna Marktplatz.
                                                    </p>
                                                </div>

                                                <div className="p-3.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                                    <h5 className="font-bold text-charcoal flex items-center gap-1.5">
                                                        <Award className="w-3.5 h-3.5 text-gold-dark" /> Lebenslanger Gründer-Status
                                                    </h5>
                                                    <p className="text-[11px] text-charcoal/60 leading-relaxed">
                                                        Als Pioneer verlierst du deinen Rang nie und wirst bei allen neuen Community-Features bevorzugt.
                                                    </p>
                                                </div>
                                            </div>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
                        onClick={() => setBadgeModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige p-6 sm:p-7 space-y-5 text-center relative overflow-hidden my-auto"
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setBadgeModalOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full text-charcoal/40 hover:text-charcoal hover:bg-sand/60 transition-colors cursor-pointer"
                                title="Schließen"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {pioneerBadge ? (
                                /* ── When User HAS the Badge ── */
                                <div className="space-y-5">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gold via-amber-300 to-sand flex items-center justify-center mx-auto shadow-xl border-4 border-white/80 ring-4 ring-gold/20">
                                        <Crown className="w-10 h-10 text-forest" />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-1.5 bg-gold/20 border border-gold/40 text-gold-dark px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                            <Crown className="w-3.5 h-3.5" /> Pioneer #{pioneerBadge.position || '1'}
                                        </span>
                                        <h3 className="font-display font-black text-charcoal text-2xl">Campuna Pioneer Mitglied</h3>
                                        <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed max-w-md mx-auto">
                                            Glückwunsch! Du gehörst zu den ersten 300 geprüften Mitgliedern auf Campuna. Dein Profil und all deine Inserate tragen dauerhaft den goldenen Pioneer-Badge.
                                        </p>
                                    </div>

                                    <div className="bg-[#faf8f3] rounded-2xl border border-beige p-4 text-left space-y-2.5 text-xs text-charcoal/80">
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Goldener Ehrenbadge auf Profil & Inseraten aktiv</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Höhere Sichtbarkeit & Vertrauen im Marktplatz</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Lebenslanger Gründerstatus gesichert</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setBadgeModalOpen(false)}
                                        className="w-full bg-forest text-sand hover:bg-[#004d0a] py-3 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all"
                                    >
                                        Verstanden
                                    </button>
                                </div>
                            ) : (
                                /* ── When User DOES NOT have the Badge (Get a Badge) ── */
                                <div className="space-y-5">
                                    <div className="relative mx-auto w-20 h-20">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gold via-amber-300 to-sand flex items-center justify-center shadow-xl border-4 border-white/80 ring-4 ring-gold/20">
                                            <Crown className="w-10 h-10 text-forest" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-forest text-sand rounded-full p-1 border-2 border-white shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-gold" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="inline-flex items-center gap-1.5 bg-gold/15 text-gold-dark border border-gold/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                            <Sparkles className="w-3 h-3 text-gold-dark" /> Limitiert auf die ersten 300 Mitglieder
                                        </span>
                                        <h3 className="font-display font-black text-charcoal text-xl sm:text-2xl">
                                            Campuna Pioneer Badge erhalten
                                        </h3>
                                        <p className="text-xs text-charcoal/70 leading-relaxed max-w-md mx-auto">
                                            Sichere dir das exklusive Campuna Pioneer Abzeichen für maximales Vertrauen bei Interessenten und dauerhaft bevorzugte Platzierung deiner Inserate.
                                        </p>
                                    </div>

                                    {/* Advantages summary */}
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="p-2.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                            <Crown className="w-4 h-4 text-gold-dark mx-auto" />
                                            <span className="font-bold text-[11px] text-charcoal block leading-tight">Goldener Badge</span>
                                            <span className="text-[9px] text-charcoal/50 block">Auf Profil & Anzeigen</span>
                                        </div>
                                        <div className="p-2.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                            <Rocket className="w-4 h-4 text-gold-dark mx-auto" />
                                            <span className="font-bold text-[11px] text-charcoal block leading-tight">Mehr Reichweite</span>
                                            <span className="text-[9px] text-charcoal/50 block">Höhere Sichtbarkeit</span>
                                        </div>
                                        <div className="p-2.5 bg-[#faf8f3] rounded-2xl border border-beige space-y-1">
                                            <Award className="w-4 h-4 text-gold-dark mx-auto" />
                                            <span className="font-bold text-[11px] text-charcoal block leading-tight">100% Kostenlos</span>
                                            <span className="text-[9px] text-charcoal/50 block">Dauerhafter Status</span>
                                        </div>
                                    </div>

                                    {/* Live Qualification Steps */}
                                    <div className="bg-[#faf8f3] rounded-2xl border border-beige p-3.5 space-y-2 text-left text-xs">
                                        <div className="flex items-center justify-between font-bold text-charcoal pb-1.5 border-b border-beige/60">
                                            <span>Deine Qualifikation:</span>
                                            <span className="text-forest font-mono text-[11px]">
                                                {(isProfileComplete ? 1 : 0) + (approvedListingsCount >= 3 ? 1 : 0)} / 2 Kriterien
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isProfileComplete ? 'bg-forest' : 'bg-stone-300'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <span className="text-[11px] font-medium text-charcoal">Profil vollständig ausgefüllt</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase ${isProfileComplete ? 'text-emerald-600' : 'text-charcoal/40'}`}>
                                                {isProfileComplete ? 'Erledigt' : 'Ausstehend'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${approvedListingsCount >= 3 ? 'bg-forest' : 'bg-stone-300'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <span className="text-[11px] font-medium text-charcoal">Mindestens 3 freigegebene Inserate</span>
                                            </div>
                                            <span className={`text-[10px] font-black font-mono ${approvedListingsCount >= 3 ? 'text-emerald-600' : 'text-forest'}`}>
                                                {approvedListingsCount} / 3
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2 pt-1">
                                        {!isProfileComplete ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBadgeModalOpen(false);
                                                    setIsEditing(true);
                                                    setActiveTab('dashboard');
                                                }}
                                                className="w-full bg-forest text-sand hover:bg-[#004d0a] py-3 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                            >
                                                <Pencil className="w-4 h-4 text-gold" />
                                                <span>Profil jetzt vervollständigen</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBadgeModalOpen(false);
                                                    handleCreateListingClick();
                                                }}
                                                className="w-full bg-forest text-sand hover:bg-[#004d0a] py-3 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                            >
                                                <Plus className="w-4 h-4 text-gold" />
                                                <span>Jetzt Inserat aufgeben ({Math.max(0, 3 - approvedListingsCount)} erforderlich)</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBadgeModalOpen(false);
                                                setActiveTab('pioneer');
                                            }}
                                            className="w-full bg-[#faf8f3] text-charcoal/70 hover:bg-sand border border-beige py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                                        >
                                            Alle Pioneer-Details & Status ansehen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

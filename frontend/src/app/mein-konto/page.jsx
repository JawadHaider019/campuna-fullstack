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
    getCreditTransactions,
    purchaseCredits,
    getReferralStats,
    getReferralsList,
    uploadAvatar,
    uploadCover,
    getInvoices,
    earnSimulatedCredits,
    spendSimulatedCredits,
    bookSpotlight,
} from '@/api/profile';
import { getMyListings, boostListing, deleteListing } from '@/api/listings';
import { logoutUser } from '@/api/auth';
import { toast } from 'react-hot-toast';
import CoinIcon from '@/app/components/CoinIcon';
import UserDashboard from './components/UserDashboard';
import AccountChatTab from './components/AccountChatTab';
import AccountFavoritesTab from './components/AccountFavoritesTab';
import AccountCreateListingTab from './components/AccountCreateListingTab';
import { useChatStore } from '@/store/useChatStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { isValidPhoneNumber, sanitizePhoneInput, handlePhoneKeyDown, PHONE_VALIDATION_ERROR } from '@/utils/validation';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';


import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2, Plus, Award, AlertTriangle, Sparkles,
    Crown, Calendar, ArrowRight, Receipt, Download, Printer, CreditCard,
    Rocket, Eye, LayoutDashboard, Gift, Users, CheckCircle2, Zap, ExternalLink,
    Clock, TrendingUp, Bell, Search, ShieldCheck, Compass, CheckCircle, Pencil, Send,
    FileSpreadsheet, MessageSquare, Heart, Trash2, PanelLeftClose, PanelLeftOpen, PanelLeft
} from 'lucide-react';

function Linkedin(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
        </svg>
    );
}

const ACCOUNT_TAB_LABELS = {
    dashboard: 'Übersicht & Profil',
    business_cockpit: 'Business Cockpit',
    inserate: 'Meine Inserate',
    create_listing: 'Inserat erstellen',
    nachrichten: 'Nachrichten',
    favoriten: 'Merkzettel',
    abo: 'Abonnement & Plan',
    credits: 'Campuna Credits',
    empfehlen: 'Freunde werben',
    sicherheit: 'Sicherheit',
    pioneer: 'Pionier Status'
};

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
    const isInvalidPhone = type === 'tel' && Boolean(editValue?.trim()) && !isValidPhoneNumber(editValue?.trim());

    if (isEditing) {
        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        {Icon && <Icon className={`w-3.5 h-3.5 ${isInvalidPhone ? 'text-rose-500' : 'text-forest'}`} />} {label}
                    </label>
                    {isInvalidPhone ? (
                        <span className="text-[10px] font-semibold text-rose-600 font-sans">
                            Ungültiges Telefonformat
                        </span>
                    ) : maxLength ? (
                        <span className="text-[10px] font-mono text-charcoal/40">
                            {(editValue || '').length} / {maxLength}
                        </span>
                    ) : null}
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
                        inputMode={type === 'tel' ? 'tel' : undefined}
                        autoComplete={type === 'tel' ? 'tel' : undefined}
                        value={editValue ?? ''}
                        onChange={e => onChange(type === 'tel' ? sanitizePhoneInput(e.target.value) : e.target.value)}
                        onKeyDown={type === 'tel' ? handlePhoneKeyDown : undefined}
                        placeholder={placeholder}
                        maxLength={maxLength || (type === 'tel' ? 25 : undefined)}
                        className={`w-full bg-[#faf8f3] border rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 font-sans transition-all ${
                            isInvalidPhone
                                ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                                : 'border-beige focus:ring-forest/20 focus:border-forest'
                        }`}
                    />
                )}
                {isInvalidPhone && (
                    <p className="text-[10px] text-rose-500 font-sans">
                        Bitte gültige Nummer angeben (z. B. +49 89 1234567 oder 0170 12345678).
                    </p>
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
    const [copiedLink, setCopiedLink] = useState(false);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://campuna.de';
    const referralLink = `${origin}/registrieren?ref=${code || ''}`;

    const copyLink = (e) => {
        e?.stopPropagation();
        if (!code) return;
        navigator.clipboard.writeText(referralLink);
        setCopiedLink(true);
        toast.success('Einladungs-Link kopiert!');
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="bg-[#faf8f3] border border-beige hover:border-gold/50 rounded-2xl p-3 sm:p-4 transition-all space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                        <Gift className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block">Dein Empfehlungscode</span>
                        <span className="font-mono text-xs sm:text-sm font-black text-forest tracking-wide truncate block">{code || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Direct Link Row with Single Copy Button */}
            <div className="flex items-center gap-1.5 bg-white border border-beige rounded-xl p-1.5 pl-3">
                <span className="text-[11px] font-mono text-charcoal/70 truncate flex-1 select-all">
                    {referralLink}
                </span>
                <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 flex items-center gap-1.5 bg-forest hover:bg-[#004d0a] text-sand text-[11px] font-bold py-1.5 px-3.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Einladungs-Link kopieren"
                >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-gold" /> : <Copy className="w-3.5 h-3.5 text-gold" />}
                    <span>{copiedLink ? 'Kopiert!' : 'Link kopieren'}</span>
                </button>
            </div>
        </div>
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
    const effectiveProfileType = profileType || (user?.user_type === 'COMMERCIAL' ? 'COMMERCIAL' : 'PRIVATE');
    const isCommercial = effectiveProfileType === 'COMMERCIAL';
    const isPrivate = !isCommercial;
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState({});
    const [mounted, setMounted] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Persist sidebar collapsed state
    useEffect(() => {
        try {
            const saved = localStorage.getItem('campuna_user_sidebar_collapsed');
            if (saved !== null) {
                setSidebarCollapsed(saved === 'true');
            }
        } catch (_) {}
    }, []);

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('campuna_user_sidebar_collapsed', String(next));
            } catch (_) {}
            return next;
        });
    };

    // Subscriptions & Billing
    const [subDetails, setSubDetails] = useState({ plan_name: 'FREE', is_business: false });
    const [creditBalance, setCreditBalance] = useState(0);
    const [creditTransactions, setCreditTransactions] = useState([]);
    const [referralsList, setReferralsList] = useState([]);
    const [referralStats, setReferralStats] = useState({ total: 0, pending: 0, completed: 0 });
    const [upgrading, setUpgrading] = useState(false);

    // Reward & Listing Approval Celebration Modal State
    const [celebrationReward, setCelebrationReward] = useState(null);
    const [rewardCelebrationModalOpen, setRewardCelebrationModalOpen] = useState(false);

    // Logout Confirmation Modal State
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

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
    const [editingListingId, setEditingListingId] = useState(null);

    // Boost Modal State
    const [selectedListingForBoost, setSelectedListingForBoost] = useState(null);
    const [boostModalOpen, setBoostModalOpen] = useState(false);
    const [boostDuration, setBoostDuration] = useState(7); // 7, 14, 30 days
    const [boostPaymentMethod, setBoostPaymentMethod] = useState('CREDIT'); // 'CREDIT' | 'CREDIT_CARD' | 'SEPA' | 'PAYPAL'
    const [boosting, setBoosting] = useState(false);

    // Credit Purchase Modal State
    const [buyCreditModalOpen, setBuyCreditModalOpen] = useState(false);
    const [selectedCreditPkg, setSelectedCreditPkg] = useState(500); // 500, 800, 1300, 2500
    const [creditPaymentMethod, setCreditPaymentMethod] = useState('CREDIT_CARD'); // 'CREDIT_CARD' | 'SEPA' | 'PAYPAL'
    const [buyingCredits, setBuyingCredits] = useState(false);

    // Spotlight Modal State
    const [spotlightModalOpen, setSpotlightModalOpen] = useState(false);
    const [spotlightDuration, setSpotlightDuration] = useState(7); // 7, 14, 30 days
    const [spotlightPaymentMethod, setSpotlightPaymentMethod] = useState('CREDIT'); // 'CREDIT' | 'CREDIT_CARD' | 'SEPA' | 'PAYPAL'
    const [bookingSpotlight, setBookingSpotlight] = useState(false);

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
        if (isCommercial) {
            return profile.company_name || profile.first_name || 'Gewerblicher Anbieter';
        }
        return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Camper';
    }, [profile, isCommercial, user]);

    const avatarSrc = useMemo(() => {
        const source = isEditing ? draft : profile;
        if (!source) return null;
        const raw = isCommercial
            ? source.logo_url || source.profile_image_url
            : source.profile_image_url;
        return raw ? getImageUrl(raw) : null;
    }, [profile, draft, isEditing, isCommercial]);

    const pioneerBadge = useMemo(() => {
        return (achievements || []).find(a => a.badge_key === 'CAMPUNA_PIONEER') || null;
    }, [achievements]);

    const approvedListingsCount = useMemo(() => {
        return userListings.filter(l => l.status === 'APPROVED').length;
    }, [userListings]);

    const isProfileComplete = useMemo(() => {
        if (!profile) return false;
        if (isCommercial) {
            return Boolean(profile.company_name && profile.bio && profile.location);
        }
        return Boolean(profile.first_name && profile.last_name && profile.bio);
    }, [profile, isCommercial]);

    // Spotlight Requirements Evaluation
    const spotlightRequirements = useMemo(() => {
        const source = isEditing ? draft : (profile || {});
        const hasLogo = Boolean(source?.logo_url && String(source.logo_url).trim());
        const hasCover = Boolean(source?.cover_image_url && String(source.cover_image_url).trim());
        const hasBio = Boolean(source?.bio && String(source.bio).trim().length >= 20);
        const hasPhone = Boolean(source?.phone && String(source.phone).trim());
        const hasLocation = Boolean((source?.location && String(source.location).trim()) || (source?.company_address && String(source.company_address).trim()));
        const isVerified = Boolean(user?.email_verified);
        const isCommercialUser = isCommercial;

        const list = [
            { id: 'logo', label: 'Firmenlogo / Profilbild', met: hasLogo },
            { id: 'cover', label: 'Titelbild / Banner', met: hasCover },
            { id: 'bio', label: 'Unternehmensbeschreibung (mind. 20 Zeichen)', met: hasBio },
            { id: 'phone', label: 'Telefonnummer', met: hasPhone },
            { id: 'location', label: 'Standort oder Adresse', met: hasLocation },
            { id: 'verified', label: 'Verifiziertes Benutzerkonto', met: isVerified },
        ];

        const metCount = list.filter(i => i.met).length;

        return {
            hasLogo,
            hasCover,
            hasBio,
            hasPhone,
            hasLocation,
            isVerified,
            isCommercial: isCommercialUser,
            list,
            metCount,
            totalCount: list.length,
            allMet: hasLogo && hasCover && hasBio && hasPhone && hasLocation && isVerified && isCommercialUser,
        };
    }, [isEditing, draft, profile, isCommercial, user]);

    const hasPaidSpotlight = Boolean(
        profile?.has_paid_spotlight ||
        (profile?.spotlight_until && new Date(profile.spotlight_until) > new Date()) ||
        profile?.is_strategic_partner
    );
    const isSpotlightActive = Boolean(hasPaidSpotlight && spotlightRequirements.allMet);
    const isSpotlightPaused = Boolean(hasPaidSpotlight && !spotlightRequirements.allMet);
    const spotlightDaysLeft = profile?.spotlight_until && new Date(profile.spotlight_until) > new Date()
        ? Math.ceil((new Date(profile.spotlight_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

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

                if (profileRes.data.user?.referral_code && user?.referral_code !== profileRes.data.user.referral_code) {
                    useAuthStore.setState(prev => ({
                        ...prev,
                        user: { ...prev.user, ...profileRes.data.user }
                    }));
                }

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


            // Load Credit balance & Transactions for Celebration triggers
            let currentBalance = 0;
            const creditRes = await getCreditBalance().catch(() => null);
            if (creditRes && creditRes.success) {
                currentBalance = creditRes.data?.balance ?? 0;
                setCreditBalance(currentBalance);
            }

            const txRes = await getCreditTransactions().catch(() => null);
            let uncelebratedReward = null;
            if (txRes && txRes.success && Array.isArray(txRes.data?.transactions)) {
                setCreditTransactions(txRes.data.transactions);
                // Find positive reward transactions (referral reward or signup bonus)
                const candidateTxs = txRes.data.transactions.filter(
                    t => t.amount > 0 && ['REFERRAL_REWARD', 'REFERRAL_SIGNUP_BONUS'].includes(t.type)
                );

                uncelebratedReward = candidateTxs.find(
                    t => typeof window !== 'undefined' && !localStorage.getItem(`campuna_reward_celebrated_${user?.id}_${t.id}`)
                );

                if (uncelebratedReward) {
                    try {
                        localStorage.setItem(`campuna_reward_celebrated_${user?.id}_${uncelebratedReward.id}`, 'true');
                    } catch (_) {}

                    const isReferrer = uncelebratedReward.type === 'REFERRAL_REWARD';
                    setCelebrationReward({
                        type: uncelebratedReward.type,
                        amount: uncelebratedReward.amount,
                        title: isReferrer ? `🎉 ${uncelebratedReward.amount} Credits Empfehlungsbonus!` : `🎉 ${uncelebratedReward.amount} Credits Willkommensbonus!`,
                        description: isReferrer
                            ? `Ein von dir eingeladener Camper hat sein erstes Inserat freigeschaltet. Dir wurden ${uncelebratedReward.amount} Campuna Credits gutgeschrieben!`
                            : `Dein erstes Inserat wurde freigeschaltet! Als Willkommensbonus hast du ${uncelebratedReward.amount} Campuna Credits erhalten.`,
                        balance: currentBalance || uncelebratedReward.amount || 100
                    });
                    setRewardCelebrationModalOpen(true);
                    toast.success(`🎉 +${uncelebratedReward.amount} Campuna Credits gutgeschrieben!`, {
                        duration: 6000,
                        icon: '🎁'
                    });
                }
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
                const listings = listingsRes.data?.listings || [];
                setUserListings(listings);

                // If no credit celebration modal is already active, check for newly approved listings
                if (!uncelebratedReward) {
                    const approvedListings = listings.filter(l => l.status === 'APPROVED');
                    const initKey = `campuna_listings_init_${user?.id}`;
                    const hasInitializedListings = typeof window !== 'undefined' && localStorage.getItem(initKey);

                    if (!hasInitializedListings) {
                        // First load: seed all existing approved listings so older accounts aren't spammed
                        approvedListings.forEach(l => {
                            try {
                                localStorage.setItem(`campuna_listing_approved_seen_${user?.id}_${l.id}`, 'true');
                            } catch (_) {}
                        });
                        try {
                            localStorage.setItem(initKey, 'true');
                        } catch (_) {}
                    } else {
                        // Check if a listing was newly approved
                        const newlyApproved = approvedListings.find(
                            l => !localStorage.getItem(`campuna_listing_approved_seen_${user?.id}_${l.id}`)
                        );
                        if (newlyApproved) {
                            try {
                                localStorage.setItem(`campuna_listing_approved_seen_${user?.id}_${newlyApproved.id}`, 'true');
                            } catch (_) {}

                            setCelebrationReward({
                                type: 'LISTING_APPROVED',
                                title: '🎉 Dein Inserat ist jetzt live!',
                                description: `Dein Inserat "${newlyApproved.title}" wurde erfolgreich freigeschaltet und ist ab sofort auf Campuna sichtbar.`,
                                listingTitle: newlyApproved.title,
                                listingId: newlyApproved.id
                            });
                            setRewardCelebrationModalOpen(true);
                            toast.success(`🎉 Inserat "${newlyApproved.title}" freigeschaltet!`, {
                                duration: 5000,
                                icon: '🚀'
                            });
                        }
                    }
                }
            }
            setListingsLoading(false);
        } catch (err) {
            console.error('Error loading account data:', err);
        } finally {
            setLoading(false);
        }
    };

    const unreadMessagesCount = useChatStore((state) => state.unreadCount);
    const fetchUnreadCount = useChatStore((state) => state.fetchUnreadCount);
    const favoriteListings = useFavoritesStore((state) => state.favoriteListings);
    const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
    const fetchFavorites = useFavoritesStore((state) => state.fetchFavorites);
    const favoriteCount = favoriteListings.length > 0 ? favoriteListings.length : favoriteIds.length;

    useEffect(() => {
        if (mounted && isLoggedIn) {
            if (user?.role === 'ADMIN') {
                router.replace('/admin');
                return;
            }
            loadAllAccountData();
            fetchUnreadCount();
            fetchFavorites();

            // Check if tab is requested via query param (e.g., ?tab=nachrichten or ?tab=favoriten or ?tab=create_listing)
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const requestedTab = params.get('tab');
                if (['nachrichten', 'messages', 'chat'].includes(requestedTab)) {
                    setActiveTab('nachrichten');
                } else if (['favoriten', 'merkzettel', 'favorites'].includes(requestedTab)) {
                    setActiveTab('favoriten');
                } else if (['create_listing', 'anzeige-erstellen', 'inserat-erstellen'].includes(requestedTab)) {
                    const editId = params.get('edit') || params.get('id');
                    if (editId) setEditingListingId(editId);
                    setActiveTab('create_listing');
                }
            }
        }
    }, [mounted, isLoggedIn, user?.role, fetchUnreadCount, fetchFavorites]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleTabChange = (tabId, editIdParam = null) => {
        if (editIdParam) {
            setEditingListingId(editIdParam);
        } else if (tabId !== 'create_listing') {
            setEditingListingId(null);
        }
        setActiveTab(tabId);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (tabId === 'dashboard') {
                url.searchParams.delete('tab');
                url.searchParams.delete('id');
                url.searchParams.delete('edit');
            } else {
                url.searchParams.set('tab', tabId);
                if (tabId !== 'nachrichten') {
                    url.searchParams.delete('id');
                }
                if (tabId !== 'create_listing') {
                    url.searchParams.delete('edit');
                } else if (editIdParam) {
                    url.searchParams.set('edit', editIdParam);
                }
            }
            window.history.replaceState(null, '', url.toString());
        }
    };

    const handleCreateListingClick = () => {
        const limit = 3;
        const activeApprovedListings = userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status));
        const isBusinessUser = subDetails.is_business;
        const isAtLimit = !isBusinessUser && activeApprovedListings.length >= limit;

        if (isAtLimit) {
            setLimitModalOpen(true);
        } else {
            setEditingListingId(null);
            handleTabChange('create_listing');
        }
    };

    const handleEditListing = (listingId) => {
        handleTabChange('create_listing', listingId);
    };

    const [deleteConfirmListing, setDeleteConfirmListing] = useState(null);
    const [isDeletingListing, setIsDeletingListing] = useState(false);

    const handleDeleteListing = async () => {
        if (!deleteConfirmListing?.id) return;
        setIsDeletingListing(true);
        const toastId = toast.loading('Inserat wird gelöscht...');
        try {
            const res = await deleteListing(deleteConfirmListing.id);
            if (res.data?.success || res.status === 200) {
                toast.success('Inserat erfolgreich gelöscht.', { id: toastId });
                setUserListings(prev => prev.filter(l => l.id !== deleteConfirmListing.id));
                setDeleteConfirmListing(null);
                getMyListings().then(r => {
                    if (r.data?.listings) setUserListings(r.data.listings);
                }).catch(() => {});
            } else {
                toast.error(res.data?.error || 'Fehler beim Löschen des Inserats.', { id: toastId });
            }
        } catch (err) {
            console.error('Error deleting listing:', err);
            toast.error(err.response?.data?.error || 'Fehler beim Löschen des Inserats.', { id: toastId });
        } finally {
            setIsDeletingListing(false);
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
        if (draft.phone && draft.phone.trim() && !isValidPhoneNumber(draft.phone.trim())) {
            toast.error(PHONE_VALIDATION_ERROR);
            return;
        }

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
        if (!subDetails.is_business) {
            toast.error('Das individuelle Hintergrundbild ist exklusiv im Business-Tarif (29 €/Monat) verfügbar.');
            return;
        }
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
        if (!listing) return;
        if (listing.status !== 'APPROVED') {
            toast.error('Nur freigegebene (aktive) Inserate können hervorgehoben werden.');
            return;
        }
        setSelectedListingForBoost(listing);
        setBoostDuration(7);
        // Default to CREDIT if user has >= 500 CC, otherwise CREDIT_CARD
        setBoostPaymentMethod((Number(creditBalance) || 0) >= 500 ? 'CREDIT' : 'CREDIT_CARD');
        setBoostModalOpen(true);
    };

    const handleExecuteBoost = async () => {
        if (!selectedListingForBoost) return;
        const PRICING_CC = { 7: 500, 14: 800, 30: 1300 };
        const PRICING_EUR = { 7: '4,99 €', 14: '7,99 €', 30: '12,99 €' };
        const cost = PRICING_CC[boostDuration] || 500;
        const priceEur = PRICING_EUR[boostDuration] || '4,99 €';

        if (boostPaymentMethod === 'CREDIT' && (Number(creditBalance) || 0) < cost) {
            toast.error(`Nicht genügend Credits (${creditBalance} CC vorhanden, ${cost} CC benötigt). Wähle stattdessen Direktzahlung oder lade dein Guthaben auf.`);
            return;
        }

        setBoosting(true);
        const toastId = toast.loading(boostPaymentMethod === 'CREDIT' ? 'Inserat wird hervorgehoben...' : `Zahlung von ${priceEur} wird verarbeitet...`);
        try {
            const res = await boostListing(selectedListingForBoost.id, boostDuration, boostPaymentMethod);
            if (res.success || res.data?.success) {
                toast.success(`🎉 Inserat erfolgreich für ${boostDuration} Tage hervorgehoben!`, { id: toastId });
                setUserListings(prev => prev.map(l => {
                    if (l.id === selectedListingForBoost.id) {
                        return {
                            ...l,
                            boosted_until: res.data?.boosted_until || res.data?.listing?.boosted_until,
                            is_boosted: true
                        };
                    }
                    return l;
                }));
                if (res.data?.new_balance !== undefined) {
                    setCreditBalance(res.data.new_balance);
                }
                // Refresh credit transactions if loaded
                getCreditTransactions().then(txRes => {
                    if (txRes?.success && Array.isArray(txRes.data?.transactions)) {
                        setCreditTransactions(txRes.data.transactions);
                    }
                }).catch(() => {});

                setBoostModalOpen(false);
                setSelectedListingForBoost(null);
            } else {
                toast.error(res.error || res.data?.error || 'Hervorheben fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Hervorheben fehlgeschlagen.', { id: toastId });
        } finally {
            setBoosting(false);
        }
    };

    const handleOpenBuyCreditModal = (pkgCredits = 500) => {
        setSelectedCreditPkg(pkgCredits);
        setCreditPaymentMethod('CREDIT_CARD');
        setBuyCreditModalOpen(true);
    };

    const handlePurchaseCreditPackage = async () => {
        setBuyingCredits(true);
        const PACKAGES_EUR = { 500: '4,99 €', 800: '7,99 €', 1300: '12,99 €', 2500: '24,99 €' };
        const priceEur = PACKAGES_EUR[selectedCreditPkg] || '4,99 €';
        const toastId = toast.loading(`Kauf von ${selectedCreditPkg.toLocaleString('de-DE')} CC (${priceEur}) wird verarbeitet...`);

        try {
            const res = await purchaseCredits(selectedCreditPkg, creditPaymentMethod);
            if (res.success || res.data?.success) {
                toast.success(`🎉 +${selectedCreditPkg.toLocaleString('de-DE')} Campuna Credits erfolgreich aufgeladen!`, { id: toastId });
                if (res.data?.new_balance !== undefined) {
                    setCreditBalance(res.data.new_balance);
                }
                // Refresh transaction list
                const txRes = await getCreditTransactions().catch(() => null);
                if (txRes?.success && Array.isArray(txRes.data?.transactions)) {
                    setCreditTransactions(txRes.data.transactions);
                }
                setBuyCreditModalOpen(false);
            } else {
                toast.error(res.error || res.data?.error || 'Guthabenkauf fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Guthabenkauf fehlgeschlagen.', { id: toastId });
        } finally {
            setBuyingCredits(false);
        }
    };

    const handleBookSpotlight = async () => {
        if (!spotlightRequirements.allMet) {
            toast.error('Bitte vervollständige zuerst alle erforderlichen Angaben in deinem Profil.');
            return;
        }

        const SPOTLIGHT_COSTS = { 7: 1500, 14: 2500, 30: 4000 };
        const SPOTLIGHT_PRICES = { 7: '14,99 €', 14: '24,99 €', 30: '39,99 €' };
        const cost = SPOTLIGHT_COSTS[spotlightDuration] || 1500;
        const priceEur = SPOTLIGHT_PRICES[spotlightDuration] || '14,99 €';

        if (spotlightPaymentMethod === 'CREDIT' && (Number(creditBalance) || 0) < cost) {
            toast.error(`Nicht genügend Credits (${creditBalance} CC vorhanden, ${cost} CC benötigt). Wähle stattdessen Direktzahlung.`);
            return;
        }

        setBookingSpotlight(true);
        const toastId = toast.loading(spotlightPaymentMethod === 'CREDIT' ? 'Spotlight wird aktiviert...' : `Zahlung von ${priceEur} wird verarbeitet...`);

        try {
            const res = await bookSpotlight({
                durationDays: spotlightDuration,
                payment_method: spotlightPaymentMethod
            });

            if (res.success || res.data?.success) {
                toast.success(`🎉 Glückwunsch! Dein Unternehmen ist jetzt für ${spotlightDuration} Tage im Campuna Spotlight aktiv!`, { id: toastId });
                if (res.data?.new_balance !== undefined) {
                    setCreditBalance(res.data.new_balance);
                }
                setProfile(prev => prev ? {
                    ...prev,
                    spotlight_until: res.data?.spotlight_until || res.spotlight_until,
                    is_spotlight_active: true,
                    spotlight_days_left: res.data?.days_left || spotlightDuration
                } : prev);

                getCreditTransactions().then(txRes => {
                    if (txRes?.success && Array.isArray(txRes.data?.transactions)) {
                        setCreditTransactions(txRes.data.transactions);
                    }
                }).catch(() => {});

                setSpotlightModalOpen(false);
            } else {
                toast.error(res.error || res.data?.error || 'Spotlight-Buchung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Spotlight-Buchung fehlgeschlagen.', { id: toastId });
        } finally {
            setBookingSpotlight(false);
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
        toast.success('Test-Bankdaten übernommen!');
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

    const handleLogout = () => {
        setLogoutConfirmOpen(true);
    };

    const handleLogoutConfirm = async () => {
        setLoggingOut(true);
        try {
            await logoutUser();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setLoggingOut(false);
            setLogoutConfirmOpen(false);
            logout();
            router.push('/');
            toast.success('Erfolgreich abgemeldet.');
        }
    };

    // ─── Loading View & Guards ───────────────────────────────────────────────────

    if (!mounted || loading) {
        return (
            <CircleLoader size="lg" color="forest" fullPage />
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
            }
        ] : []),
        { id: 'dashboard', label: subDetails.is_business ? 'Mein Profil' : 'Mein Profil & Übersicht', icon: User },
        { id: 'inserate', label: 'Meine Inserate', icon: Rocket },
        { id: 'nachrichten', label: 'Nachrichten', icon: MessageSquare },
        { id: 'favoriten', label: 'Merkzettel', icon: Heart },
        ...(profileType === 'COMMERCIAL' ? [
            { id: 'finanzen', label: 'Abonnement', icon: CreditCard }
        ] : []),
        { id: 'credits', label: 'Campuna Credits', icon: Gift },
        { id: 'pioneer', label: pioneerBadge ? 'Campuna Pioneer' : 'Pioneer Auszeichnung', icon: Award },
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
                    {/* Left: Brand Logo & Breadcrumb (Desktop) */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <Link href="/" className="flex items-center gap-1 group cursor-pointer" title="Zur Startseite">
                            <img
                                src="/logo.webp"
                                alt="Campuna"
                                className="h-6 sm:h-8 w-auto object-contain"
                            />
                            <span className="text-lg sm:text-2xl font-normal text-forest leading-none select-none">®</span>
                        </Link>
                        <div className="hidden lg:block h-5 w-px bg-beige" />
                        <div className="hidden lg:block">
                            <Breadcrumbs
                                items={activeTab === 'dashboard'
                                    ? [{ label: 'Mein Konto' }]
                                    : [{ label: 'Mein Konto', href: '/mein-konto' }, { label: navItems.find(n => n.id === activeTab)?.label || activeTab }]}
                                variant="light"
                            />
                        </div>
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
                                onClick={() => handleTabChange(item.id)}
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${isActive
                                    ? 'bg-forest text-sand shadow-sm shadow-forest/20 font-black'
                                    : 'bg-white text-charcoal/70 hover:bg-[#faf8f3] border border-beige'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-forest'}`} />
                                <span className="whitespace-nowrap">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── MAIN DASHBOARD CONTAINER (Sidebar + Content Hub) ── */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden h-full">

                    {/* ── 1. LEFT SIDEBAR NAVIGATION (Admin Style, Full Height Fixed on side, Collapsible) ── */}
                    <aside
                        className={`hidden lg:flex flex-col bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-white shadow-xl border-r border-gold/20 justify-between shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out select-none px-3 py-4 ${
                            sidebarCollapsed 
                                ? 'w-[68px]' 
                                : 'w-[230px] xl:w-[250px]'
                        }`}
                    >
                        <div className="space-y-4">
                            {/* Navigation Header */}
                            <div className={`flex items-center pt-1 pb-2 border-b border-white/20 transition-all ${
                                sidebarCollapsed ? 'justify-center' : 'justify-between px-1'
                            }`}>
                                {!sidebarCollapsed && (
                                    <span className="text-[10px] font-mono tracking-[0.3em] text-white/90 uppercase font-semibold block truncate">
                                        NAVIGATION
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={toggleSidebar}
                                    title={sidebarCollapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
                                    className="p-1.5 rounded-xl text-sand/60 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                >
                                    {sidebarCollapsed ? (
                                        <PanelLeftOpen className="w-4 h-4 text-gold" />
                                    ) : (
                                        <PanelLeftClose className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Nav Items */}
                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;

                                    return (
                                        <div key={item.id} className="relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleTabChange(item.id)}
                                                className={`w-full h-10 flex items-center ${
                                                    sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'
                                                } px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                                    isActive
                                                        ? 'bg-gold text-forest font-bold shadow-md shadow-gold/20'
                                                        : 'text-sand/75 hover:text-white hover:bg-white/10 font-medium'
                                                }`}
                                            >
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest' : 'text-sand/60 group-hover:text-gold'}`} />
                                                {!sidebarCollapsed && (
                                                    <span className="truncate leading-none">{item.label}</span>
                                                )}
                                            </button>

                                            {/* Floating Tooltip in collapsed mode */}
                                            {sidebarCollapsed && (
                                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-950/95 text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-white/10 z-50">
                                                    {item.label}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Upgrade Widget & Bottom Account Section */}
                        <div className={`space-y-3 transition-all ${sidebarCollapsed ? 'px-0' : 'pl-1'}`}>
                            {isCommercial && !subDetails.is_business && (
                                sidebarCollapsed ? (
                                    <div className="flex justify-center group relative">
                                        <button
                                            type="button"
                                            onClick={() => router.push('/abo/kasse')}
                                            title="Campuna Business Upgrade"
                                            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-gold/30 hover:scale-105 active:scale-95 cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-950/95 text-gold text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-white/10 z-50">
                                            Business Upgrade
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex items-center gap-1.5 text-gold">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Campuna Business</span>
                                        </div>
                                        <p className="text-[11px] text-sand/80 font-sans leading-relaxed">
                                            Bis zu 25 Inserate, Spotlight & Händler-Tools freischalten.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => router.push('/abo/kasse')}
                                            className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                                        >
                                            <span>Jetzt upgraden</span>
                                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                                        </button>
                                    </div>
                                )
                            )}

                            {/* Bottom User Account Pill */}
                            <div className={`pt-3 border-t border-white/10 transition-all ${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-2.5'}`}>
                                {!sidebarCollapsed && (
                                    <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold px-1 block">
                                        BENUTZERKONTO
                                    </span>
                                )}

                                {sidebarCollapsed ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-bold text-xs flex items-center justify-center border-2 border-gold/40 shadow-sm shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                                            title={`${displayName} (${isCommercial ? 'gewerblich' : 'privat'})`}
                                            onClick={() => handleTabChange('dashboard')}
                                        >
                                            {avatarSrc ? (
                                                <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{displayName ? displayName.slice(0, 2).toUpperCase() : 'CU'}</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            title="Abmelden"
                                            className="p-2 text-sand/50 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer group" onClick={() => handleTabChange('dashboard')}>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-bold text-xs flex items-center justify-center border-2 border-gold/40 shadow-sm shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{displayName ? displayName.slice(0, 2).toUpperCase() : 'CU'}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 truncate text-left">
                                                <h5 className="text-xs font-bold text-white truncate leading-tight group-hover:text-gold transition-colors">
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
                                )}
                            </div>
                        </div>

                    </aside>

                    {/* ── 2. RIGHT MAIN UNIFIED CONTAINER CANVAS (All sections housed inside) ── */}
                    <div className="flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 min-w-0">
                        {/* ── Breadcrumbs inside page canvas (Mobile only) ── */}
                        <div className="block lg:hidden mb-3.5">
                            <Breadcrumbs
                                items={activeTab === 'dashboard'
                                    ? [{ label: 'Mein Konto' }]
                                    : [{ label: 'Mein Konto', href: '/mein-konto' }, { label: navItems.find(n => n.id === activeTab)?.label || activeTab }]}
                                variant="light"
                            />
                        </div>

                        <main className="w-full space-y-6">

                            {/* ═════════════════════════════════════════════════════════════
                                TAB: CREATE / EDIT LISTING (IN-DASHBOARD)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'create_listing' && (
                                <AccountCreateListingTab
                                    editId={editingListingId}
                                    profile={effectiveProfile}
                                    profileType={profileType}
                                    subDetails={subDetails}
                                    user={user}
                                    onSuccess={() => {
                                        setEditingListingId(null);
                                        loadAllAccountData();
                                        handleTabChange('inserate');
                                    }}
                                    onCancel={() => {
                                        setEditingListingId(null);
                                        handleTabChange('inserate');
                                    }}
                                    onOpenLimitModal={() => setLimitModalOpen(true)}
                                />
                            )}

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
                                        onEditListing={handleEditListing}
                                        onDeleteListing={item => setDeleteConfirmListing(item)}
                                        user={user}
                                    />
                                ) : (

                                    <div className="space-y-6">
                                        <TabHeader
                                            title="Campuna Business Cockpit"
                                            subtitle="Schalte professionelle Händler-Werkzeuge, unbegrenzte Inserate und Live-Analysen frei"
                                            icon={CreditCard}
                                            badge={
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gold/20 text-gold-dark border border-gold/40">
                                                    Upgrade verfügbar
                                                </span>
                                            }
                                        />

                                        {/* Business Teaser Hero */}
                                        <div className="rounded-3xl bg-gradient-to-br from-[#003808] via-[#002204] to-[#011403] border border-gold/30 p-8 text-white shadow-xl relative overflow-hidden space-y-6">
                                            <Sparkles className="absolute right-6 bottom-4 w-60 h-60 text-white/[0.03] pointer-events-none stroke-[1]" />
                                            <div className="relative z-10 max-w-2xl space-y-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-gold text-forest shadow-md">
                                                    <Sparkles className="w-3.5 h-3.5 fill-forest" />
                                                    Exklusiv für Händler & Power-Seller
                                                </span>
                                                <h2 className="text-3xl sm:text-4xl font-black text-sand font-display tracking-tight">
                                                    Maximiere deinen Camping-Erfolg mit dem Campuna Business Plan
                                                </h2>
                                                <p className="text-sm text-sand/80 leading-relaxed font-sans">
                                                    Erhalte Zugriff auf bis zu 25 aktive Fahrzeug- & Zubehör-Inserate, automatische Spotlight-Rotation auf der Startseite, Echtzeit-Reichweitenanalysen, direkte Käufer-Leads und 1.000 monatliche Campuna Credits.
                                                </p>
                                                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push('/abo/kasse')}
                                                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider rounded-2xl transition-all duration-300 shadow-lg hover:shadow-gold/30 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                                                    >
                                                        <span>Jetzt Business freischalten (29 € / Monat)</span>
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 4 Pillars Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <Rocket className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Bis zu 25 Inserate</h4>
                                                    <p className="text-xs text-sand/60">Erweitere dein Kontingent von 3 auf 25 gleichzeitig aktive Inserate.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <Sparkles className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Spotlight-Rotation</h4>
                                                    <p className="text-xs text-sand/60">Automatische Einbindung deines Profils in das Campuna Spotlight der Startseite.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Echtzeit-KPI Analysen</h4>
                                                    <p className="text-xs text-sand/60">Detaillierte Aufruf- und Lead-Statistiken, CTR und Besucherdaten.</p>
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
                                        {isCommercial && (
                                            <div className="relative h-44 sm:h-52 bg-gradient-to-r from-[#004709] via-[#002204] to-[#040805] overflow-hidden group">
                                                {(isEditing ? draft?.cover_image_url : profile?.cover_image_url) && subDetails.is_business ? (
                                                    <img
                                                        src={getImageUrl(isEditing ? draft?.cover_image_url : profile?.cover_image_url)}
                                                        alt="Cover"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 relative">
                                                        <Compass className="w-24 h-24 stroke-[1]" />
                                                        {!subDetails.is_business && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                                <span className="text-[11px] font-semibold text-sand/80 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10">
                                                                    Standard Campuna Banner
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                                                {isEditing && (
                                                    subDetails.is_business ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => coverInputRef.current?.click()}
                                                            className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 text-white font-semibold text-xs cursor-pointer z-10"
                                                        >
                                                            <Camera className="w-5 h-5 animate-pulse text-gold" />
                                                            <span>Hintergrundbild ändern</span>
                                                            <span className="text-[9px] text-white/70">(Max. 5 MB)</span>
                                                        </button>
                                                    ) : (
                                                        <div
                                                            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-colors flex flex-col items-center justify-center gap-2 text-white p-4 text-center z-10"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/40">
                                                                <Crown className="w-4 h-4 text-gold" />
                                                            </div>
                                                            <div className="space-y-0.5 max-w-sm">
                                                                <p className="font-bold text-xs text-sand">Individuelles Schaufenster-Cover</p>
                                                                <p className="text-[11px] text-sand/80 leading-tight">
                                                                    Exklusiv im <strong className="text-gold font-bold">Business-Tarif (29 €/Monat)</strong> für professionelles Branding.
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => router.push('/abo')}
                                                                className="mt-1 inline-flex items-center gap-1.5 bg-gold hover:bg-gold-light text-forest font-black text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md transition-all hover:scale-105 cursor-pointer"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-forest" />
                                                                <span>Jetzt auf Business upgraden</span>
                                                            </button>
                                                        </div>
                                                    )
                                                )}

                                                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gold text-forest shadow-sm flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5" /> Gewerblich
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${subDetails.is_business ? 'bg-forest text-sand border border-gold/30' : 'bg-white text-charcoal'}`}>
                                                        {subDetails.is_business ? 'Business' : 'Free'}
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
                                                            {isPrivate ? (
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

                                                                {isCommercial && (
                                                                    <FormField label="Website" value={profile?.website_url} editValue={draft.website_url}
                                                                        isEditing={true} onChange={v => setDraft(d => ({ ...d, website_url: v }))}
                                                                        placeholder="https://meine-firma.de" icon={Globe} type="url" />
                                                                )}
                                                            </div>

                                                            {isCommercial && (
                                                                <div className="space-y-4 pt-2 border-t border-beige">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                        <FormField label="Instagram URL" value={profile?.instagram_url} editValue={draft.instagram_url}
                                                                            isEditing={true} onChange={v => setDraft(d => ({ ...d, instagram_url: v }))}
                                                                            placeholder="https://instagram.com/..." icon={AtSign} type="url" />
                                                                        <FormField label="Facebook URL" value={profile?.facebook_url} editValue={draft.facebook_url}
                                                                            isEditing={true} onChange={v => setDraft(d => ({ ...d, facebook_url: v }))}
                                                                            placeholder="https://facebook.com/..." icon={Share2} type="url" />
                                                                        <FormField label="LinkedIn URL" value={profile?.linkedin_url} editValue={draft.linkedin_url}
                                                                            isEditing={true} onChange={v => setDraft(d => ({ ...d, linkedin_url: v }))}
                                                                            placeholder="https://linkedin.com/company/..." icon={Linkedin} type="url" />
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <FormField label="USt-IdNr." value={profile?.vat_id} editValue={draft.vat_id}
                                                                            isEditing={true} onChange={v => setDraft(d => ({ ...d, vat_id: v }))}
                                                                            placeholder="DE123456789" icon={Shield} />
                                                                    </div>
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
                                                                    {isCommercial ? 'Gewerblich' : 'Privat'}
                                                                </span>

                                                                {pioneerBadge ? (
                                                                    <PioneerBadge
                                                                        size="sm"
                                                                        text="Campuna Pioneer"
                                                                        onClick={() => setBadgeModalOpen(true)}
                                                                        title="Dein Campuna Pioneer Badge Status"
                                                                    />
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

                                                        {isCommercial && (profile?.website_url || profile?.instagram_url || profile?.facebook_url || profile?.linkedin_url) && (
                                                            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
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
                                                                {profile.linkedin_url && (
                                                                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#faf8f3] hover:bg-sand border border-beige px-3 py-1.5 rounded-xl text-xs font-bold text-forest transition-all">
                                                                        <Linkedin className="w-3.5 h-3.5 text-gold-dark" /> LinkedIn
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── COMMERCIAL SPOTLIGHT PROMINENCE CARD ── */}
                                    {isCommercial && (
                                        <div className={`bg-gradient-to-br from-[#faf8f3] via-white to-sand/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border ${isSpotlightPaused ? 'border-amber-400 bg-amber-50/20' : 'border-gold/40'} shadow-sm relative overflow-hidden space-y-4`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-beige">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${isSpotlightPaused ? 'from-amber-400 to-amber-600' : 'from-gold to-amber-500'} text-forest flex items-center justify-center font-bold shadow-xs shrink-0`}>
                                                        <Sparkles className="w-5 h-5 text-forest" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-display font-black text-charcoal text-base">Campuna Spotlight (Startseite)</h3>
                                                            {isSpotlightActive ? (
                                                                <span key="badge-active" className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                                                                    <span>Aktiv (Live auf Startseite)</span>
                                                                </span>
                                                            ) : isSpotlightPaused ? (
                                                                <span key="badge-paused" className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                                                                    <span>Pausiert (Profil unvollständig)</span>
                                                                </span>
                                                            ) : (
                                                                <span key="badge-unbooked" className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-charcoal/60 border border-beige inline-flex items-center">
                                                                    <span>Nicht gebucht</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-charcoal/60 mt-0.5 leading-relaxed">
                                                            {isSpotlightActive
                                                                ? `Dein Unternehmen rotiert aktiv im Spotlight auf der Campuna-Startseite (noch ${spotlightDaysLeft} ${spotlightDaysLeft === 1 ? 'Tag' : 'Tage'}).`
                                                                : isSpotlightPaused
                                                                ? `Spotlight ist für noch ${spotlightDaysLeft} ${spotlightDaysLeft === 1 ? 'Tag' : 'Tage'} gebucht, pausiert jedoch, da dein Profil unvollständig ist. Bitte ergänze die fehlenden Angaben, damit dein Unternehmen auf der Startseite live ausgespielt wird.`
                                                                : 'Präsentiere dein Unternehmen prominent auf der Campuna Startseite für maximale Händler-Reichweite.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSpotlightPaused && !spotlightRequirements.allMet) {
                                                            setIsEditing(true);
                                                        } else {
                                                            setSpotlightModalOpen(true);
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto px-5 py-2.5 bg-forest hover:bg-[#004d0a] text-sand rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                                                >
                                                    <Sparkles className="w-4 h-4 text-gold" />
                                                    <span>
                                                        {isSpotlightActive 
                                                            ? 'Spotlight verlängern' 
                                                            : isSpotlightPaused 
                                                            ? 'Profil vervollständigen' 
                                                            : 'Spotlight buchen'}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Requirements Mini-Checker */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-charcoal/70">Voraussetzungen für Spotlight:</span>
                                                    <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${spotlightRequirements.allMet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                                                        {`${spotlightRequirements.metCount} / ${spotlightRequirements.totalCount} Kriterien erfüllt${spotlightRequirements.allMet ? (hasPaidSpotlight ? ' • Live auf Startseite' : ' • Bereit zur Buchung') : (hasPaidSpotlight ? ' • Spotlight pausiert' : '')}`}
                                                    </span>
                                                </div>
                                                {!spotlightRequirements.allMet && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditing(true)}
                                                        className="text-[11px] font-bold text-forest hover:text-gold-dark flex items-center gap-1 cursor-pointer underline"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Fehlende Angaben ergänzen</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

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
                                                            const img = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500';

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
                                                                            onClick={() => handleEditListing(item.id)}
                                                                            className="p-1.5 rounded-xl bg-white hover:bg-sand border border-beige text-charcoal/70 hover:text-forest transition-all cursor-pointer"
                                                                            title="Inserat bearbeiten"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        {item.status === 'APPROVED' ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleOpenBoostModal(item)}
                                                                                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gold/15 border border-beige hover:border-gold text-[10px] font-bold text-charcoal transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                                                title="Mit Campuna Credits boosten"
                                                                            >
                                                                                <Rocket className="w-3 h-3 text-gold-dark" />
                                                                                <span className="hidden sm:inline">Boosten</span>
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                disabled
                                                                                className="px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-400 cursor-not-allowed flex items-center gap-1 opacity-60"
                                                                                title="Boosten ist nur für freigegebene Inserate verfügbar"
                                                                            >
                                                                                <Rocket className="w-3 h-3 text-stone-400" />
                                                                                <span className="hidden sm:inline">Boosten</span>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeleteConfirmListing(item)}
                                                                            className="p-1.5 rounded-xl bg-white hover:bg-rose-50 border border-beige hover:border-rose-200 text-charcoal/60 hover:text-rose-600 transition-all cursor-pointer"
                                                                            title="Inserat löschen"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
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
                                                                <Sparkles className="w-3.5 h-3.5" />
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
                                            {/* Account Plan / Status Card */}
                                            {isPrivate ? (
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-forest flex items-center gap-1.5">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Konto-Status
                                                        </span>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-forest/10 text-forest border border-forest/20">
                                                            Kostenloses Privatkonto
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xl font-black text-charcoal">Kostenloses Privatkonto</h4>
                                                        <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                                                            Dauerhaft kostenfreie Nutzung. Erstelle und verwalte bis zu 3 Inserate ohne monatliche Fixkosten oder Abonnement.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2.5 pt-2 border-t border-beige text-xs text-charcoal/80">
                                                        <div className="flex items-center justify-between p-2.5 bg-[#faf8f3] rounded-xl border border-beige/60">
                                                            <div className="flex items-center gap-2">
                                                                <Rocket className="w-4 h-4 text-forest shrink-0" />
                                                                <span className="font-bold">Aktive Inserate:</span>
                                                            </div>
                                                            <span className="font-mono font-black text-forest">
                                                                {userListings.filter(l => l.status === 'APPROVED').length} / 3 aktiv
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />
                                                            <span>Kein Abonnement, keine versteckten Gebühren</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />
                                                            <span>Direkter Chat-Kontakt mit Interessenten</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                                                            <span>Optional: Einzelne Inserate hervorheben (ab 4,99 €)</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('inserate')}
                                                            className="w-full bg-forest hover:bg-[#004d0a] text-sand font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                                                        >
                                                            <Rocket className="w-3.5 h-3.5 text-gold" />
                                                            <span>Inserat hervorheben</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-sand shadow-md space-y-4 relative overflow-hidden border border-gold/20">
                                                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                                                            <CreditCard className="w-3.5 h-3.5" /> Mitgliedschaft
                                                        </span>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-sand">
                                                            {subDetails.is_business ? 'Business Aktiv' : 'Business Free'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xl font-black text-white">{subDetails.is_business ? 'Campuna Business Plan' : 'Business Free Plan'}</h4>
                                                        <p className="text-xs text-sand/80 mt-1 leading-relaxed">
                                                            {subDetails.is_business
                                                                ? 'Bis zu 25 Fahrzeug- & Zubehör-Inserate, Spotlight-Rotation und erweiterte Sichtbarkeit.'
                                                                : 'Erstelle bis zu 3 kostenfreie Inserate als Händler auf Campuna.'}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-sand/90">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                            <span>{subDetails.is_business ? 'Bis zu 25 aktive Inserate' : 'Maximal 3 aktive Inserate'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                            <span>{subDetails.is_business ? 'Automatische Spotlight-Rotation auf Startseite' : 'Basis-Sichtbarkeit'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                            <span>{subDetails.is_business ? 'Individuelles Cover & Logo' : 'Standard Profil'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                            <span>{subDetails.is_business ? '1.000 Zeichen Profil & Impressum' : '500 Zeichen Kurzprofil'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                            <span>{subDetails.is_business ? '+ 1.000 Campuna Credits inklusive' : 'Inserate boosten mit Credits'}</span>
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
                                                                className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                                                            >
                                                                <span>Auf Business upgraden (29 € / Monat)</span>
                                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

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
                                TAB: NACHRICHTEN & KONTAKT-ANFRAGEN (CHAT SYSTEM)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'nachrichten' && (
                                <div className="space-y-6">
                                    <TabHeader
                                        title="Nachrichten & Anfragen"
                                        subtitle="Kommuniziere in Echtzeit mit Käufern und Verkäufern zu Campuna Inseraten"
                                        icon={MessageSquare}
                                        badge={
                                            unreadMessagesCount > 0 ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-forest text-sand border border-gold/40 shadow-xs">
                                                    {unreadMessagesCount} {unreadMessagesCount === 1 ? 'neue Nachricht' : 'neue Nachrichten'}
                                                </span>
                                            ) : null
                                        }
                                    />
                                    <AccountChatTab
                                        currentUser={user}
                                        onNavigateToListings={() => setActiveTab('inserate')}
                                    />
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB: MERKZETTEL / FAVORITEN
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'favoriten' && (
                                <AccountFavoritesTab
                                    onNavigateToListings={() => setActiveTab('inserate')}
                                />
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

                                    {/* 4 Metric Overview Cards (Credits & Pioneer styled Bento Cards) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* 1. Gesamt Inserate (Forest-to-Dark Luxury Bento Hero Tile) */}
                                        <button
                                            type="button"
                                            onClick={() => setListingStatusFilter('ALL')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[130px] ${
                                                listingStatusFilter === 'ALL'
                                                    ? 'bg-gradient-to-br from-[#004709] via-[#002805] to-[#040805] text-sand shadow-lg ring-2 ring-gold border border-gold/40 scale-[1.01]'
                                                    : 'bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-sand shadow-md border border-gold/20 hover:border-gold/50 hover:shadow-lg hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                                            
                                            <div className="flex items-center justify-between relative z-10">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-sand/70">
                                                    Gesamt Inserate
                                                </span>
                                                <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0 group-hover:bg-gold group-hover:text-forest transition-colors shadow-xs">
                                                    <Rocket className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="relative z-10 mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-gold tracking-tight">
                                                    {userListings.length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/10 text-[10px] text-sand/70">
                                                    <span>Alle Fahrzeuge</span>
                                                    <span className="font-bold text-gold flex items-center gap-0.5">
                                                        {subDetails.is_business ? '∞ Kontingent' : `${userListings.length}/3 Free`}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* 2. Veröffentlicht (Active / Approved) */}
                                        <button
                                            type="button"
                                            onClick={() => setListingStatusFilter('APPROVED')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[130px] ${
                                                listingStatusFilter === 'APPROVED'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-emerald-500 border border-emerald-300 scale-[1.01]'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-emerald-700 transition-colors">
                                                    Veröffentlicht
                                                </span>
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tracking-tight">
                                                    {userListings.filter(l => l.status === 'APPROVED').length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live auf Marktplatz
                                                    </span>
                                                    <span className="font-bold text-emerald-700">Aktiv</span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* 3. In Prüfung (Review Queue) */}
                                        <button
                                            type="button"
                                            onClick={() => setListingStatusFilter('REVIEW')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[130px] ${
                                                listingStatusFilter === 'REVIEW'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-amber-500 border border-amber-300 scale-[1.01]'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-amber-700 transition-colors">
                                                    In Prüfung
                                                </span>
                                                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 tracking-tight">
                                                    {userListings.filter(l => l.status === 'REVIEW').length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3 text-amber-600" /> Moderation
                                                    </span>
                                                    <span className="font-bold text-amber-700">
                                                        {userListings.filter(l => l.status === 'REVIEW').length > 0 ? 'In Prüfung' : 'Keine'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* 4. Geboostet (Boosted Ads) */}
                                        <button
                                            type="button"
                                            onClick={() => setListingStatusFilter('BOOSTED')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[130px] ${
                                                listingStatusFilter === 'BOOSTED'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-gold border border-gold scale-[1.01]'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-gold hover:shadow-md hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-gold-dark transition-colors">
                                                    Geboostet
                                                </span>
                                                <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark shrink-0 group-hover:bg-gold group-hover:text-forest transition-colors shadow-xs">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-gold-dark tracking-tight">
                                                    {userListings.filter(l => l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date())).length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-gold-dark" /> Reichweite
                                                    </span>
                                                    <span className="font-bold text-gold-dark">Top-Platzierung</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Filter & Search Toolbar */}
                                    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-beige shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                                        {/* Status Pills */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                            {[
                                                { id: 'ALL', label: `Alle (${userListings.length})` },
                                                { id: 'APPROVED', label: `Veröffentlicht (${userListings.filter(l => l.status === 'APPROVED').length})` },
                                                { id: 'REVIEW', label: `In Prüfung (${userListings.filter(l => l.status === 'REVIEW').length})` },
                                                { id: 'BOOSTED', label: 'Geboostet' },
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
                                        <div className="p-12 text-center bg-white rounded-3xl border border-beige shadow-xs">
                                            <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto mb-4">
                                                <Compass className="w-7 h-7 text-forest" />
                                            </div>
                                            <h3 className="text-base font-bold text-charcoal">Keine Inserate gefunden</h3>
                                            <p className="text-xs text-charcoal/60 max-w-md mx-auto mt-1 mb-6">
                                                {listingSearch || listingStatusFilter !== 'ALL'
                                                    ? 'Keine Inserate entsprechen deinen aktuellen Filterkriterien.'
                                                    : 'Du hast bisher noch keine Inserate angelegt. Erstelle jetzt dein erstes Camping-Inserat auf Campuna.'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleCreateListingClick}
                                                className="inline-flex items-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4 text-gold" />
                                                <span>Jetzt Inserat aufgeben</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4.5">
                                            {filteredListings.map((item) => {
                                                const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                                                const img = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600';
                                                const features = [
                                                    item.subcategory,
                                                    item.condition,
                                                    item.fuel_type || item.fuelType,
                                                    item.transmission,
                                                    item.brand
                                                ].filter(Boolean);

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="listing-card group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-forest/10 hover:border-forest/25 shadow-xs hover:shadow-md transition-all duration-300 select-none justify-between"
                                                    >
                                                        <div>
                                                            {/* Compact Image */}
                                                            <div 
                                                                className="relative h-36 w-full overflow-hidden bg-sand/20 cursor-pointer"
                                                                onClick={() => router.push(`/inserate/${item.slug || item.id}`)}
                                                            >
                                                                <img
                                                                    src={img}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    loading="lazy"
                                                                />
                                                                {/* Top Status Badges */}
                                                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 flex-wrap z-10 pointer-events-none">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-xs ${item.status === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}`}>
                                                                        {item.status === 'APPROVED' ? 'Veröffentlicht' : 'In Prüfung'}
                                                                    </span>
                                                                    {isBoosted && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest shadow-xs flex items-center gap-1 font-sans">
                                                                            <Rocket className="w-2.5 h-2.5" /> Geboostet
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Location Pill */}
                                                                <div className="absolute bottom-2 right-2 flex items-center justify-end pointer-events-none text-white/90 z-10">
                                                                    <div className="bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-1">
                                                                        <MapPin className="w-2.5 h-2.5 text-gold shrink-0" />
                                                                        <span className="truncate max-w-[110px]">{item.location || 'Deutschland'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Card Content Body */}
                                                            <div className="p-3.5 space-y-1.5 font-sans">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-forest/70 block">
                                                                    {item.category || 'Camping Inserat'}
                                                                </span>

                                                                <h3 
                                                                    className="font-display text-xs sm:text-sm font-bold text-charcoal group-hover:text-forest transition-colors line-clamp-1 leading-snug cursor-pointer"
                                                                    onClick={() => router.push(`/inserate/${item.slug || item.id}`)}
                                                                    title={item.title}
                                                                >
                                                                    {item.title}
                                                                </h3>

                                                                {/* Features Pills */}
                                                                {features.length > 0 && (
                                                                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                                                                        {features.slice(0, 3).map((feat, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="text-[9px] text-charcoal/60 bg-sand/60 px-1.5 py-0.5 rounded-md border border-forest/5 whitespace-nowrap shrink-0 font-medium"
                                                                            >
                                                                                {feat}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Price Row */}
                                                                <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
                                                                    <span className="text-[10px] uppercase tracking-wider text-charcoal/45 font-medium">
                                                                        {item.negotiable || item.isNegotiable ? 'VB' : 'Festpreis'}
                                                                    </span>
                                                                    <span className="font-display text-sm sm:text-base font-black text-forest">
                                                                        {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bottom Actions Row */}
                                                        <div className="p-3 pt-0 mt-1 border-t border-beige/60 pt-2.5 flex items-center justify-between gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditListing(item.id)}
                                                                className="flex-1 flex items-center justify-center gap-1 bg-[#faf8f3] hover:bg-forest hover:text-white border border-beige py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                                                title="Inserat bearbeiten"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                                <span>Bearbeiten</span>
                                                            </button>

                                                            {item.status === 'APPROVED' ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenBoostModal(item)}
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-gold via-[#ffd269] to-gold hover:brightness-105 text-forest font-bold py-1.5 px-2 rounded-xl text-[11px] transition-all cursor-pointer shadow-2xs"
                                                                    title="Mit Campuna Credits boosten"
                                                                >
                                                                    <Rocket className="w-3 h-3 text-forest" />
                                                                    <span>Boosten</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-stone-100 border border-stone-200 text-stone-400 font-bold py-1.5 px-2 rounded-xl text-[11px] cursor-not-allowed opacity-60"
                                                                    title="Boosten ist nur für freigegebene Inserate verfügbar"
                                                                >
                                                                    <Rocket className="w-3 h-3 text-stone-400" />
                                                                    <span>Boosten</span>
                                                                </button>
                                                            )}

                                                            <Link
                                                                href={`/inserate/${item.slug || item.id}`}
                                                                className="p-1.5 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/60 hover:text-forest rounded-xl transition-all shrink-0"
                                                                title="Inserat ansehen"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteConfirmListing(item)}
                                                                className="p-1.5 bg-[#faf8f3] hover:bg-rose-50 border border-beige hover:border-rose-200 text-charcoal/60 hover:text-rose-600 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs"
                                                                title="Inserat löschen"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
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
                                        icon={CreditCard}
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
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h2 className="text-lg sm:text-xl font-black text-forest">
                                                            {subDetails.is_business ? 'Campuna Premium Plan' : 'Free Standard Plan'}
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
                                                        className="px-5 py-2.5 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                                                    >
                                                        <span>Auf Premium upgraden (29 €)</span>
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
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
                                                        {subDetails.is_business ? `${userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length} / 25 Inserate` : `${userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length} / 3 Inserate`}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5">
                                                    <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length >= (subDetails.is_business ? 25 : 3)
                                                                    ? 'bg-rose-500'
                                                                    : 'bg-forest'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, Math.round((userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length / (subDetails.is_business ? 25 : 3)) * 100))}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-charcoal/60">
                                                        {subDetails.is_business
                                                            ? `${Math.max(0, 25 - userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length)} von 25 Inserat-Plätzen frei.`
                                                            : userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length >= 3
                                                                ? 'Limit erreicht. Jetzt auf Business upgraden für bis zu 25 Inserate.'
                                                                : `Noch ${Math.max(0, 3 - userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length)} freie Inserat-Plätze verfügbar.`}
                                                    </p>
                                                </div>
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
                                                        : 'Standard-Kurzprofil für gewerbliche Basis-Accounts.'}
                                                </p>
                                            </div>

                                            {/* Metric 3: Cover & Branding */}
                                            <div className="p-4 bg-[#faf8f3] rounded-2xl border border-beige space-y-2">
                                                <span className="font-bold text-charcoal/60 uppercase tracking-wider text-[10px]">Spotlight & Branding</span>
                                                <div className="text-xl font-black text-charcoal">
                                                    {subDetails.is_business ? 'Spotlight & Cover' : 'Basis-Präsenz'}
                                                </div>
                                                <p className="text-[11px] text-charcoal/60">
                                                    {subDetails.is_business
                                                        ? 'Automatische Spotlight-Rotation & Firmen-Cover aktiv.'
                                                        : 'Basis-Layout ohne Titelbild & Spotlight-Rotation.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── 2. MIDDLE SECTION: VERFÜGBARE TARIFE IM VERGLEICH (OTHER PLANS) ── */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black text-forest">Gewerbliche Tarife & Optionen</h3>
                                            <p className="text-xs text-charcoal/60">Wähle die passende Lösung für dein Unternehmen und deine Fahrzeugangebote</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                                            {/* Plan Card 1: Business Free */}
                                            <div className={`rounded-2xl sm:rounded-3xl p-6 flex flex-col justify-between transition-all ${
                                                !subDetails.is_business 
                                                    ? 'bg-white border-2 border-forest/40 shadow-sm relative' 
                                                    : 'bg-white border border-beige shadow-xs hover:border-forest/20'
                                            }`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">Basis-Einstieg</span>
                                                            <h4 className="text-xl font-black text-charcoal">Business Free</h4>
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
                                                        <p className="text-xs text-charcoal/60 mt-1">Kostenloser Einstieg für gewerbliche Händler und Werkstätten.</p>
                                                    </div>

                                                    <div className="space-y-2.5 pt-3 border-t border-beige text-xs text-charcoal/80">
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span><strong>Bis zu 3 aktive Inserate</strong> gleichzeitig</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>500 Zeichen Unternehmensbeschreibung</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>Inserate einzeln hervorheben (ab 4,99 €)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                                            <span>Direkte Kundenanfragen per Chat</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-charcoal/40">
                                                            <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                                            <span className="line-through">Spotlight-Rotation auf Startseite</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-charcoal/40">
                                                            <X className="w-4 h-4 text-charcoal/30 shrink-0" />
                                                            <span className="line-through">Individuelles Firmen-Cover</span>
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
                                                    <span className="bg-gradient-to-r from-gold via-[#dfbe7f] to-gold text-forest text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                                                        {subDetails.is_business ? 'Aktiver Plan' : 'Empfohlen für Händler'}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className={`flex items-center justify-between pb-3 border-b ${subDetails.is_business ? 'border-white/15' : 'border-beige'}`}>
                                                        <div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${subDetails.is_business ? 'text-gold' : 'text-gold-dark'}`}>
                                                                Gewerbe-Upgrade
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
                                                            Für professionelle Camping-Händler, Vermieter und Ausbauer.
                                                        </p>
                                                    </div>

                                                    <div className={`space-y-2.5 pt-3 border-t text-xs ${subDetails.is_business ? 'border-white/15 text-sand/90' : 'border-beige text-charcoal/80'}`}>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Bis zu 25 aktive Inserate</strong> gleichzeitig</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Professionelles Firmen-Cover & Logo</strong></span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>1.000 Zeichen</strong> Firmenbeschreibung</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Präsenz im Verzeichnis</strong> „Alle Händler / Anbieter“</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span><strong>Detaillierte Live-Statistiken</strong> & Lead-Cockpit</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${subDetails.is_business ? 'text-gold' : 'text-emerald-600'}`} />
                                                            <span>Monatlich flexibel kündbar</span>
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
                                                            className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                                                        >
                                                            <span>Jetzt auf Business upgraden</span>
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
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
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">1. Teilen</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Gib deinen Link oder Code an Camping-Freunde und Händler weiter.</p>
                                                        </div>
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">2. Registrieren</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Dein Kontakt meldet sich mit deinem Code bei Campuna an.</p>
                                                        </div>
                                                        <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige text-left">
                                                            <span className="text-xs font-black text-forest font-mono">3. Beide profitieren</span>
                                                            <p className="text-[11px] text-charcoal/70 mt-0.5">Privat: Nach dem 1. freigegebenen Inserat. Gewerblich: Nach vollständigem Firmenprofil erhalten beide 100 CC.</p>
                                                        </div>
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

                                    {/* Guthaben aufladen (Credits-Pakete) */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-5">
                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark">
                                                    <CoinIcon size="sm" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-charcoal text-sm">Guthaben aufladen (Credits-Pakete)</h3>
                                                    <p className="text-[11px] text-charcoal/50 font-medium">Kaufe Campuna Credits für flexible Reichweiten-Boosts deiner Inserate</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                            {[
                                                { credits: 500, priceEur: '4,99 €', label: '7 Tage Inserat-Highlight', popular: false },
                                                { credits: 800, priceEur: '7,99 €', label: '14 Tage Inserat-Highlight', popular: true },
                                                { credits: 1300, priceEur: '12,99 €', label: '30 Tage Inserat-Highlight', popular: false },
                                                { credits: 2500, priceEur: '24,99 €', label: 'Großes Spar-Paket', popular: false, badge: 'Spar-Tipp' },
                                            ].map((pkg) => (
                                                <div
                                                    key={pkg.credits}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative bg-[#faf8f3] hover:bg-sand/60 ${
                                                        pkg.popular ? 'border-forest/60 ring-2 ring-forest/15 shadow-sm' : 'border-beige'
                                                    }`}
                                                >
                                                    {pkg.popular && (
                                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-forest text-sand tracking-tight shadow-xs">
                                                            Beliebt
                                                        </span>
                                                    )}
                                                    {pkg.badge && (
                                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest tracking-tight shadow-xs">
                                                            {pkg.badge}
                                                        </span>
                                                    )}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 font-mono font-black text-lg text-forest">
                                                            <CoinIcon size="sm" />
                                                            <span>{pkg.credits.toLocaleString('de-DE')} CC</span>
                                                        </div>
                                                        <div className="text-sm font-bold text-charcoal">{pkg.priceEur}</div>
                                                        <p className="text-[11px] text-charcoal/60 leading-tight pt-1">{pkg.label}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenBuyCreditModal(pkg.credits)}
                                                        className="mt-4 w-full bg-forest hover:bg-[#004d0a] text-sand py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span>Jetzt aufladen</span>
                                                        <ArrowRight className="w-3 h-3 text-gold" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Transaktionsverlauf (Ledger Activity) */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                    <Receipt className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-charcoal text-sm">Guthaben- & Transaktionsverlauf</h3>
                                                    <p className="text-[11px] text-charcoal/50 font-medium">Vollständiger Audit-Verlauf aller Gutschriften & Ausgaben</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-charcoal/60">
                                                {creditTransactions.length} {creditTransactions.length === 1 ? 'Eintrag' : 'Einträge'}
                                            </span>
                                        </div>

                                        {creditTransactions.length === 0 ? (
                                            <div className="py-8 text-center bg-[#faf8f3] rounded-2xl border border-dashed border-beige p-6 space-y-1">
                                                <p className="text-xs text-charcoal/60 font-medium">Noch keine Transaktionen aufgezeichnet.</p>
                                                <p className="text-[11px] text-charcoal/40">Sobald du Guthaben auflädst, Freunde einlädst oder Inserate boostest, erscheinen die Einträge hier.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                                {creditTransactions.map((tx) => {
                                                    const isPositive = tx.amount > 0;
                                                    const isZero = tx.amount === 0;
                                                    return (
                                                        <div key={tx.id} className="flex items-center justify-between p-3.5 bg-[#faf8f3] rounded-xl border border-beige text-xs gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-charcoal truncate">{tx.description || tx.type}</p>
                                                                <p className="text-[10px] text-charcoal/50 font-mono mt-0.5">
                                                                    {new Date(tx.created_at).toLocaleDateString('de-DE', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <span className={`font-mono font-black text-xs ${
                                                                    isPositive ? 'text-emerald-700' : isZero ? 'text-forest' : 'text-rose-600'
                                                                }`}>
                                                                    {isPositive ? `+${tx.amount.toLocaleString('de-DE')} CC` : isZero ? 'Direktzahlung' : `${tx.amount.toLocaleString('de-DE')} CC`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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
                                                <PioneerBadge size="sm" text="Campuna Pioneer" />
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

                                        <PioneerBadge variant="hero" />
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
                                                        <span>Glückwunsch! Du bist Campuna Pioneer</span>
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
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige p-6 sm:p-7 space-y-5 relative"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between pb-3 border-b border-beige">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-gold-dark" />
                                        <h3 className="font-black text-charcoal text-lg sm:text-xl font-display">Mehr Sichtbarkeit für dein Inserat</h3>
                                    </div>
                                    <p className="text-xs text-charcoal/70 leading-relaxed">
                                        Dein Angebot wird für die gewählte Laufzeit hervorgehoben und bevorzugt angezeigt.
                                    </p>
                                </div>
                                <button onClick={() => setBoostModalOpen(false)} className="text-charcoal/40 hover:text-charcoal p-1 rounded-full hover:bg-sand transition-colors cursor-pointer shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Target Listing Preview */}
                            <div className="p-3 bg-[#faf8f3] rounded-2xl border border-beige flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-forest/10 overflow-hidden shrink-0">
                                    <img
                                        src={getImageUrl(selectedListingForBoost.images?.[0]?.url || selectedListingForBoost.images?.[0] || selectedListingForBoost.image_url)}
                                        alt={selectedListingForBoost.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Ausgewähltes Inserat:</span>
                                    <p className="font-bold text-sm text-charcoal truncate">{selectedListingForBoost.title}</p>
                                </div>
                            </div>

                            {/* 3 Core Benefits */}
                            <div className="bg-sand/60 rounded-2xl p-4 space-y-2 border border-beige">
                                <span className="text-[11px] font-black uppercase tracking-wider text-forest block mb-1">Deine Vorteile:</span>
                                <div className="flex items-center gap-2.5 text-xs text-charcoal font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Bessere Platzierung in passenden Übersichten</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-charcoal font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Optische Hervorhebung</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-charcoal font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Zusätzliche Chance auf prominente Darstellung auf Campuna</span>
                                </div>
                            </div>

                            {/* Duration Packages */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">Laufzeit wählen:</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { days: 7, priceEur: '4,99 €', cost: 500 },
                                        { days: 14, priceEur: '7,99 €', cost: 800, popular: true },
                                        { days: 30, priceEur: '12,99 €', cost: 1300 },
                                    ].map(pkg => (
                                        <button
                                            key={pkg.days}
                                            type="button"
                                            onClick={() => setBoostDuration(pkg.days)}
                                            className={`p-3 sm:p-3.5 rounded-2xl text-center border transition-all cursor-pointer relative ${
                                                boostDuration === pkg.days
                                                    ? 'border-forest bg-forest text-sand shadow-md ring-2 ring-forest/20'
                                                    : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand'
                                            }`}
                                        >
                                            {pkg.popular && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-gold text-forest tracking-tight shadow-xs">
                                                    Beliebt
                                                </span>
                                            )}
                                            <span className="text-xs font-black block">{pkg.days} Tage</span>
                                            <span className={`text-sm font-bold block ${boostDuration === pkg.days ? 'text-white' : 'text-charcoal'}`}>
                                                {pkg.priceEur}
                                            </span>
                                            <span className={`text-[10px] font-mono font-bold block mt-0.5 ${boostDuration === pkg.days ? 'text-gold' : 'text-forest'}`}>
                                                {pkg.cost.toLocaleString('de-DE')} CC
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider block">Zahlungsart wählen:</label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* 1. Pay with Campuna Credits */}
                                    <button
                                        type="button"
                                        onClick={() => setBoostPaymentMethod('CREDIT')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-2.5 ${
                                            boostPaymentMethod === 'CREDIT'
                                                ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                                : 'border-beige bg-[#faf8f3] hover:bg-sand/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 mt-0.5">
                                            <CoinIcon size="sm" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-charcoal">Campuna Credits</span>
                                                {boostPaymentMethod === 'CREDIT' && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
                                            </div>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5">
                                                Guthaben: <strong className="text-forest font-mono">{Number(creditBalance).toLocaleString('de-DE')} CC</strong>
                                            </p>
                                            {Number(creditBalance) < (boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300) && (
                                                <span className="text-[9px] font-bold text-rose-600 block mt-0.5">Guthaben zu gering</span>
                                            )}
                                        </div>
                                    </button>

                                    {/* 2. Direct Credit Card */}
                                    <button
                                        type="button"
                                        onClick={() => setBoostPaymentMethod('CREDIT_CARD')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-2.5 ${
                                            boostPaymentMethod === 'CREDIT_CARD'
                                                ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                                : 'border-beige bg-[#faf8f3] hover:bg-sand/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-charcoal">Kreditkarte</span>
                                                {boostPaymentMethod === 'CREDIT_CARD' && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
                                            </div>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5">Visa, Mastercard, Amex</p>
                                        </div>
                                    </button>

                                    {/* 3. SEPA */}
                                    <button
                                        type="button"
                                        onClick={() => setBoostPaymentMethod('SEPA')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-2.5 ${
                                            boostPaymentMethod === 'SEPA'
                                                ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                                : 'border-beige bg-[#faf8f3] hover:bg-sand/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-charcoal">SEPA-Lastschrift</span>
                                                {boostPaymentMethod === 'SEPA' && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
                                            </div>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5">Bequem per Bankeinzug</p>
                                        </div>
                                    </button>

                                    {/* 4. PayPal */}
                                    <button
                                        type="button"
                                        onClick={() => setBoostPaymentMethod('PAYPAL')}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-2.5 ${
                                            boostPaymentMethod === 'PAYPAL'
                                                ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20'
                                                : 'border-beige bg-[#faf8f3] hover:bg-sand/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-charcoal">PayPal</span>
                                                {boostPaymentMethod === 'PAYPAL' && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
                                            </div>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5">Schnell & Käuferschutz</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Top-up Link if low balance */}
                            {boostPaymentMethod === 'CREDIT' && Number(creditBalance) < (boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300) && (
                                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                                    <div className="text-[11px] text-amber-900 font-medium">
                                        Fehlende Credits: <strong className="font-mono">{((boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300) - Number(creditBalance)).toLocaleString('de-DE')} CC</strong>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBoostModalOpen(false);
                                            handleOpenBuyCreditModal(boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300);
                                        }}
                                        className="text-[11px] font-black text-forest underline cursor-pointer hover:text-forest/80"
                                    >
                                        Credits jetzt aufladen &rarr;
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleExecuteBoost}
                                    disabled={boosting || (boostPaymentMethod === 'CREDIT' && Number(creditBalance) < (boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300))}
                                    className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {boosting ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Rocket className="w-4 h-4 text-gold" />}
                                    <span>
                                        {boosting
                                            ? 'Wird verarbeitet...'
                                            : boostPaymentMethod === 'CREDIT'
                                            ? `Mit ${(boostDuration === 7 ? 500 : boostDuration === 14 ? 800 : 1300).toLocaleString('de-DE')} CC bezahlen`
                                            : `Jetzt für ${boostDuration === 7 ? '4,99 €' : boostDuration === 14 ? '7,99 €' : '12,99 €'} kaufen & hervorheben`}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBoostModalOpen(false)}
                                    className="px-5 bg-[#faf8f3] text-charcoal hover:bg-sand rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer border border-beige"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1.1 Campuna Spotlight Booking Modal */}
            <AnimatePresence>
                {spotlightModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
                        onClick={() => !bookingSpotlight && setSpotlightModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-beige p-6 sm:p-7 space-y-5 relative my-auto"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between pb-3 border-b border-beige">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center text-forest font-bold">
                                            <Sparkles className="w-4 h-4 text-forest" />
                                        </div>
                                        <h3 className="font-black text-charcoal text-lg sm:text-xl font-display">Campuna Spotlight buchen</h3>
                                    </div>
                                    <p className="text-xs text-charcoal/70 leading-relaxed">
                                        Platziere dein Unternehmen in der prominenten Spotlight-Sektion auf der Campuna-Startseite.
                                    </p>
                                </div>
                                <button
                                    onClick={() => !bookingSpotlight && setSpotlightModalOpen(false)}
                                    className="text-charcoal/40 hover:text-charcoal p-1 rounded-full hover:bg-sand transition-colors cursor-pointer shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Profile Completeness Checklist */}
                            <div className="bg-[#faf8f3] rounded-2xl border border-beige p-4 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between font-bold text-charcoal pb-1 border-b border-beige/60">
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-gold-dark" /> Voraussetzungen für Spotlight
                                    </span>
                                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${spotlightRequirements.allMet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {spotlightRequirements.metCount} / {spotlightRequirements.totalCount} erfüllt
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {spotlightRequirements.list.map((req) => (
                                        <div key={req.id} className="flex items-center gap-2 text-[11px]">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ${req.met ? 'bg-emerald-600' : 'bg-stone-300'}`}>
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
                                            <span className={req.met ? 'text-charcoal font-medium' : 'text-charcoal/50'}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {!spotlightRequirements.allMet && (
                                    <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                                        <span>Vervollständige dein Profil, um Spotlight freizuschalten.</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSpotlightModalOpen(false);
                                                setIsEditing(true);
                                            }}
                                            className="font-bold text-forest underline cursor-pointer hover:text-gold-dark shrink-0"
                                        >
                                            Jetzt bearbeiten &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Duration Packages */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">Spotlight-Dauer wählen:</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { days: 7, priceEur: '14,99 €', cc: '1.500 CC', label: '7 Tage' },
                                        { days: 14, priceEur: '24,99 €', cc: '2.500 CC', label: '14 Tage', popular: true },
                                        { days: 30, priceEur: '39,99 €', cc: '4.000 CC', label: '30 Tage', bestValue: true },
                                    ].map((pkg) => (
                                        <button
                                            key={pkg.days}
                                            type="button"
                                            onClick={() => setSpotlightDuration(pkg.days)}
                                            className={`p-3.5 rounded-2xl text-center border transition-all cursor-pointer relative flex flex-col justify-between ${
                                                spotlightDuration === pkg.days
                                                    ? 'border-forest bg-forest text-sand shadow-md ring-2 ring-forest/20'
                                                    : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand/60'
                                            }`}
                                        >
                                            {pkg.popular && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[8px] font-black uppercase bg-gold text-forest tracking-tight">
                                                    Beliebt
                                                </span>
                                            )}
                                            {pkg.bestValue && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-500 text-white tracking-tight">
                                                    Spartipp
                                                </span>
                                            )}
                                            <span className="text-xs font-black block">{pkg.label}</span>
                                            <span className={`text-base font-extrabold block my-1 ${spotlightDuration === pkg.days ? 'text-white' : 'text-charcoal'}`}>
                                                {pkg.priceEur}
                                            </span>
                                            <span className={`text-[10px] block opacity-80 ${spotlightDuration === pkg.days ? 'text-sand' : 'text-charcoal/60'}`}>
                                                oder {pkg.cc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">Zahlungsmethode:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'CREDIT', label: 'Campuna Credits', icon: CoinIcon, isCoin: true },
                                        { id: 'CREDIT_CARD', label: 'Kreditkarte', icon: CreditCard },
                                        { id: 'PAYPAL', label: 'PayPal', icon: ShieldCheck },
                                        { id: 'SEPA', label: 'SEPA', icon: Building2 },
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setSpotlightPaymentMethod(m.id)}
                                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                                    spotlightPaymentMethod === m.id
                                                        ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20 text-forest font-bold'
                                                        : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand/40'
                                                }`}
                                            >
                                                {m.isCoin ? <CoinIcon size="xs" /> : <Icon className="w-3.5 h-3.5 text-forest" />}
                                                <span className="text-[10px] leading-tight">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Balance check if CREDIT selected */}
                            {spotlightPaymentMethod === 'CREDIT' && (
                                <div className="p-3 bg-[#faf8f3] rounded-xl border border-beige flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-charcoal/70">Verfügbares Guthaben:</span>
                                    <span className="font-mono font-bold text-forest">{Number(creditBalance).toLocaleString('de-DE')} CC</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleBookSpotlight}
                                    disabled={bookingSpotlight || !spotlightRequirements.allMet || (spotlightPaymentMethod === 'CREDIT' && Number(creditBalance) < (spotlightDuration === 7 ? 1500 : spotlightDuration === 14 ? 2500 : 4000))}
                                    className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bookingSpotlight ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Sparkles className="w-4 h-4 text-gold" />}
                                    <span>
                                        {bookingSpotlight
                                            ? 'Wird aktiviert...'
                                            : !spotlightRequirements.allMet
                                            ? 'Profil unvollständig'
                                            : spotlightPaymentMethod === 'CREDIT'
                                            ? `Mit ${(spotlightDuration === 7 ? 1500 : spotlightDuration === 14 ? 2500 : 4000).toLocaleString('de-DE')} CC aktivieren`
                                            : `Jetzt für ${spotlightDuration === 7 ? '14,99 €' : spotlightDuration === 14 ? '24,99 €' : '39,99 €'} buchen`}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSpotlightModalOpen(false)}
                                    className="px-5 bg-[#faf8f3] text-charcoal hover:bg-sand rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer border border-beige"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1.2 Credit Top-Up Purchase Modal */}
            <AnimatePresence>
                {buyCreditModalOpen && (
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
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige p-6 sm:p-7 space-y-5 relative"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between pb-3 border-b border-beige">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CoinIcon size="sm" />
                                        <h3 className="font-black text-charcoal text-lg sm:text-xl font-display">Campuna Credits aufladen</h3>
                                    </div>
                                    <p className="text-xs text-charcoal/70 leading-relaxed">
                                        Lade dein Guthaben auf, um deine Inserate jederzeit mit 1 Klick hervorzuheben.
                                    </p>
                                </div>
                                <button onClick={() => setBuyCreditModalOpen(false)} className="text-charcoal/40 hover:text-charcoal p-1 rounded-full hover:bg-sand transition-colors cursor-pointer shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Select Package */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">Paket wählen:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { credits: 500, priceEur: '4,99 €', sub: '7 Tage' },
                                        { credits: 800, priceEur: '7,99 €', sub: '14 Tage', popular: true },
                                        { credits: 1300, priceEur: '12,99 €', sub: '30 Tage' },
                                        { credits: 2500, priceEur: '24,99 €', sub: 'Spar-Paket' },
                                    ].map((pkg) => (
                                        <button
                                            key={pkg.credits}
                                            type="button"
                                            onClick={() => setSelectedCreditPkg(pkg.credits)}
                                            className={`p-3 rounded-2xl text-center border transition-all cursor-pointer relative ${
                                                selectedCreditPkg === pkg.credits
                                                    ? 'border-forest bg-forest text-sand shadow-md ring-2 ring-forest/20'
                                                    : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand'
                                            }`}
                                        >
                                            {pkg.popular && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-gold text-forest tracking-tight">
                                                    Beliebt
                                                </span>
                                            )}
                                            <span className="text-xs font-black block font-mono">{pkg.credits.toLocaleString('de-DE')} CC</span>
                                            <span className={`text-xs font-bold block mt-0.5 ${selectedCreditPkg === pkg.credits ? 'text-white' : 'text-charcoal'}`}>
                                                {pkg.priceEur}
                                            </span>
                                            <span className={`text-[9px] block opacity-80 ${selectedCreditPkg === pkg.credits ? 'text-sand' : 'text-charcoal/60'}`}>
                                                {pkg.sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Select Payment Method */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">Zahlungsmethode:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'CREDIT_CARD', label: 'Kreditkarte', icon: CreditCard },
                                        { id: 'SEPA', label: 'SEPA', icon: Building2 },
                                        { id: 'PAYPAL', label: 'PayPal', icon: ShieldCheck },
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setCreditPaymentMethod(m.id)}
                                                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                                    creditPaymentMethod === m.id
                                                        ? 'border-forest bg-sand/60 shadow-xs ring-2 ring-forest/20 text-forest font-bold'
                                                        : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand/40'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 text-forest" />
                                                <span className="text-[11px]">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="p-3.5 bg-[#faf8f3] rounded-2xl border border-beige flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-charcoal/60 block text-[10px] uppercase font-bold">Zu zahlender Betrag:</span>
                                    <span className="font-bold text-sm text-charcoal">
                                        {selectedCreditPkg === 500 ? '4,99 €' : selectedCreditPkg === 800 ? '7,99 €' : selectedCreditPkg === 1300 ? '12,99 €' : '24,99 €'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-charcoal/60 block text-[10px] uppercase font-bold">Gutschrift:</span>
                                    <span className="font-mono font-black text-sm text-forest">
                                        +{selectedCreditPkg.toLocaleString('de-DE')} CC
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handlePurchaseCreditPackage}
                                    disabled={buyingCredits}
                                    className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {buyingCredits ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <CoinIcon size="sm" />}
                                    <span>{buyingCredits ? 'Wird aufgeladen...' : `Jetzt für ${selectedCreditPkg === 500 ? '4,99 €' : selectedCreditPkg === 800 ? '7,99 €' : selectedCreditPkg === 1300 ? '12,99 €' : '24,99 €'} aufladen`}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBuyCreditModalOpen(false)}
                                    className="px-5 bg-[#faf8f3] text-charcoal hover:bg-sand rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer border border-beige"
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
                                <h3 className="font-black text-charcoal text-lg">
                                    Inserate-Limit erreicht ({userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status)).length} / {subDetails.is_business ? 25 : 3})
                                </h3>
                                <p className="text-xs text-charcoal/70 leading-relaxed mt-1">
                                    {profileType === 'COMMERCIAL'
                                        ? (!subDetails.is_business
                                            ? 'Im kostenfreien Business Free Tarif können maximal 3 Inserate gleichzeitig aktiv sein. Mit dem Business Plan kannst du bis zu 25 Inserate gleichzeitig schalten!'
                                            : 'Du hast das maximale Limit von 25 aktiven Inseraten erreicht.')
                                        : 'Im kostenlosen Privatkonto können maximal 3 Inserate gleichzeitig aktiv sein.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {profileType === 'COMMERCIAL' && !subDetails.is_business ? (
                                    <button
                                        type="button"
                                        onClick={() => { setLimitModalOpen(false); router.push('/abo/kasse'); }}
                                        className="flex-1 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-gold/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Auf Business Upgraden
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setLimitModalOpen(false); setActiveTab('inserate'); }}
                                        className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                    >
                                        Inserate verwalten
                                    </button>
                                )}
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
                                Test-Bankdaten automatisch ausfüllen
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
                                    <PioneerBadge variant="hero" className="mx-auto" />

                                    <div className="space-y-2">
                                        <div className="flex justify-center">
                                            <PioneerBadge size="md" text="Campuna Pioneer" />
                                        </div>
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
                                    <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
                                        <PioneerBadge variant="hero" />
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
                                            Sichere dir das exklusive Campuna Pioneer Abzeichen für maximales Vertrauen bei Interessenten und dauerhaften Gründerstatus auf Campuna.
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
                                            <ShieldCheck className="w-4 h-4 text-gold-dark mx-auto" />
                                            <span className="font-bold text-[11px] text-charcoal block leading-tight">Höchstes Vertrauen</span>
                                            <span className="text-[9px] text-charcoal/50 block">Geprüfter Pionier</span>
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

            {/* Delete Listing Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                        onClick={() => !isDeletingListing && setDeleteConfirmListing(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-7 border border-beige shadow-2xl max-w-md w-full space-y-5 relative"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-charcoal">Inserat löschen?</h3>
                                    <p className="text-xs text-charcoal/60 mt-0.5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                                </div>
                            </div>

                            <div className="bg-[#faf8f3] p-3.5 rounded-2xl border border-beige/80 text-xs text-charcoal/80 space-y-1">
                                <p className="font-semibold text-charcoal truncate">{deleteConfirmListing.title || 'Dieses Inserat'}</p>
                                <p className="text-charcoal/50 text-[11px] font-mono">
                                    {deleteConfirmListing.price ? `${parseFloat(deleteConfirmListing.price).toLocaleString('de-DE')} €` : ''} • {deleteConfirmListing.category || 'Inserat'}
                                </p>
                            </div>

                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                Möchtest du dieses Inserat wirklich löschen?
                            </p>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={isDeletingListing}
                                    onClick={() => setDeleteConfirmListing(null)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-beige bg-[#faf8f3] hover:bg-sand text-xs font-bold text-charcoal transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeletingListing}
                                    onClick={handleDeleteListing}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isDeletingListing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Wird gelöscht...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Löschen</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reward & Listing Approval Celebration Modal */}
            <AnimatePresence>
                {rewardCelebrationModalOpen && celebrationReward && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setRewardCelebrationModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl max-w-md w-full text-center relative overflow-hidden space-y-5"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-gold/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-forest/15 rounded-full blur-3xl pointer-events-none" />

                            {/* Floating Close Button */}
                            <button
                                type="button"
                                onClick={() => setRewardCelebrationModalOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand/60 hover:bg-sand text-charcoal/60 hover:text-charcoal flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Header Icon Graphic */}
                            <div className="flex justify-center pt-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gold/30 rounded-full blur-xl animate-pulse" />
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sand via-[#faf8f3] to-sand/80 border-2 border-gold/40 flex items-center justify-center shadow-lg relative z-10">
                                        {celebrationReward.amount ? (
                                            <img
                                                src="/coin.png"
                                                alt="Campuna Credits"
                                                className="w-14 h-14 object-contain drop-shadow-md animate-bounce"
                                                style={{ animationDuration: '2s' }}
                                            />
                                        ) : (
                                            <Sparkles className="w-10 h-10 text-gold" />
                                        )}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-gold text-forest rounded-full p-1 shadow-md z-20">
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30">
                                    <Sparkles className="w-3 h-3 text-gold" />
                                    Herzlichen Glückwunsch!
                                </span>
                                <h3 className="font-extrabold text-xl sm:text-2xl text-charcoal tracking-tight">
                                    {celebrationReward.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed max-w-sm mx-auto">
                                    {celebrationReward.description}
                                </p>
                            </div>

                            {/* Reward Highlight Box */}
                            {celebrationReward.amount && (
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-forest to-[#003807] text-sand shadow-inner border border-gold/30 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-sand/70 tracking-wider">Erhaltene Belohnung</span>
                                    <div className="text-3xl sm:text-4xl font-black font-mono text-gold flex items-center justify-center gap-2">
                                        <span>+{celebrationReward.amount}</span>
                                        <span className="text-lg sm:text-xl font-sans text-sand">Credits</span>
                                    </div>
                                    <p className="text-[11px] text-sand/70">
                                        Einsatzbereit für Spotlight-Boosts & Top-Platzierungen
                                    </p>
                                </div>
                            )}

                            {/* Current Credit Balance indicator if credits */}
                            {celebrationReward.balance !== undefined && (
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#faf8f3] rounded-xl border border-beige text-xs">
                                    <span className="text-charcoal/60 font-medium">Dein Gesamtguthaben:</span>
                                    <span className="font-black font-mono text-forest flex items-center gap-1">
                                        <CoinIcon className="w-4 h-4 text-gold inline" />
                                        {Number(celebrationReward.balance).toLocaleString('de-DE')} CC
                                    </span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRewardCelebrationModalOpen(false);
                                        if (celebrationReward.type === 'LISTING_APPROVED') {
                                            handleTabChange('inserate');
                                        } else {
                                            handleTabChange('credits');
                                        }
                                    }}
                                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-forest hover:bg-[#004d0a] text-sand text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    <span>{celebrationReward.type === 'LISTING_APPROVED' ? 'Inserate anzeigen' : 'Credits ansehen & boosten'}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-gold" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRewardCelebrationModalOpen(false)}
                                    className="w-full sm:w-auto py-3 px-4 rounded-xl border border-beige bg-[#faf8f3] hover:bg-sand text-xs font-bold text-charcoal transition-all cursor-pointer"
                                >
                                    Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Warning Modal */}
            <AnimatePresence>
                {logoutConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                        onClick={() => !loggingOut && setLogoutConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-7 border border-beige shadow-2xl max-w-md w-full space-y-5 relative text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                                    <LogOut className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-charcoal">Möchtest du dich wirklich abmelden?</h3>
                                    <p className="text-xs text-charcoal/60 mt-0.5">Campuna Sitzung beenden</p>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed">
                                Du wirst von deinem Konto abgemeldet. Deine Inserate, Favoriten und Einstellungen bleiben natürlich sicher gespeichert.
                            </p>

                            <div className="flex items-center gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={loggingOut}
                                    onClick={() => setLogoutConfirmOpen(false)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-beige bg-[#faf8f3] hover:bg-sand text-xs font-bold text-charcoal transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    disabled={loggingOut}
                                    onClick={handleLogoutConfirm}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 hover:scale-[1.02]"
                                >
                                    {loggingOut ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Wird abgemeldet...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="w-4 h-4" />
                                            <span>Ja, abmelden</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

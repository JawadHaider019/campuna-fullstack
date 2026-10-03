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
    createStripeCheckoutSession,
    verifyStripeSession,
} from '@/api/profile';
import { getMyListings, boostListing, deleteListing, toggleListingStatus } from '@/api/listings';
import { logoutUser } from '@/api/auth';
import { toast } from 'react-hot-toast';
import CoinIcon from '@/app/components/CoinIcon';
import UserDashboard from './components/UserDashboard';
import AccountChatTab from './components/AccountChatTab';
import AccountFavoritesTab from './components/AccountFavoritesTab';
import AccountCreateListingTab from './components/AccountCreateListingTab';
import AccountSubscriptionTab from './components/AccountSubscriptionTab';
import AccountCreditsTab from './components/AccountCreditsTab';
import AccountPioneerTab from './components/AccountPioneerTab';
import AccountFeedbackTab from './components/AccountFeedbackTab';
import { useChatStore } from '@/store/useChatStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { isValidPhoneNumber, sanitizePhoneInput, handlePhoneKeyDown, PHONE_VALIDATION_ERROR } from '@/utils/validation';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';
import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';
import { PROVIDER_CATEGORIES } from '@/data';


import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2, Plus, Award, AlertTriangle, Sparkles,
    Crown, Calendar, ArrowRight, Receipt, Download, Printer, CreditCard,
    Rocket, Eye, LayoutDashboard, Gift, Users, CheckCircle2, Zap, ExternalLink,
    Clock, TrendingUp, Bell, Search, ShieldCheck, Compass, CheckCircle, Pencil, Send,
    FileSpreadsheet, MessageSquare, Heart, Trash2, PanelLeftClose, PanelLeftOpen, PanelLeft,
    Pause, Play, Power, BarChart2, Circle, MessageSquareHeart
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
    dashboard: 'Mein Profil',
    business_cockpit: 'Business Cockpit',
    inserate: 'Meine Inserate',
    create_listing: 'Inserat erstellen',
    nachrichten: 'Nachrichten',
    favoriten: 'Merkzettel',
    abo: 'Abonnement & Plan',
    credits: 'Campuna Credits',
    empfehlen: 'Freunde werben',
    sicherheit: 'Sicherheit',
    pioneer: 'Pionier Status',
    feedback: 'Feedback & Kontakt'
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

    // Active Navigation Tab with URL and Session Persistence
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const requestedTab = params.get('tab');
            if (requestedTab) {
                if (['nachrichten', 'messages', 'chat'].includes(requestedTab)) return 'nachrichten';
                if (['favoriten', 'merkzettel', 'favorites'].includes(requestedTab)) return 'favoriten';
                if (['create_listing', 'anzeige-erstellen', 'inserat-erstellen'].includes(requestedTab)) return 'create_listing';
                return requestedTab;
            }
            try {
                const savedTab = localStorage.getItem('campuna_active_account_tab');
                if (savedTab) return savedTab;
            } catch (_) {}
        }
        return 'dashboard';
    });

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

    // Commercial Pioneer Criteria Evaluation
    const commercialPioneerCriteria = useMemo(() => {
        if (!isCommercial) return null;
        const source = isEditing ? draft : (profile || {});
        const hasLogo = Boolean(source?.logo_url && String(source.logo_url).trim());
        const hasBio = Boolean(source?.bio && String(source.bio).trim().length >= 20);
        const hasCompanyName = Boolean(source?.company_name && String(source.company_name).trim());
        const hasPhone = Boolean(source?.phone && String(source.phone).trim());
        const hasLocation = Boolean((source?.location && String(source.location).trim()) || (source?.company_address && String(source.company_address).trim()));
        const isVerified = Boolean(user?.email_verified);
        const hasListings = approvedListingsCount >= 3;

        const list = [
            { id: 'verified', label: 'Verifiziertes gewerbliches Konto', detail: 'E-Mail-Adresse bestätigt', met: isVerified },
            { id: 'logo', label: 'Firmenlogo hinterlegt', detail: 'Offizielles Profil-/Firmenlogo', met: hasLogo },
            { id: 'bio', label: 'Unternehmensbeschreibung', detail: 'Mindestens 20 Zeichen', met: hasBio },
            { id: 'contact', label: 'Vollständige Unternehmens- & Kontaktdaten', detail: 'Firmenname, Telefon & Standort/Adresse', met: hasCompanyName && hasPhone && hasLocation },
            { id: 'listings', label: 'Mindestens 3 freigegebene Inserate', detail: 'Von der Moderation geprüft', met: hasListings, value: `${approvedListingsCount} / 3` }
        ];

        const allMet = isVerified && hasLogo && hasBio && hasCompanyName && hasPhone && hasLocation && hasListings;
        const isProfileOnlyComplete = hasLogo && hasBio && hasCompanyName && hasPhone && hasLocation;

        return {
            list,
            allMet,
            isProfileOnlyComplete,
            metCount: list.filter(i => i.met).length,
            totalCount: list.length
        };
    }, [isCommercial, isEditing, draft, profile, user, approvedListingsCount]);

    const isProfileComplete = useMemo(() => {
        if (!profile) return false;
        if (isCommercial) {
            return Boolean(commercialPioneerCriteria?.isProfileOnlyComplete);
        }
        return Boolean(profile.first_name && profile.last_name && profile.bio && profile.location);
    }, [profile, isCommercial, commercialPioneerCriteria]);

    // Spotlight Requirements Evaluation (Spotlight requires active Business subscription + complete profile)
    const spotlightRequirements = useMemo(() => {
        const source = isEditing ? draft : (profile || {});
        const hasLogo = Boolean(source?.logo_url && String(source.logo_url).trim());
        const hasCover = Boolean(source?.cover_image_url && String(source.cover_image_url).trim());
        const hasBio = Boolean(source?.bio && String(source.bio).trim().length >= 20);
        const hasPhone = Boolean(source?.phone && String(source.phone).trim());
        const hasLocation = Boolean((source?.location && String(source.location).trim()) || (source?.company_address && String(source.company_address).trim()));
        const isVerified = Boolean(user?.email_verified);
        const isCommercialUser = isCommercial;
        const isBusinessSubscriber = Boolean(subDetails?.is_business);

        const list = [
            { id: 'business_plan', label: 'Aktiver Campuna Business Plan (29 €/Monat)', met: isBusinessSubscriber },
            { id: 'logo', label: 'Firmenlogo / Profilbild', met: hasLogo },
            { id: 'cover', label: 'Titelbild / Banner', met: hasCover },
            { id: 'bio', label: 'Unternehmensbeschreibung (mind. 20 Zeichen)', met: hasBio },
            { id: 'phone', label: 'Telefonnummer', met: hasPhone },
            { id: 'location', label: 'Standort oder Adresse', met: hasLocation },
        ];

        const metCount = list.filter(i => i.met).length;

        return {
            hasLogo,
            hasCover,
            hasBio,
            hasPhone,
            hasLocation,
            isCommercial: isCommercialUser,
            isBusinessSubscriber,
            list,
            metCount,
            totalCount: list.length,
            allMet: isBusinessSubscriber && hasLogo && hasCover && hasBio && hasPhone && hasLocation && isCommercialUser,
        };
    }, [isEditing, draft, profile, isCommercial, subDetails]);

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

            let matchesStatus = true;
            if (listingStatusFilter === 'ALL') {
                matchesStatus = true;
            } else if (listingStatusFilter === 'BOOSTED') {
                matchesStatus = Boolean(l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date()));
            } else if (listingStatusFilter === 'APPROVED') {
                matchesStatus = l.status === 'APPROVED' || l.status === 'AKTIV';
            } else if (listingStatusFilter === 'INACTIVE') {
                matchesStatus = l.status === 'INACTIVE' || l.status === 'DEACTIVATED';
            } else if (listingStatusFilter === 'REVIEW') {
                matchesStatus = l.status === 'REVIEW';
            } else if (listingStatusFilter === 'REJECTED') {
                matchesStatus = l.status === 'REJECTED';
            } else {
                matchesStatus = l.status === listingStatusFilter;
            }

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

            // Handle Stripe return redirect callback if present
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const sessionId = urlParams.get('session_id');
                const isStripeSuccess = urlParams.get('stripe_success') === 'true' || urlParams.get('spotlight_success') === 'true';
                const isStripeCancelled = urlParams.get('stripe_cancelled') === 'true' || urlParams.get('spotlight_cancelled') === 'true';

                if (isStripeCancelled) {
                    toast.error('Zahlungsvorgang über Stripe abgebrochen.');
                    window.history.replaceState({}, document.title, window.location.pathname + (urlParams.get('tab') ? `?tab=${urlParams.get('tab')}` : ''));
                } else if (sessionId && isStripeSuccess) {
                    try {
                        const verifyRes = await verifyStripeSession(sessionId);
                        if (verifyRes.success && verifyRes.data?.paid) {
                            if (verifyRes.data.type === 'CREDIT_PURCHASE') {
                                toast.success('🎉 Campuna Credits erfolgreich über Stripe aufgeladen!', { duration: 5000 });
                            } else if (verifyRes.data.type === 'SPOTLIGHT_PURCHASE') {
                                toast.success('🎉 Spotlight-Platzierung erfolgreich über Stripe aktiviert!', { duration: 5000 });
                            } else if (verifyRes.data.type === 'SUBSCRIPTION') {
                                toast.success('🎉 Campuna Business erfolgreich über Stripe aktiviert!', { duration: 5000 });
                            }
                        }
                    } catch (_) {}
                    window.history.replaceState({}, document.title, window.location.pathname + (urlParams.get('tab') ? `?tab=${urlParams.get('tab')}` : ''));
                }
            }

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

            // Background polling every 20s to ensure real-time notification sync
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, 20000);

            const handleFocus = () => {
                fetchUnreadCount();
            };
            window.addEventListener('focus', handleFocus);
            window.addEventListener('campuna-unread-sync', handleFocus);

            // Check if tab is requested via query param or saved in localStorage
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const requestedTab = params.get('tab');
                if (requestedTab) {
                    if (['nachrichten', 'messages', 'chat'].includes(requestedTab)) {
                        setActiveTab('nachrichten');
                    } else if (['favoriten', 'merkzettel', 'favorites'].includes(requestedTab)) {
                        setActiveTab('favoriten');
                    } else if (['create_listing', 'anzeige-erstellen', 'inserat-erstellen'].includes(requestedTab)) {
                        const editId = params.get('edit') || params.get('id');
                        if (editId) setEditingListingId(editId);
                        setActiveTab('create_listing');
                    } else {
                        setActiveTab(requestedTab);
                    }
                }

                const handlePopState = () => {
                    const currentParams = new URLSearchParams(window.location.search);
                    const tabFromUrl = currentParams.get('tab') || 'dashboard';
                    setActiveTab(tabFromUrl);
                };
                window.addEventListener('popstate', handlePopState);
            }

            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('campuna-unread-sync', handleFocus);
            };
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
            try {
                localStorage.setItem('campuna_active_account_tab', tabId);
            } catch (_) {}

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
        const activeApprovedListings = userListings.filter(l => ['APPROVED', 'REVIEW'].includes(l.status));
        const isBusinessUser = subDetails.is_business;

        if (isCommercial) {
            const limit = isBusinessUser ? -1 : 10;
            if (limit !== -1 && activeApprovedListings.length >= limit) {
                toast.error('Du hast das Inserate-Limit im kostenlosen Firmentarif erreicht. Bitte upgrade auf den Business-Tarif für maximale Reichweite.');
                return;
            }
        } else {
            // Private user: internal limit is 10 active listings
            if (activeApprovedListings.length >= 10) {
                toast.error('Veröffentlichung nicht möglich: Du hast das Inserate-Kontingent für private Konten erreicht.');
                return;
            }
        }

        setEditingListingId(null);
        handleTabChange('create_listing');
    };

    const handleEditListing = (listingId) => {
        handleTabChange('create_listing', listingId);
    };

    const [togglingListingId, setTogglingListingId] = useState(null);

    const handleToggleListingStatus = async (listingItem) => {
        if (!listingItem?.id) return;
        const currentIsActive = listingItem.status === 'APPROVED' || listingItem.status === 'AKTIV';
        const targetStatus = currentIsActive ? 'INACTIVE' : 'APPROVED';
        const actionLabel = currentIsActive ? 'pausiert' : 'aktiviert';
        
        setTogglingListingId(listingItem.id);
        const toastId = toast.loading(`Inserat wird ${actionLabel}...`);
        try {
            const res = await toggleListingStatus(listingItem.id, targetStatus);
            if (res.data?.success || res.status === 200) {
                const newStatus = res.data?.status || targetStatus;
                toast.success(res.data?.message || `Inserat erfolgreich ${actionLabel}.`, { id: toastId });
                setUserListings(prev => prev.map(l => l.id === listingItem.id ? { ...l, status: newStatus } : l));
            } else {
                toast.error(res.data?.error || `Fehler beim ${actionLabel} des Inserats.`, { id: toastId });
            }
        } catch (err) {
            console.error('Error toggling listing status:', err);
        } finally {
            setTogglingListingId(null);
        }
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
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCancel = () => {
        setDraft({ ...profile });
        setPendingAvatarFile(null);
        setPendingCoverFile(null);
        setIsEditing(false);
    };

    const sanitizeUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
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

            // Sanitize and trim external URLs safely
            if (payload.website_url) payload.website_url = sanitizeUrl(payload.website_url);
            if (payload.instagram_url) payload.instagram_url = sanitizeUrl(payload.instagram_url);
            if (payload.facebook_url) payload.facebook_url = sanitizeUrl(payload.facebook_url);
            if (payload.linkedin_url) payload.linkedin_url = sanitizeUrl(payload.linkedin_url);

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

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    const handleAvatarUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.');
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
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

        if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
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
        const targetSlug = listing.slug || listing.id;
        router.push(`/inserate/${encodeURIComponent(targetSlug)}/boosten`);
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
        const toastId = toast.loading(`Kauf von ${selectedCreditPkg.toLocaleString('de-DE')} CC (${priceEur}) wird vorbereitet...`);

        try {
            const stripeRes = await createStripeCheckoutSession({
                type: 'CREDIT_PURCHASE',
                package_credits: selectedCreditPkg,
                return_url: window.location.origin,
            });

            if (stripeRes.success && stripeRes.data?.url) {
                toast.success('Weiterleitung zu Stripe...', { id: toastId });
                window.location.href = stripeRes.data.url;
            } else {
                toast.error(stripeRes.error || 'Fehler beim Erstellen der Stripe-Zahlungssitzung.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Guthabenkauf über Stripe fehlgeschlagen.', { id: toastId });
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

        if (spotlightPaymentMethod === 'CREDIT') {
            if ((Number(creditBalance) || 0) < cost) {
                toast.error(`Nicht genügend Credits (${creditBalance} CC vorhanden, ${cost} CC benötigt).`);
                return;
            }

            setBookingSpotlight(true);
            const toastId = toast.loading('Spotlight wird mit Credits aktiviert...');

            try {
                const res = await bookSpotlight({
                    durationDays: spotlightDuration,
                    payment_method: 'CREDIT'
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
        } else {
            // Stripe Payment Method
            setBookingSpotlight(true);
            const toastId = toast.loading(`Spotlight-Zahlung (${priceEur}) über Stripe wird vorbereitet...`);

            try {
                const stripeRes = await createStripeCheckoutSession({
                    type: 'SPOTLIGHT_PURCHASE',
                    duration_days: spotlightDuration,
                    return_url: window.location.origin,
                });

                if (stripeRes.success && stripeRes.data?.url) {
                    toast.success('Weiterleitung zu Stripe...', { id: toastId });
                    window.location.href = stripeRes.data.url;
                } else {
                    toast.error(stripeRes.error || 'Fehler beim Erstellen der Stripe-Sitzung.', { id: toastId });
                }
            } catch (err) {
                toast.error(err.response?.data?.error || err.message || 'Stripe-Zahlung fehlgeschlagen.', { id: toastId });
            } finally {
                setBookingSpotlight(false);
            }
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
        ...(isCommercial && subDetails.is_business ? [
            {
                id: 'business_cockpit',
                label: 'Business Cockpit',
                icon: LayoutDashboard,
            }
        ] : []),
        { id: 'dashboard', label: 'Mein Profil', icon: User },
        { id: 'inserate', label: 'Meine Inserate', icon: Rocket },
        { 
            id: 'nachrichten', 
            label: 'Nachrichten', 
            icon: MessageSquare,
            hasNotification: unreadMessagesCount > 0,
            badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : null
        },
        { id: 'favoriten', label: 'Merkzettel', icon: Heart },
        ...(profileType === 'COMMERCIAL' ? [
            { id: 'finanzen', label: 'Abonnement', icon: CreditCard }
        ] : []),
        { id: 'credits', label: 'Campuna Credits', icon: Gift },
        { id: 'pioneer', label: pioneerBadge ? 'Campuna Pioneer' : 'Pioneer Auszeichnung', icon: Award },
        { id: 'feedback', label: 'Feedback & Support', icon: MessageSquareHeart },
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
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs relative ${isActive
                                    ? 'bg-forest text-sand shadow-sm shadow-forest/20 font-black'
                                    : 'bg-white text-charcoal/70 hover:bg-[#faf8f3] border border-beige'
                                    }`}
                            >
                                <div className="relative flex items-center justify-center shrink-0">
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-forest'}`} />
                                    {item.hasNotification && (
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    )}
                                </div>
                                <span className="whitespace-nowrap">{item.label}</span>
                                {item.badge && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none ${
                                        isActive ? 'bg-gold text-forest' : 'bg-rose-500 text-white'
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
                                                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                                                } px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                                    isActive
                                                        ? 'bg-gold text-forest font-bold shadow-md shadow-gold/20'
                                                        : 'text-sand/75 hover:text-white hover:bg-white/10 font-medium'
                                                }`}
                                            >
                                                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                                                    <div className="relative flex items-center justify-center shrink-0">
                                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest' : 'text-sand/60 group-hover:text-gold'}`} />
                                                        {item.hasNotification && (
                                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!sidebarCollapsed && (
                                                        <span className="truncate leading-none">{item.label}</span>
                                                    )}
                                                </div>

                                                {!sidebarCollapsed && item.badge && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                                        isActive
                                                            ? 'bg-forest text-sand'
                                                            : 'bg-rose-500 text-white shadow-xs'
                                                    }`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Floating Tooltip in collapsed mode */}
                                            {sidebarCollapsed && (
                                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-950/95 text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-white/10 z-50 flex items-center gap-1.5">
                                                    <span>{item.label}</span>
                                                    {item.hasNotification && (
                                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                                                            {item.badge || 'neu'}
                                                        </span>
                                                    )}
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
                                            Professionelles Firmenprofil, Live-Analytics & Business-Tools freischalten.
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
                    <div className={`flex-1 h-full min-h-0 min-w-0 ${
                        activeTab === 'nachrichten'
                            ? 'p-0 overflow-hidden flex flex-col'
                            : 'overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-7'
                    }`}>
                        {/* ── Breadcrumbs inside page canvas (Mobile only) ── */}
                        {activeTab !== 'nachrichten' && (
                            <div className="block lg:hidden mb-3.5">
                                <Breadcrumbs
                                    items={activeTab === 'dashboard'
                                        ? [{ label: 'Mein Konto' }]
                                        : [{ label: 'Mein Konto', href: '/mein-konto' }, { label: navItems.find(n => n.id === activeTab)?.label || activeTab }]}
                                    variant="light"
                                />
                            </div>
                        )}

                        <main className={`w-full ${
                            activeTab === 'nachrichten'
                                ? 'h-full max-w-none space-y-0 overflow-hidden flex flex-col flex-1 min-h-0'
                                : 'max-w-[1700px] mx-auto space-y-6'
                        }`}>

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
                                        onOpenSpotlightModal={() => setSpotlightModalOpen(true)}
                                        onNavigateTab={(tab) => setActiveTab(tab)}
                                        user={user}
                                    />
                                ) : (

                                    <div className="space-y-6">
                                        <TabHeader
                                            title="Campuna Business Cockpit"
                                            subtitle="Schalte professionelle Business-Werkzeuge, Firmen-Cover und Live-Analysen frei"
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
                                                    Exklusiv für Unternehmen & professionelle Anbieter
                                                </span>
                                                <h2 className="text-3xl sm:text-4xl font-black text-sand font-display tracking-tight">
                                                    Maximiere deinen Camping-Erfolg mit dem Campuna Business Plan
                                                </h2>
                                                <p className="text-sm text-sand/80 leading-relaxed font-sans">
                                                    Erhalte Zugriff auf ein professionelles Firmenprofil mit individuellem Cover & Bio, Echtzeit-Reichweitenanalysen, direkte Kundenanfragen-Pipeline sowie die exklusive Berechtigung zur flexiblen Spotlight-Buchung.
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
                                                    <h4 className="font-bold text-sm text-sand">Maximale Reichweite</h4>
                                                    <p className="text-xs text-sand/60">Profitiere von bevorzugter Auffindbarkeit und regionaler Sichtbarkeit.</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                                    <div className="p-2 rounded-xl bg-gold/20 text-gold w-fit">
                                                        <Sparkles className="w-4 h-4" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-sand">Spotlight-Berechtigung</h4>
                                                    <p className="text-xs text-sand/60">Exklusiver Zugang zur flexiblen Buchung reichweitenstarker Homepage-Spotlights.</p>
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
                                                    <h4 className="font-bold text-sm text-sand">Firmen-Cover & Business-Kennzeichnung</h4>
                                                    <p className="text-xs text-sand/60">Individuelles Firmen-Cover, 1.000 Zeichen Bio und exklusive Business-Präsenz.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 1: MEIN PROFIL (DEDICATED PROFILE & ACCOUNT SETTINGS)
                                (ANIMATED & FULLY RESPONSIVE - WIDE SCREEN OPTIMIZED)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'dashboard' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className="space-y-6 w-full max-w-[1700px] mx-auto"
                                >
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Mein Profil & Kontoeinstellungen"
                                        subtitle="Verwalte deine persönlichen Stammdaten, Kontaktinformationen und öffentliche Darstellung"
                                        icon={User}
                                        action={
                                            !isEditing ? (
                                                <button
                                                    id="btn-edit-profile"
                                                    type="button"
                                                    onClick={handleEdit}
                                                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-sand border border-beige hover:border-gold/50 text-forest font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-full transition-all shadow-xs cursor-pointer group w-full sm:w-auto active:scale-95"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-gold-dark group-hover:scale-110 transition-transform" />
                                                    <span>Profil bearbeiten</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <button
                                                        type="button"
                                                        onClick={handleCancel}
                                                        className="flex-1 sm:flex-initial bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-full transition-all cursor-pointer active:scale-95"
                                                    >
                                                        Abbrechen
                                                    </button>
                                                    <button
                                                        type="button"
                                                        id="btn-save-profile"
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="flex-1 sm:flex-initial bg-forest hover:bg-[#004d0a] text-sand font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Save className="w-4 h-4 text-gold" />}
                                                        <span>{saving ? 'Speichern...' : 'Profil speichern'}</span>
                                                    </button>
                                                </div>
                                            )
                                        }
                                    />

                                    {/* Profile Hero & Branding Card */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.05 }}
                                        className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-beige overflow-hidden relative"
                                    >
                                        {/* Cover Banner for Business Users Only */}
                                        {isCommercial && subDetails.is_business && (
                                            <div className="relative h-44 sm:h-52 md:h-64 lg:h-72 bg-gradient-to-r from-[#004709] via-[#002204] to-[#040805] overflow-hidden group">
                                                {(isEditing ? draft?.cover_image_url : profile?.cover_image_url) ? (
                                                    <img
                                                        src={getImageUrl(isEditing ? draft?.cover_image_url : profile?.cover_image_url)}
                                                        alt="Cover"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 relative">
                                                        <Compass className="w-24 h-24 stroke-[1]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

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

                                                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap">
                                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gold text-forest shadow-sm flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5" /> Gewerblich
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm bg-forest text-sand border border-gold/30">
                                                        Business
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profile Details & Form Section */}
                                        <div className="p-5 sm:p-7 md:p-8 relative">
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
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                            <FormField label="Firmenname" value={profile?.company_name} editValue={draft.company_name}
                                                                                isEditing={true} onChange={v => setDraft(d => ({ ...d, company_name: v }))}
                                                                                placeholder="z.B. Alpine Camper GmbH" icon={Building2} />
                                                                            <FormField label="Telefon" value={profile?.phone} editValue={draft.phone}
                                                                                isEditing={true} onChange={v => setDraft(d => ({ ...d, phone: v }))}
                                                                                placeholder="+49 30 ..." icon={Phone} type="tel" />
                                                                        </div>

                                                                        <div className="flex flex-col gap-1.5">
                                                                            <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                                                                <Building2 className="w-3.5 h-3.5 text-forest" /> Haupt-Anbieterkategorie
                                                                            </label>
                                                                            <select
                                                                                value={draft.provider_category || profile?.provider_category || 'Wohnmobil- & Wohnwagenhändler'}
                                                                                onChange={e => setDraft(d => ({ ...d, provider_category: e.target.value }))}
                                                                                className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-sans cursor-pointer"
                                                                            >
                                                                                {PROVIDER_CATEGORIES.map(cat => (
                                                                                    <option key={cat.id} value={cat.name}>
                                                                                        {cat.name}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
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
                                                        <div className="space-y-2 max-w-4xl w-full">
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
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                                                                    <span>Mitglied seit {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }) : '2026'}</span>
                                                                </span>
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
                                    </motion.div>

                                    {/* Responsive Profile & Account Settings Grid (Equal Height Aligned) */}
                                    <div className={isCommercial ? "grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch" : "w-full flex flex-col gap-5 sm:gap-6"}>
                                        {/* Left Column (Spotlight + Credits for Commercial) */}
                                        {isCommercial && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                className="lg:col-span-7 flex flex-col justify-between gap-5 sm:gap-6 h-full"
                                            >
                                                {/* Spotlight Requirements & Status Card (For Commercial Sellers) */}
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4 hover:border-gold/50 transition-all flex-1 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark shadow-xs shrink-0">
                                                                    <Sparkles className="w-4 h-4 text-gold-dark" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className="font-bold text-charcoal text-sm truncate">Spotlight-Qualifizierung</h3>
                                                                    <p className="text-[11px] text-charcoal/50 font-medium">Anforderungen für das Händler-Spotlight</p>
                                                                </div>
                                                            </div>

                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                                                isSpotlightActive
                                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                    : isSpotlightPaused
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                    : spotlightRequirements.allMet
                                                                    ? 'bg-forest/10 text-forest border border-forest/20'
                                                                    : 'bg-[#faf8f3] text-charcoal/60 border border-beige'
                                                            }`}>
                                                                {isSpotlightActive
                                                                    ? `Aktiv (${spotlightDaysLeft}d)`
                                                                    : isSpotlightPaused
                                                                    ? 'Pausiert'
                                                                    : spotlightRequirements.allMet
                                                                    ? 'Berechtigt'
                                                                    : `${spotlightRequirements.metCount}/${spotlightRequirements.totalCount} Erfüllt`}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-charcoal/70 leading-relaxed font-sans">
                                                                Mit dem Spotlight wird dein Unternehmensprofil prominent auf der Startseite und in den Kategoriesuchen hervorgehoben.
                                                            </p>

                                                            {/* Progress bar */}
                                                            <div className="mt-3 space-y-1.5">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="font-bold text-charcoal/70">Qualifizierungsfortschritt:</span>
                                                                    <span className="font-mono font-black text-forest">
                                                                        {Math.round((spotlightRequirements.metCount / spotlightRequirements.totalCount) * 100)}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-2 rounded-full bg-sand overflow-hidden border border-beige/80">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-forest to-gold transition-all duration-500 rounded-full"
                                                                        style={{ width: `${(spotlightRequirements.metCount / spotlightRequirements.totalCount) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Requirements Checklist (2 in a row) */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-beige text-xs">
                                                            {spotlightRequirements.list.map(item => (
                                                                <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#faf8f3] border border-beige/60 hover:bg-sand/30 transition-colors">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        {item.met ? (
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                        ) : (
                                                                            <Circle className="w-3.5 h-3.5 text-charcoal/30 shrink-0" />
                                                                        )}
                                                                        <span className={`truncate text-[11px] sm:text-xs ${item.met ? 'text-charcoal/90 font-medium' : 'text-charcoal/50'}`} title={item.label}>
                                                                            {item.label}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase shrink-0 ${
                                                                        item.met ? 'text-emerald-700' : 'text-amber-600'
                                                                    }`}>
                                                                        {item.met ? 'Erfüllt' : 'Ausstehend'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Spotlight Actions CTA */}
                                                    <div className="pt-3">
                                                        {spotlightRequirements.allMet ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSpotlightModalOpen(true)}
                                                                className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-forest" />
                                                                <span>{hasPaidSpotlight ? 'Spotlight verwalten' : 'Spotlight buchen'}</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={!subDetails.is_business ? () => router.push('/abo/kasse') : handleEdit}
                                                                className="w-full bg-[#faf8f3] hover:bg-sand border border-beige hover:border-gold/60 text-forest font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                                            >
                                                                {!subDetails.is_business ? (
                                                                    <>
                                                                        <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
                                                                        <span>Business-Tarif für Spotlight aktivieren</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Edit3 className="w-3.5 h-3.5 text-forest" />
                                                                        <span>Profil vervollständigen</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Credits & Referral Widget Card (Below Spotlight section) */}
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4 hover:border-gold/50 transition-all flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-beige">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark shadow-xs shrink-0">
                                                                    <CoinIcon size="md" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className="font-bold text-charcoal text-sm truncate">Credits & Freunde</h3>
                                                                    <p className="text-[11px] text-charcoal/50 font-medium">Guthaben für Inserate-Highlights & Spotlight</p>
                                                                </div>
                                                            </div>

                                                            <div className="self-start sm:self-auto bg-forest/5 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-xl sm:rounded-none border border-forest/10 sm:border-0">
                                                                <span className="text-sm sm:text-base font-black font-mono text-forest">
                                                                    {Number(creditBalance).toLocaleString('de-DE')} CC
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-charcoal/60 leading-relaxed mt-3">
                                                            Lade andere Camper oder gewerbliche Partner ein und erhalte sofort Campuna Credits für jede erfolgreiche Registrierung.
                                                        </p>
                                                    </div>

                                                    <div className="pt-2 flex items-center justify-between text-xs border-t border-beige mt-2">
                                                        <span className="text-charcoal/50">Erfolgreiche Einladungen:</span>
                                                        <span className="font-black text-charcoal font-mono">{referralStats.completed || 0}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Right Column / Side Column: Membership Status & Security */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.15 }}
                                            className={`${isCommercial ? 'lg:col-span-5' : 'w-full'} flex flex-col justify-between gap-5 sm:gap-6 h-full`}
                                        >
                                            {/* Membership Plan Info Card */}
                                            {isPrivate ? (
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4 hover:border-forest/30 transition-all flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-forest flex items-center gap-1.5">
                                                                <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Tarif-Status
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-forest/10 text-forest border border-forest/20">
                                                                Kostenloses Privatkonto
                                                            </span>
                                                        </div>

                                                        <div className="mt-3">
                                                            <h4 className="text-xl font-black text-charcoal">Kostenloses Privatkonto</h4>
                                                            <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                                                                Dauerhaft kostenfreie Nutzung. Erstelle und verwalte deine Inserate ohne monatliche Fixkosten oder Abonnement.
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2.5 pt-3 border-t border-beige text-xs text-charcoal/80 mt-3">
                                                            <div className="flex items-center justify-between p-2.5 bg-[#faf8f3] rounded-xl border border-beige/60">
                                                                <div className="flex items-center gap-2">
                                                                    <Rocket className="w-4 h-4 text-forest shrink-0" />
                                                                    <span className="font-bold">Aktive Inserate:</span>
                                                                </div>
                                                                <span className="font-mono font-black text-forest">
                                                                    {userListings.filter(l => l.status === 'APPROVED').length} {userListings.filter(l => l.status === 'APPROVED').length === 1 ? 'Inserat aktiv' : 'Inserate aktiv'}
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
                                                    </div>

                                                    <div className="pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('inserate')}
                                                            className="w-full bg-forest hover:bg-[#004d0a] text-sand font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group active:scale-95"
                                                        >
                                                            <Rocket className="w-3.5 h-3.5 text-gold" />
                                                            <span>Inserate verwalten</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-sand shadow-md space-y-4 relative overflow-hidden border border-gold/20 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                                                                <CreditCard className="w-3.5 h-3.5" /> Mitgliedschaft
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-sand">
                                                                {subDetails.is_business ? 'Business Aktiv' : 'Business Free'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3">
                                                            <h4 className="text-xl font-black text-white">{subDetails.is_business ? 'Campuna Business Plan' : 'Business Free Plan'}</h4>
                                                            <p className="text-xs text-sand/80 mt-1 leading-relaxed">
                                                                {subDetails.is_business
                                                                    ? 'Professionelles Firmenprofil, Live-Analytics & Händler-Cockpit.'
                                                                    : 'Kostenloses Basiskonto für gewerbliche Anbieter auf Campuna.'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-sand/90 mt-3">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                                <span>{subDetails.is_business ? 'Maximale Inserat-Reichweite' : 'Kostenlose Inserate'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                                <span>{subDetails.is_business ? 'Berechtigt zur Spotlight-Buchung' : 'Basis-Sichtbarkeit'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                                <span>{subDetails.is_business ? 'Individuelles Cover & Logo' : 'Standard Profil'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                                                <span>{subDetails.is_business ? '1.000 Zeichen Profil & Impressum' : '500 Zeichen Kurzprofil'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3">
                                                        {subDetails.is_business ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveTab('business_cockpit')}
                                                                className="w-full bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                                                            >
                                                                <LayoutDashboard className="w-3.5 h-3.5 text-forest" />
                                                                <span>Zum Business Cockpit Dashboard</span>
                                                            </button>
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

                                            {/* Action Cards Row: Feedback & Profile Quick Actions */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full items-stretch">
                                                {/* Feedback & Wishes Quick Card */}
                                                <div className="bg-gradient-to-br from-[#faf8f3] via-white to-sand/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-gold/30 hover:border-gold transition-all w-full flex flex-col justify-between group">
                                                    <div>
                                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-forest group-hover:scale-105 transition-transform">
                                                                    <MessageSquareHeart className="w-4 h-4 text-forest" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-charcoal text-sm flex items-center gap-1.5">
                                                                        Feedback & Wünsche
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-gold/30 text-forest">Direkt</span>
                                                                    </h3>
                                                                    <p className="text-[11px] text-charcoal/50 font-medium">Direkt an die Plattformleitung</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-3">
                                                            <p className="text-xs text-charcoal/70 leading-relaxed">
                                                                Ideen für neue Funktionen, Wünsche oder Kritik? Teile uns dein Feedback mit – wir werten jeden Beitrag persönlich aus.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('feedback')}
                                                            className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-[#004d0a] text-sand text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                                                        >
                                                            <Send className="w-3.5 h-3.5 text-gold" />
                                                            <span>Feedback einreichen</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Profile & Personal Data Quick Action */}
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-beige space-y-4 hover:border-forest/30 transition-all w-full flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                                                                    <User className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-charcoal text-sm">Profil & Stammdaten</h3>
                                                                    <p className="text-[11px] text-charcoal/50 font-medium">Kontaktdaten & Darstellung anpassen</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-3">
                                                            <p className="text-xs text-charcoal/60 leading-relaxed">
                                                                Aktualisiere deine persönlichen Daten, Profilbilder, Kontaktmöglichkeiten und deinen Standort.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3">
                                                        {!isEditing ? (
                                                            <button
                                                                type="button"
                                                                onClick={handleEdit}
                                                                className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-[#004d0a] text-sand text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md group active:scale-95"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                                                                <span>Profil bearbeiten</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancel}
                                                                    className="flex-1 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 font-bold text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                                                                >
                                                                    Abbrechen
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSave}
                                                                    disabled={saving}
                                                                    className="flex-1 bg-forest hover:bg-[#004d0a] text-sand font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                                                                >
                                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" /> : <Save className="w-3.5 h-3.5 text-gold" />}
                                                                    <span>{saving ? 'Speichern...' : 'Profil aktualisieren'}</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB: NACHRICHTEN & KONTAKT-ANFRAGEN (CHAT SYSTEM)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'nachrichten' && (
                                <AccountChatTab
                                    currentUser={user}
                                    onNavigateToListings={() => setActiveTab('inserate')}
                                />
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
                                <motion.div 
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className="space-y-5 sm:space-y-6"
                                >
                                    {/* Top Tab Header */}
                                    <TabHeader
                                        title="Meine Inserate verwalten"
                                        subtitle="Übersicht, Bearbeitung und Reichweiten-Steuerung deiner Camping-Fahrzeuge & Zubehör"
                                        icon={Rocket}
                                        action={
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={handleCreateListingClick}
                                                className="flex items-center justify-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer w-full sm:w-auto"
                                            >
                                                <Plus className="w-4 h-4 text-gold" />
                                                <span>Neues Inserat erstellen</span>
                                            </motion.button>
                                        }
                                    />

                                    {/* 5 Metric Overview Cards (Responsive Bento Grid with Animated Entrances) */}
                                    <motion.div 
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.05 }
                                            }
                                        }}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5"
                                    >
                                        {/* 1. Gesamt Inserate (Forest-to-Dark Luxury Bento Hero Tile) */}
                                        <motion.button
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setListingStatusFilter('ALL')}
                                            className={`col-span-2 sm:col-span-1 relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[120px] sm:min-h-[135px] ${
                                                listingStatusFilter === 'ALL'
                                                    ? 'bg-gradient-to-br from-[#004709] via-[#002805] to-[#040805] text-sand shadow-lg ring-2 ring-gold border border-gold/40'
                                                    : 'bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-sand shadow-md border border-gold/20 hover:border-gold/50'
                                            }`}
                                        >
                                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gold/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                                            
                                            <div className="flex items-center justify-between relative z-10">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-sand/70">
                                                    Gesamt
                                                </span>
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0 group-hover:bg-gold group-hover:text-forest transition-colors shadow-xs">
                                                    <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            <div className="relative z-10 mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-gold tracking-tight">
                                                    {userListings.length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/10 text-[9px] sm:text-[10px] text-sand/70">
                                                    <span>Alle Inserate</span>
                                                    <span className="font-bold text-gold flex items-center gap-0.5">
                                                        {isCommercial ? (subDetails.is_business ? 'Business' : 'Standard') : 'Aktiv'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* 2. Veröffentlicht (Active / Approved) */}
                                        <motion.button
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setListingStatusFilter('APPROVED')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[120px] sm:min-h-[135px] ${
                                                listingStatusFilter === 'APPROVED'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-emerald-500 border border-emerald-300'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-emerald-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-emerald-700 transition-colors">
                                                    Veröffentlicht
                                                </span>
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tracking-tight">
                                                    {userListings.filter(l => l.status === 'APPROVED' || l.status === 'AKTIV').length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[9px] sm:text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                                    </span>
                                                    <span className="font-bold text-emerald-700">Öffentlich</span>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* 3. Pausiert / Deaktiviert */}
                                        <motion.button
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setListingStatusFilter('INACTIVE')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[120px] sm:min-h-[135px] ${
                                                listingStatusFilter === 'INACTIVE'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-slate-600 border border-slate-400'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-slate-700 transition-colors">
                                                    Pausiert
                                                </span>
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors shadow-xs">
                                                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-700 tracking-tight">
                                                    {userListings.filter(l => l.status === 'INACTIVE' || l.status === 'DEACTIVATED').length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[9px] sm:text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        Unsichtbar
                                                    </span>
                                                    <span className="font-bold text-slate-700">Deaktiviert</span>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* 4. In Prüfung (Review Queue) */}
                                        <motion.button
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setListingStatusFilter('REVIEW')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[120px] sm:min-h-[135px] ${
                                                listingStatusFilter === 'REVIEW'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-amber-500 border border-amber-300'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-amber-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-amber-700 transition-colors">
                                                    In Prüfung
                                                </span>
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 tracking-tight">
                                                    {userListings.filter(l => l.status === 'REVIEW').length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[9px] sm:text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3 text-amber-600" /> Moderation
                                                    </span>
                                                    <span className="font-bold text-amber-700">
                                                        {userListings.filter(l => l.status === 'REVIEW').length > 0 ? 'Wartet' : 'Keine'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* 5. Hervorgehoben (Promoted Ads) */}
                                        <motion.button
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setListingStatusFilter('BOOSTED')}
                                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[120px] sm:min-h-[135px] ${
                                                listingStatusFilter === 'BOOSTED'
                                                    ? 'bg-white text-charcoal shadow-md ring-2 ring-gold border border-gold'
                                                    : 'bg-white text-charcoal shadow-xs border border-beige hover:border-gold hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/50 group-hover:text-gold-dark transition-colors">
                                                    Hervorgehoben
                                                </span>
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark shrink-0 group-hover:bg-gold group-hover:text-forest transition-colors shadow-xs">
                                                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="text-2xl sm:text-3xl font-black font-mono text-gold-dark tracking-tight">
                                                    {userListings.filter(l => l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date())).length}
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-stone-100 text-[9px] sm:text-[10px] text-charcoal/60">
                                                    <span className="flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-gold-dark" /> Reichweite
                                                    </span>
                                                    <span className="font-bold text-gold-dark">Top-Platz</span>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </motion.div>

                                    {/* Filter & Search Toolbar */}
                                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-beige shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                                        {/* Status Pills */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
                                            {[
                                                { id: 'ALL', label: `Alle (${userListings.length})` },
                                                { id: 'APPROVED', label: `Veröffentlicht (${userListings.filter(l => l.status === 'APPROVED' || l.status === 'AKTIV').length})` },
                                                { id: 'INACTIVE', label: `Pausiert (${userListings.filter(l => l.status === 'INACTIVE' || l.status === 'DEACTIVATED').length})` },
                                                { id: 'REVIEW', label: `In Prüfung (${userListings.filter(l => l.status === 'REVIEW').length})` },
                                                { id: 'REJECTED', label: `Abgelehnt (${userListings.filter(l => l.status === 'REJECTED').length})` },
                                                { id: 'BOOSTED', label: `Hervorgehoben (${userListings.filter(l => l.is_boosted || (l.boosted_until && new Date(l.boosted_until) > new Date())).length})` },
                                            ].map(tab => (
                                                <motion.button
                                                    key={tab.id}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="button"
                                                    onClick={() => setListingStatusFilter(tab.id)}
                                                    className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${listingStatusFilter === tab.id
                                                        ? 'bg-forest text-sand shadow-sm'
                                                        : 'bg-[#faf8f3] text-charcoal/70 hover:bg-sand border border-beige'
                                                        }`}
                                                >
                                                    {tab.label}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Search Box */}
                                        <div className="relative w-full md:w-72 shrink-0">
                                            <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={listingSearch}
                                                onChange={e => setListingSearch(e.target.value)}
                                                placeholder="Suche nach Titel oder Kategorie..."
                                                className="w-full bg-[#faf8f3] border border-beige rounded-xl pl-9 pr-8 py-2 text-xs text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-forest focus:bg-white transition-all shadow-2xs"
                                            />
                                            {listingSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setListingSearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer p-0.5 rounded-full hover:bg-stone-200/50 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Listings Grid */}
                                    {listingsLoading ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-forest" />
                                            <span className="text-xs font-medium text-charcoal/60">Inserate werden geladen...</span>
                                        </div>
                                    ) : filteredListings.length === 0 ? (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-beige shadow-xs"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mx-auto mb-4">
                                                <Compass className="w-7 h-7 text-forest" />
                                            </div>
                                            <h3 className="text-base font-bold text-charcoal">Keine Inserate gefunden</h3>
                                            <p className="text-xs text-charcoal/60 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                                                {listingSearch || listingStatusFilter !== 'ALL'
                                                    ? 'Keine Inserate entsprechen deinen aktuellen Filterkriterien. Versuche die Suche zurückzusetzen oder einen anderen Status zu wählen.'
                                                    : 'Du hast bisher noch keine Inserate angelegt. Erstelle jetzt dein erstes Camping-Inserat auf Campuna.'}
                                            </p>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={handleCreateListingClick}
                                                className="inline-flex items-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4 text-gold" />
                                                <span>Jetzt Inserat aufgeben</span>
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            variants={{
                                                hidden: { opacity: 0 },
                                                show: {
                                                    opacity: 1,
                                                    transition: { staggerChildren: 0.04 }
                                                }
                                            }}
                                            initial="hidden"
                                            animate="show"
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4.5"
                                        >
                                            {filteredListings.map((item) => {
                                                const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                                                const hasImg = Array.isArray(item.images) && item.images.length > 0;
                                                const img = hasImg ? getImageUrl(item.images[0]) : null;
                                                const features = [
                                                    item.subcategory,
                                                    item.condition,
                                                    item.fuel_type || item.fuelType,
                                                    item.transmission,
                                                    item.brand
                                                ].filter(Boolean);

                                                return (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                                                        className={`listing-card group relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 select-none justify-between hover:-translate-y-1 ${
                                                            isBoosted
                                                                ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/80 shadow-[0_4px_16px_-2px_rgba(202,152,43,0.16)] hover:shadow-[0_8px_24px_-2px_rgba(202,152,43,0.25)]'
                                                                : 'bg-white border border-forest/10 hover:border-forest/25 shadow-xs hover:shadow-md'
                                                        }`}
                                                    >
                                                        <div>
                                                            {/* Compact Image */}
                                                            <div 
                                                                className="relative h-40 sm:h-36 w-full overflow-hidden bg-sand/20 cursor-pointer"
                                                                onClick={() => router.push(`/inserate/${item.slug || item.id}`)}
                                                            >
                                                                {hasImg && img ? (
                                                                    <img
                                                                        src={img}
                                                                        alt={item.title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                        loading="lazy"
                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                    />
                                                                ) : (
                                                                    <ListingImagePlaceholder category={item.category} size="sm" />
                                                                )}
                                                                {/* Top Status Badges */}
                                                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 flex-wrap z-10 pointer-events-none">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-xs ${
                                                                        (item.status === 'APPROVED' || item.status === 'AKTIV')
                                                                            ? 'bg-emerald-700 text-white'
                                                                            : (item.status === 'INACTIVE' || item.status === 'DEACTIVATED')
                                                                            ? 'bg-slate-700 text-white'
                                                                            : item.status === 'REJECTED'
                                                                            ? 'bg-rose-700 text-white'
                                                                            : 'bg-amber-600 text-white'
                                                                    }`}>
                                                                        {(item.status === 'APPROVED' || item.status === 'AKTIV')
                                                                            ? 'Veröffentlicht'
                                                                            : (item.status === 'INACTIVE' || item.status === 'DEACTIVATED')
                                                                            ? 'Pausiert'
                                                                            : (item.status === 'REJECTED' ? 'Abgelehnt' : 'In Prüfung')}
                                                                    </span>
                                                                    {item.ai_score !== null && item.ai_score !== undefined && (
                                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${
                                                                            item.ai_score > 60
                                                                                ? 'bg-emerald-950/80 text-emerald-300 backdrop-blur-xs'
                                                                                : item.ai_score < 40
                                                                                    ? 'bg-rose-950/80 text-rose-300 backdrop-blur-xs'
                                                                                    : 'bg-amber-950/80 text-amber-300 backdrop-blur-xs'
                                                                        }`}>
                                                                            Score: {item.ai_score}/100
                                                                        </span>
                                                                    )}
                                                                    {isBoosted && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest shadow-xs flex items-center gap-1 font-sans">
                                                                            <Rocket className="w-2.5 h-2.5" /> Hervorgehoben
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

                                                                {/* Rejection / Moderation Reason snippet */}
                                                                {item.status === 'REJECTED' && (
                                                                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-900 leading-snug">
                                                                        <span className="font-bold text-rose-950">Ablehnungsgrund: </span>
                                                                        {item.admin_notes || (Array.isArray(item.ai_reasons) && item.ai_reasons.length > 0 ? item.ai_reasons.join(' ') : 'Verstoß gegen Inseratsrichtlinien.')}
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

                                                        {/* Bottom Actions Row (Responsive & Touch-Friendly) */}
                                                        <div className="p-3 pt-0 mt-1 border-t border-beige/60 pt-2.5 flex items-center justify-between gap-1.5">
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                type="button"
                                                                onClick={() => handleEditListing(item.id)}
                                                                className="flex-1 flex items-center justify-center gap-1 bg-[#faf8f3] hover:bg-forest hover:text-white border border-beige py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                                                title="Inserat bearbeiten"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                                <span>Bearbeiten</span>
                                                            </motion.button>

                                                            {/* Pause / Activate Action Button */}
                                                            {(item.status === 'APPROVED' || item.status === 'AKTIV' || item.status === 'INACTIVE' || item.status === 'DEACTIVATED') && (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.92 }}
                                                                    type="button"
                                                                    onClick={() => handleToggleListingStatus(item)}
                                                                    disabled={togglingListingId === item.id}
                                                                    className={`p-2 border rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs ${
                                                                        (item.status === 'APPROVED' || item.status === 'AKTIV')
                                                                            ? 'bg-[#faf8f3] hover:bg-amber-50 border-beige hover:border-amber-300 text-charcoal/70 hover:text-amber-800'
                                                                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                                                                    }`}
                                                                    title={(item.status === 'APPROVED' || item.status === 'AKTIV') ? "Inserat pausieren (deaktivieren)" : "Inserat wieder aktivieren"}
                                                                >
                                                                    {(item.status === 'APPROVED' || item.status === 'AKTIV') ? (
                                                                        <Pause className="w-3.5 h-3.5 text-amber-700" />
                                                                    ) : (
                                                                        <Play className="w-3.5 h-3.5 text-emerald-700" />
                                                                    )}
                                                                </motion.button>
                                                            )}

                                                            {item.status === 'APPROVED' ? (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.95 }}
                                                                    type="button"
                                                                    onClick={() => handleOpenBoostModal(item)}
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-gold via-[#ffd269] to-gold hover:brightness-105 text-forest font-bold py-2 px-2 rounded-xl text-[11px] transition-all cursor-pointer shadow-2xs"
                                                                    title="Mit Campuna Credits hervorheben"
                                                                >
                                                                    <Rocket className="w-3 h-3 text-forest" />
                                                                    <span>Hervorheben</span>
                                                                </motion.button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-stone-100 border border-stone-200 text-stone-400 font-bold py-2 px-2 rounded-xl text-[11px] cursor-not-allowed opacity-60"
                                                                    title="Hervorheben ist nur für freigegebene Inserate verfügbar"
                                                                >
                                                                    <Rocket className="w-3 h-3 text-stone-400" />
                                                                    <span>Hervorheben</span>
                                                                </button>
                                                            )}

                                                            <Link
                                                                href={`/inserate/${item.slug || item.id}`}
                                                                className="p-2 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/60 hover:text-forest rounded-xl transition-all shrink-0"
                                                                title="Inserat ansehen"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Link>

                                                            <motion.button
                                                                whileTap={{ scale: 0.92 }}
                                                                type="button"
                                                                onClick={() => setDeleteConfirmListing(item)}
                                                                className="p-2 bg-[#faf8f3] hover:bg-rose-50 border border-beige hover:border-rose-200 text-charcoal/60 hover:text-rose-600 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs"
                                                                title="Inserat löschen"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </motion.button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 3: ABONNEMENT & RECHNUNGEN
                               ═════════════════════════════════════════════════════════════ */}
                            {/* ═════════════════════════════════════════════════════════════
                                TAB 3: ABONNEMENT (SUBSCRIPTIONS & PLANS)
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'finanzen' && (
                                <AccountSubscriptionTab
                                    subDetails={subDetails}
                                    userListings={userListings}
                                    onOpenCancelModal={() => setCancelSubModalOpen(true)}
                                    onUpgradeClick={() => router.push('/abo/kasse')}
                                    TabHeader={TabHeader}
                                />
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 4: CAMPUNA CREDITS & EMPFEHLUNGEN
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'credits' && (
                                <AccountCreditsTab
                                    creditBalance={creditBalance}
                                    referralStats={referralStats}
                                    referralsList={referralsList}
                                    creditTransactions={creditTransactions}
                                    isCommercial={isCommercial}
                                    user={user}
                                    onOpenBuyCreditModal={handleOpenBuyCreditModal}
                                    TabHeader={TabHeader}
                                    ReferralQuickBadge={ReferralQuickBadge}
                                />
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 5: PIONEER STATUS
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'pioneer' && (
                                <AccountPioneerTab
                                    pioneerBadge={pioneerBadge}
                                    isCommercial={isCommercial}
                                    commercialPioneerCriteria={commercialPioneerCriteria}
                                    isProfileComplete={isProfileComplete}
                                    approvedListingsCount={approvedListingsCount}
                                    user={user}
                                    onNavigateToEditProfile={() => {
                                        setIsEditing(true);
                                        setActiveTab('dashboard');
                                    }}
                                    onCreateListing={handleCreateListingClick}
                                    TabHeader={TabHeader}
                                />
                            )}

                            {/* ═════════════════════════════════════════════════════════════
                                TAB 6: FEEDBACK & DIREKTER ADMIN-KONTAKT
                               ═════════════════════════════════════════════════════════════ */}
                            {activeTab === 'feedback' && (
                                <AccountFeedbackTab
                                    user={user}
                                    isCommercial={isCommercial}
                                    TabHeader={TabHeader}
                                />
                            )}

                        </main>
                    </div>

                </div>

            </div>

            {/* ═════════════════════════════════════════════════════════════════════════
                ALL MODALS PRESERVED & ENHANCED WITH UNIFIED THEME
               ═════════════════════════════════════════════════════════════════════════ */}

            {/* 1.1 Campuna Spotlight Booking Modal */}
            <AnimatePresence>
                {spotlightModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
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

                                {!subDetails?.is_business ? (
                                    <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <span className="font-bold block">Campuna Business Plan erforderlich</span>
                                            <span className="text-[11px] text-amber-800">Spotlight-Buchungen stehen exklusiv aktiven Campuna Business Partnern zur Verfügung.</span>
                                        </div>
                                        <Link
                                            href="/abo/kasse"
                                            onClick={() => setSpotlightModalOpen(false)}
                                            className="inline-flex items-center gap-1 font-bold text-xs bg-forest hover:bg-[#004d0a] text-sand px-3 py-1.5 rounded-xl cursor-pointer shrink-0 transition-colors shadow-xs"
                                        >
                                            Auf Business upgraden &rarr;
                                        </Link>
                                    </div>
                                ) : !spotlightRequirements.allMet ? (
                                    <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                                        <span>Vervollständige dein Firmenprofil, um Spotlight freizuschalten.</span>
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
                                ) : null}
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
                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans">Zahlungsmethode:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSpotlightPaymentMethod('CREDIT')}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                            spotlightPaymentMethod === 'CREDIT'
                                                ? 'border-forest bg-forest text-sand shadow-sm ring-2 ring-forest/20 font-bold'
                                                : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand/40'
                                        }`}
                                    >
                                        <CoinIcon size="xs" />
                                        <span className="text-xs font-sans">Campuna Credits</span>
                                        <span className={`text-[10px] font-sans ${spotlightPaymentMethod === 'CREDIT' ? 'text-sand/80' : 'text-charcoal/50'}`}>
                                            ({Number(creditBalance).toLocaleString('de-DE')} CC verfügbar)
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSpotlightPaymentMethod('STRIPE')}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                            spotlightPaymentMethod === 'STRIPE'
                                                ? 'border-[#635BFF] bg-[#635BFF] text-white shadow-sm ring-2 ring-[#635BFF]/20 font-bold'
                                                : 'border-beige bg-[#faf8f3] text-charcoal hover:bg-sand/40'
                                        }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-xs font-sans">Stripe Checkout</span>
                                        <span className={`text-[10px] font-sans ${spotlightPaymentMethod === 'STRIPE' ? 'text-white/80' : 'text-charcoal/50'}`}>
                                            Karte / SEPA / Apple Pay
                                        </span>
                                    </button>
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
                                    className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        spotlightPaymentMethod === 'STRIPE'
                                            ? 'bg-[#635BFF] hover:bg-[#534be8] text-white'
                                            : 'bg-forest hover:bg-[#004d0a] text-sand'
                                    }`}
                                >
                                    {bookingSpotlight ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Sparkles className="w-4 h-4 text-gold" />}
                                    <span>
                                        {bookingSpotlight
                                            ? 'Wird weitergeleitet...'
                                            : !subDetails?.is_business
                                            ? 'Campuna Business erforderlich'
                                            : !spotlightRequirements.allMet
                                            ? 'Profil unvollständig'
                                            : spotlightPaymentMethod === 'CREDIT'
                                            ? `Mit ${(spotlightDuration === 7 ? 1500 : spotlightDuration === 14 ? 2500 : 4000).toLocaleString('de-DE')} CC aktivieren`
                                            : `Sicher mit Stripe bezahlen (${spotlightDuration === 7 ? '14,99 €' : spotlightDuration === 14 ? '24,99 €' : '39,99 €'})`}
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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
                                        { credits: 2500, priceEur: '24,99 €', sub: '2.500 CC' },
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

                            {/* Stripe Secure Payment Banner */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#635BFF]/10 via-[#faf8f3] to-white border border-[#635BFF]/25 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#635BFF] text-white">
                                            Stripe Checkout
                                        </span>
                                        <span className="text-xs font-bold text-charcoal font-sans">Sichere 256-Bit SSL Zahlung</span>
                                    </div>
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <p className="text-[11px] text-charcoal/70 leading-relaxed font-sans">
                                    Zahle bequem per <strong>Kreditkarte (Visa, Mastercard, Amex)</strong>, <strong>SEPA-Lastschrift</strong>, <strong>Apple Pay</strong> oder <strong>Google Pay</strong> über Stripe.
                                </p>
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
                                    className="flex-1 bg-[#635BFF] hover:bg-[#534be8] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {buyingCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                    <span>{buyingCredits ? 'Weiterleitung zu Stripe...' : `Sicher mit Stripe bezahlen (${selectedCreditPkg === 500 ? '4,99 €' : selectedCreditPkg === 800 ? '7,99 €' : selectedCreditPkg === 1300 ? '12,99 €' : '24,99 €'})`}</span>
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige p-6 sm:p-7 space-y-5 text-left max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold/30 text-forest flex items-center justify-center shrink-0 border border-gold/40">
                                    <Sparkles className="w-6 h-6 text-gold-dark" />
                                </div>
                                <div>
                                    <h3 className="font-display font-black text-forest text-lg sm:text-xl">
                                        {!isCommercial
                                            ? 'Privates Inserate-Limit erreicht'
                                            : (!subDetails.is_business
                                                ? 'Kostenloses Limit erreicht (3 Inserate)'
                                                : 'Kontingent erreicht (25 Inserate)')}
                                    </h3>
                                    <p className="text-xs text-charcoal/60 font-medium">
                                        {!isCommercial
                                            ? 'Maximal 10 aktive Inserate im privaten Mitgliederkonto'
                                            : (!subDetails.is_business
                                                ? 'Firmen-Basistarif (Free)'
                                                : 'Business-Tarif (25 Inserate)')}
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-sans">
                                {!isCommercial ? (
                                    <span>
                                        Als privates Mitglied kannst du bis zu <strong>10 Inserate gleichzeitig</strong> kostenlos schalten.
                                        Um mehr Inserate zu veröffentlichen oder gewerblich aufzutreten, wechsle jetzt direkt zum <strong>Campuna Business Plan</strong> – dein Konto wird automatisch umgestellt und du erhältst sofortigen Zugriff auf alle professionellen Händler-Funktionen!
                                    </span>
                                ) : !subDetails.is_business ? (
                                    <span>
                                        Im kostenlosen Firmentarif sind <strong>3 aktive Inserate</strong> inklusive.
                                        Erweitere deine Reichweite mit dem <strong>Campuna Business Plan</strong> für bis zu 25 Inserate und maximale Sichtbarkeit.
                                    </span>
                                ) : (
                                    <span>
                                        Du hast dein volles Kontingent von <strong>25 aktiven Inseraten</strong> ausgeschöpft. Zusätzliche Inserate sind flexibel auf Anfrage verfügbar.
                                    </span>
                                )}
                            </p>

                            {/* Business Features Highlight Box */}
                            {(!isCommercial || !subDetails.is_business) && (
                                <div className="bg-[#fcfaf7] border border-gold/30 rounded-2xl p-4 sm:p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-forest">
                                            Campuna Business Vorteile:
                                        </span>
                                        <span className="text-xs font-black text-forest bg-gold/20 px-2.5 py-0.5 rounded-full border border-gold/40">
                                            29 € / Monat
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal/80">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>Bis zu 25 Inserate</strong> (erweiterbar)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>Schaufenster-Cover</strong> & Logo</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>Direktlinks</strong> (Website, Tel, Socials)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>Anbieter-Verzeichnis</strong> Eintrag</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>Live-Analytics</strong> & Klick-Statistiken</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                                            <span><strong>1.000 CC Bonus</strong> (10 € Guthaben)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                                {(!isCommercial || !subDetails.is_business) ? (
                                    <button
                                        type="button"
                                        onClick={() => { setLimitModalOpen(false); router.push('/abo/kasse'); }}
                                        className="flex-1 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-gold/25 cursor-pointer hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4 text-forest" />
                                        <span>Jetzt auf Business upgraden (29 €/Mt.)</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setLimitModalOpen(false); setActiveTab('inserate'); }}
                                        className="flex-1 bg-forest hover:bg-[#004d0a] text-sand py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        <Rocket className="w-4 h-4 text-gold" />
                                        <span>Inserate verwalten</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setLimitModalOpen(false)}
                                    className="px-5 py-3 bg-[#faf8f3] hover:bg-beige/40 text-charcoal rounded-2xl text-xs font-bold uppercase cursor-pointer border border-beige transition-colors text-center"
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
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
                                            Glückwunsch! Du gehörst zu den ersten 300 aktiven Mitgliedern auf Campuna. Dein Profil und all deine Inserate tragen dauerhaft den goldenen Pioneer-Badge als besondere Anerkennung für dein frühes Engagement auf Campuna.
                                        </p>
                                    </div>

                                    <div className="bg-[#faf8f3] rounded-2xl border border-beige p-4 text-left space-y-2.5 text-xs text-charcoal/80">
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Goldener Ehrenbadge auf Profil & Inseraten aktiv</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Besondere Anerkennung als einer der ersten aktiven Campuna-Pioniere</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-forest">
                                            <CheckCircle2 className="w-4 h-4 text-gold-dark shrink-0" />
                                            <span>Dauerhafter Pioneer-Status gesichert</span>
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
                                            Werde einer der ersten 300 Campuna Pioniere und sichere dir deinen dauerhaften Pioneer-Status als Anerkennung für dein frühes Engagement auf Campuna.
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
                                            <span className="font-bold text-[11px] text-charcoal block leading-tight">Frühes Engagement</span>
                                            <span className="text-[9px] text-charcoal/50 block">Aktiver Pionier</span>
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
                                                {isCommercial && commercialPioneerCriteria ? (
                                                    `${commercialPioneerCriteria.metCount} / ${commercialPioneerCriteria.totalCount} Kriterien`
                                                ) : (
                                                    `${(isProfileComplete ? 1 : 0) + (approvedListingsCount >= 3 ? 1 : 0)} / 2 Kriterien`
                                                )}
                                            </span>
                                        </div>

                                        {isCommercial && commercialPioneerCriteria ? (
                                            commercialPioneerCriteria.list.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between py-1 border-b border-beige/30 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${item.met ? 'bg-forest' : 'bg-stone-300'}`}>
                                                            <Check className="w-2.5 h-2.5" />
                                                        </div>
                                                        <span className="text-[11px] font-medium text-charcoal">{item.label}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase ${item.met ? 'text-emerald-600' : 'text-charcoal/40'}`}>
                                                        {item.met ? (item.id === 'listings' ? `${approvedListingsCount} / 3` : 'Erledigt') : (item.id === 'listings' ? `${approvedListingsCount} / 3` : 'Ausstehend')}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2 pt-1">
                                        {!(isCommercial ? commercialPioneerCriteria?.isProfileOnlyComplete : isProfileComplete) ? (
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
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
                                        Einsatzbereit für Inserat-Highlights & Top-Platzierungen
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
                                    <span>{celebrationReward.type === 'LISTING_APPROVED' ? 'Inserate anzeigen' : 'Credits ansehen & Inserat hervorheben'}</span>
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
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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

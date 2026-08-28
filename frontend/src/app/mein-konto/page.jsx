'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    getMyProfile, 
    updateMyProfile,
    getMySubscription,
    upgradeSubscription,
    cancelSubscription,
    getCreditBalance,
    earnSimulatedCredits,
    getReferralStats,
    getReferralsList
} from '@/api/profile';
import { logoutUser } from '@/api/auth';
import { uploadImage } from '@/api/upload';
import { toast } from 'react-hot-toast';
import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2, Plus, Award, AlertTriangle
} from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 'lg', onUploadClick }) => {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';
    const sizeClasses = size === 'lg'
        ? 'w-28 h-28 text-3xl'
        : 'w-16 h-16 text-xl';

    return (
        <div className={`relative ${sizeClasses} flex-shrink-0`}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={`${sizeClasses} rounded-full object-cover border-4 border-white shadow-lg`}
                />
            ) : (
                <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-forest to-forest/60 border-4 border-white shadow-lg flex items-center justify-center`}>
                    <span className="text-sand font-bold font-sans">{initials}</span>
                </div>
            )}
            {onUploadClick && (
                <button
                    onClick={onUploadClick}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-full border-2 border-white flex items-center justify-center hover:bg-gold-dark transition-colors shadow-md"
                    title="Foto ändern"
                >
                    <Camera className="w-4 h-4 text-white" />
                </button>
            )}
        </div>
    );
};

const Field = ({ label, value, editValue, isEditing, onChange, type = 'text', placeholder, icon: Icon, multiline = false }) => {
    if (isEditing) {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider flex items-center gap-1.5">
                    {Icon && <Icon className="w-3.5 h-3.5" />} {label}
                </label>
                {multiline ? (
                    <textarea
                        value={editValue ?? ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className="w-full bg-sand border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 resize-none font-sans transition-all"
                    />
                ) : (
                    <input
                        type={type}
                        value={editValue ?? ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-sand border border-beige rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans transition-all"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-charcoal/40 uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5" />} {label}
            </span>
            <span className={`text-sm font-sans ${value ? 'text-charcoal' : 'text-charcoal/30 italic'}`}>
                {value || `Kein ${label} angegeben`}
            </span>
        </div>
    );
};

const ReferralBadge = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-2 bg-forest/5 hover:bg-forest/10 border border-forest/20 rounded-3xl px-2 py-2 transition-all group"
        >
            <span className="text-[11px] text-charcoal/50 font-semibold uppercase tracking-wider">Referral</span>
            <span className="font-mono text-[11px] font-bold text-forest">{code}</span>
            <span className="ml-auto text-forest/40 group-hover:text-forest transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-3 h-3" />}
            </span>
        </button>
    );
};

// ─── Private Profile View ─────────────────────────────────────────────────────

const PrivateProfilePanel = ({ profile, user, isEditing, draft, setDraft }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Vorname" value={profile.first_name} editValue={draft.first_name}
            isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, first_name: v }))}
            placeholder="Vorname" icon={User} />
        <Field label="Nachname" value={profile.last_name} editValue={draft.last_name}
            isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, last_name: v }))}
            placeholder="Nachname" icon={User} />
        <div className="sm:col-span-2">
            <Field label="Über mich" value={profile.bio} editValue={draft.bio}
                isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, bio: v }))}
                placeholder="Erzähl etwas über dich..." icon={FileText} multiline />
        </div>
        <Field label="Standort" value={profile.location} editValue={draft.location}
            isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, location: v }))}
            placeholder="z.B. München, Bayern" icon={MapPin} />
    </div>
);

// ─── Company Profile View ─────────────────────────────────────────────────────

const CompanyProfilePanel = ({ profile, user, isEditing, draft, setDraft }) => (
    <div className="space-y-8">
        {/* Nutzer-Info (Ansprechpartner) */}
        <div>
            <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-widest mb-4 pb-2 border-b border-beige">
                Nutzer-Informationen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Vorname" value={profile.first_name} editValue={draft.first_name}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, first_name: v }))}
                    placeholder="Vorname des Ansprechpartners" icon={User} />
                <Field label="Nachname" value={profile.last_name} editValue={draft.last_name}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, last_name: v }))}
                    placeholder="Nachname des Ansprechpartners" icon={User} />
                <Field label="Account E-Mail" value={user.email} isEditing={false} icon={Mail} />
                <Field label="Telefon" value={profile.phone} editValue={draft.phone}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, phone: v }))}
                    placeholder="+49 30 ..." icon={Phone} type="tel" />

            </div>
        </div>

        {/* Online Presence */}
        <div>
            <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-widest mb-4 pb-2 border-b border-beige">
                Online-Präsenz
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Website" value={profile.website_url} editValue={draft.website_url}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, website_url: v }))}
                    placeholder="https://firma.de" icon={Globe} type="url" />
                <Field label="Instagram" value={profile.instagram_url} editValue={draft.instagram_url}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, instagram_url: v }))}
                    placeholder="https://instagram.com/..." icon={AtSign} type="url" />
                <Field label="Facebook" value={profile.facebook_url} editValue={draft.facebook_url}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, facebook_url: v }))}
                    placeholder="https://facebook.com/..." icon={Share2} type="url" />
            </div>
        </div>

        {/* Legal */}
        <div>
            <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-widest mb-4 pb-2 border-b border-beige">
                Rechtliches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="USt-IdNr." value={profile.vat_id} editValue={draft.vat_id}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, vat_id: v }))}
                    placeholder="DE123456789" icon={Shield} />
                <Field label="Datenschutz-URL" value={profile.privacy_policy_url} editValue={draft.privacy_policy_url}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, privacy_policy_url: v }))}
                    placeholder="https://firma.de/datenschutz" icon={Globe} type="url" />
                <div className="sm:col-span-2">
                    <Field label="Impressum" value={profile.impressum} editValue={draft.impressum}
                        isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, impressum: v }))}
                        placeholder="Angaben gemäß § 5 TMG..." icon={FileText} multiline />
                </div>
            </div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MeinKontoPage() {
    const router = useRouter();
    const { isLoggedIn, user, accessToken, logout } = useAuthStore();

    const [profile, setProfile] = useState(null);
    const [profileType, setProfileType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState({});
    const [mounted, setMounted] = useState(false);
    const [badgeModalOpen, setBadgeModalOpen] = useState(false);
    
    // Strategic updates states
    const [subDetails, setSubDetails] = useState({ tier: 'FREE', is_strategic_partner: false });
    const [creditBalance, setCreditBalance] = useState(0);
    const [referralsList, setReferralsList] = useState([]);
    const [referralStats, setReferralStats] = useState({ total: 0, pending: 0, completed: 0 });
    const [upgrading, setUpgrading] = useState(false);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Handles avatar / company logo uploads
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Bild wird hochgeladen...');
        try {
            const res = await uploadImage(file);
            if (res.success) {
                const url = res.data.url;
                if (profileType === 'PRIVATE') {
                    setDraft(prev => ({ ...prev, profile_image_url: url }));
                } else {
                    setDraft(prev => ({ ...prev, logo_url: url }));
                }
                toast.success('Bild erfolgreich hochgeladen!', { id: toastId });
            } else {
                toast.error(res.error || 'Upload fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Netzwerkfehler beim Upload.', { id: toastId });
        }
    };

    // Handles cover banner uploads
    const handleCoverUpload = async (e) => {
        if (profileType === 'COMMERCIAL' && subDetails.tier === 'FREE') {
            toast.error('Das Hintergrundbild ist ein exklusives Business-Feature! Bitte aktualisiere dein Konto.');
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Hintergrundbild wird hochgeladen...');
        try {
            const res = await uploadImage(file);
            if (res.success) {
                setDraft(prev => ({ ...prev, cover_image_url: res.data.url }));
                toast.success('Hintergrundbild erfolgreich hochgeladen!', { id: toastId });
            } else {
                toast.error(res.error || 'Upload fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Netzwerkfehler beim Upload.', { id: toastId });
        }
    };

    // Set mounted to true on client mount to verify hydration has occurred
    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect if not logged in (runs only after mounting to avoid hydration race conditions)
    useEffect(() => {
        if (mounted && (!isLoggedIn || !accessToken)) {
            const timer = setTimeout(() => {
                router.replace('/login');
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [mounted, isLoggedIn, accessToken, router]);

    // Fetch profile and billing/referral details
    useEffect(() => {
        if (!mounted || !isLoggedIn) return;
        setLoading(true);
        
        const loadAllData = async () => {
            try {
                const profileRes = await getMyProfile();
                if (profileRes.success) {
                    setProfile(profileRes.data.profile);
                    setProfileType(profileRes.data.profile_type);
                    setDraft(profileRes.data.profile);

                    if (profileRes.data.profile_type === 'COMMERCIAL') {
                        const subRes = await getMySubscription().catch(() => null);
                        if (subRes && subRes.success) {
                            setSubDetails({
                                tier: subRes.data.tier,
                                is_strategic_partner: subRes.data.is_strategic_partner,
                            });
                        }
                    }
                } else {
                    toast.error(profileRes.error || 'Profil konnte nicht geladen werden.');
                }

                // Load credits balance
                const creditRes = await getCreditBalance().catch(() => null);
                if (creditRes && creditRes.success) {
                    setCreditBalance(creditRes.data.balance);
                }

                // Load referrals list and stats
                const refStatsRes = await getReferralStats().catch(() => null);
                if (refStatsRes && refStatsRes.success) {
                    setReferralStats(refStatsRes.data.stats);
                }
                const refListRes = await getReferralsList().catch(() => null);
                if (refListRes && refListRes.success) {
                    setReferralsList(refListRes.data.referrals);
                }
            } catch (err) {
                console.error("Error loading account details:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [mounted, isLoggedIn]);

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
        const res = await updateMyProfile(draft);
        setSaving(false);
        if (res.success) {
            setProfile(res.data.profile);
            setIsEditing(false);
            toast.success('Profil erfolgreich gespeichert!');
        } else {
            toast.error(res.error || 'Speichern fehlgeschlagen.');
        }
    };

    const handleUpgrade = async () => {
        setUpgrading(true);
        const toastId = toast.loading('Upgrade wird durchgeführt...');
        try {
            const res = await upgradeSubscription();
            if (res.success) {
                toast.success('Upgrade erfolgreich! Du bist jetzt ein Business-Mitglied.', { id: toastId });
                // Reload sub
                const subRes = await getMySubscription();
                if (subRes.success) {
                    setSubDetails({
                        tier: subRes.data.tier,
                        is_strategic_partner: subRes.data.is_strategic_partner,
                    });
                }
                const creditRes = await getCreditBalance();
                if (creditRes.success) {
                    setCreditBalance(creditRes.data.balance);
                }
            } else {
                toast.error(res.error || 'Upgrade fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Fehler beim Upgrade.', { id: toastId });
        } finally {
            setUpgrading(false);
        }
    };

    const handleEarnTestCredits = async () => {
        const toastId = toast.loading('Simuliertes Guthaben wird geladen...');
        try {
            const res = await earnSimulatedCredits();
            if (res.success) {
                toast.success('29,00 € Test-Guthaben gutgeschrieben!', { id: toastId });
                const creditRes = await getCreditBalance();
                if (creditRes.success) {
                    setCreditBalance(creditRes.data.balance);
                }
            } else {
                toast.error(res.error || 'Fehler beim Laden.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Netzwerkfehler.', { id: toastId });
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error("Backend logout error:", err);
        }
        logout();
        router.push('/');
        toast.success('Erfolgreich abgemeldet.');
    };

    const displayName = profileType === 'PRIVATE'
        ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.email
        : profile?.company_name || user?.email;

    const avatarSrc = profileType === 'PRIVATE'
        ? (isEditing ? draft?.profile_image_url : profile?.profile_image_url)
        : (isEditing ? draft?.logo_url : profile?.logo_url);

    // ── Loading state ──
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest to-forest/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-sand animate-spin" />
                    </div>
                    <p className="text-charcoal/50 font-sans text-sm">Profil wird geladen…</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-sand pt-24 pb-12 border-b">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* Hidden File Inputs for Uploads */}
                <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                />
                <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                />
                {/* 1. Header Card (Banner + Intro Details) */}
                <div className="bg-white rounded-3xl shadow-sm border border-beige/60 overflow-hidden relative">
                    {/* Cover Banner */}
                    <div className="relative h-48 md:h-56 overflow-hidden group">
                        {(isEditing ? draft?.cover_image_url : profile?.cover_image_url) ? (
                            <img
                                src={isEditing ? draft?.cover_image_url : profile?.cover_image_url}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-forest via-forest/80 to-gold/60" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                        {isEditing && (
                            profileType === 'COMMERCIAL' && subDetails.tier === 'FREE' ? (
                                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-1.5 text-white font-sans text-center px-4 z-20">
                                    <Shield className="w-5 h-5 text-gold" />
                                    <span className="font-bold text-xs uppercase tracking-wider">Hintergrundbild ist ein Business-Feature</span>
                                    <button
                                        type="button"
                                        onClick={handleUpgrade}
                                        disabled={upgrading}
                                        className="bg-gold hover:bg-gold-light text-charcoal px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer mt-1 shadow-md"
                                    >
                                        {upgrading ? 'Upgrading...' : 'Upgrade auf Business'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => coverInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 hover:bg-black/55 transition-colors flex flex-col items-center justify-center gap-1 text-white font-sans font-semibold text-xs cursor-pointer z-20"
                                >
                                    <Camera className="w-5 h-5 animate-pulse" />
                                    <span>Cover ändern</span>
                                </button>
                            )
                        )}

                        {/* Account type & plan badges */}
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow
                                        ${profileType === 'COMMERCIAL'
                                    ? 'bg-gold text-charcoal'
                                    : 'bg-white/20 backdrop-blur-sm text-forest border border-white/30'}`}>
                                {profileType === 'COMMERCIAL'
                                    ? <><Building2 className="w-3.5 h-3.5" /> Gewerblich</>
                                    : <><User className="w-3.5 h-3.5" /> Privat</>}
                            </span>
                            {profileType === 'COMMERCIAL' && (
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow
                                            ${subDetails.tier === 'BUSINESS'
                                        ? 'bg-forest text-sand border border-forest-light'
                                        : 'bg-sand text-charcoal/60 border border-beige'}`}>
                                    {subDetails.tier === 'BUSINESS' ? '★ Business' : 'Free Plan'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Overlapping Avatar & Header details */}
                    <div className="px-6 pb-4 relative z-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-16 mb-2">
                            <Avatar
                                src={avatarSrc}
                                name={displayName}
                                size="lg"
                                onUploadClick={isEditing ? () => avatarInputRef.current?.click() : undefined}
                            />

                            {/* Action buttons (Top right position like LinkedIn edit button) */}
                            <div className="flex items-center gap-2 self- md:self-auto">
                                {!isEditing ? (
                                    <button
                                        id="btn-edit-profile"
                                        onClick={handleEdit}
                                        className="flex items-center gap-2 border border-forest text-forest hover:bg-forest/5 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Profil bearbeiten
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 bg-beige text-charcoal hover:bg-beige/80 px-5 py-2 rounded-full text-sm font-semibold transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                            Abbrechen
                                        </button>
                                        <button
                                            id="btn-save-profile"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-forest text-sand hover:bg-forest/90 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm disabled:opacity-60"
                                        >
                                            {saving
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Save className="w-4 h-4" />}
                                            {saving ? 'Speichern…' : 'Speichern'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Title, Subtitle, Info block */}
                        {isEditing ? (
                            <div className="space-y-4 max-w-xl mt-4">
                                {profileType === 'PRIVATE' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans">Vorname</label>
                                            <input
                                                type="text"
                                                value={draft.first_name ?? ''}
                                                onChange={e => setDraft(prev => ({ ...prev, first_name: e.target.value }))}
                                                placeholder="Vorname"
                                                className="w-full bg-sand border border-beige rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans">Nachname</label>
                                            <input
                                                type="text"
                                                value={draft.last_name ?? ''}
                                                onChange={e => setDraft(prev => ({ ...prev, last_name: e.target.value }))}
                                                placeholder="Nachname"
                                                className="w-full bg-sand border border-beige rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans">Firmenname</label>
                                        <input
                                            type="text"
                                            value={draft.company_name ?? ''}
                                            onChange={e => setDraft(prev => ({ ...prev, company_name: e.target.value }))}
                                            placeholder="Firmenname"
                                            className="w-full bg-sand border border-beige rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans">Über mich / Info</label>
                                        <span className="text-[10px] text-charcoal/50 font-sans">
                                            {(draft.bio ?? '').length} / {profileType === 'COMMERCIAL' && subDetails.tier === 'FREE' ? 150 : 1000}
                                        </span>
                                    </div>
                                    <textarea
                                        value={draft.bio ?? ''}
                                        onChange={e => setDraft(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder={profileType === 'COMMERCIAL' && subDetails.tier === 'FREE' ? 'Kurzbeschreibung (max. 150 Zeichen)...' : 'Erzähl etwas über dich...'}
                                        maxLength={profileType === 'COMMERCIAL' && subDetails.tier === 'FREE' ? 150 : 1000}
                                        rows={3}
                                        className="w-full bg-sand border border-beige rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans resize-none"
                                    />
                                    {profileType === 'COMMERCIAL' && subDetails.tier === 'FREE' && (draft.bio ?? '').length >= 150 && (
                                        <p className="text-[10px] text-red-500 font-sans mt-0.5">
                                            Konto-Limit erreicht! Für längere Beschreibungen aktualisiere dein Konto auf Business.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-charcoal/40 uppercase tracking-wider font-sans">Standort</label>
                                    <input
                                        type="text"
                                        value={draft.location ?? ''}
                                        onChange={e => setDraft(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="z.B. München, Bayern"
                                        className="w-full bg-sand border border-beige rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                    />
                                </div>
                            </div>
                        ) : (

                            <div className="space-y-2 mt-2">
                                {/* Name row */}
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold text-charcoal font-sans">
                                        {displayName || 'Kein Name'}
                                    </h1>
                                    <button
                                        type="button"
                                        onClick={() => setBadgeModalOpen(true)}
                                        className="inline-flex items-center gap-1 bg-gold/15 hover:bg-gold/25 text-gold-dark border border-gold/30 rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans transition-colors cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Get a Badge
                                    </button>
                                </div>

                                {/* Bio below the name */}
                                {profile?.bio && (
                                    <p className="text-md text-charcoal/70 font-sans max-w-2xl leading-relaxed whitespace-pre-line">
                                        {profile.bio}
                                    </p>
                                )}
                                <div className="flex justify-between items-center">

                                    {/* Location and Email row below bio */}
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-sm text-charcoal/50 font-sans">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-4 h-4 text-gold-dark" />
                                            {profileType === 'COMMERCIAL' ? (profile.company_email || 'Keine Firmen-E-Mail') : user?.email}
                                        </span>
                                        {profile?.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-gold-dark" />
                                                {profile.location}
                                            </span>
                                        )}
                                        {profileType === 'COMMERCIAL' && (
                                            <div className="flex items-center gap-3 ml-2 border-l border-beige pl-3">
                                                {profile.website_url && (
                                                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-forest transition-colors" title="Website">
                                                        <Globe className="w-4 h-4 text-gold-dark hover:text-forest" />
                                                    </a>
                                                )}
                                                {profile.instagram_url && (
                                                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-forest transition-colors" title="Instagram">
                                                        <AtSign className="w-4 h-4 text-gold-dark hover:text-forest" />
                                                    </a>
                                                )}
                                                {profile.facebook_url && (
                                                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-forest transition-colors" title="Facebook">
                                                        <Share2 className="w-4 h-4 text-gold-dark hover:text-forest" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        id="btn-logout"
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50/50 hover:border-red-300 px-4 py-2 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Abmelden</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Two-Column Layout (LinkedIn Style) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">

                    {/* ── LEFT COLUMN: Profile Info Cards (8/12) ── */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 3. Detailed Fields Section (Only for COMMERCIAL accounts) */}
                        {profileType === 'COMMERCIAL' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-beige/60 px-6 py-6">
                                <h2 className="text-lg font-bold text-charcoal font-sans mb-6">
                                    Firmen-Details
                                </h2>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isEditing ? 'editing' : 'viewing'}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <CompanyProfilePanel
                                            profile={profile}
                                            user={user}
                                            isEditing={isEditing}
                                            draft={draft}
                                            setDraft={setDraft}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}

                        {/* 4. Listings Card (Meine Inserate) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-beige/60 px-6 py-6">

                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-charcoal font-sans ">
                                    Meine Inserate
                                </h2>
                                <button
                                    id="btn-create-listing"
                                    onClick={() => router.push('/create-listing')}
                                    className="flex items-center px-2 justify-center gap-2 bg-forest text-sand hover:bg-forest/90  py-2 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow-sm group"
                                >
                                    <Edit3 className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                                    <span>Inserat erstellen</span>
                                </button>
                            </div>

                            {/* Empty listings state */}
                            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-beige/80 rounded-2xl bg-sand/30">
                                <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center mb-4 border border-forest/10">
                                    <FileText className="w-8 h-8 text-forest/40" />
                                </div>
                                <h3 className="text-md font-semibold text-charcoal font-sans mb-1">
                                    Keine aktiven Inserate
                                </h3>
                                <p className="text-xs text-charcoal/50 font-sans max-w-sm mb-5 leading-relaxed">
                                    Du hast aktuell noch keine Angebote auf Campuna veröffentlicht. Erstelle jetzt dein erstes Inserat!
                                </p>

                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: Sidebar (4/12) ── */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* 1. Campuna Credits Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-beige/60 p-6 space-y-4">
                            <h3 className="text-sm font-bold text-charcoal/50 uppercase tracking-widest pb-2 border-b border-beige flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-gold-dark" />
                                Campuna Guthaben
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-charcoal/50 font-sans">Aktueller Stand:</span>
                                <span className="text-xl font-bold text-charcoal font-sans">
                                    {(creditBalance / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleEarnTestCredits}
                                className="w-full flex items-center justify-center gap-1.5 bg-gold/15 hover:bg-gold/25 text-gold-dark border border-gold/30 rounded-xl py-2.5 text-xs font-semibold font-sans transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Test-Guthaben aufladen (+29,00 €)
                            </button>
                        </div>

                        {/* 2. Subscription Upgrade Card (Commercial Only) */}
                        {profileType === 'COMMERCIAL' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-beige/60 p-6 space-y-4">
                                <h3 className="text-sm font-bold text-charcoal/50 uppercase tracking-widest pb-2 border-b border-beige">
                                    Mitgliedschaft
                                </h3>
                                {subDetails.tier === 'BUSINESS' ? (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-forest/10 border border-forest/20 rounded-2xl text-forest text-xs leading-relaxed font-sans font-semibold">
                                            ✓ Premium Business-Tarif aktiv! Genieße vollen Zugriff auf Banners, erweiterte Beschreibungen und Spotlight-Sichtbarkeit.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                                            Schalte das volle Potenzial deines Unternehmens frei. Für nur 29,00 € / Monat (oder mit Campuna Credits).
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleUpgrade}
                                            disabled={upgrading}
                                            className="w-full flex items-center justify-center gap-2 bg-forest text-sand hover:bg-forest/90 disabled:opacity-50 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                            {upgrading ? <Loader2 className="w-4 h-4 animate-spin text-sand" /> : 'Jetzt auf Business upgraden'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Referral Link Card */}
                        {user?.referral_code && (
                            <div className="bg-white rounded-3xl shadow-sm border border-beige/60 p-6 space-y-4">
                                <h3 className="text-sm font-bold text-charcoal/50 uppercase tracking-widest pb-2 border-b border-beige">
                                    Freunde einladen
                                </h3>
                                <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                                    Teile deinen Link. Wenn sich jemand registriert und ein Inserat bzw. einen Business-Plan bucht, erhältst du Guthaben!
                                </p>
                                <div className="pt-2">
                                    <ReferralBadge code={user.referral_code} />
                                </div>
                                
                                {/* Invitees Stats & List */}
                                <div className="pt-4 border-t border-beige space-y-3">
                                    <h4 className="text-[11px] font-bold text-charcoal/50 uppercase tracking-widest">
                                        Deine Einladungen ({referralsList.length})
                                    </h4>
                                    
                                    {referralsList.length === 0 ? (
                                        <p className="text-[10px] text-charcoal/40 italic font-sans">
                                            Noch keine Einladungen vorgenommen.
                                        </p>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {referralsList.map((ref) => (
                                                <div key={ref.id} className="flex items-center justify-between p-2 bg-sand/30 border border-beige/40 rounded-xl text-[11px]">
                                                    <div className="flex flex-col gap-0.5 truncate max-w-[70%]">
                                                        <span className="font-semibold text-charcoal truncate font-sans">{ref.referred_name}</span>
                                                        <span className="text-[9px] text-charcoal/40 font-sans uppercase">
                                                            {ref.referred_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-sans
                                                        ${ref.status === 'COMPLETED' 
                                                            ? 'bg-forest/10 text-forest' 
                                                            : 'bg-gold/15 text-gold-dark'}`}>
                                                        {ref.status === 'COMPLETED' ? 'Erfolgreich' : 'Ausstehend'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* ── Badge Instructions Modal ── */}
                <AnimatePresence>
                    {badgeModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setBadgeModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-beige/60 overflow-hidden relative z-10 p-6 space-y-6"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-beige">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center text-gold-dark">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-charcoal font-sans">
                                            Campuna Pioneer Badge
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setBadgeModalOpen(false)}
                                        className="w-8 h-8 rounded-full hover:bg-sand transition-colors flex items-center justify-center text-charcoal/40 hover:text-charcoal cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="space-y-4 font-sans">
                                    <p className="text-sm text-charcoal/70 leading-relaxed">
                                        Der <strong>Campuna Pioneer Status</strong> ist eine exklusive Auszeichnung für unsere ersten, engagiertesten Mitglieder.
                                    </p>

                                    <div className="bg-sand/40 border border-beige/40 rounded-2xl p-4 space-y-3">
                                        <h4 className="text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                                            Wie erhalte ich die Auszeichnung?
                                        </h4>
                                        <ul className="space-y-2.5 text-xs text-charcoal/70">

                                            <li className="flex items-start gap-2">
                                                <div className="w-5 h-5 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <strong>Mindestens 3 Inserate:</strong> Du musst mindestens 3 aktive, vom System freigegebene Inserate veröffentlicht haben.
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-2">

                                                <div className="w-5 h-5 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    Nur die ersten <strong>300 qualifizierten Benutzer</strong>  erhalten den Pioneer Award. Sichere dir deinen Status frühzeitig!

                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setBadgeModalOpen(false);
                                            router.push('/create-listing');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-forest text-sand hover:bg-forest/90 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm group cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 text-gold" />
                                        Inserat erstellen
                                    </button>
                                    <button
                                        onClick={() => setBadgeModalOpen(false)}
                                        className="flex-1 bg-beige text-charcoal hover:bg-beige/80 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Schließen
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getMyProfile, updateMyProfile } from '@/api/profile';
import { logoutUser } from '@/api/auth';
import { uploadImage } from '@/api/upload';
import { toast } from 'react-hot-toast';
import {
    User, Building2, MapPin, Phone, Globe, AtSign, Share2,
    Mail, FileText, Shield, Camera, Edit3, Save, X, LogOut,
    ChevronRight, Copy, Check, Loader2
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
            className="flex items-center gap-2 bg-forest/5 hover:bg-forest/10 border border-forest/20 rounded-xl px-4 py-2.5 transition-all group"
        >
            <span className="text-xs text-charcoal/50 font-semibold uppercase tracking-wider">Referral</span>
            <span className="font-mono text-sm font-bold text-forest">{code}</span>
            <span className="ml-auto text-forest/40 group-hover:text-forest transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
        {/* Basic Info */}
        <div>
            <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-widest mb-4 pb-2 border-b border-beige">
                Firmeninfo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Firmenname" value={profile.company_name} editValue={draft.company_name}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, company_name: v }))}
                    placeholder="Firma GmbH" icon={Building2} />
                <Field label="Standort" value={profile.location} editValue={draft.location}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, location: v }))}
                    placeholder="z.B. Berlin, Deutschland" icon={MapPin} />
                <div className="sm:col-span-2">
                    <Field label="Beschreibung" value={profile.bio} editValue={draft.bio}
                        isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, bio: v }))}
                        placeholder="Was macht dein Unternehmen?" icon={FileText} multiline />
                </div>
            </div>
        </div>

        {/* Contact */}
        <div>
            <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-widest mb-4 pb-2 border-b border-beige">
                Kontakt
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Firmen-E-Mail" value={profile.company_email} editValue={draft.company_email}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, company_email: v }))}
                    placeholder="info@firma.de" icon={Mail} type="email" />
                <Field label="Telefon" value={profile.phone} editValue={draft.phone}
                    isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, phone: v }))}
                    placeholder="+49 30 ..." icon={Phone} type="tel" />
                <div className="sm:col-span-2">
                    <Field label="Adresse" value={profile.company_address} editValue={draft.company_address}
                        isEditing={isEditing} onChange={v => setDraft(d => ({ ...d, company_address: v }))}
                        placeholder="Musterstraße 1, 10115 Berlin" icon={MapPin} />
                </div>
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

    // Fetch profile
    useEffect(() => {
        if (!mounted || !isLoggedIn) return;
        setLoading(true);
        getMyProfile().then(res => {
            if (res.success) {
                setProfile(res.data.profile);
                setProfileType(res.data.profile_type);
                setDraft(res.data.profile);
            } else {
                toast.error(res.error || 'Profil konnte nicht geladen werden.');
            }
        }).finally(() => setLoading(false));
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
        <div className="min-h-screen bg-sand pt-24 pb-16">
            <div className="max-w-7xl mx-auto ">

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

                {/* ── Cover Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative h-48 md:h-56 rounded-3xl overflow-hidden mb-0 shadow-lg group"
                >
                    {/* Cover image or gradient (references draft URL dynamically during edit) */}
                    {(isEditing ? draft?.cover_image_url : profile?.cover_image_url) ? (
                        <img
                            src={isEditing ? draft?.cover_image_url : profile?.cover_image_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-forest via-forest/80 to-gold/60" />
                    )}
                    {/* Overlay pattern */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Change cover button (only visible in edit mode) */}
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 hover:bg-black/55 transition-colors flex flex-col items-center justify-center gap-1.5 text-white font-sans font-semibold text-sm cursor-pointer z-20"
                        >
                            <Camera className="w-6 h-6 animate-pulse" />
                            <span>Hintergrundbild ändern</span>
                        </button>
                    )}

                    {/* Account type badge */}
                    <div className="absolute top-4 right-4 z-10">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow
                            ${profileType === 'COMMERCIAL'
                                ? 'bg-gold text-charcoal'
                                : 'bg-white/20 backdrop-blur-sm text-white border border-white/30'}`}>
                            {profileType === 'COMMERCIAL'
                                ? <><Building2 className="w-3.5 h-3.5" /> Gewerblich</>
                                : <><User className="w-3.5 h-3.5" /> Privat</>}
                        </span>
                    </div>
                </motion.div>

                {/* ── Profile Header Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-3xl shadow-sm border border-beige/60 -mt-6 mx-2 px-6 pt-6 pb-5 relative z-10"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <Avatar
                            src={avatarSrc}
                            name={displayName}
                            size="lg"
                            onUploadClick={isEditing ? () => avatarInputRef.current?.click() : undefined}
                        />

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-charcoal font-sans truncate">
                                {displayName || 'Kein Name'}
                            </h1>
                            <p className="text-sm text-charcoal/50 font-sans mt-0.5">{user?.email}</p>
                            {profile.location && (
                                <p className="text-sm text-charcoal/60 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3.5 h-3.5 text-gold" />
                                    {profile.location}
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-start sm:self-auto ml-auto">
                            {!isEditing ? (
                                <button
                                    id="btn-edit-profile"
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 bg-forest text-sand hover:bg-forest/80 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Bearbeiten
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 bg-beige text-charcoal hover:bg-beige/80 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                        Abbrechen
                                    </button>
                                    <button
                                        id="btn-save-profile"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gold text-charcoal hover:bg-gold-dark hover:text-sand px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60"
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

                    {/* Referral code */}
                    {user?.referral_code && (
                        <div className="mt-4">
                            <ReferralBadge code={user.referral_code} />
                        </div>
                    )}
                </motion.div>

                {/* ── Profile Fields Panel ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-4 bg-white rounded-3xl shadow-sm border border-beige/60 px-6 py-7"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-charcoal font-sans">
                            {profileType === 'COMMERCIAL' ? 'Firmenprofil' : 'Mein Profil'}
                        </h2>
                        {isEditing && (
                            <span className="text-xs text-gold font-semibold bg-gold/10 px-3 py-1 rounded-full">
                                Bearbeitungsmodus
                            </span>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isEditing ? 'editing' : 'viewing'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {profileType === 'PRIVATE' ? (
                                <PrivateProfilePanel
                                    profile={profile}
                                    user={user}
                                    isEditing={isEditing}
                                    draft={draft}
                                    setDraft={setDraft}
                                />
                            ) : (
                                <CompanyProfilePanel
                                    profile={profile}
                                    user={user}
                                    isEditing={isEditing}
                                    draft={draft}
                                    setDraft={setDraft}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* ── Account Actions ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <button
                        id="btn-create-listing"
                        onClick={() => router.push('/create-listing')}
                        className="flex items-center justify-center gap-3 bg-forest text-sand hover:bg-forest/90 px-6 py-4 rounded-2xl font-sans text-sm font-semibold transition-all shadow-sm group hover:scale-[1.01]"
                    >
                        <Edit3 className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                        <span>Inserat erstellen</span>
                    </button>

                    <button
                        id="btn-logout"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 bg-white border border-red-200 text-red-500 hover:bg-red-50/50 hover:border-red-300 px-6 py-4 rounded-2xl font-sans text-sm font-semibold transition-all shadow-sm hover:scale-[1.01]"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Abmelden</span>
                    </button>
                </motion.div>

            </div>
        </div>
    );
}

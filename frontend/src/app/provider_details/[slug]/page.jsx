'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    MapPin,
    ShieldCheck,
    Mail,
    Calendar,
    Globe,
    MessageSquare,
    Star,
    Eye,
    Info,
    ExternalLink,
    Megaphone,
    Phone,
    ArrowLeft,
    Building2,
    Package
} from 'lucide-react';
import { getPublicProfile } from '@/api/profile';
import { getListingsByUser } from '@/api/listings';

// ─── SVG Social Icons ─────────────────────────────────────────────────────────

function FacebookIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}

function InstagramIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugifyName(name = '') {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildListingSlug(title = '', id = '') {
    const cleanTitle = slugifyName(title);
    return cleanTitle || id;
}

function formatLocation(location) {
    if (!location) return 'Deutschland';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) return location.address;
    return 'Deutschland';
}

function formatMemberSince(dateStr) {
    if (!dateStr) return 'Neu registriert';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Neu registriert';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_LOGO  = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ item }) {
    const router = useRouter();

    const handleClick = () => {
        const slug = buildListingSlug(item.title, item.id);
        router.push(`/listing_details/${slug}`);
    };

    const images = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : [DEFAULT_COVER];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClick}
            className="group relative flex flex-col bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-forest/5 hover:border-forest/10 hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
        >
            {/* 4-Image Grid Preview */}
            <div className="grid grid-cols-4 gap-0.5 aspect-[16/9] w-full bg-sand/15 overflow-hidden border-b border-forest/5">
                {images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative w-full h-full overflow-hidden">
                        <img
                            src={img}
                            alt={`${item.title} preview ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-[0.8s] group-hover:scale-105"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ))}
                {images.length < 4 && Array.from({ length: 4 - images.length }).map((_, i) => (
                    <div key={i} className="bg-sand/30 w-full h-full" />
                ))}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                <h3 className="font-display text-xs sm:text-sm md:text-base font-bold text-black group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-snug">
                    {item.title}
                </h3>

                <div>
                    <div className="flex items-center justify-between pb-3 border-b border-forest/5">
                        <div>
                            <span className="block text-[8px] md:text-[9px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1">Preis</span>
                            <span className="font-display text-xs sm:text-base font-extrabold text-forest">
                                {Number(item.price).toLocaleString('de-DE')} €
                                {item.negotiable && <span className="text-[10px] font-normal text-charcoal/50 ml-1">(VB)</span>}
                            </span>
                        </div>
                        {item.location && (
                            <div className="flex items-center gap-0.5 text-stone-500 text-[10px] sm:text-xs">
                                <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                                <span>{formatLocation(item.location).split(',')[0]}</span>
                            </div>
                        )}
                    </div>
                    <div className="pt-3 flex justify-center">
                        <span className="w-full bg-white hover:bg-sand/30 border border-forest/10 py-2 rounded-xl text-[10px] sm:text-xs font-semibold tracking-wider text-forest flex items-center justify-center gap-1.5 transition-colors duration-300">
                            <Eye className="w-3.5 h-3.5 text-forest/70" />
                            Angebot ansehen
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Empty Listings State ─────────────────────────────────────────────────────

function EmptyListings({ providerName }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-sand/50 flex items-center justify-center">
                <Package className="w-7 h-7 text-charcoal/30" />
            </div>
            <p className="font-display text-base font-bold text-charcoal/50">Noch keine aktiven Anzeigen</p>
            <p className="text-xs text-charcoal/40 max-w-xs">
                {providerName} hat noch keine genehmigten Inserate auf Campuna veröffentlicht.
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProviderDetails() {
    const params  = useParams();
    const router  = useRouter();

    const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';

    // Extract UUID from slug (appended at the end, e.g. "vtmcamping-<uuid>")
    const uuidMatch = rawSlug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    const userId = uuidMatch ? uuidMatch[1] : null;

    const [provider,  setProvider]  = useState(null);
    const [listings,  setListings]  = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [notFound,  setNotFound]  = useState(false);
    const [coverSrc,  setCoverSrc]  = useState(DEFAULT_COVER);
    const [logoSrc,   setLogoSrc]   = useState(DEFAULT_LOGO);

    useEffect(() => {
        if (!userId) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch profile and listings in parallel
                const [profileRes, listingsRes] = await Promise.all([
                    getPublicProfile(userId),
                    getListingsByUser(userId),
                ]);

                if (cancelled) return;

                if (!profileRes.success || !profileRes.data?.profile) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const p    = profileRes.data.profile;
                const type = profileRes.data.profile_type;

                const name = type === 'COMMERCIAL'
                    ? (p.company_name || 'Gewerblicher Anbieter')
                    : (`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Privatverkäufer');

                const logo  = p.logo_url || p.profile_image_url || DEFAULT_LOGO;
                const cover = p.cover_image_url || DEFAULT_COVER;

                setProvider({
                    id:           userId,
                    name,
                    type:         type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                    logo,
                    cover,
                    bio:          p.bio || '',
                    location:     p.location || '',
                    email:        p.company_email || '',
                    phone:        p.phone || '',
                    website:      p.website_url || '',
                    instagram:    p.instagram_url || '',
                    facebook:     p.facebook_url || '',
                    address:      p.company_address || p.location || '',
                    impressum:    p.privacy_policy_url || '',
                    memberSince:  formatMemberSince(p.member_since),
                    isStrategic:  p.is_strategic_partner || false,
                    tier:         p.tier || 'FREE',
                    achievements: profileRes.data.achievements || [],
                });

                setCoverSrc(cover);
                setLogoSrc(logo);

                if (listingsRes.success && Array.isArray(listingsRes.data?.listings)) {
                    setListings(listingsRes.data.listings);
                }
            } catch (err) {
                console.error('Error fetching provider details:', err);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [userId]);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center pt-24">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin" />
                    <p className="font-sans text-xs font-semibold text-forest uppercase tracking-widest animate-pulse">Laden...</p>
                </div>
            </div>
        );
    }

    // ── Not Found ────────────────────────────────────────────────────────────

    if (notFound || !provider) {
        return (
            <div className="min-h-screen bg-sand flex flex-col items-center justify-center pt-24 gap-6 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-forest/5 flex items-center justify-center">
                    <Building2 className="w-9 h-9 text-forest/30" />
                </div>
                <div>
                    <p className="font-display text-xl font-bold text-charcoal mb-1">Anbieter nicht gefunden</p>
                    <p className="text-sm text-charcoal/50">Dieser Anbieter existiert nicht oder ist nicht mehr aktiv.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest border border-forest/20 px-5 py-2.5 rounded-full hover:bg-forest/5 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück
                </button>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    const hasSocials = provider.website || provider.instagram || provider.facebook;
    const contactEmail = provider.email || `kontakt@campuna.de`;

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal">
            <title>{provider.name} – Anbieter auf Campuna</title>
            <meta name="description" content={provider.bio || `${provider.name} – Camping-Anbieter auf Campuna.`} />

            <main className="max-w-7xl mx-auto py-20 px-4 md:px-6">

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal/50 hover:text-forest transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück
                </button>

                {/* ── Profile Card ── */}
                <section className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-lg mb-10">

                    {/* Cover */}
                    <div className="relative w-full aspect-[3/1] md:aspect-[4.5/1] overflow-hidden bg-sand/20">
                        <img
                            src={coverSrc}
                            alt={`${provider.name} Banner`}
                            className="w-full h-full object-cover"
                            onError={() => setCoverSrc(DEFAULT_COVER)}
                            referrerPolicy="no-referrer"
                        />
                        {/* Subtle bottom gradient for readability */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Logo overlap */}
                    <div className="relative px-6 md:px-12">
                        <div className="-mt-14 md:-mt-24 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 z-10 select-none">
                            <img
                                src={logoSrc}
                                alt={`${provider.name} Logo`}
                                className="w-full h-full object-cover"
                                onError={() => setLogoSrc(DEFAULT_LOGO)}
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>

                    {/* Info + Actions */}
                    <div className="px-6 md:px-12 pb-10 pt-4 flex flex-col lg:flex-row justify-between gap-8 items-start">

                        {/* Left — Info */}
                        <div className="flex-1 space-y-5 max-w-3xl">

                            {/* Name + Verified badge */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
                                        {provider.name}
                                    </h1>
                                    <span className="p-1 bg-forest/5 text-forest rounded-full border border-forest/10 inline-flex items-center justify-center shrink-0" title="Verifizierter Campuna-Anbieter">
                                        <ShieldCheck className="w-4 h-4 text-forest shrink-0 fill-forest/15" />
                                    </span>
                                    {provider.achievements?.find(a => a.badge_key === 'CAMPUNA_PIONEER') && (
                                        <div 
                                            className="flex items-center gap-1 bg-forest/5 border border-forest/20 text-forest rounded-full px-2 py-0.5 text-[10px] font-bold font-sans shadow-sm cursor-help"
                                            title={`Campuna Pioneer #${provider.achievements.find(a => a.badge_key === 'CAMPUNA_PIONEER').position}`}
                                        >
                                            <img 
                                                src="/pioneer_badge.jpg" 
                                                alt="Campuna Pioneer Badge" 
                                                className="w-4 h-4 rounded-full object-cover border border-gold/30"
                                            />
                                            <span>Pioneer #{provider.achievements.find(a => a.badge_key === 'CAMPUNA_PIONEER').position}</span>
                                        </div>
                                    )}
                                    {provider.tier === 'BUSINESS' && (
                                        <span className="px-2.5 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Business
                                        </span>
                                    )}
                                    {provider.isStrategic && (
                                        <span className="px-2.5 py-0.5 bg-forest/10 text-forest border border-forest/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Strategischer Partner
                                        </span>
                                    )}
                                </div>

                                {/* Type + Location */}
                                <div className="flex items-center gap-4 text-xs text-charcoal/55 font-medium flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
                                        {provider.type}
                                    </span>
                                    {provider.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                                            {provider.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact row */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs md:text-sm text-charcoal/70">
                                {provider.email && (
                                    <a href={`mailto:${provider.email}`} className="flex items-center gap-1.5 hover:text-forest transition-colors font-medium">
                                        <Mail className="w-4 h-4 text-gold shrink-0" />
                                        {provider.email}
                                    </a>
                                )}
                                {provider.phone && (
                                    <a href={`tel:${provider.phone}`} className="flex items-center gap-1.5 hover:text-forest transition-colors font-medium">
                                        <Phone className="w-4 h-4 text-gold shrink-0" />
                                        {provider.phone}
                                    </a>
                                )}
                                <div className="flex items-center gap-1.5 text-charcoal/85 font-semibold">
                                    <Calendar className="w-4 h-4 text-gold shrink-0" />
                                    Mitglied seit {provider.memberSince}
                                </div>
                            </div>

                            {/* Bio */}
                            {provider.bio && (
                                <div className="pt-4 border-t border-forest/5">
                                    <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed font-light whitespace-pre-line">
                                        {provider.bio}
                                    </p>
                                </div>
                            )}

                            {/* Social / Website links */}
                            {hasSocials && (
                                <div className="flex gap-2 pt-1">
                                    {provider.website && (
                                        <a href={provider.website} target="_blank" rel="noopener noreferrer"
                                            title="Webseite besuchen"
                                            className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm">
                                            <Globe className="w-4.5 h-4.5" />
                                        </a>
                                    )}
                                    {provider.instagram && (
                                        <a href={provider.instagram} target="_blank" rel="noopener noreferrer"
                                            title="Instagram"
                                            className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm">
                                            <InstagramIcon />
                                        </a>
                                    )}
                                    {provider.facebook && (
                                        <a href={provider.facebook} target="_blank" rel="noopener noreferrer"
                                            title="Facebook"
                                            className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm">
                                            <FacebookIcon />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right — CTA */}
                        <div className="w-full lg:w-auto lg:min-w-[260px] flex flex-col items-center lg:items-end gap-4 shrink-0">
                            <div className="w-full">
                                <a
                                    href={`mailto:${contactEmail}?subject=Anfrage%20über%20Campuna`}
                                    className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3.5 px-7 rounded-full shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Anbieter kontaktieren
                                </a>
                                <span className="block mt-2 text-center text-[10px] text-charcoal/40 font-medium">
                                    Nachricht direkt senden
                                </span>
                            </div>

                            {/* Listing count badge */}
                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-forest/15 bg-forest/5 text-forest rounded-full text-xs font-bold">
                                <Star className="w-3.5 h-3.5 text-gold fill-gold shrink-0" />
                                {listings.length === 1 ? '1 Inserat' : `${listings.length} Inserate`}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Listings Section ── */}
                <section className="mb-14">
                    <div className="flex items-center gap-2.5 border-b border-forest/5 pb-4 mb-8">
                        <Megaphone className="w-5 h-5 text-gold shrink-0" />
                        <h2 className="font-display text-xl sm:text-2xl font-black text-forest uppercase tracking-tight">
                            Anzeigen von {provider.name}
                        </h2>
                        <span className="ml-1 bg-forest/5 text-forest px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {listings.length}
                        </span>
                    </div>

                    {listings.length === 0 ? (
                        <EmptyListings providerName={provider.name} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {listings.map((item) => (
                                <div key={item.id} className="h-full">
                                    <ListingCard item={item} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Legal / Impressum Section ── */}
                {(provider.address || provider.email || provider.phone || provider.impressum) && (
                    <section>
                        <div className="bg-sand/5 border border-forest/10 p-6 md:p-8 rounded-2xl shadow-sm">
                            <h3 className="font-display text-base md:text-lg font-bold text-forest flex items-center gap-2 pb-3.5 border-b border-forest/10 mb-5 uppercase tracking-wide">
                                <Info className="w-4.5 h-4.5 text-gold shrink-0" />
                                Rechtliche Angaben
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs md:text-sm leading-relaxed">

                                <div className="space-y-1">
                                    <span className="block font-bold text-charcoal/90">Firmenname:</span>
                                    <span className="font-light text-charcoal/80">{provider.name}</span>
                                </div>

                                {provider.address && (
                                    <div className="space-y-1">
                                        <span className="block font-bold text-charcoal/90">Adresse:</span>
                                        <span className="font-light text-charcoal/80">{provider.address}</span>
                                    </div>
                                )}

                                {(provider.email || provider.phone) && (
                                    <div className="space-y-1">
                                        <span className="block font-bold text-charcoal/90">Kontaktinformationen:</span>
                                        <span className="font-light text-charcoal/80">
                                            {[provider.email && `E-Mail: ${provider.email}`, provider.phone && `Tel: ${provider.phone}`].filter(Boolean).join(' | ')}
                                        </span>
                                    </div>
                                )}

                                {provider.impressum && (
                                    <div className="space-y-1">
                                        <span className="block font-bold text-charcoal/90">Impressum / Datenschutz:</span>
                                        <a
                                            href={provider.impressum}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-semibold text-forest hover:text-gold transition-colors"
                                        >
                                            Zum Impressum
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}

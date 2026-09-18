'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    ShieldCheck,
    Mail,
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
    Package,
    Heart,
    ChevronLeft,
    ChevronRight,
    Rocket,
    X,
    Send,
    Sparkles
} from 'lucide-react';
import { getPublicProfile } from '@/api/profile';
import { getListingsByUser } from '@/api/listings';
import { createOrGetConversation } from '@/api/conversations';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { PROVIDERS, STATIC_USERS, STATIC_LISTINGS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';

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
const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80';

// ─── Normalizer & Listing Card (Matches Home Page ListingCard) ─────────────────

function normalizeListing(item) {
    if (!item) return null;

    const id = item.id || item._id || String(Math.random());
    const title = item.title || item.description || "Camping Angebot";
    const category = item.category || item.Category || 'Camping Zubehör';
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const pricePeriod = item.pricePeriod || 'Preis';
    const location = item.location || "Deutschland";
    const slug = item.slug || buildListingSlug(title, id);

    let images = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        images = item.images;
    } else if (typeof item.images === 'string') {
        images = [item.images];
    } else if (item["Main Image"]) {
        images = [item["Main Image"]];
    }
    if (images.length === 0) {
        images = [DEFAULT_IMAGE];
    }
    images = images.map(img => getImageUrl(img, DEFAULT_IMAGE));

    const sellerType = item.seller?.type || item.listing_user_type || 'Gewerblich';

    let features = [];
    if (Array.isArray(item.features) && item.features.length > 0) {
        features = item.features;
    } else {
        if (item.condition) features.push(item.condition);
        if (item.subcategory) features.push(item.subcategory);
        if (item.category && !features.includes(item.category)) features.push(item.category);
    }
    if (features.length === 0) {
        features = ['Camping'];
    }

    const isBoosted = Boolean(
        item.is_boosted ||
        (item.boosted_until && new Date(item.boosted_until) > new Date())
    );
    const isFeatured = Boolean(item.featured);

    return {
        id,
        slug,
        title,
        category,
        price,
        pricePeriod,
        location,
        images,
        sellerType,
        features,
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted
    };
}

const ListingCard = React.memo(({ item: rawItem }) => {
    const router = useRouter();
    const item = useMemo(() => normalizeListing(rawItem), [rawItem]);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgSrc, setImgSrc] = useState(item?.images[0] || DEFAULT_IMAGE);
    const tagsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        if (tagsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
        }
    }, []);

    useEffect(() => {
        checkScroll();
        const timer = setTimeout(checkScroll, 200);
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScroll);
        };
    }, [item?.features, checkScroll]);

    if (!item) return null;

    const scrollTags = (e, direction) => {
        e.stopPropagation();
        if (tagsRef.current) {
            const scrollAmount = direction === 'left' ? -90 : 90;
            tagsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleCardClick = () => {
        router.push(`/inserate/${item.slug}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="listing-card group relative w-full flex flex-col h-full bg-white rounded-[24px] overflow-hidden border border-forest/5 hover:border-forest/10 hover:shadow-xl transition-all duration-300 select-none cursor-pointer"
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                <img
                    src={imgSrc}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                    loading="lazy"
                    onError={() => setImgSrc(DEFAULT_IMAGE)}
                />
                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap pointer-events-none">
                        {/* Boosted Badge */}
                        {item.is_boosted && (
                            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-yellow-100/90 flex items-center gap-1 backdrop-blur-md">
                                <Rocket className="w-2.5 h-2.5 text-slate-950" />
                                <span>BOOSTED</span>
                            </span>
                        )}

                        {/* Seller Type Badge */}
                        <span className="bg-forest/90 text-white text-[8px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-white" />
                            {item.sellerType}
                        </span>
                    </div>

                    <button
                        type="button"
                        aria-label={isFavorite ? "Von Merkzettel entfernen" : "Auf den Merkzettel"}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer pointer-events-auto shrink-0 ${isFavorite
                            ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                            : 'bg-white/80 hover:bg-white text-forest hover:text-rose-500 hover:scale-110'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-white' : ''}`} />
                    </button>
                </div>
                <div className="absolute bottom-4 right-0 inset-x-4 flex items-center justify-end pointer-events-none text-white/90 z-10">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                        <span>{item.location}</span>
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white text-forest px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                        <Eye className="w-4 h-4" />
                        <span>Inserat ansehen</span>
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="font-display text-md font-semibold text-black group-hover:text-gold transition-colors duration-200 mb-2 line-clamp-1">
                        {item.title}
                    </h3>
                    <div className="relative group/tags mb-2" onClick={(e) => e.stopPropagation()}>
                        {canScrollLeft && (
                            <button
                                type="button"
                                onClick={(e) => scrollTags(e, 'left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-white/90 hover:bg-white text-forest shadow rounded-full flex items-center justify-center border border-forest/10 transition-all duration-200"
                                aria-label="Scroll tags left"
                            >
                                <ChevronLeft className="w-2.5 h-2.5" />
                            </button>
                        )}
                        <div
                            ref={tagsRef}
                            onScroll={checkScroll}
                            className="flex overflow-x-auto gap-1.5 no-scrollbar scroll-smooth"
                        >
                            {item.features.map((feat, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] text-charcoal/60 bg-sand px-2 py-1 rounded-md border border-forest/5 whitespace-nowrap shrink-0 select-none"
                                >
                                    {feat}
                                </span>
                            ))}
                        </div>
                        {canScrollRight && (
                            <button
                                type="button"
                                onClick={(e) => scrollTags(e, 'right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-white/90 hover:bg-white text-forest shadow rounded-full flex items-center justify-center border border-forest/10 transition-all duration-200"
                                aria-label="Scroll tags right"
                            >
                                <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
                    <span className="block text-[10px] uppercase tracking-widest text-charcoal/40 font-mono">
                        {item.pricePeriod}
                    </span>
                    <span className="font-display text-lg font-bold text-forest">
                        {item.price.toLocaleString('de-DE')} €
                    </span>
                </div>
            </div>
        </div>
    );
});

ListingCard.displayName = 'ListingCard';

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
    const params = useParams();
    const router = useRouter();
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const currentUser = useAuthStore((state) => state.user);

    const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';

    // Extract UUID from slug (appended at the end, e.g. "vtmcamping-<uuid>")
    const uuidMatch = rawSlug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    const userId = uuidMatch ? uuidMatch[1] : null;

    const [provider, setProvider] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [coverSrc, setCoverSrc] = useState(DEFAULT_COVER);
    const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO);

    // Chat / Message Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const handleOpenContactModal = () => {
        if (!isLoggedIn) {
            toast.error('Bitte melde dich an, um eine Nachricht zu senden.');
            router.push(`/login?returnUrl=/anbieter/${encodeURIComponent(rawSlug)}`);
            return;
        }
        if (currentUser?.id && provider?.id && String(currentUser.id).toLowerCase() === String(provider.id).toLowerCase()) {
            toast.error('Du kannst dir nicht selbst eine Nachricht senden.');
            return;
        }
        setIsContactModalOpen(true);
    };

    const handleSendDirectMessage = async (e) => {
        if (e) e.preventDefault();
        if (!contactMessage || !contactMessage.trim()) {
            toast.error('Bitte gib eine Nachricht ein.');
            return;
        }

        setIsSendingMessage(true);
        try {
            const res = await createOrGetConversation({
                listing_id: null,
                seller_id: provider?.id || userId,
                initial_message: contactMessage.trim()
            });

            const convId = res.conversation_id || res.data?.conversation_id;
            if (res.success && convId) {
                toast.success('Nachricht gesendet!');
                setIsContactModalOpen(false);
                setContactMessage('');
                router.push(`/mein-konto?tab=nachrichten&id=${encodeURIComponent(convId)}`);
            } else {
                toast.error(res.error || res.message || 'Fehler beim Senden der Nachricht.');
            }
        } catch (err) {
            console.error('Error starting chat:', err);
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Starten der Unterhaltung.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const fallbackToMock = () => {
            const cleanSlug = rawSlug.toLowerCase();

            // Check in STATIC_USERS first
            const matchedStaticUser = STATIC_USERS.find(u => {
                const sName = slugifyName(u.name);
                const sSlug = slugifyName(u.slug || '');
                return (
                    cleanSlug === u.id ||
                    cleanSlug === sSlug ||
                    cleanSlug.includes(sName) ||
                    sName.includes(cleanSlug)
                );
            });

            if (matchedStaticUser) {
                setProvider({
                    id: matchedStaticUser.id,
                    name: matchedStaticUser.name,
                    type: matchedStaticUser.sellerType || (matchedStaticUser.account_type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'),
                    logo: matchedStaticUser.logo || DEFAULT_LOGO,
                    cover: matchedStaticUser.coverImage || DEFAULT_COVER,
                    bio: matchedStaticUser.description || '',
                    location: matchedStaticUser.location || 'Deutschland',
                    email: matchedStaticUser.email || ('kontakt@' + slugifyName(matchedStaticUser.name) + '.de'),
                    phone: matchedStaticUser.phone || '+49 (0) 30 1234567',
                    website: matchedStaticUser.website || ('https://' + slugifyName(matchedStaticUser.name) + '.de'),
                    instagram: 'https://instagram.com/' + slugifyName(matchedStaticUser.name),
                    facebook: 'https://facebook.com/' + slugifyName(matchedStaticUser.name),
                    address: matchedStaticUser.address || matchedStaticUser.location || 'Deutschland',
                    impressum: 'https://' + slugifyName(matchedStaticUser.name) + '.de/impressum',
                    memberSince: formatMemberSince(matchedStaticUser.memberSince),
                    isStrategic: matchedStaticUser.account_type === 'COMMERCIAL',
                    tier: matchedStaticUser.account_type === 'COMMERCIAL' ? 'BUSINESS' : 'FREE',
                    achievements: [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }],
                });

                setCoverSrc(matchedStaticUser.coverImage || DEFAULT_COVER);
                setLogoSrc(matchedStaticUser.logo || DEFAULT_LOGO);

                // Find user's assigned listings from static marketplace dataset
                const userListings = STATIC_LISTINGS.filter(l =>
                    l.seller_user_id === matchedStaticUser.id ||
                    l.seller?.name?.toLowerCase() === matchedStaticUser.name.toLowerCase()
                );
                setListings(userListings);
                setLoading(false);
                return true;
            }

            const matchedMock = PROVIDERS.find(p => {
                const sName = slugifyName(p.name);
                return (
                    cleanSlug.includes(sName) ||
                    sName.includes(cleanSlug) ||
                    p.id === rawSlug ||
                    (p.slug && p.slug.includes(cleanSlug))
                );
            }) || PROVIDERS[0];

            if (matchedMock) {
                setProvider({
                    id: matchedMock.id,
                    name: matchedMock.name,
                    type: matchedMock.sellerType || 'Gewerblich',
                    logo: matchedMock.logo || DEFAULT_LOGO,
                    cover: matchedMock.coverImage || DEFAULT_COVER,
                    bio: matchedMock.description || '',
                    location: matchedMock.location || 'Deutschland',
                    email: 'kontakt@' + slugifyName(matchedMock.name) + '.de',
                    phone: '+49 (0) 30 1234567',
                    website: 'https://' + slugifyName(matchedMock.name) + '.de',
                    instagram: 'https://instagram.com/' + slugifyName(matchedMock.name),
                    facebook: 'https://facebook.com/' + slugifyName(matchedMock.name),
                    address: matchedMock.location ? `${matchedMock.location}, Deutschland` : 'Deutschland',
                    impressum: 'https://' + slugifyName(matchedMock.name) + '.de/impressum',
                    memberSince: '01.01.2024',
                    isStrategic: true,
                    tier: 'BUSINESS',
                    achievements: [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }],
                });

                setCoverSrc(matchedMock.coverImage || DEFAULT_COVER);
                setLogoSrc(matchedMock.logo || DEFAULT_LOGO);

                const userListings = STATIC_LISTINGS.filter(l =>
                    l.seller?.name?.toLowerCase() === matchedMock.name.toLowerCase()
                );
                setListings(userListings);
                setLoading(false);
                return true;
            }
            return false;
        };

        const fetchData = async () => {
            setLoading(true);

            if (userId) {
                try {
                    // Fetch profile and listings in parallel
                    const [profileRes, listingsRes] = await Promise.all([
                        getPublicProfile(userId),
                        getListingsByUser(userId),
                    ]);

                    if (cancelled) return;

                    if (profileRes.success && profileRes.data?.profile) {
                        const p = profileRes.data.profile;
                        const type = profileRes.data.profile_type;

                        const name = type === 'COMMERCIAL'
                            ? (p.company_name || 'Gewerblicher Anbieter')
                            : (`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Privatverkäufer');

                        const logo = p.logo_url || p.profile_image_url || DEFAULT_LOGO;
                        const cover = p.cover_image_url || DEFAULT_COVER;

                        setProvider({
                            id: userId,
                            name,
                            type: type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat',
                            logo,
                            cover,
                            bio: p.bio || '',
                            location: p.location || '',
                            email: p.company_email || '',
                            phone: p.phone || '',
                            website: p.website_url || '',
                            instagram: p.instagram_url || '',
                            facebook: p.facebook_url || '',
                            address: p.company_address || p.location || '',
                            impressum: p.privacy_policy_url || '',
                            memberSince: formatMemberSince(p.member_since),
                            isStrategic: p.is_strategic_partner || false,
                            tier: p.tier || 'FREE',
                            achievements: profileRes.data.achievements || [],
                        });

                        setCoverSrc(getImageUrl(cover, DEFAULT_COVER));
                        setLogoSrc(getImageUrl(logo, DEFAULT_LOGO));

                        if (listingsRes.success && Array.isArray(listingsRes.data?.listings)) {
                            setListings(listingsRes.data.listings);
                        }

                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('Error fetching provider details:', err);
                }
            }

            // Fallback to mock provider
            const foundMock = fallbackToMock();
            if (!foundMock && !cancelled) {
                setNotFound(true);
                setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [userId, rawSlug]);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <CircleLoader size="lg" color="forest" fullPage />
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

            <main className="max-w-7xl mx-auto pt-24 sm:pt-28 pb-20 px-4 md:px-6">
                {/* ── Breadcrumbs ── */}
                <div className="mb-6">
                    <Breadcrumbs
                        items={[
                            { label: 'Camping-Anbieter', href: '/anbieter' },
                            { label: provider.name }
                        ]}
                        variant="light"
                    />
                </div>

                {/* ── Profile Card ── */}
                <section className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-lg mb-10">

                    {/* Cover - Only for Commercial Users */}
                    {provider.type !== 'Privat' && (
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
                    )}

                    {/* Private Profile Layout: Logo, Name & Bio in a single row */}
                    {provider.type === 'Privat' ? (
                        <div className="px-6 md:px-12 py-8 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-stretch">
                            <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 max-w-3xl min-w-0">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 select-none">
                                    <img
                                        src={logoSrc}
                                        alt={`${provider.name} Logo`}
                                        className="w-full h-full object-cover"
                                        onError={() => setLogoSrc(DEFAULT_LOGO)}
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                <div className="space-y-3 flex-1 min-w-0">
                                    {/* Name */}
                                    <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
                                        {provider.name}
                                    </h1>

                                    {/* Location */}
                                    {provider.location && (
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal/55 font-medium">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                                                {provider.location}
                                            </span>
                                        </div>
                                    )}

                                    {/* Contact row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs md:text-sm text-charcoal/70 pt-0.5">
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
                                    </div>

                                    {/* Bio */}
                                    {provider.bio && (
                                        <div className="pt-2">
                                            <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed font-light whitespace-pre-line">
                                                {provider.bio}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Top Right Badges & Bottom Right CTA */}
                            <div className="w-full lg:w-auto lg:min-w-[260px] flex flex-col justify-between items-start lg:items-end gap-6 shrink-0 self-stretch">
                                {/* Right Top: Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sand text-forest border border-beige shadow-sm">
                                        Privatverkäufer
                                    </span>
                                    {provider.achievements?.find(a => a.badge_key === 'CAMPUNA_PIONEER') && (
                                        <PioneerBadge size="sm" text="Pioneer" />
                                    )}
                                </div>

                                {/* Right Bottom: CTA & Listing count */}
                                <div className="w-full flex flex-col items-stretch lg:items-end gap-3 mt-auto pt-2">
                                    <div className="w-full">
                                        <button
                                            type="button"
                                            onClick={handleOpenContactModal}
                                            className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3.5 px-7 rounded-full shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <MessageSquare className="w-4 h-4 shrink-0" />
                                            Anbieter kontaktieren
                                        </button>
                                        <span className="block mt-1.5 text-center text-[10px] text-charcoal/40 font-medium">
                                            Direkt im Campuna Chat schreiben
                                        </span>
                                    </div>

                                    {/* Listing count badge */}
                                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-forest/15 bg-forest/5 text-forest rounded-full text-xs font-bold">
                                        <Star className="w-3.5 h-3.5 text-gold fill-gold shrink-0" />
                                        {listings.length === 1 ? '1 Inserat' : `${listings.length} Inserate`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 md:px-12 py-8 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-stretch">
                            <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 max-w-3xl min-w-0">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 select-none">
                                    <img
                                        src={logoSrc}
                                        alt={`${provider.name} Logo`}
                                        className="w-full h-full object-cover"
                                        onError={() => setLogoSrc(DEFAULT_LOGO)}
                                        referrerPolicy="no-referrer"
                                    />
                                </div>

                                {/* Left — Info */}
                                <div className="flex-1 space-y-5 min-w-0">
                                    {/* Name + Verified badge */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
                                                {provider.name}
                                            </h1>
                                            {provider.achievements?.find(a => a.badge_key === 'CAMPUNA_PIONEER') && (
                                                <PioneerBadge size="sm" text="Pioneer" />
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

                                        {/* Bio (Directly below name, top of address & email, no separate box) */}
                                        {provider.bio && (
                                            <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed font-light whitespace-pre-line pt-0.5 max-w-2xl">
                                                {provider.bio}
                                            </p>
                                        )}

                                        {/* Type + Location / Address */}
                                        <div className="flex items-center gap-4 text-xs text-charcoal/55 font-medium flex-wrap pt-1">
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
                                    </div>

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
                            </div>

                            {/* Right — CTA */}
                            <div className="w-full lg:w-auto lg:min-w-[260px] flex flex-col justify-between items-start lg:items-end gap-6 shrink-0 self-stretch">
                                <div className="w-full">
                                    <button
                                        type="button"
                                        onClick={handleOpenContactModal}
                                        className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3.5 px-7 rounded-full shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4 shrink-0" />
                                        Anbieter kontaktieren
                                    </button>
                                    <span className="block mt-1.5 text-center text-[10px] text-charcoal/40 font-medium">
                                        Direkt im Campuna Chat schreiben
                                    </span>
                                </div>

                                {/* Listing count badge */}
                                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-forest/15 bg-forest/5 text-forest rounded-full text-xs font-bold">
                                    <Star className="w-3.5 h-3.5 text-gold fill-gold shrink-0" />
                                    {listings.length === 1 ? '1 Inserat' : `${listings.length} Inserate`}
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listings.map((item) => (
                                <div key={item.id} className="h-full flex justify-center">
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

            {/* ── Contact / Chat Modal popup (Matched to Listing Chat Modal) ── */}
            <AnimatePresence>
                {isContactModalOpen && (
                    <motion.div
                        key="contact-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col relative text-left"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsContactModalOpen(false)}
                                className="absolute top-4 right-4 text-charcoal/45 hover:text-charcoal bg-sand/40 hover:bg-sand p-2 rounded-full transition-all shadow-sm z-20 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Provider Header Snippet */}
                            <div className="bg-sand/30 border-b border-forest/10 p-5 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-forest/5 border border-forest/10 shrink-0">
                                    <img
                                        src={logoSrc || DEFAULT_LOGO}
                                        alt={provider.name}
                                        className="w-full h-full object-cover"
                                        onError={() => setLogoSrc(DEFAULT_LOGO)}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-forest uppercase tracking-wider block truncate">
                                        {provider.name} ({provider.type})
                                    </span>
                                    <h4 className="font-display font-bold text-sm text-charcoal truncate">
                                        {provider.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {provider.location && (
                                            <span className="text-[11px] text-charcoal/60 flex items-center gap-0.5 truncate">
                                                <MapPin className="w-3 h-3 text-forest" />
                                                {provider.location}
                                            </span>
                                        )}
                                        <span className="text-charcoal/30">•</span>
                                        <span className="text-[11px] text-charcoal/60">
                                            {listings.length} {listings.length === 1 ? 'Inserat' : 'Inserate'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Form Body */}
                            <form onSubmit={handleSendDirectMessage} className="p-6 space-y-4 font-sans">
                                <div>
                                    <label className="block text-xs font-bold text-charcoal mb-1">
                                        Nachricht an {provider.name}
                                    </label>
                                    <p className="text-[11px] text-charcoal/60 mb-3">
                                        Starte eine direkte Unterhaltung. Deine Nachricht wird sicher über das Campuna-Nachrichtensystem zugestellt.
                                    </p>

                                    {/* Quick Preset Chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {[
                                            'Hallo, ich interessiere mich für deine Angebote!',
                                            'Bietest du Besichtigungstermine an?',
                                            'Ich habe eine allgemeine Frage zu deinen Leistungen.'
                                        ].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setContactMessage(preset)}
                                                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left ${contactMessage === preset
                                                    ? 'bg-forest text-sand border-forest font-semibold shadow-xs'
                                                    : 'bg-white hover:bg-sand/40 border-forest/15 text-charcoal/80'
                                                    }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        required
                                        rows={4}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder={`Schreibe deine Nachricht an ${provider.name}...`}
                                        className="w-full bg-sand/20 border border-forest/20 rounded-2xl p-3.5 text-xs text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsContactModalOpen(false)}
                                        className="px-5 py-2.5 rounded-full border border-forest/20 text-charcoal/70 hover:bg-sand/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingMessage || !contactMessage.trim()}
                                        className="px-6 py-2.5 rounded-full bg-forest hover:bg-gold text-white hover:text-forest text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {isSendingMessage ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Wird gesendet...</span>
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Nachricht senden</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

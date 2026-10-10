'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Mail,
    Globe,
    MessageSquare,
    Star,
    Eye,
    Info,
    ExternalLink,
    Megaphone,
    Phone,
    Building2,
    Package,
    Heart,
    ChevronLeft,
    ChevronRight,
    X,
    ShieldCheck,
    CheckCircle2,
    Calendar,
    Shield
} from 'lucide-react';
import { getPublicProfile } from '@/api/profile';
import { getListingsByUser } from '@/api/listings';
import { createOrGetConversation } from '@/api/conversations';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { PROVIDERS, STATIC_USERS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';
import { ListingBadgesRow } from '@/app/components/ListingBadge';
import { isListingBoosted } from '@/utils/sellerBadge';
import CategoriesSection from '@/app/components/CategoriesSection';
import ScrollSectionWrapper from '@/app/components/ScrollSectionWrapper';
import { formatPrice, formatCleanLocation, formatCondition, isListingSold } from '@/utils/formatters';

// Helper to escape characters for safe JSON-LD embedding (XSS protection)
function safeJsonLd(obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

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

function LinkedInIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
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



// ─── Normalizer & Listing Card (Matches Home Page ListingCard) ─────────────────

function normalizeListing(item) {
    if (!item) return null;

    const id = item.id || item._id || String(Math.random());
    const title = item.title || item.description || "Camping Angebot";
    const category = item.category || item.Category || 'Camping Zubehör';
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const pricePeriod = item.pricePeriod || 'Preis';
    const location = formatCleanLocation(item.location || "Deutschland");
    const slug = item.slug || buildListingSlug(title, id);

    let images = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        images = item.images;
    } else if (typeof item.images === 'string' && item.images.trim()) {
        images = [item.images];
    } else if (item["Main Image"]) {
        images = [item["Main Image"]];
    }
    
    images = images
        .map(img => getImageUrl(img, null))
        .filter(Boolean);

    const rawType = item.seller?.type || item.seller_type || item.listing_user_type || item.user_type || (item.company_name ? 'Gewerblich' : 'Privat');
    const sellerType = (rawType === 'COMMERCIAL' || rawType === 'Gewerblich') ? 'Gewerblich' : 'Privat';
    const sellerTier = sellerType === 'Gewerblich' ? (item.seller?.tier || item.company_tier || item.seller_tier || item.tier || 'FREE') : 'FREE';
    const isAdmin = item.seller_role === 'ADMIN' || item.role === 'ADMIN' || item.seller?.role === 'ADMIN';

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
        seller_type: sellerType,
        listing_user_type: sellerType,
        seller_tier: sellerTier,
        company_tier: sellerTier,
        tier: sellerTier,
        role: isAdmin ? 'ADMIN' : 'USER',
        seller_role: isAdmin ? 'ADMIN' : 'USER',
        seller: {
            name: item.seller?.name || (sellerType === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer'),
            type: sellerType,
            tier: sellerTier,
            role: isAdmin ? 'ADMIN' : 'USER',
            verified: true
        },
        features,
        featured: isFeatured,
        boosted_until: item.boosted_until,
        is_boosted: isBoosted
    };
}

import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';

const ListingCard = React.memo(({ item: rawItem }) => {
    const router = useRouter();
    const item = useMemo(() => normalizeListing(rawItem), [rawItem]);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(item?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const [imgIdx, setImgIdx] = useState(0);
    const [imgFailed, setImgFailed] = useState(false);
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

    const isBoosted = isListingBoosted(item);
    const hasImage = item.images && item.images.length > 0 && !imgFailed;

    return (
        <div
            onClick={handleCardClick}
            className={`listing-card group relative w-full flex flex-col h-full rounded-[24px] overflow-hidden transition-all duration-300 select-none cursor-pointer ${
                isBoosted
                    ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)]'
                    : 'bg-white border border-forest/5 hover:border-forest/10 hover:shadow-xl'
            }`}
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                {hasImage ? (
                    <img
                        src={item.images[imgIdx]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                        loading="lazy"
                        onError={() => {
                            if (imgIdx < item.images.length - 1) {
                                setImgIdx(i => i + 1);
                            } else {
                                setImgFailed(true);
                            }
                        }}
                    />
                ) : (
                    <ListingImagePlaceholder category={item.category} />
                )}
                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 gap-2">
                    <ListingBadgesRow item={item} />

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
                        {formatPrice(item.price)}
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
    const [coverSrc, setCoverSrc] = useState(null);
    const [logoSrc, setLogoSrc] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Chat / Message Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const handleOpenContactModal = () => {
        if (!isLoggedIn) {
            setIsAuthModalOpen(true);
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
                    logo: matchedStaticUser.logo || null,
                    cover: matchedStaticUser.coverImage || null,
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
                    isStrategic: Boolean(matchedStaticUser.isStrategic || matchedStaticUser.is_strategic_partner),
                    isBusiness: Boolean(matchedStaticUser.tier === 'BUSINESS' || matchedStaticUser.isBusiness),
                    tier: matchedStaticUser.tier || 'FREE',
                    achievements: matchedStaticUser.achievements || [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }],
                });

                setCoverSrc(matchedStaticUser.coverImage ? getImageUrl(matchedStaticUser.coverImage) : null);
                setLogoSrc(matchedStaticUser.logo ? getImageUrl(matchedStaticUser.logo) : null);

                setListings([]);
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
            });

            if (matchedMock) {
                setProvider({
                    id: matchedMock.id,
                    name: matchedMock.name,
                    type: matchedMock.sellerType || 'Gewerblich',
                    logo: matchedMock.logo || null,
                    cover: matchedMock.coverImage || null,
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
                    isStrategic: Boolean(matchedMock.isStrategic || matchedMock.is_strategic_partner),
                    isBusiness: Boolean(matchedMock.tier === 'BUSINESS' || matchedMock.isBusiness),
                    tier: matchedMock.tier || 'FREE',
                    achievements: [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }],
                });

                setCoverSrc(matchedMock.coverImage ? getImageUrl(matchedMock.coverImage) : null);
                setLogoSrc(matchedMock.logo ? getImageUrl(matchedMock.logo) : null);

                setListings([]);
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

                        const logo = p.logo_url || p.profile_image_url || null;
                        const cover = p.cover_image_url || null;

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
                            linkedin: p.linkedin_url || '',
                            address: p.company_address || p.location || '',
                            impressum: p.privacy_policy_url || '',
                            memberSince: formatMemberSince(p.member_since),
                            isStrategic: p.is_strategic_partner || false,
                            isBusiness: p.is_business || p.tier === 'BUSINESS' || p.is_strategic_partner || false,
                            tier: p.tier || 'FREE',
                            achievements: profileRes.data.achievements || [],
                        });

                        setCoverSrc(cover ? getImageUrl(cover) : null);
                        setLogoSrc(logo ? getImageUrl(logo) : null);

                        if (listingsRes.success && Array.isArray(listingsRes.data?.listings)) {
                            const rawListings = listingsRes.data.listings;
                            const seen = new Set();
                            const uniqueListings = rawListings.filter(item => {
                                const key = item.id || `${item.title}_${item.price}`;
                                if (seen.has(key)) return false;
                                seen.add(key);
                                return true;
                            });
                            setListings(uniqueListings);
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

    // ── Structured Data (ProfilePage & LocalBusiness/Organization) ───────────
    const providerStructuredData = useMemo(() => {
        if (!provider) return null;
        const isCommercial = provider.type !== 'Privat';
        return {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': isCommercial ? 'LocalBusiness' : 'Person',
                    '@id': `https://campuna.de/anbieter/${encodeURIComponent(rawSlug)}#seller`,
                    name: provider.name,
                    description: provider.bio || `${provider.name} auf Campuna.`,
                    image: logoSrc || undefined,
                    address: provider.location ? {
                        '@type': 'PostalAddress',
                        addressLocality: provider.location,
                        addressCountry: 'DE'
                    } : undefined,
                    telephone: provider.phone || undefined,
                    email: provider.email || undefined,
                    url: provider.website || `https://campuna.de/anbieter/${encodeURIComponent(rawSlug)}`,
                    sameAs: [
                        provider.website,
                        provider.instagram,
                        provider.facebook,
                        provider.linkedin
                    ].filter(Boolean)
                },
                {
                    '@type': 'ProfilePage',
                    '@id': `https://campuna.de/anbieter/${encodeURIComponent(rawSlug)}`,
                    url: `https://campuna.de/anbieter/${encodeURIComponent(rawSlug)}`,
                    name: `${provider.name} – Profil & Inserate | Campuna`,
                    mainEntity: {
                        '@id': `https://campuna.de/anbieter/${encodeURIComponent(rawSlug)}#seller`
                    }
                }
            ]
        };
    }, [provider, rawSlug, logoSrc]);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <CircleLoader size="lg" color="forest" fullPage />
        );
    }

    // ── Not Logged In Protection ───────────────────────────────────────────────
    if (mounted && !isLoggedIn) {
        return (
            <div className="min-h-screen bg-sand flex flex-col items-center justify-center pt-24 pb-16 px-4">
                <AuthRequiredModal
                    isOpen={true}
                    onClose={() => router.push('/')}
                    context="profile"
                    returnUrl={`/anbieter/${encodeURIComponent(rawSlug)}`}
                />
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
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal">
            {/* Schema.org Structured Data with XSS protection */}
            {providerStructuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: safeJsonLd(providerStructuredData) }}
                />
            )}

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
                <ScrollSectionWrapper delay={0.05}>
                    <section className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-lg mb-10 will-change-transform">

                        {/* Cover - Only for Commercial Business Users with custom uploaded cover */}
                        {provider.type !== 'Privat' && provider.isBusiness && coverSrc && (
                            <div className="relative w-full aspect-[3/1] md:aspect-[4.5/1] overflow-hidden bg-white border-b border-forest/10 flex items-center justify-center">
                                <img
                                    src={coverSrc}
                                    alt={`${provider.name} Banner`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}

                        {/* Private Profile Layout: Compact, Elegant & Balanced User Card */}
                        {provider.type === 'Privat' ? (
                            <div className="p-6 sm:p-8 md:p-9 bg-gradient-to-br from-white via-[#fcfbf9] to-[#faf7f0] flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-8">
                                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 flex-1 min-w-0 text-center sm:text-left">
                                    {/* Avatar */}
                                    <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full border-3 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0 select-none">
                                        {logoSrc ? (
                                            <img
                                                src={logoSrc}
                                                alt={`${provider.name} Avatar`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-forest to-[#0d381e] text-sand flex items-center justify-center font-display font-extrabold text-2xl sm:text-3xl tracking-wide">
                                                {provider.name?.slice(0, 2).toUpperCase() || 'CP'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Column */}
                                    <div className="space-y-2 flex-1 min-w-0">
                                        {/* Name & Badges */}
                                        <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">
                                                {provider.name}
                                            </h1>
                                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                Privatverkäufer
                                            </span>
                                            {(provider.is_pioneer || provider.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER')) && (
                                                <PioneerBadge size="sm" text="Pioneer" />
                                            )}
                                        </div>

                                        {/* Metadata Row: Member since, Location, Listings Count */}
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-charcoal/70">
                                            <span className="inline-flex items-center gap-1 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                                                Mitglied seit {provider.memberSince || '2024'}
                                            </span>
                                            {provider.location && (
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                                                    {provider.location}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-forest/5 text-forest font-bold text-[11px] border border-forest/10">
                                                <Star className="w-3 h-3 text-gold fill-gold shrink-0" />
                                                {listings.length === 1 ? '1 Inserat' : `${listings.length} Inserate`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Contact CTA */}
                                <div className="flex flex-col items-center md:items-end gap-2 shrink-0 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleOpenContactModal}
                                        className="w-full sm:w-auto md:min-w-[230px] bg-forest hover:bg-forest/90 text-white hover:text-sand transition-all duration-300 font-sans font-bold py-3.5 px-6 rounded-full shadow-md text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <MessageSquare className="w-4 h-4 text-sand shrink-0" />
                                        <span>Anbieter kontaktieren</span>
                                    </button>
                                    <span className="text-[11px] text-charcoal/50 font-medium flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                        Direkt im Campuna Chat schreiben
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 md:px-12 py-8 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-stretch">
                                <div className="flex flex-col sm:flex-row items-start gap-6 flex-1 max-w-3xl min-w-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 select-none">
                                        {logoSrc ? (
                                            <img
                                                src={logoSrc}
                                                alt={`${provider.name} Logo`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-forest to-[#0d381e] text-sand flex items-center justify-center font-display font-bold text-2xl">
                                                {provider.name?.slice(0, 2).toUpperCase() || 'CP'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Left — Info */}
                                    <div className="flex-1 space-y-5 min-w-0">
                                        {/* Name + Verified badge */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
                                                    {provider.name}
                                                </h1>
                                                {(provider.is_pioneer || provider.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER')) && (
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
                                        {(Boolean(provider.website || provider.instagram || provider.facebook || provider.linkedin)) && (
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
                                                {provider.linkedin && (
                                                    <a href={provider.linkedin} target="_blank" rel="noopener noreferrer"
                                                        title="LinkedIn"
                                                        className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm">
                                                        <LinkedInIcon />
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
                </ScrollSectionWrapper>

                {/* ── Listings Section ── */}
                <ScrollSectionWrapper delay={0.08}>
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
                                {listings.map((item, idx) => (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (idx % 4) * 0.06, duration: 0.4 }}
                                        className="h-full flex justify-center"
                                    >
                                        <ListingCard item={item} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </ScrollSectionWrapper>

                {/* ── Legal / Impressum Section ── */}
                {(provider.address || provider.email || provider.phone || provider.impressum) && (
                    <ScrollSectionWrapper delay={0.05}>
                        <section className="mb-12">
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
                    </ScrollSectionWrapper>
                )}

                {/* ── All Categories Section ── */}
                <ScrollSectionWrapper delay={0.05}>
                    <div className="mt-8">
                        <CategoriesSection
                            title="Camping hat viele Seiten. Wir bringen sie zusammen."
                            badge="KATEGORIEN"
                            showHeader={true}
                            align="center"
                            isDocked={false}
                        />
                    </div>
                </ScrollSectionWrapper>

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
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-forest/5 border border-forest/10 shrink-0 flex items-center justify-center">
                                    {logoSrc ? (
                                        <img
                                            src={logoSrc}
                                            alt={provider.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-forest text-gold flex items-center justify-center font-display font-bold text-lg">
                                            {provider.name?.slice(0, 2).toUpperCase() || 'CP'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-forest uppercase tracking-wider truncate">
                                            {provider.name} ({provider.type})
                                        </span>
                                        {(provider.is_pioneer || provider.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER')) && (
                                            <PioneerBadge size="xs" text="Pioneer" />
                                        )}
                                    </div>
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

            {/* ── Standard Auth Required Modal ── */}
            <AuthRequiredModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                context="chat"
                returnUrl={`/anbieter/${encodeURIComponent(rawSlug)}`}
            />
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    MapPin,
    ShieldCheck,
    Calendar,
    Eye,
    MessageSquare,
    Tag,
    Share2,
    Flag,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    X,
    Lock,
    AlertCircle,
    User,
    Check,
    Pencil
} from 'lucide-react';
import { getListingDetail, getAllListings } from '@/api/listings';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';

function slugifyTitle(title = '') {
    return title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseListingId(slug = '') {
    if (!slug) return '';
    const decoded = decodeURIComponent(slug);
    // 1. Try matching UUID (if appended at the end)
    const uuidMatch = decoded.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    if (uuidMatch) return uuidMatch[1];

    // 2. Try matching CP- style mock ID
    const cpMatch = decoded.match(/(CP-\w+)$/i);
    if (cpMatch) return cpMatch[1];

    // 3. Otherwise return the full slug directly (e.g. title-only slug)
    return decoded;
}

function buildListingSlug(title = '', id = '') {
    const cleanTitle = slugifyTitle(title);
    return cleanTitle || id;
}

function formatLocation(location) {
    if (!location) return 'Deutschland';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) return location.address;
    return 'Deutschland';
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug ? decodeURIComponent(params.slug) : '';
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(listing?.id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const currentUser = useAuthStore((state) => state.user);
    const [copied, setCopied] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [relatedListings, setRelatedListings] = useState([]);
    const relatedRowRef = useRef(null);

    const scrollRelated = (direction) => {
        if (relatedRowRef.current) {
            const scrollAmount = direction === 'left' ? -relatedRowRef.current.clientWidth : relatedRowRef.current.clientWidth;
            relatedRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Contact Modal States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isMessageSent, setIsMessageSent] = useState(false);

    // Report Modal States
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isSendingReport, setIsSendingReport] = useState(false);
    const [isReportSent, setIsReportSent] = useState(false);

    const listingId = parseListingId(slug);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    useEffect(() => {
        let active = true;
        setLoading(true);

        const fetchProductData = async () => {
            try {
                let foundListing = null;

                // 1. Try getListingDetail by ID
                if (listingId) {
                    try {
                        const res = await getListingDetail(listingId);
                        if (res.success && res.data?.listing) {
                            const apiMatch = res.data.listing;
                            const images = apiMatch.images && apiMatch.images.length > 0
                                ? apiMatch.images
                                : ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'];

                            foundListing = {
                                id: apiMatch.id,
                                title: apiMatch.title || 'Camping Angebot',
                                category: apiMatch.category || 'Camping Zubehör',
                                price: parseFloat(apiMatch.price) || 0,
                                pricePeriod: apiMatch.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                location: apiMatch.location || 'Deutschland',
                                displayLocation: apiMatch.location || 'Deutschland',
                                images,
                                seller: {
                                    name: apiMatch.seller?.name || (apiMatch.seller?.type === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer'),
                                    verified: true,
                                    type: apiMatch.seller?.type || 'Privat'
                                },
                                features: [apiMatch.condition, apiMatch.subcategory].filter(Boolean),
                                isNegotiable: apiMatch.negotiable || false,
                                description: apiMatch.description || '',
                                publishedDate: apiMatch.createdAt ? new Date(apiMatch.createdAt).toLocaleDateString('de-DE') : 'Neu eingestellt',
                                anzeigeNr: `CP-${apiMatch.id.slice(-4).toUpperCase()}`,
                                viewsCount: apiMatch.viewsCount || 1,
                                likesCount: 0,
                                chatsCount: 0,
                                condition: apiMatch.condition || 'Sehr gut',
                                status: apiMatch.status || 'Aktiv',
                                user_id: apiMatch.user_id || apiMatch.owner_user_id || apiMatch.seller?.id || null
                            };
                        }
                    } catch (apiErr) {
                        console.error("API error fetching listing detail:", apiErr);
                    }
                }

                // 2. If not found by direct ID, search in all database listings by title slug or ID
                if (!foundListing) {
                    try {
                        const res = await getAllListings();
                        if (res.success && Array.isArray(res.data?.listings)) {
                            const decodedSlug = slug.toLowerCase();
                            const match = res.data.listings.find(item => {
                                const titleSlug = slugifyTitle(item.title);
                                return (
                                    item.id?.toLowerCase() === decodedSlug ||
                                    titleSlug === decodedSlug ||
                                    item.id === listingId ||
                                    decodedSlug.includes(item.id?.toLowerCase())
                                );
                            });

                            if (match) {
                                const images = match.images && match.images.length > 0
                                    ? match.images
                                    : ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'];

                                foundListing = {
                                    id: match.id,
                                    title: match.title || 'Camping Angebot',
                                    category: match.category || 'Camping Zubehör',
                                    price: parseFloat(match.price) || 0,
                                    pricePeriod: match.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                    location: match.location || 'Deutschland',
                                    displayLocation: match.location || 'Deutschland',
                                    images,
                                    seller: {
                                        name: match.seller?.name || (match.seller?.type === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer'),
                                        verified: true,
                                        type: match.seller?.type || 'Privat'
                                    },
                                    features: [match.condition, match.subcategory].filter(Boolean),
                                    isNegotiable: match.negotiable || false,
                                    description: match.description || '',
                                    publishedDate: match.createdAt ? new Date(match.createdAt).toLocaleDateString('de-DE') : 'Neu eingestellt',
                                    anzeigeNr: `CP-${match.id.slice(-4).toUpperCase()}`,
                                    viewsCount: match.viewsCount || 1,
                                    likesCount: 0,
                                    chatsCount: 0,
                                    condition: match.condition || 'Sehr gut',
                                    status: match.status || 'Aktiv',
                                    user_id: match.user_id || match.owner_user_id || match.seller?.id || null
                                };
                            }
                        }
                    } catch (allErr) {
                        console.error("Error fetching all listings:", allErr);
                    }
                }

                if (active && foundListing) {
                    setListing(foundListing);
                    setActiveImageIdx(0);

                    // Fetch related listings from database
                    getAllListings().then(res => {
                        if (res.success && active) {
                            const dbListings = res.data.listings || [];
                            const mapped = dbListings.map(l => ({
                                id: l.id,
                                title: l.title || 'Camping Angebot',
                                price: parseFloat(l.price) || 0,
                                pricePeriod: l.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                location: l.location || 'Deutschland',
                                displayLocation: l.location || 'Deutschland',
                                images: l.images && l.images.length > 0 ? l.images : ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80']
                            }));
                            const related = mapped.filter(item => item.id !== foundListing.id);
                            setRelatedListings(related);
                        }
                    }).catch(err => {
                        console.error("Error loading related listings:", err);
                    });
                }
            } catch (err) {
                console.error("Error loading listing details:", err);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProductData();
        return () => { active = false; };
    }, [listingId]);

    const handleNextImage = (e) => {
        e.stopPropagation();
        if (listing && listing.images) {
            setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
        }
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        if (listing && listing.images) {
            setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReportListing = () => {
        setIsReportModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-sand/30 pt-20">
                <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-sans text-xs font-semibold text-forest uppercase tracking-widest animate-pulse">
                    Inserat wird geladen...
                </p>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-sand/20 px-4 pt-20">
                <AlertCircle className="w-16 h-16 text-yellow-600 mb-4 animate-bounce" />
                <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Inserat nicht gefunden</h1>
                <p className="text-sm text-charcoal/60 mb-6 text-center max-w-md">
                    Das gesuchte Inserat existiert leider nicht mehr oder wurde gelöscht.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3 px-6 rounded-full text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                    Zurück zur Startseite
                </button>
            </div>
        );
    }

    const {
        title,
        price,
        pricePeriod,
        displayLocation,
        images,
        seller,
        features,
        description,
        publishedDate = '22.04.2026',
        anzeigeNr = 'CP-1067',
        viewsCount = 11,
        likesCount = 0,
        chatsCount = 0,
        condition = 'Gut',
        status = 'Aktiv',
        isNegotiable = true
    } = listing;

    // Detect if this catalog item is flagged "sold" (either "verkauft" in title or status == 'Verkauft')
    const isSold = title.toLowerCase().includes('verkauft') || status.toLowerCase().includes('verkauft');

    const isOwner = Boolean(
        currentUser && listing && (
            (listing.user_id && String(currentUser.id) === String(listing.user_id)) ||
            (listing.owner_user_id && String(currentUser.id) === String(listing.owner_user_id)) ||
            (listing.ownerUserId && String(currentUser.id) === String(listing.ownerUserId))
        )
    );

    const displayTitle = title;

    const renderSidebarContent = () => (
        <div className="bg-white border border-[#eaeaea] shadow-md rounded-2xl p-6.5 space-y-6 text-center">
            {/* Price Info */}
            <div className="text-left border-b border-forest/5 pb-4">
                <span className="block text-[10px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1.5">
                    {pricePeriod}
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-forest">
                        {price.toLocaleString('de-DE')} €
                    </span>
                    {isNegotiable && (
                        <span className="text-xs font-semibold text-gold bg-beige/50 border border-forest/5 px-2 py-0.5 rounded">
                            VB
                        </span>
                    )}
                </div>
            </div>

            {/* Seller Details */}
            <div
                onClick={() => router.push(`/anbieter/${slugifyTitle(seller.name)}-${listing.user_id || listing.owner_user_id || listing.ownerUserId}`)}
                className="flex items-center gap-3 text-left border-b border-forest/5 pb-4 cursor-pointer group/seller hover:opacity-90 transition-opacity"
            >
                <div className="w-12 h-12 rounded-full bg-forest flex items-center justify-center text-white font-display text-lg font-bold select-none shadow shrink-0 group-hover/seller:ring-2 group-hover/seller:ring-gold/50 transition-all">
                    {seller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-charcoal sm:text-base leading-tight group-hover/seller:text-forest transition-colors">
                            {seller.name}
                        </span>
                        {seller.verified && (
                            <ShieldCheck className="w-4.5 h-4.5 text-forest shrink-0 fill-forest/15" />
                        )}
                        {seller.achievements?.find(a => a.badge_key === 'CAMPUNA_PIONEER') && (
                            <div
                                className="flex items-center gap-1 bg-forest/5 border border-forest/20 text-forest rounded-full px-2 py-0.5 text-[10px] font-bold font-sans shadow-sm cursor-help"
                                title="Campuna Pioneer"
                            >
                                <img
                                    src="/pioneer_badge.png"
                                    alt="Campuna Pioneer Badge"
                                    className="w-4 h-4 rounded-full object-cover border border-gold/30"
                                />
                                <span>Pioneer</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[11px] text-charcoal/50 font-bold">
                        {seller.name} ({seller.type}er Nutzer)
                    </span>
                </div>
            </div>

            {/* 0. Owner Quick Action */}
            {isOwner && (
                <div className="bg-forest/5 border border-forest/20 rounded-xl p-3.5 text-left mb-2">
                    <p className="text-[11px] font-bold text-forest mb-2 flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Sie sind der Eigentümer
                    </p>
                    <Link
                        href={`/anzeige-erstellen?edit=${listing.id}`}
                        className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-200 font-sans font-bold py-2.5 px-4 rounded-lg shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5 shrink-0" />
                        Inserat bearbeiten
                    </Link>
                </div>
            )}

            {/* 1. Primary CTA: Contact Seller */}
            <div className="space-y-1.5">
                {isSold ? (
                    <div className="bg-red-50 border border-red-200/50 p-4 rounded-xl flex items-start text-left gap-2.5">
                        <Lock className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800 leading-relaxed font-light">
                            <strong>Inserat Verkauft:</strong> Dieses Fahrzeug wurde erfolgreich verkauft. Die Kontaktaufnahme ist geschlossen.
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="w-full bg-[#2a7f55] hover:bg-[#206040] text-white transition-colors duration-300 font-sans font-bold py-3.5 px-6 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                            <MessageSquare className="w-4 h-4 shrink-0" />
                            Verkäufer kontaktieren
                        </button>
                        <span className="block text-[10px] text-charcoal/45 font-medium text-center">
                            Nachricht direkt an den Verkäufer senden
                        </span>
                    </>
                )}
            </div>

            {/* 2. Side-by-side Row: Melden & Speichern */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                    onClick={handleReportListing}
                    className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                >
                    <Flag className="w-4 h-4 shrink-0" />
                    Melden
                </button>

                <button
                    onClick={() => toggleFavorite(listing)}
                    className="bg-white hover:bg-sand/15 border border-forest/15 text-charcoal font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                >
                    <Heart className={`w-4 h-4 shrink-0 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-charcoal/60'}`} />
                    {isFavorite ? 'Gespeichert' : 'Speichern'}
                </button>
            </div>

            {/* 3. Marketplace Policy notice */}
            <p className="text-[10px] text-charcoal/50 leading-relaxed text-center select-none font-medium pt-2">
                Campuna ist ein Marktplatz.<br />
                Der Kauf erfolgt direkt zwischen Käufer und Verkäufer.
            </p>

            {/* 4. Footer actions: Copy Link & User Type Badge */}
            <div className="space-y-3 pt-2">
                <button
                    onClick={handleCopyLink}
                    className="w-full bg-[#2a7f55] hover:bg-[#206040] text-white transition-colors duration-300 font-sans font-bold py-3 px-6 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-white" />
                            <span>Link kopiert!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-4 h-4 text-white/90" />
                            <span>Link kopieren</span>
                        </>
                    )}
                </button>


            </div>
        </div>
    );

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal pt-24 sm:pt-28 pb-16">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

                {/* ── Breadcrumbs and Back Button ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-xs md:text-sm font-semibold text-charcoal/50 hover:text-forest transition-colors group cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Zurück
                    </button>
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* 🚀 Boosted Badge */}
                        {(listing.is_boosted || (listing.boosted_until && new Date(listing.boosted_until) > new Date())) && (
                            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md border border-yellow-100/90 flex items-center gap-1.5">
                                <span>🚀</span>
                                <span>BOOSTED</span>
                            </span>
                        )}

                        {/* ⭐ Featured / Empfohlen Badge */}
                        {listing.featured && (
                            <span className="bg-gradient-to-r from-forest via-[#0d592a] to-emerald-800 text-sand text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md border border-emerald-400/40 flex items-center gap-1.5">
                                <span>⭐</span>
                                <span>EMPFOHLEN VON CAMPUNA</span>
                            </span>
                        )}

                        {isSold && (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" />
                                Verkauft
                            </span>
                        )}
                        <span className="bg-sand text-forest border border-forest/15 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                            Zustand: {condition}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${status.toLowerCase() === 'aktiv'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            }`}>
                            Status: {isSold ? 'Verkauft' : status}
                        </span>
                    </div>
                </div>

                {/* ── Owner Info Banner (if owner) ── */}
                {isOwner && (
                    <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-forest/10 via-emerald-50 to-sand/30 border border-forest/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Pencil className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-forest text-sm sm:text-base">
                                    Dies ist Ihr Inserat
                                </h3>
                                <p className="text-xs text-charcoal/70">
                                    Sie können alle Angaben, Bilder und Preise jederzeit bearbeiten.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/anzeige-erstellen?edit=${listing.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest hover:bg-gold text-white hover:text-forest font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow hover:shadow-md shrink-0 cursor-pointer"
                        >
                            <Pencil className="w-4 h-4" />
                            Inserat bearbeiten
                        </Link>
                    </div>
                )}

                {/* ── Main Listing Header Area ── */}
                <div className="mb-8">
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-charcoal tracking-tight leading-tight mb-4">
                        {displayTitle}
                    </h1>

                    {/* Quick Stats Bar */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 py-4.5 border-y border-forest/5 text-xs text-charcoal/60">
                        <div className="flex items-center gap-1.5 font-medium text-charcoal/80">
                            <MapPin className="w-4 h-4 text-gold shrink-0" />
                            <span>{displayLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gold shrink-0" />
                            <span>Veröffentlicht am: {publishedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-gold shrink-0" />
                            <span>Anzeige Nr: {anzeigeNr}</span>
                        </div>
                        <div className="flex items-center gap-4.5 sm:ml-auto">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {viewsCount} Aufrufe</span>
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {likesCount} Merkzettel</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {chatsCount} Unterhaltungen</span>
                        </div>
                    </div>
                </div>

                {/* ── Dynamic Layout Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Gallery & Details (8/12 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* ── Professional Image Gallery ── */}
                        <div className="space-y-3">
                            <div className="relative aspect-[16/10] w-full rounded-2xl md:rounded-3xl overflow-hidden bg-sand/15 border border-forest/5 group">
                                <img
                                    src={images[activeImageIdx]}
                                    alt={`${title} view`}
                                    className="w-full h-full object-cover transition-transform duration-[0.8s] group-hover:scale-[1.02] cursor-zoom-in"
                                    onClick={() => setIsGalleryModalOpen(true)}
                                />

                                {/* Overlay Controls */}
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-forest shadow-md flex items-center justify-center transition-colors feedback-active select-none"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-forest shadow-md flex items-center justify-center transition-colors feedback-active select-none"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                {/* Gallery Count Badge */}
                                <span className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full select-none">
                                    {activeImageIdx + 1} / {images.length}
                                </span>

                                {/* Fullscreen Overlay Button */}
                                <button
                                    onClick={() => setIsGalleryModalOpen(true)}
                                    className="absolute bottom-4 right-4 bg-white hover:bg-sand/90 text-forest text-[10px] md:text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full shadow-lg transition-colors duration-200 cursor-pointer"
                                >
                                    Alle Fotos anzeigen
                                </button>
                            </div>

                            {/* Thumbnails Row */}
                            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIdx(idx)}
                                        className={`relative aspect-[16/10] w-20 sm:w-24 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${activeImageIdx === idx
                                            ? 'border-forest ring-2 ring-forest/10 scale-95 shadow-md'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt={`thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mobile/Tablet Price Card & Seller Box (hidden on desktop) */}
                        <div className="block lg:hidden mt-2 mb-6">
                            {renderSidebarContent()}
                        </div>



                        {/* ── Description Section ── */}
                        <section className="space-y-4">
                            <h2 className="font-display text-lg font-bold text-forest uppercase tracking-wider">
                                Beschreibung
                            </h2>
                            <div className="relative">
                                <div
                                    className={`text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-light overflow-hidden transition-all duration-505 ${isDescriptionExpanded ? 'max-h-[5000px]' : 'max-h-[220px]'
                                        }`}
                                >
                                    {description}
                                </div>

                                {/* Fade overlay for collapsed view */}
                                {!isDescriptionExpanded && (
                                    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                )}
                            </div>

                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="text-xs font-bold uppercase tracking-widest text-forest hover:text-gold transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer py-1"
                            >
                                <span>{isDescriptionExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
                                <span className={`transform transition-transform inline-block ${isDescriptionExpanded ? 'rotate-180' : ''}`}>↓</span>
                            </button>
                        </section>

                        {/* ── Privacy Friendly Location Map ── */}
                        <section className="space-y-4 pt-6 border-t border-forest/10">
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-lg font-bold text-forest uppercase tracking-wider">
                                    Standort (ungefähr)
                                </h2>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 bg-sand px-2.5 py-1 rounded border border-forest/5">
                                    PLZ-Schutz Aktiv
                                </span>
                            </div>
                            <p className="text-xs text-charcoal/50 leading-relaxed font-light">
                                Um die Privatsphäre des Verkäufers zu schützen, wird das Fahrzeug in einem Radius von ca. 3 km um den tatsächlichen Standort angezeigt. Der exakte Übergabeort wird nach Absprache vereinbart.
                            </p>

                            {/* Render authentic Google Maps iframe */}
                            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-forest/10 shadow-sm">
                                <iframe
                                    src={anzeigeNr === 'CP-1067'
                                        ? "https://maps.google.com/maps?q=52.4957342,8.3570299&t=&z=9&ie=UTF8&iwloc=&output=embed"
                                        : `https://maps.google.com/maps?q=${encodeURIComponent(listing.location || 'Deutschland')}&t=&z=13&ie=UTF8&iwloc=&output=embed`
                                    }
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    title="Campuna Standort Map"
                                ></iframe>
                            </div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN: Price Card & Seller Box (4/12 cols) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 hidden lg:block">
                        {renderSidebarContent()}
                    </div>

                </div>

                {/* ── RELATED PRODUCTS SECTION (Spans full page width below columns) ── */}
                {relatedListings.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-forest/10 space-y-6 text-left">
                        <div className="flex flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                                    STÖBERN
                                </span>
                                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black">
                                    Weitere Anzeigen in dieser Kategorie
                                </h3>
                            </div>

                            {/* Navigation Arrows in Same Row on Desktop (only if > 4 items) */}
                            {relatedListings.length > 4 && (
                                <div className="hidden md:flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => scrollRelated('left')}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-forest/15 bg-white text-forest hover:bg-forest hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
                                        aria-label="Vorherige Angebote"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => scrollRelated('right')}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-forest/15 bg-white text-forest hover:bg-forest hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
                                        aria-label="Nächste Angebote"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            ref={relatedRowRef}
                            className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth no-scrollbar"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {relatedListings.map((item) => {
                                const slug = buildListingSlug(item.title, item.id);
                                const userType = item.listing_user_type || (item.seller?.type === 'Gewerblich' ? 'Gewerblich' : 'Privat');
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => router.push(`/inserate/${slug}`)}
                                        className="group relative flex flex-col bg-white rounded-[24px] overflow-hidden border border-forest/5 hover:border-forest/10 hover:shadow-xl transition-all duration-300 cursor-pointer h-full shrink-0 w-[270px] sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] snap-start text-left"
                                    >
                                        {/* Image Area */}
                                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20">
                                            <img
                                                src={item.images[0]}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-[0.8s] ease-out group-hover:scale-105 pointer-events-none"
                                                referrerPolicy="no-referrer"
                                                loading="lazy"
                                            />

                                            {/* Top Bar inside image card */}
                                            <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                                                <span className="bg-forest flex items-center gap-1 justify-center text-gold text-[8px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md font-sans">
                                                    <ShieldCheck className="w-3 h-3 text-gold" />
                                                    {userType}
                                                </span>
                                            </div>

                                            {/* Location overlay */}
                                            <div className="absolute bottom-4 right-0 inset-x-4 flex items-center justify-end pointer-events-none text-white/90">
                                                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] flex items-center gap-1 font-sans">
                                                    <MapPin className="w-3 h-3 text-gold shrink-0" />
                                                    <span>{item.displayLocation || item.location}</span>
                                                </div>
                                            </div>

                                            {/* Hover CTA */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="bg-white text-forest px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                                                    <Eye className="w-4 h-4" />
                                                    <span>Inserat ansehen</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                                            <div>
                                                {/* Title */}
                                                <h3 className="font-display text-sm font-semibold text-black group-hover:text-gold transition-colors duration-200 mb-2 line-clamp-2 leading-snug">
                                                    {item.title}
                                                </h3>

                                                {/* Features chips */}
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {(item.features || []).slice(0, 3).map((feat, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] text-charcoal/60 bg-sand px-2 py-1 rounded-md border border-forest/5 font-sans"
                                                        >
                                                            {feat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Pricing & CTA Line */}
                                            <div className="pt-2 border-t border-forest/5 flex items-end justify-between font-sans">
                                                <div>
                                                    <span className="block text-[10px] uppercase tracking-widest text-[#9c9c9c] font-mono leading-none mb-0.5">
                                                        {item.pricePeriod || 'Kaufpreis'}
                                                    </span>
                                                    <span className="font-display text-sm font-extrabold text-forest">
                                                        {item.price.toLocaleString('de-DE')} €
                                                    </span>
                                                </div>

                                                <span className="font-sans text-[10px] font-bold text-forest group-hover:text-gold flex items-center space-x-1 transition-colors">
                                                    <span>Details</span>
                                                    <span className="transform group-hover:translate-x-1 transition-transform inline-block">→</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile Navigation Arrows at Bottom (only if > 1 item) */}
                        {relatedListings.length > 1 && (
                            <div className="flex md:hidden items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => scrollRelated('left')}
                                    className="w-9 h-9 rounded-full border border-forest/15 bg-white text-forest hover:bg-forest hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
                                    aria-label="Vorherige Angebote"
                                >
                                    <ChevronLeft className="w-4.5 h-4.5" />
                                </button>
                                <button
                                    onClick={() => scrollRelated('right')}
                                    className="w-9 h-9 rounded-full border border-forest/15 bg-white text-forest hover:bg-forest hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
                                    aria-label="Nächste Angebote"
                                >
                                    <ChevronRight className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        )}
                    </section>
                )}


            </div>

            {/* ── Fullscreen Gallery Modal ── */}
            <AnimatePresence>
                {isGalleryModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 sm:p-8"
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsGalleryModalOpen(false);
                            if (e.key === 'ArrowRight') handleNextImage(e);
                            if (e.key === 'ArrowLeft') handlePrevImage(e);
                        }}
                        tabIndex={0}
                    >
                        <button
                            onClick={() => setIsGalleryModalOpen(false)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors z-[10000]"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative max-w-5xl w-full h-[70vh] flex items-center justify-center">
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-0 sm:left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors select-none"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            <img
                                src={images[activeImageIdx]}
                                alt={`${title} modal`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />

                            <button
                                onClick={handleNextImage}
                                className="absolute right-0 sm:right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors select-none"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Thumbnails row at bottom of modal */}
                        <div className="flex gap-2 max-w-full overflow-x-auto mt-6 no-scrollbar pb-1 select-none">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIdx(idx)}
                                    className={`relative aspect-[16/10] w-16 sm:w-20 rounded-md overflow-hidden shrink-0 border-2 ${activeImageIdx === idx ? 'border-gold' : 'border-transparent opacity-40'
                                        }`}
                                >
                                    <img src={img} alt={`thumbnail ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Contact Modal popup ── */}
            <AnimatePresence>
                {isContactModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col relative text-left max-h-[90vh]"
                    >
                        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setIsContactModalOpen(false);
                                    setIsMessageSent(false);
                                }}
                                className="absolute top-4 right-4 text-charcoal/45 hover:text-charcoal bg-white/90 hover:bg-white p-2 rounded-full transition-all shadow-sm hover:shadow z-25 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Product Summary Card content container with custom vertical scroll */}
                            <div className="bg-[#fcfbf9] p-6 flex flex-col justify-between overflow-y-auto">
                                <div className="space-y-3">
                                    <span className="inline-block bg-[#2a7f55]/10 text-[#2a7f55] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md font-sans">
                                        Inserat Details
                                    </span>

                                    {/* Campuna entry image */}
                                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#eaeaea] shadow-sm bg-white select-none">
                                        <img
                                            src={listing.images[0] || '/hero-campuna.webp'}
                                            alt="Campuna-Eintragsbild"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Dynamic Title, Specs & Price */}
                                    <div className="space-y-3">
                                        <h4 className="font-display font-bold text-sm text-black leading-tight">
                                            {listing.title}
                                        </h4>
                                        <div className="text-[11px] text-charcoal/60 space-y-1.5 font-sans leading-relaxed border-t border-[#eaeaea] pt-3">
                                            {anzeigeNr === 'CP-1067' ? (
                                                <>
                                                    <p>• Ez.: 2008</p>
                                                    <p>• Gesamtgewicht: 2.000 kg</p>
                                                    <p>• 7 Schlafplätze</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p>• Ez.: 02/2023</p>
                                                    <p>• 63000 km</p>
                                                    <p>• Citroen, 140 PS, 6-Gang-Schalter</p>
                                                    <p>• L/B/H 696/232/292 cm</p>
                                                    <p>• 3.500 kg zul. Gesamtgewicht</p>
                                                    <p>• 4 Sitzplätze (im Fahrbetrieb)</p>
                                                    <p>• 4 Schlafplätze, Einzelbetten, Hubbett</p>
                                                    <p>• großer Kühlschrank, Gefrierschrank</p>
                                                    <p>• geräumiges Schwenkbad</p>
                                                    <p>• Markise, Rückfahrkamera</p>
                                                    <p>• Sat-TV-Anlage, Fahrradträger</p>
                                                    <p>• große Heckgarage</p>
                                                    <p>• Fahrzeug aus Vermietung</p>
                                                    <p>• sofort verfügbar, MwSt. ausweisbar</p>
                                                    <p className="text-[#2a7f55] font-semibold mt-1">
                                                        • andere Kauf- und Mietfahrzeuge unter: www.duemmermobile.de
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-sans">
                                        <span className="bg-white px-2 py-1 rounded border border-gray-100 shadow-2xs font-semibold">
                                            {listing.category?.name || 'Kategorie'}
                                        </span>
                                        {listing.condition && (
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100 shadow-2xs font-semibold">
                                                {listing.condition}
                                            </span>
                                        )}
                                        {listing.location && (
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100 shadow-2xs font-semibold">
                                                {listing.location}
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-display font-black text-xl text-[#2a7f55]">
                                        {listing.price_formatted || (listing.price ? `€ ${Number(listing.price).toLocaleString('de-DE')}` : 'Auf Anfrage')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Messaging Form Body or Success Message */}
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                            {isMessageSent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 flex flex-col items-center text-center space-y-4 font-sans"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[#2a7f55]/10 text-[#2a7f55] flex items-center justify-center">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display font-bold text-2xl text-charcoal">Nachricht übermittelt!</h3>
                                    <p className="text-xs text-charcoal/60 max-w-sm leading-relaxed">
                                        Deine Anfrage wurde direkt an den Verkäufer weitergeleitet. Du erhältst eine Kopie sowie die Antwort per E-Mail.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsContactModalOpen(false);
                                            setIsMessageSent(false);
                                        }}
                                        className="mt-4 px-6 py-2.5 rounded-full bg-sand text-charcoal hover:bg-beige text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Schließen
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-4 font-sans">
                                    <div className="space-y-1">
                                        <h3 className="font-display font-bold text-xl text-charcoal">
                                            Nachricht an Verkäufer
                                        </h3>
                                        <p className="text-[11px] text-charcoal/50">
                                            Kontaktiere {listing.user?.first_name || 'den Inserenten'} direkt über unser sicheres Campuna-Nachrichtensystem.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <div className="space-y-1 text-left">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60">
                                                Dein Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={contactForm.sender_name}
                                                onChange={(e) => setContactForm({ ...contactForm, sender_name: e.target.value })}
                                                placeholder="Max Mustermann"
                                                className="w-full bg-sand/30 border border-beige/80 rounded-xl px-3 py-2 text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-[#2a7f55]"
                                            />
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60">
                                                Deine E-Mail *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={contactForm.sender_email}
                                                onChange={(e) => setContactForm({ ...contactForm, sender_email: e.target.value })}
                                                placeholder="max@beispiel.de"
                                                className="w-full bg-sand/30 border border-beige/80 rounded-xl px-3 py-2 text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-[#2a7f55]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60">
                                            Telefonnummer (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            value={contactForm.sender_phone}
                                            onChange={(e) => setContactForm({ ...contactForm, sender_phone: e.target.value })}
                                            placeholder="+49 170 1234567"
                                            className="w-full bg-sand/30 border border-beige/80 rounded-xl px-3 py-2 text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-[#2a7f55]"
                                        />
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60">
                                            Deine Nachricht *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                            placeholder="Guten Tag, ich interessiere mich für Ihr Inserat. Ist das Fahrzeug noch verfügbar?..."
                                            className="w-full bg-sand/30 border border-beige/80 rounded-xl p-3 text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-[#2a7f55] resize-none"
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsContactModalOpen(false)}
                                            className="px-5 py-2.5 rounded-full border border-beige/80 text-charcoal/70 hover:bg-sand text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSendingMessage}
                                            className="px-6 py-2.5 rounded-full bg-[#2a7f55] hover:bg-[#206342] text-sand text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                            {isSendingMessage ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Nachricht senden</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>

                )
                }
            </AnimatePresence >


            {/* ── Report Modal popup ── */}
            < AnimatePresence >
                {isReportModalOpen && (
                    <motion.div
                        key="report-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col relative text-left max-h-[90vh]"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setIsReportModalOpen(false);
                                    setIsReportSent(false);
                                }}
                                className="absolute top-4 right-4 text-charcoal/45 hover:text-charcoal bg-white/90 hover:bg-white p-2 rounded-full transition-all shadow-sm hover:shadow z-25 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Scrollable Content Container */}
                            <div className="bg-[#fcfbf9] p-6 flex flex-col gap-5 overflow-y-auto">
                                {isReportSent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-12 flex flex-col items-center text-center space-y-4 font-sans"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Check className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-display font-bold text-2xl text-charcoal">Meldung eingegangen</h3>
                                        <p className="text-xs text-charcoal/60 max-w-sm leading-relaxed">
                                            Vielen Dank für deine Mithilfe! Unser Moderationsteam prüft diesen Eintrag umgehend nach unseren Community-Richtlinien.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setIsReportModalOpen(false);
                                                setIsReportSent(false);
                                            }}
                                            className="mt-4 px-6 py-2.5 rounded-full bg-sand text-charcoal hover:bg-beige text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Schließen
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4 font-sans">
                                        <div className="space-y-1">
                                            <h3 className="font-display font-extrabold text-lg text-black">
                                                Anzeige melden
                                            </h3>
                                            <p className="text-xs text-charcoal/60 leading-relaxed font-light font-sans">
                                                Wenn dir etwas an dieser Anzeige ungewöhnlich oder nicht passend erscheint, kannst du uns hier einen Hinweis geben. Wir prüfen jede Meldung sorgfältig.
                                            </p>
                                        </div>

                                        <div className="space-y-2 font-sans">
                                            <label className="block text-xs font-semibold text-charcoal">
                                                Was ist dir an dieser Anzeige aufgefallen?
                                            </label>
                                            <textarea
                                                value={reportReason}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                placeholder="Schreibe hier deine Anmerkungen..."
                                                className="w-full h-32 border border-[#eaeaea] rounded-xl p-3.5 text-xs text-charcoal focus:border-[#2a7f55] focus:outline-none focus:ring-1 focus:ring-[#2a7f55] leading-relaxed resize-none font-sans bg-white"
                                            />
                                        </div>

                                        <div className="space-y-2.5 font-sans pt-2">
                                            <button
                                                onClick={async () => {
                                                    setIsSendingReport(true);
                                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                                    setIsSendingReport(false);
                                                    setIsReportSent(true);
                                                }}
                                                disabled={isSendingReport || !reportReason.trim()}
                                                className="w-full bg-[#2a7f55] hover:bg-[#206040] disabled:bg-charcoal/10 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                                            >
                                                {isSendingReport ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Wird gesendet...</span>
                                                    </>
                                                ) : (
                                                    <span>Hinweis senden</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

        </div >
    );
}

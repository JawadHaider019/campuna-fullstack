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
    Pencil,
    ShieldAlert,
    AlertTriangle,
    Ban,
    Image as ImageIcon,
    Folder,
    Clock,
    ChevronDown,
    Rocket,
    Crown,
    Phone,
    PhoneCall,
    Copy,
    Send,
    Mail,
    MessageCircle,
    UserPlus,
    Shield,
    Briefcase,
    Building2,
    Trash2,
    Pause,
    Play
} from 'lucide-react';
import { getListingDetail, getAllListings, reportListing, deleteListing, toggleListingStatus } from '@/api/listings';
import { createOrGetConversation } from '@/api/conversations';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATIC_LISTINGS } from '@/data';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUrl';
import PioneerBadge from '@/app/components/PioneerBadge';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';
import { SellerAccountBadge, PromotedBadge, ListingBadgesRow } from '@/app/components/ListingBadge';
import CategoriesSection from '@/app/components/CategoriesSection';
import { isListingBoosted } from '@/utils/sellerBadge';
import ListingImagePlaceholder from '@/app/components/ListingImagePlaceholder';

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

const REPORT_REASONS = [
    {
        id: 'SCAM',
        icon: Flag,
        colorClass: 'text-rose-600 bg-rose-50 border-rose-200',
        label: 'Betrug / Scam',
        desc: 'Verdacht auf Fake-Profil, Betrug oder Vorkasse-Aufforderung'
    },
    {
        id: 'FALSE_INFORMATION',
        icon: AlertTriangle,
        colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
        label: 'Falsche Angaben',
        desc: 'Preis, Kilometerstand, Baujahr oder Zustand stimmen nicht'
    },
    {
        id: 'PROHIBITED_CONTENT',
        icon: Ban,
        colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
        label: 'Unzulässiger Inhalt',
        desc: 'Verstoß gegen Campuna-Richtlinien oder geltendes Recht'
    },
    {
        id: 'INAPPROPRIATE_IMAGE',
        icon: ImageIcon,
        colorClass: 'text-pink-600 bg-pink-50 border-pink-200',
        label: 'Unangemessene Bilder',
        desc: 'Anstößige Fotos, Urheberrechtsverletzung oder fremde Bilder'
    },
    {
        id: 'WRONG_CATEGORY',
        icon: Folder,
        colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
        label: 'Falsche Kategorie',
        desc: 'Inserat gehört in eine andere Kategorie'
    },
    {
        id: 'NO_LONGER_AVAILABLE',
        icon: Clock,
        colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
        label: 'Nicht mehr verfügbar',
        desc: 'Fahrzeug oder Zubehör bereits verkauft oder nicht mehr erhältlich'
    },
    {
        id: 'OTHER',
        icon: MessageSquare,
        colorClass: 'text-slate-700 bg-slate-100 border-slate-200',
        label: 'Sonstiges',
        desc: 'Anderer wichtiger Hinweis an das Campuna-Team'
    }
];

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
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
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

    // Share Modal States
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Privacy Gate Modal States (for non-registered users viewing phone / contact)
    const [isPrivacyAuthModalOpen, setIsPrivacyAuthModalOpen] = useState(false);
    const [privacyModalContext, setPrivacyModalContext] = useState('contact'); // 'contact' | 'phone'

    // Contact / Chat Modal States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("Guten Tag, ich interessiere mich für Ihr Inserat. Ist das Angebot noch verfügbar?");
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Report Modal States
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReasonCategory, setReportReasonCategory] = useState('SCAM');
    const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const [isSendingReport, setIsSendingReport] = useState(false);
    const [isReportSent, setIsReportSent] = useState(false);

    // Clean, GDPR-compliant Share URL (contains referral code if logged in, zero personal data)
    const getCleanShareUrl = () => {
        if (typeof window === 'undefined') return '';
        const base = window.location.origin;
        const refSuffix = currentUser?.referral_code ? `?ref=${encodeURIComponent(currentUser.referral_code)}` : '';
        return `${base}/inserate/${encodeURIComponent(slug)}${refSuffix}`;
    };

    const handleShareLink = async () => {
        if (!currentUser && !isLoggedIn) {
            setPrivacyModalContext('share');
            setIsPrivacyAuthModalOpen(true);
            return;
        }

        const shareUrl = getCleanShareUrl();
        const shareTitle = listing?.title || 'Camping Inserat auf Campuna';
        const shareText = `Schau dir dieses Angebot auf Campuna an: ${shareTitle}`;

        if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        setIsShareModalOpen(true);
    };

    const handleCopyCleanUrl = () => {
        const url = getCleanShareUrl();
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link kopiert! Keine privaten Kontaktdaten enthalten.', { icon: '🔒' });
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        const url = getCleanShareUrl();
        const text = encodeURIComponent(`Schau dir dieses Angebot auf Campuna an:\n${listing?.title || 'Camping Inserat'}\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleShareEmail = () => {
        const url = getCleanShareUrl();
        const subject = encodeURIComponent(`Camping-Inserat: ${listing?.title || 'Angebot auf Campuna'}`);
        const body = encodeURIComponent(`Hallo,\n\nich habe dieses interessante Angebot auf Campuna entdeckt:\n\n${listing?.title || ''}\nPreis: ${listing?.price ? `${listing.price.toLocaleString('de-DE')} €` : ''}\nStandort: ${listing?.displayLocation || 'Deutschland'}\n\nLink zum Inserat:\n${url}\n\nBeste Grüße`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const handleOpenContactModal = () => {
        if (!currentUser && !isLoggedIn) {
            setPrivacyModalContext('chat');
            setIsPrivacyAuthModalOpen(true);
            return;
        }
        if (isOwner) {
            toast.error('Du bist der Eigentümer dieses Inserats.');
            return;
        }
        setIsContactModalOpen(true);
    };

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!listing?.id) return;
        setIsDeleting(true);
        try {
            const res = await deleteListing(listing.id);
            if (res.success || res.status === 200) {
                toast.success('Inserat erfolgreich gelöscht.');
                setIsDeleteModalOpen(false);
                router.push('/mein-konto');
            } else {
                toast.error(res.error || res.message || 'Fehler beim Löschen des Inserats.');
            }
        } catch (err) {
            console.error('Error deleting listing:', err);
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Löschen des Inserats.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRevealPhone = () => {
        if (!currentUser && !isLoggedIn) {
            setPrivacyModalContext('phone');
            setIsPrivacyAuthModalOpen(true);
            return;
        }
    };

    const handleSendDirectMessage = async (e) => {
        if (e) e.preventDefault();
        if (!contactMessage || !contactMessage.trim()) {
            toast.error('Bitte gib eine Nachricht ein.');
            return;
        }
        if (!listing?.id) return;

        setIsSendingMessage(true);
        try {
            const res = await createOrGetConversation(listing.id, contactMessage.trim());
            const convId = res.conversation_id || res.data?.conversation_id;
            if (res.success && convId) {
                toast.success('Unterhaltung gestartet!');
                setIsContactModalOpen(false);
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

                // 1. Try getListingDetail by ID or Slug
                if (listingId) {
                    try {
                        const res = await getListingDetail(listingId);
                        if (res.success && res.data?.listing) {
                            const apiMatch = res.data.listing;
                            const rawImages = Array.isArray(apiMatch.images)
                                ? apiMatch.images
                                : (typeof apiMatch.images === 'string' && apiMatch.images.trim() ? [apiMatch.images] : []);
                            const images = rawImages
                                .map(img => getImageUrl(img, null))
                                .filter(Boolean);
                            const isPioneer = Boolean(apiMatch.is_pioneer || apiMatch.seller?.is_pioneer || apiMatch.seller?.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER'));
                            foundListing = {
                                id: apiMatch.id,
                                title: apiMatch.title || 'Camping Angebot',
                                category: apiMatch.category || 'Camping Zubehör',
                                price: parseFloat(apiMatch.price) || 0,
                                pricePeriod: apiMatch.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                location: apiMatch.location || 'Deutschland',
                                displayLocation: apiMatch.location || 'Deutschland',
                                images,
                                is_campuna_club: Boolean(apiMatch.is_campuna_club || apiMatch.seller?.is_campuna_club),
                                is_pioneer: isPioneer,
                                seller: {
                                    name: apiMatch.seller?.name || (apiMatch.seller?.type === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer'),
                                    verified: true,
                                    type: apiMatch.seller?.type || 'Privat',
                                    avatar: apiMatch.seller?.avatar || '',
                                    tier: apiMatch.seller?.tier || 'FREE',
                                    is_campuna_club: Boolean(apiMatch.is_campuna_club || apiMatch.seller?.is_campuna_club),
                                    is_pioneer: isPioneer,
                                    achievements: apiMatch.seller?.achievements || (isPioneer ? [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }] : [])
                                },
                                features: [apiMatch.condition, apiMatch.subcategory].filter(Boolean),
                                isNegotiable: apiMatch.negotiable || false,
                                description: apiMatch.description || '',
                                publishedDate: apiMatch.createdAt ? new Date(apiMatch.createdAt).toLocaleDateString('de-DE') : 'Neu eingestellt',
                                anzeigeNr: `CP-${apiMatch.id ? apiMatch.id.slice(-4).toUpperCase() : '1000'}`,
                                viewsCount: apiMatch.viewsCount || 1,
                                    likesCount: parseInt(apiMatch.likes_count ?? apiMatch.favorites_count ?? 0, 10),
                                    chatsCount: parseInt(apiMatch.chats_count ?? apiMatch.conversations_count ?? 0, 10),
                                condition: apiMatch.condition || 'Sehr gut',
                                status: apiMatch.status || 'Aktiv',
                                user_id: apiMatch.user_id || apiMatch.owner_user_id || apiMatch.seller?.id || null,
                                ai_score: apiMatch.ai_score,
                                ai_decision: apiMatch.ai_decision,
                                ai_reasons: apiMatch.ai_reasons,
                                admin_notes: apiMatch.admin_notes
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
                                const rawImages = Array.isArray(match.images)
                                    ? match.images
                                    : (typeof match.images === 'string' && match.images.trim() ? [match.images] : []);
                                const images = rawImages
                                    .map(img => getImageUrl(img, null))
                                    .filter(Boolean);
                                const isPioneer = Boolean(match.is_pioneer || match.seller?.is_pioneer || match.seller?.achievements?.some(a => a.badge_key === 'CAMPUNA_PIONEER'));

                                foundListing = {
                                    id: match.id,
                                    title: match.title || 'Camping Angebot',
                                    category: match.category || 'Camping Zubehör',
                                    price: parseFloat(match.price) || 0,
                                    pricePeriod: match.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                    location: match.location || 'Deutschland',
                                    displayLocation: match.location || 'Deutschland',
                                    images,
                                    is_campuna_club: Boolean(match.is_campuna_club || match.seller?.is_campuna_club),
                                    is_pioneer: isPioneer,
                                    seller: {
                                        name: match.seller?.name || (match.seller?.type === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatverkäufer'),
                                        verified: true,
                                        type: match.seller?.type || 'Privat',
                                        avatar: match.seller?.avatar || '',
                                        tier: match.seller?.tier || 'FREE',
                                        is_campuna_club: Boolean(match.is_campuna_club || match.seller?.is_campuna_club),
                                        is_pioneer: isPioneer,
                                        achievements: match.seller?.achievements || (isPioneer ? [{ badge_key: 'CAMPUNA_PIONEER', position: 1 }] : [])
                                    },
                                    features: [match.condition, match.subcategory].filter(Boolean),
                                    isNegotiable: match.negotiable || false,
                                    description: match.description || '',
                                    publishedDate: match.createdAt ? new Date(match.createdAt).toLocaleDateString('de-DE') : 'Neu eingestellt',
                                    anzeigeNr: `CP-${match.id ? match.id.slice(-4).toUpperCase() : '1000'}`,
                                    viewsCount: match.viewsCount || 1,
                                    likesCount: parseInt(match.likes_count ?? match.favorites_count ?? 0, 10),
                                    chatsCount: parseInt(match.chats_count ?? match.conversations_count ?? 0, 10),
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

                // 3. If still not found, check static marketplace fixtures
                if (!foundListing && STATIC_LISTINGS && STATIC_LISTINGS.length > 0) {
                    const decodedSlug = slug.toLowerCase();
                    const staticMatch = STATIC_LISTINGS.find(item => {
                        const titleSlug = slugifyTitle(item.title);
                        return (
                            item.id?.toLowerCase() === decodedSlug ||
                            item.slug?.toLowerCase() === decodedSlug ||
                            titleSlug === decodedSlug ||
                            item.id === listingId ||
                            decodedSlug.includes(item.id?.toLowerCase())
                        );
                    });

                    if (staticMatch) {
                        foundListing = {
                            ...staticMatch,
                            displayLocation: staticMatch.location || 'Deutschland',
                            user_id: staticMatch.seller_user_id || staticMatch.seller?.id || null
                        };
                    }
                }

                if (active && foundListing) {
                    setListing(foundListing);
                    setActiveImageIdx(0);

                    // Fetch related listings from database or fallback to static
                    const currentId = String(foundListing.id || '').toLowerCase();
                    const currentTitleSlug = slugifyTitle(foundListing.title || '');

                    getAllListings().then(res => {
                        if (res.success && active && Array.isArray(res.data?.listings) && res.data.listings.length > 0) {
                            const dbListings = res.data.listings;
                            const mapped = dbListings.map(l => ({
                                id: l.id,
                                title: l.title || 'Camping Angebot',
                                price: parseFloat(l.price) || 0,
                                pricePeriod: l.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis',
                                location: l.location || 'Deutschland',
                                displayLocation: l.location || 'Deutschland',
                                category: l.category || '',
                                features: [l.condition, l.subcategory].filter(Boolean),
                                is_boosted: Boolean(l.is_boosted || l.featured),
                                images: (Array.isArray(l.images) ? l.images : (typeof l.images === 'string' && l.images.trim() ? [l.images] : [])).map(img => getImageUrl(img)).filter(Boolean)
                            }));

                            const seenKeys = new Set();
                            const related = [];
                            for (const item of mapped) {
                                const itemKey = String(item.id || '').toLowerCase();
                                const itemTitleSlug = slugifyTitle(item.title || '');
                                if (itemKey === currentId || itemTitleSlug === currentTitleSlug) continue;
                                if (seenKeys.has(itemKey) || seenKeys.has(itemTitleSlug)) continue;
                                seenKeys.add(itemKey);
                                seenKeys.add(itemTitleSlug);
                                related.push(item);
                            }
                            setRelatedListings(related);
                        } else if (active) {
                            const seenKeys = new Set();
                            const related = [];
                            for (const item of STATIC_LISTINGS) {
                                const itemKey = String(item.id || '').toLowerCase();
                                const itemTitleSlug = slugifyTitle(item.title || '');
                                if (itemKey === currentId || itemTitleSlug === currentTitleSlug) continue;
                                if (seenKeys.has(itemKey) || seenKeys.has(itemTitleSlug)) continue;
                                seenKeys.add(itemKey);
                                seenKeys.add(itemTitleSlug);
                                related.push({
                                    id: item.id,
                                    title: item.title,
                                    price: item.price,
                                    pricePeriod: item.pricePeriod || 'Kaufpreis',
                                    location: item.location,
                                    displayLocation: item.location,
                                    category: item.category,
                                    features: item.features || [],
                                    is_boosted: item.is_boosted,
                                    images: item.images.map(img => getImageUrl(img)).filter(Boolean)
                                });
                            }
                            setRelatedListings(related);
                        }
                    }).catch(err => {
                        if (active) {
                            setRelatedListings([]);
                        }
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
    }, [slug, listingId]);

    const handleNextImage = React.useCallback((e) => {
        if (e) e.stopPropagation();
        if (listing && listing.images && listing.images.length > 0) {
            setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
        }
    }, [listing]);

    const handlePrevImage = React.useCallback((e) => {
        if (e) e.stopPropagation();
        if (listing && listing.images && listing.images.length > 0) {
            setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
        }
    }, [listing]);

    const handleCopyLink = () => {
        handleCopyCleanUrl();
    };

    const handleReportListing = () => {
        if (!currentUser) {
            toast.error('Bitte melde dich an, um ein Inserat zu melden.');
            router.push(`/login?returnUrl=/inserate/${encodeURIComponent(slug)}`);
            return;
        }
        if (isOwner) {
            toast.error('Du kannst deine eigene Anzeige nicht melden.');
            return;
        }
        setIsReportSent(false);
        setIsReportModalOpen(true);
    };

    const handleSendReport = async (e) => {
        if (e) e.preventDefault();
        if (!reportReasonCategory) {
            toast.error('Bitte wähle einen Grund für die Meldung aus.');
            return;
        }
        if (!listing?.id) return;

        setIsSendingReport(true);
        try {
            const res = await reportListing(listing.id, {
                reason: reportReasonCategory,
                description: reportDescription ? reportDescription.trim() : ''
            });

            if (res.data?.success || res.success) {
                setIsReportSent(true);
                toast.success('Meldung erfolgreich übermittelt.');
            } else {
                toast.error(res.data?.error || res.error || 'Fehler beim Senden der Meldung.');
            }
        } catch (err) {
            console.error('Error submitting report:', err);
            const errMsg = err.response?.data?.error || err.message || 'Fehler beim Senden der Meldung.';
            toast.error(errMsg);
        } finally {
            setIsSendingReport(false);
        }
    };

    if (loading) {
        return (
            <CircleLoader size="lg" color="forest" fullPage />
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-sand/20 px-4 pt-20">
                <AlertCircle className="w-16 h-16 text-yellow-600 mb-4 animate-bounce" />
                <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Inserat nicht gefunden</h1>
                <p className="text-sm text-charcoal/60 mb-6 text-center max-w-md">
                    Das gesuchte Inserat existiert leider nicht, wurde gelöscht oder befindet sich noch in redaktioneller Prüfung.
                </p>
                <button
                    onClick={() => router.push('/inserate')}
                    className="bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3 px-6 rounded-full text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                    Alle Inserate ansehen
                </button>
            </div>
        );
    }

    const {
        title,
        price,
        pricePeriod,
        category,
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

    // Format display seller name: if not logged in, mask with 1st letter and *** (e.g. M***, S***)
    const isBusinessPartner = Boolean(seller?.tier === 'BUSINESS' || listing?.company_tier === 'BUSINESS' || seller?.is_business);
    const rawSellerName = seller?.name || (seller?.type === 'Gewerblich' ? 'Gewerblicher Anbieter' : 'Privatanbieter');
    const displaySellerName = (isLoggedIn || isBusinessPartner)
        ? rawSellerName
        : `${rawSellerName.trim().charAt(0).toUpperCase()}***`;

    const isSellerPioneer = Boolean(
        listing?.is_pioneer ||
        listing?.isPioneer ||
        listing?.seller_is_pioneer ||
        seller?.is_pioneer ||
        seller?.isPioneer ||
        (seller?.achievements && Array.isArray(seller.achievements) && seller.achievements.some(a => a.badge_key === 'CAMPUNA_PIONEER')) ||
        (listing?.achievements && Array.isArray(listing.achievements) && listing.achievements.some(a => a.badge_key === 'CAMPUNA_PIONEER'))
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
                onClick={() => {
                    const sellerSlug = `/anbieter/${slugifyTitle(seller?.name || 'anbieter')}-${listing.user_id || listing.owner_user_id || listing.ownerUserId || ''}`;
                    if (!isLoggedIn) {
                        setPrivacyModalContext('profile');
                        setIsPrivacyAuthModalOpen(true);
                        return;
                    }
                    router.push(sellerSlug);
                }}
                className="flex items-center gap-3 text-left border-b border-forest/5 pb-4 cursor-pointer group/seller hover:opacity-90 transition-opacity"
            >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-bold select-none shadow shrink-0 group-hover/seller:ring-2 group-hover/seller:ring-gold/50 transition-all ${
                    (seller?.tier === 'BUSINESS' || listing?.company_tier === 'BUSINESS')
                        ? 'bg-gradient-to-br from-forest to-emerald-950 text-amber-300 ring-2 ring-amber-400/40 shadow-lg'
                        : 'bg-forest text-white'
                }`}>
                    {displaySellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-charcoal sm:text-base leading-tight group-hover/seller:text-forest transition-colors">
                            {displaySellerName}
                        </span>
                        {(seller?.tier === 'BUSINESS' || listing?.company_tier === 'BUSINESS') ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase bg-[#062c19] text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full shadow-xs">
                                <Briefcase className="w-2.5 h-2.5 text-amber-400" />
                                Business
                            </span>
                        ) : (seller?.type === 'Gewerblich' || listing?.listing_user_type === 'Gewerblich') ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase bg-[#0B3B24] text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full shadow-xs">
                                <Building2 className="w-2.5 h-2.5 text-emerald-300" />
                                Gewerblich
                            </span>
                        ) : null}
                        {isSellerPioneer && (
                            <PioneerBadge size="xs" text="Pioneer" />
                        )}
                    </div>
                    <span className="text-[11px] text-charcoal/50 font-medium block mt-0.5">
                        {(seller?.tier === 'BUSINESS' || listing?.company_tier === 'BUSINESS') ? (
                            <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                                Gewerblicher Business-Partner
                            </span>
                        ) : seller?.type === 'Gewerblich' ? (
                            'Gewerblicher Anbieter'
                        ) : (
                            'Privatanbieter'
                        )}
                    </span>
                </div>
            </div>

            {/* 0. Owner Quick Actions */}
            {isOwner ? (
                <div className="bg-forest/5 border border-forest/20 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-forest flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" />
                            Sie sind der Eigentümer dieses Inserats
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            disabled={isDeleting}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Löschen</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <Link
                            href={currentUser?.role === 'ADMIN' ? `/admin/inserat-erstellen?edit=${listing.id}` : `/anzeige-erstellen?edit=${listing.id}`}
                            className="bg-white hover:bg-forest hover:text-white text-forest border border-forest/20 transition-all font-sans font-bold py-2.5 px-3 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-center"
                        >
                            <Pencil className="w-3.5 h-3.5 shrink-0" />
                            Bearbeiten
                        </Link>
                        <Link
                            href={`/inserate/${listing.slug || listing.id}/boosten`}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-sans font-bold py-2.5 px-3 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-center transition-all hover:shadow-md"
                        >
                            <Rocket className="w-3.5 h-3.5 shrink-0 text-amber-100" />
                            Hervorheben
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* 1. Primary CTA: Contact Seller & Phone Number Gate */}
                    <div className="space-y-2">
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
                                    onClick={handleOpenContactModal}
                                    className="w-full bg-[#2a7f55] hover:bg-[#206040] text-white transition-colors duration-300 font-sans font-bold py-3.5 px-6 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Verkäufer kontaktieren
                                </button>

                                {/* Phone Number: Show directly if logged in/commercial or Show GDPR Privacy Gate */}
                                {(seller?.phone || listing?.phone) ? (
                                    <a
                                        href={`tel:${seller?.phone || listing?.phone}`}
                                        className="w-full bg-white hover:bg-forest/5 border border-forest/20 text-forest font-sans font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <PhoneCall className="w-3.5 h-3.5 text-forest shrink-0" />
                                        <span>Anrufen: {seller?.phone || listing?.phone}</span>
                                    </a>
                                ) : (seller?.has_phone || listing?.has_phone || listing?.is_phone_protected || seller?.is_phone_protected) ? (
                                    <button
                                        onClick={handleRevealPhone}
                                        className="w-full bg-sand/30 hover:bg-sand/60 border border-forest/15 text-charcoal font-sans font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-forest group-hover:scale-110 transition-transform" />
                                        <span>Telefonnummer anzeigen</span>
                                        <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                                            🔒 Login
                                        </span>
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>

                    {/* 2. Side-by-side Row: Melden & Speichern */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            onClick={handleReportListing}
                            className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                        >
                            <Flag className="w-3.5 h-3.5 shrink-0" />
                            Melden
                        </button>

                        <button
                            onClick={() => toggleFavorite(listing)}
                            className="bg-white hover:bg-sand/15 border border-forest/15 text-charcoal font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                        >
                            <Heart className={`w-4 h-4 shrink-0 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-charcoal/60'}`} />
                            {isFavorite ? 'Gespeichert' : 'Speichern'}
                        </button>
                    </div>
                </>
            )}

            {/* 3. Share link button */}
            <div className="pt-1">
                <button
                    onClick={handleShareLink}
                    className="w-full bg-gradient-to-r from-forest via-[#1e613c] to-forest hover:from-[#1b4d32] hover:to-[#1b4d32] text-sand hover:text-white transition-all duration-300 font-sans font-bold py-3.5 px-6 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 group border border-gold/30"
                >
                    <Share2 className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                    <span>Inserat teilen</span>
                </button>
            </div>
        </div>
    );

    // Construct Google & Bing Schema.org JSON-LD structured data
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': category?.toLowerCase().includes('wohnmobil') || category?.toLowerCase().includes('camper') ? 'Vehicle' : 'Product',
        name: title,
        description: description ? description.slice(0, 300) : title,
        image: images && images.length > 0 ? images : undefined,
        offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'EUR',
            availability: isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            itemCondition: condition?.toLowerCase().includes('neu') ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
            seller: {
                '@type': (seller?.tier === 'BUSINESS' || seller?.type === 'Gewerblich') ? 'Organization' : 'Person',
                name: seller?.name || 'Campuna Verkäufer'
            }
        }
    };

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal pt-24 sm:pt-28 pb-16">
            {/* Schema.org Structured Data for Google / Bing */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

                {/* ── Breadcrumbs and Badges ── */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-3 border-b border-forest/5"
                >
                    <div className="flex-1 min-w-0">
                        <Breadcrumbs
                            items={[
                                { label: 'Inserate', href: '/inserate' },
                                ...(category ? [{ label: category, href: `/inserate?cat=${encodeURIComponent(category)}` }] : []),
                                { label: title || 'Inserat' }
                            ]}
                            variant="light"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                        {/* Account Status Badge: Privat | Gewerblich | Business (automatically hidden for Admin) */}
                        <SellerAccountBadge item={{ ...listing, seller }} size="md" />

                        {/* Promoted Badge: Hervorgehoben */}
                        {(listing.is_boosted || (listing.boosted_until && new Date(listing.boosted_until) > new Date()) || listing.seller_role === 'ADMIN' || listing.role === 'ADMIN' || listing.is_admin || listing.is_campuna_club || seller?.is_admin || seller?.is_campuna_club) && (
                            <PromotedBadge size="md" />
                        )}

                        {isSold && (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 shrink-0 whitespace-nowrap">
                                <Lock className="w-3.5 h-3.5" />
                                Verkauft
                            </span>
                        )}
                        <span className="bg-sand text-forest border border-forest/15 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                            Zustand: {condition}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                            status === 'APPROVED' || status.toLowerCase() === 'aktiv'
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                : status === 'INACTIVE' || status === 'DEACTIVATED'
                                ? 'bg-slate-500/10 text-slate-700 border-slate-500/20'
                                : status === 'REVIEW'
                                ? 'bg-amber-500/10 text-amber-800 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                            }`}>
                            Status: {isSold ? 'Verkauft' : (status === 'INACTIVE' || status === 'DEACTIVATED') ? 'Deaktiviert' : status === 'REVIEW' ? 'In Prüfung' : status === 'APPROVED' ? 'Aktiv' : status}
                        </span>
                    </div>
                </motion.div>

                {/* ── Deactivated / Paused Listing Notice Banner for Owner ── */}
                {(listing.status === 'INACTIVE' || listing.status === 'DEACTIVATED') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border bg-slate-50 border-slate-300 text-slate-900"
                    >
                        <div className="flex items-start gap-3.5 flex-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white bg-slate-700">
                                <Pause className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                                    Dieses Inserat ist derzeit deaktiviert (pausiert)
                                </h3>
                                <p className="text-xs text-slate-600">
                                    Das Inserat ist für andere Nutzer auf dem Marktplatz unsichtbar. Du kannst es jederzeit wieder aktivieren.
                                </p>
                            </div>
                        </div>
                        {isOwner && (
                            <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const toastId = toast.loading('Inserat wird aktiviert...');
                                        try {
                                            const res = await toggleListingStatus(listing.id, 'APPROVED');
                                            if (res.data?.success || res.status === 200) {
                                                toast.success('Inserat erfolgreich wieder aktiviert!', { id: toastId });
                                                setListing(prev => ({ ...prev, status: 'APPROVED' }));
                                            } else {
                                                toast.error(res.data?.error || 'Fehler beim Aktivieren.', { id: toastId });
                                            }
                                        } catch (err) {
                                            toast.error(err.response?.data?.error || err.message || 'Fehler beim Aktivieren.', { id: toastId });
                                        }
                                    }}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    Jetzt aktivieren
                                </button>
                                <Link
                                    href={`/anzeige-erstellen?edit=${listing.id}`}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-all cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Bearbeiten
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Unapproved / Moderation Review Notice Banner ── */}
                {listing.status && listing.status !== 'APPROVED' && listing.status !== 'INACTIVE' && listing.status !== 'DEACTIVATED' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border ${
                        listing.status === 'REJECTED'
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}>
                        <div className="flex items-start gap-3.5 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white ${
                                listing.status === 'REJECTED' ? 'bg-rose-600' : 'bg-amber-500'
                            }`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-display font-bold text-sm sm:text-base">
                                    {listing.status === 'REJECTED' ? 'Inserat abgelehnt' : 'Inserat in Prüfung (Wartet auf Freigabe)'}
                                </h3>
                                {listing.status === 'REJECTED' ? (
                                    <div className="text-xs text-rose-900/90 space-y-1">
                                        <p>
                                            Dieses Inserat entspricht nicht unseren Richtlinien und ist für andere Nutzer nicht sichtbar.
                                        </p>
                                        {(listing.ai_reasons && listing.ai_reasons.length > 0) || listing.admin_notes ? (
                                            <div className="mt-2 p-2.5 bg-white/80 border border-rose-200 rounded-xl font-medium text-rose-950">
                                                <strong>Grund der Ablehnung:</strong>{' '}
                                                {listing.admin_notes || (Array.isArray(listing.ai_reasons) ? listing.ai_reasons.join(' ') : String(listing.ai_reasons))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-900/90">
                                        Dieses Inserat ist derzeit <strong>nur für Sie</strong> (und Administratoren) sichtbar. Es wird nach redaktioneller Freigabe automatisch veröffentlicht.
                                    </p>
                                )}
                            </div>
                        </div>
                        {isOwner && (
                            <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 shrink-0">
                                <Link
                                    href={`/anzeige-erstellen?edit=${listing.id}`}
                                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:brightness-110 transition-all ${
                                        listing.status === 'REJECTED' ? 'bg-rose-700' : 'bg-amber-700'
                                    }`}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Inserat korrigieren
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={isDeleting}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-300 shadow-2xs transition-all cursor-pointer"
                                    title="Inserat endgültig löschen"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    Löschen
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Owner Info Banner (Only shown if listing is APPROVED to avoid redundancy) ── */}
                {isOwner && listing.status === 'APPROVED' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-forest/10 via-emerald-50 to-sand/30 border border-forest/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Pencil className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-forest text-sm sm:text-base">
                                    Dies ist Ihr Inserat
                                </h3>
                                <p className="text-xs text-charcoal/70">
                                    Sie können alle Angaben, Bilder und Preise jederzeit bearbeiten oder das Inserat löschen.
                                </p>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 shrink-0">
                            <Link
                                href={`/anzeige-erstellen?edit=${listing.id}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-forest hover:bg-gold text-white hover:text-forest font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow hover:shadow-md cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                                Inserat bearbeiten
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isDeleting}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs transition-all cursor-pointer"
                                title="Inserat löschen"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                Löschen
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Main Listing Header Area ── */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="mb-8"
                >
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
                        <div className="flex items-center gap-4 sm:ml-auto">
                            <span className="flex items-center gap-1.5 font-medium text-charcoal/75">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span>{likesCount} {likesCount === 1 ? 'Merkzettel' : 'Merkzettel'}</span>
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-charcoal/75">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{chatsCount} {chatsCount === 1 ? 'Unterhaltung' : 'Unterhaltungen'}</span>
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Dynamic Layout Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Gallery & Details (8/12 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* ── Professional Image Gallery ── */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="space-y-3"
                        >
                            <div className="relative aspect-[16/10] w-full rounded-2xl md:rounded-3xl overflow-hidden bg-sand/15 border border-forest/5 group">
                                {images && images.length > 0 ? (
                                    <img
                                        src={images[activeImageIdx]}
                                        alt={`${title} view`}
                                        className="w-full h-full object-cover transition-transform duration-[0.8s] group-hover:scale-[1.02] cursor-zoom-in"
                                        onClick={() => setIsGalleryModalOpen(true)}
                                    />
                                ) : (
                                    <ListingImagePlaceholder category={category} size="lg" />
                                )}

                                {/* Overlay Controls (Only if > 1 image) */}
                                {images && images.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-forest shadow-md flex items-center justify-center transition-all feedback-active select-none cursor-pointer hover:scale-105 active:scale-95 z-10"
                                            aria-label="Vorheriges Foto"
                                        >
                                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-forest shadow-md flex items-center justify-center transition-all feedback-active select-none cursor-pointer hover:scale-105 active:scale-95 z-10"
                                            aria-label="Nächstes Foto"
                                        >
                                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>

                                        {/* Gallery Count Badge */}
                                        <span className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full select-none shadow-sm">
                                            {activeImageIdx + 1} / {images.length}
                                        </span>
                                    </>
                                )}

                                {/* Fullscreen Overlay Button */}
                                <button
                                    onClick={() => setIsGalleryModalOpen(true)}
                                    className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-white/95 hover:bg-white text-forest text-[10px] md:text-[11px] font-semibold uppercase tracking-wider px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-lg transition-all duration-200 cursor-pointer hover:scale-102 active:scale-98"
                                >
                                    {images.length > 1 ? 'Alle Fotos anzeigen' : 'Vollbild'}
                                </button>
                            </div>

                            {/* Thumbnails Row (Only if > 1 image) */}
                            {images.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIdx(idx)}
                                            className={`relative aspect-[16/10] w-18 sm:w-22 md:w-24 rounded-xl overflow-hidden shrink-0 transition-all border-2 cursor-pointer ${activeImageIdx === idx
                                                ? 'border-forest ring-2 ring-forest/15 scale-95 shadow-md'
                                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'
                                                }`}
                                        >
                                            <img src={img} alt={`thumbnail ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Mobile/Tablet Price Card & Seller Box (hidden on desktop) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="block lg:hidden mt-2 mb-6"
                        >
                            {renderSidebarContent()}
                        </motion.div>

                        {/* ── Description Section ── */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="space-y-4"
                        >
                            <h2 className="font-display text-lg font-bold text-forest uppercase tracking-wider">
                                Beschreibung
                            </h2>
                            <div className="relative">
                                <div
                                    className={`text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-light overflow-hidden transition-all duration-500 ${isDescriptionExpanded ? 'max-h-[5000px]' : 'max-h-[220px]'
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
                                className="text-xs font-bold uppercase tracking-widest text-forest hover:text-gold transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer py-1 group"
                            >
                                <span>{isDescriptionExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
                                <span className={`transform transition-transform inline-block group-hover:translate-y-0.5 ${isDescriptionExpanded ? 'rotate-180' : ''}`}>↓</span>
                            </button>
                        </motion.section>

                        {/* ── Privacy Friendly Location Map ── */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="space-y-4 pt-6 border-t border-forest/10"
                        >
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
                        </motion.section>

                    </div>

                    {/* RIGHT COLUMN: Price Card & Seller Box (4/12 cols) with Sticky mount animation */}
                    <motion.div 
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 hidden lg:block"
                    >
                        {renderSidebarContent()}
                    </motion.div>

                </div>

                {/* ── RELATED PRODUCTS SECTION (Spans full page width below columns) ── */}
                {relatedListings.length > 0 && (
                    <motion.section 
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6 }}
                        className="mt-16 pt-8 space-y-6 text-left"
                    >
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
                            {relatedListings.map((item, index) => {
                                const slug = buildListingSlug(item.title, item.id);
                                const isBoosted = isListingBoosted(item);
                                const itemKey = item.id ? `related-${item.id}` : `related-${slug || index}`;
                                return (
                                    <motion.div
                                        key={itemKey}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
                                        onClick={() => router.push(`/inserate/${slug}`)}
                                        className={`group relative flex flex-col rounded-[24px] overflow-hidden transition-all duration-300 cursor-pointer h-full shrink-0 w-[270px] sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)] snap-start text-left select-none ${
                                            isBoosted
                                                ? 'bg-gradient-to-b from-[#fdfbf7] to-[#fbf7ee] border border-amber-300/60 hover:border-amber-400/80 shadow-[0_4px_20px_-4px_rgba(202,152,43,0.18)] hover:shadow-[0_8px_30px_-4px_rgba(202,152,43,0.28)] hover:-translate-y-1'
                                                : 'bg-white border border-forest/5 hover:border-forest/10 hover:shadow-xl hover:-translate-y-1'
                                        }`}
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
                                            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
                                                <ListingBadgesRow item={item} />
                                            </div>

                                            {/* Location overlay */}
                                            <div className="absolute bottom-3 right-3 flex items-center justify-end pointer-events-none text-white/90 z-10">
                                                <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] flex items-center gap-1 font-sans">
                                                    <MapPin className="w-2.5 h-2.5 text-gold shrink-0" />
                                                    <span>{item.displayLocation || item.location}</span>
                                                </div>
                                            </div>

                                            {/* Hover CTA */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="bg-white text-forest px-4.5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
                                                    <Eye className="w-3.5 h-3.5" />
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
                                    </motion.div>
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
                    </motion.section>
                )}

                {/* ── All Categories Section at bottom of listing detail page ── */}
                <div className="mt-8">
                    <CategoriesSection
                        title="Camping hat viele Seiten. Wir bringen sie zusammen."
                        badge="KATEGORIEN"
                        showHeader={true}
                        align="center"
                        isDocked={false}
                    />
                </div>

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
                            {images.length > 1 && (
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-0 sm:left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors select-none z-10"
                                    aria-label="Vorheriges Foto"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                            )}

                            <img
                                src={images[activeImageIdx]}
                                alt={`${title} modal`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />

                            {images.length > 1 && (
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-0 sm:right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors select-none z-10"
                                    aria-label="Nächstes Foto"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            )}
                        </div>

                        {/* Thumbnails row at bottom of modal (Only if > 1 image) */}
                        {images.length > 1 && (
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
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Contact / Chat Modal popup ── */}
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

                            {/* Listing Header Snippet */}
                            <div className="bg-sand/30 border-b border-forest/10 p-5 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-forest/5 border border-forest/10 shrink-0">
                                    <img
                                        src={listing.images[0] || '/hero-campuna.webp'}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-forest uppercase tracking-wider truncate">
                                            {displaySellerName} ({seller.type})
                                        </span>
                                    </div>
                                    <h4 className="font-display font-bold text-sm text-charcoal truncate">
                                        {listing.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-display font-extrabold text-forest text-base">
                                            {price.toLocaleString('de-DE')} €
                                        </span>
                                        {displayLocation && (
                                            <span className="text-[11px] text-charcoal/60 flex items-center gap-0.5 truncate">
                                                <MapPin className="w-3 h-3 text-forest" />
                                                {displayLocation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Form Body */}
                            <form onSubmit={handleSendDirectMessage} className="p-6 space-y-4 font-sans">
                                <div>
                                    <label className="block text-xs font-bold text-charcoal mb-1">
                                        Nachricht an {displaySellerName}
                                    </label>
                                    <p className="text-[11px] text-charcoal/60 mb-3">
                                        Starte eine direkte Unterhaltung. Deine Nachricht wird sicher über das Campuna-Nachrichtensystem zugestellt.
                                    </p>

                                    {/* Quick Preset Chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {[
                                            'Ist das Angebot noch verfügbar?',
                                            'Ich möchte einen Besichtigungstermin vereinbaren.',
                                            'Ist der Preis verhandelbar?'
                                        ].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setContactMessage(preset)}
                                                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left ${
                                                    contactMessage === preset
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
                                        placeholder="Schreibe deine Nachricht an den Verkäufer..."
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

            {/* ── Report Modal popup ── */}
            <AnimatePresence>
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
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col relative text-left max-h-[92vh]"
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
                            <div className="bg-[#fcfbf9] p-5 sm:p-7 flex flex-col gap-5 overflow-y-auto">
                                {isReportSent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-10 flex flex-col items-center text-center space-y-4 font-sans"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                            <Check className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-display font-bold text-2xl text-charcoal">Meldung eingegangen</h3>
                                        <p className="text-xs sm:text-sm text-charcoal/70 max-w-sm leading-relaxed">
                                            Vielen Dank für deine Mithilfe! Unser Moderationsteam prüft dieses Angebot sorgfältig nach unseren Community-Richtlinien.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setIsReportModalOpen(false);
                                                setIsReportSent(false);
                                            }}
                                            className="mt-4 px-7 py-3 rounded-full bg-forest text-sand hover:bg-forest/90 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                        >
                                            Schließen
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSendReport} className="space-y-4 font-sans">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-700">
                                                    <Flag className="w-4 h-4" />
                                                </span>
                                                <h3 className="font-display font-extrabold text-lg text-charcoal">
                                                    Anzeige melden
                                                </h3>
                                            </div>
                                            <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                                                Warum möchtest du dieses Angebot ({listing?.title}) melden? Bitte wähle den passenden Grund aus:
                                            </p>
                                        </div>

                                        {/* Reason Selector Dropdown with React Icons */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-charcoal">
                                                Grund der Meldung auswählen <span className="text-rose-600">*</span>
                                            </label>
                                            <div className="relative">
                                                {(() => {
                                                    const selectedReason = REPORT_REASONS.find(r => r.id === reportReasonCategory) || REPORT_REASONS[0];
                                                    const SelectedIcon = selectedReason.icon;
                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                                                            className="w-full bg-white border border-beige/90 rounded-2xl p-3 text-xs text-charcoal flex items-center justify-between gap-3 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest cursor-pointer hover:bg-sand/20 transition-all shadow-2xs text-left"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${selectedReason.colorClass}`}>
                                                                    <SelectedIcon className="w-4 h-4 shrink-0" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="font-display font-bold text-xs text-charcoal block truncate">
                                                                        {selectedReason.label}
                                                                    </span>
                                                                    <span className="text-[11px] text-charcoal/50 leading-snug block truncate">
                                                                        {selectedReason.desc}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ChevronDown className={`w-4 h-4 text-charcoal/40 shrink-0 transition-transform ${isReportDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    );
                                                })()}

                                                {/* Dropdown Options List */}
                                                {isReportDropdownOpen && (
                                                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-beige shadow-2xl p-1.5 z-50 max-h-[260px] overflow-y-auto space-y-1">
                                                        {REPORT_REASONS.map((reason) => {
                                                            const isSelected = reportReasonCategory === reason.id;
                                                            const IconComponent = reason.icon;
                                                            return (
                                                                <button
                                                                    key={reason.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setReportReasonCategory(reason.id);
                                                                        setIsReportDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                                        isSelected
                                                                            ? 'bg-forest/10 text-forest font-bold'
                                                                            : 'hover:bg-sand/30 text-charcoal'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${reason.colorClass}`}>
                                                                            <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="text-xs font-bold block truncate">
                                                                                {reason.label}
                                                                            </span>
                                                                            <span className="text-[10px] text-charcoal/50 leading-snug block truncate">
                                                                                {reason.desc}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {isSelected && <Check className="w-4 h-4 text-forest shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Message / Description */}
                                        <div className="space-y-1.5 pt-1">
                                            <label className="block text-xs font-bold text-charcoal">
                                                Deine Nachricht / Details zum Problem <span className="text-charcoal/40 font-normal">(optional)</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={reportDescription}
                                                onChange={(e) => setReportDescription(e.target.value)}
                                                placeholder="Beschreibe bitte kurz, was dir aufgefallen ist (z.B. falsche Angaben, Betrugsverdacht, Fahrzeug bereits verkauft)..."
                                                className="w-full bg-white border border-beige rounded-2xl p-3 text-xs text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed resize-none font-sans"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsReportModalOpen(false)}
                                                className="px-5 py-2.5 rounded-full border border-beige text-charcoal/70 hover:bg-sand/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                                Abbrechen
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSendingReport}
                                                className="px-6 py-2.5 rounded-full bg-forest hover:bg-gold text-sand hover:text-forest disabled:opacity-50 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                                            >
                                                {isSendingReport ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        <span>Wird übermittelt...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Flag className="w-3.5 h-3.5" />
                                                        <span>Meldung absenden</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ─── Share Link Modal (GDPR & Privacy Compliant) ─── */}
                {isShareModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => setIsShareModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-beige relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sand/40 hover:bg-sand flex items-center justify-center text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-5">
                                {/* Modal Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                                        <Share2 className="w-5 h-5 text-forest" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-charcoal font-sans">Inserat teilen</h3>
                                        <p className="text-xs text-charcoal/50">Teile dieses Angebot mit Freunden & Kontakten</p>
                                    </div>
                                </div>

                                {/* Social Sharing Action Grid */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {/* Link kopieren */}
                                        <button
                                            type="button"
                                            onClick={handleCopyCleanUrl}
                                            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs ${
                                                copied
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : 'bg-[#faf8f3] hover:bg-sand/50 border-beige text-charcoal/80 hover:text-forest'
                                            }`}
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-emerald-700 animate-scale" />
                                            ) : (
                                                <Copy className="w-5 h-5 text-forest group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-[11px] font-bold">
                                                {copied ? 'Kopiert!' : 'Link kopieren'}
                                            </span>
                                        </button>

                                        {/* WhatsApp */}
                                        <button
                                            type="button"
                                            onClick={handleShareWhatsApp}
                                            className="p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
                                        >
                                            <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                                            <span className="text-[11px] font-bold">WhatsApp</span>
                                        </button>

                                        {/* E-Mail */}
                                        <button
                                            type="button"
                                            onClick={handleShareEmail}
                                            className="p-3.5 rounded-2xl bg-forest/10 hover:bg-forest/20 border border-forest/25 text-forest flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
                                        >
                                            <Mail className="w-5 h-5 text-forest group-hover:scale-110 transition-transform" />
                                            <span className="text-[11px] font-bold">E-Mail</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Privacy Compliance Notice Box */}
                                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-emerald-900 leading-relaxed font-normal">
                                        <strong className="font-bold">100% DSGVO-Datenschutzgarantie:</strong> Beim Teilen werden keinerlei persönliche Kontaktdaten übertragen. Der Empfänger kann das Inserat frei ansehen und private Kontaktdaten erst nach eigener Registrierung freischalten.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ─── Delete Confirmation Modal ─── */}
                {isDeleteModalOpen && (
                    <motion.div
                        key="delete-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full p-6 sm:p-7 text-center relative"
                        >
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="absolute top-4 right-4 text-charcoal/40 hover:text-charcoal bg-sand/40 hover:bg-sand p-2 rounded-full transition-all cursor-pointer"
                                aria-label="Schließen"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7" />
                            </div>

                            <h3 className="font-display font-bold text-xl text-charcoal mb-2">
                                Inserat löschen?
                            </h3>
                            <p className="text-sm text-charcoal/65 leading-relaxed mb-6 font-normal">
                                Möchtest du <strong className="text-charcoal font-semibold">"{listing?.title}"</strong> wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            </p>

                            <div className="flex items-center gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl border border-forest/15 bg-white text-charcoal/80 hover:bg-sand/30 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{isDeleting ? 'Löschen...' : 'Ja, löschen'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ─── Standard Auth Required Modal ─── */}
                <AuthRequiredModal
                    isOpen={isPrivacyAuthModalOpen}
                    onClose={() => setIsPrivacyAuthModalOpen(false)}
                    context={privacyModalContext || 'chat'}
                    returnUrl={`/inserate/${encodeURIComponent(slug)}`}
                />
            </AnimatePresence>

        </div>
    );
}

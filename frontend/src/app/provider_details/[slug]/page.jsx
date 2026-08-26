'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Heart,
    MapPin,
    ShieldCheck,
    Mail,
    Calendar,
    Globe,
    ArrowLeft,
    MessageSquare,
    Star,
    Eye,
    Info,
    ExternalLink,
    Megaphone
} from 'lucide-react';
import { PROVIDERS, FEATURED_LISTINGS } from '@/data';

function FacebookIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}

function InstagramIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

function slugifyName(name = '') {
    if (!name) return '';
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

// Mock specific Tiny House listings for LivianEssence
const LIVIAN_MOCK_LISTINGS = [
    {
        id: 'liv_1',
        title: 'Tiny House – Platz für 4–6 Personen, Lärche & Fichte',
        price: 55000,
        pricePeriod: 'Kaufpreis',
        location: 'Gelnhausen, Hessen',
        displayLocation: 'Gelnhausen',
        images: [
            'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=650&q=80'
        ],
        features: ['4-6 Personen', 'Lärche & Fichte', 'Mobil', 'Winterfest'],
        isNegotiable: false
    },
    {
        id: 'liv_2',
        title: 'Tiny House – Flexibel, modern & vielseitig nutzbar',
        price: 52000,
        pricePeriod: 'Kaufpreis',
        location: 'Gelnhausen, Hessen',
        displayLocation: 'Gelnhausen',
        images: [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=650&q=80'
        ],
        features: ['Flexibel', 'Vielseitig', 'Modern', 'Holzbau'],
        isNegotiable: true
    },
    {
        id: 'liv_3',
        title: 'Tiny House - Hochwertig, modern & ganzjährig bewohnbar',
        price: 65000,
        pricePeriod: 'Kaufpreis',
        location: 'Gelnhausen, Hessen',
        displayLocation: 'Gelnhausen',
        images: [
            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=650&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=650&q=80'
        ],
        features: ['Highlight', 'Ganzjährig bewohnbar', 'Luxusausstattung'],
        isNegotiable: false
    }
];

// Card component mapping a row of horizontal grid previews (keep the below cards same)
function ListingCard({ item }) {
    const router = useRouter();
    const handleCardClick = () => {
        const slug = buildListingSlug(item.title, item.id);
        router.push(`/listing_details/${slug}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCardClick}
            className="group relative flex flex-col bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-forest/5 hover:border-forest/10 hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
        >
            {/* 4-Image Grid Preview */}
            <div className="grid grid-cols-4 gap-0.5 aspect-[16/9] w-full bg-sand/15 overflow-hidden border-b border-forest/5">
                {item.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative w-full h-full overflow-hidden">
                        <img
                            src={img}
                            alt={`${item.title} preview ${idx}`}
                            className="w-full h-full object-cover transition-transform duration-[0.8s] group-hover:scale-105"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ))}
                {item.images.length < 4 && Array.from({ length: 4 - item.images.length }).map((_, i) => (
                    <div key={i} className="bg-sand/30 w-full h-full" />
                ))}
            </div>

            {/* Content Area */}
            <div className="p-4.5 flex flex-col flex-1 justify-between gap-4">
                <div>
                    <h3 className="font-display text-xs sm:text-sm md:text-base font-bold text-black group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-snug">
                        {item.title}
                    </h3>

                </div>

                {/* Pricing / Location info */}
                <div>
                    <div className="flex items-center justify-between pb-3 border-b border-forest/5">
                        <div>
                            <span className="block text-[8px] md:text-[9px] uppercase tracking-widest text-charcoal/40 font-mono leading-none mb-1">
                                Preis
                            </span>
                            <span className="font-display text-xs sm:text-base font-extrabold text-forest">
                                {item.price.toLocaleString('de-DE')} € {item.isNegotiable && <span className="text-[10px] font-normal text-charcoal/50">(VB)</span>}
                            </span>
                        </div>

                        <div className="flex items-center gap-0.5 text-stone-500 text-[10px] sm:text-xs">
                            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span>{item.displayLocation || item.location.split(',')[0]}</span>
                        </div>
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

// ─── Main ProviderDetails ────────────────────────────────────────────────────────
export default function ProviderDetails() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';
    const queryUid = searchParams?.get('uid');

    const uid = rawSlug || queryUid || '';

    const [provider, setProvider] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProviderData = async () => {
            setLoading(true);
            try {
                // Fetch F_users from hompage_tips
                const tipsRes = await fetch('https://simoneasalvo.bubbleapps.io/api/1.1/wf/homepage_tips/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                // Fetch products to filter listings
                const productsRes = await fetch('https://simoneasalvo.bubbleapps.io/api/1.1/wf/homepage-products/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                let users = [];
                let allProducts = [];

                if (tipsRes.ok) {
                    const tipsData = await tipsRes.json();
                    if (tipsData && tipsData.status === 'success' && tipsData.response && Array.isArray(tipsData.response.F_users)) {
                        users = tipsData.response.F_users;
                    }
                }

                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    if (productsData && productsData.status === 'success' && productsData.response && Array.isArray(productsData.response.listing)) {
                        allProducts = productsData.response.listing;
                    }
                }

                const cleanSlug = uid.toLowerCase();

                // Try to find the user in dynamic list
                const matchedUser = users.find(u => {
                    const companyName = u['BU - Company name'] || u.username || '';
                    const nameSlug = slugifyName(companyName);
                    return (
                        u._id === uid ||
                        u.username?.toLowerCase() === cleanSlug ||
                        nameSlug === cleanSlug ||
                        (cleanSlug && nameSlug && (cleanSlug.includes(nameSlug) || nameSlug.includes(cleanSlug))) ||
                        u._id === queryUid
                    );
                });

                if (matchedUser) {
                    // Count how many listings belong to this user
                    const userProducts = allProducts.filter(l => l['Created By'] === matchedUser._id);

                    // Format their listings to ListingCard structure:
                    const formatted = userProducts.map((item, idx) => {
                        // Image fallback logic: Prioritize Main Image, fallback to images array
                        let rawImages = [];
                        const mainImg = item['Main Image'] || item.MainImage;
                        if (mainImg) {
                            rawImages.push(mainImg);
                        }
                        if (item.images && Array.isArray(item.images)) {
                            item.images.forEach(img => {
                                if (img && img !== mainImg && !rawImages.includes(img)) {
                                    rawImages.push(img);
                                }
                            });
                        } else if (item.images && typeof item.images === 'string') {
                            if (item.images !== mainImg) {
                                rawImages.push(item.images);
                            }
                        }

                        let images = rawImages
                            .filter(Boolean)
                            .map(url => {
                                url = url.startsWith('//') ? `https:${url}` : url;
                                if (/\.heic$/i.test(url.split('?')[0]) && url.includes('cdn.bubble.io')) {
                                    url = url.replace(
                                        /(https:\/\/[^/]+\.cdn\.bubble\.io\/)(f[0-9x]+\/)/,
                                        '$1cdn-cgi/image/f=auto,fit=cover/$2'
                                    );
                                }
                                return url;
                            });

                        if (images.length === 0) {
                            images.push('/hero-campuna.webp');
                        }

                        return {
                            id: item._id || `api_lst_${idx}`,
                            title: item.title || item.Title || 'Kein Titel',
                            price: item.price || item.Price || 0,
                            pricePeriod: item['price type'] || 'Preis',
                            location: item.location || 'Deutschland',
                            displayLocation: formatLocation(item.location || 'Deutschland'),
                            images,
                            isNegotiable: item['price type'] === 'Preis' || false
                        };
                    });

                    // Format member since date
                    let memberSince = '12.11.2025';
                    if (matchedUser['Created Date']) {
                        const d = new Date(matchedUser['Created Date']);
                        if (!isNaN(d.getTime())) {
                            memberSince = d.toLocaleDateString('de-DE');
                        }
                    }

                    // Logo URL
                    let logo = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    if (matchedUser['Logo/Profile']) {
                        const rawLogo = matchedUser['Logo/Profile'];
                        logo = rawLogo.startsWith('//') ? `https:${rawLogo}` : rawLogo;
                        if (/\.heic$/i.test(logo.split('?')[0]) && logo.includes('cdn.bubble.io')) {
                            logo = logo.replace(
                                /(https:\/\/[^/]+\.cdn\.bubble\.io\/)(f[0-9x]+\/)/,
                                '$1cdn-cgi/image/f=auto,fit=cover/$2'
                            );
                        }
                    }

                    // Cover URL
                    let coverImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80';
                    if (matchedUser.Cover) {
                        const rawCover = matchedUser.Cover;
                        coverImage = rawCover.startsWith('//') ? `https:${rawCover}` : rawCover;
                        if (/\.heic$/i.test(coverImage.split('?')[0]) && coverImage.includes('cdn.bubble.io')) {
                            coverImage = coverImage.replace(
                                /(https:\/\/[^/]+\.cdn\.bubble\.io\/)(f[0-9x]+\/)/,
                                '$1cdn-cgi/image/f=auto,fit=cover/$2'
                            );
                        }
                    }

                    const providerListingsCount = (matchedUser['Total Listings'] !== undefined && matchedUser['Total Listings'] !== null)
                        ? Number(matchedUser['Total Listings'])
                        : userProducts.length;

                    const dynamicProviderObj = {
                        id: matchedUser._id,
                        name: matchedUser['BU - Company name'] || matchedUser.username || 'Camping Partner',
                        logo,
                        coverImage,
                        description: matchedUser.Bio || 'Dein Partner für Camping Abenteuer.',
                        slug: `?uid=${matchedUser._id}`,
                        listingsCount: providerListingsCount,
                        email: matchedUser.email || matchedUser.authentication?.email?.email || 'kontakt@campuna.de',
                        memberSince,
                        phone: matchedUser['BU - phone'] || '+49 (0) 6051 4567-89',
                        adresse: matchedUser['BU - Full address'] || 'Deutschland',
                        impressum: matchedUser['BU - Impressum '] || 'https://campuna.de/impressum'
                    };

                    setProvider(dynamicProviderObj);
                    setListings(formatted);
                } else {
                    // Fallback to local static providers if needed
                    const fallbackProv = PROVIDERS.find(p => {
                        const provNameSlug = slugifyName(p.name);
                        return (
                            p.id.toLowerCase() === cleanSlug ||
                            provNameSlug === cleanSlug ||
                            p.name.toLowerCase() === cleanSlug ||
                            (cleanSlug && provNameSlug && (cleanSlug.includes(provNameSlug) || provNameSlug.includes(cleanSlug))) ||
                            (p.slug && p.slug.toLowerCase().includes(cleanSlug))
                        );
                    }) || PROVIDERS.find(p => p.name.toLowerCase().includes('livian')) || PROVIDERS[0];

                    if (fallbackProv) {
                        const isLivian = fallbackProv.name.toLowerCase().includes('livian');
                        const memberSince = isLivian ? '07.04.2026' : '12.11.2025';
                        const email = isLivian ? 'd.zipf@markson-tinyhouse.com' : `info@${fallbackProv.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.de`;

                        const staticObj = {
                            ...fallbackProv,
                            email,
                            memberSince,
                            phone: '+49 (0) 6051 4567-89',
                            adresse: fallbackProv.location || 'Deutschland',
                            impressum: 'https://campuna.de/impressum'
                        };
                        setProvider(staticObj);

                        let listingsVal = [];
                        if (isLivian) {
                            listingsVal = LIVIAN_MOCK_LISTINGS;
                        } else {
                            listingsVal = FEATURED_LISTINGS.map((l, i) => ({
                                ...l,
                                id: `prov_lst_${i}`,
                                displayLocation: formatLocation(l.location),
                                isNegotiable: l.pricePeriod === 'Preis' || false
                            })).slice(0, Math.min(3, fallbackProv.listingsCount || 3));

                            if (listingsVal.length === 0) {
                                listingsVal = FEATURED_LISTINGS.slice(0, 2).map((l, i) => ({
                                    ...l,
                                    id: `prov_lst_${i}`,
                                    displayLocation: formatLocation(l.location),
                                    isNegotiable: false
                                }));
                            }
                        }
                        setListings(listingsVal);
                    }
                }
            } catch (err) {
                console.error("Error setting provider details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProviderData();
    }, [uid]);

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

    if (!provider) {
        return (
            <div className="min-h-screen bg-sand flex items-center justify-center pt-24 text-center">
                <p className="font-sans text-sm font-semibold text-charcoal/60">Anbieter nicht gefunden.</p>
            </div>
        );
    }

    const providerName = provider.name;
    const isLivian = providerName.toLowerCase().includes('livian');
    const memberSince = provider.memberSince;
    const email = provider.email;

    // Bullet points
    const bioLines = isLivian ? [
        'Livianessence | Tiny House Kooperation',
        'Nachhaltiges, minimalistisches Wohnen mit Stil.',
        'Ob als eigener Wohnraum oder als Ferienhaus-Investition.',
        'Persönlicher Service & smarte, preisbewusste Lösung.',
        'Mehr Freiheit. Weniger Raum. Mehr Leben - Wir schauen Individuell'
    ] : [
        `${providerName} – Premium Partner auf Campuna.`,
        provider.description || 'Expertise, Zuverlässigkeit und erstklassiger Service.',
        'Ihr Ansprechpartner rund ums Camping & Fahrgeräte.',
        'Besuchen Sie unsere Inserate oder kontaktieren Sie uns direkt für Angebote.'
    ];

    // Legal Information Impressum attributes
    const legalDetails = {
        firmenname: provider.firmenname || (isLivian ? 'Livianessence Co. (Markson Tiny House)' : `${providerName} GmbH`),
        adresse: provider.adresse || (isLivian ? 'Gelnhäuser Allee 10, 63571 Gelnhausen, Deutschland' : `${provider.location || 'Deutschland'}`),
        kontaktinfo: `E-Mail: ${email} | Tel: ${provider.phone || '+49 (0) 6051 4567-89'}`,
        impressumUrl: provider.impressum || 'https://campuna.de/impressum'
    };

    return (
        <div className="bg-white min-h-screen relative font-sans text-charcoal">
            <main className="max-w-7xl mx-auto  py-20">

                {/* ── Facebook / LinkedIn Style Profile Box ── */}
                <section className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-lg mb-12">

                    {/* Cover Picture */}
                    <div className="relative w-full aspect-[3/1] md:aspect-[4.5/1] overflow-hidden bg-sand/20">
                        <img
                            src={provider.coverImage || '/hero-campuna.webp'}
                            alt={`${providerName} Banner`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>

                    {/* Logo & Headline info section (overlapping cover picture) */}
                    <div className="relative px-6 md:px-12 flex flex-col items-start gap-4">

                        {/* Round profile image overlapping bottom of cover */}
                        <div className="-mt-14 md:-mt-24 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0 z-10 select-none">
                            <img
                                src={provider.logo || '/logo.webp'}
                                alt={`${providerName} Logo`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>

                    </div>

                    {/* Details & Actions section */}
                    <div className="px-6 md:px-12 pb-10 pt-4 flex flex-col lg:flex-row justify-between gap-8 items-start">

                        {/* Info and Bio area (Left) */}
                        <div className="flex-1 space-y-4 max-w-3xl">
                            <div className="space-y-1">

                                {/* Name line + verified checkmark badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
                                        {providerName}
                                    </h1>
                                    <span className="p-1 bg-forest/5 text-forest rounded-full border border-forest/10 inline-flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-forest shrink-0 fill-forest/15" />
                                    </span>
                                </div>

                                {/* Category tagline */}
                                <p className="text-xs md:text-sm font-semibold text-charcoal/65 flex items-center gap-1.5 flex-wrap">
                                    <span>{isLivian ? 'Livianessence | Tiny House Kooperation' : (provider.description?.slice(0, 45) || 'Gewerblicher Partner')}</span>
                                </p>
                            </div>

                            {/* Sub-meta details (Email, Date joined) */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs md:text-sm text-charcoal/70">
                                <a
                                    href={`mailto:${email}`}
                                    className="flex items-center gap-1.5 hover:text-forest transition-colors font-medium"
                                >
                                    <Mail className="w-4.5 h-4.5 text-gold shrink-0" />
                                    {email}
                                </a>
                                <div className="flex items-center gap-1.5 text-charcoal/85 font-semibold">
                                    <Calendar className="w-4.5 h-4.5 text-gold shrink-0" />
                                    Mitglied seit {memberSince}
                                </div>
                            </div>

                            {/* Description / Bio Lines list (as bullet items) */}
                            <div className="space-y-2 pt-4 border-t border-forest/5">
                                {bioLines.slice(isLivian ? 1 : 0).map((line, i) => (
                                    <p key={i} className="text-xs md:text-sm text-charcoal/80 leading-relaxed font-light flex items-start gap-2">

                                        <span>{line}</span>
                                    </p>
                                ))}
                            </div>

                            {/* Link / Social Icon */}
                            <div className="pt-2 flex gap-2">
                                <a
                                    href={isLivian ? 'https://markson-tinyhouse.com' : 'https://campuna.de'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8.5 h-8.5 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm shrink-0 inline-flex cursor-pointer"
                                >
                                    <Globe className="w-4.5 h-4.5" />
                                </a>
                                <a
                                    href={isLivian ? 'https://markson-tinyhouse.com' : 'https://campuna.de'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8.5 h-8.5 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm shrink-0 inline-flex cursor-pointer"
                                >
                                    <InstagramIcon className="w-4.5 h-4.5" />
                                </a>
                                <a
                                    href={isLivian ? 'https://markson-tinyhouse.com' : 'https://campuna.de'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8.5 h-8.5 rounded-full border border-forest/15 flex items-center justify-center text-charcoal/50 hover:text-forest hover:border-forest/40 hover:bg-forest/5 transition-all shadow-sm shrink-0 inline-flex cursor-pointer"
                                >
                                    <FacebookIcon className="w-4.5 h-4.5" />
                                </a>

                            </div>
                        </div>

                        {/* Support/Call to Actions (Right/Side) */}
                        <div className="w-full lg:w-auto lg:min-w-[280px] flex flex-col items-center lg:items-end gap-5 shrink-0">

                            {/* Message button */}
                            <div className="w-full text-center lg:text-right">
                                <a
                                    href={`mailto:${email}?subject=Anfrage%20über%20Campuna`}
                                    className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-colors duration-300 font-sans font-bold py-3.5 px-7 rounded-full shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                                    Verkäufer kontaktieren
                                </a>
                                <span className="block mt-2 text-[10px] text-charcoal/45 font-medium leading-none">
                                    Nachricht direkt an den Verkäufer senden
                                </span>
                            </div>

                            {/* Pioneer Badge */}
                            <div className="inline-flex items-center gap-1.5 px-4.5 py-2 border border-yellow-500/25 bg-amber-500/5 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm select-none">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                <span>Campuna Pioneer</span>
                            </div>

                        </div>

                    </div>

                </section>

                {/* ── Inserate Listings Section ── */}
                <section className="mb-14">
                    <div className="flex items-center gap-2.5 border-b border-forest/5 pb-4 mb-8">
                        <Megaphone className="w-5 h-5 text-gold shrink-0" />
                        <h2 className="font-display text-xl sm:text-2xl font-black text-forest uppercase tracking-tight">
                            Anzeigen von {providerName}
                        </h2>
                        <span className="ml-1 bg-forest/5 text-forest px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {listings.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {listings.map((item) => (
                            <div key={item.id} className="h-full">
                                <ListingCard item={item} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Legal Details Impressum Box ── */}
                <section className="max-w-7xl">
                    <div className="bg-sand/5 border border-forest/10 p-6 md:p-8 rounded-2xl shadow-sm text-charcoal">

                        <h3 className="font-display text-base md:text-lg font-bold text-forest flex items-center gap-2 pb-3.5 border-b border-forest/10 mb-5 uppercase tracking-wide">
                            <Info className="w-4.5 h-4.5 text-gold shrink-0" />
                            Rechtliche Angaben
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs md:text-sm leading-relaxed">

                            <div className="space-y-1">
                                <span className="block font-bold text-charcoal/90">Firmenname:</span>
                                <span className="font-light text-charcoal/80">{legalDetails.firmenname}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="block font-bold text-charcoal/90">Adresse:</span>
                                <span className="font-light text-charcoal/80">{legalDetails.adresse}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="block font-bold text-charcoal/90">Kontaktinformationen:</span>
                                <span className="font-light text-charcoal/80">{legalDetails.kontaktinfo}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="block font-bold text-charcoal/90">Impressum:</span>
                                <a
                                    href={legalDetails.impressumUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-forest hover:text-gold transition-colors"
                                >
                                    Siehe Anbieter-Impressum
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>

                        </div>

                    </div>
                </section>

            </main>

        </div>
    );
}

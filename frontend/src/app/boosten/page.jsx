'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Rocket, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { getMyListings } from '@/api/listings';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';
import { getImageUrl } from '@/utils/imageUrl';

function BoostenRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const listingId = searchParams.get('id') || searchParams.get('listingId') || searchParams.get('listing');

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const [mounted, setMounted] = useState(false);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !isLoggedIn) return;

        // If specific listing ID passed via query param, forward immediately
        if (listingId) {
            router.replace(`/inserate/${encodeURIComponent(listingId)}/boosten`);
            return;
        }

        // Otherwise load user's approved listings to let them pick
        const loadListings = async () => {
            try {
                setLoading(true);
                const res = await getMyListings();
                if (res?.success && Array.isArray(res.data?.listings)) {
                    const approvedListings = res.data.listings.filter(l => l.status === 'APPROVED');
                    setListings(approvedListings);
                }
            } catch (err) {
                console.error('Error loading listings for boost:', err);
            } finally {
                setLoading(false);
            }
        };

        loadListings();
    }, [mounted, isLoggedIn, listingId, router]);

    if (!mounted) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-sand/30 flex items-center justify-center p-4">
                <AuthRequiredModal
                    isOpen={true}
                    onClose={() => router.push('/')}
                    context="boost"
                    returnUrl="/boosten"
                />
            </div>
        );
    }

    if (loading) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    return (
        <div className="min-h-screen bg-[#fcfbf9] font-sans text-charcoal pt-24 sm:pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="space-y-3 text-center sm:text-left">
                    <Breadcrumbs
                        items={[
                            { label: 'Mein Konto', href: '/mein-konto' },
                            { label: 'Inserat hervorheben (Boost)', href: '#' }
                        ]}
                    />

                    <div className="bg-gradient-to-r from-forest via-[#1e613c] to-forest rounded-3xl p-6 sm:p-8 text-sand shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 border border-gold/30">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-gold/20 text-gold px-3 py-1 rounded-full border border-gold/40">
                                <Rocket className="w-3.5 h-3.5 text-gold" />
                                Inserat Boosten
                            </span>
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                                Wähle das Inserat aus, das du hervorheben möchtest
                            </h1>
                            <p className="text-xs text-sand/80 font-light">
                                Erhalte bis zu 5x mehr Anfragen durch Top-Platzierungen und das goldene Boost-Badge.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listings List */}
                {listings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 border border-beige shadow-sm text-center space-y-4">
                        <Package className="w-12 h-12 text-charcoal/30 mx-auto" />
                        <h3 className="font-display font-bold text-lg text-charcoal">
                            Keine aktiven Inserate verfügbar
                        </h3>
                        <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                            Nur freigegebene (aktive) Inserate können hervorgehoben werden.
                        </p>
                        <Link
                            href="/mein-konto?tab=create_listing"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-sand hover:bg-gold hover:text-forest transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            Jetzt Inserat erstellen
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {listings.map((item) => {
                            const isBoosted = Boolean(item.is_boosted || (item.boosted_until && new Date(item.boosted_until) > new Date()));
                            return (
                                <Link
                                    key={item.id}
                                    href={`/inserate/${encodeURIComponent(item.slug || item.id)}/boosten`}
                                    className="bg-white rounded-3xl p-5 border border-beige hover:border-forest/40 hover:shadow-md transition-all flex items-center gap-4 group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-sand/30 overflow-hidden shrink-0 border border-forest/5">
                                        <img
                                            src={getImageUrl(item.images?.[0]?.url || item.images?.[0] || item.image_url)}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {isBoosted ? (
                                                <span className="text-[9px] font-black uppercase tracking-wider bg-gold text-forest px-2 py-0.2 rounded-full">
                                                    Bereits Geboostet
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                                                    Aktiv
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-xs sm:text-sm text-charcoal truncate group-hover:text-forest transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-xs font-extrabold text-forest font-mono">
                                            {item.price ? `${parseFloat(item.price).toLocaleString('de-DE')} €` : 'VB'}
                                        </span>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-sand/40 group-hover:bg-forest group-hover:text-sand flex items-center justify-center transition-colors shrink-0">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BoostenPage() {
    return (
        <Suspense fallback={<CircleLoader size="lg" color="forest" fullPage />}>
            <BoostenRouter />
        </Suspense>
    );
}

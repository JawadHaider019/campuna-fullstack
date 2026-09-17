'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

function RedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn, user } = useAuthStore();
    const editId = searchParams.get('edit') || searchParams.get('id');

    useEffect(() => {
        if (!isLoggedIn) {
            const redirectUrl = editId
                ? `/mein-konto?tab=create_listing&edit=${editId}`
                : '/mein-konto?tab=create_listing';
            router.replace(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
            return;
        }

        if (user?.role === 'ADMIN') {
            const adminUrl = editId
                ? `/admin/inserat-erstellen?edit=${editId}`
                : '/admin/inserat-erstellen';
            router.replace(adminUrl);
        } else {
            const userUrl = editId
                ? `/mein-konto?tab=create_listing&edit=${editId}`
                : '/mein-konto?tab=create_listing';
            router.replace(userUrl);
        }
    }, [isLoggedIn, user, editId, router]);

    return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-4 font-sans">
            <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl shadow-sm border border-beige">
                <Loader2 className="w-8 h-8 text-forest animate-spin" />
                <p className="text-xs font-bold text-charcoal/60">
                    Weiterleitung zur Inserat-Erstellung...
                </p>
            </div>
        </div>
    );
}

export default function AnzeigeErstellenRedirectPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-sand flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-forest animate-spin" />
            </div>
        }>
            <RedirectContent />
        </Suspense>
    );
}

'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';

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
        <CircleLoader size="lg" color="forest" fullPage />
    );
}

export default function AnzeigeErstellenRedirectPage() {
    return (
        <Suspense fallback={
            <CircleLoader size="lg" color="forest" fullPage />
        }>
            <RedirectContent />
        </Suspense>
    );
}

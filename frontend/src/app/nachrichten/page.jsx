'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';

function NachrichtenRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    useEffect(() => {
        if (!isLoggedIn) {
            const returnTarget = id ? `/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}` : '/mein-konto?tab=nachrichten';
            router.replace(`/login?returnUrl=${encodeURIComponent(returnTarget)}`);
        } else if (id) {
            router.replace(`/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`);
        } else {
            router.replace('/mein-konto?tab=nachrichten');
        }
    }, [isLoggedIn, id, router]);

    return (
        <CircleLoader size="lg" color="forest" fullPage />
    );
}

export default function NachrichtenPage() {
    return (
        <Suspense fallback={<CircleLoader size="lg" color="forest" fullPage />}>
            <NachrichtenRedirect />
        </Suspense>
    );
}


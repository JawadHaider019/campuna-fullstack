'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';

function NachrichtenRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const returnTarget = id
        ? `/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`
        : '/mein-konto?tab=nachrichten';

    useEffect(() => {
        if (mounted && isLoggedIn) {
            if (id) {
                router.replace(`/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`);
            } else {
                router.replace('/mein-konto?tab=nachrichten');
            }
        }
    }, [mounted, isLoggedIn, id, router]);

    if (!mounted) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-sand/30 flex items-center justify-center p-4">
                <AuthRequiredModal
                    isOpen={true}
                    onClose={() => router.push('/')}
                    returnUrl={returnTarget}
                />
            </div>
        );
    }

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

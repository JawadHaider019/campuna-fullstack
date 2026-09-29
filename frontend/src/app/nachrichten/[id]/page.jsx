'use client';

import React, { useSyncExternalStore, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';

const emptySubscribe = () => () => {};

/**
 * Direct route for /nachrichten/:id
 * Shows AuthRequiredModal if not logged in, or redirects to /mein-konto?tab=nachrichten&id=:id
 */
export default function ConversationRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    const returnTarget = id
        ? `/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`
        : '/mein-konto?tab=nachrichten';

    useEffect(() => {
        if (isMounted && isLoggedIn) {
            if (id) {
                router.replace(`/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`);
            } else {
                router.replace('/mein-konto?tab=nachrichten');
            }
        }
    }, [isMounted, isLoggedIn, id, router]);

    if (!isMounted) {
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

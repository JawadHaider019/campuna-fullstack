'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CircleLoader from '@/app/components/CircleLoader';
import AuthRequiredModal from '@/app/components/AuthRequiredModal';

/**
 * Direct route for /nachrichten/:id
 * Shows AuthRequiredModal if not logged in, or redirects to /mein-konto?tab=nachrichten&id=:id
 */
export default function ConversationRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
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

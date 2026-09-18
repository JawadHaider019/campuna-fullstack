'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CircleLoader from '@/app/components/CircleLoader';

/**
 * Direct route for /nachrichten/:id
 * Redirects seamlessly to /nachrichten?id=:id to preserve the responsive split-pane messenger
 */
export default function ConversationRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    useEffect(() => {
        if (id) {
            router.replace(`/mein-konto?tab=nachrichten&id=${encodeURIComponent(id)}`);
        } else {
            router.replace('/mein-konto?tab=nachrichten');
        }
    }, [id, router]);

    return (
        <CircleLoader size="lg" color="forest" fullPage />
    );
}


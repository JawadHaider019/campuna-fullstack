'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
        <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-forest uppercase tracking-wider">
                    Unterhaltung wird geöffnet...
                </p>
            </div>
        </div>
    );
}

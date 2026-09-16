'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

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
        <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-forest uppercase tracking-wider">
                    Nachrichten im Benutzerkonto werden geöffnet...
                </p>
            </div>
        </div>
    );
}

export default function NachrichtenPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-forest uppercase tracking-wider">
                            Nachrichten werden geladen...
                        </p>
                    </div>
                </div>
            }
        >
            <NachrichtenRedirect />
        </Suspense>
    );
}

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyEmailToken } from '@/api/auth';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import CircleLoader from '@/app/components/CircleLoader';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const login = useAuthStore((state) => state.login);

    const [status, setStatus] = useState('loading'); // 'loading' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Kein Verifizierungstoken im Link gefunden.');
            return;
        }

        let isCancelled = false;

        const verify = async () => {
            try {
                const res = await verifyEmailToken(token);
                if (isCancelled) return;

                if (res.success) {
                    const data = res.data;
                    if (data?.user && data?.access_token) {
                        login(data.user, data.access_token, data.refresh_token);
                        toast.success('E-Mail erfolgreich bestätigt! Willkommen bei Campuna.');
                        if (data.user?.role === 'ADMIN') {
                            router.replace('/admin');
                        } else {
                            router.replace('/mein-konto');
                        }
                    } else {
                        toast.success('E-Mail erfolgreich bestätigt! Bitte melde dich an.');
                        router.replace('/login?verified=true');
                    }
                } else {
                    setStatus('error');
                    setErrorMessage(res.error || 'Ungültiger oder abgelaufener Verifizierungslink.');
                }
            } catch (err) {
                if (!isCancelled) {
                    setStatus('error');
                    setErrorMessage('Ein Fehler ist bei der Verifizierung aufgetreten. Bitte versuche es erneut.');
                }
            }
        };

        verify();

        return () => {
            isCancelled = true;
        };
    }, [token, router, login]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-charcoal/10 text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={130}
                            height={40}
                            className="h-9 w-auto object-contain"
                            priority
                        />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto">
                        <Loader2 className="w-7 h-7 text-forest animate-spin" />
                    </div>
                    <h2 className="text-lg font-bold text-charcoal">
                        E-Mail-Adresse wird bestätigt...
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Wir prüfen deinen Verifizierungslink und leiten dich direkt weiter.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-charcoal/10 text-center space-y-6"
            >
                <div className="flex justify-center">
                    <Link href="/" className="inline-flex items-center">
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={140}
                            height={44}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                <div className="py-4 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
                        <AlertTriangle className="w-9 h-9" />
                    </div>
                    <h2 className="text-xl font-black text-charcoal">
                        Bestätigung fehlgeschlagen
                    </h2>
                    <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                        {errorMessage}
                    </p>

                    <div className="pt-2 space-y-2">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-3 px-4 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                            <span>Zum Login</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link
                            href="/registrieren"
                            className="block text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                            Neues Konto erstellen &rarr;
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<CircleLoader size="lg" color="forest" fullPage />}>
            <VerifyEmailContent />
        </Suspense>
    );
}

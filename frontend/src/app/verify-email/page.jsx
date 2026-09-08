'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyEmailToken } from '@/api/auth';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Kein Verifizierungstoken im Link gefunden.');
            return;
        }

        let isMounted = true;

        const verify = async () => {
            try {
                const res = await verifyEmailToken(token);
                if (res.success && isMounted) {
                    setStatus('success');
                    setMessage(res.data?.message || 'Deine E-Mail-Adresse wurde erfolgreich bestätigt!');
                } else if (isMounted) {
                    setStatus('error');
                    setMessage(res.error || 'Ungültiger oder abgelaufener Verifizierungslink.');
                }
            } catch (err) {
                if (isMounted) {
                    setStatus('error');
                    setMessage('Ein Fehler ist bei der Verifizierung aufgetreten. Bitte versuche es erneut.');
                }
            }
        };

        verify();

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Automatic countdown redirect on success
    useEffect(() => {
        if (status !== 'success') return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, router]);

    return (
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-charcoal/10 text-center space-y-6"
            >
                {/* Logo */}
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

                {/* State 1: Loading */}
                {status === 'loading' && (
                    <div className="py-8 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-forest animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-charcoal">
                            E-Mail wird bestätigt...
                        </h2>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            Bitte einen kurzen Moment Geduld, wir prüfen deinen Verifizierungslink.
                        </p>
                    </div>
                )}

                {/* State 2: Success */}
                {status === 'success' && (
                    <div className="py-6 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <h2 className="text-2xl font-black text-charcoal tracking-tight">
                            Erfolgreich bestätigt! 🎉
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                            {message} Du kannst dich jetzt direkt in dein Campuna-Konto einloggen.
                        </p>

                        <div className="pt-2">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 px-4 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                            >
                                <span>Weiter zur Anmeldung ({countdown}s)</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* State 3: Error */}
                {status === 'error' && (
                    <div className="py-6 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
                            <AlertTriangle className="w-9 h-9" />
                        </div>
                        <h2 className="text-xl font-black text-charcoal">
                            Bestätigung fehlgeschlagen
                        </h2>
                        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                            {message}
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
                                href="/register"
                                className="block text-xs font-semibold text-slate-500 hover:text-slate-800"
                            >
                                Neues Konto erstellen &rarr;
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-sand flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

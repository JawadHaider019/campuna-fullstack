'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle, ArrowRight, Home, User, Loader2, ShieldAlert } from 'lucide-react';
import { revokeCancellation } from '@/api/profile';

function RevocationContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('LOADING'); // 'LOADING' | 'SUCCESS' | 'ALREADY_REVOKED' | 'ERROR'
    const [message, setMessage] = useState('');
    const [confirmationNumber, setConfirmationNumber] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('ERROR');
            setMessage('Kein gültiger Sicherheits-Token übergeben. Bitte verwende den Link aus deiner E-Mail.');
            return;
        }

        let isMounted = true;
        revokeCancellation(token)
            .then((res) => {
                if (!isMounted) return;
                const data = res?.data || res;
                if (data?.success) {
                    setConfirmationNumber(data.confirmation_number || '');
                    if (data.already_revoked) {
                        setStatus('ALREADY_REVOKED');
                        setMessage(data.message || 'Diese Kündigung wurde bereits zuvor erfolgreich widerrufen.');
                    } else {
                        setStatus('SUCCESS');
                        setMessage(data.message || 'Die Kündigung wurde erfolgreich abgewehrt und storniert.');
                    }
                } else {
                    setStatus('ERROR');
                    setMessage(data?.error || 'Der Sicherheitslink ist ungültig oder abgelaufen.');
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Revocation error:', err);
                const errMsg = err?.response?.data?.error || err?.message || 'Fehler beim Widerrufen der Kündigung.';
                setStatus('ERROR');
                setMessage(errMsg);
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    return (
        <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden"
            >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-forest-900 to-forest-800 px-6 py-8 text-center text-white relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center mb-4">
                        {status === 'LOADING' && <Loader2 className="w-8 h-8 text-emerald-300 animate-spin" />}
                        {(status === 'SUCCESS' || status === 'ALREADY_REVOKED') && <ShieldCheck className="w-8 h-8 text-emerald-400" />}
                        {status === 'ERROR' && <ShieldAlert className="w-8 h-8 text-rose-400" />}
                    </div>
                    <span className="inline-block text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full mb-2">
                        Campuna Kontoschutz (§ 312k BGB)
                    </span>
                    <h1 className="text-2xl font-black tracking-tight">
                        {status === 'LOADING' && 'Sicherheits-Token wird geprüft...'}
                        {status === 'SUCCESS' && 'Kündigung erfolgreich abgewehrt'}
                        {status === 'ALREADY_REVOKED' && 'Kündigung bereits storniert'}
                        {status === 'ERROR' && 'Widerruf fehlgeschlagen'}
                    </h1>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8">
                    {status === 'LOADING' && (
                        <div className="text-center py-8">
                            <p className="text-gray-600 text-sm">
                                Bitte habe einen kurzen Moment Geduld, deine Erklärung wird auf Echtheit verifiziert und storniert...
                            </p>
                        </div>
                    )}

                    {(status === 'SUCCESS' || status === 'ALREADY_REVOKED') && (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-emerald-950 text-base mb-1">
                                            {status === 'SUCCESS' ? 'Erfolgreich storniert!' : 'Bereits gesichert!'}
                                        </h3>
                                        <p className="text-sm text-emerald-800 leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-3 text-sm">
                                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                                    <span className="text-gray-500">Vorgangsnummer:</span>
                                    <span className="font-mono font-bold text-gray-900">
                                        {confirmationNumber || 'KND-SICHERUNG'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                                    <span className="text-gray-500">Vertragsstatus:</span>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-xs">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Vollständig Aktiv
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-500">Unberechtigter Fremdzugriff:</span>
                                    <span className="font-semibold text-gray-800">Neutralisiert & protokolliert</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                Dein Profil, deine Inseratslimits und alle bezahlten Business-Funktionen stehen dir uneingeschränkt weiter zur Verfügung.
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/mein-konto"
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-900/10"
                                >
                                    <User className="w-4 h-4" />
                                    Zu meinem Konto
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all"
                                >
                                    <Home className="w-4 h-4" />
                                    Startseite
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'ERROR' && (
                        <div className="space-y-6">
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-rose-950 text-base mb-1">
                                            Widerruf nicht möglich
                                        </h3>
                                        <p className="text-sm text-rose-800 leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                Falls du Hilfe benötigst oder dein Konto schützen möchtest, wende dich bitte direkt an unseren Kundenservice oder melde dich in deinem Campuna-Konto an.
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/kontakt"
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-rose-900/10"
                                >
                                    Kundenservice kontaktieren
                                </Link>
                                <Link
                                    href="/anmelden"
                                    className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all"
                                >
                                    Anmelden
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function RevocationPage() {
    return (
        <main className="min-h-screen bg-gray-50/60 py-12">
            <Suspense fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
                </div>
            }>
                <RevocationContent />
            </Suspense>
        </main>
    );
}

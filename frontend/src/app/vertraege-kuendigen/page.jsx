'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ShieldCheck, CheckCircle2, AlertCircle, FileText,
    ArrowRight, Printer, Download, Sparkles, Building2,
    Calendar, Clock, User, Mail, Hash, Loader2, Scale,
    HelpCircle, Info, Check, Shield, LogIn, Lock, CheckCircle
} from 'lucide-react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import {
    publicCancelContract,
    requestCancellationVerification,
    confirmCancellation,
    getMySubscription
} from '@/api/profile';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { getFriendlyErrorMessage } from '@/utils/validation';

function CancellationPageContent() {
    const searchParams = useSearchParams();
    const confirmToken = searchParams.get('confirm_token') || searchParams.get('verify_token');

    const [step, setStep] = useState(1); // 1: Input form, 2: Confirmation review, 'AWAITING_VERIFICATION': Wait for email click, 3: Success receipt
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingToken, setIsConfirmingToken] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Auth Store integration
    const { isLoggedIn, user } = useAuthStore();
    const [activeSub, setActiveSub] = useState(null);
    const [isLoadingSub, setIsLoadingSub] = useState(false);
    const [useManualForm, setUseManualForm] = useState(false);

    // Form fields conforming to § 312k Abs. 2 BGB
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contract_type: 'BUSINESS_PLAN', // BUSINESS_PLAN | LISTING_BOOST | SPOTLIGHT | ACCOUNT
        contract_number: '',
        cancellation_date_type: 'PERIOD_END', // PERIOD_END | IMMEDIATE
        reason: 'Kein Bedarf mehr',
        confirm_identity: false,
    });

    const [receiptData, setReceiptData] = useState(null);

    // Auto-detect logged in user and fetch active subscription
    useEffect(() => {
        if (isLoggedIn && user) {
            const displayName = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
            setFormData((prev) => ({
                ...prev,
                name: displayName || prev.name,
                email: user.email || prev.email,
                confirm_identity: true,
            }));

            setIsLoadingSub(true);
            getMySubscription()
                .then((res) => {
                    const sub = res?.data?.subscription || res?.subscription;
                    if (sub && sub.status === 'ACTIVE') {
                        setActiveSub(sub);
                        setFormData((prev) => ({
                            ...prev,
                            contract_type: 'BUSINESS_PLAN',
                            contract_number: sub.id ? `SUB-${sub.id}` : prev.contract_number,
                        }));
                    }
                })
                .catch(() => {})
                .finally(() => setIsLoadingSub(false));
        }
    }, [isLoggedIn, user]);

    // Resend countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Automatic verification execution when user clicks "Kündigung bestätigen (Das war ich)" in their email
    useEffect(() => {
        if (confirmToken) {
            setIsConfirmingToken(true);
            const toastId = toast.loading('Kündigung wird per E-Mail verifiziert...');
            confirmCancellation(confirmToken)
                .then((res) => {
                    const data = res?.data || res;
                    if (data?.success || data?.confirmation_number) {
                        setReceiptData(data);
                        setStep(3);
                        toast.success('Kündigung erfolgreich verifiziert und erfasst!', { id: toastId });
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                    } else {
                        toast.error(data?.error || 'Bestätigungslink ungültig oder abgelaufen.', { id: toastId });
                    }
                })
                .catch((err) => {
                    console.error('Confirmation error:', err);
                    const errMsg = err?.response?.data?.error || err?.message || 'Bestätigungslink ungültig oder abgelaufen.';
                    toast.error(errMsg, { id: toastId });
                })
                .finally(() => {
                    setIsConfirmingToken(false);
                });
        }
    }, [confirmToken]);

    const handleProceedToConfirmation = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Bitte gib deinen Namen bzw. Firmennamen an.');
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            toast.error('Bitte gib eine gültige E-Mail-Adresse an.');
            return;
        }
        if (!formData.confirm_identity) {
            toast.error('Bitte bestätige, dass du vertretungsberechtigt für diesen Vertrag bist.');
            return;
        }
        setStep(2);
        window.scrollTo({ top: 380, behavior: 'smooth' });
    };

    const handleExecuteCancellation = async () => {
        setIsSubmitting(true);

        // 1. Logged in and verified account -> Instant direct cancellation
        if (isLoggedIn && !useManualForm) {
            const toastId = toast.loading('Kündigung wird rechtssicher übermittelt...');
            try {
                const res = await publicCancelContract({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    contract_type: formData.contract_type,
                    contract_number: formData.contract_number.trim() || undefined,
                    cancellation_date_type: formData.cancellation_date_type,
                    reason: formData.reason,
                });

                if (res.data?.success || res.success) {
                    const data = res.data || res;
                    setReceiptData(data);
                    setStep(3);
                    toast.success('Kündigung erfolgreich erfasst!', { id: toastId });
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                } else {
                    toast.error(getFriendlyErrorMessage(res.data?.error || res.error, 'Übermittlung fehlgeschlagen. Bitte versuche es erneut.'), { id: toastId });
                }
            } catch (err) {
                console.error('Cancellation error:', err);
                toast.error(getFriendlyErrorMessage(err, 'Fehler bei der Übermittlung. Bitte prüfe deine Angaben.'), { id: toastId });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // 2. Guest mode -> Send Verification Email first with "Kündigung bestätigen (Das war ich)" button!
            const toastId = toast.loading('Bestätigungs-E-Mail wird vorbereitet...');
            try {
                const res = await requestCancellationVerification({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    contract_type: formData.contract_type,
                    contract_number: formData.contract_number.trim() || undefined,
                    cancellation_date_type: formData.cancellation_date_type,
                    reason: formData.reason,
                });

                if (res.data?.success || res.success) {
                    setStep('AWAITING_VERIFICATION');
                    setResendCooldown(30);
                    toast.success('Bestätigungs-E-Mail versendet! Bitte prüfe dein Postfach.', { id: toastId });
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                } else {
                    toast.error(getFriendlyErrorMessage(res.data?.error || res.error, 'Fehler beim Versenden der Bestätigungs-E-Mail.'), { id: toastId });
                }
            } catch (err) {
                console.error('Verification error:', err);
                toast.error(getFriendlyErrorMessage(err, 'Fehler beim Versenden der E-Mail. Bitte prüfe deine Eingaben.'), { id: toastId });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleResendVerificationEmail = async () => {
        if (resendCooldown > 0) return;
        setIsSubmitting(true);
        const toastId = toast.loading('Bestätigungs-E-Mail wird erneut gesendet...');
        try {
            await requestCancellationVerification({
                name: formData.name.trim(),
                email: formData.email.trim(),
                contract_type: formData.contract_type,
                contract_number: formData.contract_number.trim() || undefined,
                cancellation_date_type: formData.cancellation_date_type,
                reason: formData.reason,
            });
            setResendCooldown(30);
            toast.success('Neue Bestätigungs-E-Mail wurde versendet!', { id: toastId });
        } catch (err) {
            toast.error('Fehler beim erneuten Versenden. Bitte versuche es in Kürze erneut.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🛡️ Bulletproof 1-Page PDF Print Generator via Isolated Iframe (Prints ONLY the certificate)
    const handlePrintReceipt = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="utf-8">
                <title>Kündigungsbestätigung_${receiptData?.confirmation_number || 'Beleg'}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm 15mm; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                        background: #ffffff;
                        color: #111827;
                        margin: 0;
                        padding: 0;
                        font-size: 10pt;
                        line-height: 1.5;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
                    .label { color: #4b5563; }
                    .val { font-weight: 600; color: #111827; }
                    .badge { display: inline-block; padding: 3px 10px; background: #ecfdf5; color: #065f46; font-size: 8.5pt; font-weight: 700; border-radius: 9999px; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 2px solid #00630D;">
                    <div>
                        <h2 style="margin: 0; color: #00630D; font-size: 20pt; font-weight: 900; letter-spacing: 0.5px;">CAMPUNA</h2>
                        <div style="font-size: 8.5pt; color: #6b7280;">Dein Camping-Marktplatz • www.campuna.de</div>
                    </div>
                    <div style="text-align: right; font-size: 8pt; color: #4b5563; line-height: 1.35;">
                        <div style="font-weight: 700; color: #111827;">LMR Solutions Ronny Voigt</div>
                        <div>Premnitzer Straße 8 • 99091 Erfurt</div>
                        <div>E-Mail: kontakt@campuna.de</div>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 18px;">
                    <span class="badge">Gesetzliche Eingangsbestätigung (§ 312k Abs. 4 BGB)</span>
                    <h1 style="color: #111827; font-size: 16pt; font-weight: 800; margin: 10px 0 4px 0;">Kündigung erfolgreich eingegangen</h1>
                    <p style="color: #4b5563; font-size: 9pt; margin: 0;">Deine Erklärung wurde am ${receiptData?.date_formatted || new Date().toLocaleString('de-DE')} Uhr elektronisch erfasst und archiviert.</p>
                </div>

                <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; background: #fdfdfd;">
                    <div class="row">
                        <span class="label">Vorgangs- / Belegnummer:</span>
                        <span class="val" style="font-family: monospace; font-size: 11pt; color: #00630D;">${receiptData?.confirmation_number || ''}</span>
                    </div>
                    <div class="row">
                        <span class="label">Eingangszeitpunkt:</span>
                        <span class="val">${receiptData?.date_formatted || ''} Uhr</span>
                    </div>
                    <div class="row">
                        <span class="label">Name / Vertragspartner:</span>
                        <span class="val">${receiptData?.name || formData?.name || 'Kunde'}</span>
                    </div>
                    <div class="row">
                        <span class="label">E-Mail-Adresse:</span>
                        <span class="val">${receiptData?.email || formData?.email || ''}</span>
                    </div>
                    <div class="row">
                        <span class="label">Gekündigter Vertrag:</span>
                        <span class="val">${getContractTypeLabel(receiptData?.contract_type || formData?.contract_type)}</span>
                    </div>
                    ${(receiptData?.contract_number || formData?.contract_number) ? `
                    <div class="row">
                        <span class="label">Rechnungsnummer:</span>
                        <span class="val" style="font-family: monospace;">${receiptData?.contract_number || formData?.contract_number}</span>
                    </div>
                    ` : ''}
                    <div class="row" style="border-bottom: none;">
                        <span class="label">Wirksamkeitsdatum:</span>
                        <span class="val" style="color: #00630D;">${receiptData?.effective_date || 'Zum regulären Fristende'}</span>
                    </div>
                </div>

                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; background: #fafafa; font-size: 8pt; line-height: 1.45; color: #374151;">
                    <div style="font-weight: 700; color: #111827; margin-bottom: 2px;">Rechtssicherer Nachweis gemäß § 312k Abs. 4 BGB</div>
                    Diese Bestätigung dokumentiert den unmittelbaren elektronischen Eingang der Kündigungserklärung beim Plattformbetreiber (LMR Solutions Ronny Voigt) mit Datum und Zeitstempel. Gemäß § 312k Abs. 4 BGB ist dieses elektronisch erstellte Dokument ohne Unterschrift rechtswirksam.
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 7.5pt; color: #6b7280;">
                    <div>Campuna • Dein Camping-Marktplatz • www.campuna.de • kontakt@campuna.de</div>
                    <div>Beleg: ${receiptData?.confirmation_number || ''} • Dokument 1/1</div>
                </div>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 3000);
        }, 250);
    };

    const getContractTypeLabel = (type) => {
        switch (type) {
            case 'BUSINESS_PLAN': return 'Campuna Business-Tarif (1, 3 oder 12 Monate)';
            case 'LISTING_BOOST': return 'Inserate-Hervorhebung (Reichweiten-Boost)';
            case 'SPOTLIGHT': return 'Anbieter-Spotlight Platzierung';
            case 'ACCOUNT': return 'Gesamtes Nutzerkonto & Mitgliedschaft';
            default: return 'Campuna Vertrag';
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden print:overflow-visible print:min-h-0 print:bg-white print:text-black">
            
            {/* Direct CSS Print Protection Fallback */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-cancellation-receipt,
                    #printable-cancellation-receipt * {
                        visibility: visible !important;
                    }
                    #printable-cancellation-receipt {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                        background: #ffffff !important;
                    }
                    header, nav, footer, aside, #main-navbar, #footer, .print\\:hidden, .no-print {
                        display: none !important;
                    }
                }
            `}} />

            {/* ── 1. CINEMATIC HERO SECTION ── */}
            <section className="cancellation-hero relative min-h-[44vh] md:min-h-[48vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10 print:hidden">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/about_hero.webp"
                            alt="Verträge kündigen Campuna"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.18),transparent_50%)] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/80 border border-gold/30 text-sand text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-4 backdrop-blur-md"
                    >
                        <Scale className="w-3.5 h-3.5 text-gold" />
                        § 312k BGB • Gesetzlicher Kündigungsbutton
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold text-sand tracking-tight leading-[1.15]"
                    >
                        Verträge hier kündigen
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-3 text-xs sm:text-sm md:text-base text-sand/80 max-w-2xl font-sans font-light leading-relaxed"
                    >
                        Einfache, transparente und rechtssichere Beendigung deiner Verträge und Abonnements gemäß den gesetzlichen Verbraucherschutzvorgaben.
                    </motion.p>
                </div>
            </section>

            {/* ── 2. BREADCRUMBS ── */}
            <div className="cancellation-breadcrumbs max-w-6xl mx-auto px-4 sm:px-6 pt-6 print:hidden">
                <Breadcrumbs
                    items={[
                        { label: 'Startseite', href: '/' },
                        { label: 'Verträge kündigen (§ 312k BGB)' },
                    ]}
                />
            </div>

            {/* ── 3. MAIN CONTENT CONTAINER ── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                
                {/* Transparency Guarantee Banner */}
                <div className="cancellation-guarantee mb-10 p-5 sm:p-6 bg-sand/40 border border-forest/15 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5 text-forest" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-sm sm:text-base font-bold text-forest font-sans">
                                Transparenz-Garantie: Keine automatische Abo-Verlängerungsfalle
                            </h2>
                            <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-light">
                                Campuna Business-Pakete (1, 3 oder 12 Monate) sind als <strong>Prepaid-Festlaufzeit</strong> konzipiert und <strong>enden nach Ablauf automatisch</strong> ohne Verlängerung. Mit diesem gesetzlichen Formular kannst du ein aktives Paket dennoch vorzeitig beenden oder dein Nutzerkonto dauerhaft schließen.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/agb"
                        className="shrink-0 text-xs font-bold text-forest hover:text-gold uppercase tracking-wider underline underline-offset-4 transition-colors font-sans"
                    >
                        AGB ansehen
                    </Link>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block print:w-full print:gap-0">
                    
                    {/* LEFT / MAIN COLUMN: Form Wizard (8 Cols) */}
                    <div className="cancellation-receipt-page lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-forest/10 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none">
                        
                        {/* Step Indicator */}
                        <div className="cancellation-step-indicator flex items-center justify-between pb-6 mb-8 border-b border-forest/10 text-xs font-bold font-sans print:hidden">
                            <div className={`flex items-center gap-2.5 ${step === 1 ? 'text-forest font-extrabold' : 'text-charcoal/40'}`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 1 ? 'bg-forest text-sand' : 'bg-sand text-charcoal/50'}`}>1</span>
                                <span className="hidden sm:inline">Angaben erfassen</span>
                                <span className="sm:hidden">Erfassen</span>
                            </div>
                            <div className="w-8 sm:w-16 h-0.5 bg-forest/10" />
                            <div className={`flex items-center gap-2.5 ${step === 2 || step === 'AWAITING_VERIFICATION' ? 'text-forest font-extrabold' : 'text-charcoal/40'}`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 2 || step === 'AWAITING_VERIFICATION' ? 'bg-forest text-sand' : 'bg-sand text-charcoal/50'}`}>2</span>
                                <span className="hidden sm:inline">{step === 'AWAITING_VERIFICATION' ? 'E-Mail bestätigen' : 'Kündigung prüfen'}</span>
                                <span className="sm:hidden">{step === 'AWAITING_VERIFICATION' ? 'E-Mail' : 'Prüfen'}</span>
                            </div>
                            <div className="w-8 sm:w-16 h-0.5 bg-forest/10" />
                            <div className={`flex items-center gap-2.5 ${step === 3 ? 'text-forest font-extrabold' : 'text-charcoal/40'}`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-sand text-charcoal/50'}`}>3</span>
                                <span className="hidden sm:inline">Bestätigung</span>
                                <span className="sm:hidden">Beleg</span>
                            </div>
                        </div>

                        {/* Token Verifying Screen */}
                        {isConfirmingToken && (
                            <div className="space-y-6 text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto">
                                    <Loader2 className="w-8 h-8 text-forest animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-charcoal">
                                    Kündigung wird verifiziert...
                                </h3>
                                <p className="text-xs text-charcoal/60">
                                    Bitte habe einen kurzen Augenblick Geduld, deine Erklärung („Das war ich“) wird rechtswirksam bestätigt und archiviert.
                                </p>
                            </div>
                        )}

                        {/* ════ STEP 1: INPUT FORM (DUAL-MODE: AUTHENTICATED OR GUEST) ════ */}
                        {step === 1 && !isConfirmingToken && (
                            <form onSubmit={handleProceedToConfirmation} className="space-y-6 print:hidden">
                                
                                {/* ── A. LOGGED-IN VERIFIED ACCOUNT CARD ── */}
                                {isLoggedIn && !useManualForm && (
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-forest text-sand flex items-center justify-center font-bold text-xs shrink-0">
                                                    <CheckCircle className="w-5 h-5 text-sand" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-forest flex items-center gap-1.5">
                                                        <span>Verifiziertes Campuna-Konto</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/10 font-medium">
                                                            {user?.account_type === 'COMMERCIAL' ? 'Gewerbekonto' : 'Privatkonto'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-charcoal/70">
                                                        {formData.name} • {formData.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setUseManualForm(true)}
                                                className="text-xs text-forest hover:text-gold underline underline-offset-2 font-medium"
                                            >
                                                Anderen Vertrag als Gast kündigen
                                            </button>
                                        </div>

                                        {isLoadingSub ? (
                                            <div className="p-8 text-center text-xs text-charcoal/60 flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-forest" />
                                                <span>Abonnement-Daten werden geladen...</span>
                                            </div>
                                        ) : activeSub ? (
                                            <div className="p-5 rounded-2xl bg-[#faf8f3] border-2 border-forest/20 space-y-3 font-sans">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                                        Aktives Business-Abonnement
                                                    </span>
                                                    <span className="text-xs font-bold text-forest">
                                                        Prepaid bis: {activeSub.expires_at ? new Date(activeSub.expires_at).toLocaleDateString('de-DE') : 'Laufzeitende'}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-charcoal">
                                                    Campuna Business-Tarif
                                                </h4>
                                                <p className="text-xs text-charcoal/65 leading-relaxed font-light">
                                                    Dein Abonnement ist als <strong>Prepaid-Festlaufzeit</strong> gebucht und <strong>endet automatisch nach Ablauf</strong> ohne automatische Verlängerung. Du kannst das Paket hier verbindlich vorzeitig kündigen.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-5 rounded-2xl bg-[#faf8f3] border border-forest/15 space-y-3 font-sans">
                                                <div className="flex items-center gap-2 text-forest font-bold text-xs">
                                                    <Info className="w-4 h-4" />
                                                    Kein aktives Business-Abonnement gefunden
                                                </div>
                                                <p className="text-xs text-charcoal/70 leading-relaxed font-light">
                                                    Dein Campuna-Konto ist dauerhaft kostenlos. Du hast aktuell kein kostenpflichtiges Business-Abo gebucht.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, contract_type: 'ACCOUNT' }));
                                                            setStep(2);
                                                        }}
                                                        className="py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all text-center"
                                                    >
                                                        Gesamtes Nutzerkonto dauerhaft schließen
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseManualForm(true)}
                                                        className="py-2.5 px-4 rounded-xl border border-beige bg-white text-charcoal/80 hover:bg-sand/30 text-xs font-bold transition-all text-center"
                                                    >
                                                        Vertrag mit Rechnungsnummer eingeben
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timing and Reason options for logged-in user */}
                                        <div className="space-y-2 pt-1">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Gewünschter Beendigungszeitpunkt <span className="text-rose-600">*</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <label className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.cancellation_date_type === 'PERIOD_END' ? 'border-forest bg-forest/5' : 'border-beige hover:border-forest/30 bg-[#faf8f3]'}`}>
                                                    <input
                                                        type="radio"
                                                        name="cancellation_date_type_auth"
                                                        checked={formData.cancellation_date_type === 'PERIOD_END'}
                                                        onChange={() => setFormData({ ...formData, cancellation_date_type: 'PERIOD_END' })}
                                                        className="mt-0.5 text-forest focus:ring-forest"
                                                    />
                                                    <div>
                                                        <span className="block text-xs font-bold text-charcoal font-sans">Zum Laufzeitende (regulär)</span>
                                                        <span className="text-[11px] text-charcoal/60 leading-tight block mt-1 font-sans font-light">Vollständige Weiternutzung bis zum bezahlten Fristende</span>
                                                    </div>
                                                </label>

                                                <label className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.cancellation_date_type === 'IMMEDIATE' ? 'border-forest bg-forest/5' : 'border-beige hover:border-forest/30 bg-[#faf8f3]'}`}>
                                                    <input
                                                        type="radio"
                                                        name="cancellation_date_type_auth"
                                                        checked={formData.cancellation_date_type === 'IMMEDIATE'}
                                                        onChange={() => setFormData({ ...formData, cancellation_date_type: 'IMMEDIATE' })}
                                                        className="mt-0.5 text-forest focus:ring-forest"
                                                    />
                                                    <div>
                                                        <span className="block text-xs font-bold text-charcoal font-sans">Sofortige Beendigung</span>
                                                        <span className="text-[11px] text-charcoal/60 leading-tight block mt-1 font-sans font-light">Sofortige Deaktivierung / außerordentliche Kündigung</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 pt-1">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Kündigungsgrund <span className="text-charcoal/40 font-normal">(optional)</span>
                                            </label>
                                            <select
                                                value={formData.reason}
                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans cursor-pointer"
                                            >
                                                <option value="Kein Bedarf mehr">Kein Bedarf mehr / Fahrzeug oder Ausrüstung verkauft</option>
                                                <option value="Saisonende">Saisonende / Vorübergehende Pause</option>
                                                <option value="Zu hohe Kosten">Kosten passen nicht zu meinem Budget</option>
                                                <option value="Technische Probleme">Technische Schwierigkeiten oder Funktionsmangel</option>
                                                <option value="Sonstiges">Sonstiger Grund</option>
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-sand/30 border border-beige cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    required
                                                    checked={formData.confirm_identity}
                                                    onChange={(e) => setFormData({ ...formData, confirm_identity: e.target.checked })}
                                                    className="mt-0.5 w-4 h-4 rounded text-forest focus:ring-forest border-beige"
                                                />
                                                <span className="text-xs text-charcoal/80 font-sans leading-relaxed">
                                                    Ich bestätige, dass ich der Inhaber dieses Nutzerkontos bzw. Vertrags bin oder ordnungsgemäß bevollmächtigt bin, diese Beendigungserklärung abzugeben. <span className="text-rose-600">*</span>
                                                </span>
                                            </label>
                                        </div>

                                        <div className="pt-4 border-t border-forest/10">
                                            <button
                                                type="submit"
                                                className="w-full py-4 px-6 rounded-2xl bg-forest hover:bg-gold text-sand hover:text-forest font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                            >
                                                <span>Kündigung überprüfen</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── B. GUEST MODE (NOT LOGGED IN OR USER SWITCHED) ── */}
                                {(!isLoggedIn || useManualForm) && (
                                    <div className="space-y-6">
                                        
                                        {!isLoggedIn && (
                                            <div className="p-5 sm:p-6 rounded-2xl bg-sand/50 border border-forest/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wider">
                                                        <Sparkles className="w-4 h-4 text-gold-dark" />
                                                        Empfohlen für Campuna-Kunden
                                                    </div>
                                                    <h4 className="text-sm sm:text-base font-bold text-charcoal">
                                                        Schneller & 100% sicher mit Campuna-Konto kündigen
                                                    </h4>
                                                    <p className="text-xs text-charcoal/70 leading-relaxed font-light">
                                                        Melde dich an, um deine aktiven Verträge mit einem Klick einzusehen und rechtssicher ohne Formulareingabe zu kündigen.
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/anmelden?redirect=/vertraege-kuendigen"
                                                    className="shrink-0 py-2.5 px-5 rounded-xl bg-forest hover:bg-gold text-sand hover:text-forest text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    <LogIn className="w-3.5 h-3.5" />
                                                    <span>Jetzt anmelden</span>
                                                </Link>
                                            </div>
                                        )}

                                        {useManualForm && isLoggedIn && (
                                            <div className="flex justify-between items-center p-3 rounded-xl bg-sand/30 border border-forest/10 text-xs">
                                                <span className="text-charcoal/70">Manueller Eingabemodus aktiviert.</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setUseManualForm(false)}
                                                    className="text-forest hover:text-gold font-bold underline"
                                                >
                                                    Zurück zu meinem verifizierten Konto
                                                </button>
                                            </div>
                                        )}

                                        {!isLoggedIn && (
                                            <div className="relative py-2 flex items-center justify-center">
                                                <div className="w-full border-t border-forest/15"></div>
                                                <span className="absolute bg-white px-3 text-[11px] font-bold text-charcoal/50 uppercase tracking-widest font-sans">
                                                    Oder Kündigung ohne Anmeldung (§ 312k BGB)
                                                </span>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <h3 className="text-lg font-display font-bold text-charcoal">
                                                Vertragsdaten eingeben
                                            </h3>
                                            <p className="text-xs text-charcoal/60 leading-relaxed font-sans font-light">
                                                Bitte trage die Kontaktdaten ein, die deinem Vertrag oder Nutzerkonto hinterlegt sind.
                                            </p>
                                        </div>

                                        {/* Security Notice for Guest Submissions (§ 312k BGB Safeguard) */}
                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                            <div className="text-xs text-amber-950 leading-relaxed font-sans">
                                                <strong className="font-bold">Automatischer Kontoschutz vor Fremdzugriff:</strong>
                                                <p className="mt-0.5 text-amber-900/90 font-light">
                                                    Um Missbrauch auszuschließen, senden wir dir nach der Eingabe eine Bestätigungs-E-Mail. Die Kündigung wird erst wirksam, wenn du in deiner E-Mail auf <strong>„Kündigung bestätigen (Das war ich)“</strong> klickst.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contract Type */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Zu kündigender Vertrag / Leistung <span className="text-rose-600">*</span>
                                            </label>
                                            <select
                                                value={formData.contract_type}
                                                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                                                className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans cursor-pointer"
                                                required
                                            >
                                                <option value="BUSINESS_PLAN">Campuna Business-Tarif (1, 3 oder 12 Monate)</option>
                                                <option value="LISTING_BOOST">Inserate-Hervorhebung (Reichweiten-Boost)</option>
                                                <option value="SPOTLIGHT">Anbieter-Spotlight Platzierung</option>
                                                <option value="ACCOUNT">Gesamtes Campuna Nutzerkonto dauerhaft schließen</option>
                                            </select>
                                        </div>

                                        {/* Name Field */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Vor- und Nachname bzw. Firmenname <span className="text-rose-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="w-4 h-4 text-charcoal/40 absolute left-4 top-3.5" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="z. B. Maximilian Mustermann oder Camping GbR"
                                                    className="w-full bg-[#faf8f3] border border-beige rounded-2xl pl-11 pr-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                                />
                                            </div>
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                E-Mail-Adresse des Vertragsinhabers <span className="text-rose-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="w-4 h-4 text-charcoal/40 absolute left-4 top-3.5" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="z. B. name@beispiel.de"
                                                    className="w-full bg-[#faf8f3] border border-beige rounded-2xl pl-11 pr-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                                />
                                            </div>
                                            <p className="text-[11px] text-charcoal/50 font-light">
                                                An diese Adresse wird die Bestätigungs-E-Mail mit dem Verifizierungs-Button gesendet.
                                            </p>
                                        </div>

                                        {/* Contract / Invoice Number */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Vertragsnummer / Rechnungsnummer <span className="text-charcoal/40 font-normal">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="w-4 h-4 text-charcoal/40 absolute left-4 top-3.5" />
                                                <input
                                                    type="text"
                                                    value={formData.contract_number}
                                                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                                                    placeholder="z. B. INV-2026-0042 oder SUB-108"
                                                    className="w-full bg-[#faf8f3] border border-beige rounded-2xl pl-11 pr-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans"
                                                />
                                            </div>
                                        </div>

                                        {/* Termination Date Choice */}
                                        <div className="space-y-2 pt-1">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Gewünschter Beendigungszeitpunkt <span className="text-rose-600">*</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <label className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.cancellation_date_type === 'PERIOD_END' ? 'border-forest bg-forest/5' : 'border-beige hover:border-forest/30 bg-[#faf8f3]'}`}>
                                                    <input
                                                        type="radio"
                                                        name="cancellation_date_type"
                                                        checked={formData.cancellation_date_type === 'PERIOD_END'}
                                                        onChange={() => setFormData({ ...formData, cancellation_date_type: 'PERIOD_END' })}
                                                        className="mt-0.5 text-forest focus:ring-forest"
                                                    />
                                                    <div>
                                                        <span className="block text-xs font-bold text-charcoal font-sans">Zum Laufzeitende (regulär)</span>
                                                        <span className="text-[11px] text-charcoal/60 leading-tight block mt-1 font-sans font-light">Volle Nutzung bis zum bezahlten Fristende</span>
                                                    </div>
                                                </label>

                                                <label className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.cancellation_date_type === 'IMMEDIATE' ? 'border-forest bg-forest/5' : 'border-beige hover:border-forest/30 bg-[#faf8f3]'}`}>
                                                    <input
                                                        type="radio"
                                                        name="cancellation_date_type"
                                                        checked={formData.cancellation_date_type === 'IMMEDIATE'}
                                                        onChange={() => setFormData({ ...formData, cancellation_date_type: 'IMMEDIATE' })}
                                                        className="mt-0.5 text-forest focus:ring-forest"
                                                    />
                                                    <div>
                                                        <span className="block text-xs font-bold text-charcoal font-sans">Sofortige Beendigung</span>
                                                        <span className="text-[11px] text-charcoal/60 leading-tight block mt-1 font-sans font-light">Schnellstmögliche Deaktivierung</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="space-y-1.5 pt-1">
                                            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider font-sans">
                                                Kündigungsgrund <span className="text-charcoal/40 font-normal">(optional)</span>
                                            </label>
                                            <select
                                                value={formData.reason}
                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 font-sans cursor-pointer"
                                            >
                                                <option value="Kein Bedarf mehr">Kein Bedarf mehr / Fahrzeug oder Ausrüstung verkauft</option>
                                                <option value="Saisonende">Saisonende / Vorübergehende Pause</option>
                                                <option value="Zu hohe Kosten">Kosten passen nicht zu meinem Budget</option>
                                                <option value="Technische Probleme">Technische Schwierigkeiten oder Funktionsmangel</option>
                                                <option value="Sonstiges">Sonstiger Grund</option>
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-sand/30 border border-beige cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    required
                                                    checked={formData.confirm_identity}
                                                    onChange={(e) => setFormData({ ...formData, confirm_identity: e.target.checked })}
                                                    className="mt-0.5 w-4 h-4 rounded text-forest focus:ring-forest border-beige"
                                                />
                                                <span className="text-xs text-charcoal/80 font-sans leading-relaxed">
                                                    Ich bestätige, dass ich der Inhaber dieses Nutzerkontos bzw. Vertrags bin oder ordnungsgemäß bevollmächtigt bin, diese Beendigungserklärung abzugeben. <span className="text-rose-600">*</span>
                                                </span>
                                            </label>
                                        </div>

                                        <div className="pt-4 border-t border-forest/10">
                                            <button
                                                type="submit"
                                                className="w-full py-4 px-6 rounded-2xl bg-forest hover:bg-gold text-sand hover:text-forest font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                            >
                                                <span>Kündigung überprüfen</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </form>
                        )}

                        {/* ════ STEP 2: CONFIRMATION REVIEW STEP ════ */}
                        {step === 2 && !isConfirmingToken && (
                            <div className="space-y-6 print:hidden">
                                
                                <div className="space-y-1">
                                    <h3 className="text-xl font-display font-bold text-charcoal">
                                        Schritt 2: Angaben überprüfen
                                    </h3>
                                    <p className="text-xs text-charcoal/60 leading-relaxed font-sans font-light">
                                        Bitte prüfe deine Angaben vor dem rechtsverbindlichen Absenden.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-[#faf8f3] border border-forest/15 space-y-3 font-sans text-xs">
                                    <div className="flex items-center justify-between border-b border-forest/10 pb-2">
                                        <h4 className="font-bold text-forest uppercase tracking-wider text-[11px]">
                                            Zusammenfassung deiner Kündigung
                                        </h4>
                                        {isLoggedIn && !useManualForm ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                ✓ Verifiziertes Konto ({user?.email})
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                                                E-Mail-Verifizierung erforderlich
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between border-b border-forest/10 pb-2">
                                            <span className="text-charcoal/60">Vertragsart:</span>
                                            <span className="font-bold text-charcoal">{getContractTypeLabel(formData.contract_type)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-forest/10 pb-2">
                                            <span className="text-charcoal/60">Name / Firma:</span>
                                            <span className="font-bold text-charcoal">{formData.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-forest/10 pb-2">
                                            <span className="text-charcoal/60">E-Mail-Adresse:</span>
                                            <span className="font-bold text-charcoal">{formData.email}</span>
                                        </div>
                                        {formData.contract_number && (
                                            <div className="flex justify-between border-b border-forest/10 pb-2">
                                                <span className="text-charcoal/60">Rechnungsnummer:</span>
                                                <span className="font-mono font-bold text-charcoal">{formData.contract_number}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-forest/10 pb-2">
                                            <span className="text-charcoal/60">Wirksamkeitszeitpunkt:</span>
                                            <span className="font-bold text-forest">
                                                {formData.cancellation_date_type === 'PERIOD_END'
                                                    ? 'Zum Ende des bezahlten Zeitraums (Prepaid-Ende)'
                                                    : 'Sofort mit Eingang dieser Kündigung'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-charcoal/60">Kündigungsgrund:</span>
                                            <span className="text-charcoal">{formData.reason}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-charcoal/70 leading-relaxed font-sans font-light">
                                    {(!isLoggedIn || useManualForm) ? (
                                        <span>
                                            🛡️ <strong>Schutz vor unbefugtem Zugriff:</strong> Durch Klick auf den Button unten senden wir dir sofort eine Bestätigungs-E-Mail. Die Kündigung wird erst im System ausgeführt, sobald du in deiner E-Mail auf <strong>„Kündigung bestätigen (Das war ich)“</strong> klickst.
                                        </span>
                                    ) : (
                                        <span>
                                            Durch Anklicken der gesetzlichen Schaltfläche <strong>„Jetzt kündigen“</strong> erklärst du verbindlich die Kündigung deines Vertrags. Der Eingang wird unverzüglich elektronisch bestätigt (§ 312k Abs. 4 BGB).
                                        </span>
                                    )}
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-1/3 py-3.5 px-4 rounded-2xl border border-beige text-charcoal/70 hover:bg-sand/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Zurück
                                    </button>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        id="btn-confirm-cancellation"
                                        onClick={handleExecuteCancellation}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-2/3 py-4 px-6 rounded-2xl bg-forest hover:bg-gold text-sand hover:text-forest font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{(!isLoggedIn || useManualForm) ? 'E-Mail wird versendet...' : 'Wird übermittelt...'}</span>
                                            </>
                                        ) : (!isLoggedIn || useManualForm) ? (
                                            <>
                                                <Mail className="w-4 h-4" />
                                                <span>Bestätigungs-E-Mail anfordern</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" />
                                                <span>Jetzt kündigen</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ════ STEP AWAITING_VERIFICATION: CHECK INBOX ════ */}
                        {step === 'AWAITING_VERIFICATION' && (
                            <div className="space-y-6 text-center py-6 print:hidden">
                                <div className="w-18 h-18 rounded-3xl bg-forest/10 border-2 border-forest/20 text-forest flex items-center justify-center mx-auto shadow-md">
                                    <Mail className="w-10 h-10 text-forest animate-pulse" />
                                </div>

                                <div className="space-y-2">
                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Schritt 2 von 3: E-Mail-Bestätigung
                                    </span>
                                    <h3 className="text-2xl font-black text-charcoal font-sans">
                                        Prüfe bitte dein Postfach!
                                    </h3>
                                    <p className="text-xs text-charcoal/70 max-w-md mx-auto leading-relaxed">
                                        Wir haben eine Sicherheits-E-Mail an <strong>{formData.email}</strong> gesendet.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-[#faf8f3] border border-forest/20 text-left space-y-4 max-w-lg mx-auto text-xs font-sans">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-forest shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-forest text-sm">So schließt du deine Kündigung ab:</h4>
                                            <p className="text-charcoal/70 mt-1 leading-relaxed">
                                                Öffne die Bestätigungs-E-Mail von Campuna und klicke auf die grüne Schaltfläche:
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-center py-2">
                                        <div className="inline-block bg-forest text-sand font-bold text-xs px-6 py-3 rounded-xl shadow-md pointer-events-none select-none">
                                            Kündigung bestätigen (Das war ich) &rarr;
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-charcoal/60 leading-relaxed border-t border-forest/10 pt-3">
                                        🛡️ <strong>Schutz vor unbefugtem Zugriff:</strong> Erst nach deinem Klick in der E-Mail wird die Kündigung verbindlich im System registriert und deine offizielle Vorgangsnummer erzeugt.
                                    </p>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResendVerificationEmail}
                                        disabled={isSubmitting || resendCooldown > 0}
                                        className="py-3 px-5 rounded-xl border border-forest/20 hover:border-forest/40 bg-white text-forest text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {resendCooldown > 0 ? `E-Mail erneut senden (${resendCooldown}s)` : 'E-Mail erneut senden'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="py-3 px-5 rounded-xl text-charcoal/60 hover:text-charcoal text-xs font-medium underline"
                                    >
                                        Angaben korrigieren
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ════ STEP 3: STATUTORY ELECTRONIC RECEIPT (§ 312k Abs. 4 BGB) ════ */}
                        {step === 3 && receiptData && (
                            <div id="printable-cancellation-receipt" className="space-y-6 text-center print:text-left print:space-y-4">
                                
                                {/* ── Print-Only Official Letterhead Header ── */}
                                <div className="hidden print:flex items-start justify-between pb-4 mb-4 border-b-2 border-forest">
                                    <div className="flex items-center gap-3">
                                        <img src="/logo.webp" alt="Campuna" className="h-9 w-auto object-contain" />
                                        <div>
                                            <div className="font-bold text-forest text-base uppercase tracking-wider font-sans">Campuna</div>
                                            <div className="text-[9pt] text-gray-500 font-sans">Dein Camping-Marktplatz • www.campuna.de</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-[8.5pt] text-gray-600 leading-snug font-sans">
                                        <div className="font-bold text-gray-900">LMR Solutions Ronny Voigt</div>
                                        <div>Premnitzer Straße 8 • 99091 Erfurt</div>
                                        <div>E-Mail: kontakt@campuna.de</div>
                                    </div>
                                </div>

                                {/* Screen Checkmark Icon (Hidden on Print) */}
                                <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center mx-auto shadow-md print:hidden">
                                    <CheckCircle2 className="w-9 h-9" />
                                </div>

                                {/* Title Header */}
                                <div className="space-y-2 print:space-y-1">
                                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider print:bg-emerald-50 print:border print:border-emerald-700 print:text-emerald-900 print:text-[8pt] print:py-0.5">
                                        Gesetzliche Eingangsbestätigung (§ 312k Abs. 4 BGB)
                                    </span>
                                    <h3 className="text-2xl font-black text-charcoal font-sans print:text-lg print:text-black">
                                        Kündigung erfolgreich eingegangen!
                                    </h3>
                                    <p className="text-xs text-charcoal/70 max-w-md mx-auto print:max-w-none print:mx-0 leading-relaxed font-light print:text-gray-700 print:text-[9pt]">
                                        Deine Erklärung wurde am {receiptData.date_formatted} Uhr elektronisch erfasst und rechtswirksam im System archiviert.
                                    </p>
                                </div>

                                {/* Official Receipt Card */}
                                <div className="p-6 rounded-2xl bg-[#faf8f3] border border-forest/20 text-left space-y-3 text-xs font-sans shadow-xs print:bg-white print:border print:border-gray-800 print:rounded-none print:p-4 print:space-y-2 print:text-[9.5pt]">
                                    <div className="flex justify-between items-center pb-2.5 border-b border-forest/10 print:border-gray-300">
                                        <span className="text-charcoal/60 print:text-gray-700 font-medium">Vorgangs- / Belegnummer:</span>
                                        <span className="font-mono font-extrabold text-forest text-sm print:text-base print:text-black select-all">{receiptData.confirmation_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60 print:text-gray-700">Eingangszeitpunkt:</span>
                                        <span className="font-bold text-charcoal print:text-black">{receiptData.date_formatted} Uhr</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60 print:text-gray-700">Name / Vertragspartner:</span>
                                        <span className="font-bold text-charcoal print:text-black">{receiptData.name || formData.name || 'Kunde'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60 print:text-gray-700">E-Mail-Adresse:</span>
                                        <span className="font-bold text-charcoal print:text-black">{receiptData.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-charcoal/60 print:text-gray-700">Gekündigter Vertrag / Leistung:</span>
                                        <span className="font-bold text-charcoal print:text-black">{getContractTypeLabel(receiptData.contract_type)}</span>
                                    </div>
                                    {(receiptData.contract_number || formData.contract_number) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-charcoal/60 print:text-gray-700">Rechnungs- / Vorgangsnummer:</span>
                                            <span className="font-mono font-bold text-charcoal print:text-black">{receiptData.contract_number || formData.contract_number}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-forest/10 print:border-gray-300">
                                        <span className="text-charcoal/60 print:text-gray-700">Wirksamkeitsdatum:</span>
                                        <span className="font-bold text-forest print:text-black">{receiptData.effective_date}</span>
                                    </div>
                                    {formData.reason && (
                                        <div className="flex justify-between items-center pt-1 text-[11px] print:text-[8.5pt]">
                                            <span className="text-charcoal/60 print:text-gray-700">Angegebener Grund:</span>
                                            <span className="text-charcoal print:text-gray-800">{formData.reason}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Statutory Legal Certificate Notice (Styled for Print) */}
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs leading-relaxed text-gray-700 print:bg-white print:border print:border-gray-400 print:rounded-none print:p-3 print:text-[8.5pt]">
                                    <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5 print:text-[9pt]">
                                        <ShieldCheck className="w-4 h-4 text-forest print:inline-block" />
                                        Rechtssicherer Nachweis gemäß § 312k Abs. 4 BGB
                                    </div>
                                    <p className="text-[11px] print:text-[8pt] text-gray-600 print:text-gray-700 font-light leading-relaxed">
                                        Diese Bestätigung dokumentiert den unmittelbaren elektronischen Eingang der Kündigungserklärung beim Plattformbetreiber (LMR Solutions Ronny Voigt) mit Datum und Zeitstempel. Gemäß § 312k Abs. 4 BGB ist dieses elektronisch erstellte Dokument ohne Unterschrift rechtswirksam.
                                    </p>
                                </div>

                                {/* Screen helper text (Hidden on Print) */}
                                <p className="text-[11px] text-charcoal/50 leading-relaxed font-sans font-light print:hidden">
                                    Bitte bewahre diesen Nachweis für deine Unterlagen auf. Du kannst ihn über die Schaltfläche unten direkt drucken oder als PDF abspeichern.
                                </p>

                                {/* Screen Action Buttons (Hidden on Print) */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 print:hidden">
                                    <button
                                        type="button"
                                        onClick={handlePrintReceipt}
                                        className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl border border-forest/20 hover:border-forest/40 bg-white text-forest font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                    >
                                        <Printer className="w-4 h-4 text-forest" />
                                        <span>Beleg drucken / PDF</span>
                                    </button>

                                    <Link
                                        href="/"
                                        className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl bg-forest hover:bg-gold text-sand hover:text-forest font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                    >
                                        <span>Zur Startseite</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Print Footer Note */}
                                <div className="hidden print:flex items-center justify-between pt-3 mt-4 border-t border-gray-300 text-[8pt] text-gray-500 font-sans">
                                    <div>Campuna • Dein Camping-Marktplatz • www.campuna.de • kontakt@campuna.de</div>
                                    <div>Beleg: {receiptData.confirmation_number} • Dokument 1/1</div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT / SIDEBAR COLUMN: Legal Information & FAQs (4 Cols, Hidden on Print) */}
                    <div className="cancellation-sidebar lg:col-span-4 space-y-6 print:hidden">
                        
                        {/* Legal Rights Card */}
                        <div className="bg-sand/30 rounded-3xl p-6 border border-forest/10 space-y-4 font-sans text-xs">
                            <div className="flex items-center gap-2.5 text-forest font-bold">
                                <Scale className="w-4 h-4 text-gold-dark" />
                                <span className="uppercase tracking-wider text-[11px]">Rechtliche Hinweise</span>
                            </div>
                            <div className="space-y-3 text-charcoal/75 leading-relaxed font-light">
                                <p>
                                    <strong>Rechtsgrundlage § 312k BGB:</strong> Verbraucher und gewerbliche Kunden können Verträge im elektronischen Geschäftsverkehr über diese Schaltfläche ohne Anmeldung beenden.
                                </p>
                                <p>
                                    <strong>Eingangsbestätigung:</strong> Gemäß § 312k Abs. 4 BGB bestätigt der Plattformbetreiber den Eingang der Kündigung unverzüglich auf elektronischem Wege mit Datum und Zeitstempel.
                                </p>
                                <p>
                                    <strong>Aufbewahrungspflicht:</strong> Du kannst die Bestätigung mit der generierten Vorgangsnummer jederzeit speichern oder ausdrucken.
                                </p>
                            </div>
                        </div>

                        {/* Direct Support Card */}
                        <div className="bg-white rounded-3xl p-6 border border-forest/10 space-y-3 font-sans text-xs">
                            <div className="flex items-center gap-2.5 text-forest font-bold">
                                <Building2 className="w-4 h-4 text-forest" />
                                <span className="uppercase tracking-wider text-[11px]">Vertragspartner</span>
                            </div>
                            <div className="space-y-1 text-charcoal/70 leading-relaxed font-light">
                                <p className="font-semibold text-charcoal">LMR Solutions Ronny Voigt</p>
                                <p>Premnitzer Straße 8</p>
                                <p>99091 Erfurt, Deutschland</p>
                                <p className="pt-1.5">
                                    E-Mail: <a href="mailto:kontakt@campuna.de" className="text-forest underline font-medium">kontakt@campuna.de</a>
                                </p>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="p-4 rounded-2xl bg-sand/20 border border-forest/10 flex items-center justify-between text-xs font-bold text-forest font-sans">
                            <Link href="/abo" className="hover:text-gold transition-colors">
                                Business-Tarife
                            </Link>
                            <span>•</span>
                            <Link href="/agb" className="hover:text-gold transition-colors">
                                AGB
                            </Link>
                            <span>•</span>
                            <Link href="/impressum" className="hover:text-gold transition-colors">
                                Impressum
                            </Link>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}

export default function PublicContractCancellationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-forest animate-spin" />
            </div>
        }>
            <CancellationPageContent />
        </Suspense>
    );
}

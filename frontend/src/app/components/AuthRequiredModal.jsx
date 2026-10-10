'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, UserPlus, X, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CONTEXT_MESSAGES = {
    chat: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und sichere Kaufgespräche zu gewährleisten, ist für Direktnachrichten eine kurze Anmeldung erforderlich.'
    },
    contact: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und sichere Kaufgespräche zu gewährleisten, ist für Direktnachrichten eine kurze Anmeldung erforderlich.'
    },
    dm: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und sichere Kaufgespräche zu gewährleisten, ist für Direktnachrichten eine kurze Anmeldung erforderlich.'
    },
    profile: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und vollständige Anbieterprofile einzusehen, ist eine kurze Anmeldung erforderlich.'
    },
    seller: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und vollständige Anbieterprofile einzusehen, ist eine kurze Anmeldung erforderlich.'
    },
    provider: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um die Privatsphäre der Verkäufer zu schützen und vollständige Anbieterprofile einzusehen, ist eine kurze Anmeldung erforderlich.'
    },
    share: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um Inserate zu teilen und alle Community-Funktionen zu nutzen, ist eine kurze Anmeldung erforderlich.'
    },
    phone: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Zum Schutz vor Spam und Datenmissbrauch sind Telefonnummern privater Inserenten ausschließlich für registrierte Mitglieder einsehbar.'
    },
    boost: {
        title: 'Kostenlose Anmeldung erforderlich',
        description: 'Um Inserate hervorzuheben und Boost-Pakete zu buchen, ist eine kurze Anmeldung erforderlich.'
    }
};

export default function AuthRequiredModal({
    isOpen,
    onClose,
    context = 'chat',
    returnUrl = '',
    title,
    description,
    badge = 'DSGVO Datenschutz-Schutz'
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent background scrolling and handle Escape key while modal is open
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const activeConfig = CONTEXT_MESSAGES[context] || CONTEXT_MESSAGES.chat;
    const finalTitle = title || activeConfig.title;
    const finalDescription = description || activeConfig.description;

    const handleRegister = () => {
        onClose?.();
        const target = returnUrl ? `/registrieren?returnUrl=${encodeURIComponent(returnUrl)}` : '/registrieren';
        router.push(target);
    };

    const handleLogin = () => {
        onClose?.();
        const target = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
        router.push(target);
    };

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 15 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-forest/10 relative overflow-hidden text-left my-auto"
                >
                    {/* Top decorative gradient bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-forest via-gold to-beige" />

                    {/* Close Cross (X) Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-sand/60 hover:bg-forest hover:text-white flex items-center justify-center text-charcoal/70 transition-all duration-200 shadow-xs cursor-pointer active:scale-95 z-20"
                        aria-label="Schließen und weiter browsen"
                        title="Schließen"
                    >
                        <X className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <div className="space-y-5 text-center sm:text-left pt-1">
                        {/* Icon & Badge Header */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-forest text-gold flex items-center justify-center font-bold shadow-md shrink-0">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div className="pr-6">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-forest bg-gold/20 px-2.5 py-0.5 rounded-full mb-1 border border-gold/30">
                                    <ShieldCheck className="w-3 h-3 text-gold" />
                                    <span>{badge}</span>
                                </span>
                                <h3 className="text-lg sm:text-xl font-bold text-forest font-display leading-tight">
                                    {finalTitle}
                                </h3>
                            </div>
                        </div>

                        {/* Contextual Description */}
                        <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans font-light">
                            {finalDescription}
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-2">
                            <button
                                type="button"
                                onClick={handleRegister}
                                className="w-full bg-forest hover:bg-gold text-white hover:text-forest transition-all duration-200 font-sans font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Jetzt kostenlos registrieren</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleLogin}
                                className="w-full bg-sand/40 hover:bg-sand border border-forest/15 hover:border-forest/30 text-forest font-sans font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                            >
                                <span>Bereits registriert? Anmelden</span>
                            </button>
                        </div>

                        {/* Footer Guarantee */}
                        <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
                            <p className="text-[10px] sm:text-[11px] text-charcoal/50 leading-normal">
                                Die Registrierung ist 100% kostenlos und dauert &lt; 1 Minute.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-[11px] font-semibold text-charcoal/60 hover:text-forest underline cursor-pointer"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

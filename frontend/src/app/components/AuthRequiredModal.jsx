'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, UserPlus, X } from 'lucide-react';
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

    if (!isOpen) return null;

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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#E8EAEF] relative overflow-hidden text-left"
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sand/40 hover:bg-sand flex items-center justify-center text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer"
                        aria-label="Schließen"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-5 text-center sm:text-left">
                        {/* Icon & Badge Header */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-forest text-sand flex items-center justify-center font-bold shadow-md shrink-0">
                                <Lock className="w-6 h-6 text-gold" />
                            </div>
                            <div>
                                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                                    {badge}
                                </span>
                                <h3 className="text-lg font-bold text-charcoal font-sans leading-tight">
                                    {finalTitle}
                                </h3>
                            </div>
                        </div>

                        {/* Contextual Description */}
                        <p className="text-xs text-charcoal/70 leading-relaxed">
                            {finalDescription}
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleRegister}
                                className="w-full bg-forest hover:bg-gold text-sand hover:text-forest transition-colors font-sans font-bold py-3.5 px-6 rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4" />
                                Jetzt kostenlos registrieren
                            </button>

                            <button
                                type="button"
                                onClick={handleLogin}
                                className="w-full bg-[#faf8f3] hover:bg-sand/60 border border-beige text-charcoal font-sans font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                Bereits registriert? Anmelden
                            </button>
                        </div>

                        {/* Footer Guarantee */}
                        <p className="text-[10px] text-charcoal/50 text-center leading-normal pt-1">
                            Die Registrierung ist 100% kostenlos und dauert weniger als 1 Minute.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

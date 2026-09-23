'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Mail,
    Send,
    CheckCircle2,
    Sparkles,
    MessageSquare,
    User,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import CTA from '../components/CTA';

export default function KontaktClient() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Bitte fülle alle Pflichtfelder aus.');
            return;
        }

        setIsSubmitting(true);
        // Simulate sending contact message
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            toast.success('Deine Nachricht wurde erfolgreich übermittelt!');
        }, 800);
    };

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION (Without bottom shadow) */}
            <section className="relative min-h-[48vh] md:min-h-[54vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10">
                {/* Background Cinematic Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/about_hero.webp"
                            alt="Kontakt zu Campuna"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.15),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-4"
                    >
                        <Mail className="w-3.5 h-3.5 text-gold" />
                        Direkter Draht
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Kontakt
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md space-y-2"
                    >
                        <p>
                            Manchmal hat man eine Frage. Manchmal eine Idee. Oder man möchte uns einfach kurz etwas mitteilen.
                        </p>
                        <p className="text-white font-medium">
                            Schreib uns gerne. Wir lesen jede Nachricht.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Kontakt' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN CONTACT SECTION */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
                    
                    {/* Left Info Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                                Dein Feedback zählt
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest leading-tight">
                                Schreib uns
                            </h2>
                            <div className="w-16 h-0.5 bg-gold rounded-full mt-3" />
                        </div>

                        <p className="font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light">
                            Du kannst uns deine Nachricht direkt hier über das Formular senden oder eine E-Mail an{' '}
                            <a
                                href="mailto:kontakt@campuna.de"
                                className="text-forest font-semibold underline decoration-gold underline-offset-4 hover:text-gold transition-colors"
                            >
                                kontakt@campuna.de
                            </a>{' '}
                            schreiben.
                        </p>

                        {/* Direct Info Card */}
                        <div className="bg-sand/40 rounded-3xl p-6 sm:p-8 border border-forest/10 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-forest">E-Mail</h3>
                                    <a
                                        href="mailto:kontakt@campuna.de"
                                        className="text-sm text-charcoal/80 hover:text-gold transition-colors font-sans"
                                    >
                                        kontakt@campuna.de
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center text-gold-dark shrink-0 mt-0.5">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-forest">Datenschutz & Vertrauen</h3>
                                    <p className="text-xs sm:text-sm text-charcoal/70 font-light leading-relaxed">
                                        Die übermittelten Daten werden ausschließlich zur Bearbeitung deiner Anfrage verwendet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form Card */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-forest/10 shadow-sm relative">
                            {isSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10 space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-forest">
                                        Vielen Dank für deine Nachricht!
                                    </h3>
                                    <p className="font-sans text-sm text-charcoal/75 max-w-md mx-auto leading-relaxed font-light">
                                        Wir haben deine Mitteilung erhalten und werden uns schnellstmöglich bei dir zurückmelden.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsSubmitted(false);
                                            setFormData({ name: '', email: '', subject: '', message: '' });
                                        }}
                                        className="mt-4 px-6 py-2.5 rounded-full bg-sand hover:bg-sand/80 text-forest text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Weitere Nachricht senden
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                Dein Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Vor- und Nachname"
                                                    className="w-full bg-sand/30 border border-forest/15 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:border-forest focus:bg-white transition-all font-sans"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                Deine E-Mail-Adresse <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="name@beispiel.de"
                                                    className="w-full bg-sand/30 border border-forest/15 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:border-forest focus:bg-white transition-all font-sans"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                            Betreff (optional)
                                        </label>
                                        <div className="relative">
                                            <FileText className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="Worum geht es?"
                                                className="w-full bg-sand/30 border border-forest/15 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:border-forest focus:bg-white transition-all font-sans"
                                            />
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                            Deine Nachricht <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Schreib uns deine Frage, Idee oder Mitteilung..."
                                                className="w-full min-h-[140px] bg-sand/30 border border-forest/15 rounded-2xl p-4 text-sm text-charcoal outline-none focus:border-forest focus:bg-white transition-all font-sans resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Privacy Note */}
                                    <p className="text-[11px] sm:text-xs text-charcoal/60 leading-relaxed font-light pt-1">
                                        Die übermittelten Daten werden ausschließlich zur Bearbeitung deiner Anfrage verwendet. Weitere Informationen findest du in unserer{' '}
                                        <Link href="/datenschutzerkl_rung" className="underline hover:text-forest transition-colors">
                                            Datenschutzerklärung
                                        </Link>.
                                    </p>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-gold/25 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>{isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}</span>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* 3. STANDARD CAMPUNA CTA */}
            <div className="pt-2 pb-6">
                <CTA />
            </div>
        </div>
    );
}

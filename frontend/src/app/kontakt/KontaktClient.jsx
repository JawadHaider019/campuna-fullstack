'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Mail,
    Send,
    CheckCircle2,
    Sparkles,
    User,
    FileText,
    ShieldCheck,
    ChevronDown,
    Layers,
    Lightbulb,
    HelpCircle,
    Building2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import CTA from '../components/CTA';
import api from '@/api/client';

const CONTACT_TOPICS = [
    {
        id: 'general',
        label: 'Allgemeine Anfrage',
        desc: 'Allgemeine Fragen zu Campuna, unserem Konzept oder deiner Nutzung.'
    },
    {
        id: 'feature',
        label: 'Neue Funktion oder Camping-Helfer vermisst',
        desc: 'Vorschläge für neue Tools, Rechner oder Plattform-Funktionen.'
    },
    {
        id: 'category',
        label: 'Idee für neue Kategorie oder Rubrik',
        desc: 'Wünsche für neue Inseratskategorien oder thematische Filter.'
    },
    {
        id: 'feedback',
        label: 'Feedback, Anregung oder Lob',
        desc: 'Sag uns, was dir an Campuna gefällt oder was wir optimieren können.'
    },
    {
        id: 'support',
        label: 'Technischer Support & Inserate',
        desc: 'Hilfe bei der Inseratserstellung, Benutzerkonto oder technischen Problemen.'
    },
    {
        id: 'business',
        label: 'Gewerbliche Partnerschaft & Werbung',
        desc: 'Fragen zu Campuna Business, Händler-Präsenz oder Kooperationen.'
    }
];

// Framer motion variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
};

function KontaktFormInner() {
    const searchParams = useSearchParams();
    const initialThema = searchParams.get('thema') || searchParams.get('topic');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        topic: 'general',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (initialThema) {
            const matched = CONTACT_TOPICS.find(
                (t) => t.id === initialThema.toLowerCase() || t.id.includes(initialThema.toLowerCase())
            );
            if (matched) {
                setFormData((prev) => ({ ...prev, topic: matched.id }));
            }
        }
    }, [initialThema]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            toast.error('Bitte fülle alle Pflichtfelder aus.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/contact', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                topic: formData.topic,
                subject: formData.subject.trim(),
                message: formData.message.trim(),
            });

            if (res.success) {
                setIsSubmitted(true);
                toast.success(res.data?.message || 'Deine Nachricht wurde erfolgreich übermittelt!');
            } else {
                toast.error(res.error || 'Fehler beim Senden. Bitte versuche es erneut.');
            }
        } catch (err) {
            console.error('Contact submit error:', err);
            toast.error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTopicObj = CONTACT_TOPICS.find((t) => t.id === formData.topic) || CONTACT_TOPICS[0];

    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION */}
            <section className="relative min-h-[48vh] md:min-h-[54vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10 shadow-xs">
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
                            alt="Kontakt & Feedback zu Campuna"
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
                        Direkter Draht & Community
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Kontakt & <span className="text-gold">Feedback</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md space-y-2"
                    >
                        <p>
                            Hast du eine Frage, vermisst du eine Funktion oder möchtest du uns Feedback hinterlassen?
                        </p>
                        <p className="text-white font-medium">
                            Schreib uns gerne direkt über das Formular. Wir lesen jede Nachricht persönlich.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Kontakt & Feedback' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN SECTION (7XL Layout with Rich Entrance & Stagger Animations) */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
                    
                    {/* Left Info Column (Animated) */}
                    <motion.div
                        initial={{ opacity: 0, x: -25 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <div>
                            <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                                Dein Anliegen zählt
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest leading-tight">
                                Wir sind für dich da.
                            </h2>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: '4rem' }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="h-0.5 bg-gold rounded-full mt-3"
                            />
                        </div>

                        <p className="font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light">
                            Wähle im Formular einfach aus, worum es in deiner Nachricht geht. So können wir deine Anfrage oder dein Feedback direkt richtig zuordnen und schnell beantworten.
                        </p>

                        {/* Direct Info Card */}
                        <div className="bg-sand/30 rounded-3xl p-6 sm:p-7 border border-forest/10 space-y-5 transition-shadow hover:shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-forest">E-Mail Kontakt</h3>
                                    <p className="text-xs text-charcoal/70 mb-1">Direkte schriftliche Anfragen an unser Team:</p>
                                    <a
                                        href="mailto:kontakt@campuna.de"
                                        className="text-sm text-forest font-semibold underline decoration-gold underline-offset-4 hover:text-gold transition-colors font-sans"
                                    >
                                        kontakt@campuna.de
                                    </a>
                                </div>
                            </div>

                            <div className="border-t border-forest/10 pt-4 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center text-gold-dark shrink-0 mt-0.5">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-forest">Datenschutz & Vertraulichkeit</h3>
                                    <p className="text-xs text-charcoal/70 font-light leading-relaxed">
                                        Deine Daten werden sicher übertragen und ausschließlich zur Beantwortung deines Anliegens verarbeitet.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Community Note */}
                        <div className="bg-sand/50 rounded-2xl p-5 border border-gold/30">
                            <p className="font-sans text-xs sm:text-sm text-forest/90 leading-relaxed font-medium">
                                „Campuna wächst gemeinsam mit der Camping-Community. Jede Idee, Kritik oder Anregung hilft uns dabei, den Marktplatz kontinuierlich zu verbessern.“
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Form Card (Animated container with Staggered Input Fields) */}
                    <motion.div
                        initial={{ opacity: 0, x: 25 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-7"
                    >
                        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-forest/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative">
                            <AnimatePresence mode="wait">
                                {isSubmitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.92, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: -15 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="text-center py-10 space-y-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 15, stiffness: 250, delay: 0.1 }}
                                            className="w-16 h-16 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto"
                                        >
                                            <CheckCircle2 className="w-8 h-8" />
                                        </motion.div>
                                        <h3 className="font-display text-2xl font-bold text-forest">
                                            Vielen Dank für deine Nachricht!
                                        </h3>
                                        <p className="font-sans text-sm text-charcoal/75 max-w-md mx-auto leading-relaxed font-light">
                                            Wir haben deine Mitteilung erhalten und werden uns schnellstmöglich bei dir zurückmelden.
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => {
                                                setIsSubmitted(false);
                                                setFormData({
                                                    name: '',
                                                    email: '',
                                                    topic: 'general',
                                                    subject: '',
                                                    message: ''
                                                });
                                            }}
                                            className="mt-4 px-6 py-2.5 rounded-full bg-sand hover:bg-sand/80 text-forest text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                            Weitere Nachricht senden
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >
                                        {/* Topic Dropdown */}
                                        <motion.div variants={itemVariants} className="space-y-1.5">
                                            <label htmlFor="topic-select" className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                Worum geht es? (Grund der Kontaktaufnahme) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="topic-select"
                                                    value={formData.topic}
                                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                    className="w-full bg-sand/30 hover:bg-sand/40 border border-forest/15 focus:border-forest rounded-xl pl-4 pr-10 py-3.5 text-sm text-charcoal font-medium outline-none focus:bg-white transition-all duration-200 font-sans appearance-none cursor-pointer shadow-2xs"
                                                >
                                                    {CONTACT_TOPICS.map((topic) => (
                                                        <option key={topic.id} value={topic.id}>
                                                            {topic.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-charcoal/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                            <AnimatePresence mode="wait">
                                                {selectedTopicObj?.desc && (
                                                    <motion.p
                                                        key={selectedTopicObj.id}
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="text-[11px] text-charcoal/60 font-sans pl-1"
                                                    >
                                                        {selectedTopicObj.desc}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* Name & Email Row */}
                                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                    Dein Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative group">
                                                    <User className="w-4 h-4 text-charcoal/40 group-focus-within:text-forest transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Vor- und Nachname"
                                                        className="w-full bg-sand/30 hover:bg-sand/40 border border-forest/15 focus:border-forest rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:bg-white transition-all duration-200 font-sans"
                                                    />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                    Deine E-Mail-Adresse <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative group">
                                                    <Mail className="w-4 h-4 text-charcoal/40 group-focus-within:text-forest transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        placeholder="name@beispiel.de"
                                                        className="w-full bg-sand/30 hover:bg-sand/40 border border-forest/15 focus:border-forest rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:bg-white transition-all duration-200 font-sans"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Subject */}
                                        <motion.div variants={itemVariants} className="space-y-1.5">
                                            <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                Betreff (optional)
                                            </label>
                                            <div className="relative group">
                                                <FileText className="w-4 h-4 text-charcoal/40 group-focus-within:text-forest transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    placeholder="Kurze Zusammenfassung deines Anliegens"
                                                    className="w-full bg-sand/30 hover:bg-sand/40 border border-forest/15 focus:border-forest rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:bg-white transition-all duration-200 font-sans"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Message */}
                                        <motion.div variants={itemVariants} className="space-y-1.5">
                                            <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                                Deine Nachricht oder Idee <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    required
                                                    rows={5}
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    placeholder="Schreib uns deine Frage, Anregung, Feedback oder Idee für neue Funktionen..."
                                                    className="w-full min-h-[140px] bg-sand/30 hover:bg-sand/40 border border-forest/15 focus:border-forest rounded-2xl p-4 text-sm text-charcoal outline-none focus:bg-white transition-all duration-200 font-sans resize-none"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Privacy Note */}
                                        <motion.p variants={itemVariants} className="text-[11px] sm:text-xs text-charcoal/60 leading-relaxed font-light pt-1">
                                            Die übermittelten Daten werden ausschließlich zur Bearbeitung deiner Anfrage verwendet. Weitere Informationen findest du in unserer{' '}
                                            <Link href="/datenschutz" className="underline hover:text-forest transition-colors">
                                                Datenschutzerklärung
                                            </Link>.
                                        </motion.p>

                                        {/* Submit Button with Hover & Tap Spring Dynamics */}
                                        <motion.div variants={itemVariants}>
                                            <motion.button
                                                whileHover={{ scale: 1.025, translateY: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-[#dfbe7f] to-gold hover:brightness-105 text-forest font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-gold/25 cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full"
                                                    />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                <span>{isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}</span>
                                            </motion.button>
                                        </motion.div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                </div>
            </main>

            {/* 3. STANDARD CAMPUNA CTA */}
            <div className="pt-2 pb-6">
                <CTA />
            </div>
        </div>
    );
}

export default function KontaktClient() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <KontaktFormInner />
        </Suspense>
    );
}

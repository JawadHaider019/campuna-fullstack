'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Sparkles,
    Lightbulb,
    CheckCircle2,
    Send,
    Mail,
    User,
    FileText,
    Layers,
    Sliders,
    MessageSquareHeart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import CTA from '../components/CTA';

const FEEDBACK_TOPICS = [
    {
        id: 'function',
        label: 'Neue Funktion vermisst',
        icon: Sliders,
        desc: 'Vielleicht vermisst du eine Funktion oder einen nützlichen Helfer.'
    },
    {
        id: 'category',
        label: 'Idee für neue Kategorie',
        icon: Layers,
        desc: 'Vielleicht hast du eine Idee für eine neue Kategorie oder Rubrik.'
    },
    {
        id: 'general',
        label: 'Allgemeines Feedback & Lob',
        icon: MessageSquareHeart,
        desc: 'Oder du möchtest uns einfach sagen, was dir gefällt oder was wir verbessern können.'
    },
];

export default function FeedbackClient() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        topic: 'function',
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
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            toast.success('Vielen Dank für dein wertvolles Feedback!');
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
                            alt="Fehlt dir etwas? Sag es uns"
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
                        <Lightbulb className="w-3.5 h-3.5 text-gold" />
                        Community & Vorschläge
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Fehlt dir etwas? <span className="text-gold">Sag es uns.</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md space-y-2"
                    >
                        <p>
                            Campuna wächst Schritt für Schritt. Viele Ideen entstehen direkt aus der Community.
                        </p>
                        <p className="text-white font-medium">
                            Wenn dir etwas fehlt oder du eine Idee hast, wie Campuna noch besser werden kann, freuen wir uns über dein Feedback.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Fehlt dir etwas?' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN FEEDBACK & SUGGESTIONS SECTION */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
                    
                    {/* Left Info Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <span className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                                Ideen & Vorschläge
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-forest leading-tight">
                                Schreib uns gerne.
                            </h2>
                            <div className="w-16 h-0.5 bg-gold rounded-full mt-3" />
                        </div>

                        <p className="font-sans text-sm sm:text-base text-charcoal/80 leading-relaxed font-light">
                            Du kannst uns deine Nachricht direkt hier senden oder eine E-Mail an{' '}
                            <a
                                href="mailto:kontakt@campuna.de"
                                className="text-forest font-semibold underline decoration-gold underline-offset-4 hover:text-gold transition-colors"
                            >
                                kontakt@campuna.de
                            </a>{' '}
                            schreiben.
                        </p>

                        {/* Checklist Points from user request */}
                        <div className="space-y-3.5 bg-sand/30 rounded-3xl p-6 sm:p-7 border border-forest/10">
                            {FEEDBACK_TOPICS.map((topic) => {
                                const TopicIcon = topic.icon;
                                return (
                                    <div key={topic.id} className="flex items-start gap-3.5">
                                        <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                                            <TopicIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-display font-bold text-sm text-forest block">
                                                {topic.label}
                                            </span>
                                            <p className="font-sans text-xs sm:text-sm text-charcoal/70 font-light leading-relaxed">
                                                {topic.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Manifesto note */}
                        <div className="bg-sand/50 rounded-2xl p-5 border border-gold/30">
                            <p className="font-sans text-xs sm:text-sm text-forest/90 leading-relaxed font-medium">
                                „Campuna entsteht gemeinsam mit euch. Danke, dass du dir die Zeit nimmst, uns zu schreiben.“
                            </p>
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
                                        Vielen Dank für deine Idee!
                                    </h3>
                                    <p className="font-sans text-sm text-charcoal/75 max-w-md mx-auto leading-relaxed font-light">
                                        Wir prüfen alle Vorschläge sorgfältig, um Campuna Schritt für Schritt für alle Camper noch besser zu machen.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsSubmitted(false);
                                            setFormData({ name: '', email: '', topic: 'function', message: '' });
                                        }}
                                        className="mt-4 px-6 py-2.5 rounded-full bg-sand hover:bg-sand/80 text-forest text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Weiteres Feedback senden
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Topic Selection Chips */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                            Art des Feedbacks
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {FEEDBACK_TOPICS.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, topic: t.id })}
                                                    className={`p-3 rounded-2xl border text-left transition-all text-xs font-semibold font-sans cursor-pointer ${
                                                        formData.topic === t.id
                                                            ? 'border-forest bg-forest text-sand shadow-sm'
                                                            : 'border-forest/15 bg-sand/20 text-charcoal hover:border-forest/40'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

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

                                    {/* Message */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider font-sans block">
                                            Deine Idee oder Nachricht <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Was vermisst du? Welche Funktion oder Kategorie wünschst du dir? Was können wir verbessern?"
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

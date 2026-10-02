'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquareHeart,
    Plus,
    Send,
    Sparkles,
    Bug,
    HelpCircle,
    Building2,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Check,
    Inbox,
    RefreshCw,
    X,
    ChevronDown,
    Crown,
    Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    submitUserFeedback,
    getUserFeedbackList
} from '@/api/feedback';

const CATEGORIES = [
    {
        id: 'FEATURE',
        label: 'Funktionswunsch / Idee',
        badge: 'Funktionswunsch',
        badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
        icon: Sparkles
    },
    {
        id: 'ISSUE',
        label: 'Problem / Bug melden',
        badge: 'Problem / Bug',
        badgeColor: 'text-rose-800 bg-rose-50 border-rose-200',
        icon: Bug
    },
    {
        id: 'SUPPORT',
        label: 'Support & Frage',
        badge: 'Support & Frage',
        badgeColor: 'text-sky-800 bg-sky-50 border-sky-200',
        icon: HelpCircle
    },
    {
        id: 'COMMERCIAL',
        label: 'Gewerblich & Partner',
        badge: 'Gewerblich',
        badgeColor: 'text-purple-800 bg-purple-50 border-purple-200',
        icon: Building2
    },
    {
        id: 'GENERAL',
        label: 'Lob & Allgemeines',
        badge: 'Lob & Allgemein',
        badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        icon: MessageSquareHeart
    }
];

function formatFeedbackDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function AccountFeedbackTab({ user = null, isCommercial = false, TabHeader = null }) {
    // Feedbacks list
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [category, setCategory] = useState(isCommercial ? 'COMMERCIAL' : 'FEATURE');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch Feedbacks ────────────────────────────────────────────────────────
    const fetchFeedbacks = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getUserFeedbackList();
            const list = res?.data?.feedbacks || res?.feedbacks || (Array.isArray(res?.data) ? res.data : null);
            if (Array.isArray(list)) {
                // Newest on top
                const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setFeedbacks(sorted);
            }
        } catch (err) {
            console.error('Error fetching feedbacks:', err);
            if (!silent) toast.error('Fehler beim Laden deiner Feedbacks.');
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    // ── Submit Feedback from Modal ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error('Bitte gib eine Nachricht ein.');
            return;
        }

        const catObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
        const effectiveSubject = subject.trim() || `${catObj.badge} (${new Date().toLocaleDateString('de-DE')})`;

        setSubmitting(true);
        try {
            const res = await submitUserFeedback({
                category,
                subject: effectiveSubject,
                message: message.trim()
            });

            const isSuccess = res?.data?.success ?? res?.success;
            const newFb = res?.data?.feedback || res?.feedback;

            if (isSuccess) {
                toast.success('Vielen Dank für dein Feedback! Dein Beitrag wurde erfolgreich übermittelt.', {
                    duration: 4500
                });

                if (newFb) {
                    setFeedbacks(prev => [newFb, ...prev]);
                } else {
                    fetchFeedbacks(true);
                }

                // Reset and close modal
                setMessage('');
                setSubject('');
                setCategory(isCommercial ? 'COMMERCIAL' : 'FEATURE');
                setIsCategoryDropdownOpen(false);
                setIsCreateModalOpen(false);
            } else {
                toast.error(res?.error || res?.data?.error || 'Fehler beim Absenden des Feedbacks.');
            }
        } catch (err) {
            console.error('Error submitting feedback:', err);
            toast.error(err.response?.data?.error || 'Fehler beim Übermitteln des Feedbacks.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 w-full max-w-[1700px] mx-auto">
            
            {/* ── TOP HEADER WITH CREATE BUTTON ────────────────────────────── */}
            {TabHeader ? (
                <TabHeader
                    title="Mein Feedback & Ideen"
                    subtitle="Übersicht deiner eingereichten Vorschläge und direktes Einreichen neuer Ideen für Campuna"
                    icon={MessageSquareHeart}
                    action={
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4 text-gold" />
                            <span>Neues Feedback einreichen</span>
                        </button>
                    }
                />
            ) : (
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-beige shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-forest/10 flex items-center justify-center text-forest shadow-2xs">
                            <MessageSquareHeart className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-forest font-display flex items-center gap-2">
                                Mein Feedback & Ideen
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-forest text-sand">
                                    {feedbacks.length} {feedbacks.length === 1 ? 'Eintrag' : 'Einträge'}
                                </span>
                            </h2>
                            <p className="text-xs text-charcoal/60">
                                Deine Vorschläge und Anregungen direkt an die Campuna-Plattformleitung
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setRefreshing(true);
                                fetchFeedbacks();
                            }}
                            disabled={refreshing}
                            className="p-2.5 rounded-2xl bg-sand hover:bg-beige/60 text-forest transition-colors cursor-pointer"
                            title="Aktualisieren"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-gold" />
                            <span>Neues Feedback einreichen</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── FEEDBACK CARDS IN ROW / GRID ─────────────────────────────── */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-charcoal/40 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-forest" />
                    <span className="text-xs font-bold">Lade dein Feedback...</span>
                </div>
            ) : feedbacks.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-3xl p-12 sm:p-16 border border-beige text-center text-charcoal/40 space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-forest/5 border border-forest/10 flex items-center justify-center text-forest mx-auto">
                        <Lightbulb className="w-8 h-8 text-gold" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-base font-black text-charcoal">Noch kein Feedback eingereicht</h3>
                        <p className="text-xs text-charcoal/60 leading-relaxed">
                            Hast du Ideen für neue Features, Suchfilter oder Verbesserungsvorschläge für Campuna? Teile sie uns gerne mit!
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-forest hover:bg-[#004d0a] text-sand px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4 text-gold" />
                        <span>Jetzt erstes Feedback einreichen</span>
                    </button>
                </div>
            ) : (
                /* Cards in Row / Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {feedbacks.map((fb) => {
                        const cat = CATEGORIES.find(c => c.id === fb.category) || CATEGORIES[0];
                        const Icon = cat.icon;

                        return (
                            <motion.div
                                key={fb.id}
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-xs hover:shadow-md hover:border-gold/50 transition-all flex flex-col justify-between space-y-4 group"
                            >
                                <div className="space-y-3">
                                    {/* Top Card Header */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${cat.badgeColor}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{cat.badge}</span>
                                        </span>

                                        <span className="text-[11px] text-charcoal/40 font-mono">
                                            {formatFeedbackDate(fb.created_at)}
                                        </span>
                                    </div>

                                    {/* Subject Title */}
                                    <h3 className="text-sm font-black text-charcoal group-hover:text-forest transition-colors line-clamp-1">
                                        {fb.subject}
                                    </h3>

                                    {/* Message Text */}
                                    <p className="text-xs sm:text-sm text-charcoal/80 whitespace-pre-wrap leading-relaxed line-clamp-4">
                                        {fb.message}
                                    </p>
                                </div>

                                {/* Card Footer Status */}
                                <div className="pt-3 border-t border-beige/60 flex items-center justify-between text-[11px] text-charcoal/50">
                                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Erfolgreich eingereicht</span>
                                    </span>
                                    <span className="text-charcoal/40 text-[10px]">
                                        Von Admin erfasst
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════
                CREATE FEEDBACK MODAL (POP-UP DIALOG)
               ═════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-beige overflow-hidden flex flex-col"
                        >
                            
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 border-b border-beige bg-[#faf8f3] flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-forest/10 items-center justify-center text-forest shadow-2xs shrink-0">
                                        <MessageSquareHeart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm sm:text-base font-black text-forest font-display">
                                            Neues Feedback einreichen
                                        </h3>
                                        <p className="text-[10px] sm:text-[11px] text-charcoal/60">
                                            Direkt an das Campuna-Gründerteam
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1.5 sm:p-2 rounded-xl text-charcoal/40 hover:text-charcoal hover:bg-beige/40 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Form Body */}
                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                                
                                {/* 1. Category Dropdown with Icons */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider block">
                                        Thema / Kategorie auswählen
                                    </label>
                                    
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            className="w-full flex items-center justify-between bg-[#faf8f3] border border-beige rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-charcoal focus:outline-none focus:border-forest transition-all cursor-pointer shadow-2xs hover:bg-white"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                                                    {(() => {
                                                        const currentCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
                                                        const Icon = currentCat.icon;
                                                        return <Icon className="w-4 h-4" />;
                                                    })()}
                                                </div>
                                                <span className="truncate">
                                                    {(CATEGORIES.find(c => c.id === category) || CATEGORIES[0]).label}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-charcoal/50 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-forest' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu Options */}
                                        <AnimatePresence>
                                            {isCategoryDropdownOpen && (
                                                <>
                                                    <div 
                                                        className="fixed inset-0 z-10" 
                                                        onClick={() => setIsCategoryDropdownOpen(false)} 
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white border border-beige rounded-2xl shadow-xl p-1.5 space-y-1 max-h-60 overflow-y-auto"
                                                    >
                                                        {CATEGORIES.map((cat) => {
                                                            const Icon = cat.icon;
                                                            const isSelected = category === cat.id;
                                                            return (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCategory(cat.id);
                                                                        setIsCategoryDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? 'bg-forest text-sand font-bold'
                                                                            : 'text-charcoal hover:bg-sand/60 font-medium'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                                            isSelected ? 'bg-sand/20 text-gold' : 'bg-[#faf8f3] border border-beige text-forest'
                                                                        }`}>
                                                                            <Icon className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="text-xs truncate">{cat.label}</span>
                                                                    </div>
                                                                    {isSelected && <Check className="w-4 h-4 text-gold shrink-0 ml-2" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* 2. Optional Short Title / Subject */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider block">
                                        Kurztitel / Betreff <span className="text-charcoal/40 font-normal lowercase">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Z. B. 'Mehr Wohnmobil-Filter', 'Gefällt mir gut'..."
                                        maxLength={100}
                                        className="w-full bg-[#faf8f3] border border-beige rounded-2xl px-4 py-3 text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:bg-white transition-all shadow-2xs font-medium"
                                    />
                                </div>

                                {/* 3. Message Textarea */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider block">
                                            Dein Feedback / Deine Nachricht <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-charcoal/40 font-mono">
                                            {message.length} Zeichen
                                        </span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Beschreibe deine Idee, dein Feedback oder was dir aufgefallen ist..."
                                        className="w-full bg-[#faf8f3] border border-beige rounded-2xl p-4 text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:bg-white transition-all shadow-2xs resize-none leading-relaxed"
                                        required
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-beige">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-beige text-xs font-bold text-charcoal/70 hover:bg-sand cursor-pointer transition-colors"
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting || !message.trim()}
                                        className="px-6 py-2.5 bg-forest hover:bg-[#004d0a] text-sand text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                                                <span>Wird gesendet...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-3.5 h-3.5 text-gold" />
                                                <span>Feedback absenden</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                            </form>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

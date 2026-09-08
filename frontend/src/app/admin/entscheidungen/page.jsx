'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    Sparkles,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Sliders,
    Eye,
    RefreshCw,
    Layers,
    MapPin,
    Tag,
    ShieldCheck,
    Building2,
    User,
    Cpu,
    Zap,
    Check,
    X,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    SlidersHorizontal,
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAdminDecisions,
    simulateAiScan,
    submitAdminManualDecision
} from '@/api/admin';

export default function AdminDecisionsPage() {
    // Data State
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // 'ALL' | 'MANUAL_REVIEW' | 'AUTO_APPROVED' | 'AUTO_REJECTED'
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [summary, setSummary] = useState({
        totalProcessed: 0,
        manualReviewCount: 0,
        autoApprovedCount: 0,
        autoRejectedCount: 0,
        avgScore: 50
    });

    // Simulation Modal State
    const [simModalOpen, setSimModalOpen] = useState(false);
    const [targetListing, setTargetListing] = useState(null);
    const [simScore, setSimScore] = useState(50);
    const [simulating, setSimulating] = useState(false);

    // Detail & Feedback
    const [selectedDecision, setSelectedDecision] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // Fetch decisions from backend
    const fetchDecisions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminDecisions({
                page,
                limit: 10,
                filter,
                search: search.trim() || undefined
            });

            if (res.data?.success) {
                setDecisions(res.data.decisions || []);
                setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
                setSummary(res.data.summary || {});
            }
        } catch (error) {
            console.error('Failed to load decisions:', error);
            showFeedback('Fehler beim Laden der KI-Entscheidungen.', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filter, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDecisions();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchDecisions]);

    const showFeedback = (msg, type = 'success') => {
        setFeedbackMessage({ msg, type });
        setTimeout(() => setFeedbackMessage(null), 4000);
    };

    // Manual Admin Decision (especially for Score 50)
    const handleAdminDecision = async (listingId, decision) => {
        setActionLoading(true);
        try {
            const res = await submitAdminManualDecision(listingId, decision);
            if (res.success || res.data?.success) {
                showFeedback(
                    res.data?.message || (decision === 'APPROVED'
                        ? 'Inserat wurde manuell durch Administrator FREIGEGEBEN.'
                        : 'Inserat wurde manuell durch Administrator ABGELEHNT.')
                );
                fetchDecisions();
                if (detailModalOpen && selectedDecision?.id === listingId) {
                    setDetailModalOpen(false);
                }
            } else {
                showFeedback(res.error || res.data?.error || 'Aktion fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Aktion fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Trigger AI Scan Simulation
    const handleSimulateScan = async () => {
        if (!targetListing) return;
        setSimulating(true);
        try {
            const res = await simulateAiScan(targetListing.id, simScore);
            if (res.success || res.data?.success) {
                showFeedback(res.data?.message || res.message || 'Simulation erfolgreich.');
                setSimModalOpen(false);
                setTargetListing(null);
                fetchDecisions();
            } else {
                showFeedback(res.error || res.data?.error || 'Simulation fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Simulation fehlgeschlagen.', 'error');
        } finally {
            setSimulating(false);
        }
    };

    // Format helpers
    const formatPrice = (price, negotiable) => {
        const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(price || 0);
        return `${formatted}${negotiable ? ' VB' : ''}`;
    };

    const getScoreBadge = (score, decision) => {
        if (score >= 75) {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Score: {score}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-200/60 font-mono">
                        Auto-Freigabe
                    </span>
                </div>
            );
        } else if (score <= 30) {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Score: {score}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-rose-200/60 font-mono">
                        Auto-Abgelehnt
                    </span>
                </div>
            );
        } else {
            // Score around 50
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Score: {score}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-200 font-mono font-bold text-amber-900">
                        Manuelle Prüfung nötig
                    </span>
                </div>
            );
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">

            {/* ─── Feedback Toast ─── */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${feedbackMessage.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}
                    >
                        {feedbackMessage.type === 'error' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>{feedbackMessage.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Top Page Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EAEF] pb-5">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-gold/15 text-gold">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                                    KI-Entscheidungszentrum
                                </h1>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest text-sand font-bold font-mono uppercase">
                                    Simulator aktiv
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Übersicht aller automatisierten KI-Prüfungen & manuelle Freigabe für Inserate mit Grenzwert (Score ~50).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Refresh Button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchDecisions}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E4E8] text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest' : 'text-slate-500'}`} />
                        <span>Aktualisieren</span>
                    </button>
                </div>
            </div>

            {/* ─── Top Stats Bento Pills (5 Cards) ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

                {/* 1. Gesamt verarbeitet */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Gescannte Inserate
                        </span>
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {summary.totalProcessed || 0}
                    </div>
                </div>

                {/* 2. Manuelle Prüfung nötig (Score ~50) */}
                <div className={`border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between transition-all ${(summary.manualReviewCount || 0) > 0
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
                        : 'bg-white border-[#E8EAEF]'
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            {(summary.manualReviewCount || 0) > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                            )}
                            Manuell prüfen (~50)
                        </span>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-900 mt-1">
                        {summary.manualReviewCount || 0}
                    </div>
                </div>

                {/* 3. KI Auto-Freigegeben */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            KI-Freigegeben (&ge;75)
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                        {summary.autoApprovedCount || 0}
                    </div>
                </div>

                {/* 4. KI Auto-Abgelehnt */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            KI-Abgelehnt (&le;30)
                        </span>
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                        {summary.autoRejectedCount || 0}
                    </div>
                </div>

                {/* 5. Durchschnittlicher Score */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Durchschnitts-Score
                        </span>
                        <Zap className="w-3.5 h-3.5 text-gold" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-slate-900">{summary.avgScore || 50}</span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                </div>

            </div>

            {/* ─── Interactive AI Decision Rule Banner ─── */}
            <div className="bg-gradient-to-r from-[#003B07]/90 to-[#002204] text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-forest/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-gold" />
                        <h3 className="text-sm font-bold text-sand">
                            KI-Bewertungslogik & Grenzwerte (Regelwerk)
                        </h3>
                    </div>
                    <p className="text-xs text-sand/80 max-w-2xl">
                        Inserate mit einem <strong>Score um 50</strong> werden weder automatisch genehmigt noch abgelehnt – sie verbleiben im Status <strong>"In Prüfung"</strong>, bis ein Administrator die finale Freigabe erteilt.
                    </p>
                </div>

                {/* Visual Scale Indicator */}
                <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-2xl border border-white/10 shrink-0 text-[11px] font-mono">
                    <div className="flex flex-col items-center">
                        <span className="text-rose-400 font-bold">&le; 30</span>
                        <span className="text-[9px] text-rose-300/80">Auto-Reject</span>
                    </div>
                    <span className="text-white/30">&rarr;</span>
                    <div className="flex flex-col items-center px-2 py-0.5 rounded-lg bg-amber-500/30 border border-amber-400/40">
                        <span className="text-amber-300 font-bold">~ 50</span>
                        <span className="text-[9px] text-amber-200">Admin-Prüfung</span>
                    </div>
                    <span className="text-white/30">&rarr;</span>
                    <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-bold">&ge; 75</span>
                        <span className="text-[9px] text-emerald-300/80">Auto-Approve</span>
                    </div>
                </div>
            </div>

            {/* ─── Search & Filter Tabs ─── */}
            <div className="bg-white border border-[#E8EAEF] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Suche nach Titel, Verkäufer, Ort, Kategorie..."
                            className="w-full bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-[#F4F5F7] p-1 rounded-xl flex flex-wrap items-center text-xs gap-1">
                        {[
                            { label: 'Alle Entscheidungen', val: 'ALL' },
                            {
                                label: '⚠️ Manuelle Prüfung (~50)',
                                val: 'MANUAL_REVIEW',
                                count: summary.manualReviewCount,
                                highlight: true
                            },
                            { label: '🟢 KI-Freigegeben (≥75)', val: 'AUTO_APPROVED' },
                            { label: '🔴 KI-Abgelehnt (≤30)', val: 'AUTO_REJECTED' },
                        ].map((tab) => (
                            <button
                                key={tab.val}
                                onClick={() => {
                                    setFilter(tab.val);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${filter === tab.val
                                        ? tab.highlight
                                            ? 'bg-amber-500 text-white shadow-2xs font-bold'
                                            : 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {Boolean(tab.count) && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filter === tab.val ? 'bg-white text-amber-900' : 'bg-amber-500 text-white'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* ─── Main Decisions Feed / Table ─── */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white border border-[#E8EAEF] rounded-3xl p-16 text-center">
                        <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-400">
                            KI-Entscheidungen werden geladen...
                        </span>
                    </div>
                ) : decisions.length === 0 ? (
                    <div className="bg-white border border-[#E8EAEF] rounded-3xl p-16 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Keine Entscheidungen gefunden</h4>
                        <p className="text-xs text-slate-400">Passe deine aktiven Filter an oder starte eine neue Simulation.</p>
                    </div>
                ) : (
                    decisions.map((item) => {
                        const mainImage = item.images?.[0] || '/logo.webp';
                        const isBorderline50 = item.ai.score >= 31 && item.ai.score < 75;
                        const needsAdminAction = item.listing_status === 'REVIEW' || item.ai.moderation_status === 'PENDING';

                        return (
                            <div
                                key={item.id}
                                className={`bg-white border rounded-3xl p-5 shadow-2xs transition-all flex flex-col lg:flex-row gap-5 justify-between ${isBorderline50 && needsAdminAction
                                        ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-white via-white to-amber-50/30'
                                        : 'border-[#E8EAEF] hover:border-slate-300'
                                    }`}
                            >
                                {/* Left Side: Product Thumbnail & Meta */}
                                <div className="flex gap-4 flex-1">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-[#E8EAEF] overflow-hidden shrink-0 relative">
                                        <Image
                                            src={mainImage}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getScoreBadge(item.ai.score, item.ai.decision)}
                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                                {item.category}
                                            </span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {item.location}
                                            </span>
                                        </div>

                                        <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                                            {item.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                                            <span className="font-bold text-forest text-sm font-display">
                                                {formatPrice(item.price, item.negotiable)}
                                            </span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                {item.seller?.type === 'COMMERCIAL' ? (
                                                    <Building2 className="w-3 h-3 text-forest" />
                                                ) : (
                                                    <User className="w-3 h-3 text-slate-400" />
                                                )}
                                                <span className="font-medium text-slate-700">{item.seller?.name}</span>
                                                <span className="text-[10px] text-slate-400">({item.seller?.email})</span>
                                            </div>
                                        </div>

                                        {/* AI Reasons Insights */}
                                        {item.ai.reasons?.length > 0 && (
                                            <div className="mt-2 space-y-1 bg-[#F8F9FA] p-2.5 rounded-xl text-[11px] text-slate-700">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase block">
                                                    KI-Analysefaktoren & Begründung:
                                                </span>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                    {item.ai.reasons.map((r, idx) => (
                                                        <li key={idx} className={r.includes('👉') ? 'text-amber-900 font-bold' : ''}>
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Scoring Sub-bars & Admin Actions */}
                                <div className="flex flex-col justify-between gap-4 lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#E8EAEF] pt-4 lg:pt-0 lg:pl-5">

                                    {/* Sub-factor Breakdown Progress Bars */}
                                    <div className="space-y-2 bg-[#FBFBFC] p-3 rounded-2xl border border-[#E8EAEF] text-[11px]">
                                        <div className="flex justify-between font-semibold text-slate-600">
                                            <span>Textqualität</span>
                                            <span className="font-mono font-bold text-slate-900">{item.ai.text_score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-forest h-full rounded-full"
                                                style={{ width: `${item.ai.text_score}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between font-semibold text-slate-600 pt-1">
                                            <span>Bildanalyse</span>
                                            <span className="font-mono font-bold text-slate-900">{item.ai.image_score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gold h-full rounded-full"
                                                style={{ width: `${item.ai.image_score}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between font-semibold text-slate-600 pt-1">
                                            <span>Preiskonformität</span>
                                            <span className="font-mono font-bold text-slate-900">{item.ai.price_score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-full rounded-full"
                                                style={{ width: `${item.ai.price_score}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {/* If Score 50 / Pending, Show Prominent Admin Overriding Decision Buttons */}
                                        {needsAdminAction ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAdminDecision(item.id, 'APPROVED')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Admin Genehmigen</span>
                                                </button>
                                                <button
                                                    onClick={() => handleAdminDecision(item.id, 'REJECTED')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Admin Ablehnen</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded-xl">
                                                <span className="text-slate-400 font-semibold">Status im Marktplatz:</span>
                                                <span className={`font-bold ${item.listing_status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                                                    }`}>
                                                    {item.listing_status === 'APPROVED' ? '✓ Aktiv / Freigegeben' : '✗ Abgelehnt'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Trigger AI Scan Simulator Button */}
                                        <button
                                            onClick={() => {
                                                setTargetListing(item);
                                                setSimScore(item.ai.score || 50);
                                                setSimModalOpen(true);
                                            }}
                                            className="w-full py-1.5 px-3 rounded-xl border border-[#E2E4E8] bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
                                            <span>KI-Scan simulieren...</span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── Pagination Bar ─── */}
            <div className="bg-white border border-[#E8EAEF] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                    Zeige <span className="font-bold text-slate-800">{decisions.length}</span> von{' '}
                    <span className="font-bold text-slate-800">{pagination.total}</span> KI-Entscheidungen
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1 || loading}
                        className="px-3 py-1.5 rounded-lg border border-[#E2E4E8] bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Zurück</span>
                    </button>
                    <span className="px-3 py-1.5 text-slate-700 font-bold font-mono">
                        Seite {page} von {pagination.totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                        disabled={page >= pagination.totalPages || loading}
                        className="px-3 py-1.5 rounded-lg border border-[#E2E4E8] bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                        <span>Weiter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ─── MODAL: AI SCAN SIMULATOR ─── */}
            <AnimatePresence>
                <motion.div
                    key="sim-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E8EAEF]"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#E8EAEF] pb-3">
                            <div className="flex items-center gap-2 text-forest">
                                <Sparkles className="w-5 h-5 text-gold" />
                                <h3 className="text-base font-black text-slate-900">
                                    KI-Scan Simulator
                                </h3>
                            </div>
                            <button
                                onClick={() => setSimModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-slate-400 font-semibold">Ziel-Inserat:</span>
                            <p className="text-xs font-bold text-slate-900 truncate">
                                {targetListing.title}
                            </p>
                        </div>

                        {/* Preset Buttons */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase font-bold text-slate-400 block">
                                Schnell-Presets für Simulation:
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setSimScore(50)}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${simScore === 50
                                            ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/20'
                                            : 'border-[#E8EAEF] hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="text-sm font-black text-amber-600">Score 50</div>
                                    <div className="text-[10px] text-slate-500 font-normal">Manuelle Prüfung</div>
                                </button>

                                <button
                                    onClick={() => setSimScore(88)}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${simScore >= 75
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400/20'
                                            : 'border-[#E8EAEF] hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="text-sm font-black text-emerald-600">Score 88</div>
                                    <div className="text-[10px] text-slate-500 font-normal">KI-Auto-Freigabe</div>
                                </button>

                                <button
                                    onClick={() => setSimScore(20)}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${simScore <= 30
                                            ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400/20'
                                            : 'border-[#E8EAEF] hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="text-sm font-black text-rose-600">Score 20</div>
                                    <div className="text-[10px] text-slate-500 font-normal">KI-Auto-Reject</div>
                                </button>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="space-y-2 bg-[#F8F9FA] p-4 rounded-2xl border border-[#E8EAEF]">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span>Simulierter KI-Score:</span>
                                <span className={`text-sm px-2.5 py-0.5 rounded-lg font-mono font-black ${simScore >= 75 ? 'bg-emerald-100 text-emerald-900' :
                                        simScore <= 30 ? 'bg-rose-100 text-rose-900' :
                                            'bg-amber-100 text-amber-900'
                                    }`}>
                                    {simScore} / 100
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={simScore}
                                onChange={(e) => setSimScore(parseInt(e.target.value, 10))}
                                className="w-full accent-forest cursor-pointer"
                            />

                            <div className="text-[11px] text-slate-500 pt-1">
                                {simScore >= 75 && '🟢 Dieser Score führt zu automatischer Freigabe des Inserats.'}
                                {simScore <= 30 && '🔴 Dieser Score führt zu automatischer Ablehnung des Inserats.'}
                                {simScore > 30 && simScore < 75 && '🟡 Dieser Score (z. B. 50) verlangt eine manuelle Entscheidung durch den Admin.'}
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setSimModalOpen(false)}
                                disabled={simulating}
                                className="px-4 py-2 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSimulateScan}
                                disabled={simulating}
                                className="px-4 py-2 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                {simulating ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
                                        <span>KI-Scan wird simuliert...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                                        <span>Simulation ausführen</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>

            </AnimatePresence>

        </div>
    );
}

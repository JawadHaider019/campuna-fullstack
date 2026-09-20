'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUrl';
import CircleLoader from '@/app/components/CircleLoader';
import {
    Sparkles,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Sliders,
    Eye,
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
    ExternalLink,
    Phone
} from 'lucide-react';
import {
    getAdminDecisions,
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

    // Detail & Feedback
    const [selectedDecision, setSelectedDecision] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
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
                // Optimistic UI updates so badges and status immediately reflect admin decision
                setDecisions(prev => prev.map(d => {
                    if (d.id === listingId) {
                        return {
                            ...d,
                            listing_status: decision,
                            ai: {
                                ...d.ai,
                                moderation_status: decision,
                                decision: decision === 'APPROVED' ? 'MANUAL_APPROVED' : 'MANUAL_REJECTED'
                            }
                        };
                    }
                    return d;
                }));
                if (selectedDecision && selectedDecision.id === listingId) {
                    setSelectedDecision(prev => ({
                        ...prev,
                        listing_status: decision,
                        ai: {
                            ...prev.ai,
                            moderation_status: decision,
                            decision: decision === 'APPROVED' ? 'MANUAL_APPROVED' : 'MANUAL_REJECTED'
                        }
                    }));
                }
                fetchDecisions();
            } else {
                showFeedback(res.error || res.data?.error || 'Aktion fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Aktion fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
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

    const getScoreBadge = (score, decision, listingStatus, moderationStatus) => {
        const numScore = score ?? 50;

        // 1. If approved (by Admin or Auto-Approved)
        if (listingStatus === 'APPROVED' || moderationStatus === 'APPROVED') {
            if (numScore >= 75 && decision === 'AUTO_APPROVED') {
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Score: {numScore}/100</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-200/60 font-mono">
                            Auto-Freigabe
                        </span>
                    </div>
                );
            } else {
                // Score ~50 or manually approved by admin
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Score: {numScore}/100</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-200/80 font-mono font-black text-emerald-900">
                            Durch Admin genehmigt
                        </span>
                    </div>
                );
            }
        }

        // 2. If rejected (by Admin or Auto-Rejected)
        if (listingStatus === 'REJECTED' || moderationStatus === 'REJECTED') {
            if (numScore <= 30 && decision === 'AUTO_REJECTED') {
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Score: {numScore}/100</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-rose-200/60 font-mono">
                            Auto-Abgelehnt
                        </span>
                    </div>
                );
            } else {
                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Score: {numScore}/100</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-rose-200/80 font-mono font-black text-rose-900">
                            Durch Admin abgelehnt
                        </span>
                    </div>
                );
            }
        }

        // 3. Pending Review (Score ~50)
        if (numScore >= 75) {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Score: {numScore}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-200/60 font-mono">
                        Auto-Freigabe
                    </span>
                </div>
            );
        } else if (numScore <= 30) {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Score: {numScore}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-rose-200/60 font-mono">
                        Auto-Abgelehnt
                    </span>
                </div>
            );
        } else {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Score: {numScore}/100</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-200 font-mono font-bold text-amber-900">
                        Manuelle Prüfung nötig
                    </span>
                </div>
            );
        }
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-10">

            {/* ─── Feedback Toast ─── */}
            {feedbackMessage && (
                <div
                    className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all duration-300 ${feedbackMessage.type === 'error'
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
                </div>
            )}

            {/* ─── Top Page Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                                KI-Entscheidungszentrum
                            </h1>

                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Übersicht aller automatisierten KI-Prüfungen & manuelle Freigabe für Inserate mit Grenzwert (Score ~50).
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Top Stats Bento Cards (5 Cards matching Dashboard styling) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* 1. Gescannte Inserate (Forest-to-Black Gradient Luxury Card) */}
                <div
                    onClick={() => { setFilter('ALL'); setPage(1); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gescannte Inserate
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {summary.totalProcessed || 0}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">KI-Qualitätsprüfung</span>

                        </div>
                    </div>
                </div>

                {/* 2. Manuelle Prüfung nötig (Score ~50) */}
                <div
                    onClick={() => { setFilter('MANUAL_REVIEW'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Manuell prüfen (~50)
                        </span>
                        <div className="w-6 h-6 flex items-center justify-center">
                            {(summary.manualReviewCount || 0) > 0 ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-[#EBF7EE] text-[#1E7E50] flex items-center justify-center font-bold text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.manualReviewCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                            {(summary.manualReviewCount || 0) > 0 ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Admin-Entscheid
                                </span>
                            ) : (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Keine Grenzfälle
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. KI Auto-Freigegeben (≥75) */}
                <div
                    onClick={() => { setFilter('AUTO_APPROVED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            KI-Freigegeben (≥75)
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.autoApprovedCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                            <span>Score ≥ 75 automatisch </span>
                        </div>
                    </div>
                </div>

                {/* 4. KI Auto-Abgelehnt (≤30) */}
                <div
                    onClick={() => { setFilter('AUTO_REJECTED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            KI-Abgelehnt (≤30)
                        </span>
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.autoRejectedCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-semibold mt-1">
                            <span>Score ≤ 30 abgewiesen</span>
                        </div>
                    </div>
                </div>

                {/* 5. Durchschnittlicher Score */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Durchschnitts-Score
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                            <Zap className="w-3.5 h-3.5 text-[#C8A96B]" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.avgScore || 50} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                            <span>Gesamt-Qualitätsindex</span>
                        </div>
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
                                label: 'Manuelle Prüfung (~50)',
                                val: 'MANUAL_REVIEW',
                                count: summary.manualReviewCount,
                                highlight: true
                            },
                            { label: 'KI-Freigegeben (≥75)', val: 'AUTO_APPROVED' },
                            { label: 'KI-Abgelehnt (≤30)', val: 'AUTO_REJECTED' },
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
                                {tab.count > 0 ? (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filter === tab.val ? 'bg-white text-amber-900' : 'bg-amber-500 text-white'
                                        }`}>
                                        {tab.count}
                                    </span>
                                ) : null}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* ─── Main Decisions Feed / Table ─── */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 flex items-center justify-center">
                        <CircleLoader size="lg" color="forest" />
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
                        const mainImage = item.images?.[0] ? getImageUrl(item.images[0], '/logo.webp') : '/logo.webp';
                        const isBorderline50 = item.ai?.score >= 31 && item.ai?.score < 75;
                        const needsAdminAction = item.listing_status === 'REVIEW' || item.ai?.moderation_status === 'PENDING';

                        return (
                            <div
                                key={item.id}
                                className={`bg-white border rounded-3xl p-5 shadow-2xs transition-all flex flex-col lg:flex-row gap-5 justify-between min-w-0 overflow-hidden ${isBorderline50 && needsAdminAction
                                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-white via-white to-amber-50/30'
                                    : 'border-[#E8EAEF] hover:border-slate-300'
                                    }`}
                            >
                                {/* Left Side: Product Thumbnail & Meta */}
                                <div className="flex gap-4 flex-1 min-w-0">
                                    <div
                                        onClick={() => {
                                            setSelectedDecision(item);
                                            setActiveImageIdx(0);
                                            setDetailModalOpen(true);
                                        }}
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-[#E8EAEF] overflow-hidden shrink-0 relative cursor-pointer group"
                                        title="Inserat Details & Prüfung öffnen"
                                    >
                                        <Image
                                            src={mainImage}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getScoreBadge(item.ai?.score, item.ai?.decision, item.listing_status, item.ai?.moderation_status)}
                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold truncate max-w-[180px]">
                                                {item.category}
                                            </span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate max-w-[160px]">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{item.location}</span>
                                            </span>
                                        </div>

                                        <h3
                                            onClick={() => {
                                                setSelectedDecision(item);
                                                setActiveImageIdx(0);
                                                setDetailModalOpen(true);
                                            }}
                                            className="text-sm sm:text-base font-black text-slate-900 truncate hover:text-forest cursor-pointer transition-colors"
                                            title="Klicken für vollständige Inserate-Vorschau & Details"
                                        >
                                            {item.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                            <span className="font-bold text-forest text-sm font-display shrink-0">
                                                {formatPrice(item.price, item.negotiable)}
                                            </span>
                                            <span className="shrink-0">•</span>
                                            <div className="flex items-center gap-1 min-w-0">
                                                {item.seller?.type === 'COMMERCIAL' ? (
                                                    <Building2 className="w-3 h-3 text-forest shrink-0" />
                                                ) : (
                                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-medium text-slate-700 truncate max-w-[140px]" title={item.seller?.name}>{item.seller?.name}</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[180px]" title={item.seller?.email}>({item.seller?.email})</span>
                                            </div>
                                        </div>

                                        {/* AI Reasons Insights */}
                                        {item.ai?.reasons?.length > 0 && (
                                            <div className="mt-2 space-y-1 bg-[#F8F9FA] p-2.5 rounded-xl text-[11px] text-slate-700 overflow-hidden">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase block">
                                                    KI-Analysefaktoren & Begründung:
                                                </span>
                                                <ul className="list-disc list-inside space-y-0.5 break-words">
                                                    {item.ai.reasons.map((r, idx) => (
                                                        <li key={`${item.id}-reason-${idx}`} className="truncate" title={r}>
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
                                            <span className="font-mono font-bold text-slate-900">{item.ai?.text_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-forest h-full rounded-full"
                                                style={{ width: `${item.ai?.text_score ?? 50}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between font-semibold text-slate-600 pt-1">
                                            <span>Bildanalyse</span>
                                            <span className="font-mono font-bold text-slate-900">{item.ai?.image_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gold h-full rounded-full"
                                                style={{ width: `${item.ai?.image_score ?? 50}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between font-semibold text-slate-600 pt-1">
                                            <span>Preiskonformität</span>
                                            <span className="font-mono font-bold text-slate-900">{item.ai?.price_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-full rounded-full"
                                                style={{ width: `${item.ai?.price_score ?? 50}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {/* Inspect Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDecision(item);
                                                setActiveImageIdx(0);
                                                setDetailModalOpen(true);
                                            }}
                                            className="w-full py-1.5 px-3 rounded-xl border border-[#E2E4E8] bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-forest" />
                                            <span>Inserat ansehen & prüfen</span>
                                        </button>

                                        {/* If Score 50 / Pending, Show Prominent Admin Overriding Decision Buttons */}
                                        {needsAdminAction ? (
                                            <div key={`act-btn-${item.id}`} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAdminDecision(item.id, 'APPROVED')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span> Genehmigen</span>
                                                </button>
                                                <button
                                                    onClick={() => handleAdminDecision(item.id, 'REJECTED')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span> Ablehnen</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div key={`act-status-${item.id}`} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded-xl">
                                                <span className="text-slate-400 font-semibold">Status im Marktplatz:</span>
                                                <span className={`font-bold ${item.listing_status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                                                    }`}>
                                                    {item.listing_status === 'APPROVED' ? 'Aktiv / Freigegeben' : 'Abgelehnt'}
                                                </span>
                                            </div>
                                        )}

                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── Pagination Bar ─── */}
            {pagination.totalPages > 1 && pagination.total > 10 && (
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
            )}

            {/* ─── MODAL: COMPLETE LISTING & AI DECISION DRAWER ─── */}
            {detailModalOpen && selectedDecision && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAEF] flex flex-col transition-transform duration-200">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-[#E8EAEF] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                            <div className="space-y-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getScoreBadge(selectedDecision.ai?.score, selectedDecision.ai?.decision, selectedDecision.listing_status, selectedDecision.ai?.moderation_status)}
                                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                        selectedDecision.listing_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                        selectedDecision.listing_status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {selectedDecision.listing_status === 'APPROVED' ? 'Aktiv' :
                                        selectedDecision.listing_status === 'REJECTED' ? 'Abgelehnt' :
                                        'In Prüfung'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        ID: {selectedDecision.id}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate" title={selectedDecision.title}>
                                    {selectedDecision.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    setDetailModalOpen(false);
                                    setSelectedDecision(null);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 space-y-6 flex-1">
                            {/* 1. Image Gallery */}
                            {selectedDecision.images?.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative aspect-video sm:aspect-2/1 bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                                        <Image
                                            src={selectedDecision.images[activeImageIdx] ? getImageUrl(selectedDecision.images[activeImageIdx], '/logo.webp') : (selectedDecision.images[0] ? getImageUrl(selectedDecision.images[0], '/logo.webp') : '/logo.webp')}
                                            alt={selectedDecision.title}
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                    {selectedDecision.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {selectedDecision.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`w-16 h-16 rounded-xl overflow-hidden relative border-2 shrink-0 transition-all cursor-pointer ${
                                                        activeImageIdx === idx ? 'border-forest ring-2 ring-forest/20' : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <Image
                                                        src={getImageUrl(img, '/logo.webp')}
                                                        alt={`Bild ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-medium">
                                    Keine Bilder hinterlegt
                                </div>
                            )}

                            {/* 2. Key Listing Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Preis</span>
                                    <span className="text-base font-black text-forest">
                                        {formatPrice(selectedDecision.price, selectedDecision.negotiable)}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategorie</span>
                                    <span className="text-xs font-bold text-slate-800">
                                        {selectedDecision.category}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Standort</span>
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {selectedDecision.location || 'Deutschland'}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Verkäufer-Typ</span>
                                    <span className="text-xs font-bold text-slate-800">
                                        {selectedDecision.seller?.type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}
                                    </span>
                                </div>
                            </div>

                            {/* 3. AI Moderation Deep-Dive Box */}
                            <div className="bg-[#FBFBFC] rounded-2xl border border-[#E8EAEF] p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-[#E8EAEF] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-gold" />
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                            Detaillierte KI-Analyse
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">Gesamt-Score:</span>
                                        <span className={`text-sm px-2.5 py-0.5 rounded-lg font-mono font-black ${
                                            selectedDecision.ai?.score >= 75 ? 'bg-emerald-100 text-emerald-900' :
                                            selectedDecision.ai?.score <= 30 ? 'bg-rose-100 text-rose-900' :
                                            'bg-amber-100 text-amber-900'
                                        }`}>
                                            {selectedDecision.ai?.score ?? 50} / 100
                                        </span>
                                    </div>
                                </div>

                                {/* Sub-Score Bars */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-3 rounded-xl border border-[#E8EAEF] space-y-1.5">
                                        <div className="flex justify-between font-semibold text-slate-600">
                                            <span>Textqualität</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedDecision.ai?.text_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-forest h-full rounded-full" style={{ width: `${selectedDecision.ai?.text_score ?? 50}%` }} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl border border-[#E8EAEF] space-y-1.5">
                                        <div className="flex justify-between font-semibold text-slate-600">
                                            <span>Bildanalyse</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedDecision.ai?.image_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-gold h-full rounded-full" style={{ width: `${selectedDecision.ai?.image_score ?? 50}%` }} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl border border-[#E8EAEF] space-y-1.5">
                                        <div className="flex justify-between font-semibold text-slate-600">
                                            <span>Preiskonformität</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedDecision.ai?.price_score ?? 50}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedDecision.ai?.price_score ?? 50}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Reasons list */}
                                {selectedDecision.ai?.reasons?.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                            Erkannte Prüffaktoren:
                                        </span>
                                        <ul className="space-y-1 text-xs">
                                            {selectedDecision.ai.reasons.map((r, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded-lg border border-[#E8EAEF]">
                                                    <span className="text-forest mt-0.5 font-bold">•</span>
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* 4. Description */}
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Inserat-Beschreibung
                                </h4>
                                <div className="p-4 bg-[#F8F9FA] rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedDecision.description || 'Keine Beschreibung angegeben.'}
                                </div>
                            </div>

                            {/* 5. Seller Information Box */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Verkäufer-Informationen
                                </h4>
                                <div className="p-4 bg-slate-50 border border-[#E8EAEF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-forest text-sand font-bold flex items-center justify-center text-sm shrink-0">
                                            {selectedDecision.seller?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                <span>{selectedDecision.seller?.name}</span>
                                                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                                                    selectedDecision.seller?.type === 'COMMERCIAL'
                                                        ? 'bg-amber-100 text-amber-900'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {selectedDecision.seller?.type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {selectedDecision.seller?.email}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedDecision.seller?.phone && (
                                        <div className="text-xs font-mono text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-[#E2E4E8] flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{selectedDecision.seller.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-t border-[#E8EAEF] flex flex-wrap items-center justify-between gap-3 sticky bottom-0 rounded-b-3xl">
                            <a
                                href={`/inserate/${selectedDecision.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E4E8] text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Live auf Campuna ansehen</span>
                            </a>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAdminDecision(selectedDecision.id, 'REJECTED');
                                    }}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Ablehnen</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAdminDecision(selectedDecision.id, 'APPROVED');
                                    }}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-[#004d0a] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Genehmigen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

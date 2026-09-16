'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Flag,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    ShieldAlert,
    ShieldCheck,
    Building2,
    User,
    Sparkles,
    ExternalLink,
    RefreshCw,
    X,
    Filter,
    ChevronLeft,
    ChevronRight,
    UserX,
    Ban,
    MessageSquare,
    Info,
    Calendar,
    Check,
    ChevronDown,
    Folder,
    Image as ImageIcon
} from 'lucide-react';
import {
    getAdminReports,
    getAdminReportDetail,
    updateAdminReport
} from '@/api/admin';

const REASON_MAP = {
    SCAM: {
        label: 'Betrug / Scam',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
        icon: Flag
    },
    FALSE_INFORMATION: {
        label: 'Falsche Angaben',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        icon: AlertTriangle
    },
    PROHIBITED_CONTENT: {
        label: 'Unzulässiger Inhalt',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        dotColor: 'bg-purple-500',
        icon: Ban
    },
    INAPPROPRIATE_IMAGE: {
        label: 'Unangemessene Bilder',
        badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
        dotColor: 'bg-pink-500',
        icon: ImageIcon
    },
    WRONG_CATEGORY: {
        label: 'Falsche Kategorie',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        icon: Folder
    },
    NO_LONGER_AVAILABLE: {
        label: 'Nicht mehr verfügbar',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        dotColor: 'bg-slate-500',
        icon: Clock
    },
    OTHER: {
        label: 'Sonstiges',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-500',
        icon: MessageSquare
    }
};

const STATUS_MAP = {
    PENDING: {
        label: 'Offen',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        pulse: true
    },
    REVIEWED: {
        label: 'Gelöst / Geprüft',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pulse: false
    },
    DISMISSED: {
        label: 'Verworfen',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        pulse: false
    }
};

export default function AdminReportsPage() {
    // Data States
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        reviewed: 0,
        dismissed: 0,
        scam_count: 0,
        false_info_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [reasonFilter, setReasonFilter] = useState('ALL');
    const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 15;

    // Detail Modal State
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // Fetch reports
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminReports({
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                reason: reasonFilter !== 'ALL' ? reasonFilter : undefined,
                search: search.trim() || undefined,
                page,
                limit
            });

            if (res.data?.success) {
                setReports(res.data.reports || []);
                setStats(res.data.stats || {
                    total: 0,
                    pending: 0,
                    reviewed: 0,
                    dismissed: 0,
                    scam_count: 0,
                    false_info_count: 0
                });
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
            showFeedback('Fehler beim Laden der Meldungen.', 'error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, reasonFilter, search, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReports();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchReports]);

    const showFeedback = (msg, type = 'success') => {
        setFeedbackMessage({ msg, type });
        setTimeout(() => setFeedbackMessage(null), 4500);
    };

    // Open Report Detail Drawer / Modal
    const handleOpenDetail = async (report) => {
        setSelectedReport(report);
        setDetailLoading(true);
        try {
            const res = await getAdminReportDetail(report.id);
            if (res.data?.success && res.data.report) {
                setSelectedReport(prev => ({
                    ...prev,
                    ...res.data.report
                }));
            }
        } catch (err) {
            console.error('Error loading report detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Moderate Report Action
    const handleModerationAction = async ({ status, listingAction, suspendSeller, customNote, reportId }) => {
        const targetId = reportId || selectedReport?.id;
        if (!targetId) return;

        setActionLoading(true);
        try {
            const payload = {
                status,
                admin_note: customNote !== undefined ? customNote : null,
                listing_action: listingAction || undefined,
                suspend_seller: suspendSeller || undefined
            };

            const res = await updateAdminReport(targetId, payload);
            if (res.data?.success) {
                let successText = 'Meldung erfolgreich als gelöst markiert.';
                if (listingAction === 'REJECT') successText = 'Inserat wurde gesperrt und Meldungen abgeschlossen.';
                if (listingAction === 'APPROVE') successText = 'Inserat freigegeben und Meldung gelöst.';
                if (status === 'DISMISSED') successText = 'Meldung wurde als unbegründet verworfen.';
                if (suspendSeller) successText = 'Inserat gesperrt & Verkäufer-Konto deaktiviert.';

                showFeedback(successText, 'success');

                // Update local report state
                setReports(prev => prev.map(r => {
                    if (r.id === targetId) {
                        return {
                            ...r,
                            status,
                            admin_note: payload.admin_note,
                            listing: {
                                ...r.listing,
                                status: listingAction === 'REJECT' ? 'REJECTED' : (listingAction === 'APPROVE' ? 'APPROVED' : r.listing.status),
                                seller_is_suspended: suspendSeller ? true : r.listing.seller_is_suspended
                            }
                        };
                    }
                    if (listingAction === 'REJECT' && selectedReport && r.listing_id === selectedReport.listing_id) {
                        return {
                            ...r,
                            status: 'REVIEWED',
                            listing: {
                                ...r.listing,
                                status: 'REJECTED'
                            }
                        };
                    }
                    return r;
                }));

                if (selectedReport && selectedReport.id === targetId) {
                    setSelectedReport(null);
                }
                fetchReports();
            } else {
                showFeedback(res.data?.error || 'Aktion fehlgeschlagen.', 'error');
            }
        } catch (error) {
            showFeedback(error.response?.data?.error || error.message || 'Fehler beim Speichern.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 max-w-[1440px] mx-auto pb-10">

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
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                        <Flag className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                                Meldungen & Konfliktlösung 🚩
                            </h1>
                            {stats.pending > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wide animate-pulse">
                                    {stats.pending} OFFEN
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Überprüfe gemeldete Inserate, schütze Campuna-Käufer vor Betrug und löse Konflikte schnell und transparent.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchReports}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#D5D9E0] text-xs font-bold text-slate-700 hover:bg-sand/30 hover:border-forest/30 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest' : ''}`} />
                        <span>Aktualisieren</span>
                    </button>
                </div>
            </div>

            {/* ─── Top Bento Metric Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. Offene Meldungen (Forest-to-Black Luxury Gradient) */}
                <div
                    onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[140px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Offene Meldungen
                        </span>
                        <div className="w-7 h-7 rounded-full bg-white/10 text-rose-400 flex items-center justify-center font-bold text-xs group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <Flag className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans flex items-baseline gap-2">
                            <span>{stats.pending || 0}</span>
                            {stats.pending > 0 && (
                                <span className="text-[11px] font-bold text-rose-300">Prüfung nötig</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">Priorität Warteschlange</span>
                            <span>Gesamt: {stats.total || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Verdacht auf Betrug / Scam */}
                <div
                    onClick={() => { setReasonFilter('SCAM'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Betrug & Fake-Angebote
                        </span>
                        <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-rose-600 font-sans">
                            {stats.scam_count || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1 text-slate-500">
                            <span>Hohe Sicherheitsrelevanz</span>
                        </div>
                    </div>
                </div>

                {/* 3. Gelöst & Bearbeitet */}
                <div
                    onClick={() => { setStatusFilter('REVIEWED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Gelöst & Bearbeitet
                        </span>
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.reviewed || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1 text-emerald-600">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Bereinigt & erledigt</span>
                        </div>
                    </div>
                </div>

                {/* 4. Verworfene Hinweise (Fehlalarme) */}
                <div
                    onClick={() => { setStatusFilter('DISMISSED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Verworfene Meldungen
                        </span>
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                            <XCircle className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.dismissed || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1 text-slate-400">
                            <span>Unbegründete Hinweise</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Search & Filter Toolbar ─── */}
            <div className="bg-white p-4 rounded-3xl border border-[#E8EAEF] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Left: Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { key: 'ALL', label: 'Alle' },
                        { key: 'PENDING', label: 'Offen', count: stats.pending },
                        { key: 'REVIEWED', label: 'Gelöst / Geprüft', count: stats.reviewed },
                        { key: 'DISMISSED', label: 'Verworfen', count: stats.dismissed }
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => { setStatusFilter(item.key); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${statusFilter === item.key
                                ? 'bg-forest text-sand shadow-xs'
                                : 'bg-[#F4F5F7] text-slate-600 hover:bg-slate-200/70'
                                }`}
                        >
                            <span>{item.label}</span>
                            {item.count !== undefined && item.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${statusFilter === item.key
                                    ? 'bg-sand text-forest'
                                    : item.key === 'PENDING' ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-800'
                                    }`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Right: Reason Select & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

                    {/* Reason Filter Dropdown with React Icons */}
                    <div className="relative w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                            className="w-full sm:w-[210px] px-3.5 py-2 rounded-2xl bg-[#F8F9FB] border border-[#D5D9E0] text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 focus:outline-none focus:border-forest cursor-pointer hover:bg-slate-100/80 transition-colors shadow-2xs"
                        >
                            <div className="flex items-center gap-2 truncate">
                                {reasonFilter === 'ALL' ? (
                                    <>
                                        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span className="truncate font-bold">Alle Meldegründe</span>
                                    </>
                                ) : (
                                    (() => {
                                        const cfg = REASON_MAP[reasonFilter] || REASON_MAP.OTHER;
                                        const IconComp = cfg.icon;
                                        return (
                                            <>
                                                <IconComp className="w-3.5 h-3.5 text-forest shrink-0" />
                                                <span className="truncate font-bold">{cfg.label}</span>
                                            </>
                                        );
                                    })()
                                )}
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isReasonDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-full sm:w-[220px] bg-white rounded-2xl border border-[#D5D9E0] shadow-xl py-1.5 z-40 space-y-0.5 max-h-[300px] overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => { setReasonFilter('ALL'); setPage(1); setIsReasonDropdownOpen(false); }}
                                    className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between gap-2.5 hover:bg-sand/30 transition-colors cursor-pointer ${
                                        reasonFilter === 'ALL' ? 'bg-forest/10 text-forest' : 'text-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="truncate">Alle Meldegründe</span>
                                    </div>
                                    {reasonFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                                </button>

                                {Object.entries(REASON_MAP).map(([key, cfg]) => {
                                    const IconComp = cfg.icon;
                                    const isSelected = reasonFilter === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => { setReasonFilter(key); setPage(1); setIsReasonDropdownOpen(false); }}
                                            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2.5 hover:bg-sand/30 transition-colors cursor-pointer ${
                                                isSelected ? 'bg-forest/10 text-forest font-bold' : 'text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <IconComp className="w-4 h-4 shrink-0 text-slate-700" />
                                                <span className="truncate">{cfg.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-forest shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-[240px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Titel, Melder, Verkäufer..."
                            className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-[#F8F9FB] border border-[#D5D9E0] text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Reports Table ─── */}
            <div className="bg-white rounded-3xl border border-[#E8EAEF] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-[#F8F9FB] text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#E8EAEF]">
                            <tr>
                                <th className="px-5 py-3.5">Gemeldetes Inserat</th>
                                <th className="px-5 py-3.5">Meldegrund & Details</th>
                                <th className="px-5 py-3.5">Gemeldet von</th>
                                <th className="px-5 py-3.5">Verkäufer</th>
                                <th className="px-5 py-3.5 text-center">KI-Sicherheitscheck</th>
                                <th className="px-5 py-3.5">Datum</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F3F6]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <div className="inline-flex items-center gap-2 font-semibold">
                                            <RefreshCw className="w-4 h-4 animate-spin text-forest" />
                                            <span>Meldungen werden geladen...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800">
                                                Keine Meldungen vorhanden
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {search || statusFilter !== 'ALL' || reasonFilter !== 'ALL'
                                                    ? 'Keine Meldungen gefunden, die deinen Filterkriterien entsprechen.'
                                                    : 'Aktuell liegen keine offenen Benutzermeldungen vor. Alle Inserate sind sicher!'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((item) => {
                                    const reasonConfig = REASON_MAP[item.reason] || REASON_MAP.OTHER;
                                    const ReasonIcon = reasonConfig.icon;
                                    const statusConfig = STATUS_MAP[item.status] || STATUS_MAP.PENDING;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-[#F9FAF8] transition-colors ${item.status === 'PENDING' ? 'bg-rose-50/20' : ''
                                                }`}
                                        >
                                            {/* Listing Column */}
                                            <td className="px-5 py-3.5 max-w-[260px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                                                        {item.listing?.main_image ? (
                                                            <Image
                                                                src={item.listing.main_image}
                                                                alt={item.listing.title || 'Inserat'}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Flag className="w-4 h-4 opacity-40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <Link
                                                            href={item.listing?.slug ? `/inserate/${item.listing.slug}` : '#'}
                                                            target="_blank"
                                                            className="font-bold text-slate-900 hover:text-forest transition-colors truncate block text-xs"
                                                            title={item.listing?.title}
                                                        >
                                                            {item.listing?.title || 'Unbekanntes Inserat'}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                                            <span className="font-extrabold text-forest">
                                                                {formatPrice(item.listing?.price)}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="truncate">{item.listing?.location}</span>
                                                        </div>
                                                        {item.total_reports_for_listing > 1 && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded mt-0.5">
                                                                ⚠️ {item.total_reports_for_listing}x gemeldet
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Reason Column */}
                                            <td className="px-5 py-3.5 max-w-[230px]">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${reasonConfig.badgeColor}`}>
                                                        <ReasonIcon className="w-3 h-3 shrink-0" />
                                                        <span>{reasonConfig.label}</span>
                                                    </span>
                                                    {item.description ? (
                                                        <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                            &ldquo;{item.description}&rdquo;
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 italic">
                                                            Keine Zusatzinfo
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Reporter Column */}
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="font-bold text-slate-800 truncate">
                                                        {item.reporter?.name || 'Benutzer'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono truncate">
                                                        {item.reporter?.email}
                                                    </div>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold inline-block ${item.reporter?.type === 'COMMERCIAL'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {item.reporter?.type === 'COMMERCIAL' ? 'Gewerblich' : 'Privatnutzer'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Seller Column */}
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="font-bold text-slate-800 truncate">
                                                        {item.listing?.seller_name || 'Verkäufer'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono truncate">
                                                        {item.listing?.seller_email}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        {item.listing?.seller_is_suspended ? (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-black bg-rose-100 text-rose-800 border border-rose-200">
                                                                GESPERRT
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Aktiv
                                                            </span>
                                                        )}
                                                        {item.listing?.status === 'REJECTED' && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-black bg-slate-200 text-slate-800">
                                                                Inserat gesperrt
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* AI Moderation Column */}
                                            <td className="px-5 py-3.5 text-center">
                                                {item.listing?.ai_score !== undefined && item.listing?.ai_score !== null ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${item.listing.ai_score >= 75
                                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                            : item.listing.ai_score <= 35
                                                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                                            }`}>
                                                            Score: {item.listing.ai_score}/100
                                                        </span>
                                                        {item.listing.fraud_risk_score !== undefined && (
                                                            <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                                                Risiko: {item.listing.fraud_risk_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 font-mono">-</span>
                                                )}
                                            </td>

                                            {/* Date Column */}
                                            <td className="px-5 py-3.5 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                                                {formatDate(item.created_at)}
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusConfig.bg}`}>
                                                    {statusConfig.pulse && (
                                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                    )}
                                                    <span>{statusConfig.label}</span>
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleModerationAction({
                                                                status: 'REVIEWED',
                                                                customNote: 'Direkt durch Admin als gelöst markiert.',
                                                                reportId: item.id
                                                            })}
                                                            title="Schnell als gelöst markieren"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Lösen</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenDetail(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-sand hover:bg-forest/90 font-bold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Prüfen</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Interactive Moderation Review Modal / Drawer ─── */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-sand/40 via-white to-sand/20 border-b border-[#E8EAEF] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                                    <Flag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        Meldung bearbeiten & Konflikt lösen
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                        Meldungs-ID: #{selectedReport.id.slice(0, 8)} • Eingegangen am {formatDate(selectedReport.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto">

                            {/* Alert if multiple reports exist */}
                            {selectedReport.total_reports_for_listing > 1 && (
                                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs">
                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black">
                                            Erhöhtes Betrugsrisiko: Dieses Inserat wurde von {selectedReport.total_reports_for_listing} verschiedenen Nutzern gemeldet!
                                        </p>
                                        <p className="text-[11px] text-rose-700 mt-0.5">
                                            Bitte prüfe dieses Angebot besonders sorgfältig auf verdächtige Preise, gefälschte Fotos oder betrügerische Kontaktversuche.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Listing Spotlight Card */}
                            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                        Gemeldetes Inserat
                                    </span>
                                    {selectedReport.listing?.slug && (
                                        <Link
                                            href={`/inserate/${selectedReport.listing.slug}`}
                                            target="_blank"
                                            className="text-forest hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
                                        >
                                            <span>Inserat in neuem Tab öffnen</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden relative shrink-0 border border-slate-300">
                                        {selectedReport.listing?.main_image ? (
                                            <Image
                                                src={selectedReport.listing.main_image}
                                                alt={selectedReport.listing?.title || 'Inserat'}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Flag className="w-5 h-5 opacity-40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="font-black text-slate-900 text-sm leading-snug">
                                            {selectedReport.listing?.title || selectedReport.listing_title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs font-bold text-forest">
                                            <span>{formatPrice(selectedReport.listing?.price || selectedReport.price)}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600 font-normal">{selectedReport.listing?.location || 'Deutschland'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selectedReport.listing?.status === 'APPROVED'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : selectedReport.listing?.status === 'REJECTED'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                Status: {selectedReport.listing?.status || selectedReport.listing_status}
                                            </span>
                                            {selectedReport.listing?.ai_score !== undefined && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                                    KI-Score: {selectedReport.listing.ai_score}/100
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Report Details & Reporter Notes */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">
                                        Grund der Meldung
                                    </span>
                                    {(() => {
                                        const rConf = REASON_MAP[selectedReport.reason] || REASON_MAP.OTHER;
                                        return (
                                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${rConf.badgeColor}`}>
                                                {rConf.label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                <div className="p-3.5 rounded-2xl bg-sand/30 border border-sand/60 text-xs space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                                        <MessageSquare className="w-3.5 h-3.5 text-forest" />
                                        <span>Hinweis des Melders ({selectedReport.reporter?.name || 'Benutzer'}):</span>
                                    </div>
                                    <p className="text-slate-800 italic whitespace-pre-wrap leading-relaxed">
                                        {selectedReport.description
                                            ? `"${selectedReport.description}"`
                                            : 'Keine zusätzliche Textbeschreibung übermittelt.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Melder</span>
                                        <span className="font-bold text-slate-800 block truncate">{selectedReport.reporter?.name}</span>
                                        <span className="text-[11px] text-slate-500 font-mono block truncate">{selectedReport.reporter?.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Verkäufer</span>
                                        <span className="font-bold text-slate-800 block truncate">{selectedReport.listing?.seller_name}</span>
                                        <span className="text-[11px] text-slate-500 font-mono block truncate">{selectedReport.listing?.seller_email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Footer - All 4 buttons in a clean single row */}
                        <div className="px-5 sm:px-6 py-4 bg-[#F8F9FB] border-t border-[#E8EAEF]">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                                {/* Action 1: Dismiss Report */}
                                <button
                                    onClick={() => handleModerationAction({ status: 'DISMISSED' })}
                                    disabled={actionLoading}
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 text-center border border-slate-300/80 shadow-2xs active:scale-95 inline-flex items-center justify-center gap-1.5"
                                >
                                    <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="truncate">Verwerfen</span>
                                </button>

                                {/* Action 2: Resolve / Mark Resolved */}
                                <button
                                    onClick={() => handleModerationAction({ status: 'REVIEWED' })}
                                    disabled={actionLoading}
                                    className="w-full px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                    <span className="truncate">Als gelöst markieren</span>
                                </button>

                                {/* Action 3: Reject Listing */}
                                <button
                                    onClick={() => handleModerationAction({ status: 'REVIEWED', listingAction: 'REJECT' })}
                                    disabled={actionLoading}
                                    className="w-full px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Ban className="w-4 h-4 text-white shrink-0" />
                                    <span className="truncate">Inserat sperren</span>
                                </button>

                                {/* Action 4: Suspend Seller */}
                                <button
                                    onClick={() => handleModerationAction({ status: 'REVIEWED', listingAction: 'REJECT', suspendSeller: true })}
                                    disabled={actionLoading}
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-rose-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <UserX className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span className="truncate">Verkäufer sperren</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Plus,
    ArrowUpRight,
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    ShieldCheck,
    Sparkles,
    Download,
    Layers,
    UserCheck,
    ChevronRight,
    Building2,
    User,
    Award,
    AlertTriangle,
    CreditCard,
    DollarSign,
    Activity,
    Server,
    Zap,
    ExternalLink,
    Filter,
    ArrowRight,
    Flag,
    MessageSquare
} from 'lucide-react';
import {
    getAdminDashboardStats,
    exportAdminDataCsv,
    batchAiModerationScan
} from '@/api/admin';

export default function AdminDashboard() {
    const router = useRouter();

    // Stats and Data State
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [batchScanLoading, setBatchScanLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const showFeedback = (msg, type = 'success') => {
        setFeedback({ msg, type });
        setTimeout(() => setFeedback(null), 4500);
    };

    // Fetch Dashboard Analytics
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminDashboardStats();
            if (res.data?.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Error loading dashboard stats:", err);
            showFeedback("Fehler beim Laden der Live-Statistiken.", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Export CSV Download Trigger
    const handleExportCsv = async () => {
        setExportLoading(true);
        try {
            const response = await exportAdminDataCsv();
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `campuna_daten_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showFeedback("CSV-Export erfolgreich heruntergeladen!", "success");
        } catch (err) {
            console.error("Export error:", err);
            showFeedback("Fehler beim Erstellen des CSV-Exports.", "error");
        } finally {
            setExportLoading(false);
        }
    };

    // Batch AI Scan Trigger
    const handleBatchAiScan = async () => {
        setBatchScanLoading(true);
        try {
            const res = await batchAiModerationScan();
            if (res.data?.success) {
                showFeedback(res.data.message || "KI-Batch-Prüfung abgeschlossen!", "success");
                loadDashboardData();
            }
        } catch (err) {
            console.error("Batch AI error:", err);
            showFeedback("Fehler bei der KI-Gesamtprüfung.", "error");
        } finally {
            setBatchScanLoading(false);
        }
    };

    // Format currency
    const formatEuro = (amount) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    // Calculate max daily activity count for responsive bar chart height
    const maxDayVal = stats?.dailyActivity?.reduce((max, d) => Math.max(max, parseInt(d.listings_count, 10)), 0) || 1;

    // Computed gauge values
    const approvalRate = stats?.listings?.approvalRate ?? 100;
    // Map approvalRate (0-100) to SVG semi-circle arc angle (180deg total)
    const radius = 40;
    const arcLength = Math.PI * radius; // ~125.66
    const strokeDashoffset = arcLength - (arcLength * approvalRate) / 100;

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-10">

            {/* ─── Feedback Toast Banner (Stable Fixed DOM) ─── */}
            <div className="fixed top-6 right-6 z-50 pointer-events-none">
                {feedback && (
                    <div
                        className={`pointer-events-auto px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-xs font-bold transition-all duration-300 ${
                            feedback.type === 'error'
                                ? 'bg-rose-900 text-white border-rose-700 shadow-rose-900/30'
                                : 'bg-emerald-950 text-sand border-emerald-700 shadow-emerald-950/40'
                        }`}
                    >
                        <span className="shrink-0">
                            {feedback.type === 'error' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-300" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-gold" />
                            )}
                        </span>
                        <span>{feedback.msg}</span>
                    </div>
                )}
            </div>

            {/* ─── Top Command Center Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                            Admin Command Center
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Echtzeit-Übersicht, Moderation, Monetarisierung und Systemgesundheit.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => router.push('/admin/inserat-erstellen')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-[#002B06] hover:text-gold transition-all duration-200 cursor-pointer shadow-sm border border-gold/30 shrink-0"
                    >
                        <Plus className="w-4 h-4 text-gold" />
                        <span>Neues Inserat erstellen</span>
                    </button>
                </div>
            </div>

            {/* ─── Row 1: 6 Primary Bento KPI Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">

                {/* 1. Gesamt-Inserate & Marktwert (Forest Highlight Card) */}
                <div
                    onClick={() => router.push('/admin/inserate')}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gesamt-Inserate
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {loading ? '...' : (stats?.listings?.total || 0)}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{`${stats?.listings?.approved || 0} Aktiv`}</span>
                            <span>{formatEuro(stats?.listings?.totalActiveValue)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Moderations-Warteschlange (Urgent Review Queue) */}
                <div
                    onClick={() => router.push('/admin/inserate?status=REVIEW')}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Warteschlange
                        </span>
                        {(stats?.listings?.review || 0) > 0 ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-[#EBF7EE] text-[#1E7E50] flex items-center justify-center font-bold text-xs shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {loading ? '...' : (stats?.listings?.review || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                            {(stats?.listings?.review || 0) > 0 ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>Prüfung nötig</span>
                                </span>
                            ) : (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 shrink-0" />
                                    <span>Alles geprüft</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Meldungen (Offene Benutzermeldungen) */}
                <div
                    onClick={() => router.push('/admin/meldungen')}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Meldungen
                        </span>
                        {(stats?.reports?.pending || 0) > 0 ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                                <Flag className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {loading ? '...' : (stats?.reports?.pending || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                            {(stats?.reports?.pending || 0) > 0 ? (
                                <span className="text-rose-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>Zu prüfen</span>
                                </span>
                            ) : (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 shrink-0" />
                                    <span>Keine Meldungen</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Campuna Pioneer Club (Live / 300) */}
                <div
                    onClick={() => router.push('/admin/benutzer')}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Pioneer Club
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Award className="w-3.5 h-3.5 text-[#C8A96B]" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-baseline gap-1">
                            <span>{loading ? '...' : (stats?.pioneer?.awardedCount || 0)}</span>
                            <span className="text-sm font-semibold text-slate-400">/ 300</span>
                        </div>
                        <div className="mt-2">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-gold to-forest rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(4, stats?.pioneer?.progressPercentage || 0)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mt-1">
                                <span>{`${stats?.pioneer?.availableSlots || 300} freie Plätze`}</span>
                                <span>{`${stats?.pioneer?.progressPercentage || 0}%`}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Monetarisierung & Business Tier */}
                <div
                    onClick={() => router.push('/admin/benutzer?type=COMMERCIAL')}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Business & MRR
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <DollarSign className="w-3.5 h-3.5 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {loading ? '...' : (stats?.monetization?.businessTierUsers || stats?.monetization?.activeSubscriptions || 0)}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 text-[10px] text-slate-500 font-medium">
                            <span className="text-forest font-bold">{`~ ${formatEuro(stats?.monetization?.estimatedMRR)} / Mo`}</span>
                            <span className="text-slate-400">{`${stats?.users?.strategicPartners || 0} Partner`}</span>
                        </div>
                    </div>
                </div>

                {/* 6. Benutzer & Händler */}
                <div
                    onClick={() => router.push('/admin/benutzer')}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Benutzer
                        </span>
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {loading ? '...' : (stats?.users?.total || 0)}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 text-[10px] text-slate-500 font-medium">
                            <span className="text-slate-700 font-bold">{`${stats?.users?.commercial || 0} Händler`}</span>
                            <span>{`${stats?.users?.private || 0} Privat`}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* ─── Row 2: Live Moderation Queue & Quality Diagnostics ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* 2-Column Wide: Interaktive Moderations-Warteschlange */}
                <div className="lg:col-span-2 bg-white border border-[#E8EAEF] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Moderations-Warteschlange
                                    </h2>
                                    <p className="text-[11px] text-slate-400">
                                        Direkte Prüfung und Freigabe neu eingereichter Camping-Inserate
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/admin/inserate')}
                                className="text-xs font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <span>{`Alle Inserate (${stats?.listings?.total || 0})`}</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            </button>
                        </div>

                        {/* Pending Items List */}
                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2">
                                <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-slate-400">Warteschlange wird geladen...</span>
                            </div>
                        ) : (!stats?.pendingQueue || stats.pendingQueue.length === 0) ? (
                            <div className="py-10 px-4 text-center bg-sand/30 rounded-2xl border border-dashed border-[#E2E4E8]">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-bold text-slate-800">Keine ausstehenden Inserate</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Großartig! Alle Inserate wurden geprüft oder automatisch von der KI freigegeben.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.pendingQueue.map((item) => (
                                    <div
                                        key={`queue-item-${item.id}`}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 transition-all"
                                    >
                                        {/* Image & Main Info */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-14 h-12 rounded-xl bg-slate-200 relative overflow-hidden shrink-0 border border-slate-300/60">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        sizes="60px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        Kein Bild
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                                                        {item.title}
                                                    </h5>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                                        Review
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 truncate">
                                                    <span className="font-semibold text-slate-800 shrink-0">{formatEuro(item.price)}</span>
                                                    <span className="shrink-0">•</span>
                                                    <span className="shrink-0">{item.category}</span>
                                                    <span className="shrink-0">•</span>
                                                    <span className="truncate" title={`${item.sellerName} (${item.sellerType === 'COMMERCIAL' ? 'Händler' : 'Privat'})`}>
                                                        {`${item.sellerName} (${item.sellerType === 'COMMERCIAL' ? 'Händler' : 'Privat'})`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Score Badge & View Details Button */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${item.aiScore >= 75
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : item.aiScore >= 40
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                                    }`}
                                                title={`KI-Score: ${item.aiScore}/100`}
                                            >
                                                {`KI: ${item.aiScore}/100`}
                                            </span>

                                            <button
                                                onClick={() => router.push(`/admin/inserate?search=${encodeURIComponent(item.title)}`)}
                                                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E4E8] shadow-2xs transition-colors cursor-pointer"
                                                title="Details ansehen"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#F2F4F7] flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                            {`${stats?.pendingQueue?.length || 0} von ${stats?.listings?.review || 0} ausstehenden Inseraten angezeigt`}
                        </span>
                        <button
                            onClick={() => router.push('/admin/entscheidungen')}
                            className="font-bold text-forest hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <span>KI-Entscheidungsmatrix öffnen</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* 1-Column: Genehmigungs- & KI-Qualitäts-Quote */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-800">
                                    Qualitäts- & Freigabequote
                                </h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                                Gesamt
                            </span>
                        </div>

                        {/* Dynamic SVG Semi-Circle Donut Gauge */}
                        <div className="flex flex-col items-center justify-center my-3 relative">
                            <svg className="w-52 h-30" viewBox="0 0 100 55">
                                {/* Background Gray Track */}
                                <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="#F0F2F5"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                                {/* Dynamic Green Arc Segment */}
                                <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="#00630D"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={arcLength}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                                />
                            </svg>

                            {/* Center Percentage Display */}
                            <div className="absolute bottom-2 flex flex-col items-center">
                                <span className="text-3xl font-black text-slate-900 leading-none">
                                    {loading ? '...' : `${approvalRate}%`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                                    Freigaberate
                                </span>
                            </div>
                        </div>

                        {/* Summary Numbers */}
                        <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#F2F4F7]">
                            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <div className="text-xs font-black text-emerald-800">
                                    {stats?.listings?.approved || 0}
                                </div>
                                <div className="text-[9px] font-semibold text-emerald-700">Genehmigt</div>
                            </div>

                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                                <div className="text-xs font-black text-amber-800">
                                    {stats?.listings?.review || 0}
                                </div>
                                <div className="text-[9px] font-semibold text-amber-700">In Prüfung</div>
                            </div>

                            <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                                <div className="text-xs font-black text-rose-800">
                                    {stats?.listings?.rejected || 0}
                                </div>
                                <div className="text-[9px] font-semibold text-rose-700">Abgelehnt</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F2F4F7] flex items-center justify-between text-[11px] text-slate-500">
                        <span>KI-Vertrauens-Score:</span>
                        <span className="font-bold text-forest">
                            {`${stats?.aiModeration?.avgScore || 85} / 100`}
                        </span>
                    </div>
                </div>

            </div>

            {/* ─── Row 3: 7-Day Ingestion Trend, Newest Users & Categories ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* 1. 7-Tage Marktplatz-Aktivität (Real Ingestion Bar Chart) */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800">
                                        Inserate-Zuwachs
                                    </h3>
                                    <p className="text-[10px] text-slate-400">Letzte 7 Tage</p>
                                </div>
                            </div>

                            <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
                                {`+${stats?.dailyActivity?.reduce((s, d) => s + parseInt(d.listings_count, 10), 0) || 0} diese Woche`}
                            </span>
                        </div>

                        {/* Vertical Pill Bar Chart */}
                        <div className="flex items-end justify-between h-40 pt-6 px-2 gap-1.5">
                            {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
                                stats.dailyActivity.map((item, idx) => {
                                    const val = parseInt(item.listings_count, 10);
                                    const heightPercent = maxDayVal > 0 ? Math.max(12, Math.round((val / maxDayVal) * 100)) : 15;
                                    const isToday = idx === stats.dailyActivity.length - 1;

                                    return (
                                        <div key={`daily-bar-${idx}`} className="flex flex-col items-center gap-2 flex-1 relative group">
                                            {/* Hover Tooltip */}
                                            <div className="absolute -top-7 bg-slate-900 text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {`${item.formatted_date}: ${val} Inserate`}
                                            </div>

                                            {/* Bar Container */}
                                            <div className="w-full max-w-[32px] h-28 bg-[#F4F5F7] rounded-full flex flex-col justify-end p-0.5 overflow-hidden">
                                                <div
                                                    className={`w-full rounded-full transition-all duration-500 ${isToday
                                                            ? 'bg-gradient-to-t from-[#003807] to-forest'
                                                            : val > 0
                                                                ? 'bg-forest/80'
                                                                : 'bg-slate-300/50'
                                                        }`}
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                            </div>

                                            {/* Day Label */}
                                            <span className={`text-[10px] font-semibold ${isToday ? 'text-forest font-bold' : 'text-slate-400'}`}>
                                                {item.day_name || item.formatted_date}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full text-center py-10 text-xs text-slate-400">
                                    Keine Trenddaten vorhanden.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F2F4F7] flex items-center justify-between text-[10px] text-slate-400">
                        <span>Aktuelle Woche</span>
                        <span className="font-semibold text-slate-700">Tägliche Aggregation</span>
                    </div>
                </div>

                {/* 2. Neueste Benutzer & Händler */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800">
                                        Neueste Benutzer & Händler
                                    </h3>
                                    <p className="text-[10px] text-slate-400">Registrierungen</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/admin/benutzer')}
                                className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
                            >
                                {`Alle (${stats?.users?.total || 0})`}
                            </button>
                        </div>

                        {/* Recent Users List */}
                        <div className="space-y-2.5 mt-2">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : !stats?.recentUsers || stats.recentUsers.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-400">
                                    Keine Benutzer vorhanden.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {stats.recentUsers.slice(0, 4).map((u) => (
                                        <div
                                            key={`recent-user-${u.id}`}
                                            onClick={() => router.push(`/admin/benutzer?search=${encodeURIComponent(u.email)}`)}
                                            className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${u.userType === 'COMMERCIAL'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                    }`}>
                                                    {u.avatar ? (
                                                        <Image src={u.avatar} alt={u.name} width={32} height={32} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        u.name?.slice(0, 2).toUpperCase() || 'CP'
                                                    )}
                                                </div>
                                                <div className="truncate">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <h5 className="text-xs font-bold text-slate-800 group-hover:text-forest transition-colors truncate">
                                                            {u.name}
                                                        </h5>
                                                        {u.hasPioneerBadge && (
                                                            <Award className="w-3.5 h-3.5 text-[#C8A96B] shrink-0" title="Pioneer Club Mitglied" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${u.userType === 'COMMERCIAL'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {u.userType === 'COMMERCIAL' ? 'Händler' : 'Privat'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F2F4F7] flex items-center justify-between text-[11px] text-slate-400">
                        <span>Verifizierte Accounts:</span>
                        <span className="font-bold text-emerald-700">
                            {`${stats?.users?.verified || 0} / ${stats?.users?.total || 0}`}
                        </span>
                    </div>
                </div>

                {/* 3. Top Kategorien & System-Status (Forest-to-Black Gradient Card) */}
                <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between border border-forest/20">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-sand/80 uppercase tracking-wider">
                                System-Status
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold bg-white/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>Online</span>
                            </span>
                        </div>

                        {/* Category Breakdown */}
                        <div className="space-y-2.5 mt-3">
                            <span className="text-[10px] uppercase font-bold text-sand/60 tracking-wider block">
                                Top Kategorien
                            </span>
                            {stats?.categories && stats.categories.length > 0 ? (
                                stats.categories.slice(0, 4).map((cat, idx) => (
                                    <div key={`cat-item-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-sand truncate">{cat.category}</span>
                                            <span className="text-gold font-bold">{`${cat.count} (${cat.percentage}%)`}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gold rounded-full transition-all duration-500"
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-sand/50">Keine Kategorien erfasst.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-sand/70">
                        <span>Datenbank & API</span>
                        <span className="font-mono text-emerald-400 font-bold">100% Betriebsbereit</span>
                    </div>
                </div>

            </div>

        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Megaphone,
    Plus,
    Search,
    Filter,
    RefreshCw,
    CheckCircle2,
    Clock,
    Eye,
    Edit3,
    Trash2,
    Users,
    Building2,
    User,
    AlertTriangle,
    Bell,
    ArrowUpRight,
    ExternalLink,
    X,
    BarChart3,
    Sparkles,
    Check,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAdminBroadcasts,
    createAdminBroadcast,
    updateAdminBroadcast,
    deleteAdminBroadcast
} from '@/api/admin';

const TARGET_MAP = {
    ALL: { label: 'Alle Nutzer', icon: Users, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    PRIVATE: { label: 'Nur Privat', icon: User, bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    COMMERCIAL: { label: 'Nur Gewerblich', icon: Building2, bg: 'bg-purple-50 text-purple-800 border-purple-200' }
};

const PRIORITY_MAP = {
    NORMAL: { label: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    IMPORTANT: { label: 'Wichtig', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    URGENT: { label: 'Dringend', bg: 'bg-rose-50 text-rose-800 border-rose-200' }
};

export default function AdminBroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [summary, setSummary] = useState({
        totalBroadcasts: 0,
        activeBroadcasts: 0,
        totalReads: 0,
        avgReadRate: 0,
        totalAudience: 0
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [targetFilter, setTargetFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBroadcast, setEditingBroadcast] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_type: 'ALL',
        priority: 'NORMAL',
        action_url: '',
        action_label: '',
        is_active: true
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const showFeedback = (msg, type = 'success') => {
        setFeedbackMessage({ msg, type });
        setTimeout(() => setFeedbackMessage(null), 4500);
    };

    const fetchBroadcasts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                search,
                target_type: targetFilter,
                priority: priorityFilter,
                is_active: statusFilter
            };
            const res = await getAdminBroadcasts(params);
            if (res.data?.success) {
                setBroadcasts(res.data.broadcasts || []);
                setSummary(res.data.summary || {});
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to load broadcasts:', err);
            showFeedback('Fehler beim Laden der Rundschreiben.', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, search, targetFilter, priorityFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBroadcasts();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchBroadcasts]);

    // Open Modal for Create
    const handleOpenCreate = () => {
        setEditingBroadcast(null);
        setFormData({
            title: '',
            content: '',
            target_type: 'ALL',
            priority: 'NORMAL',
            action_url: '',
            action_label: '',
            is_active: true
        });
        setModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEdit = (broadcast) => {
        setEditingBroadcast(broadcast);
        setFormData({
            title: broadcast.title || '',
            content: broadcast.content || '',
            target_type: broadcast.target_type || 'ALL',
            priority: broadcast.priority || 'NORMAL',
            action_url: broadcast.action_url || '',
            action_label: broadcast.action_label || '',
            is_active: Boolean(broadcast.is_active)
        });
        setModalOpen(true);
    };

    // Save Broadcast (Create or Update)
    const handleSubmitBroadcast = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            showFeedback('Bitte Titel und Nachricht ausfüllen.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            if (editingBroadcast) {
                const res = await updateAdminBroadcast(editingBroadcast.id, formData);
                if (res.data?.success) {
                    showFeedback(res.data.message || 'Rundschreiben erfolgreich aktualisiert.');
                    setModalOpen(false);
                    fetchBroadcasts();
                } else {
                    showFeedback(res.data?.error || 'Speichern fehlgeschlagen.', 'error');
                }
            } else {
                const res = await createAdminBroadcast(formData);
                if (res.data?.success) {
                    showFeedback(res.data.message || 'Rundschreiben erfolgreich veröffentlicht.');
                    setModalOpen(false);
                    fetchBroadcasts();
                } else {
                    showFeedback(res.data?.error || 'Erstellen fehlgeschlagen.', 'error');
                }
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Aktion fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Quick Toggle Active/Paused Status
    const handleToggleActive = async (broadcast) => {
        setActionLoading(true);
        try {
            const newStatus = !broadcast.is_active;
            const res = await updateAdminBroadcast(broadcast.id, { is_active: newStatus });
            if (res.data?.success) {
                showFeedback(`Rundschreiben wurde ${newStatus ? 'aktiviert' : 'pausiert'}.`);
                fetchBroadcasts();
            }
        } catch (err) {
            showFeedback('Statusänderung fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Confirmation
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setActionLoading(true);
        try {
            const res = await deleteAdminBroadcast(itemToDelete.id);
            if (res.data?.success) {
                showFeedback(res.data.message || 'Rundschreiben gelöscht.');
                setDeleteModalOpen(false);
                setItemToDelete(null);
                fetchBroadcasts();
            }
        } catch (err) {
            showFeedback('Löschen fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-10">

            {/* Toast Feedback (Stable Fixed DOM) */}
            <div className="fixed top-5 right-5 z-50 pointer-events-none">
                {feedbackMessage && (
                    <div
                        className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 ${
                            feedbackMessage.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                    >
                        <span className="shrink-0">
                            {feedbackMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </span>
                        <span>{feedbackMessage.msg}</span>
                    </div>
                )}
            </div>

            {/* Top Page Header (Consistent UI) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                            Broadcasts & Rundschreiben
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Sende skalierbare Systemnachrichten an alle Nutzer, Privat- oder Gewerbekunden ohne Nachrichtenduplikate.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-forest text-sand hover:bg-forest/90 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 text-gold shrink-0" />
                    <span>Neues Rundschreiben verfassen</span>
                </button>
            </div>

            {/* Bento KPI Cards (4 Cards matching Admin standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Gesamt Rundschreiben (Forest Hero Card) */}
                <div
                    onClick={() => { setStatusFilter('ALL'); setTargetFilter('ALL'); setPage(1); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gesamt Rundschreiben
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors shrink-0">
                            <Megaphone className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {summary.totalBroadcasts || 0}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{`${summary.activeBroadcasts || 0} Aktiv`}</span>
                            <span>{`${summary.totalReads || 0} Gelesen`}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Aktiv & Sichtbar */}
                <div
                    onClick={() => { setStatusFilter('TRUE'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Aktiv & Sichtbar
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.activeBroadcasts || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                            <span>Live in Benutzer-Postfächern</span>
                        </div>
                    </div>
                </div>

                {/* 3. Gelesene Zugriffe */}
                <div
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Gelesene Zugriffe
                        </span>
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Eye className="w-3.5 h-3.5 text-blue-700" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.totalReads || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-1">
                            <span>Bestätigte Lese-Events</span>
                        </div>
                    </div>
                </div>

                {/* 4. Durchschnittliche Reichweite */}
                <div
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Reichweite & Quote
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {`${summary.avgReadRate || 0}%`}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold mt-1">
                            <span>Durchschnittliche Öffnungsrate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EAEF] shadow-2xs flex flex-col md:flex-row items-center gap-3 justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Titel oder Inhalt durchsuchen..."
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Target Filter */}
                    <select
                        value={targetFilter}
                        onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest"
                    >
                        <option value="ALL">Alle Zielgruppen</option>
                        <option value="PRIVATE">Nur Privatnutzer</option>
                        <option value="COMMERCIAL">Nur Gewerbliche</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest"
                    >
                        <option value="ALL">Alle Prioritäten</option>
                        <option value="NORMAL">Normal</option>
                        <option value="IMPORTANT">Wichtig</option>
                        <option value="URGENT">Dringend</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest"
                    >
                        <option value="ALL">Alle Status</option>
                        <option value="TRUE">Nur Aktiv</option>
                        <option value="FALSE">Nur Pausiert</option>
                    </select>

                    <button
                        onClick={fetchBroadcasts}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Aktualisieren"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Broadcasts Cards Grid */}
            {loading ? (
                <div className="py-20 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-forest mx-auto mb-2" />
                    <p className="text-xs font-bold">Rundschreiben werden geladen...</p>
                </div>
            ) : broadcasts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E8EAEF] p-12 text-center max-w-md mx-auto space-y-3">
                    <div className="w-14 h-14 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto">
                        <Megaphone className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Keine Rundschreiben gefunden</h3>
                    <p className="text-xs text-slate-500">
                        {search || targetFilter !== 'ALL'
                            ? 'Keine Treffer für deine Filtereinstellungen.'
                            : 'Es wurden noch keine System-Rundschreiben erstellt. Klicke oben auf "Neues Rundschreiben verfassen".'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {broadcasts.map((item) => {
                        const targetConfig = TARGET_MAP[item.target_type] || TARGET_MAP.ALL;
                        const TargetIcon = targetConfig.icon;
                        const priorityConfig = PRIORITY_MAP[item.priority] || PRIORITY_MAP.NORMAL;

                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-3xl border p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md ${
                                    item.is_active ? 'border-[#E8EAEF]' : 'border-slate-200 bg-slate-50/50 opacity-75'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Top Badges */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${targetConfig.bg}`}>
                                                <TargetIcon className="w-3 h-3" />
                                                <span>{targetConfig.label}</span>
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${priorityConfig.bg}`}>
                                                {priorityConfig.label}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleToggleActive(item)}
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-colors cursor-pointer border ${
                                                item.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                            }`}
                                        >
                                            {item.is_active ? '● Aktiv' : '○ Pausiert'}
                                        </button>
                                    </div>

                                    {/* Title & Content */}
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed whitespace-pre-wrap">
                                            {item.content}
                                        </p>
                                    </div>

                                    {/* Action Link Button if provided */}
                                    {item.action_url && (
                                        <div className="pt-1">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-forest bg-forest/5 px-2.5 py-1 rounded-lg border border-forest/10">
                                                <span>CTA: {item.action_label || 'Link öffnen'}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Engagement Stats & Footer Actions */}
                                <div className="pt-4 mt-4 border-t border-[#F1F3F6] space-y-3">
                                    {/* Reach Bar */}
                                    <div>
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                            <span>Gelesen von:</span>
                                            <span className="font-mono text-slate-700">
                                                {item.metrics?.read_count || 0} / {item.metrics?.target_audience || 1} ({item.metrics?.read_percentage || 0}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-forest h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${item.metrics?.read_percentage || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Date & Action Buttons */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {new Date(item.created_at).toLocaleDateString('de-DE')}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                title="Bearbeiten"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }}
                                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Create / Edit Modal ─── */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-sand/40 via-white to-sand/20 border-b border-[#E8EAEF] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {editingBroadcast ? 'Rundschreiben bearbeiten' : 'Neues Rundschreiben verfassen'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSubmitBroadcast} className="p-6 space-y-4 overflow-y-auto">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Titel der Mitteilung *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="z.B. Wichtiges Plattform-Update: Neue Filter für Wohnmobile"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest"
                                    />
                                </div>

                                {/* Target Audience Selector */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Zielgruppe auswählen
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'ALL', label: 'Alle Nutzer', icon: Users },
                                            { key: 'PRIVATE', label: 'Nur Privat', icon: User },
                                            { key: 'COMMERCIAL', label: 'Nur Gewerblich', icon: Building2 }
                                        ].map(({ key, label, icon: Icon }) => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => setFormData({ ...formData, target_type: key })}
                                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                                    formData.target_type === key
                                                        ? 'bg-forest/10 border-forest text-forest font-black shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 font-bold hover:bg-slate-100'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-[11px]">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Selector */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Priorität / Dringlichkeit
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'NORMAL', label: 'Normal (Info)', color: 'border-slate-300' },
                                            { key: 'IMPORTANT', label: 'Wichtig (Hinweis)', color: 'border-amber-400' },
                                            { key: 'URGENT', label: 'Dringend (Kritisch)', color: 'border-rose-400' }
                                        ].map(({ key, label }) => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => setFormData({ ...formData, priority: key })}
                                                className={`py-2 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                                                    formData.priority === key
                                                        ? 'bg-slate-900 text-white font-black shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 font-bold hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Nachrichtentext *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Verfasse deine Mitteilung an die ausgewählte Zielgruppe..."
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest resize-y"
                                    />
                                </div>

                                {/* Optional CTA Button */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Button-Beschriftung (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.action_label}
                                            onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                                            placeholder="z.B. Jetzt ansehen"
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-forest"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Ziel-URL (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.action_url}
                                            onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                                            placeholder="z.B. /de/inserate oder https://..."
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-forest"
                                        />
                                    </div>
                                </div>

                                {/* Live Preview Box */}
                                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Vorschau für Nutzer
                                    </span>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <Bell className="w-3.5 h-3.5 text-forest" />
                                            <h4 className="font-black text-slate-900 text-xs truncate">
                                                {formData.title || 'Titel der Mitteilung'}
                                            </h4>
                                        </div>
                                        <p className="text-[11px] text-slate-600 line-clamp-2">
                                            {formData.content || 'Hier erscheint der Text deines Rundschreibens...'}
                                        </p>
                                        {formData.action_url && (
                                            <span className="inline-block text-[10px] font-extrabold text-forest underline mt-1">
                                                {formData.action_label || 'Mehr erfahren'} →
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="pt-2 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-forest text-sand hover:bg-forest/90 text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{editingBroadcast ? 'Änderungen speichern' : 'Rundschreiben senden'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Delete Confirmation Modal ─── */}
            <AnimatePresence>
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Rundschreiben löschen?</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Möchtest du &ldquo;{itemToDelete.title}&rdquo; wirklich unwiderruflich löschen?
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={actionLoading}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                                >
                                    Löschen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

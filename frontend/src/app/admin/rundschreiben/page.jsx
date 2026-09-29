'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Megaphone,
    Plus,
    Search,
    RefreshCw,
    CheckCircle2,
    Eye,
    Edit3,
    Trash2,
    Users,
    Building2,
    User,
    AlertTriangle,
    Bell,
    ExternalLink,
    X,
    BarChart3,
    Send,
    ChevronLeft,
    ChevronRight,
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

const INITIAL_FORM = {
    title: '',
    content: '',
    target_type: 'ALL',
    priority: 'NORMAL',
    action_url: '',
    action_label: '',
    is_active: true
};

function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

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
    const [formData, setFormData] = useState(INITIAL_FORM);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const showFeedback = useCallback((msg, type = 'success') => {
        setFeedbackMessage({ msg, type });
        const timer = setTimeout(() => setFeedbackMessage(null), 4000);
        return () => clearTimeout(timer);
    }, []);

    const fetchBroadcasts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                search: search.trim(),
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
    }, [page, search, targetFilter, priorityFilter, statusFilter, showFeedback]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBroadcasts();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchBroadcasts]);

    // Open Modal for Create
    const handleOpenCreate = useCallback(() => {
        setEditingBroadcast(null);
        setFormData(INITIAL_FORM);
        setModalOpen(true);
    }, []);

    // Open Modal for Edit
    const handleOpenEdit = useCallback((broadcast) => {
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
    }, []);

    // Save Broadcast (Create or Update)
    const handleSubmitBroadcast = async (e) => {
        e.preventDefault();
        const cleanTitle = formData.title.trim();
        const cleanContent = formData.content.trim();

        if (!cleanTitle || !cleanContent) {
            showFeedback('Bitte Titel und Nachricht ausfüllen.', 'error');
            return;
        }

        const payload = {
            ...formData,
            title: cleanTitle,
            content: cleanContent,
            action_url: formData.action_url ? sanitizeUrl(formData.action_url) : '',
            action_label: formData.action_label.trim()
        };

        setActionLoading(true);
        try {
            if (editingBroadcast) {
                const res = await updateAdminBroadcast(editingBroadcast.id, payload);
                if (res.data?.success) {
                    showFeedback(res.data.message || 'Rundschreiben erfolgreich aktualisiert.');
                    setModalOpen(false);
                    fetchBroadcasts();
                } else {
                    showFeedback(res.data?.error || 'Speichern fehlgeschlagen.', 'error');
                }
            } else {
                const res = await createAdminBroadcast(payload);
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
        <div className="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-6 pb-12 px-3 sm:px-6 font-sans">
            {/* Toast Feedback */}
            <div className="fixed top-5 right-5 z-50 pointer-events-none">
                <AnimatePresence>
                    {feedbackMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 ${
                                feedbackMessage.type === 'error'
                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            }`}
                        >
                            <span className="shrink-0">
                                {feedbackMessage.type === 'error' ? (
                                    <AlertTriangle className="w-4 h-4" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                )}
                            </span>
                            <span>{feedbackMessage.msg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Top Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-4 sm:p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-black font-sans text-slate-900 tracking-tight">
                            Broadcasts & Rundschreiben
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Sende skalierbare Systemnachrichten an alle Nutzer, Privat- oder Gewerbekunden ohne Nachrichtenduplikate.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-forest text-sand hover:bg-forest/90 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 text-gold shrink-0" />
                    <span>Neues Rundschreiben verfassen</span>
                </button>
            </motion.div>

            {/* Bento KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Gesamt Rundschreiben */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    onClick={() => { setStatusFilter('ALL'); setTargetFilter('ALL'); setPage(1); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[130px] sm:min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5 active:scale-98"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-sand/80 uppercase tracking-wider truncate">
                            Gesamt
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors shrink-0">
                            <Megaphone className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                            {summary.totalBroadcasts || 0}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1.5 sm:pt-2 border-t border-white/10 text-[9px] sm:text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{`${summary.activeBroadcasts || 0} Aktiv`}</span>
                            <span>{`${summary.totalReads || 0} Gelesen`}</span>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Aktiv & Sichtbar */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    onClick={() => { setStatusFilter('TRUE'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5 active:scale-98"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Aktiv & Sichtbar
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.activeBroadcasts || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-emerald-700 font-semibold mt-1 truncate">
                            <span>Live in Postfächern</span>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Gelesene Zugriffe */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                    className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[145px]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Lese-Events
                        </span>
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Eye className="w-3.5 h-3.5 text-blue-700" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.totalReads || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 font-medium mt-1 truncate">
                            <span>Bestätigte Zugriffe</span>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Durchschnittliche Reichweite */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 }}
                    className="bg-white border border-[#E8EAEF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[145px]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Öffnungsquote
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {`${summary.avgReadRate || 0}%`}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-700 font-semibold mt-1 truncate">
                            <span>Reichweite & Quote</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-[#E8EAEF] shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
                <div className="relative w-full lg:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Titel oder Inhalt durchsuchen..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setPage(1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    {/* Target Filter */}
                    <select
                        value={targetFilter}
                        onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest cursor-pointer"
                    >
                        <option value="ALL">Zielgruppe: Alle</option>
                        <option value="PRIVATE">Nur Privat</option>
                        <option value="COMMERCIAL">Nur Gewerblich</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest cursor-pointer"
                    >
                        <option value="ALL">Priorität: Alle</option>
                        <option value="NORMAL">Normal</option>
                        <option value="IMPORTANT">Wichtig</option>
                        <option value="URGENT">Dringend</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest cursor-pointer"
                    >
                        <option value="ALL">Status: Alle</option>
                        <option value="TRUE">Nur Aktiv</option>
                        <option value="FALSE">Nur Pausiert</option>
                    </select>

                    <button
                        type="button"
                        onClick={fetchBroadcasts}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
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
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl border border-[#E8EAEF] p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs"
                >
                    <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
                        <Megaphone className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Keine Rundschreiben gefunden</h3>
                    <p className="text-xs text-slate-500">
                        {search || targetFilter !== 'ALL'
                            ? 'Keine Treffer für deine Filtereinstellungen.'
                            : 'Es wurden noch keine System-Rundschreiben erstellt. Klicke oben auf "Neues Rundschreiben verfassen".'}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
                    >
                        {broadcasts.map((item) => {
                            const targetConfig = TARGET_MAP[item.target_type] || TARGET_MAP.ALL;
                            const TargetIcon = targetConfig.icon;
                            const priorityConfig = PRIORITY_MAP[item.priority] || PRIORITY_MAP.NORMAL;

                            return (
                                <motion.div
                                    key={item.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className={`bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md ${
                                        item.is_active ? 'border-[#E8EAEF]' : 'border-slate-200 bg-slate-50/50 opacity-80'
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
                                                type="button"
                                                onClick={() => handleToggleActive(item)}
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-colors cursor-pointer border shrink-0 ${
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
                                                <a
                                                    href={sanitizeUrl(item.action_url)}
                                                    target={item.action_url.startsWith('http') ? '_blank' : '_self'}
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-forest bg-forest/5 hover:bg-forest/10 px-2.5 py-1 rounded-lg border border-forest/10 truncate max-w-full transition-colors"
                                                >
                                                    <span className="truncate">CTA: {item.action_label || 'Link öffnen'}</span>
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Engagement Stats & Footer Actions */}
                                    <div className="pt-3.5 mt-3.5 border-t border-[#F1F3F6] space-y-3">
                                        {/* Reach Bar */}
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                <span>Gelesen von:</span>
                                                <span className="font-mono text-slate-700 text-[10px] sm:text-[11px]">
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
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }}
                                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                                    title="Löschen"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-400 font-bold">
                                Seite {page} von {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-2 rounded-xl bg-white border border-[#E8EAEF] text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="p-2 rounded-xl bg-white border border-[#E8EAEF] text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Create / Edit Modal (Fully Responsive & Secure) ─── */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-[#E8EAEF] overflow-hidden flex flex-col max-h-[92vh] my-auto"
                        >
                            {/* Modal Header */}
                            <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-sand/40 via-white to-sand/20 border-b border-[#E8EAEF] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                                        <Megaphone className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                    </div>
                                    <h3 className="text-xs sm:text-base font-black text-slate-900 truncate">
                                        {editingBroadcast ? 'Rundschreiben bearbeiten' : 'Neues Rundschreiben verfassen'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0 transition-colors ml-2"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSubmitBroadcast} className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                                {/* Title */}
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Titel der Mitteilung *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={160}
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="z.B. Wichtiges Plattform-Update: Neue Filter für Wohnmobile"
                                        className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest"
                                    />
                                </div>

                                {/* Target Audience Selector */}
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Zielgruppe auswählen
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                        {[
                                            { key: 'ALL', label: 'Alle Nutzer', icon: Users },
                                            { key: 'PRIVATE', label: 'Nur Privat', icon: User },
                                            { key: 'COMMERCIAL', label: 'Gewerblich', icon: Building2 }
                                        ].map(({ key, label, icon: Icon }) => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => setFormData(prev => ({ ...prev, target_type: key }))}
                                                className={`p-1 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] ${
                                                    formData.target_type === key
                                                        ? 'bg-forest/10 border-forest text-forest font-black shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 font-bold hover:bg-slate-100'
                                                }`}
                                            >
                                                <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                                                <span className="text-[9px] sm:text-[11px] truncate w-full">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Selector */}
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Priorität / Dringlichkeit
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                        {[
                                            { key: 'NORMAL', label: 'Normal' },
                                            { key: 'IMPORTANT', label: 'Wichtig' },
                                            { key: 'URGENT', label: 'Dringend' }
                                        ].map(({ key, label }) => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                                                className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl border text-center text-[10px] sm:text-xs transition-all cursor-pointer truncate ${
                                                    formData.priority === key
                                                        ? 'bg-slate-900 text-white font-black shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 font-bold hover:bg-slate-100'
                                                }`}
                                            >
                                                <span className="truncate block">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                        Nachrichtentext *
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        maxLength={4000}
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Verfasse deine Mitteilung an die ausgewählte Zielgruppe..."
                                        className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-forest resize-y min-h-[75px]"
                                    />
                                </div>

                                {/* Optional CTA Button */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <div>
                                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 mb-0.5">
                                            Button-Beschriftung (optional)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={60}
                                            value={formData.action_label}
                                            onChange={(e) => setFormData(prev => ({ ...prev, action_label: e.target.value }))}
                                            placeholder="z.B. Jetzt ansehen"
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-forest"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 mb-0.5">
                                            Ziel-URL (optional)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={500}
                                            value={formData.action_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
                                            placeholder="z.B. /inserate oder https://..."
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-forest"
                                        />
                                    </div>
                                </div>

                                {/* Live Preview Box */}
                                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#F8F9FB] border border-[#E8EAEF] space-y-1">
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Vorschau für Nutzer
                                    </span>
                                    <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <Bell className="w-3.5 h-3.5 text-forest shrink-0" />
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
                                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 sm:py-2.5 rounded-xl bg-forest text-sand hover:bg-forest/90 text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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

            {/* ─── Delete Confirmation Modal (Responsive) ─── */}
            <AnimatePresence>
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-2xl border border-slate-100 my-auto"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Rundschreiben löschen?</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Möchtest du &ldquo;{itemToDelete.title}&rdquo; wirklich unwiderruflich löschen?
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1.5">
                                <button
                                    type="button"
                                    onClick={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
                                    className="px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={actionLoading}
                                    className="px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                                >
                                    {actionLoading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>Löschen</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

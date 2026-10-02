'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquareHeart,
    Search,
    Star,
    Flame,
    Zap,
    CircleDot,
    CheckCircle2,
    Clock,
    Sparkles,
    Bug,
    HelpCircle,
    Building2,
    Mail,
    X,
    RefreshCw,
    Loader2,
    Inbox,
    Check,
    Tag,
    ChevronRight,
    ArrowUpRight,
    ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    getAdminFeedbacks,
    updateAdminFeedbackStatus
} from '@/api/admin';
import { getImageUrl } from '@/utils/imageUrl';

const CATEGORY_MAP = {
    FEATURE: { label: 'Funktionswunsch / Idee', icon: Sparkles, color: 'text-amber-800 bg-amber-50 border-amber-200' },
    ISSUE: { label: 'Problem / Bug', icon: Bug, color: 'text-rose-800 bg-rose-50 border-rose-200' },
    SUPPORT: { label: 'Support & Frage', icon: HelpCircle, color: 'text-sky-800 bg-sky-50 border-sky-200' },
    COMMERCIAL: { label: 'Gewerblich & Partner', icon: Building2, color: 'text-purple-800 bg-purple-50 border-purple-200' },
    GENERAL: { label: 'Lob & Allgemeines', icon: MessageSquareHeart, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' }
};

const PRIORITY_CONFIG = {
    HIGH: { label: 'Hohe Priorität', icon: Flame, color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
    MEDIUM: { label: 'Mittlere Priorität', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    LOW: { label: 'Niedrige Priorität', icon: CircleDot, color: 'text-stone-600 bg-stone-50 border-stone-200', dot: 'bg-stone-400' }
};

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

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default function AdminFeedbackPage() {
    const [rawFeedbacks, setRawFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'OPEN' | 'FAVORITES' | 'HIGH_PRIO' | 'RESOLVED'
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [userTypeFilter, setUserTypeFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

    // Selected Feedback Modal State (Single Feedback Dossier)
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [savingNoteId, setSavingNoteId] = useState(null);
    const [modalNoteInput, setModalNoteInput] = useState('');

    // ── Load Feedbacks from API ────────────────────────────────────────────────
    const fetchFeedbacks = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getAdminFeedbacks();
            const list = res?.data?.feedbacks || res?.feedbacks || (Array.isArray(res?.data) ? res.data : []);
            if (Array.isArray(list)) {
                // Newest first by default
                const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setRawFeedbacks(sorted);
            }
        } catch (err) {
            console.error('Error fetching admin feedbacks:', err);
            if (!silent) toast.error('Fehler beim Laden der Feedbacks.');
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    // ── Computed Summary Metrics for Bento Cards ──────────────────────────────
    const stats = useMemo(() => {
        const total = rawFeedbacks.length;
        const open = rawFeedbacks.filter(f => f.status !== 'RESOLVED').length;
        const favorites = rawFeedbacks.filter(f => f.is_favorite).length;
        const highPrio = rawFeedbacks.filter(f => f.priority === 'HIGH').length;
        const resolved = rawFeedbacks.filter(f => f.status === 'RESOLVED').length;
        const commercialCount = rawFeedbacks.filter(f => f.user_type === 'COMMERCIAL').length;
        const privateCount = rawFeedbacks.filter(f => f.user_type !== 'COMMERCIAL').length;

        return {
            total,
            open,
            favorites,
            highPrio,
            resolved,
            commercialCount,
            privateCount
        };
    }, [rawFeedbacks]);

    // ── Filtered Single Feedbacks List (Not Grouped) ──────────────────────────
    const filteredFeedbacks = useMemo(() => {
        return rawFeedbacks.filter((fb) => {
            const isCommercial = fb.user_type === 'COMMERCIAL';
            const userName = isCommercial
                ? (fb.company_name || 'Gewerblicher Partner')
                : (`${fb.first_name || ''} ${fb.last_name || ''}`.trim() || fb.user_email?.split('@')[0] || 'Camper');

            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesUser = userName.toLowerCase().includes(q) || (fb.user_email || '').toLowerCase().includes(q);
                const matchesText = (fb.subject || '').toLowerCase().includes(q) || (fb.message || '').toLowerCase().includes(q);
                if (!matchesUser && !matchesText) return false;
            }

            // Category Filter
            if (categoryFilter !== 'ALL' && fb.category !== categoryFilter) {
                return false;
            }

            // User Type Filter
            if (userTypeFilter === 'COMMERCIAL' && fb.user_type !== 'COMMERCIAL') return false;
            if (userTypeFilter === 'PRIVATE' && fb.user_type === 'COMMERCIAL') return false;

            // Priority Filter
            if (priorityFilter !== 'ALL' && (fb.priority || 'MEDIUM') !== priorityFilter) {
                return false;
            }

            // Tab Filter
            if (activeFilterTab === 'OPEN' && fb.status === 'RESOLVED') return false;
            if (activeFilterTab === 'FAVORITES' && !fb.is_favorite) return false;
            if (activeFilterTab === 'HIGH_PRIO' && fb.priority !== 'HIGH') return false;
            if (activeFilterTab === 'RESOLVED' && fb.status !== 'RESOLVED') return false;

            return true;
        });
    }, [rawFeedbacks, searchQuery, categoryFilter, userTypeFilter, priorityFilter, activeFilterTab]);

    // ── 1-Click Toggle Favorite ───────────────────────────────────────────────
    const handleToggleFavorite = async (feedbackId, currentVal, e) => {
        if (e) e.stopPropagation();
        const newVal = !currentVal;

        setRawFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, is_favorite: newVal } : f));
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
            setSelectedFeedback(prev => ({ ...prev, is_favorite: newVal }));
        }

        try {
            await updateAdminFeedbackStatus(feedbackId, { is_favorite: newVal });
            toast.success(newVal ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
        } catch (err) {
            console.error('Error toggling favorite:', err);
            toast.error('Fehler beim Aktualisieren des Favoritenstatus.');
            fetchFeedbacks(true);
        }
    };

    // ── Change Priority ───────────────────────────────────────────────────────
    const handleChangePriority = async (feedbackId, newPriority, e) => {
        if (e) e.stopPropagation();

        setRawFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, priority: newPriority } : f));
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
            setSelectedFeedback(prev => ({ ...prev, priority: newPriority }));
        }

        try {
            await updateAdminFeedbackStatus(feedbackId, { priority: newPriority });
            toast.success(`Priorität auf "${PRIORITY_CONFIG[newPriority]?.label || newPriority}" gesetzt.`);
        } catch (err) {
            console.error('Error updating priority:', err);
            toast.error('Fehler beim Aktualisieren der Priorität.');
            fetchFeedbacks(true);
        }
    };

    // ── Toggle Status (Open / Resolved) ───────────────────────────────────────
    const handleToggleStatus = async (feedbackId, currentStatus, e) => {
        if (e) e.stopPropagation();
        const newStatus = currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED';

        setRawFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
            setSelectedFeedback(prev => ({ ...prev, status: newStatus }));
        }

        try {
            await updateAdminFeedbackStatus(feedbackId, { status: newStatus });
            toast.success(newStatus === 'RESOLVED' ? 'Feedback als erledigt markiert.' : 'Feedback wieder auf Offen gesetzt.');
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Fehler beim Aktualisieren des Status.');
            fetchFeedbacks(true);
        }
    };

    // ── Save Admin Note ───────────────────────────────────────────────────────
    const handleSaveNote = async (feedbackId, noteText) => {
        setSavingNoteId(feedbackId);
        try {
            await updateAdminFeedbackStatus(feedbackId, { admin_note: noteText });
            toast.success('Interne Notiz gespeichert.');
            setRawFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, admin_note: noteText } : f));
            if (selectedFeedback && selectedFeedback.id === feedbackId) {
                setSelectedFeedback(prev => ({ ...prev, admin_note: noteText }));
            }
        } catch (err) {
            console.error('Error saving note:', err);
            toast.error('Fehler beim Speichern der Notiz.');
        } finally {
            setSavingNoteId(null);
        }
    };

    // Open Detail Modal for a single feedback
    const handleOpenDetailModal = (fb) => {
        setSelectedFeedback(fb);
        setModalNoteInput(fb.admin_note || '');
        setIsDetailModalOpen(true);
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-12 font-sans">
            
            {/* ─── 1. Top Page Header (Matching Bento/Admin styling) ─── */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs"
            >
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold shadow-inner shrink-0">
                        <MessageSquareHeart className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight flex items-center gap-2">
                            Feedback & Ideen-Board
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-forest text-sand">
                                {rawFeedbacks.length} Einträge
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Verwalte alle eingereichten Vorschläge, Feature-Wünsche und Rückmeldungen einzeln und übersichtlich.
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
                        disabled={refreshing || loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#D5D9E0] text-xs font-bold text-slate-700 hover:bg-sand/30 hover:border-forest/30 transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-forest' : ''}`} />
                        <span>Aktualisieren</span>
                    </button>
                </div>
            </motion.div>

            {/* ─── 2. Top Stats Bento Cards (5 Cards matching Admin Users/Dashboard) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* 1. Gesamt Feedbacks (Forest-to-Black Luxury Gradient Card) */}
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setActiveFilterTab('ALL'); setCategoryFilter('ALL'); setUserTypeFilter('ALL'); setPriorityFilter('ALL'); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[140px] border border-forest/30 cursor-pointer group transition-all"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gesamt-Feedbacks
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {stats.total}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{stats.commercialCount} von Händlern</span>
                            <span>{stats.privateCount} von Privat</span>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Offene Feedbacks */}
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveFilterTab('OPEN')}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-all ${
                        activeFilterTab === 'OPEN' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-[#E8EAEF] hover:border-sky-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Offen
                        </span>
                        <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                            <Clock className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.open}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-sky-700 font-semibold mt-1">
                            <span>Ausstehende Bearbeitung</span>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Favoriten / Gemerkt */}
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveFilterTab('FAVORITES')}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-all ${
                        activeFilterTab === 'FAVORITES' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-[#E8EAEF] hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Favoriten
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.favorites}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold mt-1">
                            <span>Vorgemerkte Ideen</span>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Hohe Priorität */}
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveFilterTab('HIGH_PRIO')}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-all ${
                        activeFilterTab === 'HIGH_PRIO' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-[#E8EAEF] hover:border-rose-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Hohe Priorität
                        </span>
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            <Flame className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.highPrio}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-semibold mt-1">
                            <span>Dringend / Wichtig</span>
                        </div>
                    </div>
                </motion.div>

                {/* 5. Erledigt */}
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveFilterTab('RESOLVED')}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px] cursor-pointer group transition-all ${
                        activeFilterTab === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-[#E8EAEF] hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Erledigt
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.resolved}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                            <span>Abgeschlossen</span>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* ─── 3. Filters & Search Strip ─── */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs space-y-4">
                
                {/* Search and Dropdown Filter Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Suche nach Absender, Betreff oder Inhalt..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#FAFBFD] border border-[#E2E6EC] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-forest focus:bg-white transition-all shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        
                        {/* Category Dropdown */}
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none bg-[#FAFBFD] border border-[#E2E6EC] rounded-2xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest shadow-2xs cursor-pointer"
                            >
                                <option value="ALL">Alle Themen</option>
                                <option value="FEATURE">Funktionswunsch</option>
                                <option value="ISSUE">Problem / Bug</option>
                                <option value="SUPPORT">Support</option>
                                <option value="COMMERCIAL">Gewerblich</option>
                                <option value="GENERAL">Lob / Allgemein</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Priority Dropdown */}
                        <div className="relative">
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="appearance-none bg-[#FAFBFD] border border-[#E2E6EC] rounded-2xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest shadow-2xs cursor-pointer"
                            >
                                <option value="ALL">Alle Prioritäten</option>
                                <option value="HIGH">Hohe Priorität</option>
                                <option value="MEDIUM">Mittlere Priorität</option>
                                <option value="LOW">Niedrige Priorität</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* User Type Dropdown */}
                        <div className="relative">
                            <select
                                value={userTypeFilter}
                                onChange={(e) => setUserTypeFilter(e.target.value)}
                                className="appearance-none bg-[#FAFBFD] border border-[#E2E6EC] rounded-2xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest shadow-2xs cursor-pointer"
                            >
                                <option value="ALL">Alle Nutzertypen</option>
                                <option value="PRIVATE">Nur Privat</option>
                                <option value="COMMERCIAL">Nur Händler</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                    </div>
                </div>

                {/* Filter Pill Tabs Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F0F2F6]">
                    <button
                        type="button"
                        onClick={() => setActiveFilterTab('ALL')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeFilterTab === 'ALL'
                                ? 'bg-forest text-sand shadow-xs font-black'
                                : 'text-slate-600 hover:bg-sand/40'
                        }`}
                    >
                        <span>Alle Einträge</span>
                        <span className="font-mono text-[10px] opacity-75">({stats.total})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilterTab('OPEN')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeFilterTab === 'OPEN'
                                ? 'bg-sky-600 text-white shadow-xs font-black'
                                : 'text-sky-800 hover:bg-sky-50'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Offen</span>
                        <span className="font-mono text-[10px]">({stats.open})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilterTab('FAVORITES')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeFilterTab === 'FAVORITES'
                                ? 'bg-amber-500 text-white shadow-xs font-black'
                                : 'text-amber-800 hover:bg-amber-50'
                        }`}
                    >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Favoriten</span>
                        <span className="font-mono text-[10px]">({stats.favorites})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilterTab('HIGH_PRIO')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeFilterTab === 'HIGH_PRIO'
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'text-rose-800 hover:bg-rose-50'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Hohe Priorität</span>
                        <span className="font-mono text-[10px]">({stats.highPrio})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilterTab('RESOLVED')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeFilterTab === 'RESOLVED'
                                ? 'bg-slate-700 text-sand shadow-xs font-black'
                                : 'text-slate-600 hover:bg-sand/40'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Erledigt</span>
                        <span className="font-mono text-[10px]">({stats.resolved})</span>
                    </button>
                </div>

            </div>

            {/* ─── 4. Individual Feedbacks Grid (Single Entries, Not Grouped) ─── */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-3xl border border-[#E8EAEF]">
                    <Loader2 className="w-8 h-8 animate-spin text-forest" />
                    <span className="text-xs font-bold">Lade Feedback-Einträge...</span>
                </div>
            ) : filteredFeedbacks.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center text-slate-400 space-y-3 border border-[#E8EAEF] shadow-2xs">
                    <Inbox className="w-10 h-10 mx-auto opacity-40 text-forest" />
                    <h3 className="text-base font-bold text-slate-700">Keine Feedbacks gefunden</h3>
                    <p className="text-xs max-w-sm mx-auto">
                        Passe deine Suchbegriffe oder die aktiven Filter an, um Einträge anzuzeigen.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredFeedbacks.map((fb) => {
                        const isCommercial = fb.user_type === 'COMMERCIAL';
                        const userName = isCommercial
                            ? (fb.company_name || 'Gewerblicher Partner')
                            : (`${fb.first_name || ''} ${fb.last_name || ''}`.trim() || fb.user_email?.split('@')[0] || 'Camper');
                        const userAvatar = isCommercial ? fb.company_logo : fb.private_avatar;

                        const cat = CATEGORY_MAP[fb.category] || CATEGORY_MAP.GENERAL;
                        const CatIcon = cat.icon;
                        const prio = PRIORITY_CONFIG[fb.priority] || PRIORITY_CONFIG.MEDIUM;
                        const PrioIcon = prio.icon;
                        const isResolved = fb.status === 'RESOLVED';

                        return (
                            <motion.div
                                key={fb.id}
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleOpenDetailModal(fb)}
                                className={`rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer flex flex-col justify-between group space-y-4 relative ${
                                    isResolved
                                        ? 'bg-[#FCFCFD] border-[#E8EAEF] opacity-75 hover:opacity-100'
                                        : fb.is_favorite
                                            ? 'bg-white border-amber-300 shadow-md ring-2 ring-amber-100'
                                            : 'bg-white border-[#E8EAEF] shadow-2xs hover:shadow-md hover:border-forest/40'
                                }`}
                            >
                                <div className="space-y-3.5">
                                    
                                    {/* 1. Header: Sender Info & Quick Actions */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        
                                        {/* User Identity */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {userAvatar ? (
                                                <img
                                                    src={getImageUrl(userAvatar)}
                                                    alt={userName}
                                                    className="w-10 h-10 rounded-2xl object-cover border border-[#E8EAEF] bg-white shadow-2xs shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest to-[#002204] text-sand flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                                                    {userName.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-forest transition-colors">
                                                        {userName}
                                                    </h3>
                                                    {isCommercial ? (
                                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                                            Händler
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-sand text-slate-700 border border-beige shrink-0">
                                                            Privat
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    {fb.user_email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Favorite Star Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleFavorite(fb.id, fb.is_favorite, e)}
                                            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                                                fb.is_favorite
                                                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                                                    : 'bg-[#FAFBFD] border-[#E8EAEF] text-slate-400 hover:text-amber-500 hover:border-amber-200'
                                            }`}
                                            title={fb.is_favorite ? 'Aus Favoriten entfernen' : 'Als Favorit merken'}
                                        >
                                            <Star className={`w-3.5 h-3.5 ${fb.is_favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                                        </button>
                                    </div>

                                    {/* 2. Category & Priority Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`px-2.5 py-0.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${cat.color}`}>
                                            <CatIcon className="w-3 h-3" />
                                            <span>{cat.label}</span>
                                        </span>

                                        <span className={`px-2 py-0.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 ${prio.color}`}>
                                            <PrioIcon className="w-3 h-3" />
                                            <span>{prio.label}</span>
                                        </span>

                                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                            {formatRelativeTime(fb.created_at)}
                                        </span>
                                    </div>

                                    {/* 3. Subject Title */}
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1 group-hover:text-forest transition-colors">
                                        {fb.subject}
                                    </h4>

                                    {/* 4. Feedback Message Preview */}
                                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-[#FAFBFD] p-3 rounded-2xl border border-[#F0F2F6]">
                                        {fb.message}
                                    </p>

                                    {/* 5. Internal Admin Note if present */}
                                    {fb.admin_note && (
                                        <div className="text-[11px] bg-amber-50/70 border border-amber-200 text-amber-900 p-2.5 rounded-xl flex items-center gap-1.5">
                                            <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                                            <span className="truncate font-medium">Notiz: {fb.admin_note}</span>
                                        </div>
                                    )}

                                </div>

                                {/* Card Footer: Status & Quick Controls */}
                                <div className="pt-3 border-t border-[#F0F2F6] flex items-center justify-between text-xs">
                                    <button
                                        type="button"
                                        onClick={(e) => handleToggleStatus(fb.id, fb.status, e)}
                                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                            isResolved
                                                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black'
                                                : 'bg-[#FAFBFD] border-[#E8EAEF] text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                                        }`}
                                    >
                                        <Check className={`w-3 h-3 ${isResolved ? 'text-emerald-700 font-black' : ''}`} />
                                        <span>{isResolved ? 'Erledigt' : 'Offen'}</span>
                                    </button>

                                    <span className="text-xs font-bold text-forest group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        <span>Dossier öffnen</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════
                5. SINGLE FEEDBACK DETAIL MODAL (DOSSIER)
               ═════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isDetailModalOpen && selectedFeedback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E8EAEF] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 border-b border-[#E8EAEF] bg-[#FAFBFD] flex items-start justify-between gap-3 shrink-0">
                                
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {selectedFeedback.user_type === 'COMMERCIAL' && selectedFeedback.company_logo ? (
                                        <img
                                            src={getImageUrl(selectedFeedback.company_logo)}
                                            alt={selectedFeedback.company_name}
                                            className="w-12 h-12 rounded-2xl object-cover border border-[#E8EAEF] bg-white shadow-2xs shrink-0"
                                        />
                                    ) : selectedFeedback.private_avatar ? (
                                        <img
                                            src={getImageUrl(selectedFeedback.private_avatar)}
                                            alt={selectedFeedback.first_name}
                                            className="w-12 h-12 rounded-2xl object-cover border border-[#E8EAEF] bg-white shadow-2xs shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest to-[#002204] text-sand flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                                            {(selectedFeedback.company_name || selectedFeedback.first_name || selectedFeedback.user_email || 'C').slice(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                                                {selectedFeedback.user_type === 'COMMERCIAL'
                                                    ? (selectedFeedback.company_name || 'Gewerblicher Partner')
                                                    : (`${selectedFeedback.first_name || ''} ${selectedFeedback.last_name || ''}`.trim() || 'Camper')}
                                            </h2>
                                            {selectedFeedback.user_type === 'COMMERCIAL' ? (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                                                    Händler ({selectedFeedback.company_tier || 'FREE'})
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sand text-slate-700 border border-beige">
                                                    Privatkonto
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                            <a href={`mailto:${selectedFeedback.user_email}`} className="hover:text-forest flex items-center gap-1 hover:underline">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                <span>{selectedFeedback.user_email}</span>
                                            </a>
                                            <span className="text-slate-400 font-mono">
                                                Eingereicht am {formatFeedbackDate(selectedFeedback.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sand/40 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content Body */}
                            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
                                
                                {/* Status & Quick Controls Strip */}
                                <div className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-[#E8EAEF] flex flex-wrap items-center justify-between gap-3">
                                    
                                    {/* Category Pill */}
                                    {(() => {
                                        const cat = CATEGORY_MAP[selectedFeedback.category] || CATEGORY_MAP.GENERAL;
                                        const CatIcon = cat.icon;
                                        return (
                                            <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${cat.color}`}>
                                                <CatIcon className="w-3.5 h-3.5" />
                                                <span>{cat.label}</span>
                                            </span>
                                        );
                                    })()}

                                    <div className="flex items-center gap-2">
                                        
                                        {/* Favorite Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleFavorite(selectedFeedback.id, selectedFeedback.is_favorite, e)}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                selectedFeedback.is_favorite
                                                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                                                    : 'bg-white border-[#E8EAEF] text-slate-500 hover:text-amber-600'
                                            }`}
                                        >
                                            <Star className={`w-3.5 h-3.5 ${selectedFeedback.is_favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                                            <span>{selectedFeedback.is_favorite ? 'Favorit' : 'Merken'}</span>
                                        </button>

                                        {/* Priority Selector with Lucide Icon */}
                                        <div className="relative flex items-center">
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                {(() => {
                                                    const prio = PRIORITY_CONFIG[selectedFeedback.priority] || PRIORITY_CONFIG.MEDIUM;
                                                    const PrioIcon = prio.icon;
                                                    return <PrioIcon className={`w-3.5 h-3.5 ${prio.color.split(' ')[0]}`} />;
                                                })()}
                                            </div>
                                            <select
                                                value={selectedFeedback.priority || 'MEDIUM'}
                                                onChange={(e) => handleChangePriority(selectedFeedback.id, e.target.value)}
                                                className="bg-white border border-[#E8EAEF] rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-forest cursor-pointer shadow-2xs"
                                            >
                                                <option value="HIGH">Hohe Priorität</option>
                                                <option value="MEDIUM">Mittlere Priorität</option>
                                                <option value="LOW">Niedrige Priorität</option>
                                            </select>
                                        </div>

                                        {/* Status Toggle (Resolved / Open) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleStatus(selectedFeedback.id, selectedFeedback.status, e)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                selectedFeedback.status === 'RESOLVED'
                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black'
                                                    : 'bg-white border-[#E8EAEF] text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                                            }`}
                                        >
                                            <Check className={`w-3.5 h-3.5 ${selectedFeedback.status === 'RESOLVED' ? 'text-emerald-700 font-black' : ''}`} />
                                            <span>{selectedFeedback.status === 'RESOLVED' ? 'Erledigt' : 'Als erledigt markieren'}</span>
                                        </button>

                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Betreff / Thema
                                    </label>
                                    <div className="text-base font-black text-slate-900 font-sans">
                                        {selectedFeedback.subject}
                                    </div>
                                </div>

                                {/* Full Message Content */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Nachricht / Inhalt
                                    </label>
                                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFBFD] border border-[#E8EAEF] text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedFeedback.message}
                                    </div>
                                </div>

                                {/* Internal Admin Note */}
                                <div className="space-y-2 pt-2 border-t border-[#F0F2F6]">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Interne Notiz / Roadmap-Status</span>
                                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                                            {savingNoteId === selectedFeedback.id ? 'Wird gespeichert...' : 'Auto-Save bei Verlassen'}
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={modalNoteInput}
                                            onChange={(e) => setModalNoteInput(e.target.value)}
                                            onBlur={(e) => {
                                                if (e.target.value !== (selectedFeedback.admin_note || '')) {
                                                    handleSaveNote(selectedFeedback.id, e.target.value);
                                                }
                                            }}
                                            placeholder="Z. B. 'Geplant für Release v2.4', 'Ticket #104 angelegt'..."
                                            className="w-full bg-[#FAFBFD] border border-[#E2E6EC] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-forest focus:bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSaveNote(selectedFeedback.id, modalNoteInput)}
                                            className="px-4 py-2 bg-forest hover:bg-[#004d0a] text-sand rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                                        >
                                            Speichern
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[#E8EAEF] bg-[#FAFBFD] flex items-center justify-between shrink-0">
                                <a
                                    href={`mailto:${selectedFeedback.user_email}?subject=Feedback zu Campuna: ${encodeURIComponent(selectedFeedback.subject)}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-forest"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Dem Nutzer per E-Mail antworten</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-sand rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                >
                                    Schließen
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    CheckCircle2,
    AlertCircle,
    X,
    Sparkles,
    Eye,
    EyeOff,
    RefreshCw,
    Calendar,
    Tag,
    FileText,
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAdminTips,
    createAdminTip,
    updateAdminTip,
    deleteAdminTip
} from '@/api/tips';
import CircleLoader from '@/app/components/CircleLoader';

const PRESET_CATEGORIES = [
    'Rechtliches',
    'Fahrpraxis',
    'Technik',
    'Wintercamping',
    'Packliste',
    'Sicherheit',
    'Gewicht & Zuladung',
    'Campingplatz'
];

export default function TipsManagement({ onToast }) {
    const [tips, setTips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'

    // Form Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTip, setEditingTip] = useState(null);
    const [formData, setFormData] = useState({
        category: 'Rechtliches',
        display_date: 'Gestern',
        title: '',
        description: '',
        position: 0,
        is_active: true
    });

    // Delete Modal state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, tip: null });

    // Load all tips from backend
    const fetchTips = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getAdminTips();
            if (res.data?.success && Array.isArray(res.data.tips)) {
                setTips(res.data.tips);
            }
        } catch (err) {
            console.error('Error fetching admin tips:', err);
            if (onToast) {
                onToast({
                    type: 'error',
                    message: 'Fehler beim Laden der Praxistipps aus der Datenbank.'
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchTips();
    }, [fetchTips]);

    // Categories list derived from tips + presets
    const allCategories = useMemo(() => {
        const set = new Set(PRESET_CATEGORIES);
        tips.forEach(t => {
            if (t.category) set.add(t.category);
        });
        return Array.from(set);
    }, [tips]);

    // Filtered tips
    const filteredTips = useMemo(() => {
        return tips.filter(t => {
            const matchesCat = filterCategory === 'all' || t.category === filterCategory;
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'active' && t.is_active) ||
                (filterStatus === 'inactive' && !t.is_active);

            const q = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !q ||
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q)) ||
                (t.category && t.category.toLowerCase().includes(q));

            return matchesCat && matchesStatus && matchesSearch;
        });
    }, [tips, filterCategory, filterStatus, searchTerm]);

    // Stats
    const stats = useMemo(() => {
        const total = tips.length;
        const active = tips.filter(t => t.is_active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [tips]);

    // Open Modal for Create
    const handleOpenCreate = () => {
        setEditingTip(null);
        setFormData({
            category: 'Rechtliches',
            title: '',
            description: '',
            position: tips.length,
            is_active: true
        });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEdit = (tip) => {
        setEditingTip(tip);
        setFormData({
            category: tip.category || 'Rechtliches',
            title: tip.title || '',
            description: tip.description || '',
            position: tip.position || 0,
            is_active: Boolean(tip.is_active)
        });
        setIsModalOpen(true);
    };

    // Toggle active status
    const handleToggleActive = async (tip) => {
        try {
            const nextStatus = !tip.is_active;
            const res = await updateAdminTip(tip.id, { is_active: nextStatus });
            if (res.data?.success) {
                setTips(prev =>
                    prev.map(t => (t.id === tip.id ? { ...t, is_active: nextStatus } : t))
                );
                if (onToast) {
                    onToast({
                        type: 'success',
                        message: nextStatus ? 'Tipp wurde aktiviert und ist jetzt live!' : 'Tipp wurde deaktiviert.'
                    });
                }
            }
        } catch (err) {
            console.error('Error toggling active:', err);
            if (onToast) {
                onToast({
                    type: 'error',
                    message: 'Status konnte nicht aktualisiert werden.'
                });
            }
        }
    };

    // Save Tip (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanTitle = formData.title.trim();
        const cleanDesc = formData.description.trim();
        const cleanCat = formData.category.trim();

        if (!cleanTitle) {
            if (onToast) onToast({ type: 'error', message: 'Bitte gib einen Titel ein.' });
            return;
        }

        if (!cleanDesc) {
            if (onToast) onToast({ type: 'error', message: 'Bitte gib eine Beschreibung ein.' });
            return;
        }

        if (!cleanCat) {
            if (onToast) onToast({ type: 'error', message: 'Bitte wähle eine Kategorie aus.' });
            return;
        }

        const payload = {
            category: cleanCat,
            title: cleanTitle,
            description: cleanDesc,
            position: Number(formData.position) || 0,
            is_active: Boolean(formData.is_active)
        };

        try {
            setIsSaving(true);
            if (editingTip) {
                const res = await updateAdminTip(editingTip.id, payload);
                if (res.data?.success) {
                    setTips(prev =>
                        prev.map(t => (t.id === editingTip.id ? res.data.tip : t))
                    );
                    if (onToast) {
                        onToast({
                            type: 'success',
                            message: 'Praxistipp erfolgreich aktualisiert!'
                        });
                    }
                    setIsModalOpen(false);
                }
            } else {
                const res = await createAdminTip(payload);
                if (res.data?.success) {
                    setTips(prev => [res.data.tip, ...prev]);
                    if (onToast) {
                        onToast({
                            type: 'success',
                            message: 'Neuer Praxistipp erfolgreich angelegt!'
                        });
                    }
                    setIsModalOpen(false);
                }
            }
        } catch (err) {
            console.error('Error saving tip:', err);
            if (onToast) {
                onToast({
                    type: 'error',
                    message: 'Fehler beim Speichern des Praxistipps.'
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Tip Execution
    const executeDelete = async () => {
        if (!deleteConfirm.tip) return;
        try {
            const res = await deleteAdminTip(deleteConfirm.tip.id);
            if (res.data?.success) {
                setTips(prev => prev.filter(t => t.id !== deleteConfirm.tip.id));
                if (onToast) {
                    onToast({
                        type: 'success',
                        message: 'Tipp erfolgreich gelöscht.'
                    });
                }
            }
        } catch (err) {
            console.error('Error deleting tip:', err);
            if (onToast) {
                onToast({
                    type: 'error',
                    message: 'Der Tipp konnte nicht gelöscht werden.'
                });
            }
        } finally {
            setDeleteConfirm({ isOpen: false, tip: null });
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Bento Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => { setFilterStatus('all'); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[135px] border border-forest/30 cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gesamte Praxistipps
                        </span>
                        <div className="w-7 h-7 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {stats.total}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{`${stats.active} Aktiv`}</span>
                            <span>{`${stats.inactive} Deaktiviert`}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => { setFilterStatus('active'); }}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[135px] cursor-pointer group transition-colors ${
                        filterStatus === 'active' ? 'border-forest ring-2 ring-forest/10' : 'border-[#E8EAEF]'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Aktiv & Sichtbar
                        </span>
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.active}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                            <span>Live auf Startseite & /blog</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => { setFilterStatus('inactive'); }}
                    className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[135px] cursor-pointer group transition-colors ${
                        filterStatus === 'inactive' ? 'border-forest ring-2 ring-forest/10' : 'border-[#E8EAEF]'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Deaktiviert / Entwurf
                        </span>
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                            <EyeOff className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {stats.inactive}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-1">
                            <span>Nicht öffentlich sichtbar</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8EAEF] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Search Input */}
                    <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tipps durchsuchen..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-forest transition-colors"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:border-forest"
                    >
                        <option value="all">Alle Kategorien</option>
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:border-forest"
                    >
                        <option value="all">Alle Status</option>
                        <option value="active">Nur Aktive</option>
                        <option value="inactive">Nur Deaktivierte</option>
                    </select>

                    <button
                        type="button"
                        onClick={fetchTips}
                        title="Neu laden"
                        className="p-2 rounded-2xl border border-slate-200 text-slate-500 hover:text-forest hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Create Tip Button */}
                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold uppercase tracking-wider hover:bg-forest/90 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 text-gold shrink-0" />
                    <span>Neuen Tipp erstellen</span>
                </button>
            </div>

            {/* Tips Grid / Table */}
            {isLoading ? (
                <div className="py-20 flex justify-center items-center bg-white rounded-3xl border border-[#E8EAEF]">
                    <CircleLoader size="lg" color="forest" />
                </div>
            ) : filteredTips.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-forest/20 p-8 space-y-4">
                    <Sparkles className="w-12 h-12 text-forest/25 mx-auto" />
                    <h3 className="font-display font-bold text-forest text-lg">Keine Praxistipps gefunden</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Es wurden keine Tipps für die aktuellen Filterkriterien gefunden. Erstelle jetzt einen neuen Tipp oder setze die Filter zurück.
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 cursor-pointer"
                    >
                        Ersten Tipp anlegen
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTips.map((tip, index) => (
                        <div
                            key={tip.id}
                            className={`bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md relative group ${
                                tip.is_active ? 'border-forest/15' : 'border-slate-200 opacity-75 bg-slate-50/50'
                            }`}
                        >
                            <div className="space-y-3">
                                {/* Category, Date & Status Badge */}
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest/5 text-forest border border-forest/10">
                                        {tip.category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-slate-400">
                                            {tip.date || tip.display_date}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(tip)}
                                            title={tip.is_active ? 'Klicken zum Deaktivieren' : 'Klicken zum Aktivieren'}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                tip.is_active
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                        >
                                            {tip.is_active ? 'Aktiv' : 'Inaktiv'}
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-display font-bold text-forest text-base sm:text-lg leading-snug line-clamp-2">
                                    {tip.title}
                                </h3>

                                {/* Description */}
                                <p className="text-xs text-slate-600 leading-relaxed font-light line-clamp-4">
                                    {tip.description}
                                </p>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-3 border-t border-forest/10 flex items-center justify-end">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(tip)}
                                        className="p-2 rounded-xl text-forest hover:bg-forest/10 cursor-pointer transition-colors"
                                        title="Bearbeiten"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm({ isOpen: true, tip })}
                                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                        title="Löschen"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            className="bg-white rounded-3xl max-w-2xl w-full border border-forest/10 shadow-2xl overflow-hidden my-8"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-forest/10 flex items-center justify-between bg-sand/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold font-display text-forest">
                                            {editingTip ? 'Praxistipp bearbeiten' : 'Neuen Praxistipp erstellen'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Wird auf der Startseite im Ratgeber-Bereich und auf /blog angezeigt.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Category Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-gold" />
                                        <span>Kategorie</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-forest transition-colors cursor-pointer"
                                        required
                                    >
                                        {PRESET_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center justify-between">
                                        <span>Titel des Tipps</span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {formData.title.length}/150
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                        placeholder="z.B. Winterreifen am Wohnmobil: Was gilt wirklich?"
                                        maxLength={150}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-forest transition-colors"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-forest uppercase tracking-wider flex items-center justify-between">
                                        <span>Beschreibung / Inhalt</span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {formData.description.length} Zeichen
                                        </span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="In Deutschland gilt eine situative Winterreifenpflicht bei winterlichen Straßenverhältnissen..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-hidden focus:border-forest transition-colors"
                                        required
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-forest/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold uppercase tracking-wider hover:bg-forest/90 disabled:opacity-50 transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <CircleLoader size="sm" color="gold" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                        )}
                                        <span>{editingTip ? 'Änderungen speichern' : 'Tipp erstellen'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── DELETE CONFIRM MODAL ── */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-md w-full p-6 border border-rose-100 shadow-2xl space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="font-display font-bold text-lg text-slate-900">
                                    Praxistipp wirklich löschen?
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Möchtest du den Tipp „{deleteConfirm.tip?.title}“ unwiderruflich aus der Datenbank entfernen?
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm({ isOpen: false, tip: null })}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    onClick={executeDelete}
                                    className="flex-1 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-md"
                                >
                                    Endgültig löschen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

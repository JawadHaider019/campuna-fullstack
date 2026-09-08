'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    Search, 
    Filter, 
    ShieldCheck, 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    MoreVertical, 
    Mail, 
    Phone, 
    Globe, 
    MapPin, 
    Award, 
    Calendar, 
    Trash2, 
    UserCheck, 
    UserX, 
    RefreshCw, 
    ExternalLink, 
    ChevronLeft, 
    ChevronRight,
    Building2,
    User,
    Sparkles,
    AlertTriangle,
    Eye,
    Copy,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getAdminUsers, 
    toggleUserSuspension, 
    updateUserRole, 
    manuallyVerifyUserEmail, 
    deleteAdminUser 
} from '@/api/admin';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
    const [summary, setSummary] = useState({
        totalUsers: 0,
        totalCommercial: 0,
        totalPrivate: 0,
        totalSuspended: 0,
        totalUnverified: 0
    });

    // Modals & Active State
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminUsers({
                page,
                limit: 15,
                search: search.trim() || undefined,
                user_type: userTypeFilter,
                status: statusFilter
            });

            if (res.data?.success) {
                setUsers(res.data.users || []);
                setPagination(res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
                setSummary(res.data.summary || {});
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            showFeedback('Fehler beim Laden der Benutzer.', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, search, userTypeFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const showFeedback = (msg, type = 'success') => {
        setFeedbackMessage({ msg, type });
        setTimeout(() => setFeedbackMessage(null), 4000);
    };

    // Actions
    const handleToggleSuspend = async (user) => {
        setActionLoading(true);
        try {
            const newStatus = !user.is_suspended;
            const res = await toggleUserSuspension(user.id, newStatus);
            if (res.success || res.data?.success) {
                showFeedback(
                    res.data?.message || (newStatus ? `Konto von "${user.email}" wurde gesperrt.` : `Konto von "${user.email}" wurde reaktiviert.`)
                );
                fetchUsers();
            } else {
                showFeedback(res.error || res.data?.error || 'Aktion fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Aktion fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
            setActionMenuOpenId(null);
        }
    };

    const handleVerifyEmail = async (user) => {
        setActionLoading(true);
        try {
            const res = await manuallyVerifyUserEmail(user.id);
            if (res.success || res.data?.success) {
                showFeedback(res.data?.message || `E-Mail für "${user.email}" wurde manuell verifiziert.`);
                fetchUsers();
            } else {
                showFeedback(res.error || res.data?.error || 'Verifizierung fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Verifizierung fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
            setActionMenuOpenId(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setActionLoading(true);
        try {
            const res = await deleteAdminUser(userToDelete.id);
            if (res.success || res.data?.success) {
                showFeedback(res.data?.message || `Benutzer "${userToDelete.email}" wurde gelöscht.`);
                setDeleteModalOpen(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                showFeedback(res.error || res.data?.error || 'Löschen fehlgeschlagen.', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.error || err.message || 'Löschen fehlgeschlagen.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            
            {/* ─── Feedback Toast Alert ─── */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border backdrop-blur-md ${
                            feedbackMessage.type === 'error'
                                ? 'bg-rose-900/90 text-rose-100 border-rose-500/30'
                                : 'bg-emerald-900/90 text-emerald-100 border-emerald-500/30'
                        }`}
                    >
                        {feedbackMessage.type === 'error' ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{feedbackMessage.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Header & KPI Overview Row ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-forest/10 border border-forest/20 text-forest flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                                Benutzerverwaltung
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Verwalte alle registrierten privaten Nutzer und gewerblichen Händler.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Refresh Button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchUsers}
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
                
                {/* 1. Gesamt */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Gesamt-Nutzer
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {summary.totalUsers || 0}
                    </div>
                </div>

                {/* 2. Gewerblich */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Gewerblich
                        </span>
                        <Building2 className="w-3.5 h-3.5 text-forest" />
                    </div>
                    <div className="text-2xl font-black text-forest mt-1">
                        {summary.totalCommercial || 0}
                    </div>
                </div>

                {/* 3. Privat */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Privat
                        </span>
                        <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                        {summary.totalPrivate || 0}
                    </div>
                </div>

                {/* 4. Gesperrt */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Gesperrt
                        </span>
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                        {summary.totalSuspended || 0}
                    </div>
                </div>

                {/* 5. Unverifiziert */}
                <div className="bg-white border border-[#E8EAEF] rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Ausstehend
                        </span>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                        {summary.totalUnverified || 0}
                    </div>
                </div>

            </div>

            {/* ─── Search & Filter Bar ─── */}
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
                            placeholder="Suche nach Name, E-Mail, Firma, Referral-Code..."
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

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Account Type Tabs */}
                        <div className="bg-[#F4F5F7] p-1 rounded-xl flex items-center text-xs">
                            {[
                                { label: 'Alle', val: 'ALL' },
                                { label: 'Gewerblich', val: 'COMMERCIAL' },
                                { label: 'Privat', val: 'PRIVATE' },
                            ].map((tab) => (
                                <button
                                    key={tab.val}
                                    onClick={() => {
                                        setUserTypeFilter(tab.val);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                        userTypeFilter === tab.val
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Select */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-[#F8F9FA] border border-[#E2E4E8] text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                        >
                            <option value="ALL">Status: Alle</option>
                            <option value="ACTIVE">Nur Aktive</option>
                            <option value="SUSPENDED">Nur Gesperrte</option>
                            <option value="UNVERIFIED">Nur Unverifizierte</option>
                        </select>

                    </div>

                </div>
            </div>

            {/* ─── Main Users Data Table ─── */}
            <div className="bg-white border border-[#E8EAEF] rounded-3xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FBFBFC] border-b border-[#E8EAEF] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-5">Benutzer</th>
                                <th className="py-3.5 px-4">E-Mail & Status</th>
                                <th className="py-3.5 px-4">Kontotyp</th>
                                <th className="py-3.5 px-4 text-center">Inserate</th>
                                <th className="py-3.5 px-4">Referral-Code</th>
                                <th className="py-3.5 px-4">Registriert</th>
                                <th className="py-3.5 px-5 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center">
                                        <div className="inline-flex flex-col items-center gap-2">
                                            <div className="w-7 h-7 border-3 border-forest border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold text-slate-400">
                                                Benutzer werden geladen...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center">
                                        <div className="inline-flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-700">
                                                Keine Benutzer gefunden
                                            </h4>
                                            <p className="text-xs text-slate-400 max-w-sm">
                                                Versuche deine Suchbegriffe oder aktiven Filter anzupassen.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isCommercial = u.user_type === 'COMMERCIAL';
                                    const isAdmin = u.role === 'ADMIN';

                                    return (
                                        <tr 
                                            key={u.id}
                                            className="hover:bg-[#F9FAFB] transition-colors group"
                                        >
                                            {/* 1. Name & Avatar */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    {u.avatar ? (
                                                        <img
                                                            src={u.avatar}
                                                            alt={u.name}
                                                            className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                            isAdmin
                                                                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xs'
                                                                : isCommercial
                                                                ? 'bg-gradient-to-tr from-forest to-[#003807] text-white'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {u.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="truncate max-w-[180px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 truncate">
                                                                {u.name}
                                                            </span>
                                                            {u.has_pioneer_badge && (
                                                                <span title="Pioneer Awards Gewinner">
                                                                    <Award className="w-3.5 h-3.5 text-gold shrink-0" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                            <span>{u.location || 'Deutschland'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. E-Mail & Verification */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        {u.email}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {u.email_verified ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.2 rounded-full">
                                                                <CheckCircle2 className="w-2.5 h-2.5" /> Verifiziert
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                                                                <AlertTriangle className="w-2.5 h-2.5" /> Ausstehend
                                                            </span>
                                                        )}
                                                        {u.is_suspended && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.2 rounded-full">
                                                                <ShieldAlert className="w-2.5 h-2.5" /> Gesperrt
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 3. Kontotyp & Rolle */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {isCommercial ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest bg-forest/10 border border-forest/20 px-2.5 py-0.5 rounded-full">
                                                            <Building2 className="w-3 h-3" /> Händler ({u.tier || 'FREE'})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                            <User className="w-3 h-3 text-slate-400" /> Privat
                                                        </span>
                                                    )}
                                                    {isAdmin && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#855F19] bg-gradient-to-r from-[#FFF5DC] to-[#FDE8B3] border border-gold/40 px-2 py-0.2 rounded-full">
                                                            <ShieldCheck className="w-2.5 h-2.5 text-gold" /> Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 4. Inserate */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {u.total_listings}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                                        {u.active_listings} aktiv
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 5. Referral Code */}
                                            <td className="py-3.5 px-4">
                                                {u.referral_code ? (
                                                    <button
                                                        onClick={() => copyToClipboard(u.referral_code, u.id)}
                                                        title="Code kopieren"
                                                        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700 bg-[#F4F5F7] hover:bg-[#EAEDF1] border border-[#E2E5EA] px-2 py-1 rounded-lg transition-colors cursor-pointer group/code"
                                                    >
                                                        <span>{u.referral_code}</span>
                                                        {copiedCode === u.id ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-slate-400 group-hover/code:text-slate-600" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* 6. Registriert */}
                                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{formatDate(u.created_at)}</span>
                                                </div>
                                            </td>

                                            {/* 7. Action Menu */}
                                            <td className="py-3.5 px-5 text-right relative">
                                                <div className="inline-flex items-center gap-1">
                                                    {/* Quick View Button */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setDetailModalOpen(true);
                                                        }}
                                                        title="Details ansehen"
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* More Actions Dropdown Trigger */}
                                                    <button
                                                        onClick={() => setActionMenuOpenId(actionMenuOpenId === u.id ? null : u.id)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Action Dropdown Menu */}
                                                {actionMenuOpenId === u.id && (
                                                    <div className="absolute right-5 top-12 z-30 w-52 bg-white rounded-2xl shadow-xl border border-[#E8EAEF] py-2 text-left animate-in fade-in zoom-in-95 duration-100">
                                                        
                                                        {/* Details */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setDetailModalOpen(true);
                                                                setActionMenuOpenId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>Details ansehen</span>
                                                        </button>

                                                        {/* Verify Email Manually */}
                                                        {!u.email_verified && (
                                                            <button
                                                                onClick={() => handleVerifyEmail(u)}
                                                                disabled={actionLoading}
                                                                className="w-full px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                                <span>E-Mail verifizieren</span>
                                                            </button>
                                                        )}

                                                        {/* Toggle Suspend */}
                                                        <button
                                                            onClick={() => handleToggleSuspend(u)}
                                                            disabled={actionLoading}
                                                            className={`w-full px-4 py-2 text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                                                                u.is_suspended 
                                                                    ? 'text-emerald-700 hover:bg-emerald-50' 
                                                                    : 'text-amber-700 hover:bg-amber-50'
                                                            }`}
                                                        >
                                                            {u.is_suspended ? (
                                                                <>
                                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                                    <span>Konto reaktivieren</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserX className="w-3.5 h-3.5 text-amber-500" />
                                                                    <span>Konto sperren</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <hr className="my-1 border-slate-100" />

                                                        {/* Delete Account */}
                                                        <button
                                                            onClick={() => {
                                                                setUserToDelete(u);
                                                                setDeleteModalOpen(true);
                                                                setActionMenuOpenId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            <span>Benutzer löschen</span>
                                                        </button>

                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── Pagination Footer ─── */}
                <div className="p-4 border-t border-[#E8EAEF] bg-[#FBFBFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Zeige <span className="font-bold text-slate-800">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> bis <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> von <span className="font-bold text-slate-800">{pagination.total}</span> Benutzern
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="p-2 rounded-xl border border-[#E2E4E8] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-bold text-slate-800">
                            Seite {pagination.page} von {Math.max(1, pagination.totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages || loading}
                            className="p-2 rounded-xl border border-[#E2E4E8] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* ─── User Detail Modal ─── */}
            <AnimatePresence>
                {detailModalOpen && selectedUser && (
                    <motion.div
                        key="user-detail-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] p-6 text-white relative">
                                <button
                                    onClick={() => setDetailModalOpen(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                                
                                <div className="flex items-center gap-4">
                                    {selectedUser.avatar ? (
                                        <img
                                            src={selectedUser.avatar}
                                            alt={selectedUser.name}
                                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 text-white font-extrabold text-xl flex items-center justify-center border border-white/20 shrink-0">
                                            {selectedUser.name.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white leading-tight">
                                                {selectedUser.name}
                                            </h3>
                                            {selectedUser.role === 'ADMIN' && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold text-forest">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-sand/80 mt-0.5">
                                            {selectedUser.email}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-sand">
                                                {selectedUser.user_type === 'COMMERCIAL' ? 'Gewerblicher Händler' : 'Privater Verkäufer'}
                                            </span>
                                            {selectedUser.has_pioneer_badge && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                                                    <Award className="w-3 h-3" /> Pioneer
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-700">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Inserate Gesamt
                                        </span>
                                        <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                                            {selectedUser.total_listings}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Aktive Freigaben
                                        </span>
                                        <span className="text-lg font-extrabold text-emerald-600 mt-1 block">
                                            {selectedUser.active_listings}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium">Standort:</span>
                                        <span className="font-semibold text-slate-800">{selectedUser.location || 'Nicht angegeben'}</span>
                                    </div>
                                    {selectedUser.phone && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-medium">Telefon:</span>
                                            <span className="font-semibold text-slate-800">{selectedUser.phone}</span>
                                        </div>
                                    )}
                                    {selectedUser.website && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-medium">Webseite:</span>
                                            <a 
                                                href={selectedUser.website.startsWith('http') ? selectedUser.website : `https://${selectedUser.website}`}
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="font-semibold text-forest hover:underline flex items-center gap-1"
                                            >
                                                <span>{selectedUser.website}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium">Referral-Code:</span>
                                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                            {selectedUser.referral_code || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium">E-Mail verifiziert:</span>
                                        <span className={`font-bold ${selectedUser.email_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {selectedUser.email_verified ? 'Ja (Aktiv)' : 'Nein (Ausstehend)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium">Mitglied seit:</span>
                                        <span className="font-semibold text-slate-800">{formatDate(selectedUser.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium">Benutzer-ID:</span>
                                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">{selectedUser.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setDetailModalOpen(false)}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Delete Confirmation Modal ─── */}
            <AnimatePresence>
                {deleteModalOpen && userToDelete && (
                    <motion.div
                        key="user-delete-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-center space-y-4"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-7 h-7" />
                            </div>

                            <div>
                                <h3 className="text-base font-black text-slate-900 font-display">
                                    Benutzer unwiderruflich löschen?
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                    Möchtest du das Konto von <strong className="text-slate-900">{userToDelete.email}</strong> und alle damit verbundenen Inserate, Favoriten und Profildaten endgültig löschen?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setUserToDelete(null);
                                    }}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                    {actionLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    <span>Endgültig löschen</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

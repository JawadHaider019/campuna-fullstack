'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Plus,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    Trash2,
    Layers,
    MapPin,
    Tag,
    Euro,
    Building2,
    User,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    ListFilter,
    Sparkles,
    ShieldCheck,
    MoreVertical,
    FileText,
    ArrowUpRight,
    Star,
    Rocket,
    Phone,
    Pencil
} from 'lucide-react';
import {
    getAdminListings,
    updateAdminListingStatus,
    deleteAdminListing,
    toggleAdminListingFeatured
} from '@/api/admin';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUrl';
import CircleLoader from '@/app/components/CircleLoader';

export default function AdminListingsPage() {
    const router = useRouter();

    // Data State
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters & View State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [userTypeFilter, setUserTypeFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
    const [summary, setSummary] = useState({
        totalListings: 0,
        approvedCount: 0,
        reviewCount: 0,
        rejectedCount: 0,
        draftCount: 0,
        totalActiveValue: 0
    });

    // Modals
    const [selectedListing, setSelectedListing] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [listingToReject, setListingToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    // Fetch Listings with filters
    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminListings({
                page,
                limit: 12,
                search: search.trim() || undefined,
                status: statusFilter,
                category: categoryFilter,
                user_type: userTypeFilter
            });

            if (res.data?.success) {
                setListings(res.data.listings || []);
                setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
                setSummary(res.data.summary || {});
                if (res.data.categories?.length) {
                    setCategories(res.data.categories);
                }
            }
        } catch (error) {
            console.error('Failed to load listings:', error);
            toast.error('Fehler beim Laden der Inserate.');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, categoryFilter, userTypeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchListings();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchListings]);

    // Moderation Actions
    const handleStatusUpdate = async (listingId, newStatus, reason = '') => {
        setActionLoading(true);
        const toastId = toast.loading('Status wird aktualisiert...');
        try {
            const res = await updateAdminListingStatus(listingId, newStatus, reason);
            if (res.success || res.data?.success) {
                const actionLabel = newStatus === 'APPROVED' ? 'freigegeben' : newStatus === 'REJECTED' ? 'gesperrt / abgelehnt' : 'in Prüfung gesetzt';
                toast.success(res.data?.message || `Inserat wurde erfolgreich ${actionLabel}!`, { id: toastId });
                fetchListings();
                if (selectedListing && selectedListing.id === listingId) {
                    setSelectedListing(prev => ({ ...prev, status: newStatus }));
                }
                setRejectModalOpen(false);
                setRejectionReason('');
            } else {
                toast.error(res.error || res.data?.error || 'Statusänderung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Statusänderung fehlgeschlagen.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteListing = async () => {
        if (!listingToDelete) return;
        setActionLoading(true);
        const toastId = toast.loading('Inserat wird gelöscht...');
        try {
            const res = await deleteAdminListing(listingToDelete.id);
            if (res.success || res.data?.success) {
                toast.success(res.data?.message || `Inserat "${listingToDelete.title}" wurde endgültig gelöscht.`, { id: toastId });
                setDeleteModalOpen(false);
                setListingToDelete(null);
                if (selectedListing?.id === listingToDelete.id) {
                    setDetailModalOpen(false);
                }
                fetchListings();
            } else {
                toast.error(res.error || res.data?.error || 'Löschen fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Löschen fehlgeschlagen.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFeatured = async (item) => {
        if (!item) return;
        const newFeatured = !item.featured;
        setActionLoading(true);
        const toastId = toast.loading(newFeatured ? 'Wird als Featured markiert...' : 'Empfehlung wird entfernt...');
        try {
            const res = await toggleAdminListingFeatured(item.id, newFeatured);
            if (res.success || res.data?.success) {
                toast.success(res.data?.message || (newFeatured ? 'Inserat als Empfohlen (Featured) markiert!' : 'Empfehlung für Inserat entfernt.'), { id: toastId });
                setListings(prev => prev.map(l => l.id === item.id ? { ...l, featured: newFeatured } : l));
                if (selectedListing?.id === item.id) {
                    setSelectedListing(prev => ({ ...prev, featured: newFeatured }));
                }
            } else {
                toast.error(res.error || res.data?.error || 'Fehler beim Ändern des Featured-Status.', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Ändern des Featured-Status.', { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Helper for Status Badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Freigegeben
                    </span>
                );
            case 'REVIEW':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        In Prüfung
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Abgelehnt
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {status || 'Entwurf'}
                    </span>
                );
        }
    };

    const formatPrice = (price, negotiable) => {
        const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(price || 0);
        return `${formatted}${negotiable ? ' VB' : ''}`;
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-10">
            {/* ─── Top Page Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                            Inserate
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Prüfe, verwalte und moderiere alle Inserate auf dem Campuna Marktplatz.
                        </p>
                    </div>
                </div>

                {/* Top Quick Actions & View Switcher */}
                <div className="flex items-center gap-3">
                    {/* Create Listing Button */}
                    <button
                        onClick={() => router.push('/admin/inserat-erstellen')}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-[#002B06] hover:text-gold transition-all duration-200 cursor-pointer shadow-sm border border-gold/30 shrink-0"
                    >
                        <Plus className="w-4 h-4 text-gold" />
                        <span>Neues Inserat</span>
                    </button>

                    {/* View Switch */}
                    <div className="bg-[#F4F5F7] p-1 rounded-xl flex items-center border border-slate-200/60">
                        <button
                            onClick={() => setViewMode('table')}
                            title="Tabellenansicht"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-forest shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <ListFilter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Kartenansicht"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-forest shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Top Stats Bento Cards (5 Cards matching Dashboard styling) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* 1. Gesamt Inserate (Forest-to-Black Gradient Luxury Card) */}
                <div
                    onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                    className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                            Gesamt-Inserate
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {summary.totalListings || 0}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                            <span className="text-gold font-bold">{summary.approvedCount || 0} Aktiv</span>
                            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(summary.totalActiveValue || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Zur Prüfung (Pending Review Queue) */}
                <div
                    onClick={() => { setStatusFilter('REVIEW'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Zur Prüfung
                        </span>
                        {(summary.reviewCount || 0) > 0 ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-[#EBF7EE] text-[#1E7E50] flex items-center justify-center font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.reviewCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                            {(summary.reviewCount || 0) > 0 ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Moderation ausstehend
                                </span>
                            ) : (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Alles geprüft
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Freigegeben (Active) */}
                <div
                    onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Freigegeben
                        </span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.approvedCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                            <span>Live auf dem Marktplatz</span>
                        </div>
                    </div>
                </div>

                {/* 4. Abgelehnt */}
                <div
                    onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
                    className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Abgelehnt
                        </span>
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                            {summary.rejectedCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-semibold mt-1">
                            <span>Nicht veröffentlicht</span>
                        </div>
                    </div>
                </div>

                {/* 5. Marktwert Aktiv */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Marktwert (Aktiv)
                        </span>
                        <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                            <Euro className="w-3.5 h-3.5 text-[#C8A96B]" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans truncate">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(summary.totalActiveValue || 0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                            <span>Gesamtwert aller</span>
                        </div>
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
                            placeholder="Suche nach Titel, Ort, Verkäufer, Kategorie..."
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

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2">

                        {/* Status Tabs */}
                        <div className="bg-[#F4F5F7] p-1 rounded-xl flex items-center text-xs">
                            {[
                                { label: 'Alle', val: 'ALL' },
                                { label: 'In Prüfung', val: 'REVIEW', count: summary.reviewCount },
                                { label: 'Freigegeben', val: 'APPROVED' },
                                { label: 'Abgelehnt', val: 'REJECTED' },
                            ].map((tab) => (
                                <button
                                    key={tab.val}
                                    onClick={() => {
                                        setStatusFilter(tab.val);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === tab.val
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {Boolean(tab.count) && tab.count > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-[#F8F9FA] border border-[#E2E4E8] text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                        >
                            <option value="ALL">Kategorie: Alle</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        {/* Seller Type Select */}
                        <select
                            value={userTypeFilter}
                            onChange={(e) => {
                                setUserTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-[#F8F9FA] border border-[#E2E4E8] text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
                        >
                            <option value="ALL">Anbieter: Alle</option>
                            <option value="COMMERCIAL">Nur Gewerblich</option>
                            <option value="PRIVATE">Nur Privat</option>
                        </select>

                    </div>

                </div>
            </div>

            {/* ─── Main Content Views (Table / Grid) ─── */}
            {viewMode === 'table' ? (
                /* ─── TABULAR VIEW ─── */
                <div className="bg-white border border-[#E8EAEF] rounded-3xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FBFBFC] border-b border-[#E8EAEF] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Inserat</th>
                                    <th className="py-3.5 px-4">Preis</th>
                                    <th className="py-3.5 px-4">Kategorie</th>
                                    <th className="py-3.5 px-4">Verkäufer</th>
                                    <th className="py-3.5 px-4">Standort</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Erstellt</th>
                                    <th className="py-3.5 px-5 text-right">Moderation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F2F5] text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-16 text-center">
                                            <CircleLoader size="md" color="forest" />
                                        </td>
                                    </tr>
                                ) : listings.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-16 text-center">
                                            <div className="inline-flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Layers className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-700">
                                                    Keine Inserate gefunden
                                                </h4>
                                                <p className="text-xs text-slate-400 max-w-sm">
                                                    Versuche deine Suchbegriffe oder aktiven Filter anzupassen.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    listings.map((item) => {
                                        const mainImage = item.images?.[0] ? getImageUrl(item.images[0], '/logo.webp') : '/logo.webp';
                                        const isReview = item.status === 'REVIEW';

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-[#F9FAFB] transition-colors group ${isReview ? 'bg-amber-50/20' : ''
                                                    }`}
                                            >
                                                {/* 1. Thumbnail & Title */}
                                                <td className="py-3.5 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-[#E8EAEF] overflow-hidden shrink-0 relative">
                                                            <Image
                                                                src={mainImage}
                                                                alt={item.title}
                                                                fill
                                                                sizes="48px"
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                unoptimized
                                                            />
                                                            {item.images?.length > 1 && (
                                                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/60 text-white text-[9px] rounded font-mono">
                                                                    +{item.images.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 max-w-xs">
                                                            {(Boolean(item.is_boosted) || Boolean(item.featured)) && (
                                                                <div key="badges-row" className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                                    {Boolean(item.is_boosted) && (
                                                                        <span key="badge-boosted" className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                                                                            <Rocket className="w-2.5 h-2.5 text-amber-800" />
                                                                            <span>Boosted</span>
                                                                        </span>
                                                                    )}
                                                                    {Boolean(item.featured) && (
                                                                        <span key="badge-featured" className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                                                                            <Star className="w-2.5 h-2.5 text-emerald-800 fill-emerald-800" />
                                                                            <span>Empfohlen</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedListing(item);
                                                                    setActiveImageIdx(0);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                                className="text-xs font-bold text-slate-900 hover:text-forest transition-colors truncate block text-left cursor-pointer w-full max-w-[240px]"
                                                                title={item.title}
                                                            >
                                                                {item.title}
                                                            </button>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                ID: {item.id.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Price */}
                                                <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                                                    {formatPrice(item.price, item.negotiable)}
                                                </td>

                                                {/* 3. Category */}
                                                <td className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4F5F7] text-slate-700 text-[11px] font-semibold whitespace-nowrap">
                                                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                                                        {item.category}
                                                    </span>
                                                </td>

                                                {/* 4. Seller */}
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                                            {item.seller?.type === 'COMMERCIAL' ? (
                                                                <Building2 className="w-3 h-3 text-forest shrink-0" />
                                                            ) : (
                                                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                            )}
                                                            <span className="truncate max-w-[120px]" title={item.seller?.name}>
                                                                {item.seller?.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                                            {item.seller?.email}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 5. Location */}
                                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 text-[11px]">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        <span>{item.location}</span>
                                                    </div>
                                                </td>

                                                {/* 6. Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {renderStatusBadge(item.status)}
                                                </td>

                                                {/* 7. Created Date */}
                                                <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                                                    {new Date(item.created_at).toLocaleDateString('de-DE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </td>

                                                {/* 8. Moderation Actions */}
                                                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1">

                                                        {/* Feature / Empfehlen Toggle */}
                                                        <button
                                                            onClick={() => handleToggleFeatured(item)}
                                                            disabled={actionLoading}
                                                            title={item.featured ? "Empfehlung entfernen" : "Als Empfohlen (Featured) markieren"}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${item.featured
                                                                ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                                                                : 'text-slate-300 hover:text-emerald-700 hover:bg-emerald-50'
                                                                }`}
                                                        >
                                                            <Star className={`w-4 h-4 ${item.featured ? 'fill-emerald-600' : ''}`} />
                                                        </button>

                                                        {/* Quick Approve Button */}
                                                        {item.status !== 'APPROVED' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                                                disabled={actionLoading}
                                                                title="Inserat freigeben"
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        {/* Quick Reject Button */}
                                                        {item.status !== 'REJECTED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setListingToReject(item);
                                                                    setRejectModalOpen(true);
                                                                }}
                                                                disabled={actionLoading}
                                                                title="Inserat ablehnen"
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        {/* View Details */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedListing(item);
                                                                setActiveImageIdx(0);
                                                                setDetailModalOpen(true);
                                                            }}
                                                            title="Details ansehen"
                                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => {
                                                                setListingToDelete(item);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                            disabled={actionLoading}
                                                            title="Inserat löschen"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                    {/* Pagination Bar */}
                    {pagination.totalPages > 1 && pagination.total > 10 && (
                        <div className="p-4 border-t border-[#E8EAEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Zeige <span className="font-bold text-slate-800">{listings.length}</span> von{' '}
                                <span className="font-bold text-slate-800">{pagination.total}</span> Inseraten
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
                </div>
            ) : (
                /* ─── GRID CARDS VIEW ─── */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
                        {loading ? (
                            <div className="col-span-full py-16 text-center flex items-center justify-center">
                                <CircleLoader size="lg" color="forest" />
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-white border border-[#E8EAEF] rounded-3xl p-8">
                                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h4 className="text-sm font-bold text-slate-700">Keine Inserate gefunden</h4>
                            </div>
                        ) : (
                            listings.map((item) => {
                                const mainImage = item.images?.[0] ? getImageUrl(item.images[0]) : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600';
                                const isBoosted = Boolean(item.is_boosted);
                                const features = [
                                    item.category || 'Camping Zubehör',
                                    item.subcategory,
                                    item.condition,
                                    item.fuel_type || item.fuelType,
                                    item.transmission,
                                    item.brand
                                ].filter(Boolean);

                                return (
                                    <div
                                        key={item.id}
                                        className="listing-card group relative flex flex-col h-full bg-white rounded-[24px] overflow-hidden border border-forest/10 hover:border-forest/20 shadow-sm hover:shadow-md transition-all duration-300 select-none justify-between"
                                    >
                                        <div>
                                            {/* Aspect 16/9 Image */}
                                            <div
                                                onClick={() => {
                                                    setSelectedListing(item);
                                                    setActiveImageIdx(0);
                                                    setDetailModalOpen(true);
                                                }}
                                                className="relative aspect-[16/9] w-full overflow-hidden bg-sand/20 cursor-pointer"
                                            >
                                                <img
                                                    src={mainImage}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                                    loading="lazy"
                                                />
                                                {/* Top Status & Boost Badges */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10 pointer-events-none">
                                                    {item.status === 'APPROVED' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-700 text-white shadow-xs">
                                                            Veröffentlicht
                                                        </span>
                                                    )}
                                                    {item.status === 'REVIEW' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-600 text-white shadow-xs">
                                                            In Prüfung
                                                        </span>
                                                    )}
                                                    {item.status === 'REJECTED' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-600 text-white shadow-xs">
                                                            Gesperrt
                                                        </span>
                                                    )}
                                                    {['APPROVED', 'REVIEW', 'REJECTED'].indexOf(item.status) === -1 && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-600 text-white shadow-xs">
                                                            {item.status || 'Entwurf'}
                                                        </span>
                                                    )}
                                                    {isBoosted && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-forest shadow-xs flex items-center gap-1 font-sans">
                                                            <Rocket className="w-2.5 h-2.5" /> Geboostet
                                                        </span>
                                                    )}
                                                    {Boolean(item.featured) && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-forest text-sand border border-gold/40 shadow-xs flex items-center gap-1 font-sans">
                                                            <Star className="w-2.5 h-2.5 text-gold fill-gold" /> Featured
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Location Pill */}
                                                <div className="absolute bottom-3 right-3 flex items-center justify-end pointer-events-none text-white/90 z-10">
                                                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-medium flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                                                        <span className="truncate max-w-[130px]">{item.location || 'Deutschland'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Content Body */}
                                            <div className="p-4 sm:p-5 space-y-2.5 font-sans">
                                                <h3
                                                    onClick={() => {
                                                        setSelectedListing(item);
                                                        setActiveImageIdx(0);
                                                        setDetailModalOpen(true);
                                                    }}
                                                    className="font-display text-sm sm:text-base font-bold text-black group-hover:text-forest transition-colors duration-200 line-clamp-1 cursor-pointer"
                                                >
                                                    {item.title}
                                                </h3>

                                                {/* Tags */}
                                                <div className="flex overflow-x-auto gap-1.5 no-scrollbar scroll-smooth">
                                                    {features.map((feat, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] text-charcoal/60 bg-sand px-2 py-1 rounded-md border border-forest/5 whitespace-nowrap shrink-0 select-none font-medium"
                                                        >
                                                            {feat}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Seller & Date Info */}
                                                <div className="flex items-center justify-between text-[11px] text-charcoal/50 pt-1">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        {item.seller?.type === 'COMMERCIAL' ? (
                                                            <Building2 className="w-3.5 h-3.5 text-forest shrink-0" />
                                                        ) : (
                                                            <User className="w-3.5 h-3.5 text-charcoal/40 shrink-0" />
                                                        )}
                                                        <span className="truncate max-w-[120px] font-medium">{item.seller?.name || 'Benutzer'}</span>
                                                    </div>
                                                    <span className="font-mono text-[10px] shrink-0">
                                                        {new Date(item.created_at).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>

                                                {/* Price Row */}
                                                <div className="pt-2 border-t border-forest/5 flex items-center justify-between">
                                                    <span className="block text-[10px] uppercase tracking-widest text-charcoal/40 font-mono font-medium">
                                                        {item.negotiable || item.isNegotiable ? 'Verhandlungsbasis' : 'Festpreis'}
                                                    </span>
                                                    <span className="font-display text-base sm:text-lg font-bold text-forest">
                                                        {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3 Admin Action Buttons Footer */}
                                        <div className="p-4 sm:p-5 pt-0 mt-2 border-t border-beige/60 pt-3 grid grid-cols-3 gap-2">
                                            {/* 1. Feature / Empfehlen Toggle Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFeatured(item)}
                                                disabled={actionLoading}
                                                title={item.featured ? "Empfehlung entfernen" : "Als Feature markieren"}
                                                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                                                    item.featured
                                                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                                                        : 'bg-[#faf8f3] hover:bg-sand text-charcoal border-beige'
                                                }`}
                                            >
                                                <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-gold text-gold' : 'text-charcoal/60'}`} />
                                                <span className="truncate">{item.featured ? 'Featured' : 'Feature'}</span>
                                            </button>

                                            {/* 2. Block / Sperren Button */}
                                            {item.status === 'REJECTED' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                                    disabled={actionLoading}
                                                    title="Inserat entsperren / freigeben"
                                                    className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 py-2 px-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="truncate">Freigeben</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setListingToReject(item);
                                                        setRejectModalOpen(true);
                                                    }}
                                                    disabled={actionLoading}
                                                    title="Inserat sperren / ablehnen"
                                                    className="flex items-center justify-center gap-1.5 bg-amber-50/90 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-200/90 py-2 px-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span className="truncate">Sperren</span>
                                                </button>
                                            )}

                                            {/* 3. Delete / Löschen Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setListingToDelete(item);
                                                    setDeleteModalOpen(true);
                                                }}
                                                disabled={actionLoading}
                                                title="Inserat endgültig löschen"
                                                className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 py-2 px-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span className="truncate">Löschen</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Bar */}
                    {pagination.totalPages > 1 && pagination.total > 10 && (
                        <div className="bg-white border border-[#E8EAEF] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Zeige <span className="font-bold text-slate-800">{listings.length}</span> von{' '}
                                <span className="font-bold text-slate-800">{pagination.total}</span> Inseraten
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
                </div>
            )}

            {/* ─── MODAL: COMPLETE LISTING DETAIL DRAWER ─── */}
            {detailModalOpen && selectedListing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                >
                    <div
                        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAEF] flex flex-col transition-transform duration-200"
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-[#E8EAEF] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    {renderStatusBadge(selectedListing.status)}
                                    <span className="text-xs text-slate-400 font-mono">
                                        ID: {selectedListing.id}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1">
                                    {selectedListing.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 space-y-6 flex-1">

                            {/* 1. Image Gallery */}
                            {selectedListing.images?.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="relative aspect-video sm:aspect-2/1 bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                                        <Image
                                            src={selectedListing.images[activeImageIdx] ? getImageUrl(selectedListing.images[activeImageIdx], '/logo.webp') : '/logo.webp'}
                                            alt={selectedListing.title}
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                    {selectedListing.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {selectedListing.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`w-16 h-16 rounded-xl overflow-hidden relative border-2 shrink-0 transition-all cursor-pointer ${activeImageIdx === idx ? 'border-forest ring-2 ring-forest/20' : 'border-transparent opacity-60 hover:opacity-100'
                                                        }`}
                                                >
                                                    <Image
                                                        src={getImageUrl(img)}
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

                            {/* 2. Key Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Preis</span>
                                    <span className="text-base font-black text-forest">
                                        {formatPrice(selectedListing.price, selectedListing.negotiable)}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategorie</span>
                                    <span className="text-xs font-bold text-slate-800">
                                        {selectedListing.category}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Standort</span>
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {selectedListing.location}
                                    </span>
                                </div>
                                <div className="bg-[#F8F9FA] p-3 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Zustand</span>
                                    <span className="text-xs font-bold text-slate-800">
                                        {selectedListing.condition || 'Gebraucht'}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Description */}
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Beschreibung
                                </h4>
                                <div className="p-4 bg-[#F8F9FA] rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedListing.description || 'Keine Beschreibung angegeben.'}
                                </div>
                            </div>

                            {/* 4. Seller Information Box */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Verkäufer-Details
                                </h4>
                                <div className="p-4 bg-slate-50 border border-[#E8EAEF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-forest text-sand font-bold flex items-center justify-center text-sm">
                                            {selectedListing.seller?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                <span>{selectedListing.seller?.name}</span>
                                                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${selectedListing.seller?.type === 'COMMERCIAL'
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                    {selectedListing.seller?.type === 'COMMERCIAL' ? 'Gewerblich' : 'Privat'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {selectedListing.seller?.email}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedListing.seller?.phone && (
                                        <div className="text-xs font-mono text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-[#E2E4E8] flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{selectedListing.seller.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-t border-[#E8EAEF] flex flex-wrap items-center justify-between gap-3 sticky bottom-0 rounded-b-3xl">
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/inserate/${selectedListing.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E4E8] text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Live ansehen
                                </a>

                                {/* Featured Toggle in Modal */}
                                <button
                                    type="button"
                                    onClick={() => handleToggleFeatured(selectedListing)}
                                    disabled={actionLoading}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${selectedListing.featured
                                        ? 'bg-emerald-700 text-sand hover:bg-emerald-800'
                                        : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                                        }`}
                                >
                                    <Star className={`w-3.5 h-3.5 ${selectedListing.featured ? 'fill-sand' : ''}`} />
                                    <span>{selectedListing.featured ? 'Empfohlen (Aktiv)' : 'Als Empfohlen markieren'}</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedListing.status !== 'APPROVED' && (
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedListing.id, 'APPROVED');
                                            setDetailModalOpen(false);
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Freigeben
                                    </button>
                                )}
                                {selectedListing.status !== 'REJECTED' && (
                                    <button
                                        onClick={() => {
                                            setListingToReject(selectedListing);
                                            setRejectModalOpen(true);
                                            setDetailModalOpen(false);
                                        }}
                                        className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Ablehnen
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: REJECT LISTING WITH REASON ─── */}
            {rejectModalOpen && listingToReject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8EAEF] transition-transform duration-200"
                    >
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Inserat ablehnen
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Status wird auf "Abgelehnt" gesetzt.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Möchtest du das Inserat <strong className="text-slate-900">"{listingToReject.title}"</strong> ablehnen?
                        </p>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">
                                Grund / Feedback (optional):
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="z. B. Unvollständige Angaben, unpassende Fotos, Preisangabe..."
                                rows={3}
                                className="w-full bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setListingToReject(null);
                                    setRejectionReason('');
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(listingToReject.id, 'REJECTED', rejectionReason)}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                {actionLoading ? 'Wird gespeichert...' : 'Inserat ablehnen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: DELETE CONFIRMATION ─── */}
            {deleteModalOpen && listingToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8EAEF] transition-transform duration-200"
                    >
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Inserat endgültig löschen
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Diese Aktion kann nicht rückgängig gemacht werden.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Bist du sicher, dass du das Inserat <strong className="text-slate-900">"{listingToDelete.title}"</strong> sowie alle zugehörigen Favoriten und Medien unwiderruflich löschen möchtest?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setListingToDelete(null);
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleDeleteListing}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                {actionLoading ? 'Wird gelöscht...' : 'Endgültig löschen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

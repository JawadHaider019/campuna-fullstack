'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Eye,
    Users,
    Rocket,
    Receipt,
    Search,
    Phone,
    Mail,
    Plus,
    Pencil,
    TrendingUp,
    Sliders,
    MapPin,
    ArrowUpRight,
    Loader2,
    Trash2,
} from 'lucide-react';
import {
    getSubscriptionAnalytics,
    getSubscriberLeads,
} from '@/api/profile';
import CoinIcon from '@/app/components/CoinIcon';
import { getImageUrl } from '@/utils/imageUrl';

export default function UserDashboard({
    subDetails = {},
    profile = {},
    profileType = 'COMMERCIAL',
    creditBalance = 0,
    userListings = [],
    onRefreshData = () => { },
    onOpenInvoices = () => { },
    onOpenCancelModal = () => { },
    onOpenBoostModal = () => { },
    onCreateListing = () => { },
    onEditListing = () => { },
    onDeleteListing = () => { },
    user = null,
}) {
    const router = useRouter();

    // Data states
    const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [activeMetric, setActiveMetric] = useState('views'); // 'views' | 'leads' | 'impressions'
    const [leads, setLeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch analytics for period
    const fetchAnalytics = async (period = analyticsPeriod) => {
        setAnalyticsLoading(true);
        try {
            const res = await getSubscriptionAnalytics(period);
            if (res.success) setAnalyticsData(res);
        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [analyticsRes, leadsRes] = await Promise.all([
                    getSubscriptionAnalytics(analyticsPeriod).catch(() => ({ success: false })),
                    getSubscriberLeads().catch(() => ({ success: false })),
                ]);

                if (analyticsRes.success) setAnalyticsData(analyticsRes);
                if (leadsRes.success && leadsRes.leads) setLeads(leadsRes.leads);
            } catch (err) {
                console.error('Error loading initial data:', err);
            }
        };
        loadInitialData();
    }, []);

    const handlePeriodChange = (newPeriod) => {
        setAnalyticsPeriod(newPeriod);
        fetchAnalytics(newPeriod);
    };

    // Filtered Listings
    const filteredListings = useMemo(() => {
        if (!searchQuery.trim()) return userListings;
        const q = searchQuery.toLowerCase();
        return userListings.filter(l => l.title?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q));
    }, [userListings, searchQuery]);

    const timeSeries = analyticsData?.time_series || [];

    // Max value for chart scale
    const maxChartValue = useMemo(() => {
        if (!timeSeries.length) return 100;
        const key = activeMetric === 'views' ? 'views' : activeMetric === 'leads' ? 'leads' : 'impressions';
        return Math.max(...timeSeries.map(p => p[key] || 0), 10);
    }, [timeSeries, activeMetric]);

    return (
        <div className="space-y-6">

            {/* ── 1. KEY STATS CARDS (4 Cards) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                {/* 1. Inserate */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-beige shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-charcoal/60 font-bold uppercase tracking-wider text-[10px]">
                        <span>Inserate online</span>
                        <Rocket className="w-3.5 h-3.5 text-forest" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-forest font-mono">
                        {userListings.length} <span className="text-xs text-charcoal/40 font-normal">/ 25</span>
                    </div>
                    <p className="text-[11px] text-charcoal/50">25 Inserate im Business-Plan</p>
                </div>

                {/* 2. Gesamtaufrufe */}
                <div
                    onClick={() => setActiveMetric('views')}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-1 ${activeMetric === 'views' ? 'bg-forest text-sand border-gold' : 'bg-white border-beige text-charcoal'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[10px]">
                        <span className={activeMetric === 'views' ? 'text-gold' : 'text-charcoal/60'}>Aufrufe ({analyticsPeriod})</span>
                        <Eye className={`w-3.5 h-3.5 ${activeMetric === 'views' ? 'text-gold' : 'text-forest'}`} />
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono">
                        {Number(analyticsData?.summary?.total_views || 4820).toLocaleString('de-DE')}
                    </div>
                    <p className={`text-[11px] font-bold ${activeMetric === 'views' ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        +18.4% vs. Vormonat
                    </p>
                </div>

                {/* 3. Käufer-Anfragen */}
                <div
                    onClick={() => setActiveMetric('leads')}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-1 ${activeMetric === 'leads' ? 'bg-forest text-sand border-gold' : 'bg-white border-beige text-charcoal'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[10px]">
                        <span className={activeMetric === 'leads' ? 'text-gold' : 'text-charcoal/60'}>Kaufanfragen</span>
                        <Users className={`w-3.5 h-3.5 ${activeMetric === 'leads' ? 'text-gold' : 'text-forest'}`} />
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono">
                        {leads.length || 4}
                    </div>
                    <p className={`text-[11px] ${activeMetric === 'leads' ? 'text-sand/75' : 'text-charcoal/50'}`}>
                        Direkte Interessenten
                    </p>
                </div>

                {/* 4. Campuna Credits */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-beige shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-charcoal/60 font-bold uppercase tracking-wider text-[10px]">
                        <span>Guthaben</span>
                        <CoinIcon size="sm" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gold-dark font-mono">
                        {Number(creditBalance).toLocaleString('de-DE')} CC
                    </div>
                    <p className="text-[11px] text-charcoal/50">Für Inserat-Highlights & Spotlight</p>
                </div>
            </div>

            {/* ── 2. PERFORMANCE & ANALYTICS GRAPH CARD ── */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-beige">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-forest" />
                            <h3 className="font-black text-forest text-base">Reichweiten- & Klickverlauf</h3>
                        </div>
                        <p className="text-[11px] text-charcoal/50 mt-0.5">
                            Tägliche Aufrufe und Anfragen deiner Inserate
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Metric Selector */}
                        <div className="flex items-center gap-1 bg-[#faf8f3] p-1 rounded-xl border border-beige text-xs">
                            {[
                                { id: 'views', label: 'Aufrufe' },
                                { id: 'leads', label: 'Anfragen' },
                                { id: 'impressions', label: 'Impressionen' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setActiveMetric(m.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${activeMetric === m.id
                                        ? 'bg-forest text-sand shadow-xs'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Period Selector */}
                        <div className="flex items-center gap-1 bg-[#faf8f3] p-1 rounded-xl border border-beige text-xs">
                            {[
                                { id: '7d', label: '7T' },
                                { id: '30d', label: '30T' },
                                { id: '90d', label: '90T' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handlePeriodChange(p.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${analyticsPeriod === p.id
                                        ? 'bg-gold text-forest font-black shadow-xs'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SVG Visual Graph */}
                {analyticsLoading ? (
                    <div className="py-16 flex justify-center items-center gap-2 text-xs text-charcoal/50">
                        <Loader2 className="w-5 h-5 animate-spin text-forest" />
                        <span>Analysedaten werden geladen...</span>
                    </div>
                ) : timeSeries.length === 0 ? (
                    <div className="py-12 text-center text-xs text-charcoal/40">Keine Daten verfügbar.</div>
                ) : (
                    <div className="space-y-2">
                        <div className="h-40 sm:h-48 w-full flex items-end gap-1 sm:gap-2 px-1 pt-4">
                            {timeSeries.map((point, idx) => {
                                const val = activeMetric === 'views' ? point.views : activeMetric === 'leads' ? point.leads : point.impressions;
                                const heightPct = Math.max(8, Math.round((val / maxChartValue) * 100));

                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                                    >
                                        {/* Hover Tooltip */}
                                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-charcoal text-white text-[10px] font-mono py-1 px-1.5 rounded whitespace-nowrap shadow-md">
                                            {point.date}: <strong>{val}</strong>
                                        </div>

                                        {/* Bar */}
                                        <div
                                            className={`w-full rounded-t-md transition-all duration-200 group-hover:brightness-110 ${activeMetric === 'views'
                                                ? 'bg-gradient-to-t from-forest to-emerald-600'
                                                : activeMetric === 'leads'
                                                    ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                                                    : 'bg-gradient-to-t from-gold-dark to-gold'
                                                }`}
                                            style={{ height: `${heightPct}%` }}
                                        />

                                        {/* Date label */}
                                        {idx % Math.ceil(timeSeries.length / 6) === 0 && (
                                            <span className="text-[8px] text-charcoal/40 font-mono rotate-0 truncate">
                                                {point.date}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Audience & Device Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-beige">
                    {/* Device Breakdown */}
                    <div className="p-3 bg-[#faf8f3] rounded-2xl border border-beige space-y-2 text-xs">
                        <span className="font-bold text-charcoal/70 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-forest" /> Endgeräte
                        </span>
                        <div className="space-y-1.5">
                            {[
                                { name: 'Smartphone', pct: 64, color: '#004709' },
                                { name: 'Desktop & Laptop', pct: 31, color: '#D4AF37' },
                                { name: 'Tablet', pct: 5, color: '#94a3b8' },
                            ].map((d, i) => (
                                <div key={i} className="space-y-0.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-charcoal/70">{d.name}</span>
                                        <span className="font-bold text-forest font-mono">{d.pct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Regional Distribution */}
                    <div className="p-3 bg-[#faf8f3] rounded-2xl border border-beige space-y-2 text-xs">
                        <span className="font-bold text-charcoal/70 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-forest" /> Top Käufer-Regionen
                        </span>
                        <div className="space-y-1">
                            {[
                                { region: 'Bayern', share: 34 },
                                { region: 'Nordrhein-Westfalen', share: 26 },
                                { region: 'Baden-Württemberg', share: 22 },
                                { region: 'Hessen & Österreich', share: 18 },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px] py-0.5 border-b border-beige/60 last:border-0">
                                    <span className="text-charcoal font-medium">#{i + 1} {r.region}</span>
                                    <span className="font-bold text-forest font-mono">{r.share}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. MAIN CONTENT: INSERATE & LEADS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left: Meine Inserate (7 Cols) */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-beige">
                        <div>
                            <h3 className="font-black text-forest text-base">Aktive Inserate</h3>
                            <p className="text-[11px] text-charcoal/50">Übersicht deiner Fahrzeuge und Reichweite</p>
                        </div>

                        {/* Search & New Listing */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative w-full sm:w-44">
                                <Search className="w-3.5 h-3.5 text-charcoal/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Suchen..."
                                    className="w-full bg-[#faf8f3] border border-beige focus:border-forest rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-charcoal outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onCreateListing}
                                className="px-3.5 py-1.5 bg-forest hover:bg-[#004d0a] text-sand rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5 text-gold" />
                                <span>Neu</span>
                            </button>
                        </div>
                    </div>

                    {filteredListings.length === 0 ? (
                        <div className="py-10 text-center text-xs text-charcoal/50 border border-dashed border-beige rounded-2xl space-y-2">
                            <p>Keine passenden Inserate gefunden.</p>
                            <button
                                type="button"
                                onClick={onCreateListing}
                                className="px-3 py-1.5 bg-forest text-sand text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Jetzt inserieren
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredListings.map((item) => {
                                const isBoosted = Boolean(item.boosted_until && new Date(item.boosted_until) > new Date());
                                const img = (item.images && item.images.length > 0) ? getImageUrl(item.images[0]) : 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=200';

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-[#faf8f3] hover:bg-sand border border-beige rounded-2xl transition-all flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={img}
                                                alt={item.title}
                                                className="w-14 h-14 rounded-xl object-cover border border-white shadow-xs shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-0.2 rounded-md text-[9px] font-black uppercase ${item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {item.status === 'APPROVED' ? 'Live' : 'Prüfung'}
                                                    </span>
                                                    {isBoosted && (
                                                        <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-gold/20 text-gold-dark">
                                                            Hervorgehoben
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-xs text-charcoal truncate mt-0.5">{item.title}</h4>
                                                <span className="text-xs font-black text-forest font-mono">
                                                    {parseFloat(item.price || 0).toLocaleString('de-DE')} €
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onOpenBoostModal(item)}
                                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${isBoosted
                                                    ? 'bg-gold/20 text-gold-dark border border-gold/30'
                                                    : 'bg-white hover:bg-gold/15 border border-beige hover:border-gold text-charcoal shadow-xs'
                                                    }`}
                                            >
                                                <Rocket className="w-3 h-3 text-gold-dark" />
                                                <span>{isBoosted ? 'Aktiv' : 'Hervorheben'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onEditListing(item.id)}
                                                className="p-1.5 bg-white hover:bg-sand border border-beige text-charcoal/60 hover:text-forest rounded-xl transition-all cursor-pointer"
                                                title="Bearbeiten"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDeleteListing(item)}
                                                className="p-1.5 bg-white hover:bg-rose-50 border border-beige hover:border-rose-200 text-charcoal/60 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Anfragen & Abo-Details (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Leads Box */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-beige">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-forest" />
                                <h3 className="font-black text-forest text-base">Käuferanfragen</h3>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest/10 text-forest font-bold">
                                {leads.length} Kontakte
                            </span>
                        </div>

                        {leads.length === 0 ? (
                            <p className="text-xs text-charcoal/50 text-center py-6">Noch keine Anfragen eingegangen.</p>
                        ) : (
                            <div className="space-y-3">
                                {leads.slice(0, 4).map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="p-3 bg-[#faf8f3] border border-beige rounded-2xl space-y-1.5 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-charcoal">{lead.buyer_name}</span>
                                            <span className="text-[10px] text-charcoal/40 font-mono">
                                                {new Date(lead.created_at).toLocaleDateString('de-DE')}
                                            </span>
                                        </div>
                                        <p className="font-bold text-forest text-[11px] truncate">{lead.listing_title}</p>
                                        <p className="text-charcoal/70 text-[11px] line-clamp-2 italic">"{lead.message}"</p>

                                        <div className="flex items-center gap-2 pt-1">
                                            {lead.buyer_phone && (
                                                <a
                                                    href={`tel:${lead.buyer_phone}`}
                                                    className="flex-1 py-1.5 px-2 bg-white hover:bg-sand border border-beige text-charcoal font-bold text-[11px] rounded-lg text-center flex items-center justify-center gap-1"
                                                >
                                                    <Phone className="w-3 h-3 text-forest" /> Anrufen
                                                </a>
                                            )}
                                            {lead.buyer_email && (
                                                <a
                                                    href={`mailto:${lead.buyer_email}`}
                                                    className="flex-1 py-1.5 px-2 bg-forest text-sand font-bold text-[11px] rounded-lg text-center flex items-center justify-center gap-1"
                                                >
                                                    <Mail className="w-3 h-3 text-gold" /> Antworten
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Subscription & Billing Quick Box */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-beige shadow-xs space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-beige">
                            <span className="font-bold text-charcoal">Mitgliedschaft</span>
                            <span className="font-black text-forest">29,00 € / Monat</span>
                        </div>
                        <div className="flex items-center justify-between text-charcoal/70">
                            <span>Verlängerung am:</span>
                            <span className="font-mono font-bold text-charcoal">
                                {subDetails.expires_at ? new Date(subDetails.expires_at).toLocaleDateString('de-DE') : 'In 30 Tagen'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onOpenInvoices}
                                className="flex-1 py-2 bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <Receipt className="w-3.5 h-3.5 text-forest" /> Rechnungen
                            </button>
                            <button
                                type="button"
                                onClick={onOpenCancelModal}
                                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-center cursor-pointer"
                            >
                                Kündigen
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}

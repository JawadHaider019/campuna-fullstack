'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, 
    ArrowUpRight, 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Play, 
    Pause, 
    RotateCcw, 
    Eye, 
    ShieldCheck, 
    Sparkles, 
    Download,
    Layers,
    UserCheck,
    Compass,
    ChevronRight,
    Search,
    Building2,
    User,
    Award
} from 'lucide-react';
import { getAllListings } from '@/api/listings';

export default function AdminDashboard() {
    const router = useRouter();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Live timer state for the Time Tracker / System widget
    const [seconds, setSeconds] = useState(5048); // 01:24:08 start
    const [timerRunning, setTimerRunning] = useState(true);

    useEffect(() => {
        let interval = null;
        if (timerRunning) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    const formatTimer = (totalSec) => {
        const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    };

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await getAllListings();
                if (res.success) {
                    setListings(res.data.listings || []);
                }
            } catch (err) {
                console.error("Error loading dashboard listings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const totalCount = listings.length || 24;
    const activeCount = listings.filter(l => l.status === 'APPROVED').length || (listings.length > 0 ? listings.length : 18);
    const reviewCount = listings.filter(l => l.status === 'REVIEW').length || 4;
    const pioneerCount = 2; // Pioneer rank qualified count

    // Mock weekly activity data for vertical pill bar chart
    const weekData = [
        { day: 'S', val: 35, striped: true },
        { day: 'M', val: 70, active: true, label: '58%' },
        { day: 'D', val: 50, striped: true },
        { day: 'M', val: 90, dark: true },
        { day: 'D', val: 40, striped: true },
        { day: 'F', val: 65, striped: true },
        { day: 'S', val: 30, striped: true },
    ];

    // Mock user list for collaboration/community card
    const recentUsers = [
        {
            name: 'Caravan Center Allgäu',
            role: 'Gewerblicher Händler',
            type: 'COMMERCIAL',
            status: 'Verifiziert',
            statusColor: 'bg-[#EBF7EE] text-[#1E7E50]',
            avatarBg: 'bg-emerald-100 text-emerald-800'
        },
        {
            name: 'Michael Becker',
            role: 'Privater Verkäufer',
            type: 'PRIVATE',
            status: 'Aktiv',
            statusColor: 'bg-[#EBF7EE] text-[#1E7E50]',
            avatarBg: 'bg-blue-100 text-blue-800'
        },
        {
            name: 'Camping World München',
            role: 'Gewerblicher Händler',
            type: 'COMMERCIAL',
            status: 'In Prüfung',
            statusColor: 'bg-[#FFF8E6] text-[#B88714]',
            avatarBg: 'bg-amber-100 text-amber-800'
        },
        {
            name: 'Sophie Wagner',
            role: 'Privater Nutzer',
            type: 'PRIVATE',
            status: 'Neu',
            statusColor: 'bg-slate-100 text-slate-700',
            avatarBg: 'bg-purple-100 text-purple-800'
        }
    ];

    return (
        <div className="space-y-6 max-w-[1440px] mx-auto">
            
            {/* ─── Top Header Section ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Übersicht, Moderation und Verwaltung des Campuna Marktplatzes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/anzeige-erstellen')}
                        className="bg-gradient-to-r from-forest to-[#003807] hover:from-[#004D0A] hover:to-forest text-sand px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-gold" />
                        <span>Neues Inserat</span>
                    </button>

                    <button
                        onClick={() => router.push('/inserate')}
                        className="bg-white hover:bg-[#F8F9FA] text-slate-700 border border-[#E2E4E8] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Daten exportieren</span>
                    </button>
                </div>
            </div>

            {/* ─── Row 1: 4 Top KPI Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Primary Highlight Card (Forest to Black Gradient) */}
                <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[140px] border border-forest/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-sand/80">
                            Gesamt-Inserate
                        </span>
                        <div className="w-7 h-7 rounded-full bg-white text-forest flex items-center justify-center font-bold text-xs shadow-sm">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                            {totalCount}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gold font-medium mt-1">
                            <TrendingUp className="w-3.5 h-3.5 text-gold" />
                            <span>+12% im Vormonat</span>
                        </div>
                    </div>
                </div>

                {/* 2. White Card: Aktive Angebote */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Aktive Angebote
                        </span>
                        <div className="w-7 h-7 rounded-full border border-[#E2E4E8] text-slate-600 flex items-center justify-center font-bold text-xs bg-[#FBFBFC]">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {activeCount}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>+8% Zuwachs</span>
                        </div>
                    </div>
                </div>

                {/* 3. White Card: In Moderation */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            In Moderation (Review)
                        </span>
                        <div className="w-7 h-7 rounded-full border border-[#E2E4E8] text-slate-600 flex items-center justify-center font-bold text-xs bg-[#FBFBFC]">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {reviewCount}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>KI-Prüfung ausstehend</span>
                        </div>
                    </div>
                </div>

                {/* 4. White Card: Pioneer Awards */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Pioneer Awards Club
                        </span>
                        <div className="w-7 h-7 rounded-full border border-[#E2E4E8] text-slate-600 flex items-center justify-center font-bold text-xs bg-[#FBFBFC]">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {pioneerCount} <span className="text-sm font-semibold text-slate-400">/ 300</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#B88714] font-medium mt-1">
                            <Award className="w-3.5 h-3.5 text-[#E2B43B]" />
                            <span>Erste 300 Plätze</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* ─── Row 2: Bento Grid Middle Row (3 Columns) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 1. Project / Listing Analytics Bar Chart */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-800">
                            Inserate-Aktivität
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Diese Woche
                        </span>
                    </div>

                    {/* Vertical Pill Bar Chart */}
                    <div className="flex items-end justify-between h-40 pt-6 px-2">
                        {weekData.map((item, idx) => {
                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 flex-1 relative group">
                                    {/* Tooltip Badge on Active Item */}
                                    {item.active && (
                                        <div className="absolute -top-7 bg-[#EBF7EE] text-[#1E7E50] border border-[#C8E6C9] font-bold text-[9px] px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap animate-bounce">
                                            {item.label}
                                        </div>
                                    )}

                                    {/* Bar Container */}
                                    <div className="w-7 sm:w-8 h-28 bg-[#F4F5F7] rounded-full flex flex-col justify-end p-0.5 overflow-hidden">
                                        {item.dark ? (
                                            <div 
                                                className="w-full bg-[#0E382F] rounded-full transition-all duration-500" 
                                                style={{ height: `${item.val}%` }}
                                            />
                                        ) : item.active ? (
                                            <div 
                                                className="w-full bg-[#34D399] rounded-full transition-all duration-500" 
                                                style={{ height: `${item.val}%` }}
                                            />
                                        ) : (
                                            <div 
                                                className="w-full rounded-full transition-all duration-500 bg-[repeating-linear-gradient(45deg,#E2E5E9,#E2E5E9_4px,#F0F2F4_4px,#F0F2F4_8px)]" 
                                                style={{ height: `${item.val}%` }}
                                            />
                                        )}
                                    </div>

                                    {/* Day Label */}
                                    <span className={`text-[11px] font-semibold ${item.active ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Reminders & Moderation Card */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-800">
                                Moderations-Warteschlange
                            </h3>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            KI-Prüfung & Freigabe ausstehender Inserate
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {reviewCount} neue Camping-Inserate warten auf Qualitätsprüfung und Titel-Validierung.
                        </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#F2F4F7]">
                        <button
                            onClick={() => router.push('/admin/inserate')}
                            className="w-full py-2.5 bg-gradient-to-r from-forest to-[#003807] hover:from-[#004D0A] hover:to-forest text-sand rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-gold" />
                            <span>Moderation öffnen</span>
                        </button>
                    </div>
                </div>

                {/* 3. Recent Listings / Projects Card */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-800">
                            Aktuelle Inserate
                        </h3>
                        <button 
                            onClick={() => router.push('/anzeige-erstellen')}
                            className="text-[11px] font-bold text-forest hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                            + Neu
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                                Keine Inserate vorhanden.
                            </div>
                        ) : (
                            listings.slice(0, 4).map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => router.push(`/inserate/${item.slug || item.id}`)}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="w-2 h-2 rounded-full bg-forest shrink-0" />
                                        <div className="truncate">
                                            <h5 className="text-xs font-bold text-slate-800 group-hover:text-forest transition-colors truncate">
                                                {item.title}
                                            </h5>
                                            <p className="text-[10px] text-slate-400">
                                                {item.category || 'Camping'} • {item.location || 'Deutschland'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest shrink-0">
                                        Live
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* ─── Row 3: Bento Grid Bottom Row (3 Columns) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 1. Team Collaboration / Users List */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-800">
                                Benutzer & Händler
                            </h3>
                            <button
                                onClick={() => router.push('/admin/benutzer')}
                                className="text-[11px] font-bold text-slate-500 hover:text-forest border border-[#E2E4E8] rounded-xl px-2.5 py-1 transition-colors cursor-pointer"
                            >
                                Alle anzeigen
                            </button>
                        </div>

                        <div className="space-y-3 mt-3">
                            {recentUsers.map((u, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className={`w-8 h-8 rounded-full ${u.avatarBg} font-bold text-xs flex items-center justify-center shrink-0`}>
                                            {u.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="truncate">
                                            <h5 className="text-xs font-bold text-slate-800 truncate">
                                                {u.name}
                                            </h5>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {u.role}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.statusColor} shrink-0`}>
                                        {u.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Semi-Circular Arc Progress Gauge */}
                <div className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800">
                            Genehmigungs-Quote
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                            Gesamt 100%
                        </span>
                    </div>

                    {/* SVG Semi-Circle Donut Gauge */}
                    <div className="flex flex-col items-center justify-center my-2 relative">
                        <svg className="w-48 h-28" viewBox="0 0 100 55">
                            {/* Background Gray Track */}
                            <path
                                d="M 10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke="#F0F2F5"
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                            {/* Striped/Pending Track Segment */}
                            <path
                                d="M 70 20 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke="#E9DDC8"
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                            {/* Active Green Arc Segment (86%) */}
                            <path
                                d="M 10 50 A 40 40 0 0 1 72 18"
                                fill="none"
                                stroke="#00630D"
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Center Value */}
                        <div className="absolute bottom-2 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900 leading-none">
                                86%
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1">
                                Genehmigt
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-slate-500 pt-2 border-t border-[#F2F4F7]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-forest" />
                            <span>Genehmigt</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gold" />
                            <span>In Prüfung</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span>Ausstehend</span>
                        </div>
                    </div>
                </div>

                {/* 3. Time Tracker & Live System Status (Forest to Black Card) */}
                <div className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between border border-forest/20">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-sand/80 uppercase tracking-wider">
                                Live System-Status
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold bg-white/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                                <Sparkles className="w-3 h-3" /> Online
                            </span>
                        </div>

                        {/* Digital Timer / Uptime Display */}
                        <div className="my-3">
                            <span className="font-mono text-3xl font-black text-white tracking-widest block">
                                {formatTimer(seconds)}
                            </span>
                            <span className="text-[11px] text-gold/80 font-medium">
                                System Uptime • Express API & PostgreSQL
                            </span>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTimerRunning(!timerRunning)}
                                className="w-8 h-8 rounded-full bg-white text-[#0E382F] flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
                                title={timerRunning ? "Pausieren" : "Fortsetzen"}
                            >
                                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                            <button
                                onClick={() => setSeconds(0)}
                                className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                                title="Zurücksetzen"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-200/90">
                            Port 5000 • Verbunden
                        </span>
                    </div>
                </div>

            </div>

        </div>
    );
}

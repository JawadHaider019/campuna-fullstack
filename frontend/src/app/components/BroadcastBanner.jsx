'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Megaphone,
    X,
    Bell,
    ChevronRight,
    ExternalLink,
    CheckCheck,
    AlertCircle,
    Sparkles,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    getUserBroadcasts,
    getBroadcastsUnreadCount,
    markBroadcastAsRead,
    markAllBroadcastsAsRead
} from '@/api/broadcasts';
import { useAuthStore } from '@/store/useAuthStore';

export default function BroadcastBanner() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [dismissedBannerIds, setDismissedBannerIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const pathname = usePathname();

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const user = useAuthStore((state) => state.user);

    // Don't show in admin portal pages
    const isAdminRoute = pathname?.startsWith('/admin');

    const fetchBroadcasts = useCallback(async () => {
        try {
            const [bRes, cRes] = await Promise.all([
                getUserBroadcasts().catch(() => ({ data: { broadcasts: [] } })),
                getBroadcastsUnreadCount().catch(() => ({ data: { unread_count: 0 } }))
            ]);

            if (bRes.data?.success) {
                setBroadcasts(bRes.data.broadcasts || []);
            }
            if (cRes.data?.success) {
                setUnreadCount(cRes.data.unread_count || 0);
            }
        } catch {
            // Non-critical background polling
        }
    }, []);

    useEffect(() => {
        if (!isAdminRoute) {
            fetchBroadcasts();
        }
    }, [isLoggedIn, pathname, isAdminRoute, fetchBroadcasts]);

    const handleMarkAsRead = async (broadcastId) => {
        if (!isLoggedIn) return;
        try {
            await markBroadcastAsRead(broadcastId);
            setBroadcasts(prev => prev.map(b => b.id === broadcastId ? { ...b, is_read: true } : b));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking broadcast as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            await markAllBroadcastsAsRead();
            setBroadcasts(prev => prev.map(b => ({ ...b, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        } finally {
            setLoading(false);
        }
    };

    // Find the highest priority unread broadcast that hasn't been temporarily dismissed in current session
    const urgentUnread = broadcasts.find(
        b => !b.is_read && (b.priority === 'URGENT' || b.priority === 'IMPORTANT') && !dismissedBannerIds.includes(b.id)
    );

    if (isAdminRoute) return null;

    return (
        <>
            {/* Top Announcement Bar for Urgent / Important Broadcasts */}
            <AnimatePresence>
                {urgentUnread && (
                    <motion.aside
                        aria-label="Wichtige Plattformmitteilung"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`relative z-40 text-xs px-4 py-2.5 font-sans border-b shadow-xs transition-colors ${
                            urgentUnread.priority === 'URGENT'
                                ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-white border-rose-700'
                                : 'bg-gradient-to-r from-forest via-[#00470A] to-forest text-sand border-forest-dark/40'
                        }`}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className={`p-1 rounded-lg shrink-0 ${
                                    urgentUnread.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-200' : 'bg-gold/20 text-gold'
                                }`}>
                                    <Megaphone className="w-3.5 h-3.5" />
                                </span>
                                <div className="flex items-center gap-2 truncate">
                                    <span className="font-extrabold uppercase tracking-wider text-[10px] bg-black/20 px-1.5 py-0.5 rounded shrink-0">
                                        {urgentUnread.priority === 'URGENT' ? 'Dringend' : 'Hinweis'}
                                    </span>
                                    <span className="font-bold truncate">{urgentUnread.title}</span>
                                    <span className="hidden md:inline text-white/70 truncate text-[11px]">— {urgentUnread.content}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {urgentUnread.action_url ? (
                                    <Link
                                        href={urgentUnread.action_url}
                                        onClick={() => handleMarkAsRead(urgentUnread.id)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold text-forest font-bold text-[11px] hover:bg-gold-light transition-all shrink-0"
                                    >
                                        <span>{urgentUnread.action_label || 'Details'}</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setModalOpen(true);
                                            handleMarkAsRead(urgentUnread.id);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all shrink-0 cursor-pointer"
                                    >
                                        <span>Lesen</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setDismissedBannerIds(prev => [...prev, urgentUnread.id]);
                                        handleMarkAsRead(urgentUnread.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                                    title="Ausblenden"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Floating Notification Bell Trigger for Authenticated Users with Unread Messages */}
            {isLoggedIn && unreadCount > 0 && !urgentUnread && (
                <button
                    onClick={() => setModalOpen(true)}
                    className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-forest text-sand shadow-2xl hover:bg-forest/90 border-2 border-gold flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    title="Neue Mitteilungen von Campuna"
                >
                    <Bell className="w-5 h-5 text-gold group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                </button>
            )}

            {/* Announcements Modal Center */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-forest via-[#003807] to-forest text-sand flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-bold">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-sand">Mitteilungen & Ankündigungen</h3>
                                        <p className="text-[11px] text-sand/70">Wichtige Neuigkeiten von der Campuna Plattform</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-sand flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Unread Actions */}
                            {isLoggedIn && unreadCount > 0 && (
                                <div className="px-6 py-2 bg-sand/30 border-b border-sand/60 flex items-center justify-between text-xs">
                                    <span className="font-bold text-forest text-[11px]">
                                        {unreadCount} neue {unreadCount === 1 ? 'Mitteilung' : 'Mitteilungen'}
                                    </span>
                                    <button
                                        onClick={handleMarkAllRead}
                                        disabled={loading}
                                        className="text-forest hover:text-forest-dark font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span>Alle als gelesen markieren</span>
                                    </button>
                                </div>
                            )}

                            {/* Broadcast List */}
                            <div className="p-6 space-y-3.5 overflow-y-auto divide-y divide-slate-100">
                                {broadcasts.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 space-y-2">
                                        <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                                        <p className="text-xs font-bold">Keine aktuellen Mitteilungen</p>
                                    </div>
                                ) : (
                                    broadcasts.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                                            className={`pt-3.5 first:pt-0 rounded-2xl transition-all ${
                                                !item.is_read ? 'bg-amber-50/40 p-3.5 border border-amber-200/60' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {!item.is_read && (
                                                        <span className="w-2 h-2 rounded-full bg-forest animate-pulse shrink-0" />
                                                    )}
                                                    <span className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                                                        item.priority === 'URGENT'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : item.priority === 'IMPORTANT'
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {item.priority === 'URGENT' ? 'Dringend' : item.priority === 'IMPORTANT' ? 'Wichtig' : 'Info'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {new Date(item.published_at || item.created_at).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>

                                                {item.is_read && (
                                                    <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                        <span>Gelesen</span>
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                                                {item.content}
                                            </p>

                                            {item.action_url && (
                                                <div className="mt-2.5">
                                                    <Link
                                                        href={item.action_url}
                                                        onClick={() => {
                                                            handleMarkAsRead(item.id);
                                                            setModalOpen(false);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-forest text-sand text-[11px] font-bold hover:bg-forest/90 transition-all shadow-2xs"
                                                    >
                                                        <span>{item.action_label || 'Mehr erfahren'}</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

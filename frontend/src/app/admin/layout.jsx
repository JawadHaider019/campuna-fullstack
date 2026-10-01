'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Hexagon,
    BarChart3,
    Users,
    LogOut,
    Home,
    Menu,
    X,
    Sparkles,
    Flag,
    Megaphone,
    BookOpen,
    Crown,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    ArrowUpRight,
    Layers,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminDashboardStats } from '@/api/admin';
import { getUnreadMessagesCount } from '@/api/conversations';
import { logoutUser } from '@/api/auth';
import { toast } from 'react-hot-toast';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingReportsCount, setPendingReportsCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('campuna_admin_sidebar_collapsed');
            if (saved !== null) {
                setSidebarCollapsed(saved === 'true');
            }
        } catch (e) {
            console.warn('Sidebar state read error:', e);
        }
    }, []);

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('campuna_admin_sidebar_collapsed', String(next));
            } catch (e) {
                console.warn('Sidebar state save error:', e);
            }
            return next;
        });
    };

    // Role Guard: Ensure user is logged in as ADMIN
    useEffect(() => {
        if (mounted) {
            if (!isLoggedIn || !user) {
                router.replace('/login');
            } else if (user.role !== 'ADMIN') {
                router.replace('/mein-konto');
            }
        }
    }, [mounted, isLoggedIn, user, router]);

    // Load review queue, report count & unread messages for live badges with 20s background polling
    useEffect(() => {
        if (mounted && isLoggedIn && user?.role === 'ADMIN') {
            const fetchAdminBadges = () => {
                getAdminDashboardStats()
                    .then(res => {
                        if (res.data?.success) {
                            if (res.data.stats?.listings?.review !== undefined) {
                                setPendingCount(res.data.stats.listings.review);
                            }
                            if (res.data.stats?.reports?.pending !== undefined) {
                                setPendingReportsCount(res.data.stats.reports.pending);
                            }
                        }
                    })
                    .catch(() => { });

                getUnreadMessagesCount()
                    .then(res => {
                        if (res.success && typeof res.unread_count === 'number') {
                            setUnreadMessagesCount(res.unread_count);
                        }
                    })
                    .catch(() => { });
            };

            fetchAdminBadges();
            const interval = setInterval(fetchAdminBadges, 20000);
            window.addEventListener('focus', fetchAdminBadges);
            window.addEventListener('campuna-unread-sync', fetchAdminBadges);

            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', fetchAdminBadges);
                window.removeEventListener('campuna-unread-sync', fetchAdminBadges);
            };
        }
    }, [mounted, isLoggedIn, user, pathname]);

    const menuItems = [
        { label: 'Dashboard', path: '/admin', icon: BarChart3 },
        {
            label: 'Inserate',
            path: '/admin/inserate',
            icon: Layers,
            badge: pendingCount > 0 ? String(pendingCount) : null,
            badgeColor: 'bg-amber-500 text-slate-900 font-black',
            hasDot: pendingCount > 0
        },
        {
            label: 'Nachrichten',
            path: '/admin/nachrichten',
            icon: MessageSquare,
            badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : null,
            badgeColor: 'bg-emerald-500 text-white font-black',
            hasDot: unreadMessagesCount > 0
        },
        {
            label: 'Meldungen',
            path: '/admin/meldungen',
            icon: Flag,
            badge: pendingReportsCount > 0 ? String(pendingReportsCount) : null,
            badgeColor: 'bg-rose-500 text-white font-black',
            hasDot: pendingReportsCount > 0
        },
        { label: 'KI-Entscheidungen', path: '/admin/entscheidungen', icon: Sparkles, badge: 'KI' },
        { label: 'Blog & Ratgeber', path: '/admin/blogs', icon: BookOpen },
        { label: 'Rundschreiben', path: '/admin/rundschreiben', icon: Megaphone },
        { label: 'Benutzerverwaltung', path: '/admin/benutzer', icon: Users },
    ];


    if (!mounted || !isLoggedIn || user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#003807] via-[#001D03] to-[#040805] flex items-center justify-center">
                <CircleLoader size="lg" color="gold" />
            </div>
        );
    }

    const handleLogout = () => {
        setLogoutConfirmOpen(true);
    };

    const handleLogoutConfirm = async () => {
        setLoggingOut(true);
        try {
            await logoutUser();
        } catch (err) {
            console.error('Admin logout error:', err);
        } finally {
            setLoggingOut(false);
            setLogoutConfirmOpen(false);
            logout();
            router.replace('/login');
            toast.success('Erfolgreich abgemeldet.');
        }
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-slate-800 font-sans flex flex-col lg:flex-row py-2 pr-2 sm:pr-3 sm:py-3 lg:py-4 lg:pr-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden">

            {/* ─── FIXED FOREST-TO-BLACK SIDEBAR (Expand / Collapse Support) ─── */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 76 : 250 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`hidden lg:flex flex-col p-3.5 justify-between shrink-0 text-white relative z-30 bg-transparent h-full overflow-y-visible ${
                    sidebarCollapsed ? 'items-center' : ''
                }`}
            >
                <div className="space-y-4 w-full">
                    {/* Header: Logo (Expanded Only) + Toggle Button */}
                    <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!sidebarCollapsed && (
                            <Link
                                href="/"
                                title="Zur Startseite"
                                className="relative flex-1 rounded-2xl px-3 py-2 bg-gradient-to-b from-[#D5D9E0] via-[#ECEEF2] to-[#FFFFFF] shadow-[inset_0_4px_8px_rgba(0,0,0,0.35),0_1px_1px_rgba(255,255,255,0.15)] border border-black/30 ring-1 ring-white/10 flex items-center justify-center overflow-hidden group cursor-pointer hover:opacity-95 transition-opacity"
                            >
                                <Image
                                    src="/logo.webp"
                                    alt="Campuna"
                                    width={130}
                                    height={38}
                                    className="w-[115px] h-auto object-contain relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] group-hover:scale-102 transition-transform duration-200"
                                    priority
                                />
                            </Link>
                        )}

                        {/* Expand / Collapse Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
                            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sand hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center relative group ${
                                sidebarCollapsed ? 'w-10 h-10 mx-auto' : 'shrink-0'
                            }`}
                        >
                            {sidebarCollapsed ? (
                                <>
                                    <PanelLeftOpen className="w-4 h-4 text-gold" />
                                    <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-[#0b1710] text-sand text-[11px] font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] drop-shadow-lg">
                                        <span>Menü ausklappen</span>
                                    </div>
                                </>
                            ) : (
                                <PanelLeftClose className="w-4 h-4 text-sand/70 hover:text-white" />
                            )}
                        </button>
                    </div>

                    {/* Navigation Section */}
                    <div className="space-y-2 w-full">
                        {!sidebarCollapsed && (
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold block">
                                    NAVIGATION
                                </span>
                            </div>
                        )}

                        {/* Quick Action: Back to main website / Home */}
                        <Link
                            href="/"
                            title={sidebarCollapsed ? undefined : "Zur Campuna Startseite"}
                            className={`flex items-center rounded-2xl text-xs font-semibold text-sand/85 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer group relative ${
                                sidebarCollapsed ? 'w-10 h-10 p-0 justify-center mx-auto' : 'w-full justify-between px-3.5 py-2'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Home className="w-4 h-4 text-gold group-hover:scale-110 transition-transform shrink-0" />
                                {!sidebarCollapsed && <span>Startseite</span>}
                            </div>
                            {!sidebarCollapsed && (
                                <ArrowUpRight className="w-3 h-3 text-sand/40 group-hover:text-gold transition-colors" />
                            )}
                            {sidebarCollapsed && (
                                <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-[#0b1710] text-sand text-[11px] font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] drop-shadow-lg">
                                    <span>Zur Startseite</span>
                                </div>
                            )}
                        </Link>

                        <nav className="space-y-1.5 pt-1 w-full">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.path;

                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => router.push(item.path)}
                                        className={`flex items-center rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer relative group ${
                                            sidebarCollapsed
                                                ? 'w-10 h-10 p-0 justify-center mx-auto'
                                                : 'w-full justify-between px-3.5 py-2.5'
                                        } ${
                                            isActive
                                                ? 'bg-gold text-forest font-bold shadow-md'
                                                : 'text-sand/70 hover:text-white hover:bg-white/10 font-medium'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-forest' : 'text-sand/70 group-hover:text-white'}`} />
                                                {item.hasDot && (
                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                        </div>

                                        {!sidebarCollapsed && item.badge && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                                item.hasDot
                                                    ? 'bg-rose-500 text-white font-black shadow-xs'
                                                    : (item.badgeColor || 'bg-white/10 text-sand')
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}

                                        {/* Tooltip for collapsed state */}
                                        {sidebarCollapsed && (
                                            <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-[#0b1710] text-sand text-[11px] font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] drop-shadow-lg flex items-center gap-1.5">
                                                <span>{item.label}</span>
                                                {item.badge && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-gold text-forest font-black">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Bottom User Account Pill / Logout */}
                <div className="space-y-2 pt-3 border-t border-white/10 w-full">
                    {!sidebarCollapsed && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold block truncate">
                                OFFIZIELL
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono shrink-0">
                                <Crown className="w-2.5 h-2.5 text-gold" /> BUSINESS
                            </span>
                        </div>
                    )}

                    <div className={`flex items-center min-w-0 bg-white/5 rounded-2xl border border-white/10 ${
                        sidebarCollapsed ? 'p-0 justify-center w-10 h-10 mx-auto group relative' : 'p-2 justify-between'
                    }`}>
                        {sidebarCollapsed ? (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 text-sand/70 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-[#0b1710] text-rose-300 text-[11px] font-bold rounded-xl shadow-2xl border border-rose-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] drop-shadow-lg">
                                    <span>Abmelden</span>
                                </div>
                            </button>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-extrabold text-[11px] flex items-center justify-center border border-gold/60 shadow-xs shrink-0">
                                        CC
                                    </div>
                                    <div className="min-w-0 truncate text-left">
                                        <h5 className="text-xs font-bold text-white truncate leading-tight">
                                            Campuna Club
                                        </h5>
                                        <p className="text-[10px] font-mono text-sand/60 truncate">
                                            Admin
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    title="Abmelden"
                                    className="p-1 text-sand/50 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* ─── MOBILE TOPBAR (On Small Screens) ─── */}
            <div className="lg:hidden flex flex-col w-full">
                <header className="px-4 py-3 bg-transparent text-white flex items-center justify-between">
                    <Link
                        href="/"
                        title="Zur Startseite"
                        className="relative rounded-xl px-3 py-1.5 bg-gradient-to-b from-[#D5D9E0] via-[#ECEEF2] to-[#FFFFFF] shadow-[inset_0_4px_8px_rgba(0,0,0,0.38),inset_0_1px_3px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.15)] border border-black/30 ring-1 ring-white/10 inline-flex items-center overflow-hidden cursor-pointer"
                    >
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={105}
                            height={32}
                            className="w-[90px] h-auto object-contain relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                            priority
                        />
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-1.5 text-white/80 hover:text-white bg-white/10 rounded-lg"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </header>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            key="admin-mobile-menu"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#002204]/90 backdrop-blur-md border-b border-white/10 p-4 space-y-2 text-white mb-2 rounded-2xl"
                        >
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            router.push(item.path);
                                        }}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${isActive ? 'bg-gold text-forest font-bold' : 'text-sand/80'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                                {item.hasDot && (
                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge && (
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                item.hasDot ? 'bg-rose-500 text-white font-black' : (item.badgeColor || 'bg-white/10 text-sand')
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            <hr className="border-white/10 my-2" />
                            <button
                                onClick={() => router.push('/')}
                                className="w-full flex items-center gap-2 p-2 text-xs text-sand/80"
                            >
                                <Home className="w-4 h-4 text-gold" /> Zur Website
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 p-2 text-xs text-rose-300 font-bold"
                            >
                                <LogOut className="w-4 h-4" /> Abmelden
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── RIGHT MAIN ROUNDED WHITE CANVAS ─── */}
            <div className="flex-1 bg-[#FFFFFF] rounded-3xl overflow-hidden flex flex-col shadow-2xl h-full border border-white/10">
                {/* ─── Top Header Bar with Breadcrumbs & Home Page Button ─── */}
                <header className="px-5 py-3 border-b border-stone-100 bg-stone-50/50 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0">
                    <div className="min-w-0 flex-1">
                        <Breadcrumbs variant="light" />
                    </div>


                </header>

                <main className={`flex-1 w-full ${pathname === '/admin/nachrichten' ? 'p-0 overflow-hidden h-full' : 'p-4 sm:p-6 overflow-y-auto'}`}>
                    {children}
                </main>
            </div>

            {/* Logout Confirmation Warning Modal */}
            <AnimatePresence>
                {logoutConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                        onClick={() => !loggingOut && setLogoutConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xl max-w-md w-full space-y-5 relative text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                                    <LogOut className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-800">Administrator-Abmeldung bestätigen</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Admin-Sitzung beenden</p>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Möchtest du dich wirklich aus dem Campuna Administrationsbereich abmelden? Du wirst zur Anmeldeseite weitergeleitet.
                            </p>

                            <div className="flex items-center gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={loggingOut}
                                    onClick={() => setLogoutConfirmOpen(false)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    disabled={loggingOut}
                                    onClick={handleLogoutConfirm}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 hover:scale-[1.02]"
                                >
                                    {loggingOut ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Wird abgemeldet...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="w-4 h-4" />
                                            <span>Ja, abmelden</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

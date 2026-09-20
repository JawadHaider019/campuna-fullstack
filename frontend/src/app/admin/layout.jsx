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
    ArrowUpRight,
    Loader2,
    Crown,
    MessageSquare
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
    }, []);

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

    // Load review queue, report count & unread messages for live badges
    useEffect(() => {
        if (mounted && isLoggedIn && user?.role === 'ADMIN') {
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
        }
    }, [mounted, isLoggedIn, user, pathname]);

    const menuItems = [
        { label: 'Dashboard', path: '/admin', icon: Hexagon },
        {
            label: 'Inserate',
            path: '/admin/inserate',
            icon: BarChart3,
            badge: pendingCount > 0 ? String(pendingCount) : null,
            badgeColor: 'bg-amber-500 text-slate-900 font-black'
        },
        {
            label: 'Nachrichten',
            path: '/admin/nachrichten',
            icon: MessageSquare,
            badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : null,
            badgeColor: 'bg-emerald-500 text-white font-black'
        },
        {
            label: 'Meldungen',
            path: '/admin/meldungen',
            icon: Flag,
            badge: pendingReportsCount > 0 ? String(pendingReportsCount) : null,
            badgeColor: 'bg-rose-500 text-white font-black'
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

            {/* ─── FIXED FOREST-TO-BLACK SIDEBAR ─── */}
            <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-4 justify-between shrink-0 text-white relative bg-transparent h-full overflow-y-auto">

                <div className="space-y-5">
                    {/* Deep Sunken / Recessed Logo Cavity Container (Clickable -> Home) */}
                    <Link
                        href="/"
                        title="Zur Startseite"
                        className="relative rounded-3xl px-4 py-3 bg-gradient-to-b from-[#D5D9E0] via-[#ECEEF2] to-[#FFFFFF] shadow-[inset_0_5px_10px_rgba(0,0,0,0.38),inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.15)] border border-black/30 ring-1 ring-white/10 flex items-center justify-center overflow-hidden group cursor-pointer hover:opacity-95 transition-opacity"
                    >
                        {/* Recessed vignette overlay */}
                        <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_8px_16px_rgba(0,0,0,0.25)]" />
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={140}
                            height={42}
                            className="w-[125px] h-auto object-contain relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] group-hover:scale-102 transition-transform duration-200"
                            priority
                        />
                    </Link>

                    {/* Navigation Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold block">
                                NAVIGATION
                            </span>
                        </div>

                        {/* Quick Action: Back to main website / Home */}
                        <Link
                            href="/"
                            title="Zur Campuna Startseite"
                            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-semibold text-sand/85 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="flex items-center gap-2.5">
                                <Home className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                                <span>Startseite</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-sand/40 group-hover:text-gold transition-colors" />
                        </Link>

                        <nav className="space-y-1.5 pt-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.path;

                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => router.push(item.path)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-3xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                                            ? 'bg-gold text-forest font-bold shadow-md'
                                            : 'text-sand/70 hover:text-white hover:bg-white/6 font-medium'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-forest' : 'text-sand/50'}`} />
                                            <span>{item.label}</span>
                                        </div>

                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Bottom User Account Pill: Campuna Club Business Profile */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold block">
                            OFFIZIELLER ACCOUNT
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono">
                            <Crown className="w-2.5 h-2.5 text-gold" /> BUSINESS
                        </span>
                    </div>

                    <div className="flex items-center justify-between min-w-0 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-extrabold text-xs flex items-center justify-center border-2 border-gold/60 shadow-sm shrink-0">
                                CC
                            </div>
                            <div className="min-w-0 truncate text-left">
                                <h5 className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1">
                                    <span>Campuna Club</span>
                                </h5>
                                <p className="text-[10px] font-mono text-sand/60 truncate">
                                    Business-Profil (Admin)
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Abmelden"
                            className="p-1.5 text-sand/50 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

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
                                            <Icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </div>
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

                <main className="p-4 sm:p-6 flex-1 overflow-y-auto w-full">
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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

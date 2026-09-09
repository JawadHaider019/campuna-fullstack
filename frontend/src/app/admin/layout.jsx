'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Hexagon,
    BarChart3,
    Users,
    LogOut,
    Home,
    Menu,
    X,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminDashboardStats } from '@/api/admin';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

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

    // Load review queue count for live badge
    useEffect(() => {
        if (mounted && isLoggedIn && user?.role === 'ADMIN') {
            getAdminDashboardStats()
                .then(res => {
                    if (res.data?.success && res.data.stats?.listings?.review) {
                        setPendingCount(res.data.stats.listings.review);
                    }
                })
                .catch(() => { });
        }
    }, [mounted, isLoggedIn, user, pathname]);

    const menuItems = [
        { label: 'Dashboard', path: '/admin', icon: Hexagon },
        {
            label: 'Inserate ',
            path: '/admin/inserate',
            icon: BarChart3,
            badge: pendingCount > 0 ? String(pendingCount) : null,
            badgeColor: 'bg-amber-500 text-slate-900 font-black'
        },
        { label: 'KI-Entscheidungen', path: '/admin/entscheidungen', icon: Sparkles, badge: 'KI' },
        { label: 'Benutzerverwaltung', path: '/admin/benutzer', icon: Users },
    ];


    if (!mounted || !isLoggedIn || user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#003807] via-[#001D03] to-[#040805] flex flex-col items-center justify-center font-sans">
                <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold text-sand tracking-widest uppercase">
                    Admin Portal wird geladen...
                </p>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-[#004709] via-[#002204] to-[#040805] text-slate-800 font-sans flex flex-col lg:flex-row py-2 pr-2 sm:pr-3 sm:py-3 lg:py-4 lg:pr-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden">

            {/* ─── FIXED FOREST-TO-BLACK SIDEBAR ─── */}
            <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-4 justify-between shrink-0 text-white relative bg-transparent h-full overflow-y-auto">

                <div className="space-y-8">
                    {/* Deep Sunken / Recessed Logo Cavity Container */}
                    <div className="relative rounded-3xl px-4 py-3 bg-gradient-to-b from-[#D5D9E0] via-[#ECEEF2] to-[#FFFFFF] shadow-[inset_0_5px_10px_rgba(0,0,0,0.38),inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.15)] border border-black/30 ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                        {/* Recessed vignette overlay */}
                        <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_8px_16px_rgba(0,0,0,0.25)]" />
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={140}
                            height={42}
                            className="w-[125px] h-auto object-contain relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                            priority
                        />
                    </div>

                    {/* Navigation Section */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold px-2 block">
                            NAVIGATION
                        </span>

                        <nav className="space-y-1.5">
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
                                        {item.badge && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isActive
                                                ? 'bg-forest text-sand'
                                                : 'bg-white/10 text-gold border border-gold/30'
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Bottom User Account Pill */}
                <div className="space-y-3 pt-6 border-t border-white/10">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-gold/60 uppercase font-semibold px-1 block">
                        USER ACCOUNT
                    </span>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-forest to-[#002B06] text-gold font-bold text-xs flex items-center justify-center ring-2 ring-gold/40 shadow-sm shrink-0">
                                AD
                            </div>
                            <div className="truncate text-left">
                                <h5 className="text-xs font-bold text-white truncate leading-tight">
                                    Campuna Admin
                                </h5>
                                <p className="text-[10px] font-mono text-gold/70 truncate">
                                    #campuna-admin
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Abmelden"
                            className="p-1.5 text-sand/50 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── MOBILE TOPBAR (On Small Screens) ─── */}
            <div className="lg:hidden flex flex-col w-full">
                <header className="px-4 py-3 bg-transparent text-white flex items-center justify-between">
                    <div className="relative rounded-xl px-3 py-1.5 bg-gradient-to-b from-[#D5D9E0] via-[#ECEEF2] to-[#FFFFFF] shadow-[inset_0_4px_8px_rgba(0,0,0,0.38),inset_0_1px_3px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.15)] border border-black/30 ring-1 ring-white/10 inline-flex items-center overflow-hidden">
                        <Image
                            src="/logo.webp"
                            alt="Campuna"
                            width={105}
                            height={32}
                            className="w-[90px] h-auto object-contain relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                            priority
                        />
                    </div>
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
                                        {item.badge && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest text-sand font-bold">
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
                <main className="p-4 sm:p-6 flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

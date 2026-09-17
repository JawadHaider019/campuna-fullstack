'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import BroadcastBanner from './BroadcastBanner';

export default function AppShell({ children }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isAdminRoute = pathname?.startsWith('/admin');
    const isUserAccountRoute = pathname?.startsWith('/mein-konto') || pathname?.startsWith('/de/mein-konto');
    const hideHeaderFooter = isAuthPage || isAdminRoute || isUserAccountRoute;

    return (
        <>
            <BroadcastBanner />
            {!hideHeaderFooter && <Navbar />}
            <main className={`flex-1 ${hideHeaderFooter ? 'h-full min-h-0 overflow-hidden flex flex-col' : ''}`}>
                {children}
            </main>
            {!hideHeaderFooter && <Footer />}
        </>
    );
}

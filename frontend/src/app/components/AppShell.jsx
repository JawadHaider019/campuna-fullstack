'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import BroadcastBanner from './BroadcastBanner';
import ToolsFloatingModal from './ToolsFloatingModal';
import ScrollSectionWrapper from './ScrollSectionWrapper';
import MobileBottomNav from './MobileBottomNav';

export default function AppShell({ children }) {
    const pathname = usePathname();
    const isAuthPage = 
        pathname === '/login' || 
        pathname === '/register' || 
        pathname === '/anmelden' || 
        pathname === '/registrieren' ||
        pathname?.startsWith('/email-bestaetigen') ||
        pathname?.startsWith('/verify-email');
    const isAdminRoute = pathname?.startsWith('/admin');
    const isUserAccountRoute = pathname?.startsWith('/mein-konto');
    const hideHeaderFooter = isAuthPage || isAdminRoute || isUserAccountRoute;
    const showMobileBottomNav = !isAuthPage && !isAdminRoute;

    return (
        <>
            {!isAuthPage && !isAdminRoute && (
                <div className="print:hidden print-hidden no-print">
                    <BroadcastBanner />
                </div>
            )}
            {!hideHeaderFooter && (
                <div className="print:hidden print-hidden no-print">
                    <Navbar />
                </div>
            )}
            <main className={`flex-1 ${hideHeaderFooter ? 'h-full min-h-0 overflow-hidden flex flex-col' : ''} ${showMobileBottomNav && hideHeaderFooter ? 'pb-16 md:pb-0' : ''}`}>
                {children}
            </main>
            {!hideHeaderFooter && (
                <div className="print:hidden print-hidden no-print">
                    <Footer />
                </div>
            )}
            {!hideHeaderFooter && (
                <div className="print:hidden print-hidden no-print">
                    <ToolsFloatingModal />
                </div>
            )}
            {showMobileBottomNav && (
                <div className="print:hidden print-hidden no-print">
                    <MobileBottomNav />
                </div>
            )}
        </>
    );
}

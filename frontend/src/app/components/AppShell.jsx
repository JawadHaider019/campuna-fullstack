'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppShell({ children }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/auth' || pathname === '/signup_login' || pathname === '/login';

    return (
        <>
            {!isAuthPage && <Navbar />}
            <main className="flex-1">{children}</main>
            {!isAuthPage && <Footer />}
        </>
    );
}

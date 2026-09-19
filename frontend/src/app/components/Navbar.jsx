'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Bell, ShieldCheck } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import WelcomeBar from './WelcomeBar';
import { useAuthStore } from '@/store/useAuthStore';

export default function Navbar({ isLoggedIn: propIsLoggedIn, alertCount = 0 }) {
  const [mounted, setMounted] = useState(false);
  const storeIsLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = mounted ? (propIsLoggedIn ?? storeIsLoggedIn) : false;
  const isAdmin = mounted && isLoggedIn && user?.role === 'ADMIN';
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHomepage = pathname === '/';

  const navLinks = [
    { label: 'Startseite', id: 'top' },
    { label: 'Über uns', path: '/uber_campuna' },
    { label: 'Zum Stöbern', id: 'exclusive-offers' },
    { label: 'Spotlight', id: 'campuna-spotlight' },
    { label: 'Entdecke', id: 'tool' },
    { label: 'Ratgeber', id: 'journal' },
  ];


  const scrollToSection = (id) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    const element = document.getElementById(id);
    if (element) {
      const navHeaderOffset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeaderOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      return true;
    }
    return false;
  };

  const handleNavClick = (id, path) => {
    setIsOpen(false);

    if (path) {
      router.push(path);
      return;
    }

    if (id === 'top') {
      if (isHomepage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        router.push('/');
      }
      return;
    }

    if (isHomepage) {
      scrollToSection(id);
      window.history.replaceState(null, '', `#${id}`);
    } else {
      router.push(`/#${id}`);
    }
  };

  // Scrollspy & Navbar shrink detection
  useEffect(() => {
    const handleScroll = () => {
      // 1. Scrolled state check for fixed position
      setIsScrolled(window.scrollY > 30);

      // 2. Section scrollspy (only active on homepage)
      if (!isHomepage) {
        setActiveSection('');
        return;
      }

      const scrollY = window.scrollY;
      const navOffset = 140; // Navbar offset

      // Only check section IDs that are explicitly mapped in navLinks
      const navSectionIds = ['exclusive-offers', 'campuna-spotlight', 'tool', 'journal'];
      let current = 'top'; // Default to 'top' (Startseite) if not inside a navlink section

      for (const id of navSectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY;
          const height = el.offsetHeight;
          if (scrollY + navOffset >= top && scrollY + navOffset < top + height) {
            current = id;
            break;
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomepage]);

  // Handle hash scrolling on initial page load
  useEffect(() => {
    if (typeof window !== 'undefined' && isHomepage && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        scrollToSection(targetId);
      }, 200);
    }
  }, [isHomepage]);

  return (
    <>
      {/* Welcome Bar at top when not scrolled on homepage */}
      {isHomepage && <WelcomeBar isLoggedIn={isLoggedIn} />}

      <nav
        id="main-navbar"
        className={`fixed left-0 w-full z-50 transition-all duration-300 bg-white py-4 ${isScrolled || !isHomepage ? 'top-0 ' : 'top-[75px] sm:top-[65px] md:top-[75px] lg:top-[64px]'
          }`}
      >
        <div className="max-w-8xl mx-auto px-4 md:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => handleNavClick('top')} className="flex items-start group relative cursor-pointer">
              <Image
                src="/logo.webp"
                alt="Campuna® – Dein Camping-Marktplatz"
                width={120}
                height={38}
                className="w-[120px] h-[38px] object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
              <span className="text-2xl sm:text-3xl font-normal text-forest ml-0.5 -mt-1 select-none leading-none">®</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {navLinks.map((link) => {
                const isActive = link.path
                  ? (pathname === link.path || (link.path === '/uber_campuna' && (pathname === '/about' || pathname === '/about_us')))
                  : (isHomepage && activeSection === link.id);
                return (
                  <button
                    key={link.id || link.path}
                    onClick={() => handleNavClick(link.id, link.path)}
                    className={`relative font-sans text-sm font-medium tracking-wide transition-colors duration-200 py-1 cursor-pointer ${isActive ? 'text-gold font-semibold' : 'text-forest hover:text-gold'
                      }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.6 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0.6 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full origin-center"
                      />
                    )}
                  </button>
                );
              })}

              {/* Admin Panel Button or User Account Button */}
              {isAdmin ? (
                <button
                  onClick={() => router.push('/admin')}
                  className="relative overflow-hidden flex items-center space-x-2 bg-gradient-to-r from-[#0A2218] via-forest to-[#0A2218] hover:from-forest hover:to-[#0A2218] text-white border border-gold/45 hover:border-gold font-sans text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-full shadow-[0_2px_12px_rgba(0,99,13,0.25)] hover:shadow-[0_4px_22px_rgba(200,169,107,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out group ml-1 cursor-pointer"
                  title="Zum Administrationsbereich"
                >
                  {/* Lazy shimmer beam on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out pointer-events-none" />

                  <ShieldCheck className="w-4 h-4 shrink-0 text-gold group-hover:text-amber-300 group-hover:scale-115 group-hover:rotate-6 transition-all duration-500 ease-out" />
                  <span className="relative z-10 text-white tracking-wide">Admin Panel</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push(isLoggedIn ? '/mein-konto' : '/login')}
                  className="relative flex items-center space-x-2 bg-forest text-sand hover:bg-gold hover:text-forest py-2.5 px-5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg min-w-[135px] justify-center group ml-1 cursor-pointer"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <div className="relative">
                    <span className="whitespace-nowrap flex items-center gap-1">
                      {isLoggedIn ? 'Konto' : 'Einloggen'}
                      {isLoggedIn && alertCount > 0 && (
                        <span className="relative flex items-center justify-center text-gold group-hover:text-forest">
                          <Bell className="w-3.5 h-3.5 shrink-0" />
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-forest focus:outline-none cursor-pointer"
                aria-label="Menü umschalten"
              >
                <div className="relative">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  {isLoggedIn && alertCount > 0 && (
                    <span className="absolute top-0 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-forest/10 shadow-xl"
            >
              <div className="px-6 py-6 flex flex-col space-y-4">
                {navLinks.map((link) => {
                  const isActive = link.path
                    ? (pathname === link.path || (link.path === '/uber_campuna' && (pathname === '/about' || pathname === '/about_us')))
                    : (isHomepage && activeSection === link.id);
                  return (
                    <button
                      key={link.id || link.path}
                      onClick={() => handleNavClick(link.id, link.path)}
                      className={`font-sans text-base font-medium text-left transition-colors duration-200 flex items-center justify-between py-1.5 cursor-pointer ${isActive ? 'text-gold font-bold' : 'text-forest hover:text-gold'
                        }`}
                    >
                      <span>{link.label}</span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-gold" />}
                    </button>
                  );
                })}

                <hr className="border-forest/10 my-2" />

                <div className="flex flex-col space-y-4">
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/admin');
                      }}
                      className="relative overflow-hidden w-full bg-gradient-to-r from-[#0A2218] via-forest to-[#0A2218] hover:from-forest hover:to-[#0A2218] text-white border border-gold/45 hover:border-gold py-3 rounded-full font-sans text-sm font-bold uppercase tracking-wider transition-all duration-500 ease-out shadow-[0_2px_12px_rgba(0,99,13,0.25)] hover:shadow-[0_4px_22px_rgba(200,169,107,0.4)] flex items-center justify-center space-x-2 min-h-[48px] group cursor-pointer"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out pointer-events-none" />
                      <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-gold group-hover:text-amber-300 group-hover:scale-115 transition-all duration-500" />
                      <span className="relative z-10 text-white tracking-wide">Admin Panel</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(isLoggedIn ? '/mein-konto' : '/login');
                      }}
                      className="w-full bg-forest text-sand py-3 rounded-full font-sans text-sm font-semibold hover:bg-gold hover:text-forest transition-colors duration-300 shadow-md flex items-center justify-center space-x-2 min-h-[48px] group cursor-pointer"
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <div className="relative">
                        <span className="whitespace-nowrap flex items-center gap-1">
                          {isLoggedIn ? 'Konto' : 'Einloggen'}
                          {isLoggedIn && alertCount > 0 && (
                            <span className="relative flex items-center justify-center text-gold group-hover:text-forest">
                              <Bell className="w-3.5 h-3.5 shrink-0" />
                              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </nav>
    </>
  );
}

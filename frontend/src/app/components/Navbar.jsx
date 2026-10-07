'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Bell, ShieldCheck, ChevronDown, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import WelcomeBar from './WelcomeBar';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

const TOOLS_ITEMS = [
  {
    title: 'Zuladungsrechner',
    subtitle: 'Zuladung für Wohnmobil & Wohnwagen berechnen',
    path: '/zuladungsrechner'
  },
  {
    title: 'Reisekostenrechner',
    subtitle: 'Sprit-, Maut- und Campingkosten kalkulieren',
    path: '/reisekostenrechner'
  }
];

export default function Navbar({ isLoggedIn: propIsLoggedIn, alertCount: propAlertCount }) {
  const [mounted, setMounted] = useState(false);
  const storeIsLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = mounted ? (propIsLoggedIn ?? storeIsLoggedIn) : false;
  const isAdmin = mounted && isLoggedIn && user?.role === 'ADMIN';
  const isBlogAdmin = mounted && isLoggedIn && user?.role === 'BLOG_ADMIN';

  const chatUnreadCount = useChatStore((state) => state.unreadCount);
  const fetchUnreadCount = useChatStore((state) => state.fetchUnreadCount);
  const initGlobalSocket = useChatStore((state) => state.initGlobalSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);
  const token = useAuthStore((state) => state.accessToken);
  const effectiveAlertCount = (typeof propAlertCount === 'number' && propAlertCount > 0)
    ? propAlertCount
    : (mounted && isLoggedIn ? chatUnreadCount : 0);

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const [toolsHovered, setToolsHovered] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Real-time Socket & sync unread messages count for logged in user
  useEffect(() => {
    if (mounted && isLoggedIn) {
      fetchUnreadCount();
      if (token) {
        initGlobalSocket(token);
      }

      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      const handleFocus = () => {
        fetchUnreadCount();
      };

      const handleSync = () => {
        fetchUnreadCount();
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('campuna-unread-sync', handleSync);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('campuna-unread-sync', handleSync);
      };
    } else if (mounted && !isLoggedIn) {
      if (typeof disconnectSocket === 'function') {
        disconnectSocket();
      }
    }
  }, [mounted, isLoggedIn, token, fetchUnreadCount, initGlobalSocket, disconnectSocket]);

  const [hasSpotlight, setHasSpotlight] = useState(false);

  useEffect(() => {
    const handleSpotlightStatus = (e) => {
      setHasSpotlight(Boolean(e.detail?.hasSpotlight));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('campuna-spotlight-status', handleSpotlightStatus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('campuna-spotlight-status', handleSpotlightStatus);
      }
    };
  }, []);

  const isHomepage = pathname === '/';
  const isAccountPage = 
    pathname?.startsWith('/mein-konto') || 
    pathname?.startsWith('/de/mein-konto') || 
    pathname?.startsWith('/konto') || 
    pathname?.startsWith('/de/konto');

  const navLinks = useMemo(() => {
    const currentPath = pathname || '/';
    const isHome = currentPath === '/' || currentPath === '/de';
    const isInserate = currentPath.startsWith('/inserate') || currentPath.startsWith('/inserat');
    const isAnbieter = currentPath.startsWith('/anbieter');

    if (isHome) {
      // On Homepage: Exactly 6 primary nav links
      return [
        { id: 'offers', label: 'Angebote', path: '/inserate' },
        { id: 'categories', label: 'Kategorien', path: '/kategorien' },
        { id: 'providers', label: 'Anbieter', path: '/anbieter' },
        { id: 'tool', label: 'Tools & Rechner' },
        { id: 'about', label: 'Über uns', path: '/uber-campuna' },
        { id: 'how-it-works', label: "So funktioniert's", path: '/so-funktioniert-campuna' },
      ];
    }

    // On Subpages: Exactly 6 items ("Startseite" replaces whichever page is currently active)
    const allItems = [
      { id: 'home', label: 'Startseite', path: '/' },
      { 
        id: 'offers', 
        label: 'Angebote', 
        path: '/inserate', 
        isCurrent: isInserate 
      },
      { 
        id: 'categories', 
        label: 'Kategorien', 
        path: '/kategorien', 
        isCurrent: currentPath.startsWith('/kategorien') || currentPath.startsWith('/kategorie') 
      },
      { 
        id: 'providers', 
        label: 'Anbieter', 
        path: '/anbieter', 
        isCurrent: isAnbieter 
      },
      { 
        id: 'tool', 
        label: 'Tools & Rechner' 
      },
      { 
        id: 'about', 
        label: 'Über uns', 
        path: '/uber-campuna', 
        isCurrent: currentPath.startsWith('/uber-campuna') || currentPath === '/about' || currentPath === '/about_us' 
      },
      { 
        id: 'how-it-works', 
        label: "So funktioniert's", 
        path: '/so-funktioniert-campuna', 
        isCurrent: currentPath.startsWith('/so-funktioniert-campuna') 
      },
    ];

    return allItems.filter((item) => !item.isCurrent);
  }, [pathname]);


  const scrollToSection = (id, behavior = 'smooth') => {
    if (typeof window === 'undefined') return false;

    if (id === 'top') {
      window.scrollTo({ top: 0, behavior });
      return true;
    }
    const element = document.getElementById(id);
    if (element) {
      const isMobile = window.innerWidth < 768;
      const navHeaderOffset = isMobile ? 80 : 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - navHeaderOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior
      });
      return true;
    }
    return false;
  };

  const handleNavClick = (id, path) => {
    setIsOpen(false);

    if (path) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('campuna_scroll_target');
      }
      router.push(path);
      return;
    }

    if (id === 'top') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('campuna_scroll_target');
      }
      if (isHomepage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', window.location.pathname);
        setActiveSection('top');
      } else {
        router.push('/');
      }
      return;
    }

    if (id === 'tool') {
      window.dispatchEvent(new CustomEvent('open-campuna-tools-modal', { detail: { tool: 'payload' } }));
      return;
    }

    if (isHomepage) {
      scrollToSection(id, 'smooth');
      window.history.replaceState(null, '', `#${id}`);
      setActiveSection(id);
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('campuna_scroll_target', id);
      }
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

  // Handle cross-page and initial hash scrolling to section
  useEffect(() => {
    if (typeof window === 'undefined' || !isHomepage) return;

    const performScrollToTarget = () => {
      const storedTarget = sessionStorage.getItem('campuna_scroll_target');
      const hashTarget = window.location.hash ? window.location.hash.replace('#', '') : '';
      const targetId = storedTarget || hashTarget;

      if (!targetId || targetId === 'top') return;

      let attempts = 0;
      const maxAttempts = 20;

      const attemptScroll = () => {
        attempts++;
        const success = scrollToSection(targetId, 'smooth');
        if (success) {
          sessionStorage.removeItem('campuna_scroll_target');
          setActiveSection(targetId);
          // Refine scroll position once dynamic images/sections settle
          if (attempts <= 5) {
            setTimeout(() => {
              scrollToSection(targetId, 'smooth');
            }, 350);
          }
        } else if (attempts < maxAttempts) {
          setTimeout(attemptScroll, 80);
        } else {
          sessionStorage.removeItem('campuna_scroll_target');
        }
      };

      // Allow Next.js page DOM to mount before calculating offsets
      setTimeout(attemptScroll, 60);
    };

    performScrollToTarget();

    const handleHashChange = () => {
      performScrollToTarget();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pathname, isHomepage]);

  return (
    <>
      {/* Welcome Bar at top on homepage */}
      {isHomepage && <WelcomeBar isLoggedIn={isLoggedIn} />}

      <nav
        id="main-navbar"
        className={`fixed left-0 w-full z-40 transition-all duration-300 bg-white py-3.5 sm:py-4 ${
          !isHomepage ? 'top-0' : 'top-9 sm:top-10'
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
                priority
                className="w-[120px] h-[38px] object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
              <span className="text-2xl sm:text-3xl font-normal text-forest ml-0.5 -mt-1 select-none leading-none">®</span>
            </button>

            {/* Desktop Navigation */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.07,
                    delayChildren: 0.1
                  }
                }
              }}
              className="hidden lg:flex items-center space-x-3.5 xl:space-x-6 text-[13.5px] xl:text-sm"
            >
              {navLinks.map((link) => {
                if (link.id === 'tool') {
                  const isToolActive = pathname === '/zuladungsrechner' || pathname === '/reisekostenrechner';
                  return (
                    <div
                      key="tools-nav-dropdown"
                      className="relative py-1"
                      onMouseEnter={() => setToolsHovered(true)}
                      onMouseLeave={() => setToolsHovered(false)}
                    >
                      <button
                        onClick={() => setToolsHovered(!toolsHovered)}
                        className={`relative font-sans text-sm font-medium tracking-wide transition-colors duration-200 py-1 flex items-center gap-1 cursor-pointer ${
                          isToolActive ? 'text-gold font-semibold' : 'text-forest hover:text-gold'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsHovered ? 'rotate-180 text-gold' : 'text-forest/60'}`} />
                        {isToolActive && (
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0.6 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0, scaleX: 0.6 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full origin-center"
                          />
                        )}
                      </button>

                      <AnimatePresence>
                        {toolsHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-forest/10 p-2 z-50"
                          >
                            <div className="space-y-1">
                              {TOOLS_ITEMS.map((tool) => {
                                const isCurrentTool = pathname === tool.path;
                                return (
                                  <button
                                    key={tool.path}
                                    onClick={() => {
                                      setToolsHovered(false);
                                      router.push(tool.path);
                                    }}
                                    className={`w-full flex flex-col p-2.5 rounded-xl transition-all duration-200 group/toolitem text-left cursor-pointer ${
                                      isCurrentTool ? 'bg-sand/70 text-forest' : 'hover:bg-sand/60 text-charcoal'
                                    }`}
                                  >
                                    <div className="font-display text-xs font-bold text-forest group-hover/toolitem:text-gold transition-colors flex items-center justify-between">
                                      <span>{tool.title}</span>
                                      <ArrowRight className="w-3 h-3 text-charcoal/30 group-hover/toolitem:text-forest group-hover/toolitem:translate-x-0.5 transition-all opacity-0 group-hover/toolitem:opacity-100" />
                                    </div>
                                    <p className="font-sans text-[11px] text-charcoal/60 leading-tight font-light line-clamp-1 mt-0.5">
                                      {tool.subtitle}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const isActive = link.path
                  ? (pathname === link.path || (link.path === '/uber-campuna' && (pathname === '/about' || pathname === '/about_us')))
                  : (isHomepage && activeSection === link.id);
                return (
                  <motion.button
                    key={link.id || link.path}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] } 
                      }
                    }}
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
                  </motion.button>
                );
              })}

              {/* Admin Panel Button or User Account Button */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { 
                    opacity: 1, 
                    scale: 1,
                    transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] } 
                  }
                }}
              >
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
                    {effectiveAlertCount > 0 && (
                      <span className="relative flex h-2.5 w-2.5 ml-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                ) : isBlogAdmin ? (
                  <button
                    onClick={() => router.push('/admin/blogs')}
                    className="relative overflow-hidden flex items-center space-x-2 bg-gradient-to-r from-[#0A2218] via-forest to-[#0A2218] hover:from-forest hover:to-[#0A2218] text-white border border-gold/45 hover:border-gold font-sans text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-full shadow-[0_2px_12px_rgba(0,99,13,0.25)] hover:shadow-[0_4px_22px_rgba(200,169,107,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out group ml-1 cursor-pointer"
                    title="Zur Blog-Verwaltung"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 text-gold group-hover:scale-115 transition-all duration-500 ease-out" />
                    <span className="relative z-10 text-white tracking-wide">Blog Panel</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(isLoggedIn ? '/mein-konto' : '/login')}
                    className="relative flex items-center space-x-2 bg-forest text-sand hover:bg-gold hover:text-forest py-2.5 px-5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg min-w-[135px] justify-center group ml-1 cursor-pointer"
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <div className="relative">
                      <span className="whitespace-nowrap flex items-center gap-1.5">
                        {isLoggedIn ? 'Konto' : 'Einloggen'}
                        {isLoggedIn && !isAccountPage && effectiveAlertCount > 0 && (
                          <span className="relative flex items-center justify-center text-gold group-hover:text-forest">
                            <Bell className="w-3.5 h-3.5 shrink-0" />
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                )}
              </motion.div>
            </motion.div>

            {/* Mobile menu trigger */}
            <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-forest focus:outline-none cursor-pointer"
                aria-label="Menü umschalten"
              >
                <div className="relative">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  {isLoggedIn && !isAccountPage && effectiveAlertCount > 0 && (
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
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
                  }
                }}
                className="px-6 py-6 flex flex-col space-y-4"
              >
                {navLinks.map((link) => {
                  if (link.id === 'tool') {
                    const isToolActive = pathname === '/zuladungsrechner' || pathname === '/reisekostenrechner';
                    return (
                      <div key="mobile-tool-group" className="flex flex-col space-y-1">
                        <button
                          onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                          className={`font-sans text-base font-medium text-left transition-colors duration-200 flex items-center justify-between py-1.5 cursor-pointer ${
                            isToolActive ? 'text-gold font-bold' : 'text-forest hover:text-gold'
                          }`}
                        >
                          <span>{link.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileToolsOpen ? 'rotate-180 text-gold' : 'text-charcoal/50'}`} />
                        </button>
                        <AnimatePresence>
                          {mobileToolsOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-3 pr-1 py-1 space-y-1.5 overflow-hidden"
                            >
                              {TOOLS_ITEMS.map((tool) => {
                                const isCurrentTool = pathname === tool.path;
                                return (
                                   <button
                                     key={tool.path}
                                     onClick={() => {
                                       setIsOpen(false);
                                       router.push(tool.path);
                                     }}
                                     className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                       isCurrentTool ? 'bg-sand text-forest font-bold' : 'hover:bg-sand/60 text-charcoal/80 bg-sand/30'
                                     }`}
                                   >
                                     <div className="flex-1 min-w-0 pr-2">
                                       <span className="font-display text-xs font-semibold text-forest block truncate">{tool.title}</span>
                                       <span className="font-sans text-[10px] text-charcoal/60 font-light block truncate">{tool.subtitle}</span>
                                     </div>
                                     <ArrowRight className="w-3.5 h-3.5 text-charcoal/40 shrink-0" />
                                   </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  const isActive = link.path
                    ? (pathname === link.path || (link.path === '/uber-campuna' && (pathname === '/about' || pathname === '/about_us')))
                    : (isHomepage && activeSection === link.id);
                  return (
                    <motion.button
                      key={link.id || link.path}
                      variants={{
                        hidden: { opacity: 0, x: -15 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
                      }}
                      onClick={() => handleNavClick(link.id, link.path)}
                      className={`font-sans text-base font-medium text-left transition-colors duration-200 flex items-center justify-between py-1.5 cursor-pointer ${isActive ? 'text-gold font-bold' : 'text-forest hover:text-gold'
                        }`}
                    >
                      <span>{link.label}</span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-gold" />}
                    </motion.button>
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
                      {effectiveAlertCount > 0 && (
                        <span className="relative flex h-2.5 w-2.5 ml-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                  ) : isBlogAdmin ? (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/admin/blogs');
                      }}
                      className="relative overflow-hidden w-full bg-gradient-to-r from-[#0A2218] via-forest to-[#0A2218] hover:from-forest hover:to-[#0A2218] text-white border border-gold/45 hover:border-gold py-3 rounded-full font-sans text-sm font-bold uppercase tracking-wider transition-all duration-500 ease-out shadow-[0_2px_12px_rgba(0,99,13,0.25)] hover:shadow-[0_4px_22px_rgba(200,169,107,0.4)] flex items-center justify-center space-x-2 min-h-[48px] group cursor-pointer"
                    >
                      <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-gold group-hover:scale-115 transition-all duration-500" />
                      <span className="relative z-10 text-white tracking-wide">Blog Panel</span>
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
                        <span className="whitespace-nowrap flex items-center gap-1.5">
                          {isLoggedIn ? 'Konto' : 'Einloggen'}
                          {isLoggedIn && !isAccountPage && effectiveAlertCount > 0 && (
                            <span className="relative flex items-center justify-center text-gold group-hover:text-forest">
                              <Bell className="w-3.5 h-3.5 shrink-0" />
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </nav>
    </>
  );
}

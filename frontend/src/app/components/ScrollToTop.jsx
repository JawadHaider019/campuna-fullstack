'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled more than 400px
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={scrollToTop}
                    className="fixed bottom-30 sm:bottom-30 md:bottom-35 lg:bottom-30 right-6 z-[90] w-10 h-10 sm:h-12 sm:w-12 rounded-full bg-forest text-sand hover:bg-gold hover:text-forest flex items-center justify-center transition-all duration-300 shadow-2xl hover:-translate-y-1 border border-white/10 group cursor-pointer"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-full bg-forest/20 blur-xl -z-10 group-hover:bg-gold/20 transition-all duration-300" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

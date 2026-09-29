'use client';

import React from 'react';
import { Tent, Compass } from 'lucide-react';

/**
 * Clean, elegant Campuna placeholder for listings without photos.
 * Replaces dummy hero photos with a professional brand gradient + icon tile.
 */
export default function ListingImagePlaceholder({ 
    category = 'Camping', 
    size = 'md', // 'sm' | 'md' | 'lg'
    className = '' 
}) {
    const isSm = size === 'sm';
    const isLg = size === 'lg';

    return (
        <div className={`w-full h-full bg-gradient-to-br from-[#0c2e17] via-[#051c0d] to-[#021006] text-sand/85 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none ${className}`}>
            {/* Subtle luxury background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-forest/20 rounded-full blur-2xl pointer-events-none" />
            
            {/* Brand Logo/Icon Centerpiece */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1.5">
                <div className={`rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gold/80 shadow-inner ${
                    isSm ? 'w-8 h-8' : isLg ? 'w-16 h-16 rounded-3xl' : 'w-11 h-11'
                }`}>
                    {category?.toLowerCase().includes('wohnmobil') || category?.toLowerCase().includes('camper') ? (
                        <Compass className={isSm ? 'w-4 h-4' : isLg ? 'w-8 h-8' : 'w-5 h-5'} />
                    ) : (
                        <Tent className={isSm ? 'w-4 h-4' : isLg ? 'w-8 h-8' : 'w-5 h-5'} />
                    )}
                </div>

                {!isSm && (
                    <div className="space-y-0.5 mt-1">
                        <span className="font-display font-bold text-[11px] sm:text-xs tracking-wider text-sand uppercase block">
                            Campuna
                        </span>
                        <span className="text-[9px] text-sand/55 block font-sans">
                            Kein Foto hinterlegt
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import React from 'react';

/**
 * Universal Simple & Clean Circle Loader for Campuna
 * - Pure circular spinner
 * - No extra text, no surrounding boxes or cards
 * - Smooth CSS spinning animation using Campuna brand colors
 */
export default function CircleLoader({
    size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    color = 'forest', // 'forest' | 'gold' | 'white'
    fullPage = false,
    className = ''
}) {
    const sizeMap = {
        xs: 'w-4 h-4 border-2',
        sm: 'w-6 h-6 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-11 h-11 border-[3.5px]',
        xl: 'w-14 h-14 border-4',
    };

    const colorMap = {
        forest: 'border-forest/15 border-t-forest',
        gold: 'border-gold/25 border-t-gold',
        white: 'border-white/20 border-t-white',
    };

    const spinner = (
        <div
            className={`${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.forest} rounded-full animate-spin shrink-0`}
            role="status"
            aria-label="Laden..."
        />
    );

    if (fullPage) {
        return (
            <div className={`min-h-[70vh] flex-1 flex items-center justify-center w-full select-none ${className}`}>
                {spinner}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center select-none ${className}`}>
            {spinner}
        </div>
    );
}

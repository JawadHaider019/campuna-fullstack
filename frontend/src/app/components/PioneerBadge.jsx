import React from 'react';
import { Crown } from 'lucide-react';

/**
 * Unified Campuna Pioneer Badge component using original Campuna brand colors (Gold, Gold-Dark, Sand, Forest).
 */
export default function PioneerBadge({
    size = 'md',
    variant = 'pill',
    text = 'Campuna Pioneer',
    showText = true,
    className = '',
    onClick = null,
    title = 'Campuna Pioneer Status (Streng limitiert auf 300 Mitglieder)',
}) {
    // 1. EMBLEM VARIANT (Circular gold-to-sand avatar/corner emblem with forest crown)
    if (variant === 'emblem') {
        const sizeClasses =
            size === 'lg'
                ? 'w-16 h-16'
                : size === 'sm'
                ? 'w-6 h-6'
                : 'w-9 h-9';

        const iconSizeClasses =
            size === 'lg'
                ? 'w-8 h-8'
                : size === 'sm'
                ? 'w-3.5 h-3.5'
                : 'w-4 h-4';

        return (
            <div
                title={title}
                onClick={onClick}
                className={`rounded-full bg-gradient-to-tr from-gold to-sand flex items-center justify-center shadow-md border-2 border-white ring-2 ring-gold/40 shrink-0 ${sizeClasses} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
            >
                <Crown className={`${iconSizeClasses} text-forest`} />
            </div>
        );
    }

    // 2. HERO VARIANT (Large original hero award emblem: gold-to-sand gradient, forest crown)
    if (variant === 'hero') {
        return (
            <div
                title={title}
                onClick={onClick}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-gold to-sand flex items-center justify-center shadow-lg border-4 border-white/20 shrink-0 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
            >
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-forest" />
            </div>
        );
    }

    // 3. FOREST / DARK PILL VARIANT (bg-forest text-gold border-gold/40)
    if (variant === 'forest' || variant === 'dark') {
        const pillSizes = {
            xs: 'px-2 py-0.5 text-[10px] gap-1',
            sm: 'px-2.5 py-1 text-xs gap-1.5',
            md: 'px-3 py-1 text-xs gap-1.5',
            lg: 'px-4 py-1.5 text-sm gap-2',
        };

        const iconSizes = {
            xs: 'w-3 h-3',
            sm: 'w-3.5 h-3.5',
            md: 'w-3.5 h-3.5',
            lg: 'w-4 h-4',
        };

        const chosenPill = pillSizes[size] || pillSizes.md;
        const chosenIcon = iconSizes[size] || iconSizes.md;
        const Element = onClick ? 'button' : 'div';

        return (
            <Element
                type={onClick ? 'button' : undefined}
                onClick={onClick}
                title={title}
                className={`inline-flex items-center bg-forest text-gold border border-gold/50 font-black uppercase tracking-wider rounded-full shadow-md select-none ${chosenPill} ${
                    onClick ? 'cursor-pointer hover:bg-forest/90 hover:scale-[1.02] transition-all' : ''
                } ${className}`}
            >
                <Crown className={`${chosenIcon} text-gold shrink-0`} />
                {showText && <span>{text}</span>}
            </Element>
        );
    }

    // 3. PILL VARIANT (Original Campuna colors: bg-gold/20 text-gold-dark border-gold/40 with Crown)
    const pillSizes = {
        xs: 'px-2 py-0.5 text-[10px] gap-1',
        sm: 'px-2.5 py-1 text-xs gap-1.5',
        md: 'px-3 py-1 text-xs gap-1.5',
        lg: 'px-4 py-1.5 text-sm gap-2',
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    const chosenPill = pillSizes[size] || pillSizes.md;
    const chosenIcon = iconSizes[size] || iconSizes.md;

    const Element = onClick ? 'button' : 'div';

    return (
        <Element
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            title={title}
            className={`inline-flex items-center bg-gold/20 text-gold-dark border border-gold/40 font-black uppercase tracking-wider rounded-full shadow-xs select-none ${chosenPill} ${
                onClick ? 'cursor-pointer hover:bg-gold/30 hover:scale-[1.02] transition-all' : ''
            } ${className}`}
        >
            <Crown className={`${chosenIcon} text-gold-dark shrink-0`} />
            {showText && <span>{text}</span>}
        </Element>
    );
}

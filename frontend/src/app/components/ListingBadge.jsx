'use client';

import React from 'react';
import { ShieldCheck, Building2, Briefcase, Rocket } from 'lucide-react';
import { getSellerBadgeInfo } from '@/utils/sellerBadge';

/**
 * Account badge component for Private / Gewerblich / Business
 * (Returns null for Admin accounts so no "Privat" badge is shown)
 */
export function SellerAccountBadge({ item, className = '', size = 'sm' }) {
    const info = getSellerBadgeInfo(item);
    
    // If admin listing/account, do NOT show any account badge (only Hervorgehoben will be shown)
    if (info.isAdmin) {
        return null;
    }

    const sizeClasses = size === 'xs' 
        ? 'text-[7px] px-2 py-0.5 gap-0.5' 
        : size === 'md' 
        ? 'text-[9px] sm:text-[10px] px-3 py-1 gap-1.5'
        : 'text-[7.5px] sm:text-[8px] px-2.5 py-0.5 sm:py-1 gap-1';

    const iconSize = size === 'xs' 
        ? 'w-2 h-2' 
        : size === 'md' 
        ? 'w-3.5 h-3.5'
        : 'w-2.5 h-2.5';

    if (info.isBusiness) {
        return (
            <span className={`bg-[#062c19] text-amber-300 border border-amber-400/40 font-black uppercase tracking-wider rounded-full shadow-md backdrop-blur-md inline-flex items-center select-none ${sizeClasses} ${className}`}>
                <Briefcase className={`${iconSize} text-amber-400 shrink-0`} />
                <span>BUSINESS</span>
            </span>
        );
    }

    if (info.isCommercial) {
        return (
            <span className={`bg-[#0B3B24] text-white border border-emerald-400/30 font-black uppercase tracking-wider rounded-full shadow-md backdrop-blur-md inline-flex items-center select-none ${sizeClasses} ${className}`}>
                <Building2 className={`${iconSize} text-emerald-300 shrink-0`} />
                <span>GEWERBLICH</span>
            </span>
        );
    }

    return (
        <span className={`bg-[#107C41] text-white border border-emerald-300/30 font-black uppercase tracking-wider rounded-full shadow-md backdrop-blur-md inline-flex items-center select-none ${sizeClasses} ${className}`}>
            <ShieldCheck className={`${iconSize} text-white shrink-0`} />
            <span>PRIVAT</span>
        </span>
    );
}

/**
 * Paid listing promotion badge: "Hervorgehoben"
 */
export function PromotedBadge({ className = '', size = 'sm' }) {
    const sizeClasses = size === 'xs' 
        ? 'text-[7px] px-2 py-0.5 gap-0.5' 
        : size === 'md' 
        ? 'text-[9px] sm:text-[10px] px-3.5 py-1.5 gap-1.5'
        : 'text-[7.5px] sm:text-[8.5px] px-2.5 py-0.5 sm:py-1 gap-1';

    const iconSize = size === 'xs' 
        ? 'w-2 h-2' 
        : size === 'md' 
        ? 'w-3.5 h-3.5'
        : 'w-2.5 h-2.5';

    return (
        <span className={`bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black uppercase tracking-wider rounded-full shadow-md border border-yellow-100/90 inline-flex items-center select-none backdrop-blur-md ${sizeClasses} ${className}`}>
            <Rocket className={`${iconSize} text-slate-950 shrink-0`} />
            <span>HERVORGEHOBEN</span>
        </span>
    );
}

/**
 * Combined badge row for listing cards
 * - Private listing → [PRIVAT] (+ [HERVORGEHOBEN] if boosted)
 * - Commercial Free listing → [GEWERBLICH] (+ [HERVORGEHOBEN] if boosted)
 * - Commercial Business listing → [BUSINESS] (+ [HERVORGEHOBEN] if boosted)
 * - Admin listing → [HERVORGEHOBEN] (and NEVER [PRIVAT])
 */
export function ListingBadgesRow({ item, className = '', size = 'sm' }) {
    const info = getSellerBadgeInfo(item);
    const isBoosted = Boolean(
        item?.is_boosted || 
        item?.boosted ||
        (item?.boosted_until && new Date(item.boosted_until) > new Date())
    );

    // If admin listing or boosted listing, show Hervorgehoben badge
    const showPromoted = isBoosted || info.isAdmin;

    return (
        <div className={`flex items-center gap-1.5 flex-wrap pointer-events-none ${className}`}>
            {!info.isAdmin && <SellerAccountBadge item={item} size={size} />}
            {showPromoted && <PromotedBadge size={size} />}
        </div>
    );
}

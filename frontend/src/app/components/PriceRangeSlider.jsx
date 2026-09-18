'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const PRESETS = [
    { label: 'Alle', min: '', max: '' },
    { label: '< 10.000 €', min: '', max: '10000' },
    { label: '10k – 30k €', min: '10000', max: '30000' },
    { label: '30k – 75k €', min: '30000', max: '75000' },
    { label: '> 75.000 €', min: '75000', max: '' }
];

const formatCurrency = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('de-DE');
};

export default function PriceRangeSlider({
    minPrice = '',
    maxPrice = '',
    setMinPrice,
    setMaxPrice,
    onChange,
    minLimit = 0,
    maxLimit = 150000,
    step = 500,
    showPresets = true,
    showInputs = false,
    className = ''
}) {
    const trackRef = useRef(null);
    const [draggingHandle, setDraggingHandle] = useState(null); // 'min' | 'max' | null

    // Numeric values clamped to bounds for slider calculation
    const numMin = minPrice === '' ? minLimit : Math.max(minLimit, Math.min(Number(minPrice) || 0, maxLimit));
    const numMax = maxPrice === '' ? maxLimit : Math.max(minLimit, Math.min(Number(maxPrice) || maxLimit, maxLimit));

    // Calculate percentage for thumbs and active track
    const minPercent = Math.max(0, Math.min(100, ((numMin - minLimit) / (maxLimit - minLimit)) * 100));
    const maxPercent = Math.max(0, Math.min(100, ((numMax - minLimit) / (maxLimit - minLimit)) * 100));

    // Update prices & notify parent
    const applyPriceChange = useCallback((newMin, newMax) => {
        if (setMinPrice) setMinPrice(newMin);
        if (setMaxPrice) setMaxPrice(newMax);
        if (onChange) onChange(newMin, newMax);
    }, [setMinPrice, setMaxPrice, onChange]);

    // Convert pixel position on track to price value
    const getValueFromClientX = useCallback((clientX) => {
        if (!trackRef.current) return 0;
        const rect = trackRef.current.getBoundingClientRect();
        const width = rect.width;
        if (width <= 0) return 0;

        const offsetX = Math.min(Math.max(0, clientX - rect.left), width);
        const ratio = offsetX / width;
        const rawVal = minLimit + ratio * (maxLimit - minLimit);
        const steppedVal = Math.round(rawVal / step) * step;
        return Math.min(maxLimit, Math.max(minLimit, steppedVal));
    }, [minLimit, maxLimit, step]);

    // Handle drag movement
    const handlePointerMove = useCallback((e) => {
        if (!draggingHandle) return;
        const currentVal = getValueFromClientX(e.clientX);

        if (draggingHandle === 'min') {
            const safeMin = Math.min(currentVal, numMax);
            const safeMinStr = safeMin <= minLimit ? '' : String(safeMin);
            const curMaxStr = maxPrice === '' ? '' : String(numMax);
            applyPriceChange(safeMinStr, curMaxStr);
        } else if (draggingHandle === 'max') {
            const safeMax = Math.max(currentVal, numMin);
            const safeMaxStr = safeMax >= maxLimit ? '' : String(safeMax);
            const curMinStr = minPrice === '' ? '' : String(numMin);
            applyPriceChange(curMinStr, safeMaxStr);
        }
    }, [draggingHandle, getValueFromClientX, numMin, numMax, minLimit, maxLimit, minPrice, maxPrice, applyPriceChange]);

    // End drag
    const handlePointerUp = useCallback(() => {
        setDraggingHandle(null);
    }, []);

    useEffect(() => {
        if (draggingHandle) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('pointercancel', handlePointerUp);
            return () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('pointercancel', handlePointerUp);
            };
        }
    }, [draggingHandle, handlePointerMove, handlePointerUp]);

    // Handle track click (move closest handle)
    const handleTrackPointerDown = (e) => {
        if (!trackRef.current) return;
        const clickVal = getValueFromClientX(e.clientX);
        const distToMin = Math.abs(clickVal - numMin);
        const distToMax = Math.abs(clickVal - numMax);

        if (distToMin <= distToMax) {
            setDraggingHandle('min');
            const safeMin = Math.min(clickVal, numMax);
            const safeMinStr = safeMin <= minLimit ? '' : String(safeMin);
            const curMaxStr = maxPrice === '' ? '' : String(numMax);
            applyPriceChange(safeMinStr, curMaxStr);
        } else {
            setDraggingHandle('max');
            const safeMax = Math.max(clickVal, numMin);
            const safeMaxStr = safeMax >= maxLimit ? '' : String(safeMax);
            const curMinStr = minPrice === '' ? '' : String(numMin);
            applyPriceChange(curMinStr, safeMaxStr);
        }
    };

    // Format current range label
    const formatRangeLabel = () => {
        const minStr = minPrice ? `${formatCurrency(minPrice)} €` : '0 €';
        const maxStr = maxPrice ? `${formatCurrency(maxPrice)} €` : `${formatCurrency(maxLimit)} €+`;
        return `${minStr} – ${maxStr}`;
    };

    // Check if preset matches current filter
    const isPresetActive = (preset) => {
        const pMin = preset.min === '' ? '' : String(preset.min);
        const pMax = preset.max === '' ? '' : String(preset.max);
        const curMin = minPrice === '' ? '' : String(minPrice);
        const curMax = maxPrice === '' ? '' : String(maxPrice);
        return pMin === curMin && pMax === curMax;
    };

    return (
        <div className={`space-y-3 select-none ${className}`}>
            {/* Header / Summary Badge */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest/90">
                    Preis
                </span>
                <span className="text-[11px] font-semibold text-forest bg-forest/8 px-2.5 py-0.5 rounded-full border border-forest/15">
                    {formatRangeLabel()}
                </span>
            </div>

            {/* Range Slider Container */}
            <div className="pt-2 pb-1.5 px-1">
                <div
                    ref={trackRef}
                    onPointerDown={handleTrackPointerDown}
                    className="relative h-2 w-full bg-forest/10 rounded-full cursor-pointer touch-none"
                >
                    {/* Active Track Highlight */}
                    <div
                        className="absolute top-0 bottom-0 bg-forest rounded-full transition-all duration-75"
                        style={{
                            left: `${minPercent}%`,
                            width: `${Math.max(0, maxPercent - minPercent)}%`
                        }}
                    />

                    {/* Left / Min Thumb */}
                    <button
                        type="button"
                        aria-label="Mindestpreis Regler"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingHandle('min');
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-forest shadow-md hover:scale-115 focus:outline-none transition-transform cursor-grab active:cursor-grabbing z-10 flex items-center justify-center ${
                            draggingHandle === 'min' ? 'scale-120 ring-4 ring-forest/20' : ''
                        }`}
                        style={{ left: `${minPercent}%` }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                        
                        {/* Tooltip on drag */}
                        {draggingHandle === 'min' && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-forest text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap pointer-events-none">
                                {minPrice ? `${formatCurrency(minPrice)} €` : '0 €'}
                            </div>
                        )}
                    </button>

                    {/* Right / Max Thumb */}
                    <button
                        type="button"
                        aria-label="Höchstpreis Regler"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingHandle('max');
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-forest shadow-md hover:scale-115 focus:outline-none transition-transform cursor-grab active:cursor-grabbing z-10 flex items-center justify-center ${
                            draggingHandle === 'max' ? 'scale-120 ring-4 ring-forest/20' : ''
                        }`}
                        style={{ left: `${maxPercent}%` }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                        
                        {/* Tooltip on drag */}
                        {draggingHandle === 'max' && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-forest text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap pointer-events-none">
                                {maxPrice ? `${formatCurrency(maxPrice)} €` : `${formatCurrency(maxLimit)} €+`}
                            </div>
                        )}
                    </button>
                </div>

                {/* Min / Max Limit Labels below track */}
                <div className="flex justify-between items-center text-[10px] font-medium text-charcoal/40 mt-2 px-0.5">
                    <span>{minLimit.toLocaleString('de-DE')} €</span>
                    <span>{maxLimit.toLocaleString('de-DE')} €+</span>
                </div>
            </div>

            {/* Quick Presets */}
            {showPresets && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                    {PRESETS.map((preset) => {
                        const active = isPresetActive(preset);
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                    applyPriceChange(preset.min, preset.max);
                                }}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-all cursor-pointer ${
                                    active
                                        ? 'bg-forest text-white border-forest shadow-xs font-bold'
                                        : 'bg-sand/50 text-charcoal/70 border-forest/10 hover:bg-forest/10 hover:text-forest hover:border-forest/20'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

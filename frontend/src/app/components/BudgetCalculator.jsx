'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, Info, Euro } from 'lucide-react';

const DEFAULTS = {
    distance: 600,
    consumption: 10.5,
    fuelPrice: 1.75,
    campsiteCost: 35,
    nights: 5,
    otherBudget: 100,
};

const getSavedVal = (key, defaultVal) => {
    if (typeof window === 'undefined') return defaultVal;
    const saved = localStorage.getItem(`campuna_budget_${key}`);
    return saved !== null ? Number(saved) : defaultVal;
};

export default function BudgetCalculator() {
    const [form, setForm] = useState(() => ({
        distance: getSavedVal('distance', DEFAULTS.distance),
        consumption: getSavedVal('consumption', DEFAULTS.consumption),
        fuelPrice: getSavedVal('fuelPrice', DEFAULTS.fuelPrice),
        campsiteCost: getSavedVal('campsiteCost', DEFAULTS.campsiteCost),
        nights: getSavedVal('nights', DEFAULTS.nights),
        otherBudget: getSavedVal('otherBudget', DEFAULTS.otherBudget),
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;
        Object.entries(form).forEach(([key, val]) => {
            localStorage.setItem(`campuna_budget_${key}`, val);
        });
    }, [form]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: Number(value) || 0 }));
    };

    const { distance, consumption, fuelPrice, campsiteCost, nights, otherBudget } = form;

    const fuelCostTotal = (distance / 100) * consumption * fuelPrice;
    const campsiteCostTotal = campsiteCost * nights;
    const totalCost = fuelCostTotal + campsiteCostTotal + otherBudget;
    const dailyCost = totalCost / Math.max(nights, 1);

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-7 space-y-5 p-4 sm:p-6">
                    <div className="flex items-center gap-2 text-forest mb-2">
                        <Fuel className="w-5 h-5 text-forest" />
                        <h3 className="font-display text-base font-bold">Camping-Reisebudget-Rechner</h3>
                    </div>
                    <p className="font-sans text-[12.5px] text-charcoal/60 leading-relaxed font-light mb-4">
                        Berechne deine Gesamtkosten für Sprit, Übernachtung und Nebenkosten deiner Campingreise.
                    </p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Reiseentfernung (Hin- & Rückfahrt)</span>
                                    <span>{distance} km</span>
                                </div>
                                <input
                                    type="range" min="50" max="4000" step="50"
                                    value={distance} onChange={e => updateField('distance', e.target.value)}
                                    className="w-full accent-forest"
                                />
                                <span className="text-[10px] text-charcoal/50 italic block mt-0.5">
                                    Gesamte Strecke inklusive Hin- & Rückweg sowie Ausflügen
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Anzahl Nächte</span>
                                    <span>{nights} Nächte</span>
                                </div>
                                <input
                                    type="range" min="1" max="60" step="1"
                                    value={nights} onChange={e => updateField('nights', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                    Verbrauch (l/100km)
                                </label>
                                <input
                                    type="number" step="0.1"
                                    value={consumption}
                                    onChange={e => updateField('consumption', e.target.value)}
                                    className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                    Spritpreis (€/l)
                                </label>
                                <input
                                    type="number" step="0.01"
                                    value={fuelPrice}
                                    onChange={e => updateField('fuelPrice', e.target.value)}
                                    className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                    Stellplatz / Nacht (€)
                                </label>
                                <input
                                    type="number"
                                    value={campsiteCost}
                                    onChange={e => updateField('campsiteCost', e.target.value)}
                                    className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                Reise-Extras (Maut, Fähren, Vignetten etc.) (€)
                            </label>
                            <input
                                type="number"
                                value={otherBudget}
                                onChange={e => updateField('otherBudget', e.target.value)}
                                className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                            />
                            <span className="text-[10px] text-charcoal/50 italic block mt-1 leading-snug">
                                Inkl. Maut, Vignetten, Fähren, Parkgebühren, Verpflegung & sonstige Ausgaben
                            </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-forest/10 text-[13px] text-charcoal/50 leading-relaxed flex items-start gap-2">
                            <Info className="w-4 h-4 text-charcoal/40 shrink-0 mt-0.5 hidden sm:block" />
                            <p>
                                <strong>Hinweis:</strong> Diese Berechnung stellt eine unverbindliche Schätzung dar. Die tatsächlichen Reisekosten können je nach Fahrweise, aktuellen Kraftstoffpreisen und individuellen Nebenkosten abweichen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Screen */}
                <div className="lg:col-span-5 bg-sand/30 rounded-3xl p-4 sm:p-6 border border-forest/10 flex flex-col justify-between font-sans">
                    <div>
                        <h4 className="text-xs font-bold text-forest uppercase tracking-[0.2em] mb-4">Kostenschätzung</h4>

                        <div className="space-y-3.5">
                            <div className="flex justify-between items-baseline border-b border-forest/5 pb-2">
                                <span className="text-xs text-charcoal/60">Kraftstoffkosten:</span>
                                <span className="text-sm font-semibold text-charcoal/80">{fuelCostTotal.toFixed(2)} €</span>
                            </div>

                            <div className="flex justify-between items-baseline border-b border-forest/5 pb-2">
                                <span className="text-xs text-charcoal/60">Übernachtungskosten:</span>
                                <span className="text-sm font-semibold text-charcoal/80">{campsiteCostTotal.toFixed(2)} €</span>
                            </div>

                            <div className="flex justify-between items-baseline border-b border-forest/5 pb-2">
                                <span className="text-xs text-charcoal/60">Reise-Extras (Maut, Fähren etc.):</span>
                                <span className="text-sm font-semibold text-charcoal/80">{otherBudget.toFixed(2)} €</span>
                            </div>

                            <div className="flex justify-between items-baseline pt-2">
                                <span className="text-xs text-forest font-bold uppercase tracking-wider">Gesamtbedarf:</span>
                                <span className="text-2xl font-extrabold text-forest">
                                    {totalCost.toFixed(2)} €
                                </span>
                            </div>

                            <div className="bg-white/80 p-3 rounded-2xl border border-forest/10 flex justify-between items-center mt-2">
                                <span className="text-xs text-charcoal/70 font-medium">Durchschnitt pro Tag:</span>
                                <span className="text-sm font-bold text-forest">
                                    {dailyCost.toFixed(2)} € / Tag
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mt-6 p-4 rounded-2xl flex items-start gap-2.5 border bg-emerald-50 border-emerald-100 text-emerald-900 text-xs leading-relaxed">
                            <Euro className="w-4 h-4 shrink-0 mt-0.5 text-forest hidden sm:block" />
                            <div>
                                <strong>Budgetübersicht bereit!</strong>
                                <p className="mt-1 font-light opacity-90">
                                    Für deine {distance} km lange Reise mit {nights} Übernachtungen benötigst du ca. <strong className="font-semibold">{totalCost.toFixed(0)} €</strong> (durchschnittlich ca. <strong className="font-semibold">{dailyCost.toFixed(0)} € pro Tag</strong>).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

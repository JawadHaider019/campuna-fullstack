'use client';

import React, { useState, useEffect } from 'react';
import {
    Scale,
    Info,
    X,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react';

const DEFAULTS = {
    maxWeight: 3500,
    emptyWeight: 2850,
    driverWeight: 75,
    passengers: 1,
    passengersWeight: 75,
    waterWater: 80,
    gasWeight: 22,
    baggage: 150,
    equipment: 80,
};

const getSavedVal = (key, defaultVal) => {
    if (typeof window === 'undefined') return defaultVal;
    const saved = localStorage.getItem(`campuna_payload_${key}`);
    return saved !== null ? Number(saved) : defaultVal;
};

export default function PayloadCalculator() {
    const [activeTooltip, setActiveTooltip] = useState(null);

    const [form, setForm] = useState(() => ({
        maxWeight: getSavedVal('maxWeight', DEFAULTS.maxWeight),
        emptyWeight: getSavedVal('emptyWeight', DEFAULTS.emptyWeight),
        driverWeight: getSavedVal('driverWeight', DEFAULTS.driverWeight),
        passengers: getSavedVal('passengers', DEFAULTS.passengers),
        passengersWeight: getSavedVal('passengersWeight', DEFAULTS.passengersWeight),
        waterWater: getSavedVal('waterWater', DEFAULTS.waterWater),
        gasWeight: getSavedVal('gasWeight', DEFAULTS.gasWeight),
        baggage: getSavedVal('baggage', DEFAULTS.baggage),
        equipment: getSavedVal('equipment', DEFAULTS.equipment),
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;
        Object.entries(form).forEach(([key, val]) => {
            localStorage.setItem(`campuna_payload_${key}`, val);
        });
    }, [form]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: Number(value) || 0 }));
    };

    const {
        maxWeight,
        emptyWeight,
        driverWeight,
        passengers,
        passengersWeight,
        waterWater,
        gasWeight,
        baggage,
        equipment,
    } = form;

    const totalPassengersWeight = passengers * passengersWeight;
    const currentTotalWeight = emptyWeight + driverWeight + totalPassengersWeight + waterWater + gasWeight + baggage + equipment;
    const remainingPayload = maxWeight - currentTotalWeight;
    const weightUsagePercent = maxWeight > 0 ? (currentTotalWeight / maxWeight) * 100 : 0;

    const isOverloaded = remainingPayload < 0;
    const isWarning = remainingPayload >= 0 && remainingPayload < 50;

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Inputs */}
                <div className="lg:col-span-7 space-y-5 p-4 sm:p-6">
                    <div className="flex items-center gap-2 text-forest mb-2">
                        <Scale className="w-5 h-5 text-forest" />
                        <h3 className="font-display text-base font-bold">Wohnmobil / Wohnwagen Zuladung</h3>
                    </div>
                    <p className="font-sans text-[12.5px] text-charcoal/60 leading-relaxed font-light mb-4">
                        Berechne das verbleibende Gewicht deines Fahrzeugs, um Überladung und hohe Bußgelder im Camping-Urlaub zu vermeiden.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Max Weight */}
                        <div className="space-y-1.5 relative">
                            <div className="flex items-center gap-1.5">
                                <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                    Zul. Gesamtgewicht (kg)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setActiveTooltip(activeTooltip === 'maxWeight' ? null : 'maxWeight')}
                                    className="text-forest/60 hover:text-forest transition-colors cursor-pointer p-0.5"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {activeTooltip === 'maxWeight' && (
                                <div className="absolute left-0 top-12 z-30 w-72 p-3 bg-forest text-white text-xs rounded-2xl shadow-xl border border-gold/30 font-sans leading-relaxed">
                                    <div className="flex justify-between items-start mb-1">
                                        <strong className="text-gold font-bold">Zulässiges Gesamtgewicht (z.G.G.)</strong>
                                        <button onClick={() => setActiveTooltip(null)} className="text-white/60 hover:text-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    Das maximale Gesamtgewicht, das dein Fahrzeug inklusive aller Insassen, Gepäck, Flüssigkeiten und Ausrüstung im Straßenverkehr wiegen darf (siehe Fahrzeugschein Feld F.1).
                                </div>
                            )}

                            <input
                                type="number"
                                value={maxWeight}
                                onChange={e => updateField('maxWeight', e.target.value)}
                                className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                            />
                        </div>

                        {/* Empty Weight */}
                        <div className="space-y-1.5 relative">
                            <div className="flex items-center gap-1.5">
                                <label className="block text-[11px] font-bold text-forest uppercase tracking-widest">
                                    Masse fahrbereit (kg)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setActiveTooltip(activeTooltip === 'emptyWeight' ? null : 'emptyWeight')}
                                    className="text-forest/60 hover:text-forest transition-colors cursor-pointer p-0.5"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {activeTooltip === 'emptyWeight' && (
                                <div className="absolute left-0 top-12 z-30 w-72 p-3 bg-forest text-white text-xs rounded-2xl shadow-xl border border-gold/30 font-sans leading-relaxed">
                                    <div className="flex justify-between items-start mb-1">
                                        <strong className="text-gold font-bold">Masse fahrbereit</strong>
                                        <button onClick={() => setActiveTooltip(null)} className="text-white/60 hover:text-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    Das werkseitige Leergewicht des Fahrzeugs inklusive zu 90% gefülltem Kraftstofftank, Fahrer (standardisiert mit 75 kg), gefülltem Frischwassertank und Gasflaschen ab Werk (siehe Fahrzeugschein Feld G).
                                </div>
                            )}

                            <input
                                type="number"
                                value={emptyWeight}
                                onChange={e => updateField('emptyWeight', e.target.value)}
                                className="w-full bg-sand/30 border border-forest/10 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
                            />
                        </div>
                    </div>

                    {/* Cargo Sliders */}
                    <div className="space-y-4 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Fahrer (kg)</span>
                                    <span>{driverWeight} kg</span>
                                </div>
                                <input
                                    type="range" min="50" max="150" step="1"
                                    value={driverWeight} onChange={e => updateField('driverWeight', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Beifahrer / Mitf.</span>
                                    <span>{passengers} Pers.</span>
                                </div>
                                <input
                                    type="range" min="0" max="6" step="1"
                                    value={passengers} onChange={e => updateField('passengers', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Ø Gewicht / Pers.</span>
                                    <span>{passengersWeight} kg</span>
                                </div>
                                <input
                                    type="range" min="40" max="120" step="1"
                                    value={passengersWeight} onChange={e => updateField('passengersWeight', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Wasser (Liter/kg)</span>
                                    <span>{waterWater} kg</span>
                                </div>
                                <input
                                    type="range" min="0" max="250" step="5"
                                    value={waterWater} onChange={e => updateField('waterWater', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Gasflaschen (kg)</span>
                                    <span>{gasWeight} kg</span>
                                </div>
                                <input
                                    type="range" min="0" max="60" step="1"
                                    value={gasWeight} onChange={e => updateField('gasWeight', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Gepäck & Vorräte (kg)</span>
                                    <span>{baggage} kg</span>
                                </div>
                                <input
                                    type="range" min="20" max="500" step="5"
                                    value={baggage} onChange={e => updateField('baggage', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-charcoal/80 font-mono">
                                    <span>Ausrüstung / Stühle (kg)</span>
                                    <span>{equipment} kg</span>
                                </div>
                                <input
                                    type="range" min="0" max="300" step="5"
                                    value={equipment} onChange={e => updateField('equipment', e.target.value)}
                                    className="w-full accent-forest"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-forest/10 text-[13px] text-charcoal/50 leading-relaxed flex items-start gap-2">
                        <Info className="w-4 hidden sm:block h-4 text-charcoal/40 shrink-0 mt-0.5" />
                        <p>
                            <strong>Hinweis:</strong> Diese Berechnung dient lediglich als Orientierungshilfe und ersetzt weder die offiziellen Fahrzeugangaben noch eine tatsächliche Wägung des Fahrzeugs.
                        </p>
                    </div>
                </div>

                {/* Results Screen */}
                <div className="lg:col-span-5 bg-sand/30 rounded-3xl p-4 sm:p-6 border border-forest/10 flex flex-col justify-between font-sans">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-forest uppercase tracking-[0.2em]">Ergebnis</h4>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isOverloaded ? 'bg-rose-600 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                            }`}>
                                {isOverloaded ? 'Überladen' : isWarning ? 'Knapp' : 'Sicher'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline border-b border-forest/5 pb-2">
                                <span className="text-xs text-charcoal/60">Aktuelles Gesamtgewicht:</span>
                                <span className="text-xl font-bold text-forest">{currentTotalWeight} kg</span>
                            </div>

                            <div className="flex justify-between items-baseline border-b border-forest/5 pb-2">
                                <span className="text-xs text-charcoal/60">Zulässiges Limit:</span>
                                <span className="text-sm font-semibold text-charcoal/80">{maxWeight} kg</span>
                            </div>

                            <div className="flex justify-between items-baseline pt-2">
                                <span className="text-xs text-charcoal/60">Verbleibende Reserve:</span>
                                <span className={`text-xl font-extrabold ${
                                    isOverloaded ? 'text-rose-600 animate-pulse' : isWarning ? 'text-amber-600' : 'text-emerald-700'
                                }`}>
                                    {remainingPayload} kg
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 space-y-1.5">
                            <div className="h-3 w-full bg-sand rounded-full overflow-hidden border border-forest/5 relative">
                                <div
                                    className={`h-full transition-all duration-300 rounded-full ${
                                        isOverloaded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(weightUsagePercent, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-charcoal/50">
                                <span>0 kg</span>
                                <span className="font-bold text-forest">{weightUsagePercent.toFixed(0)}% Gesamtkapazität</span>
                                <span>{maxWeight} kg</span>
                            </div>
                        </div>

                        {/* Usage Banner */}
                        <div className="mt-4 p-3 bg-white/80 rounded-2xl border border-forest/10">
                            <p className="text-xs text-charcoal/80 font-medium leading-relaxed">
                                {remainingPayload >= 0 ? (
                                    <>
                                        <strong className={isWarning ? 'text-amber-600' : 'text-emerald-700'}>
                                            {remainingPayload} kg verbleibende Zuladung verfügbar
                                        </strong> ({weightUsagePercent.toFixed(0)}% des Gesamtgewichts genutzt).
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-rose-600">
                                            {Math.abs(remainingPayload)} kg Überladung
                                        </strong> ({weightUsagePercent.toFixed(0)}% des Gesamtgewichts genutzt).
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Status Info Box */}
                    <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border text-xs leading-relaxed transition-all ${
                        isOverloaded ? 'bg-rose-50 border-rose-200 text-rose-900' : isWarning ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                        <div className="p-1.5 hidden sm:block rounded-xl shrink-0 mt-0.5 bg-white/60">
                            {isOverloaded ? (
                                <ShieldAlert className="w-5 h-5 text-rose-600" />
                            ) : isWarning ? (
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                        </div>
                        <div>
                            <strong className="text-sm block mb-0.5">
                                {isOverloaded ? 'Achtung: Dein Fahrzeug ist überladen!' : isWarning ? 'Vorsicht: Sehr knappe Zuladungsreserve!' : 'Gute Fahrt! Alles im grünen Bereich.'}
                            </strong>
                            <p className="font-light opacity-90">
                                {isOverloaded
                                    ? `Du überschreitest das zulässige Gesamtgewicht um ${Math.abs(remainingPayload)} kg. In Deutschland und Europa drohen bei Polizeikontrollen empfindliche Bußgelder und Weiterfahrverbote.`
                                    : isWarning
                                        ? `Die verbleibende Zuladung beträgt nur noch ${remainingPayload} kg. Wenn weitere Personen zusteigen oder Gepäck hinzukommt, riskierst du eine Überladung.`
                                        : 'Deine Zuladung liegt absolut sicher im grünen Bereich. Achte weiterhin auf eine gleichmäßige Gewichtsverteilung.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

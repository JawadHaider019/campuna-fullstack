'use client';

import React, { useState, useRef } from 'react';
import { Bold, Italic, List, Eye, Edit3 } from 'lucide-react';
import FormattedDescription from './FormattedDescription';

export default function DescriptionEditor({
    value = '',
    onChange = () => {},
    placeholder = 'Detaillierte Beschreibung eingeben...',
    rows = 8,
    className = '',
    id = 'listing-description',
    name = 'description',
    disabled = false,
    maxLength,
}) {
    const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
    const textareaRef = useRef(null);

    const applyFormatting = (format) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const text = textarea.value || '';
        const selectedText = text.substring(start, end);

        let replacement = '';
        let newCursorStart = start;
        let newCursorEnd = end;

        if (format === 'bold') {
            if (selectedText) {
                // If already wrapped in **, unwrap
                if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
                    replacement = selectedText.slice(2, -2);
                    newCursorStart = start;
                    newCursorEnd = start + replacement.length;
                } else {
                    replacement = `**${selectedText}**`;
                    newCursorStart = start;
                    newCursorEnd = start + replacement.length;
                }
            } else {
                replacement = '**Fetter Text**';
                newCursorStart = start + 2;
                newCursorEnd = start + 13;
            }
        } else if (format === 'italic') {
            if (selectedText) {
                // If already wrapped in *, unwrap
                if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length >= 2) {
                    replacement = selectedText.slice(1, -1);
                    newCursorStart = start;
                    newCursorEnd = start + replacement.length;
                } else {
                    replacement = `*${selectedText}*`;
                    newCursorStart = start;
                    newCursorEnd = start + replacement.length;
                }
            } else {
                replacement = '*Kursiver Text*';
                newCursorStart = start + 1;
                newCursorEnd = start + 14;
            }
        } else if (format === 'list') {
            if (selectedText) {
                const lines = selectedText.split('\n');
                const isAllPrefixed = lines.every(l => !l.trim() || l.trim().startsWith('- '));
                const formattedLines = lines.map(line => {
                    if (isAllPrefixed) {
                        return line.replace(/^(\s*)-\s+/, '$1');
                    }
                    return line.trim() ? `- ${line}` : line;
                });
                replacement = formattedLines.join('\n');
                newCursorStart = start;
                newCursorEnd = start + replacement.length;
            } else {
                const before = text.substring(0, start);
                const needsNewline = before.length > 0 && !before.endsWith('\n');
                replacement = `${needsNewline ? '\n' : ''}- Neuer Stichpunkt\n`;
                newCursorStart = start + (needsNewline ? 3 : 2);
                newCursorEnd = newCursorStart + 16;
            }
        }

        const newValue = text.substring(0, start) + replacement + text.substring(end);
        onChange(newValue);

        // Restore focus & selection
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(newCursorStart, newCursorEnd);
            }
        }, 10);
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            applyFormatting('bold');
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            applyFormatting('italic');
        }
    };

    return (
        <div className={`description-editor-container border border-beige rounded-2xl bg-[#faf8f3] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-forest/20 focus-within:border-forest ${className}`}>
            {/* ── Toolbar Header ── */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/80 border-b border-beige/60 gap-2 flex-wrap">
                {/* Left: Styling action buttons */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => applyFormatting('bold')}
                        disabled={disabled || activeTab === 'preview'}
                        title="Fett (Strg+B)"
                        aria-label="Fett formatieren"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-charcoal/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline font-bold">Fett</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => applyFormatting('italic')}
                        disabled={disabled || activeTab === 'preview'}
                        title="Kursiv (Strg+I)"
                        aria-label="Kursiv formatieren"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-charcoal/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <Italic className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline italic">Kursiv</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => applyFormatting('list')}
                        disabled={disabled || activeTab === 'preview'}
                        title="Aufzählung / Stichpunkte"
                        aria-label="Liste erstellen"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-charcoal/80 hover:text-forest hover:bg-forest/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Liste</span>
                    </button>
                </div>

                {/* Right: Mode Toggle (Bearbeiten vs. Vorschau) */}
                <div className="flex items-center gap-1 bg-[#f0ede6] p-0.5 rounded-xl text-[11px]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            activeTab === 'edit'
                                ? 'bg-white text-forest shadow-2xs'
                                : 'text-charcoal/60 hover:text-charcoal'
                        }`}
                    >
                        <Edit3 className="w-3 h-3" />
                        <span>Bearbeiten</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            activeTab === 'preview'
                                ? 'bg-white text-forest shadow-2xs'
                                : 'text-charcoal/60 hover:text-charcoal'
                        }`}
                    >
                        <Eye className="w-3 h-3" />
                        <span>Vorschau</span>
                    </button>
                </div>
            </div>

            {/* ── Content Area: Textarea vs. Live Preview ── */}
            {activeTab === 'edit' ? (
                <div>
                    <textarea
                        ref={textareaRef}
                        id={id}
                        name={name}
                        rows={rows}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        className="w-full bg-transparent p-4 text-xs text-charcoal placeholder-charcoal/40 focus:outline-none font-sans leading-relaxed resize-y border-none"
                    />

                    {/* Footer Tips & Character Count */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-beige/40 bg-white/40 text-[11px] text-charcoal/50">
                        <span className="truncate">
                            💡 Formatieren mit <strong>**Fett**</strong>, <em>*Kursiv*</em> oder <strong>-</strong> Stichpunkten (Strg+B / Strg+I)
                        </span>
                        {value && (
                            <span className="font-mono shrink-0 ml-2">
                                {value.length} Zeichen
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 min-h-[180px] bg-white">
                    <div className="flex items-center gap-1.5 pb-2.5 mb-3 border-b border-beige/60 text-[10px] font-bold text-forest uppercase tracking-wider">
                        <Eye className="w-3 h-3 text-gold" />
                        <span>Live-Vorschau (So sieht dein Text im Inserat aus)</span>
                    </div>

                    {value && value.trim() ? (
                        <FormattedDescription content={value} className="text-xs" />
                    ) : (
                        <p className="text-xs text-charcoal/40 italic py-6 text-center">
                            Noch keine Beschreibung eingegeben. Wechsle auf „Bearbeiten“, um Text einzutragen.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

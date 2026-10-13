'use client';

import React, { useMemo } from 'react';

/**
 * Parses inline formatting:
 * - Bold: **text**, __text__, <b>text</b>, <strong>text</strong>
 * - Italic: *text*, _text_, <i>text</i>, <em>text</em>
 * - Bold+Italic: ***text***
 * - Underline: <u>text</u>
 * - Links: [label](url)
 */
function parseInline(text) {
    if (!text) return null;

    const parts = [];
    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|<b>.*?<\/b>|<i>.*?<\/i>|<strong>.*?<\/strong>|<em>.*?<\/em>|<u>.*?<\/u>|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }

        const full = match[0];

        if (full.startsWith('***') && full.endsWith('***') && full.length >= 6) {
            parts.push({ type: 'boldItalic', content: full.slice(3, -3) });
        } else if (full.startsWith('**') && full.endsWith('**') && full.length >= 4) {
            parts.push({ type: 'bold', content: full.slice(2, -2) });
        } else if (full.startsWith('__') && full.endsWith('__') && full.length >= 4) {
            parts.push({ type: 'bold', content: full.slice(2, -2) });
        } else if (full.startsWith('<b>') && full.endsWith('</b>')) {
            parts.push({ type: 'bold', content: full.slice(3, -4) });
        } else if (full.startsWith('<strong>') && full.endsWith('</strong>')) {
            parts.push({ type: 'bold', content: full.slice(8, -9) });
        } else if (full.startsWith('*') && full.endsWith('*') && full.length >= 2) {
            parts.push({ type: 'italic', content: full.slice(1, -1) });
        } else if (full.startsWith('_') && full.endsWith('_') && full.length >= 2) {
            parts.push({ type: 'italic', content: full.slice(1, -1) });
        } else if (full.startsWith('<i>') && full.endsWith('</i>')) {
            parts.push({ type: 'italic', content: full.slice(3, -4) });
        } else if (full.startsWith('<em>') && full.endsWith('</em>')) {
            parts.push({ type: 'italic', content: full.slice(4, -5) });
        } else if (full.startsWith('<u>') && full.endsWith('</u>')) {
            parts.push({ type: 'underline', content: full.slice(3, -4) });
        } else if (full.startsWith('[') && match[2] && match[3]) {
            parts.push({ type: 'link', label: match[2], url: match[3] });
        } else {
            parts.push({ type: 'text', content: full });
        }

        lastIndex = match.index + full.length;
    }

    if (lastIndex < text.length) {
        parts.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return parts.map((p, idx) => {
        switch (p.type) {
            case 'boldItalic':
                return (
                    <strong key={idx} className="font-bold text-slate-900">
                        <em className="italic">{p.content}</em>
                    </strong>
                );
            case 'bold':
                return (
                    <strong key={idx} className="font-bold text-slate-900">
                        {p.content}
                    </strong>
                );
            case 'italic':
                return (
                    <em key={idx} className="italic text-slate-800">
                        {p.content}
                    </em>
                );
            case 'underline':
                return (
                    <span key={idx} className="underline underline-offset-2">
                        {p.content}
                    </span>
                );
            case 'link':
                return (
                    <a
                        key={idx}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-gold underline underline-offset-2 font-medium transition-colors"
                    >
                        {p.label}
                    </a>
                );
            default:
                return <React.Fragment key={idx}>{p.content}</React.Fragment>;
        }
    });
}

/**
 * Parses multi-line description into structured blocks (paragraphs, bullet lists, numbered lists, spacers)
 */
function parseBlocks(rawText) {
    if (!rawText) return [];

    const lines = String(rawText)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n');

    const blocks = [];
    let currentList = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Bullet list items: "- text", "* text", "• text"
        const bulletMatch = trimmed.match(/^([-*•])\s+(.+)$/);
        if (bulletMatch) {
            if (!currentList || currentList.type !== 'bullet') {
                if (currentList) blocks.push(currentList);
                currentList = { type: 'bullet', items: [] };
            }
            currentList.items.push(bulletMatch[2]);
            continue;
        }

        // 2. Numbered list items: "1. text", "2. text"
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numberMatch) {
            if (!currentList || currentList.type !== 'number') {
                if (currentList) blocks.push(currentList);
                currentList = { type: 'number', items: [] };
            }
            currentList.items.push(numberMatch[2]);
            continue;
        }

        // If line is not a list item, flush any open list
        if (currentList) {
            blocks.push(currentList);
            currentList = null;
        }

        // 3. Empty line -> spacer
        if (!trimmed) {
            // Avoid consecutive empty spacers
            if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
                blocks.push({ type: 'spacer' });
            }
            continue;
        }

        // 4. Regular paragraph line
        blocks.push({ type: 'paragraph', text: line });
    }

    if (currentList) {
        blocks.push(currentList);
    }

    return blocks;
}

export default function FormattedDescription({
    content = '',
    className = '',
    compact = false,
}) {
    const blocks = useMemo(() => parseBlocks(content), [content]);

    if (!content || !content.trim()) {
        return (
            <p className={`text-slate-400 italic text-sm ${className}`}>
                Keine Beschreibung angegeben.
            </p>
        );
    }

    return (
        <div className={`campuna-formatted-description font-sans text-slate-700 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed ${className}`}>
            {blocks.map((block, idx) => {
                if (block.type === 'spacer') {
                    return <div key={idx} className="h-2.5" />;
                }

                if (block.type === 'bullet') {
                    return (
                        <ul key={idx} className="my-2.5 space-y-1.5 pl-0.5 list-none">
                            {block.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-forest mt-2 shrink-0 opacity-80" />
                                    <span className="flex-1 leading-relaxed">
                                        {parseInline(item)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'number') {
                    return (
                        <ol key={idx} className="my-2.5 space-y-1.5 pl-0.5 list-none">
                            {block.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-2.5">
                                    <span className="font-mono text-xs font-bold text-forest mt-0.5 shrink-0">
                                        {itemIdx + 1}.
                                    </span>
                                    <span className="flex-1 leading-relaxed">
                                        {parseInline(item)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    );
                }

                return (
                    <p key={idx} className="mb-2 leading-relaxed">
                        {parseInline(block.text)}
                    </p>
                );
            })}
        </div>
    );
}

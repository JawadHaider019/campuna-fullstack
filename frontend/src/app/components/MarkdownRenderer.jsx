'use client';

import React, { useMemo } from 'react';
import { getImageUrl } from '@/utils/imageUrl';

// Converts markdown text to clean sanitized HTML string
function markdownToHtml(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const output = [];
    let i = 0;

    const formatInline = (text) => {
        if (!text) return '';
        let res = text;
        
        // Inline Code: `code`
        res = res.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-forest/5 text-forest font-mono text-xs font-semibold">$1</code>');
        
        // Bold + Italic: ***text***
        res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>');
        
        // Bold: **text** or __text__
        res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-forest">$1</strong>');
        res = res.replace(/__(.*?)__/g, '<strong class="font-bold text-forest">$1</strong>');
        
        // Italic: *text* or _text_
        res = res.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        res = res.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
        
        // 1. Inline Images: ![alt](url) -> MUST be processed before Links
        res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            const resolvedUrl = getImageUrl(url);
            return `<img src="${resolvedUrl}" alt="${alt || ''}" class="rounded-2xl my-4 max-h-[500px] w-full object-cover shadow-md" loading="lazy" />`;
        });

        // 2. Links: [label](url) -> Only matching non-images
        res = res.replace(
            /(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 font-semibold underline decoration-gold/60 underline-offset-2 hover:text-gold transition-colors">$1</a>'
        );
        
        return res;
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Handle Tables
        if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].replace(/\s/g, '').includes('|-')) {
            const tableLines = [];
            let j = i;
            while (j < lines.length && lines[j].trim().startsWith('|')) {
                tableLines.push(lines[j]);
                j++;
            }

            if (tableLines.length >= 2) {
                const headers = tableLines[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
                const rows = tableLines.slice(2).map(row =>
                    row.split('|').filter(c => c.trim() !== '').map(c => c.trim())
                );

                let tableHtml = '<div class="overflow-x-auto my-6 rounded-2xl border border-forest/15 shadow-sm bg-white"><table class="min-w-full divide-y divide-forest/10 text-sm"><thead class="bg-[#002D05] text-white"><tr>';
                for (const h of headers) {
                    tableHtml += `<th class="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-sand">${formatInline(h)}</th>`;
                }
                tableHtml += '</tr></thead><tbody class="divide-y divide-forest/5 bg-white">';
                rows.forEach((row, rIdx) => {
                    const bgClass = rIdx % 2 === 0 ? 'bg-white' : 'bg-forest/[0.02] hover:bg-forest/[0.04] transition-colors';
                    tableHtml += `<tr class="${bgClass}">`;
                    row.forEach(cell => {
                        tableHtml += `<td class="px-5 py-3.5 text-slate-700 font-medium">${formatInline(cell)}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody></table></div>';
                output.push(tableHtml);
                i = j;
                continue;
            }
        }

        // Headings
        if (line.startsWith('# ')) {
            output.push(`<h1 class="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest mt-8 mb-4 tracking-tight leading-tight">${formatInline(line.substring(2))}</h1>`);
        } else if (line.startsWith('## ')) {
            output.push(`<h2 class="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-forest mt-7 mb-3 tracking-tight border-b border-forest/10 pb-2">${formatInline(line.substring(3))}</h2>`);
        } else if (line.startsWith('### ')) {
            output.push(`<h3 class="font-display text-lg sm:text-xl font-bold text-forest/90 mt-5 mb-2">${formatInline(line.substring(4))}</h3>`);
        }

        // Horizontal Rule
        else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            output.push('<hr class="my-8 border-forest/10" />');
        }

        // Blockquotes
        else if (line.startsWith('> ')) {
            output.push(`<blockquote class="my-5 pl-4 py-3 pr-4 border-l-4 border-gold bg-gold/10 rounded-r-2xl text-forest/90 font-medium italic text-base sm:text-lg">${formatInline(line.substring(2))}</blockquote>`);
        }

        // Block Images ![alt](url)
        else if (trimmed.startsWith('![') && trimmed.includes('](')) {
            const altMatch = trimmed.match(/!\[(.*?)\]/);
            const urlMatch = trimmed.match(/\((.*?)\)/);
            if (urlMatch) {
                const alt = altMatch ? altMatch[1] : '';
                const resolvedUrl = getImageUrl(urlMatch[1]);
                output.push(`
                    <div class="my-8">
                        <div class="overflow-hidden rounded-2xl border border-forest/10 shadow-lg bg-slate-50">
                            <img src="${resolvedUrl}" alt="${alt}" class="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500" loading="lazy" />
                        </div>
                        ${alt ? `<p class="text-xs text-slate-500 mt-2 text-center italic font-sans">${alt}</p>` : ''}
                    </div>
                `);
            }
        }

        // Lists & Paragraphs
        else if (trimmed) {
            if (line.startsWith('- ') || line.startsWith('* ')) {
                output.push(`<li class="ml-6 list-disc marker:text-gold text-slate-700 mb-2 leading-relaxed text-base">${formatInline(line.substring(2))}</li>`);
            } else if (/^\d+\.\s/.test(line)) {
                output.push(`<li class="ml-6 list-decimal marker:text-gold font-medium text-slate-700 mb-2 leading-relaxed text-base">${formatInline(line.replace(/^\d+\.\s/, ''))}</li>`);
            } else {
                output.push(`<p class="mb-5 text-slate-700 text-base sm:text-lg leading-relaxed">${formatInline(line)}</p>`);
            }
        } else {
            output.push('<div class="h-2"></div>');
        }

        i++;
    }

    return output.join('\n');
}


export default function MarkdownRenderer({ content }) {
    const html = useMemo(() => markdownToHtml(content || ''), [content]);

    return (
        <div
            className="campuna-markdown-prose text-slate-800 font-sans leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
            suppressHydrationWarning
        />
    );
}

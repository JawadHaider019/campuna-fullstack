'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';

const ROUTE_LABELS = {
    'inserate': 'Inserate',
    'kategorie': 'Kategorien',
    'anbieter': 'Camping-Anbieter',
    'favoriten': 'Merkzettel',
    'all_blogs': 'Magazin',
    'blog': 'Magazin',
    'post': 'Magazin',
    'abo': 'Business-Tarife',
    'kasse': 'Kasse',
    'reisekostenrechner': 'Reisekostenrechner',
    'zuladungsrechner': 'Zuladungsrechner',
    'uber_campuna': 'Über Campuna',
    'anzeige-erstellen': 'Inserat aufgeben',
    'mein-konto': 'Mein Konto',
    'nachrichten': 'Nachrichten',
    'tools': 'Camping-Tools',
    'login': 'Anmelden',
    'register': 'Registrieren',
    'email-bestaetigen': 'E-Mail bestätigen',
    'verify-email': 'E-Mail bestätigen',
    'wohnmobile-camper': 'Wohnmobile & Camper',
    'wohnmobile': 'Wohnmobile & Camper',
    'wohnwagen': 'Wohnwagen',
    'camping-zubehoer': 'Camping Zubehör',
    'zelte-dachzelte': 'Zelte & Dachzelte',
    'fahrraeder-traeger': 'Fahrräder & Träger',
    'stellplaetze-campingplaetze': 'Stellplätze & Campingplätze',
    'admin': 'Admin Panel',
    'meldungen': 'Meldungen',
    'reports': 'Meldungen',
    'entscheidungen': 'KI-Entscheidungen',
    'decisions': 'KI-Entscheidungen',
    'blogs': 'Blog & Ratgeber',
    'rundschreiben': 'Rundschreiben',
    'benutzer': 'Benutzerverwaltung',
    'inserat-erstellen': 'Inserat erstellen'
};

function formatSegmentLabel(segment) {
    if (!segment) return '';
    const cleanSegment = segment.split('?')[0].split('#')[0];
    if (ROUTE_LABELS[cleanSegment]) {
        return ROUTE_LABELS[cleanSegment];
    }
    // Convert hyphenated slugs or ID strings into readable capitalized words
    const readable = cleanSegment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .trim();
    if (!readable) return segment;
    return readable.charAt(0).toUpperCase() + readable.slice(1);
}

/**
 * Universal Breadcrumbs component with SEO Schema.org JSON-LD support
 * 
 * @param {Array<{label: string, href?: string}>} items Optional custom breadcrumbs array
 * @param {'light' | 'dark' | 'pill'} variant Visual theme styling
 * @param {boolean} showHomeIcon Whether to display the Home icon on the first item
 * @param {string} homeLabel Custom home label (default: "Startseite")
 * @param {string} className Additional container classes
 */
export default function Breadcrumbs({
    items,
    variant = 'light',
    showHomeIcon = true,
    homeLabel = 'Startseite',
    className = '',
}) {
    const pathname = usePathname();

    // Generate items from pathname if not explicitly provided
    const breadcrumbItems = React.useMemo(() => {
        if (items && Array.isArray(items) && items.length > 0) {
            return [{ label: homeLabel, href: '/' }, ...items];
        }

        if (!pathname || pathname === '/') {
            return [];
        }

        const segments = pathname.split('/').filter(Boolean);
        const autoItems = [{ label: homeLabel, href: '/' }];
        let currentPath = '';

        segments.forEach((seg, idx) => {
            currentPath += `/${seg}`;
            const isLast = idx === segments.length - 1;
            autoItems.push({
                label: formatSegmentLabel(seg),
                href: isLast ? undefined : currentPath
            });
        });

        return autoItems;
    }, [items, pathname, homeLabel]);

    if (breadcrumbItems.length <= 1) {
        return null;
    }

    // Colors & Styles based on variant
    const isDark = variant === 'dark';
    const isPill = variant === 'pill';

    const containerStyle = isPill
        ? 'inline-flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 rounded-full bg-sand/70 backdrop-blur-md border border-beige/60 shadow-2xs text-[11px] sm:text-xs'
        : 'flex items-center flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium';

    const linkStyle = isDark
        ? 'text-white/70 hover:text-gold transition-colors duration-200 flex items-center gap-1.5'
        : 'text-charcoal/60 hover:text-forest transition-colors duration-200 flex items-center gap-1.5';

    const activeStyle = isDark
        ? 'text-white font-bold truncate max-w-[200px] sm:max-w-[340px] md:max-w-[480px]'
        : 'text-charcoal font-bold truncate max-w-[200px] sm:max-w-[340px] md:max-w-[480px]';

    const separatorColor = isDark ? 'text-gold/50' : 'text-gold-dark/40';

    // JSON-LD Structured Data for Google Rich Snippets
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.label,
            ...(item.href ? { 'item': item.href.startsWith('http') ? item.href : `https://campuna.de${item.href}` } : {})
        }))
    };

    return (
        <>
            {/* SEO Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <nav aria-label="Breadcrumb" className={`select-none ${className}`}>
                <ol className={containerStyle}>
                    {breadcrumbItems.map((crumb, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === breadcrumbItems.length - 1;

                        return (
                            <li key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5 sm:gap-2">
                                {!isFirst && (
                                    <ChevronRight className={`w-3 h-3 ${separatorColor} shrink-0`} aria-hidden="true" />
                                )}

                                {isLast || !crumb.href ? (
                                    <span className={activeStyle} title={crumb.label} aria-current="page">
                                        {isFirst && showHomeIcon && (
                                            <Home className="w-3.5 h-3.5 inline mr-1 -mt-0.5 shrink-0" />
                                        )}
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link href={crumb.href} className={linkStyle} title={crumb.label}>
                                        {isFirst && showHomeIcon && (
                                            <Home className="w-3.5 h-3.5 shrink-0" />
                                        )}
                                        <span className="truncate max-w-[150px] sm:max-w-[240px]">{crumb.label}</span>
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}

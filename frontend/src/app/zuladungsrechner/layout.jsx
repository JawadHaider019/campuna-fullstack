import CampingHelfer from '../components/CampingHelfer';
import { TOOLS_DATA } from '@/data/toolsData';

const tool = TOOLS_DATA.zuladungsrechner;

export const metadata = {
    title: tool.metaTitle || 'Wohnmobil & Wohnwagen Zuladungsrechner | Campuna',
    description: tool.metaDescription || 'Mit dem kostenlosen Campuna Zuladungsrechner berechnest du Leergewicht, Gepäck und Gesamtzuladung.',
    alternates: {
        canonical: `https://campuna.de${tool.canonicalPath}`,
        languages: {
            'de': `https://campuna.de${tool.canonicalPath}`,
            'x-default': `https://campuna.de${tool.canonicalPath}`,
        },
    },
    robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
    },
    openGraph: {
        title: tool.metaTitle,
        description: tool.metaDescription,
        url: `https://campuna.de${tool.canonicalPath}`,
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

export default function ZuladungsrechnerLayout({ children }) {
    const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Startseite',
                item: 'https://campuna.de/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Camping-Tools',
                item: 'https://campuna.de/#tool',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: tool.shortTitle,
                item: `https://campuna.de${tool.canonicalPath}`,
            },
        ],
    };

    const faqPageData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: tool.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPageData) }}
            />
            {children}
        </>
    );
}

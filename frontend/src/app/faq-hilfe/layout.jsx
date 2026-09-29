export const metadata = {
    title: 'Hilfe & FAQ – Campuna Camping-Marktplatz',
    description: 'Hier findest du Antworten auf die häufigsten Fragen rund um Campuna, Inserate, Registrierung, Sicherheit, Boosts und gewerbliche Nutzung.',
    alternates: {
        canonical: 'https://campuna.de/faq-hilfe',
        languages: {
            'de': 'https://campuna.de/faq-hilfe',
            'x-default': 'https://campuna.de/faq-hilfe',
        },
    },
    robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
    },
    openGraph: {
        title: 'Hilfe & FAQ – Campuna Camping-Marktplatz',
        description: 'Antworten auf die häufigsten Fragen rund um den Camping-Marktplatz Campuna.',
        url: 'https://campuna.de/faq-hilfe',
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

export default function FaqHilfeLayout({ children }) {
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
                name: 'Hilfe & FAQ',
                item: 'https://campuna.de/faq-hilfe',
            },
        ],
    };

    const faqPageData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Was ist Campuna?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Campuna ist Deutschlands spezialisierter Camping-Marktplatz für Wohnmobile, Wohnwagen, Campingbusse, Campingzubehör, Stellplätze, Campingplätze, Vermietungen und Dienstleistungen.',
                },
            },
            {
                '@type': 'Question',
                name: 'Für wen ist Campuna geeignet?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Campuna richtet sich an alle Campingbegeisterten – von privaten Campern bis hin zu verifizierten gewerblichen Anbietern, Händlern und Vermietern.',
                },
            },
            {
                '@type': 'Question',
                name: 'Ist Campuna für Privatpersonen kostenlos?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Ja. Für Privatpersonen ist das Inserieren kostenlos. Auch das Suchen und Kontaktieren anderer Nutzer ist uneingeschränkt kostenlos.',
                },
            },
            {
                '@type': 'Question',
                name: 'Wie erstelle ich ein Inserat?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Wähle die passende Kategorie, lade Bilder hoch, ergänze Titel, Beschreibung und Preis und veröffentliche dein Inserat mit wenigen Klicks.',
                },
            },
            {
                '@type': 'Question',
                name: 'Ist Campuna am Kaufvertrag beteiligt?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Nein. Campuna stellt die Plattform bereit und ermöglicht den direkten Kontakt zwischen Käufern und Verkäufern ohne Zwischenhändler.',
                },
            },
        ],
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

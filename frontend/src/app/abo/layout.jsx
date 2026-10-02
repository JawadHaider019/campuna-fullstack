export const metadata = {
    title: 'Campuna Business-Abo | Preise & Tarife für Camping-Anbieter',
    description: 'Mehr Sichtbarkeit, eigenes Firmen-Cover & Logo, Verzeichnis-Präsenz und Lead-Analytics. Starte mit Campuna Business.',
    alternates: {
        canonical: 'https://campuna.de/abo',
        languages: {
            'de': 'https://campuna.de/abo',
            'x-default': 'https://campuna.de/abo',
        },
    },
    robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
    },
    openGraph: {
        title: 'Campuna Business-Abo | Preise & Tarife für Camping-Anbieter',
        description: 'Professionelle Werkzeuge für Händler, Vermieter, Werkstätten und Campingplätze.',
        url: 'https://campuna.de/abo',
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

export default function AboLayout({ children }) {
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
                name: 'Business-Tarife',
                item: 'https://campuna.de/abo',
            },
        ],
    };

    const productData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Campuna Business-Abonnement',
        description: 'Professionelles Firmenprofil mit Lead-Analytics, Cover-Image und Händlerverzeichnis-Präsenz.',
        image: 'https://campuna.de/hero-campuna.webp',
        offers: {
            '@type': 'Offer',
            price: '29.00',
            priceCurrency: 'EUR',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            url: 'https://campuna.de/abo',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(productData) }}
            />
            {children}
        </>
    );
}

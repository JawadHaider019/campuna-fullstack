export const metadata = {
    title: 'So funktioniert Campuna | Dein Camping-Marktplatz',
    description: 'Erfahre, wie einfach Campuna funktioniert: Kostenlos registrieren, Campingausrüstung oder Fahrzeuge inserieren, direkt mit Campern handeln. Fair, transparent und ohne Zwischenhändler.',
    alternates: {
        canonical: 'https://campuna.de/so-funktioniert-campuna',
        languages: {
            'de': 'https://campuna.de/so-funktioniert-campuna',
            'x-default': 'https://campuna.de/so-funktioniert-campuna',
        },
    },
    robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
    },
    openGraph: {
        title: 'So funktioniert Campuna | Dein Camping-Marktplatz',
        description: 'Campingausrüstung und Wohnmobile einfach kaufen, verkaufen und vermieten. Schritt für Schritt erklärt.',
        url: 'https://campuna.de/so-funktioniert-campuna',
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

export default function SoFunktioniertCampunaLayout({ children }) {
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
                name: 'So funktioniert Campuna',
                item: 'https://campuna.de/so-funktioniert-campuna',
            },
        ],
    };

    const howToData = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'So funktioniert der Camping-Marktplatz Campuna',
        description: 'In 3 einfachen Schritten Campingausrüstung, Wohnmobile oder Wohnwagen auf Campuna kaufen, verkaufen oder vermieten.',
        totalTime: 'PT5M',
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: 'Registrieren & E-Mail bestätigen',
                text: 'Erstelle kostenlos ein Konto und bestätige deine E-Mail-Adresse in unter zwei Minuten.',
                url: 'https://campuna.de/registrieren',
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: 'Anzeige erstellen oder Angebote entdecken',
                text: 'Stelle deine Campingausrüstung ein oder durchsuche aktuelle Angebote. Fotos hochladen, Beschreibung hinzufügen und Preis festlegen.',
                url: 'https://campuna.de/anzeige-erstellen',
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: 'Direkt kontaktieren & verhandeln',
                text: 'Schreibe Anbietern direkt über das integrierte Nachrichtensystem und wickle den Deal ohne Zwischenhändler ab.',
                url: 'https://campuna.de/inserate',
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
                dangerouslySetInnerHTML={{ __html: safeJsonLd(howToData) }}
            />
            {children}
        </>
    );
}

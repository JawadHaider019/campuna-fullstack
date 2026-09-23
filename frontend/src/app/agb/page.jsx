import AgbClient from './AgbClient';

export const metadata = {
    title: 'Allgemeine Geschäftsbedingungen (AGB) – Campuna',
    description: 'Allgemeine Geschäftsbedingungen (AGB) für die Nutzung der Vermittlungsplattform Campuna.',
    openGraph: {
        title: 'Allgemeine Geschäftsbedingungen (AGB) – Campuna',
        description: 'Verbindliche AGB für Nutzer, Käufer und Verkäufer auf Campuna.',
        url: 'https://campuna.de/agb',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function AgbPage() {
    return <AgbClient />;
}

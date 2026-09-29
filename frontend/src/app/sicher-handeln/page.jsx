import SicherHandelnClient from './SicherHandelnClient';

export const metadata = {
    title: 'Sicher handeln auf Campuna | Dein Camping-Marktplatz',
    description: 'Tipps und Leitlinien für sicheres, faires und respektvolles Kaufen und Verkaufen von Campingausrüstung und Fahrzeugen auf Campuna.',
    alternates: {
        canonical: 'https://campuna.de/sicher-handeln',
        languages: {
            'de': 'https://campuna.de/sicher-handeln',
            'x-default': 'https://campuna.de/sicher-handeln',
        },
    },
    openGraph: {
        title: 'Sicher handeln auf Campuna | Dein Camping-Marktplatz',
        description: 'Tipps und Leitlinien für sicheres und faires Kaufen und Verkaufen von Campern für Camper.',
        url: 'https://campuna.de/sicher-handeln',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function SicherHandelnPage() {
    return <SicherHandelnClient />;
}

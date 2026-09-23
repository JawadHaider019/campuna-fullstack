import SicherHandelnClient from './SicherHandelnClient';

export const metadata = {
    title: 'Sicher handeln auf Campuna – Dein sicherer Camping-Marktplatz',
    description: 'Tipps und Leitlinien für sicheres, faires und respektvolles Kaufen und Verkaufen von Campingausrüstung und Fahrzeugen auf Campuna.',
    openGraph: {
        title: 'Sicher handeln auf Campuna',
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

import HowCampunaWorksClient from '../how_campuna_works/HowCampunaWorksClient';

export const metadata = {
    title: 'So funktioniert Campuna – Deutschlands Camping-Marktplatz',
    description: 'Erfahre, wie einfach Campuna funktioniert: Kostenlos registrieren, Campingausrüstung oder Fahrzeuge inserieren, direkt mit Campern handeln. Fair, transparent und ohne Zwischenhändler.',
    openGraph: {
        title: 'So funktioniert Campuna – Deutschlands Camping-Marktplatz',
        description: 'Campingausrüstung und Wohnmobile einfach kaufen, verkaufen und vermieten. Schritt für Schritt erklärt.',
        url: 'https://campuna.de/so-funktioniert-campuna',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function SoFunktioniertCampunaPage() {
    return <HowCampunaWorksClient />;
}

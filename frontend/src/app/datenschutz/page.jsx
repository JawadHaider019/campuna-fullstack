import DatenschutzClient from './DatenschutzClient';

export const metadata = {
    title: 'Datenschutzerklärung – Campuna',
    description: 'Informationen zum Schutz personenbezogener Daten und der Datenverarbeitung auf der Plattform Campuna.',
    openGraph: {
        title: 'Datenschutzerklärung – Campuna',
        description: 'Transparente Informationen über den Umgang mit personenbezogenen Daten auf Campuna.',
        url: 'https://campuna.de/datenschutz',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function DatenschutzPage() {
    return <DatenschutzClient />;
}

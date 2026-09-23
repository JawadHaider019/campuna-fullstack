import DatenschutzClient from '../datenschutz/DatenschutzClient';

export const metadata = {
    title: 'Datenschutzerklärung – Campuna',
    description: 'Informationen zum Schutz personenbezogener Daten auf Campuna.',
};

export default function LegacyDatenschutzPage() {
    return <DatenschutzClient />;
}

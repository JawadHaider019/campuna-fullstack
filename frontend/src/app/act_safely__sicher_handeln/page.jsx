import SicherHandelnClient from '../sicher-handeln/SicherHandelnClient';

export const metadata = {
    title: 'Sicher handeln auf Campuna',
    description: 'Sicher und fair handeln auf Campuna.',
};

export default function LegacySicherHandelnPage() {
    return <SicherHandelnClient />;
}

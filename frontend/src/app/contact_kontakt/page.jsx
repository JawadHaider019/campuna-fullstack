import KontaktClient from '../kontakt/KontaktClient';

export const metadata = {
    title: 'Kontakt – Campuna Camping-Marktplatz',
    description: 'Schreib uns gerne. Wir lesen jede Nachricht.',
};

export default function LegacyContactPage() {
    return <KontaktClient />;
}

import KontaktClient from './KontaktClient';

export const metadata = {
    title: 'Kontakt – Campuna Camping-Marktplatz',
    description: 'Schreib uns gerne. Wir lesen jede Nachricht. Ob Frage, Feedback oder Idee zu Campuna – wir freuen uns auf deine Nachricht.',
    openGraph: {
        title: 'Kontakt – Campuna',
        description: 'Kontaktiere das Team von Campuna schnell und direkt per Formular oder E-Mail an kontakt@campuna.de.',
        url: 'https://campuna.de/kontakt',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function KontaktPage() {
    return <KontaktClient />;
}

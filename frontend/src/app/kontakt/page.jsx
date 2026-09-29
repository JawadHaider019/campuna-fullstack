import KontaktClient from './KontaktClient';

export const metadata = {
    title: 'Kontakt & Feedback – Campuna Camping-Marktplatz',
    description: 'Schreib uns gerne. Ob Frage, Feedback, Ideen für neue Funktionen oder gewerbliche Anfragen zu Campuna – wir freuen uns auf deine Nachricht.',
    openGraph: {
        title: 'Kontakt & Feedback – Campuna',
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

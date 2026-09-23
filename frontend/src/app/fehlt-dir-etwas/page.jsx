import FeedbackClient from './FeedbackClient';

export const metadata = {
    title: 'Fehlt dir etwas? Sag es uns – Feedback zu Campuna',
    description: 'Campuna wächst Schritt für Schritt mit euren Ideen. Vermisst du eine Funktion oder hast Vorschläge für neue Kategorien? Sag es uns gerne!',
    openGraph: {
        title: 'Fehlt dir etwas? Sag es uns – Campuna',
        description: 'Feedback & Ideen für die Weiterentwicklung von Campuna.',
        url: 'https://campuna.de/fehlt-dir-etwas',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function FeedbackPage() {
    return <FeedbackClient />;
}

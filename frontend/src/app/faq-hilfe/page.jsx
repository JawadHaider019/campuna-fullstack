import FaqHilfeClient from './FaqHilfeClient';

export const metadata = {
    title: 'Hilfe & FAQ – Campuna Camping-Marktplatz',
    description: 'Hier findest du Antworten auf die häufigsten Fragen rund um Campuna, Inserate, Registrierung, Sicherheit und Nutzung.',
    openGraph: {
        title: 'Hilfe & FAQ – Campuna',
        description: 'Antworten auf die häufigsten Fragen rund um den Camping-Marktplatz Campuna.',
        url: 'https://campuna.de/faq-hilfe',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function FaqHilfePage() {
    return <FaqHilfeClient />;
}

import FaqHilfeClient from '../faq-hilfe/FaqHilfeClient';

export const metadata = {
    title: 'Hilfe & FAQ – Campuna Camping-Marktplatz',
    description: 'Hier findest du Antworten auf die häufigsten Fragen rund um Campuna, Inserate, Registrierung, Sicherheit und Nutzung.',
};

export default function LegacyFaqHilfePage() {
    return <FaqHilfeClient />;
}

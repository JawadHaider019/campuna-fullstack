import ImpressumClient from './ImpressumClient';

export const metadata = {
    title: 'Impressum – Campuna',
    description: 'Impressum und rechtliche Angaben gemäß § 5 DDG und § 18 Abs. 2 MStV für die Plattform Campuna.',
    openGraph: {
        title: 'Impressum – Campuna',
        description: 'Rechtliche Anbieterkennzeichnung der Plattform Campuna.',
        url: 'https://campuna.de/impressum',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function ImpressumPage() {
    return <ImpressumClient />;
}

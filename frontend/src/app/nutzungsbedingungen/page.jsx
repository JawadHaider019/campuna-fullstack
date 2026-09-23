import NutzungsbedingungenClient from './NutzungsbedingungenClient';

export const metadata = {
    title: 'Nutzungsbedingungen & Plattformregeln – Campuna',
    description: 'Nutzungsbedingungen und Plattformregeln für eine sichere und faire Nutzung des Camping-Marktplatzes Campuna.',
    openGraph: {
        title: 'Nutzungsbedingungen / Plattformregeln – Campuna',
        description: 'Regelungen zur Nutzung, Pflichten der Nutzer, Sicherheitsrichtlinien sowie DSA/DDG-Anforderungen auf Campuna.',
        url: 'https://campuna.de/nutzungsbedingungen',
        siteName: 'Campuna',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function NutzungsbedingungenPage() {
    return <NutzungsbedingungenClient />;
}

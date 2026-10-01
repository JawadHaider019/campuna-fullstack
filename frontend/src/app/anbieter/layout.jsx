export const metadata = {
  title: 'Camping-Anbieter & Händler | Campuna',
  description: 'Finde Fachhändler, Ausbauer, Werkstätten, Vermieter und Campingplatzbetreiber in ganz Deutschland auf Campuna.',
  openGraph: {
    title: 'Camping-Anbieter & Fachhändler | Campuna',
    description: 'Entdecke Camping-Anbieter und Gewerbetreibende in ganz Deutschland.',
    url: 'https://campuna.de/anbieter',
    siteName: 'Campuna',
    locale: 'de_DE',
    type: 'website',
  },
  alternates: {
    canonical: 'https://campuna.de/anbieter',
  },
};

export default function AnbieterLayout({ children }) {
  return children;
}

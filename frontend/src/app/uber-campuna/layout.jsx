export const metadata = {
  title: 'Über Campuna | Der Camping-Marktplatz für Deutschland',
  description: 'Warum es Campuna gibt, wofür wir stehen und wie unser Camping-Marktplatz wächst. Lerne die Idee hinter Campuna aus Erfurt kennen und mach mit.',
  alternates: {
    canonical: 'https://campuna.de/ueber-uns',
    languages: {
      'de': 'https://campuna.de/ueber-uns',
      'x-default': 'https://campuna.de/ueber-uns',
    },
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
  },
  openGraph: {
    type: 'website',
    siteName: 'Campuna',
    locale: 'de_DE',
    title: 'Über Campuna | Der Camping-Marktplatz für Deutschland',
    description: 'Warum es Campuna gibt, wofür wir stehen und wie unser Camping-Marktplatz wächst. Lerne die Idee hinter Campuna kennen.',
    url: 'https://campuna.de/ueber-uns',
    images: [
      {
        url: 'https://campuna.de/assets/og/campuna-og-ueber-uns.jpg',
        width: 1200,
        height: 630,
        alt: 'Über Campuna',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Über Campuna | Der Camping-Marktplatz für Deutschland',
    description: 'Warum es Campuna gibt, wofür wir stehen und wie unser Camping-Marktplatz wächst. Lerne die Idee hinter Campuna kennen.',
    images: ['https://campuna.de/assets/og/campuna-og-ueber-uns.jpg'],
  },
};

// Helper to escape characters for safe JSON-LD embedding (XSS protection)
function safeJsonLd(obj) {
  if (!obj) return '{}';
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export default function UberCampunaLayout({ children }) {
  const breadcrumbsData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Startseite',
        item: 'https://campuna.de/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Über Campuna',
        item: 'https://campuna.de/ueber-uns',
      },
    ],
  };

  const aboutPageData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://campuna.de/ueber-uns#aboutpage',
    url: 'https://campuna.de/ueber-uns',
    name: 'Über Campuna',
    inLanguage: 'de-DE',
    isPartOf: { '@id': 'https://campuna.de/#website' },
    about: { '@id': 'https://campuna.de/#organization' },
    description: 'Warum es Campuna gibt, wofür wir stehen und wie unser Camping-Marktplatz für Deutschland wächst.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(aboutPageData),
        }}
      />
      {children}
    </>
  );
}

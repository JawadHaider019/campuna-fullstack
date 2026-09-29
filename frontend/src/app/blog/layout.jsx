export const metadata = {
  title: 'Camping-Ratgeber & Magazin | Campuna',
  description: 'Praxisnahe Anleitungen, Kaufberatung für Wohnmobile, Zuladungstipps, Checklisten und Expertenwissen für deinen Campingurlaub auf Campuna.',
  alternates: {
    canonical: 'https://campuna.de/blog',
    languages: {
      'de': 'https://campuna.de/blog',
      'x-default': 'https://campuna.de/blog',
    },
  },
  openGraph: {
    title: 'Camping-Ratgeber & Magazin | Campuna',
    description: 'Praxisnahe Anleitungen, Kaufberatung für Wohnmobile, Zuladungstipps und Expertenwissen.',
    url: 'https://campuna.de/blog',
    siteName: 'Campuna',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function BlogLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
                name: 'Ratgeber & Magazin',
                item: 'https://campuna.de/blog',
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

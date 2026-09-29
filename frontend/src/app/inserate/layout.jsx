export const metadata = {
  title: 'Camping-Inserate aus ganz Deutschland | Campuna',
  description: 'Aktuelle Camping-Inserate für Wohnmobile, Wohnwagen, Zubehör, Stellplätze, Services und mehr. Angebote von privat und vom Händler, täglich neu.',
  alternates: {
    canonical: 'https://campuna.de/inserate',
    languages: {
      'de': 'https://campuna.de/inserate',
      'x-default': 'https://campuna.de/inserate',
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
    title: 'Camping-Inserate aus ganz Deutschland | Campuna',
    description: 'Aktuelle Camping-Inserate für Wohnmobile, Wohnwagen, Zubehör, Stellplätze, Services und mehr. Von privat und vom Händler.',
    url: 'https://campuna.de/inserate',
    images: [
      {
        url: 'https://campuna.de/assets/og/campuna-og-inserate.jpg',
        width: 1200,
        height: 630,
        alt: 'Camping-Inserate aus ganz Deutschland',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function InserateLayout({ children }) {
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
                name: 'Inserate',
                item: 'https://campuna.de/inserate',
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': 'https://campuna.de/inserate#collection',
            url: 'https://campuna.de/inserate',
            name: 'Camping-Inserate aus ganz Deutschland',
            inLanguage: 'de-DE',
            isPartOf: { '@id': 'https://campuna.de/#website' },
            about: { '@id': 'https://campuna.de/#organization' },
            mainEntity: {
              '@type': 'ItemList',
              itemListOrder: 'https://schema.org/ItemListOrderDescending',
              numberOfItems: 9,
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Wohnmobile & Camper',
                  url: 'https://campuna.de/kategorie/wohnmobile-camper',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Camping Zubehör',
                  url: 'https://campuna.de/kategorie/camping-zubehoer',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'Zelte & Dachzelte',
                  url: 'https://campuna.de/kategorie/zelte-dachzelte',
                },
              ],
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': 'https://campuna.de/inserate#faq',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Wie finde ich das passende Camping-Inserat?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Nutze die Filter auf dieser Seite: Suche nach Marke, Modell oder Stichwort, grenze den Preis ein und wähle Kategorie, Anbieter und Ort. Mit der Sortierung siehst du die neuesten oder günstigsten Angebote zuerst. Über die Kategorien unten kommst du direkt zu Wohnmobilen, Zelten, Zubehör und mehr.',
                },
              },
              {
                '@type': 'Question',
                name: 'Was bedeutet Privat oder Gewerblich bei einem Inserat?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Privat bedeutet, dass eine Privatperson verkauft, meist ohne Gewährleistung. Gewerblich bedeutet, dass ein Händler oder Dienstleister mit Firmenprofil anbietet. Auf Campuna findest du beide Arten von Anbietern und kannst gezielt danach filtern.',
                },
              },
              {
                '@type': 'Question',
                name: 'Was bedeutet VB beim Preis?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'VB steht für Verhandlungsbasis. Der angegebene Preis ist ein Vorschlag des Anbieters, über den du fair verhandeln kannst. Nutze dafür die direkte Nachricht an den Verkäufer und vereinbare am besten eine Besichtigung vor dem Kauf.',
                },
              },
              {
                '@type': 'Question',
                name: 'Wie erstelle ich selbst ein Inserat auf Campuna?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Lege ein kostenloses Konto an, wähle die passende Kategorie und stelle dein Angebot mit Fotos, Beschreibung und Preis ein. Private Inserate sind kostenlos, ohne Provision. Eine Anleitung findest du unter So funktioniert Campuna.',
                },
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

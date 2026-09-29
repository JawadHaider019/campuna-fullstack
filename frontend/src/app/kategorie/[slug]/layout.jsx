import { CATEGORIES } from '@/data';

const SLUG_TO_CATEGORY = {
  'ausrüstung-und-zubehör': 'Camping Zubehör',
  'ausruestung-und-zubehoer': 'Camping Zubehör',
  'camping-zubehoer': 'Camping Zubehör',
  'zubehoer': 'Camping Zubehör',
  'fahrzeuge': 'Wohnmobile & Camper',
  'wohnmobile-camper': 'Wohnmobile & Camper',
  'wohnmobile': 'Wohnmobile & Camper',
  'zelte-and-dachzelte': 'Zelte & Dachzelte',
  'zelte-dachzelte': 'Zelte & Dachzelte',
  'zelte': 'Zelte & Dachzelte',
  'fahrräder-träger': 'Fahrräder & Träger',
  'fahrraeder-traeger': 'Fahrräder & Träger',
  'campingplätze-stellplätze': 'Stellplätze & Campingplätze',
  'campingplaetze-stellplaetze': 'Stellplätze & Campingplätze',
  'stellplaetze': 'Stellplätze & Campingplätze',
  'dienstleistungen': 'Camping Services',
  'camping-services': 'Camping Services',
  'services': 'Camping Services',
  'tiny-houses': 'Tiny Houses',
  'mieten-vermieten': 'Mieten & Vermieten',
  'mieten': 'Mieten & Vermieten',
  'boote-wassersport': 'Boote & Wassersport',
  'boote': 'Boote & Wassersport',
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).toLowerCase();
  const categoryName = SLUG_TO_CATEGORY[normalizedSlug] || normalizedSlug;
  const category = CATEGORIES.find(
    (c) => c.slug === normalizedSlug || c.name.toLowerCase() === categoryName.toLowerCase()
  );

  const title = category?.metaTitle || `${category?.heroTitle || categoryName} | Campuna`;
  const description = category?.metaDescription || category?.heroSubtitle || `Entdecke aktuelle Angebote in der Kategorie ${categoryName} auf Campuna.`;
  const canonicalUrl = `https://campuna.de/kategorie/${normalizedSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'de': canonicalUrl,
        'x-default': canonicalUrl,
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
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default async function CategoryLayout({ children, params }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).toLowerCase();
  const categoryName = SLUG_TO_CATEGORY[normalizedSlug] || normalizedSlug;
  const category = CATEGORIES.find(
    (c) => c.slug === normalizedSlug || c.name.toLowerCase() === categoryName.toLowerCase()
  );

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
                name: 'Kategorien',
                item: 'https://campuna.de/kategorien',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: category?.name || categoryName,
                item: `https://campuna.de/kategorie/${normalizedSlug}`,
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

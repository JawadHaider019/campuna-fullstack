function slugifyTitle(title = '') {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  let listing = null;

  try {
    const res = await fetch(`${apiBase}/listings/${encodeURIComponent(decodedSlug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      listing = data.listing || data.data?.listing || data.data || null;
    }
  } catch (e) {
    // API error fallback
  }

  const title = listing?.title ? `${listing.title} | Campuna` : 'Camping-Inserat | Campuna';
  const rawDesc = listing?.description ? listing.description.replace(/\n+/g, ' ').slice(0, 150) : 'Camping-Angebot auf Campuna entdecken.';
  const description = `${rawDesc}... Jetzt auf Campuna ansehen.`;
  const canonicalUrl = `https://campuna.de/inserate/${encodeURIComponent(slug)}`;
  const imageUrl = listing?.images?.[0] || 'https://campuna.de/assets/og/campuna-og-inserate.jpg';

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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: listing?.title || 'Camping-Inserat',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ListingDetailLayout({ children, params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

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
              {
                '@type': 'ListItem',
                position: 3,
                name: decodedSlug,
                item: `https://campuna.de/inserate/${encodeURIComponent(slug)}`,
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

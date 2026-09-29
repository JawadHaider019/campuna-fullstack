import { BLOG_POSTS as FALLBACK_POSTS } from '@/data';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  let post = null;

  try {
    const res = await fetch(`${apiBase}/posts/public/${encodeURIComponent(decodedSlug)}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      post = data.post || data.data?.post || null;
    }
  } catch (e) {
    // API error fallback
  }

  if (!post) {
    post = FALLBACK_POSTS.find((p) => p.slug === decodedSlug || p.id === decodedSlug);
  }

  const title = post?.title ? `${post.title} | Campuna Ratgeber` : 'Camping-Ratgeber | Campuna';
  const description = post?.excerpt || 'Ratgeber & Expertenwissen rund ums Camping auf Campuna.';
  const canonicalUrl = `https://campuna.de/blog/${encodeURIComponent(slug)}`;
  const imageUrl = post?.image_url || post?.image || 'https://campuna.de/assets/og/campuna-og-startseite.jpg';

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
      type: 'article',
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
          alt: post?.title || 'Campuna Ratgeber',
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

export default async function SingleBlogLayout({ children, params }) {
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
                name: 'Ratgeber',
                item: 'https://campuna.de/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: decodedSlug,
                item: `https://campuna.de/blog/${encodeURIComponent(slug)}`,
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://campuna.de';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/mein-konto',
          '/mein-konto/*',
          '/api/*',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { CATEGORIES } from '@/data';

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

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://campuna.de';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 1. Static Core Pages
  const staticRoutes = [
    '',
    '/kategorien',
    '/inserate',
    '/anbieter',
    '/so-funktioniert-campuna',
    '/uber-campuna',
    '/sicher-handeln',
    '/abo',
    '/boosten',
    '/reisekostenrechner',
    '/zuladungsrechner',
    '/faq-hilfe',
    '/kontakt',
    '/impressum',
    '/datenschutz',
    '/agb',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/inserate' || route === '/kategorien' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : (route === '/inserate' || route === '/kategorien') ? 0.9 : 0.7,
  }));

  // 2. Category Pages
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/kategorie/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // 3. Dynamic Listings
  let listingRoutes = [];
  try {
    const res = await fetch(`${apiBase}/listings`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const listings = data.listings || data.data?.listings || [];
      listingRoutes = listings
        .filter((l) => l.status !== 'GELÖSCHT' && l.status !== 'DELETED')
        .map((l) => {
          const slug = l.slug || (l.title ? slugifyTitle(l.title) : l.id);
          return {
            url: `${baseUrl}/inserate/${encodeURIComponent(slug)}`,
            lastModified: l.updatedAt ? new Date(l.updatedAt) : new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          };
        });
    }
  } catch (err) {
    console.error('Error fetching listings for sitemap:', err);
  }

  // 4. Dynamic Dealer Profiles
  let dealerRoutes = [];
  try {
    const res = await fetch(`${apiBase}/dealers`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const dealers = data.dealers || data.data?.dealers || [];
      dealerRoutes = dealers.map((d) => {
        const nameSlug = slugifyTitle(d.company_name || d.name || 'anbieter');
        return {
          url: `${baseUrl}/anbieter/${nameSlug}-${d.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching dealers for sitemap:', err);
  }

  return [...staticRoutes, ...categoryRoutes, ...listingRoutes, ...dealerRoutes];
}

/** @type {import('next').NextConfig} */
const backendDestination = process.env.BACKEND_INTERNAL_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      // Standardize Auth
      {
        source: '/register',
        destination: '/registrieren',
        permanent: true,
      },
      {
        source: '/anmelden',
        destination: '/login',
        permanent: true,
      },
      // Consolidate English/Legacy URLs to Clean German URLs
      {
        source: '/how_campuna_works',
        destination: '/so-funktioniert-campuna',
        permanent: true,
      },
      {
        source: '/contact_kontakt',
        destination: '/kontakt',
        permanent: true,
      },
      {
        source: '/faq_hilfe',
        destination: '/faq-hilfe',
        permanent: true,
      },
      {
        source: '/missing_anything__fehlt_dir_etwas',
        destination: '/fehlt-dir-etwas',
        permanent: true,
      },
      {
        source: '/act_safely__sicher_handeln',
        destination: '/sicher-handeln',
        permanent: true,
      },
      {
        source: '/uber_campuna',
        destination: '/uber-campuna',
        permanent: true,
      },
      {
        source: '/ueber-uns',
        destination: '/uber-campuna',
        permanent: false,
      },
      {
        source: '/post/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/all_blogs',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendDestination}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;


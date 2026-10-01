import React from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Search, 
  Home, 
  PlusCircle, 
  Caravan, 
  Tent, 
  Truck, 
  MapPin, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export const metadata = {
  title: '404 - Seite nicht gefunden | Campuna',
  description: 'Die gewünschte Camping-Seite oder das Inserat konnte leider nicht gefunden werden. Entdecke tausende Wohnmobile, Wohnwagen und Camping-Zubehör auf Campuna.',
  robots: {
    index: false,
    follow: true,
  },
};

const POPULAR_CATEGORIES = [
  { name: 'Wohnmobile', href: '/inserate?category=Wohnmobile', icon: Truck },
  { name: 'Wohnwagen', href: '/inserate?category=Wohnwagen', icon: Caravan },
  { name: 'Campingbusse / Vans', href: '/inserate?category=Campingbusse', icon: Truck },
  { name: 'Vorzelte & Markisen', href: '/inserate?category=Vorzelte+%26+Markisen', icon: Tent },
  { name: 'Campingzubehör', href: '/inserate?category=Zubeh%C3%B6r', icon: Compass },
  { name: 'Stellplätze', href: '/inserate?category=Stellpl%C3%A4tze', icon: MapPin },
];

export default function NotFound() {
  return (
    <main className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-sand/50 via-white to-sand/20">
      <div className="max-w-3xl w-full text-center space-y-10">
        
        {/* Visual 404 Hero Illustration & Badge */}
        <div className="space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <span className="text-8xl sm:text-9xl font-extrabold tracking-tighter text-gray-100 select-none font-display">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-forest/10 border border-forest/20 flex items-center justify-center text-forest shadow-lg shadow-forest/10 transform hover:scale-105 transition-transform duration-300">
                <Compass className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.75] animate-spin-slow" style={{ animationDuration: '20s' }} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest tracking-wide uppercase">
              Vom Weg abgekommen?
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-charcoal font-display">
              Hier ist kein Campingplatz in Sicht!
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              Die von dir gesuchte Seite existiert nicht oder wurde verschoben. Keine Sorge – dein nächstes Camping-Abenteuer wartet bereits auf dich.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/inserate"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-forest text-white font-medium hover:bg-forest/90 transition-all duration-200 shadow-md shadow-forest/20 active:scale-[0.98]"
          >
            <Search className="w-5 h-5" />
            <span>Marktplatz durchstöbern</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-charcoal font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <Home className="w-5 h-5 text-gray-500" />
            <span>Zur Startseite</span>
          </Link>

          <Link
            href="/anzeige-erstellen"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gold/20 text-gold-dark font-medium border border-gold/30 hover:bg-gold/30 transition-all duration-200 active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5 text-gold-dark" />
            <span>Kostenlos inserieren</span>
          </Link>
        </div>

        {/* Popular Categories Grid */}
        <div className="pt-8 border-t border-gray-200/80 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Beliebte Camping-Kategorien
            </h2>
            <Link 
              href="/kategorien" 
              className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1"
            >
              <span>Alle Kategorien</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-200/90 hover:border-forest/40 hover:shadow-sm hover:bg-sand/30 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-sand flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-colors">
                    <Icon className="w-4.5 h-4.5 stroke-[1.75]" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-charcoal group-hover:text-forest transition-colors truncate">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Help & Support Footer Link */}
        <div className="pt-2 text-center">
          <Link
            href="/faq-hilfe"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-forest transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span>Suchst du etwas Bestimmtes? Besuche unsere Hilfe & FAQ</span>
          </Link>
        </div>

      </div>
    </main>
  );
}

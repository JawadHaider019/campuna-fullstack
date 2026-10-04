const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'new content');

const CATEGORY_DEFINITIONS = [
  {
    id: '1',
    name: 'Camping-Zubehör',
    slug: 'camping-zubehoer',
    cleanUrl: '/kategorie/camping-zubehoer',
    file: 'Camping-Zubehoer.txt',
    iconName: 'Backpack',
    tag: 'AUSRÜSTUNG & ZUBEHÖR',
    heroTitle: 'Camping-Zubehör kaufen und verkaufen',
    heroSubtitle: 'Gebrauchtes und neues Camping-Zubehör von privaten und gewerblichen Anbietern: von Vorzelten und Markisen über Campingmöbel und Bordküche bis zu Elektrik, Solar und Outdoor-Ausrüstung.',
    subcategories: [
      'Vorzelte & Markisen',
      'Campingmöbel',
      'Küche & Grillen',
      'Elektrik & Solar',
      'Sanitär & Wasser',
      'Sonstiges Zubehör'
    ],
    popularSearches: [
      { label: 'Vorzelt Wohnwagen', href: '/kategorie/camping-zubehoer' },
      { label: 'Luftvorzelt', href: '/kategorie/camping-zubehoer' },
      { label: 'Powerstation Camping', href: '/kategorie/camping-zubehoer' },
      { label: 'Campingtisch Alu', href: '/kategorie/camping-zubehoer' },
      { label: 'Kühlbox 12V 230V', href: '/kategorie/camping-zubehoer' },
      { label: 'Dometic Markise', href: '/kategorie/camping-zubehoer' },
      { label: 'Solar Camping faltbar', href: '/kategorie/camping-zubehoer' },
      { label: 'Trenntoilette Camper', href: '/kategorie/camping-zubehoer' }
    ]
  },
  {
    id: '2',
    name: 'Wohnmobile & Camper',
    slug: 'wohnmobile-camper',
    cleanUrl: '/kategorie/wohnmobile-camper',
    file: 'Campuna_Kategorie_Wohnmobile_SEO_Template.txt',
    iconName: 'Truck',
    tag: 'FAHRZEUGE',
    heroTitle: 'Wohnmobile, Camper & Wohnwagen kaufen und verkaufen',
    heroSubtitle: 'Gebrauchte und neue Wohnmobile, Campervans, Kastenwagen und Wohnwagen von privaten und gewerblichen Anbietern in ganz Deutschland. Jetzt entdecken oder kostenlos inserieren auf Campuna.',
    subcategories: [
      'Kastenwagen',
      'Campervan',
      'Alkoven',
      'Teilintegriert',
      'Vollintegriert',
      'Wohnwagen',
      'Sonstige Fahrzeuge'
    ],
    popularSearches: [
      { label: 'Wohnmobil bis 20.000 €', href: '/kategorie/wohnmobile-camper' },
      { label: 'Kastenwagen gebraucht', href: '/kategorie/wohnmobile-camper' },
      { label: 'Campervan gebraucht kaufen', href: '/kategorie/wohnmobile-camper' },
      { label: 'Wohnwagen für Familien', href: '/kategorie/wohnmobile-camper' },
      { label: 'Wohnmobil mit Einzelbetten', href: '/kategorie/wohnmobile-camper' },
      { label: 'Teilintegriert unter 3,5t', href: '/kategorie/wohnmobile-camper' },
      { label: 'Pössl Kastenwagen', href: '/kategorie/wohnmobile-camper' },
      { label: 'VW Bus California', href: '/kategorie/wohnmobile-camper' }
    ]
  },
  {
    id: '3',
    name: 'Zelte & Dachzelte',
    slug: 'zelte-dachzelte',
    cleanUrl: '/kategorie/zelte-dachzelte',
    file: 'Campuna_Kategorie_Zelte_SEO_Template.txt',
    iconName: 'Tent',
    tag: 'UNTERKÜNFTE & ZELTE',
    heroTitle: 'Dachzelte, Zelte & Vorzelte kaufen und verkaufen',
    heroSubtitle: 'Dachzelte, Familienzelte, Vorzelte, Busvorzelte und Trekkingzelte gebraucht und neu von privat und vom Händler aus ganz Deutschland. Jetzt finden oder inserieren.',
    subcategories: [
      'Dachzelte',
      'Hartschalen-Dachzelte',
      'Klappdachzelte',
      'Familienzelte',
      'Busvorzelte',
      'Vorzelte',
      'Wurfzelte',
      'Trekkingzelte'
    ],
    popularSearches: [
      { label: 'Dachzelt Hartschale gebraucht', href: '/kategorie/zelte-dachzelte' },
      { label: 'iKamper Skycamp', href: '/kategorie/zelte-dachzelte' },
      { label: 'Busvorzelt aufblasbar', href: '/kategorie/zelte-dachzelte' },
      { label: 'Familienzelt Stehhöhe', href: '/kategorie/zelte-dachzelte' },
      { label: 'Dachzelt für 4 Personen', href: '/kategorie/zelte-dachzelte' },
      { label: 'Vorzelt Wohnwagen', href: '/kategorie/zelte-dachzelte' },
      { label: 'Thule Dachzelt', href: '/kategorie/zelte-dachzelte' }
    ]
  },
  {
    id: '4',
    name: 'Fahrräder & Träger',
    slug: 'fahrraeder-traeger',
    cleanUrl: '/kategorie/fahrraeder-traeger',
    file: 'Campuna_Kategorie_Fahrraeder_SEO_Template.txt',
    iconName: 'Bike',
    tag: 'MOBILITÄT',
    heroTitle: 'Fahrradträger & Fahrräder für Camping kaufen und verkaufen',
    heroSubtitle: 'Fahrradträger für Wohnmobil, Wohnwagen und Anhängerkupplung, Heckboxen und E-Bikes, gebraucht und neu aus ganz Deutschland. Jetzt finden oder inserieren.',
    subcategories: [
      'Kupplungsträger',
      'Heckträger',
      'Deichselträger',
      'E-Bike Träger',
      'Falträder',
      'E-Bikes',
      'Heckboxen & Zubehör'
    ],
    popularSearches: [
      { label: 'Fahrradträger Anhängerkupplung E-Bike', href: '/kategorie/fahrraeder-traeger' },
      { label: 'Thule Velospace XT', href: '/kategorie/fahrraeder-traeger' },
      { label: 'Deichselträger Wohnwagen', href: '/kategorie/fahrraeder-traeger' },
      { label: 'Heckträger Kastenwagen Flügeltür', href: '/kategorie/fahrraeder-traeger' },
      { label: 'Klapprad für Wohnmobil', href: '/kategorie/fahrraeder-traeger' },
      { label: 'Heckbox Wohnmobil', href: '/kategorie/fahrraeder-traeger' }
    ]
  },
  {
    id: '5',
    name: 'Stellplätze & Campingplätze',
    slug: 'stellplaetze',
    cleanUrl: '/kategorie/stellplaetze',
    file: 'Campuna_Kategorie_Stellplaetze_SEO_Template.txt',
    iconName: 'Trees',
    tag: 'ÜBERNACHTUNG',
    heroTitle: 'Dauercampingplätze und Stellplätze finden und anbieten',
    heroSubtitle: 'Dauercampingplätze mit Wohnwagen, Parzellen und Stellplätze für Wohnmobil und Wohnwagen in ganz Deutschland, privat und vom Betreiber. Jetzt finden oder anbieten.',
    subcategories: [
      'Dauercampingplätze',
      'Campingplätze',
      'Wohnmobilstellplätze',
      'Private Stellplätze',
      'Stellplätze mit Strom & Wasser'
    ],
    popularSearches: [
      { label: 'Dauercampingplatz mit Wohnwagen kaufen', href: '/kategorie/stellplaetze' },
      { label: 'Dauerstellplatz Ostsee', href: '/kategorie/stellplaetze' },
      { label: 'Wohnmobilstellplatz am See', href: '/kategorie/stellplaetze' },
      { label: 'Dauercampingplatz Bayern', href: '/kategorie/stellplaetze' },
      { label: 'Stellplatz mit Strom privat', href: '/kategorie/stellplaetze' }
    ]
  },
  {
    id: '6',
    name: 'Camping-Services',
    slug: 'camping-services',
    cleanUrl: '/kategorie/camping-services',
    file: 'Campuna_Kategorie_Services_SEO_Template.txt',
    iconName: 'Wrench',
    tag: 'DIENSTLEISTUNGEN',
    heroTitle: 'Camping-Services für Wohnmobil und Wohnwagen',
    heroSubtitle: 'Gasprüfung nach G 607, Werkstatt, Dichtigkeitsprüfung, Aufbereitung und Kurse für Wohnmobil und Wohnwagen. Anbieter in ganz Deutschland finden oder anbieten.',
    subcategories: [
      'Gasprüfung G 607',
      'Werkstatt & Reparatur',
      'Dichtigkeitsprüfung',
      'Fahrzeugaufbereitung',
      'Van-Ausbau & Tuning',
      'Camping-Kurse & Schulung'
    ],
    popularSearches: [
      { label: 'Gasprüfung G607 in der Nähe', href: '/kategorie/camping-services' },
      { label: 'Wohnmobil Werkstatt', href: '/kategorie/camping-services' },
      { label: 'Dichtigkeitsprüfung Wohnmobil', href: '/kategorie/camping-services' },
      { label: 'Wohnmobil Aufbereitung Keramik', href: '/kategorie/camping-services' },
      { label: 'Solar nachrüsten Camper', href: '/kategorie/camping-services' }
    ]
  },
  {
    id: '7',
    name: 'Tiny Houses',
    slug: 'tiny-houses',
    cleanUrl: '/kategorie/tiny-houses',
    file: 'Campuna_Kategorie_TinyHouses_SEO_Template.txt',
    iconName: 'Home',
    tag: 'WOHNEN & FREIZEIT',
    heroTitle: 'Tiny Houses & Mobilheime kaufen und verkaufen',
    heroSubtitle: 'Tiny Houses neu und gebraucht, auf Rädern oder fest gebaut, dazu Mobilheime und Chalets für Campingplatz und Privatgrundstück. Angebote aus ganz Deutschland vergleichen.',
    subcategories: [
      'Tiny Houses auf Rädern',
      'Mobilheime',
      'Chalets',
      'Modulhäuser',
      'Bauwagen & Zirkuswagen'
    ],
    popularSearches: [
      { label: 'Tiny House auf Rädern gebraucht', href: '/kategorie/tiny-houses' },
      { label: 'Mobilheim winterfest kaufen', href: '/kategorie/tiny-houses' },
      { label: 'Tiny House bis 30.000 €', href: '/kategorie/tiny-houses' },
      { label: 'Chalet auf Campingplatz', href: '/kategorie/tiny-houses' },
      { label: 'Tiny House Baugenehmigung', href: '/kategorie/tiny-houses' }
    ]
  },
  {
    id: '8',
    name: 'Mieten & Vermieten',
    slug: 'mieten-vermieten',
    cleanUrl: '/kategorie/mieten-vermieten',
    file: 'Campuna_Kategorie_Mieten_SEO_Template.txt',
    iconName: 'Key',
    tag: 'VERMIETUNG',
    heroTitle: 'Wohnwagen und Wohnmobile mieten und vermieten',
    heroSubtitle: 'Wohnwagen, Wohnmobile und Campervans von privat und von regionalen Vermietstationen mieten oder das eigene Fahrzeug vermieten. Angebote aus ganz Deutschland.',
    subcategories: [
      'Wohnmobil mieten',
      'Wohnwagen mieten',
      'Campervan mieten',
      'Dachzelt mieten',
      'Campingzubehör mieten'
    ],
    popularSearches: [
      { label: 'Wohnmobil mieten günstig', href: '/kategorie/mieten-vermieten' },
      { label: 'Wohnwagen mieten für Familien', href: '/kategorie/mieten-vermieten' },
      { label: 'Campervan mieten zu zweit', href: '/kategorie/mieten-vermieten' },
      { label: 'Wohnmobil mieten mit Hund', href: '/kategorie/mieten-vermieten' },
      { label: 'Wohnmobil privat vermieten', href: '/kategorie/mieten-vermieten' }
    ]
  },
  {
    id: '9',
    name: 'Boote & Wassersport',
    slug: 'boote-wassersport',
    cleanUrl: '/kategorie/boote-wassersport',
    file: 'Campuna_Kategorie_Boote_SEO_Template.txt',
    iconName: 'Sailboat',
    tag: 'WASSERSPORT',
    heroTitle: 'Boote, Stege und Wassersport kaufen und verkaufen',
    heroSubtitle: 'Gebrauchte und neue Boote kaufen und verkaufen: Motorboote, Schlauchboote, Kajaks, SUPs, Bootsstege und Bootsanhänger von privat und vom Händler.',
    subcategories: [
      'Motorboote',
      'Schlauchboote',
      'Kajaks & Kanus',
      'SUPs & Stand Up Paddling',
      'Bootsstege & Schwimmstege',
      'Bootsanhänger & Trailer',
      'Außenborder & Zubehör'
    ],
    popularSearches: [
      { label: 'Schlauchboot mit Motor führerscheinfrei', href: '/kategorie/boote-wassersport' },
      { label: 'Motorboot gebraucht mit Trailer', href: '/kategorie/boote-wassersport' },
      { label: 'Kajak für Camping gebraucht', href: '/kategorie/boote-wassersport' },
      { label: 'SUP aufblasbar Set', href: '/kategorie/boote-wassersport' },
      { label: 'Bootssteg kaufen', href: '/kategorie/boote-wassersport' }
    ]
  }
];

const categorySeoData = {};

CATEGORY_DEFINITIONS.forEach(def => {
  const filePath = path.join(dir, def.file);
  const text = fs.readFileSync(filePath, 'utf8');

  // Title
  const titleM = text.match(/<title>(.*?)<\/title>/i) || text.match(/Meta title[\s\S]*?\n\s*([^\n]+)/i);
  let metaTitle = titleM ? titleM[1].trim() : `${def.name} | Campuna`;

  // Description
  const descM = text.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  let metaDescription = descM ? descM[1].trim() : '';

  // FAQs
  const faqs = [];
  const faqRegex = /\{[\s\S]*?"@type":\s*"Question"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"text":\s*"([^"]+)"[\s\S]*?\}/g;
  let fMatch;
  while ((fMatch = faqRegex.exec(text)) !== null) {
    faqs.push({
      question: fMatch[1].replace(/\\"/g, '"').trim(),
      answer: fMatch[2].replace(/\\"/g, '"').trim()
    });
  }

  // SEO Text sections
  const seoHeading = `${def.name} auf Campuna entdecken`;
  
  categorySeoData[def.slug] = {
    id: def.id,
    name: def.name,
    slug: def.slug,
    cleanUrl: def.cleanUrl,
    iconName: def.iconName,
    tag: def.tag,
    metaTitle,
    metaDescription,
    heroTitle: def.heroTitle,
    heroSubtitle: def.heroSubtitle,
    subcategories: def.subcategories,
    popularSearches: def.popularSearches,
    seoHeading,
    faqs
  };
});

const outJs = `// Generated Category SEO Data from Intelitune Content Specifications
export const CATEGORY_SEO_DATA = ${JSON.stringify(categorySeoData, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'data', 'categorySeoData.js'), outJs, 'utf8');
console.log('Successfully written categorySeoData.js');

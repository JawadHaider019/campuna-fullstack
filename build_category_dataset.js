const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'new content');

// Read files
const categories = [
  {
    id: '1',
    name: 'Camping-Zubehör',
    slug: 'camping-zubehoer',
    cleanUrl: '/kategorie/camping-zubehoer',
    file: 'Camping-Zubehoer.txt',
    iconName: 'Tent',
    tag: 'AUSRÜSTUNG & ZUBEHÖR'
  },
  {
    id: '2',
    name: 'Wohnmobile & Camper',
    slug: 'wohnmobile-camper',
    cleanUrl: '/kategorie/wohnmobile-camper',
    file: 'Campuna_Kategorie_Wohnmobile_SEO_Template.txt',
    iconName: 'Truck',
    tag: 'FAHRZEUGE'
  },
  {
    id: '3',
    name: 'Zelte & Dachzelte',
    slug: 'zelte-dachzelte',
    cleanUrl: '/kategorie/zelte-dachzelte',
    file: 'Campuna_Kategorie_Zelte_SEO_Template.txt',
    iconName: 'Mountain',
    tag: 'UNTERKÜNFTE & ZELTE'
  },
  {
    id: '4',
    name: 'Fahrräder & Träger',
    slug: 'fahrraeder-traeger',
    cleanUrl: '/kategorie/fahrraeder-traeger',
    file: 'Campuna_Kategorie_Fahrraeder_SEO_Template.txt',
    iconName: 'Bike',
    tag: 'MOBILITÄT'
  },
  {
    id: '5',
    name: 'Stellplätze & Campingplätze',
    slug: 'stellplaetze',
    cleanUrl: '/kategorie/stellplaetze',
    file: 'Campuna_Kategorie_Stellplaetze_SEO_Template.txt',
    iconName: 'MapPin',
    tag: 'ÜBERNACHTUNG'
  },
  {
    id: '6',
    name: 'Camping-Services',
    slug: 'camping-services',
    cleanUrl: '/kategorie/camping-services',
    file: 'Campuna_Kategorie_Services_SEO_Template.txt',
    iconName: 'Wrench',
    tag: 'DIENSTLEISTUNGEN'
  },
  {
    id: '7',
    name: 'Tiny Houses',
    slug: 'tiny-houses',
    cleanUrl: '/kategorie/tiny-houses',
    file: 'Campuna_Kategorie_TinyHouses_SEO_Template.txt',
    iconName: 'Home',
    tag: 'WOHNEN & FREIZEIT'
  },
  {
    id: '8',
    name: 'Mieten & Vermieten',
    slug: 'mieten-vermieten',
    cleanUrl: '/kategorie/mieten-vermieten',
    file: 'Campuna_Kategorie_Mieten_SEO_Template.txt',
    iconName: 'Key',
    tag: 'VERMIETUNG'
  },
  {
    id: '9',
    name: 'Boote & Wassersport',
    slug: 'boote-wassersport',
    cleanUrl: '/kategorie/boote-wassersport',
    file: 'Campuna_Kategorie_Boote_SEO_Template.txt',
    iconName: 'Sailboat',
    tag: 'WASSERSPORT'
  }
];

const results = {};

categories.forEach(cat => {
  const filePath = path.join(dir, cat.file);
  const text = fs.readFileSync(filePath, 'utf8');

  // Extract meta title
  const titleM = text.match(/<title>(.*?)<\/title>/i) || text.match(/Meta title[\s\S]*?\n\s*([^\n]+)/i);
  let metaTitle = titleM ? titleM[1].trim() : `${cat.name} | Campuna`;

  // Extract meta desc
  const descM = text.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  let metaDescription = descM ? descM[1].trim() : '';

  // Extract FAQs from JSON-LD schema
  const faqs = [];
  const faqRegex = /\{[\s\S]*?"@type":\s*"Question"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"text":\s*"([^"]+)"[\s\S]*?\}/g;
  let fMatch;
  while ((fMatch = faqRegex.exec(text)) !== null) {
    faqs.push({
      question: fMatch[1].replace(/\\"/g, '"').trim(),
      answer: fMatch[2].replace(/\\"/g, '"').trim()
    });
  }

  results[cat.slug] = {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    cleanUrl: cat.cleanUrl,
    iconName: cat.iconName,
    tag: cat.tag,
    metaTitle,
    metaDescription,
    faqsCount: faqs.length,
    faqs
  };
});

console.log(JSON.stringify(results, null, 2));

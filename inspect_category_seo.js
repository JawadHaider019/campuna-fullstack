const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'new content');
const files = [
  { slug: 'wohnmobile-camper', file: 'Campuna_Kategorie_Wohnmobile_SEO_Template.txt' },
  { slug: 'camping-zubehoer', file: 'Camping-Zubehoer.txt' },
  { slug: 'zelte-dachzelte', file: 'Campuna_Kategorie_Zelte_SEO_Template.txt' },
  { slug: 'stellplaetze', file: 'Campuna_Kategorie_Stellplaetze_SEO_Template.txt' },
  { slug: 'tiny-houses', file: 'Campuna_Kategorie_TinyHouses_SEO_Template.txt' },
  { slug: 'fahrraeder-traeger', file: 'Campuna_Kategorie_Fahrraeder_SEO_Template.txt' },
  { slug: 'boote-wassersport', file: 'Campuna_Kategorie_Boote_SEO_Template.txt' },
  { slug: 'camping-services', file: 'Campuna_Kategorie_Services_SEO_Template.txt' },
  { slug: 'mieten-vermieten', file: 'Campuna_Kategorie_Mieten_SEO_Template.txt' },
];

files.forEach(({ slug, file }) => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    const text = fs.readFileSync(filePath, 'utf8');
    console.log(`=== ${slug} (${file}) ===`);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    console.log('Total non-empty lines:', lines.length);
    // Find Title, Meta description, H1, etc.
    const titleMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/Meta title\s*\n\s*(.+)/i);
    const descMatch = text.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || text.match(/Meta description\s*\n\s*(.+)/i);
    const h1Match = text.match(/H1[:\s]*\n*(.+)/i) || text.match(/H1\s*\n\s*(.+)/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'Not found');
    console.log('Desc:', descMatch ? descMatch[1] : 'Not found');
    console.log('H1:', h1Match ? h1Match[1] : 'Not found');
  }
});

const fs = require('fs');
const path = require('path');

try {
  const xml = fs.readFileSync(path.join(__dirname, 'temp_hp_xml.txt'), 'utf8');
  const text = xml
    .replace(/<w:tab[^>]*\/>/g, ' ')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

  fs.writeFileSync(path.join(__dirname, 'Campuna_Homepage_SEO_extracted.txt'), text, 'utf8');
  console.log('Successfully written. Total length:', text.length);
} catch (e) {
  console.error(e);
}

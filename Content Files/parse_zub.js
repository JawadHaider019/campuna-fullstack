const fs = require('fs');
const path = require('path');

try {
  const xml = fs.readFileSync(path.join(__dirname, 'temp_zub_xml.txt'), 'utf8');
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

  fs.writeFileSync(path.join(__dirname, 'Camping-Zubehoer_extracted.txt'), text, 'utf8');
  console.log('Successfully written Camping-Zubehoer_extracted.txt. Total length:', text.length);
  fs.unlinkSync(path.join(__dirname, 'temp_zub_xml.txt'));
} catch (e) {
  console.error(e);
}

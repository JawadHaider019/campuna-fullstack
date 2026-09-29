const fs = require('fs');
const path = require('path');

function parseSharedStrings(xml) {
  const strings = [];
  const regex = /<si>(?:(?!<\/si>).)*?<\/si>/gs;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const tMatches = match[0].match(/<t[^>]*>(.*?)<\/t>/gs);
    if (tMatches) {
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      strings.push(text);
    } else {
      strings.push('');
    }
  }
  return strings;
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  const rowRegex = /<row[^>]*>(.*?)<\/row>/gs;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const cells = [];
    const cellRegex = /<c\s+r="([A-Z]+[0-9]+)"(?:\s+s="[^"]*")?(?:\s+t="([^"]*)")?[^>]*>(?:<v>(.*?)<\/v>)?<\/c>/gs;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const cellRef = cellMatch[1];
      const type = cellMatch[2];
      const val = cellMatch[3];
      let cellValue = val;
      if (type === 's' && val !== undefined) {
        cellValue = sharedStrings[parseInt(val, 10)] || '';
      }
      cells.push({ ref: cellRef, val: cellValue });
    }
    rows.push(cells);
  }
  return rows;
}

// Check all sheets in Topical Map
const topDir = path.join(__dirname, 'Content Files', 'temp_Topical_Map_xlsx');
const ssXml = fs.readFileSync(path.join(topDir, 'sharedStrings.xml'), 'utf8');
const sharedStrings = parseSharedStrings(ssXml);
const wbXml = fs.readFileSync(path.join(topDir, 'workbook.xml'), 'utf8');

console.log('Workbook sheets:');
const sheetMatches = wbXml.match(/<sheet[^>]*name="([^"]*)"[^>]*sheetId="([^"]*)"/g);
console.log(sheetMatches);

// Read sheet 2, 3, 4 etc.
fs.readdirSync(topDir).forEach(f => {
  if (f.startsWith('sheet') && f.endsWith('.xml')) {
    const sheetXml = fs.readFileSync(path.join(topDir, f), 'utf8');
    const rows = parseSheet(sheetXml, sharedStrings);
    console.log(`\n=== ${f} (Rows: ${rows.length}) ===`);
    console.log('Header:', rows[0]?.map(c => c.val).slice(0, 10));
    console.log('Sample row 1:', rows[1]?.map(c => c.val).slice(0, 10));
    console.log('Sample row 2:', rows[2]?.map(c => c.val).slice(0, 10));
  }
});

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

// 1. Analyze Topical Map
const topDir = path.join(__dirname, 'Content Files', 'temp_Topical_Map_xlsx');
if (fs.existsSync(topDir)) {
  const ssXml = fs.readFileSync(path.join(topDir, 'sharedStrings.xml'), 'utf8');
  const sharedStrings = parseSharedStrings(ssXml);
  const sheet1Xml = fs.readFileSync(path.join(topDir, 'sheet1.xml'), 'utf8');
  const rows = parseSheet(sheet1Xml, sharedStrings);
  console.log('--- Topical Map Summary ---');
  console.log('Total rows in Sheet1:', rows.length);
  const header = rows[0]?.map(c => c.val) || [];
  console.log('Headers:', header);
  const samples = rows.slice(1, 15).map(r => r.map(c => c.val));
  console.log('Sample data:\n', JSON.stringify(samples, null, 2));
}

// 2. Analyze Competitor Deep-Dive Gap
const gapDir = path.join(__dirname, 'Content Files', 'temp_Competitor_Deep_Dive_Gap_xlsx');
if (fs.existsSync(gapDir)) {
  const ssXml = fs.readFileSync(path.join(gapDir, 'sharedStrings.xml'), 'utf8');
  const sharedStrings = parseSharedStrings(ssXml);
  const sheet1Xml = fs.readFileSync(path.join(gapDir, 'sheet1.xml'), 'utf8');
  const rows = parseSheet(sheet1Xml, sharedStrings);
  console.log('--- Competitor Deep-Dive Gap Summary ---');
  console.log('Total rows in Sheet1:', rows.length);
  const header = rows[0]?.map(c => c.val) || [];
  console.log('Headers:', header);
  const samples = rows.slice(1, 10).map(r => r.map(c => c.val));
  console.log('Sample data:\n', JSON.stringify(samples, null, 2));
}

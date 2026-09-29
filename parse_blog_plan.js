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

const topDir = path.join(__dirname, 'Content Files', 'temp_Topical_Map_xlsx');
const ssXml = fs.readFileSync(path.join(topDir, 'sharedStrings.xml'), 'utf8');
const sharedStrings = parseSharedStrings(ssXml);

// Hubs (sheet2)
const hubRows = parseSheet(fs.readFileSync(path.join(topDir, 'sheet2.xml'), 'utf8'), sharedStrings);
console.log('--- 6 TOPICAL HUBS ---');
hubRows.slice(1).forEach(r => {
  if (r.length > 0 && r[0]?.val) {
    console.log(`Hub: ${r[0].val} | URL: ${r[1]?.val} | Articles: ${r[4]?.val}`);
  }
});

// 60 Blog Articles (sheet4)
const blogRows = parseSheet(fs.readFileSync(path.join(topDir, 'sheet4.xml'), 'utf8'), sharedStrings);
console.log('\n--- 60 BLOG ARTICLES (TOTAL:', blogRows.length - 1, ') ---');
const blogs = [];
blogRows.slice(1).forEach((r, idx) => {
  if (r.length > 0 && r[5]?.val) {
    blogs.push({
      no: r[0]?.val || idx + 1,
      month: r[1]?.val,
      week: r[2]?.val,
      hub: r[3]?.val,
      hubUrl: r[4]?.val,
      title: r[5]?.val,
      keyword: r[6]?.val,
      volume: r[7]?.val,
      type: r[9]?.val
    });
  }
});
console.log('Parsed blogs count:', blogs.length);
console.log('First 10 blogs:\n', JSON.stringify(blogs.slice(0, 10), null, 2));

// Core pages (sheet3)
const coreRows = parseSheet(fs.readFileSync(path.join(topDir, 'sheet3.xml'), 'utf8'), sharedStrings);
console.log('\n--- CORE PAGES (TOTAL:', coreRows.length - 1, ') ---');
const corePages = [];
coreRows.slice(1).forEach(r => {
  if (r.length > 0 && r[0]?.val) {
    corePages.push({
      url: r[0]?.val,
      type: r[1]?.val,
      primaryKeyword: r[2]?.val,
      secondary: r[5]?.val
    });
  }
});
console.log('Core pages count:', corePages.length);
console.log('Core pages:\n', JSON.stringify(corePages.slice(0, 15), null, 2));

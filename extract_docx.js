const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contentDir = path.join(__dirname, 'Content Files');
const files = [
  'Core Pages.docx',
  'Campuna_Inserate_SEO_Template.docx',
  'Competitor Deep-Dive Report.docx'
];

files.forEach(file => {
  const docxPath = path.join(contentDir, file);
  const outPath = path.join(contentDir, file.replace('.docx', '_text.txt'));
  
  // Use powershell script to extract word/document.xml
  const psScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem;
    $zip = [System.IO.Compression.ZipFile]::OpenRead('${docxPath.replace(/\\/g, '\\\\')}');
    $entry = $zip.GetEntry('word/document.xml');
    $stream = $entry.Open();
    $reader = New-Object System.IO.StreamReader($stream);
    $xml = $reader.ReadToEnd();
    $reader.Close();
    $stream.Close();
    $zip.Dispose();
    [System.IO.File]::WriteAllText('${outPath.replace(/\\/g, '\\\\')}.xml', $xml, [System.Text.Encoding]::UTF8);
  `;
  
  try {
    execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);
    const xml = fs.readFileSync(outPath + '.xml', 'utf8');
    const text = xml
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    fs.writeFileSync(outPath, text);
    fs.unlinkSync(outPath + '.xml');
    console.log(`Successfully extracted ${file} -> ${text.length} chars`);
  } catch (err) {
    console.error(`Error with ${file}:`, err.message);
  }
});

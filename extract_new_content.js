const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'new content');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));

files.forEach((file, idx) => {
  const docxPath = path.join(dir, file);
  const tempAsciiDocx = path.join(dir, `temp_${idx}.zip`);
  fs.copyFileSync(docxPath, tempAsciiDocx);
  const outXml = path.join(dir, `temp_${idx}.xml`);
  const outTxt = path.join(dir, file.replace('.docx', '.txt').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue'));

  const psCode = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${tempAsciiDocx.replace(/'/g, "''")}')
$entry = $zip.GetEntry('word/document.xml')
if ($entry) {
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    [System.IO.File]::WriteAllText('${outXml.replace(/'/g, "''")}', $xml, [System.Text.Encoding]::UTF8)
}
$zip.Dispose()
`;
  const psFile = path.join(dir, 'temp_extract.ps1');
  fs.writeFileSync(psFile, psCode, 'utf8');

  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
    if (fs.existsSync(outXml)) {
      const xml = fs.readFileSync(outXml, 'utf8');
      const text = xml
        .replace(/<w:p[^>]*>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      fs.writeFileSync(outTxt, text, 'utf8');
      fs.unlinkSync(outXml);
      console.log(`Extracted: ${file} (${text.length} chars)`);
    }
  } catch (err) {
    console.error(`Error on ${file}:`, err.message);
  } finally {
    if (fs.existsSync(psFile)) fs.unlinkSync(psFile);
    if (fs.existsSync(tempAsciiDocx)) fs.unlinkSync(tempAsciiDocx);
  }
});

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contentDir = path.join(__dirname, 'Content Files');
const excelFiles = [
  'Topical Map.xlsx',
  'Campuna Master.xlsx',
  'Keywords.xlsx',
  'Competitor Deep-Dive Gap.xlsx'
];

excelFiles.forEach(file => {
  const xlsxPath = path.join(contentDir, file);
  const outDir = path.join(contentDir, 'temp_' + file.replace(/[^a-zA-Z0-9]/g, '_'));
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Create a clean powershell script file to execute
  const ps1File = path.join(contentDir, 'temp_run.ps1');
  const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${xlsxPath.replace(/'/g, "''")}')

foreach ($entry in $zip.Entries) {
    if ($entry.FullName -eq 'xl/sharedStrings.xml') {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        [System.IO.File]::WriteAllText('${path.join(outDir, 'sharedStrings.xml').replace(/'/g, "''")}', $xml, [System.Text.Encoding]::UTF8)
    }
    if ($entry.FullName -eq 'xl/workbook.xml') {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        [System.IO.File]::WriteAllText('${path.join(outDir, 'workbook.xml').replace(/'/g, "''")}', $xml, [System.Text.Encoding]::UTF8)
    }
    if ($entry.FullName -like 'xl/worksheets/sheet*.xml') {
        $sheetName = [System.IO.Path]::GetFileName($entry.FullName)
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $dest = Join-Path '${outDir.replace(/'/g, "''")}' $sheetName
        [System.IO.File]::WriteAllText($dest, $xml, [System.Text.Encoding]::UTF8)
    }
}
$zip.Dispose()
`;
  fs.writeFileSync(ps1File, psScript, 'utf8');

  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${ps1File}"`);
    console.log(`Successfully extracted XMLs for ${file}`);
  } catch (err) {
    console.error(`Error extracting ${file}:`, err.message);
  }
  if (fs.existsSync(ps1File)) fs.unlinkSync(ps1File);
});

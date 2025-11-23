const fs = require('fs');
const path = require('path');

// Convert a PDF file to base64 data URL
const pdfFiles = ['report1.pdf', 'report2.pdf', 'report3.pdf'];
const pdfTitles = ['Cover Page', 'Meeting Minutes', 'Progress'];
const pdfDescriptions = [
  'Report cover page template',
  'Meeting minutes template',
  'Progress report template',
];

pdfFiles.forEach((filename, index) => {
  const pdfPath = path.join(__dirname, '../../web/public/reports', filename);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64 = pdfBuffer.toString('base64');
  const dataUrl = `data:application/pdf;base64,${base64}`;

  console.log(`\n📄 ${pdfTitles[index]}:`);
  console.log(`Title: ${pdfTitles[index]}`);
  console.log(`Description: ${pdfDescriptions[index]}`);
  console.log(`\nMongoDB Document (copy this into Templates collection):`);
  console.log(JSON.stringify({
    title: pdfTitles[index],
    description: pdfDescriptions[index],
    pdfData: dataUrl,
  }, null, 2));
  console.log('\n---');
});

console.log('\n✅ Done! Copy each JSON document into your MongoDB Templates collection.');


const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

function buildDocxBuffer(wordBuffer, templateData) {
  const zip = new PizZip(wordBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(templateData);
  return doc.getZip().generate({ type: 'nodebuffer' });
}

async function generatePdfFromWord(wordBuffer, templateData) {
  try {
    const filledDocxBuffer = buildDocxBuffer(wordBuffer, templateData);
    const result = await mammoth.convertToHtml({ buffer: filledDocxBuffer });
    const html = result.value;

    const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm 18mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #111; }
    p { margin: 0 0 8px 0; text-align: justify; }
    h1, h2, h3 { margin: 16px 0 8px; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    td, th { border: 1px solid #222; padding: 6px 8px; vertical-align: top; }
    ul, ol { margin: 0 0 12px 20px; }
    .watermark { position: fixed; top: 45%; left: 10%; right: 10%; font-size: 54px; opacity: 0.08; text-align: center; transform: rotate(-25deg); z-index: 0; }
    .page { position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="watermark">DRAFT - BELUM BERMETERAI</div>
  <div class="page">${html}</div>
</body>
</html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: 'networkidle2' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' } });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

module.exports = { generatePdfFromWord };

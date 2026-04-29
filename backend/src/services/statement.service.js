const { formatMoney } = require('../lib/decimal');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const ROWS_PER_PAGE = 24;

const escapePdfText = (value) =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const chunk = (items, size) => {
  const output = [];

  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }

  return output.length > 0 ? output : [[]];
};

const buildPdfDocument = (pages) => {
  const objects = [];

  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontMonoId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  const pageIds = [];

  for (const lines of pages) {
    const stream = lines
      .map((line) => {
        const fontName = line.font === 'mono' ? 'F2' : 'F1';
        return `BT /${fontName} ${line.size || 10} Tf 1 0 0 1 ${line.x} ${line.y} Tm (${escapePdfText(
          line.text
        )}) Tj ET`;
      })
      .join('\n');

    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontMonoId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );

    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
};

const buildAccountStatementPdf = ({
  user,
  account,
  rows,
  rangeStart,
  rangeEnd,
  openingBalance,
  closingBalance,
}) => {
  const rowPages = chunk(rows, ROWS_PER_PAGE);
  const pages = rowPages.map((pageRows, pageIndex) => {
    let y = 760;
    const lines = [
      { text: 'Crestmont Bank Account Statement', x: 40, y, size: 18 },
      {
        text: `Period: ${rangeStart.toLocaleDateString()} to ${rangeEnd.toLocaleDateString()}`,
        x: 40,
        y: (y -= 24),
        size: 10,
      },
      { text: `Customer: ${user.name} (${user.email})`, x: 40, y: (y -= 18), size: 10 },
      {
        text: `Account: #${String(account.id).padStart(4, '0')}  Type: ${account.type}`,
        x: 40,
        y: (y -= 16),
        size: 10,
      },
      {
        text: `Opening Balance: Rs ${formatMoney(openingBalance)}    Closing Balance: Rs ${formatMoney(closingBalance)}`,
        x: 40,
        y: (y -= 16),
        size: 10,
      },
      {
        text: `Page ${pageIndex + 1} of ${rowPages.length}`,
        x: 500,
        y: 760,
        size: 9,
      },
      {
        text: 'Date       Direction Counterparty                  Category        Amount       Balance      Note',
        x: 40,
        y: (y -= 26),
        size: 9,
        font: 'mono',
      },
      {
        text: '-----------------------------------------------------------------------------------------------',
        x: 40,
        y: (y -= 12),
        size: 9,
        font: 'mono',
      },
    ];

    for (const row of pageRows) {
      const line = [
        row.date.padEnd(10, ' '),
        row.direction.padEnd(9, ' '),
        row.counterparty.slice(0, 28).padEnd(28, ' '),
        row.category.slice(0, 14).padEnd(14, ' '),
        `Rs ${row.amount}`.padStart(11, ' '),
        `Rs ${row.balance}`.padStart(11, ' '),
        row.note.slice(0, 26),
      ].join(' ');

      lines.push({
        text: line,
        x: 40,
        y: (y -= 16),
        size: 8.7,
        font: 'mono',
      });
    }

    lines.push({
      text: `Generated on ${new Date().toLocaleString()}`,
      x: 40,
      y: 32,
      size: 9,
    });

    return lines;
  });

  return buildPdfDocument(pages);
};

module.exports = {
  buildAccountStatementPdf,
};

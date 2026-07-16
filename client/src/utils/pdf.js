import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const toPlainText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toPlainText).join(', ');
  return JSON.stringify(value);
};

export const exportTablePdf = ({ title, subtitle = '', columns = [], rows = [], filename = 'bank-report.pdf', metadata = [] }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 40, 42);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitle, 40, 60);
  }

  metadata.forEach((item, index) => {
    doc.setFontSize(9);
    doc.text(`${item.label}: ${item.value}`, 40 + (index % 3) * 180, 84 + Math.floor(index / 3) * 14);
  });

  autoTable(doc, {
    startY: subtitle ? 110 : 84,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => toPlainText(column.render ? column.render(row) : row[column.key]))),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  const blob = doc.output('blob');
  window.dispatchEvent(
    new CustomEvent('bank:secure-document', {
      detail: {
        id: crypto.randomUUID(),
        title,
        subtitle,
        filename,
        metadata,
        columns,
        rows,
        createdAt: new Date().toISOString(),
        mimeType: 'application/pdf',
        blob
      }
    })
  );
};

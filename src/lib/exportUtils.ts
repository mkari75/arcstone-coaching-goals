import { format } from 'date-fns';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

// ============ CSV EXPORT ============
export const exportToCSV = (options: ExportOptions) => {
  const { filename, columns, data } = options;

  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============ PRINT ============
export const printReport = (options: ExportOptions) => {
  const { title, columns, data } = options;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const headerCells = columns.map(c => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left">${c.label}</th>`).join('');
  const bodyRows = data.map(row =>
    '<tr>' + columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `<td style="border:1px solid #ddd;padding:8px">${formatted}</td>`;
    }).join('') + '</tr>'
  ).join('');

  printWindow.document.write(`
    <html><head><title>${title || 'Report'}</title></head>
    <body style="font-family:system-ui,sans-serif;padding:20px">
      <h1 style="font-size:18px">${title || 'Report'}</h1>
      <p style="color:#666;font-size:12px">Generated: ${format(new Date(), 'PPpp')}</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

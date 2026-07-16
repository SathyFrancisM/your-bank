import { FaFilePdf, FaChartBar } from 'react-icons/fa';
import api from '../services/api.js';
import SectionPage from '../components/SectionPage.jsx';
import { exportTablePdf } from '../utils/pdf.js';

const loadAndExportReports = async () => {
  const response = await api.get('/reports/manager');
  const summary = response.data.data || {};
  const rows = Object.entries(summary).map(([key, value]) => ({ name: key, value: Array.isArray(value) ? value.length : value, note: Array.isArray(value) ? 'Array' : typeof value }));
  exportTablePdf({
    title: 'Manager Reports',
    subtitle: 'Daily, weekly, monthly, cash flow, employee performance, suspicious activities, and risk analysis.',
    columns: [
      { key: 'name', label: 'Report Item' },
      { key: 'value', label: 'Value' },
      { key: 'note', label: 'Note' }
    ],
    rows,
    filename: 'manager-reports.pdf',
    metadata: [
      { label: 'Generated At', value: new Date().toLocaleString() },
      { label: 'Section', value: 'Manager Reports' }
    ]
  });
};

export default function ReportsPage() {
  return (
    <SectionPage
      title="Manager Reports"
      subtitle="Daily, weekly, monthly, cash flow, employee performance, suspicious activities, and risk analysis dashboards."
      endpoint="/reports/manager"
      columns={[
        { key: 'name', label: 'Report Item' },
        { key: 'value', label: 'Value' },
        { key: 'note', label: 'Note' }
      ]}
      statsBuilder={(summary) => [
        { label: 'Reports', value: Object.keys(summary || {}).length, icon: FaChartBar, tone: 'blue', change: 'Ready' },
        { label: 'Exports', value: 1, icon: FaFilePdf, tone: 'emerald', change: 'PDF' }
      ]}
      actions={[
        { label: 'Export PDF', primary: true, onClick: loadAndExportReports }
      ]}
      chartBuilder={() => ({
        title: 'Reporting Console',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-slate-950/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Exportable PDF, charts, and tables can be extended from this reporting shell.</div>,
        tableTitle: 'Reporting Summary',
        tableSubtitle: 'Daily, weekly, monthly, and suspicious activity summaries'
      })}
    />
  );
}

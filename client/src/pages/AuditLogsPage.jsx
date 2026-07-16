import { FaShieldAlt } from 'react-icons/fa';
import api from '../services/api.js';
import SectionPage from '../components/SectionPage.jsx';
import { exportTablePdf } from '../utils/pdf.js';

const exportAuditSnapshot = async () => {
  const response = await api.get('/audit-logs');
  const rows = response.data.data || [];
  exportTablePdf({
    title: 'Audit Snapshot',
    subtitle: 'Internal bank audit trail export.',
    columns: [
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'actorId', label: 'Employee ID' },
      { key: 'ipAddress', label: 'IP' }
    ],
    rows,
    filename: 'audit-snapshot.pdf',
    metadata: [
      { label: 'Generated At', value: new Date().toLocaleString() },
      { label: 'Row Count', value: rows.length }
    ]
  });
};

const columns = [
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'actorId', label: 'Employee ID' },
  { key: 'ipAddress', label: 'IP' }
];

export default function AuditLogsPage() {
  return (
    <SectionPage
      title="Audit Logs"
      subtitle="Every privileged action is logged with employee identity, timestamp, IP, device, browser, and location metadata."
      endpoint="/audit-logs"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Audit Entries', value: rows.length, icon: FaShieldAlt, tone: 'blue', change: 'Immutable' }
      ]}
      actions={[
        { label: 'Export PDF', primary: true, onClick: exportAuditSnapshot }
      ]}
      chartBuilder={() => ({
        title: 'Audit Timeline',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-rose-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Audit log timeline shell.</div>,
        tableTitle: 'Audit Trail',
        tableSubtitle: 'Login, logout, deposit, withdraw, transfer, search, FD, RD, loan, and report actions'
      })}
    />
  );
}

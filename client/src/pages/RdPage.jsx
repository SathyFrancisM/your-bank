import { FaCalendarAlt } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'rdNumber', label: 'RD Number' },
  { key: 'customerName', label: 'Customer' },
  { key: 'monthlyDeposit', label: 'Monthly Deposit', render: (row) => `₹${Number(row.monthlyDeposit).toLocaleString('en-IN')}` },
  { key: 'maturityAmount', label: 'Maturity', render: (row) => `₹${Number(row.maturityAmount).toLocaleString('en-IN')}` },
  { key: 'status', label: 'Status' }
];

export default function RdPage() {
  return (
    <SectionPage
      title="Recurring Deposit"
      subtitle="Monthly deposit calculator with tenure-based maturity projections and approval tracking."
      endpoint="/rds"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'RDs', value: rows.length, icon: FaCalendarAlt, tone: 'blue', change: 'Active' },
        { label: 'Open', value: rows.filter((item) => item.status === 'Active').length, icon: FaCalendarAlt, tone: 'emerald', change: 'Current' }
      ]}
      chartBuilder={() => ({
        title: 'RD Progress',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-cyan-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Recurring deposit progress chart shell.</div>,
        tableTitle: 'RD Portfolio',
        tableSubtitle: 'Monthly deposits and projected maturity'
      })}
    />
  );
}

import { FaPiggyBank } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'fdNumber', label: 'FD Number' },
  { key: 'customerName', label: 'Customer' },
  { key: 'principal', label: 'Principal', render: (row) => `₹${Number(row.principal).toLocaleString('en-IN')}` },
  { key: 'maturityAmount', label: 'Maturity', render: (row) => `₹${Number(row.maturityAmount).toLocaleString('en-IN')}` },
  { key: 'status', label: 'Status' }
];

export default function FdPage() {
  return (
    <SectionPage
      title="Fixed Deposit"
      subtitle="Calculate maturity using compound interest and manage premature withdrawal controls."
      endpoint="/fds"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'FDs', value: rows.length, icon: FaPiggyBank, tone: 'blue', change: 'Active' },
        { label: 'Matured', value: rows.filter((item) => item.status === 'Matured').length, icon: FaPiggyBank, tone: 'emerald', change: 'Ready' }
      ]}
      chartBuilder={() => ({
        title: 'FD Growth',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-blue-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">FD maturity curve rendered through the shared chart shell.</div>,
        tableTitle: 'FD Portfolio',
        tableSubtitle: 'Create FD, calculate maturity, lock period, premature withdrawal'
      })}
    />
  );
}

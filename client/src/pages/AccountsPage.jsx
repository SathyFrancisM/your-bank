import { FaWallet, FaLockOpen } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'customerName', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'balance', label: 'Balance', render: (row) => `₹${Number(row.balance).toLocaleString('en-IN')}` },
  { key: 'status', label: 'Status' }
];

export default function AccountsPage() {
  return (
    <SectionPage
      title="Account Management"
      subtitle="Open, freeze, activate, and close accounts with controlled audit logging and role-based access."
      endpoint="/accounts"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Accounts', value: rows.length, icon: FaWallet, tone: 'blue', change: 'Live' },
        { label: 'Active', value: rows.filter((item) => item.status === 'Active').length, icon: FaLockOpen, tone: 'emerald', change: 'Open' }
      ]}
      chartBuilder={() => ({
        title: 'Account Status',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-slate-950/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Deposit and account activity visualized through the dashboard shell.</div>,
        tableTitle: 'Account Register',
        tableSubtitle: 'Open account, freeze account, activate account, close account'
      })}
    />
  );
}

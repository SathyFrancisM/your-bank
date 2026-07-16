import { FaHandHoldingUsd } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'loanNumber', label: 'Loan Number' },
  { key: 'customerName', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount).toLocaleString('en-IN')}` },
  { key: 'approvalStatus', label: 'Approval' }
];

export default function LoansPage() {
  return (
    <SectionPage
      title="Loan Module"
      subtitle="Personal, home, gold, and vehicle loans with EMI calculations and approval tracking."
      endpoint="/loans"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Loans', value: rows.length, icon: FaHandHoldingUsd, tone: 'blue', change: 'Portfolio' },
        { label: 'Approved', value: rows.filter((item) => item.approvalStatus === 'Approved').length, icon: FaHandHoldingUsd, tone: 'emerald', change: 'Granted' }
      ]}
      chartBuilder={() => ({
        title: 'Loan Pipeline',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-amber-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Loan approval and EMI analytics shell.</div>,
        tableTitle: 'Loan Register',
        tableSubtitle: 'Approval status, EMI, and risk awareness'
      })}
    />
  );
}

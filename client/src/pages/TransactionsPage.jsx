import { FaExchangeAlt, FaReceipt } from 'react-icons/fa';
import api from '../services/api.js';
import SectionPage from '../components/SectionPage.jsx';
import { exportTablePdf } from '../utils/pdf.js';

const exportTransactionLedger = async () => {
  const response = await api.get('/transactions');
  const rows = response.data.data || [];
  exportTablePdf({
    title: 'Transaction Ledger',
    subtitle: 'Receipts and transaction records for internal bank operations.',
    columns: [
      { key: 'transactionId', label: 'Txn ID' },
      { key: 'accountNumber', label: 'Account' },
      { key: 'type', label: 'Type' },
      { key: 'channel', label: 'Channel' },
      { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount).toLocaleString('en-IN')}` }
    ],
    rows,
    filename: 'transaction-ledger.pdf',
    metadata: [
      { label: 'Generated At', value: new Date().toLocaleString() },
      { label: 'Row Count', value: rows.length }
    ]
  });
};

const columns = [
  { key: 'transactionId', label: 'Txn ID' },
  { key: 'accountNumber', label: 'Account' },
  { key: 'type', label: 'Type' },
  { key: 'channel', label: 'Channel' },
  { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount).toLocaleString('en-IN')}` }
];

export default function TransactionsPage() {
  return (
    <SectionPage
      title="Transaction Desk"
      subtitle="Deposit, withdraw, transfer, confirmation, receipts, and balance validation across internal and external rails."
      endpoint="/transactions"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Transactions', value: rows.length, icon: FaExchangeAlt, tone: 'blue', change: 'Today' },
        { label: 'Receipts', value: rows.filter((item) => item.status === 'Success').length, icon: FaReceipt, tone: 'emerald', change: 'Issued' }
      ]}
      actions={[
        { label: 'Export PDF', primary: true, onClick: exportTransactionLedger }
      ]}
      chartBuilder={() => ({
        title: 'Cash Flow',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-emerald-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Transaction bars and line charts can be expanded from this shell.</div>,
        tableTitle: 'Transaction Ledger',
        tableSubtitle: 'Cash, cheque, online, UPI, NEFT, RTGS, and IMPS'
      })}
    />
  );
}

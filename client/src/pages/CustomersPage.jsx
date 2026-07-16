import { FaSearch, FaUsers } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'customerId', label: 'Customer ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'pan', label: 'PAN' },
  { key: 'kycStatus', label: 'KYC' }
];

export default function CustomersPage() {
  return (
    <SectionPage
      title="Customer Intelligence"
      subtitle="Autocomplete search across account number, phone, Aadhaar, and PAN with a rich customer profile workflow."
      endpoint="/customers"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Customers', value: rows.length, icon: FaUsers, tone: 'blue', change: 'Registry' },
        { label: 'Verified', value: rows.filter((item) => item.kycStatus === 'Verified').length, icon: FaSearch, tone: 'emerald', change: 'KYC' }
      ]}
      chartBuilder={(rows) => ({
        title: 'Customer Portfolio',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-blue-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Customer graph data is available through the reusable chart shell.</div>,
        tableTitle: 'Customer Directory',
        tableSubtitle: 'Quick lookup across the internal customer base'
      })}
    />
  );
}

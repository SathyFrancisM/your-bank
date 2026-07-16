import { FaWallet, FaExchangeAlt, FaBell, FaSearch } from 'react-icons/fa';
import DashboardPage from '../components/DashboardPage.jsx';
import TrendChart from '../components/TrendChart.jsx';

const columns = [
  { key: 'module', label: 'Module' },
  { key: 'detail', label: 'Detail' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value' }
];

export default function EmployeeDashboardPage() {
  return (
    <DashboardPage
      title="Employee Dashboard"
      subtitle="Customer operations, deposits, withdrawals, account actions, and live notifications in a single secure workbench."
      endpoint="/dashboard/employee"
      columns={columns}
      buildStats={(summary) => [
        { label: 'Customers', value: summary.customers || 0, icon: FaSearch, tone: 'blue', change: 'Live' },
        { label: 'Transactions', value: summary.transactions?.length || 0, icon: FaExchangeAlt, tone: 'emerald', change: 'Today' },
        { label: 'Notifications', value: summary.notifications?.length || 0, icon: FaBell, tone: 'amber', change: 'Realtime' },
        { label: 'Accounts', value: summary.accounts || 0, icon: FaWallet, tone: 'rose', change: 'Active' }
      ]}
      buildRows={(summary) => [
        ...(summary.transactions || []).slice(0, 4).map((item) => ({ module: 'Txn', detail: item.transactionId, status: item.type, value: `₹${Number(item.amount || 0).toLocaleString('en-IN')}` })),
        ...(summary.notifications || []).slice(0, 4).map((item) => ({ module: 'Alert', detail: item.title, status: item.type, value: item.priority }))
      ]}
      buildRisk={(summary) => ({ score: 18, reasons: ['Customer servicing', 'Operations normal'], suggestedAction: 'Continue standard controls', employeeName: 'Employee Workspace' })}
      buildChart={() => ({
        title: 'Operational Trend',
        content: <TrendChart labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']} values={[12, 16, 14, 18, 22, 20]} label="Transactions" color="#2563eb" />,
        tableTitle: 'Recent Activity',
        tableSubtitle: 'Operational snapshot from the manager security feed',
        emptyMessage: 'No recent activity found.'
      })}
    />
  );
}

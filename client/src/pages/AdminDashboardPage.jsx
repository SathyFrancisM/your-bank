import { FaUserShield, FaUsersCog, FaFileAlt, FaSlidersH } from 'react-icons/fa';
import DashboardPage from '../components/DashboardPage.jsx';
import TrendChart from '../components/TrendChart.jsx';

const columns = [
  { key: 'label', label: 'Label' },
  { key: 'value', label: 'Value' },
  { key: 'state', label: 'State' }
];

export default function AdminDashboardPage() {
  return (
    <DashboardPage
      title="Admin Overview"
      subtitle="Full control over employees, managers, permissions, logs, and system settings."
      endpoint="/dashboard/admin"
      columns={columns}
      buildStats={(summary) => [
        { label: 'Employees', value: summary.employees || 0, icon: FaUserShield, tone: 'blue', change: 'Total' },
        { label: 'Managers', value: summary.managers || 0, icon: FaUsersCog, tone: 'emerald', change: 'Active' },
        { label: 'Logs', value: summary.logs || 0, icon: FaFileAlt, tone: 'amber', change: 'Audit' },
        { label: 'Risks', value: summary.risks || 0, icon: FaSlidersH, tone: 'rose', change: 'Scored' }
      ]}
      buildRows={(summary) => [
        { label: 'Employees', value: summary.employees || 0, state: 'Tracked' },
        { label: 'Managers', value: summary.managers || 0, state: 'Managed' },
        { label: 'Logs', value: summary.logs || 0, state: 'Audited' }
      ]}
      buildRisk={(summary) => ({ score: 18, reasons: ['Administrative control surface'], suggestedAction: 'Continue with controlled access', employeeName: 'Admin Console' })}
      buildChart={() => ({
        title: 'System Governance',
        content: <TrendChart labels={['Access', 'Logs', 'Reports', 'Controls', 'Roles', 'Policies']} values={[4, 10, 8, 12, 6, 9]} label="Governance Score" color="#1d4ed8" />,
        tableTitle: 'Configuration Snapshot',
        tableSubtitle: 'Bank-wide operational settings'
      })}
    />
  );
}

import { FaSearch, FaFileAlt, FaShieldAlt, FaChartLine } from 'react-icons/fa';
import DashboardPage from '../components/DashboardPage.jsx';
import TrendChart from '../components/TrendChart.jsx';

const columns = [
  { key: 'label', label: 'Label' },
  { key: 'value', label: 'Value' },
  { key: 'note', label: 'Note' }
];

export default function AuditorDashboardPage() {
  return (
    <DashboardPage
      title="Auditor Dashboard"
      subtitle="Read-only controls for audit trails, suspicious activity review, and compliance evidence collection."
      endpoint="/dashboard/auditor"
      columns={columns}
      buildStats={(summary) => [
        { label: 'Logs', value: summary.requests?.length || 0, icon: FaFileAlt, tone: 'blue', change: 'Read-only' },
        { label: 'Flags', value: summary.risks?.filter((item) => item.level === 'High Risk').length || 0, icon: FaShieldAlt, tone: 'rose', change: 'Critical' },
        { label: 'Checks', value: summary.employees?.length || 0, icon: FaSearch, tone: 'amber', change: 'Reviewed' },
        { label: 'Trends', value: summary.recordings?.length || 0, icon: FaChartLine, tone: 'emerald', change: 'Visible' }
      ]}
      buildRows={(summary) => [
        ...(summary.risks || []).slice(0, 6).map((item) => ({ label: item.employeeName, value: item.score, note: item.level })),
        ...(summary.logs || []).slice(0, 4).map((item) => ({ label: item.action, value: item.actorId, note: item.module }))
      ]}
      buildRisk={(summary) => ({ score: summary.risks?.[0]?.score || 38, reasons: summary.risks?.[0]?.reasons || ['Audit review'], suggestedAction: summary.risks?.[0]?.suggestedAction || 'Sample compliance review', employeeName: summary.risks?.[0]?.employeeName || 'Audit Feed' })}
      buildChart={() => ({
        title: 'Compliance Trend',
        content: <TrendChart labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} values={[7, 10, 12, 9, 13, 11]} label="Audit Alerts" color="#0f766e" />,
        tableTitle: 'Audit Snapshot',
        tableSubtitle: 'Compliance review signals'
      })}
    />
  );
}

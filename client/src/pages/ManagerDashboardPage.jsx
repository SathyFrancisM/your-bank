import { FaShieldAlt, FaVideo, FaUsers, FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import api from '../services/api.js';
import DashboardPage from '../components/DashboardPage.jsx';
import TrendChart from '../components/TrendChart.jsx';

const columns = [
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'risk', label: 'Risk' }
];

export default function ManagerDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const reviewRequest = async (id, action) => {
    await api.patch(`/manager/login-requests/${id}/${action}`);
    setRefreshKey((current) => current + 1);
  };

  return (
    <DashboardPage
      title="Manager Dashboard"
      subtitle="Approve unusual logins, inspect recordings, review risk scores, and monitor suspicious activity in real time."
      endpoint="/dashboard/manager"
      columns={columns}
      buildStats={(summary) => [
        { label: 'Pending Approvals', value: summary.requests?.filter((item) => item.status === 'Pending').length || 0, icon: FaShieldAlt, tone: 'blue', change: 'Review' },
        { label: 'Recordings', value: summary.recordings?.length || 0, icon: FaVideo, tone: 'emerald', change: 'Active' },
        { label: 'Employees', value: summary.employees?.length || 0, icon: FaUsers, tone: 'amber', change: 'Tracked' },
        { label: 'Alerts', value: summary.risks?.filter((item) => item.level === 'High Risk').length || 0, icon: FaBell, tone: 'rose', change: 'Critical' }
      ]}
      buildRows={(summary) => [
        ...(summary.requests || []).slice(0, 5).map((item) => ({ type: 'Login', name: item.employeeName, status: item.status, risk: item.riskScore })),
        ...(summary.risks || []).slice(0, 5).map((item) => ({ type: 'Risk', name: item.employeeName, status: item.level, risk: item.score }))
      ]}
      buildRisk={(summary) => ({ score: summary.risks?.[0]?.score || 72, reasons: summary.risks?.[0]?.reasons || ['Outside Office', 'Different Device'], suggestedAction: summary.risks?.[0]?.suggestedAction || 'Escalate to compliance', employeeName: summary.risks?.[0]?.employeeName || 'Manager Feed' })}
      buildChart={(summary) => ({
        title: 'Approval Trend',
        content: <TrendChart labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']} values={[3, 8, 5, 9, 6, 11]} label="Pending Decisions" color="#0ea5e9" />,
        tableTitle: 'Risk Focus',
        tableSubtitle: 'High priority manager interventions',
        emptyMessage: 'No manager data available.'
      })}
      actions={[
        { label: 'Refresh Requests', onClick: () => setRefreshKey((current) => current + 1), primary: false },
        { label: 'Approve Top Login', onClick: async () => {
          const response = await api.get('/manager/login-requests');
          const next = response.data.data?.[0];
          if (next) await reviewRequest(next._id, 'approve');
        }, primary: true }
      ]}
    />
  );
}

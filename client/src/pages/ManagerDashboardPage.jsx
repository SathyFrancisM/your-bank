import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaVideo, FaBell, FaShieldAlt, FaUsers } from 'react-icons/fa';
import api from '../services/api.js';
import Panel from '../components/Panel.jsx';
import StatCard from '../components/StatCard.jsx';
import RiskCard from '../components/RiskCard.jsx';
import TrendChart from '../components/TrendChart.jsx';
import DataTable from '../components/DataTable.jsx';

export default function ManagerDashboardPage() {
  const [data, setData] = useState({ requests: [], recordings: [], risks: [], employees: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [dashboardResponse, requestResponse] = await Promise.all([
      api.get('/dashboard/manager'),
      api.get('/manager/login-requests')
    ]);
    setData({
      ...dashboardResponse.data.data,
      requests: requestResponse.data.data || []
    });
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    await api.patch(`/manager/login-requests/${id}/approve`);
    await load();
  };

  const reject = async (id) => {
    await api.patch(`/manager/login-requests/${id}/reject`);
    await load();
  };

  const columns = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'location', label: 'Current Location', render: (row) => `${row.location?.latitude || '-'}, ${row.location?.longitude || '-'}` },
    { key: 'createdAt', label: 'Current Time', render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: 'reason', label: 'Reason', render: (row) => (row.reason || []).join(', ') },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => approve(row._id)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
            <FaCheck /> Approve
          </button>
          <button type="button" onClick={() => reject(row._id)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white">
            <FaTimes /> Reject
          </button>
        </div>
      )
    }
  ];

  const activeRisk = data.risks?.[0] || { employeeName: 'Manager Feed', score: 0, reasons: [], suggestedAction: 'No active risk' };

  if (loading) {
    return <div className="glass-card rounded-3xl p-8 text-sm text-slate-600 dark:text-slate-300">Loading manager approval console...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Approvals" value={data.requests.length} icon={FaShieldAlt} tone="blue" change="Review" />
        <StatCard label="Recordings" value={data.recordings.length} icon={FaVideo} tone="emerald" change="Active" />
        <StatCard label="Employees" value={data.employees.length} icon={FaUsers} tone="amber" change="Tracked" />
        <StatCard label="Alerts" value={data.risks.filter((item) => item.level === 'High Risk').length} icon={FaBell} tone="rose" change="Critical" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Pending Login Requests" subtitle="Approve or reject unusual logins before the employee enters the portal.">
          <DataTable columns={columns} rows={data.requests} emptyMessage="No pending login requests." />
        </Panel>
        <RiskCard score={activeRisk.score} reasons={activeRisk.reasons} suggestedAction={activeRisk.suggestedAction} employeeName={activeRisk.employeeName} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Recording History" subtitle="Manager-visible screen recording archive.">
          <DataTable
            columns={[
              { key: 'employeeName', label: 'Employee' },
              { key: 'startTime', label: 'Start' },
              { key: 'endTime', label: 'End' },
              { key: 'status', label: 'Status' }
            ]}
            rows={data.recordings}
            emptyMessage="No recordings yet."
          />
        </Panel>
        <Panel title="Approval Trend" subtitle="Security workload over the week.">
          <TrendChart labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']} values={[3, 8, 5, 9, 6, 11]} label="Pending Decisions" color="#0ea5e9" />
        </Panel>
      </div>
    </div>
  );
}

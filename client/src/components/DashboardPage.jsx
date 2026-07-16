import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import LoadingSkeleton from './LoadingSkeleton.jsx';
import ModulePage from './ModulePage.jsx';

const normalize = (value) => (Array.isArray(value) ? value : []);

export default function DashboardPage({ title, subtitle, endpoint, buildStats, buildRows, buildRisk, buildChart, columns, actions = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(endpoint);
        if (alive) {
          setSummary(response.data.data ?? response.data);
        }
      } catch (requestError) {
        if (alive) {
          setError(requestError.response?.data?.message || 'Failed to load dashboard');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  const stats = useMemo(() => (buildStats ? buildStats(summary || {}) : []), [summary, buildStats]);
  const rows = useMemo(() => normalize(buildRows ? buildRows(summary || {}) : []), [summary, buildRows]);
  const risk = useMemo(() => (buildRisk ? buildRisk(summary || {}) : null), [summary, buildRisk]);
  const chart = useMemo(() => (buildChart ? buildChart(summary || {}) : null), [summary, buildChart]);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (error) {
    return <div className="glass-card rounded-3xl p-8 text-sm text-rose-600 dark:text-rose-300">{error}</div>;
  }

  return <ModulePage title={title} subtitle={subtitle} stats={stats} rows={rows} columns={columns} risk={risk} chart={chart} actions={actions} />;
}

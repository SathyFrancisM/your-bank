import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import LoadingSkeleton from './LoadingSkeleton.jsx';
import ModulePage from './ModulePage.jsx';

const toRows = (items = [], transform) => (transform ? items.map(transform) : items);

export default function SectionPage({
  title,
  subtitle,
  endpoint,
  columns,
  transform,
  statsBuilder,
  riskBuilder,
  chartBuilder,
  actions = [],
  emptyMessage,
  query = {}
}) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(endpoint, { params: query });
        if (!alive) return;
        const payload = response.data.data ?? response.data;
        if (Array.isArray(payload)) {
          setData(payload);
          setSummary(null);
        } else {
          setData(payload.items || payload.rows || payload.records || payload.data || []);
          setSummary(payload);
        }
      } catch (requestError) {
        if (alive) {
          setError(requestError.response?.data?.message || 'Failed to load data');
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
  }, [endpoint, JSON.stringify(query)]);

  const rows = useMemo(() => toRows(data, transform), [data, transform]);
  const stats = statsBuilder ? statsBuilder(summary || data) : [];
  const risk = riskBuilder ? riskBuilder(summary || data) : null;
  const chart = chartBuilder ? chartBuilder(summary || data) : null;

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-8 text-sm text-rose-600 dark:text-rose-300">
        {error}
      </div>
    );
  }

  return <ModulePage title={title} subtitle={subtitle} stats={stats} rows={rows} columns={columns} risk={risk} chart={chart} actions={actions} emptyMessage={emptyMessage} />;
}

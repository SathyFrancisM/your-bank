import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import Panel from './Panel.jsx';
import StatCard from './StatCard.jsx';
import DataTable from './DataTable.jsx';
import RiskCard from './RiskCard.jsx';

export default function ModulePage({ title, subtitle, stats = [], rows = [], columns = [], risk = null, chart = null, actions = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Enterprise Banking Workspace</p>
          <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <button key={action.label} type="button" onClick={action.onClick} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${action.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-950/5 text-slate-700 hover:bg-slate-950/10 dark:bg-white/10 dark:text-slate-100'}`}>
                {action.label}
                <FaArrowRight />
              </button>
            ))}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel title={chart?.title || 'Operational Snapshot'} subtitle={chart?.subtitle || 'Live performance view'}>
          {chart?.content || <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/40 text-sm text-slate-500 dark:border-slate-700 dark:bg-white/5 dark:text-slate-400">Chart placeholder supplied by page data.</div>}
        </Panel>
        {risk ? <RiskCard {...risk} /> : <Panel title="Quick Notes"><div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">{chart?.notes?.map((note) => <p key={note}>• {note}</p>) || <p>No risk card configured for this page.</p>}</div></Panel>}
      </div>

      <Panel title={chart?.tableTitle || 'Recent Records'} subtitle={chart?.tableSubtitle || 'Latest operational rows'}>
        <DataTable columns={columns} rows={rows} emptyMessage={chart?.emptyMessage || 'No table data available.'} />
      </Panel>
    </motion.div>
  );
}

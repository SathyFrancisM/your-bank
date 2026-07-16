import { FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { riskBand } from '../utils/risk.js';

export default function RiskCard({ score = 0, reasons = [], suggestedAction = 'No action', employeeName = 'Employee' }) {
  const band = riskBand(score);
  const isDanger = band.tone === 'danger';

  return (
    <div className="glass-card rounded-3xl p-5 shadow-glow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Employee Risk Card</p>
          <h3 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{employeeName}</h3>
        </div>
        <div className={`rounded-2xl p-3 ${isDanger ? 'bg-rose-500/10 text-rose-500' : band.tone === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {isDanger ? <FaExclamationTriangle className="text-xl" /> : <FaShieldAlt className="text-xl" />}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Risk Score</p>
          <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">{score}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${isDanger ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : band.tone === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'}`}>
          {band.label}
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-950/5 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-white">Reasons</p>
        <ul className="mt-2 space-y-2">
          {reasons.length ? reasons.map((reason) => <li key={reason}>• {reason}</li>) : <li>• No active risk reasons</li>}
        </ul>
        <p className="mt-3 font-semibold text-slate-900 dark:text-white">Suggested Action</p>
        <p className="mt-1">{suggestedAction}</p>
      </div>
    </div>
  );
}

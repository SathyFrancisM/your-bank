import { motion } from 'framer-motion';

export default function StatCard({ label, value, change, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-cyan-300',
    emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300',
    rose: 'from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-300'
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="glass-card rounded-3xl p-5 shadow-glow">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${toneMap[tone]}`}>
        <Icon className="text-xl" />
      </div>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
        {change && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">{change}</span>}
      </div>
    </motion.div>
  );
}

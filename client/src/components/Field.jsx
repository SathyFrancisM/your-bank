export default function Field({ label, icon: Icon, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>}
      <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-glow transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70">
        {Icon && <Icon className="text-slate-400" />}
        <input {...props} className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white ${className}`} />
      </div>
    </label>
  );
}

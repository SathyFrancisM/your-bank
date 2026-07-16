export default function Panel({ title, subtitle, children, actions = null, className = '' }) {
  return (
    <section className={`glass-card rounded-3xl p-5 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

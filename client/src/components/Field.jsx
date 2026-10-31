export default function Field({ label, icon: Icon, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </span>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70">
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Icon />
          </div>
        )}

        <input
          {...props}
          className={`
            w-full
            bg-transparent
            text-sm
            text-slate-900
            caret-slate-900
            outline-none
            placeholder:text-slate-400
            focus:text-slate-900
            dark:text-slate-900
            dark:focus:text-slate-900
            dark:placeholder:text-slate-400
            ${className}
          `}
          style={{
            color: '#0f172a',
            WebkitTextFillColor: '#0f172a',
            caretColor: '#0f172a',
          }}
        />
      </div>
    </label>
  );
}
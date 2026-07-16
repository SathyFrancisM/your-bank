import { FaSignOutAlt, FaBell, FaShieldAlt, FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useUi } from '../context/UiContext.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';

export default function Topbar({ title = 'Dashboard', subtitle = '' }) {
  const { user, logout, notifications } = useAuth();
  const { theme, toggleTheme } = useUi();
  const { securityState } = useSecurity();

  return (
    <header className="glass-card sticky top-4 z-30 rounded-[2rem] px-5 py-4 shadow-glow ui-shell">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:text-slate-400">{user?.role || 'Employee'} Portal</p>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
            <FaShieldAlt />
            Light Mode
          </div>
          <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${securityState.score >= 80 ? 'border border-rose-200 bg-rose-50 text-rose-700' : securityState.score >= 60 ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            Risk {securityState.score}
          </div>
          <button type="button" className="relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15">
            <FaBell />
            Alerts
            {notifications.length > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.length}</span>}
          </button>
          <div className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] md:block">{user?.name || 'Unknown User'}</div>
          <button type="button" onClick={() => logout()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-rose-300 hover:bg-rose-500 hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

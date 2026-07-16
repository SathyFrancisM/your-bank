import { FaMoon, FaSun, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { useUi } from '../context/UiContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title = 'Dashboard', subtitle = '' }) {
  const { theme, toggleTheme } = useUi();
  const { user, logout, notifications } = useAuth();

  return (
    <header className="glass-card sticky top-4 z-30 rounded-[2rem] px-5 py-4 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">{user?.role || 'Employee'} Portal</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950/5 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button type="button" className="relative inline-flex items-center gap-2 rounded-2xl bg-slate-950/5 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15">
            <FaBell />
            Alerts
            {notifications.length > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.length}</span>}
          </button>
          <div className="hidden rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:block">{user?.name || 'Unknown User'}</div>
          <button type="button" onClick={() => logout()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950/5 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-rose-500 hover:text-white dark:bg-white/10 dark:text-slate-100">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

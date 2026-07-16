import { FaUserCircle } from 'react-icons/fa';
import Panel from '../components/Panel.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Panel title="Profile" subtitle="Employee identity, role, and access footprint.">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="grid h-56 place-items-center rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-200">
          <FaUserCircle className="text-8xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/5 p-4 dark:bg-white/5"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.name}</p></div>
          <div className="rounded-3xl bg-slate-950/5 p-4 dark:bg-white/5"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Employee ID</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.employeeId}</p></div>
          <div className="rounded-3xl bg-slate-950/5 p-4 dark:bg-white/5"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.role}</p></div>
          <div className="rounded-3xl bg-slate-950/5 p-4 dark:bg-white/5"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Branch</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.branch || 'Corporate'}</p></div>
        </div>
      </div>
    </Panel>
  );
}

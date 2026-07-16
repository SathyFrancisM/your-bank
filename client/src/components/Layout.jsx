import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Banner from './Banner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect } from 'react';
import { useScreenRecorder } from '../hooks/useScreenRecorder.js';
import { useSecurity } from '../context/SecurityContext.jsx';

export default function Layout({ title, subtitle }) {
  const { user, recordingActive, loginState } = useAuth();
  const { securityState } = useSecurity();
  const recorder = useScreenRecorder(Boolean(user), user);

  useEffect(() => {
    if (user && !recorder.active) {
      recorder.start();
    }
    if (!user && recorder.active) {
      recorder.stop();
    }
  }, [user]);

  return (
    <div className="min-h-screen px-3 py-3 lg:px-6 lg:py-6">
      <Banner active={recordingActive} />
      <div className="mx-auto flex max-w-[1700px] gap-4">
        <Sidebar role={user?.role || loginState?.employee?.role || 'Teller'} />
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar title={title} subtitle={subtitle} />
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`rounded-3xl border bg-white/80 px-4 py-3 shadow-sm ${securityState.score >= 80 ? 'border-rose-200' : securityState.score >= 60 ? 'border-amber-200' : 'border-emerald-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Security Intent</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{securityState.intent}</p>
              <p className="mt-1 text-xs text-slate-500">{securityState.intentDetail}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Activity Count</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{securityState.activity.length}</p>
              <p className="mt-1 text-xs text-slate-500">Live monitored actions this session</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Forced Logouts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{securityState.forcedLogouts.length}</p>
              <p className="mt-1 text-xs text-slate-500">Policy violations terminated in-session</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

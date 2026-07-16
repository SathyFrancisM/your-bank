import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Banner from './Banner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect } from 'react';
import { useScreenRecorder } from '../hooks/useScreenRecorder.js';

export default function Layout({ title, subtitle }) {
  const { user, recordingActive, loginState } = useAuth();
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
          <div className="min-h-0 flex-1 space-y-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

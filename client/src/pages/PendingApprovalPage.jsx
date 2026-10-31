import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Panel from '../components/Panel.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const roleRoute = {
  Admin: '/admin/dashboard',
  Manager: '/manager/dashboard',
  Teller: '/employee/dashboard',
  Auditor: '/auditor/dashboard'
};

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const pending = location.state || auth.loginState;
  const [message, setMessage] = useState('Waiting for manager decision...');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pending) {
      navigate('/login', { replace: true });
    }
  }, [pending, navigate]);

  useEffect(() => {
    if (!pending?.loginRequestId) return undefined;
    const timer = setInterval(async () => {
      try {
        setBusy(true);
        const response = await auth.finalizeLogin(pending.loginRequestId);
        const role = response.employee?.role || 'Teller';
        navigate(roleRoute[role] || '/employee/dashboard', { replace: true });
      } catch (requestError) {
        if (requestError.response?.status === 409) {
          setMessage('Manager approval is still pending. The employee cannot access the portal until approval is granted.');
        }
      } finally {
        setBusy(false);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [pending?.loginRequestId, navigate, auth]);

  if (!pending) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Panel className="w-full max-w-2xl rounded-[2rem] p-8" title="Unusual Login Detected" subtitle="The request was escalated to a manager because the login did not satisfy the zero trust policy.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/5 p-4 text-sm dark:bg-white/5">
            <p className="text-slate-500 dark:text-slate-400">Employee</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{pending.employee?.name}</p>
            <p className="text-slate-500 dark:text-slate-400">{pending.employee?.employeeId}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/5 p-4 text-sm dark:bg-white/5">
            <p className="text-slate-500 dark:text-slate-400">Reasons</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{(pending.reasons || []).join(', ') || 'Manager approval required'}</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
          {busy ? 'Checking approval status...' : message}
        </div>
        <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          The employee remains blocked until the manager approves the login request.
        </div>
      </Panel>
    </div>
  );
}

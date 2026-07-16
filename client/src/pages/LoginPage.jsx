import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFingerprint, FaIdCard, FaLock } from 'react-icons/fa';
import Field from '../components/Field.jsx';
import Panel from '../components/Panel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { collectLoginContext } from '../utils/device.js';

const demoAccounts = [
  { label: 'Admin', employeeId: 'ADM001', password: 'Bank@123' },
  { label: 'Manager', employeeId: 'MGR001', password: 'Bank@123' },
  { label: 'Teller', employeeId: 'TEL001', password: 'Bank@123' },
  { label: 'Auditor', employeeId: 'AUD001', password: 'Bank@123' }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ employeeId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoAccount = (account) => {
    setForm({ employeeId: account.employeeId, password: account.password });
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const context = await collectLoginContext();
      const response = await auth.login({
        employeeId: form.employeeId.trim(),
        password: form.password,
        ...context
      });
      navigate('/otp', { state: response });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 ui-grid opacity-40" />
      <div className="pointer-events-none absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-[18%] h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="fade-up relative overflow-hidden rounded-[2.25rem] p-8 ui-glow">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.12),transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-blue-700">Internal Bank Access</p>
              <h1 className="mt-5 max-w-xl font-display text-5xl font-bold leading-tight text-slate-900 dark:text-white">Secure, fast, and visibly controlled employee access.</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">Login captures device, browser, OS, timezone, IP, and GPS metadata before OTP verification and manager approval. The workspace is designed to make policy visible, not hidden.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'RBAC enforced', value: 'Role aware' },
                { label: 'Audit every action', value: 'Immutable trail' },
                { label: 'Risk scoring live', value: 'Realtime signal' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-5 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expected flow</div>
                  <div className="mt-2 text-sm text-slate-700">Login → OTP → Workspace → Policy monitored actions</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Behavior policy</div>
                  <div className="mt-2 text-sm text-slate-700">Tab switching, download attempts, and honeypot access are blocked immediately.</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="fade-up rounded-[2.25rem] p-8 ui-glow" title="Employee Login" subtitle="Use your Employee ID and password to enter the secure workflow.">
          <form onSubmit={submit} className="space-y-5">
            <Field label="Employee ID" icon={FaIdCard} value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} placeholder="ADM001" required />
            <Field label="Password" icon={FaLock} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Bank@123" required />
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
              <FaFingerprint />
              {loading ? 'Verifying...' : 'Generate OTP'}
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Demo credentials</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All demo accounts use the same password: Bank@123.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.employeeId}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{account.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{account.employeeId}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            GPS and metadata are captured automatically after browser permission and are never requested as manual input.
          </div>
        </Panel>
      </div>
    </div>
  );
}

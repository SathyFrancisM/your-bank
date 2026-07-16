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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel className="relative overflow-hidden rounded-[2rem] p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.14),transparent_35%)]" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Internal Bank Access</p>
            <h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight text-slate-900 dark:text-white">Zero Trust core banking portal for privileged operations.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Employee login automatically captures device, browser, OS, timezone, IP, and GPS metadata before applying OTP verification and manager approval rules.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['RBAC enforced', 'Audit every action', 'Risk scoring live'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/65 px-4 py-4 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">{item}</div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="rounded-[2rem] p-8" title="Employee Login" subtitle="Use your Employee ID and password to enter the secure workflow.">
          <form onSubmit={submit} className="space-y-5">
            <Field label="Employee ID" icon={FaIdCard} value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} placeholder="ADM001" required />
            <Field label="Password" icon={FaLock} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Bank@123" required />
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
              <FaFingerprint />
              {loading ? 'Verifying...' : 'Generate OTP'}
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
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
          <div className="mt-6 rounded-2xl bg-slate-950/5 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            GPS and metadata are captured automatically after browser permission and are never requested as manual input.
          </div>
        </Panel>
      </div>
    </div>
  );
}

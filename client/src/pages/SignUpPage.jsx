import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaBuilding,
  FaIdBadge, FaFingerprint, FaArrowLeft, FaCheckCircle
} from 'react-icons/fa';
import Field from '../components/Field.jsx';
import Panel from '../components/Panel.jsx';
import api from '../services/api.js';

const ROLES = ['Teller', 'Manager', 'Auditor', 'Admin'];
const DEPARTMENTS = ['Branch Ops', 'Operations', 'Audit', 'Compliance', 'IT', 'HR', 'Finance'];
const BRANCHES = [
  'Head Office', 'Mumbai Central', 'Delhi Prime', 'Bengaluru Tech Park',
  'Chennai South', 'Hyderabad Hub', 'Pune West', 'Kolkata East'
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=form, 2=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Teller',
    department: 'Branch Ops',
    branch: 'Head Office'
  });

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const handleRoleChange = (role) => {
    const deptMap = { Manager: 'Operations', Auditor: 'Audit', Admin: 'IT', Teller: 'Branch Ops' };
    setForm((f) => ({ ...f, role, department: deptMap[role] || 'Branch Ops' }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        department: form.department,
        branch: form.branch
      });
      setCreated(data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (step === 2 && created) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <div className="pointer-events-none absolute inset-0 ui-grid opacity-40" />
        <div className="pointer-events-none absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8%] top-[18%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="fade-up relative w-full max-w-lg">
          <Panel className="rounded-[2.25rem] p-10 text-center ui-glow">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-4xl">
              <FaCheckCircle />
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Account Created!</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Your banking portal account is ready.</p>

            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-left dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Your Employee ID</p>
              <p className="mt-2 font-mono text-4xl font-extrabold text-blue-700 dark:text-blue-300">{created.employeeId}</p>
              <p className="mt-3 text-sm text-blue-600 dark:text-blue-400">
                Role: <strong>{created.role}</strong> &nbsp;·&nbsp; {created.email}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              📧 If email is configured, a welcome email with your Employee ID has been sent to <strong>{created.email}</strong>.
              Save your Employee ID — you will need it to log in.
            </div>

            <button
              onClick={() => navigate('/login')}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <FaFingerprint /> Go to Login
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  /* ── Registration form ──────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 ui-grid opacity-40" />
      <div className="pointer-events-none absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] bottom-[10%] h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative grid w-full max-w-7xl gap-6 lg:grid-cols-[1fr_1.1fr]">

        {/* Left info panel */}
        <Panel className="fade-up relative overflow-hidden rounded-[2.25rem] p-8 ui-glow">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.12),transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                <FaArrowLeft className="text-xs" /> Back to login
              </Link>
              <p className="mt-5 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-blue-700">Employee Registration</p>
              <h1 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight text-slate-900 dark:text-white">
                Create your secure bank employee account.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
                Register once. Every login is protected by OTP sent to your email, zero-trust risk scoring, and manager approval for unusual access patterns.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Email OTP on every login', value: 'Real verification' },
                { label: 'Role-based access', value: 'RBAC enforced' },
                { label: 'Session recording', value: 'Audit trail' },
                { label: 'Zero-trust policy', value: 'Always verified' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Right: form */}
        <Panel className="fade-up rounded-[2.25rem] p-8 ui-glow" title="Create Account" subtitle="Fill in your details. Your Employee ID will be auto-generated.">
          <form onSubmit={submit} className="space-y-4" noValidate>

            {/* Name + Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="reg-name" label="Full Name" icon={FaUser} value={form.name} onChange={set('name')} placeholder="Priya Mehta" required autoComplete="name" />
              <Field id="reg-email" label="Work Email" icon={FaEnvelope} type="email" value={form.email} onChange={set('email')} placeholder="priya@bankcorp.local" required autoComplete="email" />
            </div>

            {/* Phone */}
            <Field id="reg-phone" label="Phone (optional)" icon={FaPhone} type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 99000 00000" autoComplete="tel" />

            {/* Role selector */}
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Role</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROLES.map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      form.role === r
                        ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Department + Branch */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Department</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 flex-shrink-0">
                    <FaBuilding />
                  </div>
                  <select value={form.department} onChange={set('department')} className="w-full bg-transparent text-sm outline-none text-slate-700 dark:text-white">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Branch</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 flex-shrink-0">
                    <FaIdBadge />
                  </div>
                  <select value={form.branch} onChange={set('branch')} className="w-full bg-transparent text-sm outline-none text-slate-700 dark:text-white">
                    {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="reg-password" label="Password" icon={FaLock} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required autoComplete="new-password" />
              <Field id="reg-confirm" label="Confirm Password" icon={FaLock} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required autoComplete="new-password" />
            </div>

            {/* Password strength hint */}
            {form.password && (
              <div className="flex gap-1.5">
                {[6, 10, 16].map((len, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${form.password.length >= len ? ['bg-rose-400', 'bg-amber-400', 'bg-emerald-500'][i] : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
                <span className="ml-2 text-xs text-slate-400">
                  {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Fair' : form.password.length < 16 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              <FaFingerprint />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                Sign in
              </Link>
            </p>
          </form>
        </Panel>
      </div>
    </div>
  );
}

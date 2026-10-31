import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaEnvelope, FaRedo } from 'react-icons/fa';
import Panel from '../components/Panel.jsx';
import OtpInput from '../components/OtpInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { collectLoginContext } from '../utils/device.js';

const roleRoute = {
  Admin: '/admin/dashboard',
  Manager: '/manager/dashboard',
  Teller: '/employee/dashboard',
  Auditor: '/auditor/dashboard'
};

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const loginState = location.state || auth.loginState;

  // Only auto-fill if SMTP is not configured (simulated OTP shown on screen / server console)
  const [otp, setOtp] = useState(loginState?.demoOtp || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!loginState) {
      navigate('/login', { replace: true });
    } else if (loginState.requiresManagerApproval) {
      navigate('/pending-approval', { state: loginState, replace: true });
    }
  }, [loginState, navigate]);

  // Cooldown countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!loginState) return null;

  const emailSent = loginState.otpDelivery === 'email';
  const isSimulated = loginState.otpDelivery === 'simulated';

  const submit = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) { setError('Enter the complete 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await auth.verifyOtp({ otpSessionId: loginState.otpSessionId, otp });
      if (response.requiresManagerApproval) {
        navigate('/pending-approval', { state: response });
      } else {
        const role = response.employee?.role || 'Teller';
        navigate(roleRoute[role] || '/employee/dashboard', { replace: true });
      }
    } catch (requestError) {
      setOtp('');
      setError(
        requestError.response?.data?.message ||
        (requestError.response
          ? `OTP verification failed (HTTP ${requestError.response.status})`
          : 'Cannot reach the verification service. Check server is running.')
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setOtp('');
    try {
      const context = await collectLoginContext();
      const response = await auth.login({
        employeeId: loginState.employee?.employeeId,
        password: '__resend__', // will fail gracefully — we navigate back if needed
        ...context
      });
      // If new login state returned, update and stay on OTP page
      navigate('/otp', { state: response, replace: true });
      setResendCooldown(60);
    } catch {
      setError('Could not resend OTP. Please go back and log in again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 ui-grid opacity-30" />
      <div className="pointer-events-none fixed left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <Panel className="fade-up relative w-full max-w-xl rounded-[2rem] p-8 ui-glow" title="Verify OTP" subtitle="Enter the 6-digit code to complete your secure login.">

        {/* Security result badge */}
        <div className="mb-5 rounded-3xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-200">
          <FaShieldAlt className="mr-2 inline-block" />
          {loginState.securityAssessment?.allowImmediately
            ? 'Standard access path — OTP verifies your identity.'
            : 'Unusual login detected — Manager approval required after OTP.'}
        </div>

        {/* ── Email OTP sent ── */}
        {emailSent && (
          <div className="mb-5 rounded-3xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <FaEnvelope className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">OTP sent to your email</p>
                <p className="mt-0.5 text-sm text-blue-600 dark:text-blue-300">
                  A 6-digit verification code was sent to{' '}
                  <strong>{loginState.employee?.email
                    ? loginState.employee.email.replace(/^(.{2}).*(@.*)$/, '$1***$2')
                    : 'your registered email'}</strong>.
                  Check your inbox and spam folder.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Simulated OTP (no SMTP configured) ── */}
        {isSimulated && loginState.demoOtp && (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">⚠ SMTP not configured — Dev mode</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Your OTP (also printed in the server console):
            </p>
            <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.25em] text-amber-800 dark:text-amber-200">
              {loginState.demoOtp}
            </p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Configure <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">SMTP_HOST</code>,{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">SMTP_USER</code>, and{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">SMTP_PASSWORD</code> in{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">server/.env</code> to send real emails.
            </p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5" noValidate>
          <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} />

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <button
            id="otp-verify-btn"
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            ← Back to login
          </button>
          {emailSent && (
            <button
              type="button"
              onClick={resend}
              disabled={resending || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
            >
              <FaRedo className={resending ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}

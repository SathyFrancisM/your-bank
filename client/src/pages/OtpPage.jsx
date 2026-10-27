import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';
import Panel from '../components/Panel.jsx';
import Field from '../components/Field.jsx';
import OtpInput from '../components/OtpInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const loginState = location.state || auth.loginState;
  const [otp, setOtp] = useState(loginState?.demoOtp || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loginState) {
      navigate('/login', { replace: true });
    }
  }, [loginState, navigate]);

  if (!loginState) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await auth.verifyOtp({ otpSessionId: loginState.otpSessionId, otp });
      if (response.requiresManagerApproval) {
        navigate('/pending-approval', { state: response });
      } else {
        navigate(`/${response.employee.role.toLowerCase()}/dashboard`, { replace: true });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || (requestError.response
        ? `OTP verification failed (HTTP ${requestError.response.status})`
        : 'Cannot reach the verification service. Check the Vercel /api route and server logs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Panel className="w-full max-w-xl rounded-[2rem] p-8" title="Verify OTP" subtitle="OTP verification finalizes your secure access request.">
        <div className="mb-5 rounded-3xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-200">
          <FaShieldAlt className="mr-2 inline-block" />
          Security result: {loginState.securityAssessment?.allowImmediately ? 'Standard access path' : 'Manager approval required after OTP'}
        </div>
        {loginState.demoOtp && (
          <div className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Demo OTP: <span className="font-mono font-bold">{loginState.demoOtp}</span>
          </div>
        )}
        {loginState.otpDelivery === 'email' && (
          <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
            A six-digit verification code was sent to your registered email address.
          </p>
        )}
        <form onSubmit={submit} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} />
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
          <button type="submit" disabled={loading || otp.length !== 6} className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </Panel>
    </div>
  );
}

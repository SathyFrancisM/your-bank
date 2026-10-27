export default function OtpInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      name="otp"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      minLength={6}
      maxLength={6}
      required
      placeholder="Enter 6-digit OTP"
      aria-label="Six-digit one-time password"
      className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-center font-mono text-xl tracking-[0.4em] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
    />
  );
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 shadow-glow">
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-2xl bg-slate-950/5 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

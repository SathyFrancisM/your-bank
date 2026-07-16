export default function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-white/50 bg-white/50 p-4 dark:border-slate-800 dark:bg-white/5">
          <div className="mb-3 h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

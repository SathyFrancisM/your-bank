export default function Banner({ active, label = 'Screen Recording is Active' }) {
  if (!active) return null;
  return (
    <div className="sticky top-0 z-50 border-b border-cyan-400/30 bg-cyan-500/90 px-4 py-2 text-center text-sm font-semibold text-white backdrop-blur">
      ● {label}
    </div>
  );
}

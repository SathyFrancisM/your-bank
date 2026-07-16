export default function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-glow backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="bank-scroll max-h-[420px] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id || index} className="transition hover:bg-blue-50/60 dark:hover:bg-slate-800/60">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

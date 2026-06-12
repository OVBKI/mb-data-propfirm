// Petits composants UI réutilisables.

export function Badge({ label, color }) {
  return <span className={`badge ${color || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-slate-800"}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ columns, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c} className="th">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="td text-center text-slate-400 py-8">{text}</td>
    </tr>
  );
}

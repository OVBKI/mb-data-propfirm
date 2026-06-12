// Petits composants UI réutilisables.

export function Badge({ label, color }) {
  return <span className={`badge ${color || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

export function StatCard({ label, value, sub, accent, icon, iconBg = "bg-brand-50 text-brand-600", trend }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {icon && <span className={`grid place-items-center w-9 h-9 rounded-xl ${iconBg}`}>{icon}</span>}
      </div>
      <p className={`mt-3 text-3xl font-display font-bold ${accent || "text-ink-900"}`}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className={`badge ${trend.dir === "down" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {trend.label}
          </span>
        )}
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
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

// Graphiques en SVG pur — aucune dépendance externe.

// Donut chart. data = [{ label, value, color }]
export function Donut({ data, size = 168, thickness = 22, centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f6" strokeWidth={thickness} />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return seg;
          })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="fill-ink-900 font-display font-bold" style={{ fontSize: size * 0.2 }}>
          {centerValue}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-slate-400" style={{ fontSize: size * 0.075 }}>
          {centerLabel}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-ink-800 font-medium">{d.value}</span>
            <span className="text-slate-500">{d.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Bar chart vertical. data = [{ label, value }]
export function BarChart({ data, height = 180, color = "#2f6bf0", format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
          <span className="text-xs font-medium text-ink-800">{format(d.value)}</span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              background: `linear-gradient(180deg, ${color}, ${color}cc)`,
            }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="text-[11px] text-slate-500 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Barres de progression horizontales. data = [{ label, value, color }]
export function ProgressBars({ data, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600">{d.label}</span>
            <span className="font-medium text-ink-800">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || "#2f6bf0" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

"use client";
import { useFleet } from "@/components/FleetProvider";
import { StatCard, PageHeader, Loading, Table, EmptyRow } from "@/components/ui";
import { GaugeIcon, TrendUpIcon, AlertIcon, EuroIcon } from "@/components/icons";
import { euros } from "@/lib/format";

function scoreColor(s) {
  if (s >= 85) return { text: "text-emerald-600", bg: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" };
  if (s >= 70) return { text: "text-amber-600", bg: "bg-amber-500", chip: "bg-amber-100 text-amber-700" };
  return { text: "text-rose-600", bg: "bg-rose-500", chip: "bg-rose-100 text-rose-700" };
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function EcoPage() {
  const { ready, data } = useFleet();
  if (!ready) return <Loading />;

  const { drivers, trucks, expenses } = data;

  // Coût carburant par camion → rattaché au chauffeur affecté pour estimer le gaspillage au ralenti.
  const fuelByTruck = {};
  for (const e of expenses) if (e.type === "carburant") fuelByTruck[e.truck_id] = (fuelByTruck[e.truck_id] || 0) + Number(e.amount || 0);
  const truckByDriver = Object.fromEntries(trucks.filter((t) => t.driver_id).map((t) => [t.driver_id, t]));

  const rows = drivers.map((d) => {
    const truck = truckByDriver[d.id];
    const fuelCost = truck ? (fuelByTruck[truck.id] || 0) : 0;
    // Gaspillage estimé = part du carburant brûlée au ralenti.
    const waste = Math.round(fuelCost * (Number(d.idling_pct || 0) / 100));
    return {
      d,
      score: Number(d.eco_score || 0),
      harsh: Number(d.harsh_braking || 0),
      speeding: Number(d.speeding || 0),
      idling: Number(d.idling_pct || 0),
      waste,
    };
  }).sort((a, b) => b.score - a.score);

  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  const best = rows[0];
  const riskEvents = rows.reduce((s, r) => s + r.harsh + r.speeding, 0);
  const savings = rows.reduce((s, r) => s + r.waste, 0);

  return (
    <div>
      <PageHeader title="Éco-conduite & scoring" subtitle="Notez chaque chauffeur et réduisez votre facture de carburant" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Score moyen flotte" value={`${avg}/100`} sub="éco-conduite" accent={scoreColor(avg).text} icon={<GaugeIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
        <StatCard label="Meilleur chauffeur" value={best ? best.score : "—"} sub={best ? `${best.d.first_name} ${best.d.last_name}` : ""} accent="text-emerald-600" icon={<TrendUpIcon size={18} />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="Événements à risque" value={riskEvents} sub="freinages + excès / sem." accent="text-amber-600" icon={<AlertIcon size={18} />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard label="Économies possibles" value={euros(savings)} sub="en réduisant le ralenti" accent="text-brand-600" icon={<EuroIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Classement */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-ink-900 mb-4">Classement</h2>
          <ul className="space-y-3">
            {rows.map((r, i) => {
              const c = scoreColor(r.score);
              return (
                <li key={r.d.id} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm">{MEDAL[i] || <span className="text-slate-400">{i + 1}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{r.d.first_name} {r.d.last_name}</p>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${r.score}%` }} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${c.text}`}>{r.score}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Détail des comportements */}
        <div className="card p-0 lg:col-span-2 overflow-hidden">
          <h2 className="font-semibold text-ink-900 p-5 pb-3">Détail par chauffeur</h2>
          <Table columns={["Chauffeur", "Score", "Freinages brusques", "Excès de vitesse", "Ralenti", "Gaspillage estimé"]}>
            {rows.length === 0 && <EmptyRow colSpan={6} text="Aucun chauffeur" />}
            {rows.map((r) => {
              const c = scoreColor(r.score);
              return (
                <tr key={r.d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="td font-medium">{r.d.first_name} {r.d.last_name}</td>
                  <td className="td"><span className={`badge ${c.chip}`}>{r.score}/100</span></td>
                  <td className="td">{r.harsh} <span className="text-slate-400 text-xs">/ sem.</span></td>
                  <td className="td">{r.speeding} <span className="text-slate-400 text-xs">/ sem.</span></td>
                  <td className="td">{r.idling}%</td>
                  <td className="td font-medium">{r.waste ? euros(r.waste) : "—"}</td>
                </tr>
              );
            })}
          </Table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Score calculé à partir des freinages brusques, excès de vitesse et temps de ralenti. Le gaspillage estimé correspond à la part du carburant brûlée moteur au ralenti — récupérable par la formation et le suivi. Pas besoin de caméras coûteuses : les données viennent du traceur GPS.
      </p>
    </div>
  );
}

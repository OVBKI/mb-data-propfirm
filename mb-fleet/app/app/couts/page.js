"use client";
import { useFleet } from "@/components/FleetProvider";
import { StatCard, PageHeader, Loading, Table, EmptyRow, Badge } from "@/components/ui";
import { ProgressBars, BarChart } from "@/components/charts";
import { EuroIcon, TrendUpIcon, TrendDownIcon, TruckIcon } from "@/components/icons";
import { euros, co2, km, CO2_PER_LITER, EXPENSE_TYPE } from "@/lib/format";

const EXPENSE_COLORS = {
  carburant: "#2f6bf0",
  peage: "#06b6d4",
  reparation: "#f59e0b",
  amende: "#f43f5e",
  autre: "#94a3b8",
  entretien: "#8b5cf6",
};

export default function CoutsPage() {
  const { ready, data } = useFleet();
  if (!ready) return <Loading />;

  const { trucks, expenses, maintenances, missions = [] } = data;

  // Agrégats par camion.
  const rows = trucks.map((t) => {
    const exp = expenses.filter((e) => e.truck_id === t.id);
    const fuelLiters = exp.filter((e) => e.type === "carburant").reduce((s, e) => s + Number(e.liters || 0), 0);
    const fuelCost = exp.filter((e) => e.type === "carburant").reduce((s, e) => s + Number(e.amount || 0), 0);
    const otherExp = exp.filter((e) => e.type !== "carburant").reduce((s, e) => s + Number(e.amount || 0), 0);
    const maintCost = maintenances.filter((m) => m.truck_id === t.id).reduce((s, m) => s + Number(m.cost || 0), 0);
    const truckMissions = missions.filter((m) => m.truck_id === t.id && m.status !== "annulee");
    const revenue = truckMissions.reduce((s, m) => s + Number(m.price || 0), 0);
    const missionKm = truckMissions.reduce((s, m) => s + Number(m.distance_km || 0), 0);
    const cost = fuelCost + otherExp + maintCost;
    const margin = revenue - cost;
    const co2kg = fuelLiters * (CO2_PER_LITER[t.fuel_type] ?? CO2_PER_LITER.diesel);
    const costPerKm = missionKm > 0 ? cost / missionKm : null;
    return { truck: t, revenue, fuelCost, otherExp, maintCost, cost, margin, co2kg, costPerKm, missionKm };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalMargin = totalRevenue - totalCost;
  const totalCo2 = rows.reduce((s, r) => s + r.co2kg, 0);
  const marginPct = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

  // Répartition des coûts par poste (dépenses + entretien).
  const byPost = {};
  for (const e of expenses) byPost[e.type] = (byPost[e.type] || 0) + Number(e.amount || 0);
  const maintTotal = maintenances.reduce((s, m) => s + Number(m.cost || 0), 0);
  if (maintTotal > 0) byPost.entretien = maintTotal;
  const costDist = Object.entries(byPost)
    .map(([type, value]) => ({ label: type === "entretien" ? "Entretien" : EXPENSE_TYPE[type] || type, value, color: EXPENSE_COLORS[type] || "#94a3b8" }))
    .sort((a, b) => b.value - a.value);

  // Marge par camion (graphe), seulement ceux qui ont du CA.
  const marginBars = rows
    .filter((r) => r.revenue > 0)
    .sort((a, b) => b.margin - a.margin)
    .map((r) => ({ label: r.truck.plate.replace("FR-", ""), value: Math.round(r.margin) }));

  const sorted = [...rows].sort((a, b) => b.margin - a.margin);

  return (
    <div>
      <PageHeader title="Coûts & CO₂" subtitle="Coût total de possession, marge par camion et empreinte carbone" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Chiffre d'affaires" value={euros(totalRevenue)} sub="missions" accent="text-brand-600" icon={<EuroIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
        <StatCard label="Coûts totaux" value={euros(totalCost)} sub="carburant, péages, entretien…" accent="text-slate-700" icon={<TrendDownIcon size={18} />} iconBg="bg-slate-100 text-slate-600" />
        <StatCard
          label="Marge"
          value={euros(totalMargin)}
          sub={`${marginPct}% du CA`}
          accent={totalMargin >= 0 ? "text-emerald-600" : "text-rose-600"}
          icon={<TrendUpIcon size={18} />}
          iconBg={totalMargin >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}
        />
        <StatCard label="Empreinte CO₂" value={co2(totalCo2)} sub="🌱 carburant consommé" accent="text-ink-900" icon={<TruckIcon size={18} />} iconBg="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-4">Répartition des coûts</h2>
          {costDist.length > 0 ? <ProgressBars data={costDist} format={euros} /> : <p className="text-slate-400 text-sm">Aucun coût enregistré.</p>}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-4">Marge par camion</h2>
          {marginBars.length > 0 ? <BarChart data={marginBars} format={euros} color="#10b981" /> : <p className="text-slate-400 text-sm">Affectez des missions pour calculer la marge.</p>}
        </div>
      </div>

      <h2 className="font-semibold text-ink-900 mb-3">Détail par camion</h2>
      <Table columns={["Camion", "CA", "Carburant", "Entretien", "Autres", "Coût total", "Marge", "€/km", "CO₂"]}>
        {sorted.length === 0 && <EmptyRow colSpan={9} text="Aucun camion" />}
        {sorted.map((r) => (
          <tr key={r.truck.id} className="hover:bg-slate-50 transition-colors">
            <td className="td font-medium">{r.truck.plate}</td>
            <td className="td">{r.revenue ? euros(r.revenue) : "—"}</td>
            <td className="td">{euros(r.fuelCost)}</td>
            <td className="td">{euros(r.maintCost)}</td>
            <td className="td">{euros(r.otherExp)}</td>
            <td className="td font-medium">{euros(r.cost)}</td>
            <td className="td">
              {r.revenue ? (
                <Badge label={euros(r.margin)} color={r.margin >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} />
              ) : <span className="text-slate-400">—</span>}
            </td>
            <td className="td">{r.costPerKm != null ? `${r.costPerKm.toFixed(2)} €` : "—"}</td>
            <td className="td">{co2(r.co2kg)}</td>
          </tr>
        ))}
      </Table>

      <p className="text-xs text-slate-400 mt-4">
        CO₂ estimé à partir du carburant consommé (facteurs ADEME : diesel 2,64 kg/L). Marge = CA des missions − coûts (carburant, péages, amendes, entretien).
      </p>
    </div>
  );
}

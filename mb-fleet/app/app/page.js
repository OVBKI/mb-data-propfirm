"use client";
import Link from "next/link";
import { useFleet } from "@/components/FleetProvider";
import { StatCard, Badge, Table, EmptyRow, PageHeader, Loading } from "@/components/ui";
import { Donut, ProgressBars } from "@/components/charts";
import {
  TruckIcon, RouteIcon, WrenchIcon, EuroIcon, FileIcon, BellIcon, ArrowRightIcon,
} from "@/components/icons";
import {
  euros, dateFR, daysUntil, km, TRUCK_STATUS, MAINT_TYPE, DOC_TYPE, EXPENSE_TYPE,
} from "@/lib/format";

const STATUS_COLORS = {
  disponible: "#10b981",
  en_route: "#2f6bf0",
  maintenance: "#f59e0b",
  hors_service: "#f43f5e",
};
const EXPENSE_COLORS = {
  carburant: "#2f6bf0",
  peage: "#06b6d4",
  reparation: "#f59e0b",
  amende: "#f43f5e",
  autre: "#94a3b8",
};

export default function Dashboard() {
  const { ready, data } = useFleet();
  if (!ready) return <Loading />;

  const { trucks, drivers, maintenances, documents, expenses } = data;

  const enRoute = trucks.filter((t) => t.status === "en_route").length;
  const dispo = trucks.filter((t) => t.status === "disponible").length;
  const maint = trucks.filter((t) => t.status === "maintenance" || t.status === "hors_service").length;

  const now = new Date();
  const monthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const fleetDist = Object.entries(TRUCK_STATUS).map(([key, meta]) => ({
    label: meta.label,
    value: trucks.filter((t) => t.status === key).length,
    color: STATUS_COLORS[key],
  })).filter((d) => d.value > 0);

  const byType = {};
  for (const e of expenses) byType[e.type] = (byType[e.type] || 0) + Number(e.amount || 0);
  const expenseDist = Object.entries(byType)
    .map(([type, value]) => ({ label: EXPENSE_TYPE[type] || type, value, color: EXPENSE_COLORS[type] || "#94a3b8" }))
    .sort((a, b) => b.value - a.value);

  const docAlerts = documents
    .map((d) => ({ ...d, days: daysUntil(d.expiry_date) }))
    .filter((d) => d.days != null && d.days <= 45)
    .sort((a, b) => a.days - b.days);

  const maintAlerts = maintenances
    .filter((m) => m.status === "a_prevoir" || m.status === "en_retard")
    .map((m) => ({ ...m, days: daysUntil(m.next_due_date) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const alertsCount = docAlerts.length + maintAlerts.length;
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre société de transport" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Camions" value={trucks.length} sub={`${dispo} disponibles`} accent="text-brand-600" icon={<TruckIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
        <StatCard label="En route" value={enRoute} sub="actuellement" accent="text-signal-600" icon={<RouteIcon size={18} />} iconBg="bg-signal-50 text-signal-600" />
        <StatCard label="Maintenance" value={maint} sub="à surveiller" accent="text-amber-600" icon={<WrenchIcon size={18} />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard label="Dépenses du mois" value={euros(monthExpenses)} sub="tous postes" accent="text-ink-900" icon={<EuroIcon size={18} />} iconBg="bg-slate-100 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-ink-900 mb-4">Répartition de la flotte</h2>
          {fleetDist.length > 0 ? <Donut data={fleetDist} centerValue={trucks.length} centerLabel="camions" /> : <p className="text-slate-400 text-sm">Aucun camion.</p>}
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Dépenses par poste</h2>
            <Link href="/app/documents" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">Détails <ArrowRightIcon size={14} /></Link>
          </div>
          {expenseDist.length > 0 ? <ProgressBars data={expenseDist} format={euros} /> : <p className="text-slate-400 text-sm">Aucune dépense enregistrée.</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <BellIcon size={18} className="text-amber-500" />
        <h2 className="font-semibold text-ink-900">Alertes</h2>
        {alertsCount > 0 && <Badge label={`${alertsCount} à traiter`} color="bg-amber-100 text-amber-700" />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><FileIcon size={16} /> Documents à renouveler</span>
            <Link href="/app/documents" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">Tout voir <ArrowRightIcon size={14} /></Link>
          </div>
          <Table columns={["Camion", "Document", "Expire le", "Délai"]}>
            {docAlerts.length === 0 && <EmptyRow colSpan={4} text="Aucune échéance proche" />}
            {docAlerts.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="td font-medium">{truckById[d.truck_id]?.plate || "—"}</td>
                <td className="td">{DOC_TYPE[d.type] || d.type}</td>
                <td className="td">{dateFR(d.expiry_date)}</td>
                <td className="td">
                  <Badge label={d.days < 0 ? `${-d.days} j de retard` : `${d.days} j`} color={d.days < 0 ? "bg-rose-100 text-rose-700" : d.days <= 15 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"} />
                </td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><WrenchIcon size={16} /> Entretiens à planifier</span>
            <Link href="/app/entretien" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">Tout voir <ArrowRightIcon size={14} /></Link>
          </div>
          <Table columns={["Camion", "Type", "Échéance", "Statut"]}>
            {maintAlerts.length === 0 && <EmptyRow colSpan={4} text="Rien à planifier" />}
            {maintAlerts.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="td font-medium">{truckById[m.truck_id]?.plate || "—"}</td>
                <td className="td">{MAINT_TYPE[m.type] || m.type}</td>
                <td className="td">{dateFR(m.next_due_date)}</td>
                <td className="td">
                  <Badge label={m.status === "en_retard" ? "En retard" : "À prévoir"} color={m.status === "en_retard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"} />
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ink-900">Ma flotte</h2>
        <Link href="/app/camions" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">Gérer <ArrowRightIcon size={14} /></Link>
      </div>
      <Table columns={["Immatriculation", "Véhicule", "Kilométrage", "Chauffeur", "Statut"]}>
        {trucks.map((t) => {
          const driver = drivers.find((d) => d.id === t.driver_id);
          const st = TRUCK_STATUS[t.status] || { label: t.status, color: "" };
          return (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium">
                <Link href={`/app/camions/${t.id}`} className="text-brand-600 hover:text-brand-700 hover:underline">{t.plate}</Link>
              </td>
              <td className="td">{t.brand} {t.model}</td>
              <td className="td">{km(t.mileage_km)}</td>
              <td className="td">{driver ? `${driver.first_name} ${driver.last_name}` : "—"}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

import Link from "next/link";
import { getAll } from "@/lib/data";
import { StatCard, Badge, Table, EmptyRow, PageHeader } from "@/components/ui";
import {
  euros, dateFR, daysUntil, TRUCK_STATUS, MAINT_TYPE, DOC_TYPE,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { trucks, drivers, maintenances, documents, expenses } = await getAll();

  const enRoute = trucks.filter((t) => t.status === "en_route").length;
  const dispo = trucks.filter((t) => t.status === "disponible").length;
  const maint = trucks.filter((t) => t.status === "maintenance" || t.status === "hors_service").length;

  // Dépenses du mois en cours
  const now = new Date();
  const monthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  // Alertes : documents qui expirent < 30j + entretiens à prévoir / en retard
  const docAlerts = documents
    .map((d) => ({ ...d, days: daysUntil(d.expiry_date) }))
    .filter((d) => d.days != null && d.days <= 45)
    .sort((a, b) => a.days - b.days);

  const maintAlerts = maintenances
    .filter((m) => m.status === "a_prevoir" || m.status === "en_retard")
    .map((m) => ({ ...m, days: daysUntil(m.next_due_date) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre société de transport"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Camions" value={trucks.length} sub={`${dispo} disponibles`} accent="text-brand-600" />
        <StatCard label="En route" value={enRoute} sub="actuellement" accent="text-blue-600" />
        <StatCard label="En maintenance" value={maint} sub="à surveiller" accent="text-amber-600" />
        <StatCard label="Dépenses du mois" value={euros(monthExpenses)} sub="tous postes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Alertes documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Documents à renouveler</h2>
            <Link href="/app/documents" className="text-sm text-brand-600 hover:underline">Tout voir →</Link>
          </div>
          <Table columns={["Camion", "Document", "Expire le", "Délai"]}>
            {docAlerts.length === 0 && <EmptyRow colSpan={4} text="Aucune échéance proche 👍" />}
            {docAlerts.map((d) => (
              <tr key={d.id}>
                <td className="td font-medium">{truckById[d.truck_id]?.plate || "—"}</td>
                <td className="td">{DOC_TYPE[d.type] || d.type}</td>
                <td className="td">{dateFR(d.expiry_date)}</td>
                <td className="td">
                  <Badge
                    label={d.days < 0 ? `${-d.days} j de retard` : `${d.days} j`}
                    color={d.days < 0 ? "bg-rose-100 text-rose-700" : d.days <= 15 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </div>

        {/* Alertes entretien */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Entretiens à planifier</h2>
            <Link href="/app/entretien" className="text-sm text-brand-600 hover:underline">Tout voir →</Link>
          </div>
          <Table columns={["Camion", "Type", "Échéance", "Statut"]}>
            {maintAlerts.length === 0 && <EmptyRow colSpan={4} text="Rien à planifier 👍" />}
            {maintAlerts.map((m) => (
              <tr key={m.id}>
                <td className="td font-medium">{truckById[m.truck_id]?.plate || "—"}</td>
                <td className="td">{MAINT_TYPE[m.type] || m.type}</td>
                <td className="td">{dateFR(m.next_due_date)}</td>
                <td className="td">
                  <Badge
                    label={m.status === "en_retard" ? "En retard" : "À prévoir"}
                    color={m.status === "en_retard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Flotte */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">Ma flotte</h2>
        <Link href="/app/camions" className="text-sm text-brand-600 hover:underline">Gérer →</Link>
      </div>
      <Table columns={["Immatriculation", "Véhicule", "Kilométrage", "Chauffeur", "Statut"]}>
        {trucks.map((t) => {
          const driver = drivers.find((d) => d.id === t.driver_id);
          const st = TRUCK_STATUS[t.status] || { label: t.status, color: "" };
          return (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="td font-medium">
                <Link href={`/app/camions/${t.id}`} className="text-brand-600 hover:underline">{t.plate}</Link>
              </td>
              <td className="td">{t.brand} {t.model}</td>
              <td className="td">{new Intl.NumberFormat("fr-FR").format(t.mileage_km)} km</td>
              <td className="td">{driver ? `${driver.first_name} ${driver.last_name}` : "—"}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

import { getAll } from "@/lib/data";
import { Badge, Table, StatCard, PageHeader } from "@/components/ui";
import { euros, km, dateFR, MAINT_STATUS, MAINT_TYPE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EntretienPage() {
  const { maintenances, trucks } = await getAll();
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  const rows = [...maintenances].sort((a, b) => new Date(b.date) - new Date(a.date));
  const aPrevoir = maintenances.filter((m) => m.status === "a_prevoir").length;
  const enRetard = maintenances.filter((m) => m.status === "en_retard").length;
  const totalCost = maintenances.reduce((s, m) => s + Number(m.cost || 0), 0);

  return (
    <div>
      <PageHeader title="Entretien & révisions" subtitle="Suivi des interventions et des échéances" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="À prévoir" value={aPrevoir} accent="text-amber-600" />
        <StatCard label="En retard" value={enRetard} accent="text-rose-600" />
        <StatCard label="Coût total" value={euros(totalCost)} />
      </div>

      <Table columns={["Camion", "Type", "Date", "Km", "Garage", "Coût", "Prochaine éch.", "Statut"]}>
        {rows.map((m) => {
          const ms = MAINT_STATUS[m.status] || { label: m.status, color: "" };
          return (
            <tr key={m.id} className="hover:bg-slate-50">
              <td className="td font-medium">{truckById[m.truck_id]?.plate || "—"}</td>
              <td className="td">{MAINT_TYPE[m.type] || m.type}</td>
              <td className="td">{dateFR(m.date)}</td>
              <td className="td">{m.mileage_km ? km(m.mileage_km) : "—"}</td>
              <td className="td">{m.garage || "—"}</td>
              <td className="td">{euros(m.cost)}</td>
              <td className="td">{m.next_due_date ? dateFR(m.next_due_date) : m.next_due_km ? km(m.next_due_km) : "—"}</td>
              <td className="td"><Badge label={ms.label} color={ms.color} /></td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

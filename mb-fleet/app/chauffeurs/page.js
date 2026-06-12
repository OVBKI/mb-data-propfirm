import { getAll } from "../../lib/data";
import { Badge, Table, PageHeader } from "../../components/ui";
import { dateFR, daysUntil, DRIVER_STATUS } from "../../lib/format";

export const dynamic = "force-dynamic";

export default async function ChauffeursPage() {
  const { drivers, trucks } = await getAll();
  const truckByDriver = Object.fromEntries(
    trucks.filter((t) => t.driver_id).map((t) => [t.driver_id, t])
  );

  return (
    <div>
      <PageHeader title="Chauffeurs" subtitle={`${drivers.length} chauffeurs`} />
      <Table columns={["Nom", "Téléphone", "Permis", "Validité permis", "Camion affecté", "Statut"]}>
        {drivers.map((d) => {
          const ds = DRIVER_STATUS[d.status] || { label: d.status, color: "" };
          const days = daysUntil(d.license_expiry);
          const truck = truckByDriver[d.id];
          return (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="td font-medium">{d.first_name} {d.last_name}</td>
              <td className="td">{d.phone || "—"}</td>
              <td className="td">{d.license_cats || "—"} <span className="text-slate-400">{d.license_number}</span></td>
              <td className="td">
                {dateFR(d.license_expiry)}
                {days != null && days <= 90 && (
                  <span className="ml-2"><Badge label={days < 0 ? "Expiré" : `${days} j`} color={days < 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"} /></span>
                )}
              </td>
              <td className="td">{truck ? truck.plate : <span className="text-slate-400">—</span>}</td>
              <td className="td"><Badge label={ds.label} color={ds.color} /></td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

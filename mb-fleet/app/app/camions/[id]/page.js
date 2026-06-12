import Link from "next/link";
import { notFound } from "next/navigation";
import { getAll } from "@/lib/data";
import { Badge, Table, EmptyRow } from "@/components/ui";
import {
  euros, km, dateFR, timeAgo, daysUntil,
  TRUCK_STATUS, MAINT_STATUS, MAINT_TYPE, DOC_TYPE, EXPENSE_TYPE,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TruckDetail({ params }) {
  const { trucks, drivers, trackers, maintenances, documents, expenses } = await getAll();
  const truck = trucks.find((t) => t.id === params.id);
  if (!truck) return notFound();

  const driver = drivers.find((d) => d.id === truck.driver_id);
  const tracker = trackers.find((t) => t.id === truck.tracker_id);
  const st = TRUCK_STATUS[truck.status] || { label: truck.status, color: "" };

  const truckMaint = maintenances.filter((m) => m.truck_id === truck.id);
  const truckDocs = documents.filter((d) => d.truck_id === truck.id);
  const truckExp = expenses.filter((e) => e.truck_id === truck.id);
  const totalExp = truckExp.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <Link href="/app/camions" className="text-sm text-brand-600 hover:underline">← Retour aux camions</Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{truck.plate}</h1>
          <p className="text-slate-500 mt-1">{truck.brand} {truck.model} · {truck.year}</p>
        </div>
        <Badge label={st.label} color={st.color} />
      </div>

      {/* Infos principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Info label="Kilométrage" value={km(truck.mileage_km)} />
        <Info label="Carburant" value={truck.fuel_type} />
        <Info label="Charge utile" value={truck.capacity_t ? `${truck.capacity_t} t` : "—"} />
        <Info label="Chauffeur" value={driver ? `${driver.first_name} ${driver.last_name}` : "Non affecté"} />
      </div>

      {/* Traceur */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Traceur GPS</h2>
        {tracker ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Info label="Modèle" value={tracker.model} />
            <Info label="IMEI" value={tracker.imei} />
            <Info label="Vitesse" value={`${tracker.last_speed ?? 0} km/h`} />
            <Info label="Dernier point" value={timeAgo(tracker.last_seen)} />
            <div className="col-span-2 md:col-span-4">
              <Link href="/app/carte" className="text-brand-600 hover:underline text-sm">Voir sur la carte en direct →</Link>
            </div>
          </div>
        ) : <p className="text-slate-400 text-sm">Aucun traceur associé à ce camion.</p>}
      </div>

      {/* Entretien */}
      <SectionTitle title="Entretien & révisions" />
      <Table columns={["Type", "Date", "Km", "Coût", "Prochaine échéance", "Statut"]}>
        {truckMaint.length === 0 && <EmptyRow colSpan={6} text="Aucun entretien enregistré" />}
        {truckMaint.map((m) => {
          const ms = MAINT_STATUS[m.status] || { label: m.status, color: "" };
          return (
            <tr key={m.id}>
              <td className="td">{MAINT_TYPE[m.type] || m.type}</td>
              <td className="td">{dateFR(m.date)}</td>
              <td className="td">{m.mileage_km ? km(m.mileage_km) : "—"}</td>
              <td className="td">{euros(m.cost)}</td>
              <td className="td">{m.next_due_date ? dateFR(m.next_due_date) : m.next_due_km ? km(m.next_due_km) : "—"}</td>
              <td className="td"><Badge label={ms.label} color={ms.color} /></td>
            </tr>
          );
        })}
      </Table>

      {/* Documents */}
      <SectionTitle title="Documents" className="mt-6" />
      <Table columns={["Type", "N°", "Émetteur", "Expire le", "Délai"]}>
        {truckDocs.length === 0 && <EmptyRow colSpan={5} text="Aucun document" />}
        {truckDocs.map((d) => {
          const days = daysUntil(d.expiry_date);
          return (
            <tr key={d.id}>
              <td className="td">{DOC_TYPE[d.type] || d.type}</td>
              <td className="td">{d.number || "—"}</td>
              <td className="td">{d.issuer || "—"}</td>
              <td className="td">{dateFR(d.expiry_date)}</td>
              <td className="td">
                {days == null ? "—" : (
                  <Badge
                    label={days < 0 ? `${-days} j de retard` : `${days} j`}
                    color={days < 0 ? "bg-rose-100 text-rose-700" : days <= 30 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </Table>

      {/* Dépenses */}
      <SectionTitle title={`Dépenses · total ${euros(totalExp)}`} className="mt-6" />
      <Table columns={["Date", "Type", "Litres", "Montant"]}>
        {truckExp.length === 0 && <EmptyRow colSpan={4} text="Aucune dépense" />}
        {truckExp.map((e) => (
          <tr key={e.id}>
            <td className="td">{dateFR(e.date)}</td>
            <td className="td">{EXPENSE_TYPE[e.type] || e.type}</td>
            <td className="td">{e.liters ? `${e.liters} L` : "—"}</td>
            <td className="td font-medium">{euros(e.amount)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function SectionTitle({ title, className = "" }) {
  return <h2 className={`font-semibold text-slate-800 mb-3 ${className}`}>{title}</h2>;
}

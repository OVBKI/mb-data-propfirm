import { getAll } from "@/lib/data";
import { Badge, Table, StatCard, PageHeader } from "@/components/ui";
import { euros, dateFR, daysUntil, DOC_TYPE, EXPENSE_TYPE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { documents, expenses, trucks } = await getAll();
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  const docs = [...documents].sort((a, b) => (daysUntil(a.expiry_date) ?? 9999) - (daysUntil(b.expiry_date) ?? 9999));
  const exp = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Synthèse dépenses par type
  const byType = {};
  for (const e of expenses) byType[e.type] = (byType[e.type] || 0) + Number(e.amount || 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Documents & dépenses" subtitle="Assurances, contrôles, carburant, péages…" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Dépenses totales" value={euros(totalExp)} accent="text-brand-600" />
        <StatCard label="Carburant" value={euros(byType.carburant || 0)} />
        <StatCard label="Péages" value={euros(byType.peage || 0)} />
        <StatCard label="Réparations" value={euros(byType.reparation || 0)} />
      </div>

      <h2 className="font-semibold text-slate-800 mb-3">Documents</h2>
      <Table columns={["Camion", "Type", "N°", "Émetteur", "Expire le", "Coût", "Délai"]}>
        {docs.map((d) => {
          const days = daysUntil(d.expiry_date);
          return (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="td font-medium">{truckById[d.truck_id]?.plate || "—"}</td>
              <td className="td">{DOC_TYPE[d.type] || d.type}</td>
              <td className="td">{d.number || "—"}</td>
              <td className="td">{d.issuer || "—"}</td>
              <td className="td">{dateFR(d.expiry_date)}</td>
              <td className="td">{d.cost ? euros(d.cost) : "—"}</td>
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

      <h2 className="font-semibold text-slate-800 mb-3 mt-6">Dépenses récentes</h2>
      <Table columns={["Date", "Camion", "Type", "Litres", "Montant"]}>
        {exp.map((e) => (
          <tr key={e.id} className="hover:bg-slate-50">
            <td className="td">{dateFR(e.date)}</td>
            <td className="td font-medium">{truckById[e.truck_id]?.plate || "—"}</td>
            <td className="td">{EXPENSE_TYPE[e.type] || e.type}</td>
            <td className="td">{e.liters ? `${e.liters} L` : "—"}</td>
            <td className="td font-medium">{euros(e.amount)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

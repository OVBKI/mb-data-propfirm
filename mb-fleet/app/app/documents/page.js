"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { Badge, Table, StatCard, PageHeader, Loading } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { documentFields, expenseFields } from "@/lib/forms-config";
import { euros, dateFR, daysUntil, DOC_TYPE, EXPENSE_TYPE } from "@/lib/format";

export default function DocumentsPage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editDoc, setEditDoc] = useState(null);
  const [editExp, setEditExp] = useState(null);
  const [del, setDel] = useState(null); // { coll, id, label }

  if (!ready) return <Loading />;

  const { documents, expenses, trucks, drivers } = data;
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  const docs = [...documents].sort((a, b) => (daysUntil(a.expiry_date) ?? 9999) - (daysUntil(b.expiry_date) ?? 9999));
  const exp = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  const byType = {};
  for (const e of expenses) byType[e.type] = (byType[e.type] || 0) + Number(e.amount || 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  function submitDoc(v) {
    if (editDoc === "new") add("documents", v); else update("documents", editDoc.id, v);
    setEditDoc(null);
  }
  function submitExp(v) {
    if (editExp === "new") add("expenses", v); else update("expenses", editExp.id, v);
    setEditExp(null);
  }

  return (
    <div>
      <PageHeader title="Documents & dépenses" subtitle="Assurances, contrôles, carburant, péages…" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Dépenses totales" value={euros(totalExp)} accent="text-brand-600" />
        <StatCard label="Carburant" value={euros(byType.carburant || 0)} />
        <StatCard label="Péages" value={euros(byType.peage || 0)} />
        <StatCard label="Réparations" value={euros(byType.reparation || 0)} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ink-900">Documents</h2>
        <AddButton onClick={() => setEditDoc("new")}>Ajouter un document</AddButton>
      </div>
      <Table columns={["Camion", "Type", "N°", "Émetteur", "Expire le", "Coût", "Délai", ""]}>
        {docs.map((d) => {
          const days = daysUntil(d.expiry_date);
          return (
            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
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
              <td className="td"><RowActions onEdit={() => setEditDoc(d)} onDelete={() => setDel({ coll: "documents", id: d.id, label: "ce document" })} /></td>
            </tr>
          );
        })}
      </Table>

      <div className="flex items-center justify-between mb-3 mt-6">
        <h2 className="font-semibold text-ink-900">Dépenses récentes</h2>
        <AddButton onClick={() => setEditExp("new")}>Ajouter une dépense</AddButton>
      </div>
      <Table columns={["Date", "Camion", "Type", "Litres", "Montant", ""]}>
        {exp.map((e) => (
          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
            <td className="td">{dateFR(e.date)}</td>
            <td className="td font-medium">{truckById[e.truck_id]?.plate || "—"}</td>
            <td className="td">{EXPENSE_TYPE[e.type] || e.type}</td>
            <td className="td">{e.liters ? `${e.liters} L` : "—"}</td>
            <td className="td font-medium">{euros(e.amount)}</td>
            <td className="td"><RowActions onEdit={() => setEditExp(e)} onDelete={() => setDel({ coll: "expenses", id: e.id, label: "cette dépense" })} /></td>
          </tr>
        ))}
      </Table>

      {editDoc && (
        <FormModal
          title={editDoc === "new" ? "Ajouter un document" : "Modifier le document"}
          fields={documentFields(trucks)}
          initial={editDoc === "new" ? {} : editDoc}
          onSubmit={submitDoc}
          onClose={() => setEditDoc(null)}
        />
      )}
      {editExp && (
        <FormModal
          title={editExp === "new" ? "Ajouter une dépense" : "Modifier la dépense"}
          fields={expenseFields(trucks, drivers)}
          initial={editExp === "new" ? {} : editExp}
          onSubmit={submitExp}
          onClose={() => setEditExp(null)}
        />
      )}
      {del && (
        <ConfirmDelete
          label={del.label}
          onConfirm={() => { remove(del.coll, del.id); setDel(null); }}
          onClose={() => setDel(null)}
        />
      )}
    </div>
  );
}

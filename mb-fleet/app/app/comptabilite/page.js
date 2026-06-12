"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { StatCard, PageHeader, Loading, Table, EmptyRow, Badge } from "@/components/ui";
import { ProgressBars } from "@/components/charts";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { invoiceFields } from "@/lib/forms-config";
import { EuroIcon, TrendUpIcon, TrendDownIcon, FileIcon, CheckIcon, AlertIcon } from "@/components/icons";
import { euros, percent, dateFR, daysUntil, INVOICE_STATUS, EXPENSE_TYPE } from "@/lib/format";

const MONTHS = ["jan.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const VAT_DEDUCTIBLE = 20; // taux moyen estimé sur les charges (TTC → TVA récupérable)

// Petit graphe mensuel : produits (vert) vs charges (rouge) sur 6 mois.
function MonthlyPnL({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.produits, d.charges]), 1);
  return (
    <div className="flex items-end gap-4 h-44">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="flex items-end gap-1 w-full justify-center h-full">
            <div className="w-3 rounded-t bg-emerald-500/90 transition-all" style={{ height: `${Math.max((d.produits / max) * 100, 2)}%` }} title={`Produits : ${euros(d.produits)}`} />
            <div className="w-3 rounded-t bg-rose-400/90 transition-all" style={{ height: `${Math.max((d.charges / max) * 100, 2)}%` }} title={`Charges : ${euros(d.charges)}`} />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComptabilitePage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (!ready) return <Loading />;

  const { invoices = [], missions = [], expenses, maintenances, documents } = data;
  const missionById = Object.fromEntries(missions.map((m) => [m.id, m]));

  // Statut d'affichage : une facture envoyée dont l'échéance est passée = en retard.
  const withStatus = invoices.map((inv) => {
    let status = inv.status;
    if (status === "envoyee" && daysUntil(inv.due_date) != null && daysUntil(inv.due_date) < 0) status = "en_retard";
    const tva = Number(inv.amount_ht || 0) * Number(inv.vat_rate || 0) / 100;
    const ttc = Number(inv.amount_ht || 0) + tva;
    return { ...inv, displayStatus: status, tva, ttc };
  });

  // --- Produits (facturation) ---
  const recettesHT = withStatus.reduce((s, i) => s + Number(i.amount_ht || 0), 0);
  const tvaCollectee = withStatus.reduce((s, i) => s + i.tva, 0);

  // --- Charges (dépenses + entretien + assurances/documents) ---
  // Les assurances/documents sont des coûts annuels : on les mensualise (÷12)
  // pour un compte de résultat cohérent avec les recettes de la période.
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const maintTotal = maintenances.reduce((s, m) => s + Number(m.cost || 0), 0);
  const docMonthly = documents.reduce((s, d) => s + Number(d.cost || 0), 0) / 12;
  const chargesTTC = expTotal + maintTotal + docMonthly;
  const tvaDeductible = chargesTTC * (VAT_DEDUCTIBLE / (100 + VAT_DEDUCTIBLE));
  const chargesHT = chargesTTC - tvaDeductible;

  const resultatNet = recettesHT - chargesHT;
  const margePct = recettesHT > 0 ? (resultatNet / recettesHT) * 100 : 0;
  const tvaAReverser = tvaCollectee - tvaDeductible;

  // --- Trésorerie / encaissements ---
  const encaisse = withStatus.filter((i) => i.displayStatus === "payee").reduce((s, i) => s + i.ttc, 0);
  const aEncaisser = withStatus.filter((i) => i.displayStatus === "envoyee" || i.displayStatus === "en_retard").reduce((s, i) => s + i.ttc, 0);
  const enRetard = withStatus.filter((i) => i.displayStatus === "en_retard").reduce((s, i) => s + i.ttc, 0);

  // --- Répartition des charges (compte de résultat) ---
  const byPost = {};
  for (const e of expenses) byPost[EXPENSE_TYPE[e.type] || e.type] = (byPost[EXPENSE_TYPE[e.type] || e.type] || 0) + Number(e.amount || 0);
  if (maintTotal > 0) byPost["Entretien"] = maintTotal;
  if (docMonthly > 0) byPost["Assurances (mensualisé)"] = docMonthly;
  const chargeDist = Object.entries(byPost).map(([label, value]) => ({ label, value, color: "#f43f5e" })).sort((a, b) => b.value - a.value);

  // --- Graphe mensuel (6 derniers mois) ---
  const now = new Date();
  const monthly = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const my = (x) => { const dt = new Date(x); return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear(); };
    const produits = withStatus.filter((i) => i.date && my(i.date)).reduce((s, i) => s + Number(i.amount_ht || 0), 0);
    const charges = expenses.filter((e) => my(e.date)).reduce((s, e) => s + Number(e.amount || 0), 0)
      + maintenances.filter((m) => my(m.date)).reduce((s, m) => s + Number(m.cost || 0), 0);
    monthly.push({ label: MONTHS[d.getMonth()], produits, charges });
  }

  function submit(values) {
    if (editing === "new") add("invoices", { ...values, status: values.status || "brouillon", vat_rate: values.vat_rate ?? 20 });
    else update("invoices", editing.id, values);
    setEditing(null);
  }
  function markPaid(inv) {
    update("invoices", inv.id, { status: "payee", paid_date: new Date().toISOString().slice(0, 10) });
  }

  const sortedInvoices = [...withStatus].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle="Recettes, charges, résultat, TVA et facturation — en temps réel"
        action={<AddButton onClick={() => setEditing("new")}>Nouvelle facture</AddButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Recettes HT" value={euros(recettesHT)} sub="facturé" accent="text-brand-600" icon={<TrendUpIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
        <StatCard label="Charges HT" value={euros(chargesHT)} sub="dépenses + entretien" accent="text-slate-700" icon={<TrendDownIcon size={18} />} iconBg="bg-slate-100 text-slate-600" />
        <StatCard label="Résultat net" value={euros(resultatNet)} sub={percent(margePct) + " de marge"} accent={resultatNet >= 0 ? "text-emerald-600" : "text-rose-600"} icon={<EuroIcon size={18} />} iconBg={resultatNet >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} />
        <StatCard label={tvaAReverser >= 0 ? "TVA à reverser" : "Crédit de TVA"} value={euros(Math.abs(tvaAReverser))} sub="collectée − déductible" accent="text-ink-900" icon={<FileIcon size={18} />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard label="Encaissé" value={euros(encaisse)} sub="factures payées" accent="text-emerald-600" icon={<CheckIcon size={18} />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="Impayés" value={euros(aEncaisser)} sub={enRetard > 0 ? `dont ${euros(enRetard)} en retard` : "à encaisser"} accent={enRetard > 0 ? "text-rose-600" : "text-slate-700"} icon={<AlertIcon size={18} />} iconBg="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-1">Compte de résultat</h2>
          <p className="text-sm text-slate-500 mb-4">Produits {euros(recettesHT)} − Charges {euros(chargesHT)}</p>
          {chargeDist.length > 0 ? <ProgressBars data={chargeDist} format={euros} /> : <p className="text-slate-400 text-sm">Aucune charge.</p>}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="font-medium text-ink-900">Résultat net</span>
            <span className={`font-display font-bold text-lg ${resultatNet >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{euros(resultatNet)}</span>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Produits vs charges</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Produits</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Charges</span>
            </div>
          </div>
          <MonthlyPnL data={monthly} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ink-900">Factures clients</h2>
        <AddButton onClick={() => setEditing("new")}>Nouvelle facture</AddButton>
      </div>
      <Table columns={["N°", "Client", "Mission", "Émise le", "Échéance", "HT", "TTC", "Statut", ""]}>
        {sortedInvoices.length === 0 && <EmptyRow colSpan={9} text="Aucune facture" />}
        {sortedInvoices.map((inv) => {
          const st = INVOICE_STATUS[inv.displayStatus] || { label: inv.displayStatus, color: "" };
          const mission = missionById[inv.mission_id];
          return (
            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium text-slate-700">{inv.number || "—"}</td>
              <td className="td font-medium">{inv.client}</td>
              <td className="td text-slate-500">{mission ? `${mission.origin} → ${mission.destination}` : "—"}</td>
              <td className="td">{dateFR(inv.date)}</td>
              <td className="td">{dateFR(inv.due_date)}</td>
              <td className="td">{euros(inv.amount_ht)}</td>
              <td className="td font-medium">{euros(inv.ttc)}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
              <td className="td">
                <div className="flex items-center gap-1 justify-end">
                  {inv.displayStatus !== "payee" && (
                    <button onClick={() => markPaid(inv)} title="Marquer payée" className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors">
                      <CheckIcon size={16} />
                    </button>
                  )}
                  <RowActions onEdit={() => setEditing(inv)} onDelete={() => setDeleting(inv)} />
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      <p className="text-xs text-slate-400 mt-4">
        Comptabilité en temps réel : les recettes proviennent des factures, les charges des dépenses, entretiens et assurances.
        TVA déductible estimée à 20 % des charges. Mode démo — branchez Supabase pour conserver vos écritures.
      </p>

      {editing && (
        <FormModal
          title={editing === "new" ? "Nouvelle facture" : `Facture ${editing.number || ""}`}
          fields={invoiceFields(missions)}
          initial={editing === "new" ? { vat_rate: 20, date: new Date().toISOString().slice(0, 10) } : editing}
          onSubmit={submit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label={`la facture ${deleting.number || ""} (${deleting.client})`}
          onConfirm={() => { remove("invoices", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

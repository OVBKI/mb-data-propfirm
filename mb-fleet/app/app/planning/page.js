"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { PageHeader, Loading, Badge } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { appointmentFields } from "@/lib/forms-config";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@/components/icons";
import { APPOINTMENT_TYPE, APPOINTMENT_STATUS } from "@/lib/format";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// Clé locale YYYY-MM-DD d'une date (sans décalage de fuseau).
function keyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const dayKey = (s) => (s || "").slice(0, 10);

export default function PlanningPage() {
  const { ready, data, add, update, remove } = useFleet();
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [editing, setEditing] = useState(null); // "new" | appointment | { _date }
  const [deleting, setDeleting] = useState(null);

  if (!ready) return <Loading />;

  const { appointments = [], missions = [], maintenances, drivers, trucks } = data;
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  // --- Événements du calendrier (RDV + livraisons + entretiens planifiés) ---
  const eventsByDay = {};
  const push = (key, ev) => { (eventsByDay[key] ||= []).push(ev); };
  for (const a of appointments) {
    const meta = APPOINTMENT_TYPE[a.type] || APPOINTMENT_TYPE.autre;
    push(dayKey(a.date), { kind: "rdv", id: a.id, label: a.title, time: a.time, dot: meta.dot, ref: a });
  }
  for (const m of missions) {
    if (m.delivery_date && m.status !== "annulee") push(dayKey(m.delivery_date), { kind: "mission", label: `Livraison ${m.destination}`, dot: "#10b981" });
  }
  for (const mt of maintenances) {
    if (mt.next_due_date && (mt.status === "a_prevoir" || mt.status === "en_retard"))
      push(dayKey(mt.next_due_date), { kind: "maint", label: `Entretien ${truckById[mt.truck_id]?.plate || ""}`, dot: "#8b5cf6" });
  }
  for (const k in eventsByDay) eventsByDay[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // --- Grille du mois (semaines complètes, lundi → dimanche) ---
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  // On limite à 5 semaines si la 6e ligne ne contient aucun jour du mois.
  const weeks = cells[35].getMonth() === view.getMonth() ? 6 : 5;
  const visibleCells = cells.slice(0, weeks * 7);

  const todayKey = keyOf(today);

  function submit(values) {
    if (editing === "new" || editing?._date) add("appointments", { ...values, status: values.status || "a_faire", type: values.type || "rendez_vous" });
    else update("appointments", editing.id, values);
    setEditing(null);
  }

  // --- Planning chauffeurs : 7 jours à partir d'aujourd'hui ---
  const week = [];
  for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(today.getDate() + i); week.push(d); }
  function driverDayItems(driverId, dateKey) {
    const items = [];
    for (const a of appointments) if (a.driver_id === driverId && dayKey(a.date) === dateKey) {
      const meta = APPOINTMENT_TYPE[a.type] || APPOINTMENT_TYPE.autre;
      items.push({ label: a.title, time: a.time, dot: meta.dot });
    }
    for (const m of missions) {
      if (m.driver_id !== driverId || m.status === "annulee") continue;
      if (dayKey(m.pickup_date) === dateKey) items.push({ label: `Enlèv. ${m.origin}`, dot: "#06b6d4" });
      if (dayKey(m.delivery_date) === dateKey) items.push({ label: `Livr. ${m.destination}`, dot: "#10b981" });
    }
    return items;
  }

  return (
    <div>
      <PageHeader
        title="Planning & rendez-vous"
        subtitle="Calendrier des rendez-vous, livraisons et entretiens — et planning des chauffeurs"
        action={<AddButton onClick={() => setEditing("new")}>Nouveau rendez-vous</AddButton>}
      />

      {/* Calendrier */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
            <CalendarIcon size={18} className="text-brand-600" /> {MONTHS[view.getMonth()]} {view.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors" aria-label="Mois précédent"><ChevronLeftIcon size={18} /></button>
            <button onClick={() => setView(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors">Aujourd'hui</button>
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors" aria-label="Mois suivant"><ChevronRightIcon size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => <div key={w} className="text-center text-xs font-semibold text-slate-400 py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {visibleCells.map((d, i) => {
            const key = keyOf(d);
            const inMonth = d.getMonth() === view.getMonth();
            const isToday = key === todayKey;
            const evs = eventsByDay[key] || [];
            return (
              <button
                key={i}
                onClick={() => setEditing({ _date: key })}
                className={`text-left min-h-[88px] rounded-lg border p-1.5 transition-colors cursor-pointer ${
                  inMonth ? "bg-white border-slate-100 hover:border-brand-300" : "bg-slate-50/60 border-transparent text-slate-300"
                } ${isToday ? "ring-2 ring-brand-400 border-brand-300" : ""}`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday ? "bg-brand-500 text-white" : inMonth ? "text-slate-600" : "text-slate-300"}`}>
                  {d.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {evs.slice(0, 3).map((ev, j) => (
                    <div key={j} className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ev.dot }} />
                      <span className="truncate">{ev.time ? `${ev.time} ` : ""}{ev.label}</span>
                    </div>
                  ))}
                  {evs.length > 3 && <div className="text-[11px] text-slate-400 pl-2.5">+{evs.length - 3} autre(s)</div>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          {Object.entries(APPOINTMENT_TYPE).slice(0, 6).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: v.dot }} />{v.label}</span>
          ))}
        </div>
      </div>

      {/* Planning des chauffeurs (7 jours) */}
      <h2 className="font-semibold text-ink-900 mb-3">Planning des chauffeurs · 7 jours</h2>
      <div className="card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="th sticky left-0 bg-slate-50 z-10 min-w-[150px]">Chauffeur</th>
                {week.map((d, i) => {
                  const isToday = keyOf(d) === todayKey;
                  return (
                    <th key={i} className={`th text-center min-w-[120px] ${isToday ? "text-brand-600" : ""}`}>
                      {WEEKDAYS[(d.getDay() + 6) % 7]} {d.getDate()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {drivers.map((dr) => (
                <tr key={dr.id} className="border-t border-slate-100">
                  <td className="td sticky left-0 bg-white z-10 font-medium whitespace-nowrap">{dr.first_name} {dr.last_name}</td>
                  {week.map((d, i) => {
                    const items = driverDayItems(dr.id, keyOf(d));
                    const isToday = keyOf(d) === todayKey;
                    return (
                      <td key={i} className={`align-top p-1.5 ${isToday ? "bg-brand-50/40" : ""}`}>
                        <div className="space-y-1">
                          {items.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                          {items.map((it, j) => (
                            <div key={j} className="flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1 text-[11px] text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.dot }} />
                              <span className="truncate">{it.time ? `${it.time} ` : ""}{it.label}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste des prochains rendez-vous */}
      <h2 className="font-semibold text-ink-900 mb-3">Prochains rendez-vous</h2>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{["Date", "Heure", "Rendez-vous", "Type", "Chauffeur", "Lieu", "Statut", ""].map((c) => <th key={c} className="th">{c}</th>)}</tr>
          </thead>
          <tbody>
            {appointments.length === 0 && <tr><td colSpan={8} className="td text-center text-slate-400 py-8">Aucun rendez-vous</td></tr>}
            {[...appointments].sort((a, b) => `${dayKey(a.date)}${a.time || ""}`.localeCompare(`${dayKey(b.date)}${b.time || ""}`)).map((a) => {
              const meta = APPOINTMENT_TYPE[a.type] || APPOINTMENT_TYPE.autre;
              const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.a_faire;
              const dr = driverById[a.driver_id];
              return (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="td whitespace-nowrap">{new Date(a.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</td>
                  <td className="td"><span className="inline-flex items-center gap-1 text-slate-500"><ClockIcon size={13} />{a.time || "—"}</span></td>
                  <td className="td font-medium">{a.title}</td>
                  <td className="td"><Badge label={meta.label} color={meta.color} /></td>
                  <td className="td">{dr ? `${dr.first_name} ${dr.last_name}` : "—"}</td>
                  <td className="td text-slate-500">{a.location || "—"}</td>
                  <td className="td"><Badge label={st.label} color={st.color} /></td>
                  <td className="td"><RowActions onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal
          title={editing === "new" || editing?._date ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}
          fields={appointmentFields(drivers, trucks)}
          initial={editing === "new" ? {} : editing?._date ? { date: editing._date } : editing}
          onSubmit={submit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label={`le rendez-vous « ${deleting.title} »`}
          onConfirm={() => { remove("appointments", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

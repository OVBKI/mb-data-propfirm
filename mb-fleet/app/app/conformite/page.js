"use client";
import { useFleet } from "@/components/FleetProvider";
import { StatCard, PageHeader, Loading, Table, EmptyRow, Badge } from "@/components/ui";
import { CheckIcon, AlertIcon, BellIcon, FileIcon } from "@/components/icons";
import { hoursFromMin, dateFR, daysUntil, RSE } from "@/lib/format";

// Petite barre de progression conduite (vert / ambre / rouge selon le seuil).
function DriveBar({ min, max, ext }) {
  const pct = Math.min((min / ext) * 100, 100);
  const color = min > ext ? "#f43f5e" : min > max ? "#f59e0b" : "#10b981";
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-ink-800">{hoursFromMin(min)}</span>
        <span className="text-slate-400">/ {hoursFromMin(max)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// Évalue la conformité d'un chauffeur ; renvoie statut + libellés d'alerte.
function evaluate(d) {
  const alerts = [];
  let level = 0; // 0 ok, 1 surveiller, 2 infraction
  const bump = (l) => { level = Math.max(level, l); };

  if (d.drive_today_min > RSE.DRIVE_DAY_EXT) { alerts.push("Dépassement conduite journalière"); bump(2); }
  else if (d.drive_today_min > RSE.DRIVE_DAY_MAX) { bump(1); }

  if (d.drive_week_min > RSE.DRIVE_WEEK_MAX) { alerts.push("Dépassement conduite hebdomadaire"); bump(2); }
  else if (d.drive_week_min > RSE.DRIVE_WEEK_MAX * 0.9) { bump(1); }

  const cardDeadline = d.card_download_date ? new Date(new Date(d.card_download_date).getTime() + RSE.CARD_DOWNLOAD_DAYS * 86400000) : null;
  const cardDays = cardDeadline ? daysUntil(cardDeadline) : null;
  if (cardDays != null && cardDays < 0) { alerts.push("Téléchargement carte conducteur en retard"); bump(2); }
  else if (cardDays != null && cardDays <= 3) { bump(1); }

  const restDeadline = d.last_weekly_rest ? new Date(new Date(d.last_weekly_rest).getTime() + RSE.WEEKLY_REST_DAYS * 86400000) : null;
  const restDays = restDeadline ? daysUntil(restDeadline) : null;
  if (restDays != null && restDays < 0) { alerts.push("Repos hebdomadaire dû"); bump(2); }
  else if (restDays != null && restDays <= 1) { bump(1); }

  return { level, alerts, cardDays, restDays };
}

const STATUS = [
  { label: "En règle", color: "bg-emerald-100 text-emerald-700" },
  { label: "À surveiller", color: "bg-amber-100 text-amber-700" },
  { label: "Infraction", color: "bg-rose-100 text-rose-700" },
];

function deadlineBadge(days) {
  if (days == null) return <span className="text-slate-400">—</span>;
  if (days < 0) return <Badge label={`${-days} j de retard`} color="bg-rose-100 text-rose-700" />;
  if (days <= 3) return <Badge label={`${days} j`} color="bg-amber-100 text-amber-700" />;
  return <span className="text-slate-600">{days} j</span>;
}

export default function ConformitePage() {
  const { ready, data } = useFleet();
  if (!ready) return <Loading />;

  const { drivers, trucks } = data;
  const active = drivers.filter((d) => d.status !== "conge");
  const evals = active.map((d) => ({ d, e: evaluate(d) }));

  const enRegle = evals.filter((x) => x.e.level === 0).length;
  const aSurveiller = evals.filter((x) => x.e.level === 1).length;
  const infractions = evals.filter((x) => x.e.level === 2).length;

  // Téléchargements chronotachygraphe véhicule (échéance 90 j).
  const tachoRows = trucks.map((t) => {
    const deadline = t.tacho_download_date ? new Date(new Date(t.tacho_download_date).getTime() + RSE.TACHO_DOWNLOAD_DAYS * 86400000) : null;
    return { t, deadline, days: deadline ? daysUntil(deadline) : null };
  });
  const tachoDue = tachoRows.filter((r) => r.days != null && r.days <= 5).length;
  const cardDue = evals.filter((x) => x.e.cardDays != null && x.e.cardDays <= 3).length;

  // Liste consolidée des alertes.
  const allAlerts = [];
  for (const { d, e } of evals) for (const a of e.alerts) allAlerts.push({ who: `${d.first_name} ${d.last_name}`, text: a });
  for (const r of tachoRows) if (r.days != null && r.days < 0) allAlerts.push({ who: r.t.plate, text: "Téléchargement chronotachygraphe en retard" });

  return (
    <div>
      <PageHeader title="Conformité RSE" subtitle="Temps de conduite, repos et téléchargements réglementaires (règlement CE 561/2006)" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="En règle" value={enRegle} sub={`sur ${active.length} chauffeurs`} accent="text-emerald-600" icon={<CheckIcon size={18} />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="À surveiller" value={aSurveiller} sub="proche d'un seuil" accent="text-amber-600" icon={<BellIcon size={18} />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard label="Infractions" value={infractions} sub="à traiter" accent="text-rose-600" icon={<AlertIcon size={18} />} iconBg="bg-rose-50 text-rose-600" />
        <StatCard label="Téléchargements dus" value={cardDue + tachoDue} sub="cartes + chrono" accent="text-ink-900" icon={<FileIcon size={18} />} iconBg="bg-slate-100 text-slate-600" />
      </div>

      {allAlerts.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-rose-400">
          <h2 className="font-semibold text-ink-900 mb-2 flex items-center gap-2"><AlertIcon size={16} className="text-rose-500" /> Alertes réglementaires</h2>
          <ul className="space-y-1.5 text-sm">
            {allAlerts.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <strong className="text-ink-800">{a.who}</strong> — {a.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="font-semibold text-ink-900 mb-3">Temps de conduite & repos</h2>
      <Table columns={["Chauffeur", "Conduite (jour)", "Conduite (semaine)", "Repos hebdo dû", "Carte conducteur", "Statut"]}>
        {evals.length === 0 && <EmptyRow colSpan={6} text="Aucun chauffeur en service" />}
        {evals.map(({ d, e }) => {
          const st = STATUS[e.level];
          return (
            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium">{d.first_name} {d.last_name}</td>
              <td className="td"><DriveBar min={d.drive_today_min} max={RSE.DRIVE_DAY_MAX} ext={RSE.DRIVE_DAY_EXT} /></td>
              <td className="td"><DriveBar min={d.drive_week_min} max={RSE.DRIVE_WEEK_MAX} ext={RSE.DRIVE_WEEK_MAX} /></td>
              <td className="td">{deadlineBadge(e.restDays)}</td>
              <td className="td">{deadlineBadge(e.cardDays)}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
            </tr>
          );
        })}
      </Table>

      <h2 className="font-semibold text-ink-900 mb-3 mt-6">Téléchargement chronotachygraphe (véhicules)</h2>
      <Table columns={["Camion", "Dernier téléchargement", "Prochaine échéance", "Délai"]}>
        {tachoRows.map((r) => (
          <tr key={r.t.id} className="hover:bg-slate-50 transition-colors">
            <td className="td font-medium">{r.t.plate}</td>
            <td className="td">{dateFR(r.t.tacho_download_date)}</td>
            <td className="td">{r.deadline ? dateFR(r.deadline) : "—"}</td>
            <td className="td">{deadlineBadge(r.days)}</td>
          </tr>
        ))}
      </Table>

      <p className="text-xs text-slate-400 mt-4">
        Seuils : conduite 9 h/jour (10 h 2×/sem.), 56 h/semaine ; téléchargement carte conducteur tous les 28 j, chronotachygraphe tous les 90 j.
        En mode démo les temps sont simulés — reliés à vos chronotachygraphes, ils se remplissent automatiquement.
      </p>
    </div>
  );
}

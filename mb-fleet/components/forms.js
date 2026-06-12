"use client";
import { useState } from "react";

// Modale générique.
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-ink-900/50" onClick={onClose} />
      <div className="relative card w-full max-w-lg p-6 mt-8 animate-[fadeIn_.15s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-700 cursor-pointer text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Formulaire piloté par une configuration de champs.
// fields = [{ name, label, type, options?, required?, placeholder?, step?, half? }]
export function FormModal({ title, fields, initial = {}, onSubmit, onClose, submitLabel = "Enregistrer" }) {
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of fields) v[f.name] = initial[f.name] ?? "";
    return v;
  });

  function setField(name, val) {
    setValues((prev) => ({ ...prev, [name]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Conversion des nombres.
    const out = { ...values };
    for (const f of fields) {
      if (f.type === "number" && out[f.name] !== "" && out[f.name] != null) out[f.name] = Number(out[f.name]);
      if (out[f.name] === "") out[f.name] = null;
    }
    onSubmit(out);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.half ? "col-span-1" : "col-span-2"}>
              <label htmlFor={f.name} className="block text-xs font-medium text-slate-500 mb-1">
                {f.label}{f.required && <span className="text-rose-500"> *</span>}
              </label>
              {f.type === "select" ? (
                <select
                  id={f.name}
                  value={values[f.name] ?? ""}
                  required={f.required}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 cursor-pointer bg-white"
                >
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  value={values[f.name] ?? ""}
                  required={f.required}
                  placeholder={f.placeholder}
                  rows={3}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                />
              ) : (
                <input
                  id={f.name}
                  type={f.type || "text"}
                  step={f.step}
                  value={values[f.name] ?? ""}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 cursor-pointer transition-colors">
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Bouton principal "Ajouter".
export function AddButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 cursor-pointer transition-colors shadow-sm"
    >
      <span className="text-base leading-none">+</span>{children}
    </button>
  );
}

// Confirmation de suppression.
export function ConfirmDelete({ label, onConfirm, onClose }) {
  return (
    <Modal title="Confirmer la suppression" onClose={onClose}>
      <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer <strong>{label}</strong> ? Cette action est irréversible.</p>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">Annuler</button>
        <button onClick={onConfirm} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 cursor-pointer transition-colors">Supprimer</button>
      </div>
    </Modal>
  );
}

// Boutons d'action en ligne (éditer / supprimer).
export function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onEdit && (
        <button onClick={onEdit} aria-label="Modifier" title="Modifier" className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} aria-label="Supprimer" title="Supprimer" className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      )}
    </div>
  );
}

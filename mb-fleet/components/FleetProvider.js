"use client";
// Source de données côté client.
// - Si Supabase est configuré → lit/écrit dans les vraies tables.
// - Sinon → persiste dans le navigateur (localStorage), initialisé depuis la démo.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { demoData } from "@/lib/demo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const STORAGE_KEY = "fleetly_data_v1";
const COLLECTIONS = ["trucks", "drivers", "trackers", "maintenances", "documents", "expenses", "missions", "invoices"];

const FleetContext = createContext(null);

function freshFromDemo() {
  return JSON.parse(JSON.stringify(demoData));
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(36).slice(2, 10);
}

function saveLocal(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
}

export function FleetProvider({ children }) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  // Chargement initial.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isSupabaseConfigured) {
        const result = {};
        await Promise.all(
          COLLECTIONS.map(async (c) => {
            const { data: rows, error } = await supabase.from(c).select("*");
            result[c] = error ? [] : (rows || []);
          })
        );
        if (!cancelled) { setData(result); setReady(true); }
        return;
      }
      // Mode démo (navigateur)
      let loaded;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        loaded = raw ? JSON.parse(raw) : freshFromDemo();
      } catch {
        loaded = freshFromDemo();
      }
      for (const c of COLLECTIONS) if (!Array.isArray(loaded[c])) loaded[c] = [];
      if (!cancelled) { setData(loaded); setReady(true); }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (collection, item) => {
    if (isSupabaseConfigured) {
      const { data: row, error } = await supabase.from(collection).insert(item).select().single();
      if (error) { console.error("Supabase insert:", error.message); return; }
      setData((prev) => ({ ...prev, [collection]: [row, ...prev[collection]] }));
      return;
    }
    setData((prev) => {
      const next = { ...prev, [collection]: [{ ...item, id: item.id || newId() }, ...prev[collection]] };
      saveLocal(next);
      return next;
    });
  }, []);

  const update = useCallback(async (collection, id, patch) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(collection).update(patch).eq("id", id);
      if (error) { console.error("Supabase update:", error.message); return; }
    }
    setData((prev) => {
      const next = { ...prev, [collection]: prev[collection].map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      if (!isSupabaseConfigured) saveLocal(next);
      return next;
    });
  }, []);

  const remove = useCallback(async (collection, id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(collection).delete().eq("id", id);
      if (error) { console.error("Supabase delete:", error.message); return; }
    }
    setData((prev) => {
      const next = { ...prev, [collection]: prev[collection].filter((x) => x.id !== id) };
      if (!isSupabaseConfigured) saveLocal(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = freshFromDemo();
    setData(fresh);
    saveLocal(fresh);
  }, []);

  return (
    <FleetContext.Provider value={{ ready, data, add, update, remove, reset, newId, isSupabaseConfigured }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet doit être utilisé dans <FleetProvider>");
  return ctx;
}

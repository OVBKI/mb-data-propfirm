-- ============================================================
--  FLEETLY — Règles d'accès (RLS) pour DÉMARRER
-- ------------------------------------------------------------
--  Supabase active la "Row Level Security" par défaut : sans
--  règle, toute lecture renvoie vide et toute écriture est
--  refusée. Ce script ajoute un accès permissif pour démarrer
--  EN SOLO (un seul compte / une seule société).
--
--  ⚠️  À REMPLACER par des règles par société dès qu'on ajoute
--  l'authentification (chaque entreprise ne verra que ses
--  propres données). Voir le chantier "Comptes & connexion".
--
--  À exécuter dans Supabase → SQL Editor → Run.
-- ============================================================

do $$
declare
  t text;
  tables text[] := array[
    'drivers','trackers','trucks','maintenances','documents',
    'expenses','missions','invoices','appointments'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "fleetly_demo_all" on public.%I;', t);
    -- Accès complet (lecture + écriture) pour démarrer.
    execute format(
      'create policy "fleetly_demo_all" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

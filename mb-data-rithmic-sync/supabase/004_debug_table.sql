-- ============================================================================
-- Quantara Rithmic Sync — Migration 004 : debug table
-- À exécuter UNE SEULE FOIS, après 003_auto_sync.sql
--
-- Stocke le résultat brut de show_order_history_summary() pour qu'on puisse
-- l'inspecter depuis Supabase SQL editor sans dépendre des logs Railway
-- (qui sont submergés par les erreurs background d'async_rithmic).
--
-- À supprimer (DROP TABLE) une fois le parsing fill stable.
-- ============================================================================

create table if not exists rithmic_debug (
  id           bigserial primary key,
  created_at   timestamptz default now(),
  user_id      uuid,
  account_id   text,
  date_str     text,
  summary_type text,
  summary_repr text,
  fields_json  jsonb
);

create index if not exists rithmic_debug_created_idx
  on rithmic_debug(created_at desc);

-- Lock down via RLS (service-role only — UI never reads this)
alter table rithmic_debug enable row level security;

-- No policies = nothing readable from anon/auth keys. Only service-role bypasses RLS.

-- ============================================================================

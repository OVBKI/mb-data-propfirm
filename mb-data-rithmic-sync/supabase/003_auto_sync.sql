-- ============================================================================
-- Quantara Rithmic Sync — Migration 003 : auto-sync (polling 15 min)
-- À exécuter UNE SEULE FOIS, après 002_multi_credentials.sql
-- ============================================================================

-- Toggle per connection : si true, le cron Vercel sync auto cette connexion toutes les 15 min
alter table rithmic_credentials add column if not exists auto_sync_enabled boolean default false;

-- Période en jours que le cron sync à chaque tour (par défaut 7j = enough pour rattraper toute activité récente)
alter table rithmic_credentials add column if not exists auto_sync_days_window int default 7;

-- Timestamp de la dernière sync auto réussie (cron OU manual). Sert à éviter de re-sync trop souvent.
alter table rithmic_credentials add column if not exists last_synced_at timestamptz;

-- Index utile pour la requête du cron qui filtre les opt-in
create index if not exists rithmic_credentials_auto_sync_idx
  on rithmic_credentials(auto_sync_enabled)
  where auto_sync_enabled = true;

-- ============================================================================

-- ============================================================================
-- Quantara Rithmic Sync — Migration 002 : multi-credentials per user
-- À exécuter UNE SEULE FOIS, après 001_rithmic.sql
--
-- Objectif : permettre à un utilisateur de stocker plusieurs paires de
-- credentials Rithmic (ex : une pour Lucid, une pour TPT, une pour Topstep).
-- Avant : 1 row par user_id (clé primaire = user_id)
-- Après : N rows par user_id, identifiés par un `label` libre (clé primaire = id uuid)
-- ============================================================================

-- 1. Ajouter id (nouvelle PK) et label
alter table rithmic_credentials add column if not exists id uuid default gen_random_uuid();
alter table rithmic_credentials add column if not exists label text;

-- 2. Backfill : les rows existants prennent system_name comme label par défaut
update rithmic_credentials set label = system_name where label is null;

-- 3. Rendre id et label NOT NULL
alter table rithmic_credentials alter column id set not null;
alter table rithmic_credentials alter column label set not null;

-- 4. Drop l'ancienne PK (user_id) — utilise DO bloc pour gérer les noms variables
do $$
declare
  pk_name text;
begin
  select constraint_name into pk_name
  from information_schema.table_constraints
  where table_name = 'rithmic_credentials'
    and table_schema = 'public'
    and constraint_type = 'PRIMARY KEY';
  if pk_name is not null then
    execute format('alter table rithmic_credentials drop constraint %I', pk_name);
  end if;
end $$;

-- 5. Nouvelle PK sur id
alter table rithmic_credentials add primary key (id);

-- 6. Contrainte unique sur (user_id, label) — un user ne peut pas avoir 2 labels identiques
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rithmic_credentials_user_label_unique'
  ) then
    alter table rithmic_credentials
      add constraint rithmic_credentials_user_label_unique unique (user_id, label);
  end if;
end $$;

-- Les RLS policies existantes restent valides : elles filtrent sur user_id.
-- ============================================================================

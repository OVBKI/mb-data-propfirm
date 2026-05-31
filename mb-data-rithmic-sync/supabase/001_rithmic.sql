-- ============================================================================
-- Quantara Rithmic Sync — Supabase migration
-- Apply once via Supabase SQL Editor.
--
-- This creates :
--   1. rithmic_credentials table (encrypted creds, 1 row per user)
--   2. RLS policies (user can only see their own row, service role bypasses)
--   3. accounts.rithmic_account_id column (the Rithmic account_id Quantara binds to)
--   4. journal_entries.source + source_id columns (for idempotent upserts)
--   5. Unique index on (user_id, source_id) for the upsert
-- ============================================================================

-- 1. Encrypted credentials table
create table if not exists rithmic_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_username text not null,
  encrypted_password text not null,
  system_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. RLS — owner-only read/write, service-role bypasses naturally
alter table rithmic_credentials enable row level security;

-- Read : only the owner
drop policy if exists "rithmic_credentials_select_own" on rithmic_credentials;
create policy "rithmic_credentials_select_own" on rithmic_credentials
  for select using (auth.uid() = user_id);

-- Write (insert/update/delete) : only the owner.
-- The Python service uses SERVICE_ROLE which bypasses RLS, so it can write any user's row.
drop policy if exists "rithmic_credentials_insert_own" on rithmic_credentials;
create policy "rithmic_credentials_insert_own" on rithmic_credentials
  for insert with check (auth.uid() = user_id);

drop policy if exists "rithmic_credentials_update_own" on rithmic_credentials;
create policy "rithmic_credentials_update_own" on rithmic_credentials
  for update using (auth.uid() = user_id);

drop policy if exists "rithmic_credentials_delete_own" on rithmic_credentials;
create policy "rithmic_credentials_delete_own" on rithmic_credentials
  for delete using (auth.uid() = user_id);


-- 3. accounts.rithmic_account_id — populated by the user in /app/journal-sync UI
-- Maps a Quantara account to the corresponding Rithmic account_id (string).
alter table accounts add column if not exists rithmic_account_id text;
create index if not exists accounts_rithmic_account_id_idx
  on accounts(rithmic_account_id)
  where rithmic_account_id is not null;


-- 4. journal_entries.source + source_id — used for idempotent upserts
-- source = 'manual' | 'csv' | 'rithmic-sync'
-- source_id = native ID from the source (Rithmic exec_id, CSV row hash, etc.)
alter table journal_entries add column if not exists source text;
alter table journal_entries add column if not exists source_id text;


-- 5. Unique index for upsert idempotency.
-- A given Rithmic execution should only ever produce ONE journal_entries row per user.
-- Use a partial unique index so NULL source_id (manual entries) doesn't collide.
create unique index if not exists journal_entries_user_source_unique
  on journal_entries(user_id, source_id)
  where source_id is not null;


-- ============================================================================
-- Done. After applying :
--   - Generate ENCRYPTION_KEY :
--     python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
--   - Add the value to Railway env vars
--   - Add the same value (or skip) NOT to Vercel — only the Python service needs it
-- ============================================================================

-- 081_mein_unternehmen_icps_personas.sql
-- „Mein Unternehmen" SLICE 3b-1/3 — Zielgruppen & Personen (NUR TABELLEN).
-- Reiter „ICP & Personas" der Unternehmensprofil-Seite. Zwei EIGENSTÄNDIGE, verschachtelte
-- Datensatz-Typen (1:N) — bewusst NACH dem products-Muster (Slice 1), NICHT als jsonb-Liste in
-- einer org_profile-Zeile (das wäre KnowledgeListField-Territorium und kann keine Kindbeziehung).
--   org_icps      = Zielgruppen der Firma (mehrere pro Org)
--   org_personas  = Personen je Zielgruppe (mehrere pro ICP, FK icp_id ON DELETE CASCADE)
--
-- DIESER Slice legt NUR die Tabellen an (RLS/Index/Trigger). Die validierten Schreibwege
-- (create_/update_/delete_icp + _persona, jeweils settings.manage + Key-Whitelist + field_meta-lock
-- + audit_log, delete WEICH über is_active wie delete_product) kommen in 3b-2, die UI in 3b-3.
--
-- HONESTY / BENANNTE SPALTEN: KEIN generisches `attributes jsonb`-Sammelfeld — jede Eigenschaft ist
-- eine benannte, klare Spalte (Fortführung der 3a-Entscheidung). Text-Listen sind jsonb-Arrays von
-- Objekten mit stabiler id ([{id, text}]) — dieselbe Form wie 080 (problems_solved/…), damit die
-- spätere UI KnowledgeListField 1:1 auf diese Spalten setzen kann. Textwerte als jsonb (Mehrsprach-
-- Andockhaken i18nText, bereichsweite Regel „neue Textfelder immer jsonb, nie text").
--
-- FESTE SYSTEM-KATEGORIEN (bewusst, wie Won/Lost-Slugs — NICHT org-konfigurierbar, kein settings-Wert):
--   org_icps.fit_level      ∈ {high, medium, low}                    — nullable (leer = noch nicht bewertet)
--   org_personas.buying_role ∈ {decision_maker, influencer, champion, end_user, blocker} — nullable
-- Strukturelle Bezeichner, an die Auswertungs-/Matching-Logik andockt; die Migration ist die Quelle
-- der zulässigen Werte (CHECK). Umbenennen = Code+Migration-Änderung, nie Org-Config.
--
-- match_persona (AI SDR, docs/ai_sdr_bauplan_v1.md): liest die Job-Titel-Synonyme aus
-- `org_personas.job_titles` (Pflichtspalte hier) — löst das verworfene eingebettete
-- `org_profile.personas[].role_pattern`-Modell ab.

-- ── org_icps — Zielgruppen (mehrere pro Org) ─────────────────────────────────────────────────────
create table if not exists org_icps (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null default '',
  -- Feste System-Kategorie (siehe Kopf), nullable = noch nicht bewertet:
  fit_level        text check (fit_level in ('high','medium','low')),
  -- Text-Listen [{id, text}] (KnowledgeListField-kompatibel):
  company_profile  jsonb not null default '[]',   -- Firmenprofil (auf wen passt die Zielgruppe)
  fit_rationale    jsonb not null default '[]',   -- Fit-Begründung (warum passt sie)
  desired_outcomes jsonb not null default '[]',   -- Wunsch-Ergebnisse (was will sie erreichen)
  problems_solved  jsonb not null default '[]',   -- gelöste Probleme (was lösen wir für sie)
  is_active        boolean not null default true, -- weiches Löschen (wie products)
  field_meta       jsonb not null default '{}',   -- Feldpfad → {source, updated_at, confidence, locked}
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table org_icps enable row level security;
drop policy if exists "org_icps_tenant_isolation" on org_icps;
create policy "org_icps_tenant_isolation" on org_icps
  using (organization_id = auth_org_id());

create index if not exists idx_org_icps_org on org_icps(organization_id);
drop trigger if exists trg_org_icps_updated_at on org_icps;
create trigger trg_org_icps_updated_at before update on org_icps
  for each row execute function update_updated_at();
drop trigger if exists trg_org_icps_audit on org_icps;
create trigger trg_org_icps_audit after insert or update or delete on org_icps
  for each row execute function audit_write();

-- ── org_personas — Personen je Zielgruppe (1:N zu org_icps) ──────────────────────────────────────
create table if not exists org_personas (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  -- Kindbeziehung: löscht man eine Zielgruppe hart, gehen ihre Personen mit (ON DELETE CASCADE).
  icp_id           uuid not null references org_icps(id) on delete cascade,
  name             text not null default '',       -- z.B. „Head of Sales / VP Sales"
  -- Feste System-Kategorie (siehe Kopf), nullable:
  buying_role      text check (buying_role in ('decision_maker','influencer','champion','end_user','blocker')),
  -- PFLICHT für match_persona (AI SDR): Job-Titel-Synonyme, [{id, text}]:
  job_titles       jsonb not null default '[]',
  -- weitere benannte Text-Listen [{id, text}]:
  responsibilities jsonb not null default '[]',   -- Aufgaben
  goals            jsonb not null default '[]',   -- Ziele
  priorities       jsonb not null default '[]',   -- Prioritäten
  core_problems    jsonb not null default '[]',   -- Kernprobleme (Pain Points → AI-Prompt)
  objections       jsonb not null default '[]',   -- Einwände
  exact_wording    jsonb not null default '[]',   -- wörtliche Zitate (Original-Wording → AI-Prompt)
  inferred_wording jsonb not null default '[]',   -- abgeleitete Zitate
  is_active        boolean not null default true, -- weiches Löschen (wie products)
  field_meta       jsonb not null default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table org_personas enable row level security;
drop policy if exists "org_personas_tenant_isolation" on org_personas;
create policy "org_personas_tenant_isolation" on org_personas
  using (organization_id = auth_org_id());

create index if not exists idx_org_personas_org on org_personas(organization_id);
create index if not exists idx_org_personas_icp on org_personas(icp_id);
drop trigger if exists trg_org_personas_updated_at on org_personas;
create trigger trg_org_personas_updated_at before update on org_personas
  for each row execute function update_updated_at();
drop trigger if exists trg_org_personas_audit on org_personas;
create trigger trg_org_personas_audit after insert or update or delete on org_personas
  for each row execute function audit_write();

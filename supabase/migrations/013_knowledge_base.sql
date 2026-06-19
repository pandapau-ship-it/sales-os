-- 013_knowledge_base.sql
-- knowledge_base — Wissensbasis für den AI-Chat im Produkt (wächst je fertigem
-- Screen/Feature). Maßgeblich: CLAUDE.md → "KNOWLEDGE BASE".
-- Additiv: 001–012 bereits remote appliziert, hier nur eine neue Tabelle.
-- auth_org_id() stammt aus 011 (bereits vorhanden).
--
-- Append-only (nur created_at, kein updated_at) → daher KEIN update_updated_at()-
-- Trigger nötig. ABER audit_write()-Trigger (wie die Kern-Entitäten aus 010):
-- knowledge_base ist AI-Chat-relevante Quelle → kein Silent-Write, Nachvollzieh-
-- barkeit wer/wann. audit_write() passt unverändert (liest nur organization_id+id).

-- ── knowledge_base ─────────────────────────────────────────────────────────────
create table knowledge_base (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  feature          text not null,             -- z.B. "Hunter Info Panel"
  what             text not null,             -- Was es macht (1–2 Sätze)
  how              text not null,             -- Wie der User es nutzt
  value            text,                      -- Kundennutzen/Pitch (Kundensicht) — intern markiert wenn module=core
  module           text,                      -- hunter | farmer | ai_sdr | mein_tag | core
  created_at       timestamptz default now()
);

create index idx_knowledge_base_org on knowledge_base(organization_id);

-- ── RLS — Tenant-Isolation, identisches Muster wie 011 ──────────────────────────
alter table knowledge_base enable row level security;
create policy "knowledge_base_tenant_isolation" on knowledge_base using (organization_id = auth_org_id());

-- ── Audit-Log — Write wird nachvollziehbar (Muster identisch zu 010) ────────────
create trigger trg_knowledge_base_audit after insert or update or delete on knowledge_base for each row execute function audit_write();

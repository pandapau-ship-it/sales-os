-- 015_knowledge_base_seed.sql
-- knowledge_base-Einträge via Migration (kommen bei db push automatisch mit).
-- Idempotent: UNIQUE(organization_id, feature) + ON CONFLICT DO UPDATE → re-push
-- aktualisiert Texte, dupliziert nie. Künftig pro Feature/Batch eine NEUE Migration
-- (016, 017, …) mit demselben Muster; NIE eine applizierte Migration editieren.
-- docs/knowledge_base.md bleibt die menschenlesbare Sammlung/Quelle.
--
-- Hinweis: knowledge_base trägt den audit_write-Trigger (013) → Insert/Update landet
-- in audit_log (actor null bei Migration). Bei DO UPDATE entsteht pro re-push 1 Audit-
-- Eintrag je Zeile (gewollt: Nachvollziehbarkeit). Für „nur einfügen" → DO NOTHING.

-- Dedupe-Schlüssel (einmalig; existiert noch nicht aus 013). Tabelle ist leer → safe.
alter table knowledge_base
  add constraint knowledge_base_org_feature_key unique (organization_id, feature);

-- ── Eintrag: Hunter Leads-Liste (Live) — Session 2026-06-16 ───────────────────
insert into knowledge_base (organization_id, feature, what, how, value, module) values
  ('00000000-0000-0000-0000-000000000001',
   'Hunter Leads-Liste (Live)',
   'Zeigt deine Leads als Live-Liste aus dem CRM: Name, Firma, Jobtitel, ICP-Score, Heat-Status und Lifecycle-Status (Neu/Aktiv/In Pipeline/Kunde) je Kontakt.',
   'Hunter öffnen → Tab „Leads". Jede Zeile zeigt den Kontakt mit Firmen-Initiale, ICP-Donut, Heat-Badge und Status; Zeile aufklappbar für Kurzakte/Deal/Verlauf.',
   'Du siehst auf einen Blick, welche Leads heiß sind und wo sie im Funnel stehen — ohne Tabellen zu pflegen. Spart tägliche CRM-Sucharbeit und sorgt dafür, dass kein warmer Lead liegen bleibt.',
   'hunter')
on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

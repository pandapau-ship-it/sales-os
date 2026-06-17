-- 017_knowledge_base_pipeline.sql
-- knowledge_base-Eintrag für die Hunter-Pipeline (Liste & Kanban), Session 2026-06-17.
-- Muster wie 015/016: idempotent über UNIQUE(org,feature) (aus 015) + ON CONFLICT DO UPDATE.
-- Reihenfolge: nach 015/016. docs/knowledge_base.md bleibt die Sammlung.

insert into knowledge_base (organization_id, feature, what, how, value, module) values
  ('00000000-0000-0000-0000-000000000001',
   'Hunter Pipeline (Liste & Kanban)',
   'Deine offenen Deals als Liste UND als Kanban-Board nach Pipeline-Stage — mit Wert, Stage, Owner, Heat und ICP je Deal; pro Stage-Spalte Anzahl + Summe. Filtern nach Heat, Owner und (in der Liste) Stage.',
   'Hunter → Pipeline. Oben zwischen Liste und Kanban umschalten; mit den Filtern (Heat/Owner/Stage) eingrenzen — die Kanban-Aggregate folgen dem Filter.',
   'Pipeline-Wert und -Verteilung auf einen Blick: du erkennst sofort, wo Volumen steht und welche Deals heiß sind — bessere Forecasts und schnellere Priorisierung, ohne Tabellen-Pflege.',
   'hunter')
on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

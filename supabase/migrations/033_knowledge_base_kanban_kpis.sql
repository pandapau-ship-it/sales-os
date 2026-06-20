-- 033_knowledge_base_kanban_kpis.sql
-- knowledge_base-Eintrag für die neue Kanban-KPI-Übersicht über dem Pipeline-Board
-- (Pipeline-Gesamtwert · Gewichteter Wert mit Stage-Aufschlüsselung · Heat-Verteilung).
-- Ergänzt 017 (Pipeline Liste/Kanban/Filter) — neues Feature, kein Duplikat.
-- Muster wie 015/016/017: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Pipeline-Kennzahlen (Kanban)',
   'Kennzahlen-Kacheln über dem Kanban-Board: Pipeline-Gesamtwert (Summe aller aktiven Deals), Gewichteter Wert (Wert × Abschluss-Wahrscheinlichkeit der Stage, mit Aufschlüsselung pro Stage beim Hover) und Heat-Verteilung (Anzahl aktiver Deals je Heat-Stufe).',
   'Hunter → Pipeline → Ansicht „Kanban". Die Kacheln stehen über dem Board; bei „Gewichteter Wert" zeigt ein Hover die gewichteten Werte je Stage.',
   'Forecast und Pipeline-Gesundheit auf einen Blick — realistischer gewichteter Wert statt nur Bruttosumme, plus Heat-Verteilung als Frühindikator, ohne Reporting-Umweg.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

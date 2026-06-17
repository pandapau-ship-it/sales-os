-- 017_knowledge_base_pipeline.sql
-- knowledge_base-Einträge für die Hunter-Pipeline (heute fertig), Session 2026-06-17.
-- Drei getrennte Features: Listenansicht · Kanban · Filter (module='hunter').
-- Muster wie 015/016: idempotent über UNIQUE(org,feature) (aus 015) + ON CONFLICT DO UPDATE.
-- Reihenfolge: nach 015/016. docs/knowledge_base.md bleibt die menschenlesbare Sammlung.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Pipeline Listenansicht',
   'Alle offenen Deals als kompakte Tabelle — Kontakt, Stage, Deal Owner, Wert und Heat je Deal.',
   'Hunter → Pipeline → Ansicht „Liste". Pfeil rechts öffnet den Kontakt; oben nach Heat/Owner/Stage filtern.',
   'Schneller Überblick über alle Deals in einer scanbaren Tabelle — Priorisierung und Statusprüfung in Sekunden, ohne ins CRM zu wechseln.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Pipeline Kanban',
   'Deals als Kanban-Board nach Pipeline-Stage (Spalten aus den konfigurierten Stages); je Karte Wert/Heat/ICP, pro Spalte Anzahl + Summe.',
   'Hunter → Pipeline → Ansicht „Kanban". Spalten ein-/ausklappen; nach Heat/Owner filtern (Spalten-Summen folgen dem Filter).',
   'Pipeline-Verteilung und -Wert pro Stage auf einen Blick — du erkennst sofort Engpässe und wo Volumen steht, für bessere Forecasts.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Pipeline Filter',
   'Filter für Liste und Kanban: nach Heat-Stufe und Deal Owner (beide Ansichten) sowie Pipeline-Stage (nur Liste).',
   'Filterleiste oben in der Pipeline; die Auswahl grenzt die Deals sofort ein, im Kanban folgen auch die Spalten-Aggregate.',
   'Genau die Deals sehen, die gerade zählen (z.B. nur heiße, nur meine) — fokussiertes Arbeiten statt Scrollen durch alles.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

-- 053_knowledge_base_farmer_scoring.sql
-- knowledge_base-Eintrag dieser Session (2026-06-30): Farmer-DB-Wiring komplett — neu ist das
-- automatische Churn-/Upsell-Scoring (Edge Functions + tägliche Crons + Schwellen aus settings).
-- Kein Duplikat zu 046/047 (Info-Panel/Action-Panel/Follow-ups) — eigenes feature.
-- Muster wie 046/047: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE. value = Kundennutzen.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Kundengesundheit (Churn-/Upsell-Scoring)',
   'Jeder Bestandskunde bekommt automatisch täglich einen Churn-Risiko- und einen Upsell-Potenzial-Score (0–100) aus den vorhandenen Beziehungsdaten (letzter Kontakt, Antwortverhalten, Heat, Aktivität). Die Schwellen sind in den Einstellungen anpassbar. Bei aktivem Churn-Risiko oder Kündigung hat Retention Vorrang vor Upsell (beide nie gleichzeitig als Empfehlung). Fehlen Daten, bleibt der Score leer statt geraten.',
   'Läuft automatisch im Hintergrund (tägliche Neuberechnung). Sichtbar im Farmer als Churn-/Upsell-Signale, in der Übersicht-Top-5 sowie in den Retention- und Upsell-Tabs.',
   'Risiko- und Wachstumskunden werden automatisch erkannt und priorisiert — niemand muss Listen manuell durchgehen, und bei gefährdeten Kunden schlägt Retention die Expansion.',
   'farmer')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

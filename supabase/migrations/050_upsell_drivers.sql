-- 050_upsell_drivers.sql
-- Eigenes Treiber-Feld für den Upsell-Score (getrennt von churn).
-- Begründung: contacts.score_drivers + data_sources gehören dem Churn-Score (048). Würde score-upsell
-- dieselben Felder schreiben, überschrieben sich churn- (04:00) und upsell-Lauf (05:00) gegenseitig.
-- Darum eigene Spalte. (data_sources schreibt Upsell bewusst NICHT — wird aktuell nicht konsumiert.)
-- Additiv, nullable, idempotent. RLS + Audit-Trigger auf contacts unberührt (decken additive Spalten ab).

alter table contacts add column if not exists upsell_drivers jsonb; -- [{signal, points, source}] des Upsell-Scores

-- 034_deals_won_lost_note.sql
-- Strukturierter Grund + Freitext-Notiz für Won- und Lost-Abschluss.
-- lost_note:  optionaler Kontext beim Verlieren (zusätzlich zum Pflicht-lost_reason).
-- won_reason: optionaler Gewinn-Grund (Auswahl, analog lost_reason — bei Won aber NICHT Pflicht).
-- won_note:   optionaler „Was gab den Ausschlag?"-Freitext beim Gewinnen.
-- Alle optional (kein NOT NULL). Additiv + idempotent.
-- Migration schreiben — `supabase db push` entscheidet der User.

alter table deals
  add column if not exists lost_note  text,
  add column if not exists won_reason text,
  add column if not exists won_note   text;

-- 039_contacts_detail_fields.sql
-- Zusätzliche Kontakt-Stammdatenfelder für den Details-Tab (Person-Sektion), die bisher keine
-- Spalte hatten: Anrede · Sprache · Abteilung · Twitter/X. Additiv, nullable (kein Default → kein
-- Fake-Wert; leer bleibt leer). Audit deckt der bestehende Trigger trg_contacts_audit ab.
-- Migration schreiben — `db push` entscheidet der User.

alter table contacts add column if not exists salutation    text;  -- Herr | Frau | Divers
alter table contacts add column if not exists language       text;  -- Deutsch | Englisch | …
alter table contacts add column if not exists department     text;
alter table contacts add column if not exists twitter_handle text;

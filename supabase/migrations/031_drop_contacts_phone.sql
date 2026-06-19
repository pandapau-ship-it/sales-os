-- 031_drop_contacts_phone.sql
-- PH4 — Legacy-Aufräumung: die alte Einzel-Spalte contacts.phone entfernen.
-- Hintergrund: Migration 026 hat Mehrfach-Nummern in die Sub-Tabelle contact_phones
-- ausgelagert und bestehende contacts.phone-Werte als is_primary-Zeile übernommen.
-- Mit PH2 (Read) + PH3 (Write) laufen ALLE Telefon-Funktionen ausschließlich über
-- contact_phones; contacts.phone wird im Code nirgends mehr gelesen oder geschrieben
-- (contactToProfile-Fallback in PH4 entfernt). Damit ist die Spalte reine Altlast.
--
-- Idempotent (IF EXISTS) → Re-Run unkritisch. Reine Schema-Bereinigung, keine Daten-
-- migration nötig (die Daten liegen bereits vollständig in contact_phones).
-- Migration schreiben — `supabase db push` entscheidet der User.

alter table contacts drop column if exists phone;

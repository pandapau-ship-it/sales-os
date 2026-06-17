-- 022_tasks_channel.sql
-- tasks.channel: bevorzugter Kanal der Aufgabe (passend zum „Neue Task"-Formular).
-- Werte: email | linkedin | phone | calendar | other. Additiv, nullable, KEIN CHECK
-- (Werteliste app-/UI-seitig, analog priority/source). Idempotent: ADD COLUMN IF NOT EXISTS.
-- Reine Schema-Ergänzung, KEINE Datenänderung.
--
-- Priorität-Doku-Angleich (kein DB-Change): Das UI führt „Urgent" als vierte Stufe.
-- Die dokumentierte Werteliste wird auf `low | medium | high | urgent` erweitert
-- (Schema-Doc + dieser Kommentar) — die Spalte `priority` hat bewusst KEINEN CHECK,
-- daher ist kein DB-Constraint nötig, nur Doku-Konsistenz.
-- Migration schreiben — `db push` macht der User.
--

alter table tasks add column if not exists channel text;  -- email | linkedin | phone | calendar | other

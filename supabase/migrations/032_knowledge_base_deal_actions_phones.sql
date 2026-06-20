-- 032_knowledge_base_deal_actions_phones.sql
-- knowledge_base-Einträge für die neuen Hunter-Features dieser Session (2026-06-18→20):
-- Deal-Stufe ändern · Deal abschließen (Gewonnen/Verloren) · Telefonnummern am Kontakt.
-- Bestehende Features (Pipeline Liste/Kanban/Filter, Info-Panel, Deals am Kontakt, Notizen,
-- Aktivitäts-Verlauf, Kontakt-Details) sind schon in 015/016/017/024 — hier NUR neue, keine Duplikate.
-- Muster wie 015/016/017: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Deal-Stufe ändern',
   'Deals durch die Pipeline bewegen — direkt von der Kanban-Karte (Pfeile vor/zurück), per Klick auf den Stage-Badge in der Liste und im Kontakt (Deals-/Übersicht-Tab). Schreibt sofort in die Pipeline, überall synchron.',
   'Pipeline → Kanban: Pfeile ← / → an der Karte. Oder Stage-Badge anklicken (Liste, Deals-Tab, Übersicht) und neue Stufe wählen.',
   'Pipeline-Pflege in einem Klick statt Formular — der Status bleibt aktuell, Forecasts und Follow-ups stimmen, ohne Reibung.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Deal abschließen (Gewonnen / Verloren)',
   'Deals sauber abschließen: „Gewonnen" markiert den Abschluss (mit kurzer Erfolgs-Animation), „Verloren" verlangt einen Grund (Preis, kein Bedarf, Wettbewerber, Timing, kein Response, anderer Grund) plus optionale Notiz. Abschlussdatum wird automatisch gesetzt.',
   'Letzte Pfeil-Stufe im Kanban → „Gewonnen" oder „Verloren" wählen; bei Verloren den Grund angeben.',
   'Saubere Won/Lost-Daten als Basis für Win-Rate, Verlustgründe und bessere Forecasts — und ein motivierender Moment beim Gewinnen.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Telefonnummern am Kontakt',
   'Mehrere Telefonnummern pro Kontakt mit Typ (Mobil/Geschäftlich/Privat) und einer Favorit-Nummer. Anrufen und Kopieren direkt aus dem Kontakt; Anlegen/Bearbeiten/Löschen inline; Eingaben werden geprüft (nur gültige Nummern).',
   'Kontakt öffnen → auf die Telefon-Pill klicken: Popover mit allen Nummern (Anrufen/Kopieren, Favorit setzen). Verwalten im Details-Tab der Vollansicht.',
   'Alle Nummern eines Kontakts an einem Ort, sofort anrufbar — keine verstreuten Daten, schnellerer Erstkontakt, saubere Stammdaten.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

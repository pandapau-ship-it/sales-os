-- 038_knowledge_base_comms_heat_tasks.sql
-- knowledge_base-Einträge für die neuen Features dieser Session:
--   (1) Kommunikation protokollieren (manueller Touchpoint → Tab + Modal)
--   (2) Pipeline Task-Liste (Stagniert / Keine Task — signal-getriebene Karten aus echten Deals)
--   (3) Automatische Heat-Einstufung (heat_status aus letztem Kontakt)
-- Ergänzt 016 („Kommunikations-Verlauf" = Anzeige) — hier kommt das ANLEGEN dazu, kein Duplikat.
-- Muster wie 015/016/017/033: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Kommunikation protokollieren',
   'Manuelles Erfassen eines Touchpoints (E-Mail · LinkedIn · Anruf · Meeting) mit Richtung (Ausgehend/Eingehend), Datum/Uhrzeit und optionaler Notiz. Erscheint im Kommunikations-Tab und als kompakter „Letzter Kontakt"-Block in der Übersicht; aktualisiert automatisch „zuletzt kontaktiert".',
   'Kontakt öffnen → Tab „Kommunikation" → „Protokollieren" (oder in der Übersicht „Letzter Kontakt"). Kanal + Richtung wählen, Zeitpunkt setzen, optional Notiz, speichern.',
   'Lückenlose Kontakt-Historie ohne CRM-Pflege-Frust — jeder Touchpoint zählt sofort in „zuletzt kontaktiert" und in die Heat-Einstufung. Spätere Auto-Touchpoints (Gmail/Outlook) landen in derselben Ansicht.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Pipeline Task-Liste (Stagniert / Keine Task)',
   'Signal-getriebene Aufgaben-Liste über der Pipeline: stagnierende Deals (länger als die Stage-Schwelle ohne Fortschritt) und aktive Deals ohne offene Task. Jede Karte zeigt echten Kontakt/Firma/Heat/Stage; „Task anlegen" öffnet das Formular mit vorausgefülltem Deal. Leere Liste → nichts angezeigt.',
   'Hunter → Pipeline → Button „Task Liste". Der Zähler nennt die Anzahl; auf einer Karte „Task anlegen" → Deal ist bereits gewählt.',
   'Kein Deal fällt durchs Raster: Stagnation und fehlende Folgeaufgaben werden aktiv hochgespült, statt im Board unterzugehen — mehr Abschlüsse durch konsequentes Nachfassen.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Automatische Heat-Einstufung',
   'Der Heat-Status eines Kontakts (Engaged/Warm/Cooling/Cold/Gone) wird automatisch aus dem letzten Kontaktzeitpunkt berechnet — direkt nach jedem protokollierten Touchpoint und zusätzlich täglich. Ohne Kontaktdatum bleibt der Status leer (kein erfundener Wert).',
   'Passiv: einfach Kontakte protokollieren — die Heat-Badges in Listen, Kacheln und Panel aktualisieren sich von selbst. Schwellen sind in den Einstellungen konfigurierbar.',
   'Heat zeigt immer den echten Beziehungszustand statt manueller Pflege — verlässlicher Frühindikator für abkühlende Kontakte, ohne Zusatzaufwand.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

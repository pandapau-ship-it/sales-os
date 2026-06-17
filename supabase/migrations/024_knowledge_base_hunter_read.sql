-- 024_knowledge_base_hunter_read.sql
-- knowledge_base-Einträge für die seit 017 fertiggestellten Hunter-Read-Features
-- (Session 2026-06-17, Teil 2): Signals · Neu in Pipeline · Follow-ups (module='hunter').
-- Pipeline-Einträge liegen bereits in 017 — hier NICHT dupliziert.
-- Muster wie 015/016/017: idempotent über UNIQUE(org,feature) (aus 015) + ON CONFLICT DO UPDATE.
-- `value` = Kundennutzen/Pitch (CLAUDE.md-Regel). docs/knowledge_base.md = menschenlesbare Sammlung.
-- Migration schreiben — `db push` macht der User am Sessionstart.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Hunter Signals',
   'Echte Kauf-/Engagement-Signale zu deinen Kontakten (z.B. LinkedIn-Aktivität, Job-Wechsel) als Feed — mit Kontakt-Kachel, Signaltyp, Zeit und — wenn vorhanden — der Stage des zuletzt aktiven Deals.',
   'Hunter → Signale. Jede Kachel zeigt den Anlass; Pfeil rechts öffnet den Kontakt. Leer = aktuell nichts zu tun.',
   'Du erfährst sofort, wann ein Kontakt anspringt — und reagierst im richtigen Moment statt zu spät. Mehr Antworten, weniger verpasste Chancen.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Neu in Pipeline',
   'Frisch in die Pipeline eingegangene Deals als Übersicht, wählbar nach Zeitraum (heute / letzte 7 Tage / letzter Monat); je Eintrag Herkunft „Via AI SDR" oder „Manuell hinzugefügt".',
   'Hunter → Neu in Pipeline. Oben den Zeitraum wählen; Pfeil öffnet den Kontakt. Zeigt nur frisch Eingegangenes, nicht die ganze Pipeline.',
   'Du siehst auf einen Blick, was neu reinkam und woher — schneller Einstieg in frische Opportunities, ohne die komplette Pipeline zu durchsuchen.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Follow-ups',
   'Alle fälligen Aufgaben an deinen Kontakten/Deals als Liste — pro Eintrag die Kontakt-Kachel plus Aufgabe und Fälligkeit (überfällig rot, heute markiert). Erledigte verschwinden direkt.',
   'Hunter → Follow-ups. „Erledigt" hakt die Aufgabe ab (verschwindet sofort). Leer = alles erledigt.',
   'Kein Follow-up fällt mehr durchs Raster — du arbeitest deine fälligen Aufgaben ab und hältst Deals warm, mit klarer Dringlichkeit auf einen Blick.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

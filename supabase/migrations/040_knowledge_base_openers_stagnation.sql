-- 040_knowledge_base_openers_stagnation.sql
-- knowledge_base-Einträge dieser Session:
--   (1) Signal-Antwort (Opener)         — Action-Panel je LinkedIn-Signal
--   (2) Kontakt reaktivieren (Kalt)     — Action-Panel für kalte/inaktive Kontakte
--   (3) Stagnations-Warnung am Deal     — roter „⚠ Xt"-Hinweis überall, wo ein Deal erscheint
-- + Update von „Kontakt-Details (Inline-Edit)" (jetzt echt persistiert: contacts/companies).
-- Muster wie 015/016/038: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Signal-Antwort (Opener)',
   'Aus einem LinkedIn-Signal heraus direkt antworten: ein Action-Panel mit echtem Kontakt-Kontext (Name/Firma/ICP/Aktionstext/Zeit). KI-Antwortentwurf + Empfehlung sind als „Folgt"-Platzhalter markiert (kommen mit der AI-Pipeline) — kein erfundener Text.',
   'Hunter → Signals → auf einer Signal-Kachel „Antworten" → das Opener-Panel öffnet rechts.',
   'Vom Signal zur Reaktion in einem Klick — der Rep verliert kein Reaktionsfenster; der KI-Entwurf beschleunigt das später zusätzlich.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Kontakt reaktivieren (Kalt)',
   'Action-Panel für kalt werdende/inaktive Kontakte (heat_status kalt/tot): echter Kontext (Name/Firma, „vor X Tagen"). Reaktivierungs-Entwurf + Empfehlung als „Folgt"-Platzhalter (AI-Pipeline). Erscheint nur, wenn es kalte Kontakte gibt.',
   'Hunter → Follow-ups → Sektion „Kalt & Inaktiv" → auf einer Karte „Start Outreach".',
   'Abkühlende Beziehungen werden aktiv hochgespült und mit einem Klick reaktiviert — weniger verlorene Deals durch Vergessen.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Stagnations-Warnung am Deal',
   'Sobald ein Deal länger als die Stage-Schwelle (Einstellungen) ohne Fortschritt steckt, erscheint direkt neben der Stage ein roter Hinweis „⚠ Xt". Überall sichtbar, wo ein Deal gezeigt wird: Pipeline-Liste, Deal-Kacheln, Übersicht und aufgeklappte Ansicht. Terminal (gewonnen/verloren) → kein Hinweis.',
   'Passiv — der Hinweis erscheint automatisch an stagnierenden Deals; die Schwelle pro Stage ist in den Einstellungen konfigurierbar.',
   'Frühwarnung ohne Reporting-Umweg — niemand muss Stagnation manuell suchen; festhängende Deals fallen sofort auf.',
   'hunter'),

  ('00000000-0000-0000-0000-000000000001',
   'Kontakt-Details (Inline-Edit)',
   'Alle Stamm-/Firmen-/CRM-Felder auf einen Blick; befüllte Werte lesbar. Inline-Edit schreibt jetzt ECHT in die DB (contacts/companies): Person, Firma, E-Mail/LinkedIn/Web, Lead-Status (contact_status). E-Mail/URL werden geprüft (ungültig → roter Rand, kein Speichern); leeres Feld → kein Fake-Wert.',
   'Wert anklicken und direkt im Feld ändern (kein Extra-Fenster), leere Felder per „+ Hinzufügen"; aus dem Panel öffnet der Stift die Vollansicht mit Fokus auf dem Feld. Telefonnummern mit Favorit-Stern.',
   'Kontaktpflege wie in einem modernen CRM — schnell, inline, geprüft. Saubere Daten als Basis für Automatisierung, Personalisierung und Reporting.',
   'hunter')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

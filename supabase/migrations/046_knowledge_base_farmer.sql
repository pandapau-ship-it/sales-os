-- 046_knowledge_base_farmer.sql
-- knowledge_base-Einträge dieser Session: Farmer-Screen (alle 5 Tabs, UI fertig — Mock).
-- Muster wie 015/016/038/040/044: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.
-- Hinweis: UI-Stand (kein DB-Wiring); value = Kundennutzen aus Kundensicht.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Übersicht (Kundengesundheit)',
   'Der Einstieg in die Kundenpflege: Kennzahlen auf einen Blick (laufender Umsatz, gefährdeter Umsatz durch Churn-Risiko, Upsell-Potenzial, Netto-Umsatzbindung) plus eine Gesundheits-Übersicht aller Bestandskunden mit Sprung in die Kundenliste.',
   'Farmer öffnen → Tab „Übersicht". Über „Alle anzeigen" direkt in die Kundenliste wechseln.',
   'Sofort sehen, wo Umsatz wackelt und wo er wächst — ohne Report zu bauen. So fließt die Energie zuerst zu den Kunden, die sie am dringendsten brauchen oder am meisten Wachstum bringen.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Kundenliste',
   'Liste aller Bestandskunden im einheitlichen Karten-Format (Person, Firma, ICP, Subscription-Status aktiv/gekündigt, Heat, letzter Kontakt). Aufklappbar für Kurzakte, Deals und Kommunikationsverlauf; grüner Pfeil öffnet das volle Kundenprofil.',
   'Farmer → Tab „Kunden". Karte aufklappen für Details, Pfeil für das volle Profil.',
   'Alle Kunden an einem Ort, im gleichen vertrauten Format wie die Leads — kein Umlernen. Status und letzter Kontakt sofort sichtbar, damit niemand übersehen wird.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Retention (Churn-Prävention)',
   'Bündelt gefährdete Kunden in drei Signal-Typen: akutes Churn-Risiko (z. B. Nutzungseinbruch), „Kunde wird kalt" (kein Kontakt seit längerem) und eingegangene Kündigungen — jeweils mit klarer Empfehlung und passender Aktion (Retention sichern · Check-in starten · sofort anrufen).',
   'Farmer → Tab „Retention". Pro Karte die empfohlene Aktion auslösen.',
   'Churn früh erkennen und handeln, bevor der Kunde weg ist — gerettete Bestandsumsätze sind günstiger als jede Neukundengewinnung.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Upsell-Empfehlungen',
   'Zeigt Kunden mit Wachstumspotenzial (z. B. stark steigende Feature-Nutzung oder fast ausgeschöpfte Limits) als Upsell-Karten mit konkreter AI-Empfehlung und Aktion.',
   'Farmer → Tab „Upsell". Empfohlene Upsell-Aktion pro Karte starten.',
   'Mehr Umsatz aus bestehenden Kunden: Upgrade-Chancen werden automatisch sichtbar, statt im Tagesgeschäft unterzugehen.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Signale',
   'Aktivitäts-Signale rund um Bestandskunden (z. B. LinkedIn-Interaktionen) im gleichen Signal-Format wie im Hunter — mit Mehrfachauswahl und Antwort-Aktion.',
   'Farmer → Tab „Signals". Signal auswählen und reagieren.',
   'Warme Momente bei Bestandskunden nutzen: Wer gerade interagiert, ist offen für ein Gespräch — der ideale Zeitpunkt für Pflege oder Expansion.',
   'farmer')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

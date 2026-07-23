-- 094_knowledge_base_lifecycle_rules.sql
-- knowledge_base-Eintrag dieser Session (2026-07-23): der Automatik-Regel-Baukasten (Lifecycle L-2/L-3)
-- ist erstmals als User-Feature nutzbar — WENN-DANN-Regeln über eigene Bedingungen, plus der Sprung aus
-- einer gefeuerten Regel-Benachrichtigung direkt in die betroffene Liste (L-3e Deeplink).
-- Kein Duplikat zu bestehenden Einträgen (Hunter/Farmer/Team/…) — eigenes feature.
-- Muster wie 046/047/053: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE. value = Kundennutzen.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Automatik-Regeln (WENN-DANN)',
   'Du baust dir eigene WENN-DANN-Regeln zusammen: eine Bedingung über deine Kontakte, Firmen oder Deals (z.B. „Churn-Score über 60" oder „Deal seit 14 Tagen in derselben Stufe") und eine Aktion, die dann automatisch passiert — benachrichtigen, eine Aufgabe anlegen, ein Tag setzen oder zu einer Liste hinzufügen. Die Regel feuert genau einmal, wenn ein Datensatz die Bedingung neu erfüllt, und wird erst wieder scharf, wenn er sie zwischendurch nicht mehr erfüllt (kein Dauer-Spam). Mehrere Treffer aus demselben Lauf kommen als EINE gebündelte Benachrichtigung.',
   'Unter Einstellungen → Automatik-Regeln: neue Regel anlegen (Anker wählen, Bedingungen zusammenklicken, Aktion wählen) oder eine Vorlage nehmen. Eine Live-Trefferzahl zeigt beim Bauen sofort, wie viele Datensätze die Regel gerade treffen würde. Regeln lassen sich aktiv/inaktiv schalten, bearbeiten und löschen.',
   'Wiederkehrende Handgriffe passieren von selbst: gefährdete Kunden, stagnierende Deals oder heiße Signale lösen automatisch die richtige Reaktion aus, statt dass jemand Listen manuell durchgeht — ohne dass ein Entwickler etwas programmieren muss.',
   'core'),

  ('00000000-0000-0000-0000-000000000001',
   'Sprung aus Regel-Benachrichtigung in die Trefferliste',
   'Eine Benachrichtigung aus einer Automatik-Regel ist anklickbar: der Klick öffnet direkt die Kontakte- bzw. Firmen-Liste, bereits gefiltert auf genau die Datensätze, die die Regel getroffen haben. Ist ein Treffer inzwischen gelöscht, wird das ehrlich ausgewiesen; gibt es die Regel nicht mehr oder trifft sie gerade niemanden, erklärt ein klarer Hinweis, was los ist, statt einer leeren Seite.',
   'In der Glocke auf eine Regel-Benachrichtigung klicken — die passende Liste öffnet sich gefiltert. Das X im Hinweis-Banner hebt den Filter wieder auf.',
   'Von der Meldung „diese Kunden brauchen Aufmerksamkeit" bis zur bearbeitbaren Liste ist es ein Klick — kein Suchen, kein Nachbauen des Filters, keine Sackgasse bei veralteten Meldungen.',
   'core')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

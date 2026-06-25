-- 047_knowledge_base_farmer_panels.sql
-- knowledge_base-Einträge dieser Session (2026-06-25): Farmer Info-Panel [D33] +
-- Action-Panel [D34] + Follow-ups-Tab [D46] (UI fertig — Mock, kein DB-Wiring).
-- Muster wie 046: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.
-- value = Kundennutzen aus Kundensicht.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Kundenprofil (Info-Panel)',
   'Das vollständige Kundenprofil als seitliches Panel — und auf Wunsch als Vollansicht: Subscription & Nutzung, offene Aufgaben, Kommunikationsverlauf, Notizen und aktive Signale (Churn-Risiko, Upsell, „wird kalt", Kündigung) an einem Ort. Kontaktzeile mit Mail, Telefon, LinkedIn und Website direkt im Kopf.',
   'Farmer → bei einer Kundenkarte den Pfeil klicken → Panel öffnet. Über das Aufklapp-Symbol oben rechts in die Vollansicht wechseln.',
   'Alles über einen Kunden in einem Blick, ohne zwischen Tools zu springen — schnellere, fundiertere Gespräche und kein Detail geht unter.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Aktionspanel (Empfehlung → Aktion)',
   'Pro Kunden-Signal (Churn-Risiko, „wird kalt", Upsell, Kündigung) öffnet ein fokussiertes Aktionspanel mit AI-Empfehlung und passenden Aktionen (Retention-Nachricht, Reaktivierung, Upsell-Nachricht, Winback-Anruf, Aufgabe anlegen, Snooze) — im selben Format wie im Hunter.',
   'Farmer → bei einem Signal/einer Karte die empfohlene Aktion klicken → Aktionspanel öffnet sich rechts.',
   'Von der Erkenntnis direkt zur Handlung in einem Schritt — die richtige Reaktion ist immer schon vorbereitet, der Mensch bestätigt nur.',
   'farmer'),

  ('00000000-0000-0000-0000-000000000001',
   'Farmer-Follow-ups',
   'Der Tagesarbeits-Tab für Bestandskunden: alle fälligen Aufgaben bei Kunden plus „Kunde wird kalt"-Karten (kein Kontakt seit längerem) an einem Ort. Aufgaben lassen sich aufschieben (Snooze) oder direkt erledigen; „Ansehen" springt zur Aufgabe und hebt sie kurz hervor.',
   'Farmer → Tab „Follow-ups". Fällige Aufgaben abarbeiten, „Kunde wird kalt"-Karten mit Aktion oder Snooze bearbeiten.',
   'Klare Tagesliste für die Kundenpflege: was heute bei Bestandskunden ansteht, an einem Ort — nichts fällt durchs Raster, Beziehungen bleiben warm.',
   'farmer')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;

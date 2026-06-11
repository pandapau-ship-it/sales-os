# sales_os_edge_functions.md
# Edge Functions Spezifikation — Sales OS
# Für Claude Code: Supabase Edge Functions (Deno)
# Stand: Juni 2026 — Version 3
# Neu in v2: validate_booking(), Cal.com Integration, Enrichment, Platzhalter-Fallbacks
# Neu in v3: Progressive Data Logic für score_churn_risk() + score_upsell(), calculate_health_score() neu

---

## GRUNDREGELN

- Jede Edge Function läuft in Supabase (Deno Runtime)
- Jede Function prüft zuerst: ist organization_id vorhanden und berechtigt?
- Kein direkter Supabase-Aufruf aus Frontend-Komponenten — immer via lib/db.ts
- Alle AI-Aufrufe laufen über aiCall() in lib/ai.ts — nie direkt in Edge Functions
- Fehler werden immer geloggt (audit_log) bei kritischen Aktionen
- Alle Prompts werden in Langfuse versioniert (Prompt-ID mitgeben)

---

## 1. sequence_runner (Cron — alle 5 Minuten)

**Zweck:** Prüft welche Leads einen fälligen Step haben und verarbeitet sie.

**Trigger:** Supabase Cron Job, alle 5 Minuten

**Ablauf:**
```
1. Hole alle leads WHERE:
   - sequence_status = 'active'
   - scheduled_at <= now()
   - organization ist aktiv (kein Plan-Ablauf)

2. Pro Lead:
   a. Lade Campaign + Sequence + Contact + Settings
   b. Prüfe Sending Window:
      - Ist jetzt Wochentag + Uhrzeit im erlaubten Fenster?
      - Nein → scheduled_at auf nächsten erlaubten Slot setzen → überspringen
   c. Prüfe Mailbox-Limit:
      - Wurden heute bereits max. Sends erreicht (Email / LinkedIn)?
      - Ja → Lead bleibt in Queue, Banner-Flag setzen → überspringen
   d. Rufe process_lead(lead_id) auf

3. Wenn Mailbox-Limit-Banner aktiv: Realtime-Event an UI senden
```

**Output:** Anzahl verarbeiteter Leads, Anzahl übersprungener Leads, Fehler

**Wichtig:** scheduled_at wird nach jedem Step auf den nächsten Zeitpunkt gesetzt.
Bei letztem Step ohne Response: scheduled_at = null, status = 'completed', nach 90T Reaktivierungs-Tag setzen.

---

## 2. process_lead(lead_id)

**Zweck:** Entscheidet für einen einzelnen Lead was als nächstes passiert.

**Input:** lead_id

**Ablauf:**
```
1. Lade Lead + Contact + Campaign + aktuellen Sequence-Step

2. Prüfe Kontaktdaten:
   - Kanal des Steps = Email → ist email vorhanden?
   - Kanal des Steps = LinkedIn → ist linkedin_url vorhanden?
   - Fehlt → sequence_status = 'requires_human', reason = 'contact_data_missing'
   - Enrichment-Modul aktiv? → enrichContact() automatisch versuchen
   - Realtime-Event an UI → fertig

3. Prüfe Automation-Level:
   - Campaign.automation_level = 'manual'
     → sequence_status = 'requires_human', reason = 'manual_mode' → fertig
   - Campaign.automation_level = 'semi' oder 'auto'
     → weiter

4. Prüfe Approval-Regeln:
   - Ist es der erste Step + approval_rules.require_approval_first_touch = true?
     → requires_human, reason = 'approval_required' → fertig

5. Generiere Nachricht:
   - Rufe generate_message(lead_id, step) auf
   - Ergebnis: {body, subject, channel, confidence}

6. Entscheide basierend auf Automation-Level + Confidence:
   - Auto + confidence >= threshold → senden via send_message()
   - Semi ODER confidence < threshold → requires_human, Entwurf speichern
   - → Realtime-Event an UI

7. Nach Senden:
   - message in DB speichern (status: sent)
   - lead.last_step_sent_at = now()
   - lead.scheduled_at = now() + sequence_step.delay_days
   - lead.sequence_step_current += 1 (wenn letzter Step → completed)
```

**Output:** {action: 'sent' | 'queued_for_review' | 'requires_human', reason?, message_id?}

---

## 3. generate_message(lead_id, step_number)

**Zweck:** Generiert eine personalisierte Nachricht via AI.

**Input:** lead_id, step_number

**Ablauf:**
```
1. Lade: Contact + Company + Campaign.messaging_brief + Campaign.pitch
2. Lade: Kommunikationshistorie (letzte 5 Nachrichten)
3. Lade: Sherloq-Signale zum Kontakt (falls vorhanden)
4. Löse Platzhalter auf: resolve_placeholders(template, contact_id, campaign_id)
5. Baue Prompt: Brief + Lead-Daten + History + Signal-Kontext
6. Rufe AI an (Langfuse Prompt-ID: 'generate_message_v1')
7. Parse Response: {subject?, body, channel, personalization_notes}
8. Prüfe Verbotene Wörter (aus messaging_brief)
   → Bei Treffer: neu generieren (max. 2 Versuche)
```

**Output:** {subject?, body, channel, confidence, prompt_version}

---

## 4. classify_intent(message_id)

**Zweck:** Klassifiziert eine eingehende Antwort eines Leads.

**Input:** message_id (eingehende Nachricht)

**Ablauf:**
```
1. Lade: Message + Lead + Konversationshistorie
2. Rufe AI an (Langfuse Prompt-ID: 'classify_intent_v1')
   Prompt liefert: {intent, confidence, suggested_action, reasoning}
3. Intent-Labels:
   - interested        → follow-up oder Termin-Link
   - wants_meeting     → Termin-Link senden
   - objection         → AI antwortet auf Einwand
   - not_now           → pausieren, in X Wochen wieder
   - opt_out           → sofort requires_human, Opt-out-Flow
   - unclear           → requires_human
4. Speichere: lead.intent_label + lead.intent_confidence
5. Entscheide:
   - opt_out → immer requires_human (egal welche Confidence)
   - confidence >= threshold + auto → handle_intent() aufrufen
   - confidence < threshold → requires_human + Entwurf als Preview
6. Realtime-Event an UI
```

**Output:** {intent, confidence, action_taken: 'auto' | 'requires_human', draft_id?}

---

## 5. handle_intent(lead_id, intent)

**Zweck:** Führt die passende Aktion nach Intent-Klassifizierung aus.

**Input:** lead_id, intent

**Ablauf je Intent:**
```
interested / objection:
  → generate_reply(lead_id) → senden oder requires_human je Confidence

wants_meeting:
  → generate_booking_link(lead_id) wenn Auto
  → requires_human wenn Semi

not_now:
  → sequence pausieren
  → scheduled_at = now() + X Wochen (aus Campaign-Regeln)

opt_out:
  → IMMER requires_human
  → sequence_status = 'requires_human', reason = 'opt_out'
  → UI zeigt Opt-out-Flow (nicht überspringbar)
```

---

## 6. generate_reply(lead_id)

**Zweck:** Generiert eine Antwort auf eine eingehende Nachricht.

**Input:** lead_id

**Ablauf:**
```
1. Lade: eingehende Nachricht + Konversationshistorie + Brief + Lead-Daten
2. Rufe AI an (Langfuse Prompt-ID: 'generate_reply_v1')
3. Output: {body, tone_match, confidence}
4. Speichere als Draft (message.status = 'draft')
```

**Output:** {draft_id, body, confidence}

---

## 7. resolve_placeholders(template, contact_id, campaign_id)

**Zweck:** Füllt Platzhalter in Templates mit echten Lead-Daten.

**Input:** template (String mit {{platzhalter}}), contact_id, campaign_id

**Platzhalter → Felder:**
```
{{vorname}}     → contact.first_name
{{nachname}}    → contact.last_name
{{company}}     → company.name
{{jobtitel}}    → contact.job_title
{{branche}}     → company.industry
{{stadt}}       → company.city
{{signal}}      → letztes Sherloq-Signal (kurz zusammengefasst)
```

**Fallback-Logik (NEU — frei konfigurierbar pro Campaign):**
```
1. Lade campaign.messaging_brief.placeholder_fallbacks
   Struktur: { "vorname": "Sie", "company": "Ihrem Unternehmen", "signal": "" }

2. Pro Platzhalter:
   - Feld hat Wert → einsetzen
   - Feld leer + Fallback definiert + Fallback nicht leer → Fallback einsetzen
   - Feld leer + Fallback leer oder nicht definiert → Platzhalter komplett
     entfernen (Satz wird ohne ihn neu formuliert via AI-Kurzaufruf)

3. Wenn Pflichtfeld (vorname, company) leer UND kein Fallback definiert:
   → requires_human = true, reason = 'placeholder_unresolvable'
   → Nicht senden
```

**Wichtig:** Platzhalter werden IMMER hier aufgelöst, nie im Frontend.

**Output:** {resolved_text, missing_fields[], fallbacks_used[]}

---

## 8. analyze_engagement(lead_id)

**Zweck:** Analysiert Engagement-Signale und passt den nächsten Step an.

**Input:** lead_id

**Trigger:** wird nach jedem Tracking-Event aufgerufen (Open, Click, LinkedIn-Seen)

**Ablauf:**
```
1. Lade: lead.open_count, lead.click_count, Nachrichtenhistorie
2. Prüfe sequence_rules der Organization
3. Bei Regeltreff:
   - Passe nächsten Step an (Text-Variante / Kanalwechsel / Timing)
   - Speichere Anpassung in lead.ai_adjustments (mit Begründung)
   - Realtime-Event an UI (Badge "AI angepasst" im Lead)
4. Max. 3 Anpassungen pro Lead (danach requires_human)
```

**Output:** {adjustment_made: boolean, type?, reason?}

---

## 9. classify_sherloq_lead(signal_id)

**Zweck:** Matched einen eingehenden Sherloq-Lead zur passenden Campaign.

**Input:** signal_id

**Ablauf:**
```
1. Lade Signal + Contact-Daten
2. Prüfe ob Kontakt bereits in DB:
   - Match via linkedin_url (Primary Key)
   - Fallback: email
   - Kein Match → neuen Kontakt anlegen
3. Prüfe contact_status:
   - ohne_campaign → Campaign-Matching
   - in_campaign / pipeline / kunde → routen zu Hunter/Farmer
4. Campaign-Matching (SQL, kein AI):
   Score = Jobtitel (3P) + Branche (2P) + Größe (2P) + Region (1P) + ICP (2P)
   Mindest-Score 3 für Match
   Kein Match → Campaign 'Standard Cold'
5. Lead anlegen + scheduled_at setzen
6. Realtime-Event an UI
```

**Output:** {contact_id, campaign_id, score, routed_to}

---

## 10. generate_booking_link(lead_id)

**Zweck:** Generiert einen personalisierten Cal.com Booking-Link für einen Lead.

**Input:** lead_id

**Ablauf:**
```
1. Lade: Lead + Contact + Campaign.sender_config
2. Ermittle den zuständigen User (Kalender-Inhaber)
3. Rufe Cal.com API auf:
   - Erstelle Event-Type falls nicht vorhanden (30-Min Demo, 60-Min Discovery etc.)
   - Generiere personalisierten Booking-Link mit Lead-Metadata
   - Video-Provider: Teams oder Google Meet (aus User-Settings)
4. Speichere Booking-Link in lead.booking_link
5. Füge Link in nächste Nachricht ein (via Platzhalter {{termin_link}})
```

**Output:** {booking_url, event_type_id, expires_at?}

---

## 11. validate_booking(booking_payload)

**Zweck:** Verarbeitet eingehende Cal.com Webhook-Bestätigung wenn Termin gebucht.

**Input:** Cal.com Webhook Payload

**Trigger:** Cal.com sendet Webhook bei: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED

**Ablauf:**
```
BOOKING_CREATED:
1. Finde Lead via booking_link oder contact email
2. contact_status → pipeline
3. sequence_status → paused (nicht gelöscht)
4. Deal automatisch anlegen (stage: 'demo_vereinbart' — kanonischer Slug, nie 'discovery')
5. Rufe prep_meeting(lead_id) auf
6. Realtime-Event an UI (erscheint in Mein Tag Zone 1)
7. audit_log Eintrag: 'booking_confirmed'

BOOKING_CANCELLED:
1. Finde Lead + Deal
2. Deal-Stage zurücksetzen oder requires_human
3. Sequence-Fortführung vorschlagen
4. Realtime-Event + Mein Tag Hinweis

BOOKING_RESCHEDULED:
1. Deal-Termin aktualisieren
2. Meeting-Prep neu generieren
3. Realtime-Event
```

**Output:** {processed: true, action_taken, lead_id, deal_id?}

---

## 12. prep_meeting(lead_id)

**Zweck:** Generiert ein Meeting-Briefing wenn ein Termin gebucht wird.

**Input:** lead_id

**Trigger:** Wird von validate_booking() aufgerufen nach BOOKING_CREATED.

**Ablauf:**
```
1. Lade: Contact + Company + Deal + Nachrichtenhistorie + Sherloq-Signale
2. Rufe AI an (Langfuse Prompt-ID: 'prep_meeting_v1')
3. Output-Struktur:
   {
     summary: "3-Satz Zusammenfassung",
     key_points: ["Punkt 1", "Punkt 2", "Punkt 3"],
     risks: ["Risiko 1"],
     opportunities: ["Chance 1"],
     suggested_questions: ["Frage 1", "Frage 2"]
   }
4. Speichere in deal.meeting_prep
```

**Output:** {meeting_prep: object, deal_id}

---

## 13. morning_briefing(user_id)

**Zweck:** Generiert die tägliche Zusammenfassung für Mein Tag.

**Input:** user_id

**Trigger:** Cron Job, täglich 07:00 Uhr (je User-Timezone)

**Ablauf:**
```
1. Lade: heutige Termine + überfällige Tasks + Pipeline-Status
2. Lade: Leads die requires_human = true
3. Lade: Churn-Risk Warnungen + Upsell-Signale
4. Lade: Reaktivierungs-Pool (Leads > 90T ohne Response)
5. Rufe AI an (Langfuse Prompt-ID: 'morning_briefing_v1')
6. Output: Top-5-Prioritäten (priorisiert nach Dringlichkeit + Wert)
7. Speichere in Supabase (daily_briefings Tabelle)
8. Realtime-Event an UI
```

**Output:** {priorities[], warnings[], meetings[], reactivation_count}

---

## 14. validate_sherloq_signal(payload)

**Zweck:** Validiert und verarbeitet eingehende Sherloq-Webhooks.

**Input:** raw webhook payload

**Ablauf:**
```
1. Prüfe Webhook-Signatur (HMAC)
2. Prüfe Pflichtfelder: signal_type, contact.linkedin_url oder contact.email
3. Speichere Signal in signals Tabelle
4. Rufe classify_sherloq_lead(signal_id) auf
```

**Output:** {received: true, signal_id}

---

## 15. score_churn_risk(contact_id)

**Zweck:** Berechnet Churn-Risiko für Bestandskunden (Farmer).

**Input:** contact_id

**Wichtig — Progressive Data Logic:**
Die Function arbeitet mit verfügbaren Daten und ignoriert fehlende Quellen.
Zwei Schichten:

**Basis-Score (immer verfügbar — aus Sales OS selbst):**
```
Letzter Kontakt > 30T        → +25 Punkte  (aus messages Tabelle)
Kein Reply auf letzte Mail   → +20 Punkte  (aus messages Tabelle)
Offene Tasks überfällig      → +15 Punkte  (aus tasks Tabelle)
Tage ohne Aktivität > 14T    → +20 Punkte  (aus contacts.last_contacted_at)
Heat Status = Kalt/Tot       → +20 Punkte  (berechnet)
```

**Erweiterter Score (nur wenn externe Quelle verbunden):**
```
Letzter Login > 30T          → +30 Punkte  (aus Sherloq Webhook — wenn aktiv)
Nutzung -50% vs. Vormonat   → +25 Punkte  (aus Sherloq Webhook — wenn aktiv)
Support-Tickets offen        → +20 Punkte  (aus Zendesk/Intercom — wenn verbunden)
Vertrag läuft in 60T ab      → +15 Punkte  (aus Stripe Webhook — wenn verbunden)
Kündigung angedeutet         → +30 Punkte  (aus classify_intent() — wenn vorhanden)
```

**Score-Berechnung:**
- Nur verfügbare Datenpunkte werden addiert
- Score wird normalisiert auf 0–100 basierend auf verfügbaren Datenpunkten
- UI zeigt: "Score basiert auf: Kommunikation · Aktivität" oder "Score basiert auf: Kommunikation · Aktivität · Sherloq Usage"

**Schwellenwerte (aus settings.thresholds):**
- 0–30: low · 31–60: medium · 61–85: high · 86+: critical
- Warnung erscheint ab: high

**Output:** {churn_score: 0-100, main_drivers[], risk_level: 'low'|'medium'|'high', data_sources[]}

---

## 16. score_upsell(contact_id)

**Zweck:** Bewertet Upsell-Chance für Bestandskunden (Farmer).

**Input:** contact_id

**Progressive Data Logic (gleiche Logik wie score_churn_risk):**

**Basis-Trigger (immer verfügbar):**
```
Hohe Antwortrate (>60%)     → +20 Punkte  (aus messages Tabelle)
Letzter Kontakt < 7T        → +15 Punkte  (aus contacts Tabelle)
Heat Status = Heiß/Warm     → +20 Punkte  (berechnet)
Positive Sentiment in Reply → +25 Punkte  (aus classify_intent())
```

**Erweiterter Trigger (wenn externe Quelle verbunden):**
```
Enrichment-Limit >80%       → +30 Punkte  (aus Sherloq Usage)
Feature-Nutzung stark       → +25 Punkte  (aus Sherloq Usage)
Company wächst (neue Stellen)→ +20 Punkte (aus Sherloq Signal)
NPS Score ≥ 9               → +15 Punkte  (aus externer Quelle)
```

**Output:** {upsell_score: 0-100, recommended_product, triggers[], data_sources[]}

---

## 18. calculate_health_score(contact_id)

**Zweck:** Berechnet einen zusammengesetzten Customer Health Score für den Farming Übersicht-Tab.

**Input:** contact_id

**Ablauf:**
```
1. Rufe score_churn_risk(contact_id) auf → churn_score
2. Rufe score_upsell(contact_id) auf → upsell_score
3. Lade: last_contacted_at, open_count, reply_count, heat_status
4. Berechne Health Score:
   health_score = 100 - churn_score + (upsell_score * 0.2)
   Normalisiert auf 0–100
5. Bestimme Status:
   >70 → 'gesund' (grün)
   40–70 → 'aufmerksamkeit' (amber)
   <40 → 'kritisch' (rot)
6. Bestimme Tag:
   churn_score > 60 → 'Churn Risk'
   upsell_score > 60 → 'Upsell Ready'
   sonst → 'Aktiv'
7. Speichere in contacts.health_score + contacts.health_status
8. Speichere data_sources[] damit UI anzeigen kann worauf Score basiert
```

**Output:** {health_score: 0-100, health_status: 'gesund'|'aufmerksamkeit'|'kritisch', tag, data_sources[]}

**Trigger:** Läuft täglich via Cron + nach jedem Signal/Message Event

---

## 17. enrichContact(contact_id)

**Zweck:** Reichert Kontaktdaten via konfigurierten Enrichment-Provider an.

**Input:** contact_id

**Ablauf:**
```
1. Lade Contact (linkedin_url oder email als Lookup-Key)
2. Prüfe ob Enrichment-Modul aktiv (settings.modules.enrichment)
3. Rufe lib/enrichment.ts auf (provider-agnostisch):
   - enrichContact(linkedin_url) → gibt EnrichmentResult zurück
4. Update contact mit neuen Feldern (nur leere Felder überschreiben — nie vorhandene Daten)
5. Speichere enrichment_sources[] + Timestamp
6. Falls email jetzt vorhanden → process_lead() neu anstoßen
```

**Output:** {enriched: boolean, fields_added[], source}

---

## WICHTIGE HINWEISE FÜR CLAUDE CODE

1. Jede Function gibt strukturierte Fehler zurück: {error: true, code, message}
2. Alle AI-Aufrufe über aiCall() — nie direkt fetch() auf Anthropic API
3. Langfuse Prompt-ID immer mitgeben — für Versionierung und Monitoring
4. Bei kritischen Aktionen (opt_out, deal_created, bounce_hard, booking_confirmed): audit_log Eintrag
5. Realtime-Events via Supabase Realtime Channel 'org:{organization_id}'
6. Timeouts: AI-Calls max. 30s, DB-Queries max. 5s
7. Retry-Logik: bei Sending-Fehler max. 3 Versuche mit exponential backoff
8. Cal.com Webhook-Signatur immer verifizieren bevor Payload verarbeitet wird
9. Enrichment: nie vorhandene Daten überschreiben — nur leere Felder füllen

---

## EXTERNE INTERFACES (lib/ Dateien — nicht Edge Functions)

```
lib/sending.ts      → Sending Layer (Email + LinkedIn) — Provider: Nango + Unipile
lib/calendar.ts     → Kalender-Interface — Provider: Cal.com + Nango
lib/enrichment.ts   → Enrichment-Interface — Provider: Surfe (austauschbar)
lib/ai.ts           → AI-Aufrufe — aiCall() Wrapper mit Langfuse
lib/db.ts           → Alle DB-Abfragen
lib/auth.ts         → Auth + Session
lib/storage.ts      → Datei-Uploads
lib/realtime.ts     → Realtime Subscriptions
```

---

*Sales OS · Edge Functions Spezifikation v2 · Juni 2026*
*Neu in v2: Cal.com Booking Flow, Platzhalter-Fallbacks konfigurierbar, Enrichment via lib/enrichment.ts*
*Bei neuen Functions: hier ergänzen, dann Claude Code übergeben*

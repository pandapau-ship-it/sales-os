# AI SDR — Vollständiger Bauplan v1.4
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code
# Status: FINAL — alle Entscheidungen getroffen. Dieses Dokument ist die einzige Quelle für den AI-SDR-Bau.

---

## 0. WIE DIESES DOKUMENT ZU BENUTZEN IST

**Für Claude Code — Pflichtregeln vor jedem Handgriff:**

1. Lies zuerst `CLAUDE.md` und `PROGRESS.md`, dann dieses Dokument vollständig.
2. Dieses Dokument überschreibt bei Widerspruch ältere AI-SDR-Angaben in
   `ai_sdr_architektur_entscheidungen.md`, `ai_sdr_screen_spec.md` und
   `ui_interaktionen_v14_komplett.md` (Konflikt-Regel aus CLAUDE.md: neueste Entscheidung gewinnt).
   Die betroffenen Altstellen werden in Slice 0 angeglichen.
3. Es wird **strikt in der Slice-Reihenfolge** gebaut (Abschnitt 7). Nach jedem Slice: **STOP** —
   Screenshot-QA durch Oliver, erst nach Freigabe weiter. Kein Slice überspringen,
   keine zwei Slices in einem Rutsch ohne explizite Freigabe.
4. **Diagnose-First gilt pro Slice:** Vor dem Bauen prüfen, was bereits existiert
   (Komponenten, Hooks, constants.ts, lib/-Dateien, Migrationen). Nichts doppelt bauen.
5. Jede Abweichung von diesem Dokument, die während des Baus nötig erscheint:
   **STOP und Rückfrage an Oliver** — nicht eigenmächtig entscheiden.
6. Migrationen: versionierte SQL-Dateien in `supabase/migrations/`, fortlaufend nummeriert
   (aktuell angewendet bis ~054 — vor Start prüfen, welche Nummer die nächste ist).
   Niemals direkt im Dashboard anwenden.

**Geltende System-Invarianten (aus CLAUDE.md — hier nur Erinnerung, dort maßgeblich):**
- Jede Tabelle: `organization_id` + RLS + CASCADE. **Einzige Ausnahme in diesem Plan:**
  `global_message_insights` (siehe 5.2 — bewusst global, deny-all RLS).
- Kein Business-Logic im Frontend. Kein JSONB-Parsing im Frontend. Alles über Edge Functions + `lib/db.ts`.
- Alle AI-Aufrufe über `aiCall()` in `lib/ai.ts`, Prompts in Langfuse versioniert.
- Keine hardcodierten Schwellenwerte/Texte/Limits — alles aus `settings` / `system_config` (Prinzip [D51]).
- Honesty-Regel: keine erfundenen Werte, keine `?? 87`-Patterns. Leere States = "Folgt"-Placeholder.
- shadcn-Primitives für alles Interaktive. `ui/` nie anfassen. Tokens statt Hex. `typo-*` Primitives.
  Lucide statt Emoji. `cn()`. i18n-Keys statt hardcodierter Strings.
- TanStack Query für alle Server-Daten. Virtualisierung bei Listen > 50 Zeilen.
- Bestehende panel-blocks / shared / features Komponenten wiederverwenden
  (Hunter/Farmer-Panels als Vorlage — exakt deren Pattern kopieren, nicht neu erfinden).
- Pipeline-Stages NIEMALS hardcodieren — immer aus `settings.thresholds.pipeline_stages`.
- Git: Feature-Branch pro Slice, PR, grüne Gates (`npm run build` + `npm run audit`), Squash-Merge.

---

## 1. VORAUSSETZUNGEN — WAS FERTIG SEIN MUSS, BEVOR SLICE 1 STARTET

Laut Build-Reihenfolge des Gesamtprojekts kommen vor dem AI SDR:
Farmer DB-Wiring [D21] · Companies + Kontaktliste · Mein Tag · Settings.

Konkrete harte Abhängigkeiten dieses Plans:

| Abhängigkeit | Warum | Slice der sie braucht |
|---|---|---|
| Kontakte-Screen inkl. CSV-Import + Duplikat-Erkennung | Lead-Intake, "Zu Campaign hinzufügen" | 6 |
| Listen (statisch + dynamisch) funktionsfähig | Listen als Campaign-Quelle | 6 |
| Settings-Screen Grundgerüst | Mailbox & Limits, Automation Rules, Sherloq-Config leben dort | 4 |
| Mein Tag Grundgerüst (Zonen) | requires_human Zone 2 Rang 0 | 14 |
| `settings`-Tabelle mit thresholds/modules/automation_defaults befüllt | überall | 1 |
| Email-Verifizierung Ebene A (`lib/verification.ts`) | Verify-Gate vor Sequenzaufnahme | 6 |
| Integrations-Session 0 abgeschlossen (Nango + Gmail/Outlook-OAuth-Apps + Langfuse + Gemini-Key — siehe docs/integrations_masterplan.md, Klasse A) | E-Mail-Senden/Empfangen, Prompts, Embeddings | 3 |

Fehlt eine Voraussetzung beim Start eines Slices → STOP, Oliver informieren.

---

## 2. FINALE ENTSCHEIDUNGEN (Juli 2026) — verbindlich

Diese Entscheidungen ergänzen/überschreiben `entscheidungen_komplett.md` und werden
in Slice 0 dort nachgetragen:

| # | Entscheidung | Inhalt |
|---|---|---|
| E1 | **LinkedIn v1 = manueller Step** | Kein automatischer LinkedIn-Versand in v1. LinkedIn-Steps erzeugen eine fällige Aufgabe mit AI-generiertem Text zum Kopieren. User führt aus, bestätigt, Sequenz läuft weiter. Unipile = v2, Abstraktion `lib/sending.ts` bleibt vorbereitet. **Der 🔴-Blocker "Sending Provider" ist damit für v1 aufgelöst** (Email läuft über Nango/Gmail/Outlook). |
| E2 | **EIN Mailbox-Limit, Follow-ups zuerst** | Kein getrenntes Kontingent new_outreach/followup. Die Variante "getrennte Kontingente" aus session_notizen ist VERWORFEN. sequence_runner: erst alle fälligen Follow-ups, dann neuer Outreach mit Restkapazität. Follow-ups werden nie wegen Limit verzögert. |
| E3 | **Termine v1 = Booking-Link, Quelle FREI WÄHLBAR.** Jeder User hinterlegt seine Booking-Quelle (Settings → Profil): `booking_provider = 'calcom' \| 'external'` + `booking_link` (externer Link = HubSpot Meetings, Google Terminplan, Outlook Bookings o.ä. — beliebige URL). {{termin_link}} nutzt immer die konfigurierte Quelle. **Ehrlicher Unterschied, im UI erklärt:** Nur Cal.com liefert automatische Buchungs-Erkennung (Webhook → Lead→Deal, Meeting-Prep, Termine-Tab-Automatik). Bei externem Link: keine Automatik — Buchungen werden manuell bestätigt ("Termin bestätigen"-Aktion im Panel/Termine-Tab, gleicher Deal+Prep-Pfad) oder später via Kalender-Lese-Sync erkannt. Konkrete Slot-Vorschläge = v2. Cal.com-Automatik-Verkabelung: Integrations-Endphase (Integrations-Masterplan, Klasse B). |
| E4 | **Signal-Kohorten statt Auto-Listen** | Leads aus derselben Signal-Quelle (z.B. gleicher LinkedIn-Post) bekommen `leads.signal_cohort`. Keine automatische Listen-Erzeugung pro Post. UI gruppiert nach Kohorte. |
| E5 | **Listen als Campaign-Quelle** | Statische + dynamische Listen können Campaigns zugewiesen werden (`campaign_list_sources`). Dynamisch = kontinuierlicher Feed. Einzelkontakt überall via "Zu Campaign hinzufügen". |
| E6 | **Lifecycle-Campaigns** | `campaigns.campaign_type = 'outbound' \| 'lifecycle'`. Lifecycle-Trigger = interne Ereignisse (Kontakt kalt, Trial läuft ab, kein Login …). Ausschluss-Regel "Kunde/aktiver Deal nie in Campaign" gilt **nur für outbound**. Hunter/Farmer bleiben Recommendation-only — die Ausführung liegt immer bei der Sequenz-Engine. Default für Lifecycle: Semi. |
| E7 | **Learning-System v1** | Vollständige Event-Telemetrie + Message-Features + nächtliche org-übergreifende, anonymisierte Aggregation (min. 3 Orgs, min. 50 Sends pro Muster). generate_message liest Insights als Prompt-Kontext. Kein Model-Training. Org-Level Opt-out (`settings.ai_sdr.learning_share_data`). |
| E8 | **3 Generierungsmodi pro Step** | `ai_auto` (voll autonom) · `template` (festes Template + Platzhalter) · `custom_prompt` (User-Prompt steuert AI). Neue `templates`-Tabelle. |
| E9 | **Terminologie: "Campaign" kanonisch** | Die UI-Doku-Begriffe "Sequenz-Kachel"/"Sequenz-Filter" meinen Campaigns. UI-Label deutsch: "Kampagne". `Sequence` bleibt als technisches Unterobjekt (Schrittfolge) bestehen. |
| E10 | **Tab-Struktur final** | `Campaigns · Neu via Signal · Outreach aktiv · Termine gebucht · Performance` |
| E11 | **Community-Templates** | Aus Top-Performern destilliert die AI **Muster, nie Texte** (Neutralisierung). Publikation nur wenn Muster bei ≥ 3 Orgs erfolgreich UND nach **manueller Freigabe durch uns** (nie vollautomatisch). Erscheinen als System-Templates "Bewährte Templates" mit echter Performance-Angabe. |
| E12 | **Warmup + Schutzautomatik** | Neue Mailbox startet automatisch im Warmup (10→50/Tag über ~4 Wochen). User kann Limit übersteuern (Warnung ab 70/Tag). Bounce-Rate > 3% → automatische Drosselung auf vorherige Stufe. > 5% → Mailbox pausieren + requires_human. Schutzautomatik greift IMMER, auch bei User-Override. |
| E13 | **Fix:** validate_booking legt Deals in der Stage an, die in `settings.thresholds.pipeline_stages` als Termin-Stage markiert ist (Default: "Demo vereinbart"). Der Wert "discovery" aus edge_functions_v2 ist FALSCH und wird korrigiert. |
| E14 | **Reply-Stop** | Jede eingehende Antwort (Email oder erfasste LinkedIn-Antwort) pausiert SOFORT alle geplanten Steps des Leads (`scheduled_at = NULL`), bevor irgendetwas anderes passiert. AI erkennt den Intent, zeigt die Antwort an und legt IMMER einen Antwortvorschlag als Draft vor. Kein Follow-up geht jemals raus, solange eine unbehandelte Antwort vorliegt. |
| E15 | **Thread-Follow-ups** | Email-Follow-ups werden als Antwort im bestehenden Thread gesendet (gleicher Betreff mit "Re:", In-Reply-To/References-Header auf die letzte eigene Mail). Neuer Thread nur bei Step 1 oder explizitem Betreff-Wechsel durch analyze_engagement (Betreff-Variation zählt als neuer Thread). |
| E16 | **LinkedIn-Antwort-Erfassung** | Nur bei LinkedIn-**Message**-Steps: Side Panel bietet "Hat geantwortet" + Textfeld zum Einfügen der Antwort → Reply-Stop (E14) + classify_intent laufen normal. Bei **Connect**-Steps kein Antwortfeld — nur Haken "Anfrage angenommen" (steuert Fälligkeit des Folge-Steps). |
| E17 | **Company-Staffelung statt Sperre** | Mehrere Kontakte derselben Company sind erlaubt. Regel: zwischen Erstkontakten derselben Company liegt ein Mindest-Versatz (`company_send_gap_days`, Default 3, pro Campaign überschreibbar). Antwortet eine Person der Company → alle anderen aktiven Leads derselben Company werden pausiert, requires_human-Vorschlag: "Kollege hat geantwortet — fortsetzen oder stoppen?" |
| E18 | **Ein Kontakt = max. 1 aktive AI-SDR-Campaign** | Campaign-übergreifend erzwungen. Jede Campaign hat `priority int` (Default 50, Lifecycle-Trigger können höher). Konflikt (Kontakt läuft bereits, neuer Trigger feuert): laufende Campaign gewinnt IMMER — der Wechsel wird nur als requires_human-Vorschlag angezeigt, nie automatisch vollzogen. Feinregeln für Hunter/Farmer-Kontexte werden in deren Phase entschieden — das Fundament (priority + Konflikt-Vorschlag) gilt ab jetzt. |
| E19 | **Limit-Geltungsbereich** | Das tägliche Mailbox-Limit gilt NUR für Nachrichten an Kontakte **ohne bestehende Konversation** (noch kein inbound-Event vom Kontakt). Kontakte mit mind. 1 Antwort — egal ob AI SDR, Lifecycle, Hunter, Farmer — sind limit-frei. Sicherheitsnetz: absolutes Hard-Cap pro Mailbox über alles (`hard_cap_daily_total`, Default 100, konfigurierbar) + alle Sends zählen weiter in Bounce-/Spam-Überwachung und Telemetrie. |
| E20 | **Signal-Verfallslogik** | Frische Signale werden priorisiert verarbeitet (Signal-Leads rutschen in der Runner-Queue nach oben). Ist das Signal älter als `max_signal_reference_age_days` (Default 7), lässt generate_message den konkreten Signal-Bezug WEG (kein "sah deinen Like" Wochen später) — der Lead läuft dann als normaler Outreach mit Segment-Personalisierung. |
| E21 | **Pre-Send-Qualitätsgate — tokenschonend zweistufig** | Stufe 1 (kostenlos, deterministisch, in lib/): Spam-Wörter-Liste, Wortanzahl, Link-Anzahl, unaufgelöste Platzhalter-Reste (`{{`), Unsubscribe-Link vorhanden. Stufe 2 (KEIN Extra-Call): generate_message liefert im SELBEN Aufruf einen self-assessed `quality_score` (0–100) + Begründung mit. Score < `quality_gate_min_score` (Default 60) → 1 Regenerations-Versuch, dann requires_human. Niemals ein separater AI-Call nur für Qualität. |
| E22 | **Antwort-Timer (Speed-to-Lead)** | Jedes requires_human-Item trägt sichtbar seine Wartezeit ("wartet seit 2h"). Ab `response_time_urgent_hours` (Default 4): rote Dringlichkeits-Markierung + höheres Ranking in Mein Tag Zone 2. Wartezeiten fließen als KPI in den Performance-Tab (Ø Reaktionszeit). |
| E23 | **Referral-Intent** | Neues Intent-Label `referral` ("sprich mit meiner Kollegin X"). Handling: AI extrahiert Name/Kontext, schlägt vor: neuen Kontakt anlegen + in dieselbe Campaign mit Referral-Kontext ("Ihr Kollege {Name} hat mich an Sie verwiesen") + ursprünglichen Lead als completed markieren. Immer Semi (User bestätigt), nie auto. |
| E24 | **AI-SDR-Tages-Digest — keine zweite Wahrheit** | KEIN eigener Zusammenfassungs-Mechanismus im AI SDR. `morning_briefing()` (Cron 07:00, existiert) wird um eine AI-SDR-Digest-Sektion erweitert: gestern passiert (Sends, Antworten nach Intent, Termine, abgeschlossene Sequenzen), heute offen (requires_human mit Wartezeiten, geplante Sends), 1 ehrlicher Erfolgs-Satz nur wenn Datenbasis ausreicht (Honesty). Gespeichert in `daily_briefings.priorities`-JSONB (neuer Key `ai_sdr_digest`). Angezeigt: Mein Tag UND als kompakter Digest-Block oben im AI-SDR-Screen (einklappbar, gleicher Datenstand). Der spätere AI Chat [D5] beantwortet "was ist gestern gelaufen?" aus denselben Daten. |
| E25 | **Mailbox-loser Modus (Einstiegs-Rampe, schlank)** | Die Voll-Verbindung (Nango, Senden + Antworten automatisch) ist und bleibt der empfohlene Standard — so machen es alle State-of-the-Art-Tools, und Onboarding/UI positionieren sie klar so ("damit ich Antworten für dich erkenne"). ZUSÄTZLICH: Ist keine Mailbox verbunden, laufen Email-Steps über den EXISTIERENDEN Manual-Mechanismus (wie LinkedIn E1/E16): AI generiert die Mail vollständig personalisiert → fällige Aufgabe mit [Text kopieren] → User sendet aus dem eigenen Programm → "Als gesendet markieren" (complete_manual_step) → Sequenz läuft weiter; Antworten via manueller Erfassung (ingest_manual_reply) inkl. Intent + Antwortvorschlag. EHRLICH kommuniziert: kein Auto-Versand, kein Öffnungs-/Klick-Tracking, keine automatische Antwort-Erkennung — dezenter, nicht nerviger Hinweis "Mailbox verbinden schaltet Automatik frei". Settings: Versand-Modus ergibt sich pro User aus dem Mailbox-Status (verbunden = voll, sonst manuell) + sichtbare Anzeige in Settings → AI SDR → Mailbox & Limits. Kein Tracking-Pixel in kopierten Texten (bewusst verworfen — unzuverlässig). Umsetzung: Slice 5 behandelt fehlende Mailbox als Manual-Channel-Fall statt als Fehler; Slice 9 zeigt die Email-Variante des Manual-Panels (Variante 8 erweitert). |

Unverändert gültig (bereits in entscheidungen_komplett.md): Automation Risk-Level (#20/#29),
Reply-Handling 11 Typen (#26), Reaktivierungs-Pool 90T (#16), Campaign-Matching SQL (#12),
Lead→Deal bei Booking (#25), Platzhalter-Fallbacks (#24/#37), Import-Flow (#28),
Intent-Schwellenwert 70% (#14), dynamische AI-Anpassung max. 3 (#33), Mailbox-Warmup-Schema,
Smart Sending Window, Timezone-Sending, Email-Verifizierung 2 Ebenen, Opt-out-Flow.

---

## 3. OBJEKTMODELL & TERMINOLOGIE (kanonisch)

```
Campaign  (campaign_type: outbound | lifecycle)
├── targeting · exclusions · lead_sources (inkl. 'list')
├── pitch · messaging_brief (inkl. placeholder_fallbacks, custom Regeln)
├── 1..n Sequences
│     └── steps[]: {step_number, channel: email|linkedin,
│                   generation_mode: ai_auto|template|custom_prompt,
│                   template_id?, custom_prompt?, delay_days, fallback_channel?}
├── sender_config · approval_rules · automation_level · intent_threshold
└── lifecycle_trigger (nur bei campaign_type = lifecycle)

Lead = Kontakt in einer Campaign
├── signal_cohort (E4) · list_id (Herkunfts-Liste) · sherloq_signal_id
├── sequence_step_current · sequence_status · requires_human_reason
└── scheduled_at (Herzstück des Runners)

Template  = wiederverwendbarer Nachrichtentext (user | system | community)
Message   = eine konkrete gesendete/empfangene Nachricht
MessageEvent   = jedes einzelne Ereignis dazu (open #1, open #2, click, …)
MessageFeature = Eigenschaften + Outcome einer Nachricht (Learning-Rohdaten)
GlobalInsight  = anonymisiertes, org-übergreifendes Erfolgsmuster
```

**Sequence-Status (leads.sequence_status) — vollständige Enum:**
`active | paused | waiting_manual | requires_human | completed | opted_out | bounced`
- NEU: `waiting_manual` = LinkedIn-Step fällig, wartet auf manuelle Ausführung durch User.
  Bewusst NICHT requires_human (das ist für Eskalationen und landet in Mein Tag Zone 2 Rang 0 —
  LinkedIn-Aufgaben sind normale Tasks, keine Eskalation).

**requires_human_reason — erweiterte Enum:**
`reply_low_confidence | opt_out | bounce_hard | bounce_soft | contact_data_missing |
 email_invalid | placeholder_unresolvable | approval_required | manual_mode |
 pipeline_suggestion | lifecycle_confirmation | escalation_limit | quality_gate_failed |
 company_colleague_replied | campaign_conflict | referral_suggestion | manual`

**Intent-Labels (classify_intent) — vollständige Enum:**
`interested | wants_meeting | objection | not_now | opt_out | referral | unclear`

**Aktiv-Regel (E18):** Ein Kontakt hat systemweit max. EINEN Lead mit
`sequence_status IN ('active','paused','waiting_manual','requires_human')`.
Durchgesetzt in `intake_lead()` — nicht per DB-Constraint (der bestehende
UNIQUE(campaign_id, contact_id) deckt nur dieselbe Campaign ab).

---

## 4. DB-MIGRATIONEN — VOLLSTÄNDIGE SPEZIFIKATION

Zwei Migrations-Dateien (Slice 1 + Slice 2). Grundregeln aus CLAUDE.md gelten
(id/organization_id/created_at/updated_at/RLS/Trigger für updated_at/Indexes).

### 4.1 Migration A — Kernobjekte (Slice 1)

**Neue Tabelle `templates`:**
```
id                  uuid PK
organization_id     uuid FK NULLABLE          -- NULL = System-/Community-Template (global lesbar)
name                text NOT NULL
channel             text NOT NULL             -- email | linkedin
subject_template    text                      -- nur email
body_template       text NOT NULL             -- mit {{platzhaltern}}
language            text DEFAULT 'de'
source              text DEFAULT 'user'       -- user | system | community
performance         jsonb                     -- nur community: {reply_rate, sends, orgs_count, computed_at}
is_active           boolean DEFAULT true
created_by          uuid FK → users NULLABLE
created_at / updated_at
```
RLS: SELECT wenn `organization_id = auth.org` ODER `organization_id IS NULL`.
INSERT/UPDATE/DELETE nur auf eigene (`organization_id = auth.org`). Globale Templates
schreibt nur service_role.
⚠ Claude-Code-Falle: Die bestehende RLS-Standard-Policy erlaubt kein `IS NULL` —
hier braucht es eine eigene Policy, nicht die Kopie der Standard-Policy.

**Neue Tabelle `campaign_list_sources`:**
```
id, organization_id, campaign_id FK → campaigns ON DELETE CASCADE,
list_id FK → lists ON DELETE CASCADE,
mode text DEFAULT 'continuous'    -- continuous | one_time
last_synced_at timestamptz, created_at
UNIQUE(campaign_id, list_id)
```

**Neue Tabelle `mailbox_daily_counters`:**
```
id, organization_id, mailbox_id FK → mailboxes,
date date NOT NULL,
counter_type text NOT NULL DEFAULT 'cold',   -- cold (Tageslimit E19) | total (Hard-Cap)
sent_count int DEFAULT 0,
UNIQUE(mailbox_id, date, counter_type)
```
Dazu Postgres-RPC `increment_mailbox_counter(mailbox_id, date, counter_type, limit)`:
atomares `UPDATE … SET sent_count = sent_count + 1 WHERE sent_count < limit RETURNING sent_count`
(Insert on conflict vorher). Gibt NULL zurück wenn Limit erreicht.
⚠ Falle: NIEMALS „SELECT count, dann senden, dann update" — das ist eine Race Condition
und produziert Doppel-Sends über das Limit. Immer über diese RPC.

**ALTER `campaigns`:**
```
+ campaign_type      text DEFAULT 'outbound'   -- outbound | lifecycle
+ lifecycle_trigger  jsonb                     -- {event, params} — nur lifecycle, sonst NULL
                     -- events v1: heat_cold | heat_dead | trial_expiring | no_login_days
                     --            | sequence_completed_no_response | custom_signal
+ priority           int DEFAULT 50            -- E18: Konfliktauflösung, höher = wichtiger
```

**ALTER `leads`:**
```
+ signal_cohort   text          -- z.B. source_url des Posts; NULL wenn keine Kohorte
+ list_id         uuid FK → lists NULLABLE      -- Herkunfts-Liste
+ booking_link    text                          -- fehlt bisher, wird von generate_booking_link genutzt
```
`sequence_status`-Kommentar um `waiting_manual` erweitern.

**ALTER `mailboxes`:**
```
+ user_limit_override  int NULLABLE     -- NULL = System-Empfehlung/Warmup gilt
+ nango_connection_id  text
+ throttled_at         timestamptz
+ throttle_reason      text             -- bounce_rate | spam_rate | manual
```

**`sequences.steps` — kanonische Step-Struktur (JSONB, dokumentiert als Kommentar):**
```
[{ step_number: int, channel: 'email'|'linkedin', delay_days: int,
   generation_mode: 'ai_auto'|'template'|'custom_prompt',
   template_id: uuid|null, custom_prompt: text|null,
   fallback_channel: 'email'|'linkedin'|null }]
```

**`settings` — neue Keys (Seed für Demo-Org + Default-Merge-Logik):**
```
settings.ai_sdr = {
  verify_before_sequence: true,
  learning_share_data: true,              -- Org nimmt am anonymen Learning teil
  recommended_daily_limit: 50,
  warn_daily_limit: 70,
  hard_cap_daily_total: 100,              -- E19: absolutes Cap über ALLE Sends pro Mailbox
  bounce_throttle_pct: 3,
  bounce_pause_pct: 5,
  smart_sending_window: true,
  reactivation_days: 90,
  lifecycle_default_automation: 'semi',
  company_send_gap_days: 3,               -- E17: Versatz zwischen Erstkontakten gleicher Company
  max_signal_reference_age_days: 7,       -- E20: danach kein konkreter Signal-Bezug mehr
  quality_gate_min_score: 60,             -- E21
  response_time_urgent_hours: 4           -- E22
}
```
⚠ Falle: Bestehende Orgs haben diesen Key nicht. Lese-Logik immer mit Default-Merge
(`{...DEFAULTS, ...settings.ai_sdr}`) in einer zentralen Funktion in `lib/` — nie an
20 Stellen einzeln defaulten. Defaults als Konstante an EINER Stelle (Single Source).

**Unsubscribe-Infrastruktur:**
```
ALTER contacts + unsubscribe_token uuid DEFAULT gen_random_uuid() UNIQUE
```
Jede Outbound-Email MUSS im Footer einen Unsubscribe-Link enthalten:
`{APP_URL}/u/{unsubscribe_token}` → öffentliche Edge Function `handle_unsubscribe`
(kein Auth): setzt `opt_out_at`, `contact_status = 'opt_out'`, stoppt alle Leads des
Kontakts (`sequence_status = 'opted_out'`), audit_log. Zeigt schlichte Bestätigungsseite.
⚠ Falle: Diese Function ist der EINZIGE unauthentifizierte Endpoint — Token validieren,
Rate-Limit, keine Daten im Response außer "Abgemeldet".

### 4.2 Migration B — Telemetrie & Learning (Slice 2)

**Neue Tabelle `message_events`:**
```
id, organization_id, message_id FK → messages, lead_id FK, contact_id FK,
event_type text NOT NULL       -- sent | delivered | open | click | reply |
                               -- bounce_soft | bounce_hard | unsubscribe | spam_complaint
occurred_at timestamptz NOT NULL,
metadata jsonb,                -- {url bei click, user_agent, provider_payload_id, ...}
provider_event_id text,        -- Dedupe-Key vom Provider
created_at
UNIQUE(provider_event_id) WHERE provider_event_id IS NOT NULL
INDEX (message_id, event_type) · INDEX (organization_id, occurred_at)
```
⚠ Falle: Tracking-Webhooks kommen doppelt (Provider-Retries). Der UNIQUE-Index auf
provider_event_id + `ON CONFLICT DO NOTHING` ist die Dedupe-Schicht. Ohne sie sind alle
KPIs und das Learning falsch.

**Neue Tabelle `message_features`:**
```
id, organization_id, message_id FK UNIQUE,
features jsonb NOT NULL,
  -- {word_count, subject_length, subject_style, cta_type, tone,
  --  personalization_depth, has_question, has_signal_reference,
  --  sent_hour, sent_dow, step_number, channel, generation_mode,
  --  template_id?, recipient_seniority?, recipient_industry?, language}
outcome jsonb DEFAULT '{}',
  -- {delivered, opened, open_count, clicked, replied, reply_intent, meeting_booked}
  -- wird vom nächtlichen Job aktualisiert, NICHT bei jedem Event
created_at / updated_at
```

**Neue Tabelle `global_message_insights` — BEWUSSTE AUSNAHME von der org_id-Regel:**
```
id uuid PK,
segment jsonb NOT NULL,     -- {industry?, seniority?, language, channel} — NIE org-Bezug
pattern jsonb NOT NULL,     -- {feature: 'subject_length', bucket: '<40', ...}
sends int, opens int, replies int, meetings int, orgs_count int,
reply_rate numeric, open_rate numeric,
computed_at timestamptz
```
- KEINE organization_id. KEINE Inhalte, KEINE Namen, KEINE Domains — nur Muster + Zahlen.
- RLS: **aktivieren mit deny-all für alle Client-Rollen.** Nur service_role (Edge Functions)
  liest und schreibt. Frontend sieht diese Tabelle NIE direkt — Insights kommen
  aufbereitet über eine Edge Function.
- Schreibregel (hart, in der Aggregations-Function): Zeile nur wenn
  `orgs_count >= 3 AND sends >= 50` (Werte aus `system_config`, nicht hardcodiert).
⚠ Falle: audit.ts / RLS-Checks erwarten organization_id auf jeder Tabelle — diese Tabelle
als dokumentierte Ausnahme in CLAUDE.md + audit-Ausnahmeliste eintragen (Slice 0/2),
sonst blockiert der Pre-Push-Hook.

---

## 5. EDGE FUNCTIONS — NEU & GEÄNDERT

Bestehende Spezifikation `sales_os_edge_functions_v2.md` bleibt Grundlage.
Hier nur Deltas. Alle Functions: strukturierte Fehler, audit_log bei kritischen Aktionen,
Realtime-Channel `org:{organization_id}`, AI nur via aiCall() + Langfuse-Prompt-ID.

### 5.1 Geändert

**`sequence_runner` (Cron 5 Min) — Ergänzungen:**
1. **Idempotenz/Locking:** Leads mit `SELECT … FOR UPDATE SKIP LOCKED` holen.
   ⚠ Falle: Ohne Lock verarbeiten zwei parallele Cron-Läufe denselben Lead → Doppel-Mail.
   Das ist der schwerwiegendste mögliche Fehler des gesamten Systems.
2. **Priorität:** Zwei Durchläufe — erst alle fälligen Leads mit `sequence_step_current > 1`
   (Follow-ups), dann `= 1` (neuer Outreach) mit Restkapazität (E2). Innerhalb jedes
   Durchlaufs: Leads mit frischem Signal (signal < max_signal_reference_age_days) zuerst (E20).
3. **Limit-Geltung (E19):** VOR dem Counter prüfen, ob der Kontakt eine bestehende
   Konversation hat (`EXISTS message_events WHERE contact_id = X AND event_type = 'reply'`
   bzw. messages inbound). JA → zählt nur gegen Hard-Cap, nicht gegen das Tageslimit.
   NEIN → normales Tageslimit via `increment_mailbox_counter` RPC. Der Hard-Cap-Counter
   (`hard_cap_daily_total`) läuft über dieselbe RPC mit zweitem Counter-Typ —
   `mailbox_daily_counters` bekommt dafür eine Spalte `counter_type text`
   ('cold' | 'total'), UNIQUE(mailbox_id, date, counter_type).
   Beide Checks erst NACH erfolgreichem Nachrichtenaufbau, direkt vor dem Send.
4. **Company-Staffelung (E17):** vor Step-1-Sends prüfen: letzter Erstkontakt an
   dieselbe Company < company_send_gap_days her? → scheduled_at auf frühesten
   erlaubten Slot verschieben, überspringen (kein requires_human — reine Terminierung).
5. **Thread-Follow-ups (E15):** ab Step 2 gleiche Betreffzeile mit "Re:" +
   In-Reply-To/References auf die provider_message_id der letzten eigenen Mail.
   lib/sending.ts muss `in_reply_to` als Parameter unterstützen.
6. **LinkedIn-Step (E1):** nicht senden. Stattdessen:
   - Nachricht generieren wie üblich → `messages` mit `status='draft'`, `channel='linkedin'`
   - Task anlegen: `source='ai'`, Titel "LinkedIn-Nachricht an {Name} senden", `contact_id`, fällig heute
   - `lead.sequence_status = 'waiting_manual'`, `scheduled_at = NULL`
   - Realtime-Event. Weiter geht es erst über `complete_manual_step` (5.2).
7. **Finaler Send-Gate** (unmittelbar vor jedem Email-Send, keine Ausnahme):
   `opt_out_at IS NULL` · `email_verified IS NOT false` · bei outbound-Campaign:
   `contact_status NOT IN ('kunde','pipeline')` · Domain nicht in blacklisted_domains ·
   Unsubscribe-Link im Body vorhanden · **Qualitätsgate Stufe 1 bestanden (E21:
   deterministische Checks in `lib/quality.ts` — Spam-Wörter aus system_config,
   Link-Anzahl, unaufgelöste `{{`-Reste)** · **keine unbehandelte eingehende Antwort
   vorhanden (E14 — Redundanz-Check, falls der Reply-Stop irgendwo versagt hat)**.
   Schlägt einer fehl → requires_human mit Grund, NICHT stillschweigend überspringen.
   ⚠ Falle: Diese Prüfungen laufen zusätzlich zur Intake-Prüfung. Zwischen Intake und
   Send können Tage liegen — der Kontakt kann inzwischen Kunde geworden sein oder
   Opt-out gemacht haben. Der Gate am Send ist die letzte Verteidigungslinie.

**`process_lead` / `generate_message`:**

> **PFLICHT-KONTEXT vor jeder Generierung (an erster Stelle, vor der `generation_mode`-Logik):**
>
> 1. **ORG-PROFIL & PERSONA-MATCHING:** Vor jeder Generierung lädt `generate_message` das
>    `org_profile` (Firma, Angebot, Problemlösung, ICP-Definition, `personas[]` mit Pain
>    Points + Original-Wording — entsteht in Onboarding **O3** / Settings „Unternehmensprofil").
>    Matching-Schritt `match_persona(contact)`: Rolle/`job_title` des Empfängers wird gegen
>    `org_profile.personas[].role_pattern` abgeglichen (Synonyme normalisieren: „Head of
>    Sales"/„VP Sales"/„Sales Director" → dieselbe Persona).
>    - **TREFFER** → Pain Points + Original-Wording dieser Persona prominent in den Prompt
>      („Sprich die Pain Points dieser Persona in ihrer eigenen Sprache an").
>    - **KEIN TREFFER** → generischer ICP-Block aus `org_profile`, KEINE erfundene
>      Persona-Zuordnung (Honesty).
>    - **FALLBACK** `org_profile` leer/fehlt → Block komplett weglassen, Generierung läuft
>      trotzdem normal (nur ohne diesen Kontext). Niemals Platzhalter-Fakes.
>    - **Single Source:** derselbe `org_profile`-Datensatz wird auch vom AI Chat und
>      ICP-Scoring genutzt — keine Kopien in Campaigns.
>
> 2. **PERSONAL VOICE:** `voice_profiles` des **sendenden** Users (Onboarding **O5** /
>    Settings „Mein Profil") als Stil-Anweisung in den Prompt („Schreibe im Stil dieses
>    Users: Tonalität, Formalität, Satzlänge, typische Gruß-/Schlussmuster").
>    - **FALLBACK** `voice_profile` leer/fehlt → neutraler Standard-Ton, Generierung läuft
>      trotzdem normal. Kein Fake-Stil.

- `generation_mode` des Steps respektieren:
  - `template` → Template laden, `resolve_placeholders()`, KEIN AI-Rewrite des Textes
    (User hat bewusst fixen Text gewählt). AI-Kurzaufruf NUR wenn Platzhalter-Entfernung
    Satzreparatur braucht (bestehende Regel).
  - `custom_prompt` → User-Prompt wird als zusätzlicher Instruktionsblock in den
    Langfuse-Prompt injiziert (klar getrennt, User-Prompt kann System-Regeln wie
    Verbotene-Wörter/Compliance NICHT überschreiben).
  - `ai_auto` → wie bisher (Brief + Pitch + History + Signal + Persönlichkeit).
- **Kohorten-/Signal-Kontext mit Verfall (E20):** wenn `lead.signal_cohort` gesetzt UND
  Signal-Alter <= max_signal_reference_age_days → `signal_data` (source_url, detail)
  prominent in den Prompt ("Der Lead hat auf diesen Post reagiert: …"). Signal älter →
  Signal-Bezug komplett weglassen, nur Segment-Personalisierung.
- **Quality-Self-Check (E21, KEIN Extra-Call):** Der generate_message-Prompt verlangt im
  Output zusätzlich `{quality_score: 0-100, quality_notes}` — die AI bewertet ihre eigene
  Nachricht (Personalisierung echt? CTA klar? Spam-Muster?) im selben Aufruf.
  Score < quality_gate_min_score → genau 1 Regenerations-Versuch (mit quality_notes als
  Verbesserungshinweis), danach requires_human (reason quality_gate_failed).
  Score in messages-metadata + message_features speichern (Learning-Input).
- **Learning-Kontext (ab Slice 13):** Top-Insights für das Segment des Leads
  (Branche/Seniority/Sprache/Kanal) via `get_insights_for_segment()` laden und als
  kompakten Hinweisblock anhängen ("Erkenntnisse: kurze Betreffs < 40 Zeichen performen
  in diesem Segment besser"). Wenn keine Insights → Block weglassen, NIE erfinden.
- **Credits:** pro AI-Generierung `credit_transactions` (reason: message_generation)
  + `credit_balance.used_this_period` erhöhen. Bei 0 Credits → requires_human
  (reason manual — Hinweis "AI-Credits aufgebraucht"), Template-Modus funktioniert weiter.
- Nach jedem Send: `compute_message_features(message_id)` anstoßen (async, nicht blockierend).

**`classify_sherloq_lead`:**
- setzt zusätzlich `leads.signal_cohort = signal_data.source_url` (wenn vorhanden).
- Ausschluss-Prüfung berücksichtigt campaign_type (Kunde/Deal nur für outbound blocken).

**`validate_booking`:** Deal-Stage aus `settings.thresholds.pipeline_stages` (E13) —
die Stage mit Flag `is_meeting_stage` (Default "Demo vereinbart"). Flag in Settings ergänzen.

### 5.2 Neu

**`complete_manual_step(lead_id, task_id)`** — wird ausgelöst wenn User den
LinkedIn-Task abschließt (im Side Panel "Als gesendet markieren" oder Task-Complete):
message `draft → sent` (`generated_by='ai'`, `approved_by=user`), message_event `sent`,
`last_step_sent_at = now()`, `scheduled_at = now() + delay_days` (Smart Window),
`sequence_step_current += 1` bzw. completed, `sequence_status = 'active'`.

**`track_message_event(payload)`** — Webhook-Endpoint für Tracking (Open/Click/Delivery/
Bounce vom Sending-Layer): Signatur prüfen → Dedupe (provider_event_id) → insert
message_events → messages.status fortschreiben (nur "vorwärts": sent→delivered→opened→…,
nie zurück) → lead.open_count/click_count/last_open_at aktualisieren →
bei open/click: `analyze_engagement(lead_id)` anstoßen → bei reply: Inbound-Flow (5.3) →
bei bounce: Bounce-Handling (#31).

**`ingest_inbound_message(payload)`** — eingehende Antwort (via Nango Gmail/Outlook
Webhook oder Polling-Fallback alle 5 Min): Thread dem Lead zuordnen
(In-Reply-To / References Header, Fallback: Absender-Email + jüngster aktiver Lead),
**ALLERERSTE Aktion nach dem Match: Reply-Stop (E14) — `scheduled_at = NULL` auf dem
Lead, bevor irgendetwas anderes läuft** — dann message anlegen (direction inbound),
message_event `reply`, `classify_intent(message_id)` (liefert immer einen
Antwortvorschlag als Draft mit). **Company-Regel (E17):** andere aktive Leads derselben
Company pausieren + requires_human (reason company_colleague_replied).
**Referral (E23):** intent = referral → AI extrahiert Name/Kontext des Verwiesenen,
Panel-Vorschlag: neuen Kontakt anlegen (Duplikat-Check!) + in dieselbe Campaign mit
Referral-Kontext, Original-Lead completed. Immer Semi.
**LinkedIn-Pendant (E16):** dieselbe Pipeline wird von der manuellen Antwort-Erfassung
im Side Panel gefüttert (`ingest_manual_reply(lead_id, text)`) — ab dem Insert
identischer Ablauf inkl. Reply-Stop und Intent.
⚠ Falle: Auto-Replies (Out-of-Office) erkennen (Header `Auto-Submitted`, Precedence) →
als reply speichern, aber Intent `not_now` mit kurzem Delay, KEINE AI-Antwort auf Abwesenheitsnotizen.

**`mailbox_warmup_runner` (Cron täglich):** warmup_phase nach Schema fortschreiben
(Tag 1–7: 10 · 8–14: 20 · 15–21: 30 · 22–28: 40 · 29+: 50 — Werte aus system_config),
`current_daily_limit` setzen. Wenn `user_limit_override` gesetzt → gilt Override,
ABER Schutzautomatik (E12) bleibt: bounce_rate > bounce_throttle_pct → Limit eine
Stufe runter + throttled_at/reason; > bounce_pause_pct → status 'paused' + requires_human
auf betroffene Leads + Alert.

**`sync_list_campaigns` (Cron täglich + manuell auslösbar):** für jede
campaign_list_sources-Zeile mit mode continuous: Listen-Mitglieder ermitteln
(dynamisch: filter_config auswerten; statisch: contact_ids), noch nicht als Lead in
dieser Campaign → Intake-Pipeline durchlaufen (Ausschlüsse → verify_contact_email wenn
aktiviert → Lead anlegen mit list_id, scheduled_at via Smart Window). one_time: nur beim
ersten Sync. Idempotent: UNIQUE-Prüfung (campaign_id, contact_id) auf leads —
⚠ Falle: dieser Unique-Constraint existiert noch nicht → in Migration A ergänzen:
`UNIQUE(campaign_id, contact_id)` auf leads (ein Kontakt max. 1x pro Campaign, auch historisch —
bei Reaktivierung wird der bestehende Lead-Datensatz reaktiviert, kein neuer angelegt).

**`lifecycle_trigger_runner` (Cron täglich, nach den Score-Crons):** für jede aktive
Lifecycle-Campaign: Trigger auswerten (SQL auf contacts/deals/companies — z.B.
heat_status='kalt', trial_end_date <= now()+X). Treffer → Lead anlegen.
Automation semi (Default): `sequence_status='requires_human'`,
reason `lifecycle_confirmation` → User bestätigt Start im Side Panel. Auto: direkt active.
Mehrfach-Schutz: ein Kontakt, der die Campaign schon durchlaufen hat, wird nicht erneut
aufgenommen, solange der Trigger-Zustand anhält (Cooldown = reactivation_days).

**`compute_message_features(message_id)`:** deterministisch was geht (word_count,
subject_length, sent_hour/dow, step, channel, mode, Segment aus contact/company),
AI-Kurzaufruf (Langfuse 'extract_features_v1') für tone/cta_type/subject_style. Insert message_features.

**`update_message_outcomes` (Cron nächtlich):** message_features.outcome aus
message_events + leads (replied, meeting_booked via deal-Verknüpfung) fortschreiben.
Erst danach:

**`aggregate_learning_insights` (Cron nächtlich, nach outcomes):** message_features
aller Orgs mit `learning_share_data=true` → Buckets pro Segment × Feature →
global_message_insights komplett neu berechnen (truncate + rebuild ist ok, Tabelle ist klein).
Schwellen: orgs_count >= 3, sends >= 50.

**`get_insights_for_segment(contact_id)`:** service-role-Lookup, gibt max. 5 relevante
Insights als kompakte Sätze zurück (für Prompt + für UI "AI Learnings"-Block).

**`suggest_community_template_candidates` (Cron wöchentlich):** Top-Muster
(reply_rate deutlich über Segment-Schnitt, orgs_count >= 3) → AI destilliert
neutralisiertes Template (Langfuse 'distill_template_v1': Struktur/Mechanik übernehmen,
JEDES produktspezifische Detail durch Platzhalter ersetzen) → Insert in templates mit
`source='community'`, `is_active=false`. **Publikation (is_active=true) nur manuell
durch uns** — v1 direkt in Supabase, Admin-UI später (E11).

### 5.3 Prompt-Map — neue Langfuse-Prompts

| Prompt-ID | Function |
|---|---|
| extract_features_v1 | compute_message_features |
| distill_template_v1 | suggest_community_template_candidates |
| generate_message_v2 | generate_message (erweitert: Modi, Kohorte, Insights, Persönlichkeit, Org-Profil/Persona-Matching, Personal Voice) |

---

## 6. UI — VERBINDLICHE FESTLEGUNGEN

Grundlage: `ui_interaktionen_v14_komplett.md` Abschnitte 10 + 11 (Screen, Side Panel,
Inbox Intelligence, Termine-Tab) — gilt weiter, mit folgenden Deltas:

1. **Tabs (E10):** Campaigns · Neu via Signal · Outreach aktiv · Termine gebucht · Performance.
   "Campaigns" ist der Default-Tab, wenn Handlungsbedarf existiert → Badge-Dots wie spezifiziert.
2. **Campaign-Kachel** (statt "Sequenz-Kachel", Verhalten identisch zu 10.3/10.4) zeigt
   zusätzlich: campaign_type-Badge ("Lifecycle" teal-outline, outbound ohne Badge),
   Kohorten-Gruppierung in der expandierten Lead-Liste (Section-Header pro signal_cohort,
   z.B. "Post: {gekürzte source_url} · 12 Leads" — nur wenn Kohorten existieren, sonst flache Liste).
3. **Campaign Builder** = die 7 Tabs aus `ai_sdr_architektur_entscheidungen.md` Abschnitt 1,
   mit Ergänzungen:
   - Tab 2 Lead Source: + "Listen" (Mehrfachauswahl bestehender Listen, mode-Toggle
     kontinuierlich/einmalig).
   - Tab 5 Workflow: pro Step generation_mode-Auswahl (Segmented: "AI schreibt" /
     "Template" / "Eigener Prompt") + Template-Picker bzw. Prompt-Textarea.
     LinkedIn-Steps zeigen Hinweis: "Wird als Aufgabe erstellt — du sendest selbst."
   - Neuer Typ-Schritt ganz am Anfang: Outbound oder Lifecycle. Lifecycle → Tab 1+2
     ersetzt durch Trigger-Auswahl (Katalog aus 5.2), Rest identisch.
   - Vollansicht via `createPortal` auf document.body (Panel-Standard).
4. **Side Panel:** die 7 Varianten aus UI-Doku Abschnitt 11 + **NEU Variante 8
   "LinkedIn-Nachricht fällig"** (waiting_manual): AI-Text in LinkedIn-Chat-Optik,
   [Text kopieren]-Button (Clipboard), Link "Profil öffnen ↗" (linkedin_url),
   Primary "Als gesendet markieren" → complete_manual_step. Secondary: "Text anpassen" ·
   "Schritt überspringen". Status-Wort in Lead-Zeile: "→ LinkedIn" (orange).
5. **Templates-Verwaltung:** Settings → AI SDR → Templates. Liste (eigene + "Bewährte
   Templates" read-only mit Performance-Zeile "Ø 14% Reply · 2.400 Sends · 6 Teams"),
   Editor mit Platzhalter-Chips ({{vorname}} etc. klickbar einfügbar), Vorschau mit
   Demo-Daten. Community-Template "Verwenden" → kopiert es als eigenes (editierbar).
6. **Performance-Tab (Slice 12):** KPI-Kacheln (Sends, Delivery-Rate, Open-Rate,
   Reply-Rate, Positive-Reply-Rate, Meetings, Bounce-Rate) + pro Campaign-Tabelle +
   "AI Learnings"-Block (Slice 13; bis dahin ausgeblendet — NICHT als leerer Platzhalter).
   Honesty: Raten erst ab n >= 20 Sends anzeigen, darunter "Folgt — zu wenig Daten (n)".
   ⚠ Falle: Open-Rate ist durch Apple MPP verzerrt — Tooltip-Hinweis an der Kachel,
   Reply-Rate als Leit-KPI hervorheben.
7. **Mailbox & Limits (Settings → AI SDR):** wie session_notizen-Block "Ein Limit" —
   Slider pro Mailbox (Default = Empfehlung/Warmup-Stufe, Override möglich, Warn-Hinweis
   ab warn_daily_limit), Warmup-Fortschritt ("Warmup Woche 2 von 4 · aktuell 20/Tag"),
   Tagesverbrauch ("32/50 · 18 Follow-ups · 14 neu"), Health (Bounce/Spam/Status),
   Throttle-Banner wenn gedrosselt. Inbox-Rotation-Hinweis wenn > 1 Mailbox.
8. **Learning-Opt-out:** Settings → AI SDR → Datennutzung: Toggle "Anonymisierte
   Erfolgsmuster teilen und von der Community lernen" (Default an) + 2 Sätze Erklärung
   (nur Muster, nie Inhalte/Namen).
9. **"Zu Campaign hinzufügen"** überall: Kontakt-Side-Panel, Kontaktliste (Bulk),
   Cmd+K-Aktion. Öffnet kleinen Dialog: Campaign-Auswahl (nur passende: outbound +
   Kontakt nicht ausgeschlossen) → Intake-Pipeline.
10. **Sichtbarkeits-Prinzip bleibt:** Standard-Ansicht zeigt NUR Handlungsbedarf.
    Gesamtbestand nur über "Alle X →".
11. **Tages-Digest-Block (E24, ab Slice 12):** oben im AI-SDR-Screen unter dem Header-
    Banner, einklappbar (Zustand persistiert), max. 4 Zeilen: gestern · offen · heute
    geplant · Erfolgs-Satz. Klick auf Zahlen → springt zum jeweiligen Tab/Filter.
    Datenquelle: daily_briefings — NIE eigene Aggregation im Frontend.

---

## 6b. UI/UX — MANAGEMENT-PRINZIPIEN (verbindlich, eigener Abschnitt)

Die UI-Doku v14 beschreibt die Komponenten. Dieser Abschnitt beschreibt, wie sich der
Screen verhält, wenn das System **voll** ist: 15 Campaigns, 4 Lead-Quellen, 300 aktive
Leads, Mischung aus Auto und Semi. Claude Code prüft JEDE UI-Entscheidung gegen diese
Prinzipien. Bei Konflikt mit einer Detail-Angabe: STOP, Rückfrage.

**P1 — Der Screen ist eine Inbox, kein Archiv.**
Die Standard-Ansicht beantwortet genau eine Frage: "Was braucht mich JETZT?"
Sortierung der Gesamtseite: (1) requires_human nach Wartezeit, (2) waiting_manual
(LinkedIn fällig), (3) alles andere nur auf Abruf. Eine Campaign ohne Handlungsbedarf
ist eine EINZEILIGE, beruhigte Kachel ("läuft · 43 aktiv · nichts zu tun") — sie darf
optisch nicht mit einer Kachel konkurrieren, die Aufmerksamkeit braucht.
Leerer Handlungsbedarf ist ein positiver Zustand (Task-getriebene Leere):
"Alles läuft — die AI arbeitet für dich" + die 3 nächsten geplanten Sends als Vorschau.

**P2 — Drei Ebenen, nie mehr (Progressive Disclosure wie Hunter/Farmer):**
Ebene 1 Kachel-Übersicht (Zahlen + Status) → Ebene 2 aufgeklappte Kachel (Lead-Zeilen,
gruppiert) → Ebene 3 Side Panel (eine Entscheidung treffen). Kein Modal-über-Modal,
keine vierte Ebene. Der User trifft Entscheidungen IMMER in Ebene 3, nie in Ebene 1/2
(dort nur: Pausieren/Fortsetzen als einzige Direkt-Aktion).

**P3 — Automation-Transparenz schafft Vertrauen in Auto.**
Jede automatisch ausgeführte Aktion ist nachvollziehbar: Lead-Zeile trägt ein dezentes
"🤖 Auto"-Kennzeichen, Side-Panel-Timeline zeigt pro Auto-Schritt den Grund in einem
Satz ("Gesendet automatisch — Confidence 84%, Campaign auf Auto"). Quelle:
lead.ai_adjustments + messages-Metadata — nichts Neues erfinden. Regel: Der User darf
sich NIE fragen müssen "warum hat die AI das getan?". Das ist die Voraussetzung dafür,
dass User von Semi auf Auto hochschalten.

**P4 — Eine visuelle Sprache für Automation-Zustände, überall identisch:**
- Wartet auf dich (requires_human): farbiger linker Border + farbiger Hintergrund + Timer-Badge
- Du bist dran, aber ungefährlich (waiting_manual): orange, ohne Alarm-Optik
- AI arbeitet (active, auto): neutral, opacity 0.7, kein CTA
- AI wartet auf Freigabe (Semi-Draft): amber "◐ Bestätigen"
Diese vier Zustände sind die EINZIGE Zustands-Farblogik. Keine Campaign-eigenen Farben,
keine zusätzlichen Badge-Erfindungen. Tokens aus index.css.

**P5 — Skalierung ist Filter + Gruppierung, nie mehr Fläche.**
Ab > 5 Campaigns: Filter-Pills oben (Alle · Braucht dich X · Outbound · Lifecycle ·
Pausiert) + Suchfeld. Kohorten-Gruppierung nur wenn Kohorten existieren. Lead-Listen
> 50 Zeilen: virtualisiert (Pflicht). NIEMALS Pagination in Ebene 2 — expandierte
Kacheln zeigen Handlungsbedarf komplett, Rest hinter "Alle X →".

**P6 — Campaign-Erstellung: geführt, mit sichtbarem Ausgang.**
Der Builder ist ein Wizard mit Fortschrittsleiste (Typ → 7 Tabs → Review). Jeder Tab
hat sinnvolle Defaults aus settings — ein User, der nur Name + Pitch ausfüllt, bekommt
eine funktionierende Semi-Campaign. Letzter Schritt ist IMMER eine Review-Seite:
"Diese Campaign wird: {Zielgruppe} über {Kanäle} in {n} Schritten kontaktieren,
Modus {Semi/Auto}, max {X}/Tag, Start {sofort/Datum}" + eine live generierte
Beispiel-Nachricht für einen echten Lead aus der Quelle (wenn vorhanden — sonst
Demo-Daten, klar als solche gekennzeichnet). Aktivieren erst nach Review.

**P7 — Sprache im UI: Ergebnisse, nicht Technik.**
Nie "sequence_status: requires_human" — immer "Wartet auf deine Antwort · seit 2h".
Nie "Intent: interested (Confidence 84%)" als Hauptinfo — sondern "Klingt interessiert —
Antwortvorschlag liegt bereit" (Confidence als Sekundärinfo). i18n-Keys, deutsch first.

**P8 — Vollautomatik-Modus verändert die UI-Gewichtung.**
Steht der globale Toggle auf Auto, wird der Screen zum Monitoring: Digest-Block +
Performance-Zahlen rücken nach oben, die (seltenen) requires_human bleiben als
rote Insel unübersehbar. Steht er auf Semi/Manual, dominiert die Arbeitsliste.
Gleiche Komponenten, andere Reihenfolge — kein zweiter Screen.

---

## 6c. AI-CHAT-READINESS (Bau-Anforderung, Implementierung kommt mit [D5])

Der AI Chat wird nach dem AI SDR gebaut (separater Bauplan folgt). Damit er das AI SDR
vollständig steuern kann, gilt beim Bau JEDES Slices: **Alles, was ein User im UI tun
kann, muss über eine Edge Function / DB-Änderung erreichbar sein — nichts darf nur als
Frontend-Logik existieren.** Konkrete Checkliste (Claude Code prüft pro Slice, ob die
betroffenen Punkte erfüllt sind):

**Lesbar sein muss (reine DB-Queries, keine Frontend-Aggregation):**
Campaign-Liste + Status + Funnel-Zahlen · Leads einer Campaign nach Status ·
requires_human-Liste mit Gründen + Wartezeiten · Performance-KPIs pro Campaign/Zeitraum ·
Templates + deren Performance · Mailbox-Status/Limits/Warmup · alle settings.ai_sdr-Werte ·
Digest des Tages · Insights ("was funktioniert gerade?").

**Änderbar sein muss (jeweils über bestehende Edge Functions bzw. update_field-Fallback,
mit Permission-Check + audit_log):**
Campaign pausieren/fortsetzen/archivieren · automation_level + intent_threshold +
priority einer Campaign · Sequence-Steps (delay, mode, template) · Pitch/Brief-Felder ·
alle settings.ai_sdr-Schwellen · Template anlegen/ändern · Lead zu Campaign hinzufügen
(via intake_lead — Chat nutzt DENSELBEN Eingang wie das UI) · Lead pausieren/
archivieren · Draft freigeben ("sende den Entwurf an Müller raus" = dieselbe Function
wie der Senden-Button im Panel).

**Architektur-Konsequenz (verbindlich ab Slice 5):** Jede User-Aktion im Side Panel /
Builder ruft eine benannte Edge Function (z.B. `approve_draft`, `pause_campaign`,
`update_campaign_config`) — NIE direkte Supabase-Writes aus Komponenten. Diese
Functions sind später 1:1 die Function-Calling-Tools des Chats. Wer hier eine
Abkürzung baut, baut den Chat kaputt.

---

## 7. BUILD-REIHENFOLGE — 15 SLICES

Jeder Slice: eigener Branch, grüne Gates, STOP + Screenshot-QA vor dem nächsten.
Format je Slice: Ziel → Diagnose → Aufgaben → Akzeptanz → Fallen.

---

### SLICE 0 — Doku-Angleichung (kein App-Code)
**Ziel:** Widerspruchsfreie Doku-Basis.
**Aufgaben:**
- Diese Datei als `docs/ai_sdr_bauplan_v1.md` ins Repo, in CLAUDE.md-Referenztabelle
  eintragen ("maßgeblich für den AI-SDR-Bau").
- entscheidungen_komplett.md: E1–E24 nachtragen, 🔴 Sending-Provider auf "v1 gelöst
  (Email via Nango, LinkedIn manuell), Unipile = v2" setzen. Verworfene Variante
  "getrennte Mailbox-Kontingente" explizit als VERWORFEN markieren.
- ui_interaktionen_v14: Abschnitt 10 — "Sequenz" → "Campaign/Kampagne" wo Campaigns
  gemeint sind, Tab-Struktur E10, Variante 8 ergänzen.
- sales_os_edge_functions: E13-Fix (discovery → Stage aus Settings) notieren.
- audit.ts-Ausnahmeliste: global_message_insights (kommt in Slice 2 — hier nur dokumentieren).
- PROGRESS.md: AI-SDR-Phase mit Slice-Plan eintragen.
**Akzeptanz:** Kein Grep-Treffer mehr für widersprüchliche Tab-/Begriffs-Angaben in den vier Dateien.

### SLICE 1 — Migration A (Kernobjekte)
**Ziel:** Alle Schema-Erweiterungen aus 4.1.
**Diagnose:** Höchste vorhandene Migrationsnummer prüfen. Prüfen ob leads bereits
UNIQUE(campaign_id, contact_id) hat. Bestehende RLS-Policy-Patterns ansehen und kopieren.
**Aufgaben:** templates · campaign_list_sources · mailbox_daily_counters + RPC ·
ALTERs (campaigns, leads inkl. UNIQUE, mailboxes, contacts.unsubscribe_token) ·
settings.ai_sdr Seed · updated_at-Trigger · Indexes.
**Akzeptanz:** Migration läuft auf frischer DB und auf Bestands-DB fehlerfrei durch.
RLS-Test: Org A sieht keine Templates von Org B, beide sehen org_id-NULL-Templates.
RPC-Test: 2 parallele Aufrufe bei Limit 1 → genau 1 Erfolg.
**Fallen:** IS-NULL-Policy (4.1) · UNIQUE auf leads bricht, wenn Testdaten Duplikate
enthalten → vorher bereinigen, nicht den Constraint weglassen.

### SLICE 2 — Migration B (Telemetrie & Learning)
**Ziel:** message_events · message_features · global_message_insights aus 4.2.
**Aufgaben:** Tabellen + Indexes + Dedupe-Unique + deny-all-RLS auf insights ·
audit.ts-Ausnahme eintragen · system_config-Werte (min_orgs=3, min_sends=50).
**Akzeptanz:** Insert mit doppelter provider_event_id wird still verworfen.
Client-Query auf global_message_insights → leer/verweigert.
**Fallen:** Pre-Push-Hook wegen fehlender org_id (siehe 4.2).

### SLICE 3 — Sending-Layer Email
**Ziel:** Echte Mails senden + jedes Ereignis erfassen.
**Diagnose:** Existiert lib/sending.ts schon (laut docs geplant)? Integrations-Session-0-
Status prüfen (Masterplan Klasse A: Nango-Projekt, OAuth-Apps, Keys im Vault) — fehlt
etwas → STOP, Oliver-Checkliste im Masterplan.
**Aufgaben:**
- Nango: Gmail + Outlook OAuth-Flows, Connection pro Mailbox
  (mailboxes.nango_connection_id), Secrets in Supabase Vault. Settings-UI:
  "Mailbox verbinden" Flow (inkl. Email-Verifizierungs-Nudge aus session_notizen:
  aktiv JA/NEIN, nicht überspringbar).
- lib/sending.ts: `sendEmail({mailbox_id, to, subject, html, text, tracking_id})` —
  Provider-agnostisch, v1 Gmail/Outlook via Nango (Test-Modus-Apps aus Session 0).
  Adapter-Struktur so schneiden, dass spätere Adapter (SMTP/IMAP-Fallback I-B7,
  Unipile-LinkedIn v2, Managed Mailboxes I-B8) nur hinzukommen — Kern bleibt unberührt.
  Open-Pixel + Click-Wrapping mit
  tracking_id, Ziel: track_message_event. Unsubscribe-Footer automatisch anhängen
  (i18n, dezent).
- Edge Functions: track_message_event · handle_unsubscribe.
- messages.status-Fortschreibung "nur vorwärts".
**Akzeptanz:** Testmail an echte Adresse: sent/delivered/open/click erscheinen als
message_events (Open ggf. via manuellem Pixel-Aufruf testen). Unsubscribe-Link
funktioniert Ende-zu-Ende (Kontakt opt_out, Leads gestoppt). Doppelter Webhook → 1 Event.
**Fallen:** Click-Wrapping darf den Booking-Link nicht zerstören (Whitelist eigener
Domains vom Wrapping ausnehmen oder Redirect sauber implementieren) ·
HTML-Mails: Plaintext-Alternative immer mitsenden (Deliverability).

### SLICE 4 — Mailbox-Management
**Ziel:** Warmup, Limits, Schutzautomatik, Smart Window.
**Aufgaben:** mailbox_warmup_runner (Cron) · Bounce/Spam-Raten-Berechnung aus
message_events (rollierend 7 Tage) · Throttle-Logik E12 · `lib/scheduling.ts`:
`nextSendSlot(after, contact, settings)` — Smart Sending Window + Timezone
(contact.country/city → IANA-Zone via statischem Mapping in constants, UTC speichern) ·
Settings-UI "Mailbox & Limits" (Abschnitt 6.7).
**Akzeptanz:** Neue Mailbox startet bei Stufe 1. Simulierte Bounce-Rate 4% → Limit
sinkt eine Stufe, Banner sichtbar. Slot-Berechnung: Freitag-17-Uhr-Wunsch → Montag/
Dienstag-Vormittag Empfänger-Zeit.
**Fallen:** Warmup-Cron muss idempotent sein (mehrfacher Lauf am selben Tag = keine
Doppel-Stufung) · Override entkräftet NIE die Schutzautomatik.

### SLICE 5 — Sequenz-Engine
**Ziel:** Das Herzstück: fällige Leads verarbeiten, Nachrichten generieren, senden/vorlegen.
**Diagnose:** Langfuse-Setup prüfen (Keys, EU-Region). credit_balance-Tabellen vorhanden?
**Aufgaben:** sequence_runner (mit allen Ergänzungen 5.1: Lock, Follow-ups-first,
atomares Limit, LinkedIn→Task, Send-Gate) · process_lead · generate_message_v2
(3 Modi, Persönlichkeit, Kohorte, Verbotene Wörter, Credits) · resolve_placeholders
(inkl. Fallback-Logik #24) · generate_reply-Grundgerüst · complete_manual_step ·
compute_message_features (deterministischer Teil; AI-Teil darf hier schon rein) ·
Cron-Registrierung.
**Akzeptanz (mit Test-Campaign auf Demo-Org, automation=semi):** Lead durchläuft
Step 1 → Draft erscheint als requires_human. Auto-Campaign + Test-Mailbox → Mail geht
real raus, scheduled_at korrekt auf Smart-Slot. LinkedIn-Step → Task + waiting_manual,
complete_manual_step setzt fort. Limit 1 gesetzt → zweiter Lead bleibt in Queue,
Banner-Flag. Opt-out-Kontakt → wird am Gate gestoppt mit Grund.
**Fallen:** Doppel-Send (Lock!) · scheduled_at nach letztem Step auf NULL + completed +
Reaktivierungs-Tag-Logik nicht vergessen · Verbotene-Wörter-Retry max. 2, dann
requires_human — keine Endlosschleife · Semi heißt: Draft speichern, NICHT senden.

### SLICE 6 — Lead-Intake & Routing
**Ziel:** Alle Wege in die Campaign.
**Aufgaben:** classify_sherloq_lead (inkl. signal_cohort, Matching-Score #12,
Routing-Baum ai_sdr/hunter/farmer, `signals.routed_to`) · validate_sherloq_signal
(HMAC) · sync_list_campaigns · "Zu Campaign hinzufügen" (Panel, Bulk, Cmd+K) ·
Import-Flow-Anbindung (#28: 3 Optionen) · Intake-Pipeline als EINE gemeinsame Funktion
`intake_lead(contact_id, campaign_id, source)` — Ausschlüsse → **Aktiv-Regel E18
(Kontakt bereits in aktiver Campaign? → nicht aufnehmen; wenn neue Campaign höhere
priority hat → requires_human-Vorschlag "Campaign wechseln?" auf dem bestehenden Lead,
reason campaign_conflict)** → verify_contact_email (wenn verify_before_sequence) →
Duplikat-/Unique-Check → Lead anlegen/reaktivieren → scheduled_at
(unter Beachtung Company-Staffelung E17).
**Akzeptanz:** Sherloq-Test-Webhook (Post-Signal) → Kontakt angelegt, Campaign gematcht,
Kohorte gesetzt, Lead scheduled. Dynamische Liste "ICP>70" an Campaign gekoppelt →
neuer passender Kontakt taucht nach Sync als Lead auf. Kunde via "Zu Campaign
hinzufügen" → sauber blockiert mit Hinweis.
**Fallen:** intake_lead ist die EINZIGE Stelle, die Leads anlegt — alle Quellen rufen
sie auf (Single Source, sonst driften die Prüfungen auseinander) · Reaktivierung =
bestehenden Lead-Datensatz zurücksetzen, keinen zweiten anlegen (UNIQUE!).

### SLICE 7 — Inbound & Intent
**Ziel:** Antworten empfangen, verstehen, reagieren.
**Aufgaben:** ingest_inbound_message inkl. Reply-Stop E14 als erste Aktion +
Company-Pausierung E17 + ingest_manual_reply E16 (Nango Webhook + Polling-Fallback,
Threading, Auto-Reply-Erkennung) · classify_intent (7 Labels inkl. referral,
Schwellenwert aus Campaign) · handle_intent (inkl. not_now-Pause, Opt-out immer
requires_human, Referral-Flow E23) · generate_reply (immer Draft) · Bounce-Handling
#31 (hard: requires_human ohne Retry; soft: Retry max. 3, konfigurierbares Intervall) ·
Opt-out-Flow (Panel-Variante 5, Pflichtaktionen).
**Akzeptanz:** Test-Reply "klingt spannend, erzähl mehr" → intent interested,
Draft-Antwort als requires_human sichtbar UND geplanter Follow-up-Step nachweislich
storniert (scheduled_at NULL). "Bitte keine Mails mehr" → Opt-out-Flow, nach
Bestätigung alle Leads des Kontakts gestoppt. "Wenden Sie sich an meine Kollegin
Frau Weber" → referral-Vorschlag mit extrahiertem Namen. Zweiter Lead derselben
Company wird nach Reply des ersten pausiert. Hard-Bounce-Simulation →
email_verified=false, Panel-Variante 7.
**Fallen:** Opt-out schlägt IMMER requires_human, egal welche Confidence ·
Out-of-Office darf keine AI-Antwort auslösen · Threading-Fallback kann falsch matchen —
bei Unsicherheit (mehrere aktive Leads gleicher Email) requires_human statt raten.

### SLICE 8 — Campaigns-UI
**Ziel:** Campaign Builder + Cockpit + Tab-Gerüst.
**Diagnose:** ScreenAiSdr.tsx-Bestand (AI-Studio-Design) sichten — Design übernehmen,
Logik nach unseren Regeln neu verdrahten. Bestehende Tabs/Kachel-Komponenten aus
Hunter/Farmer wiederverwenden.
**Aufgaben:** Screen-Gerüst mit 5 Tabs (E10) + Header-Banner + Gesamt-Automation-Toggle ·
Campaigns-Tab: Cockpit-Kacheln (Funnel-Zahlen aus echten Counts, Pausieren/Bearbeiten) ·
Campaign Builder (Abschnitt 6.3, alle 7 Tabs, Typ-Auswahl, Draft-Speichern,
Aktivieren-Validierung: mind. 1 Step, Sender gesetzt, Pitch gefüllt) ·
Templates-Verwaltung (6.5) · Mailbox-Limit-Banner.
**Akzeptanz:** Campaign End-zu-End im UI anlegbar und aktivierbar; Leads aus Slice 6
erscheinen in den Cockpit-Zahlen. Alle Zahlen echt (keine Platzhalterwerte).
**Fallen:** Kein einziger hardcodierter Zahlwert im Cockpit — jede Zahl ist ein Count ·
Builder-State als Draft in DB, nicht nur im Frontend-State (Seitenwechsel darf nichts verlieren).

### SLICE 9 — Operatives UI
**Ziel:** Der tägliche Arbeitsbereich.
**Aufgaben:** Campaign-Kacheln zu/aufgeklappt (10.3/10.4) inkl. Kohorten-Gruppierung ·
Lead-Zeilen (10.5, Status-Wörter inkl. "→ LinkedIn") · Side Panel mit allen 8 Varianten
(Panel-Standards, Portal-Vollansicht, Footer-Actions) — Variante 8 zusätzlich (E16):
bei Message-Steps Sektion "Antwort erhalten?" mit Textfeld → ingest_manual_reply;
bei Connect-Steps stattdessen nur Haken "Anfrage angenommen" ·
**Antwort-Timer (E22):** Wartezeit-Badge auf jeder requires_human-Zeile
("wartet seit 2h", ab response_time_urgent_hours rot) · Inbox Intelligence (10.6) ·
"Neu via Signal"-Tab (Quellen-Aufschlüsselung) · Realtime-Updates (org-Channel:
neue requires_human erscheinen ohne Reload).
**Akzeptanz:** Jede der 8 Varianten mit echtem Testfall durchspielbar. Standard-Ansicht
zeigt nur Handlungsbedarf; "Alle X →" zeigt alles. Realtime: zweites Browserfenster
sieht neuen requires_human-Eintrag live.
**Fallen:** Side Panel öffnet NUR auf Arrow-Klick (10.5) · Composer-Aktionen rufen
Edge Functions, nie direkte Supabase-Writes · Persönlichkeits-Hinweise nur bei
Confidence ≥ 60, sonst komplett ausblenden.

### SLICE 10 — Termine (Quelle flexibel, E3)
**Ziel:** Booking-Link-Versand + Termine-Verwaltung — OHNE externes Setup lauffähig.
**Aufgaben:** Booking-Quelle pro User (Settings → Profil: booking_provider + booking_link,
Validierung URL) · generate_booking_link nutzt konfigurierte Quelle ({{termin_link}}-
Platzhalter; keine Quelle hinterlegt → Platzhalter-Fallback-Regel #24 greift, Hinweis
im UI) · **Manueller Bestätigungs-Pfad:** "Termin bestätigen"-Aktion (Side Panel +
Termine-Tab): Datum/Zeit erfassen → Deal in Termin-Stage aus Settings (E13), Sequence
pausieren nicht löschen, prep_meeting, Realtime, audit_log · Termine-gebucht-Tab (10.7)
speist sich aus beiden Pfaden · UI-Erklärzeile zum Automatik-Unterschied (E3).
**Meeting-Nachbereitung (NEU):** Nach Termin-Ende (Endzeit erreicht) entsteht automatisch
ein Task Typ `meeting_debrief` am Kontakt ("Wie lief das Meeting mit {Name}?") —
Verteilung über die BESTEHENDE Task-Routing-Tabelle (neue Zeile: meeting_debrief →
Kontakt ist Kunde = Farmer-Follow-ups · Prospect/Deal = Hunter-Follow-ups · immer
zusätzlich Mein Tag Task-Sektion + Termine-Tab + Kontakt); KEINE neue Zone, KEINE
eigene Mitteilung (Anti-Doppel), KEIN Sonderweg am Routing vorbei.
⚠ **RETROFIT-HINWEIS (Hunter/Farmer sind GEBAUT):** Dieser Task-Typ wird in fertige
Module nachgerüstet. Diagnose-Pflicht: (a) tasks.type — neuen Wert zulassen
(Constraint/Enum prüfen, Migration falls nötig), (b) rendern die gebauten
Task-/Follow-up-Listen Typen GENERISCH oder pro Typ verdrahtet? Generisch →
meeting_debrief-Karte als neue Library-Komponente registrieren und fertig; pro Typ →
Karte + Panel nach expandedSlot-Muster in die BESTEHENDEN Hunter- und Farmer-Bereiche
einhängen (beide!), nichts duplizieren, (c) Task-Routing-Tabelle in der UI-Doku um
die Zeile ergänzen (Slice-0-Doku-Angleichung). Erst nach dieser Diagnose bauen. Erfassungs-Panel im
Action-Panel-Muster: 3 Ergebnis-Buttons (Positiv – nächster Schritt / Follow-up nötig /
Kein Interesse) · Freitext-Feld, in das auch ein TRANSKRIPT eingefügt werden kann
(Teams/Meet Copy-Paste) · daraus: communications-Eintrag (type meeting, inkl.
Transkript-Text) → Kurzakten-Update-Trigger → kontextabhängige Vorschläge
(Deal-Stage-Wechsel E13, Follow-up-Task, ggf. Sequenz-Ende). **Diagnose-Pflicht in
diesem Slice: Existiert bereits eine Meeting-Notiz-Erfassung (Gesprächsnotiz-UI)?
Falls ja → wiederverwenden/erweitern, falls nein → dieses Panel IST sie (Single
Source: eine Erfassung für Notiz + Transkript + Ergebnis).** Automatischer
Transkript-Abruf: NICHT hier — Anschlusspunkt I-B11 (Masterplan), dieses Panel wird
dann nur automatisch vorbefüllt.
**In die Integrations-Endphase VERSCHOBEN (Masterplan Klasse B / I-B1):** Cal.com
Self-Host, Nango Kalender-OAuth, validate_booking-Webhook (CANCELLED/RESCHEDULED-Pfade),
automatische Erkennung. Der Anschlusspunkt (validate_booking-Signatur, Stage-Logik)
ist hier bereits definiert — Endphase verkabelt nur.
**Akzeptanz:** Mail mit externem Booking-Link geht raus, Link unversehrt (Wrapping-
Ausnahme!) · "Termin bestätigen" erzeugt Deal in korrekter Stage + Meeting-Prep +
Mein-Tag-Zone-1-Event · User ohne Booking-Link: ehrlicher Hinweis, kein kaputter Platzhalter.
**Fallen:** Booking-Link vom Click-Tracking-Wrapping ausnehmen (Slice 3-Falle) ·
Stage-Slug aus Settings, NIE String-Literal · manueller Pfad und späterer Webhook-Pfad
nutzen DIESELBE interne Funktion (confirm_booking) — kein Doppel-Code.

### SLICE 11 — Lifecycle-Campaigns
**Ziel:** E6 aktiv.
**Aufgaben:** lifecycle_trigger_runner · Trigger-Katalog v1 (heat_cold, heat_dead,
trial_expiring, no_login_days [nur wenn sherloq_signals aktiv],
sequence_completed_no_response) · Builder: Lifecycle-Pfad freischalten ·
Routing-/Ausschluss-Anpassung (nur outbound blockt Kunden/Deals) ·
Cooldown-Logik · Badge in Kachel.
**Akzeptanz:** Lifecycle-Campaign "Kontakt wird kalt" (semi) → Test-Kontakt auf kalt
setzen → nach Runner-Lauf erscheint Lead als lifecycle_confirmation zum Bestätigen;
nach Bestätigung läuft die Sequenz. Kein Doppel-Intake beim zweiten Runner-Lauf.
**Fallen:** Score-/Heat-Crons müssen VOR dem Trigger-Runner laufen (Cron-Reihenfolge) ·
Hunter/Farmer-Screens bleiben unverändert Recommendation-only — dort ändert sich NICHTS.

### SLICE 12 — Performance-Tab & KPIs
**Ziel:** Alles messbar.
**Aufgaben:** Aggregations-Edge-Function `get_campaign_performance(campaign_id?, range)`
(aus message_events — nie Frontend-Aggregation) · KPI-Kacheln + Campaign-Tabelle +
Zeitverlauf (bestehende Chart-Patterns wiederverwenden) · Ø-Reaktionszeit-KPI aus
requires_human-Wartezeiten (E22) · **Digest (E24): morning_briefing() um
ai_sdr_digest-Sektion erweitern + Digest-Block im AI-SDR-Screen (6.11)** ·
Honesty-Schwellen (6.6) · update_message_outcomes-Cron.
**Akzeptanz:** Zahlen stimmen mit manueller SQL-Stichprobe überein. n<20 → "Folgt".
**Fallen:** Open-Rate-MPP-Hinweis · Prozentwerte aus events berechnen, nicht aus
lead-Countern (die sind Cache, events sind Wahrheit).

### SLICE 13 — Learning & Community-Templates
**Ziel:** E7 + E11 live.
**Aufgaben:** aggregate_learning_insights + get_insights_for_segment ·
generate_message: Insights-Block · "AI Learnings"-Block im Performance-Tab
(max. 5 Erkenntnisse in Klartext, Quelle "basiert auf X Sends aus Y Teams") ·
Datennutzungs-Toggle (6.8) · suggest_community_template_candidates + Kandidaten-Ablage ·
"Bewährte Templates"-Sektion.
**Akzeptanz:** Mit Seed-Daten (3 simulierte Orgs): Insight entsteht, erscheint im
UI-Block, taucht im generate_message-Prompt auf (Langfuse-Trace prüfen). Org mit
learning_share=false → ihre Daten fehlen in der Aggregation nachweislich.
Kandidaten-Template enthält keinerlei Produkt-/Firmennamen (manuell prüfen).
**Fallen:** Insights nie erfinden bei Datenmangel — Block ausblenden ·
deny-all-RLS testen, bevor irgendein UI die Tabelle berührt · Opt-out wirkt ab
nächster Aggregation vollständig (rebuild, kein Delta).

### SLICE 14 — Mein-Tag-Integration & Abschluss
**Ziel:** AI SDR in den Alltag einbetten, sauber abschließen.
**Aufgaben:** requires_human → Mein Tag Zone 2 Rang 0 (waiting_manual NICHT — das ist
normale Task-Zone), innerhalb Rang 0 nach Wartezeit sortiert (E22, älteste zuerst) ·
ai_sdr_digest-Sektion in Mein Tag anzeigen (E24 — gleiche Daten wie Screen-Block) ·
"X Leads im Reaktivierungs-Pool"-Banner ·
"Sequenz abgeschlossen ohne Response"-Notification (10.8) · Cmd+K-Aktionen
(Campaign öffnen, Lead suchen, Zu Campaign hinzufügen) · Gesamt-QA aller Slices ·
CLAUDE.md/PROGRESS.md/entscheidungen final aktualisieren · alle Crons + Zeitpläne
in README dokumentiert.
**Akzeptanz:** Kompletter Golden Path an einem Stück: Sherloq-Signal → Lead → Mail →
Reply → Termin → Deal in Hunter → Meeting-Prep in Mein Tag. Ohne manuelle DB-Eingriffe.

---

## 8. GLOBALE CLAUDE-CODE-FALLEN (gelten in JEDEM Slice)

1. **Doppel-Send ist der Super-GAU.** Jeder Pfad, der senden kann, läuft über Lock +
   atomaren Counter + finalen Gate. Im Zweifel: nicht senden, requires_human.
2. **Zeit:** DB immer UTC. Anzeige User-Timezone. Empfänger-Slots Empfänger-Timezone.
   Nie `new Date()` ohne Zone-Bewusstsein in Scheduling-Logik.
3. **Webhooks:** immer Signatur prüfen, immer dedupen, immer idempotent.
4. **Enums erweitern statt erfinden:** sequence_status/reason nur aus Abschnitt 3.
   Neuer Wert nötig? STOP, Rückfrage.
5. **Zahlen im UI sind immer echte Counts/Aggregationen.** Kein `?? 0`-Kaschieren von
   Fehlern — Fehler sichtbar machen.
6. **AI-Aufrufe:** aiCall() + Langfuse-ID + Timeout 30s + strukturierte Fehler. User-Prompts
   (custom_prompt) sind untrusted Input — als Datenblock in den Prompt, nie als System-Instruktion.
7. **Settings-Zugriff** über die zentrale Merge-Funktion (4.1) — nie roher jsonb-Zugriff verstreut.
8. **Alles per AI Chat steuerbar (Zukunft [D5]):** Deshalb liegt JEDE Regel, jedes Limit,
   jedes Template, jeder Prompt-Baustein in DB-Tabellen — nie in Code-Konstanten mit
   Business-Bedeutung. constants.ts nur für UI-/technische Konstanten.
9. **DSGVO:** Opt-out unumkehrbar respektieren, Unsubscribe in jeder Mail, opt_out-Kontakte
   in keiner Liste/Kohorte/Campaign auftauchen lassen, Learning nur Muster nie Inhalte.
10. **Nichts löschen:** Leads/Messages/Campaigns werden archiviert/completed, nie hart gelöscht.
11. Bei jedem neuen Screen-Teil: erst prüfen, ob es die Komponente in
    panel-blocks/shared/features schon gibt. Kopiere Verhaltens-Patterns
    (Snooze, Expand, Deeplinks) exakt aus Hunter/Farmer.

---

## 9. WAS IN v1 BEWUSST NICHT GEBAUT WIRD

- Automatischer LinkedIn-Versand (Unipile) — Abstraktion vorhanden, v2.
- Konkrete Termin-Slot-Vorschläge — v2.
- CRM-Sync als Lead-Quelle — v2 (#19 offen).
- Automatische A/B-Varianten aus Learnings — v2 (v1: Insights fließen in Generierung).
- Admin-UI für Community-Template-Freigabe — v1 manuell via Supabase.
- SMS-Kanal, Call-Steps mit Telefonie-Integration — nicht geplant.
- Eigener Analytics-Screen — bleibt eingebettet (Invariante).

Wenn Claude Code während des Baus auf eine dieser Grenzen stößt: NICHT anfangen,
"nur schnell" doch zu bauen. Grenze gilt.

---

*Sales OS · AI SDR Bauplan v1.4 · Juli 2026*
*Erstellt von Chat-Claude mit Oliver · Alle Entscheidungen final (E1–E25, E3 flexibilisiert) · Integrationen: siehe docs/integrations_masterplan.md*
*Pflege: Änderungen NUR in dieser Datei + entscheidungen_komplett.md im selben Commit*

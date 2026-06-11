# Sales OS — Entscheidungen & Definitionen (Vollständig)
# Zusammenführung v1 + v2 + v3 + v4 + v5 + v6 + v7
# Version 11 · Juni 2026
# Status: Laufend aktualisieren — nur diese Datei verwenden

---

## LEGENDE
✅ Entschieden — final
⚠ Offen — muss noch definiert werden
🔴 Kritisch — blockiert Build oder Live-Betrieb

---

## ENTSCHEIDUNGS-LOG

**2026-06-11 — Konfliktauflösung (eine kanonische Wahrheit pro Thema):**
- #2 Pipeline-Stages: kanonisch deutsch (backlog → … → gewonnen), englische Stages abgelöst
- #3 Follow-up Timer (Hunting): 3 Werktage (1.) / 7 Werktage (2., ab erster Mail), max 2
- #4 Churn-Gewichtung: zweischichtige Progressive-Data-Logic aus `edge_functions_v2`,
  flaches Punktesystem abgelöst; Level-Bänder 0–30/31–60/61–85/86+
- #6 Onboarding-Nudge: 3 Tage anschreiben (Email/Semi), 7 Tage Task
- #9 Persönlichkeit: 3 Dimensionen, kein DISG
- #10 Cluster-Vererbung: Auto-„kunde" bei Company-Kundenstatus, einmalige Bestätigung
- #23 Listen-Rechte: alle dürfen erstellen, unbegrenzt, tägliches + manuelles Refresh
- Slug-Konvention für `deals.stage` (lowercase_underscore), Anzeigename aus `settings.pipeline_stages`
- `subscription_status`: Enum `trial|active|churned` (kein „paused")

---

## BLOCK A — SCHWELLENWERTE & TIMER

### #1 Heat-Status Schwellenwerte ⚠
Ab wie vielen Tagen ohne Kontakt wechselt der Status?

| Status | Tage ohne Kontakt |
|---|---|
| Heiß | 0–3 Tage |
| Warm | 4–7 Tage |
| Lauwarm | 8–14 Tage |
| Kalt | 15–30 Tage |
| Tot | ab 31 Tage |

**Status:** Vorschlag steht — noch nicht final bestätigt. Hinterlegt in `settings.thresholds`, konfigurierbar.

---

### #2 Pipeline Stagnation Schwellenwerte ✅
Kanonische deutsche Stages (Slug = Speicherwert, Name = Anzeige), frei konfigurierbar pro
Org in `settings.pipeline_stages`. Ab wie vielen Tagen in einer Stage erscheint eine Warnung?

| Stage (Slug) | Anzeige | Tage bis Warnung |
|---|---|---|
| backlog | Backlog | 7 |
| demo_vereinbart | Demo vereinbart | 5 |
| followup_offen | Follow-up offen | 3 |
| onboarding_offen | Onboarding offen | 14 |
| free_trial | Free Trial | 14 |
| gewonnen | Gewonnen | kein Timer |

Terminal (kein Timer): `gewonnen`, `verloren`. Englische Stages (Proposal/Negotiation/Closed
Won) sind **abgelöst**.

**Status:** ✅ Entschieden (2026-06-11). Hinterlegt in `settings.pipeline_stages`.

---

### #3 Follow-up Timer (Hunting) ✅
Wenn keine Antwort auf Outreach (Werktage, Wochenenden übersprungen):
- Erster Follow-up nach: **3 Werktagen** (ab erster Mail)
- Zweiter Follow-up nach: **7 Werktagen** (ab erster Mail, nicht ab erstem Follow-up)
- Maximale automatische Follow-ups: **2**

**Status:** ✅ Entschieden (2026-06-11). Konfigurierbar in `settings.thresholds`.

---

### #13 Follow-up Timer (AI SDR) ✅
- Standard Follow-up nach: 3 Tagen
- Maximale Schritte pro Campaign: 5 (max. 7)
- Nach letztem Schritt ohne Response → #16 Reaktivierungs-Pool

---

## BLOCK B — SCORING & TRIGGERS

### #4 Churn Risk Gewichtung ✅
Kanonisch: **zweischichtige Progressive-Data-Logic** (aus `score_churn_risk()`,
→ `sales_os_edge_functions_v2.md`). Nur verfügbare Datenpunkte werden addiert; fehlende
Quellen werden ignoriert. Das frühere flache Punktesystem ist **abgelöst**.

**Basis-Score (immer verfügbar — aus Sales OS):**
| Signal | Punkte |
|---|---|
| Letzter Kontakt > 30T | +25 |
| Kein Reply auf letzte Mail | +20 |
| Offene Tasks überfällig | +15 |
| Tage ohne Aktivität > 14T | +20 |
| Heat Status = Kalt/Tot | +20 |

**Erweiterter Score (nur wenn externe Quelle verbunden):**
| Signal | Punkte |
|---|---|
| Letzter Login > 30T | +30 |
| Nutzung -50% vs. Vormonat | +25 |
| Support-Tickets offen | +20 |
| Vertrag läuft in 60T ab | +15 |
| Kündigung angedeutet | +30 |

Risk-Level (überall gleich): 0–30 = low · 31–60 = medium · 61–85 = high · 86+ = critical.
Warnung ab: high (61 Punkte). Gewichtung pro Org anpassbar in `settings.thresholds.churn_weights`.

**Status:** ✅ Entschieden (2026-06-11).

---

### #5 Upsell-Trigger ⚠
- Nutzer erreicht Enrichment-Limit >80% Auslastung → Upsell vorschlagen
- Company hat >10 Mitarbeiter im Sales aber <3 Seats → Upsell vorschlagen
- Nutzer nutzt <50% der verfügbaren Features → Upsell vorschlagen
- Weitere Trigger konfigurierbar in `settings.thresholds`

**Status:** Grobe Trigger definiert — Schwellenwerte noch nicht final bestätigt.

---

### #11 ICP Score ✅
ICP Score ist OPTIONAL — kein Pflichtfeld, kein Gate für Automation.
Campaign Automation-Level ist die primäre Steuerung.
Standard-Schwellenwert wenn aktiv: 65.
Pro Campaign überschreibbar oder deaktivierbar.

---

### #14 Intent Detection Schwellenwert ✅
- Confidence ≥ 70% → AI handelt automatisch
- Confidence < 70% → requires_human = true
- Pro Campaign überschreibbar (Standard 70%)

---

## BLOCK C — AUTOMATION

### #15 Gesamt-Automation Default ✅
Standard: Semi Auto (AI bereitet vor, Mensch bestätigt)
Pro Campaign überschreibbar: Manual / Semi / Auto

---

### #20 / #29 Automation Risk-Level ✅

**LOW RISK → Auto immer erlaubt:**
- Connection Request · Erstansprache · Follow-up
- Tags setzen · Reaktivierungs-Pool

**MEDIUM RISK → Auto nur bei Confidence ≥ 70% + Campaign = Auto:**
- Antwort auf Reply · InMail · Follow-up nach Signal
- Termin-Link senden · Lead→Deal
- Ausnahme: Termin gebucht → immer automatisch (eindeutiger Trigger)

**HIGH RISK → niemals Auto, hardcoded:**
- Termin bestätigen/absagen · CRM überschreiben
- Opt-out · Löschen · Eskalation

Kategorien sind fest — User kann nicht selbst zuordnen.
Global in Settings → AI SDR → Automation Rules. Nicht pro Campaign.

---

### #16 Reaktivierungs-Pool ✅
- Nach 90T ohne Response → `contact_tags += 'reaktivierung'`
- Dynamische Liste "Reaktivierungs-Pool" wird automatisch befüllt
- Sichtbar in Kontakte-Screen als Filter/Liste
- Mein Tag: zeigt Banner "X Leads im Reaktivierungs-Pool"
- Kein eigener Screen. User entscheidet pro Lead: Campaign zuweisen ODER archivieren
- Bei neuem Signal → taucht automatisch wieder auf

---

## BLOCK D — AI SDR LOGIK

### #12 Campaign-Matching-Regelwerk ✅
Matching ist SQL — kein AI, keine Token-Kosten.

Score pro Campaign:
- Jobtitel: 3 Punkte
- Branche: 2 Punkte
- Unternehmensgröße: 2 Punkte
- Region: 1 Punkt
- ICP Score: 2 Punkte (wenn vorhanden)

Mindest-Score 3 für Match. Gleichstand: ältere Campaign gewinnt.

Ausschlüsse (immer, vor Matching):
Opt-out · Bestandskunde · Aktiver Deal · Gesperrte Domain

---

### #25 Lead → Deal Übergabe ✅
**Trigger: Kalender-Bestätigung (Termin gebucht)**

```
Kalender-Bestätigung eingeht
→ contact_status: in_campaign → pipeline
→ Sequence: pausiert (nicht gelöscht)
→ Deal: automatisch in Hunter, Stage: Demo vereinbart (Slug `demo_vereinbart`)
→ Meeting-Prep: automatisch generiert (prep_meeting())
→ Mein Tag: Zone 1 (heutiger Termin)
→ AI SDR: Lead in "Termine gebucht" Tab
```

Kein manueller Trigger nötig.

---

### #26 Reply Handling ✅
Kein eigener Posteingang-Screen. Kein Sidebar-Icon.
requires_human erscheint direkt in AI SDR Sequenz-Kachel.
Klick auf Lead-Zeile → Side Panel.

8 Reply-Typen (Priorität absteigend):
1. ⚡ Opt-out erkannt → sofort requires_human
2. ❌ Senden fehlgeschlagen → requires_human
3. ⚠ Antworten (<70% Confidence) → requires_human + Antwort-Preview
4. 🔀 In Pipeline? → AI schlägt vor, User bestätigt
5. 📅 Termin-Link senden → Auto wenn Confidence ≥ 70%
6. ◐ Bestätigen → AI-Entwurf wartet auf Freigabe
7. ⏸ Pausiert → User entscheidet
8. 🔄 Sequenz abgelaufen → Reaktivierungs-Pool

Zusätzliche Typen (aus v6):
9. 📭 Kontaktdaten fehlen → requires_human + Daten-Eingabe im Side Panel
10. ❌ Hard Bounce → Email ungültig, requires_human, kein Retry
11. ⚠ Soft Bounce → automatischer Retry (konfigurierbar, max. 3 Versuche)

---

### #27 Sherloq Signal Routing ✅
Kein eigener Sherloq-Screen in der Sidebar.

| Signal betrifft | Erscheint wo | Aktion |
|---|---|---|
| Neuer Lead (kein Deal, kein Kunde) | AI SDR → Campaign-Matching | Outreach startet |
| Schlafender Lead (ohne_campaign) | AI SDR → reaktiviert via Signal-Trigger | Semi-Bestätigung |
| Aktiver Deal in Pipeline | Hunter → Signal-Kachel | Empfehlung inline |
| Bestandskunde | Farmer → Signal-Kachel | Empfehlung inline |

Modul sherloq_signals: wenn inaktiv → nichts sichtbar, alles andere funktioniert.

---

### #28 Import-Flow ✅
3 Optionen beim Import, Default: "Nur speichern"

- **Automatisch zuordnen:** AI schlägt Campaign vor, User bestätigt
- **Selbst zuordnen:** alle in "Ohne Campaign"
- **Nur speichern (Standard):** kein Outreach, User entscheidet später

---

### #30 Contact Data Missing ✅
- sequence_status → requires_human, reason = contact_data_missing
- Badge in Lead-Zeile: 🔴 "Kontaktdaten fehlen"
- Side Panel: welche Daten fehlen + Eingabefelder + "Enrichment anfragen" (wenn Modul aktiv)
- Nach Eintragung: Sequence läuft automatisch weiter

---

### #31 Error Sending ✅
- Hard Bounce: Email dauerhaft als ungültig markieren, requires_human, kein Retry
- Soft Bounce: automatischer Retry nach X Stunden (konfigurierbar), max. 3 Versuche
- SMTP-Fehler: requires_human + Admin-Alert
- Bounce Rate Tracking: bei > Schwellenwert → Mailbox-Alert

---

### #32 Schlafende Leads via Sherloq-Signal ✅
- Leads mit contact_status = ohne_campaign werden via Sherloq-Signal reaktiviert
- Konfigurierbar: welche Signal-Typen lösen Outreach aus (Settings → Integrationen → Sherloq)
- Standard: Semi — User bestätigt bevor Sequence startet
- Mehrere Signale kurz hintereinander → nur einmal aktivieren

---

### #33 Dynamische AI-Anpassung ✅
AI erkennt Engagement-Signale und passt Rhythmus, Text, Kanal an.

Standard-Regeln (in sequence_rules JSONB, on/off per Regel):
- Mail 2x geöffnet, kein Reply → kürzere Mail + anderer CTA
- Mail 3x geöffnet, kein Reply → Kanalwechsel LinkedIn
- LinkedIn gesehen, kein Reply → andere Formulierung
- Kein Open nach 2 Mails → Betreff variieren
- Reaktion auf LinkedIn-Post → personalisierter Bezug

Alle Anpassungen in `lead.ai_adjustments[]` geloggt mit Begründung.
Maximum: 3 Anpassungen pro Lead → danach requires_human.
Sichtbar im UI: Badge "AI angepasst" in Lead-Zeile.

---

## BLOCK E — KONTAKTE & COMPANIES

### #21 Lead-Quellen ✅
Unterstützt in v1: Sherloq Signals (Webhook) + CSV Upload
Unterstützt in v2: CRM Import + Manuell

---

### #22 Companies-Zuordnung ✅
- Ein Kontakt = eine primäre Company
- Company-Wechsel → alte Zuordnung als "ehemalig" archiviert, nie gelöscht
- Company ohne Kontakte: bleibt erhalten (kein Auto-Delete)

---

### #23 Listen-Rechte ✅
- Team-Listen erstellen: **alle** (kein Admin-Gate)
- Dynamische Listen: **alle** · Filter-basiert, täglich neu berechnet + manuell auslösbar
- Max. Listen pro Workspace: **unbegrenzt** (sinnvoller Wert ggf. später)
**Status:** ✅ Entschieden (2026-06-11).

---

### #24 / #37 Platzhalter-Fallbacks ✅
Frei konfigurierbar pro Campaign (Settings → Campaign → Messaging Brief → Fallback-Werte)

- Pflichtfelder (vorname, company): Fallback aus Campaign-Config, nie leer senden
- Optionale Felder (signal, jobtitel): wenn leer → Platzhalter komplett entfernen
- Kein Fallback + Pflichtfeld leer → requires_human ("Platzhalter nicht auflösbar")

---

### Pflichtfelder ✅
**Kontakte:** Vorname + Nachname ODER LinkedIn URL (eines reicht). Email kein Pflichtfeld.
**Companies:** Nur Name.

---

### Duplikat-Erkennung ✅
- Hard Match: gleiche Email ODER gleiche LinkedIn URL → blockiert automatisch
- Soft Match: gleicher Name + gleiche Company → Warnung, User entscheidet
- Merge: primärer Datensatz bleibt, alle Aktivitäten/Deals/Tasks bleiben erhalten

---

## BLOCK F — PROVIDER & INTEGRATIONEN

### #17 Sending Provider 🔴 BLOCKIERT BUILD
- LinkedIn: Wahrscheinlich Unipile — noch nicht final
- Email: Gmail + Outlook via Nango (OAuth)
- Abstraktion: lib/sending.ts — Provider austauschbar ohne Code-Änderung

---

### #18 / #36 Kalender-Provider ✅
**Entschieden: Cal.com (selbst gehostet auf Vercel)**
- OAuth: Nango (Google Calendar + Microsoft 365)
- Branding: via Cal.com API aus Sales OS Branding-Settings
- Webhook: BOOKING_CREATED → validate_booking() → prep_meeting()
- Video-Provider Default: Teams oder Google Meet → **noch offen (#36b)**

---

### #38 Enrichment-Provider ✅
**Aktuell: Surfe. Interface: lib/enrichment.ts — Provider austauschbar**
- enrichContact(linkedin_url) · enrichCompany(domain)
- Nie vorhandene Daten überschreiben — nur leere Felder füllen
- Modul: optional zuschaltbar in Settings → Integrationen

---

### #19 CRM Sync ⚠
- HubSpot / Salesforce / Keines für v1 — **noch nicht entschieden**
- Sync-Richtung: Nur lesen / Bidirektional — **noch nicht entschieden**

---

### #34 Sherloq Datenfluss ⚠
Payload-Struktur definiert (Webhook bevorzugt), Abstimmung mit Sherloq noch offen.

Minimum-Payload:
```json
{
  "signal_type": "linkedin_post_liked",
  "contact": { "linkedin_url": "...", "email": "...", "name": "...", "company": "...", "job_title": "..." },
  "signal_data": { "timestamp": "...", "source_url": "...", "detail": "..." },
  "sherloq_contact_id": "..."
}
```

Contact-Matching: Primary Key = LinkedIn URL · Fallback = Email · Fallback = Name + Company (manuell)
Bidirektionalität (Sales OS → Sherloq Watchlist): **noch offen**

---

## BLOCK G — SYSTEM & PLATTFORM

### #6 Onboarding Nudge ✅
- Nach **3 Tagen** ohne Onboarding-Abschluss → automatische Nachricht (Kanal: **Email**, Automation-Level Semi)
- Nach **7 Tagen** ohne Response → interne Task für AM
**Status:** ✅ Entschieden (2026-06-11). Werte in `settings.thresholds`.

---

### #7 Meeting-Prep Inhalt ✅
Enthält (definiert in prep_meeting() Edge Function):
- Kurzakte des Kontakts (AI-generiert)
- Deal-History + Kommunikationshistorie
- Sherloq-Signale zum Kontakt
- Offene Tasks
- AI-vorgeschlagene Gesprächsagenda
- Key Points · Risiken · Chancen · Vorgeschlagene Fragen

---

### #8 Tagesplan — Mein Tag ✅
- Maximale Prioritäten: Top 5 (Zone 2)
- Priorisierung: Business Impact > Deadline > Feasibility
- Generiert täglich 07:00 Uhr via morning_briefing()
- Zeitblöcke: nein — nur Priorisierung, keine Zeitplanung

---

### #9 Persönlichkeitstypen ✅
**Kein DISG.** Drei actionable Dimensionen: Kommunikationsstil (Direkt ↔ Diplomatisch) ·
Entscheidungstyp (Daten-getrieben ↔ Bauchgefühl) · Tempo (Schnell ↔ Braucht Zeit).
Auto-Erstellung ab ≥3 Nachrichten (`analyze_personality()`), Confidence-Stufen <60/60–80/>80.
**Status:** ✅ Entschieden (2026-06-11). Details in CLAUDE.md → Persönlichkeitsprofil.

---

### #10 Cluster-Vererbung ✅
- Company wird Kunde → alle verknüpften Kontakte automatisch `contact_status = 'kunde'`
- **Einmalige** Bestätigung („X Kontakte werden zu Kunden — bestätigen?"), nicht pro Kontakt
- Subscription liegt auf Company-Ebene; Kontakt erbt von primärer Company (`primary_company_id`)
**Status:** ✅ Entschieden (2026-06-11).

---

### #35 Prompt-Map ✅
10 Prompt-Stellen, alle in Langfuse versioniert:

| # | Edge Function | Was |
|---|---|---|
| 1 | generate_message() | Personalisierte Nachricht |
| 2 | classify_intent() | Reply-Klassifizierung |
| 3 | generate_reply() | Antwort-Entwurf |
| 4 | prep_meeting() | Meeting-Briefing |
| 5 | morning_briefing() | Tages-Priorisierung |
| 6 | analyze_engagement() | Rhythmus-Anpassung |
| 7 | suggest_campaign() | Campaign-Vorschlag |
| 8 | resolve_placeholders() | Platzhalter auflösen |
| 9 | score_churn_risk() | Churn-Score |
| 10 | score_upsell() | Upsell-Score |

Hunter-Prompts + Farmer-Prompts: **noch nicht definiert**

---

### #39 Billing & Pläne 🔴
Welche Pläne, Limits pro Plan, Stripe-Integration — **komplett offen**

---

### Multi-Tenant Isolation ✅
Jede Provider-Konfiguration ist strikt an organization_id gebunden.
Keine globalen Zustände. syncBranding(organization_id) nur für eine Organization.

---

### Analytics-Platzierung ✅
Kein eigener Analytics-Screen. Kontextuell eingebettet:
- AI SDR: Campaign-Performance Tab
- Hunter: KPI-Kacheln (Pipeline-Wert, Deals in Gefahr, Signale, Follow-ups)
- Farmer: Churn-Rate, Upsell-Conversion, NPS-Trend Cards
- Companies: Sherloq Usage Block
- Mein Tag: nur Zahlen in Kacheln
- Settings → Reporting: Team-Performance (erst nach Kernfunktionen)

---

## ZUSAMMENFASSUNG — STATUS

### ✅ Entschieden
ICP Score · Intent-Schwellenwert · Automation Default · Risk-Level · Reaktivierungs-Pool · Campaign-Matching · Lead→Deal · Reply Handling · Sherloq Routing · Import-Flow · Contact Data Missing · Error Sending · Schlafende Leads · Dynamische AI-Anpassung · Companies-Zuordnung · Platzhalter-Fallbacks · Pflichtfelder · Duplikat-Erkennung · Cal.com · Enrichment (Surfe) · Lead-Quellen · Meeting-Prep Inhalt · Tagesplan · Prompt-Map · Multi-Tenant Isolation · Analytics-Platzierung
**+ neu entschieden 2026-06-11:** Pipeline-Stagnation Stages/Tage (#2) · Follow-up Timer Hunting (#3) · Churn-Gewichtung (#4) · Onboarding-Nudge (#6) · Persönlichkeitstypen (#9) · Cluster-Vererbung (#10) · Listen-Rechte (#23)

### ⚠ Offen (kein Build-Blocker)
Heat-Status Schwellenwerte (#1) · Upsell-Trigger Schwellenwerte (#5) · CRM Sync (#19) · Sherloq Bidirektional (#34) · Video-Provider Default (#36b) · Hunter/Farmer Prompts (#35)

### 🔴 Kritisch — blockiert Build/Live (2 Punkte)
- **Sending Provider** — Unipile final bestätigen
- **Billing & Pläne** — Stripe, Pläne, Limits

---

*Sales OS · Juni 2026 · Version 11 (Zusammenführung v1–v7)*
*Ab jetzt: NUR DIESE DATEI aktualisieren*
*Übergabe an Claude Code: zusammen mit CLAUDE.md zu Beginn von Phase 2*

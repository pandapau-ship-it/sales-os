# Sales OS — UI Interaktions-Dokumentation (Vollständig)
# Was wo angezeigt wird und was beim Klick passiert
# Version 14 · Juni 2026 — Zusammenführung v2 + v3 + v8 + v9
# Status: Wird laufend erweitert — immer diese Datei aktualisieren

---

## GRUNDPRINZIPIEN (immer einhalten)

1. **Progressive Disclosure** — 3 Ebenen: Zero Click → Ein Klick inline → Side Panel
2. **Actions immer inline** — nie Seitenwechsel für Aktionen
3. **Signal statt Daten** — jeder Datenpunkt hat eine Handlungsempfehlung
4. **Cmd+K** — Navigation und Schnellaktionen, KEIN AI-Chat
5. **Side Panel** öffnet sich von rechts — linke Liste bleibt sichtbar
6. **Kein Feld wird versteckt** — leere Felder zeigen "—" in Grau

---

## 1. HUNTING — Pipeline (Kanban)

### 1.1 Normale Pipeline-Karte

**Angezeigt (Zero Click):**
- Avatar + Name + Jobtitel
- ICP Score Ring (grün >75 / amber 50–74 / rot <50)
- Company Badge (dunkel, Logo + Name)
- Stage Badge (neutral grau)
- Heat Badge (Aktiv / Stabil / Rückläufig / Ruhend / Inaktiv)
- Letzter Kontakt "vor X Tagen"
- Tage in Stage (rot wenn Schwellenwert überschritten)
- Chevron Button (aufklappen) · Arrow Button (Side Panel öffnen)

**Klick Chevron → Ebene 2 klappt inline auf:**
- KI Kurzakte (3–5 Bullet Points)
- Aktionen: Mail · Task · Stage

**Klick Arrow → Side Panel öffnet sich von rechts (Ebene 3)**
→ Siehe Abschnitt 9: Side Panel / Drawer

---

### 1.2 Pipeline-Karte: Keine Task hinterlegt

**Trigger:** Deal hat keine offene Task in der DB

**Angezeigt zusätzlich:**
- Amber Action-Bar direkt unter der Kachel-Zeile
- Icon: ⚠️ · Text: "Keine Task hinterlegt — Pflicht" · Button: "Task anlegen"

**Wichtig:** Diese Task kann NICHT gelöscht werden — nur erledigt.

**Klick "Task anlegen" → Kachel klappt inline auf:**
- KI Vorschlag Box (grün, prominent oben)
- Kontakt (vorausgefüllt, readonly)
- Kanal (Buttons: Email · LinkedIn · Call · Meeting — AI-empfohlen vorausgewählt)
- Betreff / Titel (AI-vorgeschlagen, editierbar)
- Notiz (optional, Freitext)
- Fällig am (Datepicker, Standard: heute + 2 Tage)
- Priorität (Low · Medium · High · Urgent — Medium vorausgewählt)
- Button: "Task speichern" (primary, volle Breite)

**Nach "Task speichern":** Kachel klappt zu · Amber Action-Bar verschwindet

---

### 1.3 Pipeline-Karte: Deal stagniert

**Trigger:** Deal ist länger als X Tage in derselben Stage (konfigurierbar per Stage via settings.thresholds)

**Angezeigt zusätzlich:**
- Roter Action-Bar · Icon: 🕐 · Text: "Deal stagniert — [X]T in Stage" · Button: "Next Step"

**Klick "Next Step" → Kachel klappt inline auf:**
- KI Empfehlung (grün Box) — konkreter Vorschlag + Begründung + empfohlener Kanal
- Stage wechseln zu (Pills, nächste Stage vorausgewählt)
- Task erstellen (vorausgefüllt)
- Kanal (AI-empfohlen vorausgewählt)
- Button: "Speichern + Stage wechseln" (primary)

**Nach Speichern:** Karte springt in neue Stage via Realtime · Amber Action-Bar verschwindet

**Erscheint auch in:** Hunting Follow-ups Tab · Mein Tag Zone 2

---

### 1.3b Follow-up "Antwort erwartet"

```
☑ Antwort erwartet — Follow-up nach X Tagen
```
- Standard: AN (aktiv)
- X Tage = konfigurierbar via settings (Standard: 5 Tage)
- AN → Follow-up Timer startet nach Versand
- AUS → kein Timer, normale Dokumentation

---

### 1.3c Deal Lost — Modal beim Stage-Wechsel

**Trigger:** User zieht Karte in "Verloren" Stage oder wählt "Verloren" im Stage-Badge Dropdown

**Modal (blockierend, nicht weggeklickbar):**
- Lost Reason Pflichtfeld (Radio): Preis · Kein Bedarf · Wettbewerber · Timing · Kein Response · Anderer Grund
- Optionale Notiz
- "Abbrechen" (grau) · "Deal als verloren markieren →" (rot)

**Nach Bestätigung:** Deal Stage → "Verloren" · Deal archiviert (nicht gelöscht) · Lost Reason in Analytics

---

### 1.4 Stage-Kopf: "X Action" Button

**Trigger:** Mindestens eine Karte in Stage hat Action-Bar

**Klick "X Action":** Betroffene Karten klappen inline auf · andere werden ausgegraut

---

## 2. HUNTING — Navigation & Tabs

**Tab-Leiste:** Übersicht · Signals [X] · Neu in Pipeline · Leads [X] · Follow-ups [X] · Pipeline (Kanban)

**Klick Tab:** Liste darunter filtert entsprechend · Standard beim Öffnen: Tab mit höchster Dringlichkeit aktiv

---

## 3. HUNTING — Übersicht Tab

### 3.1 KPI-Kacheln (4 nebeneinander)

| Kachel | Inhalt | Farbe |
|---|---|---|
| Pipeline-Wert | Gesamtwert in € + Trend vs. Vormonat | Neutral |
| Deals in Gefahr | Anzahl stagnierter Deals + "Stagniert > X Tage" | Rot |
| Heiße Signale | Anzahl aktiver Signale heute | Teal |
| Follow-ups heute | Anzahl fälliger Follow-ups | Neutral |

Jede Kachel: weiß · border-radius 16px · weicher Schatten · Zahl 32px bold · Trend-Info 12px

### 3.2 Pipeline Funnel

Horizontaler Funnel — 5 Stages nebeneinander:
Lead → Demo → Proposal → Negotiation → Closed Won
Pro Stage: Anzahl Deals + Wert in €
Zwischen Stages: Pfeil → (Flow-Richtung)
Darunter: Conversion-Rates (Lead→Demo · Demo→Proposal · Proposal→Won)

### 3.3 Lead-Kacheln darunter

Zeigt dringendste Leads (Signale + Stagniert + Follow-up) — gleiche Kachel-Logik wie andere Tabs

---

## 4. HUNTING — Signal-Kacheln (aufklappbar)

Alle Signal-Kacheln: Progressive Disclosure — zugeklappt → aufgeklappt

### 4.1 LinkedIn Signal Kachel

**Zugeklappt:**
- Avatar + Name + Jobtitel · ICP Ring · Company Badge · Stage · Heat · Zeitangabe + "Xh left" · Arrow · Chevron
- Signal-Row (volle Breite): LinkedIn Badge + Action-Text + Hot-Timer-Balken + Mini-ICP

**Aufgeklappt:**
- Signal Banner (blau): LinkedIn Badge + Action-Text + Zeitangabe
- Kommentar-Box (grau): Replied-to Badge + Kommentartext
- KI Empfehlung (grün Box)
- Buttons: "Reply generieren" · "Original ansehen" · "Ignorieren"

### 4.2 Stagniert Kachel

**Zugeklappt:**
- Kontaktinfo · Stage rot · "12T in Stage ⚠"
- Signal-Row: 🕐 Stagniert Badge + Text + "Next Step" Button

**Aufgeklappt:**
- KI Empfehlung (grün)
- Stage wechseln zu (Pills)
- Task (vorausgefüllt)
- Buttons: "Speichern + Stage wechseln" · "Nur Task speichern" · "Ignorieren"

### 4.3 Keine Task Kachel

**Zugeklappt:**
- Kontaktinfo · "Neu in Pipeline"
- Signal-Row: ⚠ Keine Task Badge (amber) + Text + "Task anlegen" Button

**Aufgeklappt:**
- KI Vorschlag (grün) · Kontakt (readonly) · Kanal · Titel · Nachricht (optional) · Fällig am · Priorität
- Button: "Task speichern" (volle Breite)

### 4.4 Kalt Kachel

**Zugeklappt:**
- Kontaktinfo · Heat = Kalt · "32T in Stage ⚠"
- Signal-Row: ✏ Kalt Badge (blau) + Text + "Start Outreach" + "Snooze" Buttons

**Aufgeklappt:**
- KI Empfehlung (grün): warum kalt, Aufhänger für Reaktivierung
- Letzter Kontakt Info (Kanal · Datum · Sentiment)
- Kanal für Reaktivierung (LinkedIn DM vorausgewählt mit "✓ AI")
- Nachricht (AI-generiert, editierbar) · Follow-up Reminder (Datepicker)
- Buttons: "Outreach senden" · "Task erstellen" · "Snooze"

---

## 5. HUNTING — "Neu in Pipeline" Tab

**Wer erscheint hier:** Leads mit contact_status = pipeline, neu aus AI SDR übergeben
**Sortierung:** Neueste zuerst (nach deal.created_at)

### 5.0 New Leads Tab — Filter-Pills

[Ohne Sequenz X ●] [In Sequenz X]

**Tab "Ohne Sequenz":**
- Lead-Kachel: Avatar + Name + ICP + Company + Signal-Badge + Quelle-Tag
- Status: "Noch keine Sequenz" (amber pill)
- Button "Sequenz zuweisen" → klappt inline auf:
  - KI Empfehlung Box (grün): welche Sequenz + warum
  - Sequenz-Auswahl Pills
  - Automation-Level Toggle
  - Button: "Zuweisen & starten" (teal, volle Breite)

### 5.1 Kachel-Aufbau (zwei Zeilen)

**Zeile 1:**
- Avatar + Name + Jobtitel + Company · ICP Ring · Company Badge · Stage · Heat · "vor X Tagen · Neu in Pipeline" · Pfeil-Icon

**Zeile 2 (Vermerk, hellgrauer Hintergrund):**
- Herkunft: "Via AI SDR · Termin gebucht" ODER "Manuell hinzugefügt"
- Meeting-Prep Status: ✓ grün "Meeting-Prep bereit" ODER ⏳ amber "Meeting-Prep wird generiert"
- Termin wenn vorhanden: Kalender-Icon + "Demo · 12. Juni · 14:00"
- Primärer CTA Button rechts

**3 Varianten:**
1. Termin gebucht + Meeting-Prep bereit → Button: "Meeting-Prep ansehen →"
2. Termin gebucht + Meeting-Prep lädt → Button disabled + Spinner
3. Manuell hinzugefügt + kein Termin → Button: "Termin vereinbaren →"

Meeting-Prep Status: via Supabase Realtime — kein Polling, automatisch ohne Reload.

### 5.2 Klick-Verhalten

**Klick Pfeil-Icon:** Side Panel öffnet, Tab "Übersicht" aktiv
**Klick "Meeting-Prep ansehen →":** Side Panel öffnet direkt auf Tab "Meeting-Prep"
**Klick "Termin vereinbaren →":** generate_booking_link() → Link in Zwischenablage + Toast "Link kopiert" + Dropdown (LinkedIn / Email senden)
**Klick Stage Badge:** Inline Dropdown → Stage ändern → sofort in DB + audit_log

### 5.3 Webhook-Verhalten

**BOOKING_CANCELLED:**
- Kachel-Vermerk: ⚠ amber "Termin abgesagt"
- Button wechselt zu "Neuen Termin vereinbaren →"
- Mein Tag: "Termin mit [Name] wurde abgesagt"

**BOOKING_RESCHEDULED:**
- Termin-Datum aktualisiert sich automatisch
- Meeting-Prep neu generiert → Status kurz "Meeting-Prep wird aktualisiert..."
- Toast: "Termin verschoben — Meeting-Prep wird aktualisiert"

### 5.4 Kachel verschwindet wenn:
- User klickt Stage manuell weiter → wandert in Leads Tab
- Nach 7 Tagen automatisch → wandert in Leads Tab
- Deal als verloren markiert → verschwindet komplett

---

## 6. FARMING — Navigation & Kacheln

**Tab-Kacheln:**
```
[Signale]  [Churn & Trials]  [Upsell]
```
Gleiche Logik wie Hunting. Kunden-Liste nur über Cmd+K.

### 6.1 Nav-Kachel — Signale
- Zahl: neue Signale heute · Sub: Kanal-Split (3 LinkedIn · 2 Job-Wechsel)

### 6.2 Nav-Kachel — Churn & Trials
- Zahl: gefährdete Kunden gesamt
- Sub: "1 Kritisch · 2 Hoch · 2 Trial läuft ab"

### 6.3 Nav-Kachel — Upsell
- Zahl: offene Potenziale · ARR Upside: "+X.XXX EUR möglich"

---

## 7. FARMING — Signal-Kacheln (aufklappbar)

Gleiche Progressive Disclosure Logik wie Hunting.
Unterschied: SUBSCRIPTION statt STAGE Badge · CHURN RISK statt HEAT Badge

### 7.1 Upsell Potential Kachel

**Zugeklappt:**
- Kontaktinfo · Subscription · Heat
- Signal-Row: ✨ Upsell Potential Badge (grün) + Text + "Action" Button

**Aufgeklappt:**
- KI Empfehlung (grün) · Sherloq Usage Stats · Plan Vergleich (aktuell vs. empfohlen)
- Kanal (Call vorausgewählt)
- Buttons: "Upsell ansprechen" · "Task erstellen" · "Später"

### 7.2 Churn Risk Kachel

**Zugeklappt:**
- Kontaktinfo · Subscription Aktiv · Heat Ruhend
- Signal-Row: ⚠ Churn Risk Badge (rot) + Text + "Check-In buchen"
- Signal-Row Hintergrund: rot (#FFF5F5)

**Aufgeklappt:**
- KI Empfehlung (ROT — Dringlichkeit)
- Churn Signale Stats (Kein Login · Nutzung –X% · Sentiment · ARR at Risk)
- Nutzungsverlauf Mini-Balkendiagramm (letzte 4 Wochen)
- Kanal (Anruf vorausgewählt)
- Gesprächsvorbereitung (AI-Notiz, editierbar)
- Buttons: "Jetzt anrufen" (rot) · "Check-In Meeting buchen" · "Als bearbeitet markieren"

### 7.3 Trial läuft aus Kachel

**Zugeklappt:**
- Kontaktinfo · Subscription = Free Trial · Heat Hot · "vor X Stunde · 2T übrig"
- Signal-Row: ⚠ Trial läuft aus Badge (amber) + Text + "Abschluss sichern"

**Aufgeklappt:**
- KI Empfehlung (grün) · Trial Usage Stats · Timer Bar (visueller Countdown)
- Conversion Angebot (Starter vs. Growth — empfohlen markiert)
- Buttons: "Jetzt anrufen" · "Angebot per Email" · "Trial verlängern"

### 7.4 No Trial Upsell Kachel

**Trigger:** Trial abgelaufen ohne Conversion

**Zugeklappt:**
- Kontaktinfo · Subscription = Trial abgelaufen · "vor X Tagen · Trial abgelaufen ⚠"
- Signal-Row: ℹ No Trial Upsell Badge (ROT) + Text + "Jetzt konvertieren"
- Hintergrund: rot (#FFF5F5)

**Aufgeklappt:**
- KI Empfehlung (ROT — dringend)
- Trial Zusammenfassung Stats · Conversion Angebot (Starter · Growth · Enterprise)
- Buttons: "Jetzt anrufen" (rot) · "Angebot per Email" · "Snooze"

---

## 8. MEIN TAG — Vollständige Struktur

### 8.0 Zonen von oben nach unten

```
Morgenanalyse         → Teal Wash Banner, AI-generierter Fokus-Satz
Zone 1: Termine       → Kacheln nebeneinander (Grid)
Zone 2: Top 5         → Liste vertikal, nummeriert, AI-generiert
Zone 3: Überfällig    → Liste, immer über Zone 4
Zone 4: Heute fällig  → Liste, kompakter
Zone 5: Churn Warnings → noch zu designen
Zone 6: Upsell        → noch zu designen
Zone 7: Jira Alerts   → noch zu designen
```

### 8.0b Morgenanalyse Banner

**Position:** Ganz oben auf Mein Tag, vor Zone 1

**Design:** Teal Wash — `background: linear-gradient(135deg, rgba(23,82,83,0.07), rgba(63,131,131,0.04))` · Border: `0.5px solid rgba(23,82,83,0.15)`

**Aufbau:**
- Links: Sherloq AI Icon (teal, quadratisch abgerundet)
- Eyebrow: "MORGENANALYSE · SHERLOQ AI" (uppercase, teal, 10px)
- Text: AI-generierter Satz mit **Fett** für Schlüsselbegriffe (kursiv, 13px)
  Beispiel: "Heute **Logistify priorisieren** — Churn-Risiko kritisch. Danach **SLA an Christian Brand** absenden."
- Rechts: Refresh-Button (Neu generieren)

**Generiert:** Cron Job täglich 07:00 Uhr (morning_briefing()). Manuell neu generierbar via Refresh-Button.

### 8.1 Zone 1 — Termine heute

**Layout:** Grid, max. 3–4 Kacheln pro Reihe

**Termin-Kachel Aufbau:**
- Floating Arrow-Button oben rechts → öffnet Side Panel
- Oben: Avatar + Name + Company
- Mitte: Meeting-App-Icon + Titel + Uhrzeit
- Status-Badge: ⚠ Keine Vorbereitung (rot) ODER ✓ Vorbereitet (grün)
- Footer: kontextuelle Aktionen

**Footer-Aktionen — 3 Zustände:**

| Zustand | Links | Mitte | Rechts |
|---|---|---|---|
| Keine Vorbereitung | ✨ Prep Meeting (Gradient) | ✉️ Mail | — |
| Vorbereitet | Prep ansehen (ghost) | ✉️ Mail | ▶ Beitreten / 📞 (dunkel) |
| Läuft gerade | ▶ Beitreten (Gradient) | ✉️ Mail | — |

**Regeln:** Stage nur als nicht-klickbares Badge · Mail immer vorhanden · Max. 3 Footer-Elemente

**Klick "✨ Prep Meeting" → Meeting-Prep Panel öffnet inline:**
- Kontakt-Snapshot · Kurzakte · Deal-Status · Offene Tasks · AI-Gesprächsagenda · Personalisierter Einstieg

**Klick "▶ Beitreten":** Meeting-Link öffnet direkt
**Klick ✉️ Mail:** Inline Mail-Composer öffnet unter der Kachel

---

### 8.2 Zone 2 — Top 5 Prioritäten

**Generiert:** Cron Job täglich 07:00 Uhr (morning_briefing())
**Priorisierung:** Business Impact > Deadline > Feasibility

| Rang | Typ | Farbe | Trigger |
|---|---|---|---|
| 0 | AI SDR requires_human | Rot #E03131 | Antwort/Bounce/Opt-out im AI SDR — höchste Priorität |
| 1 | Churn Risk | Rot #E24B4A | churn_risk_level = high/critical |
| 2 | Follow-up fällig | Orange #DD6B20 | Keine Antwort seit X Tagen |
| 3 | Stage stagniert | Rot #E53E3E | Deal > X Tage in Stage |
| 4 | Kontakt wird kalt | Blau #3182CE | Heat wechselt auf Ruhend |
| 5 | Onboarding offen | Orange-Rot #E8590C | Free Trial, kein Onboarding |
| 6* | Termin-Link senden | Teal #175253 | Interesse erkannt in AI SDR |
| 7* | Upsell Potential | Lila #8B5CF6 | expansion_signal = true |
| 8* | LinkedIn Signal | Orange #DD6B20 | Post/Kommentar/Reaktion |
| 9 | Sequenz abgeschlossen | Grau | Kein Response nach letztem Step |

*Füllen Top 5 auf wenn keine Aktions-Signale mehr vorhanden
Rang 0 erscheint immer als erstes wenn vorhanden — verdrängt andere

**Aufbau jeder Prioritäts-Kachel:**
- Linker Farbstreifen · Nummer (1–5) · Typ-Badge · Name + Company · Arrow → Side Panel
- AI-Begründung (2–3 Sätze, immer sichtbar)
- Kontextueller CTA (primär, Gradient) · "Später" (ghost)

**CTA je Typ:**

| Typ | CTA |
|---|---|
| Churn Risk | Jetzt anrufen |
| Follow-up fällig | LinkedIn DM oder Email |
| Stage stagniert | Stage voranbringen |
| Kontakt wird kalt | Reaktivieren |
| Onboarding offen | Outreach senden |
| Upsell Potential | Upsell ansprechen |
| LinkedIn Signal | Jetzt antworten |

**Klick "Später":** Signal verschwindet heute · erscheint morgen wenn noch relevant

---

### 8.3 Zone 3 — Überfällige Tasks

**Trigger:** due_date < heute, status = open · Reihenfolge: älteste zuerst · Immer über Zone 4

**Aufbau:**
- Linker Farbstreifen: Rot
- Kanal-Icon (farbig): LinkedIn / Email / Telefon / Meeting / WhatsApp
- Name + Company · Badge: "X Tage überfällig" (rot) + Kanal (grau)
- Beschreibungs-Box (grün): nur wenn Beschreibung vorhanden
- Aktionen: Snooze · Bearbeiten · Arrow → · ✓ Erledigt

**Klick Snooze:** Datepicker erscheint inline
**Klick Bearbeiten:** Task-Felder klappen inline auf
**Klick Arrow →:** Side Panel öffnet direkt auf Task-Tab
**Klick ✓ Erledigt:** Task verschwindet sofort

---

### 8.4 Zone 4 — Heute fällige Tasks

Identisch Zone 3, aber:
- Linker Farbstreifen: Grün
- Badge: "Heute" (grün) statt Überfällig

---

### 8.5–8.7 Zonen 5–7 — noch zu designen

- Zone 5: Churn Warnings (churn_risk_level = high/critical)
- Zone 6: Upsell Potenziale (expansion_signal = true)
- Zone 7: Jira Alerts (blocked, überfällig, kein Assignee)

---

## 9. SIDE PANEL / DRAWER — Kontakt Detail

**Öffnet sich:** Von rechts · Trigger: Klick Arrow in jeder Kachel

### 9.1 Header (fixiert, scrollt nicht weg)

- Avatar (40px) + Name (16px bold) + Jobtitel + Company (teal)
- ICP Badge · Heat Badge · Stage Badge · Kontakt-Schnellinfos (Email · LinkedIn · Telefon)
- Aktionen: Mail · LinkedIn · Task · Notiz · X-Button

### 9.2 Drawer — Hunting (Tabs: Übersicht · Meeting-Prep · Aktivität · Tasks · Notizen)

**Tab Übersicht (scrollbar):**
1. KI Kurzakte (3–5 Bullet Points, AI-generiert)
2. Deal Details (Stage · Probability · ARR · MRR · Tage in Stage)
3. Offene Tasks
4. Active Sequence (Schritt X von Y)
5. Kommunikations-Timeline (klickbar)

**Tab Meeting-Prep:**
- AI-generiertes Briefing: Summary · Key Points · Risiken · Chancen · Vorgeschlagene Fragen
- Button: "Meeting-Prep neu generieren"

**Kommunikations-Timeline:**
- Hover → Tooltip: Kanal · Datum · Sentiment · 1 Zeile Preview
- Klick → aufgeklappt: AI-Zusammenfassung + Sentiment + "Vollständig lesen"
- "Vollständig lesen" → Modal mit vollständigem Text

### 9.3 Drawer — Farming

**Header:** zusätzlich "Usage ansehen" Button

**Bereiche (scrollbar):**
1. KI Kurzakte
2. Sherloq Usage (Last Login · Last Usage · Enrichments · Messages · Posts · Onboarding)
3. Subscription (Plan · Status · Aktiv seit · Nächste Zahlung)
4. Churn Risk (Level + AI-Begründung)
5. Upsell Potential (nur wenn Signal vorhanden)
6. Offene Tasks
7. Kommunikations-Timeline

---

## 10. AI SDR — Screen vollständig

### 10.0 Navigation & Header

- Icon 🤖 in linker Sidebar — nur sichtbar wenn Modul ai_sdr aktiv
- Header: Teal Wash Banner
  - Hintergrund: rgba(23,82,83,0.06) · Border: rgba(23,82,83,0.12)
  - Links: 🤖 "AI SDR · SHERLOQ" (10px uppercase teal)
  - Text: "34 Leads aktiv · 2 brauchen dich jetzt · 5 Termine diese Woche"
  - Rechts: Gesamt-Automation-Toggle (Manual / Semi / Auto) — gilt als Default für alle Sequenzen

### 10.1 3 Nav-Kacheln

Leads gefunden · Outreach aktiv · Termine gebucht
(gleiche Logik wie Hunting/Farming Nav-Kacheln)

### 10.2 Sequenz-Filter-Leiste (unter Nav-Kacheln)

Pills: [Alle 34] [Cold LinkedIn 12 ●] [Demo Follow-up 8] [Reaktivierung 9] [Trial 5]
Rechts: [+ Neue Sequenz] Button
Roter Dot auf Pill = requires_human in dieser Sequenz

### 10.3 Sequenz-Kachel (zugeklappt)

- Header: [Sequenz-Name] [Roter Dot wenn requires_human] [Alle X →] [Manual] [Semi] [● Auto] [∧]
- Subtext: "X Leads aktiv · Y Schritte · Kanal1 + Kanal2"

### 10.4 Sequenz-Kachel (aufgeklappt)

- Schritt-Timeline: [Kanal-Icon] → Tag X → [Kanal-Icon] → ...
- Zeigt NUR Leads mit Handlungsbedarf (Standard-Ansicht)
  - Sortierung: ⚠ Antworten (rot) → ◐ Bestätigen (amber) → → Follow-up (orange) → 📅 Termin (teal)
  - Leads mit Gesendet/Gelesen/Wartet erscheinen NICHT in Standard-Ansicht

- Klick "Alle X →": expandiert, zeigt alle Leads
  - Filter-Pills: [Alle X] [⚠ Handlung nötig Y] [🤖 AI läuft Z]
  - Handlung nötig: farbiger Border links + farbiger Hintergrund
  - AI läuft: kein Border + opacity 0.7

### 10.5 Lead-Zeile Aufbau (in Sequenz-Kachel)

```
[Avatar] [Name + Company] [ICP Donut] [Schritt X: Kanal-Icon Name] [Status EIN WORT] [Toggle] [Arrow]
```

Status-Wörter und Farben:
- ⚠ Antworten → rot #E03131
- ◐ Bestätigen → amber #D97706
- → Follow-up → orange #E8590C
- 📅 Termin senden → teal #175253
- ● Gesendet → grau (nur bei "Alle ansehen")
- ● Gelesen → grau (nur bei "Alle ansehen")
- ● Verbunden → grau (nur bei "Alle ansehen")

Arrow-Button:
- ↗ farbig (Statusfarbe) = Handlung nötig → Side Panel öffnet
- → grau = AI läuft → Side Panel (Info only)

Side Panel öffnet sich NUR bei Klick auf Arrow. Nie automatisch.
Liste verschmälert sich auf ~60% wenn Panel offen.

### 10.6 Inbox Intelligence (Kanalübergreifend)

Erscheint unter Sequenz-Kacheln wenn Outreach-Tab aktiv.
Alle Antworten aller Sequenzen in einem Feed.
Sortierung: Unklar (rot) oben → Interessiert → Frage → Nicht interessiert

Eintrag-Aufbau:
- Kanal-Icon im Kreis (LinkedIn blau, Mail grün)
- Name + Company · Antwort-Preview (eine Zeile) · Intent-Badge · Zeit rechts
- CTA inline je Intent:
  - Interessiert → [Termin-Link senden] (teal)
  - Frage → [AI antwortet] (teal) · [Selbst antworten] (ghost)
  - Unklar → [Antworten] (rot, prominent)
  - Nicht interessiert → [Schließen] (grau)

Klick auf Eintrag → Side Panel (gleiche Logik wie Lead-Pfeil)

### 10.7 Termine gebucht Tab

Kompakte Liste:
- Avatar + Name + Company
- Datum + Uhrzeit (prominent)
- Meeting-Typ Badge (Zoom / Teams / Call)
- Meeting-Prep Status: "✓ Vorbereitet" (grün) oder "⚠ Noch nicht" (amber)
- Buttons: [Prep ansehen] oder [Prep generieren]

### 10.8 Durchgelaufene Sequenzen

Wenn Sequenz abgeschlossen ohne Response:
- Notification in Mein Tag: "X Leads haben nicht reagiert"
- Buttons: [Reaktivieren] [Archivieren] [Ansehen]
- Nie löschen — immer in DB
- Bei neuem Signal → taucht automatisch wieder auf

### 10.9 Sequenz-Zuweisung — Regelwerk

Standard-Regeln (konfigurierbar in Settings → sequence_rules):
- Signal = LinkedIn Post/Kommentar → Cold LinkedIn Outreach
- Signal = Trial abgelaufen → Trial Conversion
- Letzter Kontakt >60 Tage → Reaktivierung
- Inbound / Demo-Anfrage → Demo Follow-up
- ICP < 50 → KEINE Sequenz (in New Leads "Ohne Sequenz")
- Default → Cold LinkedIn Outreach

User-erstellte Sequenzen:
- AI erkennt anhand Name + Beschreibung welche Kategorie
- Schlägt Zuweisung vor → User bestätigt
- Oder: manuell zuweisen (inline in New Leads Tab)

---

## 11. AI SDR — Side Panel (alle Varianten)

Side Panel öffnet sich wenn Lead-Zeile in AI SDR Sequenz-Kachel geklickt wird.

**Panel Header (fixiert):**
- Avatar + Name + Company + ICP Badge
- Kontaktdaten: LinkedIn URL · Email (klickbar) · falls fehlend: "Keine Email" in Grau + Edit-Icon
- Tab-Leiste: Sequenz (aktiv) · Aktivität (bald) · Notizen (bald)

**Timeline:** vergangene Schritte (aufklappbar) · aktiver Schritt (pulsierend) · zukünftige Schritte (ausgegraut)

### Variante 1: Email Antworten
1. Eingehende Antwort (grauer Box)
2. AI-Einschätzung (teal Box) + Intent + Confidence Score
3. Email Composer: Subject · Textarea · Toolbar · "AI neu generieren" + "Email senden"
4. Secondary: "Bearbeiten" · "Pausieren"

### Variante 2: LinkedIn DM senden
1. Letzter Touchpoint (grauer Box)
2. AI-Einschätzung (teal Box)
3. LinkedIn Chat-Style Composer: blauer Header + Chat-Bubble + "AI neu generieren" + "Absenden"
4. Secondary: "Bearbeiten" · "Überspringen"

### Variante 3: Termin-Link senden
1. Kontext (grauer Box)
2. AI-Einschätzung: "Empfehlung: Termin-Link senden · Confidence X%"
3. Kalender-Link Composer: Vorschau-Kachel + Begleitnachricht
4. Button: "Termin-Link senden" · Secondary: "Anderen Link" · "Überspringen"

### Variante 4: Lead in Pipeline verschieben
1. Signal (grauer Box)
2. AI-Vorschlag: Stage + Confidence
3. Deal-Konfiguration: Name · Stage Dropdown · optionaler Wert
4. Button: "Deal anlegen & Sequence pausieren" · Secondary: "Sequence fortsetzen"

### Variante 5: Opt-out erkannt
1. Erkannte Aussage (roter Box) + "OPT-OUT ERKANNT"
2. AI-Bestätigung + Confidence
3. Pflichtaktionen (nicht überspringbar): Sequences stoppen + Opt-out markieren
4. Einziger Button: "Opt-out bestätigen" (rot) · Hinweis: DSGVO-konform

### Variante 6: Kontaktdaten fehlen
1. Warnung (amber Box): "KONTAKTDATEN FEHLEN" + welche Daten fehlen
2. Eingabefelder: Email / LinkedIn URL · Link: "Enrichment-API anfragen →"
3. Button: "Speichern & Sequence fortsetzen" · Secondary: "Schritt überspringen" · "Archivieren"

### Variante 7: Sendefehler (Bounce)
1. Fehler-Box (rot): "SENDEFEHLER" + technische Fehlermeldung
2. Klassifizierung: Hard Bounce (rot) ODER Soft Bounce (amber)
3. Hard Bounce: Alternative Email eingeben · "Erneut versuchen" ODER "Archivieren"
4. Soft Bounce: "Automatischer Retry in 4h geplant" · "Jetzt manuell versuchen"

**Panel Footer (sticky, nur bei requires_human):**
- Links: Sequence-Mini-Chain (Kanal-Icons mit Status-Farben)
- Rechts: Primärer Action-Button passend zum Typ

---

## 11. KONTAKTE — Listenansicht

### 11.1 Spalten

- Checkbox (Bulk-Aktionen)
- Avatar + Name (bold) + Jobtitel (grau) + Company (grau, kleiner)
- Lead Source Badge: CRM / Upload / Manuell / Sherloq
- Status Badge: In Campaign (teal) · Pipeline (blau) · Kunde (grün) · Archiviert (grau)
- Letzter Kontakt: "vor X Tagen · Email Antwort"
- ICP Score Ring + Zahl (grün ≥75 / amber 50–74 / rot <50)
- Routing-Hinweis: "Im AI SDR →" / "In Hunter →" / "In Farmer →"
- Pfeil-Icon → öffnet Side Panel

**Klick auf Zeile:** Side Panel öffnet rechts
**Klick auf Routing-Pfeil:** navigiert direkt zum Screen

### 11.2 Filter-Pills

Alle · In Campaign · Pipeline · Kunde · Archiviert · Opt-out
Quelle: Sherloq · CSV · CRM · Manuell
ICP: >75 · 50–74 · <50

### 11.3 Bulk-Aktionen (erscheinen wenn Checkbox aktiv)

Campaign zuweisen · Tag setzen · Archivieren · Export (CSV)

---

## 12. KONTAKTE — Inline-Editing (alle Felder)

1. Klick auf Feldwert → sofort Input (kein Modal)
2. Speichern: automatisch onBlur
3. Erfolg: kurzes grünes Checkmark-Flash
4. Fehler: rotes Inline-Feedback unter dem Feld

**Leere Felder:** "—" in #9CA3AF · bei Hover: Edit-Icon erscheint
**Systemfelder:** Hintergrund #F3F4F6 · kein Hover-Effect · kein Edit-Icon · Tooltip: "Vom System vergeben"
**Pflichtfelder leer:** amber Unterstreichung (#F59E0B) · Tooltip: "Pflichtfeld — bitte ausfüllen"

---

## 13. DUPLIKAT-ERKENNUNG — UI-Verhalten

### Beim manuellen Anlegen

**Hard Match (Email oder LinkedIn URL):**
- Prüfung: onBlur nach dem Feld
- Rote Inline-Meldung: "⚠ Kontakt existiert bereits — [Name] bei [Company]"
- Link: "Kontakt öffnen →" · Save-Button disabled

**Soft Match (Name + Company):**
- Gelber Banner oben: "Mögliches Duplikat: [Name] bei [Company] existiert bereits"
- Buttons: "Bestehenden anzeigen" | "Trotzdem anlegen" · Save-Button bleibt aktiv

### Beim CSV-Import

- Import-Review Screen: Spalte "Duplikat erkannt" + amber Badge
- Dropdown pro Zeile: "Überspringen" | "Zusammenführen" | "Trotzdem importieren"

### Kontakte Screen — "Duplikate verwalten"

Zugang: Kontakte → Actions → "Duplikate verwalten"
- Paare nebeneinander + Ähnlichkeits-Indikator
- "Zusammenführen" → Merge-Dialog: beide Records, User wählt pro Feld welcher Wert bleibt
- "Kein Duplikat" → ablehnen

---

## 14. COMPANIES — Listenansicht

**Spalten:**
- Checkbox · Company Logo (40px, Buchstaben-Fallback) + Name + Domain
- Branche Badge · Größe Badge · Kontakte-Anzahl · Letzter Kontakt · Stadt / Land
- Pfeil → öffnet Company-Detailseite (volle Seite)

**Filter-Pills:** Alle · Nach Branche · Nach Größe · Nach Land · Mit Deals · Ohne Kontakte

**Bulk-Aktionen:** Tag setzen · Export · Archivieren

---

## 15. COMPANIES — Side Panel (Schnell-Überblick)

Öffnet sich wenn User auf Company-Name in Kontakte-Liste klickt (nicht volle Detailseite).

**Header:** Logo + Name + Domain · Branche + Größe + Land als Chips

**4 Blöcke:**
1. Kontakte (max 5 Zeilen + "+ X weitere →")
2. Offene Deals (falls vorhanden)
3. Letzte Aktivität (letzte 3 Touchpoints)
4. Tags + Notizen (inline editierbar)

**Footer (sticky):** "Vollständiges Profil öffnen →" (Primary)

---

## 16. ANALYTICS — PLATZIERUNG

Kein eigener Analytics-Screen in der Navigation.

| Screen | Analytics-Element |
|---|---|
| AI SDR | Tab "Performance": Öffnungsrate, Antwortrate, Conversion, Bounce Rate |
| Hunter | Eingebettete KPI-Kacheln: Pipeline-Wert, Deals in Gefahr, Signale, Follow-ups |
| Farmer | Cards: Churn-Rate, Upsell-Conversion, NPS-Trend |
| Companies-Detailseite | Sherloq Usage Block + Subscription Block |
| Mein Tag | Keine Charts — nur Zahlen in Kacheln |
| Settings → Reporting | Team-Performance, Gesamt-Pipeline, Billing-Usage (erst nach Kernfunktionen) |

---

## 17. NAVIGATION — Vollständige Struktur

### 17.1 Top-Navigation

```
Mein Tag  ·  Sherloq AI SDR  ·  Hunting  ·  Farming
```

### 17.2 Linke Sidebar (56px, max 8 Icons)

```
☀  Mein Tag
🤖  AI SDR
🎯  Hunter
🌱  Farmer
──────────
👥  Kontakte
🏢  Companies
──────────
⚙  Einstellungen
👤  Profil / Avatar
```

Kein Posteingang-Icon. Integrationen nur wenn Modul aktiv.

### 17.3 Cmd+K

- Navigation zwischen Screens
- Suche nach Kontakten / Companies / Deals
- Tasks abrufen (heute / überfällig / alle)
- Kunden-Liste (Farming)
- Neue Kontakte / Tasks / Deals anlegen
- KEIN AI-Chat — das ist ein separates Interface

---

## 18. TASK-TYPEN — vollständige Liste

| Task Typ | Source | Löschbar? | Wo angezeigt |
|---|---|---|---|
| Keine Task hinterlegt | system_notable | ❌ nur erledigen | Hunting Follow-ups |
| Deal stagniert | system_stagnation | ✅ | Hunting Follow-ups + Mein Tag Zone 2 |
| Kein Follow-up | system_followup | ✅ | Hunting Follow-ups + Mein Tag Zone 2 |
| Kein erster Outreach | system_outreach | ✅ | Hunting New Leads + Mein Tag Zone 2 |
| Demo ohne Prep | system_meeting | ✅ | Mein Tag Zone 1 |
| Deal Lost Grund fehlt | system_lost | ❌ nur erledigen | Modal beim Stage-Wechsel |
| Kontakt kalt | system_heat | ✅ | Hunting Follow-ups + Mein Tag Zone 2 |
| Churn Risk | system_churn | ✅ | Farming Churn & Trials + Mein Tag Zone 2 |
| Trial läuft ab | system_trial | ✅ | Farming Churn & Trials + Mein Tag Zone 2 |
| No Trial Upsell | system_no_trial | ✅ | Farming Churn & Trials + Mein Tag Zone 2 |
| Upsell Potential | system_upsell | ✅ | Farming Upsell + Mein Tag Zone 2 |
| Manuell erstellt | manual | ✅ | Mein Tag Zone 3 + 4 |
| Contact Data Missing | system_contact | ❌ nur erledigen | AI SDR Sequenz-Kachel |
| Hard Bounce | system_bounce | ❌ nur erledigen | AI SDR Sequenz-Kachel |
| requires_human (AI SDR) | system_ai_sdr | ❌ nur erledigen | AI SDR Sequenz-Kachel + Mein Tag Zone 2 Rang 0 |
| Sequenz abgeschlossen ohne Response | system_seq_done | ✅ | Mein Tag Notification + Reaktivierungs-Pool |

---

## 19. TASK-LOGIK — Wo erscheinen Tasks

**Grundregel:**
- Manuelle Tasks → Mein Tag Zone 3 + 4
- System-Tasks → Mein Tag Zone 2 als Prioritäts-Signal
- AI SDR Tasks (requires_human) → AI SDR Sequenz-Kachel, nie in Mein Tag

**Was NICHT in Mein Tag erscheint:**
- Tasks erst morgen oder später fällig
- Normale Pipeline-Aktivitäten ohne Signal
- AI SDR requires_human Items (erscheinen im AI SDR)

---

## 20. UX-ENTSCHEIDUNGEN

- App-Hintergrund: #F8F9FA — nie reinweiß
- Karten: #FFFFFF — schweben auf grauem Hintergrund
- Kacheln = Navigation + Mini-Dashboard in einem
- Max. 4 Kacheln pro Bereich
- Posteingang: kein eigener Screen — requires_human inline im AI SDR
- Reporting: Settings → Reporting (erst nach Kernfunktionen)

---

## 21. OFFENE PUNKTE

- [ ] Schwellenwert Tage bis "Deal stagniert" — pro Stage → in sales_os_regeln_ausfuellen.md
- [ ] Schwellenwert Tage bis "Kein Follow-up" Alert → in sales_os_regeln_ausfuellen.md
- [ ] Follow-up "Antwort erwartet" — Standard an oder aus?
- [ ] Deal gewonnen → Free Trial → Farming Übergabe Logik
- [ ] Rollen & Rechte Matrix — noch nicht definiert

---

## 22. SIDE PANEL — ZWEI PANEL-TYPEN

### 22.1 Info Panel (Klick auf Pfeil in Profilzeile)

**Zweck:** Kontext und Überblick — wer ist dieser Mensch, was ist der Stand?
**Öffnet sich:** Klick auf Pfeil-Icon (→) rechts in jeder Kachel
**Breite:** 820px
**Layout:** Zweispaltig oben, volle Breite unten

**Tabs:** Übersicht · Kommunikation · Aktivität · Tasks · Notizen

**Hunter Info Panel — Übersicht Tab Inhalt:**
1. KI Kurzakte (teal Hintergrund)
2. Aktive Signale (Hinweis-Badges mit Links zu Action Panel)
3. Deal Setup (Stage · Probability · ARR · MRR · Laufzeit · In Stage seit)
4. Offene Tasks (mit Checkboxen, + Task hinzufügen)
5. Active Sequence (Chain-Visualisierung Schritt X von Y)
6. Kommunikation (aufklappbare Timeline)

**Farmer Info Panel — Übersicht Tab Inhalt:**
1. KI Kurzakte
2. Aktive Signale (Churn Risk · Upsell · LinkedIn Signal)
3. Sherloq Usage (3x2 Grid: Last Login · Usage · Profiles · Messages · Enrichments · Onboarding)
4. Subscription (Plan · Status · Aktiv seit · Nächste Zahlung)
5. Offene Tasks
6. Churn Risk (Badge + AI-Begründung + Datenquelle)
7. Upsell Potential (nur wenn Signal — grüner linker Rand)
8. Kommunikation

**Kommunikations-Tab (beide Panels identisch):**
- Chronologische Liste aller Touchpoints
- Pro Eintrag: Kanal-Icon + Titel + Zeitangabe + Preview
- "Klicken zum Lesen" → aufklappbar
- Aufgeklappt: vollständiges Transcript (Meeting) oder vollständige Email
- Status-Badge: "Keine Antwort ⚠" (amber) · "Beantwortet ✓" (grün)

**Footer (fixiert):**
+ Task · ✉ Mail · LinkedIn · 📎 Notiz · 📊 Usage ansehen

---

### 22.2 Action Panel (Klick auf CTA in Signal-Zeile)

**Zweck:** Jetzt handeln — AI schlägt vor, User bestätigt oder passt an
**Öffnet sich:** Klick auf "Next Step →" · "Jetzt handeln →" · "Task anlegen →" etc.
**Breite:** 580px
**Layout:** Einspaltiger Scroll

**Header (kompakt, 70px):**
- Avatar (40px) + Name + Company + Kontext-Badge (Stage / Churn Risk / Heat etc.)
- X-Button rechts

**Nach Aktion:**
- Panel schließt automatisch
- Toast erscheint unten rechts (grün): "✓ [Aktion] erfolgreich"
- Badge in Kachel verschwindet oder aktualisiert sich
- Realtime-Update in Liste ohne Reload

**7 Action Panel Varianten:**

| Variante | Trigger | Primäre Aktion |
|---|---|---|
| Signals | "Ansehen →" bei LinkedIn Signal | AI-Nachricht auf LinkedIn senden |
| Stagniert | "Next Step →" | Nachricht senden + Stage wechseln |
| Churn Risk | "Retention sichern →" | Anrufen mit AI-Gesprächsvorbereitung |
| Upsell | "Upsell ansprechen →" | Ansprechen mit Plan-Vergleich |
| Trial läuft aus | "Abschluss sichern →" | Anrufen mit Conversion-Angebot |
| Kalt | "Start Outreach →" | Reaktivierungs-Nachricht senden |
| Keine Task | "Task anlegen →" | Task-Formular direkt offen |

---

## 23. TASK ERSTELLEN — MODAL

**Öffnet sich:** Überall wo "+ Task" oder "Task anlegen" geklickt wird

**Breite:** 560px Modal · border-radius 20px

**Felder:**
1. KI Vorschlag Block (nur wenn Kontext — grün, ausblendbar)
2. Titel (Pflicht) — Freitext
3. Kontakt (Dropdown, readonly wenn aus Kontext) + Deal (optional)
4. Kanal — Email · LinkedIn · Anruf · Meeting · Intern (Pills)
5. Beschreibung (optional, Textarea)
6. Fällig am (Datepicker) + Uhrzeit (Time-Picker)
7. Priorität (Low · Medium · High · Urgent) + Assignee (Dropdown)
8. Erinnerung (Dropdown) + Wiederholung (Dropdown)
9. Verknüpfung (Campaign · Sequence · Notiz — optional)

**Nach Speichern:** Modal schließt · Toast "Task gespeichert ✓" · Realtime-Update

**Zwei Zustände:**
- Leer (manuell geöffnet): kein KI-Block, alle Felder leer bis auf Defaults
- Mit Kontext (aus Action Panel): KI-Block sichtbar, Kontakt + Titel vorausgefüllt

---

## 24. HEAT-STATUS — TASK-HINWEIS IN KACHEL

Wenn Kontakt Heat = Kalt/Tot, zeigt die Kachel zusätzlich zum Heat-Badge einen Task-Hinweis:

**Fall 1 — Task vorhanden, noch nicht fällig:**
- Heat Badge: "● Kalt" (blau)
- Daneben (12px, grau): "Task geplant für [Datum]"

**Fall 2 — Task vorhanden, überfällig:**
- Heat Badge: "● Kalt" (blau)
- Daneben (12px, rot): "Task überfällig seit [X]T ⚠"

**Fall 3 — Keine Task:**
- Heat Badge: "● Kalt" (blau)
- Daneben (12px, grau): "Kein Follow-up geplant · Task anlegen →"

Gilt für: Hunter Kacheln · Follow-ups Tab · Mein Tag Zone 2
Wichtig: Task pausiert Heat NICHT — Heat läuft immer unabhängig.

---

## 25. PIPELINE STAGNATION — ANZEIGE IN KACHEL

Wenn Deal länger als Schwellenwert in Stage:

**Fall 1 — Stagniert, keine Task:**
- "12T in Stage ⚠" (rot)
- Daneben: "Kein Follow-up geplant · Task anlegen →" (grau)

**Fall 2 — Stagniert, Task noch nicht fällig:**
- "12T in Stage ⚠" (rot)
- Daneben: "Task geplant für [Datum]" (grau, 12px)

**Fall 3 — Stagniert, Task überfällig:**
- "12T in Stage ⚠" (rot)
- Daneben: "Task überfällig seit [X]T ⚠" (rot)

Gilt für: Hunter Pipeline Kanban · Follow-ups Tab · Mein Tag Zone 2

---

## 26. CHURN RISK & UPSELL — HOVER-TOOLTIP

Überall wo ein Churn Risk oder Upsell Score angezeigt wird (Farmer Kachel · Info Panel · Customer Health Overview · Mein Tag), zeigt Hover einen Tooltip mit den Einzelwerten.

**Tooltip (280px, weiße Card, border-radius 12px, Schatten):**

```
CHURN RISK: HIGH (73 Punkte)
basiert auf: Kommunikation · Aktivität · Sherloq

● Letzter Kontakt vor 18 Tagen          +20 Pkt
● Kein Reply auf letzte 2 Mails          +15 Pkt
● Heat Status: Kalt                      +20 Pkt
● Nutzung -60% vs. Vormonat (Sherloq)   +25 Pkt
─────────────────────────────────────
  Gesamt: 73 von max. 100 Punkten

Nicht berücksichtigt (keine Daten):
○ Support-Tickets (Zendesk nicht verbunden)
○ NPS Score (keine Umfrage aktiv)
```

**Design:**
- Positive Signale (Punkte): rotes Bullet ● (Churn) / grünes Bullet (Upsell)
- Fehlende Daten: grauer Bullet ○ + kursiv
- Trennlinie + Gesamt-Punkte
- Unten: Datenquellen-Hinweis (10px grau)

Daten kommen aus score_churn_risk() / score_upsell() → main_drivers[] Array.

---

## 27. PERSÖNLICHKEITSPROFIL — ANZEIGE

### Info Panel — Kontaktdetails Block
- Neue Zeile unter Email/Telefon/LinkedIn
- Label: "PERSÖNLICHKEIT" (10px uppercase, #9CA3AF)
- Wert: 3 Pills: "Direkt" · "Daten-getrieben" · "Schnell" (grau outlined, 11px)
- Hover → Tooltip: "basiert auf: 5 Nachrichten · LinkedIn · Confidence: 82%"
- Wenn < 60% Confidence: Zeile komplett ausgeblendet — kein Platzhalter

### AI SDR Side Panel — Header
- Unter Name/Jobtitel: "💡 Direkt ansprechen · Zahlen nutzen" (12px, grau, kursiv)
- Klickbar → scrollt zu Persönlichkeits-Block

### Action Panels
- Im AI-Empfehlung Block: "Ton angepasst an: Direkt · Daten-getrieben" (10px grau)
- Nur sichtbar wenn Confidence >= 60%

### Composer (jeder AI-Entwurf)
- Unter Textarea: "✓ Ton angepasst an Persönlichkeitsprofil" (10px, #9CA3AF)
- Wenn kein Profil: ausgeblendet

---

## 28. EMAIL-VERIFIZIERUNG — UI-INDIKATOREN & AKTIONEN

**Prinzip:** Verifizierung ist Plattform-Service — kein User-Setting, kein API-Key. Credits aus credit_balance.

**WICHTIG — Sichtbarkeit:** Alle Verifizierungs-UI-Elemente sind ausgeblendet solange die Email-Verifizierung nicht im Backend aktiv ist (settings.modules.email_verification = false). Das System funktioniert vollständig im Hintergrund — nur die UI-Elemente (Icons, Buttons, Aktionsleiste) werden nicht angezeigt. Kein Hinweis für den User dass das Feature existiert. Wenn aktiv → alle Elemente erscheinen automatisch ohne Code-Änderung.

### Icons neben Email-Adresse (überall im System)
- Grüner Haken ✓ = verifiziert (valid)
- Rotes X = ungültig (invalid) + Tooltip "Email ungültig"
- Amber ~ = Catch-All + Tooltip "Verifizierung nicht eindeutig möglich"
- Kein Icon = noch nicht geprüft + "Verifizieren →" Button (klickbar)

### Einzelkontakt — Side Panel + Profil
- Email-Zeile: "thomas@firma.de ✓" oder "thomas@firma.de [Verifizieren →]"
- Klick auf ✓: Tooltip "Verifiziert am [Datum] · Ebene A: Syntax+Domain · Ebene B: ZeroBounce"
- Klick auf "Verifizieren →": sofortige Prüfung, Icon aktualisiert sich in Echtzeit
- Bei invalid: rotes X + "Erneut verifizieren" + "Email bearbeiten"

### Sammelverifikation — Kontakte-Liste
- Checkboxen → mehrere Kontakte auswählen
- Aktionsleiste erscheint unten: "X Kontakte ausgewählt · [Emails verifizieren] [...]"
- Button "Emails verifizieren": startet batch_verify() für alle ausgewählten
- Fortschrittsbalken + Live-Counter: "142 / 500 geprüft..."
- Summary nach Abschluss: "420 valid ✓ · 48 invalid ✗ · 32 unbekannt ~"
- Aktionen bei ungültigen: "Ungültige markieren" · "Aus Campaign entfernen"

### Import-Dialog
- Automatisch nach CSV-Upload: alle Emails prüfen (Fortschrittsbalken)
- Summary: "847 valid ✓ · 23 invalid ✗ · 130 unbekannt ~"
- User entscheidet pro Gruppe: importieren / überspringen

### AI SDR — Sequenz-Aufnahme
- Beim Hinzufügen eines Leads zu Sequenz: verify_contact_email() läuft automatisch
- Wenn invalid → requires_human (reason: 'email_invalid') → erscheint in "Handlung nötig" Tab
- Wenn catch-all → Warnung im Side Panel: "Email nicht eindeutig verifizierbar · Trotzdem hinzufügen?" + JA/NEIN
- Konfigurierbar: settings.ai_sdr.verify_before_sequence (Standard: AN, im Campaign-Settings Toggle)

### Campaign Start
- Optionaler Toggle in Campaign-Settings: "Unverifizierte Emails vor Kampagnenstart prüfen"
- Wenn AN + unverifizierte vorhanden: Hinweis "48 Emails noch ungeprüft · Jetzt prüfen oder überspringen"

---

## 30. UPGRADE-PROMPT — GESPERRTES MODUL

Wenn User auf gesperrten Screen zugreift (direkter URL-Aufruf):

- Kein Error, kein 404
- Zentriertes Overlay auf grauem Hintergrund
- Icon des Moduls (groß, ausgegraut)
- Titel: "Dieses Feature ist in deinem Plan nicht enthalten"
- Aktueller Plan Badge: "Du nutzt: Starter"
- Kurzbeschreibung was das Modul kann (1 Satz)
- Button: "Plan upgraden →" (Primary Gradient) → öffnet Billing Settings
- Link darunter: "Zurück zur Übersicht" (grau)

Gilt für: farmer · ai_chat · whitelabel · crm_sync (wenn nicht im Plan)
Gilt NICHT für: email_verification, sherloq_signals, enrichment — diese sind einfach ausgeblendet ohne Prompt (Add-ons die still fehlen)

- Kontakt-Profil: roter Badge "Opt-out · [Datum]"
- Beim Versuch in Sequenz hinzuzufügen: Block + Hinweis "Kontakt hat Opt-out"
- Unsubscribe-Link in jeder Email (Pflicht)

---

*Sales OS · Sherloq · Juni 2026 · Version 14*
*Zusammenführung aus v2–v11 + Session Juni 2026*
*Neu in v12: Heat/Stagnation Task-Hinweise, Churn/Upsell Hover-Tooltip, Persönlichkeitsprofil-Anzeige, Email-Verifizierung Indikatoren, Opt-out Anzeige*
*Ab jetzt: NUR DIESE DATEI aktualisieren — keine neuen Teilversionen*
*Übergabe an Claude Code: screen-spezifisch, immer nur relevante Abschnitte*

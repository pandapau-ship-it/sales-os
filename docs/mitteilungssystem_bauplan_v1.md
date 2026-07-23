# MITTEILUNGSSYSTEM — Kompakter Bauplan v1
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code
# Drei-Kanal-Logik: GLOCKE = braucht dich irgendwann · POPUP = braucht dich JETZT
# (Freigaben/Geld) · AKTIVITÄTSFENSTER = braucht dich nicht, zeigt dass gearbeitet wird.
# Oberste Regel (Anti-Doppel): Nichts erscheint hier, was schon ein Zuhause hat.

---

## 1. ENTSCHEIDUNGEN (N1–N10)

| # | Entscheidung |
|---|---|
| N1 | **Drei Kanäle, strikt getrennt (Kopfzeile).** Verbindliche Anti-Doppel-Liste in Abschnitt 3 — Verstöße sind Planungsfehler, nicht Geschmackssache. |
| N2 | **Glocke + Mitteilungsseite.** Glocke in TopBar mit Ungelesen-Badge (echter Count). Klick → eigene Mitteilungsseite mit vier Gruppen: **Braucht dich · System · Berichte · Team**. Zeilen: Icon, Titel, 1 Zeile Kontext, Zeitstempel, ggf. Inline-Aktions-Buttons (Freigeben/Ablehnen direkt in der Zeile — C6), Klick öffnet Ziel. Gelesen/Ungelesen, "Alle als gelesen", Filter pro Gruppe. Tabelle `notifications` (user-gerichtet, organization_id, category, severity, title, body, link, source_type + source_id, read_at, created_at). **Single-Source-Regel: Mitteilungen zu Approvals/System-Alarmen/Jobs KOPIEREN keine Daten — sie referenzieren die Quelle (approval_requests, system_alerts, chat_sessions) und rendern deren aktuellen Zustand** (Buttons deaktivieren sich z.B. selbst, wenn Anfrage expired). |
| N3 | **Aktivitätsfenster (Ambient Feed), links unten.** Eingeklappt: EINE dezente Zeile mit jüngstem Ereignis + Puls-Punkt wenn aktiv. Aufgeklappt: letzte 20 Ereignisse, jede Zeile klickbar zum Ziel. Tabelle `activity_events` (organization_id, event_type, summary, count, link, occurred_at) — geschrieben AUSSCHLIESSLICH über einen zentralen Helper `logActivity()` in _shared, aufgerufen an den in diesem Plan + den Bauplänen definierten Stellen. **Bündelungs-Pflicht: pro Lauf/Batch EIN Eintrag** ("Scores aktualisiert: 47 Kontakte, 5 neu kalt"), NIE pro Einzelobjekt. Kein Toast-Verhalten, kein Stapeln, keine Töne. Retention 30 Tage (Cleanup-Cron). Abschaltbar + einklapp-persistent pro User. Positionierung: weicht offenen Side Panels aus (z-index/offset-Regel), auf Mobile-Breiten ausgeblendet. Ereignis-Katalog v1: Auto-Sends (gebündelt pro Campaign/Lauf) · Score-/Heat-Läufe · Kurzakten-Updates (gebündelt) · Briefing erstellt · Signale empfangen + geroutet · Listen-Sync-Ergebnis · Meeting-Prep erstellt · Warmup-Stufe erhöht. |
| N4 | **Aktions-Popup (Slide-in unten rechts) — exklusiv für Geld & Freigaben.** Nur zwei Auslöser: neue approval_request (für Empfänger mit Entscheidungsrecht) und Credit-Kauf-Anfrage. Erscheint via Realtime sofort, nicht blockierend, mit Aktions-Buttons direkt im Popup ([Freigeben] [Ansehen] [Später]). "Später"/Ignorieren → bleibt als Glocken-Mitteilung + E-Mail (C6-Flow). Diese Popup-Klasse wird NIEMALS für andere Zwecke verwendet (Abstumpfungs-Schutz — wer das Popup sieht, weiß: hier geht es um Geld oder eine wartende Person). |
| N5 | **E-Mail-Zustellung** über den System-Mail-Kanal (derselbe transaktionale Dienst wie Betriebs-Alarme B3 — EINE Implementierung, NIE über User-/Kunden-Mailboxen). Pro Kategorie konfigurierbar; Critical-System-Alarme sind nie abschaltbar. Digest-Option: nicht-kritische Mitteilungen als tägliche Sammel-Mail statt einzeln (Default: einzeln nur "Braucht dich", Rest gesammelt). |
| N6 | **Einstellungen:** settings.notifications pro User — Matrix Kategorie × Kanal (In-App ist immer an; E-Mail: sofort/Digest/aus) + activity_feed an/aus. Zentrale Default-Merge-Lesefunktion (bekanntes Muster). |
| N7 | **Meeting-Prep-Mail (Option):** "Prep X Stunden vor dem Termin per E-Mail" (Default AUS, Wert konfigurierbar) — System-Mail-Kanal, Inhalt = das bestehende prep_meeting-Ergebnis, Link zurück ins Prep-Panel. |
| N8 | **Realtime:** Glocken-Badge, Popup und Feed aktualisieren live (bestehender org:/user:-Channel). Dedupe: Realtime-Event + Poll dürfen nie Doppel-Einträge rendern (Key = notification_id/event_id). |
| N9 | **Anti-Doppel-Liste ist verbindlich** (Abschnitt 3). |
| N10 | **Erzeuger-Verkabelung:** Alle Mitteilungen entstehen über EINEN Helper `notify()` in _shared (analog logActivity). Bestehende/geplante Erzeuger, die in ihren Slices auf notify() umgestellt bzw. verkabelt werden: Betriebs-Alarme (B3) · Approval-Flow (C6) · Job-Ergebnisse/-Fehler (C2) · Credit-80%-Warnung · Team-Einladungen · Onboarding-/Mailbox-Nudges · **Lifecycle-Regeln (Kategorie „Regel", Lifecycle-Baukasten L-2a)** · später Billing-Ereignisse. |

> **[D55] Kanal-Präferenz-Wähler pro Benachrichtigungs-Art/Regel (deferred):** N6 regelt heute Kanäle
> nur als **Kategorie × Kanal**-Matrix. Ein Wähler „für DIESE Regel/Art Kanal = In-App / E-Mail / Slack /
> Pop-up" fehlt — gehört zu **L-3** (Aktions-Kanal-Wahl im Condition-Builder) bzw. diesem Mitteilungs-Ausbau.
> Voraussetzungen je Kanal: E-Mail → System-Mail-Kanal · Slack → Slack-Integration (beide existieren noch nicht).
> Volltext + Einordnung: PROGRESS.md [D55]. Der Lifecycle-notify-Handler (L-2a) hängt bereits am bestehenden
> System (Kategorie „Regel") → weitere Kanäle werden nur „angesteckt", ohne Handler-Umbau.
| N11 | **Mehrere-Admins-Wettlauf (atomar entschieden):** Freigabe-Entscheidungen sind DB-atomar — nur der ERSTE Klick zählt (UPDATE … WHERE status='pending' RETURNING; leer = zu spät). Der Zweite sieht sofort "Bereits von {Name} entschieden". Sobald jemand entscheidet: Realtime-Event schließt alle offenen Popups zu dieser Anfrage bei allen anderen Empfängern und aktualisiert deren Glocken-Zeile. Ausführung selbst ist idempotent (nie doppelte Käufe/Aktionen). |
| N12 | **Aktualisieren statt anhäufen (GitHub-Muster):** Meldet sich dieselbe Quelle erneut (Erinnerung, erneuter Fehlschlag, Statuswechsel), wird die BESTEHENDE Mitteilung aktualisiert (Titel/Kontext/updated_at) und wieder auf ungelesen gesetzt — nie eine zweite Zeile. Der Idempotenz-Key (source_type+source_id+category) ist damit auch der Update-Key. |
| N13 | **Klick = gelesen = verschwindet (selbstpflegende Glocke):** Klick auf eine Mitteilung (oder Ausführen ihres Inline-Buttons) markiert sie automatisch als gelesen und entfernt sie aus der Standardansicht. Die Standardansicht zeigt NUR Offenes/Ungelesenes — die Liste pflegt sich selbst, leer ist der Normalzustand. Gelesenes bleibt über einen schlichten "Verlauf"-Tab 90 Tage erreichbar (kostet nichts, deckt "wo war nochmal die Meldung von gestern?"), danach greift die bestehende Archivierung. Badge zählt ausschließlich Ungelesenes. |

> **[D57] Benachrichtigungs-/Deeplink-UX für Lifecycle-Regeln (verbindlich für L-3):** (1) **Bündeln** — eine
> Regel = EINE Mitteilung je Auswerte-Lauf (nicht N Einzelmeldungen; 1 Treffer → Objekt genannt, mehrere → „X Datensätze
> erfüllen Regel Y"). (2) **Klick-Ziel** — 1 Treffer → Objekt öffnen+hervorheben (`highlightId`/deeplink-flash);
> mehrere → **gefilterte Liste über die Filter-Lib** (wie dynamische Listen), keine Wegwerf-Seiten. (3) Klick markiert
> nur gelesen (bleibt im Verlauf, = N13). (4) Regel-Heimat in der UI mit „zuletzt gefeuert für X" + gleichem Link.
> (5) nie tote Links. **⚠ Bündelung ist eine Verhaltensänderung ggü. L-2a (dort pro Datensatz) → gehört in L-3, NICHT
> L-2b.** Volltext: PROGRESS.md [D57]; Routing-Lücke: [D56].

---

## 2. TIMING (wichtig — zwei Erzeuger existieren VOR diesem Modul)
- **N-S1 + N-S2-Minimal (Tabellen + notify() + Glocke mit einfacher Liste) werden VOR Betriebs-Slice B-1 gebaut** — B-1 und der AI SDR erzeugen bereits Mitteilungen. Aufwand: klein.
- N-S3 (Aktivitätsfenster) sinnvoll ab AI-SDR-Slice 9 (dann passiert sichtbar etwas).
- N-S4 (Popup, E-Mail-Matrix, Digest, Prep-Mail) spätestens mit Chat-Slice 7 (Approval-Flow).
- Die Reihenfolge in PROGRESS.md entsprechend einsortieren.

---

## 3. ANTI-DOPPEL-LISTE — erscheint NICHT in Glocke/Popup (lebt woanders)
requires_human-Fälle (→ Mein Tag Rang 0 + AI-SDR-Screen) · kalte Kontakte/Churn/Upsell
(→ Farmer/Top 5) · neue Signal-Leads (→ AI-SDR-Tab "Neu via Signal") · eingegangene
Antworten (→ Panel/Inbox Intelligence) · LinkedIn-fällig/waiting_manual (→ Tasks) ·
einzelne Sends/Opens (→ Aktivitätsfenster bzw. Telemetrie). Grenzfall "Sequenz beendet
ohne Antwort": EINE gebündelte Wochen-Zeile in Berichte, keine Einzelmitteilungen.
Der Ereignis-Katalog des Aktivitätsfensters (N3) und diese Liste sind die beiden
Prüfsteine für JEDE künftige "sollen wir eine Mitteilung schicken?"-Frage.

---

## 4. SLICES

### SLICE N-S1 — Fundament (vor Betrieb B-1)
Migration: notifications + activity_events + settings.notifications-Defaults ·
_shared-Helper notify(user_ids|role, category, severity, title, body, link, source) und
logActivity(event_type, summary, count, link) · Cleanup-Cron (30T activity, gelesene
notifications nach 90T archivieren) · i18n-Keys.
**Akzeptanz:** notify()-Testaufruf erzeugt Mitteilung + Realtime-Event; Doppel-Aufruf
mit gleicher source erzeugt keine Dublette (Idempotenz-Key aus source_type+source_id+category).

### SLICE N-S2 — Glocke + Mitteilungsseite
TopBar-Glocke (Badge = echter Ungelesen-Count) · Mitteilungsseite: Standardansicht NUR
Offenes/Ungelesenes (N13, selbstpflegend) + "Verlauf"-Tab (90 Tage) · 4 Gruppen,
Inline-Aktions-Buttons (rendern aus der QUELLE, N2), Klick-=-gelesen-Automatik (N13),
Update-statt-Anhäufen (N12), Filter · Einstellungs-Matrix (N6).
**Akzeptanz:** Approval-Testanfrage → erscheint unter "Braucht dich", Klick markiert
gelesen + entfernt aus Standardansicht + im Verlauf auffindbar; zweite Meldung derselben
Quelle aktualisiert die Zeile statt eine neue zu erzeugen und setzt sie wieder ungelesen;
Freigeben-Button deaktiviert sich bei expired; Badge zählt korrekt.
**Fallen:** Buttons NIE aus kopierten Daten — immer Quell-Zustand prüfen (sonst
genehmigt jemand eine längst abgelaufene Anfrage).

### SLICE N-S3 — Aktivitätsfenster
Komponente (eingeklappt/aufgeklappt, Persistenz, Panel-Ausweichen) · logActivity-Aufrufe
in den definierten Erzeugern nachrüsten (sequence_runner-Läufe, Score-Crons,
classify_sherloq_lead, sync_list_campaigns, morning_briefing, prep_meeting,
mailbox_warmup) — jeweils EIN gebündelter Eintrag pro Lauf ·
**Akzeptanz:** Runner-Lauf mit 3 Sends erzeugt EINE Zeile "3 Mails aus 'X' versendet",
Klick führt zur Campaign; Feed abgeschaltet → Helper schreibt trotzdem (Daten bleiben),
nur UI verschwindet.
**Fallen:** Bündelung serverseitig im Erzeuger, nicht im Frontend zusammenrechnen ·
keine personenbezogenen Detail-Texte im Feed (Namen ok, nie Mail-Inhalte) · Feed ist
read-only Fenster — keinerlei Business-Logik darin.

### SLICE N-S4 — Popup, E-Mail & Digest
Aktions-Popup (N4, Realtime, exklusive Auslöser) · E-Mail-Zustellung über System-Mail-
Kanal nach Matrix (N5/N6) · Digest-Cron (tägliche Sammelmail) · Prep-Mail-Option (N7) ·
Verkabelung aller Erzeuger aus N10, die bis dahin existieren.
**Akzeptanz:** Member löst Credit-Anfrage aus → Admin sieht binnen Sekunden Slide-in,
ein Klick genehmigt (Ende-zu-Ende inkl. Ausführung); ZWEI Admins klicken quasi
gleichzeitig → genau EINE Ausführung, der Zweite sieht "Bereits entschieden", alle
Popups schließen sich (N11); Admin offline-Simulation → Glocke + E-Mail; Digest-Mail
bündelt korrekt und respektiert die Matrix.
**Fallen:** Popup-Exklusivität hart durchsetzen (Code-Review-Punkt: kein anderer
Aufrufer) · E-Mail-Abmeldung für Pflicht-Alarme nicht anbieten · Digest darf
"Braucht dich" nie verschlucken.

---

## 5. AUSSERHALB DIESES PLANS (zugeordnet, nicht vergessen)
Kalender-getriggerte Auto-Prep → Integrations-Masterplan I-B2 (Vermerk dort bei Verkabelung) ·
Sherloq-On-Demand-Profilabruf für Meeting-Prep → Abstimmungsliste mit Sherloq-Team
(zusammen mit Webhook-Payload) · Browser-Push/Mobile-Push → v2 · Slack-Zustellung → v2 ·
Ruhezeiten für E-Mail-Zustellung (Slack-Muster) → v2 (Digest deckt das Bedürfnis vorerst) ·
"Diese Woche hat die AI für dich erledigt"-Wochenrückblick aus activity_events → v2
(Daten fallen ab Tag 1 an, ROI-Beweis später fast gratis).

---
*Sales OS · Mitteilungssystem Bauplan v1.1 · Juli 2026 · N1–N13 final*
*SOTA-geprüft (Linear-Inbox-Prinzip, GitHub-Gruppierung, Agent-Observability-Trend)*
*Merksatz: Glocke = irgendwann · Popup = jetzt (Geld/Freigaben) · Feed = niemals nötig, immer beruhigend. Leer ist der Normalzustand.*

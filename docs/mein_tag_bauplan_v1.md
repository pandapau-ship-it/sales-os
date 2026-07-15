# MEIN TAG — Kompakter Bauplan v1
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code
# Status: FINAL. Ersetzt Abschnitt 8 der ui_interaktionen_v14 in allen Widerspruchspunkten.

---

## 0. REGELN
Wie in den Bauplänen AI SDR / AI Chat: CLAUDE.md-Invarianten gelten, Diagnose-First,
Slice-Reihenfolge mit STOP + Screenshot-QA, Migrationen versioniert, Abweichung = Rückfrage.
Dieses Dokument > ui_interaktionen Abschnitt 8 bei Widerspruch (wird in Slice 0 angeglichen).

---

## 1. FINALE ENTSCHEIDUNGEN (M1–M10)

| # | Entscheidung |
|---|---|
| M1 | **Struktur radikal reduziert — genau 4 Elemente, sonst NICHTS:** (1) Morgenanalyse-Satz (AI) → (2) Lagebild-Zeile → (3) Top-5-Prioritäten → (4) Termine heute → (5) Tasks (eine Sektion, zwei Gruppen: Überfällig rot oben, Heute grün darunter). Die alten Zonen 5–7 (Churn Warnings, Upsell, Jira) sind GESTRICHEN — Churn/Upsell leben im Farmer und erscheinen hier nur als Prioritäts-Typ in der Top 5. Jira ist kein Bestandteil von Mein Tag; eine Jira-Integration ist insgesamt UNDOKUMENTIERT und kein v1-Thema (Jira.tsx-Design bleibt ungenutzt liegen, bis eine Entscheidung fällt). Kernprinzip: NICHT überfluten — der Screen beantwortet "Was jetzt?", nicht "Was alles?". |
| M2 | **Ranking-Engine: deterministisch, konfigurierbar, keine AI.** Jeder Prioritäts-Kandidat erhält: `score = base_weight(typ) + Modifikatoren`. Basisgewichte pro Typ in `settings.my_day.ranking` (Startwerte Abschnitt 3; Oliver kann sein bestehendes Ranking-System liefern → ersetzt NUR die Settings-Werte, kein Code). Modifikatoren (Werte ebenfalls in settings): Deal-Wert (normalisiert, +0–15) · Wartezeit/Alter (+1/Tag, max +10) · Deadline-Nähe (Termin/Trial-Ende < 48h: +10) · Churn-Schwere (critical +10, high +5) · Signal-Frische (< 24h: +8). Override: AI-SDR requires_human ist IMMER Rang 0, mehrere davon nach Wartezeit sortiert (E22). **Anti-Flut-Regel (Pflicht):** requires_human wird in zwei Klassen geteilt — `routine` (wartende Semi-Drafts) und `individuell` (Antwort wartet, Opt-out-Bestätigung, Eskalation, Konflikt). Individuelle Fälle = einzelne Rang-0-Kacheln. Routine-Fälle = EINE gebündelte Rang-0-Kachel "X Entwürfe warten auf Freigabe → durchsehen" (öffnet die AI-SDR-Freigabe-Ansicht). Ohne diese Regel verdrängt eine anlaufende 40-Lead-Campaign den gesamten Mein Tag. Fehlende Typen: Formel braucht keine Vollständigkeit, vorhandene Kandidaten rücken nach. AI rankt NIE — sie formuliert nur Begründung (2–3 Sätze) und den Morgensatz. Jede Prioritäts-Kachel bekommt die "Warum?"-Affordance (C21): Popover zeigt Score-Zusammensetzung. |
| M3 | **Lagebild-Zeile (NEU):** kompakte Zeile unter dem Morgensatz, 4–5 klickbare Zähler: "Braucht dich: X · Hunter: X · Farmer: X · Überfällig: X" (+ "AI SDR: X" nur wenn Modul aktiv). Echte Counts (dieselben Quellen wie die Modul-Badges — Single Source: eine gemeinsame Count-Function, keine Doppel-Queries). Klick → Ziel-Screen mit gesetztem Filter. Keine Charts, kein Dashboard (Invariante bleibt). Zähler mit 0 werden ausgeblendet. |
| M4 | **Verhalten über den Tag (Nachrück-Prinzip):** Erledigt der User Priorität N (CTA ausgeführt, Task erledigt, "Später"), wird die Kachel als abgehakt markiert (kurz sichtbar, Geschafft-Moment) und der nächstbeste Kandidat rückt nach — die Liste zeigt immer bis zu 5 offene. Der Morgensatz bleibt fix bis zum manuellen Refresh (kein Auto-Neu-Texten über den Tag — Token + Ruhe). Realtime: neue Rang-0-Items (requires_human) erscheinen sofort oben. |
| M5 | **"Später" = persistiertes Tages-Snooze:** Eintrag verschwindet für heute (Tabelle priority_snoozes, user-gebunden), Kandidat nimmt morgen wieder am Ranking teil, wenn noch relevant. Kein stilles Frontend-Ausblenden. |
| M6 | **Leerer Zustand = positiver Zustand** (Task-getriebene Leere): "Alles erledigt — stark." + Lagebild-Zeile bleibt sichtbar + dezenter Hinweis auf den AI-SDR-Digest. Keine künstlichen Füll-Prioritäten, keine Fake-Motivation. |
| M7 | **Strikt pro User.** Mein Tag zeigt ausschließlich die eigenen Termine/Tasks/Prioritäten (assigned_to = user bzw. Ownership-Logik der Module). Team-/Admin-Sicht = v2-Notiz, nicht v1. |
| M8 | **Morgensatz & Briefing:** morning_briefing() läuft 07:00 je User-Timezone: (1) Ranking-Engine liefert Kandidaten (deterministisch), (2) EIN AI-Call (Langfuse 'morning_briefing_v1') formuliert Morgensatz (max. 2 Sätze, Schlüsselbegriffe fett) + Begründungen der Top 5, (3) Ergebnis in daily_briefings inkl. ai_sdr_digest-Sektion (E24 aus AI-SDR-Bauplan). Refresh-Button = derselbe Ablauf on-demand (1 AI-Credit). Honesty: Ohne nennenswerte Ereignisse sagt der Satz das ehrlich ("Ruhiger Start — 2 Follow-ups heute"), erfindet nie Dringlichkeit. |
| M9 | **Wiederkehrende AI-Jobs erscheinen NICHT in Mein Tag** — sie leben im AI Chat (Jobs-Sektion in der Verlaufs-Seitenleiste des Chat-Vollfensters, Ergebnisse als Chat-Nachricht + Mitteilung). Endgültige Platzierung wird in der Chat-Phase feinjustiert. |
| M10 | **Hunter/Farmer-Übersichtsseiten bleiben** — bewusste Arbeitsteilung: Mein Tag = "Was jetzt?" (Top 5, modulübergreifend), Modul-Screens = vollständige Arbeitslisten ihres Bereichs. Kein Element wird deswegen aus Mein Tag dupliziert. |
| M11 | **Vorbereitete Arbeit ist bereits gelöst — keine Pre-Generierung nötig.** Die bestehenden Action-Panels (ui_interaktionen: Kalt-, Churn-, Upsell-, Trial-Kacheln etc.) öffnen mit KI-Empfehlung, vorausgewähltem Kanal und fertig generierter, editierbarer Nachricht. Verbindliche Regel: Mein-Tag-CTAs öffnen EXAKT diese bestehenden Action-/Side-Panels des jeweiligen Typs — niemals eigene Panel-Varianten, niemals eigene Draft-Pfade. |
| M12 | **Stabilitäts-Prinzip (bewusster Kontrast zu Rhythm & Co.):** Die Top-5-Liste sortiert sich über den Tag NIE stillschweigend um. Updates sind ausschließlich additiv: neue Rang-0-Items erscheinen oben, Erledigtes rückt nach (M4) — bestehende Positionen bleiben stabil. Vollständige Neu-Berechnung nur um 07:00 oder per manuellem Refresh. Ruhe ist das Feature. |
| M13 | **Termin-Quelle = verknüpfter Kalender.** Zone 1 zeigt die heutigen Termine aus dem angebundenen Kalender des Users (Lese-Sync via Nango Google/Outlook-Kalender-Verbindung) PLUS System-Termine (bestätigte Buchungen, manuell angelegte). Detail-Spezifikation + Verkabelung des Kalender-Lese-Syncs: **Integrations-Masterplan, Klasse B (Endphase)** — Settings baut nur die Verbinden-Kachel. Slice 3 dieses Plans verdrahtet Zone 1 zunächst gegen System-Termine und lässt die Kalender-Quelle als klar markierten Anschlusspunkt offen (kein Fake-Fallback, ehrlicher Hinweis "Kalender verbinden" wenn keine Verbindung existiert). |

---

## 2. PRIORITÄTS-TYPEN (Kandidaten-Quellen — bestehende Tabelle bleibt gültig)
Rang-0-Override: `system_ai_sdr` (requires_human — NICHT waiting_manual/LinkedIn-fällig, das ist normale Task-Zone).
Typen im Ranking: churn_risk · follow_up_due · stage_stagnant · going_cold · onboarding_open ·
meeting_prep_missing (Termin heute ohne Prep!) · booking_link_send · upsell_potential ·
linkedin_signal · sequence_done_no_response · overdue_task_escalation (Task > X Tage überfällig
darf in die Top 5 eskalieren — sonst konkurrieren Zonen nie).

## 3. STARTGEWICHTE (settings.my_day.ranking — reine Daten, jederzeit änderbar, auch via Chat)
```
requires_human: Rang-0-Override (kein Gewicht)
churn_risk: 80 · meeting_prep_missing: 75 · follow_up_due: 65 · stage_stagnant: 60 ·
booking_link_send: 60 · going_cold: 50 · onboarding_open: 50 · overdue_task_escalation: 45 ·
upsell_potential: 40 · linkedin_signal: 40 · sequence_done_no_response: 25
Modifikator-Parameter wie M2. max_priorities: 5.
```

---

## 4. SLICES

### SLICE 0 — Doku-Angleichung
Diese Datei als docs/mein_tag_bauplan_v1.md ins Repo + CLAUDE.md-Referenz ·
ui_interaktionen Abschnitt 8: Zonen 5–7 streichen, M1-Struktur + Lagebild-Zeile eintragen ·
entscheidungen_komplett.md: M1–M10 · PROGRESS.md.

### SLICE 1 — Migration & Settings
Diagnose: existiert daily_briefings bereits (Schema v3)? Struktur gegen M8 prüfen
(Spalten: user_id, date, morning_sentence, priorities jsonb, ai_sdr_digest jsonb,
generated_at; UNIQUE(user_id, date)) · NEU: priority_snoozes (id, organization_id,
user_id, candidate_type, candidate_ref uuid, snoozed_for_date, created_at,
UNIQUE(user_id, candidate_type, candidate_ref, snoozed_for_date)) ·
settings.my_day Seed (Abschnitt 3 + Modifikatoren) mit zentraler Default-Merge-Lesefunktion.
**Falle:** daily_briefings pro User UND Tag eindeutig — Refresh ist UPDATE, kein zweiter INSERT.

### SLICE 2 — Ranking-Engine + morning_briefing
`rank_my_day(user_id)` als Edge-/Postgres-Function: Kandidaten aus allen Quellen sammeln
(Deals, Kontakte, Leads, Tasks, Signale, Termine — jede Quelle deleted_at-/Snooze-/
Später-bereinigt), Score nach M2, Top-N zurück MIT score_breakdown (für Warum?-Popover) ·
morning_briefing() nach M8 verdrahten (inkl. ai_sdr_digest E24) · Cron 07:00 je
User-Timezone · Refresh-Endpoint.
**Fallen:** Kandidaten-Queries respektieren M7 (nur eigene) · requires_human-Wartezeit-
Sortierung (E22) · Ein AI-Call pro Briefing, NIE einer pro Priorität · Honesty M8.
**Akzeptanz:** Testdaten mit 8 gemischten Kandidaten → Top 5 nachvollziehbar per
score_breakdown; requires_human-Testfall verdrängt Platz 1; "Später" entfernt heute,
morgen wieder da.

### SLICE 3 — UI-Verkabelung Kernzonen
Diagnose: ScreenMyDay.tsx (AI-Studio-Design) — Design übernehmen, ALLE Mock-Daten
(MOCK_TASKS, MOCK_MEETINGS, MOCK_TOP_PRIORITIES) und die /api/gemini/*-Testaufrufe
ENTFERNEN und durch echte Daten (TanStack Query auf daily_briefings + rank_my_day +
Termine + Tasks) ersetzen ·
Morgensatz-Banner (Refresh mit Loading, 1 Credit) · Top-5-Kacheln (Farbstreifen, Nummer,
Typ-Badge, AI-Begründung, kontextueller CTA je Typ aus bestehender Tabelle, "Später",
Warum?-Popover, Arrow → Side Panel) · Termine-Kacheln mit den 3 Footer-Zuständen +
Meeting-Prep-Panel + Inline-Composer (bestehende Composer-/Panel-Bausteine!) ·
Task-Sektion (Überfällig + Heute, Snooze/Bearbeiten/Erledigt inline) · Nachrück-Verhalten
M4 + Stabilitäts-Prinzip M12 · Leerer Zustand M6 · Zone 1 gegen System-Termine
(Cal.com + manuell) verdrahten, Kalender-Anschlusspunkt nach M13 ("Kalender verbinden"-Hinweis).
**Fallen:** CTAs öffnen die BESTEHENDEN Action-/Side-Panels des Typs (M11) und rufen
dieselben Edge Functions wie die Modul-Screens — nie Parallelpfade, nie eigene Panel-Varianten ·
abgehakte Kachel: kurze Bestätigung, dann nachrücken — kein Layout-Springen ·
Erledigt/Snooze optimistisch mit Rollback bei Fehler.

### SLICE 4 — Lagebild, Realtime, Abschluss
Lagebild-Zeile (M3) mit gemeinsamer Count-Function (Diagnose: existierende
Badge-Count-Quellen der Module wiederverwenden!) · Realtime: neue requires_human →
sofort Rang 0; Count-Updates auf org-Channel · Reaktivierungs-Pool-Banner (E-Serie) ·
ai_sdr_digest-Anzeige (E24, sofern AI SDR schon gebaut — sonst sauber ausgeblendet,
kein leerer Platzhalter) · Gesamt-QA Golden Path: Morgens 07:00-Briefing → Priorität 1
erledigen → Nachrücken → Termin-Prep generieren → Task snoozen → leerer Zustand.

---

## 5. FALLEN (global)
1. Keine Fake-Werte: Das AI-Studio-Design ist voller Mocks — restlos ersetzen (Honesty).
2. 07:00 je User-Timezone, nicht Server-Zeit; DB UTC.
3. Ranking niemals im Frontend berechnen — score_breakdown kommt vom Server.
4. waiting_manual (LinkedIn fällig) ist normale Task-Zone, NIE Rang 0.
5. Alle Zähler = echte Counts über die gemeinsame Function; kein Zähler doppelt implementieren.
6. Keine Charts in Mein Tag (Invariante).
7. settings.my_day nur über zentrale Merge-Funktion lesen.

## 6. NICHT IN v1
Team-/Admin-Tagesansicht (M7) · Jira (M1) · "Geschafft heute"-Archivansicht (Nachrücken
zeigt Abhaken bereits; volle Historie später) · konfigurierbare Zonen-Reihenfolge ·
Kalender-Lese-Sync-Detail (M13 — wird in der Settings/Integrationen-Planung spezifiziert).

---
*Sales OS · Mein Tag Bauplan v1.2 · Juli 2026 · M1–M13 final*
*SOTA-geprüft Juli 2026 (Rhythm/Conductor, Attio, AI-Guided Selling, Agentforce): Ranking-Transparenz und vorbereitete Arbeit auf Augenhöhe; Stabilitäts-Prinzip M12 als bewusste Differenzierung*
*Offen als reine Datenlieferung: Olivers bestehendes Ranking-System → ersetzt Startgewichte in settings.my_day.ranking*
*Offener Anschlusspunkt: Kalender-Lese-Sync → Integrations-Masterplan Klasse B*

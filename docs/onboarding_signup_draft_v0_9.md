# ONBOARDING & SIGNUP — Bauplan DRAFT v0.9
# Sales OS · Juli 2026 · ERSTER ENTWURF — bewusst mit Offenheiten
# Status: RICHTUNGS-DOKUMENT. Wird vor dem Bau erneut gechallengt (siehe Abschnitt 7).
# Baureihenfolge: Onboarding wird als LETZTES Modul gebaut (nach AI SDR + AI Chat) —
# erst relevant für den Verkauf; intern wird ohne Onboarding gearbeitet.

---

## 0. LEITPRINZIP
Onboarding ist keine Datenabfrage — es ist der erste Magic Moment. Der User gibt fast
nichts ein; das System zeigt, was es gelernt hat, der User bestätigt oder korrigiert.
Gefühl: "Ich hab das für dich im Griff — lass mich arbeiten."
Login, Registrierung, E-Mail-Verifizierung: EXISTIEREN BEREITS (Email+Passwort +
Google/Microsoft SSO) — kein Bestandteil dieses Plans.

---

## 1. ENTSCHEIDUNGEN (O1–O10, erste Fassung)

| # | Entscheidung |
|---|---|
| O1 | **Zwei Flows.** First-Run (Org-Gründer): voller Flow. Invited User: NUR Personal Voice + max. 3 Kontext-Tooltips — erbt Org-Profil, Regeln, Module. |
| O2 | **Ein Pflichtfeld: Firmen-URL.** Alles andere skippable ("Später"). Übersprungene Schritte erscheinen als sanfte Erledigungs-Kacheln in Mein Tag — nie als Blocker. |
| O3 | **Crawl & Reveal.** URL → AI crawlt Website + öffentliche Quellen → Org-Profil: Firma, Angebot, Problemlösung, ICP-Definition, Personas (Pain Points, Original-Wording, Sprache). Präsentation als editierbare Bestätigungs-Karten ("Das habe ich über euch gelernt"). Während des Crawls (30–90s) läuft der User parallel weiter (O4) — kein Warte-Spinner. **Ablage: Das Org-Profil LEBT IN DEN SETTINGS** (eigene Sektion "Unternehmensprofil", inkl. URL, Re-Crawl-Button, Karten editierbar) — das Onboarding ist nur der erste Befüller. Datenobjekt: `org_profile` (Struktur in Abschnitt 3). |
| O4 | **Ziel-Frage steuert Module:** "Was willst du erreichen — Neukunden / Bestandskunden / beides?" schaltet AI SDR / Hunter / Farmer und bestimmt die restlichen Schritte. Eine menschliche Frage statt Modul-Menü. |
| O5 | **Personal Voice, zwei Wege:** (a) 2–3 Textproben einfügen, (b) aus verbundener Mailbox lernen (gesendete Mails — Mailbox braucht der AI SDR ohnehin). Ergebnis: `voice_profiles` pro User, fließt in generate_message (zusätzlich zum Empfänger-Persönlichkeitsprofil). Sofort-Beweis: Beispiel-Mail an eine echte Persona im eigenen Stil, mit Feintuning ("förmlicher / lockerer / kürzer"). Für Invited User ist DIES der ganze Flow. |
| O6 | **Regeln zeigen, nie konfigurieren:** 3 Beispiel-Kacheln der voreingestellten Automatiken + "Dein AI Chat passt jederzeit alles an" mit direktem Chat-Einstieg (Chat existiert zum Bauzeitpunkt bereits — der Einrichtungs-Coach [Chat-Plan v2-Notiz] kann hier andocken). |
| O7 | **Sherloq-Add-on als ehrliche Nutzenseite im Flow:** Was es bringt (Signale, Leads, konkrete Momente), Preis, "Jetzt hinzubuchen" / "Später". Danach dauerhaft erreichbar: Settings + dezente Kachel. Kein Dark Pattern, kein Zwang. |
| O8 | **Abschluss mit vorbereiteter Arbeit:** AI legt aus dem Org-Profil eine erste Campaign als ENTWURF an (nie aktiv; bei Farmer-Ziel: passendes Farmer-Setup). User landet in Mein Tag, Morgensatz: "Ich habe dir X vorbereitet." |
| O9 | **Resumierbar:** `onboarding_state` pro Org + pro User — Browser zu = nichts verloren. Der bestehende 3-Tage-Nudge greift auf offene Schritte. |
| O10 | **ICP-Scoring = bewusster PLATZHALTER.** Die Berechnung (Kontakt/Company-Matching gegen org_profile) wird SEPARAT von Oliver spezifiziert, lebt außerhalb dieses Plans (eigener Ort, greift nur bei Kontakt-Upload / Sherloq-Lieferung). Dieses Onboarding sammelt nur das Futter: das Org-Profil. NICHTS zur Score-Formel hier vorwegnehmen. |
| O11 | **Aktivierungs-Metrik & Funnel-Telemetrie (SOTA-Ergänzung).** Aktivierungs-Ereignis (Vorschlag, in Re-Challenge final): "Erste Campaign aktiviert ODER erster Kontakt-Import + erste freigegebene Nachricht — binnen 7 Tagen nach Signup." onboarding_state loggt Zeitstempel pro Schritt (done/skipped) → Funnel auswertbar (Abschlussrate, Time-to-Value, Abbruch-Schritt). Ziele als Richtwert: TTV bis zum Reveal-Moment < 5 Min, Kernpfad-Abschlussrate > 60%. Keine zusätzlichen Tracking-Tools — reine DB-Telemetrie. |
| O12 | **Eigene LinkedIn-URL, Sherloq-powered (Relay-Muster, OHNE Scraping-Bruch).** Im Voice-Schritt optional: eigene LinkedIn-Profil-URL. Wirkung NUR wenn Sherloq gebucht/verbunden ist: Personal Voice lernt zusätzlich aus den eigenen Posts (bestehendes Ebene-2-Muster). Ohne Sherloq: Feld wird gespeichert, Hinweis "Mit Sherloq lerne ich auch aus deinen Posts" — verstärkt die O7-Nutzenseite. NIEMALS eigener LinkedIn-Abruf außerhalb Sherloq (harte Systemgrenze). |
| O13 | **Kernpfad ≤ 7 sichtbare Schritte** (Benchmark 3–7; jede Extra-Minute kostet ~3% Conversion): Regeln-Überblick (O6) und Sherloq-Seite (O7) werden zu EINEM Schritt "Dein Autopilot" zusammengelegt oder konditional ausgespielt. Finaler Schnitt in der Re-Challenge. |

---

## 2. FLOW-SKIZZE (First-Run)

```
Signup (existiert) 
→ Schritt 1: Firmen-URL (Pflicht) — Crawl startet im Hintergrund
→ Schritt 2 (parallel zum Crawl): Name/Rolle + Ziel-Frage (O4)
→ Schritt 3: REVEAL — Org-Profil-Karten bestätigen/korrigieren (O3)
→ Schritt 4: Personal Voice + Beispiel-Mail-Beweis (O5)
→ Schritt 5 (nur wenn AI SDR/Outreach gewählt): Mailbox verbinden 
   (bestehender Flow inkl. Verify-Nudge)
→ Schritt 6: Regeln-Überblick (O6)
→ Schritt 7: Sherloq-Add-on-Seite (O7)
→ Schritt 8: Kontakte (Import / Sherloq / "AI bereitet vor")
→ Abschluss: vorbereitete Campaign als Entwurf + Mein Tag (O8)
```
Wizard mit sichtbarem Fortschritt als Rückgrat; AI-Momente an Schritt 3/4/8;
Chat für alles Individuelle andockbar. Kein reines Freiform-Chat-Onboarding
(Abbruch-Risiko: User wissen nicht, wann sie fertig sind).

---

## 3. DATENOBJEKTE (erste Fassung — Details beim Bau-Zeitpunkt final)

`org_profile` (1 pro Org, Settings-Sektion "Unternehmensprofil"):
company_url · crawl-Ergebnis: {company_summary, offering, problems_solved,
icp_definition, personas[]: {name, role_pattern, pain_points[], wording_samples[],
language}} · last_crawled_at · manuell editierte Felder überschreiben Crawl
(edit-Flags, Re-Crawl überschreibt NIE User-Edits).

`voice_profiles` (1 pro User): samples[] · derived: {tone, formality, sentence_length,
greeting/closing-Muster, do/dont} · source (samples|mailbox) · confidence ·
sichtbar + editierbar in Settings → Mein Profil.

`onboarding_state` (pro Org + pro User): steps jsonb {step: done|skipped|pending} ·
completed_at.

---

## 4. GROBE SLICES (werden vor Bau final geschnitten)
S1 Migration (3 Objekte) + Settings-Sektion Unternehmensprofil ·
S2 Crawl-Pipeline (crawl_org_profile Edge Function: Fetch + AI-Extraktion, Langfuse) ·
S3 Voice-Pipeline (analyze_user_voice + Integration in generate_message) ·
S4 Wizard-UI First-Run (Schritte 1–8, resumierbar) · S5 Invited-User-Flow ·
S6 Abschluss-Automatik (Campaign-Entwurf + Mein-Tag-Anbindung) + Nudges.

---

## 5. BEKANNTE FALLEN (erste Sammlung)
1. Crawl kann scheitern/dünn sein (kleine Websites): ehrlicher Zustand "Ich habe wenig
   gefunden — hilf mir mit 3 Fragen" statt erfundener Profile (Honesty!).
2. Re-Crawl darf User-Korrekturen nie überschreiben (edit-Flags).
3. Voice-Learning aus Mailbox: nur GESENDETE Mails des Users, DSGVO-sauber, nie
   Empfänger-Inhalte ins Profil.
4. Beispiel-Mail im Onboarding verbraucht Credits → im Trial inklusive, zählt nicht
   gegen Kontingent (Gefühl vor Geiz).
5. Campaign-Entwurf (O8) respektiert alle AI-SDR-Regeln (nie aktiv, Send-Gates greifen).
6. org_profile fließt in generate_message/Messaging-Briefs als Kontext — Single Source,
   keine Kopien in Campaigns.
7. **Org-Provisioning darf `settings.billing` NICHT automatisch seeden** (Entitlement-Layer,
   Migration 064 Punkt 5). Neue Orgs **erben den globalen Abrechnungs-Default** aus
   `billing_config` — ein per-Org-`settings.billing`-Eintrag wird nur bei einem **bewussten
   Override-Grund** gesetzt. Sonst würde jede neue Org zum Override und ein globaler Preiswechsel
   griffe nicht mehr. (Regel hier verankert, weil Onboarding als LETZTES Modul gebaut wird und
   sie sonst verloren ginge.)

---

## 6. AUSSERHALB DIESES PLANS
Kreditkarte-bei-Trial-Frage → Abo-Verwaltungs-Session · ICP-Score-Formel (O10) →
separate Lieferung Oliver · Kalender-Sync → Settings-Session · Billing/Plan-Wahl im
Signup → Abo-Session.

---

## 7. ⚠ DRAFT-HINWEIS — PFLICHT-RE-CHALLENGE VOR BAU
Dies ist der ERSTE ENTWURF, bewusst früh und offen. Bevor Claude Code auch nur Slice 1
beginnt, gilt: Oliver + Chat-Claude gehen dieses Dokument erneut durch (kompletter
4-Schritte-Prozess inkl. SOTA-Check zum dann aktuellen Stand), weil bis dahin AI SDR,
AI Chat, Settings und Abo-Verwaltung gebaut sind und neue Erkenntnisse existieren.
Offene Punkte für die Re-Challenge:
- Chat-geführtes Onboarding (Einrichtungs-Coach) als Ergänzung oder Ersatz einzelner Schritte?
- Welche Quellen crawlt die AI zusätzlich zur Website (Impressum, LinkedIn-Firmenseite via API-frei zulässige Wege, News)?
- Personas-Anzahl/Struktur nach ersten echten Crawl-Tests kalibrieren
- Team-Onboarding-Reihenfolge (lädt der Gründer VOR oder NACH eigenem Abschluss ein?)
- Verzahnung mit Abo/Plan-Wahl und Kreditkarten-Entscheidung
- ICP-Scoring-Andockpunkt sobald Olivers Spezifikation vorliegt
- Aktivierungs-Ereignis final definieren (O11) + Zielwerte kalibrieren
- Schrittzusammenlegung final schneiden (O13)

---
*Sales OS · Onboarding & Signup DRAFT v0.95 · Juli 2026 · O1–O13 als Richtung fixiert*
*SOTA-geprüft Juli 2026 (Reifegrad "Execute", Relay-Muster, 2026er Benchmarks: ≤7 Schritte, 2–3 Fragen, TTV < 5 Min)*
*NICHT baureif — Re-Challenge nach Abschluss von AI SDR/Chat/Settings zwingend (Abschnitt 7)*

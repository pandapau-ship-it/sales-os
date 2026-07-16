# KONTAKTE & COMPANIES — Bau- und Import-Plan v1
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code · Dokument 13
# Grundlage: ui_interaktionen §11–15 (UI vollständig spezifiziert + Designs ScreenKontakte/
# ScreenCompanies vorhanden) · sales_os_crm_felder.md (alle Felder + Pflicht-Logik) ·
# Regeln-Doku J3 (Duplikat-Erkennung ✅ entschieden) · DB-Schema v3.
# Dieses Dokument schneidet das in Slices und spezifiziert NEU: die Smart-Import-Engine.
# Regeln: CLAUDE.md-Invarianten, Diagnose-First, STOP+QA je Slice, Dauerregel 4c für UI.

---

## 1. ENTSCHEIDUNGEN (K1–K9)

| # | Entscheidung |
|---|---|
| K1 | **Pflichtfeld-Logik (aus CRM-Felder-Doku, verbindlich):** Kontakt: (Vorname+Nachname) ODER LinkedIn-URL — eines reicht. Company: nur Name. Diese Regel gilt ÜBERALL identisch: manuelles Anlegen, Import, Sherloq-Webhook, spätere API — EINE zentrale Validierungs-Function, keine Kopien. |
| K2 | **Duplikat-Erkennung = EINE zentrale Function** `find_duplicates(candidate)` nach J3-Logik, Match-Kaskade: (1) E-Mail exakt (normalisiert lowercase/trim) → sicher · (2) LinkedIn-URL exakt (normalisiert, ohne Tracking-Parameter/Trailing-Slash) → sicher · (3) Name+Company unscharf (normalisiert, Ähnlichkeit) → "möglich". Companies analog: Domain exakt → sicher, Name unscharf → möglich. Genutzt von: manuellem Anlegen (§13-Banner), Import (Review-Spalte), Sherloq-Intake (existiert — bei Diagnose auf diese Function umstellen, falls eigene Logik), API/Chat später. NIEMALS zwei Implementierungen. |
| K3 | **Smart-Import-Engine (NEU — Abschnitt 2):** CSV + Excel, Datei-Toleranz, Wörterbuch+AI-Mapping mit Vorschau, Validierungs-Preview, Duplikat-Stufe, Batch mit Undo. |
| K4 | **Import ist rückholbar:** Jeder Import = `import_batches`-Eintrag; alle erzeugten Datensätze tragen import_batch_id. "Import rückgängig" (bis 7 Tage): verschiebt NUR in diesem Batch NEU ERSTELLTE Datensätze in den Papierkorb (C5-Mechanik); zusammengeführte/aktualisierte bleiben (Merge ist nicht automatisch trennbar — ehrlicher Hinweis im Dialog). |
| K5 | **Merge (Zusammenführen) = zentrale Function** `merge_contacts(keep_id, remove_id, field_choices)`: überträgt Verweise (Deals, Tasks, Leads, Communications, Listen-Mitgliedschaften, Embeddings-Löschkopplung), schreibt audit_log, Verlierer in Papierkorb. UI: Merge-Dialog §13 (pro Feld wählen). Gleiches Muster für Companies. ⚠ Verweis-Liste bei Diagnose VOLLSTÄNDIG erheben (Schema-Scan nach contact_id-FKs) — ein vergessener FK = verwaiste Daten. |
| K6 | **Listen:** statisch (manuelle Mitglieder) + dynamisch (Filter-Definition, live ausgewertet). Dynamische Listen nutzen die EINE gemeinsame Bedingungs-/Filter-Sprache (Masterplan Weiche 1 — hier wird sie ERSTMALS gebaut, als eigenständige Lib, die später Lifecycle-Trigger und Analyse-Katalog wiederverwenden). Kein Listen-Hardlimit (S6), Team-Listen alle außer Viewer (S6). |
| K7 | **Lead-Source-Pflicht:** Jeder Kontakt trägt lead_source (sherloq/csv/crm/manual/webhook — Systemfeld, CRM-Felder-Doku). Import setzt csv + import_batch_id. |
| K8 | **Ehrlichkeit im Import:** Keine Zeile wird still verworfen. Fehler-Zeilen mit Grund gelistet + als CSV herunterladbar. Import-Report am Ende: X erstellt · Y aktualisiert/zusammengeführt · Z übersprungen (Duplikat) · W fehlerhaft. Echte Zahlen, keine Rundungen. |
| K9 | **Lead-Assignment:** Jeder Kontakt trägt `assigned_to` (owner). Bei Team-Orgs mit mehreren Sales-Usern greift eine konfigurierbare Regel (`settings.lead_assignment_strategy`: `round_robin` \| `by_region` \| `by_source` \| `manual_only`, Default `round_robin` unter aktiven Sales-Rollen). Function `assign_lead_owner(contact_id)` wird in **K-1b** mit `round_robin`-Basislogik implementiert; erweiterte Strategien = spätere Settings-Erweiterung, kein Architekturumbau. |

---

## 2. SMART-IMPORT-ENGINE (K3) — Spezifikation

**Schicht 1 — Datei-Toleranz ("frisst alles"):**
CSV UND Excel (.xlsx/.xls via SheetJS, erstes Sheet, Hinweis bei mehreren) ·
Encoding-Erkennung UTF-8/ISO-8859-1/Windows-1252 (BOM beachten — löst kaputte
Umlaute) · Trennzeichen-Erkennung Komma/Semikolon/Tab (deutsches Excel = Semikolon!) ·
Anführungszeichen/Zeilenumbrüche in Feldern korrekt (Papa Parse) · Leere Zeilen/
Spalten überspringen · Max-Größe aus system_config (Default 20 MB / 50.000 Zeilen),
darüber ehrliche Meldung.

**Schicht 2 — Spalten-Mapping (smart):**
1. Synonym-Wörterbuch (Lib-Konstante, de/en): "E-Mail|Mail|email|email_address|
   E-Mail-Adresse" → email; analog für alle CRM-Felder (Quelle: crm_felder-Doku).
2. Unbekannte Header → EIN AI-Call `import_mapping_v1` (Langfuse-Prompt, C27-Regel:
   Prompt-File + Inventar-Eintrag!): Header + 3 Beispielwerte pro Spalte → Vorschlag
   {feld, konfidenz}; niedrige Konfidenz = "Nicht importieren" vorausgewählt.
3. Mapping-Vorschau-UI: Tabelle Spalte→Ziel-Feld (Dropdown korrigierbar),
   Beispielwerte sichtbar, unmapped Spalten klar markiert.
4. Bestätigtes Mapping wird als **Import-Vorlage** gespeichert (pro Org, benannt,
   Header-Signatur als Erkennung) → derselbe Export-Typ mappt beim nächsten Mal
   automatisch ("Vorlage 'HubSpot-Export' erkannt").

**Schicht 3 — Validierungs-Preview (vor jedem Schreiben):**
Vorschau-Tabelle (erste 50 + Fehler-Zeilen) · Pflichtfeld-Prüfung (K1) · Format-
Prüfung (E-Mail-Syntax, URL) · Duplikat-Spalte (K2: sicher/möglich) mit pro-Zeile-
Wahl Überspringen/Zusammenführen/Trotzdem (§13) · Bulk-Aktionen ("alle sicheren
Duplikate überspringen") · Import startet erst nach expliziter Bestätigung.

**Schicht 4 — Ausführung:**
Serverseitig in Batches (Edge Function, resumierbar), Fortschrittsanzeige ·
lead_source + import_batch_id (K7/K4) · Company-Zuordnung: Domain-Match aus E-Mail
→ bestehende Company verknüpfen, sonst anlegen (nur wenn Company-Name/Domain in
Datei) · Report (K8) + Aktivitätsfenster-Eintrag (EIN gebündelter, N3) ·
Undo-Option (K4).

---

## 3. SLICES

### SLICE K-1 — Diagnose & Daten-Fundament
Diagnose: Ist-Stand contacts/companies/lists-Tabellen vs. CRM-Felder-Doku (fehlende
Spalten ergänzen — Migration) · existierende Duplikat-/Intake-Logik finden (Sherloq)
· FK-Scan für K5-Verweisliste · NEU: import_batches, import_templates, lists +
list_members (falls fehlend; dynamische Definition als Filter-JSON) ·
Validierungs-Function (K1) + find_duplicates (K2) als zentrale Functions mit [AUTO]-Tests
(Match-Kaskade, Normalisierung, Fuzzy-Grenzfälle).

### SLICE K-2 — Filter-Sprache (Weiche 1, erstmalig)
Eigenständige Lib: Bedingungs-Definition (Feld · Operator · Wert, UND/ODER-Gruppen)
→ sichere Query-Übersetzung (Whitelist der Felder/Operatoren, NIE freies SQL) ·
[AUTO]-Tests inkl. Injection-Versuche über Filterwerte · dynamische Listen-Auswertung
darauf. **Falle:** Diese Lib ist die gemeinsame Sprache für Listen, Lifecycle-Trigger
(conditions[]) und Analyse-Katalog — API so schneiden, dass alle drei sie nutzen können.

### SLICE K-3 — Kontakte-Screen (Dauerregel 4c: Design-Abgleich ScreenKontakte zuerst)
Listenansicht §11 gegen echte Daten (TanStack, virtualisiert) · Inline-Editing §12
(Pflichtfeld-Verhalten: amber + Tooltip) · Kontakt anlegen mit Duplikat-Banner (§13) ·
Filter über die K-2-Sprache · Bulk-Auswahl (zu Liste hinzufügen; Campaign-Option als
markierter Anschlusspunkt für AI-SDR-Slice-6, bis dahin ausgeblendet) ·
deleted_at-Respekt überall.

### SLICE K-4 — Companies-Screen + Detail (4c: ScreenCompanies)
Listenansicht §14 (Logo-Fallback, Badges, Zähler = echte Counts) · Company-Detail
§15 (volle Seite: Kontakte, Deals, Historie — nur echte Daten, leere Sektionen
ehrlich) · Kontakt↔Company-Verknüpfung + Domain-Logik.

### SLICE K-5 — Smart-Import (Abschnitt 2 komplett)
Upload-Flow (4 Schichten) · import_mapping_v1-Prompt (C27!) · Vorlagen ·
Report + Undo. **Akzeptanz:** Deutsches Excel (Semikolon, ISO-Umlaute, .xlsx) mit
kreativen Headern ("Mailadresse", "Firma") importiert sauber; 2 präparierte
Duplikate werden erkannt (1 sicher via E-Mail, 1 möglich via Name+Company); Fehler-
Zeile (weder Name noch LinkedIn) landet im Fehler-Download, nicht in der DB;
Undo entfernt exakt die neu erstellten Zeilen; zweiter Import derselben Struktur
erkennt die Vorlage.

### SLICE K-6 — Duplikate verwalten + Merge
"Duplikate verwalten"-Screen (§13: Paare, Ähnlichkeit, Merge-Dialog pro Feld,
"Kein Duplikat"-Ablehnung mit Merkliste gegen Wiedervorlage) · merge_contacts/
merge_companies (K5) mit [AUTO]-Tests (alle FK-Verweise wandern mit — Testfall
pro Verweistyp!). **Akzeptanz:** Merge zweier Kontakte mit Deal, Task, Listen-
Mitgliedschaft und Kommunikation → alles hängt am Gewinner, Verlierer im Papierkorb,
audit_log vollständig.

---

## 4. FALLEN (global)
1. EINE Validierungs-, EINE Duplikat-, EINE Merge-Function — Import/Manuell/Webhook/
   Chat rufen dieselben (Single Source; Sherloq-Intake bei Diagnose darauf umstellen).
2. Filter-Lib (K-2) ist Fundament für drei spätere Systeme — nicht listen-spezifisch
   verbauen.
3. Encoding/Trennzeichen NIE annehmen — immer erkennen (Schicht 1).
4. AI-Mapping ist Vorschlag, nie Autopilot: User bestätigt das Mapping immer.
5. Import schreibt nie am Preview vorbei; Batches resumierbar; keine Client-seitige
   Massenschreibung.
6. Alle Zähler/Badges echte Counts; deleted_at + Opt-out in jeder Query (Checkliste).
7. i18n; Designs (ScreenKontakte/ScreenCompanies) via 4c abgleichen — Mocks raus.

---
*Sales OS · Kontakte & Companies Bau- und Import-Plan v1 · Juli 2026 · K1–K9 final · Dokument 13*
*Baustelle Nr. 1 der Bau-Reihenfolge — Voraussetzung für AI SDR (Adressbuch, Import, Listen)*

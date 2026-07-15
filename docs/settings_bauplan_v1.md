# SETTINGS — Vollständiger Bauplan v1 (inkl. UI/UX-Session)
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code
# Befund der Diagnose: Es existiert KEIN Settings-Screen-Design — Settings ist zugleich
# der Ort, auf den 11 Dokumente verweisen. Dieser Plan definiert Struktur, Rechte-Modell,
# alle Sektionen, die UI/UX-Session (Abschnitt 6) und die Bau-Slices.
# Grundregeln: CLAUDE.md-Invarianten, Diagnose-First, STOP+QA pro Slice, [D51] überall.

---

## 1. INFORMATIONSARCHITEKTUR (S1) — die eine Struktur, final

Settings ist ein eigener Bereich (Zahnrad in Sidebar/TopBar): linke Settings-Navigation
mit Gruppen, rechts die Seite. Keine Tab-Wüsten, keine Modal-Ketten — ruhige Seiten
aus Karten-Sektionen. Sichtbarkeit pro Rolle (S7): Was jemand nicht darf, sieht er
nicht (Sektion ausgeblendet) oder nur lesend (mit dezentem Schloss-Hinweis).

```
ORGANISATION
├─ Allgemein            Org-Name, Sprache, Zeitzone, Logo
├─ Unternehmensprofil   Org-Profil aus Crawl (O3): URL, Re-Crawl, editierbare Karten
├─ Team & Rechte        S3 — Herzstück dieser Session
├─ Abo & Credits        intern: Plan "Internal" + Verbrauchsanzeige (echte Zahlen aus
│                       credit_transactions); Kauf-/Plan-UI erst mit Launch (A-Serie)
└─ Papierkorb           C5 — Wiederherstellen / endgültig löschen (Owner/Admin)

ARBEITSWEISE
├─ Regeln               S4 — ALLE Action-Parameter in Klartext an einem Ort
├─ Automation           S5 — globale Defaults Manual/Semi/Auto + Risk-Matrix
├─ Pipeline             Stage-Verwaltung (Reihenfolge, Namen; Won/Lost-Slugs = Invariante)
└─ Mein Tag             Ranking-Gewichte (M2/M3) in Klartext

AI
├─ Modelle & Provider   Multi-LLM: Provider + Modell PRO AUFGABE (Mail-Generierung,
│                       Chat, Klassifizierung, Briefing, Embeddings) — reine Settings-
│                       Werte, Start: Google (bestehende Entscheidung)
├─ AI SDR               Mailbox & Limits (inkl. Warmup, Hard-Cap, Versand-Modus E25) ·
│                       Templates · Verhaltens-Parameter als Regel-Zeilen: Company-
│                       Staffelung E17, Signal-Frische E20, Quality-Gate E21,
│                       Antwort-Timer E22, Reaktivierung, verify_before_sequence,
│                       dynamische Sequenz-Anpassungsregeln (#33 / sequence_rules)
├─ Datennutzung         Learning-Opt-out (E7/C11) + Erklärung
└─ Chat                 Gedächtnis (C24) · Aktivitätsfenster an/aus (N3)

VERBINDUNGEN
├─ Integrationen        Verbinden-Kacheln: Mailbox (Gmail/Outlook), Kalender (M13),
│                       Booking-Quelle-Verweis, Sherloq (Add-on-Status), später
│                       Stripe/Usage-API — Status ehrlich (verbunden/nicht/Fehler)
└─ Mitteilungen         Matrix Kategorie × Kanal (N6) + Prep-Mail-Option (N7)

PERSÖNLICH
├─ Mein Profil          Name, Rolle, Personal Voice (O5), Booking-Quelle (E3),
│                       Signatur, Sprache
├─ Ansicht              Navigation pro User ein-/ausblenden + Reihenfolge. Regeln:
│                       rein visuell (NIE ein Recht) · alles ausblendbar außer
│                       Settings · Ausgeblendetes bleibt per Deeplink + Chat
│                       erreichbar · Chat kann es steuern ("blende Farmer aus" =
│                       Settings-Wert) · getrennt vom Org-Modul-System (Entitlement)
└─ Sicherheit           Passwort ändern, aktive SSO-Verbindung (Anzeige)

SYSTEM (nur Owner/Admin)
├─ Status               B4 — Cron-Läufe, Queues, Alerts (Betriebs-Plan)
└─ Audit-Log            Wer hat was wann geändert — read-only Tabelle mit Filtern
                        (Daten existieren komplett; nur Sichtbarmachung)
```

**Andock-Prinzip:** Modulgebundene Sektionen (Mailbox, Templates, Status, Gedächtnis …)
werden in IHREN Bauplänen gebaut und docken in diese Shell an — dieser Plan baut Shell,
Kern-Sektionen und das Rechte-Modell. Kein Doppel-Bau.

---

## 2. RECHTE-MODELL (S2) — final, nach Olivers Vorgaben

**Vier Rollen (bestehende Entscheidung, hier präzisiert):**

| Bereich | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Daten arbeiten (Kontakte/Deals/Tasks/Listen anlegen+bearbeiten) | ✓ | ✓ | ✓ | nur lesen |
| Team-Listen erstellen | ✓ | ✓ | ✓ | – |
| Eigene AI-Jobs/Erinnerungen anlegen (C2) · eigene Drafts freigeben | ✓ | ✓ | ✓ | – |
| Eigener Automation-Override pro Kontakt (Panel-Toggle) | ✓ | ✓ | ✓ | – |
| Persönliche Settings (Profil, Voice, Mitteilungen, Booking, Gedächtnis) | ✓ | ✓ | ✓ | teilweise |
| **Regeln/Actions/Schwellen/Automation-Defaults ändern** | ✓ | ✓ | **–** (nur Anfrage C6) | – |
| Campaigns aktivieren · Templates verwalten · Pipeline-Stages | ✓ | ✓ | – (Anfrage) | – |
| Integrationen verbinden (eigene Mailbox: jeder für sich) | ✓ | ✓ | eigene Mailbox ✓ | – |
| Team einladen/deaktivieren · Rollen ändern | ✓ | ✓ (nicht Owner/Admins) | – | – |
| **Einzelrechte (user_permissions) vergeben** | ✓ alle | ✓ alle AUSSER `billing.*` (und nie an/über Admins/Owner) | – | – |
| Billing/Käufe | ✓ + delegierte Admins (`billing.approve_credits`, `billing.manage`) | nur delegiert | Anfrage | – |
| Endgültig löschen (Papierkorb) · Org löschen · Export der Gesamt-Daten | ✓ (endgültig löschen auch Admin) | teilw. | – | – |

**Kernsatz (Olivers Vorgabe, verbindlich):** Wesentliche Änderungen an Actions, Regeln
und Schwellen sind Admin-Sache. Member ARBEITEN mit dem System (inkl. eigener Jobs,
eigener Overrides, eigener Freigaben) und beantragen Änderungen per C6-Flow — der Chat
bietet das automatisch an (C12).

**Einzelrechte (user_permissions, ADDITIV — modernes Muster wie Linear/Notion):**
Vergeben dürfen Owner UND Admins (Admins alles außer `billing.*`, und nie an oder über
Admins/Owner — Hierarchie-Schutz). Billing-Delegation bleibt Owner-Sache (Geld).
Rechte-Katalog als feste Liste (keine Freitexte): `rules.edit` · `campaigns.manage` ·
`templates.manage` · `pipeline.manage` · `integrations.manage` · `team.invite` ·
`billing.approve_credits` · `billing.manage` · `trash.purge` · `export.all`. Ein Member
mit `rules.edit` kann exakt das zusätzlich — sonst nichts. Entzug jederzeit. Alles
audit_log inkl. granted_by.
**Durchsetzung IMMER serverseitig** (bestehender Permission-Guard aus Chat-Slice 2 —
EINE Implementierung für UI, Chat und API; die Settings-UI blendet nur aus, sie schützt nicht).

---

## 3. REGELN-BEREICH (S4) — das Schaufenster der Konfigurierbarkeit

Jede Regel als KLARTEXT-SATZ mit Inline-Werten (klickbar editierbar):
"Ein Kontakt wird **kalt** nach [14] Tagen ohne Kontakt → Empfehlung im Hunter."
"Churn-Risiko ab Score [61] · Gewichte: Nutzung [40] · Kontaktfrequenz [20] · …"
Gruppen: Heat & Kontakt · Pipeline & Follow-ups · Churn & Upsell (inkl. Gewichte-Editor
mit Summen-Anzeige) · Signale & ICP (Frische, Kappung, ICP-Schwelle für Matching/Filter) ·
Lifecycle-Trigger (inkl. **UND-
Kombination von Bedingungen** — kleiner Ausbau des Trigger-Schemas: `conditions[]`
statt Einzel-Event, Auswerter iteriert) · Mein-Tag-Gewichte (Verweis auf eigene Seite).
Pro Regel: "Warum?"-Popover (C21) + ab Chat-Phase Wirkungs-Vorschau (C22) — die
preview_rule_impact-Functions werden hier wiederverwendet, NICHT doppelt gebaut.
**Layout-Reserve "Eigene Actions"** (Masterplan Weiche 3): leere Sektion vorgesehen,
erscheint erst mit v2-Registry.
Guardrails: Eingaben validiert (Min/Max aus system_config), Änderung = confirmation +
audit_log, "Auf Empfehlung zurücksetzen" pro Regel (Default-Werte sichtbar).

## 4. GEPARKTE EINZELENTSCHEIDUNGEN — hiermit entschieden (S6)

| Punkt | Entscheidung |
|---|---|
| Team-Listen erstellen | Alle außer Viewer (Tabelle S2). |
| Max. Listen pro Workspace | Kein hartes Limit v1 — Soft-Hinweis ab 50; echtes Limit später via plan_limits (Entitlement A4). |
| Video-Provider-Default | Smart abgeleitet: Microsoft-Kalender verbunden → Teams, Google → Meet; überschreibbar in Mein Profil. |
| Customer-Vererbung bei Company-Wechsel | NIE stumm: Vorschlag mit Bestätigung ("Company ist jetzt Kunde — 3 Kontakte auf Customer setzen?"), Semi-Prinzip. |
| Persönlichkeitsmodell | EIGENES 4-Typen-Modell (dominant/initiativ/stetig/gewissenhaft-analog), bewusst OHNE "DISG"-Markennamen (Markenrecht + Prompt-Freiheit). Bestehende personality-Implementierung prüfen und Label-Set vereinheitlichen. |
| [D51] Admin-Ebene | Durch S2-Matrix + user_permissions-Katalog GELÖST — D51-Rest (Admin-UI) ist die Team-&-Rechte-Seite dieses Plans. |

---

## 5. SLICES

### SET-1 — Migration & Rechte-Fundament
Diagnose: existieren user_permissions/invitations-Tabellen bereits? ·
Migration: user_permissions (user_id, permission aus Katalog, granted_by, created_at,
UNIQUE(user_id, permission)) · invitations (email, role, token, expires_at, status) ·
Rechte-Katalog als Konstanten-Datei + Rollen-Matrix in _shared (Single Source für
Guard, UI und Chat-Tool-Registry — dieselbe Quelle!) · Lifecycle-Trigger-Schema auf
conditions[] erweitern (Migration, abwärtskompatibel) · settings-Keys-Inventur:
alle in diesem Plan genannten Keys mit Defaults seeden.
**Fallen:** Rollen-Matrix EINMAL definieren — Guard, Settings-UI und Chat lesen dieselbe
Struktur · Owner-Schutz: letzter Owner kann nie degradiert/deaktiviert werden.

### SET-2 — Shell, Allgemein, Mein Profil, Ansicht, Sicherheit
Settings-Bereich mit Gruppen-Navigation (Design-Abgleich aus Abschnitt 6) ·
Allgemein · Mein Profil (inkl. Booking-Quelle E3, Signatur; Voice-Teil kommt mit
Onboarding-Phase, bis dahin "Folgt") · **Ansicht** (Navigations-Sichtbarkeit +
Reihenfolge pro User; Sidebar liest user-Ansicht ∩ aktive Org-Module; Settings nie
ausblendbar; Deeplinks/Chat funktionieren auf Ausgeblendetes weiter) · Sicherheit ·
Rollen-Sichtbarkeit der Navigation.

### SET-3 — Team & Rechte (Herzstück)
Team-Seite: Mitglieder-Tabelle (Rolle, Status, letzte Aktivität), Rolle ändern
(Guard-Regeln S2), Einladen (E-Mail + Rolle, invitations-Flow), Deaktivieren ·
Personen-Detail: Einzelrechte-Checkboxen aus dem Katalog (NUR Owner sieht/ändert),
Billing-Delegation prominent · Sektion "Offene Anfragen" (approval_requests dieser Org
mit Entscheiden-Buttons — dieselbe Quelle wie Mitteilungen N2, kein Doppel) ·
audit_log-Einträge für jede Rechteänderung.
**Akzeptanz:** Member sieht Regeln nur lesend; Owner gibt ihm rules.edit → sofort
editierbar (ohne Reload via Realtime); Admin kann Owner nicht degradieren; letzter
Owner nicht löschbar; direkter API-Call ohne Recht → 403.

### SET-4 — Regeln, Automation, Pipeline, Mein Tag
Regeln-Bereich nach Abschnitt 3 (Klartext-Pattern als EINE wiederverwendbare
Komponente!) · Automation-Sektion (globale Defaults Hunter/Farmer/Mein Tag,
Definitionen Manual/Semi/Auto, Risk-Matrix read-only — aus session_notizen-Spez) ·
Pipeline-Stage-Verwaltung (Reihenfolge per Drag, Umbenennen; **Won/Lost-Slugs
unantastbar** [Systeminvariante]; Stage mit Deals löschen → Pflicht-Dialog "verschieben
nach…") · Mein-Tag-Gewichte-Seite (M2-Werte, Reset auf Empfehlung).
**Akzeptanz:** Heat-Wert ändern → confirmation → wirkt im nächsten Score-Lauf
nachweislich; Stage-Umbenennung bricht keine Automatiken (Slug-Test!).

### SET-5 — AI-Sektionen
Modelle & Provider (Aufgabe → Provider/Modell-Dropdowns aus settings.ai_models;
Hinweis-Zeile "Smoke-Test prüft täglich alle konfigurierten Modelle" [B9]) ·
Datennutzung (Learning-Toggle) · Andock-Prüfung: AI-SDR-/Chat-Sektionen (Mailbox,
Templates, Gedächtnis) erscheinen hier, sobald ihre Slices sie liefern — bis dahin
ausgeblendet (kein leerer Platzhalter).

### SET-6 — Verbindungen, Mitteilungen, Papierkorb, Status + Abschluss
Integrationen-Kacheln (Status aus echten Verbindungsdaten; "Verbinden" startet die
jeweiligen Flows) · Mitteilungs-Matrix (N-S2-Baustein andocken) · Papierkorb (C5-UI) ·
System-Status andocken (B4, wenn vorhanden) · **Audit-Log-Seite** (read-only Tabelle
aus audit_log: Wer/Was/Wann/Alt→Neu, Filter nach User/Bereich/Zeitraum — reine
Sichtbarmachung vorhandener Daten) · Gesamt-QA: jede Zeile der
Informationsarchitektur existiert oder ist bewusst "Folgt" · CLAUDE.md/PROGRESS-Update.

**Timing:** SET-1 bis SET-4 gehören VOR den AI SDR (Roadmap-Reihenfolge — der AI SDR
liest Automation-Defaults und Regeln-Werte). SET-5/6 wachsen mit den Modulen.

---

## 6. UI/UX-SESSION SETTINGS

**Stand: Oliver hat bereits ein Settings-Design — es wird separat nachgereicht und ist
Voraussetzung für SET-2 (STOP, bis es vorliegt).** Die Session wird damit zum
ABGLEICH-Auftrag: Das vorhandene Design wird gegen die Struktur (S1) und die folgenden
fünf Patterns geprüft; fehlende Patterns/Zustände werden ergänzt, nicht neu erfunden.

**Die fünf wiederverwendbaren Seiten-Patterns** (jede Settings-Seite komponiert sich
NUR daraus — eine sechste Sonderform ist ein Planungsfehler, STOP + Rückfrage):
   a) **Karten-Sektion** (Titel, Beschreibung, Felder/Toggles; auto-save mit dezentem
      "Gespeichert ✓", kritische Werte mit confirmation)
   b) **Klartext-Regel-Zeile** (Satz mit Inline-Wert-Chips, Warum?-Icon, Reset-Link,
      dezente "zuletzt geändert von {Name}"-Zeile aus dem audit_log — Vertrauens-Detail)
   c) **Matrix** (Zeilen × Kanäle/Optionen — Mitteilungen, Rechte-Checkboxen)
   d) **Verbinden-Kachel** (Logo, ehrlicher Status-Punkt, Primär-Aktion, Fehlerzustand)
   e) **Personen-Tabelle** (Team: Avatar, Rolle-Badge, Aktionen, Detail-Drawer)
**Zustände (Abgleich-Checkliste):** leere Zustände ("Folgt") · read-only mit Schloss +
"Nur Admins — Änderung anfragen →" (Link in den C6-Flow) · Fehlerzustände ·
**Danger-Zone-Pattern** (Org löschen, Owner-only — abgesetzt, rot umrandet, doppelte
Bestätigung mit Namens-Eingabe).
**Design-Leitplanken:** Tokens/typo-Primitives/Lucide/cn() · Ruhe vor Dichte — in
Settings blinkt NICHTS · dieselbe Karten-Sprache wie die App · Suchfeld über der
Settings-Nav (springt zu Sektionen — bei 15+ Seiten Pflicht).

---

## 7. FALLEN (global)
1. Settings-UI schützt nichts — der serverseitige Guard schützt (S2). UI blendet nur aus.
2. Jede Änderung: zentrale update-Function + Validierung + audit_log — nie rohes
   settings-JSONB-Schreiben aus Komponenten (AI-Chat-Parity 6c!).
3. Zentrale Merge-Lesefunktion für jeden settings-Key (bekanntes Muster) — Defaults an EINER Stelle.
4. Won/Lost-Slugs und Risk-Matrix (High Risk nie Auto) sind unveränderbar — im UI als
   fixiert dargestellt, nicht versteckt.
5. Rechte-Katalog, Rollen-Matrix und Chat-Tool-Permissions: EINE Quelle (SET-1).
6. i18n für alles; Regel-Sätze als Templates mit Wert-Slots, nicht String-Bastelei.

---
*Sales OS · Settings Bauplan v1.2 · Juli 2026 · S1–S7 final · Design vorhanden (wird nachgereicht) — Abgleich vor SET-2 Pflicht*
*SOTA-geprüft (Linear/Notion-Muster: Admin-Rechtevergabe, Audit-Sichtbarkeit, zuletzt-geändert-von, Danger Zone)*
*Damit ist [D51] vollständig aufgelöst: Prinzip war aktiv, die Admin-Ebene ist hiermit spezifiziert.*

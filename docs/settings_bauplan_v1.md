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

PERSÖNLICH  ⚠ ZUGANG KORRIGIERT (19.07.2026) — NICHT in der Haupt-Settings-Nav
├─ Mein Profil          Name, Rolle, Booking-Quelle (E3), Signatur, Sprache
│                       (Personal Voice NICHT hier → „Mein Unternehmen"-Gruppe, s.u.)
├─ Ansicht              Navigation pro User ein-/ausblenden + Reihenfolge. Regeln:
│                       rein visuell (NIE ein Recht) · alles ausblendbar außer
│                       Settings · Ausgeblendetes bleibt per Deeplink + Chat
│                       erreichbar · Chat kann es steuern ("blende Farmer aus" =
│                       Settings-Wert) · getrennt vom Org-Modul-System (Entitlement)
└─ Sicherheit           Passwort ändern, aktive SSO-Verbindung (Anzeige)

> **STRUKTUR-KORREKTUR (verbindlich, 19.07.2026):** Die drei „Persönlich"-Seiten (Mein Profil ·
> Ansicht · Sicherheit) sind **KEINE eigenen Punkte in der Haupt-Settings-Navigation** (`/app/settings`).
> Zugang ist **EIN gebündelter Bereich hinter dem Avatar-Dropdown** (Profil-Icon unten links, zeigt heute
> „Mein Profil" neben „Abmelden") mit **drei internen Reitern** (Mein Profil / Ansicht / Sicherheit).
> **Keine Duplizierung** in der Haupt-Settings-Nav. **PRÄZISIERT (SET-3, 19.07.2026):** Die Settings-Nav
> zeigt unten **EINEN einzelnen, dezenten Verweis „Persönliche Einstellungen ↗"**, der auf `/app/profil`
> springt — **kein eigener Gruppen-Block, keine Seiten-Duplikate**. (Auffindbarkeit ohne Doppelstruktur.)
> **Begründung:** Persönliche (user-scoped) Einstellungen
> gehören zum Nutzer, nicht zur Org-Verwaltung — der Avatar ist der erwartete, aufgeräumte Ort dafür (Muster
> wie Linear/Notion); die Haupt-Settings-Nav bleibt auf Org-/Team-Themen fokussiert. **Personal Voice** gehört
> NICHT in „Mein Profil", sondern später in die **„Mein Unternehmen"-Gruppe** der Haupt-Settings-Nav (SET-KB-1/2).
> `settingsNav.ts` markiert diese drei Seiten weiterhin als `visibility:'self'` — die künftige Haupt-Shell
> rendert sie aber **nicht** als eigene Nav-Einträge (Zugang = Avatar).

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

## 8. AI-STUDIO-DESIGN-ABGLEICH (19.07.2026) — Struktur, Timing, Datenmodell

> Oliver hat ein vollständiges Settings-Design (20 Seiten) aus AI Studio gegen diesen
> Bauplan abgeglichen. Ergebnis fließt hier ein, BEVOR ein Settings-Screen gebaut wird.
> Das Design selbst ist NICHT Teil dieses Dokuments — hier nur Struktur/Timing/Datenmodell.

### 8.A — Seiten → SET-Slice → Timing (Zuordnungs-Tabelle)

| Settings-Seite | SET-Slice | Timing |
|---|---|---|
| Workspace / Allgemein (Org-Name, **Sprache & Region** = Sprache/Zeitzone/Datumsformat/Währung, Logo) | SET-2 | **JETZT** — „Sprache & Region" ist **keine eigene Seite**, sondern Teil von Workspace |
| Branding (Logo, Farben) | SET-2 | **JETZT** |
| Benachrichtigungen (Grundgerüst) | SET-2 | **JETZT** (Grundgerüst); Matrix-Rest mit **N-S2** |
| Mitglieder (Team-Tabelle, Einladen) | SET-3 | **JETZT** |
| Rollen & Rechte (Matrix + user_permissions) | SET-1 (Fundament) + SET-3 (UI) | **JETZT** |
| Automatisierung / Aktionsmodus (globale Defaults Manual/Semi/Auto) | SET-4 | **JETZT** |
| Pipeline Stages (Reihenfolge/Namen; Won/Lost = Invariante) | SET-4 | **JETZT** |
| Audit Log (read-only) | SET-6 — **vorziehbar** | **JETZT vorziehbar** (Daten laufen ab Tag 1) |
| Abo & Credits (Anzeige „Internal" + echte Verbrauchszahlen) | SET-2/Abo-Serie | **Anzeige nach Entitlement-Migration**; Kauf-Flow erst **Launch (A-Serie)** |
| Mailbox & Limits (Warmup, Hard-Cap, Versand-Modus) | SET-5 | **SPÄTER — mit AI SDR** |
| Automation Rules (Trigger-Logik) | SET-5 | **SPÄTER — mit AI SDR** (hängt an **[D-lead-status]**) |
| Campaign Builder | — | **SPÄTER — AI-SDR-Kern, KEIN Settings-Thema** |
| Integrations-Manager (echte OAuth) | SET-6 | **SPÄTER — mit AI SDR** (echte OAuth-Flows) |

### 8.B — Drei dokumentierte Entscheidungen

**[SET-KB-1] Neue Settings-Gruppe „Mein Unternehmen" (final, → 8.E; Untertitel z.B.
„Was die AI über euch weiß") — drei DAUERHAFTE Seiten:**
- **Company Profile** — Wer ist das Unternehmen (Positionierung, Zielmarkt, Kontext).
- **Personal Voice Card** — Tonalität/Stil pro User für AI-generierte Nachrichten.
- **Product & Pricing** — Produkt-/Nutzen-/Wettbewerber-/Preis-Kontext als Futter für die
  AI-Nachrichten-Generierung. **Bewusst eine dauerhafte eigene Seite** (SOTA-Muster:
  zentrales AI-Kontext-Zuhause), nicht später wegkonsolidieren.

**[SET-KB-2] Diese drei Seiten werden aus dem Onboarding-Modul HERAUSGELÖST und VOR
AI SDR eingeplant.** Begründung: der AI SDR braucht Company-Profil + Voice + Produktwissen
als Kontext, kommt aber **vor** dem Onboarding. Henne-Ei-Auflösung über **drei getrennte
Ebenen**:
1. **DB-Tabellen** — `org_profile`, `voice_profiles`, **neu: `product_info`** → **jetzt einplanen.**
   ⚠ Diagnose 8.T: `org_profile`/`voice_profiles` existieren **noch NICHT** → alle drei neu
   anlegen (nicht nur `product_info`). Vorhandene `products`-Tabelle (Migr. 028) ist minimal
   (name/description/is_active) → **NICHT** als Product-&-Pricing-Kontext missbrauchen; die
   reichere `product_info` ist eine eigene Tabelle (Nutzen/Wettbewerber/Preis-Kontext als Text).
2. **Settings-Seiten** — anzeigen + **MANUELL editierbar** → **jetzt einplanen.**
3. **AI-Befüllung** (Website-Crawl → AI-Zusammenfassung) → **SPÄTER mit Onboarding**, dockt an
   **dieselben Tabellen** an, **KEIN Umbau**.
- Leere Felder zeigen ehrlich leer / „Folgt" (**Honesty-Regel**). Erst-Befüllung manuell mit
  echten Produktdaten, bis die AI-Pipeline existiert.

**[SET-KB-3] FALLBACK-REGEL (Vermerk für den AI-SDR-Bauplan):** Die Nachrichten-Generierung
des AI SDR **muss auch mit leeren** Company/Voice/Product-Feldern funktionieren (generischer
Basis-Prompt/Vorlage). Gefüllte Felder **verbessern** die Ausgabe, sind **keine harte
Voraussetzung**. Das System muss **ohne Onboarding voll funktionieren.**
→ Gehört zusätzlich als Regel in `docs/ai_sdr_bauplan_v1.md` (Sequenz-Engine/Nachrichten-Slice)
— beim AI-SDR-Slice-0-Doku-Angleich mitziehen.

### 8.C — Navigation komplett (Bauplan-Regel)

Die Settings-Navigation (**alle Gruppen + alle Menüpunkte**) wird **EINMAL vollständig
gebaut (SET-2)** — die Seiten dahinter gestaffelt. Noch nicht gebaute Seiten → **ehrliche
„Folgt"-Seite** oder **rollenbasiert ausgeblendet**, **nie eine leere Baustelle**.
(Konsistent mit S1 „Andock-Prinzip" + Abschnitt 6 Zustand „Folgt".)

### 8.D — Design-Fund als Bauplan-Regel: Pipeline Stages Won **UND** Lost

Pipeline Stages behandelt **SOWOHL „Gewonnen" ALS AUCH „Verloren"** als **unlöschbare
System-Invariante** (Slugs `gewonnen`/`verloren`) — **beide unantastbar**, nicht nur „Gewonnen".
Verankert in CLAUDE.md (DB-Schema-Invariante + `hunterMappers` `WON_STAGE_SLUG`/`LOST_STAGE_SLUG`/
`isTerminalStage` ↔ Edge `_shared/terminalStages.ts`). SET-4-UI: beide fixiert dargestellt
(nicht löschbar/umbenennbar), nicht versteckt. (Präzisiert SET-4 + Falle 4.)

### 8.E — Gruppen-Name: „Mein Unternehmen" (ENTSCHIEDEN 19.07.2026)

**Final: „Mein Unternehmen"** — Untertitel z.B. „Was die AI über euch weiß".
Direkt, besitzanzeigend, DE-nativ, matcht die Sidebar-Sprache (Mein Tag / Mein Profil).
„Knowledge Base" (zu generisch, klingt nach Support-Docs) verworfen; ebenso die
Alternativen „Unternehmens-Kontext" (zu technisch) und „AI-Wissen"/„AI-Kontext"
(liest sich wie AI-Einstellungen statt Unternehmens-Stammdaten).

### 8.T — Diagnose-Snapshot (Regel A, Stand 19.07.2026) — Bestand für spätere Slices

| Baustein | Status | Fundort |
|---|---|---|
| Settings-Screen / Routing / Nav-Grundgerüst | **teilweise** — Route `/app/settings` rendert NUR `TeamSettings` direkt; **keine Shell/Gruppen-Nav** | `App.tsx:127`, `features/settings/TeamSettings.tsx` |
| `user_permissions` | **existiert** | Migr. 007 |
| `invitations` (+ teams) | **existiert** | Migr. 042 (`db.ts` `getInvitations`/`createInvitation`) |
| `org_profile` | **fehlt — neu** (SET-KB-2) | — |
| `voice_profiles` | **fehlt — neu** (SET-KB-2) | — |
| `product_info` | **fehlt — neu** (SET-KB-2); `products` (028) ist minimal, **nicht** dasselbe | — |
| `pipeline_stages` + Won/Lost-Slugs | **existiert** — JSONB top-level in `settings` (seed 012); Won/Lost in `hunterMappers` + Edge-Mirror | Migr. 006/012, `hunterMappers.ts:404` |
| `audit_log` + Trigger | **existiert** — Tabelle (006) + security-definer `audit_write`-Trigger (010) | Migr. 006/010 |
| Automation-Defaults (Manual/Semi/Auto) + Schwellen (Heat/Churn/Follow-up) | **existiert** — `settings.automation_defaults` (`default_automation_level: semi`) + `settings.thresholds` (heat_status/churn_risk …) | Migr. 006/012 |

**Neu anzulegen für die JETZT-Slices:** `org_profile` · `voice_profiles` · `product_info`
(SET-KB-2 Ebene 1) · Settings-Shell/Gruppen-Nav (SET-2) · Rechte-Katalog-Konstanten +
Rollen-Matrix Single Source (SET-1). Alles Übrige oben ist **Bestand** und wird angedockt,
nicht neu gebaut.

---
*Sales OS · Settings Bauplan v1.3 · Juli 2026 · S1–S8 · Design vorhanden (wird nachgereicht) — Abgleich vor SET-2 Pflicht*
*v1.3 (19.07.2026): Abschnitt 8 (AI-Studio-Design-Abgleich) — Seiten→Slice-Timing · [SET-KB-1/2/3] · Nav-komplett-Regel · Won/Lost-Invariante · Gruppen-Name offen · Regel-A-Diagnose*
*SOTA-geprüft (Linear/Notion-Muster: Admin-Rechtevergabe, Audit-Sichtbarkeit, zuletzt-geändert-von, Danger Zone)*
*Damit ist [D51] vollständig aufgelöst: Prinzip war aktiv, die Admin-Ebene ist hiermit spezifiziert.*

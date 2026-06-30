# Session-Übergabe 2026-06-30 — Farmer-Modul DB-Wiring KOMPLETT

> Spanne: seit Übergabe `2026-06-27`. Das **gesamte Farmer-Modul** wurde von Mock auf echte DB-Daten
> verdrahtet (von Migration 048 bis zum Abschluss-Audit). Alles auf `main`, Gates durchgängig grün.
> Detail-Einträge stehen im Body von `PROGRESS.md` (`[SLICE …]`/`[FIX …]`/`[SCORE-FIX]`/`[BUGFIX]`/
> `[HONESTY-WURZELFIX]`/`[FARMER-ABSCHLUSS]`).

---

## Was fertig wurde

### DB-Fundament (Migrationen)
- **048** — Farmer-Score-Felder auf `contacts` (`churn_score`/`upsell_score`/`health_score`/`health_status`/
  `score_drivers`/`data_sources`) + `mrr_monthly`/`arr_yearly`/`mrr_source` auf `companies` + Settings-Seed
  (Schwellen `churn_risk_threshold`/`upsell_threshold` + Gewichte `churn_weights`/`upsell_weights` + health_formula).
- **049** Cron score-churn-risk (04:00) · **050** `upsell_drivers` (getrennt von score_drivers) · **051** Cron score-upsell (05:00).
- **052** Score-Fix: `churn_weights.overdue_tasks → 0` (chirurgisch via `jsonb_set`).
- **053** KB-Eintrag „Farmer-Kundengesundheit (Churn-/Upsell-Scoring)" — **NOCH NICHT GEPUSHT** (siehe „Offen").
- **Remote-Stand:** Migrationen bis **052** applied. Edge Functions `score-churn-risk` + `score-upsell` deployt,
  Demo-Org re-gescored + verifiziert.

### Edge Functions (Scoring)
- `score-churn-risk` + `score-upsell`: Progressive Data Logic, Gewichte/Schwellen FRISCH aus `settings.thresholds`,
  SKIP bei `available===0` (kein Fake-0), Update nur bei Änderung, 0-Punkte-Treiber nicht gelistet.
- **Score-Fix:** `heat_hot` zählt nur bei `heiss` (nicht `warm`); churn `overdue_tasks`-Gewicht 0 (misst AM-Disziplin,
  nicht Kundengesundheit — bis echte Usage-Signale [D49] da sind).

### Screen (ScreenFarming)
- Alle 6 Tabs echt: KPIs/Health (aus `customers`), Top-5 (`calculateFarmerPriority`), Kunden/Retention/Upsell/Signals/Follow-ups.
- Aufgeklappter Bereich (`FarmerExpandedCardContent`) echt: Kommunikation via `getContactCommunications`, Subscription aus `customer`/companies, Usage/KI „Folgt".
- **Stage-Leak in Top-5 geschlossen** (overdue_task/going_cold Render-Stellen Subscription-Slot).

### Panel (FarmerSidepanel, Slices 8a–8e)
- **8a** Header/KontaktZeile echt (`contactToProfile`/`getContactDetail`) · **8b** 4 Tabs echt (`*ByContact`) +
  **alle Schreib-Aktionen** (Task/Notiz/Komm — `updateTask` projektweit NEU, Hunter+Farmer) · **8c** AktiveSignale echt
  + **Churn-Vorrang** (`applyFarmerDisplayPrecedence`/`displaySignals`) · **8d** Subscription aus companies ·
  **8e** Details-Tab Person+Firma editierbar (`contactDetailFields`), Telefon via `DetailPhoneList`, Stift-Deep-Link.
- **KontaktZeile alle 4 Felder inline editierbar** (Email/Telefon/LinkedIn/Web), Hunter+Farmer.

### Systemweite Shared-Fixes
- Dropdown-z-index (über Vollansicht) · `DetailField`-Fehlertext · sichtbarer Telefon-Stift ·
  `isValidPhone` (≥3 Ziffern, „+" optional) · `CommunicationChain`-Linie bei 1 Eintrag ·
  **„Growth"-Default entfernt** (`subscriptionPlan` optional — Honesty-Wurzelfix).

### Abschluss-Audit (2 Explore-Agenten, Screen+Panel+Vollansicht)
3 Lücken gefunden + geschlossen: `mockUsage` Fake-Zahlen → „Folgt" [D49] · Churn-Vorrang im Upsell-Tab · Retention-Text vereinheitlicht. **Kein Mock/Fake mehr im Farmer.**

---

## Was noch offen ist
- **Migration 053 (KB Scoring) pushen** — bewusst nicht gepusht; `supabase db push` am Sessionstart.
- Farmer-Deferred (siehe unten): KI-Pipeline [D5], Usage [D49], Deals-Tab [D50], Mail [D29], Snooze-Persistenz [D48], Lifecycle [D38].
- **Companies-Modul** noch nicht begonnen.

## Nächste Schritte (Reihenfolge)
1. **`supabase db push`** (053 anwenden) am Sessionstart.
2. **Companies-Modul starten** — Empfehlung: erst ein **Diagnose-/Bestandsaufnahme-Slice** (analog Farmer-Abschluss-Audit): was existiert (UI/Mock/DB), welche Queries/Felder, welche Invarianten gelten.
3. Danach Companies in Slices (Diagnose-First, STOP für Freigabe — bewährtes Muster).
4. Querschnitt-Backlog nach Companies: [D43] Historisierung (hartes Gate vor Phase 4), AI-Pipeline [D5], [D29] Mail.

---

## Wichtige Entscheidungen (diese Session)
- **Churn-Vorrang vor Upsell** (29.06.2026): bei aktivem Churn/Gekündigt wird Upsell als Empfehlung unterdrückt
  (Retention vor Expansion). Single Source `applyFarmerDisplayPrecedence` → `calculateFarmerPriority.displaySignals`.
  Gilt Panel + Top-5 **und** dedizierte Tabs (Upsell-Tab filtert über `displaySignals`).
- **KontaktZeile vollständig inline editierbar** (Revision der 8a-„read-only"-Entscheidung): alle 4 Felder inline,
  Vollansicht-Weg bleibt über Header-Pfeil. Begründung: Einheitsgebot + Nutzwert.
- **Honesty-Wurzelfix `subscriptionPlan`:** kein „Growth"-Default mehr — NULL → ausgeblendet/„—".
- **Score-Fix:** `overdue_tasks`-Gewicht 0 + `heat_hot` nur bei `heiss` (Honesty/Korrektheit der Scores).
- **`mockUsage` ist Honesty-Verstoß** → entfernt; Usage überall ehrlich „Folgt" [D49].
- **Single Source Details-Tab:** `contactDetailFields.ts` (Options + DETAIL_MAP + seed) — Hunter+Farmer, keine Dublette.

## Offene Fragen
- Companies-Modul: Startpunkt/Scope noch offen (Diagnose-Slice klärt das).
- [D50] Farmer Deals-Tab: hängt mit [D38] Won→Kunde-Lifecycle + MRR-aus-Won-Deal zusammen — beim Bau mitdenken.

---

## Neue Library-Komponenten / -Utils
- **`src/lib/contactDetailFields.ts`** (NEU) — Single Source des Details-Tabs (Options + `DETAIL_MAP` Feld→DB-Spalte +
  `PHONE_TYPES` + `seedContactDetails`), geteilt von Hunter+Farmer. Kein Component → nicht in `components/index.ts`
  (lib-Util). In CLAUDE.md unter „Helfer" eingetragen.
- Keine neuen Panel-Block-/Feature-Komponenten — alle Änderungen an bestehenden Komponenten (FarmerSidepanel,
  ScreenFarming, panel-blocks DetailField/DetailPhoneList/UsageBox/SubscriptionBox/KontaktZeile/CommunicationChain,
  HunterSidepanel, ui/dropdown-menu). `npm run structure-check` grün.

---

## Deferred-Items (vollständig)
- **[D5]** AI-Pipeline — KI-Kurzakte + Action-Drawer-Entwürfe („Folgt"-Platzhalter überall).
- **[D29]** Einladungs-/Mail-Versand — Edge Function (Footer-Mail disabled, Nango-Anbindung).
- **[D36]/[D37]** Hunter Trial-Kacheln.
- **[D38]** Lifecycle-Trigger Won-Deal → `contact_status='kunde'` (+ MRR/Subscription-Effekt).
- **[D43]** Historisierung systemweit (Hunter+Farmer) — hartes Gate vor Phase 4 / erstem echten Kunden.
- **[D48]** Snooze/Ignorieren-Persistenz (aktuell lokaler State; ActionDrawer onSnooze = Toast).
- **[D49]** Usage-Telemetrie (Produkt-Nutzung) — UsageBox „Folgt", Score-Erweiterung (Login-Frequenz/Nutzung).
- **[D50]** Farmer Deals-Tab + Deal-Anlegen (`getDealsByContact`/`createDeal`; geteilte Komponente mit Hunter; MRR/Lifecycle-Bezug).
- **[CLEANUP]** `score_drivers` → `churn_drivers` umbenennen (Symmetrie mit `upsell_drivers`).

---

## Pre-Push-Checkliste (DB-Features dieser Session)
Die DB-Features (048–052 + Edge Functions) wurden **während** der Session geshippt (push/deploy/verifiziert):
- ☑ `org_id` + RLS + CASCADE — Score-Felder additiv auf bestehenden RLS-Tabellen (contacts/companies); settings via 010.
- ☑ audit_log — via DB-Trigger (Score-Writes + settings-Update getriggert).
- ☑ `system_config`/`settings` statt hardcodiert — Schwellen/Gewichte aus `settings.thresholds`.
- ☑ knowledge_base — als Migration (053, idempotent UNIQUE(org,feature)) — **nur diese ist noch offen (nicht gepusht)**.
- ☑ Neue Komponenten in audit IN_SCOPE — nur bestehende Komponenten geändert + lib-Util (kein Typo-Kanon-Scope); audit grün.
- n/a api_usage (keine AI-Calls in dieser Session).

**Gates am Sessionende:** build ✅ · audit 20 PASS / 0 FAIL ✅ · structure-check PASS ✅

---

## NACHTRAG Teil 2 (30.06.2026) — [D51] Konfigurierbarkeit-als-Architektur

Nach dem Farmer-DB-Wiring-Abschluss (oben) folgte in derselben Session der Konfigurierbarkeits-Strang.

### Was fertig wurde
- **[D51] Prinzip „Konfigurierbarkeit-als-Architektur / Logik-als-Daten" verankert** (CLAUDE.md, eigener `##`-Abschnitt, gleichrangig zur Honesty-Regel): jeder verhaltenssteuernde **Wert UND jede Regel** liegt in der DB (`settings`), pro Org, laufzeit-gelesen, AI-Chat-änderbar [[D5]]; Code-Literal für Verhalten = Architektur-Verstoß; Defaults nur als Fallback, der den Seed spiegelt + bei Lese-Fehler LAUT scheitert (kein stummer Degrade). Kategorien A/B/C. Admin-Schicht (wer darf ändern) = deferred (Rollen-System).
- **Modul-Abschluss-Gate** (4 Prinzipien) in CHECKLIST.md als wiederkehrendes Pflicht-Gate angelegt (Single Source · Performance · Konfigurierbarkeit · Honesty).
- **Farmer-Konfig-Fix:** Tages-Cutoffs (30/14/7) → `settings.thresholds.timing_windows` (Migr. **054**); Churn-Vorrang → Schalter `churn_suppresses_upsell` (Regel-Logik bleibt im Code); stummer Frontend-Fallback → ReferenceScreens **Drei-Zustands-Gate** (eine `settingsQuery`) + Panel rechnet nur bei geladenen settings.
- **Hunter-Konfig-Audit + Slice 1:** HunterReference auf **eine `settingsQuery` + Drei-Zustands-Gate** (stummer Fallback #1 Stagnation / #4 Priority-Gewichte → echtes C); „Neu-in-Pipeline"-Fenster → `timing_windows.new_pipeline_short_days/_long_days` (Migr. **055**). FarmerReference war bereits gleichwertig (kein Angleich nötig).
- **Hunter-Slice 2 (Terminal-Stages):** Variante 1 (DRY) — geteiltes `supabase/functions/_shared/terminalStages.ts` statt duplizierter Edge-Literale; Won/Lost = **System-Enum** (bewusst KEIN Config, als Invariante in CLAUDE.md dokumentiert; kein Migration/`type`-Flag/Write-Eingriff).
- **Migrationen 053 (KB Scoring) + 054 + 055 alle applied**; Edge Fns `score-churn-risk`/`score-upsell`/`score-deal-health` re-deployt; Demo re-gescored → Scores unverändert (erwartet, gleiche Werte/Slugs).
- **Pipeline-Konfigurierbarkeit-Diagnose** durchgeführt → Befunde im `[DEFERRED] Pipeline-Stage-Management-UI` festgehalten.

### Wichtige Entscheidungen (Teil 2)
- **Konfig-Prinzip [D51]** gilt **ab sofort als aktive Invariante** (nur Admin-Schicht + KONFIG-AUDIT-Tooling sind deferred).
- **Won/Lost-Slugs = System-Enum**, nicht pro Org konfigurierbar (struktureller Bezeichner, DealStage-Typ + Write-Pfad). Org-Anpassung = nur die **aktiven** Stufen (Name/Reihenfolge/Anzahl).
- **`icp_score_threshold:65` BEHALTEN** — Vorab-Einstellung für die kommende, selbst gebaute ICP-Berechnung (kein Zombie).

### Neue settings.thresholds-Keys (alle C)
`timing_windows` (`last_contact_days`/`inactive_days`/`recent_contact_days` Seed 054 · `new_pipeline_short_days`/`new_pipeline_long_days` Seed 055) · `churn_suppresses_upsell` (Seed 054).

### Neue Library / Utils (Teil 2)
- `supabase/functions/_shared/terminalStages.ts` (Edge-Util, geteilte Won/Lost-System-Anker; spiegelt hunterMappers). Keine neue React-Komponente → nicht in `components/index.ts`. structure-check grün.

### knowledge_base
Kein neuer KB-Eintrag für Teil 2 — Konfigurierbarkeit ist interne Architektur (settings-Keys/Refactors), kein User-Feature; 053 (Scoring) deckt das relevante Feature bereits ab.

### Offene Deferred (Teil 2, vollständig)
[D51]-Admin-Schicht (Rollen/Rechte) · [KONFIG-AUDIT]-Tooling (`scripts/audit.ts` + Pre-Push) · [DEFERRED] Pipeline-Stage-Management-UI (mit Befunden: DealStage-Typ lockern, Pflichtfelder stagnation_days/probability, Won/Lost schützen, `dealStageColors` aufräumen, Kanban-Board noch Mock) · Hunter-ICP-Berechnung + ICP-Bänder vereinheitlichen (Donut 75/50 vs priority 80/60) · Signal-Routing-Regel (`routed_to`) + Signal→Aktion-Resolver-Konfig · Deal-Health-Kompositum · AI-SDR-Gating · dynamische Zeitfenster-Labels (kosmetisch).

---

## Modul-Abschluss-Gate (PFLICHT — Lauf 30.06.2026)

Vier Prinzipien (CHECKLIST.md „🚦 Modul-Abschluss-Gate") für die in dieser Session abgeschlossenen Module.

### Farmer — **BESTANDEN** ✅
| Prinzip | Status | Beleg |
|---|---|---|
| (1) Single Source | ✅ | `contactToProfile`/`getContactDetail`/`companies`/`contactDetailFields`/`calculateFarmerPriority` (ein Resolver) · geteilte Query-Keys (`contactCommunications` Panel↔Expanded) · KontaktZeile/DetailField geteilt |
| (2) Performance | ✅ | N+1-Audit PASS (kein `useQuery` in `.map`) · geteilte Caches · PanelSkeleton + `placeholderData` + Prefetch-on-hover · `getContactDetail` mit gezieltem Embed |
| (3) Konfigurierbarkeit [D51] | ✅ | Schwellen/Gewichte/Heat/`timing_windows`/`churn_suppresses_upsell` alle C; Drei-Zustands-Gate (kein stummer Degrade); Edge-Fns `if sErr throw` |
| (4) Honesty | ✅ | `mockUsage` entfernt → „Folgt"; kein Fake; EmptyStates; „Folgt" für KI/Usage/NRR/Owner/Tags |
- **Deferred (kein Verstoß, noch nicht gebaut):** [D5] KI-Kurzakte/Action-Drafts (beim Bau MUSS der Mail-/Prompt-Content C sein — Chat-änderbar pro Flow) · [D49] Usage-Telemetrie · [D50] Deals-Tab · [D29] Mail · [D48] Snooze-Persistenz.

### Hunter (Konfig-Scope) — **BESTANDEN** ✅
| Prinzip | Status | Beleg |
|---|---|---|
| (1) Single Source | ✅ | `hunterMappers` (ein Resolver) · EINE `settingsQuery` (Key `['settings',org]`, geteilt mit Farmer) · `_shared/terminalStages.ts` (DRY statt Doppel-Literal) |
| (2) Performance | ✅ | 2 redundante getSettings-Sub-Queries entfernt → eine settingsQuery · geteilter Cache · N+1-Audit PASS |
| (3) Konfigurierbarkeit [D51] | ✅ (für auditierte Werte) | Heat/Stagnation/Priority-Gewichte/Neu-in-Pipeline-Fenster = C; stummer Degrade geschlossen (Gate); Won/Lost = System-Enum (dokumentiert, bewusst kein Config) |
| (4) Honesty | ✅ | Hunter ohne Fake-Werte; „Folgt"-Platzhalter; keine Regression diese Session |
- **Deferred / noch nicht gebaut (kein Verstoß):** ICP-Berechnung (Spalte nie befüllt; `icp_score_threshold:65` wartet als Vorab-Einstellung) · ICP-Bänder vereinheitlichen (Donut 75/50 + priority 80/60 → ein Satz) · Signal-Routing-Regel (`routed_to`) + Signal→Aktion-Resolver-Konfig · Deal-Health-Kompositum-Score · AI-SDR-Gating.
- **Kosmetisch deferred (kein Verhaltens-Verstoß):** dynamische Zeitfenster-Labels „7d"/„30d" · ICP-Donut-Farben · Top-N=5 Display-Cap.

**Fazit:** Beide Module bestehen das Gate; alle offenen Punkte sind bewusst Deferred (noch-nicht-gebaute Features), keine versteckten Verstöße. Das Gate ist ab sofort fester Bestandteil jedes Modul-Abschlusses (CHECKLIST.md).

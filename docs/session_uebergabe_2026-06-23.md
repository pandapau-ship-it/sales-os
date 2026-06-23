# Session-Übergabe — 2026-06-23

> Spanne: seit `docs/session_uebergabe_2026-06-22_teil3.md`. Schwerpunkt dieser Session:
> **Farmer-Screen UI komplett (alle 5 Tabs)** + [D35] Signal-Action-Resolver Phase 0 + Doku.

---

## 1. Was seit der letzten Session fertig wurde

### Farmer-Screen — UI komplett (alle 5 Tabs, Mock, kein DB-Wiring)
- **Übersicht** — `FarmerKpiCards` (MRR/Churn-Risk-MRR/Upsell/NRR) + `FarmerHealthOverview` (Health-Bars).
- **Kunden** — `FarmerKundenKachel` (HunterCard-Wrapper, `statusBadge`-Slot = SUBSCRIPTION statt STAGE) + `customerStatusConfig` (active/cancelled + grauer Fallback) + `SubscriptionBadge` (Form 1:1 HeatBadge: `rounded-full`, kein Border, `text-[12px]`, Lucide-Icon).
- **Retention** (ehem. „Churn & Trial" → umbenannt) — `FarmerRetentionKachel`, 3 Typen: **Churn Risk** (rote Badge, „Retention sichern"), **Wird kalt** (= 1:1 Hunter Cold-Row: blaue Snowflake-„Cold"-Badge + „Start Outreach" + „Snooze", nur bei `heat='COLD'`), **Gekündigt** (rote Badge, „Jetzt anrufen"). Alte bespoke Churn-UI (`font-mono`) ersetzt.
- **Upsell** — `FarmerUpsellKachel` (Struktur 1:1 Retention), grüne Zap-„Upsell Potential"-Badge + „Action"-CTA.
- **Signals** — bestehender `LinkedinSignalCard` mit `statusBadge`-Passthrough; **nur echte Aktivitäts-/LinkedIn-Signale** (Churn/Upsell sind KEINE Signale → eigene Tabs) + Bulk-Auswahl-Leiste wie Hunter.
- Alle Signal-Rows hellgrau (`app-bg`, wie Hunter); CTAs = Platzhalter-Toast bis Action-Panel ([D34]).
- HEAT überall über kanonischen Enum → `HeatBadge` (Single Source `constants.ts`). „Cold" bleibt englisch — bewusste Entscheidung (Eindeutschung wäre separater Slice, app-weit).

### [D35] Signal-Action-Resolver — Phase 0 (Architektur-Vorbereitung)
- `lib/signalActions.tsx`: `signalActionConfig(signal, handlers)` + serialisierbare `SignalActionType`/`SIGNAL_ACTION_CATALOG` (Handler erst beim Dispatch gebunden). `SignalActionDrawer` nutzt jetzt den Resolver statt Inline-Config — **verhaltens-identisch**, kein Schema. Macht spätere DB-Regeln (Phase 1) ~1 Tag statt 2–3.

### Davor in dieser Spanne (post-teil3, bereits auf main)
- [D21] **Scheibe 8** — `MfaBanner` (2FA-Empfehlung beim Login + TOTP-Setup, überspringbar).
- Hunter-Übersicht **Dringlichkeits-Score** (`calculatePriorityScore`, Migr. **045**, settings-Gewichte) + PRIO-Badge entfernt + Top-5 aus mehreren Signal-Quellen.
- **Profilzeilen-Konsistenz** erzwungen (Audit: Kurz-Zeitformat WARN + internes-Bewertungs-Label FAIL; CLAUDE-Regel).

### Doku / Library
- CLAUDE.md: **Farmer-vs-Hunter-Routing** (`contact_status` entscheidet), Tab-„Retention", zwei Badge-Typen (Heat-Pille vs Status-Badge), `farming/`-Komponenten-Tabelle.
- PROGRESS: **[D33]–[D39]** dokumentiert. CHECKLIST: Farmer auf `[~]`.
- KB-Migration **046_knowledge_base_farmer.sql** (5 Farmer-Features) + `docs/knowledge_base.md` ergänzt. **Noch nicht db-gepusht** (db push am Sessionstart).

---

## 2. Was noch offen ist
- **Farmer DB-Wiring** — alle Tabs sind Mock; echte Scores (`churn_score`/`upsell_score`), echte Signale, echtes `last_contacted_at`/Subscription aus DB.
- **Farmer Info-Panel [D33]** — öffnet aktuell den alten `CustomerDrawer` (`font-mono`, nicht im typo-Kanon). Auf typo-Standard / `HunterSidepanel`-Muster bringen.
- **Farmer Action-Panel [D34]** — existiert nicht; alle CTAs sind Platzhalter-Toasts.
- **Hunter Trial-Kacheln [D36]/[D37]** + **Lifecycle-Trigger [D38]** + Farmer „Kunde wird kalt" [D39].
- **[D29]** Einladungs-Mail Edge Function · AI-Pipeline ([D5], löst „Folgt"-Platzhalter).

---

## 3. Nächste Schritte (Reihenfolge — laut CLAUDE Farmer-vs-Hunter-Routing)
1. **Farmer DB-Wiring** (echte Daten/Scores in alle 5 Tabs) — inkl. [D33] Info-Panel + [D34] Action-Panel.
2. **Hunter Trial-Kacheln** [D36]/[D37] (Follow-ups-Tab) — braucht `trial_end_date`/`subscription_status` in `companies`.
3. **Lifecycle-Trigger [D38]** Trial→Kunde (`contact_status→'kunde'`, Hunter→Farmer).
4. **db push** der KB-Migration 046 (am Sessionstart).

---

## 4. Wichtige Entscheidungen
- **Heat-Labels bleiben kanonisch englisch** (Single Source `constants.ts`, Hunter = Farmer). Eindeutschung = bewusst späterer, app-weiter Slice.
- **Churn/Upsell sind keine „Signale"** — sie haben eigene Tabs; der Signals-Tab zeigt nur Aktivitäts-/LinkedIn-Signale (wie Hunter).
- **Routing über `contact_status`**: Lead+Trial → Hunter · Kunde → Farmer; `heat='kalt'` landet je nach `contact_status` im richtigen Screen, nie in beiden.
- **HunterCard-Wrapper-Pflicht** durchgezogen: alle Farmer-Kacheln sind dünne Wrapper; Erweiterungen nur additiv (`statusBadge`), `actionRowClassName` wurde nach Gebrauch wieder zurückgebaut (Hunter lean).

## 5. Offene Fragen
- Soll der Signal-Tab später ebenfalls echte Signale aus DB ziehen, oder bleibt er bis zur Signal-Ingest-Anbindung Mock?
- Heat-Labels app-weit eindeutschen — wann (eigener Slice)?

## 6. Neue Komponenten in der Library
`farming/`: `FarmerRetentionKachel`, `FarmerUpsellKachel`, `SubscriptionBadge` (+ bereits davor `FarmerKpiCards`, `FarmerHealthOverview`, `FarmerKundenKachel`, `customerStatusConfig`).
`lib/`: `signalActions.tsx` (Resolver). Alle in `@/components`-Barrel + `audit.ts` IN_SCOPE.

## 7. Deferred-Items (vollständig)
[D1]–[D31] unverändert · [D32] bewusste Lücke · **[D33]** Farmer Info-Panel typo-Standard · **[D34]** Farmer Action-Panel · **[D35]** Signal-Action-Rules (Phase 0 ✅, Phase 1/2 offen) · **[D36]** Hunter „Trial läuft aus" · **[D37]** Hunter „Trial abgelaufen ohne Conversion" · **[D38]** Lifecycle-Trigger Trial→Kunde · **[D39]** Farmer Retention „Kunde wird kalt". Höchster Tag: **[D39]**.

---

## 8. Pre-Push (DB-Features)
Diese Session **kein neues DB-Feature** (reines Frontend/Mock). Einziges DB-Artefakt: KB-Migration **046** (idempotent, `org_id` gesetzt, ON CONFLICT DO UPDATE) — **git committed, NICHT db-gepusht** (db push am Sessionstart).

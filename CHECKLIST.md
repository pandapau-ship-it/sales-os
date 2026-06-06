# Sales OS — Build Checklist

> Single Source of Truth für den Umsetzungsstand aller Anforderungen aus CLAUDE.md.
> CLAUDE.md = WARUM/WIE · diese Datei = WAS-noch-offen.
> Legende: `[ ]` offen · `[x]` erledigt · `[~]` teilweise
> Pflege: automatisch bei jeder relevanten Änderung (→ CLAUDE.md "Selbst-Wartung").
> Prüfen mit: `npm run audit`

---

## 🛠️ Selbst-Wartung (Tooling)
- [x] CHECKLIST.md als Single Source of Truth — *Umsetzungsstand zentral*
- [x] `scripts/audit.ts` + `npm run audit` — *prüft die 5 Pflicht-Prüffragen automatisch*
- [ ] audit.ts an Pre-Commit-Hook hängen — *kein Commit mit hartem Verstoß*
- [ ] audit.ts erweitern wenn neue Infrastruktur existiert (DB, lib/ai.ts …)

---

## 🗄️ Datenbank (Phase 5 — noch nicht gestartet)

### Multi-Tenancy & Isolation (zuerst, nicht verhandelbar)
- [ ] `organizations` Tabelle zuerst — *Basis für alles, brand_*/onboarding_* Felder*
- [ ] `organization_id NOT NULL` + `ON DELETE CASCADE` in JEDE Tabelle — *Mandanten-Isolation*
- [ ] RLS + `org_isolation` Policy auf jeder Tabelle — *kein Kunde sieht fremde Daten*
- [ ] `organization_id` als JWT Custom Claim — *Isolation auch im Token*
- [ ] Index auf `organization_id` in jeder Tabelle — *sonst Full-Scan bei jeder RLS-Query*
- [ ] Ownership-Felder überall: `created_by`, `assigned_to` — *Rollen/Verantwortung von Tag 1*

### Kern-Tabellen
- [ ] users, contacts, companies, pipeline_deals, communications, tasks
- [ ] sequences, sequence_rules, contact_sequences, kurzakte_entries *(Append-Only)*
- [ ] signals — *inkl. `routed_to`/`routed_at`/`routing_reason` (Signal Routing)*
- [ ] user_modules, system_config, audit_log, ai_usage, error_log
- [ ] notifications, notification_preferences — *Notification-Infrastruktur*
- [ ] merge_candidates — *Duplikat-Entscheidung durch User*
- [ ] invitations, api_usage, data_deletion_requests — *SaaS/DSGVO*
- [ ] pipeline_stages *(in DB, nicht hardcoded)*, heat_status_config
- [ ] lists, list_contacts — *Listen (static|dynamic), JSONB-Filter*
- [ ] contacts: `contact_status`, `lead_source` (Pflicht), `opt_out`, `icp_score` (optional) — *Kontakte-Datenobjekt*
- [ ] users.role = `owner|admin|member|viewer` — *kanonisches Permission-Modell*
- [ ] audit_log Schema: action/object_type/object_id/old_value/new_value (read-only)
- [ ] automation_rules — *globaler Risk-Override pro Org (low/medium_risk_auto, medium_confidence)*

### Pflichtfelder pro Tabellentyp
- [ ] Aktionen: `source`, `execution_mode`, `executed_by`, `approved_by`, `approved_at` — *AI-Automation*
- [ ] Sending: `sending_channel/provider`, `external_message_id`, `delivery_status`, `sent/delivered/read_at`
- [ ] Intent: `intent_detected`, `intent_confidence`, `requires_human`, `auto_reply_*`
- [ ] Inbox: `inbox_read/processed/processed_at/processed_by`
- [ ] CRM: `crm_provider`, `crm_external_id`, `crm_sync_status`, `crm_sync_error`
- [ ] Dynamic-Sequenz: `read_count`, `dynamic_adjustment`, `adjustment_reason`

### Triggers & Seed
- [ ] Triggers: Cluster-Vererbung, Audit Log, Heat-Timestamp, updated_at — *nichts vergessen*
- [ ] `system_config` Seed: alle `automation_*`, `sequence_dynamic_*`, `automation_risk_*`, `followup_auto_days`
- [ ] TypeScript Types generieren (`supabase gen types typescript`)
- [ ] Supabase Auth (Email + Passwort)

---

## ⚙️ Edge Functions (Business-Logic — nie im Frontend)

### Read/Query (MCP-ready)
- [ ] `get_contact_summary`, `get_pipeline_summary`, `get_churn_risks`, `get_signals_today`, `get_smart_list`, `execute_action`

### Sequenz Engine
- [ ] `process_new_lead()` — *Sequenz-Zuweisung + Signal-Routing + AI-Entwurf*
- [ ] `classify_intent()` — *Intent + Routing + Inbox + Kurzakte*
- [ ] `process_sequence_step()` — *execution_mode-abhängig senden/flaggen*
- [ ] Cron Job 07:00 — *fällige Schritte, Follow-ups, dynamische Regeln REGEL 1/2/3*
- [ ] Tages-Fortschritt als Supabase View — *kein Frontend-Calc*

### Lead Routing & Campaign-Matching (regelbasiert, kein AI)
- [ ] `route_sherloq_signal()` — *Sherloq-Lead anlegen → Matching anstoßen*
- [ ] `classify_sherloq_lead()` — *Einzel-Matching, Score-basiert*
- [ ] `classify_leads_batch()` — *Batch-Matching für CSV/CRM-Import*
- [ ] `isExcluded()` — *VOR jedem Match: opt_out/kunde/pipeline/archiviert/Domain-Block*
- [ ] Match-Score-Regeln + `campaign_match_min_score` (system_config, Default 3) — *nicht hardcoded*
- [ ] `campaigns.targeting` JSONB (job_titles/industries/company_sizes/regions/min_icp_score)
- [ ] contacts: `campaign_id`, `sherloq_signal_id`, `imported_at` — *Routing-Felder*
- [ ] Import-Flow: 3 Optionen, Default „Nur speichern" (kein Auto-Outreach)
- [ ] Sherloq-Fallback-Einstellung (Settings → AI SDR → Sherloq)

### Integrationen
- [ ] `webhook-booking` (Calendly/Cal.com normalisieren)
- [ ] `webhook-crm-sync` (HubSpot/Salesforce normalisieren + Konflikt-Logging)
- [ ] `webhook-stripe` (Plan/Module) *(SPÄTER)*

### Business-Logic-Regel
- [ ] Heat/Churn/ICP/Signal-Erkennung NUR in DB/Edge Functions — *nie im React-Code*

---

## 🖥️ Frontend

### Navigation & Agenten (fundamental — Code-Umbau offen)
- [ ] TopBar: 3er → **4 primäre** (`Mein Tag · AI SDR · Hunter · Farmer`) — *neue Agent-Architektur*
- [ ] Sekundäre Pills (Jira/Marketing/Sherloq System) abgesetzt
- [ ] `navConfig.tsx → roleAccess` an 4-Punkte-Struktur anpassen
- [ ] **AI SDR Screen** (NEU bauen): Sequenzen · Outreach · Posteingang · Termine
- [ ] **Hunter Screen** umbauen → Recommendation Feed (keine Sequenzen)
- [ ] **Farmer Screen** → Recommendation Feed (Bestandskunden)
- [ ] **Mein Tag** → aggregierter Feed (keine eigene Datenquelle)
- [ ] **Kontakte Screen** (NEU) — *zentrales Datenobjekt, eigener Sidebar-Icon*
- [ ] **Inbox** Screen + Sidebar-Icon (Tools-Bereich) + Badge
- [ ] **Sidebar finale Struktur** (max 9 Icons, Lucide): Screens · Kontakte · Tools · Settings/Profil
- [ ] Listen via Pill-Dropdown im Kontakte-Screen + Cmd+K (kein Nav-Punkt)
- [ ] Companies: nur im Drawer + Settings (Admin) + Cmd+K — kein Nav-Punkt
- [ ] Settings (Admin/Owner): Company-Verwaltung, Audit Log, Team, Webhooks, Automation Rules, Billing
- [ ] Destruktive Aktionen → Bestätigungs-Dialog (Kontakt/Liste/Campaign löschen, Opt-out, CRM-Overwrite)
- [x] Sliding-Pill-Animation in TopBar

### Daten-Layer
- [ ] TanStack Query als einziger Server-State — *kein useEffect+fetch*
- [ ] `src/lib/supabase.ts` Client
- [ ] `useModules()` Hook (gecacht) — *Modul-Gating*
- [ ] Mock-Daten (`data.ts`) durch echte Queries ersetzen
- [ ] Glocke: echter Badge-Count aus `notifications` (read=false), live via Realtime

### Realtime
- [ ] Supabase Realtime für 7 Tabellen aktivieren
- [ ] Subscriptions in Kacheln, Drawer, Mein Tag, Pipeline, Feed
- [ ] Max ~5 Channels, pro Listen-Ansicht, bei Unmount schließen

### Performance
- [ ] Query-Keys immer mit `organization_id` — *Cache-Isolation*
- [ ] staleTime nach Volatilität · Realtime invalidiert primär
- [ ] Keyset/Cursor-Pagination (nie OFFSET) — *bleibt bei 50k Zeilen schnell*
- [ ] Virtualisierung für Listen > 50 Zeilen (`@tanstack/react-virtual`)
- [ ] Code-Splitting pro Modul (`React.lazy`)
- [ ] Optimistic Updates bei reversiblen Mutationen

### Fehlerbehandlung (User-Sicht)
- [ ] 8s-Timeout (AbortController) auf jeder async-Operation — *Spinner hat immer ein Ende*
- [ ] 4-Stufen-Eskalation (optimistisch → auto-retry → manuell → offen markieren)
- [ ] Keine "Fehler"/"Error"-Wörter in UI — *Formulierungs-Tabelle befolgen*
- [ ] Fehlgeschlagenes = sichtbarer DB-Status (gelbes Badge), kein Spinner

### Design-Invarianten (laufend)
- [x] **Emoji in UI entfernt** — *ScreenFarming/Hunting/MyDay/Marketing/CustomerDrawer → Lucide-Icons (audit PASS)*
- [x] `ScreenPlaceholder` korrekt als Helper eingestuft (kein Render-Key → nicht in Registry; audit-Ausnahme)
- [ ] Jede neue interaktive Komponente → shadcn-Primitiv aus `ui/`
- [ ] Jede neue Komponente → sofort in `componentRegistry.ts`

### Dark Mode
- [x] Dark-Tokens in `[data-theme="dark"]` (index.css) — *@theme inline folgt automatisch*
- [x] `useTheme()` Hook (data-theme auf `<html>` + localStorage, modul-weiter Store)
- [x] FOUC-Guard in `index.html` (Theme vor erstem Paint)
- [x] Theme-Toggle (Sonne/Mond) im Profil/Avatar-Bereich der Sidebar
- [x] Alter `.dark-theme` !important-Hack aus App.tsx entfernt → Token-System
- [~] Strukturelle Flächen schalten korrekt (laufen über Token-Klassen)
- [ ] **Akzent-Hex → Signal-Tokens** in Screens (≈144 Vorkommen, meist Status-Akzente):
      ScreenMyDay/Hunting/Farming/Marketing/Jira/CustomerDrawer — *brechen Dark Mode optisch, nicht strukturell*
- [ ] Tote Dateien mit Hex entfernen: `src/theme.ts`, `src/components/shell/TopNav.tsx` (nicht importiert)

---

## 🔐 Security
- [ ] Kein API Key im Frontend — *ausnahmslos*
- [ ] Service Role Key nur in Edge Functions
- [ ] Alle Webhooks: `x-webhook-secret` / Signature-Validierung vor Verarbeitung
- [ ] Rate Limiting auf öffentlichen Endpunkten
- [ ] Audit Log: jeder Write schreibt nach `audit_log` (DB-Trigger, read-only)
- [ ] Permission-Check vor jedem Write — *RLS + Edge Function prüfen `role`*
- [ ] Opt-out: stoppt alle Sequences sofort, irreversibel, von niemandem überschreibbar — *höchste Priorität*
- [ ] Audit Log nur für Admin/Owner einsehbar (Settings)

---

## 💳 SaaS (vor Launch)
- [ ] Stripe Integration + `webhook-stripe` — *Plan/Module freischalten*
- [ ] Plan-Limit-Enforcement via `api_usage` (monatlich) — *kein harter Fehler bei Limit*
- [ ] Onboarding Wizard (5 Schritte)
- [ ] DSGVO Export (`export_organization_data`) + Löschungs-Flow
- [ ] Transactional Emails via `lib/email.ts` (Adapter)
- [ ] White-Label Theming (`brand_*` → CSS Variables zur Laufzeit)
- [ ] Subdomain (`slug`) / Custom Domain

---

## 🤖 AI Architektur
- [ ] `src/lib/ai.ts` — `aiCall()` Wrapper — *einziger AI-Eintrittspunkt*
- [ ] `aiCall()` loggt `ai_usage` + `api_usage` — *Kosten/Limits pro Org*
- [ ] `aiChat.ts` auf `aiCall()` migrieren *(audit WARN: nutzt SDK noch direkt)*
- [ ] Langfuse-Integration (ein-Datei-Change in `aiCall()`)
- [ ] `src/lib/notify.ts` — `notify()` + Event-Katalog — *einziger Notification-Eintrittspunkt*
- [ ] Signal Routing in `process_new_lead`/`classify_intent` — *kein Signal an zwei Orten*
- [ ] **Automation Risk-Level** (final): globaler Override Low/Medium/High über allen Campaigns
  - [ ] High Risk = immer `requires_human` (hardcoded false) — *Opt-out, Termin-Bestätigung, Löschen, CRM-Overwrite*
  - [ ] Medium Risk Auto nur bei Confidence ≥ `medium_confidence` UND Campaign=Auto
  - [ ] Sonderregel „Termin gebucht" → Lead→Deal Übergabe immer automatisch
  - [ ] Reply Handling: 8 Varianten, Priorität absteigend, Lucide-Icons
  - [ ] Settings → AI SDR → Automation Rules (nur Admin/Owner) + Campaign-Builder Hinweis-Box
- [ ] Agent-Trennung erzwingen: `full_auto`-Outreach NUR in AI SDR, nie Hunter/Farmer
- [ ] Dynamische Sequenzen (REGEL 1/2/3) im Cron Job
- [ ] AI-Chat: nur registrierte Render-Keys aktivierbar (Component Registry)
- [ ] `smart_list` / `smart_list_result` Render-Keys in `componentRegistry.ts` — *für Multi-Filter-Anfragen*

### Adaptives Lernen (Feedback & Präferenzen)
- [ ] Tabellen: `ai_feedback` (append-only) + `ai_preferences` (1 Zeile pro user×scope)
- [ ] CAPTURE: Accept/Reject/Edit → DB-Insert, **0 Token, kein AI-Call**
- [ ] CONSOLIDATE: tägliche Haiku-Routine verdichtet Feedback → Profil (summarize, nicht append)
- [ ] INJECT: nur verdichtetes Profil in `aiCall()`, im cachebaren Prompt-Teil, gedeckelt
- [ ] `system_config`: `ai_learning_enabled`, `ai_preference_cap_tokens`, `ai_preference_consolidate_hours`, `ai_feedback_min_for_profile`
- [ ] Kein Fine-Tuning, keine Kundendaten ins Modell — DSGVO-löschbar via `data_deletion_requests`

### Message Templates (Platzhalter-System)
- [ ] Step-Felder: `message_type`, `message_template`, `fallback_values`
- [ ] **Platzhalter-Katalog als Registry** (key → Datenpfad + Fallback) — *erweiterbar, nicht hardcoded*
- [ ] Edge Function `resolve_placeholders()` — *nie im Frontend auflösen*
- [ ] `preview-template` Endpoint (300ms Debounce, nie senden)
- [ ] Builder-Validierung (unbekannte Platzhalter → Warning, nicht blockierend)
- [ ] Escaping + Limits aus `system_config` (`template_max_length`, `message_max_length`, `placeholder_value_cap`)
- [ ] `fixed_template` vs `ai_generated` Logik (sich gegenseitig ausschließend)

### Token-Optimierung (von Tag 1, in aiCall() verankern)
- [ ] Kontext-Minimierung — *nur letzte 3 Touchpoints (summary), nie volle Historie*
- [ ] Token-Budget pro Call-Typ aus `system_config` (`ai_token_budget_*`) — *nie hardcodiert*
- [ ] Über Budget → summarize statt abschneiden — *Qualität erhalten*
- [ ] AI-Cache: kurzakte/company/icp/sequences (`ai_cache_ttl_*`), invalidieren via DB-Trigger
- [ ] Batching (`ai_batch_*`) für Intent Detection · ICP · Kurzakte — *1 Call statt 10*
- [ ] Fallbacks ohne AI — *Datum/Regel/Query: kein AI* (deckt sich mit Sequenz Engine)
- [ ] Prompt-Optimierung: Variablen in User-Prompt, stabiler System-Prompt — *Prompt-Caching*
- [ ] `api_usage` Logging: input/output_tokens, cost_usd, duration_ms pro Call
- [ ] `system_config` Seed: alle `ai_token_budget_*`, `ai_cache_ttl_*`, `ai_batch_*` Keys

---

## 🎨 Design
- [x] Design-Token-System in `index.css` (single source)
- [x] shadcn/ui Migration (Dialog, Sheet, Select, Tooltip, DropdownMenu)
- [x] `getHeatColor()` zentral in `heatUtils.ts`
- [x] Heat-/Status-Badges als Lucide-Icons (kein Emoji)
- [x] Restliche Emoji-Strings entfernt (🔥✨🚀⚠️✅⬆️ → Lucide) — *audit PASS*
- [ ] Inbox-Sortierung mit Lucide-Icons (kein Emoji) — *beim Inbox-Bau*

---

## 📚 Docs

### Struktur & Standard (erledigt)
- [x] `/docs` Grundstruktur angelegt (modules, api, decisions) — *Placeholder bereit*
- [x] Dokumentations-Standard in CLAUDE.md erweitert — *wann/was/Format, ADR, Setup, Runbook, OpenAPI, CONTRIBUTING*
- [x] 6 ADRs geschrieben (001 Supabase · 002 shadcn · 003 Edge Functions · 004 organization_id · 005 Sending Layer · 006 aiCall)
- [x] `CHANGELOG.md` angelegt — *Eintrag nach jedem Commit*
- [x] `llms.txt` Placeholder im Root

### Inhalt befüllen (nach den jeweiligen Phasen)
- [ ] Nach Phase 1: `setup.md`, `database.md`, `architecture.md` ausfüllen
- [ ] Nach Phase 2: `api/edge-functions.md`, `api/openapi.yaml`, `runbook.md`
- [ ] Pro fertigem Modul: `modules/[modul].md` (mein-tag, ai-sdr, hunter, farmer, sequenzen, inbox, cmd-k)
- [ ] Vor Launch: `CONTRIBUTING.md`, `README.md` finalisieren, `llms.txt` finalisieren
- [ ] Neue ADR bei jeder weiteren Architektur-Entscheidung (fortlaufend 007+)

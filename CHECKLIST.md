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
- [ ] **Inbox** Screen + Sidebar-Icon (zwischen AI SDR und Kalender) + Badge
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

---

## 🔐 Security
- [ ] Kein API Key im Frontend — *ausnahmslos*
- [ ] Service Role Key nur in Edge Functions
- [ ] Alle Webhooks: `x-webhook-secret` / Signature-Validierung vor Verarbeitung
- [ ] Rate Limiting auf öffentlichen Endpunkten
- [ ] Audit Log: jeder Write schreibt nach `audit_log` (DB-Trigger)
- [ ] Permission-Check vor jedem Write — *Felder-Editierbarkeit über `permissions`*

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
- [ ] Automation Risk-Level: `system_config` Keys anlegen, Default `semi_auto` — *Schwellen ⏳ vom User*
- [ ] Agent-Trennung erzwingen: `full_auto`-Outreach NUR in AI SDR, nie Hunter/Farmer
- [ ] Dynamische Sequenzen (REGEL 1/2/3) im Cron Job
- [ ] AI-Chat: nur registrierte Render-Keys aktivierbar (Component Registry)

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

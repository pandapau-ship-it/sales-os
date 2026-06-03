# Sales OS — Build Checklist

> Lebende Bau-Checkliste. Abgeleitet aus CLAUDE.md. Häkchen setzen sobald gebaut.
> CLAUDE.md = das WARUM/WIE. Diese Datei = das WAS-noch-offen.

---

## 🧭 Navigation & Agent-Architektur (neu — fundamental)

### Navigation umbauen
- [ ] TopBar: 3er-Struktur (`Mein Tag · Hunting · Farming`) → **4 primäre Punkte**
      `Mein Tag · AI SDR · Hunter · Farmer`
- [ ] Sliding-Pill-Animation auf alle 4 primären Pills anwenden
- [ ] Sekundäre Pills (Jira, Marketing, Sherloq System) abgesetzt rendern
- [ ] `navConfig.tsx → roleAccess` anpassen: `hunter` → AI SDR + Hunter, `farmer` → Farmer
- [ ] Sub-Nav pro Sektion (Sidebar) für AI SDR / Hunter / Farmer

### Drei-Agenten-Trennung umsetzen
- [ ] **AI SDR = Execution Agent** — einziger Agent mit `full_auto` für echten Outreach
- [ ] **Hunter = Recommendation Agent** (Deals) — führt nichts aus, nur empfehlen
- [ ] **Farmer = Recommendation Agent** (Bestandskunden) — führt nichts aus
- [ ] Sicherstellen: `full_auto` für Outreach NUR im AI SDR möglich, nie Hunter/Farmer

### Screens bauen / umbauen
- [ ] **AI SDR Screen** (NEU): Sequenzen · Outreach aktiv · Posteingang · Termine gebucht
- [ ] **Hunter Screen** umbauen zu Recommendation Feed
      Sub-Nav: [Signale] [Stagnierende Deals] [Follow-ups] [Pipeline]
      Empfehlungs-Kacheln: Signal → Interpretation → Empfehlung → bestätigen/verwerfen
      Kein Sequenz-Feed, keine Outreach-Automation-Toggles
- [ ] **Farmer Screen**: Sub-Nav [Signale] [Churn & Trials] [Upsell], Empfehlungs-Kacheln inline
- [ ] **Mein Tag**: als aggregierter Tages-Feed (keine eigene Datenquelle) aus AI SDR/Hunter/Farmer
- [ ] Side Panel (Hunter/Farmer): Kontakt + Kurzakte + History + "Empfehlung ausführen"

### Signal Routing
- [ ] `signals` Tabelle: `routed_to` (ai_sdr|hunter|farmer), `routed_at`, `routing_reason`
- [ ] Routing-Entscheidungsbaum in `process_new_lead()` implementieren
- [ ] Routing in `classify_intent()` implementieren
- [ ] Übergabe-Logik: Lead wird Deal → AI SDR → Hunter
- [ ] Garantie: kein Signal erscheint an zwei Orten gleichzeitig

### Automation Risk-Level (Vorbereitung)
- [ ] `system_config`: `automation_risk_low/medium/high_actions` (leer anlegen)
- [ ] Default überall `semi_auto` bis Schwellen definiert (nie `full_auto` ohne Freigabe)
- [ ] ⏳ Schwellenwerte vom User definieren lassen (entscheidungen_v2.md Punkt 20)

### Cmd+K
- [ ] Cmd+K = Zugriff (alle Entities, Signale, Automationen, Suche) — keine Awareness
- [ ] Nav-Ziele aktualisieren: Mein Tag · AI SDR · Hunter · Farmer · Jira

---

## 🗄️ Phase 5 — Supabase (Datenbank)

### Multi-Tenancy & Security (zuerst — nicht verhandelbar)
- [ ] `organizations` Tabelle (erste Tabelle überhaupt) inkl. brand_*, onboarding_*
- [ ] `organization_id NOT NULL` + ON DELETE CASCADE in JEDE Tabelle
- [ ] RLS auf jeder Tabelle aktiviert + `org_isolation` Policy
- [ ] `organization_id` als JWT Custom Claim
- [ ] `invitations` Tabelle
- [ ] `api_usage` Tabelle (leer)
- [ ] Index auf `organization_id` in jeder Tabelle

### Kern-Tabellen
- [ ] users, contacts, companies, pipeline_deals, communications, tasks
- [ ] sequences, sequence_rules, contact_sequences, kurzakte_entries
- [ ] signals (mit routed_to/routed_at/routing_reason)
- [ ] user_modules, system_config, audit_log, ai_usage, error_log
- [ ] notifications, notification_preferences
- [ ] merge_candidates, data_deletion_requests
- [ ] Pflichtfelder Aktionen: source, execution_mode, executed_by, approved_by, approved_at
- [ ] Sending-Felder: sending_channel, sending_provider, external_message_id, delivery_status, sent/delivered/read_at
- [ ] Intent-Felder: intent_detected, intent_confidence, requires_human, auto_reply_*
- [ ] Inbox-Felder: inbox_read, inbox_processed, inbox_processed_at/by
- [ ] CRM-Felder: crm_provider, crm_external_id, crm_sync_status, crm_sync_error
- [ ] Dynamic-Sequenz-Felder: read_count, dynamic_adjustment, adjustment_reason

### Seed & Types
- [ ] `system_config` Seed: alle automation_* Keys, sequence_dynamic_*, heat_status_config, followup_auto_days
- [ ] TypeScript Types generieren (`supabase gen types typescript`)
- [ ] Supabase Auth (Email + Passwort)

---

## 🔌 Frontend verbinden
- [ ] `src/lib/supabase.ts` Client
- [ ] `src/lib/ai.ts` — `aiCall()` Wrapper (Modell-Wahl, ai_usage + api_usage Logging)
- [ ] `src/lib/notify.ts` — `notify()` Wrapper + Event-Katalog
- [ ] `src/lib/email.ts` — `sendEmail()` (Adapter, später)
- [ ] `useModules()` Hook (gecacht)
- [ ] TanStack Query als Server-State-Layer einrichten
- [ ] Mock-Daten (`data.ts`) durch echte Queries ersetzen
- [ ] Glocke in Sidebar: echter Badge-Count aus `notifications` (read=false), live

---

## ⚡ Performance (von Anfang an)
- [ ] Query-Keys immer mit `organization_id`
- [ ] staleTime-Strategie nach Volatilität
- [ ] Keyset/Cursor-Pagination (nie OFFSET) — Seitengrößen pro Liste
- [ ] Virtualisierung für Listen > 50 Zeilen
- [ ] Realtime: max ~5 Channels, pro Listen-Ansicht, bei Unmount schließen
- [ ] Code-Splitting pro Modul (`React.lazy`)
- [ ] Composite-Indizes für häufige Filter

---

## 🤖 Sequenz Engine & Edge Functions
- [ ] `process_new_lead()` — inkl. Signal-Routing
- [ ] `classify_intent()` — inkl. Routing + Inbox
- [ ] `process_sequence_step()` — execution_mode-abhängig
- [ ] Cron Job 07:00: fällige Schritte, Follow-ups, dynamische Regeln (REGEL 1/2/3)
- [ ] Dynamische Sequenzen: Kanal-Wechsel, Early-Followup, No-Engagement-Pause
- [ ] Tages-Fortschritt als Supabase View

---

## 🔐 Fehlerbehandlung & Datenqualität
- [ ] 8s-Timeout (AbortController) auf jeder async-Operation
- [ ] 4-Stufen-Eskalation (optimistisch → auto-retry → manuell → offen markieren)
- [ ] Keine "Fehler"/"Error"-Wörter in der UI — Formulierungs-Tabelle befolgen
- [ ] Ingestion-Validierung eingehender Daten → error_log statt DB
- [ ] Duplikat-Erkennung: Company-Normalisierung (GmbH/AG/Inc weg) + Fuzzy-Match
- [ ] `merge_candidates` + `notify('duplicate_review')` bei Unschärfe — nie Auto-Merge
- [ ] CRM-Konflikt: wichtige Felder → User entscheidet

---

## 📡 Realtime & Webhooks
- [ ] 8 Webhook-Endpunkte (sherloq-signal, sherloq-usage, email, slack, teams, hubspot, jira, calendar)
- [ ] `x-webhook-secret` Validierung auf allen Webhooks
- [ ] Supabase Realtime für die 7 Live-Tabellen aktivieren
- [ ] DB-Triggers: Cluster-Vererbung, Audit Log, Heat-Timestamp, updated_at
- [ ] Frontend Subscriptions in Kacheln, Drawer, Mein Tag, Pipeline, Feed

---

## 💳 SaaS (vor Launch)
- [ ] Stripe Integration + `webhook-stripe`
- [ ] Onboarding Wizard (5 Schritte)
- [ ] DSGVO Export/Löschung
- [ ] Transactional Emails (lib/email.ts Adapter)
- [ ] Notification-Versand-Regeln (notification_preferences)
- [ ] White-Label Theming (brand_* → CSS Variables zur Laufzeit)
- [ ] Subdomain / Custom Domain

---

## 📚 Docs (nach Design-Finalisierung)
- [ ] `/docs/` Struktur anlegen
- [ ] Modul-Docs: mein-tag, ai-sdr, hunter, farmer, cmd-k, routines, ai-chat
- [ ] architecture.md, database.md, function-reference.md
- [ ] llms.txt

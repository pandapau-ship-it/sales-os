# sales_os_db_schema.md
# Vollständiges Datenbankschema — Sales OS
# Version 3 · Juni 2026 — Neu: deals.probability + settings.pipeline_stages
# Für Claude Code: Supabase / PostgreSQL
# Stand: Juni 2026
# Gilt für: AI SDR, Hunter, Farmer, Kontakte, Companies, Mein Tag, Settings

---

## GRUNDREGELN (jede Tabelle)

- Jede Tabelle hat `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Jede Tabelle hat `organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- Jede Tabelle hat `created_at timestamptz DEFAULT now()` und `updated_at timestamptz DEFAULT now()`
- Row Level Security (RLS) auf allen Tabellen aktivieren
- RLS-Policy: User sieht nur Daten seiner organization_id
- Cascade Delete: wenn Organization gelöscht → alles weg

---

## TABELLEN

---

### organizations
```
id                  uuid PK
name                text NOT NULL
slug                text UNIQUE NOT NULL          -- z.B. "acme-corp" → acme-corp.sherloq.com
plan                text DEFAULT 'trial'          -- trial | starter | pro | enterprise
settings            jsonb DEFAULT '{}'            -- globale Org-Settings
branding            jsonb DEFAULT '{}'            -- Whitelabel: Farben, Logos, Fonts
created_at          timestamptz
```

---

### users
```
id                  uuid PK (= Supabase Auth UID)
organization_id     uuid FK → organizations
email               text UNIQUE NOT NULL
full_name           text
avatar_url          text
role                text DEFAULT 'member'         -- owner | admin | member | viewer
last_seen_at        timestamptz
created_at          timestamptz
```

---

### contacts
```
id                  uuid PK
organization_id     uuid FK
first_name          text
last_name           text
email               text
linkedin_url        text
phone               text
job_title           text
seniority           text                          -- C-Level | VP | Director | Manager | IC
company_id          uuid FK → companies
contact_status      text DEFAULT 'ohne_campaign'
                    -- ohne_campaign | in_campaign | pipeline | kunde | archiviert | opt_out
lead_source         text
                    -- sherloq | csv_upload | crm_sync | manual | webhook_api
icp_score           int                           -- 0-100, optional
heat_status         text                          -- heiss | warm | lauwarm | kalt | tot
lead_status         text DEFAULT 'lead'           -- lead | qualified_lead | mql | sql | customer | churned
sherloq_contact_id  text                          -- ID bei Sherloq, für Bidirektionalität
enrichment_sources  text[]                        -- ['sherloq', 'clearbit', 'manual']
tags                text[]
notes               text
last_contacted_at   timestamptz
last_reply_at       timestamptz
opt_out_at          timestamptz
opt_out_reason      text
automation_override text                          -- manual | semi | auto | null (null = global Default)
primary_company_id  uuid FK → companies           -- für Cluster-Vererbung Kundenstatus
personality_profile     jsonb                     -- {style, decision, tempo}
personality_confidence  int                       -- 0-100
personality_sources     text[]                    -- ['messages', 'sherloq']
personality_updated_at  timestamptz
email_verified          boolean DEFAULT null      -- true | false | null (ungeprüft)
email_verification_date timestamptz
email_verification_source text                    -- 'syntax' | 'zerobounce' | 'manual'
email_verification_status text                    -- valid | invalid | catch-all | unknown | spamtrap
email_suggestion        text                      -- did_you_mean Korrektur
created_at          timestamptz
updated_at          timestamptz
```

---

### companies
```
id                  uuid PK
organization_id     uuid FK
name                text NOT NULL
domain              text
industry            text
size_range          text                          -- 1-10 | 11-50 | 51-200 | 201-500 | 500+
country             text
city                text
linkedin_url        text
website             text
crm_id              text                          -- ID im verbundenen CRM
annual_revenue      bigint
tech_stack          text[]
subscription_plan   text                          -- Plan-Name wenn Kunde (z.B. 'growth')
subscription_status text                          -- Slug: trial | active | churned | null (KEIN 'paused')
                                                  --   Anzeige DE: Trial / Aktiv / Gekündigt
subscription_since  timestamptz                   -- seit wann Kunde
tags                text[]
notes               text
created_at          timestamptz
updated_at          timestamptz
```

---

### campaigns
```
id                  uuid PK
organization_id     uuid FK
name                text NOT NULL
status              text DEFAULT 'draft'          -- draft | active | paused | archived
automation_level    text DEFAULT 'semi'           -- manual | semi | auto
intent_threshold    int DEFAULT 70               -- Confidence % ab dem AI handelt

-- Targeting
icp_filter          jsonb                         -- {roles, industries, sizes, regions, min_icp_score}
exclusions          jsonb                         -- {customer_ids, deal_ids, domains}

-- Lead Source
lead_sources        text[]                        -- ['sherloq', 'csv', 'webhook', 'crm']

-- Pitch
pitch               jsonb
                    -- {product, main_pain, secondary_pain, value_prop, proof_points[], cta}

-- Messaging Brief
messaging_brief     jsonb
                    -- {tone, length, personalization_depth, forbidden_words[], sample_message}

-- Sender Config
sender_config       jsonb
                    -- {mailbox_id, linkedin_account_id, daily_email_limit, daily_linkedin_limit,
                    --  sending_window: {days[], start_hour, end_hour}}

-- Approval Rules
approval_rules      jsonb
                    -- {require_approval_first_touch, require_approval_followup,
                    --  require_approval_booking}

created_by          uuid FK → users
created_at          timestamptz
updated_at          timestamptz
```

---

### sequences
```
id                  uuid PK
organization_id     uuid FK
campaign_id         uuid FK → campaigns ON DELETE CASCADE
name                text
steps               jsonb NOT NULL
                    -- Array: [{step_number, channel, delay_days, template_id, fallback_channel}]
max_steps           int DEFAULT 5
followup_delay_days int DEFAULT 3
reactivation_days   int DEFAULT 90
created_at          timestamptz
updated_at          timestamptz
```

---

### leads
```
id                  uuid PK
organization_id     uuid FK
contact_id          uuid FK → contacts
campaign_id         uuid FK → campaigns
sequence_id         uuid FK → sequences

sequence_step_current   int DEFAULT 1
sequence_status         text DEFAULT 'active'
                        -- active | paused | requires_human | completed | opted_out | bounced
requires_human_reason   text
                        -- reply_low_confidence | opt_out | bounce_hard | bounce_soft |
                        --   contact_data_missing | pipeline_suggestion | manual

scheduled_at            timestamptz               -- nächster fälliger Step-Zeitpunkt
last_step_sent_at       timestamptz
last_reply_at           timestamptz
last_open_at            timestamptz
open_count              int DEFAULT 0
click_count             int DEFAULT 0

intent_label            text                      -- interested | objection | not_now | opt_out | unclear
intent_confidence       int                       -- 0-100

sherloq_signal_id       uuid FK → signals
ai_adjustments          jsonb DEFAULT '[]'        -- Log aller AI-Anpassungen mit Begründung

pipeline_stage          text                      -- null wenn kein Deal
deal_id                 uuid                      -- FK zu deals wenn übergeben

created_at              timestamptz
updated_at              timestamptz
```

---

### messages
```
id                  uuid PK
organization_id     uuid FK
lead_id             uuid FK → leads
contact_id          uuid FK → contacts

direction           text NOT NULL                 -- outbound | inbound
channel             text NOT NULL                 -- email | linkedin | sms
status              text DEFAULT 'draft'
                    -- draft | scheduled | sent | delivered | opened | clicked |
                    --   replied | bounced_soft | bounced_hard | failed

subject             text                          -- nur Email
body                text NOT NULL
body_html           text

sent_at             timestamptz
opened_at           timestamptz
clicked_at          timestamptz
replied_at          timestamptz

bounce_type         text                          -- soft | hard | null
bounce_reason       text
error_message       text

provider_message_id text                          -- ID beim Sending Provider
sequence_step       int

generated_by        text DEFAULT 'ai'             -- ai | human
approved_by         uuid FK → users
created_at          timestamptz
```

---

### signals
```
id                  uuid PK
organization_id     uuid FK
contact_id          uuid FK → contacts           -- null wenn Kontakt noch unbekannt
company_id          uuid FK → companies

source              text DEFAULT 'sherloq'        -- sherloq | manual | webhook
signal_type         text NOT NULL
                    -- linkedin_profile_view | linkedin_post_liked | linkedin_post_commented |
                    --   job_change | company_growth | funding_round | tech_change | custom

signal_data         jsonb                         -- {source_url, detail, timestamp, raw_payload}
sherloq_contact_id  text
sherloq_signal_id   text                          -- Original-ID bei Sherloq

routed_to           text                          -- ai_sdr | hunter | farmer | unrouted
processed_at        timestamptz
created_at          timestamptz
```

---

### deals
```
id                  uuid PK
organization_id     uuid FK
contact_id          uuid FK → contacts
company_id          uuid FK → companies

name                text NOT NULL
stage               text DEFAULT 'backlog'
                    -- SLUG (lowercase_underscore) = Speicherwert; Anzeigename aus settings.pipeline_stages[].name
                    -- backlog | demo_vereinbart | followup_offen | onboarding_offen | free_trial | gewonnen
                    -- Terminal (kein Stagnations-Timer): gewonnen | verloren  (verloren erfordert lost_reason)
                    -- Nie hardcodiert — Stages aus settings.pipeline_stages laden
value               bigint                        -- in Cent
currency            text DEFAULT 'EUR'
probability         int DEFAULT 10               -- Win-Wahrscheinlichkeit 0–100% (erbt Stage-Default, pro Deal überschreibbar)

heat_status         text                          -- heiss | warm | lauwarm | kalt | tot
stagnation_days     int DEFAULT 0                -- wie viele Tage in aktueller Stage
stage_updated_at    timestamptz                 -- wann Stage zuletzt geändert (für Stagnation)
end_date            timestamptz                 -- Vertragsende (für Churn-Signal)

owner_id            uuid FK → users
source_lead_id      uuid FK → leads              -- woher kam der Deal

meeting_prep        jsonb                         -- generiertes Meeting-Briefing
next_action         text
next_action_due_at  timestamptz

closed_at           timestamptz
lost_reason         text
created_at          timestamptz
updated_at          timestamptz
```

---

### tasks
```
id                  uuid PK
organization_id     uuid FK
contact_id          uuid FK → contacts
deal_id             uuid FK → deals
assigned_to         uuid FK → users

title               text NOT NULL
description         text
due_at              timestamptz
completed_at        timestamptz
priority            text DEFAULT 'medium'         -- low | medium | high
source              text                          -- ai | manual | crm_sync
created_at          timestamptz
```

---

### notes
```
id                  uuid PK
organization_id     uuid FK
contact_id          uuid FK → contacts
company_id          uuid FK → companies
deal_id             uuid FK → deals
created_by          uuid FK → users

content             text NOT NULL
created_at          timestamptz
```

---

### lists
```
id                  uuid PK
organization_id     uuid FK
name                text NOT NULL
type                text DEFAULT 'static'         -- static | dynamic
filter_config       jsonb                         -- bei dynamic: Filterregeln
contact_ids         uuid[]                        -- bei static: manuell gepflegte Liste
is_team_list        boolean DEFAULT false
created_by          uuid FK → users
created_at          timestamptz
updated_at          timestamptz
```

---

### automation_rules
```
id                  uuid PK
organization_id     uuid FK
risk_level          text NOT NULL                 -- low | medium | high
action_type         text NOT NULL
                    -- connection_request | first_touch | followup | reply | inmail |
                    --   booking_link | lead_to_deal | confirm_meeting | cancel_meeting |
                    --   crm_overwrite | opt_out | delete | escalation
is_auto_allowed     boolean NOT NULL
confidence_threshold int                          -- null bei low/high, relevant bei medium
created_at          timestamptz
```

---

### sequence_rules
```
id                  uuid PK
organization_id     uuid FK
name                text
trigger_signal      text
                    -- mail_opened_twice | mail_opened_three_times | linkedin_seen_no_reply |
                    --   no_open_two_mails | post_reaction
action              jsonb
                    -- {type: 'adjust_text' | 'change_channel' | 'ab_subject', params: {}}
is_active           boolean DEFAULT true
created_at          timestamptz
```

---

### settings
```
id                  uuid PK
organization_id     uuid FK UNIQUE
modules             jsonb DEFAULT '{}'
                    -- {sherloq_signals: true, crm_sync: false, calendar: true, ...}
automation_defaults jsonb DEFAULT '{}'
                    -- {default_automation_level, intent_threshold, reactivation_days, ...}
thresholds          jsonb DEFAULT '{}'
                    -- {heat_status_days, churn_weights, upsell_weights, ...}
pipeline_stages     jsonb DEFAULT '[]'
                    -- TOP-LEVEL (nicht in thresholds): [{slug, name, order, stagnation_days, probability}]
                    --   slug = deals.stage Speicherwert · name = Anzeige · probability = Win-% Stage-Default
sending_defaults    jsonb DEFAULT '{}'
                    -- {daily_email_limit, daily_linkedin_limit, sending_window}
created_at          timestamptz
updated_at          timestamptz
```

---

### audit_log
```
id                  uuid PK
organization_id     uuid FK
user_id             uuid FK → users              -- null bei AI-Aktionen
action              text NOT NULL
                    -- opt_out_confirmed | deal_created | campaign_paused | lead_archived | ...
entity_type         text                          -- contact | lead | deal | campaign
entity_id           uuid
metadata            jsonb                         -- zusätzliche Details zur Aktion
created_at          timestamptz
```

---

## NEUE TABELLEN (Session Juni 2026)

### mailboxes
```
id                  uuid PK
organization_id     uuid FK
provider            text                          -- gmail | outlook
email_address       text
status              text                          -- active | warmup | paused | blocked
warmup_phase        int                           -- 1-5 (Tag-Bereich)
current_daily_limit int                           -- aktuelles Limit (Warmup-abhängig)
bounce_rate         numeric                       -- aktuelle Bounce Rate %
spam_rate           numeric
created_at          timestamptz
```

### blacklisted_domains
```
id          uuid PK
domain      text UNIQUE NOT NULL
reason      text                                  -- disposable | spam | catch-all | manual
created_at  timestamptz
```

### churn_rules (v2 — jetzt anlegen, Feature später)
```
id              uuid PK
organization_id uuid FK
name            text
condition       jsonb                             -- {field, operator, value}
points          int
source          text                              -- internal | sherloq | stripe
is_active       boolean
created_by      uuid FK → users
created_at      timestamptz
```

### upsell_rules (v2 — jetzt anlegen, Feature später)
```
id              uuid PK
organization_id uuid FK
name            text
condition       jsonb
points          int
source          text
is_active       boolean
created_by      uuid FK → users
created_at      timestamptz
```

### user_permissions (individuelle Rechte-Überschreibung)
```
id              uuid PK
organization_id uuid FK
user_id         uuid FK → users
permission      text                              -- z.B. 'automation_rules.edit'
granted_by      uuid FK → users                   -- muss owner sein
created_at      timestamptz
```

### daily_briefings (Mein Tag)
```
id              uuid PK
organization_id uuid FK
user_id         uuid FK
priorities      jsonb                             -- [{type, contact_id, signal, reason, cta}]
generated_at    timestamptz
```

### BILLING-TABELLEN

### plans
```
id              uuid PK
name            text                              -- trial | starter | growth | scale
price_monthly   int                               -- in Cent
price_yearly    int
base_seats      int
extra_seat_price int
stripe_price_id text
```

### plan_limits
```
id              uuid PK
plan_id         uuid FK
feature         text                              -- contacts | campaigns | mailboxes | ai_credits ...
limit_value     int                               -- -1 = unbegrenzt
```

### organization_subscription
```
id                     uuid PK
organization_id        uuid FK
plan_id                uuid FK
status                 text                       -- trial | active | past_due | cancelled
trial_ends_at          timestamptz
current_period_end     timestamptz
stripe_customer_id     text
stripe_subscription_id text
```

### credit_balance
```
id               uuid PK
organization_id  uuid FK
credit_type      text                             -- ai | enrichment | email_verification
included_monthly int
purchased        int
used_this_period int
resets_at        timestamptz
```

### credit_transactions
```
id              uuid PK
organization_id uuid FK
credit_type     text
amount          int                               -- negativ = verbraucht, positiv = gekauft
reason          text                              -- message_generation | enrichment | purchase
reference_id    uuid
created_at      timestamptz
```

### addons
```
id              uuid PK
organization_id uuid FK
addon_type      text                              -- sherloq_signals | extra_mailbox | crm_sync
status          text
price           int
activated_at    timestamptz
```

### AI CHAT TABELLEN

### chat_sessions
```
id              uuid PK
organization_id uuid FK
user_id         uuid FK
created_at      timestamptz
```

### chat_messages
```
id                uuid PK
session_id        uuid FK
role              text                            -- user | assistant
content           jsonb                           -- bei assistant: Array von Blöcken
langfuse_trace_id text
created_at        timestamptz
```

### custom_dashboards (v2/v3 — jetzt anlegen, Feature später)
```
id              uuid PK
organization_id uuid FK
user_id         uuid FK
name            text
layout          jsonb                             -- [{widget_type, data_source, config, position}]
is_shared       boolean
created_at      timestamptz
```

---

## WICHTIGE HINWEISE FÜR CLAUDE CODE

1. Alle Tabellen mit RLS aktivieren — Policy immer auf organization_id
2. `updated_at` immer via Trigger automatisch setzen, nicht manuell
3. JSONB Felder nie im Frontend parsen — immer Edge Function
4. Keine hardcodierten Werte im Frontend — alles aus `settings` Tabelle lesen
5. Fremdschlüssel immer mit ON DELETE CASCADE oder ON DELETE SET NULL — je nach Logik
6. Indexes auf: organization_id, contact_id, lead_id, scheduled_at, created_at
7. `scheduled_at` in leads ist der wichtigste Index — der sequence_runner liest ihn alle 5 Min

---

*Sales OS · Datenbankschema v1 · Juni 2026*
*Gilt für gesamtes System: AI SDR, Hunter, Farmer, Kontakte, Companies, Mein Tag*
*Bei Ergänzungen: Datei aktualisieren und Claude Code neu übergeben*

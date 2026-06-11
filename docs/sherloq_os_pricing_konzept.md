# Sherloq OS — Pricing-Konzept
# Juni 2026 · Erstentwurf zur Diskussion
# Basiert auf Best Practice 2025/2026 + modularem Aufbau von Sales OS

---

## 1. GRUNDPRINZIP — Hybrid-Modell (was die Besten 2026 machen)

Moderne AI-SaaS-Plattformen nutzen 2026 fast immer ein **3-Schichten-Hybrid-Modell:**

```
Schicht 1: Plattform-Grundgebühr (Tier)   → planbare Basis-Einnahme
Schicht 2: Module (zubuchbar)               → à la carte für spezielle Needs
Schicht 3: Usage-Credits (Verbrauch)        → AI-Token, Enrichment, Emails
```

**Warum dieses Modell für Sherloq OS:**
- Sherloq OS ist kein einfaches Outreach-Tool wie Lemlist — es ist ein Sales Operating System (CRM + AI SDR + Hunter + Farmer)
- Zielgruppe: Teams die ein komplettes System wollen, nicht nur Email-Versand
- Deshalb höhere Preispunkte gerechtfertigt (Vergleich: HubSpot Sales Hub Pro = 100$/Seat, Enterprise = 150$/Seat — und das ist NUR Sales)

---

## 2. WAS KOSTET UNS GELD (Kostenstruktur verstehen)

Bevor Preise: was sind die variablen Kosten pro Kunde?

| Kostenfaktor | Variabel? | Wer trägt es |
|---|---|---|
| AI-Token (Claude/GPT) | ✅ stark variabel | wir → an Kunde weitergeben via Credits |
| Enrichment (Surfe) | ✅ pro Lead | wir → an Kunde via Credits |
| Email-Verifizierung (ZeroBounce) | ✅ pro Email | wir → an Kunde via Credits |
| Email-Sending (Nango/Mailbox) | gering | in Grundgebühr |
| Supabase (DB, Storage) | gering pro Seat | in Grundgebühr |
| Cal.com (selbst gehostet) | fix | in Grundgebühr |

**Daraus folgt:** Alles was stark variabel ist (AI, Enrichment, Verifizierung) → Credit-System mit Inklusiv-Kontingent + Nachkauf.

---

## 3. MODULE — was kann separat gebucht werden

Sales OS ist modular gebaut. Diese Module können einzeln aktiviert/verkauft werden:

| Modul | Beschreibung | Pricing-Logik |
|---|---|---|
| **Core CRM** | Kontakte · Companies · Deals · Tasks · Listen | immer enthalten (Basis) |
| **AI SDR** | Autonome Outreach-Sequenzen, AI-Nachrichten | Tier-Feature (ab Pro) |
| **Hunter** | Pipeline-Management, Deal-Tracking, Signals | Tier-Feature |
| **Farmer** | Customer Success, Churn, Upsell, Health Score | Tier-Feature (ab Pro) |
| **Enrichment** | Surfe-Anreicherung von Kontakten/Companies | Add-on + Credits |
| **Email-Verifizierung** | ZeroBounce Mailbox-Check | Add-on + Credits |
| **Sherloq Signals** | LinkedIn-Signale, Intent-Daten | Add-on (Sherloq-Verbindung) |
| **Whitelabel/Branding** | Eigenes Logo, Farben, Custom Domain | Tier-Feature (ab Enterprise) |
| **CRM Sync** | HubSpot/Salesforce bidirektional | Add-on (v2) |

---

## 4. EMPFOHLENE PLAN-STRUKTUR

Drei Tiers + Trial. "Good-Better-Best" — der bewährteste Aufbau.

### Übersicht

| | **Trial** | **Starter** | **Growth** | **Scale (Enterprise)** |
|---|---|---|---|---|
| Preis/Monat | kostenlos | 249 € | 599 € | ab 1.200 € |
| Abrechnung | 14 Tage | pro Workspace + Seats | pro Workspace + Seats | individuell |
| Basis-Seats inkl. | 1 | 3 | 10 | ab 20 |
| Weitere Seats | — | 49 €/Seat | 39 €/Seat | individuell |

### Was ist in welchem Plan

| Feature | Trial | Starter | Growth | Scale |
|---|---|---|---|---|
| Core CRM (Kontakte/Deals/Tasks) | ✅ | ✅ | ✅ | ✅ |
| Hunter (Pipeline) | ✅ | ✅ | ✅ | ✅ |
| AI SDR (Outreach) | begrenzt | ✅ | ✅ | ✅ |
| Farmer (Customer Success) | ❌ | ❌ | ✅ | ✅ |
| Kontakte (Limit) | 100 | 5.000 | 25.000 | unbegrenzt |
| Aktive Campaigns | 1 | 5 | 20 | unbegrenzt |
| Mailboxen | 1 | 3 | 10 | unbegrenzt |
| AI-Credits/Monat inkl. | 50 | 2.000 | 10.000 | individuell |
| Enrichment-Credits/Monat inkl. | 10 | 100 | 500 | individuell |
| Email-Verifizierung inkl. | ❌ | 1.000 | 5.000 | unbegrenzt |
| Sherloq Signals | ❌ | Add-on | Add-on | ✅ inkl. |
| Whitelabel/Branding | ❌ | ❌ | Teilweise | ✅ |
| Custom Domain | ❌ | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ✅ | ✅ |
| API-Zugang | ❌ | ❌ | ✅ | ✅ |
| CRM Sync (HubSpot/SF) | ❌ | ❌ | Add-on | ✅ |
| Support | Self-Service | Email | Priority | Dedicated CSM |

---

## 5. CREDIT-SYSTEM (der variable Teil)

### AI-Credits
- 1 Credit = 1 AI-Aktion (Nachricht generieren, Lead klassifizieren, Meeting-Prep, Personality-Analyse)
- Inklusiv-Kontingent pro Plan (siehe Tabelle)
- Nachkauf: Credit-Pakete
  - 1.000 Credits = 29 €
  - 5.000 Credits = 119 € (20% günstiger)
  - 20.000 Credits = 399 € (30% günstiger)
- Rollover: nicht genutzte Credits verfallen monatlich (oder optional: 1 Monat Rollover bei Growth+)

### Enrichment-Credits
- 1 Credit = 1 angereicherter Kontakt oder Company
- Inklusiv-Kontingent pro Plan
- Nachkauf:
  - 100 Enrichments = 19 €
  - 500 Enrichments = 79 €
  - 2.000 Enrichments = 279 €

### Email-Verifizierung
- Im Plan inklusiv (siehe Tabelle)
- Nachkauf: 1.000 Verifizierungen = 9 €

**Wichtig (aus Best Practice 2025):**
Buyer-Confidence ist das größte Risiko bei Credit-Modellen. Nutzer vermeiden AI-Features wenn sie Angst vor unvorhersehbaren Kosten haben.

Deshalb:
- Großzügiges Inklusiv-Kontingent (Puffer zum Experimentieren)
- Echtzeit-Verbrauchsanzeige im Dashboard
- Warnung bei 80% Verbrauch
- Optional: Hard-Cap einstellbar ("nie mehr als X € Overage")
- Auto-Recharge optional (nicht erzwungen)

---

## 6. ADD-ONS (zubuchbar, plan-unabhängig)

| Add-on | Preis | Logik |
|---|---|---|
| Sherloq Signals | 99 €/Monat | LinkedIn Intent-Daten, ab Starter zubuchbar |
| Zusätzliche Mailbox | 15 €/Monat | über Plan-Limit hinaus |
| Extra AI-Credits | siehe Credit-Pakete | jederzeit |
| Extra Enrichment | siehe Credit-Pakete | jederzeit |
| CRM Sync | 149 €/Monat | HubSpot/Salesforce bidirektional (v2) |
| Dedizierter Onboarding | einmalig 990 € | optional für Growth, inkl. bei Scale |

---

## 7. WARUM DIESE PREISE (Begründung)

**Starter 249 €:**
- Positioniert über reinen Outreach-Tools (Lemlist 55$/User)
- Aber zugänglich für kleine Sales-Teams
- 3 Seats inkludiert = ~83 €/Seat — fair für ein komplettes System
- Vergleich: HubSpot Sales Hub Pro = 100$/Seat NUR für Sales, ohne CRM-Tiefe

**Growth 599 €:**
- Der "Sweet Spot" — die meisten Teams landen hier
- Farmer-Modul (Customer Success) als Wert-Treiber
- 10 Seats = ~60 €/Seat — Mengenvorteil
- Audit Log + API = professionelle Anforderungen abgedeckt

**Scale ab 1.200 €:**
- Whitelabel + Custom Domain = Agenturen/größere Orgs
- Verhandelbar — Enterprise kauft nie von der Preisliste
- Vergleich: 50-Seat HubSpot Enterprise = 90.000$/Jahr → wir deutlich darunter möglich

**Trial 14 Tage:**
- Kreditkarte optional (mehr Anmeldungen ohne, höhere Conversion mit)
- Begrenzte AI-Credits damit Kostenrisiko für uns gedeckelt
- Zeigt Wert ohne Vollzugriff

---

## 8. JAHRESABO

- 20% Rabatt bei jährlicher Zahlung (Branchenstandard)
- Beispiel Growth: 599 €/Monat → 5.750 €/Jahr (statt 7.188 €)
- Erhöht Bindung + Cashflow

---

## 9. WAS NOCH ZU ENTSCHEIDEN IST

- [ ] Finale Preise bestätigen (sind Vorschläge basierend auf Markt)
- [ ] AI-Credit-Verbrauch real messen → erst nach ersten Wochen Betrieb kalibrierbar
- [ ] Kreditkarte bei Trial: ja/nein?
- [ ] Rollover-Policy: verfallen Credits oder 1 Monat Übertrag?
- [ ] Seat-Preise final
- [ ] Enrichment/AI Inklusiv-Mengen final (abhängig von echten Kosten)

**Wichtig:** Claude Code kann die komplette Struktur OHNE finale Preise bauen.
Alle Preise + Limits landen in `plans` + `plan_limits` Tabellen (konfigurierbar).
Preise später via Stripe Dashboard + settings änderbar ohne Code-Änderung.

---

## 10. TECHNISCHE STRUKTUR FÜR CLAUDE CODE

```sql
plans (
  id              uuid PK
  name            text         -- 'trial' | 'starter' | 'growth' | 'scale'
  price_monthly   int          -- in Cent
  price_yearly    int
  base_seats      int
  extra_seat_price int
  stripe_price_id text
)

plan_limits (
  id              uuid PK
  plan_id         uuid FK
  feature         text         -- 'contacts' | 'campaigns' | 'mailboxes' | 'ai_credits' ...
  limit_value     int          -- -1 = unbegrenzt
)

organization_subscription (
  id                  uuid PK
  organization_id     uuid FK
  plan_id             uuid FK
  status              text     -- 'trial' | 'active' | 'past_due' | 'cancelled'
  trial_ends_at       timestamptz
  current_period_end  timestamptz
  stripe_customer_id  text
  stripe_subscription_id text
)

credit_balance (
  id              uuid PK
  organization_id uuid FK
  credit_type     text     -- 'ai' | 'enrichment' | 'email_verification'
  included_monthly int     -- aus Plan
  purchased       int      -- zusätzlich gekauft
  used_this_period int
  resets_at       timestamptz
)

credit_transactions (
  id              uuid PK
  organization_id uuid FK
  credit_type     text
  amount          int      -- negativ = verbraucht, positiv = gekauft/reset
  reason          text     -- 'message_generation' | 'enrichment' | 'purchase' ...
  reference_id    uuid     -- z.B. message_id
  created_at      timestamptz
)

addons (
  id              uuid PK
  organization_id uuid FK
  addon_type      text     -- 'sherloq_signals' | 'extra_mailbox' | 'crm_sync'
  status          text
  price           int
  activated_at    timestamptz
)
```

**Credit-Prüfung vor jeder AI-Aktion:**
```
1. Vor generate_message() / enrich() / verify():
   → check_credit_balance(org_id, credit_type)
2. Wenn included + purchased - used > 0 → Aktion erlauben, used++
3. Wenn 0 → entweder Auto-Recharge oder Block + Hinweis "Credits aufgebraucht"
4. Bei 80% → Realtime-Warnung an Admin
```

---

*Sherloq OS Pricing-Konzept · Juni 2026*
*Erstentwurf — Preise sind Marktorientierung, final durch Prossi zu bestätigen*
*Struktur baubar ohne finale Preise — alles konfigurierbar in plans/plan_limits*

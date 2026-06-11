# sales_os_sending_layer.md
# Sending Layer Abstraktion — Sales OS
# Für Claude Code: Provider-agnostische Abstraktionsschicht
# Stand: Juni 2026

---

## ZIEL

Der Sending Layer ist eine Abstraktionsschicht die sicherstellt:
- Heute läuft alles über Nango (OAuth) + Unipile (wahrscheinlich)
- Morgen kann jeder Provider ausgetauscht werden ohne dass eine Komponente oder Edge Function geändert werden muss
- Der Rest des Systems kennt nur das Interface — nie den Provider direkt

---

## INTERFACE (was der Rest des Systems sieht)

Alle Sends laufen über `lib/sending.ts`. Einzige Datei die den Provider kennt.

```typescript
// lib/sending.ts — das einzige File das Provider-Details kennt

sendEmail(params: EmailParams): Promise<SendResult>
sendLinkedInMessage(params: LinkedInParams): Promise<SendResult>
sendLinkedInConnectionRequest(params: ConnectionParams): Promise<SendResult>
sendBookingLink(params: BookingParams): Promise<SendResult>

// Types
EmailParams {
  to: string           // Email-Adresse
  subject: string
  body: string
  body_html?: string
  from_mailbox_id: string   // Welche Mailbox sendet (aus sender_config)
  lead_id: string           // Für Tracking
}

LinkedInParams {
  to_linkedin_url: string
  body: string
  from_account_id: string
  lead_id: string
}

ConnectionParams {
  to_linkedin_url: string
  note?: string             // optionale Verbindungsnotiz
  from_account_id: string
  lead_id: string
}

SendResult {
  success: boolean
  provider_message_id?: string    // ID beim Provider für Tracking
  error?: {
    type: 'hard_bounce' | 'soft_bounce' | 'smtp_error' | 'rate_limit' | 'auth_error' | 'unknown'
    message: string
    retry_after?: number          // Sekunden bis Retry sinnvoll
  }
}
```

---

## PROVIDER-IMPLEMENTIERUNG

Hinter dem Interface liegt die Provider-Implementierung.
Aktuell: **Nango (OAuth) + Unipile (Sending)**

```typescript
// lib/providers/unipile.ts — austauschbar

// Nango liefert den OAuth-Token für die jeweilige Mailbox / LinkedIn-Account
// Unipile nimmt den Token und sendet über den richtigen Kanal

// Wenn Unipile ersetzt wird: nur diese Datei ändern
// lib/sending.ts bleibt unverändert
// Alle Edge Functions bleiben unverändert
```

---

## TRACKING / WEBHOOKS

Wenn Provider ein Tracking-Event sendet (Open, Click, Bounce, Reply):
- Webhook landet auf `/functions/v1/handle-provider-webhook`
- Handler normalisiert den Payload (provider-spezifisch → unser Format)
- Ruft intern auf: `analyze_engagement(lead_id)` oder `classify_intent(message_id)`
- Speichert Event in messages Tabelle

**Normalisiertes Tracking-Event:**
```typescript
{
  event_type: 'opened' | 'clicked' | 'replied' | 'bounced_soft' | 'bounced_hard' | 'failed'
  provider_message_id: string    // damit wir die message in unserer DB finden
  timestamp: string
  metadata?: object              // z.B. bei Reply: {reply_body}
}
```

---

## MAILBOX-MANAGEMENT

Jede Mailbox / LinkedIn-Account hat Limits und einen Health-Status.

```typescript
// lib/mailbox.ts

checkDailyLimit(mailbox_id: string, channel: 'email' | 'linkedin'): Promise<{
  limit: number
  used_today: number
  remaining: number
  limit_reached: boolean
}>

getMailboxHealth(mailbox_id: string): Promise<{
  bounce_rate: number      // % der letzten 30T
  reply_rate: number
  spam_rate: number
  domain_status: 'healthy' | 'warning' | 'blocked'
  is_paused: boolean
}>
```

Wenn `limit_reached = true` → sequence_runner überspringt, setzt Queue-Flag.
Wenn `bounce_rate > threshold` (aus settings) → Mailbox automatisch pausieren + Alert.

---

## OAUTH VIA NANGO

Nango managed alle OAuth-Tokens für:
- Gmail (Email senden)
- Outlook / Microsoft 365 (Email senden)
- LinkedIn (via Unipile)
- Kalender-Provider (Calendly / Cal.com / Google Calendar — noch offen)

```typescript
// lib/auth.ts (nicht lib/sending.ts) verwaltet Nango-Tokens
// Nango-Connection-ID wird in sender_config der Campaign gespeichert
// lib/sending.ts holt Token von Nango, gibt ihn an Provider weiter
```

---

## KALENDER-PROVIDER: Cal.com (ENTSCHIEDEN)

Provider: **Cal.com (selbst gehostet auf Vercel)**
OAuth-Management: **Nango** (Google Calendar + Microsoft 365)

```typescript
// lib/calendar.ts — einzige Datei die Cal.com direkt kennt

generateBookingLink(params: BookingLinkParams): Promise<{booking_url: string}>
getBookingDetails(booking_id: string): Promise<BookingDetails>
syncBranding(organization_id: string): Promise<void>
// Webhook: wenn Termin bestätigt → validate_booking() → prep_meeting()

BookingLinkParams {
  organization_id: string   // PFLICHT — bestimmt Branding + Kalender-Config
  user_id: string           // Wessen Kalender wird gebucht
  lead_id: string
  event_type: '30min' | '60min' | 'custom'
  metadata?: object         // Lead-Daten für Cal.com Bestätigungsmail
}
```

Sobald Provider gewechselt: nur `lib/providers/cal-com.ts` ersetzen.

---

## MULTI-TENANT ISOLATION — KRITISCHE REGEL

**Jede Konfiguration ist strikt an organization_id gebunden. Keine globalen Zustände.**

Das betrifft alle Provider-Konfigurationen:

```
Cal.com Branding       → pro Organization (Farben, Logo, Domain)
Cal.com Booking-Links  → pro Organization + User
Mailbox-Konfiguration  → pro Organization
LinkedIn-Account       → pro Organization
Enrichment-API-Key     → pro Organization
Sending-Limits         → pro Organization (aus settings Tabelle)
```

**Konkret für Cal.com:**
- Jede Organization hat ihre eigene Cal.com Konfiguration in `settings.calendar_config`
- Branding-Änderung in Organization A → wird via `syncBranding(organization_id)` nur an Cal.com für A übertragen
- Organization B sieht niemals Daten, Konfiguration oder Branding von Organization A
- Cal.com Event-Types werden pro Organization angelegt — nie geteilt

**Konkret für Branding-Settings:**
- `organizations.branding` JSONB → nur für diese Organization
- Änderung triggert: `syncBranding(organization_id)` → Cal.com, E-Mail-Templates, UI-Theme
- Andere Tenants sind nicht betroffen

**Regel für Claude Code:**
```
NIEMALS eine Konfiguration ohne organization_id laden oder speichern.
NIEMALS globale Variablen für Provider-Konfigurationen nutzen.
IMMER organization_id als ersten Parameter mitgeben.
Jeder lib/-Aufruf der Provider-Konfiguration lädt → muss organization_id haben.
```

---

## WICHTIGE HINWEISE FÜR CLAUDE CODE

1. `lib/sending.ts` ist die einzige Datei die Unipile / Provider direkt kennt
2. `lib/calendar.ts` ist die einzige Datei die Cal.com direkt kennt
3. `lib/enrichment.ts` ist die einzige Datei die Surfe / Enrichment-Provider direkt kennt
4. Alle Edge Functions importieren nur aus `lib/` — nie aus `providers/` direkt
5. Provider-Credentials kommen aus Nango — nie hardcodiert oder in .env für Produktion
6. Tracking-Webhooks immer normalisieren bevor sie ins System kommen
7. Mailbox-Limits vor jedem Send prüfen — nie direkt senden ohne Check
8. Bei SendResult.error → message.status entsprechend setzen + audit_log
9. **Jede Provider-Konfiguration ist organization_id-gebunden — keine globalen Zustände**
10. Branding-Änderung → syncBranding(organization_id) aufrufen — nie andere Tenants berühren

---

*Sales OS · Sending Layer Abstraktion v2 · Juni 2026*
*Neu in v2: Cal.com entschieden, Multi-Tenant Isolation explizit dokumentiert*
*Provider-Wechsel: nur lib/providers/ Datei ersetzen — nichts anderes ändern*

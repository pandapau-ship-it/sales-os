# ADR 005: Provider-agnostischer Sending Layer

## Status
Accepted

## Kontext
Sales OS verschickt Outreach über mehrere Kanäle (LinkedIn DM, LinkedIn Connection,
Email, später WhatsApp/SMS) und integriert externe Dienste (Unipile, Gmail API,
Outlook API, Calendly/Cal.com, HubSpot/Salesforce). Welcher konkrete Provider pro
Kanal verwendet wird, ist **noch nicht final entschieden** — insbesondere LinkedIn
ist heikel (kein offizieller API-Zugang ohne Partnerschaft, Unipile als Grauzone).
Wenn Provider-spezifischer Code in der Business-Logic verstreut ist, wird ein
Provider-Wechsel zum Großumbau.

## Entscheidung
**Alle ausgehenden Aktionen laufen über eine abstrakte Sending-Schicht. Provider
sind austauschbare Adapter dahinter. Die Business-Logic kennt keinen Provider.**

Jede ausgehende Nachricht speichert kanal-/provider-agnostisch:
`sending_channel`, `sending_provider`, `external_message_id`, `delivery_status`,
`sent_at`, `delivered_at`, `read_at`.

Gleiches Prinzip für CRM (`crm_provider`) und Kalender (`booking_provider`).

## Konsequenzen
**Positiv:**
- Neuer Provider = eine neue Adapter-Klasse, kein Eingriff in DB oder Logik
- LinkedIn-Risiko ist isoliert — wir können auf Email/WhatsApp vollautomatisieren
  und LinkedIn bewusst auf semi_auto lassen, ohne Code-Umbau
- Delivery-Status ist einheitlich trackbar, egal welcher Provider
- White-Label-Kunden können eigene Provider/Accounts nutzen

**Negativ:**
- Eine Abstraktions-Indirektion mehr (bewusst in Kauf genommen)
- Jede Sending-Funktion muss die Prüffrage bestehen: "Funktioniert das auch wenn
  wir morgen den Provider wechseln?"

## Verworfene Alternativen
- **Direkter Provider-Aufruf in der Business-Logic** — koppelt das System an z.B.
  Unipile; ein Wechsel oder LinkedIn-Sperre würde breiten Umbau erzwingen.
- **Nur einen Provider fest verdrahten** — riskant, da LinkedIn-Zugang ungewiss ist
  und verschiedene Kunden verschiedene Kanäle brauchen.

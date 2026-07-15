# ABO-VERWALTUNG (BILLING) — Bauplan DRAFT v0.9
# Sales OS · Juli 2026 · ERSTER ENTWURF — bewusst mit Offenheiten
# Status: RICHTUNGS-DOKUMENT. Re-Challenge vor Launch-Phase zwingend (Abschnitt 6).
# Kern-Anforderung von Oliver: Das System muss VOLLSTÄNDIG OHNE Abo-Verwaltung
# funktionieren (interne Nutzung zuerst) — Billing wird später NACHGERÜSTET, ohne Umbau.

---

## 0. LEITARCHITEKTUR — ZWEI SCHICHTEN (die eine Entscheidung, die alles trägt)

**Schicht 1 — Entitlement-Layer (wird FRÜH gebaut, läuft immer):**
Eine einzige Wahrheit für "darf diese Org das / wie viel noch?":
`check_entitlement(org_id, feature)` und `check_credit_balance(org_id, type)` lesen
aus plans/plan_limits/credit_balance. JEDER Code-Pfad im System fragt NUR diese
Functions — niemals Stripe, niemals Plan-Namen, niemals hardcodierte Limits.

**Schicht 2 — Billing-Layer (wird SPÄT nachgerüstet):**
Stripe (Checkout, gespeicherte Zahlungsmethode, Webhooks, Customer Portal), Plan-Wahl-UI,
Trial-Ablauf-Zustände, Kauf-Flows. Dockt ausschließlich an Schicht 1 an (schreibt
organization_subscription + credit_balance). Nachrüsten = neue Slices, NULL Umbau an
Schicht 1 oder an irgendeinem Feature.

**Schalter:** `system_config.billing_enabled = false` (Start). Solange false:
keine Paywalls, keine Kauf-Popups, der Credit-Kauf-Flow (Chat-Plan C7) blendet sich
sauber aus, Anfragen-Flow (C6) für Käufe inaktiv. Verbrauch wird TROTZDEM gezählt
(Telemetrie von Tag 1 — Olivers Pricing-Doku braucht reale Verbrauchsdaten zur Kalibrierung).

---

## 1. ENTSCHEIDUNGEN (A1–A8, erste Fassung)

| # | Entscheidung |
|---|---|
| A1 | **Entitlement-first (Abschnitt 0).** Kein Feature kennt Stripe. Kein Feature kennt Plan-Namen. Nur check_entitlement/check_credit. |
| A2 | **Interner Plan:** plans-Zeile `internal` mit limit_value = -1 (unbegrenzt) für alle Features + unbegrenzte Credits. Eure Org + Demo-Org laufen darauf. Das System ist damit ohne einen einzigen Stripe-Key voll funktionsfähig. |
| A3 | **Schema aus Pricing-Doku wird 1:1 übernommen** (plans, plan_limits, organization_subscription, credit_balance, credit_transactions, addons — Struktur existiert dort bereits). ⚠ SEQUENZ-HINWEIS: credit_balance/credit_transactions werden vom **AI SDR (Slice 5, Credit-Metering)** vorausgesetzt → die Entitlement-Migration (Slice A-1) muss VOR AI SDR Slice 5 laufen. In PROGRESS.md entsprechend einplanen. |
| A4 | **Enforcement-Punkte (zentrale Liste, wächst mit):** Credits vor jeder AI-Aktion (existiert als Regel) · Kontakte-Anzahl beim Import · Campaigns-Anzahl beim Aktivieren · Mailboxen beim Verbinden · Seats beim Einladen · Add-on-Features (Sherloq-Signale, Enrichment, CRM-Sync) beim Aufruf. Bei billing_enabled=false: immer erlauben, immer zählen. Verhalten bei Limit (später): freundlicher Block + Upgrade-/Anfrage-Option (C6/C7) — nie stiller Fehler. |
| A5 | **Sherloq & Add-ons** laufen über die addons-Tabelle und dieselbe Entitlement-Abfrage (`check_entitlement(org, 'sherloq_signals')`). Die Onboarding-Add-on-Seite (O7) und Settings-Kachel schreiben hier rein. |
| A6 | **Billing-Rechte:** ausschließlich Owner + via user_permissions `billing.*` delegierte Admins (deckt sich mit Chat-Plan C7/C12). Alle Billing-Aktionen → audit_log. |
| A7 | **Kündigungs-/Datenpfad** (Entscheidungen existieren): Kündigung → 30 Tage Löschfrist, Export vorher JA, Opt-out-Kontakte 90T Audit dann anonymisieren. Wird in der Billing-Phase als Flow gebaut, Regeln stehen fest. |
| A8 | **Stripe-Bauprinzipien (für die spätere Phase, jetzt festgeschrieben):** Webhook ist die einzige Wahrheit (Gutschrift/Status NIE nach Client-Response), Idempotenz via event_id, Preise leben in Stripe + plans-Tabelle (änderbar ohne Code), Customer Portal für Rechnungen/Zahlungsmethode statt Eigenbau. |

---

## 2. GROBE SLICES

**Phase JETZT (vor AI SDR Slice 5):**
A-1: Migration (6 Tabellen aus Pricing-Doku) + internal-Plan-Seed + check_entitlement/
check_credit_balance Functions + billing_enabled Flag · A-2: Verbrauchszählung
verifizieren (AI-Credits, Enrichment, Verifizierung — Zähl-Punkte existieren in den
Bauplänen, hier nur Abnahme dass alles über die zentralen Functions läuft).

**Phase LAUNCH (nach Onboarding-Re-Challenge, Reihenfolge dann final — alle externen
Verkabelungen laufen als Klasse B über docs/integrations_masterplan.md):**
A-3: Stripe-Grundintegration (Customer, Checkout, Webhooks, Portal — Klasse B) ·
A-4: Plan-Wahl + Trial-Zustände (14 Tage — entschieden) + Ablauf-Verhalten ·
A-5: Credit-Kauf-Flow scharf schalten (C7 + Anfragen C6) · A-6: Add-on-Buchung
(Sherloq) · A-7: Kündigung/Export/Löschfristen (A7) · A-8: Limit-UX
(Zähler-Anzeigen, 80%-Warnungen, Upgrade-Momente — ehrlich, kein Dark Pattern).

---

## 3. BEKANNTE FALLEN (erste Sammlung)
1. Der klassische Nachrüst-Fehler: Features prüfen Limits "erstmal nicht" und müssen
   später an 40 Stellen angefasst werden. Deshalb Schicht 1 SOFORT — jede neue Funktion
   ruft check_entitlement von Anfang an, auch wenn die Antwort heute immer "ja" ist.
2. Kein Plan-Name-Stringvergleich im Code ("if plan == 'growth'") — nur Feature-Limits.
3. Verbrauch zählen ≠ blockieren: Zählung läuft ab Tag 1, Blockade erst mit billing_enabled.
4. Stripe-Webhooks: Signatur + Idempotenz + Retry-Verhalten (siehe Chat-Plan Slice 8 —
   dieselben Regeln, EINE Implementierung, nicht zwei).
5. Trial-Ende darf nie Daten sperren, nur Aktionen — Export bleibt immer möglich (DSGVO/A7).

---

## 4. OFFEN (bewusst — gehört in die Launch-Re-Challenge)
Kreditkarte bei Trial ja/nein · Credit-Rollover-Policy · finale Preise/Pakete
(Kalibrierung braucht reale Verbrauchsdaten aus Phase JETZT) · Jahres- vs. Monats-Mix ·
Seat-Nachkauf-UX · Dunning (past_due-Verhalten) · SOTA-Trend prüfen: Markt bewegt sich
Richtung Hybrid aus Seats + Usage/Outcome-Pricing — bei Kalibrierung berücksichtigen.

---

## 5. AUSSERHALB DIESES PLANS
Rechte-/Nutzerverwaltungs-UI → Settings-Session (Rechte-Tabelle + user_permissions
existieren als Entscheidung) · Credit-Kauf-UI-Details → Chat-Bauplan C7 (dort fertig
spezifiziert, wird hier nur scharf geschaltet).

---

## 6. ⚠ DRAFT-HINWEIS — RE-CHALLENGE VOR LAUNCH-PHASE
Phase JETZT (A-1/A-2) ist baureif und zeitkritisch (Sequenz A3). Phase LAUNCH wird vor
Baubeginn erneut komplett gechallengt (4-Schritte-Prozess + SOTA-Pricing-Check), zusammen
mit der Onboarding-Re-Challenge — beide Flows sind verzahnt (Signup → Trial → Plan).

---
*Sales OS · Abo-Verwaltung DRAFT v0.9 · Juli 2026 · A1–A8 als Richtung fixiert*
*Phase JETZT baureif · Phase LAUNCH = Re-Challenge zwingend*

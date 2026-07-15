# INTEGRATIONS-MASTERPLAN
# Sales OS · Juli 2026 · Zentrales Dokument für ALLE externen Anbindungen
# Prinzip: Baupläne definieren Anschlusspunkte — dieses Dokument regelt, WANN und WIE
# verkabelt wird. Kein Feature wartet auf eine Klasse-B-Integration (ehrliche
# "Verbinden"-Hinweise statt Fake-Zustände).

---

## 0. ZWEI KLASSEN

**Klasse A — Kern (MUSS beim Bau live sein):** Integrationen, gegen die Kern-Slices
real getestet werden. Werden in der einmaligen **Integrations-Session 0** eingerichtet,
BEVOR der AI SDR startet. Gegen Attrappen gebaut wären Send-Gates, Tracking, Bounces
und Reply-Handling ein Big-Bang-Risiko — genau das verhindert die Slice-Methode.

**Klasse B — Anschluss (gesammelt in der Integrations-Endphase):** Anbindungen, deren
Anschlusspunkte in den Bauplänen fertig definiert sind und die am Ende in EINER
gebündelten Phase verkabelt werden — jede als Mini-Slice mit STOP + QA.

---

## 1. GESAMTTABELLE

| Integration | Zweck | Andockpunkt (Bauplan/Slice) | Klasse | Vorbereitung Oliver |
|---|---|---|---|---|
| **Nango** (Plattform) | Managed OAuth für alle Google/Microsoft-Verbindungen | AI SDR 3/7 · Onboarding O5 · Mein Tag M13 | **A** | Account anlegen, Projekt, Secret in Vault |
| **Google OAuth-App (Gmail)** | Senden + eingehende Antworten lesen | AI SDR Slice 3 + 7 | **A** | ⚠ SOFORT STARTEN — Abschnitt 3 |
| **Microsoft Entra-App (Outlook)** | Senden + Antworten | AI SDR Slice 3 + 7 | **A** | App-Registrierung (schnell, Tage) |
| **Langfuse (EU)** | Prompts, Tracing, Token-Tracking | Chat 5c/Slice 3 · alle AI-Functions | **A** | Account EU-Region, Keys → Vault |
| **Google Gemini API** | LLM (Start-Modell) + Embeddings (RAG) | lib/ai.ts · Chat Slice 2R | **A** | API-Key → Vault |
| **System-Mail-Kanal** (z.B. Resend, Free-Tier) | Alarme (B3), Mitteilungs-Mails (N5), Digest, Prep-Mail — NIE über User-Mailboxen | Betrieb B-1 · Mitteilungen N-S4 | **A** | INTERN: kostenloser Account mit bestehender privater E-Mail — Versand vom Dienst-Test-Absender an die EIGENE Adresse (keine Domain, keine Firma nötig, ~15 Min). Fallback falls nicht gewünscht: B-1 läuft In-App-only, Mail-Kanal kommt in B-2 (Preis: Nacht-Ausfälle erst beim nächsten App-Öffnen sichtbar). LAUNCH: eigene Domain verifizieren → Versand an Kunden. |
| **Sherloq-Webhook** | Signale/Leads (eigenes Produkt) | AI SDR Slice 6 | eigenes System | HMAC-Secret beidseitig hinterlegen |
| **Cal.com (Self-Host)** | automatische Buchungs-Erkennung (Webhook) | AI SDR Slice 10-Rest (confirm_booking) | **B — I-B1** | Hosting-Entscheidung erst in Endphase |
| **Kalender-Lese-Sync** (Google/Outlook via Nango) | Mein Tag Zone 1 (M13) + externe Buchungs-Erkennung (E3) | Mein Tag Slice 3-Anschlusspunkt | **B — I-B2** | Scopes erweitern (Calendar read) |
| **Stripe** | Billing (Abo Phase LAUNCH) | Abo A-3ff · Chat Slice 8 | **B — I-B3** | Account, erst zur Launch-Phase |
| **Surfe** | Enrichment | Anschlusspunkt: Enrichment-Modul (#) | **B — I-B4** | Account bei Bedarf |
| **ZeroBounce/NeverBounce** | Email-Verifizierung Ebene B | lib/verification.ts Anschlusspunkt | **B — I-B5** | Account bei Bedarf (Ebene A läuft ohne) |
| **CRM-Sync** (HubSpot/SF) | Lead-Quelle v2 (#19) | offen — v2 | **B — I-B6** | erst v2 |

Regel: Externe Booking-Links (HubSpot Meetings, Google Terminplan, Outlook Bookings)
sind KEINE Integration — nur eine URL im User-Profil (AI SDR E3), null Setup.

---

## 2. INTEGRATIONS-SESSION 0 (einmalig, VOR AI SDR Slice 3)

Gemeinsame Session Oliver + Claude Code, geschätzt 0,5–1 Tag aktive Arbeit:
1. Nango-Account + Projekt, beide Provider-Integrationen (google-mail, outlook) anlegen
2. Google-Cloud-Projekt: OAuth-App im **Testing-Modus** (Consent-Screen ausfüllen, eure
   Konten als Test-User — KEINE Einreichung zur Verifizierung, siehe Abschnitt 3)
3. Microsoft Entra: App-Registrierung, Mail.Send + Mail.Read (delegated), Redirect auf Nango
4. Langfuse EU: Projekt, Public/Secret-Key
5. Google AI Studio: Gemini-API-Key
6. System-Mail-Kanal: kostenloser Resend-Account (o.ä.) mit Olivers bestehender
   E-Mail — Empfänger = eigene Adresse, kein Domain-Setup (Details Tabelle 1);
   falls Oliver verzichtet: dokumentiert überspringen, B-1 = In-App-only
7. Alle Secrets → Supabase Vault (Namenskonvention dokumentieren in README)
8. Claude Code: ENV-Verdrahtung + Verbindungs-Smoke-Test (eine Test-OAuth-Verbindung
   pro Provider mit euren eigenen Accounts)
**Danach ist AI SDR Slice 3 entblockt** — im Google-"Testing"-Modus mit euren eigenen
Konten voll funktionsfähig, während die Verifizierung läuft.

---

## 3. SENDE-STRATEGIE & GOOGLE-VERIFIZIERUNG (final entschieden)

**JETZT (Bau + interne Nutzung):** Beide OAuth-Apps im Test-Modus mit euren eigenen
Konten — Google "Testing" (bis 100 Test-User, Warnhinweis wegklicken, voll
funktionsfähig) + Microsoft App-Registrierung (sofort nutzbar). KEINE Verifizierung
nötig. Session 0 legt genau das an.

**ZUM LAUNCH (Klasse B, Vorlauf beachten):**
- **Google-Verifizierung** einreichen, sobald App fertig + Launch absehbar (braucht:
  Domain mit Datenschutzerklärung, App-Name/Logo, Demo-Video der fertigen Scope-Nutzung,
  Begründungstexte — Claude Code liefert Entwürfe). Dauer: WOCHEN. Vorher fertig machen:
  Domain, Datenschutzerklärung, Branding.
- **Microsoft Publisher-Verifizierung** (braucht eingetragenes Unternehmen, dauert Tage) —
  parallel. **Launch-Option Microsoft-first:** Outlook-Kunden können sofort bedient
  werden, während die Google-Prüfung läuft.
- **I-B7 SMTP/IMAP-Universal-Fallback:** zusätzlicher Adapter in lib/sending.ts —
  funktioniert mit jedem Provider OHNE App-Verifizierung; Sicherheitsnetz für den Launch
  und Anschluss exotischer Provider.
- **I-B8 Managed Mailboxes (optional, v2):** Add-on über Partner (provisionierte
  Zweit-Domains + Postfächer) für Volumen-Kunden — nur Anbindung, kein Eigenbau.
  Bewusst NICHT das Kern-Modell: Sherloq OS sendet primär aus den ECHTEN Postfächern
  der User (Qualitäts-/Signal-Positionierung — das Massen-Modell der autonomen
  Wettbewerber ist genau das, dessen Reply-Raten einbrechen).

---

## 4. INTEGRATIONS-ENDPHASE (Klasse B — ein gebündelter Block nach den Kern-Modulen)

Reihenfolge (jede als Mini-Slice, eigener Branch, STOP + QA):
**I-B1 Cal.com:** Self-Host-Setup, Nango-Kalender-OAuth, validate_booking-Webhook →
ruft die BESTEHENDE confirm_booking-Funktion (AI SDR Slice 10) — CANCELLED/RESCHEDULED-
Pfade, Webhook-Signatur. QA: echte Testbuchung → Deal + Prep automatisch.
**I-B2 Kalender-Lese-Sync:** Scopes erweitern, Sync heutiger Tag (read-only, Cron +
on-open), Mein Tag Zone 1 verkabeln (M13-Anschlusspunkt), Verbinden-Kachel in Settings.
QA: externer Kalender-Termin erscheint in Zone 1.
**I-B3 Stripe:** gemäß Abo-Bauplan Phase LAUNCH (A-3 bis A-8) — Webhook-Wahrheit,
Idempotenz, Portal.
**I-B4 Surfe / I-B5 ZeroBounce:** hinter die bestehenden Abstraktionen (Enrichment-
Anfrage-Flow, lib/verification.ts Ebene B) — reine Provider-Verkabelung + Credits.
**I-B6 CRM-Sync:** v2, eigener Plan wenn fällig.
**I-B7 SMTP/IMAP-Fallback-Adapter** (Abschnitt 3): zusätzlicher Adapter in
lib/sending.ts, Verbinden-Formular in Settings, gleiche Send-Gates/Tracking-Logik.
**I-B8 Managed Mailboxes** (optional, v2): Partner-Anbindung, nur wenn Kundenbedarf.
**I-B9 BCC-Logging-Adresse** (optional, geparkt — keine Priorität): HubSpot-Muster für
User im mailbox-losen Modus (AI SDR E25): Mail an Logging-Adresse in Kopie → wird am
Kontakt dokumentiert, Manual-Step hakt sich ab; Antworten per Weiterleitung erfassbar.
Braucht Empfangs-Infrastruktur auf eigener Domain (Synergie: derselbe transaktionale
Mail-Dienst wie System-Alarme B3). Nur bauen, wenn der mailbox-lose Modus real
nennenswert genutzt wird.
**I-B10 Usage-Ingestion-API (generisch) — VERKAUFSVORAUSSETZUNG für Farmer bei
Fremdkunden:** Generischer Ereignis-Endpoint pro Org (eigener API-Key + HMAC):
`{contact_ref | company_ref, event_type, quantity, occurred_at}` — Kunde/Zapier/Make
schickt beliebige Nutzungs-Ereignisse (Logins, Projekte, API-Calls …). Settings:
Mapping event_type → Gewicht. Nächtliche Verdichtung → neutrales usage_score-Feld,
das die bestehende Churn-Formel konsumiert (Sherloq wird damit EIN Lieferant unter
mehreren). ⚠ PRÜFVERMERK an Claude Code (kleiner Audit, jederzeit möglich): Im
bestehenden Farmer-DB-Wiring verifizieren, dass die Churn-Formel auf neutrale
Usage-Felder schaut und NICHT auf Sherloq-Spalten hart verdrahtet ist — falls doch:
kleiner Refactor VOR dem ersten Fremdkunden.
**I-B11 Meeting-Transkript-Ingestion (automatisch):** Abruf von Meeting-Transkripten
über die bestehende Kalender-/OAuth-Verbindung — Microsoft: Teams-Transkripte via
Graph-API (heikler Scope, IT-Admin-Consent nötig — ehrlich im Verbinden-Flow erklären),
Google: Meet-Transkripte aus Drive/Docs. Ergebnis befüllt das BESTEHENDE
Meeting-Nachbereitungs-Panel (AI SDR Slice 10) automatisch vor — gleiche Pipeline
(communications type meeting → Kurzakte → RAG-Chunking, das für lange Transkripte
gebaut ist). Bis dahin gilt der manuelle Weg: Transkript per Copy-Paste ins Panel.
**Launch-Vorlauf (parallel zur Endphase):** Google-Verifizierung + Microsoft
Publisher-Verifizierung nach Abschnitt 3 — VOR dem ersten externen Kunden abgeschlossen.

Regel für die Endphase: Es entsteht KEINE neue Businesslogik — nur Verkabelung an
definierte Anschlusspunkte. Taucht fehlende Logik auf → STOP, das ist ein Planungsfehler,
zurück in den jeweiligen Bauplan.

---

## 5. v2-AUSBAUTEN (fest eingeplant, bewusst NICHT jetzt)

**MCP-Server (v2, ~1 Slice nach Chat-Slice-2):** Die Tool-Registry des AI Chats ist
inhaltlich bereits ein MCP-Server (benannte Tools + Permission-Guard). Eine dünne
MCP-Protokoll-Hülle darüber macht Sherloq OS für jedes Claude (Desktop/Code/Chat)
als Connector verfügbar. **Verbindungs- & Rechte-Modell (Pflichtteil):** Verknüpfen
erzeugt einen API-Key mit SCOPES, die bei der Freigabe gewählt werden — Regeln:
(1) Eine Verbindung kann NIE mehr als der User selbst (Scopes schränken nur ein).
(2) Default read-only; Schreib-Scopes bewusst freischalten; destruktive/Send-Tools
über MCP standardmäßig gesperrt (externe Clients rendern unsere confirmation-Blöcke
nicht). (3) Keys in Settings → Integrationen sichtbar + widerrufbar; jede Aktion mit
Key-Kennung im audit_log. Tabelle: api_connections (user_id, scopes[], revoked_at).
**Outbound-Webhooks (v2, klein):** Ereignis-Abo pro Org (z.B. deal_won, reply_received)
→ HTTP-POST mit HMAC an Kunden-URL; Zapier/Make-Anschluss ohne Eigenbau.
**Public API (v2):** dünner Aufsatz auf die 6c-Functions (API-Keys via Entitlement,
Rate-Limits) — kein Umbau nötig, Architektur ist dafür gebaut.

**Action-Typ-Registry (v2, ~2–3 Wochen-Klasse):** User können eigene Action-Typen
definieren (Bedingung, Routing, Darstellung, CTA, Automation, Cooldown) — angelegt per
AI Chat (geführter Dialog C23 + Wirkungs-Vorschau C22), verwaltet in Settings →
"Eigene Actions". Architektur: Typen wandern vom Code in eine Registry-Tabelle,
bestehende Actions werden als System-Typen migriert; generischer Auswerter-Cron +
generische Kachel/Panel rendern aus der Typ-Definition.
**Drei verbindliche Weichen AB SOFORT (billig jetzt, teuer nachgerüstet):**
1. Bedingungs-/Filter-Sprache als EINE gemeinsame Bibliothek — dynamische Listen,
   Lifecycle-Trigger und Analyse-Katalog nutzen dieselbe (Single Source, kein freies
   SQL). **Erstmals gebaut in kontakte_companies_bauplan Slice K-2** — alle späteren
   Nutzer verwenden diese Lib, bauen nie eine zweite.
2. Kacheln/Action-Panels strikt aus panel-blocks komponieren, nie typ-spezifische
   Sonderverdrahtung (bestehende Regel, hier nochmals verbindlich).
3. Settings-Bereich "Regeln" so designen, dass die Sektion "Eigene Actions" später
   nur dazukommt (Layout-Reserve, keine Logik).

## 6. PFLEGE
Neue externe Anbindung irgendwo im Projekt? → Zeile in Tabelle 1 + Klasse zuweisen,
im selben PR wie der Anschlusspunkt. Dieses Dokument in CLAUDE.md-Referenzliste eintragen.

---
*Sales OS · Integrations-Masterplan v1.2 · Juli 2026*
*Session 0 (Test-Modus) = Voraussetzung für AI SDR Slice 3 · Verifizierungen = Launch-Vorlauf (Abschnitt 3) · Sende-Strategie final: eigene Postfächer als Kern, SMTP-Fallback + Managed Mailboxes als Launch-/v2-Optionen · v2: Usage-Ingestion I-B10 vor erstem Fremdkunden, Action-Typ-Registry (Abschnitt 5)*

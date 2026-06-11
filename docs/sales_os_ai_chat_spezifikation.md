# Sales OS — AI Chat Spezifikation
# Juni 2026 · Eigenständiges Dokument
# Für Claude Code Übergabe wenn AI Chat gebaut wird (Phase nach Basis-System)

---

## 1. GRUNDPRINZIP

Der AI Chat ist die intelligente Steuerzentrale von Sales OS. Er hat vollständigen Lese- und Schreibzugriff auf alle Tabellen und kann das gesamte System per natürlicher Sprache steuern.

**Überall verfügbar:** via Cmd+Enter öffnet sich ein Chat-Overlay — egal auf welchem Screen.

**Strikte Trennung zu Cmd+K:**

| Cmd+K | AI Chat |
|---|---|
| Navigation & Suche | Analysen & Empfehlungen |
| Schnelle Standardaktionen | Komplexe kontextabhängige Aktionen |
| Direkte Ausführung | Interpretation & Konversation |
| Kurze Begriffe | Vollständige Sätze |
| Vorhersehbar | Intelligent |
| Keine Einstellungs-Änderung | Einstellungen ändern via Chat |

---

## 2. WAS DER CHAT KÖNNEN MUSS

- Infos zu Kontakten/Kunden abrufen ("was weißt du zu Paul Kammerer")
- Nächste Schritte empfehlen ("was muss ich als nächstes tun")
- To-dos abrufen ("welche Tasks habe ich heute", "welche sollte ich zuerst machen")
- Regeln ändern ("Follow-up auf 10 Tage", "Heat Kalt ab 20 Tagen")
- Jedes Feld in jeder Tabelle ändern (update_field Fallback)
- Email/LinkedIn-Nachrichten generieren mit Action-Buttons
- Listen abrufen ("zeig mir alle kalten Kunden")
- Einzelnen Kontakt öffnen ("öffne Kunde Paul")
- Analysen ("Conversion Rate Demo→Follow-up letzten Monat")
- Konfiguration ändern (Thresholds, Automation-Level, etc.)

---

## 3. KERN-ARCHITEKTUR: AI gibt JSON, Frontend rendert Komponenten

Der Chat antwortet NICHT mit langem Text, sondern mit strukturierten JSON-Blöcken die das Frontend als vorgebaute Komponenten rendert.

**Vorteile:** Spart Token (günstig), schnell, konsistent, beliebig erweiterbar.

### Komponenten-Typen

```
{type: "text", content}
→ normale Textantwort (Analysen, Erklärungen)

{type: "contact_card", contact_id}
→ kompakte Kontakt-Kachel, klickbar → Info Panel

{type: "contact_list", contacts[], count, filter}
→ count <= 10: inline Mini-Kacheln im Chat
→ count > 10: "84 Kontakte gefunden" + Button "In [Screen] öffnen →"

{type: "single_contact", contact_id}
→ öffnet direkt Info Panel des Kontakts

{type: "email_draft", to, subject, body, actions: ["senden", "anpassen"]}
→ Email-Card mit Empfänger + Betreff + Body + Senden-Button

{type: "linkedin_draft", to, message, actions}
→ LinkedIn verbunden: Senden-Button
→ nicht verbunden: "In LinkedIn öffnen" Button

{type: "confirmation", message, action}
→ Bestätigung bei Änderungen: "Follow-up auf 10 Tage geändert ✓"

{type: "deal_card", deal_id}      (später erweiterbar)
{type: "task_list", tasks[]}      (später erweiterbar)
```

### Blöcke kombinieren

AI kann mehrere Blöcke als Array zurückgeben. Frontend rendert untereinander.

Beispiel "Was weißt du zu Paul Kammerer":
```json
[
  {type: "contact_card", contact_id: "abc"},
  {type: "text", content: "Letzter Kontakt vor 12 Tagen. Deal 24.000€ in Stage Demo. Churn niedrig. Nächster Schritt: Follow-up zur Demo-Auswertung."}
]
```

---

## 4. LISTEN-REGEL (wie die Besten es machen — Notion AI Pattern)

| Situation | Verhalten |
|---|---|
| 1–10 Treffer | inline als Mini-Kacheln im Chat |
| > 10 Treffer | Chat öffnet echten Screen mit gesetztem Filter |
| Einzeltreffer | öffnet direkt Info Panel |
| Arbeits-Kontext (filtern, sortieren) | immer echten Screen öffnen |

**Begründung:** Der Chat baut das System nicht nach. Listen, Filter, Sortierung kann der Hauptscreen besser. Chat = schneller Einstieg, übergibt für echte Arbeit an die bestehende Seite.

---

## 5. WO WIRD ES GECODET (3 Stellen)

1. **Edge Function `ai_chat()`**
   - Interpretiert die Frage (via Langfuse Prompt)
   - Holt benötigte Daten aus DB
   - Gibt Array von JSON-Blöcken zurück

2. **Komponenten-Registry (Frontend)**
   - Kennt alle Block-Typen
   - Weiß wie jeder Typ gerendert wird
   - Zentrale Stelle für alle Chat-Komponenten

3. **Langfuse Prompt**
   - Definiert welche Block-Typen die AI nutzen darf
   - Definiert wann welcher Typ verwendet wird
   - Versioniert + editierbar ohne Code-Deploy

---

## 6. NACHTRÄGLICH ERWEITERBAR

Neuer Block-Typ = 2 Schritte:
1. Komponente bauen (z.B. `deal_card`)
2. In Registry registrieren + im Langfuse-Prompt erwähnen

Kein Umbau des Chats. AI lernt neuen Block über Prompt, Frontend rendert über Registry.

---

## 7. LANGFUSE INTEGRATION

### Warum Langfuse
- Prompt-Management: Prompts leben in Langfuse-UI, nicht im Code
- Prossi/Paul können Prompts selbst ändern ohne Code-Deploy
- App lädt automatisch neueste Version (production Label)
- Tracing: jeder Chat-Aufruf wird geloggt
- Token-Tracking → fließt in Credit-System (AI-Credits)

### Setup durch Claude Code
- Offizielle Langfuse Agent Skill: github.com/langfuse/skills
  → "Installiere Langfuse Skill und richte Prompt Management ein"
- Nativer MCP-Server:
  `claude mcp add --transport http langfuse https://cloud.langfuse.com/api/public/mcp`
- ENV-Variablen: LANGFUSE_SECRET_KEY · LANGFUSE_PUBLIC_KEY · LANGFUSE_BASE_URL
- EU-Region (DSGVO): https://cloud.langfuse.com

### Deployment via Labels
- 'production' = Live-Version
- 'staging' = Test-Version
- pro Mandant möglich → Multi-Tenant Prompt-Varianten

---

## 8. SICHERHEIT & RECHTE

- Chat respektiert Rollen & Rechte des Users
- Ein viewer kann über Chat nichts ändern was er im UI nicht ändern dürfte
- Alle Änderungen via Chat → audit_log Eintrag
- update_field() prüft Permission bevor Änderung ausgeführt wird
- Multi-Tenant: Chat sieht nur Daten der eigenen organization_id

---

## 9. DB / TECHNISCH

```sql
chat_sessions (
  id              uuid PK
  organization_id uuid FK
  user_id         uuid FK
  created_at      timestamptz
)

chat_messages (
  id              uuid PK
  session_id      uuid FK
  role            text     -- 'user' | 'assistant'
  content         jsonb    -- bei assistant: Array von Blöcken
  langfuse_trace_id text   -- für Tracing
  created_at      timestamptz
)
```

Function Calling Funktionen (alle aus Briefing Abschnitt 16):
- Spezifische Funktionen (update_deal, add_company, etc.)
- update_field(table, record_id, field, value) als universeller Fallback
- query_contacts(filter) → für Listen-Abfragen
- generate_message(contact_id, channel, intent) → für Drafts

---

## 10. ZUKUNFT (v2/v3) — EIGENE DASHBOARDS

Siehe separates Konzept in session_notizen. Gleiche Philosophie:
AI wählt aus vorgebauten Widget-Komponenten, baut nichts frei.
custom_dashboards Tabelle wird vorbereitet, Feature kommt später.

---

*Sales OS AI Chat Spezifikation · Juni 2026*
*Wird gebaut nach Basis-System (Schritt 18 in Startanleitung)*
*Übergabe an Claude Code zusammen mit: CLAUDE.md + Briefing Abschnitt 16*

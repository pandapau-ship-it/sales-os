# ADR 006: Zentrale aiCall()-Abstraktion für alle AI-Aufrufe

## Status
Accepted

## Kontext
Sales OS ruft Claude an mehreren Stellen auf: Chat-Interpretation, Kurzakte-
Fortschreibung, Intent Detection, Nachricht-Generierung. Diese Aufrufe verursachen
Kosten (Token), müssen pro Organisation getrackt werden (Plan-Limits), brauchen
einheitliches Retry-/Timeout-Verhalten und sollen später mit Langfuse beobachtbar
sein. Wenn jeder Aufrufer den Anthropic-SDK direkt nutzt, sind Kosten-Tracking,
Observability und Modell-Wahl über das ganze Projekt verstreut und divergieren.

## Entscheidung
**Kein Code ruft den Anthropic-SDK direkt auf. Alle AI-Aufrufe laufen über eine
einzige Funktion `aiCall()` in `src/lib/ai.ts` (Frontend) bzw. der entsprechenden
Edge-Function-Variante.**

`aiCall()` ist der zentrale Choke-Point für:
- Modell-Wahl nach Aufgabe (Haiku für Routine, Sonnet für Qualität, nie Opus für Automatik)
- Kosten-Logging: `ai_usage` (per-Call) + `api_usage` (monatliche Aggregation pro Org)
- Langfuse-Tracing (ein-Datei-Change wenn aktiviert)
- Einheitliches Timeout/Retry/Fehlerverhalten

## Konsequenzen
**Positiv:**
- Langfuse-Integration = Änderung an EINER Datei, kein projektweiter Umbau
- Kosten pro Organisation sauber trackbar → Plan-Limit-Enforcement möglich
- Modell-Wahl konsistent und an einer Stelle steuerbar
- Das `audit.ts`-Script prüft automatisch, dass kein SDK-Import außerhalb `lib/ai.ts` existiert

**Negativ:**
- Eine Indirektion mehr zwischen Aufrufer und SDK
- Bestehender `aiChat.ts` nutzt den SDK noch direkt → muss bei Bau von `lib/ai.ts`
  migriert werden (im Audit als WARN getrackt, in CHECKLIST.md offen)

## Verworfene Alternativen
- **Direkter SDK-Aufruf pro Feature** — Kosten-Tracking und Observability verstreut,
  Langfuse-Integration würde jede Aufrufstelle anfassen, Modell-Wahl inkonsistent.
- **Nur ein dünner Wrapper ohne Logging** — verschenkt den Hauptnutzen (Kosten/
  Limits/Tracing an einer Stelle).

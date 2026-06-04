# ADR 003: Business-Logic in Edge Functions statt im Frontend

## Status
Accepted

## Kontext
Berechnete Werte wie Heat-Status, Churn-Score, ICP-Score, Sequenz-Step-Logik und
Signal-Erkennung könnten im React-Frontend berechnet werden. Das System soll aber
später als MCP-Server betrieben werden und eine direkte Schnittstelle zu Sherloq
erhalten. Außerdem gibt es mehrere Eintrittspunkte für dieselbe Logik (UI, AI-Chat,
Cmd+K, Claude Routines, Webhooks) — Logik im Frontend wäre dupliziert und divergiert.

## Entscheidung
**Alle Business-Logic läuft in Supabase Database Functions / Edge Functions.
Kein berechneter Wert entsteht im React-Code.**

Jede Edge Function wird so gebaut als würde sie auch extern aufgerufen:
- Klare JSON Ein-/Ausgaben
- Auth via Supabase Bearer Token
- Saubere HTTP-Status-Codes
- Kein hardcodierter State

## Konsequenzen
**Positiv:**
- Eine Quelle der Wahrheit für jede Berechnung — egal welcher Aufrufer
- Edge Functions sind später automatisch der MCP-Server, nur der Wrapper kommt dazu
- Frontend bleibt dünn: interpretiert, rendert, ruft auf — rechnet nicht
- Testbar und extern wiederverwendbar (n8n, Zapier, andere AI-Agenten)

**Negativ:**
- Mehr Round-Trips als bei reiner Frontend-Berechnung (durch Caching/Realtime abgefedert)
- Etwas mehr Setup pro Funktion (Auth, Fehlerbehandlung, Typen)

## Verworfene Alternativen
- **Berechnung im Frontend** — dupliziert Logik über alle Eintrittspunkte, nicht
  extern aufrufbar, würde den späteren MCP-Server-Umbau erzwingen.
- **Monolithisches Backend** — unnötig; Supabase Edge Functions decken den Bedarf
  und sind schon Teil des Stacks.

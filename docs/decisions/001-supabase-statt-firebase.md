# ADR 001: Supabase statt Firebase

## Status
Accepted

## Kontext
Sales OS braucht eine Datenbank mit Auth, Realtime, Row-Level-Security und
serverseitiger Logik. Das System ist multi-tenant (mehrere Organisationen teilen
eine Infrastruktur) und soll später als MCP-Server und White-Label-Produkt laufen.
Die zwei realistischen Optionen waren Supabase (PostgreSQL) und Firebase (Firestore).

## Entscheidung
**Supabase (PostgreSQL).**

Gründe:
- **Echtes relationales Modell** — Sales OS hat stark verknüpfte Daten (contacts ↔
  companies ↔ deals ↔ communications ↔ sequences). Joins, Fremdschlüssel und
  generierte Spalten (`deal_volume`) sind in SQL nativ, in Firestore umständlich.
- **Row Level Security** — Multi-Tenant-Isolation über `organization_id` ist mit
  Postgres-RLS-Policies sauber lösbar. Genau das Sicherheitsmodell das wir brauchen.
- **Edge Functions + DB Functions** — Business-Logic (Heat-Status, Churn, ICP) läuft
  serverseitig und ist später automatisch der MCP-Server-Layer.
- **Kein Vendor-Lock-in** — Postgres ist Standard, jederzeit migrierbar.
- **SQL-Migrations** sind versionierbar und reviewbar.

## Konsequenzen
**Positiv:**
- RLS gibt uns Mandanten-Isolation als Datenbank-Garantie, nicht als App-Logik
- Komplexe Queries (Smart Lists, Pipeline-Aggregation) bleiben performant
- TypeScript-Typen werden aus dem Schema generiert (`supabase gen types`)

**Negativ:**
- Realtime ist auf definierte Tabellen begrenzt (wir limitieren bewusst auf 7)
- Mehr SQL-Wissen nötig als bei Firestores Dokument-Modell
- RLS-Policies müssen diszipliniert auf JEDER Tabelle gesetzt werden (→ ADR 004)

## Verworfene Alternativen
- **Firebase/Firestore** — Dokument-Modell passt schlecht zu hochverknüpften
  Sales-Daten, RLS-äquivalent (Security Rules) ist weniger ausdrucksstark,
  Vendor-Lock-in an Google, keine echten Joins.
- **Eigenes Backend (Node + Postgres)** — zu viel Infrastruktur-Aufwand für die
  aktuelle Phase; Supabase liefert Auth/Realtime/RLS schlüsselfertig.

# ADR 004: organization_id als Pflichtfeld auf jeder Tabelle

## Status
Accepted

## Kontext
Sales OS ist ein Multi-Tenant-SaaS — mehrere Organisationen (Kunden) teilen dieselbe
Datenbank-Infrastruktur. Das System soll später White-Label weiterverkauft werden.
Die zentrale Anforderung: **Kein Kunde darf jemals Daten eines anderen Kunden sehen
oder beeinflussen.** Diese Garantie muss strukturell sein, nicht von App-Logik
abhängen, die man vergessen kann.

## Entscheidung
**Jede Tabelle bekommt von Tag 1 `organization_id UUID NOT NULL REFERENCES
organizations(id) ON DELETE CASCADE`. Keine Ausnahme — auch Hilfs-, Log- und
Config-Tabellen.**

Begleitend:
- RLS auf jeder Tabelle mit `org_isolation`-Policy
- `organization_id` als JWT Custom Claim
- Index auf `organization_id` in jeder Tabelle (steht in jeder Query)
- Jede Frontend-Query filtert zusätzlich auf `organization_id`
- Terminologie ist `organization_id` — niemals `workspace_id` (vereinheitlicht)

## Konsequenzen
**Positiv:**
- Mandanten-Isolation ist eine Datenbank-Garantie (RLS), nicht App-Disziplin
- White-Label und Reselling sind ohne Datenmodell-Umbau möglich
- `ON DELETE CASCADE` macht DSGVO-Löschung trivial (Org löschen → alles weg)
- Plan-Limits und Usage-Tracking hängen sauber an der Organisation

**Negativ:**
- Jede neue Tabelle MUSS die Prüfung durchlaufen (org_id? RLS? CASCADE?) — als
  Pflicht-Prüffrage in CLAUDE.md und im `audit.ts`-Script verankert
- Index-Overhead auf jeder Tabelle (vernachlässigbar gegen den Sicherheitsgewinn)

## Verworfene Alternativen
- **Isolation nur in App-Logik** — eine vergessene `where`-Klausel = Datenleck
  zwischen Kunden. Inakzeptabel für SaaS.
- **Separate Datenbank pro Kunde** — operativ teuer, skaliert schlecht, erschwert
  Wartung und Migrations; unnötig bei sauberem RLS.
- **`workspace_id`** — wurde früh verwendet, dann auf `organization_id`
  vereinheitlicht um Doppeldeutigkeit zu vermeiden.

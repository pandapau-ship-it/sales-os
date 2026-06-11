# sales_os_crm_felder.md
# Vollständige Felddefinition — Kontakte & Companies
# Sales OS · Juni 2026
# Für Claude Code, AI Studio Prompts und UI-Dokumentation

---

## KONTAKTE — Alle Felder

### Legende
- 🔴 Pflicht — Mindestens eines der Pflichtfelder muss gefüllt sein
- 🟡 Standard — Immer sichtbar, leer = "—", jederzeit editierbar
- ⚪ Erweitert — Sichtbar wenn ausgeklappt oder via Scroll
- 🔒 System — Vom System gesetzt, nicht editierbar

---

| Feld | Typ | Kategorie | Hinweis |
|---|---|---|---|
| Vorname | Text | 🔴 Pflicht* | |
| Nachname | Text | 🔴 Pflicht* | |
| LinkedIn URL | URL | 🔴 Pflicht* | *eines von Name ODER LinkedIn reicht |
| Email | Email | 🟡 Standard | Validierung bei Eingabe |
| Telefon (direkt) | Tel | 🟡 Standard | |
| Mobil | Tel | ⚪ Erweitert | |
| Jobtitel | Text | 🟡 Standard | |
| Seniority | Dropdown | 🟡 Standard | C-Level / VP / Director / Manager / IC / Founder |
| Abteilung | Text | ⚪ Erweitert | |
| Company (Zuordnung) | Relation | 🟡 Standard | → Companies Objekt |
| Sprache | Dropdown | ⚪ Erweitert | DE / EN / FR / ES / andere |
| Standort / Stadt | Text | ⚪ Erweitert | |
| Land | Dropdown | ⚪ Erweitert | |
| Website | URL | ⚪ Erweitert | |
| Twitter / X | URL | ⚪ Erweitert | |
| ICP Score | Int 0–100 | 🟡 Standard | Optional, kein Gate |
| Tags | Multi-Text | 🟡 Standard | Frei definierbar |
| Notizen | Textarea | 🟡 Standard | Freitext |
| Lead Source | Dropdown | 🔒 System | sherloq / csv / crm / manual / webhook |
| Contact Status | Dropdown | 🔒 System | ohne_campaign / in_campaign / pipeline / kunde / archiviert / opt_out |
| Lead Status | Dropdown | 🟡 Standard | lead / qualified_lead / mql / sql / customer / churned — Qualifizierungs-Stufe, separat von Contact Status |
| Heat Status | Dropdown | 🔒 System | heiss / warm / lauwarm / kalt / tot |
| Letzter Kontakt | Datum | 🔒 System | Automatisch aus letzter Nachricht |
| Letzte Antwort | Datum | 🔒 System | Automatisch |
| Erstellt am | Datum | 🔒 System | |
| Enrichment-Quelle | Text | 🔒 System | sherloq / surfe / manuell |
| Sherloq Contact ID | Text | 🔒 System | Für Bidirektionalität |
| CRM ID (extern) | Text | 🔒 System | HubSpot / Salesforce ID |
| Opt-out Datum | Datum | 🔒 System | |
| Opt-out Grund | Text | 🔒 System | |

**Für AI SDR spezifisch (im Sequenz-Kontext sichtbar):**

| Feld | Typ | Kategorie | Hinweis |
|---|---|---|---|
| Aktive Campaign | Relation | 🔒 System | Welche Campaign |
| Sequence Schritt | Int | 🔒 System | Aktueller Step |
| Sequence Status | Dropdown | 🔒 System | active / paused / requires_human / completed |
| Open Count | Int | 🔒 System | Gesamt-Öffnungen |
| Click Count | Int | 🔒 System | Gesamt-Klicks |
| Intent Label | Text | 🔒 System | interested / objection / not_now / opt_out |
| Intent Confidence | Int | 🔒 System | 0–100% |

---

## COMPANIES — Alle Felder

| Feld | Typ | Kategorie | Hinweis |
|---|---|---|---|
| Name | Text | 🔴 Pflicht | Einziges Pflichtfeld |
| Domain | URL | 🟡 Standard | z.B. payguard.io |
| Branche / Industry | Dropdown | 🟡 Standard | SaaS / Fintech / E-Commerce / Healthcare / etc. |
| Unternehmensgröße | Dropdown | 🟡 Standard | 1–10 / 11–50 / 51–200 / 201–500 / 500+ |
| Mitarbeiterzahl (exakt) | Int | ⚪ Erweitert | |
| Land | Dropdown | 🟡 Standard | |
| Stadt / HQ | Text | 🟡 Standard | |
| LinkedIn URL | URL | 🟡 Standard | |
| Website | URL | 🟡 Standard | |
| Jahresumsatz | Währung | ⚪ Erweitert | |
| Finanzierungsrunde | Dropdown | ⚪ Erweitert | Bootstrap / Seed / Series A–D / PE / Public |
| Tech Stack | Multi-Text | ⚪ Erweitert | Welche Tools nutzen sie |
| Hauptprodukt / Angebot | Textarea | ⚪ Erweitert | |
| Zielmarkt | Text | ⚪ Erweitert | B2B / B2C / Enterprise |
| Wettbewerber | Multi-Relation | ⚪ Erweitert | Andere Companies im System |
| Tags | Multi-Text | 🟡 Standard | |
| Notizen | Textarea | 🟡 Standard | |
| CRM ID (extern) | Text | 🔒 System | HubSpot / Salesforce Account ID |
| Erstellt am | Datum | 🔒 System | |
| Anzahl Kontakte | Int | 🔒 System | Automatisch gezählt |
| Letzter Kontakt | Datum | 🔒 System | Aus verknüpften Kontakten |

**Für Farmer spezifisch (Bestandskunden):**

| Feld | Typ | Kategorie | Hinweis |
|---|---|---|---|
| Plan / Subscription | Text | 🟡 Standard | Growth / Pro / Enterprise |
| Subscription Status | Dropdown | 🔒 System | aktiv / pausiert / gekündigt |
| Aktiv seit | Datum | 🟡 Standard | |
| Nächste Zahlung | Datum | 🔒 System | |
| MRR / ARR | Währung | 🟡 Standard | |
| Churn Risk Score | Int | 🔒 System | 0–100, berechnet |
| Upsell Score | Int | 🔒 System | 0–100, berechnet |
| NPS Score | Int | ⚪ Erweitert | -100 bis +100 |
| Onboarding Status | Dropdown | 🔒 System | ausstehend / läuft / abgeschlossen |

**Sherloq Usage (nur wenn Modul aktiv):**

| Feld | Typ | Kategorie | Hinweis |
|---|---|---|---|
| Last Login | Datum | 🔒 System | Aus Sherloq Webhook |
| Last Usage | Datum | 🔒 System | |
| Profiles Added | Int | 🔒 System | |
| Messages Generiert | Int | 🔒 System | |
| Enrichments genutzt | Text | 🔒 System | z.B. 8.500 / 10k |
| Posts Generiert | Int | 🔒 System | |

---

## REGELN FÜR CLAUDE CODE

1. Alle Felder die 🔒 System sind: `readonly = true` in der UI, grauer Hintergrund, kein Edit-Icon
2. Alle Felder die 🟡 Standard oder ⚪ Erweitert sind: inline editierbar per Klick
3. Pflichtfeld leer: amber Unterstreichung + Tooltip "Pflichtfeld"
4. Leere optionale Felder: zeigen "—" in Grau, bei Hover erscheint Edit-Icon
5. Sherloq-Felder: nur anzeigen wenn `settings.modules.sherloq_signals = true`
6. Farmer-Felder: nur anzeigen wenn `contact.contact_status = 'kunde'`

---

*Sales OS · Felddefinition v1 · Juni 2026*
*Grundlage für: DB Schema, UI-Dokumentation, AI Studio Prompts, CLAUDE.md*

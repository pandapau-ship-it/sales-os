# Session-Übergabe 2026-07-18 — Kontakte & Companies (core_crm) Kern-Arc K-1…K-6 fertig

> Spanne: seit Übergabe `2026-06-30` (Farmer-Modul). In dieser langen Spanne wurde das **Kontakte-&-Companies-
> Modul (core_crm)** von Grund auf gebaut: Kontakte-Screen, Companies-Screen + Detailseite, geteilte Tabelle,
> Listen, Löschen, Smart-Import-Engine + Import-Bildschirm, Duplikat-Erkennung + Merge + „Duplikate verwalten".
> Alles auf `main`, Gates durchgängig grün. Detail-Einträge stehen im Body von `PROGRESS.md`.
>
> ⚠ **Diese Übergabe holt eine überfällige Doku-Pflicht nach** — die letzte Datei war `2026-06-30`, obwohl
> zwischenzeitlich mehrere Screens/Features fertig wurden (fortschrittsgebundener Trigger war ausgesetzt).

---

## Was fertig wurde (Kern-Arc K-1…K-6, alles in `main`)

### Datenschicht & geteilte Tabelle (K-1b, K-3)
- `getContacts`/`getCompanies` + Embeds + Mapper (`contactToKontakteRow`, `companyRowToView`), TanStack Query.
- **Geteilte `DataTable`** (generisch, virtualisiert): Sortier-/Filter-/Spalten-Config, Pagination, Zeilen-Klick öffnet Detail. Von Kontakte + Companies genutzt.
- Erweiterte Kontakte-Spalten, i18n-Labels statt Roh-DB-Werte (leadStatus/emailVerify).

### Kontakte-Screen (K-2, K-2b)
- Vollständige Liste, Status-Pills (contact_status), Lagebild „Ohne Kontaktweg"/„Opt-outs", Filter Quelle/ICP, Suche (Name/Jobtitel/Telefon).
- Info-Panel/Vollansicht Details-Tab (Single Source `contactDetailFields`, editierbar, Telefon via `DetailPhoneList`).

### Listen (K-3b)
- `lists`/`list_members` Funktionen, Listen-Dropdown + Erstellen, „Zu Liste"-Picker (statisch). i18n `kontakte.lists.*`.

### Companies (K-4a, K-4b, P5–P7)
- Companies-Listenansicht auf geteilter Tabelle, „+ Company anlegen", 3 Filter-Dropdowns, Lagebild „Ohne Kontakt".
- **Companies-Detailseite** (volle Seite, Card-Hero): Übersicht (Details inline) + Tabs Kontakte/Deals/Aktivität/Notizen echt.

### Löschen (Soft-Delete)
- **Migration 058**: `deleted_at`/`deleted_by` + Indizes + audit-write-Trigger auf `contacts`/`companies`.
- `softDelete*`-Funktionen + `deleted_at`-Filter überall; UI Einzel (Panel/Detail) + Bulk, `alert-dialog`-Bestätigung.

### Smart-Import-Engine + Import-Bildschirm (K-5)
- **Migration 059**: `import_batch_id` (nullable, FK on delete set null, partieller Index) + `import_batches`.
- Engine (rein, testbar): `parse` (CSV/xlsx, Encoding/Delimiter-Detection) · `mapping` (Synonym-Auflösung, ungemappte Spalten ignoriert) · `validate`/`summarize` · `execute` (`buildImportPlan`: valid→anlegen, Duplikat/Fehler→skip).
- Vollbild-Wizard `/app/kontakte/import` (4 Schritte, ohne Sidebar): Upload→Mapping→Prüfen→Import/Report, echter `onProgress`, `undoImport` (7-Tage-Frist).
- xlsx **dynamisch** geladen (nicht im Haupt-Bundle). `runImport` ruft zentrale `createContact` (Single Source).

### Duplikate: Merge-Backend + Fuzzy + „Duplikate verwalten"-UI (K-6a / K-6-fuzzy / K-6b)
- **`lib/merge.ts`** (rein, 17 Tests): `resolveMergeFields` (Auto-Default + Pro-Feld-Override), `pickPrimaryId`, `diffFields`, `findDuplicatePairs`/`findCompanyDuplicatePairs` (sicher: E-Mail/LinkedIn/Domain exakt · möglich: Name+Firma / Firmenname unscharf via `classifyDuplicate`).
- **`db.ts`**: `getDuplicatePairs`/`getCompanyDuplicatePairs` · **`mergeContacts`/`mergeCompanies`** — Feld-Merge + **vollständige FK-Kaskade** (communications/contact_phones/deals/leads/list_members/messages/notes/signals/tasks → Gewinner) + Verlierer Soft-Delete (audit via 058-Trigger).
- **`ScreenDuplicates`** (Vollbild `/app/kontakte/duplicates`): Tabs Kontakte|Companies, Paar-Karten, Merge-Dialog Feld-für-Feld A/B + `alert-dialog`-Bestätigung, 3. Aktion „Datensatz löschen" im ⋯-Menü → `softDelete*`. Einstieg im Aktionen-Dropdown (Kontakte + Companies). Registry `screen_duplicates`. Render-Test.

### Import Live-QA (Runden 2 + 3) — Diagnosen + Fixes
- **Diagnose (kein Bug):** „Duplikate nach Import nicht gefunden" = erwartet (Dupes werden übersprungen; DB real 0 Dupes verifiziert) · ungemappte Spalten werden ignoriert, Kontakt trotzdem importiert.
- **Bugfix weiße Seite** „Ohne Kontaktweg": `linkedin_url` fehlte in der Filter-Registry (`lib/filter/schema.ts`) → `validateFilter` warf im Render. Fix + Regressionstest. Alle Pills systematisch geprüft.
- **Undo-Vorschau**: `alert-dialog` mit Anzahl vor dem Löschen.
- **Honesty-Fix Undo-Ergebnis**: nach Undo transformiert sich der Ergebnis-Block in-place (Headline/Subtext/Icon/Stat „durchgestrichen + 0"/Button) — keine falsche „1 NEU ERSTELLT"-Stat. Report als `ImportResultReport` extrahiert + Render-Test.

### Frühere Bugfixes in der Spanne (in `main`)
- HunterSidepanel Details-Tab (Person- **und** System-Sektion): hardcodierte Fake-Literale („Christian Brand"/„Manuell"/„HS-48213" …) → aus echten `contacts`-Spalten geseedet (`seedContactDetails`/`sys`). DB als korrekt bewiesen, reiner UI-Fehler. Render-Test beweist den Fix.
- Import schrieb `lead_source='csv'` → kanonisch `'csv_upload'` (+ 5 DB-Zeilen korrigiert). Lead-Quelle zeigt Import-Dateiname.

---

## Migrationen (Remote-Stand)
- **056** K1b-Daten-Fundament · **057** user_preferences · **058** Soft-Delete contacts/companies · **059** import_batch_id · **060** contacts.city/country — **alle applied/gepusht**.
- **060 (18.07.2026, [D-contact-city]):** `contacts.city` + `contacts.country` (nullable text, rein additiv) — Remote verifiziert. Code war bereits verdrahtet; nur die Spalten fehlten.
- **KB: letzte Migration 053** (30.06). **Entscheidung Oliver (18.07.): Seed-only belassen** — KB-DB-Migration wird erst mit dem AI-Chat/RAG-Slice gebündelt (nicht vorher). Seed `docs/knowledge_base.md` ist vollständig.

## Modul-Abschluss-Gate core_crm (18.07.2026): BESTANDEN ✅
Kern-Arc K-1…K-6 gegen die vier Prinzipien geprüft (Details in `CHECKLIST.md` → Gate-Läufe):
- **(1) Single Source ✅** · **(2) Performance ✅** (audit N+1 PASS; Scale-Deferred: client-seitige Paar-Findung) · **(3) Konfigurierbarkeit ✅ für auditierte Werte** (Stages/`campaign_match_min_score` = C; System-Enums dokumentiert; **Deferred:** Undo-Fenster 7T + Dedup-Schwellen 0.82/0.85 → später `settings`) · **(4) Honesty ✅** (Fake-Inventur, echte EmptyStates, ehrliche Undo-Transformation).
- **Deferreds (kein Kern-Blocker):** merge_candidates-Persistenz · onBlur-Dedup · K-FS1 (Hunter-Modul) · Import-Vorlagen · [D-company-import].

---

## Was offen ist (Folge-Slices, tracked)
- **K-FS1** — Hunter-Dedup-Umbau (LeadListRow/HunterCard controlled-expand, `CompactContactRow`-Basis) — gebündelter Folge-Slice.
- **merge_candidates-Persistenz** — „Kein Duplikat" ist aktuell nur lokales Dismiss (braucht Migration + push).
- **onBlur-Hard/Soft-Match** beim manuellen Anlegen + CSV-Import-Review-Dedup-Spalte (CHECKLIST 298).
- **Import-Folge:** Vorlagen-Erkennung (`import_templates`/`headerSignature`) · **[D-company-import]** Company-only-Import.
- **Import v2 (NICHT vor Projekt-Ende):** KI-Spalten-Mapping · Live-Anreicherung · Mapping-Vorlagen · Undo mit Namensliste.

---

## Entscheidungen getroffen (18.07.2026, Zwischenstand-Check)
1. **[D-contact-city] → umgesetzt** — Migration 060 (city/country) angewendet + verifiziert.
2. **KB-DB-Migration → Seed-only belassen** — Bündelung erst mit AI-Chat/RAG-Slice.
3. **Modul-Abschluss-Gate core_crm → jetzt durchlaufen** — BESTANDEN (siehe oben), Deferreds dokumentiert.

---

## Nächster Schritt (▶)
**PROGRESS ▶ steht jetzt auf Punkt 2: [BAU] Vorab-Migration Entitlement & Credits** (`docs/for_ai_sdr_vorab_entitlement_credits.md`, PFLICHT vor AI-SDR-Slice-5).

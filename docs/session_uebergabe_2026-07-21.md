# Session-Übergabe 2026-07-21 — „Mein Unternehmen" fertig (Unternehmensprofil 3a + 3b), echte Daten live

> Spanne: seit Übergabe `2026-07-20` (Settings-Fundament, Login-Pflicht, „Mein Unternehmen" 1/3 & 2/3).
> In dieser Spanne wurde die Gruppe **„Mein Unternehmen"** mit dem **Unternehmensprofil-Screen** abgeschlossen
> (Slice 3a Überblick & Angebote + Slice 3b ICP & Personas), plus eine finale Layout-Korrektur und drei
> Konsistenz-Fixes an Geschwister-Seiten. Alles auf `main`, Gates durchgängig grün (test-runner + auditor
> PASS über alle Teilschritte), alle Migrationen gepusht und remote per self-abortierendem DO-Block verifiziert.
> Detail-Einträge stehen im Body von `PROGRESS.md`.

**`main`-HEAD nach dieser Übergabe: der `--no-ff`-Merge „Mein Unternehmen 3b"** (Vorgänger: `8dde14d` = 3a-Merge).

---

## Was fertig wurde (alles in `main`)

### Mein Unternehmen 3a/3 — Unternehmensprofil: Überblick & Angebote (Migr. 080, Merge `8dde14d`)
`org_profile` rein additiv erweitert (summary/product_service_model/value_outcome + Listen problems_solved/
business_outcomes/offerings; competitors neu `[{id,name,why_us,kind}]`). EIN Schreibweg `update_org_profile`
(Whitelist + field_meta-lock + audit_log). UI `CompanyProfilePage`: 2 Reiter (Überblick/Angebot & Markt),
AI Context Builder (dunkle `--ai-panel-*`-Ausnahme, „Folgt"), Vollständigkeits-Ring. **Neuer Baustein
`KnowledgeListField`** (wachsende jsonb-Listen); Leerzustand-Fix (Einzelfeld-Listen zeigen leer eine direkt
beschreibbare Zeile). Token-Rename `--voice-trainer-*` → `--ai-panel-*` (shared).

### Mein Unternehmen 3b/3 — Unternehmensprofil: ICP & Personas (Migr. 081/082, 3b-Merge)
**Damit ist der volle Unternehmensprofil-Screen (3 Reiter) fertig.** Zielgruppen + Personen als eigenständige,
verschachtelte Datensätze (1:N) nach dem **products-Muster** — bewusst NICHT als jsonb-Liste.
- **DB (081):** `org_icps` + `org_personas` (FK icp_id CASCADE), RLS tenant_isolation, Index org(+icp_id),
  audit-/updated_at-Trigger. `fit_level`/`buying_role` = **feste System-Enums** via CHECK (nullable, kein
  [D51]-Config; CLAUDE.md-Vermerk). Nur benannte Spalten (kein `attributes`); Text-Listen jsonb `[{id,text}]`.
  `org_personas.job_titles` speist `match_persona` (AI SDR).
- **RPCs (082):** create/update/delete_icp + create_persona(icp_id)/update/delete_persona — je settings.manage ·
  Cross-Org-Guard · Key-Whitelist · Listen-Item-id-Pflicht · field_meta-lock · audit_log · weiches Löschen.
  Enum-Werte NICHT dupliziert (CHECK = Quelle), `'' → null`.
- **UI:** 3. Reiter; **neuer Baustein `EntityCardList`** (verallgemeinertes Produkte-Karten-Muster, Single
  Source, einmal gebaut/zweimal genutzt — ICPs primary + verschachtelt Personas nested, eigener openId-Scope);
  `getIcpsWithPersonas` (EIN Embed-Query, kein N+1).
- **Layout-Korrektur:** Zwei-Spalten (mobil einspaltig) · dezente graue Lucide-Icons je Sektions-Label ·
  Abstands-Rhythmus · kompaktere Listen · **Passungs-/Kaufrollen-Badge** im Karten-Kopf (StatusBadge, live
  über dasselbe Select, null→kein Badge).
- **3 Konsistenz-Fixes** (gemeldete Geschwister-Stellen mitgezogen): ProductPricingPage Nutzen|Zielgruppe
  zweispaltig + **Preismodell-Badge** (StatusBadge info); PersonalVoicePage Do's|Don'ts nebeneinander.

### Echte Daten live eingetragen (über die validierten Schreibwege, nicht Roh-SQL)
- **Sherloq Company Profile** (Überblick + Angebot & Markt) + **4 ICPs mit je 1 Persona** — über
  `update_org_profile`/`create_icp`/`update_icp`/`create_persona`/`update_persona`, committend, verifiziert.
- **Personal Voice für Oliver** (User `8f6cfd32`, Org `…001`) über `update_voice_profile` — Overview + Post +
  Comment + DM befüllt, Email/comment-dos_donts bewusst leer (Honesty). field_meta-Lock + audit_log geprüft.

---

## Architektur/Regeln, die dabei entstanden sind
- **`EntityCardList`** als kanonisches Muster für „eigenständige, verschachtelte Datensätze mit Lebenszyklus"
  (Abgrenzung zu `KnowledgeListField` = Text-Schnipsel in einer jsonb-Zeile).
- **SYSTEM-INVARIANTE** `fit_level`/`buying_role` (CHECK-Enums, kein Org-Config) — in CLAUDE.md bei den
  Won/Lost-/`contact_status`-Invarianten dokumentiert.
- **Memory-Regel (neu):** keine eigenständige Browser-Verifikation mehr (claude-in-chrome/Preview) außer auf
  explizite Bitte — Oliver testet UI live in seiner echten Session; test-runner + auditor bleiben Pflicht.

---

## Offen / als Nächstes
- **[Mini]** AE-Kaufrolle (ICP „Enterprise Sales Teams") steht auf `influencer` (Annahme) — auf Wunsch per
  `update_persona` auf `end_user` änderbar.
- **Umsetzungs-Kandidaten** (waren nur gemeldet, jetzt bereits erledigt): —.
- **[KB-DEFERRED]** knowledge_base bleibt Seed in `docs/knowledge_base.md`; DB-Migration gebündelt mit dem
  AI-Chat/RAG-Slice (Oliver-Entscheidung 18.07.).
- Nächste Baustelle laut ▶ NÄCHSTER SCHRITT in `PROGRESS.md`.

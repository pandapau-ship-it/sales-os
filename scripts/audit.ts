/**
 * audit.ts — Selbst-Prüf-Script (CLAUDE.md → "Selbst-Wartung").
 *
 * Prüft die fünf Pflicht-Prüffragen vor jedem Commit:
 *   1. Hat jede neue Tabelle organization_id, RLS und CASCADE?
 *   2. Ist CHECKLIST.md aktuell (existiert, kürzlich geändert)?
 *   3. Ist PROGRESS.md aktualisiert?
 *   4. Sind neue Komponenten in componentRegistry.ts?
 *   5. Laufen alle AI Calls durch aiCall() in lib/ai.ts?
 *
 * Zusätzlich (Abstraktions-Regeln): kein direkter Notification-/Email-Versand
 * außerhalb von lib/notify.ts bzw. lib/email.ts.
 *
 * Läuft ohne Dependencies (nur Node built-ins). Node 24 führt .ts nativ aus:
 *   node scripts/audit.ts      oder      npm run audit
 *
 * Exit-Code: 0 wenn keine harten Verstöße, 1 bei FAIL.
 * Noch-nicht-existierende Bereiche (DB, lib/ai.ts …) → WARN, nicht FAIL.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

type Status = 'PASS' | 'WARN' | 'FAIL' | 'SKIP'
type Result = { check: string; status: Status; detail: string }

const results: Result[] = []
const add = (check: string, status: Status, detail: string) =>
  results.push({ check, status, detail })

// ── Helpers ────────────────────────────────────────────────────────────────

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
      out.push(...walk(full, exts))
    } else if (exts.includes(extname(entry.name))) {
      out.push(full)
    }
  }
  return out
}

const read = (p: string): string => readFileSync(p, 'utf8')
const rel = (p: string): string => relative(ROOT, p)

function daysSince(p: string): number {
  return (Date.now() - statSync(p).mtimeMs) / (1000 * 60 * 60 * 24)
}

// ── Frage 1: DB-Tabellen — organization_id, RLS, CASCADE ─────────────────────

function checkDatabase(): void {
  const migrationsDir = join(ROOT, 'supabase', 'migrations')
  const sqlFiles = walk(migrationsDir, ['.sql'])

  if (sqlFiles.length === 0) {
    add('DB: Tabellen-Isolation', 'SKIP', 'Noch keine supabase/migrations/*.sql — Phase 5 nicht gestartet.')
    return
  }

  const sql = sqlFiles.map(read).join('\n').toLowerCase()
  // Tabellennamen aus CREATE TABLE ziehen
  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?/g
  const tables = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = tableRe.exec(sql))) tables.add(m[1])

  if (tables.size === 0) {
    add('DB: Tabellen-Isolation', 'WARN', 'SQL gefunden, aber keine CREATE TABLE erkannt.')
    return
  }

  const missingOrg: string[] = []
  for (const t of tables) {
    if (t === 'organizations') continue // die Basis selbst
    const block = sql.slice(sql.indexOf(`table ${t}`) === -1 ? 0 : 0)
    if (!new RegExp(`${t}[\\s\\S]{0,2000}organization_id`).test(sql)) missingOrg.push(t)
  }
  const hasRls = /enable\s+row\s+level\s+security/.test(sql)
  const hasCascade = /on\s+delete\s+cascade/.test(sql)

  if (missingOrg.length) add('DB: organization_id', 'FAIL', `Fehlt in: ${missingOrg.join(', ')}`)
  else add('DB: organization_id', 'PASS', `${tables.size} Tabellen, alle mit organization_id.`)

  add('DB: RLS aktiviert', hasRls ? 'PASS' : 'FAIL', hasRls ? 'ENABLE ROW LEVEL SECURITY gefunden.' : 'Keine RLS-Aktivierung gefunden.')
  add('DB: ON DELETE CASCADE', hasCascade ? 'PASS' : 'WARN', hasCascade ? 'CASCADE gefunden.' : 'Kein ON DELETE CASCADE gefunden.')
}

// ── Frage 2 & 3: CHECKLIST.md / PROGRESS.md aktuell ──────────────────────────

function checkDocFreshness(name: string): void {
  const p = join(ROOT, name)
  if (!existsSync(p)) {
    add(`${name} vorhanden`, 'FAIL', 'Datei fehlt.')
    return
  }
  const age = daysSince(p)
  add(`${name} aktuell`, age <= 3 ? 'PASS' : 'WARN', `Zuletzt geändert vor ${age.toFixed(1)} Tagen.`)
}

// ── Frage 4: Komponenten in componentRegistry.ts ─────────────────────────────

function checkComponentRegistry(): void {
  const registryPath = join(SRC, 'lib', 'componentRegistry.ts')
  const screensDir = join(SRC, 'components', 'screens')

  if (!existsSync(registryPath)) {
    add('Component Registry', 'WARN', 'src/lib/componentRegistry.ts existiert noch nicht (in CHECKLIST.md offen).')
    return
  }
  const registry = read(registryPath)
  // Generische Hilfskomponenten haben keinen Render-Key → gehören nicht in die Registry.
  const helpers = ['ScreenPlaceholder']
  const screens = walk(screensDir, ['.tsx'])
    .map((p) => basename(p, '.tsx'))
    .filter((s) => !helpers.includes(s))
  const missing = screens.filter((s) => !registry.includes(s))

  if (missing.length) add('Component Registry', 'WARN', `Nicht registriert: ${missing.join(', ')}`)
  else add('Component Registry', 'PASS', `${screens.length} Screens registriert.`)
}

// ── Frage 5: AI Calls nur über lib/ai.ts ─────────────────────────────────────

function checkAiAbstraction(): void {
  const files = walk(SRC, ['.ts', '.tsx'])
  const allowed = join('lib', 'ai.ts')
  const offenders: string[] = []

  for (const f of files) {
    if (rel(f).endsWith(allowed)) continue
    if (/from\s+['"]@anthropic-ai\/sdk['"]|require\(['"]@anthropic-ai\/sdk['"]\)/.test(read(f))) {
      offenders.push(rel(f))
    }
  }
  if (!existsSync(join(SRC, 'lib', 'ai.ts'))) {
    // aiCall() noch nicht gebaut → direkter SDK-Import ist "noch zu migrieren", kein harter Verstoß.
    add('AI Calls → aiCall()', 'WARN',
      offenders.length
        ? `lib/ai.ts fehlt noch — bei Bau migrieren: ${offenders.join(', ')}`
        : 'lib/ai.ts existiert noch nicht (in CHECKLIST.md offen).')
    return
  }
  add('AI Calls → aiCall()', offenders.length ? 'FAIL' : 'PASS',
    offenders.length ? `Anthropic SDK direkt (nicht über aiCall): ${offenders.join(', ')}` : 'Kein direkter SDK-Import außerhalb lib/ai.ts.')
}

// ── Bonus: notify() / sendEmail() Abstraktion ────────────────────────────────

function checkAbstraction(libFile: string, label: string, patterns: RegExp): void {
  const files = walk(SRC, ['.ts', '.tsx'])
  const allowed = join('lib', libFile)
  if (!existsSync(join(SRC, 'lib', libFile))) {
    add(label, 'SKIP', `lib/${libFile} existiert noch nicht.`)
    return
  }
  const offenders = files.filter((f) => !rel(f).endsWith(allowed) && patterns.test(read(f))).map(rel)
  add(label, offenders.length ? 'FAIL' : 'PASS',
    offenders.length ? `Direkter Provider-Aufruf in: ${offenders.join(', ')}` : 'Sauber abstrahiert.')
}

// ── Service-Abstraktion: @supabase nur in lib/ (Init nur in db.ts) ───────────

function checkSupabaseAbstraction(): void {
  const files = walk(SRC, ['.ts', '.tsx'])
  const dbPath = join('lib', 'db.ts')

  // Regel 1: @supabase/supabase-js Import nur innerhalb src/lib/
  const importOffenders = files.filter((f) => {
    const r = rel(f)
    const inLib = r.includes(`${join('src', 'lib')}`) || r.includes('/lib/')
    return !inLib && /from\s+['"]@supabase\/supabase-js['"]/.test(read(f))
  }).map(rel)

  // Regel 2: createClient( nur in lib/db.ts
  const initOffenders = files.filter((f) => !rel(f).endsWith(dbPath) && /\bcreateClient\s*\(/.test(read(f))).map(rel)

  const offenders = [...new Set([...importOffenders, ...initOffenders])]
  add('Service-Abstraktion (lib/)', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `@supabase/createClient außerhalb lib/: ${offenders.join(', ')}`
      : 'Supabase nur in lib/ · Init nur in db.ts.')
}

// ── Bonus: keine Emoji-Badges (Design Invariant) ─────────────────────────────

function checkNoEmojiBadges(): void {
  const files = walk(SRC, ['.tsx'])
  // Echte Piktogramm-Emoji (1F000–1FAFF), FE0F-Emoji-Sequenzen, und bekannte
  // Emoji-Symbole. Monochrome Text-Glyphen (✓ ✔ ✦ → Pfeile) sind ERLAUBT.
  const emoji = /[\u{1F000}-\u{1FAFF}]|\u{FE0F}|[\u{2728}\u{2705}\u{274C}\u{2B50}\u{26A0}]/u
  const offenders = files.filter((f) => emoji.test(read(f))).map(rel)
  add('Design: keine Emoji in UI', offenders.length ? 'WARN' : 'PASS',
    offenders.length ? `Emoji gefunden in: ${offenders.join(', ')}` : 'Keine Status-Emoji in .tsx.')
}

// ── Design: nur Token-Farben (Dark Mode) ────────────────────────────────────
// Hardcodierte Farben brechen Dark Mode (sie sind kein Hex, rutschen sonst durch).
// Verboten in .tsx: bg/text/border-white, -black, -gray-N · direkte Hex-Werte.
// Erlaubt: Token-Klassen (bg-app-surface, text-text-primary, bg-on-accent, bg-scrim …).
// Token-Definitionen (Hex) leben in src/index.css (.css) — wird NICHT gescannt.

function checkHardcodedColors(): void {
  const files = walk(SRC, ['.tsx'])
  const named = /\b(?:bg|text|border)-(?:white|black|gray-\d{1,3})\b/g
  const hex = /#[0-9a-fA-F]{3,8}\b/g
  const offenders: string[] = []
  for (const f of files) {
    const src = read(f)
    const hits = new Set<string>()
    for (const m of src.matchAll(named)) hits.add(m[0])
    for (const m of src.matchAll(hex)) hits.add(m[0])
    if (hits.size) {
      const list = [...hits].slice(0, 4).join(', ') + (hits.size > 4 ? ' …' : '')
      offenders.push(`${rel(f)} (${list})`)
    }
  }
  add('Design: nur Token-Farben', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `Hardcodierte Farben (bg/text/border-white/black/gray-* oder Hex) — auf CSS-Tokens umstellen:\n        ${offenders.join('\n        ')}`
      : 'Keine hardcodierten Farb-Klassen/Hex in .tsx — Dark-Mode-sicher.')
}

// ── Design: keine hardcodierten Heat-Labels (use <HeatBadge>) ───────────────
// Alte Heat-Labels gehören nicht hardcodiert in .tsx — Heat läuft über
// <HeatBadge status={...} /> (Quelle: HEAT_STATUS in lib/constants.ts).
// "Aktiv" ist bewusst NICHT in der Liste: es ist auch ein legitimes Nicht-Heat-
// Wort (Abo-/Task-/Sequence-Status „Aktiv" · „Aktiv seit"), CLAUDE.md schreibt
// Subscription-Status „Aktiv" sogar vor. Ein Pauschalverbot bräche legitimen Code.

function checkForbiddenHeatLabels(): void {
  const files = walk(SRC, ['.tsx'])
  const forbidden = /\b(Kalt|Stabil|Rückläufig|Ruhend|Hot|Lukewarm|Dead)\b/g
  const offenders: string[] = []
  for (const f of files) {
    const hits = new Set<string>()
    for (const m of read(f).matchAll(forbidden)) hits.add(m[1])
    if (hits.size) offenders.push(`${rel(f)} (${[...hits].join(', ')})`)
  }
  add('Design: keine alten Heat-Labels', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `Hardcodierte alte Heat-Labels — durch <HeatBadge status={...} /> ersetzen:\n        ${offenders.join('\n        ')}`
      : 'Keine alten Heat-Labels in .tsx — Heat läuft über <HeatBadge>.')
}

// ── Design: Eingaben in Popovern müssen fokussierbar bleiben ────────────────
// Ein Popover mit <input>/<textarea> INNERHALB eines modalen Sheets/Dialogs verliert
// den Fokus (Radix-Fokusfalle zieht ihn zurück), wenn der Inhalt per Portal gerendert
// wird → man kann nicht tippen. Fix: <PopoverContent portal={false}> (Inhalt bleibt im
// Fokus-Scope). Dieser Check erzwingt das für JEDEN Popover, der eine Eingabe umschließt.

function checkPopoverInputFocus(): void {
  const files = walk(SRC, ['.tsx'])
  const block = /<PopoverContent[\s\S]*?<\/PopoverContent>/g
  const offenders: string[] = []
  for (const f of files) {
    for (const m of read(f).matchAll(block)) {
      if (/<input|<textarea/.test(m[0]) && !/portal=\{false\}/.test(m[0])) {
        offenders.push(rel(f)); break
      }
    }
  }
  add('Design: Popover-Eingabe fokussierbar', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `Popover mit <input>/<textarea> ohne portal={false} (Fokusfalle im modalen Sheet → kein Tippen):\n        ${offenders.join('\n        ')}`
      : 'Alle Popover mit Eingabe nutzen portal={false} — Tippen funktioniert.')
}

// ── Inline-Code-Hinweis ──────────────────────────────────────────────────────
// Sucht in features/ + components/screens/ nach großen (>20 Zeilen) Inline-JSX-Blöcken,
// die einen bestehenden panel-block duplizieren (gleiche markante className-Signatur) UND
// in mehr als einer Datei vorkommen. Nur WARN — der Entwickler entscheidet über Extraktion.

function checkInlineBlocks(): void {
  // 1. Signaturen: markante statische className-Literale je panel-block. „Markant" =
  //    >=30 Zeichen UND enthält einen arbiträren Token (`[…]` oder `var(--`) — so wie echte
  //    Block-Container (rounded-[12px], shadow-[var(--shadow-card)]). Reine Utility-Strings
  //    (flex items-center justify-between …) sind kein Block und werden ignoriert (kein False-Positive).
  const distinctive = (cls: string) => cls.length >= 30 && /\[|var\(--/.test(cls)
  const sig = new Map<string, string>() // className → panel-block-Name
  for (const f of walk(join(SRC, 'components/panel-blocks'), ['.tsx'])) {
    const name = basename(f, '.tsx')
    for (const m of read(f).matchAll(/className=(?:"([^"]+)"|`([^`{}]+)`)/g)) {
      const cls = (m[1] ?? m[2]).trim()
      if (distinctive(cls) && !sig.has(cls)) sig.set(cls, name)
    }
  }

  // 2. Consumer (features/ + screens/) auf große Inline-JSX-Blöcke scannen.
  const dirs = [join(SRC, 'components/features'), join(SRC, 'components/screens')]
  const isJsx = (l: string) => /<[A-Za-z/]|className=|\/>|>\s*$/.test(l)
  const hits = new Map<string, { files: Set<string>; locs: string[] }>()

  for (const f of dirs.flatMap((d) => walk(d, ['.tsx']))) {
    const lines = read(f).split('\n')
    let start = -1
    const flush = (end: number) => {
      if (start >= 0 && end - start > 20) {
        const text = lines.slice(start, end).join('\n')
        for (const [cls, pb] of sig) {
          if (text.includes(cls)) {
            if (!hits.has(pb)) hits.set(pb, { files: new Set(), locs: [] })
            const h = hits.get(pb)!
            if (!h.files.has(rel(f))) { h.files.add(rel(f)); h.locs.push(`${rel(f)}:${start + 1}`) }
          }
        }
      }
      start = -1
    }
    lines.forEach((l, i) => {
      if (isJsx(l)) { if (start < 0) start = i }
      else if (l.trim() !== '') flush(i) // Leerzeilen zählen zum Block, Code-Zeilen brechen ihn
    })
    flush(lines.length)
  }

  // 3. WARN nur, wenn derselbe panel-block in MEHR ALS EINER Datei inline auftaucht.
  const warns: string[] = []
  for (const [pb, h] of hits) {
    if (h.files.size > 1) warns.push(`${pb} → ${h.locs.join(', ')}`)
  }
  add('Inline-Code → panel-block', warns.length ? 'WARN' : 'PASS',
    warns.length
      ? `Große Inline-JSX-Blöcke (>20 Z.), die bestehende panel-blocks duplizieren (in >1 Datei) — Extraktion erwägen:\n        ${warns.join('\n        ')}`
      : 'Keine Inline-Duplikate bestehender panel-blocks (>20 Z.) in features/ + screens/.')
}

// ── Single Source of Truth: gemeinsame Kontaktwerte nur über contactToProfile ──
// Gemeinsame, in mehreren Karten/Tabs angezeigte Werte (Name/Jobtitel/Firma/ICP/
// Heat/Status) kommen ausschließlich über contactToProfile(); Stage über
// contactActiveStage(). Roh-Feld-Zugriff (.heat_status/.icp_score/.company.name/
// .first_name/.last_name/.job_title) ist NUR erlaubt: (a) in den Resolvern (Marker
// /* single-source:allow-start … end */), (b) in db.ts-Queries, (c) in einem
// Edit-Feld (Zeile mit `// single-source-ok: <grund>`). „Gleiche Ausgabe = gleiche Quelle."

function checkSingleSourceContactValues(): void {
  // Scope: components/** + lib/hunterMappers.ts. Ausgenommen: db.ts, types/, theme.ts.
  const mappers = join(SRC, 'lib', 'hunterMappers.ts')
  const files = [...walk(join(SRC, 'components'), ['.ts', '.tsx']), mappers].filter(existsSync)

  const FAIL_PAT = /\.heat_status\b/                       // sicher: Heat nie roh im Anzeige-Layer
  const WARN_PATS = [
    /\.icp_score\b/,
    /\.company\s*\??\.\s*name\b/,
    /\.(first_name|last_name|job_title)\b/,
  ]

  const failHits: string[] = []
  const warnHits: string[] = []

  for (const f of files) {
    const raw = read(f)
    const rawLines = raw.split('\n')
    // 1) Erlaubte Resolver-Regionen aus dem ROH-Text bestimmen (vor Kommentar-Strip).
    const allowed: boolean[] = new Array(rawLines.length).fill(false)
    let inAllow = false
    rawLines.forEach((l, i) => {
      if (l.includes('single-source:allow-start')) inAllow = true
      if (inAllow) allowed[i] = true
      if (l.includes('single-source:allow-end')) inAllow = false
    })
    // 2) Kommentare neutralisieren (Block + Zeile), Zeilennummern bleiben erhalten.
    const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    const lines = noBlock.split('\n').map((l) => l.replace(/\/\/.*$/, ''))
    // 3) Matchen — Resolver-Regionen + `single-source-ok`-Zeilen überspringen.
    lines.forEach((l, i) => {
      if (allowed[i]) return
      if (rawLines[i].includes('single-source-ok')) return
      const loc = `${rel(f)}:${i + 1}`
      if (FAIL_PAT.test(l)) failHits.push(loc)
      else if (WARN_PATS.some((p) => p.test(l))) warnHits.push(loc)
    })
  }

  if (failHits.length) {
    add('Single-Source: Kontaktwerte', 'FAIL',
      `Roh-Zugriff auf .heat_status statt contactToProfile („gleiche Ausgabe = gleiche Quelle“):\n        ${failHits.join('\n        ')}`)
  } else if (warnHits.length) {
    add('Single-Source: Kontaktwerte', 'WARN',
      `Roh-Zugriff auf icp_score/company.name/first_name/last_name/job_title — über contactToProfile lösen (legit nur in Edit-Feldern, dann Zeile mit // single-source-ok: <grund>):\n        ${warnHits.join('\n        ')}`)
  } else {
    add('Single-Source: Kontaktwerte', 'PASS',
      'Gemeinsame Kontaktwerte laufen über contactToProfile/contactActiveStage.')
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

checkDatabase()
checkDocFreshness('CHECKLIST.md')
checkDocFreshness('PROGRESS.md')
checkComponentRegistry()
checkAiAbstraction()
checkAbstraction('notify.ts', 'Notifications → notify()', /from\s+['"](resend|postmark|@slack\/web-api)['"]/)
checkAbstraction('email.ts', 'Emails → sendEmail()', /from\s+['"](resend|postmark|nodemailer)['"]/)
checkSupabaseAbstraction()
checkNoEmojiBadges()
checkHardcodedColors()
checkForbiddenHeatLabels()
checkPopoverInputFocus()
checkInlineBlocks()
checkSingleSourceContactValues()

// ── Typo-Kanon: Schrift-Stufen UND Schrift-Art laufen über Primitive (typo-*) ──
// Analog zur Single-Source-Regel. In den Panel-Block-/Tab-Listen-Komponenten müssen
// Titel/Header/Labels/Werte über ein typo-*-Primitive (src/index.css) laufen.
// Distinctive Roh-Signaturen → FAIL, außer die className trägt ein typo-*-Primitive:
//   tracking-widest        → section-label (nur Section-Header nutzen dieses Tracking)
//   font-mono              → chevron-header / field-label (Mono NUR über diese Primitive)
//   text-[13–15px] + bold  → card-title / field-value (Buttons/Container via rounded-/py- ausgenommen)
// Schrift-ART (Marke = global auf <body> vererbt, kein Re-Deklarieren): rohes
//   font-serif · arbitrary font-[family-name:…]/font-['…'] · inline fontFamily/font-family
//   → FAIL (Buttons/Container ausgenommen, wie bei der Größen-Signatur). font-sans = Marke, ok.
// Neue Tab-Listen-/Übersichts-Block-Komponente → IN_SCOPE ergänzen.
function checkTypographyTokens(): void {
  const IN_SCOPE = new Set([
    'TasksListe', 'NotizenListe', 'DealsListe', 'KommunikationVerlauf', 'AktivitaetsVerlauf',
    'KommunikationPreview', 'KommunikationKompakt', 'OffeneTasks', 'DealSetup', 'DealKurzinfo', 'KiKurzakte',
    'AktiveSignale', 'ActiveSequenceChain', 'LeadListRow',
    // [D27] Typo-Kanon Welle 1 — Formulare/Panels (auch features/hunter)
    'TaskAnlegenForm', 'TaskFormular', 'TaskEntwurfForm', 'MailComposer',
    'AddSdrLeadPanel', 'ChatActionPanel', 'HunterSidepanel',
    // [D27] Typo-Kanon Welle 2 — Karten/Felder
    'LinkedinSignalCard', 'NewInPipelineCards', 'KpiCard', 'EditableInline',
    'DetailField', 'DetailPhoneList', 'FunnelAnalysis',
    // [D21] Scheibe 8
    'MfaBanner',
  ])
  // panel-blocks/ + features/hunter/ (dort liegen ChatActionPanel/AddSdrLeadPanel/HunterSidepanel).
  const files = [
    ...walk(join(SRC, 'components', 'panel-blocks'), ['.tsx']),
    ...walk(join(SRC, 'components', 'features'), ['.tsx']),
  ].filter((f) => IN_SCOPE.has(basename(f, '.tsx')))

  const TYPO = /\btypo-(section-label|chevron-header|card-title|field-value|field-label|subline|chip)\b/
  const hits: string[] = []

  for (const f of files) {
    const raw = read(f)
    // Kommentare neutralisieren (Block + Zeile), Zeilennummern bleiben erhalten.
    const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    const lines = noBlock.split('\n').map((l) => l.replace(/\/\/.*$/, ''))
    lines.forEach((l, i) => {
      const isButton = /\brounded-/.test(l) || /\bpy-/.test(l) // Buttons/Container: keine Text-Signatur
      // Schrift-ART: fremde/serife/inline Schrift ist NIE als Roh-Klasse erlaubt — auch nicht neben
      // einem typo-* (das Primitive setzt die Schrift selbst in CSS; die Marke wird global vererbt).
      const fontArt = (/\bfont-serif\b/.test(l)
        || /\bfont-\[(?:\s*family-name:|['"])/.test(l) // arbitrary font-family utility
        || /\bfont-family\s*:/.test(l)                 // inline style font-family
        || /\bfontFamily\s*:/.test(l)                  // inline JSX style fontFamily
      ) && !isButton
      if (fontArt) { hits.push(`${rel(f)}:${i + 1}`); return }
      // Größen-/Struktur-Signaturen: durch ein typo-*-Primitive erfüllt → ok.
      if (TYPO.test(l)) return
      const sectionLabel = /tracking-widest/.test(l)
      const monoHeader = /\bfont-mono\b/.test(l)        // rohes Mono ohne Primitive
      const titleSig = /text-\[1[345]px\]/.test(l) && /font-(bold|extrabold)\b/.test(l) && !isButton
      if (sectionLabel || monoHeader || titleSig) hits.push(`${rel(f)}:${i + 1}`)
    })
  }

  add('Typo-Kanon: Schrift-Stufen', hits.length ? 'FAIL' : 'PASS',
    hits.length
      ? `Rohe Schrift-Klassen/-Art an Titel/Header/Label/Wert statt typo-*-Primitive (src/index.css → „Typo-Kanon“):\n        ${hits.join('\n        ')}`
      : 'Titel/Header/Labels/Werte + Schrift-Art in Panel-Blocks laufen über typo-*-Primitive (Marke global vererbt).')
}
checkTypographyTokens()

// ── Profilzeile-Konsistenz: Kurz-Zeitformate + verbotene interne Labels ──────

/**
 * WARN: hardcodierte Kurz-Zeitformate („6d“/„24h“) in panel-blocks. Die Profilzeile MUSS
 * `daysSince(last_contacted_at)` → „vor X Tagen“ nutzen (Single Source). Kommentare und
 * Enum-Werte (`value="7d"` in SelectItem) sind ausgenommen — sie sind kein Anzeige-Text.
 */
function checkHardcodedTimeFormats(): void {
  const offenders: string[] = []
  for (const f of walk(join(SRC, 'components', 'panel-blocks'), ['.tsx'])) {
    const raw = read(f)
    const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    noBlock.split('\n').forEach((lineRaw, i) => {
      const line = lineRaw
        .replace(/\/\/.*$/, '')                       // Zeilenkommentar
        .replace(/\bvalue\s*=\s*["'][^"']*["']/g, '')  // Enum-/Select-Werte (kein Anzeige-Text)
      if (/\b\d+[dh]\b/.test(line)) offenders.push(`${rel(f)}:${i + 1}`)
    })
  }
  add('Profilzeile: kein Kurz-Zeitformat', offenders.length ? 'WARN' : 'PASS',
    offenders.length
      ? `Hardcodiertes Kurz-Zeitformat („Xd“/„Xh“) in Kacheln — Profilzeile muss daysSince(last_contacted_at) → „vor X Tagen“ nutzen:\n        ${offenders.join('\n        ')}`
      : 'Keine hardcodierten Kurz-Zeitformate in Kacheln (Profilzeile = „vor X Tagen“).')
}
checkHardcodedTimeFormats()

/**
 * FAIL: interne Bewertungs-Labels (z. B. „Zeitkritisch“) dürfen nie im Code stehen —
 * interne Scores/Bewertungen werden nie für den User gerendert.
 */
function checkForbiddenLabels(): void {
  const FORBIDDEN = /zeitkritisch/i
  const offenders: string[] = []
  for (const f of walk(SRC, ['.ts', '.tsx', '.json'])) {
    read(f).split('\n').forEach((l, i) => { if (FORBIDDEN.test(l)) offenders.push(`${rel(f)}:${i + 1}`) })
  }
  add('Design: keine internen Bewertungs-Labels', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `Verbotenes internes Label („Zeitkritisch“ o. ä.) im Code — interne Scores nie anzeigen:\n        ${offenders.join('\n        ')}`
      : 'Keine internen Bewertungs-Labels im Code.')
}
checkForbiddenLabels()

// ── Performance & Skalierung (Empfehlungen → WARN; echtes N+1 in Production → FAIL) ──

/** N+1: useQuery() INNERHALB einer .map()-Klammer (ein Query pro Zeile/Karte) — via Klammer-Matching. */
function checkN1Queries(): void {
  const offenders: string[] = []
  for (const f of walk(SRC, ['.ts', '.tsx'])) {
    const src = read(f)
    let i = 0
    let found = false
    while ((i = src.indexOf('.map(', i)) !== -1) {
      let depth = 0
      let span = ''
      for (let j = i + 4; j < src.length; j++) {
        const c = src[j]
        span += c
        if (c === '(') depth++
        else if (c === ')') { depth--; if (depth === 0) break }
      }
      if (/\buseQuery\s*\(/.test(span)) { found = true; break }
      i += 5
    }
    if (found) offenders.push(rel(f))
  }
  add('Perf: N+1 Queries', offenders.length ? 'FAIL' : 'PASS',
    offenders.length
      ? `useQuery() innerhalb von .map() (Query pro Zeile) — als EIN Listen-Query bündeln:\n        ${offenders.join('\n        ')}`
      : 'Kein useQuery innerhalb von .map() (kein N+1).')
}
checkN1Queries()

/** staleTime: Dateien mit useQuery, aber ohne staleTime (Default 0 = aggressives Refetch). */
function checkStaleTime(): void {
  const offenders: string[] = []
  for (const f of walk(SRC, ['.ts', '.tsx'])) {
    const src = read(f)
    if (/\buseQuery\s*\(/.test(src) && !/staleTime/.test(src)) offenders.push(rel(f))
  }
  add('Perf: staleTime gesetzt', offenders.length ? 'WARN' : 'PASS',
    offenders.length
      ? `useQuery ohne staleTime (Default 0 → refetcht aggressiv; Empf. 30s statisch / 5s live):\n        ${offenders.join('\n        ')}`
      : 'Alle useQuery-Dateien setzen staleTime.')
}
checkStaleTime()

/** SELECT *: inline `.select('*')` in db.ts (explizite Felder bevorzugen; Ausnahme getContactDetail). */
function checkSelectStar(): void {
  const p = join(ROOT, 'src/lib/db.ts')
  if (!existsSync(p)) { add('Perf: explizite Felder (kein SELECT *)', 'SKIP', 'db.ts fehlt.'); return }
  const sql = read(p)
  const fns: { name: string; idx: number }[] = []
  const fnRe = /export\s+async\s+function\s+(\w+)/g
  let m: RegExpExecArray | null
  while ((m = fnRe.exec(sql))) fns.push({ name: m[1], idx: m.index })
  const fnAt = (idx: number): string => { let n = 'top'; for (const f of fns) { if (f.idx <= idx) n = f.name; else break } return n }
  const offenders = new Set<string>()
  const selRe = /\.select\(\s*[`'"]\s*\*/g
  while ((m = selRe.exec(sql))) {
    const fn = fnAt(m.index)
    if (fn === 'getContactDetail') continue // bewusste Ausnahme (volle CRM-Felder fürs Panel)
    offenders.add(fn)
  }
  add('Perf: explizite Felder (kein SELECT *)', offenders.size ? 'WARN' : 'PASS',
    offenders.size
      ? `SELECT * in db.ts (explizite Felder bevorzugen; Ausnahme getContactDetail): ${[...offenders].join(', ')}`
      : 'Keine inline SELECT * in db.ts (außer bewusster Ausnahme).')
}
checkSelectStar()

/** Edge Functions: index.ts ohne explizites Timeout-/Abort-Setting. */
function checkEdgeFnTimeout(): void {
  const files = walk(join(ROOT, 'supabase/functions'), ['.ts']).filter((f) => basename(f) === 'index.ts')
  if (!files.length) { add('Perf: Edge-Function Timeout', 'PASS', 'Keine Edge Functions vorhanden.'); return }
  const offenders = files.filter((f) => !/timeout|AbortSignal|AbortController|setTimeout/i.test(read(f))).map(rel)
  add('Perf: Edge-Function Timeout', offenders.length ? 'WARN' : 'PASS',
    offenders.length
      ? `Edge Function ohne explizites Timeout (Empf. max 30s Cron / 10s User):\n        ${offenders.join('\n        ')}`
      : 'Alle Edge Functions mit Timeout/Abort.')
}
checkEdgeFnTimeout()

// ── Report ───────────────────────────────────────────────────────────────────

const icon: Record<Status, string> = { PASS: '✓', WARN: '!', FAIL: '✗', SKIP: '·' }
const counts: Record<Status, number> = { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0 }

console.log('\n  Sales OS — Selbst-Audit (CLAUDE.md Pflichtregeln)\n  ' + '─'.repeat(58))
for (const r of results) {
  counts[r.status]++
  console.log(`  [${icon[r.status]}] ${r.status.padEnd(4)} ${r.check.padEnd(28)} ${r.detail}`)
}
console.log('  ' + '─'.repeat(58))
console.log(`  ${counts.PASS} PASS · ${counts.WARN} WARN · ${counts.FAIL} FAIL · ${counts.SKIP} SKIP\n`)

if (counts.FAIL > 0) {
  console.log('  ✗ Audit FAILED — harte Verstöße beheben vor dem Commit.\n')
  process.exit(1)
}
console.log('  ✓ Keine harten Verstöße. (WARN/SKIP = noch nicht gebaut, ok in dieser Phase.)\n')
process.exit(0)

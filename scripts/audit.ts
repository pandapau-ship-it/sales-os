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

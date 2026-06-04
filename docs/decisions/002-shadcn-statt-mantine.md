# ADR 002: shadcn/ui statt Mantine

## Status
Accepted (ersetzt die ursprüngliche Mantine-Entscheidung aus dem Briefing)

## Kontext
Das ursprüngliche Briefing sah Mantine als UI-Framework vor. Während der
Prototyp-Phase wurde Tailwind CSS v4 für das Styling eingeführt. Damit entstand ein
Konflikt: Mantine bringt ein eigenes Styling-System mit, das sich mit Tailwind
überschneidet und schwer mit unseren Design-Tokens (`index.css :root`) vereinbaren
lässt. Gleichzeitig brauchen wir zugängliche, robuste interaktive Komponenten
(Modal, Dropdown, Select, Tooltip, Sheet) — diese selbst zu bauen ist fehleranfällig
(Focus-Trap, Keyboard-Navigation, ARIA).

## Entscheidung
**shadcn/ui (Radix-Primitives) + Tailwind CSS v4.**

- Interaktive Komponenten kommen aus `src/components/ui/` (Radix unter der Haube)
- Styling ausschließlich über Tailwind + unsere CSS-Tokens
- shadcn ist "headless + copy-in": wir besitzen den Code, passen ihn an unsere
  Design-Tokens an, kein Framework-Lock-in

## Konsequenzen
**Positiv:**
- Accessibility (Focus-Trap, Keyboard, ARIA) kommt von Radix — geschenkt
- Ein einziges Styling-System (Tailwind + Tokens), kein Mantine-Theme-Layer daneben
- Komponenten-Code liegt bei uns → volle Kontrolle, an Design-Invarianten anpassbar
- Headless heißt: das Design ändert sich durch die Migration NICHT

**Negativ:**
- Jede interaktive Komponente muss einmalig auf unsere Tokens getrimmt werden
- Disziplin nötig: nie selbst bauen was es als Primitiv gibt (in CLAUDE.md als
  Pflicht-Prüffrage verankert)

## Verworfene Alternativen
- **Mantine** — eigenes Styling-System kollidiert mit Tailwind, schwer mit
  zentralen Design-Tokens vereinbar, Theme-Overrides umständlich.
- **Reines Tailwind ohne Komponenten-Bibliothek** — jede Modal/Select/Tooltip von
  Null gebaut, inkonsistent, keine Accessibility-Garantie. "Tailwind ist instabil"
  bezog sich genau darauf — gelöst durch shadcn als stabile Primitiv-Schicht.

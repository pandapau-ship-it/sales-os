# Design System

## Overview

The Sales OS design system is derived directly from the Sherloq Brand Identity guidelines. It is implemented as a single Mantine v8 theme (`src/theme.ts`) that is the **only** source of visual truth. Every color, spacing value, font size, and shadow used in the application comes from this file.

**Brand mood:** calm, intelligent, action-oriented  
**Visual reference:** Claude.ai navigation — very compact, very clean  
**No-goes:** no Tailwind, no inline colors, no purple gradients, no oversize elements

---

## How It Works

1. `src/theme.ts` exports `theme` (Mantine `createTheme()` object)
2. `src/theme.ts` also exports domain-specific semantic tokens (`heatStatusColors`, `dealStageColors`, `churnRiskColors`, `personalityColors`)
3. `src/main.tsx` passes `theme` to `<MantineProvider theme={theme}>`
4. All components consume styles via Mantine CSS variables — never hardcoded hex values

---

## Data Model

Relevant to: `src/theme.ts`

The theme defines two categories of tokens:

| Category | Location | Used for |
|---|---|---|
| Mantine color scales (10 shades) | `colors` object in `createTheme()` | UI components, `color` props |
| Domain semantic tokens | Exported constants | Business-logic colors (heat status, deal stage, etc.) |

---

## Color Palette

### Primary Brand Color — Sherloq Deep Teal

The Sherloq brand primary color. Used for all primary actions, active navigation, and key CTAs.

| Shade | Hex | Usage |
|---|---|---|
| 0 | `#EDF5F5` | Background tints, hovered rows |
| 1 | `#C8E6E7` | Subtle borders, outlined badges |
| 2 | `#9DD2D3` | Hover backgrounds on light surfaces |
| 3 | `#67B8BA` | Muted teal, disabled states |
| 4 | `#3A9EA1` | Secondary actions, icon fills |
| 5 | `#2A8283` | Hover state on primary button |
| **6** | **`#185557`** | **PRIMARY — exact Sherloq brand hex** |
| 7 | `#113F41` | Pressed/active state, dark mode primary |
| 8 | `#0B2B2C` | Dark text on teal backgrounds |
| 9 | `#061617` | Near-black, maximum contrast |

```tsx
// Usage examples
<Button color="sherloq">Primary Action</Button>
<Badge color="sherloq">Active</Badge>
<Text c="sherloq.6">Brand Text</Text>
<Box bg="sherloq.0">Tinted Background</Box>
```

---

### Semantic Color Scales

Each semantic color has a **dark action color** (shade 5–6) and a **light background** (shade 0–1). Always use these pairs together for semantic chips, alerts, and status badges.

#### AI / Automation — Blue
Brand spec: `#2563EB` (action) · `#DBEAFE` (background)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#DBEAFE` | AI feature backgrounds, automation indicators |
| 6 | `#2563EB` | AI action labels, automation badges |

```tsx
<Badge color="ai">AI-Suggested</Badge>
<Box bg="ai.1" c="ai.6">AI Generated Content</Box>
```

#### Insight / Intelligence — Purple
Brand spec: `#8B5CF6` (action) · `#EDE9FE` (background)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#EDE9FE` | Insight backgrounds, analysis panels |
| 5 | `#8B5CF6` | Insight labels, analytics badges |

```tsx
<Badge color="insight">Kurzakte</Badge>
```

#### Opportunity / Lead — Amber
Brand spec: `#F59E0B` (action) · `#FEF3C7` (background) · `#EA660B` (emphasis)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#FEF3C7` | Lead backgrounds, opportunity chips |
| 5 | `#F59E0B` | Standard opportunity labels |
| 8 | `#EA660B` | High-emphasis opportunity, upsell signals |

```tsx
<Badge color="opportunity">New Lead</Badge>
```

#### Urgent / Action Required — Red
Brand spec: `#E11D48` (action) · `#FEF4E9` (background)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#FEF4E9` | Error/urgent backgrounds |
| 6 | `#E11D48` | Errors, churn critical, urgent alerts |

```tsx
<Badge color="urgent">Churn Risk</Badge>
<Alert color="urgent">Action Required</Alert>
```

#### Positive Growth / Success — Green
Brand spec: `#10B961` (action) · `#D1FAE5` (background)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#D1FAE5` | Success backgrounds, won deal indicators |
| 6 | `#10B961` | Success labels, growth metrics |

```tsx
<Badge color="growth">Gewonnen</Badge>
```

#### Intelligence — Magenta
Brand spec: `#F274F6` (action) · `#FFF4FE` (background)

| Shade | Hex | Usage |
|---|---|---|
| 1 | `#FFF4FE` | AI-generated content backgrounds |
| 6 | `#F274F6` | AI-content labels (use sparingly — high visual impact) |

---

## Domain Semantic Tokens

These tokens are exported from `src/theme.ts` and map business concepts to colors. **Never define these values again elsewhere.**

### Heat Status Colors

```typescript
import { heatStatusColors } from './theme'

// heatStatusColors.heiss   → { color: '#E11D48', bg: '#FEF4E9', label: '🔴 Heiß' }
// heatStatusColors.warm    → { color: '#F59E0B', bg: '#FEF3C7', label: '🟠 Warm' }
// heatStatusColors.lauwarm → { color: '#2563EB', bg: '#DBEAFE', label: '🟡 Lauwarm' }
// heatStatusColors.kalt    → { color: '#8B5CF6', bg: '#EDE9FE', label: '🔵 Kalt' }
// heatStatusColors.tot     → { color: '#6B7280', bg: '#F3F4F6', label: '⚫ Tot' }
```

| Status | Days (default) | Color | Background |
|---|---|---|---|
| `heiss` | 0–3 | `#E11D48` | `#FEF4E9` |
| `warm` | 4–14 | `#F59E0B` | `#FEF3C7` |
| `lauwarm` | 15–30 | `#2563EB` | `#DBEAFE` |
| `kalt` | 31–60 | `#8B5CF6` | `#EDE9FE` |
| `tot` | >60 | `#6B7280` | `#F3F4F6` |

Thresholds are stored in `heat_status_config` table (DB), not hardcoded here.

---

### Deal Stage Colors

```typescript
import { dealStageColors } from './theme'

// dealStageColors.backlog           → { color: '#6B7280', bg: '#F3F4F6' }
// dealStageColors.demo_vereinbart   → { color: '#2563EB', bg: '#DBEAFE' }
// dealStageColors.followup_offen    → { color: '#F59E0B', bg: '#FEF3C7' }
// dealStageColors.onboarding_trial  → { color: '#8B5CF6', bg: '#EDE9FE' }
// dealStageColors.gewonnen          → { color: '#10B961', bg: '#D1FAE5' }
// dealStageColors.verloren          → { color: '#E11D48', bg: '#FEF4E9' }
```

Stage names may change (user-configurable in `pipeline_stages` table). Colors are keyed by internal stage `name` field, not `label`.

---

### Churn Risk Colors

```typescript
import { churnRiskColors } from './theme'
// low → green, medium → amber, high → strong orange, critical → red
```

---

### Personality Type Colors

```typescript
import { personalityColors } from './theme'
// rot → red (dominant), gelb → amber (enthusiastic)
// gruen → green (harmonious), blau → blue (analytical)
```

---

## Typography

### Font Family

**Plus Jakarta Sans** — chosen to match Sherloq's brand feel: modern, clean, slightly distinctive without being generic. Loaded via Google Fonts in `index.html`.

Fallback chain: `"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Monospace (code, IDs): `"JetBrains Mono", "Fira Code", Consolas, monospace`

### Font Sizes

Compact scale oriented at Claude.ai navigation density:

| Token | Size | Usage |
|---|---|---|
| `xs` | 11px | Metadata, secondary labels, badge text, timestamps |
| `sm` | 13px | **Body text, nav items, table cells** — primary reading size |
| `md` | 14px | Larger body, form labels, slightly emphasized text |
| `lg` | 16px | Section headings, emphasized content |
| `xl` | 18px | Page-level headings (used sparingly) |

```tsx
<Text size="sm">Standard body text</Text>   // most common
<Text size="xs" c="dimmed">2 days ago</Text> // metadata
```

### Headings

| Level | Size | Weight | Usage |
|---|---|---|---|
| h1 | 26px | 700 | Page titles |
| h2 | 20px | 700 | Major section headers |
| h3 | 17px | 600 | Sub-section headers |
| h4 | 14px | 600 | Card headers, list group titles |
| h5 | 13px | 600 | Small section labels |
| h6 | 11px | 600 | Micro-labels (avoid if possible) |

---

## Spacing

4px base grid — compact but never cramped:

| Token | Size | Usage |
|---|---|---|
| `xs` | 4px | Icon gaps, between inline elements |
| `sm` | 8px | Padding inside compact components |
| `md` | 12px | Standard padding (cards, form fields) |
| `lg` | 16px | Between sections, card gaps |
| `xl` | 24px | Major section separation |

---

## Border Radius

| Token | Size | Usage |
|---|---|---|
| `xs` | 3px | Checkboxes, tiny inline elements |
| `sm` | 5px | Buttons, inputs |
| `md` | 8px | **Cards, dropdowns, modals** — DEFAULT |
| `lg` | 12px | Larger panels, drawer containers |
| `xl` | 16px | Avatars, image containers |

Default: `md` (8px). Never use `xl` for interactive buttons.

---

## Shadows

Tinted with brand teal (`#185557`) at very low opacity — creates visual cohesion:

| Token | Usage |
|---|---|
| `xs` | Subtle lift, hovered rows, inline chips |
| `sm` | Standard card elevation |
| `md` | Modals, panels, dropdowns |
| `lg` | Drawers, major overlays |
| `xl` | Full-screen overlays (rarely needed) |

```tsx
<Paper shadow="sm">Standard card</Paper>
<Modal shadow="lg">Modal</Modal>
```

---

## Component Defaults

All component overrides are documented in `src/theme.ts` with inline `// Why:` comments. Key decisions:

| Component | Key Override | Reason |
|---|---|---|
| `NavLink` | `py: 6`, 13px font | Claude.ai navigation density |
| `Button` | `sm` size, 500 weight | Less heavy than bold, more intentional than regular |
| `Badge` | No uppercase, 11px | German labels break with `text-transform: uppercase` |
| `Table` | `highlightOnHover`, compact rows | 20-30 rows visible at once (Level 1 view) |
| `Text` | Default `size="sm"` | Forces 13px throughout without per-component size props |
| `AppShell` | Border-only header/nav | Avoids heavy shadow that competes with content |

---

## Configuration

No `system_config` keys — this module defines static design tokens. Heat status and deal stage colors reference `system_config` thresholds at runtime (days), but colors are defined here.

---

## Error Handling

If a color key is used that doesn't exist in the theme, Mantine falls back to its own gray. Add missing colors to `src/theme.ts` rather than using inline hex values.

---

## Examples

### Status Badge (Heat Status)

```tsx
import { Badge } from '@mantine/core'
import { heatStatusColors } from '../theme'

function HeatBadge({ status }: { status: keyof typeof heatStatusColors }) {
  const { color, bg, label } = heatStatusColors[status]
  return (
    <Badge style={{ color, backgroundColor: bg }}>
      {label}
    </Badge>
  )
}
```

### Deal Stage Chip

```tsx
import { Badge } from '@mantine/core'
import { dealStageColors } from '../theme'

function StageBadge({ stage }: { stage: string }) {
  const colors = dealStageColors[stage as keyof typeof dealStageColors]
    ?? { color: '#6B7280', bg: '#F3F4F6' }
  return (
    <Badge style={{ color: colors.color, backgroundColor: colors.bg }}>
      {stage}
    </Badge>
  )
}
```

### Semantic Accent Card (matching Sherloq moodboard)

```tsx
import { Paper, Text, Box } from '@mantine/core'

function AccentCard({ type = 'ai', label, value }) {
  const colorMap = {
    ai:          { color: '#2563EB', bg: '#DBEAFE' },
    insight:     { color: '#8B5CF6', bg: '#EDE9FE' },
    opportunity: { color: '#F59E0B', bg: '#FEF3C7' },
    urgent:      { color: '#E11D48', bg: '#FEF4E9' },
    growth:      { color: '#10B961', bg: '#D1FAE5' },
  }
  const { color, bg } = colorMap[type]
  return (
    <Paper
      withBorder
      p="md"
      style={{ borderLeft: `3px solid ${color}`, backgroundColor: bg }}
    >
      <Text size="xs" fw={600} style={{ color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Text>
      <Text fw={700} size="lg" mt={4}>{value}</Text>
    </Paper>
  )
}
```

---

## Known Limitations

- Dark mode colors (shade 7) are set but dark mode has not been fully QA'd. Test all semantic tokens in dark mode before shipping.
- `#F274F6` (intelligence/magenta) has low WCAG contrast against white backgrounds at small font sizes. Do not use as text color below 16px.
- `Plus Jakarta Sans` is loaded via Google Fonts CDN. For offline/intranet deployments, self-host the font files in `/public/fonts/`.
- `heatStatusColors` days thresholds are duplicated here for documentation purposes. Authoritative values are in the `heat_status_config` database table.

/**
 * Sales OS — Mantine v8 Theme
 *
 * Single source of truth for all visual decisions.
 * Derived directly from Sherloq Brand Identity guidelines.
 *
 * Brand mood: calm, intelligent, action-oriented
 * Visual reference: Claude.ai navigation (compact, clean, no oversized elements)
 *
 * DO NOT use inline colors, hardcoded font sizes, or ad-hoc spacing anywhere.
 * Always reference this file or Mantine's CSS variables.
 */

import { createTheme, rem } from '@mantine/core'
import type { MantineColorsTuple } from '@mantine/core'

// ─────────────────────────────────────────────────────────────────────────────
// BRAND COLORS — 10-shade scales (Mantine requirement)
// Each scale: index 0 = lightest background tint, index 9 = near-black
// Primary action shade = index 6 in all scales (set via primaryShade below)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sherloq — Primary brand color
 * Deep teal derived from #185557 (exact brand hex at index 6)
 * Used for: primary buttons, active nav, key CTAs, brand mark
 * Hue: ~182° (cyan-teal), Saturation: 56%, Lightness: 21% at index 6
 */
const sherloq: MantineColorsTuple = [
  '#EDF5F5', // 0 — background tint, hovered rows, subtle fills
  '#C8E6E7', // 1 — borders, dividers, outlined badges
  '#9DD2D3', // 2 — hover backgrounds on light surfaces
  '#67B8BA', // 3 — muted teal, disabled states
  '#3A9EA1', // 4 — secondary action, icon fills
  '#2A8283', // 5 — hover on primary button
  '#185557', // 6 — PRIMARY — exact Sherloq brand hex
  '#113F41', // 7 — pressed/active state
  '#0B2B2C', // 8 — dark text on teal backgrounds
  '#061617', // 9 — near-black, max contrast
]

/**
 * ai — Blue semantic color
 * Exact brand spec: #2563EB (action) + #DBEAFE (background)
 * Used for: AI features, automation indicators, "AI/Time Saved" accents
 */
const ai: MantineColorsTuple = [
  '#EFF6FF', // 0
  '#DBEAFE', // 1 — brand spec light background
  '#BFDBFE', // 2
  '#93C5FD', // 3
  '#60A5FA', // 4
  '#3B82F6', // 5
  '#2563EB', // 6 — brand spec action color
  '#1D4ED8', // 7
  '#1E40AF', // 8
  '#1E3A8A', // 9
]

/**
 * insight — Purple semantic color
 * Exact brand spec: #8B5CF6 (action) + #EDE9FE (background)
 * Used for: insights, intelligence features, analytics, AI suggestions
 */
const insight: MantineColorsTuple = [
  '#F5F3FF', // 0
  '#EDE9FE', // 1 — brand spec light background
  '#DDD6FE', // 2
  '#C4B5FD', // 3
  '#A78BFA', // 4
  '#8B5CF6', // 5 — brand spec action color
  '#7C3AED', // 6
  '#6D28D9', // 7
  '#5B21B6', // 8
  '#4C1D95', // 9
]

/**
 * opportunity — Amber semantic color
 * Brand spec: #F59E0B (action) + #FEF3C7 (background)
 * Strong orange accent: #EA660B (index 8, used for high-emphasis opportunity signals)
 * Used for: lead indicators, opportunity badges, upsell signals, warm heat status
 */
const opportunity: MantineColorsTuple = [
  '#FFFBEB', // 0
  '#FEF3C7', // 1 — brand spec light background
  '#FDE68A', // 2
  '#FCD34D', // 3
  '#FBBF24', // 4
  '#F59E0B', // 5 — brand spec action color
  '#D97706', // 6
  '#B45309', // 7
  '#EA660B', // 8 — brand spec strong orange accent (Opportunity/Lead emphasis)
  '#92400E', // 9
]

/**
 * urgent — Red semantic color
 * Exact brand spec: #E11D48 (action) + #FEF4E9 (background)
 * Used for: urgent alerts, churn risk critical, errors, "Action Required" badges
 */
const urgent: MantineColorsTuple = [
  '#FFF1F2', // 0
  '#FEF4E9', // 1 — brand spec light background
  '#FECDD3', // 2
  '#FDA4AF', // 3
  '#FB7185', // 4
  '#F43F5E', // 5
  '#E11D48', // 6 — brand spec action color (exact)
  '#BE123C', // 7
  '#9F1239', // 8
  '#881337', // 9
]

/**
 * growth — Green semantic color
 * Exact brand spec: #10B961 (action) + #D1FAE5 (background)
 * Used for: success states, growth metrics, "won" deals, positive growth indicators
 */
const growth: MantineColorsTuple = [
  '#ECFDF5', // 0
  '#D1FAE5', // 1 — brand spec light background (exact)
  '#A7F3D0', // 2
  '#6EE7B7', // 3
  '#34D399', // 4
  '#10B981', // 5
  '#10B961', // 6 — brand spec action color (exact)
  '#047857', // 7
  '#065F46', // 8
  '#064E3B', // 9
]

/**
 * intelligence — Magenta/Pink semantic color
 * Brand spec: #F274F6 (action) + #FFF4FE (background)
 * Used for: intelligence features, AI-generated content labels, kurzakte indicators
 * Note: use sparingly — high visual impact. Reserve for truly AI-driven elements.
 */
const intelligence: MantineColorsTuple = [
  '#FDF4FF', // 0
  '#FFF4FE', // 1 — brand spec light background
  '#F5D0FE', // 2
  '#F0ABFC', // 3
  '#E879F9', // 4
  '#D946EF', // 5
  '#F274F6', // 6 — brand spec action color (exact)
  '#A21CAF', // 7
  '#86198F', // 8
  '#701A75', // 9
]

// ─────────────────────────────────────────────────────────────────────────────
// SALES OS SEMANTIC TOKENS
// Domain-specific color mappings. Not part of Mantine — exported for direct use
// in components. These map business concepts to the brand color palette.
// ─────────────────────────────────────────────────────────────────────────────

/** Heat status color tokens — matches heat_status_config table defaults */
export const heatStatusColors = {
  heiss:    { color: '#E11D48', bg: '#FEF4E9', label: '🔴 Heiß'    }, // 0-3 days
  warm:     { color: '#F59E0B', bg: '#FEF3C7', label: '🟠 Warm'    }, // 4-14 days
  lauwarm:  { color: '#2563EB', bg: '#DBEAFE', label: '🟡 Lauwarm' }, // 15-30 days
  kalt:     { color: '#8B5CF6', bg: '#EDE9FE', label: '🔵 Kalt'    }, // 31-60 days
  tot:      { color: '#6B7280', bg: '#F3F4F6', label: '⚫ Tot'      }, // >60 days
} as const

/** Pipeline stage color tokens — maps to pipeline_stages table */
export const dealStageColors = {
  backlog:           { color: '#6B7280', bg: '#F3F4F6' }, // neutral — unqualified
  demo_vereinbart:   { color: '#2563EB', bg: '#DBEAFE' }, // blue — active engagement
  followup_offen:    { color: '#F59E0B', bg: '#FEF3C7' }, // amber — needs action
  onboarding_trial:  { color: '#8B5CF6', bg: '#EDE9FE' }, // purple — in progress
  gewonnen:          { color: '#10B961', bg: '#D1FAE5' }, // green — success
  verloren:          { color: '#E11D48', bg: '#FEF4E9' }, // red — lost
} as const

/** Churn risk color tokens — maps to churn_risk_level field */
export const churnRiskColors = {
  low:      { color: '#10B961', bg: '#D1FAE5' },
  medium:   { color: '#F59E0B', bg: '#FEF3C7' },
  high:     { color: '#EA660B', bg: '#FEF3C7' }, // strong orange for high urgency
  critical: { color: '#E11D48', bg: '#FEF4E9' },
} as const

/** Personality type color tokens — AI-derived DISG-inspired classification */
export const personalityColors = {
  rot:   { color: '#E11D48', bg: '#FEF4E9', label: 'Rot — Dominant & Direkt'     },
  gelb:  { color: '#F59E0B', bg: '#FEF3C7', label: 'Gelb — Enthusiastisch'       },
  gruen: { color: '#10B961', bg: '#D1FAE5', label: 'Grün — Harmonieorientiert'   },
  blau:  { color: '#2563EB', bg: '#DBEAFE', label: 'Blau — Analytisch'           },
} as const

/** Communication channel icon mapping — used in engagement chain */
export const channelIcons = {
  email:    '📧',
  linkedin: '💼',
  slack:    '💬',
  teams:    '🟦',
  phone:    '📞',
  meeting:  '🎥',
  whatsapp: '📱',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// MANTINE THEME
// ─────────────────────────────────────────────────────────────────────────────

export const theme = createTheme({

  // ── Color System ────────────────────────────────────────────────────────────
  colors: {
    sherloq,
    ai,
    insight,
    opportunity,
    urgent,
    growth,
    intelligence,
  },

  // Primary color = brand teal. Shade 6 = #185557 (primary action).
  // Shade 7 = #113F41 used in dark mode for better contrast.
  primaryColor: 'sherloq',
  primaryShade: { light: 6, dark: 7 },

  white: '#FFFFFF',
  black: '#0D1117', // slightly softer than pure black — easier on eyes

  // ── Typography ──────────────────────────────────────────────────────────────
  // Plus Jakarta Sans: matches Sherloq brand feel — modern, clean, slightly
  // distinctive. Reflects "calm, intelligent" positioning without being generic.
  fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", Consolas, monospace',

  // Compact scale — oriented at Claude.ai's own navigation density.
  // Most body text and nav items use sm (13px). Labels use xs (11px).
  fontSizes: {
    xs: rem(11),  // metadata, secondary labels, badge text
    sm: rem(13),  // body text, nav items, table cells — primary reading size
    md: rem(14),  // slightly larger body, form labels
    lg: rem(16),  // section headings, emphasized body
    xl: rem(18),  // page-level headings (h3 equivalent in context)
  },

  lineHeights: {
    xs: '1.3',
    sm: '1.4',
    md: '1.5',
    lg: '1.5',
    xl: '1.4',
  },

  headings: {
    fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(26), lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: rem(20), lineHeight: '1.3', fontWeight: '700' },
      h3: { fontSize: rem(17), lineHeight: '1.4', fontWeight: '600' },
      h4: { fontSize: rem(14), lineHeight: '1.4', fontWeight: '600' },
      h5: { fontSize: rem(13), lineHeight: '1.5', fontWeight: '600' },
      h6: { fontSize: rem(11), lineHeight: '1.5', fontWeight: '600' },
    },
  },

  // ── Spacing ─────────────────────────────────────────────────────────────────
  // 4px base grid — compact but never cramped.
  // xs=4, sm=8, md=12, lg=16, xl=24 (tighter than Mantine defaults)
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(12),
    lg: rem(16),
    xl: rem(24),
  },

  // ── Border Radius ────────────────────────────────────────────────────────────
  // Cards in moodboard show ~8-10px radius. Buttons slightly less.
  // Never fully rounded (pill) for main UI elements — keeps professional feel.
  radius: {
    xs: rem(3),   // checkboxes, tiny badges
    sm: rem(5),   // buttons, inputs
    md: rem(8),   // cards, dropdowns, modals — DEFAULT
    lg: rem(12),  // larger cards, panels
    xl: rem(16),  // image containers, avatars
  },
  defaultRadius: 'md',

  // ── Shadows ──────────────────────────────────────────────────────────────────
  // Tinted with brand teal at very low opacity — cohesive with the palette.
  // Use xs for subtle lift, sm for cards, md for modals/panels.
  shadows: {
    xs: '0 1px 2px rgba(24, 85, 87, 0.05), 0 1px 3px rgba(0,0,0,0.04)',
    sm: '0 1px 3px rgba(24, 85, 87, 0.07), 0 2px 6px rgba(0,0,0,0.05)',
    md: '0 2px 8px rgba(24, 85, 87, 0.08), 0 4px 16px rgba(0,0,0,0.06)',
    lg: '0 4px 16px rgba(24, 85, 87, 0.10), 0 8px 24px rgba(0,0,0,0.08)',
    xl: '0 8px 32px rgba(24, 85, 87, 0.14), 0 16px 48px rgba(0,0,0,0.10)',
  },

  // ── Interaction ──────────────────────────────────────────────────────────────
  cursorType: 'pointer',
  focusRing: 'auto',

  // ── Component Defaults ───────────────────────────────────────────────────────
  // Each override targets the most common Sales OS usage pattern.
  // "Why" is documented per component — not just what the style does.
  components: {

    // NavLink — compact like Claude.ai sidebar items
    // Tight vertical padding creates dense but readable navigation
    NavLink: {
      defaultProps: {
        py: 6,
      },
      styles: {
        root: {
          borderRadius: rem(6),
          fontSize: rem(13),
          fontWeight: 500,
          paddingLeft: rem(10),
          paddingRight: rem(10),
        },
        label: {
          fontSize: rem(13),
          fontWeight: 500,
        },
        section: {
          // keeps icon and label vertically aligned at compact size
          marginRight: rem(8),
        },
      },
    },

    // Button — medium weight feels more intentional than bold; 13px matches body
    Button: {
      defaultProps: {
        radius: 'sm',
        size: 'sm',
      },
      styles: {
        root: {
          fontWeight: 500,
          fontSize: rem(13),
          letterSpacing: '0.01em',
        },
      },
    },

    // Badge — no uppercase (breaks readability for German labels); slightly bold
    Badge: {
      defaultProps: {
        radius: 'sm',
        size: 'sm',
      },
      styles: {
        root: {
          fontSize: rem(11),
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0',
          paddingLeft: rem(6),
          paddingRight: rem(6),
        },
      },
    },

    // Card — standard elevation for list items and panels
    Card: {
      defaultProps: {
        shadow: 'xs',
        radius: 'md',
        padding: 'md',
        withBorder: true,
      },
    },

    // Table — compact rows are critical for the 20-30 leads visible at once (Level 1)
    Table: {
      defaultProps: {
        verticalSpacing: 6,
        horizontalSpacing: 'sm',
        fz: 'sm',
        striped: false,
        highlightOnHover: true,
      },
    },

    // Text — default to sm to enforce compact density throughout
    Text: {
      defaultProps: {
        size: 'sm',
      },
    },

    // AppShell — subtle borders, no heavy shadows on shell elements
    AppShell: {
      styles: {
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          backdropFilter: 'none',
        },
        navbar: {
          borderRight: '1px solid var(--mantine-color-gray-2)',
        },
      },
    },

    // Input — sm size keeps forms compact; matches table cell height visually
    TextInput: {
      defaultProps: {
        size: 'sm',
        radius: 'sm',
      },
    },
    Select: {
      defaultProps: {
        size: 'sm',
        radius: 'sm',
      },
    },
    Textarea: {
      defaultProps: {
        size: 'sm',
        radius: 'sm',
      },
    },

    // Tooltip — xs font keeps it unobtrusive; arrow helps orientation
    Tooltip: {
      defaultProps: {
        withArrow: true,
        fz: 'xs',
        radius: 'sm',
      },
    },

    // Modal — md radius matches card design language; sm padding is enough
    Modal: {
      defaultProps: {
        radius: 'md',
        shadow: 'lg',
      },
    },

    // Drawer — used for Level 3 (deep dive) views per progressive disclosure rule
    Drawer: {
      defaultProps: {
        shadow: 'lg',
        size: 'lg',
      },
    },

    // Paper — backing for panels and floating elements
    Paper: {
      defaultProps: {
        shadow: 'xs',
        radius: 'md',
        withBorder: true,
      },
    },

    // ActionIcon — compact icon buttons match body text scale
    ActionIcon: {
      defaultProps: {
        size: 'sm',
        radius: 'sm',
        variant: 'subtle',
      },
    },

    // Notification — Sherloq brand teal as primary notification color
    Notification: {
      defaultProps: {
        radius: 'md',
      },
    },

    // Spotlight (used for Cmd+K) — clean, centered
    Spotlight: {
      defaultProps: {
        radius: 'md',
        shadow: 'lg',
      },
    },
  },
})

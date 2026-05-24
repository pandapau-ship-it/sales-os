import {
  IconSun,
  IconTarget,
  IconSeeding,
  IconSpeakerphone,
  IconChartBar,
  IconTicket,
  IconList,
  IconLayoutKanban,
  IconArrowsShuffle,
  IconSend,
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconAlertTriangle,
  IconCalendar,
  IconEdit,
  IconMail,
  IconChartLine,
  IconLayoutDashboard,
  IconCreditCard,
  IconPackage,
  IconClipboardList,
  IconFlag,
  IconBell,
} from '@tabler/icons-react'
import type { MainNavItem, SubNavItem, UserRole, MainNavId } from '../../types/navigation'

// ─── Role Access Map ─────────────────────────────────────────────────────────
// Defines which sections each role can access.
// Add new roles here — no code changes needed elsewhere.
const roleAccess: Record<UserRole, MainNavId[]> = {
  solo:    ['mein-tag', 'hunting', 'farming', 'marketing', 'sherloq', 'jira'],
  hunter:  ['mein-tag', 'hunting', 'jira'],
  farmer:  ['mein-tag', 'farming', 'jira'],
  admin:   ['mein-tag', 'hunting', 'farming', 'marketing', 'sherloq', 'jira'],
}

// ─── Main Navigation ─────────────────────────────────────────────────────────
// Order matters — renders left to right in TopBar.
export const mainNavItems: MainNavItem[] = [
  {
    id: 'mein-tag',
    label: 'Mein Tag',
    icon: IconSun,
    roles: ['solo', 'hunter', 'farmer', 'admin'],
  },
  {
    id: 'hunting',
    label: 'Hunting',
    icon: IconTarget,
    roles: ['solo', 'hunter', 'admin'],
  },
  {
    id: 'farming',
    label: 'Farming',
    icon: IconSeeding,
    roles: ['solo', 'farmer', 'admin'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: IconSpeakerphone,
    roles: ['solo', 'admin'],
  },
  {
    id: 'sherloq',
    label: 'Sherloq System',
    icon: IconChartBar,
    roles: ['solo', 'admin'],
  },
  {
    id: 'jira',
    label: 'Jira',
    icon: IconTicket,
    roles: ['solo', 'hunter', 'farmer', 'admin'],
    secondary: true, // rendered smaller with a visual separator before it
  },
]

// ─── Sub-Navigation ───────────────────────────────────────────────────────────
// Context-sensitive — SubSidebar shows only items for the active section.
// Mein Tag intentionally has no sub-items (single focused view).
export const subNavItems: SubNavItem[] = [
  // Hunting
  { id: 'hunting-leads',     label: 'Lead-Liste',  icon: IconList,          section: 'hunting' },
  { id: 'hunting-pipeline',  label: 'Pipeline',    icon: IconLayoutKanban,  section: 'hunting' },
  { id: 'hunting-sequences', label: 'Sequenzen',   icon: IconArrowsShuffle, section: 'hunting' },
  { id: 'hunting-outreach',  label: 'Outreach',    icon: IconSend,          section: 'hunting' },

  // Farming
  { id: 'farming-customers', label: 'Kundenliste',    icon: IconUsers,          section: 'farming' },
  { id: 'farming-health',    label: 'Health Monitor', icon: IconActivity,       section: 'farming' },
  { id: 'farming-upsell',    label: 'Upsell',         icon: IconTrendingUp,     section: 'farming' },
  { id: 'farming-churn',     label: 'Churn Monitor',  icon: IconAlertTriangle,  section: 'farming' },

  // Marketing
  { id: 'marketing-plan',       label: 'Content Plan', icon: IconCalendar,  section: 'marketing' },
  { id: 'marketing-posts',      label: 'Posts',        icon: IconEdit,      section: 'marketing' },
  { id: 'marketing-newsletter', label: 'Newsletter',   icon: IconMail,      section: 'marketing' },
  { id: 'marketing-analytics',  label: 'Analytics',    icon: IconChartLine, section: 'marketing' },

  // Sherloq System
  { id: 'sherloq-overview', label: 'Übersicht',      icon: IconLayoutDashboard, section: 'sherloq' },
  { id: 'sherloq-usage',    label: 'Usage',           icon: IconActivity,        section: 'sherloq' },
  { id: 'sherloq-subs',     label: 'Subscriptions',   icon: IconCreditCard,      section: 'sherloq' },
  { id: 'sherloq-plans',    label: 'Plans',            icon: IconPackage,         section: 'sherloq' },

  // Jira
  { id: 'jira-tickets', label: 'Meine Tickets', icon: IconClipboardList, section: 'jira' },
  { id: 'jira-epics',   label: 'Epics',         icon: IconFlag,          section: 'jira' },
  { id: 'jira-alerts',  label: 'Smart Alerts',  icon: IconBell,          section: 'jira' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns only the nav items visible for a given role, in display order. */
export function getVisibleMainItems(role: UserRole): MainNavItem[] {
  const allowed = roleAccess[role]
  return mainNavItems.filter(item => allowed.includes(item.id))
}

/** Returns sub-items for a specific section. */
export function getSubItems(section: MainNavId): SubNavItem[] {
  return subNavItems.filter(item => item.section === section)
}

/** Returns the first accessible section for a role (used as default on load). */
export function getDefaultSection(role: UserRole): MainNavId {
  return roleAccess[role][0] ?? 'mein-tag'
}

/** Section descriptions shown in placeholder pages. */
export const sectionMeta: Record<MainNavId, { title: string; description: string }> = {
  'mein-tag':  { title: 'Mein Tag',       description: 'Tagesstruktur, Prioritäten, Meeting-Prep und AI-Briefing' },
  hunting:     { title: 'Hunting',         description: 'Lead-Pipeline, Outreach-Sequenzen und Neukundengewinnung' },
  farming:     { title: 'Farming',         description: 'Bestandskunden, Health-Monitoring und Upsell-Potenziale' },
  marketing:   { title: 'Marketing',       description: 'Content-Planung, Posts, Newsletter und Kampagnen' },
  sherloq:     { title: 'Sherloq System',  description: 'Produkt-Statistiken, Usage-Daten und Subscription-Übersicht' },
  jira:        { title: 'Jira',            description: 'Meine Tickets, Epics und Smart Alerts aus Jira' },
}

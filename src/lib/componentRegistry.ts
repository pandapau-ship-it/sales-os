/**
 * Component Registry — single source of truth for AI Chat rendering.
 *
 * Rule: every component the AI Chat can show MUST be registered here.
 * The AI returns a render key → the registry maps it to the component + filter.
 * Claude Code may NOT build a component that is not listed here.
 *
 * Adding a new component?
 *   1. Build the component
 *   2. Add an entry below — never skip this step
 *   3. Update the system prompt in aiChat.ts so the AI knows the new key
 */

export type RenderKey = keyof typeof COMPONENT_REGISTRY;

export interface RegistryEntry {
  /** The React component name (for documentation + future dynamic import) */
  component: string;
  /** Path to the component relative to src/ */
  path: string;
  /** Default filter applied when no filter is specified by the AI */
  filter: string | null;
  /** Human-readable description — used in the AI system prompt */
  description: string;
}

export const COMPONENT_REGISTRY = {
  // ── Screens (full-page views) ──────────────────────────────────────────────

  screen_mein_tag: {
    component: 'ScreenMyDay',
    path: 'components/screens/ScreenMyDay',
    filter: null,
    description: 'Tägliche Übersicht: Prioritäten, Termine, Tasks, Alerts, KPIs',
  },

  screen_hunting: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: null,
    description: 'Lead-Management: Liste, Pipeline, Signale, Sequenzen',
  },

  screen_farming: {
    component: 'ScreenFarming',
    path: 'components/screens/ScreenFarming',
    filter: null,
    description: 'Kunden-Management: Bestandskunden, Churn-Risiken, Upsell-Potenziale',
  },

  screen_marketing: {
    component: 'ScreenMarketing',
    path: 'components/screens/ScreenMarketing',
    filter: null,
    description: 'Marketing: LinkedIn Post-Ideen, Kampagnen, Content-Planung',
  },

  screen_kontakte: {
    component: 'ScreenKontakte',
    path: 'components/screens/ScreenKontakte',
    filter: null,
    description: 'Kontakte: zentrale Personen-Datenbank als sortier-/filterbare Tabelle (K-3)',
  },

  screen_system: {
    component: 'ScreenSherloqSystem',
    path: 'components/screens/ScreenSherloqSystem',
    filter: null,
    description: 'Sherloq System Status: API-Health, Lizenz, Nutzungsstatistiken',
  },

  screen_jira: {
    component: 'ScreenJira',
    path: 'components/screens/Jira',
    filter: null,
    description: 'Jira-Integration: Tickets, Epics, Smart Alerts',
  },

  // ── Lead list views (filter variants of ScreenHunting) ────────────────────

  leads_today: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: 'today',
    description: 'Leads die heute Aktion brauchen',
  },

  cold_leads: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: 'cold',
    description: 'Kalte Leads (kein Kontakt seit >14 Tagen)',
  },

  hot_leads: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: 'hot',
    description: 'Hot Leads mit hohem Kaufinteresse (HeatStatus HOT)',
  },

  stagnating: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: 'stagnating',
    description: 'Leads die seit >7 Tagen in derselben Pipeline-Stage stecken',
  },

  lead_pipeline: {
    component: 'ScreenHunting',
    path: 'components/screens/ScreenHunting',
    filter: 'pipeline',
    description: 'Pipeline-Ansicht aller aktiven Deals',
  },

  // ── Customer list views (filter variants of ScreenFarming) ────────────────

  churn_risks: {
    component: 'ScreenFarming',
    path: 'components/screens/ScreenFarming',
    filter: 'churn',
    description: 'Kunden mit hohem Churn-Risiko',
  },

  upsell: {
    component: 'ScreenFarming',
    path: 'components/screens/ScreenFarming',
    filter: 'upsell',
    description: 'Kunden mit Upsell-Potenzial (Usage >80% oder Enterprise-Signal)',
  },

  inactive_customers: {
    component: 'ScreenFarming',
    path: 'components/screens/ScreenFarming',
    filter: 'inactive',
    description: 'Kunden mit sinkender Sherloq-Nutzung',
  },

  // ── Shared / overlay components ───────────────────────────────────────────

  contact_detail: {
    component: 'CustomerDrawer',
    path: 'components/shared/CustomerDrawer',
    filter: null,
    description: 'Detailansicht eines Kontakts: Timeline, Kurzakte, Kommunikationshistorie',
  },

  communication_chain: {
    component: 'CommunicationChain',
    path: 'components/shared/CommunicationChain',
    filter: null,
    description: 'Visuelle Engagement-Kette der letzten Kommunikationskanäle eines Kontakts',
  },

  // ── Placeholders for upcoming components ─────────────────────────────────
  // Register here BEFORE building — avoids forgetting the registry step.

  mail_drafts: {
    component: 'MailDraftList',       // not yet built
    path: 'components/shared/MailDraftList',
    filter: null,
    description: 'Editierbare Liste KI-generierter Mail-Entwürfe (Typ 3 Workflow)',
  },

  pipeline_chart: {
    component: 'PipelineChart',       // not yet built
    path: 'components/screens/PipelineChart',
    filter: null,
    description: 'Visueller Pipeline-Funnel mit Deal-Werten und Stage-Verteilung',
  },

  smart_list: {
    component: 'SmartList',           // not yet built
    path: 'components/screens/SmartList',
    filter: null,
    description: 'KI-erstellte dynamische Kontakt-/Deal-Liste basierend auf JSONB-Filterregeln — erstellt, benennt und speichert die Liste automatisch',
  },

  smart_list_result: {
    component: 'SmartListResult',     // not yet built
    path: 'components/screens/SmartListResult',
    filter: null,
    description: 'Ergebnis-Ansicht einer gespeicherten Smart List — zeigt gecachte Mitglieder mit letztem Stand und Re-Run Option',
  },
} as const satisfies Record<string, RegistryEntry>;

/**
 * Returns a formatted list of all render keys + descriptions for use in AI system prompts.
 * Call this to keep the system prompt in sync with the registry automatically.
 */
export function getRegistryPromptBlock(): string {
  return Object.entries(COMPONENT_REGISTRY)
    .map(([key, entry]) => `  "${key}" → ${entry.description}`)
    .join('\n');
}

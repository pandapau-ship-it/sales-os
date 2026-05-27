import type {
  Contact, Deal, Task, CalendarEvent, Signal, JiraTicket, CurrentUser, Company
} from './types'

// ─── Current user (replace with Supabase Auth in Phase 5) ────────────────────

export const currentUser: CurrentUser = {
  id: 'mock-user-1',
  name: 'Oliver Sand',
  initials: 'OS',
  email: 'oliver@sherloq.io',
  role: 'solo',
}

// ─── Contacts / Leads ────────────────────────────────────────────────────────

export const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Bergmann',
    company: 'Nuveo GmbH',
    role: 'Head of Growth',
    email: 'sarah@nuveo.de',
    personality: 'rot',
    heatStatus: 'heiss',
    lastContactDaysAgo: 2,
    kurzakte: 'Sehr kaufbereit — hat Demo um Onboarding-Features gebeten. Decision Maker. Entscheidet bis Ende Monat.',
    cluster: ['Lead', 'Enterprise'],
    engagementChain: ['meeting', 'email', 'call', 'email', 'linkedin'],
  },
  {
    id: 'c2',
    name: 'Marcus Fröhlich',
    company: 'Vertrieb360 AG',
    role: 'VP Sales',
    email: 'marcus@v360.de',
    personality: 'blau',
    heatStatus: 'warm',
    lastContactDaysAgo: 8,
    kurzakte: 'Analytisch, braucht Zahlen. Hat ROI-Kalkulation angefragt. Pilot läuft gut, Conversion wahrscheinlich.',
    cluster: ['Lead', 'Mid-Market'],
    engagementChain: ['email', 'call', 'email', 'slack'],
  },
  {
    id: 'c3',
    name: 'Julia Mertens',
    company: 'Bloom Retail GmbH',
    role: 'CEO',
    email: 'julia@bloom.de',
    personality: 'gelb',
    heatStatus: 'lauwarm',
    lastContactDaysAgo: 19,
    kurzakte: 'Enthusiastisch aber unentschlossen. Braucht Validation durch Case Studies. Entscheidet nicht alleine.',
    cluster: ['Lead', 'SMB'],
    engagementChain: ['call', 'email', 'linkedin', 'email'],
  },
  {
    id: 'c4',
    name: 'Thomas Eckhardt',
    company: 'Logistics Pro GmbH',
    role: 'Head of Operations',
    email: 't.eckhardt@logpro.de',
    personality: 'gruen',
    heatStatus: 'kalt',
    lastContactDaysAgo: 34,
    kurzakte: 'Sehr vorsichtig. Braucht Zeit. Letzter Call war positiv aber er muss intern abstimmen. Kein Druck.',
    cluster: ['Lead'],
    engagementChain: ['email', 'call', 'email'],
  },
  {
    id: 'c5',
    name: 'Petra Wolff',
    company: 'FinServ GmbH',
    role: 'CFO',
    email: 'petra@finserv.de',
    personality: 'blau',
    heatStatus: 'tot',
    lastContactDaysAgo: 68,
    kurzakte: 'Kein Kontakt seit 68 Tagen. War interessiert an Compliance-Features. Reaktivierung prüfen.',
    cluster: ['Lead'],
    engagementChain: ['email', 'email'],
  },
]

// ─── Companies / Customers ────────────────────────────────────────────────────

export const mockCompanies: Company[] = [
  {
    id: 'co1',
    name: 'Nuveo GmbH',
    cluster: ['Lead', 'Enterprise'],
    heatStatus: 'heiss',
    churnRisk: 'low',
    kurzakte: 'Starke Kaufsignale. Pipeline-Deal aktiv. Sarah Bergmann ist Decision Maker.',
    contacts: 3,
    mrr: 0,
  },
  {
    id: 'co2',
    name: 'Telio Systems AG',
    cluster: ['Customer', 'Enterprise'],
    heatStatus: 'warm',
    churnRisk: 'medium',
    kurzakte: 'Bestandskunde seit 14 Monaten. Nutzt 3 von 5 Features aktiv. Upsell auf Team-Plan möglich.',
    contacts: 5,
    mrr: 2800,
  },
  {
    id: 'co3',
    name: 'Pulse Analytics GmbH',
    cluster: ['Customer', 'Mid-Market'],
    heatStatus: 'kalt',
    churnRisk: 'high',
    kurzakte: 'Login-Aktivität um 40% gesunken. Letzter Kontakt vor 28 Tagen. Churn-Risiko steigt.',
    contacts: 2,
    mrr: 990,
  },
  {
    id: 'co4',
    name: 'Bloom Retail GmbH',
    cluster: ['Lead', 'SMB'],
    heatStatus: 'lauwarm',
    churnRisk: 'low',
    kurzakte: 'CEO Julia Mertens prüft Angebot. Demo gut verlaufen. Follow-up geplant.',
    contacts: 1,
    mrr: 0,
  },
]

// ─── Pipeline Deals ───────────────────────────────────────────────────────────

export const mockDeals: Deal[] = [
  {
    id: 'd1',
    title: 'Nuveo — Enterprise Plan',
    company: 'Nuveo GmbH',
    stage: 'demo_vereinbart',
    mrr: 3500,
    contractMonths: 12,
    oneOff: 500,
    daysInStage: 4,
    hasOpenTask: true,
  },
  {
    id: 'd2',
    title: 'Vertrieb360 — Team Plan',
    company: 'Vertrieb360 AG',
    stage: 'followup_offen',
    mrr: 1200,
    contractMonths: 12,
    oneOff: 0,
    daysInStage: 11,
    hasOpenTask: false,
  },
  {
    id: 'd3',
    title: 'Bloom Retail — Starter',
    company: 'Bloom Retail GmbH',
    stage: 'backlog',
    mrr: 490,
    contractMonths: 6,
    oneOff: 0,
    daysInStage: 3,
    hasOpenTask: true,
  },
  {
    id: 'd4',
    title: 'Logistics Pro — Pilot',
    company: 'Logistics Pro GmbH',
    stage: 'onboarding_trial',
    mrr: 990,
    contractMonths: 12,
    oneOff: 200,
    daysInStage: 18,
    hasOpenTask: false,
  },
]

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Follow-up nach Demo senden',
    contactName: 'Sarah Bergmann',
    company: 'Nuveo GmbH',
    dueDate: '2026-05-27',
    suggestedChannel: 'email',
    suggestedMessage: 'Hallo Sarah, vielen Dank für die Demo gestern. Ich habe das Angebot angepasst…',
    status: 'open',
    priority: 'high',
  },
  {
    id: 't2',
    title: 'ROI-Kalkulation für Marcus vorbereiten',
    contactName: 'Marcus Fröhlich',
    company: 'Vertrieb360 AG',
    dueDate: '2026-05-28',
    suggestedChannel: 'email',
    status: 'open',
    priority: 'high',
  },
  {
    id: 't3',
    title: 'Churn-Risiko Pulse Analytics — Kontakt aufnehmen',
    contactName: 'Anna Kruse',
    company: 'Pulse Analytics GmbH',
    dueDate: '2026-05-27',
    suggestedChannel: 'call',
    suggestedMessage: 'Hallo Anna, ich wollte kurz nachfragen wie ihr mit Sherloq vorankommt…',
    status: 'open',
    priority: 'high',
  },
  {
    id: 't4',
    title: 'Case Studies an Julia schicken',
    contactName: 'Julia Mertens',
    company: 'Bloom Retail GmbH',
    dueDate: '2026-05-29',
    suggestedChannel: 'email',
    status: 'open',
    priority: 'normal',
  },
]

// ─── Today's Calendar ─────────────────────────────────────────────────────────

export const mockCalendar: CalendarEvent[] = [
  {
    id: 'ev1',
    title: 'Demo — Nuveo GmbH',
    contactName: 'Sarah Bergmann',
    company: 'Nuveo GmbH',
    startTime: '10:00',
    endTime: '10:45',
    type: 'demo',
    meetingPrepReady: true,
  },
  {
    id: 'ev2',
    title: 'Weekly Sales Sync',
    startTime: '14:00',
    endTime: '14:30',
    type: 'internal',
    meetingPrepReady: false,
  },
  {
    id: 'ev3',
    title: 'Check-in — Telio Systems',
    contactName: 'Dirk Huber',
    company: 'Telio Systems AG',
    startTime: '16:00',
    endTime: '16:20',
    type: 'call',
    meetingPrepReady: true,
  },
]

// ─── Signals ──────────────────────────────────────────────────────────────────

export const mockSignals: Signal[] = [
  {
    id: 's1',
    contactName: 'Anna Kruse',
    company: 'Pulse Analytics GmbH',
    signalType: 'churn_risk',
    message: '40% weniger Logins in den letzten 14 Tagen — Churn-Risiko hoch',
    timestamp: '2026-05-27T07:14:00Z',
    urgent: true,
  },
  {
    id: 's2',
    contactName: 'Dirk Huber',
    company: 'Telio Systems AG',
    signalType: 'upsell',
    message: 'Enrichment-Limit zu 87% ausgeschöpft — Upgrade auf Team-Plan empfohlen',
    timestamp: '2026-05-27T06:52:00Z',
    urgent: false,
  },
  {
    id: 's3',
    contactName: 'Petra Wolff',
    company: 'FinServ GmbH',
    signalType: 'no_contact',
    message: '68 Tage ohne Kontakt — Reaktivierung prüfen',
    timestamp: '2026-05-27T07:00:00Z',
    urgent: false,
  },
]

// ─── Jira Tickets ─────────────────────────────────────────────────────────────

export const mockJiraTickets: JiraTicket[] = [
  {
    id: 'j1',
    key: 'SHER-142',
    title: 'Enrichment-API gibt 503 bei >500 Requests',
    status: 'in_progress',
    priority: 'critical',
    company: 'Telio Systems AG',
    updatedDaysAgo: 0,
  },
  {
    id: 'j2',
    key: 'SHER-139',
    title: 'CSV-Export fehlt Pflichtfelder',
    status: 'open',
    priority: 'high',
    updatedDaysAgo: 2,
  },
  {
    id: 'j3',
    key: 'SHER-127',
    title: 'Dashboard-Ladezeit optimieren',
    status: 'in_progress',
    priority: 'medium',
    updatedDaysAgo: 5,
  },
  {
    id: 'j4',
    key: 'SHER-118',
    title: 'Dark Mode für Berichte',
    status: 'open',
    priority: 'low',
    updatedDaysAgo: 12,
  },
]

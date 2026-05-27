// ─── Navigation ───────────────────────────────────────────────────────────────

export type NavId =
  | 'mein-tag'
  | 'hunting'
  | 'farming'
  | 'marketing'
  | 'sherloq'
  | 'jira'

export type HuntingSubId = 'hunting-leads' | 'hunting-pipeline' | 'hunting-sequences' | 'hunting-outreach'
export type FarmingSubId = 'farming-customers' | 'farming-health' | 'farming-upsell' | 'farming-churn'
export type MarketingSubId = 'marketing-plan' | 'marketing-posts' | 'marketing-newsletter' | 'marketing-analytics'
export type SherloqSubId = 'sherloq-overview' | 'sherloq-usage' | 'sherloq-subs' | 'sherloq-plans'
export type JiraSubId = 'jira-tickets' | 'jira-epics' | 'jira-alerts'

export type SubNavId =
  | HuntingSubId
  | FarmingSubId
  | MarketingSubId
  | SherloqSubId
  | JiraSubId

// ─── Domain ───────────────────────────────────────────────────────────────────

export type HeatStatus = 'heiss' | 'warm' | 'lauwarm' | 'kalt' | 'tot'
export type DealStage =
  | 'backlog'
  | 'demo_vereinbart'
  | 'followup_offen'
  | 'onboarding_trial'
  | 'gewonnen'
  | 'verloren'
export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical'
export type PersonalityType = 'rot' | 'gelb' | 'gruen' | 'blau'
export type UserRole = 'solo' | 'hunter' | 'farmer' | 'admin'
export type CommunicationChannel = 'email' | 'call' | 'meeting' | 'slack' | 'teams' | 'linkedin'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  name: string
  company: string
  role: string
  email: string
  personality: PersonalityType
  heatStatus: HeatStatus
  lastContactDaysAgo: number
  kurzakte: string
  cluster: string[]
  engagementChain: CommunicationChannel[]  // last 5 touchpoints, newest first
}

export interface Company {
  id: string
  name: string
  cluster: string[]
  heatStatus: HeatStatus
  churnRisk: ChurnRisk
  kurzakte: string
  contacts: number
  mrr: number
}

export interface Deal {
  id: string
  title: string
  company: string
  stage: DealStage
  mrr: number
  contractMonths: number
  oneOff: number
  daysInStage: number
  hasOpenTask: boolean
}

export interface Task {
  id: string
  title: string
  contactName?: string
  company?: string
  dueDate: string          // ISO date string
  suggestedChannel?: CommunicationChannel
  suggestedMessage?: string
  status: 'open' | 'done' | 'deleted'
  priority: 'high' | 'normal' | 'low'
}

export interface CalendarEvent {
  id: string
  title: string
  contactName?: string
  company?: string
  startTime: string        // e.g. "09:00"
  endTime: string          // e.g. "09:30"
  type: 'meeting' | 'call' | 'demo' | 'internal'
  meetingPrepReady: boolean
}

export interface Signal {
  id: string
  contactName: string
  company: string
  signalType: 'login' | 'limit_warning' | 'churn_risk' | 'upsell' | 'no_contact'
  message: string
  timestamp: string
  urgent: boolean
}

export interface JiraTicket {
  id: string
  key: string              // e.g. "SHER-42"
  title: string
  status: 'open' | 'in_progress' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  company?: string
  updatedDaysAgo: number
}

export interface CurrentUser {
  id: string
  name: string
  initials: string
  email: string
  role: UserRole
}

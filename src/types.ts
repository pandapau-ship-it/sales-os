/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HeatStatus = 'HOT' | 'WARM' | 'LUKEWARM' | 'COLD' | 'DEAD';

export type SherloqStatus = 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'CANCELLED';

export type CommunicationChannel = 'EMAIL' | 'LINKEDIN' | 'SLACK' | 'TEAMS' | 'PHONE' | 'MEETING' | 'WHATSAPP';

export interface Person {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  avatarUrl?: string;
  initials: string;
}

export interface EngagementTouchpoint {
  channel: CommunicationChannel;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

export interface Lead {
  id: string;
  person: Person;
  kurzakte: string;
  fullTimeline: string[];
  engagementChain: CommunicationChannel[];
  lastTouchpoints: EngagementTouchpoint[];
  heatStatus: HeatStatus;
  heatScore: number; // 0 to 5
  icpScore?: number;
  lastActivity: string;
  pipelineStage: 'lead' | 'pipeline' | 'signal' | 'sequence' | 'trial';
  signalsCount?: number;
  contactEmail: string;
  dealValue?: number;
}

export interface Customer extends Lead {
  sherloqStatus: SherloqStatus;
  lastContactedAt: string; // Anzeige-Label „vor X Tagen" aus contacts.last_contacted_at (kein ISO-Ts). Früher irreführend „lastLogin".
  profilesAdded: number;
  subscriptionPlan?: 'Growth' | 'Enterprise' | 'Starter'; // undefined wenn companies.subscription_plan NULL (Honesty, kein Default)
  upsellOpportunity?: {
    potential: string;
    description: string;
    value: string;
  };
  // Echte Farmer-Scores (Migration 048; berechnet von den Score-Edge-Functions in Slice 2).
  // Optional + nullable: solange die Funktionen nicht laufen → undefined (Honesty: nicht anzeigen).
  churnScore?: number;    // 0-100 (contacts.churn_score)
  upsellScore?: number;   // 0-100 (contacts.upsell_score)
  healthScore?: number;   // 0-100 (contacts.health_score)
  healthStatus?: string;  // gesund | aufmerksamkeit | kritisch (contacts.health_status)
  mrrMonthly?: number;    // companies.mrr_monthly (Cent); NULL → undefined (Honesty)
  scoreDrivers?: { signal: string; points: number; source: string }[];   // contacts.score_drivers (Churn-Treiber)
  upsellDrivers?: { signal: string; points: number; source: string }[];  // contacts.upsell_drivers (Upsell-Treiber)
}

export interface TaskItemType {
  id: string;
  person: Person;
  title: string;
  isOverdue: boolean;
  recommendedChannel: CommunicationChannel;
  suggestedMessage: string;
  completed: boolean;
}

export interface PriorityItemType {
  id: string;
  num: number;
  signalType: 'urgent' | 'warning' | 'info';
  description: string;
  whyNow: string;
  actionPayload?: {
    type: 'contact' | 'review' | 'upgrade';
    targetId: string;
  };
}

export interface AppointmentItemType {
  id: string;
  time: string;
  person: Person;
  channels: CommunicationChannel[];
  purpose: string;
}

export interface KPIItemType {
  label: string;
  value: string | number;
  subtext: string;
  trend: {
    type: 'up' | 'down' | 'neutral';
    value: string;
  };
  sparkline: number[];
}

export interface AlertBannerType {
  id: string;
  type: 'churn' | 'upsell' | 'system';
  title: string;
  description: string;
}

export interface SignalEvent {
  id: string;
  person: Person;
  triggerType: 'usage_drop' | 'linkedin_post' | 'hiring_alert' | 'email_open';
  time: string;
  title: string;
  description: string;
  rawDetails: string;
}

export interface LinkedInPostIdea {
  id: string;
  topic: string;
  keywords: string[];
  suggestedByAI: boolean;
  draft?: string;
  status: 'draft' | 'published';
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Lead,
  Customer,
  TaskItemType,
  PriorityItemType,
  AppointmentItemType,
  KPIItemType,
  AlertBannerType,
  SignalEvent,
  LinkedInPostIdea
} from './types';

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    person: {
      id: 'pers-1',
      name: 'Dr. Christian Brand',
      jobTitle: 'VP of Sales EMEA',
      company: 'LogixFlow GmbH',
      initials: 'CB',
      avatarUrl: '/Bild1.jpeg'
    },
    kurzakte: 'Refactoring der Outreach-Struktur gestartet. Sucht Tool zur Senkung BDR Ramp-Up-Time.',
    fullTimeline: [
      '2026-05-10: Erstkontakt via LinkedIn. Christian zeigt Interesse an SDR-Coaching Features.',
      '2026-05-15: Demo-Call (30 Min). Vorgestellt wurde die Sherloq KI Kurzakte.',
      '2026-05-20: Follow-Up Mail mit Pricing gesendet.',
      '2026-05-24: Christian hat die Pricing-Tabelle geöffnet.'
    ],
    engagementChain: ['LINKEDIN', 'MEETING', 'EMAIL', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'LINKEDIN', date: 'vor 15 Tagen', sentiment: 'positive', summary: 'Erstkontakt positiv verlaufen' },
      { channel: 'MEETING', date: 'vor 10 Tagen', sentiment: 'positive', summary: '30-Minuten Demo-Session' },
      { channel: 'EMAIL', date: 'vor 5 Tagen', sentiment: 'neutral', summary: 'Pricing übersendet' },
      { channel: 'EMAIL', date: 'vor 1 Tag', sentiment: 'positive', summary: 'Pricing-Link geöffnet' }
    ],
    heatStatus: 'HOT',
    heatScore: 5,
    icpScore: 87,
    lastActivity: 'vor 1 Tag',
    pipelineStage: 'pipeline',
    contactEmail: 'c.brand@logixflow.de',
    dealValue: 12500
  },
  {
    id: 'lead-2',
    person: {
      id: 'pers-2',
      name: 'Sarah Jenkins',
      jobTitle: 'Head of Business Development',
      company: 'CloudSphere',
      initials: 'SJ',
      avatarUrl: '/bild w1.jpeg'
    },
    kurzakte: 'Vergleicht Sherloq mit Outreach.io. Budget für Q3 freigegeben, 15 User geplant.',
    fullTimeline: [
      '2026-05-12: Inbound Lead. Sarah sucht eine Lösung mit tieferer Salesforce/Hubspot Integration.',
      '2026-05-18: Erstes Briefing-Telefonat. Sehr scharfe Fragen zu DSGVO-Konformität.'
    ],
    engagementChain: ['EMAIL', 'PHONE'],
    lastTouchpoints: [
      { channel: 'EMAIL', date: 'vor 13 Tagen', sentiment: 'neutral', summary: 'Inbound-Anfrage erhalten' },
      { channel: 'PHONE', date: 'vor 7 Tagen', sentiment: 'positive', summary: 'Security- & DSGVO-Rücksprache' }
    ],
    heatStatus: 'WARM',
    heatScore: 4,
    icpScore: 65,
    lastActivity: 'vor 3 Tagen',
    pipelineStage: 'lead',
    contactEmail: 'sarah@cloudsphere.io',
    dealValue: 8000
  },
  {
    id: 'lead-3',
    person: {
      id: 'pers-3',
      name: 'Marc Levigne',
      jobTitle: 'Sales Director France',
      company: 'DataPulse Corp',
      initials: 'ML',
      avatarUrl: '/bild 2m.jpeg'
    },
    kurzakte: 'Frage nach mehrsprachiger Erstellung von Outbounds. Bedenken wegen Token-Verbrauch.',
    fullTimeline: [
      '2026-05-01: Vorstellung über unseren Partner.',
      '2026-05-05: Info-Runde via Slack.'
    ],
    engagementChain: ['LINKEDIN', 'SLACK', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'LINKEDIN', date: 'vor 24 Tagen', sentiment: 'neutral', summary: 'Connector angebahnt' },
      { channel: 'SLACK', date: 'vor 20 Tagen', sentiment: 'neutral', summary: 'Erste Specs geklärt' },
      { channel: 'EMAIL', date: 'vor 14 Tagen', sentiment: 'negative', summary: 'Keine Antwort auf Follow-Up' }
    ],
    heatStatus: 'LUKEWARM',
    heatScore: 3,
    icpScore: 41,
    lastActivity: 'vor 14 Tagen',
    pipelineStage: 'lead',
    contactEmail: 'marc.l@datapulse.fr',
    dealValue: 4500
  },
  {
    id: 'lead-4',
    person: {
      id: 'pers-4',
      name: 'Oliver Kahnert',
      jobTitle: 'Senior BDR Manager',
      company: 'TalentRadar',
      initials: 'OK',
      avatarUrl: '/bild m3.jpeg'
    },
    kurzakte: 'Hatte schlechtes Onboarding mit Mitbewerber. Möchte 1-monats Test-Szenario.',
    fullTimeline: [
      '2026-05-22: LinkedIn Post geliked. Direkt angeschrieben.',
      '2026-05-24: Schneller Dialog via LinkedIn Chat.'
    ],
    engagementChain: ['LINKEDIN', 'LINKEDIN'],
    lastTouchpoints: [
      { channel: 'LINKEDIN', date: 'vor 3 Tagen', sentiment: 'positive', summary: 'Post-Interaktion' },
      { channel: 'LINKEDIN', date: 'vor 1 Tag', sentiment: 'positive', summary: 'Testphase ins Spiel gebracht' }
    ],
    heatStatus: 'HOT',
    heatScore: 4,
    icpScore: 92,
    lastActivity: 'vor 1 Tag',
    pipelineStage: 'signal',
    contactEmail: 'o.kahnert@talentradar.de',
    dealValue: 18000
  },
  {
    id: 'lead-5',
    person: {
      id: 'pers-5',
      name: 'Heike Dettmann',
      jobTitle: 'Global Sales Ops Lead',
      company: 'InfraScale SA',
      initials: 'HD',
      avatarUrl: '/bild w2.jpeg'
    },
    kurzakte: 'Ghostet seit 3 Wochen. Evaluierung eventuell aufs nächste Fiskaljahr geschoben.',
    fullTimeline: [
      '2026-04-12: Demo-Termin gebucht.',
      '2026-04-20: Feedback war positiv, Entscheidung steht aber aus.'
    ],
    engagementChain: ['MEETING', 'PHONE', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'MEETING', date: 'vor 43 Tagen', sentiment: 'positive', summary: 'Ausführliche System-Vorstellung' },
      { channel: 'PHONE', date: 'vor 35 Tagen', sentiment: 'neutral', summary: 'Status-Call bezüglich Budget' },
      { channel: 'EMAIL', date: 'vor 21 Tagen', sentiment: 'neutral', summary: 'Follow-Up unbeantwortet' }
    ],
    heatStatus: 'COLD',
    heatScore: 1,
    icpScore: 55,
    lastActivity: 'vor 21 Tagen',
    pipelineStage: 'pipeline',
    contactEmail: 'h.dettmann@infrascale.ch',
    dealValue: 24000
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    person: {
      id: 'pers-11',
      name: 'Maximilian Krause',
      jobTitle: 'Director Account Management',
      company: 'PayGuard AG',
      initials: 'MK',
      avatarUrl: '/Bild1.jpeg'
    },
    kurzakte: 'Erfolgreich Ongeboardet. Team wächst rasant (+20 AMs in Q2). Sucht nach Upsell für Enterprise-Plan.',
    fullTimeline: [
      '2026-03-01: Go-Live mit Starter-Paket (30 Sitzplätze).',
      '2026-04-15: Feedback: Team nutzt den "Engagement-Chain Visualizer" täglich.',
      '2026-05-12: Gespräch über Enterprise-Add-Ons wie Custom LLM fine-tuning.'
    ],
    engagementChain: ['EMAIL', 'MEETING', 'SLACK', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'EMAIL', date: 'vor 3 Monaten', sentiment: 'positive', summary: 'Vertragsabschluss Starter' },
      { channel: 'MEETING', date: 'vor 40 Tagen', sentiment: 'positive', summary: 'Review-Termin nach 30 Tagen' },
      { channel: 'SLACK', date: 'vor 10 Tagen', sentiment: 'positive', summary: 'Support-Anfrage AM Integration geklärt' },
      { channel: 'EMAIL', date: 'vor 2 Tagen', sentiment: 'positive', summary: 'Enterprise-Infomaterial angefragt' }
    ],
    heatStatus: 'HOT',
    heatScore: 5,
    icpScore: 30,
    lastActivity: 'vor 2 Tagen',
    pipelineStage: 'pipeline',
    contactEmail: 'max.krause@payguard.io',
    dealValue: 50000,
    sherloqStatus: 'ACTIVE',
    lastLogin: 'vor 2 Stunden',
    profilesAdded: 142,
    subscriptionPlan: 'Growth',
    upsellOpportunity: {
      potential: 'Enterprise Upgrade',
      description: 'Zusätzliche Bereitstellung dedizierter AI Models & Teams-Integration für 50 Agents.',
      value: '+1.800€ MRR'
    }
  },
  {
    id: 'cust-2',
    person: {
      id: 'pers-12',
      name: 'Laura Becker',
      jobTitle: 'Head of Customer Success',
      company: 'Logistify DE',
      initials: 'LB',
      avatarUrl: '/bild w1.jpeg'
    },
    kurzakte: 'Kritisch. Churn Risk hoch da Daily Usage seit Rollout stark rückläufig ist. Letzter Contact vor 20 Tagen.',
    fullTimeline: [
      '2026-02-15: Vertragsbeginn Enterprise.',
      '2026-04-01: Laura meldet fehlendes AM-Reporting im Dashboard.',
      '2026-05-02: Support versucht Kontakt, weicht aber aus.'
    ],
    engagementChain: ['EMAIL', 'SLACK', 'PHONE', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'EMAIL', date: 'vor 90 Tagen', sentiment: 'positive', summary: 'Vertragserstellung abgeschlossen' },
      { channel: 'SLACK', date: 'vor 50 Tagen', sentiment: 'neutral', summary: 'AM-Featurewunsch geklärt' },
      { channel: 'PHONE', date: 'vor 20 Tagen', sentiment: 'negative', summary: 'CS-Lead blockiert' },
      { channel: 'EMAIL', date: 'vor 14 Tagen', sentiment: 'neutral', summary: 'Follow-up auf Usage-Verfall' }
    ],
    heatStatus: 'HOT',
    heatScore: 1,
    icpScore: 78,
    lastActivity: 'vor 14 Tagen',
    pipelineStage: 'pipeline',
    contactEmail: 'laura.becker@logistify.de',
    dealValue: 32000,
    sherloqStatus: 'CANCELLED',
    lastLogin: 'vor 14 Tagen',
    profilesAdded: 12,
    subscriptionPlan: 'Enterprise',
    upsellOpportunity: {
      potential: 'Re-Engagement Kampagne',
      description: 'Fokus-Onboarding-Session für AM-Teams anbieten, um die Core-Metrik anzuheben.',
      value: 'Sicherung 2.400€ MRR'
    }
  },
  {
    id: 'cust-3',
    person: {
      id: 'pers-13',
      name: 'Thomas Müller',
      jobTitle: 'BDR Enablement Specialist',
      company: 'HiringMate Ltd',
      initials: 'TM',
      avatarUrl: '/bild 2m.jpeg'
    },
    kurzakte: 'Onboarding läuft normal. Noch 4 Tage im Trial-Modus. Braucht Bestätigung für DSGVO.',
    fullTimeline: [
      '2026-05-01: Trial-Phase begonnen.',
      '2026-05-15: Erste KI outbounds generiert.'
    ],
    engagementChain: ['WHATSAPP', 'MEETING', 'EMAIL'],
    lastTouchpoints: [
      { channel: 'WHATSAPP', date: 'vor 20 Tagen', sentiment: 'positive', summary: 'Schneller Chat-Check' },
      { channel: 'MEETING', date: 'vor 10 Tagen', sentiment: 'positive', summary: 'DSGVO Setup' },
      { channel: 'EMAIL', date: 'vor 3 Tagen', sentiment: 'neutral', summary: 'Sicherheits-Attestate geteilt' }
    ],
    heatStatus: 'DEAD',
    heatScore: 1,
    icpScore: 49,
    lastActivity: 'vor 30 Tagen',
    pipelineStage: 'lead',
    contactEmail: 't.mueller@hiringmate.com',
    dealValue: 6000,
    sherloqStatus: 'ACTIVE', // Trial-Status kommt später mit Billing (D-Backlog) — Mock = aktiver Kunde
    lastLogin: 'vor 1 Tag',
    profilesAdded: 44,
    subscriptionPlan: 'Starter',
    upsellOpportunity: {
      potential: 'Trial Conversion',
      description: 'Upgrade-Diskussion gestartet. Fokus auf automatisierte LinkedIn-Outreach Sequenzen.',
      value: '+450€ MRR'
    }
  }
];

export const INITIAL_PRIORITIES: PriorityItemType[] = [
  {
    id: 'prio-1',
    num: 1,
    signalType: 'urgent',
    description: 'Laura Becker (Logistify) - Daily Active Profiles um 45% eingebrochen',
    whyNow: 'Hohes Churn Risk! Laura hat sich seit 14 Tagen nicht mehr eingeloggt, und die restlichen User sind inaktiv.',
    actionPayload: { type: 'review', targetId: 'cust-2' }
  },
  {
    id: 'prio-2',
    num: 2,
    signalType: 'info',
    description: 'Christian Brand (LogixFlow) hat das Pricing-PDF zum 3. Mal geöffnet',
    whyNow: 'Sichere Kaufabsicht. Christian hat soeben via self-service den Lead-Heat-Score auf 5 angehoben.',
    actionPayload: { type: 'contact', targetId: 'lead-1' }
  },
  {
    id: 'prio-3',
    num: 3,
    signalType: 'warning',
    description: 'Testphase von Thomas Müller (HiringMate) läuft in 4 Tagen ab',
    whyNow: 'Thomas hat bereits 44 Profile angelegt und die Trial-Ziele erreicht. Jetzt für den Abschluss kontaktieren.',
    actionPayload: { type: 'upgrade', targetId: 'cust-3' }
  },
  {
    id: 'prio-4',
    num: 4,
    signalType: 'info',
    description: 'Sarah Jenkins (CloudSphere) hat deine letzte LinkedIn-Message gelesen',
    whyNow: 'Sarah hat vor 5 Stunden den LinkedIn-Verlauf geprüft. Perfekter Zeitpunkt für ein kurzes Telefonat.',
    actionPayload: { type: 'contact', targetId: 'lead-2' }
  }
];

export const INITIAL_APPOINTMENTS: AppointmentItemType[] = [
  {
    id: 'app-1',
    time: '10:00',
    person: {
      id: 'pers-11',
      name: 'Maximilian Krause',
      jobTitle: 'Director AM',
      company: 'PayGuard AG',
      initials: 'MK'
    },
    channels: ['EMAIL', 'MEETING', 'SLACK'],
    purpose: 'Enterprise Expansion & AI Fine-Tuning Demo'
  },
  {
    id: 'app-2',
    time: '14:30',
    person: {
      id: 'pers-1',
      name: 'Dr. Christian Brand',
      jobTitle: 'VP of Sales',
      company: 'LogixFlow GmbH',
      initials: 'CB'
    },
    channels: ['LINKEDIN', 'EMAIL'],
    purpose: 'Letzte Review-Runde & SLA Abgleich'
  },
  {
    id: 'app-3',
    time: '16:00',
    person: {
      id: 'pers-2',
      name: 'Sarah Jenkins',
      jobTitle: 'Head of BD',
      company: 'CloudSphere',
      initials: 'SJ'
    },
    channels: ['EMAIL', 'PHONE'],
    purpose: 'Präsentation DSGVO Zertifikat & Onboarding Plan'
  }
];

export const INITIAL_TASKS: TaskItemType[] = [
  {
    id: 'task-1',
    person: {
      id: 'pers-1',
      name: 'Dr. Christian Brand',
      jobTitle: 'VP of Sales',
      company: 'LogixFlow',
      initials: 'CB'
    },
    title: 'Mustervertrag senden & Feedback einholen',
    isOverdue: true,
    recommendedChannel: 'EMAIL',
    suggestedMessage: 'Hallo Christian,\nich hoffe, du hattest einen guten Start in die Woche. Anbei findest du den gewünschten Entwurf unserer SLA und des Lizenzvertrages für deine Prüfung. Bei Fragen stehe ich dir jederzeit zur Verfügung.\n\nBeste Grüße,\nSDR Team Sherloq',
    completed: false
  },
  {
    id: 'task-2',
    person: {
      id: 'pers-12',
      name: 'Laura Becker',
      jobTitle: 'Head of CS',
      company: 'Logistify DE',
      initials: 'LB'
    },
    title: 'Sonder-Onboarding für Logistify Team anstoßen',
    isOverdue: false,
    recommendedChannel: 'SLACK',
    suggestedMessage: 'Hi Laura,\nich habe gesehen, dass die täglichen Active Profiles etwas rückläufig sind. Sollen wir morgen eine schnelle AM-Best-Practices Session mit eurem Kernteam machen? Ich könnte spontan um 11 Uhr einspringen.\n\nLiebe Grüße,\nSherloq Account Support',
    completed: false
  },
  {
    id: 'task-3',
    person: {
      id: 'pers-3',
      name: 'Marc Levigne',
      jobTitle: 'Sales Director',
      company: 'DataPulse Corp',
      initials: 'ML'
    },
    title: 'Follow-Up bezüglich mehrsprachigem Outbound-Generator',
    isOverdue: false,
    recommendedChannel: 'LINKEDIN',
    suggestedMessage: 'Bonjour Marc,\nI hope you are doing well. I wondered if the specifications regarding international workflows are clear, or if a quick sync on Token allocation in EMEA was still needed?\n\nCordially,\nSDR Lead France',
    completed: false
  }
];

export const INITIAL_KPIS: KPIItemType[] = [
  {
    label: 'LEADS AKTIV',
    value: 5,
    subtext: 'In Bearbeitung',
    trend: { type: 'up', value: '+15%' },
    sparkline: [2, 3, 3, 4, 3, 5, 5]
  },
  {
    label: 'HOT LEADS IN PIPELINE',
    value: 2,
    subtext: 'Kaufbereit',
    trend: { type: 'up', value: '+50%' },
    sparkline: [1, 1, 2, 1, 2, 2, 2]
  },
  {
    label: 'CHURN RISK WARNUNGEN',
    value: 1,
    subtext: 'Eskalationsmodus',
    trend: { type: 'down', value: '-80%' },
    sparkline: [5, 4, 3, 2, 2, 1, 1]
  },
  {
    label: 'OPEN TASKS OVERDUE',
    value: 1,
    subtext: 'Überfällig',
    trend: { type: 'neutral', value: '±0' },
    sparkline: [1, 2, 1, 1, 2, 1, 1]
  }
];

export const INITIAL_ALERT_BANNERS: AlertBannerType[] = [
  {
    id: 'alert-1',
    type: 'churn',
    title: '⚠️ Churn Risk: Logistify DE (Laura Becker)',
    description: 'Seit 14 Tagen kein Kontakt · Letzter Login vor 21d'
  }
];

export const INITIAL_SIGNALS: SignalEvent[] = [
  {
    id: 'sig-1',
    person: {
      id: 'pers-1',
      name: 'Dr. Christian Brand',
      jobTitle: 'VP of Sales',
      company: 'LogixFlow GmbH',
      initials: 'CB'
    },
    triggerType: 'email_open',
    time: 'vor 10 Minuten',
    title: 'Email geöffnet: "SLA Entwurf LogixFlow"',
    description: 'Christian hat deine E-Mail zum 3. Mal geöffnet. Zeit für proaktives Outreach.',
    rawDetails: 'Subject: SLA Entwurf LogixFlow. Genutzt: Chrome Desktop, IP: 89.12.188.4. Verbleibende Actions: Contract Review.'
  },
  {
    id: 'sig-2',
    person: {
      id: 'pers-4',
      name: 'Oliver Kahnert',
      jobTitle: 'Senior BDR Manager',
      company: 'TalentRadar',
      initials: 'OK'
    },
    triggerType: 'linkedin_post',
    time: 'vor 2 Stunden',
    title: 'LinkedIn Post: BDR Ramp-Up Herausforderung',
    description: 'Oliver beklagt auf LinkedIn die lange Ramp-Up Zeit von BDRs in Remote-Szenarien.',
    rawDetails: 'Post: "Wir merken, dass Newcomer remote fast 5 Monate brauchen, um produktiv zu werden. Das muss schneller gehen..."'
  },
  {
    id: 'sig-3',
    person: {
      id: 'pers-12',
      name: 'Laura Becker',
      jobTitle: 'Head of CS',
      company: 'Logistify DE',
      initials: 'LB'
    },
    triggerType: 'usage_drop',
    time: 'vor 1 Tag',
    title: 'Ausbleibende Login-Metrik bei 12 Accounts',
    description: 'Unternehmen Logistify verzeichnet sinkende Kurven bei AM-Nutzung.',
    rawDetails: 'Usage metrics are falling. Baseline: 80 logins/week. Current: 4 logins/week.'
  }
];

export const INITIAL_MARKETING_IDEAS: LinkedInPostIdea[] = [
  {
    id: 'idea-1',
    topic: 'Sicherer Outbound-Prozess für B2B SaaS',
    keywords: ['SDR Enablement', 'Outreach.io Alternative', 'SDR Kurzakte'],
    suggestedByAI: true,
    draft: '🔍 Warum die meisten Vertriebler an unpersönlichem Outbound scheitern...\n\nHeutzutage kriegen Entscheider täglich 20 lieblose LinkedIn Mails. Der Schlüssel liegt in der proaktiven Kurzakte: Nur ein kurzer Blick auf relevante Bios und Firmenänderungen, gepaart mit einer Engagement-Kette der letzten Kanäle.\n\nWie handhabt ihr BDR-Ramping remote?',
    status: 'draft'
  },
  {
    id: 'idea-2',
    topic: 'How to save Customer Success from AM Silos',
    keywords: ['Customer Success', 'Churn Prevention', 'Usage Analytics'],
    suggestedByAI: true,
    draft: '⚠️ Warum Customer Success und Account Management oft nebeneinander vorbei reden...\n\nCS-Teams sehen schlechte Usage-Kurven; AM-Teams reden über Preisrunden. Integration beider Welten ist die einzige Churn-Prävention! Sherloqs AM Dashboard zeigt sofort an, wer im Trial-Szenario aktiv ist und wo Handlungsbedarf droht.',
    status: 'draft'
  }
];

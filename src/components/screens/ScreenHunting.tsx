import { useState } from 'react'
import { ChevronDown, AlertCircle, Plus } from 'lucide-react'
import type { HuntingSubId } from '@/types'
import { mockContacts, mockDeals } from '@/data'
import { HeatDot } from '@/components/shared/HeatDot'
import { EngagementChain } from '@/components/shared/EngagementChain'
import { PersonalityBadge } from '@/components/shared/PersonalityBadge'
import { cn } from '@/lib/utils'

const STAGE_LABELS: Record<string, string> = {
  backlog:           'Backlog',
  demo_vereinbart:   'Demo vereinbart',
  followup_offen:    'Follow-up offen',
  onboarding_trial:  'Onboarding / Trial',
  gewonnen:          'Gewonnen',
  verloren:          'Verloren',
}

const STAGE_COLORS: Record<string, string> = {
  backlog:           '#ADB5BD',
  demo_vereinbart:   '#125455',
  followup_offen:    '#F59E0B',
  onboarding_trial:  '#2563EB',
  gewonnen:          '#10B961',
  verloren:          '#E11D48',
}

interface ScreenHuntingProps {
  activeSubItem: HuntingSubId | null
}

export function ScreenHunting({ activeSubItem }: ScreenHuntingProps) {
  const view = activeSubItem ?? 'hunting-leads'

  if (view === 'hunting-pipeline') return <PipelineView />
  return <LeadListeView />
}

// ─── Lead-Liste ───────────────────────────────────────────────────────────────

function LeadListeView() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--sherloq-text)' }}>Lead-Liste</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--sherloq-text-muted)' }}>
            {mockContacts.length} Kontakte · nach Heat Status sortiert
          </p>
        </div>
        <button type="button"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #125455, #3f8383)' }}>
          <Plus size={13} strokeWidth={2.5} />
          Neuer Lead
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--sherloq-shadow-card)', backgroundColor: 'var(--sherloq-surface)' }}>

        {/* Column headers */}
        <div className="grid px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', color: 'var(--sherloq-text-muted)', borderBottom: '1px solid var(--sherloq-border)' }}>
          <span>Kontakt / Firma</span>
          <span>Kurzakte</span>
          <span>Letzter Kontakt</span>
          <span>Touchpoints</span>
          <span>Typ</span>
          <span></span>
        </div>

        {/* Rows */}
        {mockContacts.map(contact => (
          <div key={contact.id}>

            {/* Level 1 — always visible */}
            <div
              className="grid px-4 py-3 items-center cursor-pointer transition-colors hover:bg-[#FAFAFA]"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--sherloq-border)' }}
              onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
            >
              {/* Name + company + heat */}
              <div className="flex items-center gap-2.5 min-w-0">
                <HeatDot status={contact.heatStatus} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--sherloq-text)' }}>{contact.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--sherloq-text-muted)' }}>{contact.company}</p>
                </div>
              </div>

              {/* Kurzakte — one liner */}
              <p className="text-xs truncate pr-4" style={{ color: 'var(--sherloq-text-muted)' }}>{contact.kurzakte}</p>

              {/* Last contact */}
              <p className={cn('text-xs', contact.lastContactDaysAgo > 30 ? 'font-medium' : '')}
                style={{ color: contact.lastContactDaysAgo > 30 ? '#E11D48' : contact.lastContactDaysAgo > 14 ? '#F59E0B' : 'var(--sherloq-text-muted)' }}>
                {contact.lastContactDaysAgo === 0 ? 'Heute' : `vor ${contact.lastContactDaysAgo}d`}
              </p>

              {/* Engagement chain */}
              <EngagementChain channels={contact.engagementChain} />

              {/* Personality */}
              <PersonalityBadge type={contact.personality} />

              {/* Expand arrow */}
              <ChevronDown size={14} strokeWidth={1.7}
                className={cn('ml-auto transition-transform', expandedId === contact.id ? 'rotate-180' : '')}
                style={{ color: 'var(--sherloq-text-muted)' }} />
            </div>

            {/* Level 2 — inline expand */}
            {expandedId === contact.id && (
              <div className="px-4 py-4 space-y-3" style={{ backgroundColor: '#F8FAFA', borderBottom: '1px solid var(--sherloq-border)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sherloq-text)' }}>{contact.kurzakte}</p>
                <div className="flex gap-2">
                  <button type="button" className="rounded-full px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #125455, #3f8383)' }}>
                    Follow-up schreiben
                  </button>
                  <button type="button" className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#E9ECEF]"
                    style={{ backgroundColor: 'var(--sherloq-border)', color: 'var(--sherloq-text)' }}>
                    Task erstellen
                  </button>
                  <button type="button" className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#E9ECEF]"
                    style={{ backgroundColor: 'var(--sherloq-border)', color: 'var(--sherloq-text)' }}>
                    Deal anlegen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pipeline / Kanban ────────────────────────────────────────────────────────

const PIPELINE_COLUMNS = ['backlog', 'demo_vereinbart', 'followup_offen', 'onboarding_trial', 'gewonnen'] as const

function PipelineView() {
  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex items-start gap-3 min-w-max">
        {PIPELINE_COLUMNS.map(stage => {
          const stageDeals = mockDeals.filter(d => d.stage === stage)
          const stageColor = STAGE_COLORS[stage]
          return (
            <div key={stage} className="w-[240px] flex-shrink-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stageColor }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--sherloq-text)' }}>{STAGE_LABELS[stage]}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--sherloq-text-muted)' }}>{stageDeals.length}</span>
              </div>

              {/* Deal cards */}
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <div key={deal.id} className="rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: 'var(--sherloq-surface)', boxShadow: 'var(--sherloq-shadow-card)', border: '1px solid var(--sherloq-border)' }}>
                    <p className="text-sm font-medium leading-tight mb-1" style={{ color: 'var(--sherloq-text)' }}>{deal.title}</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--sherloq-text-muted)' }}>{deal.company}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: 'var(--sherloq-primary)' }}>
                        {deal.mrr > 0 ? `€${deal.mrr.toLocaleString('de')}/Mo` : '—'}
                      </span>
                      {!deal.hasOpenTask && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#F59E0B' }}>
                          <AlertCircle size={10} strokeWidth={2.5} />
                          Keine Task
                        </span>
                      )}
                    </div>
                    {deal.daysInStage > 10 && (
                      <p className="text-[10px] mt-1.5" style={{ color: '#E11D48' }}>
                        {deal.daysInStage}d in dieser Stage
                      </p>
                    )}
                  </div>
                ))}

                {/* Empty column placeholder */}
                {stageDeals.length === 0 && (
                  <div className="rounded-xl p-4 text-center"
                    style={{ border: '1px dashed var(--sherloq-border)', color: 'var(--sherloq-text-muted)' }}>
                    <p className="text-xs">Kein Deal</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

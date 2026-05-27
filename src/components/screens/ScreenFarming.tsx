import { TrendingUp, AlertTriangle } from 'lucide-react'
import { mockCompanies } from '@/data'
import { HeatDot } from '@/components/shared/HeatDot'
import type { FarmingSubId } from '@/types'

const CHURN_COLORS: Record<string, string> = {
  low:      '#10B961',
  medium:   '#F59E0B',
  high:     '#E11D48',
  critical: '#7C3AED',
}

const CHURN_LABELS: Record<string, string> = {
  low:      'Gering',
  medium:   'Mittel',
  high:     'Hoch',
  critical: 'Kritisch',
}

interface ScreenFarmingProps {
  activeSubItem: FarmingSubId | null
}

export function ScreenFarming({ activeSubItem }: ScreenFarmingProps) {
  const customers = mockCompanies.filter(c => c.cluster.includes('Customer'))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div>
        <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--sherloq-text)' }}>
          {activeSubItem === 'farming-churn' ? 'Churn Monitor' :
           activeSubItem === 'farming-upsell' ? 'Upsell-Potenziale' :
           activeSubItem === 'farming-health' ? 'Health Monitor' : 'Kundenliste'}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sherloq-text-muted)' }}>
          {customers.length} Bestandskunden
        </p>
      </div>

      {/* Risk alerts */}
      {(activeSubItem === 'farming-churn' || !activeSubItem) && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} strokeWidth={2} style={{ color: '#F59E0B' }} />
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>Churn-Risiko erkannt</p>
          </div>
          {customers.filter(c => c.churnRisk === 'high' || c.churnRisk === 'critical').map(c => (
            <p key={c.id} className="text-xs" style={{ color: '#92400E' }}>
              {c.name} — {c.kurzakte}
            </p>
          ))}
        </div>
      )}

      {/* Customer table */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--sherloq-shadow-card)', backgroundColor: 'var(--sherloq-surface)' }}>
        <div className="grid px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', color: 'var(--sherloq-text-muted)', borderBottom: '1px solid var(--sherloq-border)' }}>
          <span>Firma</span>
          <span>Kurzakte</span>
          <span>MRR</span>
          <span>Heat</span>
          <span>Churn-Risiko</span>
        </div>

        {customers.map(company => (
          <div key={company.id}
            className="grid px-4 py-3 items-center cursor-pointer transition-colors hover:bg-[#FAFAFA]"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', borderBottom: '1px solid var(--sherloq-border)' }}>

            <div className="flex items-center gap-2">
              <HeatDot status={company.heatStatus} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--sherloq-text)' }}>{company.name}</p>
                <p className="text-xs" style={{ color: 'var(--sherloq-text-muted)' }}>{company.contacts} Kontakte</p>
              </div>
            </div>

            <p className="text-xs truncate pr-4" style={{ color: 'var(--sherloq-text-muted)' }}>{company.kurzakte}</p>

            <p className="text-sm font-semibold" style={{ color: 'var(--sherloq-primary)' }}>
              €{company.mrr.toLocaleString('de')}
            </p>

            <HeatDot status={company.heatStatus} showLabel />

            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} strokeWidth={2} style={{ color: CHURN_COLORS[company.churnRisk] }} />
              <span className="text-xs font-medium" style={{ color: CHURN_COLORS[company.churnRisk] }}>
                {CHURN_LABELS[company.churnRisk]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

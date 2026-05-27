import { AlertCircle, TrendingUp, Calendar, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { mockTasks, mockCalendar, mockSignals } from '@/data'
import { HeatDot } from '@/components/shared/HeatDot'
import { ChannelIcon } from '@/components/shared/ChannelIcon'

export function ScreenMyDay() {
  const urgentTasks = mockTasks.filter(t => t.priority === 'high' && t.status === 'open')
  const urgentSignals = mockSignals.filter(s => s.urgent)
  const todayEvents = mockCalendar

  return (
    <div className="max-w-4xl mx-auto space-y-5 p-6">

      {/* ── Greeting header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--sherloq-text)' }}>
          Guten Morgen, Oliver
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--sherloq-text-muted)' }}>
          Dienstag, 27. Mai 2026 · {urgentTasks.length} offene Prioritäten · {todayEvents.length} Termine heute
        </p>
      </div>

      {/* ── Signal alerts ──────────────────────────────────────────────── */}
      {urgentSignals.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#FFF4F4', border: '1px solid #FFE4E4' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#E11D48' }}>
            ⚠ Sofortiger Handlungsbedarf
          </p>
          {urgentSignals.map(signal => (
            <div key={signal.id} className="flex items-start gap-3">
              <AlertCircle size={15} strokeWidth={2} className="mt-0.5 flex-shrink-0" style={{ color: '#E11D48' }} />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--sherloq-text)' }}>
                  {signal.contactName} · {signal.company}
                </span>
                <p className="text-sm" style={{ color: 'var(--sherloq-text-muted)' }}>{signal.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">

        {/* ── Today's calendar ────────────────────────────────────────── */}
        <div className="col-span-1 rounded-2xl p-4 space-y-2"
          style={{ backgroundColor: 'var(--sherloq-surface)', boxShadow: 'var(--sherloq-shadow-card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} strokeWidth={2} style={{ color: 'var(--sherloq-primary)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sherloq-text-muted)' }}>
              Heute
            </span>
          </div>
          {todayEvents.map(event => (
            <div key={event.id} className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: 'var(--sherloq-border)' }}>
              <div className="flex-shrink-0 text-right w-10">
                <p className="text-xs font-semibold" style={{ color: 'var(--sherloq-text)' }}>{event.startTime}</p>
                <p className="text-[10px]" style={{ color: 'var(--sherloq-text-muted)' }}>{event.endTime}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate" style={{ color: 'var(--sherloq-text)' }}>
                  {event.title}
                </p>
                {event.contactName && (
                  <p className="text-xs truncate" style={{ color: 'var(--sherloq-text-muted)' }}>{event.contactName}</p>
                )}
              </div>
              {event.meetingPrepReady && (
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sherloq-primary)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Priority tasks ───────────────────────────────────────────── */}
        <div className="col-span-2 rounded-2xl p-4"
          style={{ backgroundColor: 'var(--sherloq-surface)', boxShadow: 'var(--sherloq-shadow-card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} strokeWidth={2} style={{ color: 'var(--sherloq-primary)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sherloq-text-muted)' }}>
              Prioritäten
            </span>
          </div>
          <div className="space-y-2">
            {urgentTasks.map(task => (
              <div key={task.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors hover:bg-[#F8F9FA] group">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#E11D48' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--sherloq-text)' }}>{task.title}</p>
                  {task.company && (
                    <p className="text-xs truncate" style={{ color: 'var(--sherloq-text-muted)' }}>
                      {task.contactName} · {task.company}
                    </p>
                  )}
                </div>
                {task.suggestedChannel && (
                  <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs flex-shrink-0"
                    style={{ backgroundColor: 'var(--sherloq-primary-light)', color: 'var(--sherloq-primary)' }}>
                    <ChannelIcon channel={task.suggestedChannel} size={11} />
                    <span className="capitalize">{task.suggestedChannel}</span>
                  </div>
                )}
                <ChevronRight size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--sherloq-text-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upsell signals ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4"
        style={{ backgroundColor: 'var(--sherloq-surface)', boxShadow: 'var(--sherloq-shadow-card)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} strokeWidth={2} style={{ color: '#10B961' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sherloq-text-muted)' }}>
            Signale & Chancen
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {mockSignals.filter(s => !s.urgent).map(signal => (
            <div key={signal.id} className="rounded-xl p-3 cursor-pointer transition-colors hover:bg-[#F8F9FA]"
              style={{ border: '1px solid var(--sherloq-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <HeatDot status="warm" />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--sherloq-text)' }}>
                  {signal.contactName}
                </span>
              </div>
              <p className="text-xs leading-snug" style={{ color: 'var(--sherloq-text-muted)' }}>{signal.message}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

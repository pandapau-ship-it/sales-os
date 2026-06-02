import type { HeatStatus } from '@/types'

// Colors reference CSS tokens from index.css :root — never hardcode here.
// Keys match the HeatStatus type: HOT | WARM | LUKEWARM | COLD | DEAD
const HEAT_CONFIG: Record<HeatStatus, { color: string; bg: string; label: string }> = {
  HOT:      { color: 'var(--signal-success-text)', bg: 'var(--signal-success-bg)', label: 'Aktiv'      },
  WARM:     { color: 'var(--signal-warm-text)',     bg: 'var(--signal-warm-bg)',    label: 'Stabil'     },
  LUKEWARM: { color: 'var(--signal-warn-text)',     bg: 'var(--signal-warn-bg)',    label: 'Rückläufig' },
  COLD:     { color: 'var(--signal-cold-text)',     bg: 'var(--signal-cold-bg)',    label: 'Ruhend'     },
  DEAD:     { color: 'var(--text-muted)',            bg: 'var(--app-bg)',            label: 'Inaktiv'    },
}

interface HeatDotProps {
  status: HeatStatus
  showLabel?: boolean
  size?: number
}

export function HeatDot({ status, showLabel = false, size = 8 }: HeatDotProps) {
  const config = HEAT_CONFIG[status]

  if (showLabel) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <span
          className="rounded-pill flex-shrink-0"
          style={{ width: size, height: size, backgroundColor: config.color }}
        />
        {config.label}
      </span>
    )
  }

  return (
    <span
      title={config.label}
      className="rounded-pill flex-shrink-0 block"
      style={{ width: size, height: size, backgroundColor: config.color }}
    />
  )
}

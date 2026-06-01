import type { HeatStatus } from '@/types'

// Colors reference CSS tokens from index.css :root — never hardcode here.
// Note: HeatDot uses legacy keys (heiss/warm/lauwarm/kalt/tot).
// For HOT/WARM/LUKEWARM/COLD badges use getHeatColor() from @/lib/heatUtils instead.
const HEAT_CONFIG: Record<HeatStatus, { color: string; bg: string; label: string }> = {
  heiss:   { color: 'var(--signal-urgent-text)', bg: 'var(--signal-urgent-bg)', label: 'Heiß'     },
  warm:    { color: 'var(--signal-warn-text)',    bg: 'var(--signal-warn-bg)',   label: 'Warm'     },
  lauwarm: { color: 'var(--signal-info-text)',    bg: 'var(--signal-info-bg)',   label: 'Lauwarm'  },
  kalt:    { color: 'var(--signal-cold-text)',    bg: 'var(--signal-cold-bg)',   label: 'Kalt'     },
  tot:     { color: 'var(--text-muted)',          bg: 'var(--app-bg)',           label: 'Tot'      },
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

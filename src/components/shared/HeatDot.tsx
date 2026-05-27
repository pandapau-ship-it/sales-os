import type { HeatStatus } from '@/types'

const HEAT_CONFIG: Record<HeatStatus, { color: string; bg: string; label: string }> = {
  heiss:   { color: '#E11D48', bg: '#FEF4E9', label: 'Heiß'     },
  warm:    { color: '#F59E0B', bg: '#FEF3C7', label: 'Warm'     },
  lauwarm: { color: '#2563EB', bg: '#DBEAFE', label: 'Lauwarm'  },
  kalt:    { color: '#8B5CF6', bg: '#EDE9FE', label: 'Kalt'     },
  tot:     { color: '#9CA3AF', bg: '#F3F4F6', label: 'Tot'      },
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
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: size, height: size, backgroundColor: config.color }}
        />
        {config.label}
      </span>
    )
  }

  return (
    <span
      title={config.label}
      className="rounded-full flex-shrink-0 block"
      style={{ width: size, height: size, backgroundColor: config.color }}
    />
  )
}

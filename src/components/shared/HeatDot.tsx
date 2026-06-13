import type { HeatStatus } from '@/types'
import { heatFor } from '@/lib/constants'

// Labels & Dot-Farbe kommen aus HEAT_STATUS (src/lib/constants.ts).
// Badge-Hintergrund = leichte Tönung der Heat-Farbe (color-mix, token-basiert).

interface HeatDotProps {
  status: HeatStatus
  showLabel?: boolean
  size?: number
}

export function HeatDot({ status, showLabel = false, size = 8 }: HeatDotProps) {
  const heat = heatFor(status)

  if (showLabel) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: `color-mix(in srgb, ${heat.color} 12%, transparent)`, color: heat.color }}
      >
        <span
          className="rounded-pill flex-shrink-0"
          style={{ width: size, height: size, backgroundColor: heat.color }}
        />
        {heat.label}
      </span>
    )
  }

  return (
    <span
      title={heat.label}
      className="rounded-pill flex-shrink-0 block"
      style={{ width: size, height: size, backgroundColor: heat.color }}
    />
  )
}

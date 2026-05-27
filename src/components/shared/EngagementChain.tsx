import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { CommunicationChannel } from '@/types'

const CHANNEL_ICONS: Record<CommunicationChannel, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  email:   Mail,
  call:    Phone,
  meeting: Video,
  slack:   MessageSquare,
  teams:   MessageSquare,
  linkedin: Link2,
}

const CHANNEL_COLORS: Record<CommunicationChannel, string> = {
  email:    '#2563EB',
  call:     '#10B961',
  meeting:  '#8B5CF6',
  slack:    '#F59E0B',
  teams:    '#7C3AED',
  linkedin: '#0A66C2',
}

interface EngagementChainProps {
  channels: CommunicationChannel[]
  max?: number
}

// Renders last N touchpoints as colored icons, newest first = leftmost
export function EngagementChain({ channels, max = 5 }: EngagementChainProps) {
  const visible = channels.slice(0, max)

  return (
    <div className="flex items-center gap-1">
      {visible.map((ch, i) => {
        const Icon = CHANNEL_ICONS[ch]
        return (
          <div
            key={i}
            title={ch}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: `${CHANNEL_COLORS[ch]}18`, color: CHANNEL_COLORS[ch] }}
          >
            <Icon size={11} strokeWidth={2} />
          </div>
        )
      })}
    </div>
  )
}

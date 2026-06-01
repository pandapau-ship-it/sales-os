import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { CommunicationChannel } from '@/types'

const CHANNEL_ICONS: Record<CommunicationChannel, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  email:    Mail,
  call:     Phone,
  meeting:  Video,
  slack:    MessageSquare,
  teams:    MessageSquare,
  linkedin: Link2,
}

// Colors reference CSS tokens from index.css :root — never hardcode here.
const CHANNEL_COLORS: Record<CommunicationChannel, string> = {
  email:    'var(--channel-email)',
  call:     'var(--channel-call)',
  meeting:  'var(--channel-meeting)',
  slack:    'var(--channel-slack)',
  teams:    'var(--channel-teams)',
  linkedin: 'var(--channel-linkedin)',
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
        const color = CHANNEL_COLORS[ch]
        return (
          <div
            key={i}
            title={ch}
            className="flex h-5 w-5 items-center justify-center rounded-pill"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
          >
            <Icon size={11} strokeWidth={2} />
          </div>
        )
      })}
    </div>
  )
}

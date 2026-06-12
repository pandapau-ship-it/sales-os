import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { CommunicationChannel } from '@/types'
import BrandLogo, { brandForChannel } from '@/components/shared/BrandLogo'

const CHANNEL_ICONS: Record<CommunicationChannel, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  EMAIL:    Mail,
  PHONE:    Phone,
  MEETING:  Video,
  SLACK:    MessageSquare,
  TEAMS:    MessageSquare,
  LINKEDIN: Link2,
  WHATSAPP: MessageSquare,
}

// Colors reference CSS tokens from index.css :root — never hardcode here.
const CHANNEL_COLORS: Record<CommunicationChannel, string> = {
  EMAIL:    'var(--channel-email)',
  PHONE:    'var(--channel-call)',
  MEETING:  'var(--channel-meeting)',
  SLACK:    'var(--channel-slack)',
  TEAMS:    'var(--channel-teams)',
  LINKEDIN: 'var(--channel-linkedin)',
  WHATSAPP: 'var(--channel-slack)',
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
        // Marken-Logo wo es einen Anbieter gibt (Mail/Meeting/Teams/LinkedIn),
        // sonst getöntes Lucide-Icon (Telefon/Slack/WhatsApp).
        const brand = brandForChannel(ch)
        if (brand) {
          return <BrandLogo key={i} name={brand} className="h-5 w-5 rounded-[5px] object-contain" />
        }
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

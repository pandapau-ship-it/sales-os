import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { CommunicationChannel } from '@/types'
import BrandLogo, { brandForChannel } from '@/components/shared/BrandLogo'

const ICONS: Record<CommunicationChannel, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  EMAIL:    Mail,
  PHONE:    Phone,
  MEETING:  Video,
  SLACK:    MessageSquare,
  TEAMS:    MessageSquare,
  LINKEDIN: Link2,
  WHATSAPP: MessageSquare,
}

interface ChannelIconProps {
  channel: CommunicationChannel
  size?: number
  strokeWidth?: number
}

export function ChannelIcon({ channel, size = 13, strokeWidth = 2 }: ChannelIconProps) {
  // Marken-Logo wo es einen Anbieter gibt, sonst neutrales Lucide-Icon.
  const brand = brandForChannel(channel)
  if (brand) {
    return (
      <span className="inline-flex shrink-0" style={{ width: size + 4, height: size + 4 }}>
        <BrandLogo name={brand} className="w-full h-full rounded-[4px] object-contain" />
      </span>
    )
  }
  const Icon = ICONS[channel]
  return <Icon size={size} strokeWidth={strokeWidth} />
}

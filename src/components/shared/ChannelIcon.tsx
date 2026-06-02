import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { CommunicationChannel } from '@/types'

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
  const Icon = ICONS[channel]
  return <Icon size={size} strokeWidth={strokeWidth} />
}

import { Mail, Phone, Video, MessageSquare, Link2 } from 'lucide-react'
import type { CommunicationChannel } from '@/types'

const ICONS: Record<CommunicationChannel, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  email:    Mail,
  call:     Phone,
  meeting:  Video,
  slack:    MessageSquare,
  teams:    MessageSquare,
  linkedin: Link2,
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

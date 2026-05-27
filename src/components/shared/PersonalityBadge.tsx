import type { PersonalityType } from '@/types'

const CONFIG: Record<PersonalityType, { label: string; color: string; bg: string }> = {
  rot:   { label: 'Rot',  color: '#E11D48', bg: '#FFF1F3' },
  gelb:  { label: 'Gelb', color: '#D97706', bg: '#FFFBEB' },
  gruen: { label: 'Grün', color: '#059669', bg: '#ECFDF5' },
  blau:  { label: 'Blau', color: '#2563EB', bg: '#EFF6FF' },
}

interface PersonalityBadgeProps {
  type: PersonalityType
}

export function PersonalityBadge({ type }: PersonalityBadgeProps) {
  const { label, color, bg } = CONFIG[type]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}

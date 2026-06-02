// Defined locally — not in types.ts (domain-specific, frontend-only)
type PersonalityType = 'rot' | 'gelb' | 'gruen' | 'blau'

// Colors reference CSS tokens from index.css :root — never hardcode here.
const CONFIG: Record<PersonalityType, { label: string; color: string; bg: string }> = {
  rot:   { label: 'Rot',  color: 'var(--personality-rot-text)',   bg: 'var(--personality-rot-bg)'   },
  gelb:  { label: 'Gelb', color: 'var(--personality-gelb-text)',  bg: 'var(--personality-gelb-bg)'  },
  gruen: { label: 'Grün', color: 'var(--personality-gruen-text)', bg: 'var(--personality-gruen-bg)' },
  blau:  { label: 'Blau', color: 'var(--personality-blau-text)',  bg: 'var(--personality-blau-bg)'  },
}

interface PersonalityBadgeProps {
  type: PersonalityType
}

export function PersonalityBadge({ type }: PersonalityBadgeProps) {
  const { label, color, bg } = CONFIG[type]
  return (
    <span
      className="inline-flex items-center rounded-[7px] px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavId = 'mein-tag' | 'hunting' | 'farming' | 'marketing' | 'sherloq' | 'jira'

interface NavItem { id: NavId; label: string; secondary?: boolean }

// Navigation sections — order matches design spec
const NAV_ITEMS: NavItem[] = [
  { id: 'mein-tag',  label: 'Mein Tag'       },
  { id: 'hunting',   label: 'Hunting'         },
  { id: 'farming',   label: 'Farming'         },
  { id: 'marketing', label: 'Marketing'       },
  { id: 'sherloq',   label: 'Sherloq System' },
  { id: 'jira',      label: 'Jira', secondary: true },
]

interface TopBarProps {
  activeSection?: NavId
  onSectionChange?: (id: NavId) => void
  userName?: string
  userInitials?: string
}

export function TopBar({
  activeSection = 'mein-tag',
  onSectionChange,
  userName = 'Oliver Sand',
  userInitials = 'OS',
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-[52px] items-center justify-between px-4"
      style={{
        backgroundColor: 'var(--sherloq-surface)',
        boxShadow: 'var(--sherloq-shadow-sm)',
      }}
    >
      {/* ── Left: Logo + nav pills ─────────────────────────────────── */}
      <div className="flex items-center gap-0 flex-1 min-w-0 overflow-hidden">

        {/* Logo lockup */}
        <div className="flex items-center gap-2 mr-5 flex-shrink-0">
          {/* Teal circle with "S" */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #125455, #3f8383)' }}
          >
            S
          </div>
          {/* Wordmark */}
          <div className="flex flex-col leading-none">
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ color: 'var(--sherloq-text-muted)' }}
            >
              Sherloq
            </span>
            <span
              className="text-[13px] font-700 tracking-tight"
              style={{ color: 'var(--sherloq-text)', fontWeight: 700 }}
            >
              Sales OS
            </span>
          </div>
        </div>

        {/* Primary nav pills — pill-shaped container */}
        <nav className="flex items-center gap-1 flex-nowrap overflow-hidden">
          {NAV_ITEMS.filter(i => !i.secondary).map(item => (
            <NavPill
              key={item.id}
              id={item.id}
              label={item.label}
              active={activeSection === item.id}
              onSelect={onSectionChange}
            />
          ))}

          {/* Jira — secondary, separated by extra gap */}
          <div className="ml-2 flex items-center gap-1">
            {NAV_ITEMS.filter(i => i.secondary).map(item => (
              <NavPill
                key={item.id}
                id={item.id}
                label={item.label}
                active={activeSection === item.id}
                onSelect={onSectionChange}
                secondary
              />
            ))}
          </div>
        </nav>
      </div>

      {/* ── Right: Search trigger + avatar ─────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">

        {/* Cmd+K search trigger — pill shape */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
          style={{
            backgroundColor: 'var(--sherloq-bg)',
            border: '1px solid var(--sherloq-border)',
            color: 'var(--sherloq-text-muted)',
            minWidth: '148px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
          onClick={() => console.log('Cmd+K — spotlight coming soon')}
          type="button"
        >
          <Search size={12} strokeWidth={2} />
          <span className="flex-1 text-left">Suchen...</span>
          <kbd
            className="inline-flex items-center rounded px-1 font-mono"
            style={{
              fontSize: '10px',
              backgroundColor: 'var(--sherloq-border)',
              color: 'var(--sherloq-text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* User avatar */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[11px] font-semibold cursor-pointer flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #125455, #3f8383)' }}
          title={userName}
        >
          {userInitials}
        </div>

      </div>
    </header>
  )
}

/* ── NavPill ────────────────────────────────────────────────────────────── */

interface NavPillProps {
  id: NavId
  label: string
  active: boolean
  secondary?: boolean
  onSelect?: (id: NavId) => void
}

function NavPill({ id, label, active, secondary = false, onSelect }: NavPillProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={cn(
        'whitespace-nowrap rounded-full font-medium transition-all duration-150',
        secondary
          ? 'px-3 py-1 text-[11px]'
          : 'px-3.5 py-1.5 text-[13px]',
        active
          ? 'text-white'
          : 'hover:bg-[#F1F3F5]',
      )}
      style={
        active
          ? { background: 'linear-gradient(135deg, #125455, #3f8383)', color: '#fff' }
          : { color: secondary ? 'var(--sherloq-text-muted)' : '#495057' }
      }
    >
      {label}
    </button>
  )
}

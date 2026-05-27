import {
  List, Columns2, Shuffle, Send,
  Users, Activity, TrendingUp, AlertTriangle,
  Calendar, Edit, Mail, BarChart2,
  LayoutDashboard, CreditCard, Package,
  ClipboardList, Flag, Bell,
  Settings, Moon, Sun,
} from 'lucide-react'
import type { NavId, SubNavId } from '@/types'
import { cn } from '@/lib/utils'

// Sub-nav config per section — icon + label for each icon button
const SUB_ITEMS: Record<NavId, { id: SubNavId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[]> = {
  'mein-tag': [],  // no sub-items — sidebar shows only utility buttons
  hunting: [
    { id: 'hunting-leads',     label: 'Lead-Liste',  icon: List        },
    { id: 'hunting-pipeline',  label: 'Pipeline',    icon: Columns2    },
    { id: 'hunting-sequences', label: 'Sequenzen',   icon: Shuffle     },
    { id: 'hunting-outreach',  label: 'Outreach',    icon: Send        },
  ],
  farming: [
    { id: 'farming-customers', label: 'Kundenliste',    icon: Users          },
    { id: 'farming-health',    label: 'Health Monitor', icon: Activity       },
    { id: 'farming-upsell',    label: 'Upsell',         icon: TrendingUp     },
    { id: 'farming-churn',     label: 'Churn Monitor',  icon: AlertTriangle  },
  ],
  marketing: [
    { id: 'marketing-plan',       label: 'Content Plan', icon: Calendar  },
    { id: 'marketing-posts',      label: 'Posts',        icon: Edit      },
    { id: 'marketing-newsletter', label: 'Newsletter',   icon: Mail      },
    { id: 'marketing-analytics',  label: 'Analytics',    icon: BarChart2 },
  ],
  sherloq: [
    { id: 'sherloq-overview', label: 'Übersicht',    icon: LayoutDashboard },
    { id: 'sherloq-usage',    label: 'Usage',         icon: Activity        },
    { id: 'sherloq-subs',     label: 'Subscriptions', icon: CreditCard      },
    { id: 'sherloq-plans',    label: 'Plans',          icon: Package         },
  ],
  jira: [
    { id: 'jira-tickets', label: 'Meine Tickets', icon: ClipboardList },
    { id: 'jira-epics',   label: 'Epics',         icon: Flag          },
    { id: 'jira-alerts',  label: 'Smart Alerts',  icon: Bell          },
  ],
}

interface SidebarProps {
  activeSection: NavId
  activeSubItem: SubNavId | null
  onSubItemChange: (id: SubNavId) => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Sidebar({
  activeSection,
  activeSubItem,
  onSubItemChange,
  darkMode,
  onToggleDarkMode,
}: SidebarProps) {
  const items = SUB_ITEMS[activeSection]

  return (
    <aside
      className="fixed top-[52px] left-0 bottom-0 w-[68px] flex flex-col items-center justify-between py-3"
      style={{
        backgroundColor: 'var(--sherloq-surface)',
        boxShadow: 'var(--sherloq-shadow-sidebar)',
      }}
    >
      {/* ── Context sub-nav icons ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1.5 w-full px-3">
        {items.map(item => {
          const Icon = item.icon
          const active = activeSubItem === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onSubItemChange(item.id)}
              className={cn(
                'w-11 h-11 flex items-center justify-center rounded-[10px] transition-all duration-150',
                active ? 'text-white' : 'hover:bg-[#F1F3F5]',
              )}
              style={
                active
                  ? { background: 'linear-gradient(135deg, #125455, #3f8383)' }
                  : { color: '#868E96' }
              }
            >
              <Icon size={17} strokeWidth={1.7} />
            </button>
          )
        })}
      </div>

      {/* ── Utility buttons — settings + theme toggle ─────────────── */}
      <div className="flex flex-col items-center gap-1 px-3">
        <button
          type="button"
          title="Einstellungen"
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#F1F3F5]"
          style={{ color: '#ADB5BD' }}
          onClick={() => console.log('Settings — coming soon')}
        >
          <Settings size={15} strokeWidth={1.7} />
        </button>

        <button
          type="button"
          title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#F1F3F5]"
          style={{ color: '#ADB5BD' }}
          onClick={onToggleDarkMode}
        >
          {darkMode ? <Sun size={15} strokeWidth={1.7} /> : <Moon size={15} strokeWidth={1.7} />}
        </button>
      </div>
    </aside>
  )
}

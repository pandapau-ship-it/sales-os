import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ScreenMyDay } from '@/components/screens/ScreenMyDay'
import { ScreenHunting } from '@/components/screens/ScreenHunting'
import { ScreenFarming } from '@/components/screens/ScreenFarming'
import { ScreenPlaceholder } from '@/components/screens/ScreenPlaceholder'
import { currentUser } from '@/data'
import type { NavId, SubNavId, HuntingSubId, FarmingSubId } from '@/types'

// Default sub-item per section — shown when section is first entered
const DEFAULT_SUB: Partial<Record<NavId, SubNavId>> = {
  hunting:   'hunting-leads',
  farming:   'farming-customers',
  marketing: 'marketing-plan',
  sherloq:   'sherloq-overview',
  jira:      'jira-tickets',
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavId>('mein-tag')
  const [activeSubItem, setActiveSubItem] = useState<SubNavId | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  function handleSectionChange(id: NavId) {
    setActiveSection(id)
    setActiveSubItem(DEFAULT_SUB[id] ?? null)
  }

  return (
    // Dark mode: add .dark class to root to activate dark CSS variables
    <div className={darkMode ? 'dark' : ''}>
      <div style={{ backgroundColor: 'var(--sherloq-bg)', minHeight: '100vh' }}>

        {/* ── Top navigation bar ────────────────────────────────────── */}
        <TopBar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          userName={currentUser.name}
          userInitials={currentUser.initials}
        />

        {/* ── Left sidebar ──────────────────────────────────────────── */}
        <Sidebar
          activeSection={activeSection}
          activeSubItem={activeSubItem}
          onSubItemChange={setActiveSubItem}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(d => !d)}
        />

        {/* ── Main content area ─────────────────────────────────────── */}
        <main className="pt-[52px] ml-[68px]">
          <ActiveScreen
            section={activeSection}
            subItem={activeSubItem}
          />
        </main>

      </div>
    </div>
  )
}

// ─── Route active screen based on section + sub-item ─────────────────────────

interface ActiveScreenProps {
  section: NavId
  subItem: SubNavId | null
}

function ActiveScreen({ section, subItem }: ActiveScreenProps) {
  switch (section) {
    case 'mein-tag':
      return <ScreenMyDay />

    case 'hunting':
      return <ScreenHunting activeSubItem={subItem as HuntingSubId | null} />

    case 'farming':
      return <ScreenFarming activeSubItem={subItem as FarmingSubId | null} />

    case 'marketing':
      return (
        <ScreenPlaceholder
          title="Marketing"
          description="Content-Planung, Posts, Newsletter und Kampagnen"
        />
      )

    case 'sherloq':
      return (
        <ScreenPlaceholder
          title="Sherloq System"
          description="Produkt-Statistiken, Usage-Daten und Subscription-Übersicht"
        />
      )

    case 'jira':
      return (
        <ScreenPlaceholder
          title="Jira"
          description="Meine Tickets, Epics und Smart Alerts aus Jira"
        />
      )

    default:
      return null
  }
}

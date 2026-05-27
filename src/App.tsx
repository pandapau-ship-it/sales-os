import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'

// Section IDs — extend as screens are built
type NavId = 'mein-tag' | 'hunting' | 'farming' | 'marketing' | 'sherloq' | 'jira'

export default function App() {
  const [activeSection, setActiveSection] = useState<NavId>('mein-tag')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--sherloq-bg)' }}>

      {/* ── Top navigation bar ──────────────────────────────────────── */}
      <TopBar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userName="Oliver Sand"
        userInitials="OS"
      />

      {/* ── Page content — offset by header height ──────────────────── */}
      <div className="pt-[52px] flex">

        {/* Left sidebar placeholder — filled by SubSidebar once confirmed */}
        <aside
          className="fixed top-[52px] left-0 bottom-0 w-[68px] flex flex-col items-center pt-3 pb-3"
          style={{
            backgroundColor: 'var(--sherloq-surface)',
            boxShadow: 'var(--sherloq-shadow-sidebar)',
          }}
        />

        {/* Main content area */}
        <main className="ml-[68px] flex-1 flex items-center justify-center min-h-[calc(100vh-52px)]">
          <PlaceholderContent section={activeSection} />
        </main>
      </div>
    </div>
  )
}

/* ── Placeholder — replaced screen by screen as modules are built ─────── */

function PlaceholderContent({ section }: { section: NavId }) {
  const meta: Record<NavId, { title: string; description: string }> = {
    'mein-tag':  { title: 'Mein Tag',       description: 'Tagesstruktur, Prioritäten, Meeting-Prep und AI-Briefing' },
    hunting:     { title: 'Hunting',         description: 'Lead-Pipeline, Outreach-Sequenzen und Neukundengewinnung' },
    farming:     { title: 'Farming',         description: 'Bestandskunden, Health-Monitoring und Upsell-Potenziale' },
    marketing:   { title: 'Marketing',       description: 'Content-Planung, Posts, Newsletter und Kampagnen' },
    sherloq:     { title: 'Sherloq System',  description: 'Produkt-Statistiken, Usage-Daten und Subscription-Übersicht' },
    jira:        { title: 'Jira',            description: 'Meine Tickets, Epics und Smart Alerts aus Jira' },
  }
  const { title, description } = meta[section]

  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">

      {/* Icon placeholder */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white text-2xl"
        style={{ background: 'linear-gradient(135deg, #125455, #3f8383)' }}
      >
        ✦
      </div>

      <div className="flex flex-col gap-1">
        <p
          className="text-base font-semibold tracking-tight"
          style={{ color: 'var(--sherloq-text)' }}
        >
          {title}
        </p>
        <p className="text-sm" style={{ color: 'var(--sherloq-text-muted)' }}>
          {description}
        </p>
      </div>

      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: 'var(--sherloq-primary-light)',
          color: 'var(--sherloq-primary)',
        }}
      >
        Kommt bald
      </span>

    </div>
  )
}

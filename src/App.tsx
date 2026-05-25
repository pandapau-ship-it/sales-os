import { useState } from 'react'
import { AppShell, Badge, Box, Stack, Text, ThemeIcon, rem } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useCurrentUser } from './hooks/useCurrentUser'
import { TopNav } from './components/shell/TopNav'
import { SubSidebar } from './components/shell/SubSidebar'
import {
  getSubItems,
  getDefaultSection,
  sectionMeta,
  mainNavItems,
} from './components/shell/navConfig'
import type { MainNavId } from './types/navigation'

export default function App() {
  const user = useCurrentUser()
  const [mobileOpen] = useDisclosure(false)

  const [activeSection, setActiveSection] = useState<MainNavId>(
    getDefaultSection(user.role)
  )
  const [activeSubItem, setActiveSubItem] = useState<string | null>(() => {
    const firstSub = getSubItems(getDefaultSection(user.role))[0]
    return firstSub?.id ?? null
  })

  // Auto-select first sub-item when switching sections
  function handleSectionChange(id: MainNavId) {
    setActiveSection(id)
    const firstSub = getSubItems(id)[0]
    setActiveSubItem(firstSub?.id ?? null)
  }

  return (
    <AppShell
      // layout="default": header spans full viewport width, navbar sits below it on the left.
      // TopNav (5 section pills) lives in the header — full width.
      // SubSidebar (context sub-icons) lives in the navbar — below the header on the left.
      layout="default"
      header={{ height: 52 }}
      navbar={{
        width: 68,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpen },
      }}
      padding="lg"
      style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
    >
      {/* ── Full-width top bar — primary section navigation ───────────── */}
      <AppShell.Header
        withBorder={false}
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 20px -4px rgba(0, 0, 0, 0.06)',
        }}
      >
        <TopNav
          user={user}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </AppShell.Header>

      {/* ── Left sidebar — context-sensitive sub-nav icons ───────────── */}
      <AppShell.Navbar
        withBorder={false}
        style={{
          backgroundColor: 'white',
          boxShadow: '2px 0 20px -8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <SubSidebar
          activeSection={activeSection}
          activeSubItem={activeSubItem}
          onSubItemChange={setActiveSubItem}
        />
      </AppShell.Navbar>

      {/* ── Page content — gray-0 background, white cards ────────────── */}
      <AppShell.Main>
        <PlaceholderPage
          section={activeSection}
          subItemId={activeSubItem}
        />
      </AppShell.Main>
    </AppShell>
  )
}

// ─── Placeholder content — replaced section by section as modules are built ──

interface PlaceholderPageProps {
  section: MainNavId
  subItemId: string | null
}

function PlaceholderPage({ section, subItemId }: PlaceholderPageProps) {
  const meta = sectionMeta[section]
  const navItem = mainNavItems.find(n => n.id === section)
  const SectionIcon = navItem?.icon
  const subItems = getSubItems(section)
  const activeSubItem = subItems.find(s => s.id === subItemId)
  const SubItemIcon = activeSubItem?.icon

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: `calc(100vh - ${rem(52)} - ${rem(32)})`,
      }}
    >
      <Stack align="center" gap="md" maw={420} ta="center">

        {SectionIcon && (
          <ThemeIcon size={56} radius="xl" color="sherloq" variant="light">
            <SectionIcon size={28} stroke={1.5} />
          </ThemeIcon>
        )}

        <Stack gap={4} align="center">
          <Text fw={600} size="lg" style={{ letterSpacing: '-0.01em' }}>
            {meta.title}
          </Text>
          {activeSubItem && SubItemIcon ? (
            <Box style={{ display: 'flex', alignItems: 'center', gap: rem(5), color: 'var(--mantine-color-gray-6)' }}>
              <SubItemIcon size={13} stroke={1.5} />
              <Text size="sm" c="dimmed">{activeSubItem.label}</Text>
            </Box>
          ) : (
            <Text size="sm" c="dimmed">{meta.description}</Text>
          )}
        </Stack>

        {activeSubItem && (
          <Text size="xs" c="dimmed" maw={300}>{meta.description}</Text>
        )}

        <Badge color="sherloq" variant="light" size="sm" radius="sm">
          Kommt bald
        </Badge>

      </Stack>
    </Box>
  )
}

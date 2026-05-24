import { useState } from 'react'
import { AppShell, Badge, Box, Stack, Text, ThemeIcon, rem } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useCurrentUser } from './hooks/useCurrentUser'
import { TopBar } from './components/shell/TopBar'
import { SubSidebar } from './components/shell/SubSidebar'
import {
  getVisibleMainItems,
  getSubItems,
  getDefaultSection,
  sectionMeta,
  mainNavItems,
} from './components/shell/navConfig'
import type { MainNavId } from './types/navigation'

export default function App() {
  const user = useCurrentUser()
  const [mobileOpen, { toggle: toggleMobile }] = useDisclosure(false)

  // Determine visible nav items based on user's role
  const visibleItems = getVisibleMainItems(user.role)

  // Active section defaults to first accessible section for this role
  const [activeSection, setActiveSection] = useState<MainNavId>(
    getDefaultSection(user.role)
  )

  // Active sub-item: auto-select first sub-item when switching sections
  const [activeSubItem, setActiveSubItem] = useState<string | null>(() => {
    const firstSub = getSubItems(getDefaultSection(user.role))[0]
    return firstSub?.id ?? null
  })

  function handleSectionChange(id: MainNavId) {
    setActiveSection(id)
    // Auto-select first sub-item of the new section
    const firstSub = getSubItems(id)[0]
    setActiveSubItem(firstSub?.id ?? null)
  }

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{
        width: 56,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpen },
      }}
      padding="lg"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <AppShell.Header>
        <TopBar
          user={user}
          visibleItems={visibleItems}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          mobileMenuOpen={mobileOpen}
          onMobileMenuToggle={toggleMobile}
        />
      </AppShell.Header>

      {/* ── Left Icon Sidebar ───────────────────────────────────────────── */}
      <AppShell.Navbar>
        <SubSidebar
          activeSection={activeSection}
          activeSubItem={activeSubItem}
          onSubItemChange={setActiveSubItem}
        />
      </AppShell.Navbar>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <AppShell.Main>
        <PlaceholderPage
          section={activeSection}
          subItemId={activeSubItem}
        />
      </AppShell.Main>
    </AppShell>
  )
}

// ─── Placeholder Page ─────────────────────────────────────────────────────────
// Temporary content shown for each section/sub-item combination.
// Replace with real page components as each module is built.

interface PlaceholderPageProps {
  section: MainNavId
  subItemId: string | null
}

function PlaceholderPage({ section, subItemId }: PlaceholderPageProps) {
  const meta = sectionMeta[section]

  // Get the section icon from mainNavItems
  const navItem = mainNavItems.find(n => n.id === section)
  const SectionIcon = navItem?.icon

  // Find the active sub-item label
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

        {/* Section icon */}
        {SectionIcon && (
          <ThemeIcon
            size={56}
            radius="xl"
            color="sherloq"
            variant="light"
          >
            <SectionIcon size={28} stroke={1.5} />
          </ThemeIcon>
        )}

        {/* Section + sub-item title */}
        <Stack gap={4} align="center">
          <Text fw={600} size="lg" style={{ letterSpacing: '-0.01em' }}>
            {meta.title}
          </Text>

          {activeSubItem && SubItemIcon ? (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(5),
                color: 'var(--mantine-color-gray-6)',
              }}
            >
              <SubItemIcon size={13} stroke={1.5} />
              <Text size="sm" c="dimmed">{activeSubItem.label}</Text>
            </Box>
          ) : (
            <Text size="sm" c="dimmed">{meta.description}</Text>
          )}
        </Stack>

        {/* Description (only when sub-item is active) */}
        {activeSubItem && (
          <Text size="xs" c="dimmed" maw={300}>
            {meta.description}
          </Text>
        )}

        <Badge
          color="sherloq"
          variant="light"
          size="sm"
          radius="sm"
        >
          Kommt bald
        </Badge>

      </Stack>
    </Box>
  )
}

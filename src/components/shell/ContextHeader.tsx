import { Avatar, Box, Burger, Group, Kbd, Text, ThemeIcon, Tooltip, rem } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconSearch, IconSeeding } from '@tabler/icons-react'
import type { CurrentUser, MainNavId } from '../../types/navigation'
import { getSubItems, sectionMeta } from './navConfig'
import css from './shell.module.css'

interface ContextHeaderProps {
  user: CurrentUser
  activeSection: MainNavId
  activeSubItem: string | null
  onSubItemChange: (id: string) => void
  mobileMenuOpen: boolean
  onMobileMenuToggle: () => void
}

/**
 * Context-sensitive header bar.
 * Left side shows: active section title + sub-nav tabs (change per section).
 * Right side shows: Cmd+K placeholder + user avatar.
 *
 * On mobile: hamburger + logo shown (sidebar collapses on small screens).
 * Mein Tag has no sub-items — header shows only the section title.
 */
export function ContextHeader({
  user,
  activeSection,
  activeSubItem,
  onSubItemChange,
  mobileMenuOpen,
  onMobileMenuToggle,
}: ContextHeaderProps) {
  // Cmd+K shortcut — captured but no-op until Spotlight modal is implemented
  useHotkeys([['mod+k', (e) => { e.preventDefault(); console.log('Cmd+K — open spotlight') }]])

  const subItems = getSubItems(activeSection)
  const meta = sectionMeta[activeSection]

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Group h="100%" px="md" gap={0} wrap="nowrap" justify="space-between">

      {/* ── Left: Section title + sub-nav tabs ─────────────────────── */}
      <Group gap={0} style={{ flex: 1, overflow: 'hidden', minWidth: 0 }} wrap="nowrap">

        {/* Mobile only: Hamburger to open sidebar + logo */}
        <Burger
          opened={mobileMenuOpen}
          onClick={onMobileMenuToggle}
          size="sm"
          hiddenFrom="sm"
          mr={8}
        />
        <Group gap={6} hiddenFrom="sm" mr={12} style={{ flexShrink: 0 }}>
          <ThemeIcon size={24} radius="sm" color="sherloq" variant="filled">
            <IconSeeding size={13} stroke={2} />
          </ThemeIcon>
          <Text fw={600} size="sm">Sales OS</Text>
        </Group>

        {/* Section title — bold label for active section */}
        <span className={css.sectionTitle}>{meta.title}</span>

        {/* Sub-nav tabs — only shown when section has sub-items */}
        {subItems.length > 0 && (
          <>
            <Box className={css.navSeparator} mx={10} />
            <Group gap={2} wrap="nowrap" style={{ overflow: 'hidden' }}>
              {subItems.map(item => (
                <button
                  key={item.id}
                  className={css.subNavTab}
                  data-active={activeSubItem === item.id ? 'true' : undefined}
                  onClick={() => onSubItemChange(item.id)}
                  type="button"
                >
                  <item.icon size={13} stroke={1.5} />
                  {item.label}
                </button>
              ))}
            </Group>
          </>
        )}
      </Group>

      {/* ── Right: Cmd+K + User avatar ──────────────────────────────── */}
      <Group gap="xs" style={{ flexShrink: 0 }}>

        <Tooltip label="Suchen & Aktionen" position="bottom" withArrow openDelay={600}>
          <button
            className={css.cmdK}
            type="button"
            onClick={() => console.log('Cmd+K — open spotlight')}
          >
            <IconSearch size={12} stroke={2} />
            <span className={css.cmdKLabel}>Suchen...</span>
            <Kbd size="xs" style={{ fontSize: rem(10), padding: '1px 4px' }}>⌘K</Kbd>
          </button>
        </Tooltip>

        <Tooltip label={`${user.name} · ${user.role}`} position="bottom-end" withArrow>
          <Avatar
            size={28}
            radius="xl"
            color="sherloq"
            style={{ cursor: 'pointer', fontSize: rem(11), fontWeight: 600 }}
          >
            {initials}
          </Avatar>
        </Tooltip>

      </Group>
    </Group>
  )
}

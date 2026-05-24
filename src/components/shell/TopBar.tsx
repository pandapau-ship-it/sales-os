import { Avatar, Box, Burger, Group, Kbd, Text, ThemeIcon, Tooltip, rem } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconSearch, IconSeeding } from '@tabler/icons-react'
import type { CurrentUser, MainNavId } from '../../types/navigation'
import type { MainNavItem } from '../../types/navigation'
import css from './shell.module.css'

interface TopBarProps {
  user: CurrentUser
  visibleItems: MainNavItem[]
  activeSection: MainNavId
  onSectionChange: (id: MainNavId) => void
  mobileMenuOpen: boolean
  onMobileMenuToggle: () => void
}

export function TopBar({
  user,
  visibleItems,
  activeSection,
  onSectionChange,
  mobileMenuOpen,
  onMobileMenuToggle,
}: TopBarProps) {
  // Wire up Cmd+K shortcut — placeholder until Spotlight modal is implemented
  useHotkeys([['mod+k', (e) => { e.preventDefault(); console.log('Cmd+K — open spotlight') }]])

  // Derive user initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Split into primary items and the secondary (Jira) item
  const primaryItems = visibleItems.filter(item => !item.secondary)
  const secondaryItems = visibleItems.filter(item => item.secondary)

  return (
    <Group h="100%" px="md" gap={0} wrap="nowrap" justify="space-between">

      {/* ── Left: Logo ─────────────────────────────────────────────────── */}
      <Group gap="xs" style={{ flexShrink: 0, minWidth: rem(140) }}>
        {/* Mobile hamburger — hidden on desktop */}
        <Burger
          opened={mobileMenuOpen}
          onClick={onMobileMenuToggle}
          size="sm"
          hiddenFrom="sm"
          mr={4}
        />

        {/* Brand mark + name */}
        <Group gap={7} visibleFrom="sm">
          <ThemeIcon size={26} radius="sm" color="sherloq" variant="filled">
            <IconSeeding size={14} stroke={2} />
          </ThemeIcon>
          <Text fw={600} size="sm" style={{ letterSpacing: '-0.01em' }}>
            Sales OS
          </Text>
        </Group>
      </Group>

      {/* ── Center: Main Navigation ─────────────────────────────────────── */}
      {/* Horizontal pill-style tabs — active item gets filled sherloq pill */}
      {/* Matches SugarCRM reference screenshot pattern */}
      <Group gap={2} style={{ flex: 1, justifyContent: 'center' }} wrap="nowrap" visibleFrom="sm">
        {primaryItems.map(item => (
          <button
            key={item.id}
            className={css.navItem}
            data-active={activeSection === item.id ? 'true' : undefined}
            onClick={() => onSectionChange(item.id)}
            type="button"
          >
            <item.icon size={14} stroke={1.5} />
            {item.label}
          </button>
        ))}

        {/* Jira — secondary, visually separated */}
        {secondaryItems.length > 0 && (
          <>
            <Box className={css.navSeparator} />
            {secondaryItems.map(item => (
              <button
                key={item.id}
                className={`${css.navItem} ${css.navItemSecondary}`}
                data-active={activeSection === item.id ? 'true' : undefined}
                onClick={() => onSectionChange(item.id)}
                type="button"
              >
                <item.icon size={13} stroke={1.5} />
                {item.label}
              </button>
            ))}
          </>
        )}
      </Group>

      {/* ── Right: Utilities ────────────────────────────────────────────── */}
      <Group gap="xs" style={{ flexShrink: 0, minWidth: rem(140), justifyContent: 'flex-end' }}>

        {/* Cmd+K — search/action placeholder; styled like a compact input */}
        <Tooltip
          label="Suchen & Aktionen"
          position="bottom"
          withArrow
          openDelay={600}
        >
          <button
            className={css.cmdK}
            type="button"
            onClick={() => console.log('Cmd+K — open spotlight')}
          >
            <IconSearch size={12} stroke={2} />
            <span className={css.cmdKLabel}>Suchen...</span>
            <Kbd size="xs" style={{ fontSize: rem(10), padding: '1px 4px' }}>
              ⌘K
            </Kbd>
          </button>
        </Tooltip>

        {/* User avatar with role tooltip */}
        <Tooltip
          label={`${user.name} · ${user.role}`}
          position="bottom-end"
          withArrow
        >
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

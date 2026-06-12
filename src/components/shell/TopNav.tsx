import { Avatar, Group, Kbd, Text, ThemeIcon, Tooltip, rem } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconSearch, IconSeeding } from '@tabler/icons-react'
import type { CurrentUser, MainNavId } from '../../types/navigation'
import { getVisibleMainItems } from './navConfig'
import css from './shell.module.css'

interface TopNavProps {
  user: CurrentUser
  activeSection: MainNavId
  onSectionChange: (id: MainNavId) => void
}

/**
 * Top horizontal navigation — primary section pills spanning the full header width.
 * Left: logo lockup + 5 main section pills + Jira (separated, smaller).
 * Right: Cmd+K pill button + user avatar.
 *
 * Active pill: gradient fill (var(--sherloq-primary) → var(--sherloq-primary-hover)), white text.
 * Inactive: transparent, gray text — no borders, no dividers.
 * Jira rendered as secondary (smaller pill) after a visual gap.
 */
export function TopNav({ user, activeSection, onSectionChange }: TopNavProps) {
  // Cmd+K shortcut captured — no-op until Spotlight modal is implemented
  useHotkeys([['mod+k', (e) => { e.preventDefault(); console.log('Cmd+K — open spotlight') }]])

  const allItems = getVisibleMainItems(user.role)
  const primaryItems = allItems.filter(i => !i.secondary)
  const secondaryItems = allItems.filter(i => i.secondary)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Group h="100%" px="md" gap={0} wrap="nowrap" justify="space-between">

      {/* ── Left: Logo + section pills ─────────────────────────────── */}
      <Group gap={0} wrap="nowrap" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>

        {/* Logo lockup */}
        <div className={css.logoArea}>
          <ThemeIcon size={28} radius="sm" color="sherloq" variant="filled" style={{ flexShrink: 0 }}>
            <IconSeeding size={15} stroke={2} />
          </ThemeIcon>
          <Text
            fw={700}
            size="sm"
            style={{ letterSpacing: '-0.02em', color: 'var(--mantine-color-dark-7)', flexShrink: 0 }}
          >
            Sales OS
          </Text>
        </div>

        {/* Primary section pills — Mein Tag · Hunting · Farming · Marketing · Sherloq */}
        <Group gap={2} wrap="nowrap">
          {primaryItems.map(item => (
            <button
              key={item.id}
              className={css.topNavPill}
              data-active={activeSection === item.id ? 'true' : undefined}
              onClick={() => onSectionChange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </Group>

        {/* Secondary pills (Jira) — smaller, visually separated by gap */}
        {secondaryItems.length > 0 && (
          <Group gap={2} wrap="nowrap" ml={12}>
            {secondaryItems.map(item => (
              <button
                key={item.id}
                className={`${css.topNavPill} ${css.topNavPillSecondary}`}
                data-active={activeSection === item.id ? 'true' : undefined}
                onClick={() => onSectionChange(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </Group>
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

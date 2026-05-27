import { Divider, Stack, ThemeIcon, Tooltip } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSeeding, IconSettings, IconSun } from '@tabler/icons-react'
import type { CurrentUser, MainNavId } from '../../types/navigation'
import { getVisibleMainItems } from './navConfig'
import css from './shell.module.css'

interface PrimaryNavProps {
  user: CurrentUser
  activeSection: MainNavId
  onSectionChange: (id: MainNavId) => void
}

/**
 * Primary navigation — full-height left sidebar with icon buttons.
 * Uses AppShell layout="alt" so it spans the full viewport height (not below header).
 *
 * Structure:
 *   [Logo area — 52px, aligns with ContextHeader height]
 *   [5 main section icons]
 *   [Jira icon — visually separated, secondary]
 *   [Settings + Theme toggle — pinned to bottom]
 *
 * Active state: solid sherloq fill (dark teal). Tooltips on hover reveal section names.
 */
export function PrimaryNav({ user, activeSection, onSectionChange }: PrimaryNavProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  const allItems = getVisibleMainItems(user.role)
  const primaryItems = allItems.filter(i => !i.secondary)
  const secondaryItems = allItems.filter(i => i.secondary)

  return (
    <Stack h="100%" align="center" justify="space-between" gap={0}>

      {/* ── Top: Logo + Nav items ────────────────────────────────────── */}
      <Stack align="center" gap={0} style={{ width: '100%' }}>

        {/* Logo — height matches ContextHeader for clean grid alignment */}
        <Tooltip label="Sales OS" position="right" withArrow openDelay={400}>
          <div className={css.logoArea}>
            <ThemeIcon
              size={32}
              radius="sm"
              color="sherloq"
              variant="filled"
              style={{ cursor: 'default' }}
            >
              <IconSeeding size={17} stroke={2} />
            </ThemeIcon>
          </div>
        </Tooltip>

        {/* Primary section icons */}
        <Stack gap={4} align="center" pt="sm" px={4}>
          {primaryItems.map(item => (
            <Tooltip
              key={item.id}
              label={item.label}
              position="right"
              withArrow
              openDelay={200}
            >
              <button
                className={css.primaryNavItem}
                data-active={activeSection === item.id ? 'true' : undefined}
                onClick={() => onSectionChange(item.id)}
                type="button"
                aria-label={item.label}
              >
                <item.icon size={18} stroke={1.5} />
              </button>
            </Tooltip>
          ))}
        </Stack>

        {/* Jira — secondary, visually separated */}
        {secondaryItems.length > 0 && (
          <>
            <Divider w={24} my={8} color="gray.2" />
            <Stack gap={4} align="center" px={4}>
              {secondaryItems.map(item => (
                <Tooltip
                  key={item.id}
                  label={item.label}
                  position="right"
                  withArrow
                  openDelay={200}
                >
                  <button
                    className={`${css.primaryNavItem} ${css.primaryNavItemSecondary}`}
                    data-active={activeSection === item.id ? 'true' : undefined}
                    onClick={() => onSectionChange(item.id)}
                    type="button"
                    aria-label={item.label}
                  >
                    <item.icon size={16} stroke={1.5} />
                  </button>
                </Tooltip>
              ))}
            </Stack>
          </>
        )}
      </Stack>

      {/* ── Bottom: Utility buttons ──────────────────────────────────── */}
      <Stack gap={4} align="center" pb="sm" px={4}>
        <Divider w={24} mb={4} color="gray.2" />

        <Tooltip label="Einstellungen" position="right" withArrow>
          <button
            className={css.utilBtn}
            type="button"
            aria-label="Einstellungen"
            onClick={() => console.log('Settings — coming soon')}
          >
            <IconSettings size={16} stroke={1.5} />
          </button>
        </Tooltip>

        <Tooltip
          label={colorScheme === 'dark' ? 'Hell-Modus' : 'Dunkel-Modus'}
          position="right"
          withArrow
        >
          <button
            className={css.utilBtn}
            type="button"
            aria-label="Theme wechseln"
            onClick={() => toggleColorScheme()}
          >
            {colorScheme === 'dark'
              ? <IconSun size={16} stroke={1.5} />
              : <IconMoon size={16} stroke={1.5} />
            }
          </button>
        </Tooltip>
      </Stack>

    </Stack>
  )
}

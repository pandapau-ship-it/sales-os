import { Divider, Stack, Tooltip } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSettings, IconSun } from '@tabler/icons-react'
import type { MainNavId } from '../../types/navigation'
import { getSubItems } from './navConfig'
import css from './shell.module.css'

interface SubSidebarProps {
  activeSection: MainNavId
  activeSubItem: string | null
  onSubItemChange: (id: string) => void
}

/**
 * Left icon-only sidebar.
 * Shows context-sensitive sub-navigation for the active section.
 * Style reference: vertical circular icon buttons (see design screenshots).
 * Mein Tag has no sub-items — sidebar shows only utility buttons.
 */
export function SubSidebar({ activeSection, activeSubItem, onSubItemChange }: SubSidebarProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const subItems = getSubItems(activeSection)

  return (
    <Stack
      h="100%"
      justify="space-between"
      align="center"
      py="sm"
      gap={0}
    >
      {/* ── Sub-navigation items for current section ──────────────────── */}
      <Stack gap={6} align="center">
        {subItems.map(item => (
          <Tooltip
            key={item.id}
            label={item.label}
            position="right"
            withArrow
            openDelay={300}
          >
            <button
              className={css.subNavBtn}
              data-active={activeSubItem === item.id ? 'true' : undefined}
              onClick={() => onSubItemChange(item.id)}
              type="button"
              aria-label={item.label}
            >
              <item.icon size={17} stroke={1.5} />
            </button>
          </Tooltip>
        ))}
      </Stack>

      {/* ── Utility buttons: settings + theme toggle ──────────────────── */}
      <Stack gap={4} align="center">
        <Divider w={24} mb={4} />

        <Tooltip label="Einstellungen" position="right" withArrow>
          <button
            className={css.subNavBtnUtil}
            type="button"
            aria-label="Einstellungen"
            onClick={() => console.log('Settings — coming soon')}
          >
            <IconSettings size={16} stroke={1.5} />
          </button>
        </Tooltip>

        {/* Theme toggle — switches between light and dark mode */}
        <Tooltip
          label={colorScheme === 'dark' ? 'Hell-Modus' : 'Dunkel-Modus'}
          position="right"
          withArrow
        >
          <button
            className={css.subNavBtnUtil}
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

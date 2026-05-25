import { Stack, Tooltip } from '@mantine/core'
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
 * Context-sensitive left sidebar — shows sub-nav icons for the active section.
 * Switches content when the top nav section changes (Hunting → Farming, etc.).
 * Mein Tag has no sub-items → sidebar shows only utility buttons at the bottom.
 * No borders, no dividers — separation via spacing only.
 */
export function SubSidebar({ activeSection, activeSubItem, onSubItemChange }: SubSidebarProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const subItems = getSubItems(activeSection)

  return (
    <Stack h="100%" justify="space-between" align="center" py="sm" gap={0}>

      {/* ── Context-sensitive sub-nav icons ─────────────────────────── */}
      <Stack gap={6} align="center" px={4}>
        {subItems.map(item => (
          <Tooltip
            key={item.id}
            label={item.label}
            position="right"
            withArrow
            openDelay={250}
          >
            <button
              className={css.sidebarItem}
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

      {/* ── Utility buttons — pinned to bottom ─────────────────────── */}
      <Stack gap={4} align="center" px={4}>
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
              : <IconMoon size={16} stroke={1.5} />}
          </button>
        </Tooltip>
      </Stack>

    </Stack>
  )
}

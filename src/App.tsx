import { AppShell, Burger, Group, Text, NavLink, Stack, Title, Button, useMantineColorScheme, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSun, IconMoon, IconLayoutDashboard, IconUsers, IconChartBar, IconSettings } from '@tabler/icons-react'

const navItems = [
  { icon: IconLayoutDashboard, label: 'Dashboard', href: '#' },
  { icon: IconUsers, label: 'Kontakte', href: '#' },
  { icon: IconChartBar, label: 'Pipeline', href: '#' },
  { icon: IconSettings, label: 'Einstellungen', href: '#' },
]

function App() {
  const [opened, { toggle }] = useDisclosure()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Sales OS</Text>
          </Group>
          <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="lg">
            {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={18} />}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="md">
          <Title order={2}>Willkommen im Sales OS</Title>
          <Text c="dimmed">Dein Projekt ist bereit. Vite + React + TypeScript + Mantine v8.</Text>
          <Button w="fit-content">Loslegen</Button>
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}

export default App

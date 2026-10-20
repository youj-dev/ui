import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { presetById, ThemeScope } from '@youj/core'
import { CreditCardIcon, KeyboardIcon, SettingsIcon, UserIcon } from '@youj/icons'
import type { ColorMode } from '@youj/core'
import { AccountMenu } from './account-menu'
import { Button } from './button'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut } from './dropdown-menu'

const meta: Meta<typeof AccountMenu> = {
  title: 'UI/Navigation/AccountMenu',
  component: AccountMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The signed-in user\'s menu: an avatar that opens a DropdownMenu with a profile header, the workspaces to switch between, your own rows (profile, settings, keyboard shortcuts), a Theme submenu and Sign out. Everything moves as DropdownMenu does: the popup grows from the avatar, one highlight glides between rows, checks draw in, submenus open on → and close on ←. Theme lists the built-in presets from @youj/motion with their accents and an appearance choice; the menu reports the choice and the app applies it (here, a ThemeScope around the demo re-themes it live, menu included).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AccountMenu>

const workspaces = [
  { id: 'northwind', name: 'Northwind Labs' },
  { id: 'acme', name: 'Acme Corp' },
  { id: 'personal', name: 'Personal' },
]

function Demo() {
  const [workspace, setWorkspace] = useState('northwind')
  const [theme, setTheme] = useState('graphite')
  const [mode, setMode] = useState<ColorMode>('system')
  return (
    <ThemeScope theme={presetById(theme)}>
      <div className="flex w-[22rem] items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 text-ui shadow-xs">
        <div className="flex flex-col">
          <span className="font-medium text-fg">{workspaces.find((w) => w.id === workspace)?.name}</span>
          <span className="text-ui-sm text-fg-muted">
            {presetById(theme).name} · {mode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Invite
          </Button>
          <AccountMenu
            user={{ name: 'Ada Lovelace', email: 'ada@northwind.dev' }}
            workspaces={workspaces}
            workspace={workspace}
            onWorkspaceChange={setWorkspace}
            theme={theme}
            onThemeChange={setTheme}
            colorMode={mode}
            onColorModeChange={setMode}
            onSignOut={() => {}}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon size={16} strokeWidth={1.75} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon size={16} strokeWidth={1.75} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon size={16} strokeWidth={1.75} />
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <KeyboardIcon size={16} strokeWidth={1.75} />
                Keyboard shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </AccountMenu>
        </div>
      </div>
    </ThemeScope>
  )
}

export const Default: Story = { render: () => <Demo /> }

/** Just the essentials: who you are and a way out. A long name and address truncate. */
export const Minimal: Story = {
  render: () => (
    <AccountMenu
      user={{ name: 'Maximiliana Featherstonehaugh-Worthington', email: 'maximiliana.featherstonehaugh@a-very-long-domain.example' }}
      onSignOut={() => {}}
    />
  ),
}

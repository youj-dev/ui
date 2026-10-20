'use client'

import { useState } from 'react'
import { ThemeScope, presetById, type ColorMode } from '@youj/core'
import { CreditCardIcon, KeyboardIcon, SettingsIcon, UserIcon } from '@youj/icons'
import {
  AccountMenu,
  Button,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@youj/react'

const WORKSPACES = [
  { id: 'northwind', name: 'Northwind Labs' },
  { id: 'acme', name: 'Acme Corp' },
  { id: 'personal', name: 'Personal' },
]

export default function AccountMenuDemo() {
  const [workspace, setWorkspace] = useState('northwind')
  const [theme, setTheme] = useState('basalt')
  const [mode, setMode] = useState<ColorMode>('dark')
  const [signedOut, setSignedOut] = useState(false)

  if (signedOut) {
    return (
      <Button variant="outline" onClick={() => setSignedOut(false)}>
        Sign back in
      </Button>
    )
  }

  return (
    // The menu only reports the choice; here a ThemeScope applies the preset to the card, menu included.
    <ThemeScope theme={presetById(theme)}>
      <div className="flex w-[22rem] max-w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 text-ui shadow-xs">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-fg">{WORKSPACES.find((w) => w.id === workspace)?.name}</span>
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
            workspaces={WORKSPACES}
            workspace={workspace}
            onWorkspaceChange={setWorkspace}
            theme={theme}
            onThemeChange={setTheme}
            colorMode={mode}
            onColorModeChange={setMode}
            onSignOut={() => setSignedOut(true)}
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

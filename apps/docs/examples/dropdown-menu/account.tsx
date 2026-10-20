'use client'

import { useState } from 'react'
import { KeyboardIcon, LogOutIcon, SettingsIcon, ThemeIcon, UserIcon } from '@youj/icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@youj/react'

export default function DropdownMenuAccount() {
  const [theme, setTheme] = useState('system')

  return (
    <div className="flex h-80 w-full max-w-sm flex-col items-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="h-auto gap-2 py-1 ps-1 pe-2" aria-label="Ana Lima, account menu" />}
        >
          <Avatar size="sm">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <span className="text-ui font-medium text-fg">Ana Lima</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <div className="flex flex-col px-2 pt-1.5 pb-2">
            <span className="text-ui font-medium text-fg">Ana Lima</span>
            <span className="text-ui-sm text-fg-muted">ana@youj.dev</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon />
            Profile
            <DropdownMenuShortcut>⌘⇧P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <KeyboardIcon />
            Keyboard shortcuts
            <DropdownMenuShortcut>?</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ThemeIcon active={theme === 'dark'} />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {/* No icon on this row: `inset` lines its label up with the rows above. */}
          <DropdownMenuItem inset>Changelog</DropdownMenuItem>
          <DropdownMenuItem>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

'use client'

import type { ReactNode } from 'react'
import { KeyboardIcon, LifeBuoyIcon, SettingsIcon, UserIcon } from '@youj/icons'
import { AccountMenu } from '../../components/ui/account-menu'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut } from '../../components/ui/dropdown-menu'
import type { FrameUser } from './shell'

/* The account for a frame's top bar: your avatar, which opens the account
 * menu with who you are, the frame's standard rows (or yours) and Sign out.
 * Wire the standard rows with `onSelect`; their names are in `copy`.
 * The menu grows out of the avatar, its highlight glides between rows, and
 * Escape brings focus back to the avatar. */

/** One of the standard account rows. */
type FrameAccountRow = 'profile' | 'settings' | 'shortcuts' | 'help'

export const DEFAULT_COPY = { profile: 'Profile', settings: 'Settings', shortcuts: 'Keyboard shortcuts', help: 'Help & support' }
type FrameAccountCopy = typeof DEFAULT_COPY

interface FrameAccountMenuProps {
  user: FrameUser
  onSignOut?: () => void
  /** A standard row was chosen (not used with `children`). */
  onSelect?: (row: FrameAccountRow) => void
  /** The standard rows' names, to rewrite or translate. */
  copy?: Partial<FrameAccountCopy>
  /** Your rows (DropdownMenuItem, groups). Default: Profile, Settings, Keyboard shortcuts and Help. */
  children?: ReactNode
  className?: string
}

/** The frame's standard account rows: Profile, Settings (⌘,), Keyboard shortcuts (?) and Help & support. */
function FrameAccountItems({ copy = DEFAULT_COPY, onSelect }: { copy?: FrameAccountCopy; onSelect?: (row: FrameAccountRow) => void } = {}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={() => onSelect?.('profile')}>
        <UserIcon size={16} strokeWidth={1.75} />
        {copy.profile}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect?.('settings')}>
        <SettingsIcon size={16} strokeWidth={1.75} />
        {copy.settings}
        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect?.('shortcuts')}>
        <KeyboardIcon size={16} strokeWidth={1.75} />
        {copy.shortcuts}
        <DropdownMenuShortcut>?</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect?.('help')}>
        <LifeBuoyIcon size={16} strokeWidth={1.75} />
        {copy.help}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}

function FrameAccountMenu({ user, onSignOut = () => {}, onSelect, copy, children, className }: FrameAccountMenuProps) {
  return (
    <AccountMenu user={user} onSignOut={onSignOut} className={className}>
      {children ?? <FrameAccountItems copy={{ ...DEFAULT_COPY, ...copy }} onSelect={onSelect} />}
    </AccountMenu>
  )
}

export { FrameAccountItems, FrameAccountMenu }
export type { FrameAccountMenuProps, FrameAccountCopy, FrameAccountRow }

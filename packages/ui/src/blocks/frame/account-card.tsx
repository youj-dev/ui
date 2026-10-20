'use client'

import type { ReactNode } from 'react'
import { ChevronsUpDownIcon, KeyboardIcon, LifeBuoyIcon, SettingsIcon, UserIcon } from '@youj/icons'
import { AccountMenu } from '../../components/ui/account-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut } from '../../components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { useFrameCompact, useFrameRail, type FrameUser } from './shell'
import { ISLAND, KEY_CAP } from './shell/signature'

/* The account at the foot of a frame sidebar: an island on the paper
 * (sidebar signature, rule 6), avatar, name and email as one key
 * that opens the account menu (who you are, your own rows, Sign out), its
 * chevrons on a key cap. It follows the sidebar: collapsed to icons the tray
 * fades with the width and it's the avatar alone, named in a tooltip, and the
 * menu opens to the side; expanded, it opens upwards. */

/** One of the standard account rows. */
type FrameAccountRow = 'profile' | 'settings' | 'shortcuts' | 'help'

const DEFAULT_COPY = { profile: 'Profile', settings: 'Settings', shortcuts: 'Keyboard shortcuts', help: 'Help & support' }
type FrameAccountCopy = typeof DEFAULT_COPY

interface FrameAccountCardProps {
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

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

function AccountItems({ copy, onSelect }: { copy: FrameAccountCopy; onSelect?: (row: FrameAccountRow) => void }) {
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

function FrameAccountCard({ user, onSignOut = () => {}, onSelect, copy, children, className }: FrameAccountCardProps) {
  const compact = useFrameCompact()
  const rail = useFrameRail()
  const { isMobile } = useSidebar()
  const avatar = (
    <Avatar className="size-8 rounded-md after:rounded-md">
      {user.avatar && <AvatarImage src={user.avatar} alt="" className="rounded-md" />}
      <AvatarFallback className="rounded-md bg-accent-subtle text-accent-text">{initials(user.name)}</AvatarFallback>
    </Avatar>
  )
  return (
    <SidebarMenu data-slot="frame-account-card" className={cn(!rail && ISLAND)}>
      <SidebarMenuItem>
        <AccountMenu
          user={user}
          onSignOut={onSignOut}
          side={compact && !isMobile ? 'inline-end' : 'top'}
          align={compact && !isMobile ? 'end' : 'start'}
          trigger={
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              data-yj-trigger=""
              className={cn(
                // A key inside the tray: the concentric corner, ink on the wash when pointed at or open.
                'gap-2.5 rounded-lg data-popup-open:bg-hover',
                rail && 'size-8 justify-center p-0',
                className,
              )}
            >
              {avatar}
              {!rail && (
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-ui font-medium text-fg">{user.name}</span>
                  <span className="truncate text-ui-sm text-fg-muted">{user.email}</span>
                </span>
              )}
              {!rail && <ChevronsUpDownIcon size={12} strokeWidth={2} className={cn('ms-auto size-3!', KEY_CAP)} />}
            </SidebarMenuButton>
          }
        >
          {children ?? <AccountItems copy={{ ...DEFAULT_COPY, ...copy }} onSelect={onSelect} />}
        </AccountMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { FrameAccountCard }
export type { FrameAccountCardProps, FrameAccountCopy, FrameAccountRow }

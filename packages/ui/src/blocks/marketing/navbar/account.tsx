'use client'

import type { ElementType } from 'react'
import { LogOutIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { initials } from '../../../lib/utils'
import type { MarketingNavbarAccountLink, MarketingNavbarCopy, MarketingNavbarUser } from './data'

/* The signed-in person: an avatar that opens a menu of account pages and
 * Sign out. Arrow keys move through it, Escape closes it and returns focus. */

export function UserAvatar({ user, size }: { user: MarketingNavbarUser; size?: 'sm' | 'default' | 'lg' }) {
  return (
    <Avatar aria-hidden size={size}>
      {user.avatar && <AvatarImage src={user.avatar} alt="" />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  )
}

interface AccountMenuProps {
  user: MarketingNavbarUser
  links: MarketingNavbarAccountLink[]
  onSignOut?: () => void
  copy: MarketingNavbarCopy
  Link: ElementType
}

export function AccountMenu({ user, links, onSignOut, copy, Link }: AccountMenuProps) {
  return (
    <DropdownMenu>
      {/* shape: the button is the round avatar it holds, so its ring follows the avatar */}
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full max-md:hidden" aria-label={copy.account(user.name)} />}>
        <UserAvatar user={user} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-ui font-medium text-fg">{user.name}</span>
            {user.email && <span className="font-normal text-fg-muted">{user.email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {links.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
            {link.icon}
            {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOutIcon size={16} className="rtl:-scale-x-100" />
          {copy.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { avatarStackLabels } from '@youj/core/labels'
import { cn, initials } from '../../lib/utils'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from './popover'
import { ScrollArea } from './scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/* Who is here: overlapping avatars, the first `max` shown and the rest
 * behind a "+N" that opens the full list in a Popover.
 * - Motion: hovering the stack fans it out a few px (transform only, from
 *   the inline start) and the avatar under the pointer lifts above its
 *   neighbors, on the fast token; each avatar's name shows in a tooltip. A
 *   presence dot pops in when the status changes. Reduced motion: no fan, no
 *   lift, dots appear.
 * - Access: the stack is a group named with everyone in it ("Mira Chen,
 *   Jonas Weber and 4 others"); "+N" is a button that opens the list, where
 *   each person's status is written out. */

type Presence = 'online' | 'away' | 'busy' | 'offline'

interface AvatarStackUser {
  id: string
  name: string
  src?: string
  presence?: Presence
  /** A second line in the list: a role, an email, "Editing". */
  description?: ReactNode
}

interface AvatarStackProps extends Omit<ComponentProps<'div'>, 'children'> {
  users: readonly AvatarStackUser[]
  /** Avatars shown before "+N". Default 4. */
  max?: number
  size?: 'sm' | 'default' | 'lg'
  /** What the people are, for the group's name and the list heading. Default "People". */
  label?: string
}

const presenceClass: Record<Presence, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-danger',
  offline: 'bg-fg-muted',
}

/** Less overlap than the group's default, so each avatar's initials stay readable beside the next. */
const overlap = { sm: '-space-x-1', default: '-space-x-1.5', lg: '-space-x-2' } as const

/** Fans the stack out on hover: each avatar moves by its index, towards the inline end. */
const fan = cn(
  'relative transition-[translate] yj-duration-fast ease-standard',
  'group-hover/stack:translate-x-[calc(var(--i)*3px)] rtl:group-hover/stack:translate-x-[calc(var(--i)*-3px)]',
  'reduced:translate-x-0 reduced:group-hover/stack:translate-x-0',
)

/** An avatar for a person. Spreads the rest onto the Avatar, so it can be a Tooltip trigger's render element. */
function PersonAvatar({ user, ...props }: { user: AvatarStackUser } & ComponentProps<typeof Avatar>) {
  return (
    // A trigger's render props carry its own data-slot; the avatar keeps its own.
    <Avatar {...props} data-slot="avatar">
      {user.src && <AvatarImage src={user.src} alt="" />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
      {user.presence && (
        // Keyed by status, so a change remounts the dot and it pops in again.
        <AvatarBadge
          key={user.presence}
          data-presence={user.presence}
          className={cn(presenceClass[user.presence], 'transition-[scale] yj-duration-base ease-enter starting:scale-0')}
        />
      )}
    </Avatar>
  )
}

function AvatarStack({ users, max = 4, size = 'default', label, className, ...props }: AvatarStackProps) {
  const k = useYouj()
  const labels = useComponentLabels(avatarStackLabels)
  label ??= labels.avatarStackPeople
  const presenceText: Record<Presence, string> = {
    online: labels.presenceOnline,
    away: labels.presenceAway,
    busy: labels.presenceBusy,
    offline: labels.presenceOffline,
  }
  // "+1" would hide one face behind a counter the same size: show it instead.
  const shown = users.length === max + 1 ? users : users.slice(0, max)
  const hidden = users.length - shown.length
  const names = users.map((user) => user.name)

  return (
    <TooltipProvider delay={200}>
      <AvatarGroup
        role="group"
        aria-label={`${label}: ${labels.avatarStackNames(names)}`}
        data-slot="avatar-stack"
        data-reduced-motion={k.reduced || undefined}
        className={cn('group/stack isolate items-center', overlap[size], className)}
        {...props}
      >
        {shown.map((user, index) => (
          <Tooltip key={user.id}>
            <TooltipTrigger
              render={
                <PersonAvatar
                  user={user}
                  size={size}
                  // Later avatars sit under earlier ones; the hovered one rises above all.
                  className={cn(fan, 'hover:z-20 hover:-translate-y-0.5 reduced:hover:translate-y-0')}
                  style={{ '--i': index, zIndex: shown.length - index } as CSSProperties}
                />
              }
            />
            <TooltipContent>
              {user.name}
              {user.presence && <span className="own:-ms-1 opacity-70">· {presenceText[user.presence]}</span>}
            </TooltipContent>
          </Tooltip>
        ))}
        {hidden > 0 && (
          <Popover>
            <PopoverTrigger
              aria-label={labels.avatarStackShowAll(users.length, label)}
              // An opaque base under the count's translucent fill, so the avatar it overlaps doesn't show through.
              className={cn(fan, 'group/count own:rounded-full own:bg-canvas focus-ring')}
              style={{ '--i': shown.length } as CSSProperties}
            >
              <AvatarGroupCount
                aria-hidden
                className="transition-colors yj-duration-fast ease-standard group-hover/count:bg-hover group-hover/count:text-fg group-aria-expanded/count:bg-hover group-aria-expanded/count:text-fg"
              >
                +{hidden}
              </AvatarGroupCount>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 gap-0 own:p-0">
              <div className="own:flex items-baseline justify-between border-b border-line px-3 py-2.5">
                <PopoverTitle className="text-ui font-semibold">{label}</PopoverTitle>
                <span className="own:text-ui-sm own:text-fg-muted own:tabular-nums">{users.length}</span>
              </div>
              <ScrollArea className="max-h-72" viewportClassName="max-h-72">
                <ul className="flex flex-col p-1.5">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                      <PersonAvatar user={user} size="sm" />
                      <div className="own:flex min-w-0 flex-1 flex-col">
                        <span className="truncate own:text-ui own:font-medium own:text-fg">{user.name}</span>
                        {user.description && <span className="truncate own:text-ui-sm own:text-fg-muted">{user.description}</span>}
                      </div>
                      {user.presence && <span className="shrink-0 own:text-ui-sm own:text-fg-muted">{presenceText[user.presence]}</span>}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </AvatarGroup>
    </TooltipProvider>
  )
}

export { AvatarStack, type AvatarStackProps, type AvatarStackUser, type Presence }

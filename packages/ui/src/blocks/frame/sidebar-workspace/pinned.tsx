'use client'

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { badgeText, useFrame, type FrameNavItem } from '../shell'
import { FrameNavIcon } from '../shell/nav-icon'
import { BREATH } from '../shell/signature'

/* The pages you live in, pinned as tiles above the list: three to a row, the
 * icon over the name, a count on the tile's corner. The current one wears
 * the sidebar's raised key, as a row does. Folded to icons they stack into
 * the column as squares, the count a dot on the corner. Pinned pages leave
 * the list below, so each page is listed once. */

export function PinnedTiles({ items, label }: { items: FrameNavItem[]; label: string }) {
  const { active, link, Link } = useFrame()
  const { state, isMobile } = useSidebar()
  const rail = state === 'collapsed' && !isMobile
  return (
    <SidebarGroup className="pb-1">
      <SidebarMenu aria-label={label} data-slot="frame-pinned" className={cn('grid gap-1', rail ? 'grid-cols-1' : 'grid-cols-3')}>
        {items.map((item) => {
          const count = item.badge !== undefined
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={active === item.id}
                tooltip={item.label}
                data-yj-trigger=""
                render={<Link {...link(item)} />}
                className={cn(
                  BREATH,
                  'h-14 flex-col justify-center gap-1 px-1 text-fg-muted hover:text-fg data-active:text-fg',
                  '[&>svg:first-child]:text-fg-subtle hover:[&>svg:first-child]:text-fg data-active:[&>svg:first-child]:text-accent-text',
                  'group-data-[collapsible=icon]:size-control! group-data-[collapsible=icon]:[&>[data-tile-label]]:sr-only',
                )}
              >
                {item.icon && <FrameNavIcon icon={item.icon} current={active === item.id} />}
                <span data-tile-label="" className="max-w-full text-ui-xs">
                  {item.label}
                </span>
                {count && <span className="sr-only">, {badgeText(item)}</span>}
              </SidebarMenuButton>
              {count && (
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[length:--spacing(2.5)] leading-none font-semibold tabular-nums',
                    item.badgeTone === 'danger' ? 'bg-danger text-on-accent' : 'bg-well text-fg-muted',
                    // Folded, the count is a dot on the icon's corner.
                    'group-data-[collapsible=icon]:end-0.5 group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:size-2 group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-transparent',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

'use client'

import { Fragment, useRef, useState, type CSSProperties } from 'react'
import { useLabels } from '@youj/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '../../components/ui/dropdown-menu'
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '../../components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'
import { badgeText, FrameRail, useFrame, type FrameNavItem, type FrameSidebarSlots } from './shell'
import { INSET_ON_CHROME } from './shell/inset'
import type { MobileNav } from './shell/context'
import { FrameNavIcon } from './shell/nav-icon'
import { FrameNavList } from './shell/nav-list'
import { FrameSidebarBase } from './shell/sidebar-base'

/* The icon rail, for products with a handful of areas: a slim card floating
 * on the theme's gray chrome beside the page's card, the header's mark on
 * top, one key per top-level page with its name in a tooltip (the nav's
 * sections set apart by a short rule), and the footer's parts (the account's
 * avatar) at the bottom. The current page's key is raised and glides from
 * key to key; a count is a dot on the key's corner, read after the name. A
 * page with pages of its own opens them in a menu to its side.
 * - ⌘B or the trigger slides it away off-canvas, out of the keyboard's reach.
 * - On phones it's the kit's bottom tab bar: the first four pages and Menu,
 *   which opens the whole nav as a list in a sheet. */

type FrameSidebarIconRailProps = FrameSidebarSlots

/* The rail is 56px: a control-sized key with its gutters. */
const RAIL = 'calc(var(--spacing) * 14)'

const keyClass = cn(
  'size-control! justify-center p-0 text-fg-muted hover:text-fg data-active:text-fg aria-expanded:text-fg',
  '[&>svg]:size-4.5! data-active:[&>svg]:text-accent-text',
)

function Key({ item }: { item: FrameNavItem }) {
  const { active, trail, link, Link } = useFrame()
  const group = Boolean(item.items?.length)
  const current = group ? trail?.item.id === item.id : active === item.id
  const [menu, setMenu] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const name = item.badge !== undefined ? `${item.label}, ${badgeText(item)}` : item.label
  const dot = item.badge !== undefined && (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute end-2 top-2 size-1.5 rounded-full ring-2 ring-surface', item.badgeTone === 'danger' ? 'bg-danger' : 'bg-accent')}
    />
  )
  const face = item.icon ? <FrameNavIcon icon={item.icon} current={current} size={18} /> : <span className="text-ui font-semibold">{item.label[0]}</span>
  return (
    <SidebarMenuItem className="flex justify-center">
      <Tooltip>
        <TooltipTrigger
          render={
            group ? (
              <SidebarMenuButton
                ref={button}
                isActive={current}
                aria-label={item.label}
                aria-haspopup="menu"
                aria-expanded={menu}
                data-yj-trigger=""
                onClick={() => setMenu(true)}
                className={keyClass}
              />
            ) : (
              <SidebarMenuButton isActive={current} aria-label={name} data-yj-trigger="" render={<Link {...link(item)} />} className={keyClass} />
            )
          }
        >
          {face}
        </TooltipTrigger>
        <TooltipContent side="inline-end" sideOffset={12} className="pointer-events-none">
          {item.label}
        </TooltipContent>
      </Tooltip>
      {dot}
      {group && (
        <DropdownMenu open={menu} onOpenChange={setMenu}>
          <DropdownMenuContent anchor={button} side="inline-end" align="start" sideOffset={14} className="min-w-48">
            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
            {item.items!.map((child) => (
              <DropdownMenuItem key={child.id} render={<Link {...link(child)} />} className={cn(active === child.id && 'font-medium text-fg')}>
                <span className="min-w-0 flex-1 truncate">{child.label}</span>
                {child.badge !== undefined && (
                  <>
                    <span className="sr-only">, {badgeText(child)}</span>
                    <span aria-hidden className="text-ui-sm text-fg-muted tabular-nums">
                      {child.badge}
                    </span>
                  </>
                )}
                {active === child.id && <span aria-hidden className="size-1.5 shrink-0 rounded-[1px] bg-accent" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  )
}

function FrameSidebarIconRail({ header, footer, className }: FrameSidebarIconRailProps) {
  const { nav } = useFrame()
  const { isMobile } = useSidebar()
  const labels = useLabels()
  return (
    <FrameSidebarBase
      collapsible="offcanvas"
      variant="inset"
      paper={isMobile ? 'white' : 'none'}
      data-frame-sidebar="icon-rail"
      data-yj-ground="chrome"
      style={{ '--sidebar-width': `calc(${RAIL} + var(--spacing) * 4)` } as CSSProperties}
      className={cn(INSET_ON_CHROME, className)}
    >
      {isMobile ? (
        // The sheet behind the tab bar's Menu: the whole nav as a list, with the header and footer.
        <>
          {header && <SidebarHeader className="pb-0">{header}</SidebarHeader>}
          <SidebarContent indicator="fill">
            <FrameNavList />
          </SidebarContent>
          {footer && <SidebarFooter>{footer}</SidebarFooter>}
        </>
      ) : (
        <div className="flex size-full min-h-0 flex-col items-center gap-2 rounded-surface bg-surface py-2 shadow-sm ring-1 ring-line">
          {header && (
            <FrameRail>
              <div className="flex justify-center [&_[data-sidebar=menu-item]]:flex [&_[data-sidebar=menu-item]]:justify-center">{header}</div>
            </FrameRail>
          )}
          <SidebarContent className="w-full [scrollbar-width:none]">
            <nav aria-label={labels.pages} className="flex flex-col items-center gap-2 py-1">
              {nav.map((section, i) => (
                <Fragment key={section.id}>
                  {i > 0 && <SidebarSeparator className="mx-auto w-6" />}
                  <SidebarMenu aria-label={section.label} className="items-center gap-1">
                    {section.items.map((item) => (
                      <Key key={item.id} item={item} />
                    ))}
                  </SidebarMenu>
                </Fragment>
              ))}
            </nav>
          </SidebarContent>
          {footer && (
            <FrameRail>
              <div className="flex flex-col items-center gap-2 [&_[data-sidebar=menu-item]]:flex [&_[data-sidebar=menu-item]]:justify-center">{footer}</div>
            </FrameRail>
          )}
        </div>
      )}
    </FrameSidebarBase>
  )
}

/** On phones the rail is the frame's bottom tab bar: AppFrame reads this and shows it. */
FrameSidebarIconRail.mobileNav = 'tabs' as MobileNav

export { FrameSidebarIconRail }
export type { FrameSidebarIconRailProps }

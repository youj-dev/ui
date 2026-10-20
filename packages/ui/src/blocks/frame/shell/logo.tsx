'use client'

import type { ReactNode } from 'react'
import { WindIcon } from '@youj/icons'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { useFrame, useFrameRail } from './context'

interface FrameLogoProps {
  /** The product's name, beside the mark and as the link's name. */
  name: string
  /** Your logomark, 32px square. Default: a tile in the accent color. */
  mark?: ReactNode
  /** Where the logo goes. Default: the frame's first page. */
  href?: string
  className?: string
}

/** The mark in the accent: a tile the theme recolors, with a glyph that moves on hover. */
function Mark() {
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-on-accent shadow-xs">
      <WindIcon size={16} strokeWidth={2} />
    </span>
  )
}

/**
 * The product's mark and name, for a sidebar's `header`. It links home, and
 * in a narrow region (a collapsed sidebar, a rail) it's the mark alone, still
 * named for assistive tech.
 */
function FrameLogo({ name, mark, href, className }: FrameLogoProps) {
  const rail = useFrameRail()
  const { nav, link, Link } = useFrame()
  const home = nav[0]?.items[0]
  const target = href ? { href } : home ? { href: link(home).href, onClick: link(home).onClick } : { href: '#' }
  return (
    <SidebarMenu data-slot="frame-logo">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip={name}
          data-yj-trigger=""
          aria-label={rail ? name : undefined}
          render={<Link {...target} />}
          className={cn('gap-2.5 hover:bg-transparent', rail && 'size-8 justify-center p-0', className)}
        >
          {mark ?? <Mark />}
          {/* In a sidebar collapsing to icons, the name fades with the collapse (SidebarMenuButton's own rule). */}
          {!rail && <span className="truncate text-ui font-semibold tracking-tight text-fg">{name}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { FrameLogo }
export type { FrameLogoProps }

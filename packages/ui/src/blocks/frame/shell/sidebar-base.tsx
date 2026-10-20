'use client'

import type { ComponentProps } from 'react'
import { Sidebar } from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { FOLD_SPRING, PAPER, SLIDE_SPRING } from './signature'

/* Every frame sidebar is the kit's Sidebar, set the frames' way:
 * - Its content sits on a plane of its own inside the Sidebar, so the phone's
 *   sheet wears it too: the white paper (white in light whatever the page,
 *   the page in dark, a two-tone theme's dark chrome where the theme asks),
 *   the theme's gray chrome, or nothing, for a sidebar of floating cards or
 *   glass that paints its own.
 * - It folds and unfolds (and slides off-canvas) on the kit's spring.
 * The current page's look is each sidebar's own: SidebarContent's indicator.
 * It takes the Sidebar's own props. */

type FramePaper = 'white' | 'chrome' | 'none'

const PAPERS: Record<FramePaper, string> = {
  white: PAPER,
  chrome: 'bg-chrome text-fg',
  none: 'text-fg',
}

function FrameSidebarBase({
  className,
  children,
  collapsible = 'offcanvas',
  paper = 'white',
  ...props
}: ComponentProps<typeof Sidebar> & {
  /** The plane under the content. Default `white`. */
  paper?: FramePaper
}) {
  return (
    <Sidebar collapsible={collapsible} {...props} className={cn(FOLD_SPRING, collapsible === 'offcanvas' && SLIDE_SPRING, className)}>
      <div data-slot="frame-sidebar-paper" data-yj-tone="chrome" className={cn('flex min-h-0 flex-1 flex-col', PAPERS[paper])}>
        {children}
      </div>
    </Sidebar>
  )
}

export { FrameSidebarBase }

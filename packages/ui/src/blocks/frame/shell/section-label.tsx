'use client'

import type { ComponentProps } from 'react'
import { cn } from '../../../lib/utils'

/** The heading's look, for a heading that is also a button (a section that folds). */
export const SECTION_LABEL = cn(
  'flex h-7 shrink-0 items-center gap-2 px-2 text-ui-xs font-medium tracking-[var(--yj-label-tracking,0.04em)] text-fg-subtle select-none',
  '[transition:margin_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard)]',
  'group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:-mt-7 group-data-[collapsible=icon]:opacity-0',
)

/**
 * A nav section's heading in a frame sidebar: the kit's eyebrow. It speaks in
 * the theme's label voice (Brutal's mono capitals, Graphite's plain words;
 * Bezel sets it as its mono eyebrow), small and in subtle ink, tracked at
 * least a little. In a sidebar collapsed to icons it folds away, as the
 * Sidebar's own group label does, and lets the menu rise into its place.
 */
function FrameSectionLabel({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-group-label" data-sidebar="group-label" className={cn(SECTION_LABEL, className)} {...props} />
}

export { FrameSectionLabel }

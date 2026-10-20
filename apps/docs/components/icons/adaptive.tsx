'use client'

import type { ReactElement, ReactNode } from 'react'
import { useMediaQuery } from '@/lib/use-media-query'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, Popover, PopoverContent, PopoverTitle, PopoverTrigger, type PopoverContentProps } from '@youj/react'

/* A panel in the shape each screen handles best: a popover grown out of its
 * trigger on a wide screen (yj-pop), a bottom sheet you can swipe away on a
 * phone (yj-sheet-bottom). Same content, same state, either way. */

/** A phone: panels open as bottom sheets. */
export const usePhone = () => useMediaQuery('(max-width: 639px)')

/** Wide enough to dock the inspector beside the grid (else it opens in a sheet). */
export const useDocked = () => useMediaQuery('(min-width: 1024px)', true)

interface AdaptivePanelProps {
  trigger: ReactElement
  /** Names the panel. The sheet always shows it; the popover shows it when `heading` is set. */
  title: string
  heading?: boolean
  /** Beside the title (a reset). */
  actions?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'start' | 'center' | 'end'
  /** The popover's first focus (Base UI's initialFocus). */
  initialFocus?: PopoverContentProps['initialFocus']
  /** The popover's box (width, padding). */
  className?: string
  children: ReactNode
}

export function AdaptivePanel({ trigger, title, heading, actions, open, onOpenChange, align = 'end', initialFocus, className, children }: AdaptivePanelProps) {
  const phone = usePhone()
  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerHeader className="flex-row items-center justify-between gap-3">
            <DrawerTitle>{title}</DrawerTitle>
            {actions}
          </DrawerHeader>
          <div className="px-5 pb-6">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} initialFocus={initialFocus} aria-label={heading ? undefined : title} className={className}>
        {heading && (
          <div className="flex min-h-6 items-center justify-between gap-3">
            <PopoverTitle className="text-[13px] font-semibold">{title}</PopoverTitle>
            {actions}
          </div>
        )}
        {children}
      </PopoverContent>
    </Popover>
  )
}

/** A touch screen: no hover, so a tap reveals a card's island. */
export const useCoarse = () => useMediaQuery('(pointer: coarse)')

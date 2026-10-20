'use client'

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* Base UI's scroll area: native scrolling (wheel, touch, keyboard once the
 * viewport is focused) with thin overlay scrollbars that fade in while you
 * hover or scroll and fade away after. The edges fade by how far there is
 * to scroll on that side, straight from Base UI's overflow variables, so
 * the mask grows with the scroll instead of switching on. The viewport is a
 * tab stop only when it scrolls, and draws its focus ring inside. */

interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
  /** Which scrollbars to render. Default 'vertical'. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Fade the edges that have more to scroll. Default true. */
  fade?: boolean
  /** Classes for the viewport (the element that scrolls). */
  viewportClassName?: string
}

const FADE = '24px'
const fadeMask = {
  vertical: `linear-gradient(to bottom, transparent, black min(var(--scroll-area-overflow-y-start, 0px), ${FADE}), black calc(100% - min(var(--scroll-area-overflow-y-end, 0px), ${FADE})), transparent)`,
  horizontal: `linear-gradient(to right, transparent, black min(var(--scroll-area-overflow-x-start, 0px), ${FADE}), black calc(100% - min(var(--scroll-area-overflow-x-end, 0px), ${FADE})), transparent)`,
}

function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  fade = true,
  viewportClassName,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: ScrollAreaProps) {
  const direction = useDirection()
  // The viewport is the tab stop, so it carries the name, as a region.
  const named = label || labelledBy ? { role: 'region', 'aria-label': label, 'aria-labelledby': labelledBy } : null
  const masks = [
    orientation !== 'horizontal' ? fadeMask.vertical : null,
    orientation !== 'vertical' ? fadeMask.horizontal : null,
  ].filter(Boolean) as string[]
  const mask = fade ? masks.join(', ') : undefined
  return (
    <DirectionProvider direction={direction}>
      <ScrollAreaPrimitive.Root
        data-slot="scroll-area"
        className={cn(
          'relative own:min-h-0 overflow-hidden',
          // The viewport is masked, and a mask would eat its own focus ring at
          // the faded edges: the root draws the ring for it.
          'own:[&:has(>[data-slot=scroll-area-viewport]:focus-visible)]:outline-2 own:[&:has(>[data-slot=scroll-area-viewport]:focus-visible)]:outline-offset-2 own:[&:has(>[data-slot=scroll-area-viewport]:focus-visible)]:outline-focus own:[&:has(>[data-slot=scroll-area-viewport]:focus-visible)]:outline-solid',
          className,
        )}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          {...named}
          className={cn('size-full overscroll-contain rounded-[inherit] outline-none', viewportClassName)}
          // Two masks intersect, so each axis fades its own edges.
          style={mask ? { maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' } : undefined}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {orientation !== 'horizontal' && <ScrollBar orientation="vertical" />}
        {orientation !== 'vertical' && <ScrollBar orientation="horizontal" />}
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </DirectionProvider>
  )
}

function ScrollBar({ className, orientation = 'vertical', ...props }: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'group/scrollbar own:flex touch-none own:p-px select-none',
        // Overlay bars: present while hovering or scrolling, then away.
        'opacity-0 transition-opacity yj-duration-slow ease-standard data-hovering:opacity-100 data-scrolling:opacity-100 data-scrolling:yj-duration-instant',
        'own:data-[orientation=vertical]:h-full own:data-[orientation=vertical]:w-2.5',
        'own:data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          // The thumb tokens native bars use (ui.css), so both read as one
          // family: quiet while the bar shows, the 3:1 boundary once the
          // pointer is on the bar, firmest on the thumb or while dragged.
          'relative flex-1 rounded-full bg-(--ui-scrollbar-thumb) group-hover/scrollbar:bg-(--ui-scrollbar-thumb-hover) hover:bg-(--ui-scrollbar-thumb-active) active:bg-(--ui-scrollbar-thumb-active)',
          // A 6px pill that widens to 8px while the pointer is on the bar. A
          // clip, not a resize, so nothing is laid out again.
          '[clip-path:inset(1px_round_999px)] group-hover/scrollbar:[clip-path:inset(0_round_999px)] active:[clip-path:inset(0_round_999px)]',
          'transition-[background-color,clip-path] yj-duration-fast ease-standard',
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar, type ScrollAreaProps }

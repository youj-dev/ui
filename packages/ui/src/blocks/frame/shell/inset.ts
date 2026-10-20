import { cn } from '../../../lib/utils'

/* The page as a card inset beside the sidebar (the Sidebar's inset variant),
 * for the sidebar container's className. Selectors from the container to its
 * frame: the page beside it (SidebarInset's main) and that page's top bar,
 * spelled out in full so Tailwind finds them.
 * - The card slides over with the fold, on the same spring as the edge.
 * - The frame's top bar, whichever it is, pins to the card's top edge: it
 *   sticks at the card's inset, draws the card's rounded top over the card's
 *   own, and paints the ground above itself, so the page scrolls inside the
 *   card as if it were a window. No top bar has to know about it.
 * - The card takes the medium elevation on its hairline. */

const CARD = cn(
  '[:has(>[data-slot=sidebar]>&)>main]:transition-[margin] [:has(>[data-slot=sidebar]>&)>main]:[transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] [:has(>[data-slot=sidebar]>&)>main]:ease-spring',
  '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:top-2 [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:-mx-px [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:-mt-px [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:w-auto',
  '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:rounded-t-xl [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:border-x [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:border-t',
  '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:border-x-line [:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:border-t-line',
  // Condensed, it's the card's own surface, frosted.
  '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header][data-surface]]:bg-surface',
  'md:[:has(>[data-slot=sidebar]>&)>main]:shadow-md',
)

/** On the white paper: the ground above the bar is the key's white plane in light and the chrome in dark, as AppFrame's paper is. */
export const INSET_ON_PAPER = cn(
  CARD,
  '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:shadow-[0_calc(--spacing(-2)_-_var(--radius-xl))_0_0_color-mix(in_oklab,var(--color-key)_calc(100%_-_100%_*_var(--yj-dark)),var(--color-chrome))]',
)

/** On the gray chrome (with `data-yj-ground="chrome"` on the Sidebar): the ground above the bar is the canvas, as the frame's paper is there. */
export const INSET_ON_CHROME = cn(CARD, '[:has(>[data-slot=sidebar]>&)>main>[data-slot=app-header]]:shadow-[0_calc(--spacing(-2)_-_var(--radius-xl))_0_0_var(--color-canvas)]')

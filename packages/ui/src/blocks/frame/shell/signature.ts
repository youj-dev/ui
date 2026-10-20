import { cn } from '../../../lib/utils'

/* The frame sidebars' signature as class strings:
 * what makes a Youj sidebar look like Youj and not like a default one. Written
 * out in full so Tailwind finds every class. */

/**
 * Rule 1, paper: a chrome tone scope that declares the white page. `bg-chrome`
 * is then the white plane in light whatever the page, and the page itself in
 * dark (the page swap is a no-op there); a two-tone theme's dark chrome still
 * darkens it, since the scope derives in the chrome's mode. Write it with
 * `data-yj-tone="chrome"`, so the roles re-derive inside.
 */
export const PAPER = 'bg-chrome text-fg [--yj-neutral-page:1]'

/**
 * Rule 7, the fold on the spring: the sidebar's width (and an off-canvas
 * sidebar's slide) runs on the kit's spring curve, not the slow tween. For the
 * Sidebar's container, which already names what it transitions.
 */
export const FOLD_SPRING = 'ease-spring! [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))]!'

/** The off-canvas slide on the same spring, from the Sidebar's container to its panel. */
export const SLIDE_SPRING =
  '*:data-[slot=sidebar-inner]:ease-spring! *:data-[slot=sidebar-inner]:[transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))]!'

/**
 * Rule 3, hover is a breath: a row's wash and ink arrive at once and fade on
 * the base token, so a pointer moving down the list leaves a short trail; its
 * size (the fold to a square) moves on the spring with the width.
 */
export const ROW_MOTION = cn(
  '[transition:width_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),height_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),padding_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),color_var(--ui--breath)_var(--ease-standard),background-color_var(--ui--breath)_var(--ease-standard)]!',
  '[--ui--breath:calc(var(--yj-duration-base)*var(--yj-motion,1))] hover:[--ui--breath:calc(var(--yj-duration-instant)*var(--yj-motion,1))]',
)

/** The same breath for a row that doesn't fold (a tree's row, a flyout's link): its wash and ink only. */
export const BREATH = cn(
  '[transition:color_var(--ui--breath)_var(--ease-standard),background-color_var(--ui--breath)_var(--ease-standard)]!',
  '[--ui--breath:calc(var(--yj-duration-base)*var(--yj-motion,1))] hover:[--ui--breath:calc(var(--yj-duration-instant)*var(--yj-motion,1))]',
)

/**
 * A row's ink: its name muted at rest and in ink when pointed at, open or
 * current (current in the medium weight); its leading icon a step quieter,
 * and the accent when its page is current.
 */
export const ROW_INK = cn(
  'text-fg-muted hover:text-fg aria-expanded:text-fg data-active:font-medium data-active:text-fg',
  '[&>svg:first-child]:text-fg-subtle [&>svg:first-child]:transition-colors [&>svg:first-child]:yj-duration-fast',
  'hover:[&>svg:first-child]:text-fg aria-expanded:[&>svg:first-child]:text-fg data-active:[&>svg:first-child]:text-accent-text',
)

/**
 * Rule 6, the foot is an island: a raised tray on the paper, the large
 * control's corner around keys at the concentric one inside it. In a sidebar
 * folding to icons, its tray fades and its padding closes with the width, so
 * the avatar alone is left in the column.
 */
export const ISLAND = cn(
  'rounded-xl border border-line bg-chrome-float p-1 shadow-sm',
  'transition-[background-color,border-color,box-shadow,padding] yj-duration-fast ease-standard',
  'group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none',
)

/**
 * A key cap around a small trailing icon (a menu's chevrons): the kit's
 * keycap, a key on a hairline with its lower edge, so it reads as a key you
 * press. Give the icon its size (`size-3!` inside a sidebar row, whose own
 * rule sizes every icon to 16px); the cap adds 4px a side.
 */
export const KEY_CAP = 'box-content shrink-0 rounded-sm border border-line bg-key p-0.75 text-fg-muted shadow-[inset_0_-1px_0_var(--color-line)]'

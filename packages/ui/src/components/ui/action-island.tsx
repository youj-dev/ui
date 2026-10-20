'use client'

import { isValidElement, useEffect, useRef, type ComponentProps, type ReactElement, type ReactNode, type Ref } from 'react'
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useDirection, useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* A floating island of actions over a canvas (a preview, an editor, a
 * map): an elevated rounded tray holding separate tiles with small gaps
 * between them, so each action reads as a key of its own. Quiet tiles sit
 * on a hairline; a pressed one (a view that's showing, a mode that's on)
 * takes a thin accent outline and accent ink, never a heavy fill; one
 * `primary` tile at the end is filled with the accent, so the island has
 * one clear next step. A `mark` tile at the start names what the island
 * acts on and isn't a control.
 *
 * It's Base UI's toolbar: one tab stop, the arrows rove its tiles
 * (wrapping, mirrored in RTL), Home and End jump to its ends, and a
 * disabled tile stays in the roving order. Every tile is an icon whose
 * tooltip is also its accessible name, unless it shows its `label`; a
 * tile can carry a menu's trigger through `render`. Presses don't scale
 * under reduced motion. */

/** What counts as a tile of the island when it's added: it fades and scales in. */
const PARTS = new Set(['action-island-tile', 'action-island-group', 'action-island-separator', 'action-island-mark'])

/**
 * Keeps the island's size from snapping: when its content changes width (a
 * tile added or removed, a label that changed) its width glides from the old
 * to the new, and the tiles that arrive fade and scale in with a tiny
 * stagger. Nothing moves under reduced motion.
 */
function useGlide(root: { current: HTMLElement | null }) {
  const k = useYouj()
  const clock = useRef(k)
  clock.current = k
  useEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined' || typeof el.animate !== 'function') return
    let width = el.offsetWidth
    let glide: Animation | undefined
    const resize = new ResizeObserver(() => {
      if (glide?.playState === 'running') return
      const from = width
      width = el.offsetWidth
      const { reduced, ms, ease } = clock.current
      if (reduced || !from || Math.abs(width - from) < 2) return
      glide = el.animate([{ width: `${from}px`, overflow: 'clip' }, { width: `${width}px`, overflow: 'clip' }], {
        duration: ms('base'),
        easing: `cubic-bezier(${ease('standard').join(',')})`, // youj-allow: the kit's own standard easing token, as a CSS string
      })
      glide.onfinish = glide.oncancel = () => {
        width = el.offsetWidth
      }
    })
    resize.observe(el)
    const arrive = new MutationObserver((records) => {
      const { reduced, ms, ease } = clock.current
      if (reduced) return
      const added = records.flatMap((r) => [...r.addedNodes]).filter((n): n is HTMLElement => n instanceof HTMLElement && PARTS.has(n.dataset.slot ?? ''))
      added.forEach((node, i) => {
        node.animate([{ opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }], {
          duration: ms('fast'),
          delay: i * ms('instant') * 0.4,
          easing: `cubic-bezier(${ease('enter').join(',')})`, // youj-allow: the kit's own enter easing token, as a CSS string
          fill: 'backwards',
        })
      })
    })
    arrive.observe(el, { childList: true, subtree: true })
    return () => {
      resize.disconnect()
      arrive.disconnect()
      glide?.cancel()
    }
  }, [root])
}

interface ActionIslandProps extends ToolbarPrimitive.Root.Props {
  /** `lg`: taller tiles (44px), larger icons and padding, for an island that floats over a canvas on its own. Default `default`. */
  size?: 'default' | 'lg'
}

function ActionIsland({ className, size = 'default', ref, ...props }: ActionIslandProps) {
  const direction = useDirection()
  const own = useRef<HTMLDivElement | null>(null)
  useGlide(own)
  return (
    <DirectionProvider direction={direction}>
      <ToolbarPrimitive.Root
        ref={(node: HTMLDivElement | null) => {
          own.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as { current: HTMLDivElement | null }).current = node
        }}
        data-slot="action-island"
        data-yj-tone="float"
        data-size={size}
        className={cn(
          'group/island own:flex w-fit max-w-full items-center own:gap-1 own:rounded-control own:border own:border-line own:bg-chrome-float own:p-1 own:text-fg own:shadow-lg data-[size=lg]:own:gap-1.5 data-[size=lg]:own:p-1.5',
          className,
        )}
        {...props}
      />
    </DirectionProvider>
  )
}

/** Tiles that belong together (the views, the look): the same small gap, kept on one line. */
function ActionIslandGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return <ToolbarPrimitive.Group data-slot="action-island-group" className={cn('own:flex shrink-0 items-center own:gap-1', className)} {...props} />
}

/** A hairline between groups. */
function ActionIslandSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="action-island-separator"
      orientation="vertical"
      className={cn('own:mx-0.5 h-4 w-px shrink-0 self-center own:bg-line', className)}
      {...props}
    />
  )
}

const tile = cn(
  'relative own:inline-flex h-control-sm min-w-control-sm shrink-0 items-center justify-center gap-1.5 own:rounded-control-sm own:border own:px-1.5 own:text-ui-sm own:font-medium whitespace-nowrap select-none outline-none',
  'transition-[color,background-color,border-color,scale] own:yj-duration-fast own:ease-standard focus-ring touch:yj-hit',
  'active:scale-[0.96] own:active:yj-duration-instant reduced:active:scale-100',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  'group-data-[size=lg]/island:h-11 group-data-[size=lg]/island:min-w-11 group-data-[size=lg]/island:px-2.5',
)

/** A quiet tile on its hairline; pressed (or a menu's open trigger), an accent outline and accent ink. */
const quiet = cn(
  'own:border-line-subtle own:bg-transparent own:text-fg-muted own:hover:bg-hover own:hover:text-fg',
  'aria-pressed:border-accent aria-pressed:bg-accent-subtle aria-pressed:text-accent-text aria-pressed:hover:bg-accent-subtle aria-pressed:hover:text-accent-text',
  'own:data-popup-open:border-accent data-popup-open:text-accent-text',
)

/** The one next step: filled with the accent, lettered in its contrast. */
const primary = 'own:border-transparent own:bg-accent own:text-on-accent own:yj-solid-hover'

interface ActionIslandTileProps extends Omit<ToolbarPrimitive.Button.Props, 'children' | 'render'> {
  /** The tooltip and the accessible name (keep any shown text inside it: "Story: Default" for a tile that shows "Default"). */
  label: string
  /** The icon (and, with `showLabel`, nothing else: the label is drawn for it). */
  children?: ReactNode
  /** A two-state tile (a view that's showing, a mode that's on): aria-pressed, drawn with an accent outline. */
  pressed?: boolean
  /** `primary`: the island's one filled tile. Default `quiet`. */
  variant?: 'quiet' | 'primary'
  /** Draw the label beside the icon (a primary action, a picker's current value). The tooltip stays for a truncated one. */
  showLabel?: boolean | ReactNode
  /** The tooltip's side. Default `top`: an island usually floats at a canvas's foot. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Renders the tile through another element: a menu's trigger, or a link (`<a href>`). */
  render?: ReactElement
  ref?: Ref<HTMLButtonElement>
}

/** A tile in the island's roving order: a button, a toggle (`pressed`), a menu's trigger or a link (`render`). */
function ActionIslandTile({ label, children, pressed, variant = 'quiet', showLabel, side = 'top', render, className, ref, ...props }: ActionIslandTileProps) {
  const k = useYouj()
  const text = showLabel === true ? label : showLabel || null
  const shared = {
    'data-slot': 'action-island-tile',
    'data-variant': variant,
    'data-reduced-motion': k.reduced || undefined,
    'aria-label': label,
    className: cn(tile, variant === 'primary' ? primary : quiet, text && 'own:px-2.5', className),
  }
  return (
    <Tooltip longPress>
      <TooltipTrigger
        render={
          // A link keeps its link role in the roving order; anything else is the toolbar's button (a menu's trigger through `render`).
          isValidElement(render) && render.type === 'a' ? (
            <ToolbarPrimitive.Link ref={ref as Ref<HTMLAnchorElement>} render={render} {...shared} {...(props as ToolbarPrimitive.Link.Props)} />
          ) : (
            <ToolbarPrimitive.Button ref={ref} aria-pressed={pressed} render={render} {...shared} {...props} />
          )
        }
      >
        {children}
        {text && <span className="min-w-0 truncate">{text}</span>}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

/** What the island acts on, at its start: a small mark or a short name. Not a control, so it's out of the roving order. */
function ActionIslandMark({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="action-island-mark"
      className={cn(
        'own:inline-flex h-control-sm min-w-control-sm shrink-0 items-center justify-center gap-1.5 own:rounded-control-sm own:bg-hover own:px-2 group-data-[size=lg]/island:h-11 group-data-[size=lg]/island:min-w-11 own:text-ui-sm own:font-medium own:text-fg [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}

export { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile }
export type { ActionIslandProps, ActionIslandTileProps }

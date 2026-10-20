'use client'

import { createContext, useContext, useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useYoujScope, usePortalContainer, useDirection } from '@youj/core'
import { cn } from '../../lib/utils'

/* A short visual label for a control, on hover or keyboard focus. It arrives
 * from its trigger with motion's yj-tooltip (a 3px drift off the trigger's
 * side, a slight scale and a fade on the fast token) and is gone on the
 * instant token. Inside a TooltipProvider, moving from one trigger to the next
 * shows the next tooltip at once and without animation, so scanning a toolbar
 * feels immediate. Reduced motion: instant.
 *
 * Tooltips are for sighted pointer and keyboard users. Base UI doesn't
 * describe the trigger with them, so an icon-only trigger still needs an
 * aria-label that matches the tooltip text.
 *
 * Touch has no hover, so by default a tooltip never opens there: a tap is a
 * press, and Base UI opens on focus only when it is keyboard focus, so a tap
 * can't leave one stuck either. Whatever a tooltip says must therefore also
 * be on the page or in the control's accessible name. `longPress` adds what
 * Android does for icon buttons: holding the trigger shows the tooltip, and
 * that press doesn't activate the control; it hides a moment after the
 * finger lifts, or at the next touch anywhere.
 *
 * Light theme: an ink chip. Dark theme: a lifted neutral chip with a hairline,
 * never a light panel on a dark page. Keycaps inside adapt to either. */

/** Groups tooltips: once one is open, the neighbors open instantly. Default delay 500ms. */
function TooltipProvider({ delay = 500, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />
}

/* Hold time before a press becomes a long press, and how long the tooltip
 * stays after the finger lifts: intent, like the hover delay, not motion, so
 * Speed leaves them alone. A finger that moves this far is scrolling. */
const LONG_PRESS = 500
const LINGER = 1500
const MOVE_SLOP = 10

/** The root's handle, so a trigger can open its tooltip on a long press. */
const LongPressHandle = createContext<TooltipPrimitive.Handle<unknown> | null>(null)

interface TooltipProps extends TooltipPrimitive.Root.Props {
  /**
   * On touch, holding the trigger shows the tooltip, and that press doesn't
   * activate the control; the tooltip hides a moment after the finger lifts
   * or at the next touch. Off by default: tooltips don't open on touch.
   */
  longPress?: boolean
}

function Tooltip({ longPress = false, handle, ...props }: TooltipProps) {
  const direction = useDirection()
  const [own] = useState(() => TooltipPrimitive.createHandle<unknown>())
  // Without long press the root is exactly Base UI's, with the handle (if any) it was given.
  const active = longPress ? (handle ?? own) : handle
  return (
    <LongPressHandle.Provider value={longPress ? (active ?? null) : null}>
      <DirectionProvider direction={direction}>
        <TooltipPrimitive.Root data-slot="tooltip" handle={active} {...props} />
      </DirectionProvider>
    </LongPressHandle.Provider>
  )
}

/** Long press on a touch trigger: opens the tooltip through the root's handle and swallows the click that follows. */
function useLongPress(id: string) {
  const handle = useContext(LongPressHandle)
  const press = useRef<{ x: number; y: number; timer: number } | null>(null)
  const shown = useRef(false)
  const linger = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(press.current?.timer)
      window.clearTimeout(linger.current)
    },
    [],
  )
  if (!handle) return null
  const cancel = () => {
    window.clearTimeout(press.current?.timer)
    press.current = null
  }
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      shown.current = false
      cancel()
      if (event.pointerType !== 'touch') return
      window.clearTimeout(linger.current)
      press.current = {
        x: event.clientX,
        y: event.clientY,
        timer: window.setTimeout(() => {
          press.current = null
          shown.current = true
          handle.open(id)
        }, LONG_PRESS),
      }
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const p = press.current
      if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > MOVE_SLOP) cancel()
    },
    onPointerUp() {
      cancel()
      if (shown.current) linger.current = window.setTimeout(() => handle.close(), LINGER)
    },
    onPointerCancel() {
      cancel()
      if (shown.current) linger.current = window.setTimeout(() => handle.close(), LINGER)
    },
    // The press that showed the tooltip is not a tap on the control.
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!shown.current) return
      shown.current = false
      event.preventDefault()
      event.stopPropagation()
    },
    // Nor does it open the browser's own long-press menu.
    onContextMenu(event: MouseEvent<HTMLElement>) {
      if (press.current || shown.current) event.preventDefault()
    },
  }
}

type LongPressHandlers = NonNullable<ReturnType<typeof useLongPress>>

/** The long-press handlers run before the consumer's own, which still run. */
function chain(own: LongPressHandlers, props: TooltipPrimitive.Trigger.Props) {
  const merged: Record<string, (event: never) => void> = {}
  for (const [name, handler] of Object.entries(own) as [keyof LongPressHandlers, (event: never) => void][]) {
    const theirs = props[name] as ((event: never) => void) | undefined
    merged[name] = (event) => {
      handler(event)
      theirs?.(event)
    }
  }
  return merged as Partial<TooltipPrimitive.Trigger.Props>
}

function TooltipTrigger({ id, className, ...props }: TooltipPrimitive.Trigger.Props) {
  const fallbackId = useId()
  const triggerId = id ?? fallbackId
  const longPress = useLongPress(triggerId)
  if (!longPress) return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" id={id} className={className} {...props} />
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      id={triggerId}
      // A held finger selects nothing and raises no callout over the control.
      className={(state) => cn('touch:select-none touch:[-webkit-touch-callout:none]', typeof className === 'function' ? className(state) : className)}
      {...props}
      {...chain(longPress, props)}
    />
  )
}

type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'>

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 6,
  align = 'center',
  alignOffset = 0,
  collisionPadding = 8,
  ...props
}: TooltipContentProps) {
  const scope = useYoujScope()
  const container = usePortalContainer()
  return (
    <TooltipPrimitive.Portal container={container} {...scope}>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          data-yj-tone="inverse"
          className={cn(
            'yj-tooltip inline-flex w-fit max-w-xs items-center gap-2 own:rounded-md border own:px-2 own:py-1 own:text-ui-sm font-medium text-balance',
            // The page's opposite: an inverse tone scope, so its text and its keys are that mode's own.
            'border-transparent bg-inverse text-fg shadow-sm',
            'own:has-data-[slot=kbd]:pe-1',
            // A shortcut means nothing without a keyboard: on touch (a long press) the keys are left out.
            'own:touch:pe-2 touch:**:data-[slot=kbd]:hidden touch:**:data-[slot=kbd-group]:hidden',
            '**:data-[slot=kbd]:border-line **:data-[slot=kbd]:bg-band **:data-[slot=kbd]:text-fg-muted **:data-[slot=kbd]:shadow-none',
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
export type { TooltipContentProps, TooltipProps }

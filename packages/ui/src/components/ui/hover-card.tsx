'use client'

import { createContext, useContext, useId, useRef, useState } from 'react'
import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useYoujScope, usePortalContainer, useDirection } from '@youj/core'
import { cn } from '../../lib/utils'

/* A preview of where a link goes (a person, a pull request, a deployment),
 * shown after resting on the link or focusing it. Base UI's PreviewCard: it
 * waits a beat before opening (so passing over links doesn't flash cards),
 * grows out of the link with motion's yj-pop, and stays while the pointer
 * travels onto it. Reduced motion: instant.
 *
 * Touch has no hover, so there a tap on the link opens its card instead of
 * leaving the page; a second tap on the link follows it (and closes the
 * card), and a tap anywhere else closes the card. Base UI's preview card
 * doesn't react to touch at all (its hover is mouse-only and its focus
 * keyboard-only), so without this a tap would simply follow the link and the
 * card would never be seen.
 *
 * It is a visual enhancement for sighted mouse, touch and keyboard users:
 * the link stays the only accessible interface, so everything in the card
 * must also be at the link's destination. */

/** The root's handle, so a trigger can open the card on a tap. */
const HoverCardHandle = createContext<PreviewCardPrimitive.Handle<unknown> | null>(null)

function HoverCard({ handle, ...props }: PreviewCardPrimitive.Root.Props) {
  const direction = useDirection()
  const [own] = useState(() => PreviewCardPrimitive.createHandle<unknown>())
  const active = handle ?? own
  return (
    <HoverCardHandle.Provider value={active}>
      <DirectionProvider direction={direction}>
        <PreviewCardPrimitive.Root data-slot="hover-card" handle={active} {...props} />
      </DirectionProvider>
    </HoverCardHandle.Provider>
  )
}

/** The link. Base UI renders an `<a>`. Hover intent (not motion, so Speed leaves it alone): half a second to open, a quarter to close. */
function HoverCardTrigger({ delay = 500, closeDelay = 250, id, onPointerDown, onClick, ...props }: PreviewCardPrimitive.Trigger.Props) {
  const handle = useContext(HoverCardHandle)
  const fallbackId = useId()
  const triggerId = id ?? fallbackId
  const touch = useRef(false)
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      id={triggerId}
      delay={delay}
      closeDelay={closeDelay}
      onPointerDown={(event) => {
        touch.current = event.pointerType === 'touch'
        onPointerDown?.(event)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (!touch.current || !handle || event.defaultPrevented) return
        if (event.currentTarget.hasAttribute('data-popup-open')) {
          // The second tap follows the link; the card goes with the page it previewed.
          handle.close()
        } else {
          // A first tap shows the card instead of leaving the page.
          event.preventDefault()
          handle.open(triggerId)
        }
      }}
      {...props}
    />
  )
}

type HoverCardContentProps = PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'>

function HoverCardContent({
  className,
  side = 'bottom',
  sideOffset = 8,
  align = 'center',
  alignOffset = 0,
  collisionPadding = 8,
  ...props
}: HoverCardContentProps) {
  const scope = useYoujScope()
  const container = usePortalContainer()
  return (
    <PreviewCardPrimitive.Portal container={container} {...scope}>
      <PreviewCardPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          data-yj-tone="overlay"
          className={cn(
            'yj-pop flex w-72 max-w-(--available-width) flex-col gap-3 own:rounded-overlay border own:border-line own:bg-overlay p-4 own:text-fg',
            'own:text-ui text-fg shadow-md outline-none',
            className,
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger }
export type { HoverCardContentProps }

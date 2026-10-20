'use client'

import { useRef, type ComponentProps, type MouseEvent } from 'react'
import { useSoundCue } from '@youj/core'

type PressHandlers = Pick<ComponentProps<'button'>, 'onPointerDown' | 'onClick'>

/* A button wider than this presses shallower (data-wide, button.variants.tsx),
 * so a full-width button doesn't lurch at its edges. Read on the press, so it
 * covers w-full, flex-1 and long labels alike. */
const WIDE_PX = 220

/* The press sound, in step with the press: on pointer down for a mouse or a
 * pen, as the button scales in; for touch on the click, since a touch that
 * turns into a scroll never presses; for keys on the click they cause. A
 * disabled button runs neither handler (Base UI), so it stays silent. The
 * pointer down also sizes the press (WIDE_PX). */
export function usePressSound(on: boolean, { onPointerDown, onClick }: PressHandlers): Required<Omit<PressHandlers, 'onClick'>> & { onClick: (event: MouseEvent<HTMLButtonElement>) => unknown } {
  const cue = useSoundCue()
  const touch = useRef(false)
  return {
    onPointerDown: (event) => {
      onPointerDown?.(event)
      event.currentTarget.toggleAttribute('data-wide', event.currentTarget.offsetWidth > WIDE_PX)
      touch.current = event.pointerType === 'touch'
      if (on && !touch.current && event.button === 0) cue('tap')
    },
    // Returns what the handler returns: Button reads a promise from it.
    onClick: (event) => {
      const result: unknown = onClick?.(event)
      if (on && (event.detail === 0 || touch.current)) cue('tap')
      return result
    },
  }
}

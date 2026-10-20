'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, m, useIsPresent, type Variants } from 'motion/react'
import { useYouj, type Youj } from '@youj/core/lib/youj/provider'
import type { DurationToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures, PresenceSettled } from '@youj/core/lib/youj/features'

/* Height-auto disclosure for anything that isn't a Base UI Collapsible or
 * Accordion (those use the yj-collapse preset): "show more", filter panels,
 * inline errors, settings sections.
 * Height eases between 0 and the content's own height, the content fades
 * with it (out quicker than it collapses, so text never looks squashed), and
 * a reversal mid-way starts from the current height. It clips only while it
 * moves or is closed, so focus rings inside aren't cut off at rest. Closed
 * content is inert at once, and unmounts (or, kept mounted, leaves the
 * accessibility tree) once collapsed. Height is a layout animation by design:
 * the content below has to move. */

function variants(k: Youj, duration: DurationToken): Variants {
  const t = (d: DurationToken, ease: 'standard' | 'exit') => (k.reduced ? { type: false as const } : k.tween(d, ease))
  return {
    open: {
      height: 'auto',
      opacity: 1,
      visibility: 'visible',
      transition: { height: t(duration, 'standard'), opacity: t(duration, 'standard') },
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: { height: t(duration, 'standard'), opacity: t('fast', 'exit') },
      transitionEnd: { visibility: 'hidden' },
    },
  }
}

type PanelProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> & {
  open: boolean
  /** Mounting after the first render, so it animates in from closed. */
  entering: boolean
  duration: DurationToken
  children: ReactNode
}

/* Reads presence itself: an exiting child keeps its last props, so without it
 * a closing panel would stay interactive and unclipped while it collapses.
 * `animate` follows `open` alone: an exit is the `exit` animation's job, and
 * running both at once would end the first early (and apply its transitionEnd). */
function Panel({ open, entering, duration, className, children, ...rest }: PanelProps) {
  const k = useYouj()
  const present = useIsPresent()
  const shown = open && present
  // Clip from the render that starts a change (or an animated mount) until the panel has finished opening.
  const [clip, setClip] = useState(entering || !shown)
  const [wasShown, setWasShown] = useState(shown)
  if (shown !== wasShown) {
    setWasShown(shown)
    setClip(true)
  }
  return (
    <m.div
      {...rest}
      inert={!shown}
      variants={variants(k, duration)}
      initial="closed"
      animate={open ? 'open' : 'closed'}
      exit={k.reduced ? undefined : 'closed'}
      onAnimationComplete={(definition) => setClip(definition !== 'open')}
      className={cn(clip && 'overflow-hidden', className)}
    >
      <PresenceSettled>{children}</PresenceSettled>
    </m.div>
  )
}

export interface CollapseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** Whether the content is shown. */
  open: boolean
  /** Keep the content mounted while closed (hidden and inert), e.g. to preserve its state. Default false. */
  keepMounted?: boolean
  /** How long the height takes. Default 'base'. */
  duration?: DurationToken
  children: ReactNode
}

/**
 * Reveals and hides its content by animating height to and from auto. Give it
 * an `id` and point the trigger's `aria-controls` / `aria-expanded` at it.
 * Reduced motion opens and closes instantly.
 */
export function Collapse({ open, keepMounted = false, duration = 'base', ...rest }: CollapseProps) {
  // Panels present on the first render start settled; later mounts animate in.
  const firstRender = useRef(true)
  useEffect(() => {
    firstRender.current = false
  }, [])
  return (
    <MotionFeatures>
      <AnimatePresence initial={false}>
        {(open || keepMounted) && (
          <Panel key="yj-collapse" open={open} entering={!firstRender.current} duration={duration} {...rest} />
        )}
      </AnimatePresence>
    </MotionFeatures>
  )
}

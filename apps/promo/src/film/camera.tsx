import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

/* The camera: a push-in, a glide or a macro close-up, as one transform on a
 * wrapper. It is a plain CSS transform, not a Motion element: Motion resets
 * the transforms of its own elements above a component while it measures a
 * layout animation, and a frame captured then would show the scene at 1:1.
 * Instead the scene inside gets a `transformPagePoint` (Motion's hook for
 * scaled containers): every layout box Motion measures is mapped back into
 * the camera's space, so a tab indicator gliding or a list re-sorting under
 * the camera animates exactly as it would at rest, at any magnification.
 *
 * The mapping reads the transform the page is showing now (updated after
 * each commit), so a measurement never mixes one frame's layout with
 * another's camera. Portaled popups can be kept inside the camera with a
 * container; the Toaster and dialogs stay in the page's own space. */

export interface Shot {
  /** 1 is the scene at its real size. */
  scale: number
  /** Drift in CSS px. */
  x: number
  y: number
  /** What the scale is about, as a fraction of the stage. Default the centre. */
  originX?: number
  originY?: number
}

export const REST: Shot = { scale: 1, x: 0, y: 0 }

const STAGE = { width: 1440, height: 810 }

export function Camera({ shot, children }: { shot: Shot; children: ReactNode }) {
  const ox = (shot.originX ?? 0.5) * STAGE.width
  const oy = (shot.originY ?? 0.5) * STAGE.height
  // screen = (point − origin) × scale + origin + drift
  const shown = useRef({ scale: 1, x: 0, y: 0, ox, oy })
  useLayoutEffect(() => {
    shown.current = { scale: shot.scale, x: shot.x, y: shot.y, ox, oy }
  })
  const transformPagePoint = useCallback(({ x, y }: { x: number; y: number }) => {
    const c = shown.current
    return { x: (x - c.x - c.ox) / c.scale + c.ox, y: (y - c.y - c.oy) / c.scale + c.oy }
  }, [])
  return (
    <div
      className="absolute inset-0"
      style={{ transform: `translate(${shot.x}px, ${shot.y}px) scale(${shot.scale})`, transformOrigin: `${ox}px ${oy}px` }}
    >
      <MotionConfig transformPagePoint={transformPagePoint}>{children}</MotionConfig>
    </div>
  )
}

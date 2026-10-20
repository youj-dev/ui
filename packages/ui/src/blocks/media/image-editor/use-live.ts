'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useSpring, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import type { ImageEditorEdit } from './data'
import { clampCenter, coverScale, placement, type Placement, type Size } from './geometry'

/* The edit as it's drawn. Each number the picture depends on is a spring
 * that glides to every committed change on the smooth spring (a turn, a
 * flip turning the image over, a new crop's frame morphing), retargeting
 * with its velocity when changes come quickly, and that a gesture moves
 * directly (`jump`), so the photo tracks the pointer 1:1. The stage and every
 * preview read the same springs, so they move as one. Reduced motion jumps. */

export interface Live {
  rotation: MotionValue<number>
  zoom: MotionValue<number>
  cx: MotionValue<number>
  cy: MotionValue<number>
  flipX: MotionValue<number>
  flipY: MotionValue<number>
  frameW: MotionValue<number>
  frameH: MotionValue<number>
  focalX: MotionValue<number>
  focalY: MotionValue<number>
  /** While a gesture holds the springs: the center may stray past an edge (it gives) and nothing glides. */
  holding: { readonly current: boolean }
  /** Starts or ends a gesture's hold. */
  hold: (on: boolean) => void
}

export function useLive(edit: ImageEditorEdit, frame: Size): Live {
  const k = useYouj()
  const config = useMemo(() => k.spring('smooth'), [k])
  const holding = useRef(false)
  const live: Live = {
    rotation: useSpring(edit.rotation, config),
    zoom: useSpring(edit.zoom, config),
    cx: useSpring(edit.center.x, config),
    cy: useSpring(edit.center.y, config),
    flipX: useSpring(edit.flipX ? -1 : 1, config),
    flipY: useSpring(edit.flipY ? -1 : 1, config),
    frameW: useSpring(frame.width, config),
    frameH: useSpring(frame.height, config),
    focalX: useSpring(edit.focal.x, config),
    focalY: useSpring(edit.focal.y, config),
    holding,
    hold: (on) => {
      holding.current = on
    },
  }
  const aspect = useRef(edit.aspect)

  useEffect(() => {
    const instant = k.reduced || live.holding.current
    const to = (value: MotionValue<number>, target: number, jump = instant) => (jump ? value.jump(target) : value.set(target))
    to(live.rotation, edit.rotation)
    to(live.zoom, edit.zoom)
    to(live.cx, edit.center.x)
    to(live.cy, edit.center.y)
    to(live.flipX, edit.flipX ? -1 : 1)
    to(live.flipY, edit.flipY ? -1 : 1)
    to(live.focalX, edit.focal.x)
    to(live.focalY, edit.focal.y)
    // A new crop morphs the frame; the stage resizing just redraws it.
    const morph = aspect.current !== edit.aspect
    aspect.current = edit.aspect
    to(live.frameW, frame.width, instant || !morph)
    to(live.frameH, frame.height, instant || !morph)
  })

  return live
}

/** Where the image sits now: the frame's center held on the image (unless a gesture lets it give). */
export function livePlacement(live: Live, natural: Size): { p: Placement; frame: Size } {
  const frame = { width: live.frameW.get(), height: live.frameH.get() }
  const angle = live.rotation.get()
  const scale = coverScale(frame, natural, angle) * Math.max(1, live.zoom.get())
  const raw = { x: live.cx.get(), y: live.cy.get() }
  const center = live.holding.current ? raw : clampCenter(raw, natural, frame, angle, scale)
  return { p: placement(center, angle, scale, live.flipX.get(), live.flipY.get(), natural), frame }
}

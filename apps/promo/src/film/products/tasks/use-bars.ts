import { useLayoutEffect, useRef } from 'react'
import { animate, motionValue, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import type { Schedule } from './schedule'

export interface BarValues {
  /** Distance from the runway's start, and length, in pixels. */
  x: MotionValue<number>
  w: MotionValue<number>
}

/**
 * One pair of motion values per bar. When the schedule changes, bars glide
 * to their new days on the smooth spring (a glide retargets from wherever a
 * bar is, so a drag released mid-glide never jumps); a resize of the runway,
 * the first layout and reduced motion place them at once. The bar being
 * dragged is left to the pointer, and settles from wherever it was let go.
 * The handoff lines read the same values, so they move with the bars.
 */
export function useBars(placed: Schedule, dayWidth: number, firstDay: number, dragging: string | null) {
  const k = useYouj()
  const values = useRef(new Map<string, BarValues>())
  const targets = useRef(new Map<string, number>())
  const width = useRef(dayWidth)
  const released = useRef<string | null>(null)

  const valuesFor = (id: string) => {
    let v = values.current.get(id)
    if (!v) {
      const p = placed.get(id)
      v = { x: motionValue(p ? (p.start - firstDay) * dayWidth : 0), w: motionValue(p ? p.task.days * dayWidth : 0) }
      values.current.set(id, v)
    }
    return v
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useLayoutEffect(() => {
    const resized = width.current !== dayWidth
    width.current = dayWidth
    const letGo = released.current
    released.current = dragging
    for (const p of placed.values()) {
      const id = p.task.id
      if (id === dragging) continue
      const v = valuesFor(id)
      const go = (key: string, value: MotionValue<number>, to: number) => {
        // Only a new target moves a bar, so a render that changes nothing never restarts a glide.
        if (targets.current.get(key) === to && !resized && id !== letGo) return
        targets.current.set(key, to)
        if (resized || k.reduced) value.jump(to)
        else animate(value, to, k.spring('smooth'))
      }
      go(`${id}:x`, v.x, (p.start - firstDay) * dayWidth)
      go(`${id}:w`, v.w, p.task.days * dayWidth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are chosen by hand
  }, [placed, dayWidth, firstDay, dragging, k.reduced])

  return valuesFor
}

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { Task } from './data'
import type { BarValues } from './use-bars'
import type { Tandem } from './use-tandem'

interface Session {
  task: Task
  mode: 'move' | 'resize'
  pointerId: number
  /** Where the pointer went down, and where the bar was then. */
  px: number
  x0: number
  w0: number
  /** The planned start or length the drag is trying out. */
  value: number
  active: boolean
}

/** Past this many pixels a press is a drag, not a click. */
const THRESHOLD = 3

/**
 * Dragging a bar along the runway: its body moves it, its end changes its
 * length. The bar follows the pointer exactly while the plan tries out the
 * nearest whole day, so what waits on it glides aside live; letting go makes
 * the move and the bar settles into its day; Escape puts everything back. A
 * press that never moves is a click. On a phone the bars take horizontal
 * drags only, so the page still scrolls under a vertical swipe.
 */
export function useDrag({
  tandem,
  dayWidth,
  firstDay,
  lastDay,
  dir,
  valuesFor,
  dragging,
  setDragging,
}: {
  tandem: Tandem
  dayWidth: number
  firstDay: number
  lastDay: number
  dir: 1 | -1
  valuesFor: (id: string) => BarValues
  dragging: string | null
  setDragging: (id: string | null) => void
}) {
  const session = useRef<Session | null>(null)
  const clicked = useRef(false)

  const end = (commit: boolean) => {
    const s = session.current
    session.current = null
    if (!s?.active) return
    clicked.current = true
    setTimeout(() => (clicked.current = false))
    const placed = tandem.settled.get(s.task.id)!
    const changed = s.mode === 'move' ? s.value !== placed.start : s.value !== s.task.days
    if (commit && changed) {
      if (s.mode === 'move') tandem.move(s.task.id, s.value)
      else tandem.resize(s.task.id, s.value)
    } else if (!commit) tandem.announce(`Canceled. ${s.task.title} stays where it was.`)
    tandem.setTrial(null)
    setDragging(null)
  }

  // Escape puts a drag back.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useEffect(() => {
    if (!dragging) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      end(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are chosen by hand
  }, [dragging])

  const bind = (task: Task, mode: Session['mode']) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || session.current || !dayWidth) return
      event.stopPropagation()
      const v = valuesFor(task.id)
      session.current = { task, mode, pointerId: event.pointerId, px: event.clientX, x0: v.x.get(), w0: v.w.get(), value: mode === 'move' ? tandem.settled.get(task.id)!.start : task.days, active: false }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const s = session.current
      if (!s || event.pointerId !== s.pointerId || s.task.id !== task.id) return
      const dx = (event.clientX - s.px) * dir
      if (!s.active) {
        if (Math.abs(dx) < THRESHOLD) return
        s.active = true
        setDragging(task.id)
      }
      const v = valuesFor(task.id)
      if (s.mode === 'move') {
        const x = Math.max(0, Math.min(s.x0 + dx, (lastDay - firstDay + 1 - s.task.days) * dayWidth))
        v.x.set(x)
        const start = firstDay + Math.round(x / dayWidth)
        if (start !== s.value) {
          s.value = start
          tandem.setTrial({ id: task.id, start })
        }
      } else {
        const w = Math.max(dayWidth * 0.6, Math.min(s.w0 + dx, (lastDay - firstDay + 1) * dayWidth - s.x0))
        v.w.set(w)
        const days = Math.max(1, Math.round(w / dayWidth))
        if (days !== s.value) {
          s.value = days
          tandem.setTrial({ id: task.id, days })
        }
      }
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (session.current?.pointerId === event.pointerId) end(true)
    },
    onPointerCancel: () => end(false),
  })

  return {
    bind,
    /** A click that ended a drag shouldn't also open the task. */
    wasDrag: () => clicked.current,
  }
}

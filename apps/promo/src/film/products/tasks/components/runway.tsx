'use client'

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { FIRST_DAY, PEOPLE } from '../data'
import { dayLabel } from '../days'
import { schedule, type Placed } from '../schedule'
import { useBars } from '../use-bars'
import { useDrag } from '../use-drag'
import type { Tandem } from '../use-tandem'
import { Handoffs } from './handoffs'
import { COMPACT_ROW_HEIGHT, GROUP_HEIGHT, ROW_HEIGHT, RunwayGroup } from './runway-group'
import { RunwayHead } from './runway-head'
import { RunwayLines } from './runway-lines'
import { TaskBar } from './task-bar'

/**
 * The runway: the days from a little before today to just after launch, a
 * lane per person and a bar per task, with the handoffs between them drawn in.
 * Drag a bar to move it, its end to stretch it; what waits on it glides aside
 * as you go. From the keyboard the bars are one tab stop: the arrows move
 * between them, left and right move one a day, Shift stretches it, Enter
 * opens it. Every change is announced with what it pushed.
 */
export function Runway({ tandem, compact }: { tandem: Tandem; compact: boolean }) {
  const hint = useId()
  const { project, placed, chain, verdict, today } = tandem
  const track = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [dragging, setDragging] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const lastDay = project.launch + 1
  const count = lastDay - FIRST_DAY + 1
  const dayWidth = width / count
  const valuesFor = useBars(placed, dayWidth, FIRST_DAY, dragging)
  const drag = useDrag({ tandem, dayWidth, firstDay: FIRST_DAY, lastDay, dir, valuesFor, dragging, setDragging })

  // The track's width sets a day's; the writing direction sets which way time runs.
  useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => {
      setWidth(el.getBoundingClientRect().width)
      setDir(getComputedStyle(el).direction === 'rtl' ? -1 : 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [compact])

  // Rows keep the plan's order, never the moment's, so nothing reorders under a drag.
  const lanes = PEOPLE.map((person) => ({ person, rows: project.tasks.filter((t) => t.owner === person.id).map((t) => placed.get(t.id)!) })).filter((l) => l.rows.length)
  const order = lanes.flatMap((l) => l.rows.map((p) => p.task.id))
  const tabStop = focusId && placed.has(focusId) ? focusId : (order.find((id) => placed.get(id)!.task.status !== 'done') ?? order[0])
  // Where each row's bar sits, for the handoff lines: rows are fixed heights, so this is exact.
  const rowY = new Map<string, number>()
  let y = 0
  for (const lane of lanes) {
    y += GROUP_HEIGHT
    for (const p of lane.rows) {
      rowY.set(p.task.id, y + ROW_HEIGHT / 2)
      y += compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT
    }
  }

  // The handoff that sets a bar's start, until it has been made.
  const waitingOn = (p: Placed) => {
    const handoff = p.waitsFor ? placed.get(p.waitsFor)?.task : undefined
    return handoff && handoff.status !== 'done' ? handoff.title : null
  }
  const focus = (id: string) => {
    setFocusId(id)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-task="${CSS.escape(id)}"]`)?.focus())
  }
  const onKey = (p: Placed) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const id = p.task.id
    const i = order.indexOf(id)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const next = order[i + (event.key === 'ArrowDown' ? 1 : -1)]
      if (next) focus(next)
    } else if (event.key === 'Home' || event.key === 'End') {
      focus(event.key === 'Home' ? order[0]! : order.at(-1)!)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const by = (event.key === 'ArrowRight') === (dir === 1) ? 1 : -1
      if (event.shiftKey) {
        if (p.task.days + by >= 1) tandem.resize(id, p.task.days + by)
      } else if (schedule(project.tasks, project.launch, { id, start: p.start + by }).get(id)!.start === p.start) {
        // It can't start before the handoff it waits for lands.
        const handoff = placed.get(p.waitsFor ?? '')?.task
        tandem.announce(`${p.task.title} can’t start before ${dayLabel(today, p.start)}${handoff ? `, when ${handoff.title} ${handoff.status === 'done' ? 'was' : 'is'} handed off` : ''}.`)
      } else tandem.move(id, p.start + by)
    } else if (event.key === 'Enter') {
      tandem.setOpenId(id)
    } else return
    event.preventDefault()
  }

  return (
    <div className="relative" style={{ '--label': compact ? '0px' : '15rem' } as CSSProperties}>
      <p id={hint} className="sr-only">
        Left and right arrows move the task a day; with Shift they make it a day shorter or longer. Up and down go to the next task. Enter opens it.
      </p>
      <div className={compact ? 'h-12 px-4' : 'grid h-12 grid-cols-[var(--label)_minmax(0,1fr)]'}>
        {!compact && <span className="flex items-end px-4 pb-2 text-ui-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Who and what</span>}
        <div ref={track} className="h-full">
          <RunwayHead today={today} first={FIRST_DAY} last={lastDay} launch={project.launch} verdict={verdict} compact={compact} />
        </div>
      </div>
      <div role="group" aria-label={`Runway to launch, ${project.name}`} className="relative">
        <div className={compact ? 'absolute inset-y-0 inset-x-4' : 'absolute inset-y-0 start-(--label) end-0'}>
          <RunwayLines today={today} now={tandem.now} first={FIRST_DAY} last={lastDay} launch={project.launch} verdict={verdict} />
          {!compact && width > 0 && <Handoffs placed={placed} rowY={rowY} valuesFor={valuesFor} dir={dir} width={width} height={y} chain={chain} late={verdict.kind === 'late'} />}
        </div>
        {lanes.map(({ person, rows }) => (
          <RunwayGroup
            key={person.id}
            person={person}
            rows={rows}
            compact={compact}
            onOpen={(id) => !drag.wasDrag() && tandem.setOpenId(id)}
            bar={(p) => (
              <TaskBar
                placed={p}
                waitsFor={waitingOn(p)}
                onChain={chain.has(p.task.id)}
                values={valuesFor(p.task.id)}
                dir={dir}
                today={today}
                dragging={dragging === p.task.id}
                focusable={tabStop === p.task.id}
                hint={hint}
                move={drag.bind(p.task, 'move')}
                stretch={drag.bind(p.task, 'resize')}
                onOpen={() => !drag.wasDrag() && tandem.setOpenId(p.task.id)}
                onKeyDown={onKey(p)}
                onFocus={() => setFocusId(p.task.id)}
              />
            )}
          />
        ))}
      </div>
    </div>
  )
}

import type { Task } from './data'

/* The runway's rules. A task starts on the day it's planned for, or the day
 * its latest handoff lands, whichever is later: it can't start on work it
 * hasn't been handed. Moving a task back lets what waits on it move back to
 * where it was planned. A task is late if it's not done and ends after the
 * launch day has begun. The critical chain runs back from the task that
 * ends last, through the handoffs each one started on. */

export interface Placed {
  task: Task
  /** The day it starts and the day after its last, counted from today. */
  start: number
  end: number
  /** The handoff it starts on (or was pushed to), if any. */
  waitsFor: string | null
  late: boolean
}

export type Schedule = Map<string, Placed>

/** A change being tried out, not yet made: a drag in progress. */
export interface Trial {
  id: string
  start?: number
  days?: number
}

export function schedule(tasks: Task[], launch: number, trial?: Trial | null): Schedule {
  const byId = new Map(tasks.map((t) => [t.id, trial && t.id === trial.id ? { ...t, start: trial.start ?? t.start, days: trial.days ?? t.days } : t]))
  const placed: Schedule = new Map()
  const place = (id: string, path: Set<string>): Placed => {
    const known = placed.get(id)
    if (known) return known
    const task = byId.get(id)!
    let start = task.start
    let waitsFor: string | null = null
    let latest = -Infinity
    for (const before of task.after) {
      // A handoff to a task that doesn't exist, or a loop, is ignored rather than trusted.
      if (!byId.has(before) || path.has(before)) continue
      const p = place(before, new Set([...path, id]))
      if (p.end >= start && p.end > latest) {
        latest = p.end
        start = p.end
        waitsFor = before
      }
    }
    const end = start + task.days
    const result = { task, start, end, waitsFor, late: task.status !== 'done' && end > launch }
    placed.set(id, result)
    return result
  }
  for (const t of tasks) place(t.id, new Set())
  return placed
}

/** The chain of handoffs that sets the date: back from what ends last (what's late, when something is). */
export function criticalChain(placed: Schedule): Set<string> {
  let last: Placed | null = null
  for (const p of placed.values()) if (p.task.status !== 'done' && (!last || p.end > last.end)) last = p
  const chain = new Set<string>()
  for (let at = last; at; at = at.waitsFor ? (placed.get(at.waitsFor) ?? null) : null) chain.add(at.task.id)
  return chain
}

export type Verdict = { kind: 'ready' } | { kind: 'late'; tasks: Placed[] } | { kind: 'on-time'; spare: number } | { kind: 'empty' }

/** How the launch stands: ready, on time (with the days to spare), or late (with what's late). */
export function verdict(placed: Schedule, launch: number): Verdict {
  const all = [...placed.values()]
  if (!all.length) return { kind: 'empty' }
  const open = all.filter((p) => p.task.status !== 'done')
  if (!open.length) return { kind: 'ready' }
  const late = open.filter((p) => p.late)
  if (late.length) return { kind: 'late', tasks: late }
  return { kind: 'on-time', spare: launch - Math.max(...open.map((p) => p.end)) }
}

/** What moved between two schedules, besides the task that was changed. */
export function knockOn(before: Schedule, after: Schedule, changed: string) {
  return [...after.values()].filter((p) => p.task.id !== changed && before.get(p.task.id)?.start !== p.start)
}

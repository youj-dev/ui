import type { BuilderScene } from './model'

/* Undo and redo over whole scenes: every committed change is one step, a
 * drag is one step however far it went, and a run of edits to one field
 * (typing 2.5 into a size) folds into the step it started. */

export interface History {
  past: BuilderScene[]
  present: BuilderScene
  future: BuilderScene[]
  /** What the last step changed, and when: an edit to the same thing soon after joins it. */
  last?: { key: string; at: number }
}

/** How many steps back undo reaches. */
export const HISTORY_LIMIT = 100
/** Edits to one field this close together are one step. */
const FOLD_MS = 800

export const startHistory = (present: BuilderScene): History => ({ past: [], present, future: [] })

/** A new present. With a `key`, an edit to the same thing within a moment replaces the last step instead of adding one. */
export function commit(history: History, next: BuilderScene, key?: string, now = Date.now()): History {
  if (next === history.present) return history
  const fold = key !== undefined && history.last?.key === key && now - history.last.at < FOLD_MS && history.past.length > 0
  return {
    past: fold ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    last: key !== undefined ? { key, at: now } : undefined,
  }
}

export function undo(history: History): History {
  const previous = history.past.at(-1)
  if (!previous) return history
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] }
}

export function redo(history: History): History {
  const [next, ...rest] = history.future
  if (!next) return history
  return { past: [...history.past, history.present], present: next, future: rest }
}

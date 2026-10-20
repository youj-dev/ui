import type { MiniatureSnapshot } from './types'

/** The readout a miniature publishes: one immutable snapshot, replaced on change, listeners told once per burst. */
export interface SnapshotStore {
  get(): MiniatureSnapshot
  subscribe(listener: () => void): () => void
  /** Sets the readout or state line. */
  line(key: 'readout' | 'state', value: string): void
  /** Sets an on/off hint's state. */
  press(key: string, on: boolean): void
  /** Back to the metadata's first readout (a remount starts over). */
  reset(): void
}

export function createStore(initial: MiniatureSnapshot): SnapshotStore {
  let snapshot = initial
  let queued = false
  const listeners = new Set<() => void>()
  const notify = () => {
    queued = false
    for (const listener of [...listeners]) listener()
  }
  const commit = (next: MiniatureSnapshot) => {
    snapshot = next
    if (queued) return
    queued = true
    queueMicrotask(notify)
  }
  return {
    get: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    line(key, value) {
      if (snapshot[key] !== value) commit({ ...snapshot, [key]: value })
    },
    press(key, on) {
      if (snapshot.pressed[key] !== on) commit({ ...snapshot, pressed: { ...snapshot.pressed, [key]: on } })
    },
    reset() {
      if (snapshot !== initial) commit(initial)
    },
  }
}

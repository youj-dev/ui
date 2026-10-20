/* A figure's clock: its requestAnimationFrame and timers. Frames run only
 * while the miniature is on screen and not held, so sixty of them on a page
 * cost nothing offscreen; a figure that asks for a frame while held just waits
 * (it clamps its own time step, so it resumes without a jump). Everything it
 * scheduled is dropped when it unmounts. */

export interface Clock {
  requestAnimationFrame(callback: FrameRequestCallback): number
  cancelAnimationFrame(handle: number): void
  setTimeout(callback: () => void, ms?: number): number
  clearTimeout(handle: number | undefined): void
  setInterval(callback: () => void, ms?: number): number
  clearInterval(handle: number | undefined): void
  /** Re-checks `running()` and asks for a frame if it may run. */
  wake(): void
  stop(): void
}

export function createClock(win: Window, running: () => boolean, afterFrame: () => void): Clock {
  const frames = new Map<number, FrameRequestCallback>()
  const timeouts = new Set<number>()
  const intervals = new Set<number>()
  let next = 0
  let raf = 0
  let stopped = false
  const schedule = () => {
    if (!raf && !stopped && frames.size && running()) raf = win.requestAnimationFrame(flush)
  }
  function flush(time: number) {
    raf = 0
    if (stopped || !running()) return
    const batch = [...frames.values()]
    frames.clear()
    for (const callback of batch) callback(time)
    afterFrame()
    schedule()
  }
  return {
    requestAnimationFrame(callback) {
      frames.set(++next, callback)
      schedule()
      return next
    },
    cancelAnimationFrame: (handle) => void frames.delete(handle),
    setTimeout(callback, ms) {
      const id = win.setTimeout(() => {
        timeouts.delete(id)
        callback()
      }, ms)
      timeouts.add(id)
      return id
    },
    clearTimeout(handle) {
      if (handle == null) return
      win.clearTimeout(handle)
      timeouts.delete(handle)
    },
    setInterval(callback, ms) {
      const id = win.setInterval(callback, ms)
      intervals.add(id)
      return id
    },
    clearInterval(handle) {
      if (handle == null) return
      win.clearInterval(handle)
      intervals.delete(handle)
    },
    wake: schedule,
    stop() {
      stopped = true
      if (raf) win.cancelAnimationFrame(raf)
      raf = 0
      frames.clear()
      timeouts.forEach((id) => win.clearTimeout(id))
      intervals.forEach((id) => win.clearInterval(id))
      timeouts.clear()
      intervals.clear()
    },
  }
}

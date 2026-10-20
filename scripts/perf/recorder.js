/* Injected into every story page before it loads (page.addInitScript). It
 * records, between start() and stop():
 *   - frames: rAF timestamps, so frame times include any main-thread jank
 *   - long tasks (PerformanceObserver 'longtask')
 *   - interactions: event.timeStamp of each pointerdown / click / keydown to
 *     the first frame painted after its handlers ran (the INP proxy). The
 *     paint is approximated by rAF plus a MessageChannel task, which runs
 *     after that frame's rendering. Event Timing entries are kept too, as a
 *     cross-check (they only report >= 16 ms).
 *   - shaded: WebGL drawing-buffer pixels per draw call, summed. */
;(() => {
  // Storybook 10.6's highlight feature re-scans every element of the page with
  // getComputedStyle after each DOM change in the story root, even with nothing
  // highlighted (thousands of forced style reads per second while a virtualized
  // table scrolls). It's tooling, not the library, so it stays off here.
  globalThis.__STORYBOOK_HIGHLIGHT_INITIALIZED = true
  const state = { recording: false, frames: [], longTasks: [], interactions: [], eventTiming: [], shaded: 0 }
  const gl = window.WebGL2RenderingContext?.prototype
  if (gl) {
    const drawArrays = gl.drawArrays
    gl.drawArrays = function (...args) {
      if (state.recording) state.shaded += this.drawingBufferWidth * this.drawingBufferHeight
      return drawArrays.apply(this, args)
    }
  }
  const onFrame = (t) => {
    if (state.recording) state.frames.push(t)
    requestAnimationFrame(onFrame)
  }
  requestAnimationFrame(onFrame)

  try {
    new PerformanceObserver((list) => {
      if (!state.recording) return
      for (const e of list.getEntries()) state.longTasks.push({ start: e.startTime, duration: e.duration })
    }).observe({ type: 'longtask', buffered: false })
  } catch {}
  try {
    new PerformanceObserver((list) => {
      if (!state.recording) return
      for (const e of list.getEntries()) if (e.interactionId) state.eventTiming.push({ name: e.name, duration: e.duration, id: e.interactionId })
    }).observe({ type: 'event', durationThreshold: 16, buffered: false })
  } catch {}

  const channel = new MessageChannel()
  const pending = []
  channel.port1.onmessage = () => {
    const done = pending.shift()
    if (done) done()
  }
  const afterPaint = (fn) =>
    requestAnimationFrame(() => {
      pending.push(fn)
      channel.port2.postMessage(0)
    })
  for (const type of ['pointerdown', 'click', 'keydown']) {
    window.addEventListener(
      type,
      (event) => {
        if (!state.recording) return
        const from = event.timeStamp
        afterPaint(() => state.interactions.push({ type, duration: performance.now() - from }))
      },
      { capture: true },
    )
  }

  window.__perf = {
    start() {
      state.frames = []
      state.longTasks = []
      state.interactions = []
      state.eventTiming = []
      state.shaded = 0
      state.recording = true
    },
    stop() {
      state.recording = false
      return JSON.parse(JSON.stringify(state))
    },
    afterPaint: () => new Promise((resolve) => afterPaint(resolve)),
    /** For interactions that aren't input events (a Storybook globals change). */
    interaction: (type, duration) => state.interactions.push({ type, duration }),
  }
})()

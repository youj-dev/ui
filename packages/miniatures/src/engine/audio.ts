/* Sound on request. A figure asks for `window.AudioContext` whenever it acts
 * (the lab files create their context lazily, inside a click or key handler).
 * The gate answers with nothing until two things are true: the `sound` prop is
 * on, and someone has interacted with this miniature (a pointer down or key on
 * it). Then every request returns the same context, whose `resume()` is a no-op
 * while sound is off, the miniature is paused or offscreen, so a figure calling
 * `audio()` from a key handler can't wake what the host silenced. */

type AudioCtor = typeof AudioContext

export interface AudioGate {
  /** What `window.AudioContext` returns to the figure now. */
  ctor(): AudioCtor | undefined
  /** Someone interacted: sound may start (if it's on). */
  unlock(): void
  /** Suspends or resumes the context to match `allowed()`. */
  sync(): void
  close(): void
}

export function createAudioGate(win: Window & typeof globalThis, wanted: () => boolean, allowed: () => boolean): AudioGate {
  const Real: AudioCtor | undefined = win.AudioContext ?? (win as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  let unlocked = false
  let context: AudioContext | null = null
  // A constructor in shape only: `new Gated()` returns the one shared context.
  const Gated = function () {
    if (!context) {
      context = new Real!()
      const resume = context.resume.bind(context)
      context.resume = () => (allowed() ? resume() : Promise.resolve())
    }
    return context
  } as unknown as AudioCtor
  return {
    ctor: () => (Real && unlocked && wanted() ? Gated : undefined),
    unlock() {
      unlocked = true
    },
    sync() {
      if (!context || context.state === 'closed') return
      if (allowed()) {
        if (context.state === 'suspended') context.resume().catch(() => {})
      } else if (context.state === 'running') context.suspend().catch(() => {})
    },
    close() {
      if (context && context.state !== 'closed') context.close().catch(() => {})
      context = null
    },
  }
}

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  activity,
  clearTimers,
  deliverObservations,
  flushFrame,
  flushTimers,
  macrotask,
  realFrame,
  reseed,
  seekAnimations,
  setTime,
  takeChanges,
  virtual,
} from './clock'

/* The Simulation replays the composition frame by frame.
 *
 * Library components hold state (a spring mid-flight, a Base UI popup that is
 * still transitioning out), so a frame can only be rendered correctly if
 * every frame before it was rendered first, at the right time. The
 * Simulation keeps its own frame, which the scenes read through useFrame().
 * When Remotion asks for frame N it steps 0 → N one frame at a time: set the
 * virtual clock, render that frame synchronously, run virtual animation
 * frames, let the browser settle (React, observers, promise callbacks), and
 * pin CSS animations to the clock. Remotion waits (delayRender) until the
 * step for N has settled. Nothing of the library runs between steps, so what
 * a frame shows never depends on how fast the machine was.
 *
 * Tabs render increasing frames, so each step is usually one frame. Asking
 * for an earlier frame (a still, a scrub) remounts the scenes and replays
 * from 0. */

interface Action {
  /** The frame it runs at, or every frame when null (it gets the frame, relative to its Seq). */
  frame: number | null
  run: (frame: number) => void
}

interface FrameStore {
  frame: number
  subscribe: (listener: () => void) => () => void
  get: () => number
  set: (frame: number) => void
  actions: Set<Action>
  /** Runs the actions due at `frame`, after that frame has rendered. */
  act: (frame: number) => void
}

function createStore(): FrameStore {
  const listeners = new Set<() => void>()
  const store: FrameStore = {
    frame: 0,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    get: () => store.frame,
    set: (frame) => {
      store.frame = frame
      for (const listener of listeners) listener()
    },
    actions: new Set(),
    act: (frame) => {
      for (const action of [...store.actions]) if (action.frame === null || action.frame === frame) action.run(frame)
    },
  }
  return store
}

interface FrameScope {
  store: FrameStore
  /** Frames subtracted by enclosing <Seq>s. */
  offset: number
}

const FrameContext = createContext<FrameScope | null>(null)

function useScope(): FrameScope {
  const scope = useContext(FrameContext)
  if (!scope) throw new Error('useFrame() must be used inside <Simulation>')
  return scope
}

/** The simulated frame, relative to the nearest enclosing <Seq>. */
export function useFrame(): number {
  const { store, offset } = useScope()
  return useSyncExternalStore(store.subscribe, store.get, store.get) - offset
}

/**
 * A value that depends on the frame, re-rendering only when it changes: a
 * phase or a flag, where useFrame() would re-render every frame. `select`
 * must return a primitive (or the same object for the same input).
 */
export function useFrameValue<T>(select: (frame: number) => T): T {
  const { store, offset } = useScope()
  const get = () => select(store.get() - offset)
  return useSyncExternalStore(store.subscribe, get, get)
}

/**
 * Runs `run` once, when the simulation reaches `frame` (relative to the
 * enclosing Seq), right after that frame has rendered: the director's hand,
 * for clicks, key presses and imperative calls such as toast().
 */
export function useAction(frame: number, run: () => void) {
  const { store, offset } = useScope()
  const latest = useRef(run)
  latest.current = run
  useLayoutEffect(() => {
    const action: Action = { frame: offset + frame, run: () => latest.current() }
    store.actions.add(action)
    return () => {
      store.actions.delete(action)
    }
  }, [store, offset, frame])
}

/**
 * Runs `run` after every frame has rendered, with that frame (relative to
 * the enclosing Seq): for a hand that keeps moving, like a pointer.
 */
export function useEachFrame(run: (frame: number) => void) {
  const { store, offset } = useScope()
  const latest = useRef(run)
  latest.current = run
  useLayoutEffect(() => {
    const action: Action = { frame: null, run: (frame) => latest.current(frame - offset) }
    store.actions.add(action)
    return () => {
      store.actions.delete(action)
    }
  }, [store, offset])
}

/**
 * Mounts its children only from `from` for `duration` frames (relative to the
 * enclosing Seq), and makes useFrame() count from `from` inside.
 */
export function Seq({ from, duration = Infinity, children }: { from: number; duration?: number; children: ReactNode }) {
  const scope = useScope()
  const frame = useSyncExternalStore(scope.store.subscribe, scope.store.get, scope.store.get) - scope.offset
  const inner = useMemo(() => ({ store: scope.store, offset: scope.offset + from }), [scope, from])
  if (frame < from || frame >= from + duration) return null
  return <FrameContext.Provider value={inner}>{children}</FrameContext.Provider>
}

/* A render can take a long replay (a still near the end), well past Remotion's default 30s. */
const STEP_TIMEOUT = 10 * 60 * 1000
/* Real rendering updates a step may take while things keep happening. */
const MAX_UPDATES = 8

export function Simulation({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const [store] = useState(createStore)
  const [epoch, setEpoch] = useState(0)
  const scope = useMemo(() => ({ store, offset: 0 }), [store])
  const chain = useRef(Promise.resolve())
  const settled = useRef(-1)

  useLayoutEffect(() => {
    if (!virtual) {
      // Studio preview: real time, approximately. Actions still fire in order when playing forwards.
      const previous = store.frame
      store.set(frame)
      for (let f = previous + 1; f <= frame && frame - previous < 30; f++) store.act(f)
      return
    }
    const handle = delayRender(`youj simulation: frame ${frame}`, { timeoutInMilliseconds: STEP_TIMEOUT })
    const at = (f: number) => setTime((f * 1000) / fps)

    const settle = async () => {
      for (let i = 0; i < 3; i++) {
        flushTimers()
        flushFrame()
        await macrotask()
      }
      // Then take real rendering updates, handing the observers what each one
      // measured, until one passes with nothing new: what they set off (a
      // re-measure, a transition, an exit that finishes and unmounts) can set
      // off more, and all of it belongs to this step.
      takeChanges()
      for (let update = 0; update < MAX_UPDATES; update++) {
        const mark = activity()
        for (let i = 0; i < 2; i++) {
          flushTimers()
          flushFrame()
          await macrotask()
        }
        seekAnimations()
        await realFrame()
        deliverObservations()
        if (!takeChanges() && activity() === mark) break
      }
      settled.current = store.frame
    }

    const step = async (f: number) => {
      // Work the last step left queued (React's passive effects, a render they set off) runs before
      // this frame, as it does in the tab that captured the last frame, where it ran during the capture.
      for (let i = 0; i < 3; i++) await macrotask()
      at(f)
      reseed(f)
      // What came due since the last frame happens before this one renders, as in the browser.
      flushTimers()
      flushSync(() => store.set(f))
      // As in the browser, what a render queues as microtasks finishes before anything else runs:
      // Motion measures the layout a commit changed there, and a scroll written in between
      // (a list gliding to its end) would read as a layout change and set off a layout animation.
      await macrotask()
      store.act(f)
      await macrotask()
      await settle()
    }

    const advance = async (target: number) => {
      if (target < store.frame) {
        // Rewind: remount everything at frame 0 and replay.
        at(0)
        reseed(0)
        clearTimers()
        store.frame = 0
        flushSync(() => setEpoch((e) => e + 1))
        settled.current = -1
      }
      if (settled.current < store.frame) {
        at(store.frame)
        store.act(store.frame)
        await macrotask()
        await settle()
      }
      while (store.frame < target) await step(store.frame + 1)
      // Let the compositor draw the settled frame before Remotion captures it.
      await realFrame()
      await realFrame()
    }

    chain.current = chain.current
      .then(() => advance(frame))
      .catch((error) => console.error(error))
      .finally(() => continueRender(handle))
  }, [frame, fps, store])

  return (
    <FrameContext.Provider value={scope}>
      <Remount key={epoch}>{children}</Remount>
    </FrameContext.Provider>
  )
}

function Remount({ children }: { children: ReactNode }) {
  return <>{children}</>
}

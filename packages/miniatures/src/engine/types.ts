import type { HTMLAttributes } from 'react'
import type { Kit } from './kit'

/** Which palette a miniature wears. `system` follows the page: a `.dark`/`.light` class or `data-theme` on an ancestor, else the OS. */
export type MiniatureMode = 'light' | 'dark' | 'system'

/**
 * Where a miniature's keys work.
 * - `scoped` (default): while focus is inside the miniature, or while the pointer is over it and nothing else has focus.
 * - `global`: anywhere on the page, except in text fields and on another control's own keys (Space, Enter, arrows).
 * - `off`: no shortcuts; its parts still respond to clicks and to Enter/Space while focused, and `press()` still works.
 */
export type MiniatureKeyboard = 'scoped' | 'global' | 'off'

/** `user` follows `prefers-reduced-motion`; `always` and `never` force it. Reduced, state changes jump to their end without travel. */
export type MiniatureReducedMotion = 'user' | 'always' | 'never'

/** One hint in the showroom's key strip, as the lab file's caption printed it. */
export interface MiniatureKeyHint<K extends string = string> {
  /** The keys it stands for, as `KeyboardEvent.key` values (`' '` is Space). Pass one to `press()`. */
  readonly keys: readonly K[]
  /** How to print them: `Space`, `↑`, `1–6`. */
  readonly caps: readonly string[]
  /** What they do: `start / stop`. */
  readonly label: string
  /** The hint is an on/off switch; its state is `snapshot.pressed[keys[0]]`. */
  readonly toggle?: boolean
}

/** What a showroom needs to present a miniature without mounting it: names, keys, the first readout and the drawing's frame. */
export interface MiniatureMeta<K extends string = string> {
  /** The import path segment: `@youj/miniatures/<id>`. */
  readonly id: string
  /** The object, as the figure caption names it: `Record turntable`. */
  readonly name: string
  /** The invented make and model: `TAVREN R–12`. */
  readonly model: string
  /** The maker's line: `TAVREN / ROTARY WORKS`. */
  readonly maker: string
  /** The object study number: `021`. */
  readonly study: string
  /** The specification line: `R–12 / DIRECT DRIVE · 33⅓ 45 · ±8%`. */
  readonly spec: string
  /** The accessible name: what the drawing shows. */
  readonly label: string
  /** What it does and how it behaves, in a sentence or two. */
  readonly description: string
  /** The key hints, in caption order. */
  readonly keys: readonly MiniatureKeyHint<K>[]
  /** The readout before the first frame. */
  readonly initial: MiniatureSnapshot
  /** The drawing's viewBox (user units); its aspect ratio sizes the miniature before it mounts. */
  readonly viewBox: string
  /** It's also a progress indicator: its handle has `setProgress()` and `done()`, its component `progress` and `done` props. */
  readonly progress: boolean
}

/** The live readout: what the caption under a lab figure showed. */
export interface MiniatureSnapshot {
  /** The instrument line: `33.3 rpm · A1 · 04:16`. */
  readonly readout: string
  /** The state line, in small caps: `PLAYING · TRACK 1 · LOW SUN`. */
  readonly state: string
  /** On/off hints by their first key: `{ ' ': true, d: true }`. */
  readonly pressed: Readonly<Record<string, boolean>>
}

/** Names `press()` accepts besides the `KeyboardEvent.key` values: `press('space')` is `press(' ')`. */
export type MiniatureKeyName = 'space' | 'enter' | 'escape' | 'up' | 'down' | 'left' | 'right'

/** The ref handle every miniature exposes. */
export interface MiniatureHandle<K extends string = string> {
  /** Presses a key as if the miniature had focus (a key down, then up). Wakes a miniature that waits for interaction. */
  press(key: K | MiniatureKeyName): void
  /** The readout now. */
  getSnapshot(): MiniatureSnapshot
  /** Calls `listener` after the readout changes; returns the unsubscribe. With `getSnapshot`, ready for `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void
  /** Holds the clock: the miniature stands still (and its sound pauses) until `play()`. */
  pause(): void
  /** Lets the clock run again. */
  play(): void
  /** The host element, once mounted. */
  readonly element: HTMLDivElement | null
}

/** The handle of a miniature that is also a progress indicator. */
export interface MiniatureProgressHandle<K extends string = string> extends MiniatureHandle<K> {
  /** A share from 0 to 1 makes it determinate; `null` makes it indeterminate again. */
  setProgress(progress: number | null): void
  /** Finishes: the last of it runs through and it comes to rest. */
  done(): void
}

/** The props every miniature takes. Other HTML attributes go to the host `<div>`. */
export interface MiniatureProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Light, dark, or `auto` (default): the page's theme class or `data-theme`, else the OS. */
  mode?: MiniatureMode
  /** The side of the square it's fitted into: a number of pixels or a CSS length. Without it, it fills its container's width at its own aspect ratio. */
  size?: number | string
  /** Paints its stage color (warm paper, or warm charcoal in the dark) behind it. Default false: it sits on your surface. */
  stage?: boolean
  /** Default true. False draws it as a still picture (role img): no focus, no pointer, no keys, though the ref still drives it. */
  interactive?: boolean
  /** Where its keys work. Default `scoped`: never the page's keys. */
  keyboard?: MiniatureKeyboard
  /** Default false. True lets it make its quiet sounds, from the first click or key on it (never before a gesture). */
  sound?: boolean
  /** Default true. False shows its first frame and keeps still until someone interacts with it or `play()` is called. */
  autoPlay?: boolean
  /** Default `user`. */
  reducedMotion?: MiniatureReducedMotion
  /** Called after the readout changes (at most once per frame). */
  onStateChange?: (snapshot: MiniatureSnapshot) => void
  /** Overrides the accessible name. */
  'aria-label'?: string
}

/** A handle that fits any miniature's ref, for code that holds one of several (a showroom). The progress methods do nothing on a miniature without `meta.progress`. */
export type AnyMiniatureHandle = MiniatureProgressHandle

/** Props of a miniature that is also a progress indicator. */
export interface MiniatureProgressProps extends MiniatureProps {
  /** A share from 0 to 1 makes it determinate; `null` indeterminate; leave it out to let it run on its own. */
  progress?: number | null
  /** True finishes it (the handle's `done()`); setting a progress again starts over. */
  done?: boolean
}

/**
 * The key union of a miniature's metadata. Inferred hint by hint: inferring K from `MiniatureMeta<infer K>`
 * gives `never` against the published .d.ts under `skipLibCheck` (every Next and Vite app), so a handle's `press('f')` failed to typecheck.
 */
export type MiniatureKeyOf<M> = M extends MiniatureMeta ? (M['keys'][number] extends infer H ? (H extends MiniatureKeyHint<infer K> ? K : never) : never) : never

/* The figure side: what a ported lab figure receives and exports. */

/** The pieces of the page a lab figure used, stood in for by its own host. Mirrors the globals the lab files call. */
export interface FigureEnv {
  /** `getElementById('machine' | 'drawing' | 'readout' | 'state' | 'announcement')`, the caption's `[data-k]` buttons, `documentElement` (the host), key listeners (routed by the keyboard prop); everything else is the real document. */
  readonly document: Document
  /** The real window, except: `AudioContext` (only once sound is on and someone has interacted), `figure` (the progress API), listeners, timers and `matchMedia`. */
  readonly window: Window & typeof globalThis
  readonly matchMedia: (query: string) => MediaQueryList
  readonly requestAnimationFrame: (callback: FrameRequestCallback) => number
  readonly cancelAnimationFrame: (handle: number) => void
  readonly setTimeout: (callback: () => void, ms?: number) => number
  readonly clearTimeout: (handle: number | undefined) => void
  readonly setInterval: (callback: () => void, ms?: number) => number
  readonly clearInterval: (handle: number | undefined) => void
  readonly addEventListener: Window['addEventListener']
  readonly removeEventListener: Window['removeEventListener']
  /** The engine's drawing kit, bound to this host: pass a getter for the figure's current parent group. */
  readonly kit: (root: () => Element) => Kit
}

/** A ported figure module (`src/figures/<id>.ts`). */
export interface FigureModule {
  /** The lab file's stylesheet without the page chrome; scoped to the host at runtime. */
  readonly css: string
  /** `<defs>` markup beyond the shared ones (stage floor and contact, soft, glow, bloom). */
  readonly defs: string
  /** False when the figure's own defs redefine the shared ones (then only its own are used). Default true. */
  readonly sharedDefs?: boolean
  /** The class the lab file's `<svg>` started with. */
  readonly svgClass?: string
  /** The `data-k` of each caption button, which the figure looks up to track their pressed state. */
  readonly hints: readonly string[]
  /** The lab file's script: draws the figure and wires its behaviour through `env`. */
  readonly draw: (env: FigureEnv) => void
}

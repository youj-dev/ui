/* The launch teaser, "Signal": every beat in frames at 60 fps. Import-free,
 * like the other beats, so the render script reads the same frames.
 *
 * The screen tunes in. Glitches are the cuts: a tear, a slip, a channel
 * split, a frame of another theme, and each one lands a change (the theme,
 * the component style, an icon's shape, a gallery animation). Four beats
 * escalate on a 120 BPM grid (a beat is 30 frames, a bar 120), then the
 * signal drops out and the wordmark resolves in the quiet.
 *
 * Every glitch event holds each state for at least two frames, so a 30 fps
 * re-encode by a platform keeps every one of them. */

export const TEASER_FPS = 60
/** 120 BPM: a beat is half a second. */
export const BEAT = 30
export const TEASER_FRAMES = 900

/** The looks a shot can wear: a preset, a component style and a mode. */
export const LOOKS = {
  basalt: { preset: 'basalt', style: 'bezel', scheme: 'dark' },
  'basalt-classic': { preset: 'basalt', style: 'classic', scheme: 'dark' },
  graphite: { preset: 'graphite', style: 'bezel', scheme: 'dark' },
  terminal: { preset: 'terminal', style: 'classic', scheme: 'dark' },
  brutal: { preset: 'brutal', style: 'classic', scheme: 'dark' },
  'graphite-light': { preset: 'graphite', style: 'bezel', scheme: 'light' },
} as const
export type LookId = keyof typeof LOOKS

/** The gallery animations that fill the frame, in the order they cut in, each in a look. */
export const ANIMS = [
  { id: 'chordal', look: 'basalt' },
  { id: 'casement', look: 'graphite' },
  { id: 'sustain', look: 'terminal' },
  { id: 'halite', look: 'brutal' },
  { id: 'verdict', look: 'basalt' },
  { id: 'ridge', look: 'graphite' },
  { id: 'armature', look: 'terminal' },
  { id: 'quire', look: 'brutal' },
  { id: 'tempo', look: 'basalt' },
  { id: 'chorus', look: 'graphite' },
  { id: 'refine', look: 'terminal' },
  { id: 'vitals', look: 'brutal' },
] as const satisfies readonly { id: string; look: LookId }[]
export type AnimId = (typeof ANIMS)[number]['id']

/** The icon close-ups: a morph each, each in a look; the last pulls back to the whole set. */
export const MORPHS = [
  { from: 'wifi-off', to: 'wifi', look: 'terminal' },
  { from: 'moon', to: 'sun', look: 'graphite' },
  { from: 'lock', to: 'lock-open', look: 'brutal' },
  { from: 'menu', to: 'x', look: 'basalt' },
] as const satisfies readonly { from: string; to: string; look: LookId }[]

export type ShotKey = 'tune' | `rack:${LookId}` | `icons:${LookId}` | `anim:${AnimId}` | 'off' | 'logo'

/** How a cut arrives: torn in through the glitch, or straight. */
export type CutKind = 'tear' | 'hard'

export interface Cut {
  at: number
  shot: ShotKey
  kind: CutKind
  /** How hard the glitch hits, 0–1. */
  power: number
}

/** The animations' cuts: a beat each, then half beats, then eighths (rounded onto even frames), accelerating into the overload. */
const ANIM_TIMES = [540, 570, 600, 616, 630, 638, 646, 652, 658, 662, 666, 670]

export const T = {
  tune: {
    /** The beam: a line across the dark, then the picture opening out of it, locking. */
    line: 10,
    lineLength: 14,
    open: 24,
    openLength: 18,
    lock: 48,
  },
  rack: {
    from: 120,
    to: 360,
    /** What the components do, on the off-beats (the looks change on the beats). */
    switchOn: 135,
    tabs: [165, 285],
    press: 195,
    success: 225,
    slide: 204,
    slideLength: 42,
    segment: 255,
    sort: 315,
    switchOff: 345,
  },
  icons: {
    from: 360,
    /** Each close-up's morph starts a few frames after its cut. */
    morphDelay: 4,
    morphLength: 22,
    pull: 480,
    pullLength: 34,
    wave: 490,
    to: 540,
  },
  anims: { from: 540, to: 672 },
  /** Everything at once: tears every two frames through what came before. */
  overload: { from: 672, to: 688 },
  /** The picture collapses to a line, the line to a point, the point goes out. */
  off: { collapse: 682, collapseLength: 12, line: 694, lineLength: 8, dot: 702, dotLength: 10 },
  logo: { at: 720, url: 780, still: 850 },
} as const

const rackLooks: [number, LookId][] = [
  [120, 'basalt'],
  [180, 'basalt-classic'],
  [240, 'graphite'],
  [270, 'terminal'],
  [300, 'brutal'],
  [330, 'graphite-light'],
]

/** The overload: a tear every two frames through the film's own shots. */
const OVERLOAD: ShotKey[] = ['rack:terminal', 'icons:basalt', 'anim:chordal', 'rack:brutal', 'anim:casement', 'rack:basalt', 'icons:basalt', 'rack:graphite']

export const CUTS: Cut[] = [
  { at: 0, shot: 'tune', kind: 'hard', power: 0 },
  ...rackLooks.map(([at, look], i): Cut => ({ at, shot: `rack:${look}`, kind: i === 0 ? 'hard' : 'tear', power: i === 0 ? 0.55 : 0.5 + i * 0.06 })),
  ...MORPHS.map(({ look }, i): Cut => ({ at: T.icons.from + i * BEAT, shot: `icons:${look}`, kind: 'tear', power: i === 0 ? 0.8 : 0.55 })),
  ...ANIMS.map(({ id }, i): Cut => ({ at: ANIM_TIMES[i]!, shot: `anim:${id}`, kind: 'tear', power: Math.min(1, 0.55 + i * 0.04) })),
  ...OVERLOAD.map((shot, i): Cut => ({ at: T.overload.from + i * 2, shot, kind: 'tear', power: 1 })),
  { at: T.off.line, shot: 'off', kind: 'hard', power: 0 },
  { at: T.logo.at, shot: 'logo', kind: 'hard', power: 0 },
]

/** Frames of another shot shown over the current one: a glimpse in bands (coverage < 1) or a whole flash. */
export interface Flash {
  at: number
  length: number
  shot: ShotKey
  coverage: number
  power: number
}

export const FLASHES: Flash[] = [
  // While it tunes in, slivers of what's coming.
  { at: 64, length: 4, shot: 'rack:basalt', coverage: 0.18, power: 0.45 },
  { at: 92, length: 4, shot: 'icons:terminal', coverage: 0.3, power: 0.6 },
  // A frame of a theme that hasn't arrived yet.
  { at: 212, length: 2, shot: 'rack:terminal', coverage: 1, power: 0.7 },
  // Mid-overload, the light mode, once.
  { at: 680, length: 2, shot: 'rack:graphite-light', coverage: 1, power: 1 },
]

/** The cut showing at `frame` (the last one at or before it). */
export function cutAt(frame: number): Cut {
  let current = CUTS[0]!
  for (const cut of CUTS) if (cut.at <= frame) current = cut
  return current
}

/** The cut before the one showing at `frame`. */
export function cutBefore(frame: number): Cut | undefined {
  const current = cutAt(frame)
  const i = CUTS.indexOf(current)
  return i > 0 ? CUTS[i - 1] : undefined
}

/** The frames each shot is on screen, across all its cuts and flashes: [first, last + 1). */
export function shotSpan(shot: ShotKey): [number, number] {
  let from = Infinity
  let to = -Infinity
  CUTS.forEach((cut, i) => {
    if (cut.shot !== shot) return
    from = Math.min(from, cut.at - 6)
    to = Math.max(to, (CUTS[i + 1]?.at ?? TEASER_FRAMES) + 8)
  })
  for (const flash of FLASHES) {
    if (flash.shot !== shot) continue
    from = Math.min(from, flash.at)
    to = Math.max(to, flash.at + flash.length)
  }
  return [from, to]
}

/** The storyboard: a dozen frames across the film, each named by its beat. */
export const BOARD: { frame: number; beat: string }[] = [
  { frame: 30, beat: 'I · tune in: the beam opens' },
  { frame: 84, beat: 'I · signal locked (Phosphor)' },
  { frame: 150, beat: 'II · the kit, Basalt · bezel' },
  { frame: 242, beat: 'II · tear → Graphite' },
  { frame: 318, beat: 'II · Brutal · classic, list re-sorts' },
  { frame: 345, beat: 'II · Graphite · light' },
  { frame: 384, beat: 'III · wifi-off → wifi, Terminal' },
  { frame: 440, beat: 'III · lock → open, Brutal' },
  { frame: 520, beat: 'III · the whole set, a wave' },
  { frame: 556, beat: 'IV · gallery: Chordal' },
  { frame: 676, beat: 'IV · overload' },
  { frame: 820, beat: 'V · youj · youj.dev' },
]

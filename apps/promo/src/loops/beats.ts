/* The topic loops: one short loop per part of the kit, for the top of its
 * docs overview (and, as other cuts, a homepage tile and a 4:5 post). They
 * play muted; only the sound loop carries a track, for anyone who turns it
 * on. Import-free, like the film's beats, so the render pipeline reads the
 * same frames.
 *
 * Each loop is simulated from a short pre-roll (everything at rest, so the
 * first frame shown has settled) and rendered from `preroll` for `frames`
 * frames. Each ends on the frame it starts on, so the last frame hands
 * straight back to the first. Beats are in the loop's own frames (0 is the
 * first frame shown); a scene adds the pre-roll.
 *
 * Nothing on screen is a number: no counts, sizes or versions, so a loop
 * never goes stale as the library grows. */

export type TopicId = 'icons' | 'themes' | 'motion' | 'components' | 'illustrations' | 'sound' | 'entrances'

export interface TopicLoop {
  preroll: number
  frames: number
}

export const TOPICS: Record<TopicId, TopicLoop> = {
  icons: { preroll: 30, frames: 720 },
  themes: { preroll: 120, frames: 720 },
  motion: { preroll: 30, frames: 720 },
  components: { preroll: 30, frames: 600 },
  // The pre-roll puts the first scene's bob where the last one's is when the loop comes round (see ILLUSTRATIONS_LOOP).
  illustrations: { preroll: 177, frames: 720 },
  // The pre-roll lets the publish button's async half load before its first press.
  sound: { preroll: 60, frames: 720 },
  entrances: { preroll: 30, frames: 720 },
}

/** What each loop shows, in words: its title in the manifest and the video's accessible label on the site. */
export const TOPIC_TITLES: Record<TopicId, string> = {
  icons:
    'Icons on their drawing boards: menu turns to close, play to pause, a bell rings, a check draws, a battery charges and an arrow hits its target. Then the camera pulls back to the whole set as waves of their choreographies pass through it.',
  themes:
    'A usage and billing screen takes on Cinnabar in the Brutal style one layer of the theme at a time, each carried by its own line: colour, the chart palette, radius and density, type, stroke and shadow, then the component style. Then Youj, Heather, Seaglass and Cinnabar sit side by side on the one screen, each in a style of its own, while its chart switches to seven days and back, the lower half switches between light and dark to show each palette tuned for the mode, and a last line brings Youj home.',
  motion:
    'Motion in the components, close up: a button saves, a tab underline glides, a switch flips, a dialog opens, toasts stack and a list re-sorts. Then the same list with motion and with reduced motion, side by side.',
  components:
    'A security settings screen comes apart into its components (tabs, segmented controls, a switch, a table and buttons), which fly back in and compose it again.',
  illustrations:
    'Isometric illustrations on one floor. A house gives way to a present, which assembles piece by piece, lifts its lid and closes again. The camera pulls back as the library assembles around it, each scene with one part in the accent, and lines sweep the floor: every scene takes the theme each brings, Graphite, Terminal, Brutal and Basalt again, before the camera settles on the house.',
  sound:
    'Sound made visible. A button, a switch, a segmented control, a publish button and a toast each play their cue from the Glass pack, and the real waveform of each sound lights where it passes the playhead: a press, a toggle, a choice, a success, an arrival and an error, each on the beat. The camera pulls back to the whole score, every part playing in one key.',
  entrances:
    'One dashboard built in a relay of entrance looks. Its frame is drafted in Blueprint pencil; a Trace signal runs out of it into the sidebar and lights it; the stat cards lock in with Prism; the chart builds through the render passes; the list rows appear through the Inspector\'s box models; then the camera tilts into Layers and the stack collapses into the finished dashboard.',
}

/**
 * The cuts each loop is rendered in: `wide` (1920 × 1080, for its docs
 * overview), `tall` (1080 × 1350, a 4:5 post) and `tile` (1120 × 448, a
 * homepage tile), the tile in both schemes so it sits in the page's own.
 */
export type Cut = 'wide' | 'tall' | 'tile'

/**
 * Where a cut's files are published: `site` is apps/docs/public/promo, which
 * the site serves; `exports` is apps/promo/exports, local only (git-ignored).
 */
export type Destination = 'site' | 'exports'

export interface TopicCut {
  topic: TopicId
  cut: Cut
  scheme: 'dark' | 'light'
  /** The Remotion composition. */
  composition: string
  /** The published files' name: `<name>.webm`, `.mp4`, `.jpg`. */
  name: string
  /** The device scale the cut's stage renders at (see film/format.ts). */
  scale: number
  /** Where `render publish` puts its files. */
  destination: Destination
}

const SCALES: Record<Cut, number> = { wide: 4 / 3, tall: 1.25, tile: 1 }
/**
 * The site plays each loop's wide cut and nothing else: the homepage's tiles
 * draw live pictures, and no page plays a post. Those cuts are still
 * rendered on request (README.md, "Social cuts"), and kept out of the site.
 */
const DESTINATIONS: Record<Cut, Destination> = { wide: 'site', tall: 'exports', tile: 'exports' }
const title = (s: string) => s[0]!.toUpperCase() + s.slice(1)

export const TOPIC_CUTS: TopicCut[] = (Object.keys(TOPICS) as TopicId[]).flatMap((topic) =>
  (
    [
      ['wide', 'dark'],
      ['tall', 'dark'],
      ['tile', 'dark'],
      ['tile', 'light'],
    ] as const
  ).map(([cut, scheme]) => {
    const suffix = `${cut === 'wide' ? '' : `-${cut}`}${scheme === 'light' ? '-light' : ''}`
    return {
      topic,
      cut,
      scheme,
      composition: `Loop${title(topic)}${cut === 'wide' ? '' : title(cut)}${scheme === 'light' ? 'Light' : ''}`,
      name: `loop-${topic}${suffix}`,
      scale: SCALES[cut],
      destination: DESTINATIONS[cut],
    }
  }),
)

/* ── Icons ────────────────────────────────────────────────────────────────
 * At macro, the camera steps along one row of the set's drawing boards and
 * each icon plays as it arrives: menu to close, play to pause, the bell
 * rings, the check draws, then two of the newest. From the last it pulls
 * back to the whole set as a ripple spreads out through it, and pushes back
 * in to the first while a second wave gathers toward it; the menu is at rest
 * again as the camera lands. */

export const ICONS_LOOP = {
  /** When the camera sets off for each board after the first (it is framed from the start), and how long a step takes. */
  steps: [54, 126, 212, 288, 368],
  step: 36,
  /** When each board's icon plays, in chain order: a state flips (and holds until the ripple resets it), a choreography plays once. */
  plays: [18, 92, 164, 250, 326, 406],
  /** The pull back to the whole set, and the push back in to the first board. */
  pull: 454,
  pullLength: 116,
  push: 592,
  pushLength: 116,
  /** The ripple out from the last board, and the wave that gathers back toward the first. */
  ripple: 458,
  gather: 560,
}

/* ── Themes ───────────────────────────────────────────────────────────────
 * One screen of a product (the registry's Usage & billing block under an app
 * bar) and the theme, a layer at a time. It starts in the Youj palette and the
 * Bezel style, in the page's mode. Lines wipe across it one after another,
 * each carrying one layer of Cinnabar in the Brutal style and named as it goes:
 * colour, the chart palette, radius and density, type, stroke and shadow, and
 * last the style (bezel to classic); each region settles before the next
 * line reaches it. The camera
 * leans in while they cross, and pulls back as three lines slide in and stop
 * a quarter apart, each bringing a whole palette in a style in one pass: Youj
 * in Bezel, Heather in Clean, Seaglass in Terminal and Cinnabar in Brutal side
 * by side on the one screen. The pointer
 * sets the chart to seven days, and the bars regroup in every look at
 * once. A line rises from the foot to the middle, and below it every look
 * is in the other mode (light, or dark on the light tile), each tuned for it
 * rather than inverted. The chart goes back to thirty days, and a last line
 * brings everything home to Youj and Bezel, as the camera leans in again:
 * the frame the loop starts on. */

/** A palette in a style: one look on the screen. */
export interface ThemesLook {
  palette: string
  style: string
}
export type ThemesPalette = 'youj' | 'heather' | 'seaglass' | 'cinnabar'
/** The layers a line carries, in order: each line applies one more of the target's. */
export type ThemesLayer = 'colour' | 'chart' | 'shape' | 'type' | 'depth' | 'style'

/** Where the layers lead (the right-hand look when the bands line up), and where the loop starts and ends. */
export const THEMES_TARGET = { palette: 'cinnabar', style: 'brutal' } as const
export const THEMES_HOME = { palette: 'youj', style: 'bezel' } as const

export const THEMES_LOOP = {
  /** Layer by layer: when each line sets off from the start edge; each wipes across in `cross`. */
  layers: [
    { id: 'colour', at: 30 },
    { id: 'chart', at: 76 },
    { id: 'shape', at: 122 },
    { id: 'type', at: 168 },
    { id: 'depth', at: 214 },
    { id: 'style', at: 260 },
  ] as { id: ThemesLayer; at: number }[],
  cross: 64,
  /** Side by side: each line slides in from the start edge and stops at its quarter, bringing a whole palette in a style. */
  bands: [
    { palette: 'seaglass', style: 'terminal', at: 360, stop: 0.75 },
    { palette: 'heather', style: 'clean', at: 372, stop: 0.5 },
    { palette: 'youj', style: 'bezel', at: 384, stop: 0.25 },
  ] as { palette: ThemesPalette; style: string; at: number; stop: number }[],
  slide: 60,
  /** The product at work: the pointer sets the daily-cost chart to seven days, and later back to thirty. */
  week: 462,
  month: 562,
  /** The mode line: it rises from the foot to the middle, and below it every look is in the other mode. */
  light: 484,
  rise: 54,
  /** Home: one line wipes across everything, bringing back Youj in the bezel style. */
  home: 598,
  homeCross: 92,
}

/* ── Motion ───────────────────────────────────────────────────────────────
 * Close-ups, one component at a time, each the size of half the frame and
 * each doing its one thing: Save runs through saving to saved, the tab
 * underline glides, a switch flips, a dialog opens and closes, toasts stack,
 * a list re-sorts. Then the list again, twice, side by side: with motion,
 * and with reduced motion, where the same change lands at once. Shots
 * dissolve into each other; the last dissolves back into Save, at rest. */

export const MOTION_LOOP = {
  /** When each shot starts to dissolve in (the first is up from the start), and how long a dissolve takes. */
  shots: { button: 0, tabs: 96, toggle: 200, dialog: 296, toasts: 384, list: 494, split: 584, home: 690 },
  dissolve: 16,
  button: { reach: 4, frames: 22, resolve: 74, away: 88 },
  tabs: { glides: [124, 168] },
  toggle: { flip: 234 },
  dialog: { open: 300, close: 374 },
  toasts: { at: [388, 410, 432], dismiss: 486 },
  list: { sort: 526 },
  split: { sorts: [622, 664] },
}

/* ── Components ───────────────────────────────────────────────────────────
 * A settings screen, whole: someone saves (saving, saved, and back). Then it
 * comes apart: its surface and words go, and its parts ease out to wait on
 * their own, each a component in its own right. They fly back in, landing on
 * the settle spring one after another, the surface draws in around them, and
 * the screen is whole again, where the loop begins. */

export const COMPONENTS_LOOP = {
  /** The pointer reaches Save and presses it; the save resolves (the button shows Saved, then resets itself). */
  reach: 14,
  press: 40,
  saved: 92,
  away: 118,
  /** The surface goes, then the parts leave, in reverse order, `partStagger` apart; the camera leans back first, so they stay in frame. */
  unwind: 232,
  part: 252,
  partStagger: 6,
  leanOut: 222,
  leanOutLength: 96,
  /** They fly back in, `stagger` apart, in flight order; the camera leans in as the screen forms. */
  gather: 392,
  stagger: 7,
  lean: 386,
  leanLength: 116,
  /** The surface and words draw in around them. */
  chrome: 462,
}

/* ── Illustrations ────────────────────────────────────────────────────────
 * One isometric floor, every scene in the registry on a plot of its own. At
 * macro, the first scene gives way and a present assembles in its place, its
 * parts dropping in far to near; then it comes apart as it does on hover (its
 * lid lifts off the open box) and closes again. The camera pulls back until
 * a few dozen scenes fill the frame, the rest of the library assembling
 * round it in a ripple, and holds while lines sweep the floor under the
 * scenes: each scene takes the preset its line brings as the line passes
 * (Graphite, Terminal, Brutal, then Basalt again). The library clears as
 * the camera pushes in to the first scene on the next plot, at rest, as the
 * loop began.
 *
 * The scene the loop ends on is a copy of the one it starts on, arriving
 * with the ripple (`landing`). Scenes bob on a clock of their own (ten
 * `deliberate` beats a bob), so the pre-roll is chosen to put the first
 * copy's bob where the last one's is when the loop comes round:
 * frames − landing ≡ preroll − 1, a bob apart (the first copy's clock
 * starts a frame late, mounting with the simulation). */

export type IllustrationsPreset = 'basalt' | 'graphite' | 'terminal' | 'brutal'

export const ILLUSTRATIONS_LOOP = {
  /** One bob of a floating part, in frames: ten `deliberate` (560ms) beats. */
  bob: 336,
  /** The first scene gives way, and the present assembles on its plot. */
  giveWay: 20,
  swap: 38,
  /** It comes apart (the lid lifts off), and closes. */
  apart: 104,
  together: 146,
  /** The pull back, and the ripple of scenes assembling out from the first plot, `ring` frames a plot. */
  pull: 150,
  pullLength: 160,
  wave: 164,
  ring: 22,
  /** When the scene the loop lands on arrives, with the ripple's second ring: by then enough of its plot is in frame that it starts assembling (and bobbing) at once. */
  landing: 208,
  /** Lines sweeping the floor, each bringing a preset; a sweep crosses the frame in `sweepLength`. */
  sweeps: [
    { at: 318, preset: 'graphite' },
    { at: 374, preset: 'terminal' },
    { at: 430, preset: 'brutal' },
    { at: 486, preset: 'basalt' },
  ] as { at: number; preset: IllustrationsPreset }[],
  sweepLength: 64,
  /** The push in to the plot the loop lands on; the rest of the library fades as the camera closes in. */
  push: 554,
  pushLength: 140,
  clear: 604,
  clearLength: 60,
}

/* ── Sound ────────────────────────────────────────────────────────────────
 * Five real components, one above the other, each over a strip of tape that
 * runs through the playhead: Send, a switch, a segmented range, Publish
 * (which saves, and later fails) and a toast. The score comes in from the
 * right, faint. As each note reaches the playhead its component plays it (a
 * press, a toggle, a choice, an outcome, an arrival), and the sound's real
 * waveform lights in the accent as it passes, then settles back into the
 * score behind it. At macro the camera steps down the parts, a note each;
 * it pulls back to all five as the phrase runs through them, and pushes back
 * in to Send, at rest, as the loop began. Every note lands on a beat, and
 * the loop's sound track is mixed from these same notes. */

export type SoundLane = 'send' | 'switch' | 'range' | 'publish' | 'toast'
export type SoundCueName = 'tap' | 'select' | 'toggleOn' | 'toggleOff' | 'success' | 'error' | 'notify'
export interface SoundNote {
  /** The frame the note sounds and its component moves: its first sample plays as this frame shows. */
  at: number
  lane: SoundLane
  cue: SoundCueName
}

export const SOUND_LOOP = {
  /** A beat, in frames: 100 BPM, so the loop is twenty beats. */
  beat: 36,
  /** Top to bottom. */
  lanes: ['send', 'switch', 'range', 'publish', 'toast'] as SoundLane[],
  /** The cues each part emits: the components' own. */
  plays: {
    send: ['tap'],
    switch: ['toggleOn', 'toggleOff'],
    range: ['select'],
    publish: ['tap', 'success', 'error'],
    toast: ['notify'],
  } as Record<SoundLane, SoundCueName[]>,
  /**
   * Down the parts at macro, two beats each. Then, a beat apart, each part
   * plays once the pull back has brought its lane into frame (from Publish
   * outward: the range above it, the toast below, the switch, then Send);
   * Publish is pressed again and fails; Send presses once more as the camera
   * lands on it.
   */
  score: [
    { at: 36, lane: 'send', cue: 'tap' },
    { at: 108, lane: 'switch', cue: 'toggleOn' },
    { at: 180, lane: 'range', cue: 'select' },
    { at: 252, lane: 'publish', cue: 'tap' },
    { at: 288, lane: 'publish', cue: 'success' },
    { at: 360, lane: 'range', cue: 'select' },
    { at: 396, lane: 'toast', cue: 'notify' },
    { at: 432, lane: 'switch', cue: 'toggleOff' },
    { at: 468, lane: 'send', cue: 'tap' },
    { at: 504, lane: 'publish', cue: 'tap' },
    { at: 540, lane: 'publish', cue: 'error' },
    { at: 684, lane: 'send', cue: 'tap' },
  ] as SoundNote[],
  /** The toast is dismissed (leaving has no cue). */
  dismiss: 576,
  /** At macro the camera sets off for the next part down at each of these, and a step takes `step`. */
  steps: [63, 135, 207],
  step: 36,
  /** The pull back to all five, and the push back in to Send. */
  pull: 300,
  pullLength: 150,
  push: 576,
  pushLength: 120,
}

/* ── Entrances ────────────────────────────────────────────────────────────
 * One dashboard, built once, each part by a different entrance look on the
 * shared runtime, handing over like a relay: each look starts as the one
 * before it lands, so the build never stops. It starts finished, at rest;
 * it dissolves to the empty paper, and the frame is drafted in Blueprint
 * pencil. A Trace signal runs out of the frame into the sidebar and lights
 * it; where the signal reaches the stat cards, they lock in with Prism; the
 * chart builds through the render passes; the list rows appear through the
 * Inspector's box models. Then the camera tilts into Layers, and the stack
 * collapses into the finished dashboard, the frame the loop starts on.
 *
 * Each look is driven by the loop's frame (the runtime's `seek`), so every
 * render shows the same moment of it. */

export type EntranceLook = 'blueprint' | 'trace' | 'prism' | 'passes' | 'inspector' | 'layers'
/** The part of the dashboard a look builds: the whole frame, or one region of it. */
export type EntranceRegion = 'frame' | 'sidebar' | 'stats' | 'chart' | 'list'

export const ENTRANCES_LOOP = {
  /** The finished dashboard dissolves to the empty paper. */
  clear: 30,
  clearLength: 40,
  /** The relay, in order: when each look starts on its part, how long its whole run is, and how far into it the loop
   *  joins it (frames). */
  relay: [
    { look: 'blueprint', region: 'frame', at: 76, length: 150 },
    { look: 'trace', region: 'sidebar', at: 206, length: 100 },
    { look: 'prism', region: 'stats', at: 286, length: 88 },
    { look: 'passes', region: 'chart', at: 352, length: 110 },
    { look: 'inspector', region: 'list', at: 450, length: 96 },
    // Layers comes in already rising (`from` frames into its run), so the stack is there as the tilted screen gives way to it
    { look: 'layers', region: 'frame', at: 562, length: 150, from: 26 },
  ] as { look: EntranceLook; region: EntranceRegion; at: number; length: number; from?: number }[],
  /** The hand-offs between the parts: a signal runs from where one look lands to where the next starts (frames), and its etch fades. */
  batons: [
    { at: 266, length: 22 },
    { at: 334, length: 20 },
    { at: 432, length: 22 },
  ],
  batonFade: 30,
  /** The camera tilts from the flat dashboard to the Layers stack's angle, just before Layers starts. */
  tilt: 530,
  /** The still, tilted screen fades as the stack rises out of it. */
  handover: 40,
  /** The install line comes up under the finished dashboard. */
  install: 676,
  installLength: 24,
}

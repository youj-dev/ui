/* Every beat of the film, in frames at 60fps, in one import-free module: the
 * scenes read it, and so does the render pipeline (for the captions file and
 * the frames it checks), so the two can never drift apart.
 *
 * The film goes from the atom to the product:
 *   origin     an easing curve draws itself, a spring settles, and the path
 *              resolves into the mark; the lockup forms and takes the HUD
 *   tokens     a living specimen of the contract, retuning theme to theme
 *   icons      a morph at macro, three choreographies, then the whole set
 *   parts      the components on one bench, a craft shot each, then the
 *              three motion personalities and reduced motion
 *   assemble   the same parts fly into one block, and the block becomes a window
 *   themes     three products in that window, each doing its one thing, while
 *              the five presets are pressed in turn
 *   end        the lockup and the one command
 *
 * Each chapter counts its own frames from its `from`; `leave` is when it
 * starts to hand over, in its own frames. The next one starts before this
 * one has gone. */

export const FPS = 60

export interface Chapter {
  from: number
  duration: number
  leave: number
}

/* ── The film ─────────────────────────────────────────────────────────── */

export const ORIGIN: Chapter = { from: 0, duration: 486, leave: 440 }
export const TOKENS: Chapter = { from: 436, duration: 644, leave: 644 }
/** Icons open on a cut from the specimen's icon board the moment the push lands: the two frames are the same. */
export const ICONS: Chapter = { from: TOKENS.from + TOKENS.duration, duration: 604, leave: 566 }
/** The parts arrive once the icon wall has cleared: a dip through the canvas. */
export const PARTS: Chapter = { from: ICONS.from + ICONS.leave + 14, duration: 1420, leave: 1420 }
/** Assembly continues the bench without a cut: the same parts, the same camera. */
export const ASSEMBLE: Chapter = { from: PARTS.from + PARTS.duration, duration: 372, leave: 372 }
/** The window is there from the moment the block expands. */
export const THEMES: Chapter = { from: ASSEMBLE.from + 216, duration: 1080, leave: 1038 }
export const END: Chapter = { from: THEMES.from + THEMES.leave, duration: 290, leave: 290 }

export const FILM_FRAMES = END.from + END.duration

/* ── 1 · Origin ───────────────────────────────────────────────────────── */

export const ORIGIN_BEATS = {
  /** The keylines draw out from the centre. */
  grid: 0,
  /** The two keyframes arrive at the curve's ends, with their handles. */
  keys: 18,
  /** The emphasized curve draws, in linear time, `draw` frames long. */
  ease: 44,
  draw: 96,
  /** The settle spring plots over it. */
  spring: 156,
  /** The graph resolves: curves into the axis, the axis into the stem, the keyframe docks. */
  resolve: 268,
  /** The accent tile blooms behind stem and keyframe. */
  tile: 316,
  /** The mark makes room and the wordmark rises. */
  word: 346,
  tagline: 392,
  /** The lockup leaves centre stage for the HUD. */
  toHud: 438,
  hudLength: 46,
}

/* ── 2 · Tokens ───────────────────────────────────────────────────────── */

export type PresetId = 'basalt' | 'graphite' | 'terminal' | 'brutal'

/** The specimen's route through the presets: where it holds and when it retunes, in its own frames. */
export const TOKENS_BEATS = {
  build: 0,
  /** Each retune takes `retune` frames, starting at these frames, to these presets. */
  retune: 74,
  route: [
    { at: 200, to: 'graphite' },
    { at: 384, to: 'brutal' },
    { at: 560, to: 'basalt' },
  ] as { at: number; to: PresetId }[],
  /** The camera pushes into the icon block as the specimen comes home to Basalt, landing as the chapter ends. */
  push: 548,
  pushLength: 96,
}

/* ── 3 · Icons ────────────────────────────────────────────────────────── */

export const ICONS_BEATS = {
  /** The macro icon morphs through the chain, one link every `link` frames, each morph `morph` long. */
  morph: 24,
  link: 92,
  morphLength: 64,
  /** The camera pulls back to three neighbours, which play their choreographies. */
  states: 236,
  statesLength: 70,
  play: 272,
  /** Then all the way back to the set, and a wave passes through it. */
  wall: 358,
  wallLength: 132,
  wave: 404,
  caption: 470,
}

/* ── 4 · Parts ────────────────────────────────────────────────────────── */

/** When the camera sets off for each part (its shot starts), in the bench's own frames. The first is framed from the start. */
export const PARTS_BEATS = {
  button: 0,
  tabs: 134,
  popover: 290,
  toasts: 422,
  otp: 580,
  table: 716,
  /** The camera steps back to the whole page for ⌘K. */
  command: 876,
  personalities: 1070,
  /** Reduced motion joins the personalities, and the camera widens to take it in. */
  reduced: 1262,
}

/** Frames the camera takes to travel from one part to the next. Nothing is pointed at until it lands. */
export const GLIDE = 50

/* What happens at each part, in the bench's own frames. A pointer move
 * arrives `frames` after it sets off; a click lands five frames later. */
export const BUTTON_BEATS = { reach: 22, frames: 34, resolve: 112 }
export const TABS_BEATS = { reach: 186, sweep: 212, sweepFrames: 30, click: 250, clickFrames: 20 }
export const POPOVER_BEATS = { reach: 342, frames: 28, type: 382, send: 404, sendFrames: 22 }
export const TOAST_BEATS = { second: 450, third: 472, hover: 490, hoverFrames: 26, away: 536, dismiss: 562 }
export const OTP_BEATS = { focus: 634, type: 644, digit: 7, verified: 694 }
export const TABLE_BEATS = { reach: 770, frames: 30, again: 830, away: 850 }
export const COMMAND_BEATS = { keys: 930, press: 946, type: 964, letter: 6, down: 1020, up: 1036, run: 1054 }
/** The same presses, at the same frames, in every personality; they play again once reduced motion has joined them. */
export const PERSONALITY_BEATS = { first: 1130, second: 1170, toggle: 1196, third: 1218, replay: 1324 }

/* ── 5 · Assemble ─────────────────────────────────────────────────────── */

export const ASSEMBLE_BEATS = {
  /** The camera pulls back to the whole bench. */
  pull: 0,
  pullLength: 72,
  /** The parts fly into the block, `stagger` frames apart. */
  fly: 64,
  flyLength: 70,
  stagger: 7,
  /** The block's own chrome draws in around them. */
  chrome: 120,
  /** The block becomes a window, and the product resolves in it. */
  expand: 216,
  expandLength: 96,
}

/* ── 6 · Themes ───────────────────────────────────────────────────────── */

/** The presets in the order the film shows them, and the scheme each is shown in. */
export const PRESETS: { id: PresetId; scheme: 'dark' | 'light' }[] = [
  { id: 'basalt', scheme: 'dark' },
  { id: 'graphite', scheme: 'light' },
  { id: 'terminal', scheme: 'dark' },
  { id: 'brutal', scheme: 'light' },
  { id: 'basalt', scheme: 'light' },
]

export type HeroId = 'tandem' | 'folio' | 'ledger'

/**
 * The themes chapter's script, in its own frames (0: the block starts to
 * become the window). `shots`: which product is in the window from when (a
 * cut), and the presets it is seen in, by index. `reveals[i - 1]`: when
 * preset i is pressed and opens over the product, `reveal` frames long.
 * `moments`: when each product's one interaction starts.
 */
export interface ThemesScript {
  presets: { id: PresetId; scheme: 'dark' | 'light' }[]
  shots: { hero: HeroId; at: number; presets: number[] }[]
  reveals: number[]
  reveal: number
  moments: Partial<Record<HeroId, number>>
}

/** Tandem drags a task in Basalt; Folio files its letters in Graphite; the Ledger turns to its drivers in Terminal, then Brutal and Basalt light. */
export const THEMES_SCRIPT: ThemesScript = {
  presets: PRESETS,
  shots: [
    { hero: 'tandem', at: 0, presets: [0, 1] },
    { hero: 'folio', at: 340, presets: [1, 2] },
    { hero: 'ledger', at: 580, presets: [2, 3, 4] },
  ],
  reveals: [250, 490, 750, 896],
  reveal: 46,
  moments: { tandem: 100, folio: 370, ledger: 600 },
}

/** What each product does, in frames from its moment: Tandem's drag, Folio's key presses, the Ledger's clicks. */
export const MOMENTS = {
  tandem: { reach: 0, frames: 36, press: 38, drag: 42, dragFrames: 46, up: 92 },
  folio: { keys: [0, 34, 68] },
  ledger: { reach: 0, frames: 36, clicks: [44, 76, 108], between: 26 },
}

/* ── 7 · End ──────────────────────────────────────────────────────────── */

export const END_BEATS = {
  /** The lockup comes back to centre stage, once the product has cleared. */
  home: 14,
  homeLength: 48,
  command: 54,
  copied: 164,
}

/* ── The HUD ──────────────────────────────────────────────────────────── */

/** What the HUD says, from each frame on. */
export const CAPTIONS: [number, string][] = [
  [ORIGIN_BEATS.toHud + ORIGIN_BEATS.hudLength - 8, '01 · tokens'],
  [ICONS.from + 20, '02 · icons'],
  [PARTS.from + 10, '03 · components'],
  [ASSEMBLE.from + 10, '04 · composition'],
  [THEMES.from + 60, '05 · themes'],
]

/* ── The square cut ───────────────────────────────────────────────────────
 * Shorter, for feeds (about 37s): the origin, the icons, two of the parts
 * (Save through its states, then the motion personalities), the product in
 * three presets, and the command. The chapters keep their own scripts; the
 * parts are two excerpts of the same bench, each faded in and out. */

export const SQUARE = {
  origin: ORIGIN,
  icons: { from: 470, duration: 604, leave: 566 },
  /** The bench, from its first frame: Save, until the camera sets off for the tabs. */
  save: { from: 1036, start: 0, length: 154 },
  /** The bench again, from just before the personalities land, until the assembly. */
  lanes: { from: 1170, start: 1108, length: 312 },
  themes: { from: 1462, duration: 540, leave: 500 },
  end: { from: 1962, duration: 290, leave: 290 },
  frames: 2252,
}

/** Tandem alone: its drag in Basalt, then Graphite and Brutal. */
export const SQUARE_THEMES_SCRIPT: ThemesScript = {
  presets: [PRESETS[0]!, PRESETS[1]!, PRESETS[3]!],
  shots: [{ hero: 'tandem', at: 0, presets: [0, 1, 2] }],
  reveals: [210, 356],
  reveal: 46,
  moments: { tandem: 60 },
}

/** What the HUD says in the square cut. */
export const SQUARE_CAPTIONS: [number, string][] = [
  [ORIGIN_BEATS.toHud + ORIGIN_BEATS.hudLength - 8, '01 · icons'],
  [SQUARE.save.from + 10, '02 · components'],
  [SQUARE.themes.from + 60, '03 · themes'],
]

/* ── The homepage hero loop ───────────────────────────────────────────────
 * The icons chapter's field on a round trip, no titles: at macro one icon
 * morphs star to heart to bell and the bell rings; the camera pulls back to
 * the whole set as a wave of choreographies passes through it; then it
 * pushes back in while the bell morphs home to the star, landing on the very
 * frame the loop starts on. Frames are the loop's own; it is simulated from a
 * short pre-roll (everything at rest) and rendered from `preroll`. */

export const LOOP = { preroll: 30, frames: 660 }

export const LOOP_BEATS = {
  links: [
    { at: 30, length: 66 },
    { at: 130, length: 66 },
    /** Home, during the push back in. */
    { at: 556, length: 66 },
  ],
  ring: 206,
  pull: 250,
  pullLength: 130,
  wave: 330,
  push: 520,
  pushLength: 120,
}

/* ── Stills: the frames the posters and social images are taken at ───────── */

export const STILLS_AT = {
  /** The specimen, built, in Basalt. */
  specimen: TOKENS.from + 200,
  /** The lockup, the tagline under it. */
  lockup: ORIGIN_BEATS.toHud - 6,
}

/** The frames the still compositions are taken at, in their own frames: the specimen built, the icon wall's wave part-way. */
export const STILL_FRAMES = { og: 200, tokens: 200, icons: 48 }

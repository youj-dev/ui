/* The homepage film: the hero statement in the homepage's "In motion"
 * section, made for it alone. Import-free, like the other beats, so the
 * render pipeline reads the same frames.
 *
 * The site's own construction frame comes alive. At rest it is a spec sheet
 * of the system: a release card in the middle, and around it the parts it
 * is made with (components, motion, icons, themes), under one line. The
 * camera dives into the card, which comes apart into its construction lines
 * and drafts itself again from the primitives (box, radius, surface, type,
 * icon, spring, accent), each named as it lands. It plays (a switch, a press,
 * an icon morph), a theme passes through it, and the camera pulls back to
 * the whole sheet wearing the new theme, moving on one clock. The theme
 * turns back across everything at once, and the sheet comes to rest on the
 * frame the film starts on.
 *
 * Simulated from a short pre-roll and rendered from `preroll` for `frames`
 * frames; the last frame hands straight back to the first. Beats are in the
 * film's own frames (0 is the first frame shown); the scene adds the
 * pre-roll. Nothing on screen is a number. */

export const HOME = { preroll: 30, frames: 1320 }

/** What the film shows, in words: its title in the manifest and the video's accessible label on the site. */
export const HOME_TITLE =
  'A release card drafts itself from the primitives (layout, radius, surface, type, an icon morphing out of its keyline circle, a spring, the accent), ships, and takes on a new theme. The camera pulls back to the whole system, components, motion, icons and themes, moving and re-theming as one, under the line “Designed as one.”'

/** The film in each scheme: the homepage plays the one matching the page. */
export const HOME_CUTS = [
  { scheme: 'dark', composition: 'HomeFilm', name: 'home-film' },
  { scheme: 'light', composition: 'HomeFilmLight', name: 'home-film-light' },
] as const

export const HOME_BEATS = {
  /** At rest under its line; the line leaves as the camera sets off. */
  captionOut: 30,
  /** The dive into the card, and the sheet around it fading as it goes. */
  dive: 54,
  diveLength: 96,
  /** The card comes apart into its construction lines, last part first. */
  undo: 116,
  undoStagger: 5,
  /** It drafts itself again: when each primitive lands, after `build`. */
  build: 172,
  parts: {
    outline: 0,
    radius: 26,
    surface: 50,
    type: 80,
    icon: 108,
    controls: 250,
    accent: 282,
  },
  /** The push in to the icon's drawing board, its morph out of the keyline circle, and back out to the card. */
  iconPush: 280,
  iconPushLength: 52,
  morph: 338,
  morphLength: 48,
  iconPull: 388,
  iconPullLength: 52,
  /** The primitives' names leave once the card is whole. */
  namesOut: 522,
  /** It plays: the switch, then a press on the primary action, whose icon morphs as it resolves. */
  switchOn: 540,
  reach: 556,
  press: 594,
  resolve: 600,
  resolveLength: 44,
  /** A theme passes through it. */
  themeIn: 664,
  themeInLength: 84,
  /** The pull back to the whole sheet, which returns around the card. */
  pull: 752,
  pullLength: 130,
  /** The sheet moving on one clock: the wave through the icons, tabs and segments, the curves' playhead. */
  wave: 806,
  glides: [852, 952],
  playhead: 832,
  playheadLength: 150,
  /** The card sets itself back, and the line returns. */
  reset: 936,
  captionIn: 910,
  /** The theme turns back across everything at once. */
  themeOut: 1040,
  themeOutLength: 96,
}

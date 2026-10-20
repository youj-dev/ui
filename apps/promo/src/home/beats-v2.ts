/* The homepage film, v2 (HOME-FILM-V2.md): the same story as v1 told with
 * the kit as it is now. Import-free, like the other beats, so the render
 * pipeline reads the same frames.
 *
 * The sheet comes alive as before: the camera dives into the release card,
 * which comes apart and drafts itself again from the primitives (box,
 * radius, surface, type, an isometric scene, an icon, a spring, the
 * accent). It deploys from its ActionIsland, waiting on a real loader
 * animation, its sounds drawn as their waveforms; a theme passes through it,
 * and the camera pulls back to the whole sheet moving on one clock. The
 * theme turns back across everything, and the sheet rests on the frame the
 * film starts on.
 *
 * Simulated from a short pre-roll and rendered from `preroll` for `frames`
 * frames; the last frame hands straight back to the first. Beats are in the
 * film's own frames (0 is the first frame shown). Nothing on screen is a
 * number. */

export const HOME_V2 = { preroll: 30, frames: 1510 }

/** What the film shows, in words: its title in the manifest and the video's accessible label on the site. */
export const HOME_V2_TITLE =
  'A release card drafts itself from the primitives (layout, radius, surface, type, an isometric rocket on its pad, a pull request icon morphing out of its keyline circle, a spring, the accent) and deploys from its action island while an animation of a branch merging runs, its sounds drawn as waveforms. A theme passes through it, and the camera pulls back to the whole system, components, motion, sound and themes, moving and re-theming as one, under the line “Designed as one.”'

/** The film in each scheme: the homepage plays the one matching the page. */
export const HOME_V2_CUTS = [
  { scheme: 'dark', composition: 'HomeFilmV2', name: 'home-film-v2' },
  { scheme: 'light', composition: 'HomeFilmV2Light', name: 'home-film-v2-light' },
] as const

export const HOME_V2_BEATS = {
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
    radius: 24,
    surface: 46,
    type: 70,
    scene: 96,
    icon: 132,
    controls: 282,
    accent: 314,
  },
  /** The push in to the icon's drawing board, its morph out of the keyline circle, and back out to the card. */
  iconPush: 330,
  iconPushLength: 52,
  morph: 388,
  morphLength: 48,
  iconPull: 440,
  iconPullLength: 52,
  /** The primitives' names leave once the card is whole. */
  namesOut: 520,
  /** It deploys: the camera leans in to the island, the pointer presses Deploy, the change merges (a whole loop of the canvas's animation), it resolves and the team is told. */
  lean: 546,
  leanLength: 60,
  reach: 566,
  press: 612,
  resolve: 842,
  resolveLength: 44,
  notify: 870,
  unlean: 882,
  unleanLength: 54,
  /** A theme passes through it. */
  themeIn: 930,
  themeInLength: 84,
  /** The pull back to the whole sheet, which returns around the card. */
  pull: 1020,
  pullLength: 130,
  /** The sheet moving on one clock: the tape and the springs' playhead, the segment's glide out and back. */
  playhead: 1070,
  playheadLength: 150,
  glides: [1110, 1200],
  /** The card sets itself back, and the line returns. */
  reset: 1210,
  captionIn: 1180,
  /** The theme turns back across everything at once. */
  themeOut: 1280,
  themeOutLength: 96,
}

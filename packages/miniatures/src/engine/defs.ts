/* The defs every figure shares, as the lab files wrote them (the host prefixes
 * the ids per instance). No imports, so the porting script can read it too.
 *
 * The floor a miniature stands on: in light mode it's the soft ground shadow
 * the figure draws (`class: 'shadow stage-floor'`); in the dark the stage
 * becomes a lit floor (a wide, faint radial pool) with a tight contact shadow
 * under the object (a copy of the shape with `class: 'stage-contact'`), and a
 * figure without a ground shadow adds a dark-only `stage-pool`.
 *
 * The filters: `soft` (screens, LEDs, ground shadows), `glow` (a lit part over
 * its own blur) and `bloom` (the halo behind lit glass). */

/** The dark stage's floor pool and contact shadow. */
export const STAGE_DEFS =
  '<radialGradient id="stage-floor-fill"><stop offset="0" stop-color="#f4f3ef" stop-opacity=".15"/><stop offset=".5" stop-color="#f4f3ef" stop-opacity=".085"/><stop offset=".8" stop-color="#f4f3ef" stop-opacity=".025"/><stop offset="1" stop-color="#f4f3ef" stop-opacity="0"/></radialGradient><radialGradient id="stage-contact-fill"><stop offset=".55" stop-color="#000" stop-opacity=".62"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'

export const FILTER_DEFS =
  '<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation=".75"/></filter>\n' +
  '<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>\n' +
  '<filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>'

/** Every figure's shared defs, in the lab files' order. */
export const SHARED_DEFS = `${STAGE_DEFS}\n${FILTER_DEFS}`

/** The standard stage block a new figure's stylesheet starts from: stage ink for labels on the floor, and the dark floor, contact and pool. */
export const STAGE_CSS =
  ':root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}'

/* What Youj supports, stated once. The peer ranges are the ones in the
 * packages' manifests (packages/core, motion and ui; test/support.test.ts
 * checks them), and the browsers are the matrix on the Versioning page. The
 * FAQ and the llms.txt intro read these; the MDX pages that repeat them
 * (Installation, Versioning, CLI) are checked against them by the same test. */

export const REACT = '19'
export const TAILWIND = 'v4'

/** `motion`'s peer range, in words. */
export const MOTION = '13.4.4 or later, and 14'

/** Base UI's (`@base-ui/react`) peer range, in words. */
export const BASE_UI = '1.8 and 1.9'

export const BROWSERS = 'Chrome 123, Safari 17.5 and the current Firefox, or later (Edge follows Chrome)'

/** The one part of a theme that needs more than BROWSERS. */
export const THEME_COLORS = "A theme's own derived colors need Chrome 120, Safari 18 or Firefox 128; Safari 17.5 keeps Graphite's"

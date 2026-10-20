/* The zooms every preview offers (a block's frame, the item viewer, the full-page preview), and how Fit is worked out. */

/** Fit shows a desktop demo as a 1280-wide page scaled to the frame; the others are fixed scales. */
export type Zoom = 'fit' | '50' | '75' | '100'
export const ZOOMS: Zoom[] = ['fit', '50', '75', '100']

/** The width Fit lays a demo out at, and the frame below which Fit is 100% (a phone's or small tablet's own layout). */
export const FIT_WIDTH = 1280
export const FIT_MIN = 768

/** The scale a frame `available` px wide draws a demo at under Fit. */
export const fitScale = (available: number) => (available >= FIT_MIN ? Math.min(1, available / FIT_WIDTH) : 1)

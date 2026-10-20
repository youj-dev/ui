/* Where an area's viewfinder stands, read from the address (`?strip=column`) so the three can be compared live. No
 * directive: the illustrations' query model (read on the server too) takes it. */

/**
 * `island`: a row in a glass pill floating on the stage's lower edge (a row under the stage on narrow screens).
 * `column`: a column beside the stage from lg (a row under it below). `bar`: a row sticky under the header, over the
 * explorer's grid, at every width.
 */
export type ViewfinderPresentation = 'bar' | 'column' | 'island'

export const DEFAULT_PRESENTATION: ViewfinderPresentation = 'island'

const PRESENTATIONS: readonly string[] = ['bar', 'column', 'island'] satisfies ViewfinderPresentation[]

/** The address's `strip`, or null when it names none of the three. */
export function presentationOf(value: string | null): ViewfinderPresentation | null {
  return value && PRESENTATIONS.includes(value) ? (value as ViewfinderPresentation) : null
}

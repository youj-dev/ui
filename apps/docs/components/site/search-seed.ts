/* A query for ⌘K to open with, set by whatever opens it (the 404's search
 * field) and taken once by the palette. Kept apart from the palette, which
 * loads only when it first opens. */

let seed = ''

export function seedSearch(query: string) {
  seed = query
}

export function takeSearchSeed(): string {
  const query = seed
  seed = ''
  return query
}

/** The palette's code, fetched once: on intent (a hover, a focus, a touch on a trigger) it arrives before the press that opens it. */
const importPalette = () => import('@/components/site/search')
let palette: ReturnType<typeof importPalette> | undefined
export function loadSearch() {
  return (palette ??= importPalette())
}

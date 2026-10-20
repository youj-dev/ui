import { presentationOf, type ViewfinderPresentation } from '@/components/showroom/presentation'
import { linkScript } from '@/lib/link-script'

/* The loaders page's shareable state, in the query string: the loader on show (`?id=`, what ⌘K's results link to) and
 * where the viewfinder stands (`strip`, for comparing them). Defaults are left out, so a plain /loaders stays plain.
 * How it's tuned and dressed (size, loop, colors, label, the stage's scheme and speed) and what the search holds are
 * the viewer's own and stay out of links. */

export interface LoadersQuery {
  /** The id of the loader on show. */
  id: string | null
  /** Where the viewfinder stands; none is the default (DEFAULT_PRESENTATION). */
  strip: ViewfinderPresentation | null
}

export const DEFAULT_QUERY: LoadersQuery = { id: null, strip: null }

/** On stage when the address names no loader: a sheet being drafted. */
export const FLAGSHIP = 'draft'

/**
 * Run before the page paints (the page is static, so the server can't read the address): a link naming another
 * loader marks the document, and the flagship's words stay hidden (`in-data-[loader-link]:invisible`) until the
 * browser has read the address and named that loader, rather than showing the flagship's for a moment.
 */
export const LOADER_LINK_SCRIPT = linkScript('id', FLAGSHIP, 'data-loader-link')

/** Ids are kebab-case words: `tittle`, `least-squares`. */
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const isId = (value: string | null): value is string => value !== null && value.length <= 64 && ID.test(value)

export function parseQuery(search: string): LoadersQuery {
  const p = new URLSearchParams(search)
  const id = p.get('id')
  return { id: isId(id) ? id : null, strip: presentationOf(p.get('strip')) }
}

export function serializeQuery(state: LoadersQuery): string {
  const p = new URLSearchParams()
  if (state.id) p.set('id', state.id)
  if (state.strip) p.set('strip', state.strip)
  return p.toString()
}

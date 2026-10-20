import { presentationOf, type ViewfinderPresentation } from '@/components/showroom/presentation'
import { linkScript } from '@/lib/link-script'

/* The illustrations page's shareable state, in the query string: the scene
 * on show and where the viewfinder stands (`strip`, for comparing them).
 * Defaults are left out, so a plain /illustrations stays plain. How the
 * preview is dressed (preset, scheme, apart, reduced) and what the search
 * holds are the viewer's own and stay out of links. */

export interface ExplorerQuery {
  /** The selected scene's id. */
  scene: string | null
  /** Where the viewfinder stands; none is the default (DEFAULT_PRESENTATION). */
  strip: ViewfinderPresentation | null
}

export const DEFAULT_QUERY: ExplorerQuery = { scene: null, strip: null }

/** On stage when the address names no scene: the empty state every app needs first. */
export const FLAGSHIP = 'padlock'

/**
 * Run before the page paints (the page is static, so the server can't read the address): a link naming another
 * scene marks the document, and the scene's words stay hidden (`in-data-[scene-link]:invisible`) until the browser has
 * read the address and drawn that scene, rather than showing the flagship's for a moment.
 */
export const SCENE_LINK_SCRIPT = linkScript('scene', FLAGSHIP, 'data-scene-link')

/** Ids are kebab-case words: `server-rack`, `not-found`. */
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const isId = (value: string) => value.length <= 64 && ID.test(value)
const idOrNull = (value: string | null) => (value && isId(value) ? value : null)

export function parseQuery(search: string): ExplorerQuery {
  const p = new URLSearchParams(search)
  return {
    scene: idOrNull(p.get('scene')),
    strip: presentationOf(p.get('strip')),
  }
}

export function serializeQuery(state: ExplorerQuery): string {
  const p = new URLSearchParams()
  if (state.scene) p.set('scene', state.scene)
  if (state.strip) p.set('strip', state.strip)
  return p.toString()
}

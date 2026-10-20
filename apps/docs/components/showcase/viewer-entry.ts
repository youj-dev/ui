import type { Framing } from '@/lib/showcase'

/* One item as the full-page preview (./full-preview) shows it, from
 * app/viewer-index/[level]/route.ts. */

export interface ViewerFile {
  path: string
  /** Where its highlighted text is published (app/code). */
  src: string
  lines: number
}

export interface ViewerStory {
  /** A block's named export (`Split`), or a component's docs example (`button/sizes`). */
  id: string
  label: string
  /** A component's story is a file of its own: its source. */
  files?: ViewerFile[]
}

export interface ViewerEntry {
  /** Its /view page under /view: `blocks/app-billing`, `component/button`. */
  key: string
  slug: string
  title: string
  summary: string
  /** Its category's name on its level's list. */
  category: string
  /** Its level's name: `Card`. */
  level: string
  framing: Framing
  /** A component's docs page. */
  docs?: string
  /** A block's page on its level's list. */
  page?: string
  /** `npx @youj/cli add …`, when there is one. */
  install?: string
  /** A component's import from `@youj/react`. */
  import?: string
  stories: ViewerStory[]
  /** A block's files, as `youj add` writes them. */
  files?: ViewerFile[]
}

/** The level of a list as the /view pages file it: `component/<slug>`, `blocks/<slug>`. */
export const viewKind = (level: string) => (level === 'component' ? level : 'blocks')

import { ACCOUNT_PARTS, DEFAULT_FRAME, readFrame, SEARCH_PARTS, SIDEBAR_PARTS, TOPBAR_PARTS, writeFrame, type FrameConfig, type Part } from '@youj/react/docs/create/config'
import { readTheme, writeTheme } from '@youj/react/docs/create/theme-url'
import { DEFAULT_SIZE, readSize, writeSize, type SizeConfig } from '@youj/react/docs/create/size-url'
import { readLook, writeLook } from '@youj/react/docs/create/look-url'
import type { Theme } from '@youj/core/lib/youj/theme/contract'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { DEFAULT_LOOK, type YoujLook } from '@youj/core/lib/youj/look'

/* Create's state is its query string: the frame's parts, the theme, the
 * component style and the size (packages/ui/src/docs/create: config.ts,
 * theme-url.ts, look-url.ts and size-url.ts own the format, which the CLI
 * reads too). The page keeps it in
 * its own URL, so a frame is a link, and sends it to the preview frame as it
 * changes. */

export interface CreateState {
  frame: FrameConfig
  theme: Theme
  /** How the frame's components are built: classic (the default, left out of the link) or bezel. */
  style: YoujLook
  /** The layout density and scale the export's root provider sets: the standard size (roomy at 100%) by default, left out of the link. */
  size: SizeConfig
}

/**
 * The state a link describes. A link that names nothing (an empty /create)
 * starts in `start`, the site's preset for the mode, instead of the library's
 * default; any link that names a theme or a frame keeps its own.
 */
export function readCreate(search: string, start?: ThemeId): CreateState {
  const params = new URLSearchParams(search)
  if (start && ![...params.keys()].some((key) => key !== 'step')) params.set('preset', start)
  return { frame: readFrame(params), theme: readTheme(params), style: readLook(params), size: readSize(params) }
}

/** The state as a query string, without the `?`: the theme, then the frame, then the style (none for classic, the default), then the size (none for an app's). */
export function createQuery({ frame, theme, style, size }: CreateState): string {
  return writeSize(size, writeLook(style, writeFrame(frame, writeTheme(theme)))).toString()
}

/** Create at `state`, opened on `step` when it isn't the first. */
export function createPath(state: CreateState, step?: 'theme' | 'export'): string {
  const params = new URLSearchParams(createQuery(state))
  if (step) params.set('step', step)
  const query = params.toString()
  return query ? `/create?${query}` : '/create'
}

/** Create with a frame block chosen, for a link from a part's mention; undefined for anything that isn't a frame part. */
export function createPathFor(item: string): string | undefined {
  if (!item.startsWith('frame-')) return undefined
  const match = <K extends string>(parts: Record<K, Part>) => (Object.keys(parts) as K[]).find((key) => `frame-${parts[key].file}` === item)
  const frame: FrameConfig = { ...DEFAULT_FRAME }
  const sidebar = match(SIDEBAR_PARTS)
  const topbar = match(TOPBAR_PARTS)
  const account = match(ACCOUNT_PARTS)
  const search = match(SEARCH_PARTS)
  if (sidebar) frame.sidebar = sidebar
  if (topbar) frame.topbar = topbar
  if (account) frame.account = account
  if (search) frame.search = search
  if (item === 'frame-notifications') frame.notifications = true
  if (item === 'frame-upgrade-card') frame.upgrade = true
  return createPath({ frame, theme: readTheme(new URLSearchParams()), style: DEFAULT_LOOK, size: DEFAULT_SIZE })
}

/* ── The preview's channel ─────────────────────────────────────────────
 * The preview frame says hello until it hears the state (the page may still
 * be hydrating when the frame first asks); the page answers every hello, and
 * sends the state again on every change. Only same-origin messages between the page and its own frame are
 * read, and what they carry goes through the same parsers as a URL. */

export const CREATE_CHANNEL = 'youj:create'

export type CreateMessage =
  | { channel: typeof CREATE_CHANNEL; kind: 'state'; query: string }
  | { channel: typeof CREATE_CHANNEL; kind: 'hello' }

export function readCreateMessage(data: unknown): CreateMessage | null {
  if (typeof data !== 'object' || data === null) return null
  const message = data as { channel?: unknown; kind?: unknown; query?: unknown }
  if (message.channel !== CREATE_CHANNEL) return null
  if (message.kind === 'hello') return { channel: CREATE_CHANNEL, kind: 'hello' }
  if (message.kind !== 'state' || typeof message.query !== 'string' || message.query.length > 4000) return null
  return { channel: CREATE_CHANNEL, kind: 'state', query: message.query }
}

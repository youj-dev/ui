'use client'

import { useEffect, useState } from 'react'
import { frameItems, frameScreens, type FrameConfig } from '@youj/react/docs/create/config'
import { frameFiles, NAV_PATH } from '@youj/react/docs/create/frame-files'
import {
  fontsImport,
  fontsSource,
  youjAddCommand,
  LAYOUT_PATH,
  providerTag,
  themeSource,
  type InstallMode,
} from '@youj/react/docs/create/codegen'
import { lookStylesheet } from '@youj/react/docs/create/look-url'
import { DEFAULT_LOOK } from '@youj/core/lib/youj/look'
import { themeCss } from '@youj/core/lib/youj/theme'
import type { CreateState } from '@/lib/create'

/* What Create exports: the files it writes (the app shell, the nav, each
 * screen as a route with the layout, the theme and its fonts), the parts and screens as `youj add`
 * installs them (read from this site's registry, /r/<item>.json, when first
 * needed), a README, and the commands. */

export interface ExportFile {
  /** Where it goes in an app: `components/app-shell.tsx`. */
  path: string
  code: string
}

export const SHELL_PATH = 'components/app-shell.tsx'
export const THEME_PATH = 'lib/theme.ts'
export const FONTS_PATH = 'lib/fonts.ts'
export const THEME_CSS_PATH = 'styles/theme.css'

/** The state the export writes: as designed, or the frame alone when the screens stay behind. */
export function exportState(state: CreateState, includeScreens: boolean): CreateState {
  return includeScreens || !state.frame.screens.length ? state : { ...state, frame: { ...state.frame, screens: [] } }
}

export function writtenFiles(state: CreateState, link: string, mode: InstallMode): ExportFile[] {
  const fonts = fontsSource(state.theme)
  return [
    ...frameFiles(state.frame, link, mode),
    { path: THEME_PATH, code: themeSource(state.theme, mode, state.style, state.size) },
    ...(fonts ? [{ path: FONTS_PATH, code: fonts }] : []),
  ]
}

/** The theme as plain CSS variables, for an app that sets it with an attribute rather than through YoujProvider. */
export function themeCssFile(state: CreateState): ExportFile {
  const { theme } = state
  const load = fontsImport(theme)
  const usage = theme.motionPersonality === 'precise' ? `data-yj-theme="${theme.id}"` : `data-yj-theme="${theme.id}" data-yj-motion="${theme.motionPersonality}"`
  const css = themeCss(theme, `[data-yj-theme='${theme.id}']`)
  return { path: THEME_CSS_PATH, code: `${load ? `${load}\n\n` : ''}${css}\n/* Apply it on <html> for the whole app, or on any element for part of a page:\n   <html ${usage}> */` }
}

export function createCommand(link: string): string {
  return `npx @youj/cli create '${link}'`
}

export function readme(state: CreateState, link: string): ExportFile {
  const screens = frameScreens(state.frame)
  const home = screens[0]
  const load = fontsImport(state.theme)
  const stylesheet = lookStylesheet(state.style)
  const code = [
    '# Your Youj frame',
    '',
    `Made in Youj Create: ${link}`,
    '',
    'All at once, in your app’s folder:',
    '',
    '```sh',
    createCommand(link),
    '```',
    '',
    'Or by hand:',
    '',
    `1. Add the parts${home ? (screens.length > 1 ? ' and the screens' : ' and the screen') : ''}, with the components they use${stylesheet ? `, and the ${state.style} style's recipes` : ''}:`,
    '',
    '   ```sh',
    `   ${youjAddCommand(state.frame, state.style)}`,
    '   ```',
    '',
    ...(stylesheet
      ? [`   The package's stylesheet has the style already; copied source puts it in \`${stylesheet}\`: import it right after ui.css.`, '']
      : []),
    `2. Copy \`${SHELL_PATH}\`, \`${NAV_PATH}\` and \`${THEME_PATH}\`${load ? ` (and \`${FONTS_PATH}\`)` : ''} into your app (\`src/\` if it has one).`,
    `3. Give your root YoujProvider the theme and the size${state.style === DEFAULT_LOOK ? '' : ', and the style'}: \`${providerTag(state.style, state.size)}\`, with \`import { theme } from '@/lib/theme'\`.`,
    ...(load
      ? [
          `4. Load its typefaces: on Next.js, put \`fontVariables\` from \`${FONTS_PATH}\` on \`<html>\` in \`app/layout.tsx\`; anywhere else, skip that file and add this to the top of your global CSS:`,
          '',
          `   ${load}`,
          '',
        ]
      : []),
    home
      ? `${load ? 5 : 4}. Copy \`app/(app)\` and \`app/page.tsx\`: the layout wraps every screen in the shell, ${screens.map((s) => `\`${s.route}/page.tsx\` renders ${s.label.toLowerCase()} (\`${s.file}.tsx\`)`).join(', ')}, the sidebar links to them from \`${NAV_PATH}\`, and \`/\` redirects to ${home.label.toLowerCase()}, the home screen. The screens' sources are yours to change.`
      : `${load ? 5 : 4}. Wrap your pages in the shell, e.g. in \`${LAYOUT_PATH}\`: \`<AppShell>{children}</AppShell>\`, and give each one an item in \`${NAV_PATH}\`.`,
    '',
    `The \`blocks\` folder here is what step 1 installs, for reading.`,
    '',
  ].join('\n')
  return { path: 'README.md', code }
}

interface RegistryFile {
  path: string
  target?: string
  content?: string
}

const cache = new Map<string, Promise<ExportFile[]>>()

function fetchItem(item: string): Promise<ExportFile[]> {
  let pending = cache.get(item)
  if (!pending) {
    pending = fetch(`/r/${item}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<{ files?: RegistryFile[] }>) : Promise.reject(new Error(`${item}: ${res.status}`))))
      .then((json) => (json.files ?? []).filter((f) => f.content).map((f) => ({ path: f.target ?? f.path, code: f.content!.trimEnd() })))
    // A failed fetch can be tried again later.
    pending.catch(() => cache.delete(item))
    cache.set(item, pending)
  }
  return pending
}

const folder = (path: string) => path.slice(0, path.lastIndexOf('/'))

/** Registry items as `youj add` writes their files: a folder's files, then its subfolders. */
export async function loadParts(items: string[]): Promise<ExportFile[]> {
  const lists = await Promise.all(items.map(fetchItem))
  return lists.flat().sort((a, b) => folder(a.path).localeCompare(folder(b.path)) || a.path.localeCompare(b.path))
}

/** The frame's parts as installed, once `enabled`; null while they load (or if they can't). */
export function usePartFiles(frame: FrameConfig, enabled: boolean): ExportFile[] | null {
  const items = frameItems(frame).join(' ')
  const [files, setFiles] = useState<{ items: string; files: ExportFile[] } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    loadParts(items.split(' ')).then(
      (parts) => live && setFiles({ items, files: parts }),
      () => live && setFiles(null),
    )
    return () => {
      live = false
    }
  }, [items, enabled])
  return files?.items === items ? files.files : null
}

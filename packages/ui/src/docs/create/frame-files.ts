import { HOME_PATH, homeSource, screenFiles, shellSource, type InstallMode } from './codegen'
import { screensNav, type FrameConfig } from './config'

/* What a frame export writes beside the theme: the shell, the nav, and the
 * (app) route group's layout with a route per screen. Plain TypeScript, read by
 * Create's export and the CLI (`youj create`). */

/** A file the export writes, relative to the app's source root (`app/…`, `lib/…`, `components/…`). */
export interface FrameFile {
  path: string
  code: string
}

/** A Youj icon's registry item: `CreditCardIcon` → `icon-credit-card`. */
export const iconItem = (icon: string) =>
  `icon-${icon
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()}`

export const NAV_PATH = 'lib/nav.ts'

/** The nav file's `activeNav`: the item a path is on. */
const ACTIVE_NAV = [
    `/** The item a path is on: the one whose href is the longest match. */`,
    `export function activeNav(pathname: string): string | undefined {`,
    `  let found: { id: string; href: string } | undefined`,
    `  for (const section of NAV) {`,
    `    for (const item of section.items) {`,
    `      const href = item.href`,
    `      if (!href || (pathname !== href && !pathname.startsWith(\`\${href}/\`))) continue`,
    `      if (!found || href.length > found.href.length) found = { id: item.id, href }`,
    `    }`,
    `  }`,
    `  return found?.id`,
    `}`,
    '',
]

/** lib/nav.ts: one item per screen in the frame, linking to its route (none yet for a frame with no screens). */
export function navSource(frame: FrameConfig, mode: InstallMode): string {
  const sections = screensNav(frame)
  const icons = [...new Set(sections.flatMap((s) => [s.icon, ...s.items.map((i) => i.icon)]))].sort()
  const iconImports =
    mode === 'package'
      ? icons.length ? [`import { ${icons.join(', ')} } from '@youj/icons'`] : []
      : icons.map((icon) => `import { ${icon} } from '@/components/youj/icons/${iconItem(icon).replace(/^icon-/, '')}'`)
  const groups = sections.map((s) =>
    [
      `  {`,
      `    id: '${s.id}',`,
      `    label: '${s.label}',`,
      `    icon: ${s.icon},`,
      `    items: [`,
      ...s.items.map((i) => `      { id: '${i.id}', label: '${i.label}', href: '${i.href}', icon: ${i.icon} },`),
      `    ],`,
      `  },`,
    ].join('\n'),
  )
  return [
    ...iconImports,
    `import type { FrameNavSection } from '@/blocks/frame/shell/model'`,
    '',
    `/* Your app's navigation: one item per screen in app/(app). The sidebar, the`,
    ` * top bar's trail, the ⌘K palette and the phone tab bar all read it. A new`,
    ` * page is its route plus an item here. */`,
    '',
    ...(groups.length ? [`export const NAV: FrameNavSection[] = [`, ...groups, `]`] : [`export const NAV: FrameNavSection[] = []`]),
    '',
    ...ACTIVE_NAV,
  ].join('\n')
}

/** The icons the frame's nav uses, as registry items: what copied source needs beside the blocks. */
export function navIconItems(frame: FrameConfig): string[] {
  const sections = screensNav(frame)
  return [...new Set(sections.flatMap((s) => [s.icon, ...s.items.map((i) => i.icon)]))].sort().map(iconItem)
}

/**
 * Every file a frame export writes beside the theme: the shell and the nav it reads and, with screens, the (app) route
 * group's layout, a route per screen and a root route redirecting to the home screen. `router` is the shell's (Next.js).
 */
export function frameFiles(frame: FrameConfig, link: string | undefined, mode: InstallMode, options: { router?: boolean } = {}): FrameFile[] {
  const home = homeSource(frame)
  return [
    { path: 'components/app-shell.tsx', code: shellSource(frame, link, options) },
    { path: NAV_PATH, code: navSource(frame, mode) },
    ...(home ? [{ path: HOME_PATH, code: home }] : []),
    ...screenFiles(frame),
  ]
}

import { DEFAULT_LOOK, type YoujLook } from '@youj/core/lib/youj/look'
import { DEFAULTS, type ThemeInput } from '@youj/core/lib/youj/theme/contract'
import {
  ACCOUNT_PARTS,
  accountInSidebar,
  BRAND_PARTS,
  FRAME_PART,
  frameItems,
  frameScreens,
  NOTIFICATIONS_PART,
  SEARCH_PARTS,
  SIDEBAR_PARTS,
  TOPBAR_PARTS,
  UPGRADE_PART,
  type FrameConfig,
  type Part,
  type ScreenPart,
} from './config'
import { fontOf, fontVariable, googleFontsHref, loadable, nextFontName, type FontFamily } from './fonts'
import { DEFAULT_SIZE, type SizeConfig } from './size-url'
import { lookItem } from './look-url'

/* A frame as a tree of parts (the plan), and that tree as source: the app
 * shell that composes the chosen blocks, the screens it holds as routes, the
 * theme as `defineTheme` with its fonts, and the install commands. The
 * preview renders the same plan (render.tsx), so what Create shows is what it
 * exports. */

/** Sample data the blocks ship in shell/data.tsx, referenced by name. */
export interface PlanRef {
  ref: 'NAV' | 'USER' | 'TEAMS'
}
export type PlanValue = string | boolean | PlanRef | PlanElement | PlanElement[]
export interface PlanElement {
  part: Part
  props: Record<string, PlanValue>
  /** The shell's `{children}` goes inside: the screen. */
  page?: boolean
}

const ref = (name: PlanRef['ref']): PlanRef => ({ ref: name })
const el = (part: Part, props: Record<string, PlanValue | false | undefined> = {}, page?: boolean): PlanElement => ({
  part,
  props: Object.fromEntries(Object.entries(props).filter((entry): entry is [string, PlanValue] => entry[1] !== undefined && entry[1] !== false)),
  ...(page && { page }),
})

/** The product name the logo shows in the sample. */
export const SAMPLE_NAME = 'Northwind'

export function framePlan(config: FrameConfig): PlanElement {
  const account = el(ACCOUNT_PARTS[config.account], { user: ref('USER') })
  const header = config.brand === 'workspace' ? el(BRAND_PARTS.workspace, { teams: ref('TEAMS') }) : el(BRAND_PARTS.logo, { name: SAMPLE_NAME })
  const footer = [config.upgrade && el(UPGRADE_PART), accountInSidebar(config) && account].filter((x): x is PlanElement => Boolean(x))
  const sidebar = el(SIDEBAR_PARTS[config.sidebar], { header, footer: footer.length > 1 ? footer : footer[0] })
  const topbar = el(TOPBAR_PARTS[config.topbar], {
    search: config.search === 'none' ? undefined : el(SEARCH_PARTS[config.search]),
    actions: config.notifications && el(NOTIFICATIONS_PART),
    account: !accountInSidebar(config) && account,
  })
  return el(
    FRAME_PART,
    {
      nav: ref('NAV'),
      mobileNav: config.mobile === 'sheet' ? undefined : config.mobile,
      sidebar,
      topbar,
    },
    true,
  )
}

/* ── JSX, printed the way Prettier would at 100 columns ──────────────── */

const WIDTH = 100
const isRef = (v: PlanValue): v is PlanRef => typeof v === 'object' && !Array.isArray(v) && 'ref' in v
const isElement = (v: PlanValue): v is PlanElement => typeof v === 'object' && !Array.isArray(v) && 'part' in v

function attr(name: string, value: PlanValue, indent: string): string {
  if (value === true) return name
  if (typeof value === 'string') return `${name}=${JSON.stringify(value)}`
  if (typeof value === 'boolean') return `${name}={false}`
  if (isRef(value)) return `${name}={${value.ref}}`
  const inner = indent + '  '
  if (Array.isArray(value)) {
    return `${name}={\n${inner}<>\n${value.map((v) => inner + '  ' + jsx(v, inner + '  ')).join('\n')}\n${inner}</>\n${indent}}`
  }
  const inline = jsx(value, indent)
  if (!inline.includes('\n') && indent.length + name.length + inline.length + 3 <= WIDTH) return `${name}={${inline}}`
  return `${name}={\n${inner}${jsx(value, inner)}\n${indent}}`
}

/** An element at `indent`: on one line when it fits, else one prop per line. */
export function jsx(node: PlanElement, indent = ''): string {
  const name = node.part.component
  const entries = Object.entries(node.props)
  const close = node.page ? `>\n${indent}  {children}\n${indent}</${name}>` : ' />'
  const flat = entries.map(([k, v]) => attr(k, v, indent))
  const oneLine = `<${name}${flat.map((a) => ` ${a}`).join('')}${node.page ? '>' : ' />'}`
  if (!node.page && !flat.some((a) => a.includes('\n')) && indent.length + oneLine.length <= WIDTH) return oneLine
  if (!entries.length) return `<${name}${close}`
  const inner = indent + '  '
  const lines = entries.map(([k, v]) => inner + attr(k, v, inner))
  return `<${name}\n${lines.join('\n')}\n${indent}${node.page ? `>\n${inner}{children}\n${indent}</${name}>` : '/>'}`
}

function walk(node: PlanElement, parts: Part[], refs: Set<string>) {
  parts.push(node.part)
  for (const value of Object.values(node.props)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (isElement(v)) walk(v, parts, refs)
      else if (isRef(v)) refs.add(v.ref)
    }
  }
}

/** Where `youj add` puts the frame blocks, as an import path. */
export const BLOCKS_PATH = '@/blocks/frame'

/**
 * The app shell: the chosen parts composed through AppFrame, on the app's own nav (lib/nav.ts, an item per screen
 * with its href). With `router` (Next.js's App Router, the default) the frame marks the item the path is on and moves
 * with Next's router; without, it's yours to wire to your router.
 */
export function shellSource(config: FrameConfig, link?: string, options: { router?: boolean } = {}): string {
  const router = options.router ?? true
  const plan = framePlan(config)
  const parts: Part[] = []
  const refs = new Set<string>()
  walk(plan, parts, refs)
  const byFile = new Map<string, Set<string>>()
  for (const part of parts) byFile.set(part.file, (byFile.get(part.file) ?? new Set()).add(part.component))
  const imports = [...byFile]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, names]) => `import { ${[...names].sort().join(', ')} } from '${BLOCKS_PATH}/${file}'`)
  const data = [...refs].filter((r) => r !== 'NAV').sort()
  imports.push(`import { ${data.join(', ')} } from '${BLOCKS_PATH}/shell/data'`)
  const named = data.join(', ').replace(/, ([^,]*)$/, ' and $1')
  const origin = `/* Your app's frame${link ? `, composed in Youj Create:\n * ${link}` : ', composed in Youj Create.'}`
  const frame = `    ${jsx(plan, '    ')}`
  const sample = ` * The nav is yours, in lib/nav.ts. ${named} ${data.length > 1 ? 'are' : 'is'} sample data (shell/data.tsx):`
  const replace = ` * replace ${data.length > 1 ? 'them' : 'it'} with the signed-in person${refs.has('TEAMS') ? ' and their workspaces' : ''}.`
  if (!router) {
    return [
      `'use client'`,
      '',
      `import type { ReactNode } from 'react'`,
      ...imports,
      `import { NAV } from '@/lib/nav'`,
      '',
      origin,
      sample,
      replace,
      ` * Pass \`active\` (activeNav(pathname) from lib/nav.ts) and \`onNavigate\` from your router to AppFrame. */`,
      '',
      `export function AppShell({ children }: { children: ReactNode }) {`,
      `  return (`,
      frame,
      `  )`,
      `}`,
      '',
    ].join('\n')
  }
  return [
    `'use client'`,
    '',
    `import type { MouseEvent, ReactNode } from 'react'`,
    `import { usePathname, useRouter } from 'next/navigation'`,
    ...imports,
    `import type { FrameNavItem } from '${BLOCKS_PATH}/shell/model'`,
    `import { activeNav, NAV } from '@/lib/nav'`,
    '',
    origin,
    sample,
    `${replace} */`,
    '',
    `export function AppShell({ children }: { children: ReactNode }) {`,
    `  const pathname = usePathname()`,
    `  const router = useRouter()`,
    `  // Move between screens with the router, unless the click asks for a new tab or window.`,
    `  const navigate = (item: FrameNavItem, event: MouseEvent<HTMLAnchorElement> | null) => {`,
    `    if (!item.href || (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0))) return`,
    `    event?.preventDefault()`,
    `    router.push(item.href)`,
    `  }`,
    `  return (`,
    frame.replace('nav={NAV}', 'nav={NAV}\n      active={activeNav(pathname)}\n      onNavigate={navigate}'),
    `  )`,
    `}`,
    '',
  ].join('\n')
}

/* ── The screens ──────────────────────────────────────────────────────── */

/** Where a screen goes in an app (Next.js App Router): `app/(app)/task-board/page.tsx`. */
export function screenPath(screen: ScreenPart): string {
  return `app/(app)/${screen.route}/page.tsx`
}

/** The URL the frame's home screen is served at, or null for a frame with none. */
export function homeHref(config: FrameConfig): string | null {
  const home = frameScreens(config)[0]
  return home ? `/${home.route}` : null
}

/** The route group's layout: every screen in it sits in the shell. */
export const LAYOUT_PATH = 'app/(app)/layout.tsx'

/** Where the frame sends `/`: its home screen. */
export const HOME_PATH = 'app/page.tsx'

/** The root route: a redirect to the home screen, which is a route like the others. Null for a frame with no screens. */
export function homeSource(config: FrameConfig): string | null {
  const href = homeHref(config)
  if (!href) return null
  return [
    `import { redirect } from 'next/navigation'`,
    '',
    `/* The first screen in your nav is the home page: / goes to it. Swap this for a`,
    ` * landing page of your own, and keep the screens in app/(app). */`,
    '',
    `export default function Home() {`,
    `  redirect('${href}')`,
    `}`,
    '',
  ].join('\n')
}

/** A screen's route: a page that renders the screen block. */
export function screenSource(screen: ScreenPart): string {
  return [
    `import { ${screen.component} } from '@/${screen.file}'`,
    '',
    `/* The ${screen.label.toLowerCase()} screen from Youj Create: its source is`,
    ` * ${screen.file}.tsx, yours to change. The layout beside this route wraps it`,
    ` * in your app shell. */`,
    '',
    `export default function Page() {`,
    `  return <${screen.component} />`,
    `}`,
    '',
  ].join('\n')
}

/** The route group: its layout and a route for each of the frame's screens (none for a frame with none). */
export function screenFiles(config: FrameConfig): { path: string; code: string }[] {
  const screens = frameScreens(config)
  if (!screens.length) return []
  return [{ path: LAYOUT_PATH, code: layoutSource() }, ...screens.map((screen) => ({ path: screenPath(screen), code: screenSource(screen) }))]
}

/** The route group's layout, putting its screens in the shell. */
export function layoutSource(): string {
  return [
    `import { Suspense, type ReactNode } from 'react'`,
    `import { AppShell } from '@/components/app-shell'`,
    '',
    `/* Every page in the (app) route group sits in your app shell. Suspense lets a screen that reads`,
    ` * the clock (a date picker's today, a countdown) render per request where the Next.js app has`,
    ` * cacheComponents on, as create-next-app sets it, instead of failing the build. */`,
    '',
    `export default function Layout({ children }: { children: ReactNode }) {`,
    `  return (`,
    `    <AppShell>`,
    `      <Suspense>{children}</Suspense>`,
    `    </AppShell>`,
    `  )`,
    `}`,
    '',
  ].join('\n')
}

/* ── The theme ────────────────────────────────────────────────────────── */

export type InstallMode = 'package' | 'registry'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function literal(value: unknown): string {
  if (typeof value === 'string') return value.includes("'") ? JSON.stringify(value) : `'${value}'`
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`
  if (typeof value === 'object' && value !== null) {
    return `{ ${Object.entries(value).map(([k, v]) => `${/^[a-z]\w*$/i.test(k) ? k : JSON.stringify(k)}: ${literal(v)}`).join(', ')} }`
  }
  return String(value)
}

const FALLBACKS = { sans: 'ui-sans-serif, system-ui, sans-serif', serif: 'ui-serif, Georgia, serif', mono: 'ui-monospace, monospace' } as const

/**
 * A web font's stack as the export writes it: next/font's variable when the
 * app sets it on <html> (lib/fonts.ts), else the family by name, which a
 * stylesheet @import registers. So one theme file serves either setup.
 */
export function exportStack(f: FontFamily): string {
  return `var(${fontVariable(f)}, '${f.family}'), ${FALLBACKS[f.kind]}`
}

/** The web fonts the exported theme names that an app has to load (not Inter and JetBrains Mono, which it takes from @fontsource), each once. */
export function exportedFonts(theme: ThemeInput): FontFamily[] {
  const fonts = themeFields(theme).find(([key]) => key === 'fonts')?.[1] as Record<string, string> | undefined
  const found = Object.values(fonts ?? {})
    .map(fontOf)
    .filter((f): f is FontFamily => Boolean(f && loadable(f)))
  return [...new Set(found)]
}

/** The fields as the export writes them: web fonts by their variables. */
function exportFields(theme: ThemeInput): [string, unknown][] {
  return themeFields(theme).map(([key, value]) => {
    if (key !== 'fonts') return [key, value]
    const stacks = Object.entries(value as Record<string, string>).map(([k, stack]) => {
      const f = fontOf(stack)
      return [k, f && loadable(f) ? exportStack(f) : stack]
    })
    return [key, Object.fromEntries(stacks)]
  })
}

const camel = (id: string) => id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/** next/font's call for a family: static families name their weights, variable ones take their extra axes. */
function nextFontCall(f: FontFamily): string {
  const axes = f.web!.axes.split('@')[0]!.split(',').filter((a) => a !== 'wght' && a !== 'ital')
  const weight = f.web!.weights && (f.web!.weights.length === 1 ? `'${f.web!.weights[0]}'` : `[${f.web!.weights.map((w) => `'${w}'`).join(', ')}]`)
  const options = [`subsets: ['latin']`, weight && `weight: ${weight}`, axes.length > 0 && `axes: [${axes.map((a) => `'${a}'`).join(', ')}]`, `variable: '${fontVariable(f)}'`]
  return `const ${camel(f.id)} = ${nextFontName(f)}({ ${options.filter(Boolean).join(', ')} })`
}

/**
 * The theme's web fonts for Next.js: next/font/google self-hosts them, and
 * their variables on <html> connect them to the theme's stacks. Null when the
 * theme names none (its typefaces are the defaults, or on the device already).
 */
export function fontsSource(theme: ThemeInput): string | null {
  const fonts = exportedFonts(theme)
  if (!fonts.length) return null
  const names = [...new Set(fonts.map(nextFontName))].sort()
  return [
    `import { ${names.join(', ')} } from 'next/font/google'`,
    '',
    `/* Your theme's typefaces, self-hosted by next/font. Put their variables on`,
    ` * <html> in app/layout.tsx, and the theme (lib/theme.ts) finds them:`,
    ` *`,
    ` *   import { fontVariables } from '@/lib/fonts'`,
    ` *   <html lang="en" className={fontVariables}>`,
    ` *`,
    ` * Not on Next.js? Skip this file and load them in your global CSS instead:`,
    ` *   ${fontsImport(theme)} */`,
    '',
    ...fonts.map(nextFontCall),
    '',
    `export const fontVariables = [${fonts.map((f) => `${camel(f.id)}.variable`).join(', ')}].join(' ')`,
    '',
  ].join('\n')
}

/** The theme's web fonts as a stylesheet @import (Google Fonts), for apps without next/font. Null when it names none. */
export function fontsImport(theme: ThemeInput): string | null {
  const fonts = exportedFonts(theme)
  return fonts.length ? `@import url('${googleFontsHref(fonts)}');` : null
}

/** A theme's fields that differ from the defaults (Basalt's), in contract order: what its source needs to say. Colours are always said, the chart included (an exported theme with an accent and no chart would draw its charts from the accent, not Basalt's). Groups (fonts, stroke, titles, labels) say only their keys that differ, and a typeface that has to be loaded (Inter) says so even when it is the default. */
export function themeFields(theme: ThemeInput): [string, unknown][] {
  const defaults = DEFAULTS as Record<string, unknown>
  const out: [string, unknown][] = []
  for (const [key, value] of Object.entries(theme)) {
    // The palette and style a theme was composed from, and the look its style names, are Create's own choices, not fields to export.
    if (value === undefined || key === 'description' || key === 'palette' || key === 'style' || key === 'look') continue
    const base = defaults[key]
    // The label voice is one piece: leaving out its tracking is not the same as the default's.
    if (key !== 'neutral' && key !== 'labels' && key !== 'chart' && typeof value === 'object' && value !== null && typeof base === 'object' && base !== null) {
      const needsLoading = (v: unknown) => key === 'fonts' && typeof v === 'string' && Boolean(fontOf(v)) && loadable(fontOf(v)!)
      const changed = Object.entries(value as Record<string, unknown>).filter(([k, v]) => v !== undefined && (needsLoading(v) || !same(v, (base as Record<string, unknown>)[k])))
      if (changed.length) out.push([key, Object.fromEntries(changed)])
    } else if (key === 'chart' || !(key in defaults) || !same(value, base)) out.push([key, value])
  }
  return out
}

/** The style as a JSX attribute: ` look="bezel"`, or nothing for classic (the default, which a root provider writes itself). */
const lookAttribute = (style: YoujLook) => (style === DEFAULT_LOOK ? '' : ` look="${style}"`)

/**
 * The root provider's opening tag: the theme, the size when it isn't the standard one the provider has already
 * (roomy at 100%), and the style when it isn't the default: `<YoujProvider theme={theme} density="compact" scaling="90%" look="bezel">`.
 */
export function providerTag(style: YoujLook = DEFAULT_LOOK, size: SizeConfig = DEFAULT_SIZE): string {
  const density = size.density === DEFAULT_SIZE.density ? '' : ` density="${size.density}"`
  const scaling = size.scaling === DEFAULT_SIZE.scaling ? '' : ` scaling="${size.scaling}"`
  return `<YoujProvider theme={theme}${density}${scaling}${lookAttribute(style)}>`
}

/**
 * `theme` as `defineTheme` source, imported the way the app has Youj: the
 * package, or the copied core. The style isn't part of the theme (any theme
 * pairs with any style), so it's in the note on applying it.
 */
export function themeSource(theme: ThemeInput, mode: InstallMode = 'package', style: YoujLook = DEFAULT_LOOK, size: SizeConfig = DEFAULT_SIZE): string {
  const from = mode === 'package' ? '@youj/core' : '@/lib/youj/theme'
  const fields = exportFields(theme).map(([k, v]) => `  ${k}: ${literal(v)},`)
  const fonts = exportedFonts(theme).length > 0
  const styled = style !== DEFAULT_LOOK
  return [
    `import { defineTheme } from '${from}'`,
    '',
    `export const theme = defineTheme({`,
    ...fields,
    `})`,
    '',
    `// The whole app: ${providerTag(style, size)} (${styled ? `the ${style} style` : `in ${style}, the default style`}), or <html {...themeProps(theme)} data-yj-look="${style}"> to render it on the server.`,
    `// Part of a page: <ThemeScope theme={theme}${lookAttribute(style)}>.`,
    ...(fonts ? [`// Its typefaces load in lib/fonts.ts (next/font), or from the stylesheet @import noted there.`] : []),
    '',
  ].join('\n')
}

/* ── Installing it ────────────────────────────────────────────────────── */

/** The frame's items, and the style's recipes when it has any (`youj-look-bezel`; the package's stylesheet has them already). */
export function createItems(config: FrameConfig, style: YoujLook = DEFAULT_LOOK): string[] {
  const item = lookItem(style)
  return item ? [...frameItems(config), item] : frameItems(config)
}

export function youjAddCommand(config: FrameConfig, style: YoujLook = DEFAULT_LOOK): string {
  return `npx youj add ${createItems(config, style).join(' ')}`
}

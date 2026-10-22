import { dirname, resolve } from 'node:path'
import { importSpecifier, setupViteAlias } from './alias'
// Create's link format and the code it exports: the docs page's own modules
// (plain TypeScript), imported by path like entries.json in add.ts so the
// build inlines them and the CLI reads a link exactly as the page writes it.
import { homeHref, themeSource } from '../../ui/src/docs/create/codegen'
import { DEFAULT_FRAME, frameItems, frameScreens, readFrame, SCREENS, unknownChoices, type FrameConfig } from '../../ui/src/docs/create/config'
import { frameFiles, navIconItems } from '../../ui/src/docs/create/frame-files'
import { LAYOUT_PARAM, readSize, SCALE_PARAM, type SizeConfig } from '../../ui/src/docs/create/size-url'
import { readLook, LOOK_PARAM } from '../../ui/src/docs/create/look-url'
import { FIELDS, readTheme } from '../../ui/src/docs/create/theme-url'
import { themeErrors } from '../../core/src/lib/youj/theme/check'
import { DEFAULT_PRESET, themes } from '../../core/src/lib/youj/theme/themes'
import { add, addPlan, planCommands } from './add'
import { addTagAttributes, pointAtTheme } from './codemods'
import { MODES, PACKAGES, REGISTRY_NAMESPACE, THEMES, type Mode } from './constants'
import { allDeps, detectEntry, detectFramework, detectPackageManager, type Entry, type Framework, type PackageJson } from './detect'
import { FONTSOURCE_RANGE, fontsourcePackages, loadFonts } from './fonts'
import { init, mergeChanges } from './init'
import { importFontsource } from './init-edits'
import { Project, type Change } from './project'
import { format, installCommand, type Command, type Runner } from './run'
import { applyLook, registryLookItem, lookStylesheetPath, lookToApply } from './look'
import { CliError, type Ui } from './ui'

/** create-next-app's own home page, untouched: the frame's root route replaces it. */
const isBoilerplate = (source: string) => /next\.svg/.test(source) && /from ["']next\/image["']/.test(source)

export const CREATE_URL = 'https://www.youj.dev/create'

/** The parameters Create writes: the frame's (with an older link's pages), the theme's, the component look and the size. */
const PARAMS = new Set([...Object.keys(DEFAULT_FRAME), 'page', 'pages', 'preset', 'name', LOOK_PARAM, LAYOUT_PARAM, SCALE_PARAM, ...FIELDS.flatMap((f) => [f.param, ...(f.legacy ? [f.legacy] : [])])])

/**
 * Sets the root provider's `density` and `scaling` to `size`: an attribute it
 * has takes the new value, one it lacks is added. Null without a
 * <YoujProvider>, or when its size is an expression, which the caller leaves
 * to a manual step.
 */
export function sizeProvider(source: string, size: SizeConfig): string | null {
  let out: string | null = source
  for (const [name, value] of [
    ['density', size.density],
    ['scaling', size.scaling],
  ] as const) {
    const opening: string | undefined = out.match(/<YoujProvider\b[^>]*>/)?.[0]
    if (!opening) return null
    const attribute = new RegExp(`\\s${name}=("[^"]*"|'[^']*'|\\{[^}]*\\})`)
    const current: RegExpMatchArray | null = opening.match(attribute)
    if (current && !/^["']/.test(current[1]!)) return null
    out = current ? out.replace(opening, opening.replace(attribute, ` ${name}="${value}"`)) : addTagAttributes(out, 'YoujProvider', `${name}="${value}"`, attribute)
    if (out === null) return null
  }
  return out
}

/** A Create link's parameters, from the whole link (…/create?…) or its query string alone. Null for anything else. */
export function createParams(link: string): URLSearchParams | null {
  const text = link.trim().replace(/#.*$/, '')
  const q = text.indexOf('?')
  const [path, query] = q >= 0 ? [text.slice(0, q), text.slice(q + 1)] : text.includes('=') ? ['', text] : [text, '']
  if (path && !/(^|\/)create\/?$/.test(path)) return null
  const params = new URLSearchParams(query)
  return path || [...params.keys()].some((key) => PARAMS.has(key)) ? params : null
}

/**
 * How Youj is set up here, by doctor's signs: the @youj registry in
 * components.json or a copied core means the registry, a Youj package
 * the package, neither not at all. The namespace wins, as in init and add.
 */
function setupMode(project: Project): Mode | null {
  if (project.json<{ registries?: Record<string, string> }>('components.json')?.registries?.[REGISTRY_NAMESPACE]) return 'registry'
  const deps = allDeps(project.json<PackageJson>('package.json'))
  if (Object.values(PACKAGES).some((name) => deps[name])) return 'package'
  return project.walk('.', (n) => n === 'youj.css').some((f) => f.endsWith('styles/youj.css')) ? 'registry' : null
}

export interface CreateOptions {
  cwd: string
  /** The link from Create, or its query string. */
  link: string
  /** How to set Youj up, in an app that doesn't have it yet. */
  mode?: Mode
  /** Replace a theme or shell file that's already there. */
  overwrite?: boolean
  /** Print the plan; write and run nothing. */
  dryRun?: boolean
  /** Write a theme that misses WCAG AA anyway, marked `allowLowContrast`. */
  allowLowContrast?: boolean
}

export interface CreateResult {
  mode: Mode
  changes: Change[]
  commands: Command[]
  /** Steps the CLI couldn't do safely, for the user to finish by hand. */
  manual: string[]
  /** How to put the shell (and the screens) to use. */
  next: string
}

/**
 * `youj create <link>`: the app a Create link describes. Sets Youj
 * up if it isn't (init, with the theme's preset and motion, and the link's
 * component look), writes the theme to lib/theme.ts and points the provider
 * at it, gives the app the link's look (classic, the default, unless the app
 * names its own; on the registry the look's stylesheet is copied in and
 * imported after ui.css), loads its typefaces
 * (next/font in lib/fonts.ts on the App Router, a stylesheet @import
 * elsewhere), adds the frame's blocks and its screens, and writes the shell
 * that composes them to components/app-shell.tsx and its nav to lib/nav.ts.
 * On the App Router each screen becomes a route, app/(app)/<screen>/page.tsx,
 * whose layout wraps it in the shell. A file that's already there stays; the
 * same link twice changes nothing.
 */
export async function create(options: CreateOptions, runner: Runner, ui: Ui, env: NodeJS.ProcessEnv = process.env): Promise<CreateResult> {
  const link = options.link.trim()
  const params = createParams(link)
  if (!params)
    throw new CliError(`${link ? `"${link}" isn't a link from Create.` : 'Pass the link from Create.'} Copy it from ${CREATE_URL}, in quotes: npx @youj/cli create '${CREATE_URL}?sidebar=rail&…'`)
  if (options.mode && !MODES.includes(options.mode)) throw new CliError(`--mode takes ${MODES.join(', ')}; got "${options.mode}".`)
  const frame = readFrame(params)
  // A typo in a link makes a different app than the one meant, and the reader ignores it silently: say so.
  const preset = params.get('preset')
  const unknown = [...unknownChoices(params), ...(preset && !themes.some((t) => t.id === preset) ? [`preset=${preset}`] : [])]
  if (unknown.length) ui.warn(`Not something Create offers, so the default is used: ${unknown.join(', ')}.${preset && unknown.includes(`preset=${preset}`) ? ` Presets: ${themes.map((t) => t.id).join(', ')}.` : ''}`)
  if (params.has('theme')) ui.warn('Create links name the theme as preset=, not theme=: ignored.')
  const look = readLook(params)
  const size = readSize(params)
  let theme = readTheme(params)
  // A theme that misses WCAG AA isn't written unless the user accepts it, and then it says so in the code.
  const errors = themeErrors(theme)
  const contrast = errors.filter((e) => e.code === 'contrast')
  if (errors.length > contrast.length || (contrast.length && !options.allowLowContrast)) {
    const list = errors.map((e) => `  - ${e.message}`).join('\n')
    throw new CliError(
      errors.length > contrast.length
        ? `This link's theme can't be applied as written:\n${list}\nFix it in Create: ${CREATE_URL}`
        : `This link's theme misses WCAG AA contrast (text 4.5:1, control boundaries 3:1):\n${list}\nFix it in Create, or pass --allow-low-contrast to write it anyway.`,
    )
  }
  if (contrast.length) {
    ui.warn(`--allow-low-contrast: writing a theme with ${contrast.length} pair(s) below WCAG AA. Text and controls drawn in them fail WCAG 2 AA (1.4.3, 1.4.11); the theme is marked allowLowContrast.`)
    theme = { ...theme, allowLowContrast: true }
  }
  const root = resolve(options.cwd)
  const commands: Command[] = []
  const manual: string[] = []

  // 1. Youj itself
  let mode = setupMode(new Project(root))
  // A fresh setup gets the look from init; an app that has Youj gets it below.
  const fresh = !mode
  const initial: Change[] = []
  if (!mode) {
    const preset = THEMES.find((t) => t === params.get('preset')) ?? DEFAULT_PRESET
    // The link's theme brings its own typefaces below, so init loads none.
    const setup = await init({ cwd: root, yes: true, mode: options.mode, theme: preset, motion: theme.motionPersonality ?? 'precise', look, fonts: false, dryRun: options.dryRun }, runner, ui, env)
    mode = setup.mode
    commands.push(...setup.commands)
    manual.push(...setup.manual)
    initial.push(...setup.changes)
  } else {
    ui.info(`Youj is set up here from the ${mode}.`)
    if (options.mode && options.mode !== mode) ui.warn(`--mode ${options.mode} is for an app without Youj; this one keeps the ${mode}.`)
  }
  // On a dry run init wrote nothing: start from its edits, so the provider it adds is there to point at the theme.
  const project = new Project(root)
  for (const change of initial) project.write(change.path, change.after)

  const base = project.exists('src') ? 'src/' : ''
  const themeFile = `${base}lib/theme.ts`
  const shellFile = `${base}components/app-shell.tsx`
  const place = (path: string, content: string) => {
    const current = project.read(path)
    if (current === null || options.overwrite) project.write(path, content)
    else if (current !== content) manual.push(`${path} is already there and differs from this link's, so it's unchanged. Pass --overwrite to replace it.`)
  }

  // 2. The theme, and the provider pointed at it (unless lib/theme.ts is some other file of the app's)
  place(themeFile, themeSource(theme, mode, look, size))
  const framework = detectFramework(project)
  const entry = framework && detectEntry(project, framework)
  if (/export const theme\b/.test(project.read(themeFile) ?? '')) {
    const files = [...new Set([entry?.root, entry?.document])].filter((f): f is string => Boolean(f && /\.[jt]sx?$/.test(f) && /<YoujProvider\b|\bthemeProps\(/.test(project.read(f) ?? '')))
    if (!files.length)
      manual.push(
        framework === 'astro'
          ? `Astro renders no React root: give your islands the theme with <YoujProvider theme={theme}>, importing theme from ${themeFile}.`
          : `Couldn't find YoujProvider: wrap your app in <YoujProvider theme={theme}>, importing theme from ${themeFile}.`,
      )
    for (const file of files) {
      const from = importSpecifier(project, file, themeFile).replace(/\.ts$/, '')
      const edited = pointAtTheme(project.read(file)!, from)
      if (edited === null) manual.push(`Point ${file} at Create's theme by hand: import { theme } from '${from}', then theme={theme} on YoujProvider (and themeProps(theme), where it has that).`)
      else project.write(file, edited)
    }
  }

  // The size, on the provider: only when the link names one (init leaves the provider's own, standard size, and an app that set its own keeps it).
  if (params.has(LAYOUT_PARAM) || params.has(SCALE_PARAM)) {
    const providers = [...new Set([entry?.root, entry?.document])].filter((f): f is string => Boolean(f && /\.[jt]sx?$/.test(f) && /<YoujProvider\b/.test(project.read(f) ?? '')))
    const attributes = `density="${size.density}" scaling="${size.scaling}"`
    if (!providers.length) manual.push(`Give your YoujProvider this link's size: ${attributes}.`)
    for (const file of providers) {
      const edited = sizeProvider(project.read(file)!, size)
      if (edited === null) manual.push(`Set ${attributes} on YoujProvider in ${file} by hand.`)
      else project.write(file, edited)
    }
  }

  // 3. The theme's typefaces: next/font on the App Router, the Google Fonts stylesheet anywhere else, and @fontsource for the kit's own (Inter, JetBrains Mono), as init loads a preset's.
  loadFonts(project, framework, entry, themeFile, theme, place, manual)
  const fontPackages = fontsourcePackages(theme)
  importFontsource(project, entry, fontPackages, manual)

  // The component look, on the provider and <html>; on the registry, its stylesheet after ui.css.
  // A default (classic) link leaves a look the app names as it is.
  const applied = fresh ? look : lookToApply(project, entry, look, manual)
  if (!fresh && applied) applyLook(project, framework, entry, applied, mode, manual)

  // 4. The frame's blocks and its screens, through add (so YOUJ_REGISTRY_URL and the namespace apply); ones already there stay.
  // Vite: the blocks import through `@/`, which its split tsconfig and its bundler both need to know.
  if (framework === 'vite') setupViteAlias(project, manual)
  // Edits go to disk first: shadcn may edit the layout too (fonts).
  if (!options.dryRun) project.commit()
  const fonts = fontPackages.filter((name) => !allDeps(project.json<PackageJson>('package.json'))[name])
  if (fonts.length) {
    const install = installCommand(detectPackageManager(root, env), fonts.map((name) => `${name}@${FONTSOURCE_RANGE}`))
    commands.push(install)
    if (!options.dryRun) await ui.task(`Installing the theme's fonts (${format(install)})`, `Installed ${fonts.join(', ')}`, () => runner(install, root))
  }
  // The look's stylesheet, copied from the registry (init copied it for a fresh setup).
  const lookItem = applied && registryLookItem(applied, mode)
  if (applied && lookItem && !fresh && !project.exists(lookStylesheetPath(project, applied)!)) {
    const plan = options.dryRun ? addPlan(root, [lookItem], [], env, project) : await add(root, [lookItem], [], runner, ui, env)
    commands.push(...planCommands(plan))
  }
  const createLink = params.size ? `${CREATE_URL}?${params}` : CREATE_URL
  // The screens are routes with a nav of links on Next.js's App Router; elsewhere their blocks are there to render with the app's own router.
  const next = framework === 'next-app'
  const icons = mode === 'registry' ? navIconItems(frame) : []
  const installed = (item: string) => (item.startsWith('icon-') ? `${base}components/youj/icons/${item.replace(/^icon-/, '')}.tsx` : SCREENS[item] ? `${base}${SCREENS[item].file}.tsx` : `${base}blocks/${item.replace(/^frame-/, 'frame/')}.tsx`)
  const missing = [...frameItems(frame), ...icons].filter((item) => !project.exists(installed(item)))
  if (missing.length) {
    const plan = options.dryRun ? addPlan(root, missing, [], env, project, mode) : await add(root, missing, [], runner, ui, env)
    commands.push(...planCommands(plan))
  }

  // 5. The shell, linking back to the frame in Create, its nav, and the screens as routes where the framework has them
  const app = dirname(entry?.root ?? 'app/layout.tsx')
  const files = next ? frameFiles(frame, createLink, mode) : frameFiles(frame, createLink, mode, { router: false }).filter((f) => !f.path.startsWith('app/'))
  for (const file of files) {
    const path = file.path === 'components/app-shell.tsx' ? shellFile : file.path.startsWith('app/') ? `${app}/${file.path.slice(4)}` : `${base}${file.path}`
    // The root route redirects to the home screen: create-next-app's own home page makes way for it; any other stays, and says so.
    if (file.path === 'app/page.tsx' && isBoilerplate(project.read(path) ?? '')) project.write(path, file.code)
    else place(path, file.code)
  }
  const route = next ? homeHref(frame) : null

  if (!options.dryRun) project.commit()
  return { mode, changes: mergeChanges(options.dryRun ? project.pending : [...initial, ...project.committed]), commands, manual, next: nextStep(framework, entry, shellFile, frame, route) }
}

function nextStep(framework: Framework | null, entry: Entry | null, shell: string, frame: FrameConfig, route: string | null): string {
  const routes = frameScreens(frame).length
  if (framework === 'next-app' && route && routes > 1)
    return `Open ${route}: ${routes} screens are routes in ${dirname(entry?.root ?? 'app/layout.tsx')}/(app), the sidebar links to them from lib/nav.ts, and / redirects to the first. The layout wraps them in <AppShell> (${shell}); move your other pages into (app) to give them the frame too, and add an item to lib/nav.ts for each.`
  const wrap = `Wrap your pages in <AppShell> (${shell})`
  // Off the App Router the screens are blocks to route yourself.
  const screens = route ? [] : frameScreens(frame)
  const render = screens.length ? `\n\nRender each screen at its href in lib/nav.ts with your router: ${screens.map((s) => `<${s.component} /> from ${s.file}`).join(', ')}.` : ''
  return steps(framework, entry, shell, wrap, route) + render
}

function steps(framework: Framework | null, entry: Entry | null, shell: string, wrap: string, route: string | null): string {
  switch (framework) {
    case 'next-app':
      if (route) return `Open ${route}: ${dirname(entry?.root ?? 'app/layout.tsx')}/(app)/layout.tsx wraps its pages in <AppShell> (${shell}). Move your other pages into (app) to give them the frame too.`
      return `${wrap}, e.g. in a route group's layout, ${dirname(entry?.root ?? 'app/layout.tsx')}/(app)/layout.tsx:

import { AppShell } from '@/components/app-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}`
    case 'next-pages':
      return `${wrap} in ${entry?.root ?? 'pages/_app.tsx'}: <AppShell><Component {...pageProps} /></AppShell>`
    case 'vite':
      return `${wrap} in ${entry?.root ?? 'src/main.tsx'}: <AppShell><App /></AppShell>`
    case 'react-router':
      return `${wrap} in a layout route: <AppShell><Outlet /></AppShell>`
    case 'astro':
      return `${wrap} in a layout, as an island: <AppShell client:load><slot /></AppShell>`
    default:
      return `${wrap}.`
  }
}

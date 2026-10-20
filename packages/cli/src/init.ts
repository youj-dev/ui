import { resolve } from 'node:path'
import { aliasProblems, setupViteAlias } from './alias'
import {
  addCssImports,
  dropShadcnLeftovers,
  dropStarterFont,
  dropStarterTheme,
  dropStarterTokens,
  isViteStarterCss,
  readsShadcnVars,
  shadcnColorsIn,
} from './codemods'
import {
  allDeps,
  detectEntry,
  detectFramework,
  detectPackageManager,
  detectStylesheet,
  detectTailwind,
  FRAMEWORK_NAMES,
  tailwindWiring,
  unsupportedReact,
  versionOrRange,
  type Framework,
  type PackageJson,
  type PackageManager,
} from './detect'
import {
  MODES,
  BASE_UI_INSTALL,
  MOTION_INSTALL,
  MOTIONS,
  packageStyles,
  PACKAGES,
  PRESET_MOTION,
  QUALITIES,
  REGISTRY_NAMESPACE,
  THEME_HINTS,
  themeSheetItem,
  THEMES,
  VERSION,
  type Mode,
  type Motion,
  type Quality,
  type ThemeId,
} from './constants'
import { isStockUtils, isYoujSource } from './collisions'
import { describeUtils, otherOutput, rollback, settle, snapshot, type CopyOutcome } from './copy'
import { aliasBase } from './copy-in'
import { FONTSOURCE_RANGE, fontsourcePackages, presetFonts, presetWebFonts } from './fonts'
import { importPath, Project, type Change } from './project'
import { localRegistry, needsLocalRegistry } from './registry'
import { dlxCommand, format, installCommand, SHADCN, type Command, type Runner } from './run'
import { applyLook, DEFAULT_LOOK, registryLookItem, LOOKS, lookStylesheetPath, lookToApply, type YoujLook } from './look'
import { looks } from '../../core/src/lib/youj/look'
import { DEFAULT_PRESET, presetById } from '../../core/src/lib/youj/theme/themes'
import { CliError, type Ui } from './ui'
import { addProvider, themeScript, hydrationSafeHtml, importFontsource, importStylesheet, setupTailwind, writeComponentsJson, type Choices } from './init-edits'
import { findRegistryFiles, registryFiles, usesThemeAttributes } from './init-files'

export interface InitOptions {
  cwd: string
  yes?: boolean
  mode?: Mode
  theme?: ThemeId
  motion?: Motion
  quality?: Quality
  /** The component look: how components are built (classic, the default, or bezel). */
  look?: YoujLook
  /** Load the preset's web fonts (Basalt's Inter and JetBrains Mono). Default true; create loads its own theme's instead. */
  fonts?: boolean
  /** Print the plan; write and install nothing. */
  dryRun?: boolean
}

export interface InitResult {
  framework: Framework
  packageManager: PackageManager
  mode: Mode
  changes: Change[]
  commands: Command[]
  /** Steps the codemods couldn't do, for the user to finish by hand. */
  manual: string[]
  /** The app's own components/ui files that aren't Youj's (a shadcn app's), by name: they stay until replaced. */
  shadcn: string[]
}

export async function init(options: InitOptions, runner: Runner, ui: Ui, env: NodeJS.ProcessEnv = process.env): Promise<InitResult> {
  const project = new Project(resolve(options.cwd))
  const pkg = project.json<PackageJson>('package.json')
  if (!pkg) throw new CliError(`No package.json in ${project.root}. Run this in your app's folder (or pass --cwd).`)
  const framework = detectFramework(project)
  if (!framework)
    throw new CliError('Couldn’t tell which framework this app uses. Youj’s CLI sets up Next.js, Vite + React, React Router v7 and Astro + React; for anything else, follow the Manual steps on the Installation page.')
  const pm = detectPackageManager(project.root, env)
  const tailwind = detectTailwind(project)
  const react = versionOrRange(project, 'react')
  const reactProblem = react && unsupportedReact(react)
  if (reactProblem) throw new CliError(`${reactProblem}. Upgrade React first.`)
  if (framework === 'astro' && !allDeps(pkg)['@astrojs/react']) throw new CliError('This Astro app has no React integration yet. Add it first: npx astro add react')

  ui.info(`${FRAMEWORK_NAMES[framework]} · ${pm} · ${tailwind === 'v4' ? 'Tailwind v4' : tailwind === 'v3' ? 'Tailwind v3 (Youj needs v4)' : 'no Tailwind yet'}`)

  const choices = await choose(project, options, ui)
  const { mode } = choices
  const entry = detectEntry(project, framework)
  const commands: Command[] = []
  const manual: string[] = []
  // The look to set up: the one chosen, unless the default would take the app's own away.
  const look = lookToApply(project, entry, choices.look, manual)
  const exec = async (command: Command, message: string, done: string, inherit = false) => {
    commands.push(command)
    if (options.dryRun) return
    if (inherit) {
      ui.info(`${message}\n${format(command)}`)
      await runner(command, project.root, { inherit })
    } else await ui.task(`${message} (${format(command)})`, done, () => runner(command, project.root))
  }

  // 1. Tailwind v4
  const devInstalls: string[] = []
  if (tailwind === 'v3') {
    const upgrade = dlxCommand(pm, '@tailwindcss/upgrade@latest', [])
    if (options.yes || !(await ui.confirm('Youj needs Tailwind CSS v4. Run the official upgrade tool now? It rewrites your config and classes, so commit first.', true)))
      throw new CliError(`Youj needs Tailwind CSS v4. Upgrade with \`${format(upgrade)}\` (commit first), then run init again.`)
    await exec(upgrade, 'Upgrading Tailwind CSS', 'Upgraded Tailwind CSS', true)
  } else if (tailwind === 'missing') {
    if (!options.yes && !(await ui.confirm('Tailwind CSS v4 isn’t installed. Install and configure it?', true)))
      throw new CliError('Youj needs Tailwind CSS v4. Install it (tailwindcss.com/docs/installation), then run init again.')
    devInstalls.push(...setupTailwind(project, framework, manual))
  } else if (tailwindWiring(project, framework).wired === false) {
    // Installed (npm installs it as a peer of @youj/react) but not in the build: nothing would compile Youj's classes.
    if (!options.yes && !(await ui.confirm(`Tailwind CSS v4 is installed but not set up in ${FRAMEWORK_NAMES[framework]}'s build. Set it up?`, true)))
      throw new CliError('Youj needs Tailwind CSS v4 in the build. Set it up (tailwindcss.com/docs/installation), then run init again.')
    const listed = allDeps(pkg)
    devInstalls.push(...setupTailwind(project, framework, manual).filter((name) => !listed[name]))
  }

  // 2. The stylesheet exists, starts with Tailwind and is imported by the app
  // A shadcn app: its own (not Youj's) components in components/ui. The components.json registry mode writes doesn't make one.
  const shadcnApp = shadcnComponents(project).length > 0
  const sheet = detectStylesheet(project, framework, entry)
  if (framework === 'vite') await clearViteStarter(project, sheet.path, Boolean(options.yes), ui, manual)
  project.write(sheet.path, addCssImports(project.read(sheet.path) ?? '', []))
  if (!sheet.imported) importStylesheet(project, entry, sheet.path, manual)

  // 3. Where the packages come from, and the registry namespace
  const registry = env.YOUJ_NPM_REGISTRY?.trim()
  if (registry && mode === 'package') {
    const npmrc = project.read('.npmrc') ?? ''
    if (!/^@youj:registry=/m.test(npmrc)) project.write('.npmrc', `${npmrc}${npmrc && !npmrc.endsWith('\n') ? '\n' : ''}@youj:registry=${registry}\n`)
  }
  if (mode === 'registry') {
    writeComponentsJson(project, framework, sheet.path, entry, env, manual)
    // Copied items import through `@/`, as shadcn's do: Vite's split tsconfig and its bundler need it set up, others get told.
    if (framework === 'vite') setupViteAlias(project, manual)
    else for (const { message, fix } of aliasProblems(project, framework)) manual.push(`${message}. ${fix}`)
  }

  if (!options.dryRun) project.commit()

  // Youj's classes are roles. A shadcn app, or a stylesheet that still reads shadcn's variables (create-next-app's starter is dropped first), gets
  // the compat sheet that maps them: the package's in package mode, the youj-shadcn-compat item copied in on the registry.
  const starter = dropStarterTheme(dropStarterFont(dropStarterTokens(project.read(sheet.path)!)))
  const compat = shadcnApp || readsShadcnVars(starter)
  const compatSheet = mode === 'registry' ? registryFiles(project).uiCss.replace(/ui\.css$/, 'shadcn.css') : null

  // 4. Dependencies
  const deps = allDeps(pkg)
  if (devInstalls.length) await exec(installCommand(pm, devInstalls, true), 'Installing Tailwind CSS', 'Installed Tailwind CSS')
  if (mode === 'package') {
    const wanted = [
      [PACKAGES.react, `${PACKAGES.react}@^${VERSION}`],
      [PACKAGES.core, `${PACKAGES.core}@^${VERSION}`],
      [PACKAGES.motion, `${PACKAGES.motion}@^${VERSION}`],
      [PACKAGES.icons, `${PACKAGES.icons}@^${VERSION}`],
      ['motion', `motion@${MOTION_INSTALL}`],
      ['@base-ui/react', `@base-ui/react@${BASE_UI_INSTALL}`],
    ].filter(([name]) => !deps[name!])
    if (wanted.length) await exec(installCommand(pm, wanted.map(([, spec]) => spec!)), 'Installing Youj', `Installed ${wanted.map(([n]) => n).join(', ')}`)
  } else {
    // The core, unless all of it is copied already, and the look's stylesheet, unless it's there.
    const lookItem = look && registryLookItem(look, mode)
    const styleSheet = look && lookItem ? lookStylesheetPath(project, look) : null
    const copyCompat = compat && compatSheet && !project.exists(compatSheet)
    // The chosen preset's stylesheet, where the theme is an <html> attribute: the core holds Basalt's and Graphite's, an item each the others'.
    const themeItem = usesThemeAttributes(framework) ? themeSheetItem(choices.theme) : undefined
    const themeSheet = registryFiles(project).preset(choices.theme)
    const copyTheme = themeItem && !project.exists(themeSheet)
    const items = [
      ...(coreMissing(project).length ? ['youj-core', 'youj-ui-core'] : []),
      ...(lookItem && styleSheet && !project.exists(styleSheet) ? [lookItem] : []),
      ...(copyCompat ? ['youj-shadcn-compat'] : []),
      ...(copyTheme ? [themeItem] : []),
    ]
    const sheets = [...(lookItem && styleSheet ? [styleSheet] : []), ...(copyCompat ? [compatSheet] : []), ...(copyTheme ? [themeSheet] : [])]
    if (items.length) await copyCore(project, pm, items, sheets, Boolean(options.dryRun), commands, runner, ui, env)
  }

  // 5. Styles and provider
  const files = mode === 'registry' ? registryFiles(project) : null
  const specs =
    mode === 'package'
      ? [...packageStyles({ ...deps, [PACKAGES.react]: VERSION, [PACKAGES.core]: VERSION, [PACKAGES.icons]: VERSION }), ...(compat ? [`${PACKAGES.react}/shadcn.css`] : [])]
      : [
          files!.youjCss,
          files!.uiCss,
          ...(compat && compatSheet ? [compatSheet] : []),
          ...(usesThemeAttributes(framework) && choices.theme !== 'graphite' ? [files!.preset(choices.theme)] : []),
        ].map((f) => importPath(sheet.path, f))
  const css = await dropLeftovers(sheet.path, addCssImports(starter, specs), Boolean(options.yes), ui, manual)
  project.write(sheet.path, css)
  const overrides = compat ? shadcnColorsIn(css) : []
  if (overrides.length)
    manual.push(`${sheet.path} sets ${overrides.join(', ')}: ${compatSheet ?? `${PACKAGES.react}/shadcn.css`} maps these shadcn names onto Youj's roles, and yours override it in every theme. Remove them, and bring a brand colour over as a theme instead (see Theming).`)
  addProvider(project, framework, entry, choices, files, manual)
  // The preset's web fonts, once: next/font on the App Router, the Google Fonts stylesheet elsewhere,
  // and @fontsource for the kit's own faces (Inter, JetBrains Mono), which neither registers under the name the stacks ask for.
  const preset = presetById(choices.theme)
  const fontPackages = options.fonts === false ? [] : fontsourcePackages(preset)
  if (options.fonts !== false) {
    presetWebFonts(project, framework, entry, presetFonts(preset), deps.next, manual)
    importFontsource(project, entry, fontPackages, manual)
  }
  themeScript(project, framework, entry, mode, deps, manual)
  if (look) applyLook(project, framework, entry, look, mode, manual)
  hydrationSafeHtml(project, framework, entry)

  const staged = project.pending
  if (!options.dryRun) project.commit()
  const fonts = fontPackages.filter((name) => !deps[name])
  if (fonts.length) await exec(installCommand(pm, fonts.map((name) => `${name}@${FONTSOURCE_RANGE}`)), `Installing the preset's fonts`, `Installed ${fonts.join(', ')}`)
  const changes = options.dryRun ? staged : project.committed
  return { framework, packageManager: pm, mode, changes: mergeChanges(changes), commands, manual, shadcn: shadcnComponents(project) }
}

/** The files of the core, as findRegistryFiles names them, that aren't in the app yet. */
function coreMissing(project: Project): string[] {
  const found = findRegistryFiles(project)
  return (['youjCss', 'uiCss', 'provider'] as const).filter((key) => !found[key]).map((key) => ({ youjCss: 'styles/youj.css', uiCss: 'styles/ui.css', provider: 'lib/youj/provider.tsx' })[key])
}

/**
 * Copies the core (and the look's stylesheet, and shadcn's compat sheet where it's wanted) in with shadcn, never letting it
 * ask: with --yes --overwrite, its output captured, then the files that were
 * there settled as `add` does (copy.ts), so shadcn's "utils.ts already exists.
 * Overwrite?" can't stop a run without a terminal halfway. lib/utils.ts is
 * merged (collisions.ts); any other file of the app's own in the core's way,
 * or a core file that didn't arrive, stops init with exit code 1 before the
 * stylesheet or the layout points at anything.
 */
async function copyCore(project: Project, pm: PackageManager, items: string[], sheets: string[], dryRun: boolean, commands: Command[], runner: Runner, ui: Ui, env: NodeJS.ProcessEnv) {
  const add = dlxCommand(pm, SHADCN, ['add', ...items.map((item) => `${REGISTRY_NAMESPACE}/${item}`), '--yes', '--overwrite'])
  const named = items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0]!
  const utils = `${aliasBase(project)}lib/utils.ts`
  const theirs = items.includes('youj-ui-core') ? project.read(utils) : null
  if (theirs !== null && !isYoujSource(theirs))
    ui.info(
      isStockUtils(theirs)
        ? `${utils} is shadcn's: Youj's replaces it (its cn does the same, and knows Youj's tokens).`
        : `${utils} has helpers of your own: they move to ${utils.replace(/\.ts$/, '.local.ts')}, and Youj's utils.ts (cn and its helpers) re-exports them, so your imports keep working.`,
    )
  commands.push(add)
  if (dryRun) return
  // A registry of your own, or a private one: shadcn copies from local copies of the items (registry.ts).
  const local = needsLocalRegistry(env) ? await ui.task('Fetching the core from the registry', 'Fetched', () => localRegistry(items, env)) : undefined
  let output = ''
  let outcome: CopyOutcome
  try {
    const copy = local ? { ...add, args: add.args.map((arg) => (arg.startsWith(`${REGISTRY_NAMESPACE}/`) ? (local.path(arg) ?? arg) : arg)) } : add
    const before = snapshot(project)
    try {
      output = String((await ui.task(`Copying ${named} into the app (${format(copy)})`, items.includes('youj-core') ? 'Copied the core' : `Copied ${named}`, () => runner(copy, project.root, { capture: true }))) ?? '')
    } catch (failure) {
      // Undo what shadcn wrote before it failed: the app's files as they were, nothing half there.
      rollback(project, before)
      throw new CliError(`Copying the core failed, so init stopped before pointing your stylesheet and layout at it:\n${failure instanceof Error ? failure.message : String(failure)}\nFix that, then run npx @youj/cli init --mode registry again.`)
    }
    outcome = settle(project, before, false)
  } finally {
    await local?.dispose()
  }
  if (outcome.utils) ui.info(describeUtils(outcome.utils))
  const missing = [...(items.includes('youj-core') ? coreMissing(project) : []), ...sheets.filter((path) => !project.exists(path))]
  const said = otherOutput(output)
  if (outcome.conflicts.length)
    throw new CliError(
      `Files of your own are where Youj's core goes, so init stopped before pointing your stylesheet and layout at it:\n${outcome.conflicts.map((f) => `  ${f}`).join('\n')}\nMove or rename them, then run npx @youj/cli init --mode registry again. (components.json and the @/ alias are set up already.)`,
    )
  if (missing.length)
    throw new CliError(
      `The core didn't copy completely (missing: ${missing.join(', ')}), so init stopped before pointing your stylesheet and layout at it.${said.length ? `\nshadcn said:\n${said.map((l) => `  ${l}`).join('\n')}` : ''}\nFix that, then run npx @youj/cli init --mode registry again. (components.json and the @/ alias are set up already.)`,
    )
}

/**
 * create-vite's starter styles (a centred, bordered #root, 56px headings,
 * colours of its own) restyle every component and block. Recognised exactly
 * (isViteStarterCss), they're cleared, after asking in a terminal; a
 * stylesheet that's been changed since is left, with a note.
 */
async function clearViteStarter(project: Project, sheet: string, yes: boolean, ui: Ui, manual: string[]) {
  const files = [sheet, 'src/App.css'].filter((f, i, all) => all.indexOf(f) === i && isViteStarterCss(project.read(f) ?? ''))
  if (!files.length) return
  const ask = `${files.join(' and ')} ${files.length === 1 ? 'is' : 'are'} create-vite's starter styles: a centred, bordered #root, 56px headings and colours of its own, which restyle every Youj component. Clear ${files.length === 1 ? 'it' : 'them'}? Your App.tsx keeps its markup.`
  if (!yes && !(await ui.confirm(ask, true))) {
    manual.push(`Clear create-vite's starter styles from ${files.join(' and ')}: they centre #root and restyle h1 and h2 over Youj's.`)
    return
  }
  for (const file of files) project.write(file, file === sheet ? '' : "/* create-vite's starter styles, cleared by youj init: they restyled every component. Your app's own styles go here. */\n")
}

/**
 * shadcn's leftovers in the stylesheet (codemods.ts, dropShadcnLeftovers):
 * removed, after showing the diff and asking in a terminal. With --yes they go,
 * and the diff is in the changes init prints.
 */
async function dropLeftovers(path: string, css: string, yes: boolean, ui: Ui, manual: string[]): Promise<string> {
  const { css: cleaned, removed } = dropShadcnLeftovers(css)
  if (!removed.length) return css
  const list = removed.map((r) => (r.names.length ? `${r.what} (${r.names.length > 3 ? `${r.names.slice(0, 3).join(', ')} and ${r.names.length - 3} more` : r.names.join(', ')})` : r.what)).join('; ')
  if (!yes) {
    ui.changes([{ path, before: css, after: cleaned }])
    if (!(await ui.confirm(`Remove shadcn's leftovers from ${path}? ${list}. Youj's stylesheet defines these, and shadcn's would win over it: dark: classes stop matching, bg-accent turns transparent and the palette splits.`, true))) {
      manual.push(`Remove shadcn's leftovers from ${path}: ${list}. Until then Youj's dark: classes, accent and palette are overridden.`)
      return css
    }
  }
  ui.info(`Removed shadcn's leftovers from ${path}: ${list}. Youj's stylesheet defines these; bring a brand colour over as a theme (see Theming).`)
  return cleaned
}

/** The app's components/ui files that aren't Youj's (shadcn's, typically), by name. */
export function shadcnComponents(project: Project): string[] {
  if (!project.exists('components.json')) return []
  return project
    .walk(`${aliasBase(project)}components/ui`, (n) => /\.[jt]sx$/.test(n), 0)
    .filter((f) => !isYoujSource(project.read(f) ?? ''))
    .map((f) => f.slice(f.lastIndexOf('/') + 1).replace(/\.[jt]sx$/, ''))
}

async function choose(project: Project, options: InitOptions, ui: Ui): Promise<Choices> {
  const existing: Mode = project.json<{ registries?: Record<string, string> }>('components.json')?.registries?.[REGISTRY_NAMESPACE] ? 'registry' : 'package'
  const ask = <T extends string>(given: T | undefined, fallback: T, prompt: () => Promise<T>) => (given ? Promise.resolve(given) : options.yes ? Promise.resolve(fallback) : prompt())
  const mode = await ask(options.mode, existing, () =>
    ui.select(
      'How do you want Youj?',
      [
        { value: 'package', label: 'Package', hint: '@youj/react; update with a version bump' },
        { value: 'registry', label: 'Source (registry)', hint: 'copy the source into your app; you own it' },
      ],
      existing,
    ),
  )
  const theme = await ask(options.theme, DEFAULT_PRESET, () =>
    ui.select('Theme preset', THEMES.map((t) => ({ value: t, label: t[0]!.toUpperCase() + t.slice(1), hint: THEME_HINTS[t] })), DEFAULT_PRESET),
  )
  const motion = await ask(options.motion, PRESET_MOTION[theme], () =>
    ui.select(
      'Motion personality',
      MOTIONS.map((m) => ({ value: m, hint: `${m === PRESET_MOTION[theme] ? `${theme}’s own · ` : ''}${{ precise: 'fast, no overshoot', calm: 'slower, softer', lively: 'springier, a little bounce' }[m]}` })),
      PRESET_MOTION[theme],
    ),
  )
  const look = await ask(options.look, DEFAULT_LOOK, () =>
    ui.select(
      'Component look',
      looks.map((s) => ({ value: s.id, label: s.name, hint: s.id === 'classic' ? 'hairline panels and rounded controls' : s.description.split(':')[0]!.toLowerCase() })),
      DEFAULT_LOOK,
    ),
  )
  const quality = await ask(options.quality, 'auto', () =>
    ui.select(
      'Default quality',
      [
        { value: 'auto', hint: 'lighter effects on low-end devices' },
        { value: 'high', hint: 'full effects everywhere' },
        { value: 'low', hint: 'lighter effects everywhere' },
      ],
      'auto' as Quality,
    ),
  )
  for (const [name, value, allowed] of [
    ['mode', mode, MODES],
    ['theme', theme, THEMES],
    ['motion', motion, MOTIONS],
    ['quality', quality, QUALITIES],
    ['look', look, LOOKS],
  ] as const)
    if (!(allowed as readonly string[]).includes(value)) throw new CliError(`--${name} takes ${allowed.join(', ')}; got "${value}".`)
  return { mode, theme, motion, quality, look }
}

/** One entry per file, from its state before init to after (a file can be written in both phases). */
export function mergeChanges(changes: Change[]): Change[] {
  const byPath = new Map<string, Change>()
  for (const change of changes) {
    const first = byPath.get(change.path)
    byPath.set(change.path, first ? { ...change, before: first.before } : change)
  }
  return [...byPath.values()].filter((c) => c.before !== c.after)
}

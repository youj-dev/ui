import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { brokenImports, describeBroken, importsOf, isYoujSource, resolveImport } from './collisions'
import { dropShadcnLeftovers, hasCssImport, isShadcnStylesheet, shadcnClassesIn, shadcnColorsIn } from './codemods'
import { baseUiSupported, BASE_UI_INSTALL, BASE_UI_RANGE, KIT_COPY_IN, MOTION_INSTALL, MOTION_RANGE, packageStyles, PACKAGES, REGISTRY_NAMESPACE, VERSION } from './constants'
import {
  allDeps,
  detectEntry,
  detectFramework,
  detectPackageManager,
  detectStylesheet,
  installedVersion,
  majorOf,
  TAILWIND_IMPORT,
  tailwindWiring,
  unsupportedReact,
  versionMajor,
  versionOrRange,
  type PackageJson,
} from './detect'
import { aliasProblems, pathsOf } from './alias'
import { aliasBase } from './copy-in'
import { installedExports, moduleKey } from './exports'
import { Project } from './project'
import { inspect, MANIFEST, readManifest } from './stamp'
import { format, installCommand, type Runner } from './run'

export interface Check {
  level: 'ok' | 'warn' | 'error'
  message: string
  fix?: string
}

/** Checks an app's Youj setup and says how to fix what's off. */
export function doctor(cwd: string, env: NodeJS.ProcessEnv = process.env): Check[] {
  const project = new Project(resolve(cwd))
  const pkg = project.json<PackageJson>('package.json')
  if (!pkg) return [{ level: 'error', message: `No package.json in ${project.root}`, fix: 'Run doctor in your app’s folder (or pass --cwd).' }]
  const checks: Check[] = []
  const ok = (message: string) => checks.push({ level: 'ok', message })
  const warn = (message: string, fix?: string) => checks.push({ level: 'warn', message, fix })
  const error = (message: string, fix?: string) => checks.push({ level: 'error', message, fix })
  const deps = allDeps(pkg)
  const pm = detectPackageManager(project.root, env)
  const install = (...specs: string[]) => format(installCommand(pm, specs))

  // Versions
  const react = versionOrRange(project, 'react')
  const reactProblem = react && unsupportedReact(react)
  if (!react) error('React isn’t installed', install('react@^19', 'react-dom@^19'))
  else if (reactProblem) error(reactProblem, install('react@^19', 'react-dom@^19'))
  else ok(`React ${majorOf(react) ?? react}`)

  const tailwind = versionMajor(project, 'tailwindcss')
  if (tailwind === null) error('Tailwind CSS isn’t installed', 'npx youj init sets it up, or see tailwindcss.com/docs/installation')
  else if (tailwind < 4) error(`Tailwind CSS ${tailwind}: Youj needs v4`, 'npx @tailwindcss/upgrade@latest (commit first)')
  else ok(`Tailwind CSS v${tailwind}`)
  const wiring = tailwind !== null && tailwind >= 4 && detectFramework(project) ? tailwindWiring(project, detectFramework(project)!) : null
  if (wiring?.wired === false)
    error(
      `Tailwind CSS is installed but not in the build${wiring.file ? ` (${wiring.file} doesn't use its plugin)` : ''}, so nothing compiles Youj's classes`,
      'npx youj init sets it up, or see tailwindcss.com/docs/installation',
    )

  const components = project.json<{ registries?: Record<string, string>; aliases?: Record<string, string> }>('components.json')
  const usesPackage = Object.values(PACKAGES).some((name) => deps[name])
  const framework = detectFramework(project)
  const entry = framework ? detectEntry(project, framework) : null
  const registryCss = project.walk('.', (n) => n === 'youj.css').find((f) => f.endsWith('styles/youj.css'))
  const usesRegistry = Boolean(registryCss || components?.registries?.[REGISTRY_NAMESPACE])
  if (!usesPackage && !usesRegistry) {
    error('Youj isn’t set up in this app', 'npx youj init')
    return checks
  }

  if (usesPackage) {
    const installed = Object.values(PACKAGES).flatMap((name) => {
      const version = installedVersion(project.root, name)
      return version ? [[name, version] as const] : deps[name] ? (error(`${name} is in package.json but not installed`, `${pm} install`), []) : []
    })
    const versions = new Set(installed.map(([, v]) => v))
    if (versions.size > 1)
      error(`The Youj packages are on different versions (${installed.map(([n, v]) => `${n}@${v}`).join(', ')}); they release together`, install(...installed.map(([n]) => `${n}@${installed[0]![1]}`)))
    else if (installed.length) ok(installed.map(([n, v]) => `${n}@${v}`).join(', '))
    // @youj/core is a peer of the others: the app's own dependency, so it stays one copy.
    const dependents = installed.filter(([n]) => n !== PACKAGES.core)
    if (dependents.length && !deps[PACKAGES.core]) {
      const fix = install(`${PACKAGES.core}@^${dependents[0]![1]}`)
      if (!installedVersion(project.root, PACKAGES.core)) error(`${PACKAGES.core} isn’t installed (a peer dependency of ${dependents.map(([n]) => n).join(', ')}: it holds YoujProvider)`, fix)
      else warn(`${PACKAGES.core} isn’t in package.json, only installed as a peer of ${dependents.map(([n]) => n).join(', ')}. List it, so updates keep one copy of YoujProvider`, fix)
    }
    const motion = installedVersion(project.root, 'motion')
    const majors = MOTION_RANGE.split('||').map(majorOf)
    if (!motion) error('motion isn’t installed (a peer dependency of the Youj packages)', install(`motion@${MOTION_INSTALL}`))
    else if (!majors.includes(majorOf(motion))) error(`motion ${motion}: Youj needs ${MOTION_RANGE}`, install(`motion@${MOTION_INSTALL}`))
    else ok(`motion ${motion}`)
    if (installed.some(([name]) => name === PACKAGES.react)) {
      const baseUi = installedVersion(project.root, '@base-ui/react')
      if (!baseUi) error('@base-ui/react isn’t installed (a peer dependency of @youj/react)', install(`@base-ui/react@${BASE_UI_INSTALL}`))
      else if (!baseUiSupported(baseUi)) error(`@base-ui/react ${baseUi}: Youj needs ${BASE_UI_RANGE}`, install(`@base-ui/react@${BASE_UI_INSTALL}`))
      else ok(`@base-ui/react ${baseUi}`)
    }

    // Youj's own copies, and the app's own components where the package has one of the same name (a shadcn app's), are told apart.
    const all = packageDuplicates(project)
    const own = all.filter((f) => /\.[jt]sx?$/.test(f) && !isYoujSource(project.read(f) ?? ''))
    const dupes = all.filter((f) => !own.includes(f))
    const list = (files: string[]) => `${files.slice(0, 4).join(', ')}${files.length > 4 ? ', …' : ''}`
    if (dupes.length)
      warn(
        `${dupes.length} copied Youj file${dupes.length === 1 ? '' : 's'} duplicate${dupes.length === 1 ? 's' : ''} what the Youj packages ship${dupes.some((f) => /lib\/youj\/provider\.[jt]sx?$/.test(f)) ? ', the provider among them' : ''} (${list(dupes)}): the app has two of each, and the copies don't follow the packages' updates`,
        'Import them from the packages instead (@youj/react, @youj/core, @youj/motion, @youj/icons), then delete the copies. `npx youj add <block> --overwrite` copies a block again that way, on its own (replacing your edits to it).',
      )
    if (own.length)
      warn(
        `${own.length} component${own.length === 1 ? '' : 's'} of your own ${own.length === 1 ? 'has' : 'have'} a Youj version in ${PACKAGES.react} (${list(own)}). They keep working as they are`,
        `Switch each import to ${PACKAGES.react} when you're ready, then delete your file: the "Coming from shadcn/ui" guide lists the props that differ.`,
      )

    const dist = join(project.root, 'node_modules', PACKAGES.react, 'dist/styles.css')
    if (deps[PACKAGES.react] && existsSync(dist) && !readFileSync(dist, 'utf8').includes('@source'))
      error(`${PACKAGES.react}'s stylesheet has no @source, so Tailwind won't generate its classes`, install(`${PACKAGES.react}@latest`))
  }

  for (const [name, found] of [
    ['motion', copies(project.root, 'motion')],
    [PACKAGES.core, copies(project.root, PACKAGES.core)],
  ] as const) {
    if (found.length > 1)
      error(
        `${found.length} copies of ${name} are installed (${new Set(found).size > 1 ? [...new Set(found)].join(', ') : `${found[0]}, resolved against different peers`}): components from one don't see the provider or settings of the other`,
        `Put everything on one version, then ${pm === 'npm' ? 'npm dedupe' : pm === 'yarn' ? 'yarn dedupe' : pm === 'bun' ? 'bun install' : 'pnpm dedupe'}`,
      )
  }

  // Styles: one Tailwind root, Youj right after Tailwind
  // Comments don't count: the copied stylesheets explain their imports in them.
  const readCss = (f: string) => (project.read(f) ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
  const sheets = project.walk('.', (n) => n.endsWith('.css')).filter((f) => !/^(public|dist|build|out)\//.test(f))
  const roots = sheets.filter((f) => TAILWIND_IMPORT.test(readCss(f)))
  const sheet = framework && entry ? detectStylesheet(project, framework, entry) : null
  const main = roots.find((f) => f === sheet?.path) ?? roots[0]
  if (roots.length > 1) warn(`Tailwind is imported in ${roots.length} stylesheets (${roots.join(', ')}). Each is its own Tailwind root`, `Import Youj in the one your app loads (${main}).`)
  const youjSpecs = usesPackage ? Object.values(PACKAGES).map((name) => `${name}/styles.css`) : []
  const importsYouj = (css: string) => youjSpecs.some((s) => hasCssImport(css, s)) || /@import\s+['"][^'"]*styles\/(youj|ui)\.css['"]/.test(css)
  const elsewhere = sheets.filter((f) => !roots.includes(f) && importsYouj(readCss(f)))
  for (const f of elsewhere)
    error(`${f} imports Youj's styles without Tailwind. They only work compiled in the same file as @import 'tailwindcss'`, `Move the import into ${main ?? 'your global stylesheet'}, right after Tailwind's.`)
  if (!main) error('No stylesheet imports Tailwind', `Add @import 'tailwindcss'; to ${sheet?.path ?? 'your global stylesheet'}.`)
  else {
    const css = readCss(main)
    const twAt = css.search(TAILWIND_IMPORT)
    const importAt = (spec: string) => css.search(new RegExp(`@import\\s+['"]${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['"]`))
    if (usesPackage) {
      // The lines the installed packages need, in order: the tokens (react's sheet brings core's and the icons'), then each extra package's.
      const wanted = packageStyles(deps)
      const at = wanted.map(importAt)
      const lines = (specs: string[]) => specs.map((s) => `@import '${s}';`).join(' ')
      const missing = wanted.filter((_, i) => at[i]! < 0)
      if (missing.length) error(`${main} doesn't import ${missing.join(', ')}`, `Add ${lines(missing)} after @import 'tailwindcss';, in this order: ${lines(wanted)}`)
      else if (at.some((i) => i < twAt)) error(`Youj's styles come before Tailwind in ${main}`, 'Move them after @import \'tailwindcss\';')
      else if (at.some((i, n) => n > 0 && i < at[n - 1]!)) error(`The Youj imports in ${main} are out of order`, `Order them: ${lines(wanted)}`)
      else ok(`${main} imports Tailwind, then ${wanted.join(', ')}`)
      const reactAt = importAt(`${PACKAGES.react}/styles.css`)
      if (reactAt >= 0 && importAt(`${PACKAGES.core}/styles.css`) >= 0) warn(`${main} imports both ${PACKAGES.core}/styles.css and ${PACKAGES.react}/styles.css`, `Remove the ${PACKAGES.core} line: ${PACKAGES.react}/styles.css imports it.`)
      if (reactAt >= 0 && importAt(`${PACKAGES.icons}/styles.css`) >= 0) warn(`${main} imports both ${PACKAGES.icons}/styles.css and ${PACKAGES.react}/styles.css`, `Remove the ${PACKAGES.icons} line: ${PACKAGES.react}/styles.css imports it.`)
    }
    if (usesRegistry && !usesPackage) {
      const tokens = css.search(/@import\s+['"][^'"]*styles\/youj\.css['"]/)
      const ui = css.search(/@import\s+['"][^'"]*styles\/ui\.css['"]/)
      const uiCopied = project.walk('.', (n) => n === 'ui.css').some((f) => f.endsWith('styles/ui.css'))
      if (tokens < 0) error(`${main} doesn't import the copied youj.css`, `Add @import '<path to>/styles/youj.css'; right after @import 'tailwindcss';`)
      else if (uiCopied && ui < 0) error(`${main} doesn't import the copied ui.css`, 'Add @import \'<path to>/styles/ui.css\'; right after youj.css.')
      else if (tokens < twAt || (ui >= 0 && ui < tokens)) error(`The Youj imports in ${main} are out of order`, 'Order them: tailwindcss, youj.css, ui.css.')
      else ok(`${main} imports Tailwind, then Youj's tokens`)
    }
    const leftovers = dropShadcnLeftovers(css).removed
    const fix = 'npx youj init removes them (it shows the diff first), or delete them by hand: see the "Coming from shadcn/ui" guide.'
    if (leftovers.some((l) => l.what === '@custom-variant dark'))
      error(`${main} redefines the dark variant (@custom-variant dark), so Youj's dark: classes follow it instead of data-theme and match nothing`, fix)
    const accent = leftovers.flatMap((l) => l.names).filter((n) => /^--color-(?:sidebar-)?accent/.test(n))
    if (accent.length) error(`${main} maps ${accent.join(', ')} to shadcn's --accent, so Youj's accent (bg-accent, the info alert's tint) turns into an undefined variable`, fix)
    const overrides = shadcnColorsIn(css)
    if (overrides.length)
      error(
        `${main} sets ${overrides.join(', ')}${isShadcnStylesheet(css) ? " (shadcn's :root and .dark blocks)" : ''}: ${PACKAGES.react}/shadcn.css maps these shadcn names onto Youj's roles, and yours override it in every theme`,
        `${fix} Bring a brand colour over as a theme (Theming).`,
      )
    // An @import of a file that isn't there breaks the build (a copy that stopped halfway).
    for (const [, spec] of css.matchAll(/@import\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const path = posix.normalize(posix.join(posix.dirname(main), spec!))
      if (!project.exists(path)) error(`${main} imports ${spec}, which isn't there`, path.endsWith('youj.css') || path.endsWith('ui.css') || /styles\/\w+\.css$/.test(path) ? 'npx youj init --mode registry copies the core in again.' : 'Fix the path, or remove the import.')
    }
  }

  // An app on the package that copied blocks in imports them through @/ too.
  const blocks = project.walk('.', (n) => /\.tsx?$/.test(n), 3).some((f) => /^(src\/)?blocks\//.test(f))
  if (usesRegistry && !usesPackage) {
    if (!components?.registries?.[REGISTRY_NAMESPACE]) warn(`components.json has no ${REGISTRY_NAMESPACE} registry, so items need their full URL`, 'npx youj init --mode registry adds it')
    else ok(`components.json maps ${REGISTRY_NAMESPACE}`)
  }
  if (usesRegistry || blocks) checkAlias(project, framework, components, ok, error)

  // Copied Youj source that imports a file of the app's own that can't stand in for Youj's (a shadcn component).
  if (usesRegistry || blocks) {
    const base = aliasBase(project)
    const copied = ['components', 'lib', 'hooks', 'blocks'].flatMap((dir) => project.walk(`${base}${dir}`, (n) => /\.[jt]sx?$/.test(n)))
    const youj = copied.filter((f) => isYoujSource(project.read(f) ?? ''))
    // Youj's classes are roles (bg-canvas, text-fg-muted). A copy with shadcn's names (an older copy, or edited) shows nothing without the compat sheet.
    const named = youj.map((f) => [f, shadcnClassesIn(project.read(f) ?? '')] as const).filter(([, names]) => names.length)
    if (named.length)
      warn(
        `${named.length} copied Youj file${named.length === 1 ? ' uses' : 's use'} shadcn's color names (${named
          .slice(0, 3)
          .map(([f, names]) => `${f}: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ', …' : ''}`)
          .join('; ')}${named.length > 3 ? '; …' : ''}). Youj's are roles (canvas, fg, fg-muted, line…), so these only work with ${PACKAGES.react}/shadcn.css`,
        `npx youj add ${named.map(([f]) => f.slice(f.lastIndexOf('/') + 1).replace(/\.[jt]sx?$/, '')).slice(0, 4).join(' ')} --overwrite copies the current versions, or rename the classes (the "Coming from shadcn/ui" guide lists them).`,
      )
    const broken = brokenImports(project, copied.filter((f) => !youj.includes(f)), youj)
    if (broken.length)
      error(
        `Youj's copied components import ${broken.length === 1 ? 'a file' : `${broken.length} files`} that can't stand in for Youj's, so the app won't typecheck:\n${describeBroken(broken)}`,
        `Replace ${broken.length === 1 ? 'it' : 'them'} with Youj's: npx youj add ${broken.map((b) => b.file.slice(b.file.lastIndexOf('/') + 1).replace(/\.[jt]sx?$/, '')).join(' ')} --overwrite`,
      )
  }

  // What the copies say about themselves (youj.json, written by add): edited ones, and ones from another version.
  const { edited, older } = inspect(project, VERSION)
  if (edited.length)
    ok(`${edited.length} copied file${edited.length === 1 ? ' is' : 's are'} edited since add wrote ${edited.length === 1 ? 'it' : 'them'} (add keeps ${edited.length === 1 ? 'it' : 'them'} unless --overwrite): ${edited.slice(0, 5).map((e) => e.path).join(', ')}${edited.length > 5 ? `, and ${edited.length - 5} more` : ''}`)
  if (older.length)
    warn(
      `${older.length} copied item${older.length === 1 ? ' is' : 's are'} from an older Youj than ${VERSION}: ${older.slice(0, 5).map((o) => `${o.item} (${o.version})`).join(', ')}${older.length > 5 ? `, and ${older.length - 5} more` : ''}`,
      `npx youj add ${older.slice(0, 4).map((o) => o.item).join(' ')} replaces the files you haven't edited and keeps the ones you have (--overwrite replaces those too). ${MANIFEST} lists what each item copied.`,
    )

  // Provider (optional)
  const withProvider = entry && findProvider(project, entry)
  if (withProvider) ok(`YoujProvider in ${withProvider}`)
  else checks.push({ level: 'ok', message: 'No YoujProvider (optional: components run at normal speed and follow the OS reduced-motion setting)' })

  // A right-to-left page language without `dir` on <html>: the document lays out left to right until the provider mounts.
  for (const file of [entry?.document, entry?.root]) {
    const html = file ? project.read(file)?.match(/<html\b[^>]*>/)?.[0] : undefined
    const lang = html?.match(/\blang=["'{`]+([A-Za-z-]+)/)?.[1]
    if (html && lang && /^(ar|he|fa|ur|ps|sd|ug|yi|dv|ckb)(-|$)/i.test(lang) && !/\bdir=/.test(html)) {
      warn(`${file} sets lang="${lang}", a right-to-left language, but <html> has no dir, so the page lays out left to right until YoujProvider mounts`, 'Add dir="rtl" to <html>. YoujProvider with a right-to-left locale sets dir on its own scope, not on the document.')
      break
    }
  }

  return checks
}

/**
 * The file that renders YoujProvider: the root (or document) itself, or a file
 * it imports, followed a few levels (app/layout.tsx → app/providers.tsx).
 */
export function findProvider(project: Project, entry: { root: string | null; document: string | null }): string | null {
  const base = aliasBase(project)
  const seen = new Set<string>()
  let level = [entry.root, entry.document].filter((f): f is string => Boolean(f))
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: string[] = []
    for (const file of level) {
      if (seen.has(file)) continue
      seen.add(file)
      const source = project.read(file) ?? ''
      if (/<YoujProvider\b/.test(source)) return file
      for (const { spec } of importsOf(source)) {
        const target = resolveImport(project, file, spec, base)
        if (target && !seen.has(target) && seen.size + next.length < 60) next.push(target)
      }
    }
    level = next
  }
  return null
}

/**
 * `doctor --strict`: the app's own TypeScript over the whole app, which is what
 * a copy that doesn't fit (a shadcn component in place of Youj's) fails first.
 * Skipped without a tsconfig or an installed TypeScript.
 */
export async function typecheck(cwd: string, runner: Runner): Promise<Check> {
  const project = new Project(resolve(cwd))
  const tsc = ['node_modules/typescript/bin/tsc'].find((f) => project.exists(f))
  const config = project.json<{ files?: unknown[]; references?: unknown[] }>('tsconfig.json')
  if (!tsc || !project.exists('tsconfig.json')) return { level: 'ok', message: 'TypeScript: no tsconfig.json and installed typescript, so nothing to typecheck' }
  // A solution tsconfig (Vite's: files [], references) checks nothing itself; -b checks each project it references.
  const args = config?.references?.length && Array.isArray(config.files) && !config.files.length ? [tsc, '-b'] : [tsc, '--noEmit', '-p', 'tsconfig.json']
  try {
    await runner({ cmd: process.execPath, args }, project.root, { capture: true })
    return { level: 'ok', message: 'TypeScript: no errors' }
  } catch (failure) {
    const lines = String(failure instanceof Error ? failure.message : failure)
      .split('\n')
      .filter((l) => /error TS\d+/.test(l))
    return {
      level: 'error',
      message: `TypeScript: ${lines.length || 'some'} error${lines.length === 1 ? '' : 's'}${lines.length ? `\n${lines.slice(0, 8).map((l) => `  ${l.trim()}`).join('\n')}${lines.length > 8 ? '\n  …' : ''}` : ''}`,
      fix: `${format({ cmd: 'tsc', args: args.slice(1) })} shows them all. Files of your own that Youj's components import (above) come first.`,
    }
  }
}

/** The `@/` alias, for an app that copies source: set where shadcn and the bundler read it, and every copied `@/` import lands on a file. */
function checkAlias(project: Project, framework: ReturnType<typeof detectFramework>, components: { aliases?: Record<string, string> } | null, ok: (m: string) => void, error: (m: string, fix?: string) => void) {
  if (project.exists('components.json') && !components) error('components.json isn’t valid JSON, so shadcn can’t read it', 'Fix or remove it, then run npx youj init --mode registry')
  const usesAt = !components?.aliases || Object.values(components.aliases).some((a) => String(a).startsWith('@/'))
  if (!usesAt) return
  const problems = aliasProblems(project, framework)
  for (const { message, fix } of problems) error(message, fix)
  // A literal ./@ folder is what a copy made without the alias left behind.
  if (existsSync(join(project.root, '@')))
    error('There’s a literal @ folder in the app root: items were copied there while the @/ alias was missing', 'Move its contents into src/ (@/components → src/components), delete ./@, then fix the alias')
  if (problems.length) return
  const root = project.find('tsconfig.json', 'jsconfig.json')
  const target = root && pathsOf(project, root)?.['@/*']?.[0]
  if (!target) return void ok('The @/ alias is set up')
  const base = target.replace(/^\.\//, '').replace(/\/?\*$/, '')
  const resolves = (spec: string) => ['', '.ts', '.tsx', '.js', '.jsx', '.css', '/index.ts', '/index.tsx'].some((ext) => existsSync(join(project.root, base, spec + ext)))
  const missing = new Set<string>()
  for (const file of project.walk(base || '.', (n) => /\.(tsx?|jsx?)$/.test(n)).filter((f) => /(^|\/)(components|lib|hooks|blocks)\//.test(f)))
    for (const m of (project.read(file) ?? '').matchAll(/\bfrom\s*['"]@\/([^'"]+)['"]/g)) if (!resolves(m[1]!)) missing.add(`@/${m[1]}`)
  if (missing.size) error(`${missing.size} @/ import${missing.size === 1 ? '' : 's'} in the copied source point at files that aren't there (${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? ', …' : ''})`, 'Add the items they belong to (npx youj add <item>), or check that @/* points at your source folder.')
  else ok('The @/ alias is set up, and the copied source’s @/ imports resolve')
}

/**
 * Files copied into the app that a Youj package installed beside them ships too: a
 * component (components/ui/button.tsx), the provider or the rest of core
 * (lib/youj/), icons, and the core's stylesheets. lib/utils and hooks/ are left out:
 * shadcn apps have their own, and so is the illustration kit `add` copies on purpose
 * (KIT_COPY_IN), with the files beside it that it imports.
 */
export function packageDuplicates(project: Project): string[] {
  const shipped = installedExports(project.root)
  if (!shipped.length) return []
  const base = aliasBase(project)
  const kit = Object.keys(readManifest(project).items).some((item) => KIT_COPY_IN.has(item))
  const files = ['components/ui', 'components/youj', 'lib/youj', 'styles'].flatMap((dir) => project.walk(`${base}${dir}`, (n) => /\.(tsx?|css)$/.test(n)))
  return files.filter((file) => {
    const path = file.slice(base.length)
    if (path.endsWith('.css')) return /^styles\/(youj|ui)\.css$/.test(path) || /^lib\/youj\/.+\.css$/.test(path)
    if (kit && path.startsWith('components/youj/graphics/')) return false
    return shipped.some((pkg) => pkg.modules.has(moduleKey(path)))
  })
}

/** Distinct installed versions of a package anywhere in node_modules (pnpm's store folder or nested copies). */
export function copies(root: string, name: string): string[] {
  const versions = new Set<string>()
  const store = pnpmStore(root)
  if (store) {
    const prefix = `${name.replace('/', '+')}@`
    // One folder per version and peer set: the same version resolved against
    // two peer sets is two copies at runtime, too.
    return readdirSync(store)
      .filter((dir) => dir.startsWith(prefix))
      .map((dir) => dir.slice(prefix.length).split('_')[0]!)
      .sort()
  } else {
    const visit = (dir: string, depth: number) => {
      const file = join(dir, name, 'package.json')
      if (existsSync(file)) {
        try {
          versions.add((JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version)
        } catch {
          // unreadable manifest: not a copy we can compare
        }
      }
      if (depth === 0) return
      let entries: string[] = []
      try {
        entries = readdirSync(dir)
      } catch {
        return
      }
      for (const entry of entries) {
        if (entry.startsWith('.')) continue
        const pkgs = entry.startsWith('@') ? safeList(join(dir, entry)).map((e) => join(dir, entry, e)) : [join(dir, entry)]
        for (const pkg of pkgs) if (existsSync(join(pkg, 'node_modules'))) visit(join(pkg, 'node_modules'), depth - 1)
      }
    }
    visit(join(root, 'node_modules'), 3)
  }
  return [...versions].sort()
}

/** pnpm's virtual store: in the app, or at the root of the workspace it's in. */
function pnpmStore(root: string): string | null {
  let dir = resolve(root)
  for (;;) {
    const store = join(dir, 'node_modules/.pnpm')
    if (existsSync(store)) return store
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function safeList(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

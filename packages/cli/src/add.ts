import { resolve } from 'node:path'
// What @youj/react ships each item from, and the optional peers each entry needs.
// Its generator writes this from the components' imports; the build inlines it.
import entries from '../../ui/entries.json' with { type: 'json' }
import { brokenImports, describeBroken, isYoujSource } from './collisions'
import { describeUtils, essence, settle, snapshot, otherOutput, type CopyOutcome } from './copy'
import { findProvider } from './doctor'
import { aliasProblems } from './alias'
import { appPath, fileTarget, aliasBase } from './copy-in'
import { NOTICE_PATH, writeNotice } from './notice'
import { KIT_COPY_IN, packageStyles, PACKAGES, REGISTRY_NAMESPACE, registryTemplate, sourcePackageOf, THEMES, VERSION, withCorePeer, type Mode, type ThemeId } from './constants'
import { allDeps, detectEntry, detectFramework, detectPackageManager, detectStylesheet, type PackageJson } from './detect'
import { findRegistryFiles } from './init-files'
import { copyIn, isFlag, plural, PREVIEW_FLAGS, repairImports } from './add-copy-in'
import { SOUND, switchOn, wireLook, wirePackageStyles, wireSound, wireThemeSheet } from './wiring'
import { Project } from './project'
import { fetchRegistryItem, localRegistry, needsLocalRegistry } from './registry'
import { dlxCommand, format, installCommand, SHADCN, type Command, type Runner } from './run'
import { LOOKS, type YoujLook } from './look'
import { CliError, type Ui } from './ui'
import { stamp } from './stamp'
import { importLines, previewFiles, withDependencies } from './usage'

/** The component look a `youj-look-<id>` item copies in, or undefined for any other item. */
export function lookOfItem(item: string): YoujLook | undefined {
  const id = item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '').match(/^youj-look-([\w-]+)$/)?.[1]
  return LOOKS.find((look) => look === id)
}

/** The preset a `youj-theme-<id>` item copies the stylesheet of, or undefined for any other item (youj-theme-check included). */
export function themeOfItem(item: string): ThemeId | undefined {
  const id = item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '').match(/^youj-theme-([\w-]+)$/)?.[1]
  return THEMES.find((theme) => theme === id)
}

/**
 * `locale de` → `youj-locale-de` and `theme terminal` → `youj-theme-terminal` (also `theme check`):
 * the words the docs use for the opt-in parts of the core. Anything else, and a lone
 * word that could be an item of its own, passes through.
 */
export function expandItemAliases(items: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < items.length; i++) {
    const kind = items[i]
    const id = items[i + 1]
    if ((kind === 'locale' || kind === 'theme') && id) {
      out.push(`youj-${kind}-${id.toLowerCase()}`)
      i++
    } else out.push(items[i]!)
  }
  return out
}

const ENTRIES: Record<string, { items: string[]; peerDependencies: Record<string, string> }> = entries

/** What Form's schema setup installs, each as the spec to install: `@hookform/resolvers` v6 fails `npm install` (its peer range wants effect 4), so the hint stays on v5. */
const FORM_EXTRAS: Record<string, string> = { '@hookform/resolvers': '@hookform/resolvers@^5', zod: 'zod' }

/** The package entry that exports an item, and the optional peers to install with it. */
export function packageEntry(item: string): { entry: string; peerDependencies: Record<string, string> } | undefined {
  const found = Object.entries(ENTRIES).find(([, e]) => e.items.includes(item))
  return found && { entry: found[0], peerDependencies: found[1].peerDependencies }
}

/** A registry item as `add` takes it: `button`, `@youj/button`, `@scope/name`, or an https URL without characters a shell reads. */
const ITEM = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$|^https?:\/\/[\w.-]+(?::\d+)?(?:\/[\w.~%+@-]+)*\/?$/i

/** Item names reach a command line (on Windows through a shell), so anything else stops here before it does. */
export function assertItems(items: string[]): void {
  const bad = items.filter((item) => !ITEM.test(item))
  if (bad.length) throw new CliError(`Can't add ${bad.map((b) => JSON.stringify(b)).join(', ')}: not an item name or an https URL. Names are lowercase letters, digits, "-", "_" and ".", e.g. npx @youj/cli add button.`)
}

/**
 * `youj add button dialog` → `shadcn add @youj/button @youj/dialog`.
 * Without the namespace in components.json it passes the items' URLs, so it
 * works in any app, like `npx shadcn add <url>`. Flags (--overwrite, --path,
 * …) pass through. `project` is the app as read, with any edits a dry run
 * has staged but not written.
 */
export function addCommand(cwd: string, items: string[], flags: string[], env: NodeJS.ProcessEnv = process.env, project = new Project(resolve(cwd))): Command {
  if (!items.length) throw new CliError('Name the items to add, e.g. npx @youj/cli add button dialog')
  assertItems(items)
  // Without components.json, shadcn sets one up before it adds (`init --mode registry` does it the Youj way).
  const components = project.json<{ registries?: Record<string, string> }>('components.json')
  const namespaced = Boolean(components?.registries?.[REGISTRY_NAMESPACE])
  const template = registryTemplate(env)
  const refs = items.map((item) => {
    const name = item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '')
    if (/^https?:\/\//.test(item) || item.startsWith('@') && !item.startsWith(`${REGISTRY_NAMESPACE}/`)) return item
    return namespaced ? `${REGISTRY_NAMESPACE}/${name}` : template.replace('{name}', name)
  })
  return dlxCommand(detectPackageManager(project.root, env), SHADCN, ['add', ...refs, ...flags])
}

export interface AddPlan {
  /** Items @youj/react ships, with the entry each imports from (an app on the package). */
  fromPackage: { item: string; entry: string }[]
  /** The optional peers those items need that the app doesn't have yet, and the command that installs them. */
  peers: string[]
  install?: Command
  /** Copies the other items in with shadcn (an app on the registry). */
  copy?: Command
  /** The other items, which the CLI copies in itself, pointed at the packages (an app on the package). */
  copyIn?: string[]
  /** `add sound` in an app on the packages: the package, installed unless it's there. */
  sound?: { install?: Command }
  /** Component styles an app on the package has already: @youj/react/styles.css carries every one. */
  styles: string[]
  /** Youj packages the items come from that the app doesn't have yet (@youj/illustrations), installed with `install`. */
  packages: string[]
  /** The stylesheet lines the app needs once they're in, in order (@youj/illustrations/styles.css after react's). */
  css: string[]
}

/**
 * An app on the package (@youj/react in package.json, no @youj
 * registry in components.json) already has the components, so `add chart`
 * installs what Chart needs (recharts) instead of copying its source. Items
 * the package doesn't ship (blocks, examples) are copied in on their own,
 * pointed at the packages (copy-in.ts).
 */
export function addPlan(cwd: string, items: string[], flags: string[], env: NodeJS.ProcessEnv = process.env, project = new Project(resolve(cwd)), mode?: Mode): AddPlan {
  if (!items.length) throw new CliError('Name the items to add, e.g. npx @youj/cli add button dialog')
  assertItems(items)
  const deps = allDeps(project.json<PackageJson>('package.json'))
  const namespaced = Boolean(project.json<{ registries?: Record<string, string> }>('components.json')?.registries?.[REGISTRY_NAMESPACE])
  // `mode` is for a dry run of a setup that hasn't installed the package yet.
  const onPackage = mode ? mode === 'package' : Boolean(deps[PACKAGES.react]) && !namespaced
  // Icons, illustrations and loaders are packages of their own, so an app on core alone gets them from there too.
  const onSourcePackages = Boolean(deps[PACKAGES.react] || deps[PACKAGES.core]) && !namespaced
  const packages = new Map<string, string>()
  // Sound is a package of its own, so an app on core alone gets the package too.
  const soundFromPackage = Boolean(deps[PACKAGES.react] || deps[PACKAGES.core]) && !namespaced
  const fromPackage: AddPlan['fromPackage'] = []
  const peers = new Map<string, string>()
  const rest: string[] = []
  let sound: AddPlan['sound']
  const styles: string[] = []
  for (const item of items) {
    if (onPackage && lookOfItem(item)) {
      styles.push(item)
      continue
    }
    if (item === SOUND.item && soundFromPackage) {
      sound = { install: deps[SOUND.package] ? undefined : installCommand(detectPackageManager(project.root, env), withCorePeer([SOUND.package], deps).map((name) => `${name}@^${VERSION}`)) }
      continue
    }
    const name = item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '')
    const source = sourcePackageOf(name)
    // Miniatures are npm only and need no core, so they're an install and an import in any app (`miniature-turntable` → '@youj/miniatures/turntable').
    if (source === PACKAGES.miniatures) {
      fromPackage.push({ item, entry: `${source}/${name.slice('miniature-'.length)}` })
      if (!deps[source]) packages.set(source, `^${VERSION}`)
      continue
    }
    if (source && onSourcePackages && !(onPackage && KIT_COPY_IN.has(name))) {
      // Each loader is an entry of its own ('loader-tittle' → '@youj/loaders/tittle'); the kit is the package's main entry.
      fromPackage.push({ item, entry: source === PACKAGES.loaders && name !== 'loader-kit' ? `${source}/${name.slice('loader-'.length)}` : source })
      if (!deps[source]) packages.set(source, `^${VERSION}`)
      continue
    }
    const found = onPackage ? packageEntry(item) : undefined
    if (!found) {
      rest.push(item)
      continue
    }
    fromPackage.push({ item, entry: found.entry })
    for (const [name, range] of Object.entries(found.peerDependencies)) if (!deps[name]) peers.set(name, range)
  }
  for (const name of withCorePeer([...packages.keys()], deps)) if (!packages.has(name)) packages.set(name, `^${VERSION}`)
  const installs = [...packages, ...peers]
  const after = { ...deps, ...Object.fromEntries(installs) }
  return {
    fromPackage,
    peers: [...peers.keys()],
    packages: [...packages.keys()],
    css: fromPackage.some((p) => !p.entry.startsWith(`${PACKAGES.miniatures}/`) && sourcePackageOf(p.item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), ''))) ? packageStyles(after) : [],
    install: installs.length ? installCommand(detectPackageManager(project.root, env), installs.map(([name, range]) => `${name}@${range}`)) : undefined,
    copy: rest.length && !onPackage ? addCommand(cwd, rest, flags, env, project) : undefined,
    copyIn: rest.length && onPackage ? rest : undefined,
    sound,
    styles,
  }
}

/** The commands a plan stands for, to show: installs, then the copy (`youj add …` for the one the CLI does itself). */
export function planCommands(plan: AddPlan): Command[] {
  const copyIn: Command | undefined = plan.copyIn && { cmd: 'npx', args: ['@youj/cli', 'add', ...plan.copyIn] }
  return [plan.install, plan.copy, copyIn].filter((c): c is Command => c !== undefined)
}

/**
 * `interactive`: a person at a terminal, who can be asked before files of
 * theirs that Youj's code needs are replaced. Otherwise `add` stops with exit
 * code 1 and the command that replaces them.
 */
export async function add(cwd: string, items: string[], flags: string[], runner: Runner, ui: Ui, env: NodeJS.ProcessEnv = process.env, interactive = false): Promise<AddPlan> {
  const root = resolve(cwd)
  // shadcn asks before replacing a file, and `--yes` doesn't stop it. We run it never asking
  // (--yes --overwrite) and settle files that were there ourselves: see copy.ts.
  const preview = flags.some((f) => isFlag(f, ...PREVIEW_FLAGS))
  const overwrite = flags.some((f) => isFlag(f, '--overwrite', '-o'))
  const shadcnFlags = preview ? flags : [...flags.filter((f) => !isFlag(f, '--yes', '-y', '--overwrite', '-o')), '--yes', '--overwrite']
  const plan = addPlan(cwd, items, shadcnFlags, env)
  if (plan.copy && !preview) {
    const project = new Project(root)
    const aliases = Object.values(project.json<{ aliases?: Record<string, string> }>('components.json')?.aliases ?? { components: '@/components' })
    const problems = aliases.some((a) => String(a).startsWith('@/')) ? aliasProblems(project, detectFramework(project)) : []
    if (problems.length) throw new CliError(problems.map((p) => `${p.message}.\n  Fix: ${p.fix}`).join('\n'))
  }
  const { install } = plan
  const installing = [...plan.packages, ...plan.peers].join(', ')
  const soundInstall = plan.sound?.install
  // A preview installs nothing and edits no file: it lists what a real run would do, then shows shadcn's own preview.
  if (preview) {
    const steps = [
      ...(install ? [`install ${installing}: ${format(install)}`] : []),
      ...(soundInstall ? [`install ${SOUND.package}: ${format(soundInstall)}`] : []),
      ...(plan.css.length ? [`import ${plan.css.join(', ')} in your global stylesheet`] : []),
      ...(plan.copy ? [`write ${NOTICE_PATH} (shadcn/ui's MIT notice), unless it's there`] : []),
      ...(plan.copy ? items.filter((item) => lookOfItem(item)).map((item) => `import ${lookOfItem(item)}.css in your global stylesheet`) : []),
      ...(items.includes(SOUND.item) ? ['give <YoujProvider> sound={beacon}'] : []),
    ]
    if (steps.length) ui.note('Preview: a run without the flag would also', steps.join('\n'))
  }
  if (install && !preview) await ui.task(`Installing ${installing} (${format(install)})`, `Installed ${installing}`, () => runner(install, root))
  if (plan.css.length && !preview) {
    const wired = wirePackageStyles(root, plan.css)
    ui.changes(wired.changes)
    if (wired.manual) ui.warn(wired.manual)
  }
  if (soundInstall && !preview) await ui.task(`Installing ${SOUND.package} (${format(soundInstall)})`, `Installed ${SOUND.package}`, () => runner(soundInstall, root))
  if (plan.fromPackage.length) ui.note('From the package', plan.fromPackage.map(({ item, entry }) => `${item}: import it from '${entry}'`).join('\n'))
  // Form validates with a schema in its usual setup, and those two packages aren't peers: say so rather than fail the first build.
  const formExtras = plan.fromPackage.some(({ item }) => item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '') === 'form') ? Object.keys(FORM_EXTRAS).filter((name) => !allDeps(new Project(root).json<PackageJson>('package.json'))[name]) : []
  if (formExtras.length) {
    const command = format(installCommand(detectPackageManager(root, env), formExtras.map((name) => FORM_EXTRAS[name]!)))
    ui.note('To validate with a schema', `form: also install ${formExtras.join(' ')}: ${command}${formExtras.includes('@hookform/resolvers') ? "\n@hookform/resolvers stays on v5: v6 doesn't install on npm yet." : ''}`)
  }
  if (plan.styles.length)
    ui.note(
      'From the package',
      plan.styles.map((item) => `${item}: in ${PACKAGES.react}/styles.css already (${switchOn(lookOfItem(item)!)})`).join('\n'),
    )
  if (plan.copyIn) await copyIn(root, plan.copyIn, { preview, overwrite, flags }, runner, ui, env)
  // A registry of your own, or a private one: shadcn installs from local copies of the items (registry.ts).
  // `--dry-run` is Youj's own account of the files (shadcn's would show its temp folder and every shared file); `--diff` and `--view` are shadcn's.
  const ownPreview = preview && flags.some((f) => isFlag(f, '--dry-run')) && !flags.some((f) => isFlag(f, '--diff', '--view'))
  if (plan.copy && ownPreview) ui.note('Preview: add would', await previewFiles(new Project(root), registryNames(items, plan, true), env))
  const local = plan.copy && !ownPreview && needsLocalRegistry(env) ? await ui.task('Fetching the items from the registry', 'Fetched', () => localRegistry(itemRefs(plan.copy!), env)) : undefined
  const copying = plan.copy && local ? withLocalItems(plan.copy, local.path) : plan.copy
  let outcome: CopyOutcome | undefined
  try {
    if (copying && preview && !ownPreview) await runner(copying, root, { inherit: true })
    if (copying && !preview) {
      const before = snapshot(new Project(root))
      const output = await ui.task(`Copying ${items.join(', ')} into the app`, 'Copied', () => runner(copying, root, { capture: true }))
      outcome = settle(new Project(root), before, overwrite)
      for (const line of otherOutput(typeof output === 'string' ? output : '')) ui.info(line)
      const project = new Project(root)
      if (outcome.created.length) ui.changes(outcome.created.map((path) => ({ path, before: null, after: project.read(path) ?? '' })))
      if (outcome.updated.length) ui.info(`Replaced ${outcome.updated.length} file${outcome.updated.length === 1 ? '' : 's'} (--overwrite): ${outcome.updated.join(', ')}`)
      if (outcome.unchanged) ui.info(`${outcome.unchanged} file${outcome.unchanged === 1 ? '' : 's'} already in place (the shared core and earlier items), left as they are`)
      if (outcome.utils) ui.info(describeUtils(outcome.utils))
      ui.changes(writeNotice(new Project(root)))
    }
  } finally {
    await local?.dispose()
  }
  if (preview) return plan
  if (plan.copy) {
    // The registry spells its imports so shadcn can't misroute them; this puts
    // back any it still did (a registry built before that, or a namesake from
    // another registry added in the same run).
    const copied = items
      .filter((item) => !plan.fromPackage.some((p) => p.item === item) && !(item === SOUND.item && plan.sound))
      .map((item) => item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), ''))
      .filter((item) => !/^https?:\/\//.test(item) && !item.startsWith('@'))
    const project = new Project(root)
    if (copied.length && (await repairImports(project, project.exists('src') ? 'src/' : '', copied, env)).length) ui.changes(project.commit())
  }
  // A copied look's stylesheet is imported right after ui.css.
  for (const item of plan.copy ? items : []) {
    const look = lookOfItem(item)
    if (!look) continue
    const wired = wireLook(root, look)
    ui.changes(wired.changes)
    ui.info(wired.manual ?? `${look[0]!.toUpperCase()}${look.slice(1)} is set up (${switchOn(look)}; data-yj-look="${look}" on any element works too).`)
  }
  // A copied theme's stylesheet is imported where the theme is an <html> attribute.
  for (const item of plan.copy ? items : []) {
    const theme = themeOfItem(item)
    if (!theme) continue
    const wired = wireThemeSheet(root, theme)
    ui.changes(wired.changes)
    ui.info(wired.manual ?? `${theme[0]!.toUpperCase()}${theme.slice(1)}'s stylesheet is in place. Use it with theme={${theme}} on YoujProvider, or data-yj-theme="${theme}" on <html> or any element.`)
  }
  if (items.includes(SOUND.item)) {
    const wired = wireSound(root, Boolean(plan.sound))
    ui.changes(wired.changes)
    if (wired.manual) ui.warn(wired.manual)
  }
  if (outcome?.conflicts.length) await settleConflicts(root, items, outcome, ui, interactive)
  if (outcome && plan.copy) await stampCopies(new Project(root), registryNames(items, plan, true), outcome, env)
  const used = await importLines(new Project(root), registryNames(items, plan, Boolean(plan.copy)), env)
  if (used.length) ui.note('Use it', used.join('\n'))
  if (plan.copy) {
    const missing = unwired(new Project(root))
    if (missing) ui.warn(missing)
  }
  return plan
}

/** Records which item each file `add` left in place came from (stamp.ts), bar the ones of yours it kept. */
async function stampCopies(project: Project, items: string[], outcome: CopyOutcome, env: NodeJS.ProcessEnv) {
  const base = aliasBase(project)
  const kept = new Set(outcome.conflicts.filter((f) => essence(project.read(f) ?? '') !== essence(outcome.incoming.get(f) ?? '')))
  const copied: { item: string; path: string }[] = []
  for (const [ref, item] of await withDependencies(items, env))
    for (const file of item.files ?? []) {
      const path = appPath(fileTarget(file), base)
      if (outcome.youj.includes(path) && !kept.has(path)) copied.push({ item: item.name ?? ref, path })
    }
  stamp(project, copied, VERSION)
}

/**
 * Files of the app's own that `add` kept in place of Youj's. Fine for a Youj
 * file you edited; not for one Youj's code needs that isn't Youj's (a shadcn
 * component) or lacks what it imports: then the app won't compile. Those are
 * replaced once you say so, or `add` stops with exit code 1 and the command.
 */
async function settleConflicts(root: string, items: string[], outcome: CopyOutcome, ui: Ui, interactive: boolean) {
  const project = new Project(root)
  // Youj's files: the ones this run put in place, and those an earlier run did (shadcn leaves an identical file untouched).
  const earlier = [...snapshot(project).keys()].filter((f) => !outcome.conflicts.includes(f) && isYoujSource(project.read(f) ?? ''))
  const broken = brokenImports(project, outcome.conflicts, [...new Set([...outcome.youj, ...earlier])], outcome.incoming)
  const kept = outcome.conflicts.filter((f) => !broken.some((b) => b.file === f))
  if (kept.length)
    ui.warn(`Kept your version of ${plural(kept.length, 'file')} that differ${kept.length === 1 ? 's' : ''} from Youj's:\n${kept.map((f) => `  ${f}`).join('\n')}\nRun again with --overwrite to replace ${kept.length === 1 ? 'it' : 'them'}.`)
  if (!broken.length) return
  const files = broken.map((b) => b.file)
  const retry = `npx @youj/cli add ${items.join(' ')} --overwrite`
  const why = `Youj's components need Youj's version of ${plural(files.length, 'file')} that you have your own of:\n${describeBroken(broken)}`
  if (interactive && (await ui.confirm(`${why}\nReplace ${files.length === 1 ? 'it' : 'them'} with Youj's now? Youj's keep shadcn's component names; check the "Coming from shadcn/ui" guide for the props that differ.`, false))) {
    for (const file of files) project.restore(file, outcome.incoming.get(file)!)
    ui.info(`Replaced ${plural(files.length, 'file')} with Youj's: ${files.join(', ')}`)
    return
  }
  throw new CliError(
    `${why}\nThey're kept as they were, so the app won't typecheck until they're replaced. Replace them with Youj's (your code that imports them keeps the same names; see the "Coming from shadcn/ui" guide for the props that differ):\n  ${retry}`,
  )
}

/**
 * What a registry app is missing for copied items to look right: the copied
 * stylesheet imported after Tailwind, and the provider. Null when it has both
 * (or the core isn't copied: then nothing of Youj's is there to style).
 */
export function unwired(project: Project): string | null {
  const framework = detectFramework(project)
  const core = findRegistryFiles(project)
  if (!framework || !core.youjCss) return null
  const entry = detectEntry(project, framework)
  const sheet = detectStylesheet(project, framework, entry)
  const css = (project.read(sheet.path) ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
  if (/@import\s+['"][^'"]*styles\/youj\.css['"]/.test(css)) return null
  const provider = framework === 'astro' || findProvider(project, entry) !== null
  return `Youj isn't wired into this app yet: ${sheet.path} doesn't import the copied youj.css and ui.css, so the items have none of Youj's tokens${
    provider ? '' : ', and nothing renders YoujProvider'
  }. Run npx @youj/cli init --mode registry: it keeps the files add copied and does the rest. Then npx @youj/cli doctor.`
}

export { fetchRegistryItem }

/** The registry items an add copies in (the ones a package ships, or sound, aren't): bare names, as the registry has them. */
function registryNames(items: string[], plan: AddPlan, copying: boolean): string[] {
  const names = copying ? items.filter((item) => !plan.fromPackage.some((p) => p.item === item) && !(item === SOUND.item && plan.sound) && !lookOfItem(item)) : (plan.copyIn ?? [])
  return names.map((item) => item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), '')).filter((item) => !/^https?:\/\//.test(item) && !item.startsWith('@'))
}

/** The item refs in a `shadcn add` command: what follows `add`, bar flags and --path's value. */
function itemRefs(command: Command): string[] {
  const args = command.args.slice(command.args.indexOf('add') + 1)
  return args.filter((arg, i) => !arg.startsWith('-') && !['--path', '-p'].includes(args[i - 1] ?? ''))
}

/** The command with each item ref swapped for its local file. */
function withLocalItems(command: Command, path: (ref: string) => string | undefined): Command {
  const refs = new Set(itemRefs(command))
  const at = command.args.indexOf('add')
  return { ...command, args: command.args.map((arg, i) => (i > at && refs.has(arg) ? (path(arg) ?? arg) : arg)) }
}

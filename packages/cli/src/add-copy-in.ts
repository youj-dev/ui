import { aliasProblems, setupAlias } from './alias'
import { packageStyles, PACKAGES, REGISTRY_NAMESPACE, VERSION, withCorePeer } from './constants'
import { exportedNames, importsOf, resolveImport } from './collisions'
import { allDeps, detectFramework, detectPackageManager, type PackageJson } from './detect'
import { installedExports } from './exports'
import { NOTICE_PATH, writeNotice } from './notice'
import { aliasBase, appPath, fileTarget, planCopyIn, writeCopyIn } from './copy-in'
import type { CopyOutcome } from './copy'
import { Project } from './project'
import type { RegistryItem } from './registry'
import { format, installCommand, type Runner } from './run'
import { stamp } from './stamp'
import { CliError, type Ui } from './ui'
import { wirePackageStyles } from './wiring'

/** Flags that show what shadcn would do and write nothing: they go through as they are, with its own output. */
export const PREVIEW_FLAGS = ['--dry-run', '--diff', '--view']
export const isFlag = (flag: string, ...names: string[]) => names.some((n) => flag === n || flag.startsWith(`${n}=`))

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * Copies blocks into an app on the package, on their own (copy-in.ts): what a
 * package ships stays in the package, and the block imports it from there.
 * Installs what the copied files need first (a Youj package, an optional peer
 * such as recharts, a library a block uses), then writes the files.
 */
export async function copyIn(root: string, items: string[], options: { preview: boolean; overwrite: boolean; flags: string[] }, runner: Runner, ui: Ui, env: NodeJS.ProcessEnv) {
  const ignored = options.flags.filter((f) => !isFlag(f, ...PREVIEW_FLAGS, '--yes', '-y', '--overwrite', '-o'))
  if (ignored.length) ui.warn(`Ignored ${ignored.join(' ')}: in an app on the package, add copies blocks in itself, where the registry places them.`)
  const pm = detectPackageManager(root, env)
  const deps = () => allDeps(new Project(root).json<PackageJson>('package.json'))
  let index = installedExports(root)
  const react = index.find((p) => p.name === PACKAGES.react)
  if (!react) throw new CliError(`${PACKAGES.react} is in package.json but not installed. Run ${pm} install, then add again.`)
  // Blocks import their own parts through @/: set it up where it's missing, once.
  const project = new Project(root)
  if (!options.preview && aliasProblems(project, detectFramework(project)).length) {
    const manual: string[] = []
    setupAlias(project, manual)
    const changes = project.commit()
    if (changes.length) {
      ui.info('Set up the @/ alias the blocks import their parts through:')
      ui.changes(changes)
    }
    const problems = aliasProblems(project, detectFramework(project))
    if (problems.length) throw new CliError([...manual, ...problems.map((p) => `${p.message}.\n  Fix: ${p.fix}`)].join('\n'))
  }
  const planning = () => ui.task(`Resolving ${items.join(', ')}`, 'Resolved', () => planCopyIn(new Project(root), items, index, deps(), env))
  let plan = await planning()
  // A dependency from a Youj package the app doesn't have yet (@youj/illustrations for a scene): install it, then plan against it.
  if (plan.missingPackages.length) {
    const install = installCommand(pm, withCorePeer(plan.missingPackages, deps()).map((name) => `${name}@^${react.version}`))
    if (options.preview) ui.note('Preview: add would first install', format(install))
    else {
      await ui.task(`Installing ${plan.missingPackages.join(', ')} (${format(install)})`, `Installed ${plan.missingPackages.join(', ')}`, () => runner(install, root))
      index = installedExports(root)
      plan = await planning()
    }
  }
  for (const { item, pkg } of plan.shipped) ui.info(`${item}: ${pkg} has it already, so there's nothing to copy`)
  const install = plan.needs.size ? installCommand(pm, [...plan.needs].map(([name, range]) => (range ? `${name}@${range}` : name))) : undefined
  if (options.preview) {
    ui.note(
      'Preview: a run without the flag would',
      [
        ...(install ? [`install ${[...plan.needs.keys()].join(', ')}: ${format(install)}`] : []),
        `copy ${plural(plan.files.length, 'file')} (${plan.copied.join(', ')}):\n${plan.files.map((f) => `  ${f.path}`).join('\n')}`,
        ...(plan.copied.length ? [`write ${NOTICE_PATH} (shadcn/ui's MIT notice), unless it's there`] : []),
        `point ${plural(plan.rewritten, 'import')} at the packages, copying nothing they ship`,
      ].join('\n'),
    )
    return
  }
  if (install) await ui.task(`Installing ${[...plan.needs.keys()].join(', ')} (${format(install)})`, `Installed ${[...plan.needs.keys()].join(', ')}`, () => runner(install, root))
  const outcome = writeCopyIn(project, plan.files, options.overwrite)
  const written = project.commit()
  stamp(project, plan.files.filter((f) => !outcome.conflicts.includes(f.path)).map((f) => ({ item: f.item.replace(new RegExp(`^${REGISTRY_NAMESPACE}/`), ''), path: f.path })), VERSION)
  const created = written.filter((c) => c.before === null)
  if (plan.copied.length) created.push(...writeNotice(project))
  if (created.length) ui.changes(created)
  if (outcome.updated.length) ui.info(`Replaced ${plural(outcome.updated.length, 'file')} (--overwrite): ${outcome.updated.join(', ')}`)
  if (outcome.unchanged) ui.info(`${plural(outcome.unchanged, 'file')} already in place, left as ${outcome.unchanged === 1 ? 'it is' : 'they are'}`)
  if (plan.fromPackages.size)
    ui.note(
      'From the packages, not copied',
      [...plan.fromPackages].map(([pkg, names]) => `${pkg}: ${names.length > 8 ? `${names.slice(0, 8).join(', ')} and ${names.length - 8} more` : names.join(', ')}`).join('\n'),
    )
  // Planned again after installing it, the plan no longer names @youj/illustrations as missing: what it copies from it is what says it needs the sheet.
  if (plan.fromPackages.has(PACKAGES.illustrations)) {
    const wired = wirePackageStyles(root, packageStyles(deps()))
    ui.changes(wired.changes)
    if (wired.manual) ui.warn(wired.manual)
  }
  if (plan.unresolved.length)
    ui.warn(`No package exports what these imports name, and no item copied has them:\n${plan.unresolved.map((s) => `  ${s}`).join('\n')}\nUpdate the Youj packages, or add the items they belong to.`)
  if (outcome.conflicts.length)
    ui.warn(
      `Kept your version of ${plural(outcome.conflicts.length, 'file')} that differ${outcome.conflicts.length === 1 ? 's' : ''} from Youj's:\n${outcome.conflicts.map((f) => `  ${f}`).join('\n')}\nRun again with --overwrite to replace ${outcome.conflicts.length === 1 ? 'it' : 'them'}.`,
    )
}

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(@\/[^'"]+)\2/g
const last = (specifier: string) => specifier.slice(specifier.lastIndexOf('/') + 1)

/** The `@/` specifiers a file imports from nowhere, or from a file that lacks a name it takes. */
function astrayImports(project: Project, file: string, content: string, base: string): Set<string> {
  const astray = new Set<string>()
  for (const { spec, names } of importsOf(content)) {
    if (!spec.startsWith('@/')) continue
    const target = resolveImport(project, file, spec, base)
    const exported = target ? exportedNames(project.read(target) ?? '') : null
    if (!target || (exported && names.some((name) => !exported.has(name)))) astray.add(spec)
  }
  return astray
}

/**
 * Puts back the imports shadcn misroutes. Adding items, it points an `@/`
 * import at the first file it's adding whose name matches the import's last
 * segment: a block's `@/blocks/app/profile/data` becomes another block's
 * `@/blocks/frame/shell/data`, `@/components/ui/data-table` (a folder) its
 * `data-table.tsx`, and a component's `@/lib/youj/settings` the settings
 * icon's `@/components/youj/icons/settings`. In the files of `items` (the ones
 * added and the Youj items they depend on), an import that differs from the
 * registry's only that way goes back to the registry's: in a file this run
 * wrote, always; in one shadcn left in place (copied by an earlier, misrouting
 * run, and not edited since), where the import leads nowhere. Returns the
 * files it fixed.
 */
export function repairImports(project: Project, items: Map<string, RegistryItem>, outcome: Pick<CopyOutcome, 'created' | 'updated' | 'conflicts'>): string[] {
  const fixed: string[] = []
  const base = aliasBase(project)
  const wrote = new Set([...outcome.created, ...outcome.updated])
  const yours = new Set(outcome.conflicts)
  for (const json of items.values()) {
    for (const file of json.files ?? []) {
      const path = appPath(fileTarget(file), base)
      const installed = yours.has(path) ? null : project.read(path)
      if (!file.content || installed === null) continue
      const want = [...file.content.matchAll(SPECIFIER)].map((m) => m[3]!)
      const astray = wrote.has(path) ? null : astrayImports(project, path, installed, base)
      let i = 0
      const repaired = installed.replace(SPECIFIER, (whole, lead: string, quote: string, got: string) => {
        const wanted = want[i++]
        return wanted && wanted !== got && last(wanted) === last(got) && (!astray || astray.has(got)) ? `${lead}${quote}${wanted}${quote}` : whole
      })
      if (i === want.length && repaired !== installed) {
        project.write(path, repaired)
        fixed.push(path)
      }
    }
  }
  return fixed
}

import { editDistance } from '../../../../apps/docs/components/icons/search'
import type { Catalog } from '../catalog'
import { code, NotFound } from '../format'
import type { Component, Loader, Miniature, Scene, ShowcaseItem } from '../types'
import { inspectProject } from './project-info'

type Item = Component | ShowcaseItem | Scene
const isScene = (item: Item): item is Scene => 'id' in item
const isComponent = (item: Item): item is Component => 'title' in item && 'exports' in item
const nameOf = (item: Item) => isScene(item) ? item.registry : isComponent(item) ? item.name : item.registry ?? item.slug
const aliases = (item: Item) => isScene(item) ? [item.registry, item.component] : isComponent(item) ? [item.name, item.title, ...item.exports] : [item.slug, item.title, item.registry ?? '']

/** Resolve only exact names (ignoring case). Suggestions never become install targets. */
export async function getAddCommand(catalog: Catalog, names: string[], cwd?: string): Promise<string> {
  const all: Item[] = [...catalog.index.components, ...catalog.index.blocks, ...catalog.index.illustrations.scenes]
  const errors: string[] = []
  const selected = new Set<Item>()
  const animations = new Set<Loader>()
  const objects = new Set<Miniature>()
  for (const name of names) {
    const key = name.trim().toLowerCase()
    // `loader-tittle`, `tittle` (when nothing else has the name) or `LoaderTittle`.
    const animation = catalog.index.loaders.find((a) => [a.registry, a.component].some((alias) => alias.toLowerCase() === key))
    if (animation) {
      animations.add(animation)
      continue
    }
    // `miniature-turntable` or `MiniatureTurntable`: npm only, so an import and no copy.
    const object = catalog.index.miniatures.find((m) => [m.registry, m.component].some((alias) => alias.toLowerCase() === key))
    if (object) {
      objects.add(object)
      continue
    }
    const found = all.filter((item) => aliases(item).some((alias) => alias.toLowerCase() === key))
    // A registry name is exact: `wizard` is the component even though the `app-setup-wizard` block's slug is also "wizard".
    const named = found.filter((item) => nameOf(item).toLowerCase() === key)
    const matches = named.length === 1 ? named : found
    if (matches.length === 1) selected.add(matches[0]!)
    else if (matches.length > 1) errors.push(`Ambiguous item "${name}". Use a registry name: ${matches.map(nameOf).join(', ')}.`)
    else {
      const close = all.map((item) => ({ item, distance: Math.min(...aliases(item).filter(Boolean).map((alias) => editDistance(key, alias.toLowerCase(), 4))) }))
        .filter(({ distance }) => distance <= 3).sort((a, b) => a.distance - b.distance).slice(0, 4).map(({ item }) => nameOf(item))
      errors.push(`Unknown item "${name}".${close.length ? ` Did you mean ${close.join(', ')}?` : ' Use search to find a component, block or illustration.'}`)
    }
  }
  if (errors.length && !selected.size && !animations.size && !objects.size) throw new NotFound(errors.join('\n'))
  // One unknown name doesn't fail the others: they get their commands, and each unknown one is said beside them.
  const skipped = errors.map((e) => `Skipped: ${e}`)

  const { project, deps, route, pm, pmKnown } = inspectProject(catalog.host.project(cwd))
  if (route === 'registry') {
    const targets = [...new Set([...[...animations].map((a) => a.registry), ...[...objects].map((m) => m.registry), ...[...selected].flatMap((item) => isScene(item) ? [item.registry] : isComponent(item) ? [item.name] : item.registry ? [item.registry] : item.stack ?? [])])]
    const unsupported = [...selected].filter((item) => !isScene(item) && !isComponent(item) && !item.registry && !item.stack?.length)
    if (unsupported.length) throw new NotFound(`No registry install for ${unsupported.map(nameOf).join(', ')}. Use get_block for source.`)
    return [code('bash', `npx youj add ${targets.join(' ')}`), ...skipped].join('\n\n')
  }

  const packages = new Set<string>()
  const imports = new Set<string>()
  const notes = new Set<string>()
  // What only the CLI copies in: blocks, the illustration scenes (each brings the kit) and the kit itself.
  const copy = new Set<string>()
  const visited = new Set<Item>()
  const add = async (item: Item): Promise<void> => {
    if (visited.has(item)) return
    visited.add(item)
    if (isScene(item)) {
      copy.add(item.registry)
      imports.add(item.importPath ? `import { ${item.component} } from '${item.importPath}'` : '')
      notes.add(`illustration ${item.id}: the package also ships it, \`<Illustration scene="${item.id}" />\` from '@youj/illustrations', without copying.`)
      return
    }
    if (isComponent(item)) {
      if (item.install.copyOnly) {
        copy.add(item.name)
        if (item.install.registryImport) imports.add(item.install.registryImport)
        return
      }
      packages.add(item.package)
      for (const peer of item.install.peerDependencies ?? []) packages.add(peer)
      if (item.install.packageImport) imports.add(item.install.packageImport)
      else if (item.install.packageStylesheet) notes.add(`${item.name}: nothing to import; add the package stylesheet once to your global CSS (\`${item.install.packageStylesheet}\`), then use its utility classes.`)
      return
    }
    if (item.registry) copy.add(item.registry)
    notes.add(`${item.kind} ${item.slug}: the CLI copies it in (${item.registry ? 'with the components it uses' : 'as the blocks it stacks'}); get_${item.kind} shows the files it writes.`)
    for (const link of item.components) {
      const component = catalog.index.components.find((c) => link.url.replace(/\/$/, '').endsWith(`/docs/${c.docs}`) || c.title === link.title)
      if (component) await add(component)
    }
    for (const name of item.stack ?? []) {
      const child = all.find((candidate) => nameOf(candidate) === name)
      if (child) await add(child)
    }
    // Sources include dependencies absent from the showcase's editorial component list.
    for (const file of item.files) {
      const source = await catalog.source(file)
      for (const match of source.matchAll(/\b(?:import|export)\s+(?:type\s+)?[^;'"\n]*?\sfrom\s*['"]([^'"]+)['"]/g)) {
        const spec = match[1]!
        const localComponent = spec.match(/(?:^|\/)components\/ui\/([^/]+)/)?.[1]?.replace(/\.[jt]sx?$/, '')
        const component = catalog.index.components.find((candidate) => candidate.name === localComponent || !candidate.install.copyOnly && !!candidate.install.packageImport?.endsWith(`from '${spec}'`) && spec !== candidate.package)
        if (component) await add(component)
        if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:')) continue
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!
        packages.add(pkg)
      }
    }
  }
  for (const item of selected) await add(item)
  for (const a of animations) {
    packages.add('@youj/loaders')
    imports.add(`import { ${a.component} } from '@youj/loaders/${a.id}'`)
    notes.add(`loader ${a.id}: the package ships it. To own the source instead, \`npx youj add ${a.registry}\` copies it into components/youj/loaders/${a.category}/${a.id}.tsx.`)
  }
  for (const m of objects) {
    packages.add('@youj/miniatures')
    imports.add(`import { ${m.component} } from '@youj/miniatures/${m.id}'`)
    notes.add(`miniature ${m.id}: npm only, each one is its own import; there is no source to copy in.`)
  }
  const needed = [...packages].filter((name) => !deps[name] && !project.installed(name)).sort()
  imports.delete('')
  return [
    needed.length ? [code('bash', `${pm} ${pm === 'npm' ? 'install' : 'add'} ${needed.join(' ')}`), ...(pmKnown ? [] : ['(npm shown because the project\'s package manager isn\'t known: use your own, e.g. `pnpm add`, `yarn add` or `bun add`.)'])].join('\n') : copy.size ? '' : 'No add command needed: dependencies are already declared or installed.',
    ...(copy.size ? [code('bash', `npx youj add ${[...copy].join(' ')}`)] : []),
    ...(imports.size ? [code('tsx', [...imports].join('\n'))] : []),
    ...notes,
    ...skipped,
  ].filter(Boolean).join('\n\n')
}

import { editDistance, indexIcons, searchIndex, type SearchIndex, type Searchable } from '../../../apps/docs/components/icons/search'
import { kebab, NotFound } from './format'
import { Searcher } from './search'
import { noProject, type ProjectFiles } from './tools/project-info'
import type { Component, DocPage, Hook, Icon, Loader, Miniature, YoujIndex, LucideIcon, Scene, ShowcaseItem } from './types'

/** What the catalog needs from where it runs: the local server reads the disk, the remote Worker its static assets and no app. */
export interface Host {
  /** The app in `cwd` (default: where the server started), for the tools that inspect a project. */
  project(cwd?: string): ProjectFiles
  /** Whether a tool-supplied `cwd` stays inside where the server started. */
  insideCwd(value: string): boolean
  /** The Youj version the app in `cwd` has installed, if any. */
  installedVersion(cwd?: string): string | undefined
  /** The text of a block file, by install path. */
  source(file: string): Promise<string | undefined>
}

/** No app and no files. */
export const bareHost: Host = {
  project: () => noProject,
  insideCwd: () => true,
  installedVersion: () => undefined,
  source: async () => undefined,
}

/* The index with its lookups and search indexes, built once per server. */

export type Kind = 'component' | 'block' | 'icon' | 'illustration' | 'miniature' | 'loader' | 'hook' | 'docs'

export type Hit =
  | { kind: 'component'; item: Component }
  | { kind: 'block'; item: ShowcaseItem }
  | { kind: 'icon'; item: Icon }
  | { kind: 'illustration'; item: Scene }
  | { kind: 'miniature'; item: Miniature }
  | { kind: 'loader'; item: Loader }
  | { kind: 'hook'; item: Hook }
  | { kind: 'docs'; item: DocPage }

export type AnyIcon = ({ source: 'youj' } & Icon) | ({ source: 'lucide' } & LucideIcon)

export interface Pair {
  from: AnyIcon
  to: AnyIcon
}

/** The explorer's own description of an icon for search, plus a state icon's two states. */
const describeIcon = (icon: AnyIcon): Searchable =>
  icon.source === 'youj'
    ? { name: icon.name, keywords: [...icon.keywords, ...(icon.states ?? [])], category: icon.category, description: icon.description }
    : { name: icon.name, keywords: icon.keywords }

const headings = (markdown: string) => [...markdown.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1]).join(' ')

export class Catalog {
  readonly components = new Map<string, Component>()
  readonly icons: AnyIcon[]
  readonly scenes = new Map<string, Scene>()
  private categoryNames = new Map<string, string>()
  private byExport = new Map<string, Component>()
  private entities: Searcher<Hit>
  private iconIndex: SearchIndex<AnyIcon>
  private pairIndex: SearchIndex<Pair>
  readonly pairs: Pair[]

  private sourceCache = new Map<string, Promise<string>>()

  constructor(readonly index: YoujIndex, readonly host: Host = bareHost) {
    for (const c of index.components) {
      this.components.set(c.name, c)
      for (const name of c.exports) if (!this.byExport.has(name)) this.byExport.set(name, c)
    }
    for (const c of index.illustrations.categories) this.categoryNames.set(c.id, c.name)
    for (const scene of index.illustrations.scenes) this.scenes.set(scene.id, scene)
    const youj: AnyIcon[] = index.icons.map((i) => ({ source: 'youj', ...i }))
    const lucide: AnyIcon[] = index.lucide.map((i) => ({ source: 'lucide', ...i }))
    this.icons = [...youj, ...lucide]
    const vocabulary = youj.map(describeIcon)
    this.iconIndex = indexIcons(this.icons, describeIcon, vocabulary)
    const byName = (list: AnyIcon[]) => new Map(list.map((i) => [i.name, i]))
    const k = byName(youj)
    const l = byName(lucide)
    this.pairs = [
      ...index.pairs.youj.map(([a, b]) => ({ from: k.get(a)!, to: k.get(b)! })),
      ...index.pairs.lucide.map(([a, b]) => ({ from: l.get(a)!, to: l.get(b)! })),
    ].filter((p) => p.from && p.to)
    this.pairIndex = indexIcons(this.pairs, (p) => ({ name: p.from.name, keywords: [p.to.name, ...p.from.keywords, ...p.to.keywords] }), vocabulary)

    this.entities = new Searcher<Hit>([
      ...index.components.map((c) => ({
        item: { kind: 'component', item: c } as Hit,
        fields: [
          [`${c.title} ${c.name}`, 4],
          [c.description, 2],
          [`${c.exports.join(' ')} ${c.category}`, 1.2],
          [c.intro ?? '', 0.8],
          [c.related.map((r) => r.title).join(' '), 0.4],
        ] as [string, number][],
        boost: 1.1,
      })),
      ...index.blocks.map((s) => ({
        item: { kind: s.kind, item: s } as Hit,
        fields: [
          [`${s.title} ${s.slug}`, 4],
          [`${s.group ?? ''} ${s.summary}`, 1.5],
          [s.description, 0.8],
          [s.components.map((c) => c.title).join(' '), 0.4],
        ] as [string, number][],
      })),
      ...index.icons.map((i) => ({
        item: { kind: 'icon', item: i } as Hit,
        fields: [
          [`${i.name} ${i.component}`, 3],
          [`${i.keywords.join(' ')} ${(i.states ?? []).join(' ')}`, 1.5],
          [`${i.category} ${i.description}`, 0.5],
        ] as [string, number][],
        boost: 0.75,
      })),
      ...index.illustrations.scenes.map((scene) => ({
        item: { kind: 'illustration', item: scene } as Hit,
        fields: [
          [`${scene.name} ${scene.id} ${scene.component}`, 4],
          [`${scene.tags.join(' ')} ${this.categoryName(scene.category)}`, 2],
          [scene.description, 0.6],
        ] as [string, number][],
        boost: 0.9,
      })),
      ...index.miniatures.map((m) => ({
        item: { kind: 'miniature', item: m } as Hit,
        fields: [
          [`${m.title} ${m.id} ${m.component}`, 4],
          [`${m.tags.join(' ')} ${m.category}`, 2],
          [m.description, 0.6],
        ] as [string, number][],
        boost: 0.9,
      })),
      ...index.loaders.map((a) => ({
        item: { kind: 'loader', item: a } as Hit,
        fields: [
          [`${a.title} ${a.id} ${a.component}`, 4],
          [`${a.tags.join(' ')} ${a.categoryTitle} ${a.technique}`, 2],
          [a.description, 0.6],
        ] as [string, number][],
        boost: 0.9,
      })),
      ...index.hooks.map((h) => ({
        item: { kind: 'hook', item: h } as Hit,
        fields: [
          [h.name, 4],
          [h.description, 1.2],
        ] as [string, number][],
        boost: 0.85,
      })),
      ...index.docs
        .filter((d) => !index.components.some((c) => c.docs === d.slug))
        .map((d) => ({
          item: { kind: 'docs', item: d } as Hit,
          fields: [
            [d.title, 4],
            [d.description ?? '', 2],
            [headings(d.markdown), 0.8],
          ] as [string, number][],
          boost: 0.8,
        })),
    ])
  }

  /**
   * "settings page", "login screen": a word for a whole screen says to prefer
   * blocks, and isn't itself something to match. An icon named
   * exactly what was asked (`bell`) leads its variants (bell-dot, bell-plus…).
   */
  search(query: string, kinds: Kind[] | undefined, limit: number) {
    const screen = /\b(page|screen)s?\b/i
    const rest = query.replace(screen, ' ').trim()
    const wantsScreen = screen.test(query) && rest.length > 0
    const named = query.trim().toLowerCase().replace(/\s+/g, '-')
    return this.entities.search(
      wantsScreen ? rest : query,
      limit,
      kinds?.length ? (hit) => kinds.includes(hit.kind) : undefined,
      (hit) => (wantsScreen && hit.kind === 'block' ? 1.5 : 1) * (hit.kind === 'icon' && hit.item.name === named ? 1.2 : 1),
    )
  }

  /** A component by registry name (`alert-dialog`), title (`Alert Dialog`) or export (`AlertDialogContent`). */
  component(name: string): { component: Component; part?: string } {
    const direct = this.components.get(name) ?? this.components.get(kebab(name.trim()))
    if (direct) return { component: direct }
    const byExport = this.byExport.get(name.trim())
    if (byExport) return { component: byExport, part: name.trim() }
    const lower = name.trim().toLowerCase()
    for (const c of this.components.values()) if (c.title.toLowerCase() === lower) return { component: c }
    const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const typo = [...this.components.keys()].filter((key) => editDistance(squash(name), squash(key), 3) <= 3)
    const close = [...new Set([...typo, ...this.search(name, ['component'], 3).map((h) => (h.item.item as Component).name)])].slice(0, 4)
    throw new NotFound(`No component "${name}".${close.length ? ` Did you mean ${close.map((c) => `"${c}"`).join(', ')}?` : ''} Use search to find one.`)
  }

  categoryName(id: string): string {
    return this.categoryNames.get(id) ?? id
  }

  /** A scene by its registry name (`illustration-coffee`) or export (`IllustrationCoffee`). */
  scene(name: string): Scene | undefined {
    const key = name.trim()
    const kebabbed = kebab(key)
    return this.index.illustrations.scenes.find((s) => s.registry === key || s.registry === kebabbed || s.component === key)
  }

  searchIcons(query: string): AnyIcon[] {
    return searchIndex(this.iconIndex, query)
  }

  searchPairs(query: string): Pair[] {
    return searchIndex(this.pairIndex, query)
  }

  /** An icon by name (`bell-off`), export (`BellOffIcon`, lucide's `BellOff`) or `lucide:<name>`. */
  icon(name: string): AnyIcon {
    const raw = name.trim()
    const lucideOnly = raw.startsWith('lucide:')
    const key = raw.replace(/^lucide:/, '')
    const bare = kebab(key.replace(/Icon$/, ''))
    const found =
      (!lucideOnly && this.icons.find((i) => i.source === 'youj' && (i.name === key || i.component === key || i.name === bare))) ||
      this.icons.find((i) => i.source === 'lucide' && (i.name === key || i.component === key || i.name === bare))
    if (found) return found
    const close = this.searchIcons(key).slice(0, 4)
    throw new NotFound(`No icon "${name}".${close.length ? ` Closest: ${close.map((i) => i.name).join(', ')}.` : ''} Use search_icons to find one.`)
  }

  block(slug: string): ShowcaseItem {
    const key = kebab(slug.trim())
    const found = this.index.blocks.find((s) => s.slug === key || s.registry === key || s.title.toLowerCase() === slug.trim().toLowerCase())
    if (found) return found
    throw new NotFound(`No block "${slug}". list_blocks lists them.`)
  }

  /** A block file by install path ('' when there is none), read on first use and kept for the life of the server. */
  source(file: string): Promise<string> {
    let text = this.sourceCache.get(file)
    if (!text) {
      text = this.host.source(file).then((value) => value ?? '')
      this.sourceCache.set(file, text)
    }
    return text
  }

  doc(slug: string): DocPage | undefined {
    const key = slug.replace(/^\/?(docs\/?)?/, '').replace(/\.md$/, '').replace(/\/$/, '')
    return this.index.docs.find((d) => d.slug === key)
  }
}

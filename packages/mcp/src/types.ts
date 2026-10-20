/* The index the server answers from: generated at build time from the
 * workspace (scripts/collect.ts) into data/*.json, and shipped with the
 * package, so it works offline and matches the version it was built with. */

export interface PropDoc {
  name: string
  type: string
  values?: string[]
  required: boolean
  default?: string
  description?: string
  /** Its JSDoc `@deprecated` text, when it's on its way out. */
  deprecated?: string
}

export interface ComponentDoc {
  name: string
  props: PropDoc[]
  extends?: string[]
}

export interface MotionRow {
  moment: string
  duration?: string
  ease?: string
  spring?: string
  stagger?: string
  value?: string
  note?: string
}

interface InstallBase {
  registryCommand: string
  registryDeps: string[]
  /** Optional peers of the package the component needs, which `packageCommand` installs: `recharts`. */
  peerDependencies?: string[]
}

/** The package installs it. */
export interface PackageInstall extends InstallBase {
  copyOnly?: false
  packageCommand: string
  /** Absent for a stylesheet-only item (youj-presets): there's nothing to import. */
  packageImport?: string
  /** A stylesheet-only item's way in: `@import '@youj/core/styles.css'`. */
  packageStylesheet?: string
}

/** Only `npx youj add` installs it: the package doesn't export it (the illustration kit). */
export interface CopyInstall extends InstallBase {
  copyOnly: true
  /** The import from the path the CLI writes, when it has one. */
  registryImport?: string
}

export type Install = PackageInstall | CopyInstall

/** How settled it is (stability.json; the rule is on /docs/versioning). */
export type Stability = 'stable' | 'alpha' | 'experimental'

/** Its rung on the ladder (taxonomy.json), bottom to top: components come from a package, the rest are copied in. */
export type Level = 'component' | 'card' | 'section' | 'frame' | 'screen'

/** What a component is made of: one control, surface, mark or effect, or several cooperating parts or a model. */
export type Complexity = 'simple' | 'composite'

export interface Link {
  title: string
  url: string
  note?: string
}

export interface Component {
  /** Registry item name: `button`, `reveal`, `icon-swap`. */
  name: string
  title: string
  /** The package that ships it: `@youj/react`, `@youj/core`, `@youj/motion`, `@youj/icons`, `@youj/illustrations` or `@youj/sound`. */
  package: string
  /** UI component, core (the provider, tokens, themes and presets), motion (effect, interaction, background, player, icon tool, preset), or sound (the provider that plays the components' cues). */
  kind: 'ui' | 'core' | 'motion' | 'sound'
  /** Docs folder: `forms`, `overlays`, `layout`, `effects`… */
  category: string
  description: string
  /** The docs page's slug: `components/button`. */
  docs?: string
  /** Component exports of its main file, the main one first. */
  exports: string[]
  install: Install
  /** The page's opening: what it's for, and what to use instead. */
  intro?: string
  usage?: string
  a11y?: string
  reduced?: string
  motion?: MotionRow[]
  related: Link[]
  dependencies: string[]
  stability: Stability
  /** Its level, when it's on the ladder (a component the docs list under Components). */
  level?: Level
  /** A component's complexity, when it's on the ladder. */
  complexity?: Complexity
  /** Its category within that level (`form-controls`), not the docs folder `category`. */
  levelCategory?: string
}

export interface Hook {
  name: string
  import: string
  signature: string
  description: string
  docs?: string
  /** Registry item that copies it, when it has one of its own. */
  registry?: string
}

export interface ShowcaseItem {
  kind: 'block'
  slug: string
  title: string
  group?: string
  summary: string
  description: string
  /** Registry item: `auth-login`. */
  registry?: string
  /** Blocks a composition installs as. */
  stack?: string[]
  components: Link[]
  /** The files `youj add` writes, as it writes them (`blocks/app/customers.tsx`, under `src/` in an app that has one); none for a composition that installs its blocks. */
  files: string[]
  /** Its own theme, from its story. */
  theme?: { preset?: string; theme?: string; accent?: string }
  url: string
  stability: Stability
  /** Its level: a block is a card, section, frame or screen. */
  level: Level
  /** Its category within that level: `status-and-health`. */
  category: string
}

/** One of the loaders (`@youj/loaders`): the registry item `loader-<id>`, imported as `Loader<Name>`. */
export interface Loader {
  /** `tittle`. */
  id: string
  /** `Tittle`. */
  title: string
  /** `LoaderTittle`. */
  component: string
  /** `software`, `depth`… */
  category: string
  categoryTitle: string
  technique: string
  tags: string[]
  description: string
  /** `loader-tittle`. */
  registry: string
}

/** One miniature (`@youj/miniatures`): npm only, imported from `@youj/miniatures/<id>`; `youj add miniature-<id>` prints the install. */
export interface Miniature {
  id: string
  title: string
  component: string
  category: string
  tags: string[]
  description: string
  /** `miniature-turntable`. */
  registry: string
}

/** One ready-made illustration: the registry item `illustration-<id>`. */
export interface Scene {
  /** `coffee`. */
  id: string
  /** `Coffee`. */
  name: string
  /** A category id: `food`. */
  category: string
  tags: string[]
  /** The export name: `IllustrationCoffee`. */
  component: string
  /** What the scene shows. */
  description: string
  /** `illustration-coffee`. */
  registry: string
  /** Where the copied scene is imported from: `@/components/youj/graphics/illustrations/scenes/coffee`. */
  importPath?: string
}

export interface Icon {
  /** `bell`, `loader-ring`. */
  name: string
  /** `BellIcon`. */
  component: string
  category: string
  keywords: string[]
  /** [rest, active] labels for state icons that morph. */
  states?: [string, string]
  defaultTrigger: 'hover' | 'mount' | 'loop' | 'none'
  /** The choreography, from its doc comment. */
  description: string
}

export interface LucideIcon {
  name: string
  component: string
  keywords: string[]
}

export interface Note {
  id: string
  note: string
}

export interface DocPage {
  /** `components/button`, `` for the docs home. */
  slug: string
  url: string
  title: string
  description?: string
  section: string
  markdown: string
}

export interface UiTokens {
  radius: Record<string, string>
  control: Record<string, string>
  text: Record<string, { size: string; lineHeight?: string }>
}

export interface Meta {
  /** Index format. */
  schema: 1
  /** The Youj version this index describes (the packages release together). */
  version: string
  site: string
  registry: string
}

export interface YoujIndex {
  meta: Meta
  components: Component[]
  /** The ready-made scenes, and the categories they're listed under in the explorer's order. */
  illustrations: { categories: { id: string; name: string }[]; scenes: Scene[] }
  /** The loaders (`@youj/loaders`), in gallery order. */
  loaders: Loader[]
  /** The miniatures (`@youj/miniatures`). */
  miniatures: Miniature[]
  props: Record<string, ComponentDoc>
  hooks: Hook[]
  blocks: ShowcaseItem[]
  icons: Icon[]
  lucide: LucideIcon[]
  /** Swap pairs the explorer offers: Youj with Youj, lucide with lucide. */
  pairs: { youj: [string, string][]; lucide: [string, string][] }
  effects: Note[]
  transitions: Note[]
  uiTokens: UiTokens
  docs: DocPage[]
}

/** What `collect` returns: the index, plus the block files by install path. data/sources/ keeps one file each, so they load on demand. */
export type CollectedIndex = YoujIndex & { sources: Record<string, string> }

/** The index is split into these files under data/, so a docs edit touches one. */
export const INDEX_FILES = {
  meta: 'meta.json',
  components: 'components.json',
  illustrations: 'illustrations.json',
  loaders: 'loaders.json',
  miniatures: 'miniatures.json',
  props: 'props.json',
  hooks: 'hooks.json',
  blocks: 'blocks.json',
  icons: 'icons.json',
  lucide: 'lucide.json',
  pairs: 'pairs.json',
  effects: 'effects.json',
  transitions: 'transitions.json',
  uiTokens: 'ui-tokens.json',
  docs: 'docs.json',
} as const satisfies Record<keyof YoujIndex, string>

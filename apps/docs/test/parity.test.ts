// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blockDocsUrls } from '@/lib/block-docs'
import { blocks, docsUrl, pageFor } from '@/lib/showcase'
import { readLoops } from '@/components/landing/promo-video'

/* Parity with what ships: every public UI component, block and motion
 * export has a place on the site. Storybook alone isn't documentation. When
 * this fails, write the page (or the story); the allowlists are only for
 * internals, each with the reason it has no page. */

const app = fileURLToPath(new URL('..', import.meta.url))
const packages = join(app, '../../packages')
const content = join(app, 'content/docs')

interface Item {
  name: string
  type?: string
  files?: { path: string }[]
  meta?: { scene?: string; component?: string; hidden?: boolean }
}

const registry = (pkg: string): Item[] =>
  readdirSync(join(packages, pkg, 'registry'))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(packages, pkg, 'registry', f), 'utf8')) as Item[])

const ui = registry('ui')
// Core's and motion's items and the icons' and illustrations' (their own packages, documented alongside).
const motion = [...registry('core'), ...registry('motion'), ...registry('icons'), ...registry('illustrations')]
const mdx = (readdirSync(content, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx'))
const allText = mdx.map((f) => readFileSync(join(content, f), 'utf8')).join('\n')
const folders = [...new Set(mdx.map((f) => dirname(f)))].filter((dir) => dir !== '.')

/** A folder's meta.json: the sidebar's order, and the page that stands for a group. */
function metaOf(dir: string): { pages?: string[]; pagesIndex?: string } | undefined {
  const file = join(content, dir, 'meta.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined
}

/** Every page a meta.json names, as its path under content/docs: its own folder's pages, or another's reached through `../` (the sidebar's groups). */
const named = new Set(
  (readdirSync(content, { recursive: true }) as string[])
    .filter((f) => basename(f) === 'meta.json')
    .flatMap((f) => {
      const meta = JSON.parse(readFileSync(join(content, f), 'utf8')) as { pages?: string[]; pagesIndex?: string }
      return [...(meta.pages ?? []), ...(meta.pagesIndex ? [meta.pagesIndex] : [])]
        .filter((item) => !/^(---|\.\.\.|\[|\()/.test(item))
        .map((item) => posix.join(dirname(f), item))
    }),
)

/** Pages that are in no sidebar, and where a reader finds them instead. */
const OUT_OF_SIDEBAR: Record<string, string> = {
  'motion/playground': 'a card on the Motion overview',
}

/** UI registry items with no page of their own, and why. */
const UI_ALLOWLIST: Record<string, string> = {
  'youj-ui-core': 'the shared cn() and ui.css every item installs; covered by Installation and Theming',
  'youj-look-bezel': 'the Bezel style’s stylesheet, not a component; covered by Styles',
  'youj-shadcn-compat': 'the opt-in shadcn alias sheet, not a component; the Theming page covers it once rewritten (token phase 6.5)',
  'use-announcer': 'internal hook behind the live-region announcements components make',
  'use-controllable-state': 'internal hook for controlled/uncontrolled props',
  'use-mobile': 'internal breakpoint hook the responsive components share',
  'use-now': 'internal clock behind hydration-safe relative times; the behavior is covered by Installation',
  'use-visible': 'internal hook that pauses a block’s timers while it is off screen or its tab is hidden',
  'use-resize-measure': 'internal hook the measuring components share: measure an element now and on every resize',
  'use-stroke': 'internal ink engine SignaturePad and Whiteboard share: pointer samples to smoothed strokes of varying width',
  'use-audio-meter': 'internal Web Audio analyzer VoiceOrb and AudioRecorder share: the level and bands of a stream, element or node',
}

/** Motion registry items with no page of their own, and why. */
const MOTION_ALLOWLIST: Record<string, string> = {
  'youj-core': 'the tokens and provider; covered by Motion principles and Motion in your components',
  'youj-presets': 'the CSS presets; covered by /docs/motion/presets',
  'youj-labels': 'useLabels and defaultLabels; covered by /docs/guides/i18n',
  'youj-gl': 'the WebGL loop the backgrounds share; not used on its own',
  'player-env': 'internal environment hook of the Lottie player',
  'lottie-samples': 'sample animation files for the player demos',
  entrance: 'the shared runtime of the entrance effects (Blueprint); not used on its own',
  'settled-entrances': 'a scope the docs site wraps blocks in so their entrances render settled; not a component of its own',
}

/** Value exports of motion's entries that no page names, and why. */
const MOTION_EXPORT_ALLOWLIST: Record<string, string> = {
  themeCss: 'theme serialization helper behind ThemeScope; the Theming page covers the contract',
  themeVars: 'theme serialization helper behind ThemeScope',
  deriveTheme: 'the JS mirror of the CSS derivation, used by the theme builder',
  presetById: 'lookup over the presets the Theming page lists',
  graphite: 'a preset object; the Theming page shows every preset by name',
  revealVariants: 'the variant table behind Reveal’s `variant` prop',
  revealVariantNames: 'the variant names behind Reveal’s `variant` prop',
  staggerRanks: 'the ordering helper behind Stagger’s `order` prop',
  SettledEntrances: 'the scope the docs site wraps blocks in so their entrances render settled',
}

/**
 * The scenes' own components (`IllustrationCoffee`), each documented by its
 * card in the illustrations explorer, which reads them from the registry. Only
 * a name a scene's own item (`illustration-<id>`) declares, and that item's
 * scene file exports, counts, so this can't hide any other export.
 */
const EXPLORER = join(app, 'app/illustrations/page.tsx')
const SCENE_COMPONENTS = new Set(
  existsSync(EXPLORER)
    ? motion.flatMap((item) => {
        const { scene, component } = item.meta ?? {}
        const file = `src/components/youj/graphics/illustrations/scenes/${scene}.tsx`
        if (!scene || !component || item.name !== `illustration-${scene}` || item.files?.[0]?.path !== file) return []
        return new RegExp(`^export function ${component}\\(`, 'm').test(readFileSync(join(packages, 'illustrations', file), 'utf8')) ? [component] : []
      })
    : [],
)

describe('docs parity', () => {
  it('has a page for every UI component', () => {
    const missing = ui
      // Blocks have their own docs pages.
      .filter((i) => i.type !== 'registry:block' && i.type !== 'registry:example' && !(i.name in UI_ALLOWLIST))
      .filter((i) => !pageFor(i.name))
      .map((i) => i.name)
    expect(missing).toEqual([])
  })

  it('has a page for every motion component', () => {
    // The set's own icons (icon-<name>) are pages of one gallery, /docs/icons.
    const missing = motion
      .filter((i) => !(i.name.startsWith('icon-') && i.files?.[0]?.path.includes('/icons/')) && !(i.name in MOTION_ALLOWLIST))
      // The language packs (youj-locale-de…) are listed together on /docs/guides/i18n.
      .filter((i) => !i.name.startsWith('youj-locale-'))
      // Each component's English strings (youj-labels-<component>) arrive with it; the i18n guide names the pattern.
      .filter((i) => !(i.name.startsWith('youj-labels-') && allText.includes('youj-labels-<component>')))
      // So are the themes' stylesheets and the check (youj-theme-…), on /docs/theming.
      .filter((i) => !i.name.startsWith('youj-theme-'))
      // And the palettes' and styles' stylesheets (youj-palettes, youj-styles), on the same page.
      .filter((i) => !(i.name === 'youj-palettes' || i.name === 'youj-styles'))
      // Each scene's own item (illustration-<id>) installs from the Illustrations overview and the explorer; the kit they share has Draw your own.
      .filter((i) => !(i.name.startsWith('illustration-') && pageFor('illustrations') && allText.includes('illustration-<id>') && allText.includes('illustration-kit')))
      // So does each loader's (loader-<id>), from the Loaders overview and the gallery, with the kit they share.
      .filter((i) => !(i.name.startsWith('loader-') && pageFor('loaders') && allText.includes('loader-<id>') && allText.includes('loader-kit')))
      .filter((i) => !pageFor(i.name))
      .map((i) => i.name)
    expect(missing).toEqual([])
  })

  it('names every value motion exports on some page', () => {
    const missing = ['motion/src/index.ts', 'motion/src/interactions.ts', 'motion/src/backgrounds.ts', 'motion/src/players.ts', 'illustrations/src/index.ts'].flatMap((entry) => {
      const source = readFileSync(join(packages, entry), 'utf8')
      return [...source.matchAll(/export\s*\{([^}]*)\}/g)]
        .flatMap((m) => m[1]!.split(','))
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('type '))
        .map((s) => s.split(/\s+as\s+/).at(-1)!)
        // The scenes' components are documented by the explorer (SCENE_COMPONENTS).
        .filter((id) => !(entry === 'illustrations/src/index.ts' && SCENE_COMPONENTS.has(id)))
        .filter((id) => !(id in MOTION_EXPORT_ALLOWLIST) && !new RegExp(`\\b${id}\\b`).test(allText))
    })
    expect(missing).toEqual([])
  })

  it('leaves to the explorer only the scene components the registry declares', () => {
    const scenes = motion.filter((item) => item.meta?.scene && item.name === `illustration-${item.meta.scene}`)
    expect(scenes.length).toBeGreaterThan(100)
    // Every scene item names a component its own file exports, and nothing else is exempt.
    expect(SCENE_COMPONENTS.size).toBe(scenes.length)
    for (const name of SCENE_COMPONENTS) expect(name).toMatch(/^Illustration[A-Z]\w+$/)
    for (const other of ['Illustration', 'IllustrationStage', 'IsoScene', 'illustrations']) expect(SCENE_COMPONENTS.has(other)).toBe(false)
    // And each is a real export of @youj/illustrations.
    const graphics = readFileSync(join(packages, 'illustrations/src/index.ts'), 'utf8')
    for (const name of SCENE_COMPONENTS) expect(graphics).toMatch(new RegExp(`\\b${name}\\b`))
  })

  it('has a page for every sound item, and names every value the sound package exports', () => {
    expect(registry('sound').filter((i) => !pageFor(i.name)).map((i) => i.name)).toEqual([])
    const exportsOf = (file: string) =>
      [...readFileSync(join(packages, 'sound/src', file), 'utf8').matchAll(/export\s*\{([^}]*)\}/g)]
        .flatMap((m) => m[1]!.split(','))
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('type '))
        .map((s) => s.split(/\s+as\s+/).at(-1)!)
    const missing = [...exportsOf('index.ts'), ...exportsOf('packs/index.ts')].filter((id) => !new RegExp(`\\b${id}\\b`).test(allText))
    expect(missing).toEqual([])
  })

  it('keeps every allowlisted name real', () => {
    const names = new Set([...ui, ...motion].map((i) => i.name))
    expect(Object.keys({ ...UI_ALLOWLIST, ...MOTION_ALLOWLIST }).filter((n) => !names.has(n))).toEqual([])
  })

  it('shows every block, from a story, in a docs story of its own', () => {
    const shown = new Set(blocks().filter((b) => b.stories.length > 0).map((b) => b.slug))
    // Hidden blocks (taxonomy.json) keep their source and registry item but have no page.
    expect(ui.filter((i) => i.type === 'registry:block' && !i.meta?.hidden && !shown.has(i.name)).map((i) => i.name)).toEqual([])
    // A block's only page is its story on a Blocks docs page (lib/block-docs.ts), its own parts (the auth pages) included.
    // The frame's parts are Create's: chosen there, never browsed, so they have no page.
    const documented = blockDocsUrls()
    expect(blocks().filter((b) => b.level !== 'frame' && !documented[b.slug]).map((b) => b.slug)).toEqual([])
    expect(blocks().filter((b) => b.level === 'frame' && documented[b.slug]).map((b) => b.slug)).toEqual([])
  })

  it('keeps frontmatter parseable', () => {
    // An unquoted value with ": " in it is a YAML mapping error, and one bad page fails every page of the site.
    const bad = mdx.flatMap((file) => {
      const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(content, file), 'utf8'))?.[1]
      if (front === undefined) return [`${file}: no frontmatter`]
      return front
        .split('\n')
        .filter((line) => /^\w+:\s+[^'"\s|>]/.test(line) && /:\s/.test(line.replace(/^\w+:\s+/, '')))
        .map((line) => `${file}: ${line}`)
    })
    expect(bad).toEqual([])
  })

  it('follows every topic loop with a few words of text, before the next picture or preview', () => {
    // A loop straight into a graphic or a preview reads as one bunched picture; a paragraph gives the page a break.
    const bunched = mdx.flatMap((file) => {
      const text = readFileSync(join(content, file), 'utf8')
      const at = text.indexOf('<TopicLoop')
      if (at === -1) return []
      const next = text.slice(text.indexOf('\n', at) + 1).split(/\n\s*\n/).map((block) => block.trim()).find(Boolean) ?? ''
      return /^(<|\{|#|\||-|>|```)/.test(next) || !/[a-z]{3}/i.test(next) ? [`${file}: ${next.split('\n')[0]}`] : []
    })
    expect(mdx.filter((file) => readFileSync(join(content, file), 'utf8').includes('<TopicLoop')).length).toBeGreaterThan(0)
    expect(bunched).toEqual([])
  })

  it('names only topic loops that are published, so no page asks for a film and shows nothing', () => {
    // MDX isn't typechecked: a topic the manifest doesn't carry would render an empty slot without a word.
    const loops = readLoops()
    const missing = mdx.flatMap((file) =>
      [...readFileSync(join(content, file), 'utf8').matchAll(/<TopicLoop\s+topic="([^"]+)"/g)]
        .map((m) => m[1]!)
        .filter((topic) => !(topic in loops))
        .map((topic) => `${file}: ${topic}`),
    )
    expect(missing).toEqual([])
  })

  it('lists every page in its folder’s sidebar', () => {
    // A folder whose meta.json lists pages hides any page it leaves out, unless it spreads the rest ("...")
    // or another folder's meta.json names it (the sidebar's groups, which list pages by `../path`).
    const hidden = mdx.filter((file) => {
      const meta = metaOf(dirname(file))
      const name = basename(file, '.mdx')
      const path = file.replace(/\.mdx$/, '')
      return meta?.pages !== undefined && name !== 'index' && name !== meta.pagesIndex && !named.has(path) && !meta.pages.includes('...') && !(path in OUT_OF_SIDEBAR)
    })
    expect(hidden).toEqual([])
  })

  it('gives a component group no page of its own: the sidebar heading opens and closes it', () => {
    // components/(forms)/ holds components only.
    const groups = folders.filter((dir) => /^components\/\(.+\)$/.test(dir))
    expect(groups.length).toBeGreaterThanOrEqual(12)
    const own = groups.filter((dir) => metaOf(dir)?.pagesIndex !== undefined || existsSync(join(content, dir, `${basename(dir).slice(1, -1)}.mdx`)))
    expect(own).toEqual([])
  })

  it('names the own page of a motion group after its folder', () => {
    // motion/(primitives)/primitives.mdx: the sidebar row and the overview find a group's page this way.
    const groups = folders.filter((dir) => /(^|\/)\(.+\)$/.test(dir) && !dir.startsWith('components/') && !dir.startsWith('blocks/'))
    const wrong = groups.filter((dir) => {
      const name = basename(dir).slice(1, -1)
      return metaOf(dir)?.pagesIndex !== name || !existsSync(join(content, dir, `${name}.mdx`))
    })
    expect(wrong).toEqual([])
  })

  it('shows every page of a group on the group’s own page', () => {
    // A group page is where the sidebar's group row leads; a page it doesn't show is one a reader can't find from there.
    const missing = folders
      .filter((dir) => metaOf(dir)?.pagesIndex)
      .flatMap((dir) => {
        const own = metaOf(dir)!.pagesIndex!
        const text = readFileSync(join(content, dir, `${own}.mdx`), 'utf8')
        return mdx
          .filter((file) => dirname(file) === dir && basename(file, '.mdx') !== own)
          .map((file) => docsUrl(file))
          .filter((url) => !text.includes(`href="${url}"`))
          .map((url) => `${dir}: ${url}`)
      })
    expect(missing).toEqual([])
  })

  it('keeps New for a few new capabilities, and never on the parts of one', () => {
    // A badge on everything marks nothing. New is a spotlight: a family, a tool or a guide, cleared at the next release.
    const status = (file: string) => /^status:\s*(\w+)/m.exec(/^---\n([\s\S]*?)\n---/.exec(readFileSync(join(content, file), 'utf8'))?.[1] ?? '')?.[1]
    const fresh = mdx.filter((file) => status(file) === 'new')
    expect(fresh.length).toBeLessThanOrEqual(8)
    // The page that stands for a folder: its index, or a group's own page.
    const own = (dir: string) => join(dir, `${metaOf(dir)?.pagesIndex ?? 'index'}.mdx`)
    const parts = fresh.filter((file) => own(dirname(file)) !== file && mdx.includes(own(dirname(file))) && status(own(dirname(file))) === 'new')
    expect(parts).toEqual([])
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { Catalog } from '../src/catalog'
import { loadCatalog, loadIndex } from '../src/data'
import { stem } from '../src/search'
import { getAddCommand } from '../src/tools/add'
import { getComponent, search } from '../src/tools/components'
import { getIcon, parsePair, searchIcons, suggestIconMorph } from '../src/tools/icons'
import { motionGuidance, RECIPES } from '../src/tools/motion'
import { checkSetup, setup } from '../src/tools/setup'
import { getShowcase, listShowcase, SOURCE_PAGE } from '../src/tools/showcase'
import { createTheme, getTokens } from '../src/tools/theme'

let catalog: Catalog
beforeAll(() => {
  catalog = loadCatalog()
})

/** The names of the top results, in order. */
const top = (query: string, n: number, kinds?: Parameters<Catalog['search']>[1]) =>
  catalog.search(query, kinds, n).map((h) => `${h.item.kind}:${'name' in h.item.item ? h.item.item.name : 'slug' in h.item.item ? h.item.item.slug : h.item.item.id}`)

describe('search', () => {
  it('stems words so their forms meet', () => {
    expect(stem('deleting')).toBe(stem('delete'))
    expect(stem('confirmation')).toBe(stem('confirm'))
    expect(stem('settings')).toBe(stem('setting'))
    expect(stem('reorders')).toBe(stem('reorder'))
  })

  it('finds the spinner for "loading spinner"', () => {
    const hits = top('loading spinner', 8)
    expect(hits[0]).toBe('component:spinner')
    expect(top('loading spinner', 3, ['icon'])).toContain('icon:loader-ring')
  })

  it('puts the spinner and its relatives near the top for loading questions', () => {
    for (const query of ['an animated loading indicator', 'loading', 'loader', 'busy indicator']) {
      const hits = top(query, 5, ['component'])
      expect(hits, query).toContain('component:spinner')
    }
    // Skeleton's name grew common as the cards draw their loading states with it, so "loading" alone ranks it lower; a
    // query about placeholders still finds it first.
    expect(top('loading', 10, ['component'])).toEqual(expect.arrayContaining(['component:spinner', 'component:skeleton']))
    expect(top('content placeholder while loading', 1, ['component'])).toEqual(['component:skeleton'])
  })

  it('finds the alert dialog for "delete confirmation"', () => {
    expect(top('delete confirmation', 3)).toContain('component:alert-dialog')
  })

  it('finds the settings block for "settings page"', () => {
    // Five items are titled "Settings" since the forms family: the app block stays in the first six.
    const hits = top('settings page', 6)
    expect(hits).toContain('block:app-settings')
  })

  it('finds motion primitives by what they do', () => {
    expect(top('list reorder animation', 3)).toContain('component:presence-list')
    expect(top('animate on scroll into view', 3)).toContain('component:reveal')
    expect(top('count up number', 4)).toContain('component:counter')
  })

  it('finds hooks and filters by kind', () => {
    expect(top('motion tokens hook', 5, ['hook'])).toContain('hook:useYouj')
    expect(top('login', 5, ['block']).every((h) => h.startsWith('block:'))).toBe(true)
  })

  it('formats results with the tool to call next, and says when nothing matches', () => {
    const out = search(catalog, 'date picker', undefined, 3)
    expect(out).toMatch(/get_component\("date-picker"\)/)
    expect(search(catalog, 'zzqxj', undefined, 3)).toMatch(/Nothing in Youj matches/)
  })

  it('gives every installable match its exact import or add command', () => {
    expect(search(catalog, 'date picker', ['component'], 3)).toContain("`npm install @youj/react date-fns react-day-picker` · `import { DatePicker } from '@youj/react/date'`")
    expect(search(catalog, 'illustration kit', ['component'], 5)).toContain('`npx @youj/cli add illustration-kit`')
    expect(search(catalog, 'login', ['block'], 3)).toMatch(/get_block\("([\w-]+)"\) · `npx @youj\/cli add \1`/)
    expect(search(catalog, 'bell', ['icon'], 3)).toContain("`import { BellIcon } from '@youj/icons'`")
    const lines = search(catalog, 'settings', ['component', 'block', 'icon', 'illustration', 'hook'], 25).split('\n').filter((l) => /^\d+\./.test(l))
    expect(lines.length).toBeGreaterThan(5)
    for (const line of lines) expect(line).toMatch(/`(npx @youj\/cli add [\w-]+|npm install [^`]+|import [^`]+)`/)
  })
})

describe('get_component', () => {
  it('covers purpose, install, usage, props, motion and accessibility', () => {
    const out = getComponent(catalog, 'button')
    expect(out).toMatch(/^# Button/)
    expect(out).toContain('## When to use')
    expect(out).toContain("import { Button } from '@youj/react'")
    expect(out).toContain('npx @youj/cli add button')
    expect(out).toContain('## Props: Button')
    expect(out).toMatch(/\| loadingLabel \|/)
    expect(out).toMatch(/Press: duration\.instant \(80ms\)/)
    expect(out).toContain('Reduced motion:')
    expect(out).toContain('## Accessibility')
  })

  it('says how settled it is, from stability.json, and marks deprecated props', () => {
    expect(getComponent(catalog, 'button')).toMatch(/Stability: \*\*alpha\*\* \(.*\/docs\/versioning#stability-labels\)/)
    expect(getComponent(catalog, 'presentation', { sections: ['install'] })).toContain('Stability: **experimental**')
    const index = loadIndex()
    index.props.MultiLanguageInput!.props.find((p) => p.name === 'sourceLocale')!.deprecated = 'Since 0.3.0: use `x`.'
    expect(getComponent(new Catalog(index), 'MultiLanguageInput', { sections: ['props'] })).toMatch(/\| sourceLocale \| .*\*\*Deprecated:\*\*/)
    expect(search(catalog, 'button', ['component'], 3)).toMatch(/component `button`, @youj\/react, alpha\)/)
  })

  it('installs a component that needs an optional peer with it, from its entry', () => {
    const out = getComponent(catalog, 'chart', { sections: ['install'] })
    expect(out).toContain('npm install @youj/react recharts')
    expect(out).toContain("from '@youj/react/chart'")
    expect(out).toContain('Needs `recharts`')
    expect(getComponent(catalog, 'button', { sections: ['install'] })).not.toContain('Needs ')
  })

  it('installs a stylesheet-only item with the package stylesheet and no import', async () => {
    const out = getComponent(catalog, 'youj-presets', { sections: ['install'] })
    expect(out).toContain('npm install @youj/core')
    expect(out).toContain('Nothing to import')
    expect(out).toContain("@import '@youj/core/styles.css'")
    expect(out).not.toContain('```tsx')
    expect(out).toContain('npx @youj/cli add youj-presets')
    const add = await getAddCommand(catalog, ['youj-presets'], join(import.meta.dirname, 'fixtures', 'package'))
    expect(add).toContain("@import '@youj/core/styles.css'")
    expect(add).not.toContain('```tsx')
  })

  it('accepts titles and part exports, and lists the other parts', () => {
    expect(getComponent(catalog, 'Alert Dialog')).toMatch(/^# Alert Dialog/)
    const part = getComponent(catalog, 'DialogContent', { sections: ['props'] })
    expect(part).toContain('## Props: DialogContent')
    expect(part).not.toContain('## Install')
    expect(getComponent(catalog, 'dialog', { part: 'DialogContent', sections: ['props'] })).toContain('## Props: DialogContent')
  })

  it('suggests close names for an unknown component', () => {
    expect(() => getComponent(catalog, 'datepickr')).toThrow(/Did you mean .*date-picker/)
    expect(() => getComponent(catalog, 'dialog', { part: 'Nope' })).toThrow(/no part "Nope"/)
  })
})

describe('icons', () => {
  it('searches by meaning, with synonyms and typos', () => {
    expect(searchIcons(catalog, 'notification')).toMatch(/BellIcon/)
    expect(searchIcons(catalog, 'delet', { source: 'youj' })).toMatch(/TrashIcon/)
    expect(searchIcons(catalog, 'loading')).toMatch(/LoaderRingIcon/)
  })

  it('filters by type, category and source', () => {
    const morph = searchIcons(catalog, 'play', { type: 'morph' })
    expect(morph).toMatch(/PlayIcon.*morphs play → pause/)
    expect(morph).not.toMatch(/lucide/)
    const swap = searchIcons(catalog, 'bell', { type: 'swap' })
    expect(swap).toMatch(/<IconSwap from=\{BellIcon\} to=\{BellOffIcon\}/)
    expect(searchIcons(catalog, 'arrow', { category: 'arrows', limit: 3 }).match(/^- /gm)).toHaveLength(3)
    expect(searchIcons(catalog, 'rocket', { source: 'lucide' })).toMatch(/<YoujIcon icon=\{Rocket\}/)
  })

  it('details an icon: states, triggers, accessible pattern, install', () => {
    const play = getIcon(catalog, 'PlayIcon')
    expect(play).toContain('`active={false}` shows **play**')
    expect(play).toContain("useIconState({ labels: ['Play', 'Pause'] })")
    expect(play).toContain('`hover` (default)')
    expect(play).toContain('npx @youj/cli add icon-play')
    expect(getIcon(catalog, 'menu')).toContain('aria-expanded={open}')
    expect(getIcon(catalog, 'lucide:rocket')).toMatch(/YoujIcon icon=\{Rocket\}[\s\S]*## Effects/)
    expect(() => getIcon(catalog, 'nopeicon')).toThrow(/No icon/)
  })

  it('parses a pair in several spellings', () => {
    expect(parsePair('play → pause')).toEqual(['play', 'pause'])
    expect(parsePair('menu -> close')).toEqual(['menu', 'close'])
    expect(parsePair('copy to check')).toEqual(['copy', 'check'])
    expect(parsePair('sun/moon')).toEqual(['sun', 'moon'])
  })

  it('suggests the state icon for a pair it covers', () => {
    expect(suggestIconMorph(catalog, { pair: 'play → pause' })).toMatch(/^# play → pause: PlayIcon/)
    expect(suggestIconMorph(catalog, { pair: 'menu → close' })).toMatch(/: MenuIcon/)
    expect(suggestIconMorph(catalog, { pair: 'copy → check' })).toMatch(/: CopyIcon[\s\S]*copied/)
    expect(suggestIconMorph(catalog, { from: 'light', to: 'dark' })).toMatch(/: ThemeIcon/)
    expect(suggestIconMorph(catalog, { pair: 'sun → moon' })).toMatch(/: ThemeIcon/)
  })

  it('falls back to IconSwap with a fitting transition', () => {
    const out = suggestIconMorph(catalog, { pair: 'upload → trash' })
    expect(out).toMatch(/IconSwap/)
    expect(out).toMatch(/from=\{CloudUploadIcon|from=\{UploadIcon/)
    expect(suggestIconMorph(catalog, { pair: 'send → check' })).toMatch(/transition="pop"|: CircleArrowUpIcon/)
    expect(suggestIconMorph(catalog, { pair: 'search → close' })).toContain('<IconSwap from={SearchIcon} to={XIcon}')
    expect(suggestIconMorph(catalog, { pair: 'heart → liked' })).toMatch(/: HeartIcon/)
    expect(suggestIconMorph(catalog, { pair: 'mic → mute' })).toMatch(/: MicIcon/)
    expect(() => suggestIconMorph(catalog, {})).toThrow(/Give two meanings/)
  })
})

describe('blocks', () => {
  it('lists them grouped, and filters by group', () => {
    expect(listShowcase(catalog)).toMatch(/## Auth[\s\S]*`auth-login`/)
    expect(listShowcase(catalog, 'auth')).not.toMatch(/## Marketing/)
    expect(() => listShowcase(catalog, 'nope')).toThrow(/Groups:/)
  })

  it('names the levels: blocks are cards, sections and screens', () => {
    const blocks = listShowcase(catalog)
    expect(blocks).toMatch(/^\d+ blocks \(\d+ cards, \d+ sections, \d+ screens;/)
    expect(blocks).toMatch(/`auth-login` \(screen\)/)
    const screens = listShowcase(catalog, undefined, 'screen')
    expect(screens).toContain('(screen)')
    expect(screens).not.toContain('(card)')
    expect(() => listShowcase(catalog, undefined, 'galaxy')).toThrow(/Levels: card, section, screen/)
    expect(search(catalog, 'login page', ['block'], 5)).toMatch(/\((?:card|section|screen) block /)
  })

  it('documents AsyncButton’s status and function labels, with a safe error pattern', () => {
    const button = getComponent(catalog, 'async-button')
    expect(button).toContain('status={mutation.status}')
    expect(button).toContain('successLabel')
    expect(button).toMatch(/errorLabel=\{\(error\) => error instanceof Error/)
  })

  it('indexes the loaders as their own kind, with category, technique and the way in', () => {
    expect(catalog.index.loaders.length).toBeGreaterThan(50)
    const mullion = catalog.index.loaders.find((a) => a.id === 'mullion')!
    expect(mullion).toMatchObject({ component: 'LoaderMullion', category: 'software', categoryTitle: 'Software', registry: 'loader-mullion' })
    expect(mullion.technique).toBeTruthy()
    const hits = search(catalog, 'responsive breakpoint layout animation', ['loader'], 5)
    expect(hits).toContain('Mullion')
    expect(hits).toContain('npx @youj/cli add loader-mullion')
    expect(hits).toContain("import { LoaderMullion } from '@youj/loaders/mullion'")
    expect(search(catalog, 'software animation', undefined, 10)).toContain('Software loader')
  })

  it('resolves animations in get_add_command beside other items', async () => {
    const out = await getAddCommand(catalog, ['loader-mullion', 'LoaderTangent', 'nope'], join(import.meta.dirname, 'fixtures', 'package'))
    expect(out).toContain("import { LoaderMullion } from '@youj/loaders/mullion'")
    expect(out).toContain('npx @youj/cli add loader-tangent')
    expect(out).toContain('Skipped: Unknown item "nope"')
    expect(await getAddCommand(catalog, ['loader-mullion'], join(import.meta.dirname, 'fixtures', 'registry'))).toContain('npx @youj/cli add loader-mullion')
  })

  it('indexes the miniatures as their own kind, npm only', () => {
    expect(catalog.index.miniatures).toHaveLength(60)
    const turntable = catalog.index.miniatures.find((m) => m.id === 'turntable')!
    expect(turntable).toMatchObject({ title: 'Record turntable', component: 'MiniatureTurntable', registry: 'miniature-turntable' })
    expect(catalog.index.miniatures.find((m) => m.id === '3d-printer')!.component).toBe('MiniatureThreeDPrinter')
    const hits = search(catalog, 'record turntable', ['miniature'], 3)
    expect(hits).toContain("import { MiniatureTurntable } from '@youj/miniatures/turntable'")
    expect(hits).toContain('npm install @youj/miniatures')
  })

  it('resolves miniatures in get_add_command as an install and an import, never a copy', async () => {
    const out = await getAddCommand(catalog, ['miniature-turntable', 'MiniatureHourglass'], join(import.meta.dirname, 'fixtures', 'package'))
    expect(out).toContain('@youj/miniatures')
    expect(out).toContain("import { MiniatureTurntable } from '@youj/miniatures/turntable'")
    expect(out).toContain("import { MiniatureHourglass } from '@youj/miniatures/hourglass'")
    expect(out).not.toContain('npx @youj/cli add')
  })

  it('imports useIconState from the icons package', () => {
    expect(search(catalog, 'useIconState', ['hook'], 3)).toContain("import { useIconState } from '@youj/icons'")
  })

  it('tells the sound package’s way in: a pack to import, no stylesheet', () => {
    const sound = getComponent(catalog, 'sound', { sections: ['install'] })
    expect(sound).toContain("import { beacon } from '@youj/sound'")
    expect(sound).not.toContain('styles.css')
  })

  it('details one with its install command and files', async () => {
    const out = await getShowcase(catalog, 'auth-login')
    expect(out).toContain('npx @youj/cli add auth-login')
    expect(out).toMatch(/## Files\n\n.*\n\n- blocks\/auth\/login\.tsx/)
    expect(out).toContain('Stability: **alpha**')
  })

  it('gives what the CLI installs: the command, the files as written, the import and the package imports', async () => {
    const out = await getShowcase(catalog, 'app-customers')
    expect(out).toContain('npx @youj/cli add app-customers')
    for (const file of ['blocks/app/customers.tsx', 'blocks/app/customers/columns.tsx', 'blocks/app/customers/data.ts', 'blocks/app/customers/detail.tsx']) expect(out).toContain(`- ${file} (`)
    expect(out).toMatch(/import \{ \w*Customers\w* \} from '@\/blocks\/app\/customers'/)
    expect(out).not.toMatch(/packages\/|apps\/docs|\.\.\/\.\.\//)
    const source = await getShowcase(catalog, 'app-customers', { source: true })
    // It hosts the Data grid block, imported where `youj add` writes it.
    expect(source).toContain("from '@/blocks/tables/data-grid'")
    expect(source).toContain('as `youj add` writes it')
    expect(source).not.toContain("'../../../components")
    // Components come from the package, as `youj add` rewrites them in an app on the packages.
    expect(source).toMatch(/from '@youj\/react/)
    expect(source).not.toContain("from '@/components/ui")
    const files = catalog.index.blocks.flatMap((s) => s.files)
    expect(files.filter((f) => f.startsWith('packages/') || f.startsWith('src/'))).toEqual([])
  })

  it('says a composition has no files of its own and installs its blocks', async () => {
    const out = await getShowcase(catalog, 'marketing-landing')
    expect(out).toContain('npx @youj/cli add marketing-cta')
    expect(out).toContain('None of its own')
  })

  it('includes the data tables: the kit as a component, the complete tables as blocks', async () => {
    expect(getComponent(catalog, 'data-table')).toContain("from '@youj/react/data-table'")
    expect(listShowcase(catalog, 'tables')).toContain('`tables-data-grid`')
    expect(await getShowcase(catalog, 'tables-data-grid')).toContain('Stability: **experimental**')
    expect(listShowcase(catalog, 'app')).toContain('`app-customers`')
  })

  it('lists every block the registry has, but the frame’s parts, which are Create’s, and the hidden ones', () => {
    const registry = JSON.parse(readFileSync(join(import.meta.dirname, '../../ui/registry/ui.json'), 'utf8')) as { name: string; type: string; meta?: { level?: string; hidden?: boolean } }[]
    const listed = new Set(catalog.index.blocks.map((b) => b.registry))
    expect(registry.filter((i) => i.type === 'registry:block' && i.meta?.level !== 'frame' && !i.meta?.hidden && !listed.has(i.name)).map((i) => i.name)).toEqual([])
    expect(catalog.index.blocks.filter((b) => b.level === 'frame')).toEqual([])
  })

  it('pages source under the cap', async () => {
    const items = catalog.index.blocks
    let found: { item: (typeof items)[number]; file: string; text: string } | undefined
    for (const item of items) {
      for (const file of item.files) {
        const text = await catalog.source(file)
        if (!found && text.length > SOURCE_PAGE) found = { item, file, text }
      }
    }
    const { item, file, text } = found!
    const first = await getShowcase(catalog, item.slug, { file })
    // The page is the cap's worth of source plus the item's header, which lists its files (a dozen for the larger blocks).
    expect(first.length).toBeLessThan(SOURCE_PAGE + 1200)
    expect(first).not.toContain(text.slice(SOURCE_PAGE, SOURCE_PAGE + 40))
    expect(first).toContain(`offset: ${SOURCE_PAGE}`)
    const rest = await getShowcase(catalog, item.slug, { file, offset: SOURCE_PAGE })
    expect(rest).toContain(text.slice(SOURCE_PAGE, SOURCE_PAGE + 40))
  })
})

describe('tokens and themes', () => {
  it('gives a preset’s tokens by group', () => {
    const all = getTokens(catalog, { preset: 'terminal' })
    expect(all).toMatch(/# Tokens: Terminal/)
    expect(all).toMatch(/\| fg-subtle \| #[0-9a-f]{6} \| #[0-9a-f]{6} \|/)
    expect(all).toContain('## Motion (precise)')
    const motion = getTokens(catalog, { groups: ['motion'] })
    expect(motion).toContain('durations (ms): instant 80, fast 140, base 220, slow 340, deliberate 560')
    expect(motion).not.toContain('## Colour')
    expect(() => getTokens(catalog, { preset: 'nope' })).toThrow(/Presets: graphite/)
  })

  it('creates a theme with defineTheme and reports contrast', () => {
    const out = createTheme({ accent: '#ff5a1f', name: 'Ember', radius: 'lg' })
    expect(out).toContain('export const ember = defineTheme({')
    expect(out).toContain("accent: '#ff5a1f',")
    expect(out).toMatch(/light: fg-subtle \d\.\d\d:1 \(needs 4\.5\) pass; field border \d\.\d\d:1 \(needs 3\) pass/)
    expect(out).toContain('themeProps(ember)')
    expect(out).toContain('--yj-accent: #ff5a1f;')
  })

  it('takes a two-tone chrome and an info ink, and writes them to the CSS', () => {
    const out = createTheme({ accent: '#ff5a1f', name: 'Studio', base: 'graphite', tone: { chrome: 'dark' }, info: '#0ea5e9' })
    expect(out).toContain("tone: { chrome: 'dark' },")
    expect(out).toContain("info: '#0ea5e9',")
    expect(out).toContain('--yj-tone-chrome-fixed: 1;')
    expect(out).toContain('--yj-tone-chrome-dark: 1;')
    expect(out).toContain('--yj-info: #0ea5e9;')
  })

  it('extends a preset and refuses an unreadable colour', () => {
    expect(createTheme({ accent: 'oklch(0.6 0.2 150)', base: 'terminal' })).toContain("radius: 'none',")
    expect(() => createTheme({ accent: 'not-a-colour' })).toThrow(/isn't a colour/)
  })

  it('takes controlSize and motionPersonality', () => {
    const named = createTheme({ accent: '#ff5a1f', name: 'Ember', controlSize: 'compact', motionPersonality: 'calm' })
    expect(named).toContain("controlSize: 'compact',")
    expect(named).toContain("motionPersonality: 'calm',")
    expect(named).toContain('--yj-density: -1;')
    expect(named).not.toMatch(/^ {2}(density|motion):/m)
  })

  it('describes a preset’s character, and Brutal is one of the presets', () => {
    const brutal = getTokens(catalog, { preset: 'brutal', groups: ['character'] })
    expect(brutal).toContain('## Character')
    expect(brutal).toContain('- stroke: 2px borders')
    expect(brutal).toContain('- shadow: hard')
    expect(brutal).toContain('capitals in mono')
    expect(getTokens(catalog, { groups: ['character'] })).toContain('- shadow: soft')
  })

  it('builds a theme over Basalt, and applies it dark and in classic by default, with no stylesheet', () => {
    const plain = createTheme({ accent: '#fba917', name: 'Signal' })
    expect(createTheme({ accent: '#fba917', name: 'Signal', base: 'basalt', look: 'classic' })).toBe(plain)
    expect(plain).toContain("actions: 'accent',")
    expect(plain).toContain('<html lang="en" {...themeProps(signal)} data-theme="dark" data-yj-look="classic">')
    expect(plain).toContain('<YoujProvider theme={signal}>{children}</YoujProvider>')
    expect(plain).toContain('<ThemeScope theme={signal}>')
    expect(plain).not.toContain('youj-look-')
    // The style isn't written into the theme.
    expect(plain).not.toMatch(/defineTheme\(\{[^}]*style:/)
  })

  it('applies a theme in bezel when asked, as a prop, with its stylesheet', () => {
    const bezel = createTheme({ accent: '#fba917', name: 'Signal', look: 'bezel' })
    expect(bezel).toContain('<html lang="en" {...themeProps(signal)} data-theme="dark" data-yj-look="bezel">')
    expect(bezel).toContain('<YoujProvider theme={signal} look="bezel">')
    expect(bezel).toContain('<ThemeScope theme={signal} look="bezel">')
    expect(bezel).toContain('npx @youj/cli add youj-look-bezel')
  })

  it('creates a theme with a character of its own, checked like any other', () => {
    const out = createTheme({ accent: '#ff5a1f', name: 'Poster', stroke: { width: 2, ink: 1 }, shadow: 'hard', labels: { case: 'upper' } })
    expect(out).toContain('stroke: { width: 2, ink: 1, icons: 1 },')
    expect(out).toContain("shadow: 'hard',")
    expect(out).toContain('--yj-shadow-hard: 1;')
    expect(out).toContain('--yj-label-case: uppercase;')
    expect(out).toContain('checkTheme: every pair the library draws passes AA in both modes.')
  })
})

describe('motion_guidance', () => {
  it('recommends the piece that already does it', () => {
    expect(motionGuidance(catalog, 'toast enters')).toMatch(/^# A toast[\s\S]*\*\*Toast\*\*/)
    expect(motionGuidance(catalog, 'list reorders')).toMatch(/Presence List[\s\S]*## Tokens[\s\S]*## Reduced motion/)
    expect(motionGuidance(catalog, 'button success')).toMatch(/onAction/)
  })

  it('names only components that exist', () => {
    for (const recipe of RECIPES) for (const name of recipe.use) expect(catalog.components.has(name), `${recipe.id}: ${name}`).toBe(true)
  })

  it('points to the guidelines for how long any interaction takes', () => {
    expect(motionGuidance(catalog, 'dialog opens')).toMatch(/^Timing by interaction, and when not to animate: \S+\/docs\/motion\/principles$/m)
    expect(catalog.index.docs.find((d) => d.slug === 'motion/principles')?.markdown).toMatch(/\| Menu and popover .*\| 80–140 ms \|/)
  })
})

describe('setup', () => {
  it('leads with init and gives the framework’s manual steps', () => {
    const out = setup(catalog, { framework: 'next-app' })
    expect(out).toContain('npx @youj/cli init')
    expect(out).toContain("@import '@youj/react/styles.css';")
    expect(out).toContain('app/layout.tsx')
  })

  it('sets up Basalt, dark and classic by default: the provider and <html>, and no stylesheet', () => {
    const pkg = setup(catalog, { framework: 'next-app' })
    expect(setup(catalog, { framework: 'next-app', look: 'classic' })).toBe(pkg)
    expect(pkg).toContain('npx @youj/cli init\n')
    expect(pkg).toContain('<YoujProvider theme={basalt}>{children}</YoujProvider>')
    expect(pkg).toContain('{...themeProps(basalt)} data-theme="dark" data-yj-look="classic"')
    const registry = setup(catalog, { framework: 'vite', mode: 'registry' })
    expect(registry).toContain('npx @youj/cli init --mode registry\n')
    expect(registry).toContain('npx @youj/cli add youj-core youj-ui-core\n')
    expect(registry).not.toContain('bezel.css')
    expect(registry).toContain('data-yj-theme="basalt" data-theme="dark" data-yj-look="classic"')
  })

  it('sets up bezel when asked: the init flag, the provider prop and the registry’s stylesheet', () => {
    const pkg = setup(catalog, { framework: 'next-app', look: 'bezel' })
    expect(pkg).toContain('npx @youj/cli init --look bezel')
    expect(pkg).toContain('<YoujProvider theme={basalt} look="bezel">')
    expect(pkg).toContain('{...themeProps(basalt)} data-theme="dark" data-yj-look="bezel"')
    expect(pkg).toContain('@youj/react/styles.css already')
    const registry = setup(catalog, { framework: 'vite', mode: 'registry', look: 'bezel' })
    expect(registry).toContain('npx @youj/cli add youj-core youj-ui-core youj-look-bezel')
    expect(registry).toContain("@import '../styles/ui.css';\n@import '../styles/bezel.css';")
  })

  it('checks a pasted package.json and stylesheet like doctor', () => {
    const { checks, framework } = checkSetup(
      JSON.stringify({ dependencies: { next: '15.0.0', react: '^17.0.2', '@youj/react': '0.1.0', '@youj/motion': '0.2.0' }, devDependencies: { tailwindcss: '^4.1.0' } }),
      "@import '@youj/react/styles.css';\n@import 'tailwindcss';\n:root { --primary: red; }",
    )
    expect(framework).toBe('next-app')
    const errors = checks.filter((c) => c.level === 'error').map((c) => c.message)
    expect(errors).toEqual(expect.arrayContaining([expect.stringMatching(/React 17: Youj needs React 19/), expect.stringMatching(/different versions/), expect.stringMatching(/before Tailwind/)]))
    expect(checks.some((c) => c.level === 'warn' && /--primary/.test(c.message))).toBe(true)
    expect(checkSetup('{', undefined).checks[0]!.message).toMatch(/valid JSON/)
  })
})

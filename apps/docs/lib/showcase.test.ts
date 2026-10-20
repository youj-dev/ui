// @vitest-environment node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { BLOCK_KINDS, block, blocks, framing, parseStories, partsOf, takesTheme, type ShowcaseEntry } from './showcase'

/* Every block must follow the theme bar (scripts/theme-audit.ts
 * measures it live; these catch the ways it has broken, from the source). */

const ROOT = join(process.cwd(), '../..')
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')
const entries = blocks()

/** Everything an entry ships: its files, and a block's part folder beside it. */
function sources(entry: ShowcaseEntry): string[] {
  const files = [...entry.files]
  const folder = entry.files[0]!.replace(/\.tsx$/, '')
  if (entry.kind === 'blocks' && existsSync(join(ROOT, folder)) && statSync(join(ROOT, folder)).isDirectory()) {
    for (const f of readdirSync(join(ROOT, folder), { recursive: true }) as string[]) if (/\.tsx?$/.test(f)) files.push(join(folder, f))
  }
  return files.filter((f) => !/\.(test|stories)\./.test(f))
}

describe('the showcase themes every block and example', () => {
  it('re-themes each one that wraps itself in a theme: through its `theme` prop, or by following the theme around it', () => {
    // A ThemeScope over a theme of the block's own, with no `theme` prop to
    // override it, keeps that theme whatever the bar picks. The ones that
    // scope a theme they read from around them (useTheme) follow it.
    const stuck = entries.filter((e) => {
      const text = sources(e).map(read).join('\n')
      return /<ThemeScope theme=\{/.test(text) && !e.themed && !/\buseTheme\(\)/.test(text)
    })
    expect(stuck.map((e) => `${e.kind}/${e.slug}`)).toEqual([])
  })

  it('never seeds a theme from the one around it once, which a later pick would miss', () => {
    const seeded = entries.flatMap((e) => sources(e).filter((f) => /useState[^(]*\(\s*(inherited|useTheme\(\))/.test(read(f))))
    expect(seeded).toEqual([])
  })

  it('detects the `theme` prop wherever it is declared', () => {
    expect(takesTheme('function Mail({ theme = graphite }: { theme?: ThemeInput }) {')).toBe(true)
    expect(takesTheme('interface Props {\n  theme?: ThemeInput\n}')).toBe(true)
    expect(takesTheme('const [theme, setTheme] = useState<ThemeInput>()')).toBe(false)
  })

  it('passes the chosen theme through every story of a themed one', () => {
    // A story whose render drops its args drops the `theme` the frame passes it.
    const dropped = entries.filter((e) => e.themed && /\brender:\s*\(\s*\)/.test(read(e.storyFile)))
    expect(dropped.map((e) => e.storyFile)).toEqual([])
  })

  it('lets the theme bar re-theme each one designed in a theme of its own (it takes the `theme` prop)', () => {
    const custom = entries.filter((e) => e.showcase?.theme && !e.showcase.preset)
    expect(custom.length).toBeGreaterThan(0)
    expect(custom.filter((e) => !e.themed).map((e) => e.slug)).toEqual([])
  })
})

describe('illustration slots', () => {
  const slotted = blocks().filter((b) => b.illustration)

  it('offers the Illustration picker on every block whose story declares a slot', () => {
    expect(slotted.map((b) => b.slug).sort()).toEqual(['app-auth-flow', 'app-empty-states', 'app-first-source', 'app-onboarding', 'auth-login', 'auth-shell', 'marketing-cta'])
    // The flag rides beside a preset without disturbing it.
    expect(block('app-first-source')?.showcase?.preset).toBe('basalt')
    expect(parseStories("parameters: { showcase: { preset: 'brutal' } }").illustration).toBe(false)
  })

  it('declares a slot only where the block takes the prop, and passes it through the stories', () => {
    // The picker hands the scene to the story as its `illustration` arg: a render that drops its args drops it.
    for (const b of slotted) {
      // Declared in the block, one of its parts, or a block it builds on (the auth pages share the layout's props).
      const own = [...b.files, ...b.blocks.flatMap((name) => block(name)?.files ?? [])]
      expect(own.map(read).join('\n')).toMatch(/\billustration\?: IllustrationSlot\b/)
      expect(read(b.storyFile)).not.toMatch(/\brender:\s*\(\s*\)/)
    }
  })
})

describe('parts of another block', () => {
  it('shows the auth pages as the auth flow: each keeps its item, and search finds them through the flow', () => {
    const parts = partsOf('app-auth-flow').map((b) => b.slug)
    expect(parts.sort()).toEqual(['auth-forgot-password', 'auth-login', 'auth-magic-link-sent', 'auth-reset-password', 'auth-shell', 'auth-signup', 'auth-two-factor'])
    for (const s of parts) expect(block(s)?.registry).toBe(s)
  })

  it('reads the flag beside the others, and names only a block that exists', () => {
    expect(parseStories("showcase: { illustration: true, partOf: 'app-auth-flow' }")).toMatchObject({ illustration: true, partOf: 'app-auth-flow' })
    expect(parseStories("showcase: { preset: 'brutal' }").partOf).toBeUndefined()
    for (const b of blocks().filter((b) => b.partOf)) expect(block(b.partOf!)).toBeDefined()
  })
})

describe('block kinds', () => {
  it('has every block say what it is in its story, one of the five kinds', () => {
    const undeclared = blocks().filter((b) => !parseStories(read(b.storyFile)).kind)
    expect(undeclared.map((b) => b.slug)).toEqual([])
    for (const b of blocks()) expect(BLOCK_KINDS).toContain(b.blockKind)
    expect(parseStories("showcase: { kind: 'card', preset: 'basalt' }").kind).toBe('card')
    expect(parseStories("showcase: { kind: 'widget' }").kind).toBeUndefined()
  })

  it('frames each kind its own way: screens and overlays as screens, sections full-bleed, cards and fragments on a stage', () => {
    expect(framing(block('app-settings')!)).toBe('screen')
    expect(framing(block('commerce-cart-drawer')!)).toBe('screen')
    expect(framing(block('marketing-metrics')!)).toBe('section')
    expect(framing(block('app-health-dial')!)).toBe('card')
    expect(framing(block('app-empty-states')!)).toBe('card')
    // The frame's parts are shown inside the whole frame, whatever they are.
    expect(block('frame-sidebar-rail-panel')!.blockKind).toBe('fragment')
    expect(framing(block('frame-sidebar-rail-panel')!)).toBe('screen')
    expect(framing(block('app-fleet-overview')!)).toBe('screen')
  })

  it('carries each kind into the registry item as meta.kind', () => {
    const registry = JSON.parse(read('packages/ui/registry/ui.json')) as { name: string; type: string; meta?: { kind?: string; hidden?: boolean } }[]
    for (const item of registry.filter((i) => i.type === 'registry:block' && !i.meta?.hidden)) expect(item.meta?.kind, item.name).toBe(block(item.name)!.blockKind)
  })
})

describe('light pages', () => {
  const OVERRIDDEN = ['app-auth-flow']

  it("sets a website's blocks on a white page and an app's on the gray one, by group", () => {
    for (const b of blocks().filter((b) => !OVERRIDDEN.includes(b.slug)))
      expect([b.slug, b.page]).toEqual([b.slug, ['Marketing', 'Content', 'Auth'].includes(b.group) ? 'white' : 'gray'])
    expect(block('marketing-landing')?.page).toBe('white')
  })

  it("takes a story's own page over its group's: the auth flow is a website's way in", () => {
    expect(block('app-auth-flow')?.page).toBe('white')
    expect(parseStories("showcase: { preset: 'brutal', page: 'white' }")).toMatchObject({ page: 'white', showcase: { preset: 'brutal' } })
    expect(parseStories("showcase: { preset: 'brutal' }").page).toBeUndefined()
    expect(parseStories("showcase: { page: 'beige' }").page).toBeUndefined()
  })
})

describe('display names', () => {
  it('keep acronyms in capitals', () => {
    expect(block('app-ai-workspace')?.title).toBe('AI Workspace')
    expect(block('app-api-keys')?.title).toBe('API Keys')
    const titles = blocks().map((e) => e.title)
    expect(titles.filter((t) => /\b(Ai|Api|Cms|Cta|Faq|Otp|Kpi|Sso|Csv|Crm)\b/.test(t))).toEqual([])
  })
})

describe('the showcase sizes', () => {
  it('starts every item at the standard size, roomy at 100%', async () => {
    const { DEFAULT_SIZE, defaultSize } = await import('./preview')
    expect(defaultSize()).toEqual(DEFAULT_SIZE)
    expect(DEFAULT_SIZE).toEqual({ density: 'roomy', scaling: '100%' })
  })
})

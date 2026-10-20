import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { DEFAULT_PRESET, themes } from '@youj/core/lib/youj/theme/themes'
import { defineTheme } from '@youj/core/lib/youj/theme/contract'
import { LOOKS } from '@youj/core/lib/youj/look'
import {
  createItems,
  exportedFonts,
  fontsImport,
  fontsSource,
  framePlan,
  jsx,
  youjAddCommand,
  homeHref,
  homeSource,
  layoutSource,
  providerTag,
  screenFiles,
  screenPath,
  screenSource,
  shellSource,
  themeFields,
  themeSource,
} from './codegen'
import { frameFiles, navSource } from './frame-files'
import {
  ACCOUNTS,
  BRANDS,
  DEFAULT_FRAME,
  frameItems,
  framePartsOf,
  frameScreens,
  MOBILE_NAVS,
  readFrame,
  SCREENS,
  screensInNavOrder,
  screensNav,
  SEARCHES,
  SIDEBARS,
  TOPBARS,
  unknownChoices,
  writeFrame,
  type FrameConfig,
} from './config'
import { FAMILIES, fontById, fontOf, loadable, pairingFonts, pairingOf, PAIRINGS, webFonts } from './fonts'
import { readLook, LOOK_OPTIONS, lookItem, lookStylesheet, writeLook } from './look-url'
import { DEFAULT_THEME_NAME, readTheme, writeTheme } from './theme-url'

const here = dirname(fileURLToPath(import.meta.url))
const ui = join(here, '../../..')
const blocks = join(ui, 'src/blocks/frame')
const next = join(ui, '../../apps/docs/node_modules/next')

/** Screen sets the matrix cycles through, in nav order: none, one, one a group, and the default. */
const SCREEN_SETS = [[], ['app-analytics-overview'], ['app-customers', 'app-task-board', 'app-billing'], DEFAULT_FRAME.screens]

/** A representative matrix: every sidebar × top bar × account × search, with the smaller choices (the screens among them) cycled so each value appears. */
function matrix(): FrameConfig[] {
  const out: FrameConfig[] = []
  let i = 0
  for (const sidebar of SIDEBARS)
    for (const topbar of TOPBARS)
      for (const account of ACCOUNTS)
        for (const search of SEARCHES) {
          out.push({
            sidebar,
            topbar,
            account,
            search,
            brand: BRANDS[i % BRANDS.length]!,
            mobile: MOBILE_NAVS[(i >> 1) % MOBILE_NAVS.length]!,
            notifications: i % 3 !== 0,
            upgrade: i % 5 < 2,
            screens: SCREEN_SETS[i % SCREEN_SETS.length]!,
          })
          i++
        }
  return out
}

/** A theme on each typeface pairing, over Graphite. */
const onPairing = (id: string) => readTheme(new URLSearchParams({ name: `On ${id}` }))
const withFonts = (id: string) => defineTheme({ ...onPairing(id), fonts: pairingFonts(PAIRINGS.find((p) => p.id === id)!) })

describe('the frame in a URL', () => {
  it('round-trips every frame, and the default is an empty query', () => {
    for (const config of matrix()) expect(readFrame(writeFrame(config))).toEqual(config)
    expect(writeFrame(DEFAULT_FRAME).toString()).toBe('')
  })

  it('ignores unknown and malformed values', () => {
    expect(readFrame(new URLSearchParams('sidebar=pinwheel&topbar=tabs&upgrade=yes&page=spreadsheet'))).toEqual({ ...DEFAULT_FRAME, topbar: 'tabs' })
  })

  it('reads a sidebar merged before launch as the one that took it in', () => {
    expect(readFrame(new URLSearchParams('sidebar=rail')).sidebar).toBe('rail-panel')
    expect(readFrame(new URLSearchParams('sidebar=flyout')).sidebar).toBe('rail-panel')
    expect(readFrame(new URLSearchParams('sidebar=minimal')).sidebar).toBe('workspace')
    expect(readFrame(new URLSearchParams('sidebar=editorial')).sidebar).toBe('classic')
    // The seven sidebars folded into the five.
    expect(readFrame(new URLSearchParams('sidebar=floating')).sidebar).toBe('classic')
    expect(readFrame(new URLSearchParams('sidebar=dual')).sidebar).toBe('rail-panel')
    expect(readFrame(new URLSearchParams('sidebar=drill')).sidebar).toBe('rail-panel')
    expect(readFrame(new URLSearchParams('sidebar=tree')).sidebar).toBe('glass')
    expect(readFrame(new URLSearchParams('sidebar=command')).sidebar).toBe('workspace')
    expect(readFrame(new URLSearchParams('sidebar=spaces')).sidebar).toBe('workspace')
    expect(readFrame(new URLSearchParams('sidebar=pulse')).sidebar).toBe('workspace')
    expect(unknownChoices(new URLSearchParams('sidebar=rail&screens=billing,nonsense'))).toEqual(['screens=nonsense'])
  })

  it('carries the screens by their ids in nav order, the default three left out, and none as an empty list', () => {
    expect(DEFAULT_FRAME.screens).toEqual(['app-analytics-overview', 'app-task-board', 'app-settings'])
    expect(readFrame(new URLSearchParams('screens=billing,week-calendar,customers')).screens).toEqual(['app-customers', 'app-week-calendar', 'app-billing'])
    expect(readFrame(new URLSearchParams('screens=app-billing,billing,nope')).screens).toEqual(['app-billing'])
    expect(writeFrame({ ...DEFAULT_FRAME, screens: ['app-billing'] }).toString()).toBe('screens=billing')
    expect(writeFrame({ ...DEFAULT_FRAME, screens: [] }).toString()).toBe('screens=')
    expect(readFrame(new URLSearchParams('screens=')).screens).toEqual([])
  })

  it('opens an older link’s pages as the closest screens, the article and unknown pages dropped', () => {
    expect(readFrame(new URLSearchParams('page=inbox')).screens).toEqual(['app-list-detail'])
    expect(readFrame(new URLSearchParams('page=table&pages=table,calendar,assistant')).screens).toEqual(['app-customers', 'app-week-calendar', 'app-ai-workspace'])
    expect(readFrame(new URLSearchParams('page=blank')).screens).toEqual([])
    expect(readFrame(new URLSearchParams('page=article&pages=settings')).screens).toEqual(['app-settings'])
    expect(readFrame(new URLSearchParams('page=spreadsheet')).screens).toEqual(DEFAULT_FRAME.screens)
    // Writing it again speaks screens.
    expect(writeFrame(readFrame(new URLSearchParams('page=board'))).toString()).toBe('screens=task-board')
  })
})

describe('the screens', () => {
  const registry = JSON.parse(readFileSync(join(ui, 'registry/ui.json'), 'utf8')) as { name: string; meta?: { level?: string; inApp?: boolean } }[]

  it('offers exactly the in-app screens, each a block that exports its component', () => {
    const inApp = registry.filter((i) => i.meta?.inApp).map((i) => i.name)
    expect(Object.keys(SCREENS).sort()).toEqual(inApp.sort())
    expect(inApp.length).toBeGreaterThanOrEqual(29)
    for (const screen of Object.values(SCREENS)) {
      expect(registry.find((i) => i.name === screen.name)?.meta?.level, screen.name).toBe('screen')
      expect(readFileSync(join(ui, `src/${screen.file}.tsx`), 'utf8'), screen.name).toMatch(new RegExp(`\\b${screen.component}\\b`))
    }
    // Not the auth pages, the checkout or the marketing ones.
    for (const name of ['auth-login', 'app-onboarding', 'commerce-checkout', 'marketing-landing', 'app-error', 'surveys-form']) expect(SCREENS[name], name).toBeUndefined()
  })

  it('gives each screen its own route and a nav icon the preview draws', async () => {
    const { NAV_ICONS } = await import('./screen-icons')
    const routes = Object.values(SCREENS).map((s) => s.route)
    expect(new Set(routes).size).toBe(routes.length)
    for (const screen of Object.values(SCREENS)) expect(NAV_ICONS[screen.icon], screen.name).toBeDefined()
  })

  it('installs with the frame, after its parts, and routes each screen to its block', () => {
    const billing = SCREENS['app-billing']!
    expect(frameItems({ ...DEFAULT_FRAME, screens: ['app-billing'] }).at(-1)).toBe('app-billing')
    expect(frameItems({ ...DEFAULT_FRAME, screens: [] }).some((item) => !item.startsWith('frame-'))).toBe(false)
    expect(screenPath(billing)).toBe('app/(app)/billing/page.tsx')
    expect(screenSource(billing)).toContain("import { Billing } from '@/blocks/app/billing'")
    expect(screenFiles({ ...DEFAULT_FRAME, screens: [] })).toEqual([])
    expect(homeHref({ ...DEFAULT_FRAME, screens: [] })).toBeNull()
    // A screen that reads the clock fails `next build` under cacheComponents unless it's inside Suspense.
    expect(layoutSource()).toContain('<Suspense>{children}</Suspense>')
  })

  it('keeps each group of the nav together, in the order the screens were added there', () => {
    expect(screensInNavOrder(['app-settings', 'app-task-board', 'app-billing', 'app-customers', 'app-analytics-overview'])).toEqual([
      'app-customers',
      'app-analytics-overview',
      'app-task-board',
      'app-settings',
      'app-billing',
    ])
    expect(screensNav({ screens: ['app-settings', 'app-week-calendar', 'app-billing'] }).map((s) => [s.label, s.items.map((i) => [i.label, i.href])])).toEqual([
      ['Workspace', [['Week calendar', '/week-calendar']]],
      ['Admin', [['Settings', '/settings'], ['Billing', '/billing']]],
    ])
  })
})

describe('the typefaces', () => {
  it('travel in the URL by name, and read raw stacks from older links', () => {
    const geist = defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), fonts: { sans: fontById('geist')!.stack, display: fontById('fraunces')!.stack, mono: fontById('geist-mono')!.stack } })
    const params = writeTheme(geist)
    expect(Object.fromEntries(params)).toMatchObject({ sans: 'geist', display: 'fraunces', mono: 'geist-mono' })
    expect(readTheme(params)).toEqual(geist)
    const raw = readTheme(new URLSearchParams({ sans: "'Geist', ui-sans-serif, system-ui, sans-serif" }))
    expect(raw.fonts?.sans).toBe(fontById('geist')!.stack)
    expect(readTheme(new URLSearchParams({ sans: 'url(evil)' })).fonts?.sans).toBe(readTheme(new URLSearchParams()).fonts?.sans)
  })

  it('names every family and pairing once, and every pairing survives the URL', () => {
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length)
    expect(new Set(FAMILIES.map((f) => f.stack)).size).toBe(FAMILIES.length)
    expect(PAIRINGS.length).toBeGreaterThanOrEqual(12)
    for (const pairing of PAIRINGS) {
      const theme = withFonts(pairing.id)
      expect(pairingOf(readTheme(writeTheme(theme)).fonts), pairing.id).toBe(pairing)
    }
  })

  it('reads each preset as a pairing: Inter, Terminal’s mono', () => {
    const pairing = (id: string) => pairingOf(readTheme(new URLSearchParams({ preset: id })).fonts)?.id
    expect(pairing('graphite')).toBe('inter')
    expect(pairing('brutal')).toBe('inter')
    expect(pairing('terminal')).toBe('mono')
  })

  it('exports web fonts through next/font, with the stylesheet @import beside them', () => {
    expect(fontsSource(readTheme(new URLSearchParams({ preset: 'graphite' })))).toBeNull()
    const geist = withFonts('geist')
    const fonts = fontsSource(geist)!
    expect(fonts).toContain("import { Geist, Geist_Mono } from 'next/font/google'")
    expect(fonts).toContain("const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })")
    expect(fonts).toContain('export const fontVariables = [geist.variable, geistMono.variable].join')
    expect(themeSource(geist)).toContain(`sans: "var(--font-geist, 'Geist'), ui-sans-serif, system-ui, sans-serif"`)
    expect(fontsImport(geist)).toBe("@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap');")
    // A static family names its weights; a variable one asks for its optical sizes.
    expect(fontsSource(readTheme(new URLSearchParams({ preset: 'graphite', display: 'instrument-serif' })))).toContain("Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument-serif' })")
    expect(fontsSource(withFonts('fraunces'))).toContain("Fraunces({ subsets: ['latin'], axes: ['opsz'], variable: '--font-fraunces' })")
    expect(exportedFonts(withFonts('charter'))).toEqual([])
  })
})

test('a preset set in catalogue faces loads them wherever it is shown: Basalt in Inter and JetBrains Mono', () => {
  const basalt = themes.find((t) => t.id === 'basalt')!
  expect([fontOf(basalt.fonts.sans)?.id, fontOf(basalt.fonts.mono)?.id]).toEqual(['inter', 'jetbrains-mono'])
  expect(webFonts(basalt.fonts).map((f) => f.id)).toEqual(['inter', 'jetbrains-mono'])
  // Every preset's faces are the kit's own, on the device, or in the catalog: none a loader can't find.
  for (const t of themes) for (const stack of [t.fonts.sans, t.fonts.mono]) expect([t.id, fontOf(stack) !== undefined]).toEqual([t.id, true])
})

describe('the theme in a URL', () => {
  it('round-trips every preset, named or not, as a short query', () => {
    for (const preset of themes) {
      const theme = readTheme(new URLSearchParams({ preset: preset.id }))
      expect(readTheme(writeTheme(theme))).toEqual(theme)
      // A preset as it ships needs only its name, and none when it is the default's pair (Graphite and Youj are Basalt's: the Youj palette in Clean).
      const fallback = themes.find((t) => t.id === DEFAULT_PRESET)!
      const asDefault = preset.palette === fallback.palette && preset.style === fallback.style
      expect([...writeTheme(theme).keys()]).toEqual(asDefault ? [] : ['preset'])
    }
    const named = readTheme(new URLSearchParams({ preset: 'terminal', name: 'Acme' }))
    expect(named).toMatchObject({ id: 'acme', name: 'Acme', radius: 'none' })
    expect(readTheme(writeTheme(named))).toEqual(named)
  })

  it('carries edits, including a status color reset to the default pair', () => {
    const base = readTheme(new URLSearchParams({ preset: 'terminal' }))
    const { success: _, ...rest } = base
    const edited = defineTheme({ ...rest, accent: '#e5484d', radius: 'lg', controlSize: 'comfortable', neutral: { hue: 40, chroma: 0.02, wash: 0.5 } })
    const params = writeTheme(edited)
    expect(params.get('preset')).toBe('terminal')
    expect(params.get('accent')).toBe('#e5484d')
    expect(params.get('success')).toBe('')
    expect(readTheme(params)).toEqual(edited)
  })

  it('carries a chart palette: five colors in one parameter, or empty to draw one from the accent', () => {
    const basalt = readTheme(new URLSearchParams({ preset: 'basalt' }))
    // Basalt tunes its palette per mode: five for light, five for dark.
    expect(basalt.chart).toMatchObject({ light: { length: 5 }, dark: { length: 5 } })
    // Basalt's own palette needs no parameter; drawing one from the accent instead is an empty one.
    expect(writeTheme(basalt).has('chart')).toBe(false)
    const { chart: _, ...ramp } = basalt
    expect(writeTheme(defineTheme(ramp)).get('chart')).toBe('')
    expect(readTheme(writeTheme(defineTheme(ramp))).chart).toBeUndefined()
    const own = defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), chart: ['#b4f750', 'oklch(0.67 0.21 354)', '#8b5cf6', 'rgb(255 176 32)', '#22d3ee'] })
    const params = writeTheme(own)
    expect(params.get('chart')).toBe('#b4f750|oklch(0.67 0.21 354)|#8b5cf6|rgb(255 176 32)|#22d3ee')
    expect(readTheme(params)).toEqual(own)
    // Four colors, or one it can't read, and the link keeps the preset's.
    expect(readTheme(new URLSearchParams({ preset: 'graphite', chart: '#f00|#0f0|#00f|#ff0' })).chart).toEqual(readTheme(new URLSearchParams({ preset: 'graphite' })).chart)
    expect(readTheme(new URLSearchParams({ preset: 'basalt', chart: '#f00|#0f0|url(x)|#ff0|#0ff' })).chart).toEqual(basalt.chart)
  })

  it('carries a color tuned per mode as light|dark, and a palette per mode as ten colors', () => {
    const basalt = readTheme(new URLSearchParams({ preset: 'basalt' }))
    // Its own pairs need no parameter: they're the preset's.
    expect(writeTheme(basalt).has('accent')).toBe(false)
    expect(writeTheme(basalt).has('chart')).toBe(false)
    // Told apart from a preset that has a single color, a pair is written light first.
    const onGraphite = defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), accent: { light: '#b65009', dark: '#fdaa1c' } })
    const params = writeTheme(onGraphite)
    expect(params.get('accent')).toBe('#b65009|#fdaa1c')
    expect(readTheme(params).accent).toEqual({ light: '#b65009', dark: '#fdaa1c' })
    const perMode = { light: ['#309909', '#e11f80', '#7c38ee', '#d96e00', '#0f91b2'], dark: ['#b4f755', '#f04e9e', '#8d5df8', '#fdaa1c', '#2fd4ec'] } as const
    const charted = defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), chart: perMode })
    expect(writeTheme(charted).get('chart')).toBe([...perMode.light, ...perMode.dark].join('|'))
    expect(readTheme(writeTheme(charted)).chart).toEqual(perMode)
    // Three colors, or a side it can't read, and the link keeps the preset's.
    expect(readTheme(new URLSearchParams({ preset: 'graphite', accent: '#f00|#0f0|#00f' })).accent).toEqual({ light: 'oklch(0.54 0.25 268)', dark: 'oklch(0.8 0.165 73)' })
    expect(readTheme(new URLSearchParams({ preset: 'graphite', accent: '#f00|url(x)' })).accent).toEqual({ light: 'oklch(0.54 0.25 268)', dark: 'oklch(0.8 0.165 73)' })
  })

  it('carries the tone and the info ink, so a two-tone theme is a link', () => {
    const studio = defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), tone: { chrome: 'dark', overlays: 'chrome' }, info: '#0ea5e9' })
    const params = writeTheme(studio)
    expect(params.get('chrome')).toBe('dark')
    expect(params.get('overlays')).toBe('chrome')
    expect(params.get('info')).toBe('#0ea5e9')
    expect(readTheme(params)).toEqual(studio)
    expect(readTheme(new URLSearchParams({ preset: 'graphite', chrome: 'sideways' })).tone).toBeUndefined()
  })

  it('carries the surface gradient, which Basalt leaves flat', () => {
    const basalt = readTheme(new URLSearchParams({ preset: 'basalt' }))
    expect(basalt.surfaces).toEqual({ gradient: 0 })
    expect(writeTheme(basalt).has('gradient')).toBe(false)
    const edited = defineTheme({ ...basalt, surfaces: { gradient: 0.25 } })
    expect(writeTheme(edited).get('gradient')).toBe('0.25')
    expect(readTheme(writeTheme(edited))).toEqual(edited)
    expect(themeSource(edited)).toContain('surfaces: { gradient: 0.25 },')
  })

  it('carries the character: lines, shadow, titles, labels and the title face', () => {
    const brutal = readTheme(new URLSearchParams({ preset: 'brutal' }))
    expect(brutal).toMatchObject({ shadow: 'hard', stroke: { width: 2, ink: 1 }, labels: { case: 'upper', font: 'mono' } })
    const edited = defineTheme({
      ...brutal,
      shadow: 'soft',
      stroke: { ...brutal.stroke, width: 3 },
      headings: { weight: 700, tracking: -0.02 },
      labels: { case: 'none', font: 'mono', tracking: 0.04 },
      fonts: { ...brutal.fonts, display: "Charter, Georgia, serif" },
    })
    const params = writeTheme(edited)
    expect(params.get('preset')).toBe('brutal')
    expect(Object.fromEntries(params)).toMatchObject({ shadow: 'soft', stroke: '3', titleWeight: '700', labelCase: 'none', labelTracking: '0.04' })
    expect(readTheme(params)).toEqual(edited)
    expect(readTheme(new URLSearchParams('stroke=9&shadow=wobbly&labelCase=shout')).stroke?.width).toBe(4)
  })

  it('carries the action fill: Basalt’s accent buttons, and a change to ink', () => {
    const basalt = readTheme(new URLSearchParams({ preset: 'basalt' }))
    expect(basalt).toMatchObject({ actions: 'accent', labels: { case: 'none', font: 'sans' } })
    const params = writeTheme(defineTheme({ ...basalt, actions: 'ink' }))
    // Basalt is the default preset, so the link needn't name it.
    expect(params.has('preset')).toBe(false)
    expect(params.get('actions')).toBe('ink')
    expect(readTheme(params).actions).toBe('ink')
    expect(readTheme(new URLSearchParams('preset=graphite&actions=outline')).actions).toBe('accent')
    // The accent is Basalt's (the Clean style's), so it's the default and the export leaves it out; a change to ink says so.
    expect(themeSource(basalt)).not.toContain('actions:')
    expect(themeSource(readTheme(params))).toContain("actions: 'ink',")
  })

  it('carries the neutral lift, clamped to 0–1', () => {
    expect(readTheme(new URLSearchParams({ preset: 'basalt' })).neutral).toMatchObject({ lift: 1 })
    const params = writeTheme(defineTheme({ ...readTheme(new URLSearchParams({ preset: 'graphite' })), neutral: { hue: 270, chroma: 0.012, wash: 0, lift: 0.5 } }))
    expect(params.get('lift')).toBe('0.5')
    expect(readTheme(params).neutral?.lift).toBe(0.5)
    expect(readTheme(new URLSearchParams('lift=3')).neutral?.lift).toBe(1)
  })

  it('rejects values that are not what they claim to be', () => {
    const theme = readTheme(new URLSearchParams('accent=url(evil)&radius=huge&hue=9999&sans=a;b{c}'))
    const fallback = readTheme(new URLSearchParams())
    expect(theme.accent).toEqual(fallback.accent)
    expect(theme.radius).toBe(fallback.radius)
    expect(theme.neutral?.hue).toBe(360)
    expect(theme.fonts?.sans).toBe(fallback.fonts?.sans)
    expect(theme.name).toBe(DEFAULT_THEME_NAME)
  })
})

describe('the style in a URL', () => {
  it('round-trips every style, and leaves classic, the default, out of the link', () => {
    for (const style of LOOKS) expect(readLook(writeLook(style))).toBe(style)
    expect(writeLook('classic').toString()).toBe('')
    expect(readLook(new URLSearchParams('sidebar=dual&preset=brutal'))).toBe('classic')
    expect(readLook(new URLSearchParams('style=gothic'))).toBe('classic')
  })

  it('travels beside the theme and the frame without disturbing either', () => {
    const theme = readTheme(new URLSearchParams({ preset: 'brutal' }))
    const frame: FrameConfig = { ...DEFAULT_FRAME, sidebar: 'rail-panel' }
    const params = writeLook('bezel', writeFrame(frame, writeTheme(theme)))
    expect(params.toString()).toBe('preset=brutal&sidebar=rail-panel&look=bezel')
    expect(readTheme(params)).toEqual(theme)
    expect(readFrame(params)).toEqual(frame)
    expect(readLook(params)).toBe('bezel')
    // Back to classic takes it out of the link again.
    expect(writeLook('classic', params).has('look')).toBe(false)
  })

  it('offers every style, the default first', () => {
    expect(LOOK_OPTIONS.map((s) => s.id)).toEqual([...LOOKS])
    expect(LOOK_OPTIONS[0]!.id).toBe('classic')
  })
})

describe('the style in the export', () => {
  it('leaves classic, the default, off the provider (a root provider writes it), with no recipes to install', () => {
    const theme = readTheme(new URLSearchParams({ preset: 'brutal' }))
    expect(themeSource(theme, 'package', 'classic')).toBe(themeSource(theme))
    expect(themeSource(theme)).toContain('<html {...themeProps(theme)} data-yj-look="classic">')
    expect(providerTag()).toBe('<YoujProvider theme={theme}>')
    expect(youjAddCommand(DEFAULT_FRAME, 'classic')).toBe(youjAddCommand(DEFAULT_FRAME))
    expect(createItems(DEFAULT_FRAME)).toEqual(frameItems(DEFAULT_FRAME))
  })

  it('puts bezel on the provider, with its recipes in the install', () => {
    expect(providerTag('bezel')).toBe('<YoujProvider theme={theme} look="bezel">')
    const source = themeSource(readTheme(new URLSearchParams({ preset: 'basalt' })), 'registry', 'bezel')
    expect(source).toContain('<YoujProvider theme={theme} look="bezel">')
    expect(source).toContain('<html {...themeProps(theme)} data-yj-look="bezel">')
    expect(source).toContain('<ThemeScope theme={theme} look="bezel">')
    expect(createItems(DEFAULT_FRAME, 'bezel')).toEqual([...frameItems(DEFAULT_FRAME), 'youj-look-bezel'])
    expect(youjAddCommand(DEFAULT_FRAME, 'bezel')).toMatch(/ youj-look-bezel$/)
  })

  it('names a registry item the generator ships for every style but classic, installing its stylesheet beside ui.css', () => {
    const registry = JSON.parse(readFileSync(join(ui, 'registry/ui.json'), 'utf8')) as { name: string; files: unknown[] }[]
    expect(lookItem('classic')).toBeNull()
    expect(lookStylesheet('classic')).toBeNull()
    for (const style of LOOKS.filter((s) => s !== 'classic')) {
      const item = registry.find((i) => i.name === lookItem(style))
      expect(item, style).toBeDefined()
      expect(item!.files).toEqual([{ path: `src/${lookStylesheet(style)}`, type: 'registry:file', target: lookStylesheet(style) }])
      expect(existsSync(join(ui, `src/${lookStylesheet(style)}`)), style).toBe(true)
    }
  })
})

describe('the export', () => {
  const several: FrameConfig = { ...DEFAULT_FRAME, screens: ['app-customers', 'app-week-calendar', 'app-ai-workspace'] }

  it('writes the shell on the router, the nav, the layout, a route per screen and a root that redirects to the home screen', () => {
    const files = frameFiles(several, 'https://www.youj.dev/create', 'package')
    expect(files.map((f) => f.path)).toEqual(['components/app-shell.tsx', 'lib/nav.ts', 'app/page.tsx', 'app/(app)/layout.tsx', 'app/(app)/customers/page.tsx', 'app/(app)/week-calendar/page.tsx', 'app/(app)/ai-workspace/page.tsx'])
    expect(files[0]!.code).toContain('activeNav(pathname)')
    expect(files[1]!.code).toContain("href: '/week-calendar'")
    expect(files.find((f) => f.path === 'app/(app)/customers/page.tsx')!.code).toContain('<Customers />')
    expect(files.find((f) => f.path === 'app/page.tsx')!.code).toContain("redirect('/customers')")
    expect(frameItems(several)).toEqual(expect.arrayContaining(['app-customers', 'app-week-calendar', 'app-ai-workspace']))
    expect(youjAddCommand(several)).toContain('app-ai-workspace')
  })

  it('writes a frame with no screens as the shell and an empty nav to fill', () => {
    const none = { ...DEFAULT_FRAME, screens: [] }
    const files = frameFiles(none, undefined, 'package')
    expect(files.map((f) => f.path)).toEqual(['components/app-shell.tsx', 'lib/nav.ts'])
    expect(files[1]!.code).toContain('export const NAV: FrameNavSection[] = []')
    expect(files[1]!.code).not.toContain('@youj/icons')
  })

  it('leaves the router to the app off Next.js', () => {
    const shell = shellSource(several, undefined, { router: false })
    expect(shell).not.toContain('next/navigation')
    expect(shell).toContain("import { NAV } from '@/lib/nav'")
    expect(frameScreens(several).map((s) => s.component)).toEqual(['Customers', 'WeekCalendar', 'AiWorkspace'])
  })
})

describe('the plan', () => {
  it('puts the account where it lives and installs exactly the parts it uses', () => {
    const card = framePlan({ ...DEFAULT_FRAME, account: 'card', upgrade: false })
    expect(jsx(card)).toContain('footer={<FrameAccountCard user={USER} />}')
    const menu = framePlan({ ...DEFAULT_FRAME, account: 'menu', upgrade: false })
    expect(jsx(menu)).toContain('account={<FrameAccountMenu user={USER} />}')
    expect(jsx(menu)).not.toContain('footer=')
    const bare: FrameConfig = { ...DEFAULT_FRAME, search: 'none', notifications: false, upgrade: false, brand: 'logo', screens: [] }
    expect(frameItems(bare)).toEqual(['frame-shell', 'frame-sidebar-classic', 'frame-topbar-breadcrumb', 'frame-account-card'])
  })

  it('opens every sidebar expanded, and every part it names has a block', () => {
    for (const sidebar of SIDEBARS) expect(jsx(framePlan({ ...DEFAULT_FRAME, sidebar }))).not.toContain('defaultCollapsed')
    for (const config of matrix()) for (const part of framePartsOf(config)) expect(existsSync(join(blocks, `${part.file}.tsx`)), part.file).toBe(true)
  })

  it('opens on Basalt, the default preset, when a link names none (or one it doesn’t know)', () => {
    expect(readTheme(new URLSearchParams()).neutral).toEqual(readTheme(new URLSearchParams({ preset: 'basalt' })).neutral)
    expect(readTheme(new URLSearchParams({ preset: 'neon' })).accent).toEqual(readTheme(new URLSearchParams({ preset: 'basalt' })).accent)
    expect(writeTheme(readTheme(new URLSearchParams({ preset: 'terminal' }))).get('preset')).toBe('terminal')
  })

  it("writes a theme's differences from the defaults: Basalt's are its colours, Terminal's add the rest", () => {
    const basalt = readTheme(new URLSearchParams({ preset: 'basalt' }))
    expect(themeFields(basalt).map(([key]) => key)).toEqual(['id', 'name', 'neutral', 'accent', 'success', 'warning', 'danger', 'chart'])
    const terminal = readTheme(new URLSearchParams({ preset: 'terminal' }))
    const keys = themeFields(terminal).map(([key]) => key)
    expect(keys).toEqual(expect.arrayContaining(['id', 'name', 'accent', 'chart', 'radius', 'controlSize', 'fonts', 'controls', 'shadow', 'labels']))
    expect(themeFields(terminal).find(([key]) => key === 'controlSize')).toEqual(['controlSize', 'compact'])
    expect(themeSource(readTheme(new URLSearchParams({ preset: 'brutal' })), 'registry')).toContain(`import { defineTheme } from '@/lib/youj/theme'`)
  })

  it("writes only the character's keys that differ, and leaves Basalt's character out", () => {
    const brutal = themeSource(readTheme(new URLSearchParams({ preset: 'brutal' })))
    expect(brutal).toContain("shadow: 'hard',")
    expect(brutal).toContain('stroke: { width: 2, ink: 1, icons: 1.3 },')
    expect(brutal).toContain("labels: { case: 'upper', font: 'mono', tracking: 0.02 },")
    const thicker = themeSource(readTheme(new URLSearchParams({ preset: 'graphite', stroke: '2' })))
    expect(thicker).toContain('stroke: { width: 2 },')
    expect(thicker).not.toContain('shadow:')
    expect(themeSource(readTheme(new URLSearchParams({ preset: 'basalt' })))).not.toMatch(/stroke|shadow|headings|labels|surfaces|actions/)
  })
})

/*
 * The exported code must compile: every shell in the matrix, every screen's
 * route, the nav and the layout, every preset's theme in both install modes, and every
 * typeface pairing's theme and next/font setup, typechecked together against
 * the real blocks and next's own font types, with `@/` resolving where
 * `shadcn add` and the export put them.
 */
describe('the exported code', () => {
  it('typechecks for every sidebar, top bar, account, search, screen, theme and typeface', { timeout: 240_000 }, () => {
    const config = ts.getParsedCommandLineOfConfigFile(join(ui, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} })!
    const options: ts.CompilerOptions = {
      ...config.options,
      noUnusedLocals: true,
      paths: {
        ...config.options.paths,
        '@/blocks/*': ['src/blocks/*'],
        '@/lib/youj/*': ['../core/src/lib/youj/*'],
        '@/components/app-shell': ['src/__create__/shell-0.tsx'],
        '@/lib/nav': ['src/__create__/nav.ts'],
        'next/*': [`${next}/*`],
      },
    }
    const virtual = new Map<string, string>()
    matrix().forEach((frame, i) => virtual.set(join(ui, `src/__create__/shell-${i}.tsx`), shellSource(frame, 'https://www.youj.dev/create')))
    virtual.set(join(ui, 'src/__create__/shell-off-next.tsx'), shellSource(DEFAULT_FRAME, undefined, { router: false }))
    virtual.set(join(ui, 'src/__create__/layout.tsx'), layoutSource())
    // Every screen Create offers: the nav they link through, and a route each.
    const all: FrameConfig = { ...DEFAULT_FRAME, screens: Object.keys(SCREENS) }
    virtual.set(join(ui, 'src/__create__/nav.ts'), navSource(all, 'package'))
    virtual.set(join(ui, 'src/__create__/nav-none.ts'), navSource({ ...DEFAULT_FRAME, screens: [] }, 'package'))
    virtual.set(join(ui, 'src/__create__/home.tsx'), homeSource(all)!)
    screenFiles(all).forEach((f, i) => virtual.set(join(ui, `src/__create__/route-${i}.tsx`), f.code))
    for (const preset of themes) {
      const theme = readTheme(new URLSearchParams({ preset: preset.id, name: preset.name }))
      virtual.set(join(ui, `src/__create__/theme-${preset.id}.ts`), themeSource(theme, 'package'))
      virtual.set(join(ui, `src/__create__/theme-${preset.id}-registry.ts`), themeSource(theme, 'registry'))
    }
    // The root a styled export describes: the style is a real prop of the provider.
    for (const style of LOOKS)
      virtual.set(
        join(ui, `src/__create__/root-${style}.tsx`),
        [
          `import type { ReactNode } from 'react'`,
          `import { basalt as theme, YoujProvider } from '@youj/core'`,
          '',
          `export function Root({ children }: { children: ReactNode }) {`,
          `  return ${providerTag(style)}{children}</YoujProvider>`,
          `}`,
          '',
        ].join('\n'),
      )
    for (const pairing of PAIRINGS) {
      const theme = withFonts(pairing.id)
      virtual.set(join(ui, `src/__create__/theme-fonts-${pairing.id}.ts`), themeSource(theme))
      const fonts = fontsSource(theme)
      if (fonts) virtual.set(join(ui, `src/__create__/fonts-${pairing.id}.ts`), fonts)
    }
    // Every web family an app has to load, as a title face (Advanced can pick any of them; Inter and JetBrains Mono come from @fontsource).
    for (const family of FAMILIES.filter(loadable)) {
      const fonts = fontsSource(defineTheme({ ...onPairing(family.id), fonts: { display: family.stack } }))
      virtual.set(join(ui, `src/__create__/fonts-family-${family.id}.ts`), fonts!)
    }
    const host = ts.createCompilerHost(options)
    const read = host.readFile
    host.readFile = (file) => virtual.get(file) ?? read(file)
    host.fileExists = (file) => virtual.has(file) || existsSync(file)
    const getSourceFile = host.getSourceFile
    host.getSourceFile = (file, language, onError) =>
      virtual.has(file) ? ts.createSourceFile(file, virtual.get(file)!, language, true) : getSourceFile(file, language, onError)
    // A shell that can't compile, to prove the check catches one.
    const broken = join(ui, 'src/__create__/broken.tsx')
    virtual.set(broken, shellSource(DEFAULT_FRAME).replace('nav={NAV}', 'nav={USER}'))
    const program = ts.createProgram([...virtual.keys()], options, host)
    const check = (file: string) => {
      const source = program.getSourceFile(file)
      if (!source) return [`${file}: not in the program`]
      return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map(
        (d) => `${file.split('/').at(-1)}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`,
      )
    }
    expect(check(broken).join('\n')).toMatch(/FrameUser.*FrameNavSection|nav/)
    virtual.delete(broken)
    expect([...virtual.keys()].flatMap(check)).toEqual([])
    // The check really read the blocks.
    expect(program.getSourceFile(join(blocks, 'shell.tsx'))).toBeDefined()
    expect(readFileSync(join(blocks, 'shell.tsx'), 'utf8')).toContain('function AppFrame')
  })
})

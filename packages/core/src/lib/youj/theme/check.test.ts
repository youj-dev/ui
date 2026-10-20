import { checkTheme, warnTheme } from './check'
import { themes } from './themes'

test.each(themes.map((t) => [t.name, t] as const))('%s passes every check in both modes', (_, theme) => {
  expect(checkTheme(theme)).toEqual([])
})

test('derived themes pass AA too: any valid neutral and any accent', () => {
  // At the extremes of chroma and wash the near-white surfaces leave sRGB: that's a gamut warning, never a contrast failure.
  const extreme = checkTheme({ accent: '#ffd400', neutral: { hue: 60, chroma: 0.04, wash: 1 }, radius: 'full', controlSize: 'compact', motionPersonality: 'calm' })
  expect(extreme.filter((i) => i.code !== 'gamut')).toEqual([])
  expect(checkTheme({ accent: '#0a0a0a', success: '#9dff00', warning: 'hsl(48 100% 60%)', danger: 'rgb(255 0 80)' })).toEqual([])
  // The docs' example: a bright yellow accent is moved until it passes in both modes.
  expect(checkTheme({ accent: '#ffd400' })).toEqual([])
})

test('reports inputs it cannot use as errors, without deriving', () => {
  const issues = checkTheme({
    accent: 'blurple',
    neutral: { hue: 200, chroma: 0.09, wash: 2 },
    // @ts-expect-error: not a radius
    radius: 'huge',
    // @ts-expect-error: not a personality
    motionPersonality: 'bouncy',
    fonts: { sans: ' ' },
  })
  expect(issues.map((i) => [i.level, i.code, i.token])).toEqual([
    ['error', 'range', 'neutral.chroma'],
    ['error', 'range', 'neutral.wash'],
    ['error', 'invalid', 'accent'],
    ['error', 'invalid', 'radius'],
    ['error', 'invalid', 'motionPersonality'],
    ['error', 'invalid', 'fonts.sans'],
  ])
  expect(issues.every((i) => i.message.length > 10)).toBe(true)
})

test('rejects fonts that could end a declaration or a rule, or that leave a quote or bracket open', () => {
  for (const bad of ['Inter; color: red', 'Inter } body {', '<x>', '"Inter', "Inter')", 'a(b', 'a)b'])
    expect(checkTheme({ fonts: { sans: bad } }).map((i) => i.token)).toEqual(['fonts.sans'])
  expect(checkTheme({ fonts: { sans: '"Inter Display", system-ui, sans-serif', mono: "ui-monospace, 'SF Mono'" } }).filter((i) => i.level === 'error')).toEqual([])
})

test('checks the character fields: ranges and the choices it knows', () => {
  const issues = checkTheme({
    stroke: { width: 0, ink: 1.5, icons: 3 },
    // @ts-expect-error: not a shadow style
    shadow: 'glow',
    headings: { weight: 1000, tracking: -0.5 },
    // @ts-expect-error: not a case
    labels: { case: 'small-caps', tracking: 1 },
    fonts: { display: '' },
  })
  expect(issues.map((i) => [i.level, i.token])).toEqual([
    ['error', 'fonts.display'],
    ['error', 'stroke.width'],
    ['error', 'stroke.ink'],
    ['error', 'stroke.icons'],
    ['error', 'headings.weight'],
    ['error', 'headings.tracking'],
    ['error', 'labels.tracking'],
    ['error', 'shadow'],
    ['error', 'labels.case'],
  ])
})

test('tone must name a chrome and an overlay mode the contract knows; info is read like the other colours', () => {
  const issues = checkTheme({
    // @ts-expect-error: not a chrome tone
    tone: { chrome: 'sepia', overlays: 'popover' },
    info: 'blurple',
  })
  expect(issues.map((i) => [i.level, i.code, i.token])).toEqual([
    ['error', 'invalid', 'info'],
    ['error', 'invalid', 'tone.chrome'],
    ['error', 'invalid', 'tone.overlays'],
  ])
  expect(checkTheme({ tone: { chrome: 'dark', overlays: 'chrome' }, info: '#0e9aa7' })).toEqual([])
})

test('neutral.lift must be between 0 and 1, and a full lift keeps every pair at AA', () => {
  expect(checkTheme({ neutral: { hue: 285, chroma: 0.01, lift: 1.5 } }).map((i) => [i.level, i.token])).toEqual([['error', 'neutral.lift']])
  expect(checkTheme({ neutral: { hue: 285, chroma: 0.04, wash: 1, lift: 1 } }).filter((i) => i.code !== 'gamut')).toEqual([])
})

test('neutral.page must be gray or white, and a white page keeps every pair at AA', () => {
  expect(checkTheme({ neutral: { hue: 270, chroma: 0.012, page: 'beige' as never } }).map((i) => [i.level, i.token])).toEqual([['error', 'neutral.page']])
  expect(checkTheme({ neutral: { hue: 270, chroma: 0.04, wash: 1, page: 'white' } }).filter((i) => i.code !== 'gamut')).toEqual([])
})

test('actions must be accent or ink, and ink actions pass on their own: they are fg lettered in the page colour', () => {
  // @ts-expect-error: not an action fill
  expect(checkTheme({ actions: 'outline' }).map((i) => [i.level, i.token])).toEqual([['error', 'actions']])
  expect(checkTheme({ actions: 'ink' })).toEqual([])
  expect(checkTheme({ actions: 'ink', accent: '#ffd400', neutral: { hue: 95, chroma: 0.04, wash: 1 } }).filter((i) => i.code !== 'gamut')).toEqual([])
})

test('ink only adds contrast: a fully inked theme still passes every pair', () => {
  expect(checkTheme({ stroke: { width: 2, ink: 1 }, shadow: 'hard', neutral: { hue: 95, chroma: 0.04, wash: 1 } }).filter((i) => i.code !== 'gamut')).toEqual([])
})

test('surfaces.gradient must be between 0 and 1, and any amount keeps every pair at AA', () => {
  expect(checkTheme({ surfaces: { gradient: 1.5 } }).map((i) => [i.level, i.token])).toEqual([['error', 'surfaces.gradient']])
  expect(checkTheme({ surfaces: { gradient: -0.1 } }).map((i) => [i.level, i.token])).toEqual([['error', 'surfaces.gradient']])
  // A card only shades toward raised, a checked surface; the sheen is drawn on ink, which has contrast to spare.
  expect(checkTheme({ surfaces: { gradient: 1 }, actions: 'ink' })).toEqual([])
})

test('checks a chart palette: five readable colours, each moved until it reads at 3:1 on every surface', () => {
  // @ts-expect-error: four colors, not five
  expect(checkTheme({ chart: ['#f00', '#0f0', '#00f', '#fc0'] }).map((i) => [i.level, i.code, i.token])).toEqual([['error', 'invalid', 'chart']])
  expect(checkTheme({ chart: ['#f00', '#0f0', 'blurple', '#fc0', '#088'] }).map((i) => [i.level, i.code, i.token])).toEqual([['error', 'invalid', 'chart.3']])
  // The pale and the dark alike pass: light mode darkens them, dark mode lifts them. (Lifting a
  // saturated blue can leave sRGB: a gamut note, never a contrast failure.)
  expect(checkTheme({ chart: ['#ffffe0', '#101010', '#9dff00', '#1f3fff', 'hsl(300 100% 50%)'] }).filter((i) => i.code !== 'gamut')).toEqual([])
  // A wide-gamut series is a gamut note, never a contrast failure.
  const p3 = checkTheme({ chart: ['color(display-p3 0 1 0.2)', '#f00', '#f00', '#f00', '#f00'] })
  expect(p3.length).toBeGreaterThan(0)
  expect(p3.every((i) => i.code === 'gamut' && i.token === 'chart-1')).toBe(true)
})

describe('colors tuned per mode', () => {
  test('are held to AA as given: nothing moves them, so a failing side is an error in its mode', () => {
    // A bright amber reads on black but not as text on white.
    // (The role matrix, whose messages name a tone, has its own tests in check-contrast.test.ts.)
    const issues = checkTheme({ accent: { light: 'oklch(0.8 0.165 73)', dark: 'oklch(0.8 0.165 73)' } }).filter((i) => !i.message.includes(', tone '))
    const contrast = issues.filter((i) => i.code === 'contrast')
    expect(contrast.length).toBeGreaterThan(0)
    expect(contrast.every((i) => i.level === 'error' && i.mode === 'light')).toBe(true)
    expect(contrast.map((i) => `${i.token} on ${i.against}`)).toEqual(expect.arrayContaining(['accent on canvas', 'accent on raised', 'accent-contrast on accent']))
    // The same color given once is derived, and passes.
    expect(checkTheme({ accent: 'oklch(0.8 0.165 73)' })).toEqual([])
  })

  test('a dim dark side fails in dark mode only, and allowLowContrast turns it into warnings', () => {
    const dim = { danger: { light: 'oklch(0.52 0.2 25)', dark: 'oklch(0.4 0.15 25)' } }
    const issues = checkTheme(dim)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.every((i) => i.level === 'error' && i.mode === 'dark' && `${i.token} ${i.against}`.includes('danger'))).toBe(true)
    const accepted = checkTheme({ ...dim, allowLowContrast: true })
    expect(accepted.length).toBe(issues.length)
    expect(accepted.every((i) => i.level === 'warning')).toBe(true)
  })

  test('a chart palette per mode is held to 3:1 as given, each series in its own mode', () => {
    const pale = ['#e8f5e0', 'oklch(0.6 0.23 358)', 'oklch(0.54 0.25 293)', 'oklch(0.625 0.155 55)', 'oklch(0.6 0.11 222)'] as const
    const neon = ['oklch(0.9 0.2 129)', 'oklch(0.67 0.21 354)', 'oklch(0.61 0.22 293)', 'oklch(0.8 0.165 73)', 'oklch(0.8 0.13 210)'] as const
    const issues = checkTheme({ chart: { light: pale, dark: neon } })
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.every((i) => i.code === 'contrast' && i.mode === 'light' && i.token === 'chart-1' && i.min === 3)).toBe(true)
    expect(checkTheme({ chart: { light: neon.map(() => 'oklch(0.54 0.25 293)') as unknown as typeof neon, dark: neon } })).toEqual([])
  })

  test('each side is read like a colour of its own, and a pair needs both', () => {
    expect(checkTheme({ accent: { light: 'blurple', dark: '#fdaa1c' } }).map((i) => [i.level, i.code, i.token])).toEqual([['error', 'invalid', 'accent.light']])
    // @ts-expect-error: a pair needs both modes
    expect(checkTheme({ warning: { light: '#976500' } }).map((i) => [i.code, i.token])).toEqual([['invalid', 'warning']])
    // @ts-expect-error: four colors, not five
    expect(checkTheme({ chart: { light: ['#f00', '#0f0', '#00f', '#fc0'], dark: ['#f00', '#0f0', '#00f', '#fc0', '#088'] } }).map((i) => i.token)).toEqual(['chart.light'])
    expect(checkTheme({ chart: { light: ['#a00', '#070', '#00f', '#840', 'nope'], dark: ['#f55', '#0f0', '#88f', '#fc0', '#0cc'] } }).map((i) => i.token)).toEqual(['chart.light.5'])
  })

  test('every tuned preset passes as given, in both modes', () => {
    for (const theme of themes) expect([theme.id, checkTheme(theme)]).toEqual([theme.id, []])
  })
})

test('warns about colours outside sRGB (a P3 accent) but still passes contrast', () => {
  const issues = checkTheme({ accent: 'color(display-p3 0 1 0.2)' })
  expect(issues.length).toBeGreaterThan(0)
  expect(issues.every((i) => i.code === 'gamut' && i.level === 'warning')).toBe(true)
})

describe('warnTheme', () => {
  const env = process.env.NODE_ENV
  afterEach(() => {
    process.env.NODE_ENV = env
    vi.restoreAllMocks()
  })

  test('logs a failing theme once, as an error, and a passing one never', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const bad = { name: 'Broken', accent: 'not-a-colour' }
    warnTheme(bad)
    warnTheme({ ...bad })
    warnTheme(themes[1])
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]![0]).toMatch(/\[youj\] Broken has 1 theme error/)
  })

  test('leaves gamut notes to checkTheme: a live editor sweeping the chroma stays quiet', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const extreme = { name: 'Out of gamut only', neutral: { hue: 60, chroma: 0.04, wash: 1 } }
    expect(checkTheme(extreme).every((i) => i.code === 'gamut')).toBe(true)
    warnTheme(extreme)
    expect(warn).not.toHaveBeenCalled()
  })

  test('stays quiet in production', () => {
    process.env.NODE_ENV = 'production'
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnTheme({ name: 'Broken in prod', accent: 'nope' })
    expect(error).not.toHaveBeenCalled()
  })
})

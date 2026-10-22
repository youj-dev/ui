import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineTheme, DEFAULTS, isPerMode, LABEL_TRACKING, mergeThemes, MOTION_PERSONALITIES, resolveTheme, themeCss, themeProps, themeVars } from './contract'
import { basalt, graphite, internalPresetById, presetById, themes } from './themes'

describe('defineTheme', () => {
  test('freezes the theme and fills in the neutral wash', () => {
    const t = defineTheme({ neutral: { hue: 60, chroma: 0.01 }, accent: '#ff5a1f' })
    expect(Object.isFrozen(t)).toBe(true)
    expect(Object.isFrozen(t.neutral)).toBe(true)
    expect(t.neutral).toEqual({ hue: 60, chroma: 0.01, wash: 0 })
  })

  test('freezes a colour given per mode, and keeps a single colour a string', () => {
    const t = defineTheme({ accent: { light: '#c24700', dark: '#fdaa1c' }, success: '#10b981' })
    expect(Object.isFrozen(t.accent)).toBe(true)
    expect(t.accent).toEqual({ light: '#c24700', dark: '#fdaa1c' })
    expect(t.success).toBe('#10b981')
    expect([isPerMode(t.accent), isPerMode(t.success), isPerMode(undefined)]).toEqual([true, false, false])
  })

  test('keeps literal types, so preset ids are a union', () => {
    const id: 'graphite' = graphite.id
    expect(id).toBe('graphite')
  })
})

/** A color's three variables: `--yj-<name>` to derive from, `-light` and `-dark` as given. */
const colour = (name: string, single: string, light = 'initial', dark = 'initial') => ({
  [`--yj-${name}`]: single,
  [`--yj-${name}-light`]: light,
  [`--yj-${name}-dark`]: dark,
})

describe('themeVars', () => {
  test('an override writes only the fields it sets', () => {
    // A single color also clears the per-mode pair, so an outer theme's pair can't win over it.
    expect(themeVars({ accent: '#ff5a1f' })).toEqual(colour('accent', '#ff5a1f'))
    expect(themeVars({})).toEqual({})
  })

  test('a colour per mode writes -light and -dark as given, and clears the single colour', () => {
    expect(themeVars({ accent: { light: '#c24700', dark: '#fdaa1c' } })).toEqual(colour('accent', 'initial', '#c24700', '#fdaa1c'))
    expect(themeVars({ danger: { light: 'oklch(0.56 0.2 27)', dark: 'oklch(0.67 0.18 25)' } })).toEqual(
      colour('danger', 'initial', 'oklch(0.56 0.2 27)', 'oklch(0.67 0.18 25)'),
    )
    // A complete theme resets the pair of every color it leaves unset (the status inks fall back to Basalt's in youj.css); with no color of its own, its chart is Basalt's.
    expect(themeVars({ id: 'x' })).toMatchObject({ ...colour('success', 'initial'), ...colour('chart-2', 'initial', 'oklch(0.62 0.19 12)', 'oklch(0.67 0.21 354)') })
  })

  test('a complete theme (one with an id) writes every field and resets unset colours, display face and labels', () => {
    expect(themeVars({ id: 'ember', accent: '#ff5a1f' })).toEqual({
      '--yj-neutral-hue': '285',
      '--yj-neutral-chroma': '0.008',
      '--yj-neutral-wash': '0',
      '--yj-neutral-lift': '1',
      '--yj-neutral-page': '0',
      ...colour('accent', '#ff5a1f'),
      ...colour('success', 'initial'),
      ...colour('warning', 'initial'),
      ...colour('danger', 'initial'),
      ...colour('info', 'initial'),
      ...colour('chart-1', 'initial'),
      ...colour('chart-2', 'initial'),
      ...colour('chart-3', 'initial'),
      ...colour('chart-4', 'initial'),
      ...colour('chart-5', 'initial'),
      '--yj-radius': '0.625rem',
      '--yj-density': '0',
      '--yj-font-sans': DEFAULTS.fonts.sans,
      '--yj-font-mono': DEFAULTS.fonts.mono,
      '--yj-font-display': 'initial',
      '--yj-stroke-width': '1px',
      '--yj-stroke-ink': '0',
      '--yj-icon-weight': '1',
      '--yj-shadow-soft': '1',
      '--yj-shadow-hard': '0',
      '--yj-action-ink': '0',
      '--yj-pill': '0',
      '--yj-field-soft': '1',
      '--yj-surface-gradient': '0',
      '--yj-tone-chrome-fixed': '0',
      '--yj-tone-chrome-dark': '0',
      '--yj-tone-bars-chrome': '1',
      '--yj-tone-header-chrome': '1',
      '--yj-tone-overlay-chrome': '0',
      '--yj-tone-overlay-ink': '0',
      '--yj-heading-weight': '600',
      '--yj-heading-tracking': '-0.025em',
      '--yj-label-case': 'initial',
      '--yj-label-font': 'initial',
      '--yj-label-tracking': 'initial',
    })
  })

  test('tone writes its switches: chrome held to a mode, whether bars and overlays follow it, and ink highlights; an override writes only what it sets', () => {
    expect(themeVars({ tone: { chrome: 'dark' } })).toEqual({ '--yj-tone-chrome-fixed': '1', '--yj-tone-chrome-dark': '1' })
    expect(themeVars({ tone: { chrome: 'light' } })).toEqual({ '--yj-tone-chrome-fixed': '1', '--yj-tone-chrome-dark': '0' })
    expect(themeVars({ tone: { chrome: 'match' } })).toEqual({ '--yj-tone-chrome-fixed': '0', '--yj-tone-chrome-dark': '0' })
    expect(themeVars({ tone: { overlays: 'chrome' } })).toEqual({ '--yj-tone-overlay-chrome': '1', '--yj-tone-overlay-ink': '0' })
    expect(themeVars({ tone: { overlays: 'ink' } })).toEqual({ '--yj-tone-overlay-chrome': '0', '--yj-tone-overlay-ink': '1' })
    expect(themeVars({ tone: { bars: 'content' } })).toEqual({ '--yj-tone-bars-chrome': '0', '--yj-tone-header-chrome': '0' })
    expect(themeVars({ tone: { bars: 'top' } })).toEqual({ '--yj-tone-bars-chrome': '0', '--yj-tone-header-chrome': '1' })
    // A complete theme resets what it leaves out, so an outer scope's tone never shows through.
    expect(themeVars({ id: 'two-tone', tone: { chrome: 'dark' } })).toMatchObject({
      '--yj-tone-chrome-fixed': '1',
      '--yj-tone-chrome-dark': '1',
      '--yj-tone-bars-chrome': '1',
      '--yj-tone-header-chrome': '1',
      '--yj-tone-overlay-chrome': '0',
      '--yj-tone-overlay-ink': '0',
    })
    expect(themeVars({ id: 'plain' })).toMatchObject({ '--yj-tone-chrome-fixed': '0', '--yj-tone-chrome-dark': '0', '--yj-tone-overlay-chrome': '0' })
  })

  test('tone is a group: an override merges it key by key, a complete theme replaces it', () => {
    expect(mergeThemes({ id: 'a', tone: { chrome: 'dark' } }, { tone: { overlays: 'chrome' } })?.tone).toEqual({ chrome: 'dark', overlays: 'chrome' })
    expect(mergeThemes({ id: 'a', tone: { chrome: 'dark' } }, { id: 'b' })?.tone).toBeUndefined()
    expect(resolveTheme({ tone: { chrome: 'dark' } }).tone).toEqual({ chrome: 'dark', bars: 'chrome', overlays: 'content' })
    expect(resolveTheme(null).tone).toEqual({ chrome: 'match', bars: 'chrome', overlays: 'content' })
  })

  test('info is a colour like the others: one to derive from, a pair used as given, or unset', () => {
    expect(themeVars({ info: '#0ea5e9' })).toEqual(colour('info', '#0ea5e9'))
    expect(themeVars({ info: { light: '#0369a1', dark: '#7dd3fc' } })).toEqual({ '--yj-info': 'initial', '--yj-info-light': '#0369a1', '--yj-info-dark': '#7dd3fc' })
  })

  test('actions: ink fills primary actions with the text colour; an override leaves them alone unless it sets them', () => {
    expect(themeVars({ actions: 'ink' })).toEqual({ '--yj-action-ink': '1' })
    expect(themeVars({ actions: 'accent' })).toEqual({ '--yj-action-ink': '0' })
    expect(themeVars({ accent: '#ff5a1f' })).not.toHaveProperty('--yj-action-ink')
    // A complete theme resets it (to Basalt's accent), so a preset nested in an ink theme keeps its own buttons.
    expect(themeVars({ id: 'nested' })['--yj-action-ink']).toBe('0')
    expect(themeVars({ id: 'nested', actions: 'ink' })['--yj-action-ink']).toBe('1')
    expect(resolveTheme({}).actions).toBe('accent')
    expect(mergeThemes({ id: 'outer', actions: 'ink' }, { accent: 'teal' })).toMatchObject({ actions: 'ink', accent: 'teal' })
    expect(mergeThemes({ id: 'outer', actions: 'ink' }, { id: 'inner' })).not.toHaveProperty('actions')
  })

  test('controls: rounded swaps the pills for the control radius; rounded (Clean) is the default, and a complete theme resets them', () => {
    expect(themeVars({ controls: 'rounded' })).toEqual({ '--yj-pill': '0' })
    expect(themeVars({ controls: 'pill' })).toEqual({ '--yj-pill': '1' })
    expect(themeVars({ accent: '#ff5a1f' })).not.toHaveProperty('--yj-pill')
    // A preset nested in a pill theme draws its own rounded controls again.
    expect(themeVars({ id: 'nested' })['--yj-pill']).toBe('0')
    expect(resolveTheme({}).controls).toBe('rounded')
    expect(themeVars(graphite)['--yj-pill']).toBe('0')
    expect(themeVars(basalt)['--yj-pill']).toBe('0')
    expect(themeVars({ id: 'bezel', controls: 'pill' })['--yj-pill']).toBe('1')
    // Terminal and Brutal pin pills: square corners either way, but the pill variable stays what it was.
    for (const preset of [presetById('terminal'), presetById('brutal')]) expect([preset.id, themeVars(preset)['--yj-pill']]).toEqual([preset.id, '1'])
  })

  test('fields: soft draws every field as a band with no edge and is the default; outlined draws the edge; a complete theme resets it', () => {
    expect(themeVars({ fields: 'outlined' })).toEqual({ '--yj-field-soft': '0' })
    expect(themeVars({ accent: '#ff5a1f' })).not.toHaveProperty('--yj-field-soft')
    expect(themeVars({ id: 'nested' })['--yj-field-soft']).toBe('1')
    expect(resolveTheme({}).fields).toBe('soft')
    for (const preset of [graphite, basalt]) expect([preset.id, themeVars(preset)['--yj-field-soft']]).toEqual([preset.id, '1'])
    for (const preset of [presetById('terminal'), presetById('brutal')]) expect([preset.id, themeVars(preset)['--yj-field-soft']]).toEqual([preset.id, '0'])
  })

  test('chart: a palette writes one colour per series; a complete theme without one resets them, so its charts draw from its accent', () => {
    const chart = ['#b4f750', '#f24e8d', '#8b5cf6', '#ffb020', '#22d3ee'] as const
    expect(themeVars({ chart })).toEqual({
      ...colour('chart-1', '#b4f750'),
      ...colour('chart-2', '#f24e8d'),
      ...colour('chart-3', '#8b5cf6'),
      ...colour('chart-4', '#ffb020'),
      ...colour('chart-5', '#22d3ee'),
    })
    // Per mode, each series writes its pair.
    const perMode = { light: ['#2f9e0a', '#e11f80', '#7c38ee', '#d96e00', '#0f91b2'], dark: chart } as const
    expect(themeVars({ chart: perMode })).toMatchObject({ ...colour('chart-1', 'initial', '#2f9e0a', '#b4f750'), ...colour('chart-5', 'initial', '#0f91b2', '#22d3ee') })
    // An override without one leaves the surrounding palette alone.
    expect(themeVars({ accent: 'teal' })).not.toHaveProperty('--yj-chart-1')
    expect(themeVars({ id: 'nested', accent: 'teal' })['--yj-chart-3']).toBe('initial')
    // With no color of its own, a complete theme is Basalt's, chart included.
    expect(themeVars({ id: 'nested' })['--yj-chart-3-light']).toBe('oklch(0.46 0.19 302)')
    // The palette is frozen with the theme, and travels whole: an override's replaces the outer one.
    expect(Object.isFrozen(defineTheme({ chart }).chart)).toBe(true)
    const frozen = defineTheme({ chart: perMode }).chart as typeof perMode
    expect([Object.isFrozen(frozen), Object.isFrozen(frozen.light), Object.isFrozen(frozen.dark)]).toEqual([true, true, true])
    const other = ['red', 'orange', 'gold', 'green', 'blue'] as const
    expect(mergeThemes({ id: 'outer', chart }, { chart: other })!.chart).toEqual(other)
    expect(mergeThemes({ id: 'outer', chart }, { accent: 'teal' })!.chart).toEqual(chart)
    expect(resolveTheme({}).chart).toBe(DEFAULTS.chart)
    expect(resolveTheme({ accent: 'teal' }).chart).toBeUndefined()
  })

  test('surfaces: the gradient writes its amount; an override without one leaves it alone; a complete theme resets it to Basalt’s', () => {
    expect(themeVars({ surfaces: { gradient: 0.6 } })).toEqual({ '--yj-surface-gradient': '0.6' })
    expect(themeVars({ accent: 'teal' })).not.toHaveProperty('--yj-surface-gradient')
    expect(themeVars({ id: 'nested' })['--yj-surface-gradient']).toBe('0')
    expect(resolveTheme({}).surfaces).toEqual({ gradient: 0 })
    expect(mergeThemes({ id: 'outer', surfaces: { gradient: 0.6 } }, { accent: 'teal' })).toMatchObject({ surfaces: { gradient: 0.6 } })
    expect(Object.isFrozen(defineTheme({ surfaces: { gradient: 1 } }).surfaces)).toBe(true)
  })

  test('maps the character fields to their CSS values', () => {
    expect(
      themeVars({
        stroke: { width: 2, ink: 1, icons: 1.25 },
        shadow: 'hard',
        headings: { weight: 800, tracking: -0.04 },
        fonts: { display: 'Didot, serif' },
      }),
    ).toEqual({
      '--yj-font-display': 'Didot, serif',
      '--yj-stroke-width': '2px',
      '--yj-stroke-ink': '1',
      '--yj-icon-weight': '1.25',
      '--yj-shadow-soft': '0',
      '--yj-shadow-hard': '1',
      '--yj-heading-weight': '800',
      '--yj-heading-tracking': '-0.04em',
    })
    expect(themeVars({ shadow: 'none' })).toEqual({ '--yj-shadow-soft': '0', '--yj-shadow-hard': '0' })
  })

  test('capital labels take tracking fitted to their face unless the theme gives one', () => {
    expect(themeVars({ labels: { case: 'upper' } })).toEqual({ '--yj-label-case': 'uppercase', '--yj-label-tracking': `${LABEL_TRACKING.sans}em` })
    expect(themeVars({ labels: { case: 'upper', font: 'mono' }, fonts: { mono: 'Menlo' } })).toEqual({
      '--yj-font-mono': 'Menlo',
      '--yj-label-case': 'uppercase',
      '--yj-label-font': 'Menlo',
      '--yj-label-tracking': `${LABEL_TRACKING.mono}em`,
    })
    expect(themeVars({ labels: { case: 'upper', tracking: 0.12 } })['--yj-label-tracking']).toBe('0.12em')
    // Sentence-case labels keep the spacing they inherit.
    expect(themeVars({ id: 'x', labels: { case: 'none' } })['--yj-label-tracking']).toBe('initial')
    // Capitals are fitted to their face; the default (Basalt's sentence case in the text face) keeps the text's own.
    expect(themeVars({ id: 'x', labels: { case: 'upper', font: 'mono' } })['--yj-label-tracking']).toBe(`${LABEL_TRACKING.mono}em`)
    expect(themeVars({ id: 'x', labels: { font: 'mono' } })['--yj-label-tracking']).toBe('initial')
    expect(themeVars({ id: 'x' })['--yj-label-tracking']).toBe('initial')
  })

  test('maps the scales to their CSS values', () => {
    expect(themeVars({ neutral: { hue: 60, chroma: 0.01 }, radius: 'full', controlSize: 'compact', fonts: { mono: 'Menlo' } })).toEqual({
      '--yj-neutral-hue': '60',
      '--yj-neutral-chroma': '0.01',
      '--yj-neutral-wash': '0',
      '--yj-neutral-lift': '0',
      '--yj-neutral-page': '0',
      '--yj-radius': '1rem',
      '--yj-density': '-1',
      '--yj-font-mono': 'Menlo',
    })
    expect(themeVars({ neutral: { hue: 285, chroma: 0.008, lift: 1 } })['--yj-neutral-lift']).toBe('1')
    expect(themeVars({ neutral: { hue: 270, chroma: 0.012, page: 'white' } })['--yj-neutral-page']).toBe('1')
  })
})

describe('themeProps', () => {
  test('marks a scope, sets the personality and carries the contract', () => {
    const props = themeProps({ id: 'hero', accent: '#10b981', motionPersonality: 'lively' })
    expect(props['data-yj-theme']).toBe('hero')
    expect(props['data-yj-motion']).toBe('lively')
    expect(props.style).toMatchObject({ '--yj-accent': '#10b981', '--yj-radius': '0.625rem' })
  })

  test('an unnamed theme still marks the element as a scope', () => {
    expect(themeProps({ accent: '#10b981' })['data-yj-theme']).toBe('')
    expect(themeProps({ accent: '#10b981' })).not.toHaveProperty('data-yj-motion')
  })
})

test('themeCss writes a rule for the selector, and says how to set motion', () => {
  const css = themeCss(defineTheme({ name: 'Ember', accent: '#ff5a1f', controlSize: 'compact', motionPersonality: 'calm' }), '.hero')
  expect(css).toContain('/* Ember */')
  expect(css).toContain('.hero {\n  --yj-accent: #ff5a1f;\n  --yj-accent-light: initial;\n  --yj-accent-dark: initial;\n  --yj-density: -1;\n}')
  expect(css).toContain('data-yj-motion="calm"')
  expect(themeCss(defineTheme({ id: 'ember', accent: '#ff5a1f' }), "[data-yj-theme='ember']")).toContain('--yj-success: initial;')
})

test('themeCss cannot be broken out of by a name, a description or a selector', () => {
  const css = themeCss({ name: 'a */ body{display:none} /*', description: 'x */ y', accent: '#ff5a1f' })
  expect(css.split('*/')).toHaveLength(2)
  expect(() => themeCss({ accent: '#ff5a1f' }, 'a{}b')).toThrow(/braces/)
})

test('mergeThemes applies an override over the outer theme, fonts key by key', () => {
  const merged = mergeThemes({ accent: 'red', radius: 'lg', fonts: { sans: 'A', mono: 'B' } }, { accent: 'blue', fonts: { mono: 'C' } })
  expect(merged).toEqual({ accent: 'blue', radius: 'lg', fonts: { sans: 'A', mono: 'C' } })
  expect(mergeThemes(null, { accent: 'blue' })).toEqual({ accent: 'blue' })
  expect(mergeThemes({ accent: 'red' }, undefined)).toEqual({ accent: 'red' })
})

test('mergeThemes merges the character groups key by key too', () => {
  const merged = mergeThemes(
    { stroke: { width: 2, ink: 1 }, labels: { case: 'upper', font: 'mono' }, headings: { weight: 800 } },
    { stroke: { ink: 0.5 }, labels: { font: 'sans' }, shadow: 'none' },
  )
  expect(merged).toEqual({
    stroke: { width: 2, ink: 0.5 },
    labels: { case: 'upper', font: 'sans' },
    headings: { weight: 800 },
    shadow: 'none',
  })
})

test('mergeThemes lets a complete inner theme replace the outer one, so nothing leaks in', () => {
  const inner = { id: 'terminal', accent: 'teal' }
  expect(mergeThemes({ id: 'brutal', success: 'olive', radius: 'sm' }, inner)).toBe(inner)
  // An override inside a complete theme keeps it complete, under its id.
  expect(mergeThemes({ id: 'brutal', radius: 'sm' }, { accent: 'blue' })).toEqual({ id: 'brutal', radius: 'sm', accent: 'blue' })
  // A color given per mode travels whole: an override's pair or single color replaces the outer one.
  const pair = { light: '#c24700', dark: '#fdaa1c' }
  expect(mergeThemes({ id: 'outer', accent: pair }, { radius: 'lg' })).toMatchObject({ accent: pair })
  expect(mergeThemes({ id: 'outer', accent: pair }, { accent: 'teal' })).toMatchObject({ accent: 'teal' })
})

test("resolveTheme fills every contract field with the defaults (Basalt's)", () => {
  expect(resolveTheme({ accent: '#fff' })).toEqual({ ...DEFAULTS, accent: '#fff', chart: undefined })
})

describe('a complete theme with no fields set is Basalt', () => {
  test('defineTheme({ id }) writes the contract Basalt does, but for the accent and status pairs it leaves to youj.css', () => {
    const unset = themeVars(defineTheme({ id: 'acme' }))
    const inks = /^--yj-(accent|success|warning|danger)-(light|dark)$/
    const same = (vars: Record<string, string>) => Object.fromEntries(Object.entries(vars).filter(([name]) => !inks.test(name)))
    expect(same(unset)).toEqual(same(themeVars(basalt)))
    // Those pairs are reset to `initial`, which youj.css draws as Basalt's (the next test), so the rendered theme is Basalt's too.
    for (const name of Object.keys(unset).filter((n) => inks.test(n))) expect(unset[name as keyof typeof unset]).toBe('initial')
    // Naming a theme changes nothing else about it.
    expect(themeVars(defineTheme({ id: 'acme', radius: 'sm' }))['--yj-radius']).toBe(themeVars(defineTheme({ radius: 'sm' }))['--yj-radius'])
    expect(themeVars(defineTheme({ id: 'acme', radius: 'sm' }))['--yj-neutral-hue']).toBe('285')
  })

  test("an unset accent and status ink fall back to Basalt's pair in youj.css and in the JS derivation", () => {
    const css = readFileSync(resolve(__dirname, '../../../styles/youj.css'), 'utf8')
    for (const [ink, mode] of [['accent', 'light'], ['success', 'light'], ['warning', 'light'], ['danger', 'light'], ['accent', 'dark'], ['success', 'dark'], ['warning', 'dark'], ['danger', 'dark']] as const) {
      const pair = basalt[ink] as { light: string; dark: string }
      expect(css, `${ink} ${mode}`).toContain(`var(--yj-${ink}-${mode}, ${pair[mode]})`)
    }
  })
})

describe('presets', () => {
  test("Graphite is first (the light default); Basalt (the dark one) is the defaults' baseline, neutral ramp and colour included", () => {
    expect(themes[0]).toBe(graphite)
    // The presets leave `tone` unset (chrome and overlays follow the page), so they match every default but that one.
    const { tone: _tone, neutral: _neutral, labels: _labels, ...defaults } = DEFAULTS
    expect(basalt).toMatchObject(defaults)
    expect(basalt.labels).toMatchObject(DEFAULTS.labels)
    expect(DEFAULTS.neutral).toMatchObject(basalt.neutral)
    expect(presetById('terminal').id).toBe('terminal')
    // Anything else falls back to Graphite: an unknown id, nothing at all, or a preset that's been retired.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const id of ['nope', '', null, undefined, 'paper', 'bloom', 'tide']) expect(presetById(id)).toBe(graphite)
  })

  test('an unknown preset id warns once in development; no id is not a mistake', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    presetById('graphit')
    presetById('graphit')
    presetById(undefined)
    presetById('')
    internalPresetById('youj')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown theme preset "graphit"'))
    vi.stubEnv('NODE_ENV', 'production')
    presetById('another')
    expect(warn).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
    warn.mockRestore()
  })

  test('there are eleven, with unique ids and names: the Youj palette in four styles, Youj itself, and the six that match a backdrop', () => {
    expect(themes.map((t) => t.id)).toEqual(['graphite', 'terminal', 'brutal', 'basalt', 'youj', 'meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather'])
    expect(new Set(themes.map((t) => t.name)).size).toBe(themes.length)
  })

  test('each moves with a personality the contract knows', () => {
    for (const theme of themes) expect(MOTION_PERSONALITIES).toContain(theme.motionPersonality)
  })

  test('every preset gives its colours per mode', () => {
    for (const theme of themes) expect([theme.id, isPerMode(theme.accent)]).toEqual([theme.id, true])
    expect(graphite.accent).toEqual(basalt.accent)
  })

  /* Each preset is also a copyable CSS example; it must say exactly what the TS object says. */
  test.each(themes.map((t) => [t.id, t] as const))('themes/%s.css sets exactly the contract of the TS preset', (id, theme) => {
    const css = readFileSync(resolve(__dirname, `themes/${id}.css`), 'utf8')
    const body = css.slice(css.indexOf(`[data-yj-theme='${id}'] {`))
    const declared = Object.fromEntries([...body.matchAll(/(--yj-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value!.trim()]))
    expect(declared).toEqual(themeVars(theme))
    expect(css).toContain(`data-yj-motion="${theme.motionPersonality}"`)
  })
})

describe('defaults', () => {
  test('a complete theme and an override agree on everything but colour: both are Basalt unless they say otherwise', () => {
    const complete = themeVars({ id: 'mine', accent: '#ff5a1f' })
    const override = themeVars(basalt)
    // The fonts, control size, actions, headings and labels a bare `defineTheme({ id, accent })` gets are the ones Basalt (the page's CSS) sets.
    for (const name of ['--yj-density', '--yj-font-sans', '--yj-font-mono', '--yj-action-ink', '--yj-surface-gradient', '--yj-heading-weight', '--yj-heading-tracking', '--yj-label-case', '--yj-label-font', '--yj-label-tracking'] as const) {
      expect(complete[name], name).toBe(override[name])
    }
  })
})

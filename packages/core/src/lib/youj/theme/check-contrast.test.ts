import { checkRoles, checkTheme, themeErrors, TONE_VARIANTS, warnTheme } from './check'
import { themes } from './themes'

/* The derivation never lets a valid input miss AA, so these tests break it on
 * purpose: a theme named "Low contrast" gets fg-subtle pulled next to the
 * canvas, to exercise what happens when a pair fails. */
vi.mock('./derive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./derive')>()
  return {
    ...actual,
    derivePalette: (theme: import('./contract').ThemeInput, mode: import('./derive').Mode) => {
      const palette = actual.derivePalette(theme, mode)
      if (theme.name !== 'Low contrast') return palette
      const [l, c, h] = palette.canvas
      return { ...palette, 'fg-subtle': [mode === 'light' ? l - 0.08 : l + 0.08, c, h] }
    },
  }
})

const low = { name: 'Low contrast', accent: '#1f6feb' }

test('an AA failure is an error, naming the pair, the ratio and the minimum', () => {
  const issues = checkTheme(low).filter((i) => i.code === 'contrast')
  expect(issues.length).toBeGreaterThan(0)
  expect(issues.every((i) => i.level === 'error' && i.token === 'fg-subtle' && i.min === 4.5 && i.ratio! < 4.5)).toBe(true)
  expect(issues.map((i) => i.mode)).toEqual(expect.arrayContaining(['light', 'dark']))
  expect(themeErrors(low)).toHaveLength(issues.length)
})

test('allowLowContrast turns the failures into warnings, and themeErrors lets the theme through', () => {
  const issues = checkTheme({ ...low, allowLowContrast: true }).filter((i) => i.code === 'contrast')
  expect(issues.length).toBeGreaterThan(0)
  expect(issues.every((i) => i.level === 'warning')).toBe(true)
  expect(themeErrors({ ...low, allowLowContrast: true })).toEqual([])
})

test('the eleven presets have no errors and no warnings', () => {
  expect(themes).toHaveLength(11)
  for (const theme of themes) expect(checkTheme(theme)).toEqual([])
})

/* The role matrix: every pair a role implies, for each preset in light and
 * dark under every tone a theme can wear (check.ts checkRoles). */
describe('checkRoles', () => {
  test('the twelve presets pass every pair, in both modes and under every tone', () => {
    expect(TONE_VARIANTS.map((v) => v.name)).toEqual([
      'match',
      'chrome dark',
      'chrome light',
      'chrome dark, overlays chrome',
      'chrome dark, bars top, overlays chrome',
      'chrome dark, bars content, overlays chrome',
      'chrome dark, bars content, overlays ink',
      'chrome light, bars content, overlays ink',
    ])
    for (const theme of themes) expect([theme.id, checkRoles(theme)]).toEqual([theme.id, []])
  })

  test('so does a sweep of neutrals: hue, chroma up to 0.04, wash, lift and a white page', () => {
    const failures: string[] = []
    for (let hue = 0; hue < 360; hue += 45)
      for (const chroma of [0, 0.02, 0.04])
        for (const wash of [0, 1])
          for (const lift of [0, 1])
            for (const page of ['gray', 'white'] as const)
              for (const issue of checkRoles({ neutral: { hue, chroma, wash, lift, page } })) failures.push(`${hue}/${chroma}/${wash}/${lift}/${page}: ${issue.message}`)
    expect(failures).toEqual([])
  })

  test('a pair that misses is an error naming the pair, and a warning under allowLowContrast', () => {
    // An info ink given as white in light: white text on it, and its text on its own tint, both miss.
    const washed = { info: { light: '#ffffff', dark: '#000000' } }
    const issues = checkRoles(washed)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.every((i) => i.level === 'error' && i.code === 'contrast')).toBe(true)
    expect(issues.map((i) => `${i.token} on ${i.against}`)).toEqual(expect.arrayContaining(['on-accent on info']))
    expect(checkRoles({ ...washed, allowLowContrast: true }).every((i) => i.level === 'warning')).toBe(true)
  })

  test('checkTheme and themeErrors include the role matrix', () => {
    const washed = { info: { light: '#ffffff', dark: '#000000' } }
    expect(checkTheme(washed)).toEqual(expect.arrayContaining(checkRoles(washed)))
    expect(themeErrors(washed).map((i) => `${i.token} on ${i.against}`)).toContain('on-accent on info')
  })
})

describe('warnTheme', () => {
  afterEach(() => vi.restoreAllMocks())

  test('logs AA failures with console.error, with the way out', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnTheme({ ...low, id: 'low-error' })
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]![0]).toMatch(/Low contrast has \d+ theme error\(s\)[\s\S]*fg-subtle on canvas[\s\S]*allowLowContrast: true/)
    expect(warn).not.toHaveBeenCalled()
  })

  test('an accepted failure is a warning, not an error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnTheme({ ...low, id: 'low-accepted', allowLowContrast: true })
    expect(error).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toMatch(/accepted with allowLowContrast/)
  })
})

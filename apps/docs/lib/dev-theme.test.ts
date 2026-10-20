import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveRoles, formatPaint } from '@youj/core/lib/youj/theme'
import { checkTheme } from '@youj/core/lib/youj/theme/check'
import { applyDevTheme, applyStage, applyStagePattern, DEV_PRESETS, devSnippet, devTheme, FIELDS, PAPER, patchOverrides, presetSwatch, SITE_PRESET_ID, type Overrides } from './dev-theme'

/* The developer panel's model: edits land on <html> as the site's custom
 * properties, come off again, and print as a defineTheme snippet. */

describe('applying the panel to the site scope', () => {
  afterEach(() => document.documentElement.removeAttribute('style'))

  it('writes the edited inputs as the contract variables on <html> and removes them again', () => {
    const root = document.documentElement
    let overrides: Overrides = {}
    for (const [id, value] of [
      ['neutral.hue', 85],
      ['neutral.wash', 0.7],
      ['accent', '#ff5a1f'],
      ['radius', 'full'],
    ] as const) {
      const field = FIELDS.find((f) => f.id === id)!
      overrides = patchOverrides(overrides, (field.write as (v: unknown) => Overrides)(value))
    }
    const off = applyDevTheme(root, devTheme(SITE_PRESET_ID, 'dark', overrides))
    expect(root.style.getPropertyValue('--yj-neutral-hue')).toBe('85')
    expect(root.style.getPropertyValue('--yj-neutral-wash')).toBe('0.7')
    expect(root.style.getPropertyValue('--yj-accent')).toBe('#ff5a1f')
    expect(root.style.getPropertyValue('--yj-radius')).toBe('1rem')
    off()
    expect(root.style.getPropertyValue('--yj-neutral-hue')).toBe('')
    expect(root.style.getPropertyValue('--yj-accent')).toBe('')
  })

  it("wears the site's own theme per mode until something is edited", () => {
    expect(devTheme(SITE_PRESET_ID, 'dark', {}).id).toBe('basalt')
    expect(devTheme(SITE_PRESET_ID, 'light', {}).id).toBe('site-light')
  })

  it('writes a two-tone look as the tone switches, and an edit to the tone on top of it', () => {
    const root = document.documentElement
    const off = applyDevTheme(root, devTheme('graphite-studio', 'light', {}))
    expect(root.style.getPropertyValue('--yj-tone-chrome-fixed')).toBe('1')
    expect(root.style.getPropertyValue('--yj-tone-chrome-dark')).toBe('1')
    expect(root.style.getPropertyValue('--yj-tone-overlay-chrome')).toBe('0')
    off()
    const overrides = patchOverrides({}, (FIELDS.find((f) => f.id === 'tone.overlays')!.write as (v: string) => Overrides)('chrome'))
    expect(devTheme('graphite-studio', 'light', overrides).tone).toEqual({ chrome: 'dark', overlays: 'chrome' })
  })
})

describe('the preset gallery', () => {
  it('has the shipped presets, the internal ones, paper and two-tone looks in both directions', () => {
    const ids = DEV_PRESETS.map((p) => p.id)
    expect(ids).toEqual(expect.arrayContaining(['site', 'basalt', 'graphite', 'terminal', 'brutal', 'paper', 'graphite-studio', 'basalt-daylight']))
    expect(new Set(ids).size).toBe(ids.length)
    const chromes = DEV_PRESETS.map((p) => p.theme(p.mode ?? 'light').tone?.chrome)
    expect(chromes).toContain('dark')
    expect(chromes).toContain('light')
  })

  it('holds every look to AA, two-tone ones included, in both modes', () => {
    for (const p of DEV_PRESETS)
      for (const mode of ['light', 'dark'] as const) {
        const errors = checkTheme(p.theme(mode)).filter((i) => i.level === 'error')
        expect(errors.map((e) => e.message), `${p.id}, ${mode}`).toEqual([])
      }
  })

  it("draws a two-tone look's chrome in the other mode from its page", () => {
    const studio = DEV_PRESETS.find((p) => p.id === 'graphite-studio')!
    const s = presetSwatch(studio, 'light')
    const lightness = (paint: string) => Number(paint.match(/oklch\(([\d.]+)/)![1])
    expect(lightness(s.chrome)).toBeLessThan(0.4)
    expect(lightness(s.page)).toBeGreaterThan(0.8)
  })

  it('darkens the top bar but keeps the sidebar light in Site Afloat Bar', () => {
    const lightness = (paint: string) => Number(paint.match(/oklch\(([\d.]+)/)![1])
    const theme = DEV_PRESETS.find((p) => p.id === 'site-afloat-bar')!.theme('light')
    expect(lightness(formatPaint(deriveRoles(theme, 'light', 'header').chrome))).toBeLessThan(0.4)
    expect(lightness(formatPaint(deriveRoles(theme, 'light', 'chrome').chrome))).toBeGreaterThan(0.8)
  })

  it('keeps the bars light and darkens only what floats in the v2 two-tone looks', () => {
    const lightness = (paint: string) => Number(paint.match(/oklch\(([\d.]+)/)![1])
    for (const id of ['site-islands', 'site-ink', 'site-afloat']) {
      const s = presetSwatch(DEV_PRESETS.find((p) => p.id === id)!, 'light')
      expect([id, lightness(s.chrome) > 0.8, lightness(s.float) < 0.4]).toEqual([id, true, true])
    }
  })
})

describe('the stage switch', () => {
  it('puts the stages on paper and takes them off again', () => {
    const root = document.createElement('html')
    const off = applyStage(root, 'paper')
    expect(root).toHaveAttribute('data-site-stage', 'paper')
    off()
    expect(root).not.toHaveAttribute('data-site-stage')
    applyStage(root, 'gray')
    expect(root).not.toHaveAttribute('data-site-stage')
  })

  it('puts the stages on another pattern and gives the site its own back', () => {
    const root = document.createElement('html')
    root.setAttribute('data-stage-pattern', 'iso')
    const off = applyStagePattern(root, 'dots')
    expect(root).toHaveAttribute('data-stage-pattern', 'dots')
    off()
    expect(root).toHaveAttribute('data-stage-pattern', 'iso')
  })

  it('tints the stages with the paper preset site.css declares', () => {
    const css = readFileSync(join(process.cwd(), 'styles/site.css'), 'utf8')
    const rule = css.match(/\[data-site-stage='paper'\] \.site-stage\[data-yj-theme=''\] \{([^}]*)\}/)?.[1] ?? ''
    const value = (name: string) => Number(rule.match(new RegExp(`--yj-neutral-${name}:\\s*([\\d.]+)`))?.[1])
    expect({ hue: value('hue'), chroma: value('chroma'), wash: value('wash') }).toEqual(PAPER)
  })
})

describe('the snippet', () => {
  it('writes the whole theme, the edits and the tone in it', () => {
    const overrides = patchOverrides({ accent: '#ff5a1f' }, { neutral: { hue: 85 } })
    const snippet = devSnippet('graphite-studio', 'light', overrides)
    expect(snippet).toContain('// Graphite Studio, light mode, edited')
    expect(snippet).toContain('defineTheme({')
    expect(snippet).not.toContain('...')
    expect(snippet).toContain("accent: '#ff5a1f',")
    expect(snippet).toMatch(/neutral: \{[^}]*hue: 85,[^}]*chroma:/)
    expect(snippet).toMatch(/tone: \{\s*chrome: 'dark',\s*bars: 'chrome',\s*overlays: 'content',\s*\}/)
    expect(snippet).toContain("radius: 'xl',")
  })
})

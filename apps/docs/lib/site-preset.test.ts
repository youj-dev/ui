import { basalt, graphite, terminal, themeProps } from '@youj/core'
import * as sitePreset from './site-preset'
import { SITE_LIGHT } from './site-light'
import { applyPreset, siteHtmlProps, sitePresetFonts, siteThemeCss } from './site-preset'
import { modePreset, SITE_MOTION, SITE_PRESET } from './preview'

/** <html> as the server renders it: the marker attributes, and no inline variables (the presets are a stylesheet). */
function serverHtml() {
  const html = document.documentElement
  html.removeAttribute('style')
  for (const [name, value] of Object.entries(siteHtmlProps())) html.setAttribute(name, String(value))
  return html
}

const vars = (el: HTMLElement) => Array.from(el.style).filter((name) => name.startsWith('--yj-'))

/** The declarations of the rule with this exact selector in the site's stylesheet. */
function rule(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) return null
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries(
    body
      .split(';')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => [line.slice(0, line.indexOf(':')).trim(), line.slice(line.indexOf(':') + 1).trim()]),
  )
}

afterEach(() => {
  localStorage.clear()
  const html = document.documentElement
  html.removeAttribute('style')
  html.removeAttribute('data-yj-theme')
  html.removeAttribute('data-yj-motion')
})

describe('the site’s themes (Basalt in dark; in light, Basalt’s character in Graphite’s colors)', () => {
  it('starts previews in the stock preset for the mode: Graphite in light, Basalt in dark', () => {
    expect(SITE_PRESET).toEqual({ light: 'graphite', dark: 'basalt' })
    expect(modePreset(false)).toBe('graphite')
    expect(modePreset(true)).toBe('basalt')
  })

  it('renders Basalt’s tokens on :root, so dark, the default and a visit without JavaScript are right with no flash', () => {
    const declared = rule(siteThemeCss(), ':root')!
    // Basalt, but for the ink actions the site's chrome keeps (Basalt's Clean style has accent ones).
    expect(declared).toMatchObject({ ...themeProps(basalt).style, '--yj-action-ink': '1' })
    expect(declared['--yj-accent-dark']).toBe(String(basalt.accent.dark))
  })

  it('renders the site light theme on :root[data-theme=light]: Graphite’s colors with Basalt’s character', () => {
    const declared = rule(siteThemeCss(), ":root[data-theme='light']")!
    const dark = rule(siteThemeCss(), ':root')!
    expect(declared).toMatchObject(themeProps(SITE_LIGHT).style)
    // Graphite's colors as they were tuned, nothing left of the Youj palette's per-mode pairs.
    expect(declared['--yj-accent']).toBe('oklch(0.54 0.25 268)')
    expect(declared['--yj-accent-light']).toBe('initial')
    expect([declared['--yj-neutral-hue'], declared['--yj-neutral-chroma'], declared['--yj-chart-1-light']]).toEqual(['270', '0.012', 'oklch(0.54 0.22 266)'])
    // Its status inks are Graphite's light ones as single colours, which the stylesheet holds to AA on any neutral.
    for (const ink of ['success', 'warning', 'danger'] as const) {
      expect(declared[`--yj-${ink}`], ink).toBe(graphite[ink].light)
      expect(declared[`--yj-${ink}-light`], ink).toBe('initial')
    }
    // Basalt's character: the same radius, density, faces, labels, headings and card shading as the dark rule (its actions are the accent's, as Graphite's).
    for (const name of Object.keys(dark).filter((name) => /radius|density|font|label|heading|surface/.test(name)))
      expect(declared[name], name).toBe(dark[name])
  })

  it('leaves the shipped presets as they are', () => {
    expect(SITE_LIGHT.accent).toBe(graphite.accent.light)
    expect(basalt.accent).toEqual(graphite.accent)
    expect(graphite.radius).toBe('xl')
  })

  it('puts Basalt first, so the light rule (higher specificity) is the one that overrides it', () => {
    const css = siteThemeCss()
    expect(css.indexOf(':root {')).toBeLessThan(css.indexOf(":root[data-theme='light'] {"))
  })

  it('leaves <html> with markers only: the server sets no inline preset variables, whatever the mode', () => {
    const props = siteHtmlProps()
    expect(props).toEqual({ 'data-yj-theme': 'basalt', 'data-yj-motion': 'lively' })
    expect(props).not.toHaveProperty('style')
    expect(SITE_MOTION).toBe('lively')
    expect(basalt.motionPersonality).toBe('precise')
    expect(basalt.motionPersonality).toBe(graphite.motionPersonality)
  })

  it('has no pre-paint script and no stored choice: a preset left in storage by the old switcher changes nothing', () => {
    expect(Object.keys(sitePreset)).not.toContain('presetScript')
    expect(Object.keys(sitePreset)).not.toContain('PRESET_STORAGE_KEY')
    localStorage.setItem('youj-site-preset', 'terminal')
    const html = serverHtml()
    expect(html).toHaveAttribute('data-yj-theme', 'basalt')
    expect(html.style.length).toBe(0)
  })
})

describe('applyPreset (a framed preview’s document)', () => {
  it('swaps a preset in over the site’s, keeping none of its variables', () => {
    const html = serverHtml()
    applyPreset(html, 'terminal')
    const expected = themeProps(terminal)
    expect(html).toHaveAttribute('data-yj-theme', 'terminal')
    expect(html.getAttribute('data-yj-motion')).toBe('lively')
    expect(vars(html).sort()).toEqual(Object.keys(expected.style).sort())
    for (const [name, value] of Object.entries(expected.style)) expect(html.style.getPropertyValue(name)).toBe(String(value))
  })
})

describe('the site’s typefaces', () => {
  it('are Basalt’s Inter and JetBrains Mono, each family once', () => {
    const fonts = sitePresetFonts()
    expect(fonts.map((f) => f.label)).toEqual(['Inter', 'JetBrains Mono'])
    expect(new Set(fonts.map((f) => f.id)).size).toBe(fonts.length)
  })
})

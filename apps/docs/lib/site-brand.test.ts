import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { basalt, contrast, derivePalette, formatOklch, graphite, parseColor, toHex } from '@youj/core/lib/youj/theme'
import { appIconSvg, favicon } from '@youj/core/docs/brand/logo'
import { brandColors, brandHead, brandScript, brandTags, faviconFor, iconName, SITE_MODES } from './site-brand'
import { TAB_ICONS } from './stealth'

const PUBLIC = join(process.cwd(), 'public')

const shown = () => ({
  icons: [...document.head.querySelectorAll('link[rel=icon]')].map((link) => link.getAttribute('href')),
  color: document.head.querySelector('meta[name=theme-color]')!.getAttribute('content'),
})

/** Runs the layout's script as the parser would: in <head>, as the current script. */
function prePaint(stored: string | null, osLight = false) {
  localStorage.clear()
  if (stored) localStorage.setItem('theme', stored)
  window.matchMedia = ((query: string) => ({ matches: osLight && query.includes('light') })) as typeof window.matchMedia
  document.head.innerHTML = '<script></script>'
  Object.defineProperty(document, 'currentScript', { value: document.head.firstChild, configurable: true })
  new Function(brandScript())()
}

afterEach(() => {
  document.head.innerHTML = ''
  localStorage.clear()
})

describe('the site’s tab icon and browser bar', () => {
  it('are the badge in the ink with the u in the canvas, and the tittle Basalt’s yellow in dark and Graphite’s blue in light', () => {
    expect(SITE_MODES).toEqual(['dark', 'light'])
    expect(SITE_MODES.map(iconName)).toEqual(['basalt-dark', 'site-light'])
    for (const mode of SITE_MODES) {
      const { ink, canvas } = brandColors(mode)
      expect(contrast(parseColor(ink)!, parseColor(canvas)!)).toBeGreaterThanOrEqual(12)
    }
    // ink on paper, inverted: a near-white badge in dark, a near-black one in light
    expect(contrast(parseColor(brandColors('dark').ink)!, parseColor('#ffffff')!)).toBeLessThan(1.2)
    expect(contrast(parseColor(brandColors('light').ink)!, parseColor('#000000')!)).toBeLessThan(1.2)
    expect(brandColors('dark').canvas).not.toBe(brandColors('light').canvas)
    // The tittle, the logo's one colour: from the presets rather than written here. Yellow in dark, blue in light.
    const dark = derivePalette(basalt, 'dark').accent
    const light = derivePalette(graphite, 'light').accent
    expect(brandColors('dark').accent).toBe(toHex(parseColor(formatOklch(dark))!))
    expect(brandColors('light').accent).toBe(toHex(parseColor(formatOklch(light))!))
    const hue = ([, , h]: typeof dark) => h
    expect(hue(dark)).toBeGreaterThan(60)
    expect(hue(dark)).toBeLessThan(100)
    expect(hue(light)).toBeGreaterThan(240)
    expect(hue(light)).toBeLessThan(290)
  })

  it('are written from the brand’s geometry and these colors: a stale file fails here (run `pnpm -F docs favicons`)', () => {
    for (const mode of SITE_MODES) {
      expect(readFileSync(join(PUBLIC, 'icons', `${iconName(mode)}.svg`), 'utf8')).toBe(faviconFor(mode))
      expect(faviconFor(mode)).toContain(`fill="${brandColors(mode).dot}"`)
      expect(faviconFor(mode)).not.toContain('prefers-color-scheme')
    }
  })

  it('are the mark hinted for 32px: the badge in the ink, the u in the canvas, the tittle in the dot colour', () => {
    for (const mode of SITE_MODES) {
      const svg = faviconFor(mode)
      const { ink, canvas, dot: accent } = brandColors(mode)
      const { tile, glyph, tittle } = favicon[32]
      expect(svg).toMatch(/viewBox="0 0 32 32"/)
      expect(svg).toContain(`<path d="${tile}" fill="${ink}"/>`)
      expect(svg).toContain(`<path d="${glyph}" fill="${canvas}"/>`)
      expect(svg).toContain(`<rect x="${tittle.x}" y="${tittle.y}" width="${tittle.size}" height="${tittle.size}" fill="${accent}"/>`)
      expect(svg).not.toContain('color-mix')
    }
  })

  it('lift the tittle on light’s near-black badge to 4.5:1 or more, keeping the accent’s hue; dark’s is the accent', () => {
    const light = brandColors('light')
    expect(contrast(parseColor(light.dot)!, parseColor(light.ink)!)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(parseColor(light.accent)!, parseColor(light.ink)!)).toBeLessThan(4.5)
    expect(brandColors('dark').dot).toBe(brandColors('dark').accent)
  })

  it('have a home-screen icon of the mark full bleed: the square in the ink, the u in the canvas, the tittle in the dot colour', () => {
    for (const mode of SITE_MODES) {
      const { ink, canvas, dot } = brandColors(mode)
      const svg = appIconSvg({ ink, canvas, accent: dot })
      expect([...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1])).toEqual([ink, canvas, dot])
    }
  })

  it('ship favicon.ico with the 16 and 32 designs', () => {
    const ico = readFileSync(join(PUBLIC, 'favicon.ico'))
    expect(ico.readUInt16LE(4)).toBe(2)
    expect([ico.readUInt8(6), ico.readUInt8(6 + 16)]).toEqual([16, 32])
  })

  it('exist as files and pass the stealth gate, with the default state’s static icons', () => {
    const files = Object.values(brandHead()).flatMap(({ svg, png }) => [svg, png])
    for (const path of [...files, '/favicon.ico']) expect(existsSync(join(PUBLIC, path)), path).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/apple-icon.png'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/icon.svg'))).toBe(false)
    expect(TAB_ICONS).toEqual(expect.arrayContaining([...files, '/favicon.ico', '/apple-icon.png']))
  })

  it('follow the OS before first paint when nothing is stored, as a first visit does', () => {
    const brand = brandHead()
    prePaint(null, true)
    expect(shown()).toEqual({ icons: [brand.light.png, brand.light.svg], color: brand.light.color })
    prePaint(null, false)
    expect(shown()).toEqual({ icons: [brand.dark.png, brand.dark.svg], color: brand.dark.color })
  })

  it('are light’s before first paint when light is stored, and the OS’s when the stored choice is system', () => {
    const brand = brandHead()
    prePaint('light')
    expect(shown()).toEqual({ icons: [brand.light.png, brand.light.svg], color: brand.light.color })
    prePaint('dark', true)
    expect(shown().color).toBe(brand.dark.color)
    prePaint('system', true)
    expect(shown().color).toBe(brand.light.color)
    prePaint('system', false)
    expect(shown().color).toBe(brand.dark.color)
  })

  it('follow the OS if storage can’t be read', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    prePaint(null)
    expect(shown().color).toBe(brandHead().dark.color)
    prePaint(null, true)
    expect(shown().color).toBe(brandHead().light.color)
    getItem.mockRestore()
  })

  it('carry both modes’ values for the swap after first paint, and are dark’s without JavaScript', () => {
    const brand = brandHead()
    document.head.innerHTML = brandTags('dark')
    expect(shown()).toEqual({ icons: [brand.dark.png, brand.dark.svg], color: brand.dark.color })
    for (const el of document.head.querySelectorAll('[data-brand]')) expect(el.getAttribute('data-light')).toMatch(/light|#/)
    expect(brandScript()).not.toContain('</')
  })
})

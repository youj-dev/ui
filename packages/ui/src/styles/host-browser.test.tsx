import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Page } from 'playwright'
import { compile } from 'tailwindcss'
import { ThemeScope } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core/lib/youj/theme'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

/* What the stylesheets do to an app that already has its own Tailwind setup,
 * measured in a browser on an app's own build: youj.css, ui.css and the
 * component styles compiled after the app's @theme, the way an app's
 * globals.css imports them.
 * - The app's palette survives (bg-white, bg-red-500, bg-black/50), and so
 *   does its own --spacing, which a scaling scope scales instead of replacing.
 * - No text in a scaling scope goes under 11px.
 * - A single --yj-accent on :root re-brands the page over the default pairs.
 * - A className beats a Bezel recipe; the recipes follow the theme's actions
 *   and labels; dark Bezel fields draw their edge. */

const here = dirname(fileURLToPath(import.meta.url))
const twDir = dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))

const HOST_THEME = '@theme { --spacing: 0.3rem; }'

function page(): string {
  return renderToStaticMarkup(
    <>
      <div id="red" className="size-4 bg-red-500" />
      <div id="white" className="size-4 bg-white" />
      <div id="scrim" className="size-4 bg-black/50" />
      <div id="pad" className="p-4" />
      <div data-yj-scaling="90" data-yj-device="pointer">
        <span id="caption" className="text-ui-xs">
          caption
        </span>
        <span id="xs" className="text-xs">
          xs
        </span>
        <div id="pad-90" className="p-4" />
      </div>
      <div id="accent" className="size-4 bg-accent" />
      <div data-yj-look="bezel">
        <Button id="plain">Plain</Button>
        <Button id="custom" className="rounded-none bg-red-500">
          Custom
        </Button>
        <Badge id="badge">Ready</Badge>
        <Input id="field" aria-label="Field" />
      </div>
      <div id="own-default" className="own:pt-1" />
      <div id="own-overridden" className="own:pt-1 pt-4" />
      <ThemeScope theme={graphite}>
        <Button id="graphite-button">Graphite</Button>
        <Badge id="graphite-badge">Ready</Badge>
        <span id="graphite-accent" className="text-accent">
          a
        </span>
      </ThemeScope>
    </>,
  )
}

let css = ''
let body = ''
beforeAll(async () => {
  body = page()
  const styles = readdirSync(here).filter((f) => f.endsWith('.css') && f !== 'ui.css')
  const entry = ["@import 'tailwindcss';", HOST_THEME, "@import '../../../core/src/styles/youj.css';", "@import './ui.css';", ...styles.map((f) => `@import './${f}';`)].join('\n')
  const compiler = await compile(entry, {
    base: here,
    async loadStylesheet(sheet, base) {
      const path = sheet === 'tailwindcss' ? resolve(twDir, 'index.css') : resolve(base, sheet)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  const candidates = [...new Set([...body.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.replaceAll('&amp;', '&').split(/\s+/)))]
  css = compiler.build(candidates)
})

/** Renders the page in a mode, with any extra CSS after the stylesheets, and reads it. */
async function open(theme: 'light' | 'dark', extra = '') {
  const browser = await chromium.launch()
  const tab = await browser.newPage()
  await tab.setContent(`<!doctype html><html data-theme="${theme}"><head><style>${css}</style><style>${extra}</style></head><body>${body}</body></html>`)
  return { tab, close: () => browser.close() }
}

/** An element's computed property, and its colour as sRGB bytes. */
const read = (tab: Page, id: string, prop: string) =>
  tab.evaluate(
    ([id, prop]) => {
      const value = getComputedStyle(document.getElementById(id!)!).getPropertyValue(prop!)
      const ctx = new OffscreenCanvas(1, 1).getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      return { value, rgba: [...ctx.getImageData(0, 0, 1, 1).data] }
    },
    [id, prop],
  )

test("the app's palette survives: bg-white, bg-red-500 and bg-black/50 paint", async () => {
  const { tab, close } = await open('dark')
  try {
    expect((await read(tab, 'red', 'background-color')).rgba.slice(0, 3)).toEqual([251, 44, 54])
    expect((await read(tab, 'white', 'background-color')).rgba).toEqual([255, 255, 255, 255])
    expect((await read(tab, 'scrim', 'background-color')).value).toMatch(/0\.5|50%/)
  } finally {
    await close()
  }
})

test("a scaling scope scales the app's own spacing, and no text in it goes under 11px", async () => {
  const { tab, close } = await open('dark')
  try {
    // The app's --spacing is 0.3rem: p-4 is 19.2px, and 17.28px at 90%.
    expect(parseFloat((await read(tab, 'pad', 'padding-top')).value)).toBeCloseTo(19.2, 1)
    expect(parseFloat((await read(tab, 'pad-90', 'padding-top')).value)).toBeCloseTo(17.28, 1)
    // An 11px caption and a 12px text-xs would be 9.9px and 10.8px at 90%.
    expect(parseFloat((await read(tab, 'caption', 'font-size')).value)).toBe(11)
    expect(parseFloat((await read(tab, 'xs', 'font-size')).value)).toBe(11)
  } finally {
    await close()
  }
})

test('a single --yj-accent on :root re-brands the page over the default per-mode pairs, in both modes', async () => {
  for (const mode of ['light', 'dark'] as const) {
    const before = await open(mode)
    const after = await open(mode, ':root { --yj-accent: #1f6feb; }')
    try {
      const [r, , b] = (await read(after.tab, 'accent', 'background-color')).rgba
      // Basalt's default accent is amber; the override is a blue.
      expect([mode, b! > r!]).toEqual([mode, true])
      expect((await read(before.tab, 'accent', 'background-color')).rgba).not.toEqual((await read(after.tab, 'accent', 'background-color')).rgba)
    } finally {
      await before.close()
      await after.close()
    }
  }
})

test("a className beats a Bezel recipe: the button's own fill and corner give way", async () => {
  const { tab, close } = await open('dark')
  try {
    expect((await read(tab, 'custom', 'background-color')).rgba.slice(0, 3)).toEqual([251, 44, 54])
    expect((await read(tab, 'custom', 'background-image')).value).toBe('none')
    expect((await read(tab, 'custom', 'border-top-left-radius')).value).toBe('0px')
    // Without one, the recipe holds: the rounded control corner and the ink fill with its sheen.
    expect(parseFloat((await read(tab, 'plain', 'border-top-left-radius')).value)).toBeGreaterThan(0)
    expect((await read(tab, 'plain', 'background-image')).value).toContain('linear-gradient')
  } finally {
    await close()
  }
})

test("a component's own: default gives way to the consumer's className", async () => {
  const { tab, close } = await open('dark')
  try {
    // The app's --spacing is 0.3rem: pt-1 is 4.8px, pt-4 is 19.2px.
    expect(parseFloat((await read(tab, 'own-default', 'padding-top')).value)).toBeCloseTo(4.8, 1)
    expect(parseFloat((await read(tab, 'own-overridden', 'padding-top')).value)).toBeCloseTo(19.2, 1)
  } finally {
    await close()
  }
})

test("Bezel follows the theme's actions and labels: Graphite's primary is its accent and its labels stay as written", async () => {
  const { tab, close } = await open('light')
  try {
    expect((await read(tab, 'graphite-button', 'background-color')).rgba).toEqual((await read(tab, 'graphite-accent', 'color')).rgba)
    expect((await read(tab, 'graphite-badge', 'text-transform')).value).toBe('none')
    // Basalt, the default, in a Bezel scope: the same Youj palette and accent actions, its labels as written too (the capitals are the Bezel style's, not the look's).
    expect((await read(tab, 'badge', 'text-transform')).value).toBe('none')
    expect((await read(tab, 'plain', 'background-color')).rgba).toEqual((await read(tab, 'graphite-button', 'background-color')).rgba)
  } finally {
    await close()
  }
})

test('a dark Bezel field draws its edge', async () => {
  const { tab, close } = await open('dark')
  try {
    const edge = await read(tab, 'field', 'border-top-color')
    expect(edge.rgba[3]).toBe(255)
    expect(edge.rgba).not.toEqual((await read(tab, 'field', 'background-color')).rgba)
  } finally {
    await close()
  }
})

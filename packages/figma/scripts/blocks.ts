/* Captures the reference blocks: cards, sections and screens from Storybook at 1440px,
 * in Basalt dark (the default look) in the Bezel style with reduced motion (every
 * animation at its final state), as 2× JPEGs in assets/blocks with a manifest
 * the data step reads. A story id that no longer exists stops the run, naming it.
 *
 *   pnpm storybook                               (in another terminal)
 *   pnpm -F @youj/figma blocks [url]      default http://localhost:6006 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

interface Block {
  id: string
  title: string
  kind: 'Card' | 'Section' | 'Screen' | 'Frame'
  story: string
  /** Blocks longer than the viewport are captured whole, up to this height (CSS px). */
  maxHeight?: number
}

// A modest set: the blocks that show the system best, the newer showcase ones last.
const BLOCKS: Block[] = [
  { id: 'hero-motion', title: 'Marketing · Hero motion', kind: 'Section', story: 'blocks-marketing-hero-motion--default' },
  { id: 'pricing', title: 'Marketing · Pricing', kind: 'Section', story: 'blocks-marketing-pricing--yearly', maxHeight: 1600 },
  { id: 'login', title: 'Auth · Login (split)', kind: 'Screen', story: 'blocks-auth-login--split' },
  { id: 'customers', title: 'App · Customers (data grid)', kind: 'Screen', story: 'blocks-app-customers--default' },
  { id: 'agent-trace', title: 'App · Agent trace', kind: 'Card', story: 'blocks-app-step-trace--default' },
  { id: 'service-health', title: 'App · Service health', kind: 'Card', story: 'blocks-app-health-dial--default' },
  { id: 'model-compare', title: 'App · Model compare', kind: 'Card', story: 'blocks-app-head-to-head--default' },
]

const WIDTH = 1440
const HEIGHT = 900
const base = (process.argv[2] ?? 'http://localhost:6006').replace(/\/$/, '')
const dir = new URL('../assets/blocks/', import.meta.url)
mkdirSync(dir, { recursive: true })

const index = (await (await fetch(`${base}/index.json`)).json()) as { entries: Record<string, unknown> }
const missing = BLOCKS.filter((s) => !(s.story in index.entries))
if (missing.length) throw new Error(`blocks: no such story in Storybook at ${base}: ${missing.map((s) => s.story).join(', ')}`)

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  const manifest = []
  for (const s of BLOCKS) {
    const url = `${base}/iframe.html?id=${s.story}&viewMode=story&globals=theme:dark;themePreset:basalt;style:bezel;reducedMotion:always`
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('#storybook-root > *', { timeout: 30_000 })
    await page.evaluate(() => document.fonts.ready)
    // Let lazy images and the final layout land.
    await page.waitForTimeout(800)
    const full = await page.evaluate(() => document.documentElement.scrollHeight)
    const height = Math.min(Math.max(full, HEIGHT), s.maxHeight ?? HEIGHT)
    const file = `${s.id}.jpg`
    const bytes = await page.screenshot({ type: 'jpeg', quality: 78, clip: { x: 0, y: 0, width: WIDTH, height }, fullPage: height > HEIGHT })
    writeFileSync(new URL(file, dir), bytes)
    manifest.push({ id: s.id, title: s.title, kind: s.kind, story: s.story, file })
    console.log(`${file}: ${WIDTH}×${height} @2x, ${Math.round(bytes.length / 1024)} KB`)
  }
  writeFileSync(new URL('blocks.json', dir), `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await browser.close()
}

/* Captures the isometric illustrations as static SVG: every scene in the
 * registry, in Basalt light and dark, grouped by category, into
 * assets/illustrations/{light,dark}/<id>.svg and a manifest the data step reads.
 *
 * The scenes paint with theme custom properties (colour-mixes of --color-*
 * tokens), which mean nothing outside a page, so this reuses the docs
 * explorer's own SVG export (apps/docs/components/illustrations/export.ts):
 * it opens the Storybook gallery in a browser, at each scene's finished frame
 * (reduced motion), and serialises every drawing with the colours the browser
 * computed. What comes out opens anywhere, Figma included.
 *
 *   pnpm storybook                                    (in another terminal)
 *   pnpm -F @youj/figma illustrations [url]     default http://localhost:6006 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { chromium } from 'playwright'
import { optimize } from 'svgo'

const MODES = ['light', 'dark'] as const
const PRESET = 'basalt'
const base = (process.argv[2] ?? 'http://localhost:6006').replace(/\/$/, '')
const dir = new URL('../assets/illustrations/', import.meta.url)

/** The docs explorer's serialiser, as a script the page can run (its types stripped, its exports dropped). */
const exportSource = stripTypeScriptTypes(readFileSync(new URL('../../../apps/docs/components/illustrations/export.ts', import.meta.url), 'utf8')).replace(/^export /gm, '')

/** The registry's categories, in its order (a plain-text read: the registry is TSX). */
const registry = readFileSync(new URL('../../illustrations/src/components/youj/graphics/illustrations/registry.tsx', import.meta.url), 'utf8')
const block = registry.match(/export const illustrationCategories = \[([\s\S]*?)\] as const/)?.[1]
if (!block) throw new Error('illustrations: could not read illustrationCategories from the registry')
const categories = [...block.matchAll(/\{ id: '([\w-]+)', name: '([^']+)' \}/g)].map((m) => ({ id: m[1]!, name: m[2]! }))
if (!categories.length) throw new Error('illustrations: the registry lists no categories')

/** Empty wrappers, defaults and long decimals are most of a raw export: a scene is a few hundred nested groups. Ids stay (gradients need them), unique per file. */
const shrink = (svg: string) =>
  optimize(svg, {
    multipass: true,
    floatPrecision: 2,
    plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false, cleanupIds: false, removeTitle: false } } }],
  }).data

rmSync(dir, { recursive: true, force: true })
const browser = await chromium.launch()
try {
  const scenes = new Map<string, { id: string; name: string; category: string }>()
  for (const mode of MODES) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' })
    const url = `${base}/iframe.html?id=motion-graphics-illustrations--reduced-motion&viewMode=story&globals=theme:${mode};themePreset:${PRESET};style:bezel;reducedMotion:always`
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('figure[data-scene] svg', { timeout: 60_000 })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)
    await page.addScriptTag({ content: `${exportSource}\nwindow.__serializeScene = serializeScene`, type: 'text/javascript' })
    const out: { id: string; name: string; category: string; svg: string }[] = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('figure[data-scene]')].map((fig) => {
        const id = fig.dataset.scene!
        const name = fig.querySelector('figcaption span')!.textContent!.trim()
        const category = fig.querySelector('figcaption span:last-child')!.textContent!.split('·')[0]!.trim()
        // The card's first svg is its dotted backdrop; the scene is drawn after it.
        const svg = [...fig.querySelectorAll('svg')].pop()!
        // The finished frame: the assemble drop and any float offset are settled under reduced motion.
        return { id, name, category, svg: (window as unknown as { __serializeScene: (s: SVGSVGElement, o: { title: string }) => string }).__serializeScene(svg as unknown as SVGSVGElement, { title: name }) }
      }),
    )
    if (!out.length) throw new Error('illustrations: the gallery drew no scenes')
    mkdirSync(new URL(`${mode}/`, dir), { recursive: true })
    for (const s of out) {
      s.svg = shrink(s.svg)
      writeFileSync(new URL(`${mode}/${s.id}.svg`, dir), s.svg)
      scenes.set(s.id, { id: s.id, name: s.name, category: s.category })
    }
    console.log(`${mode}: ${out.length} scenes, ${Math.round(out.reduce((n, s) => n + s.svg.length, 0) / 1024)} KB`)
    await page.close()
  }
  const list = [...scenes.values()]
  const unknown = list.filter((s) => !categories.some((c) => c.id === s.category))
  if (unknown.length) throw new Error(`illustrations: scenes in categories the registry doesn't list: ${unknown.map((s) => s.id).join(', ')}`)
  writeFileSync(new URL('illustrations.json', dir), `${JSON.stringify({ preset: PRESET, modes: MODES, categories, scenes: list }, null, 2)}\n`)
  console.log(`illustrations.json: ${list.length} scenes in ${categories.length} categories`)
} finally {
  await browser.close()
}

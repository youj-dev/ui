// Checks that every block and example follows the showcase's theme bar: each
// is loaded at /view/<kind>/<slug> in a same-origin frame, driven through the
// frame-sync channel the docs use (lib/frame-sync.ts) to every preset, light
// and dark, and measured two ways:
//
// - tokens: the theme contract variables (--yj-accent, --yj-radius, the
//   neutral hue and the sans face) at a grid of points over the demo, against
//   the preset on the frame's <html>. A point that disagrees sits under a
//   ThemeScope that ignored the preset.
// - pixels: a small RGB thumbnail of each capture. Two presets that render
//   the same picture, or light and dark that do, mean the demo never changed.
//
// An item is "stuck" when most of it keeps its own theme under a preset, or
// its pictures don't change; "partial" when a region does (over PARTIAL of
// the points), which is sometimes by design (a theme picker's swatches).
//
//   node scripts/theme-audit.ts [base URL] [--only blocks/auth-login,…] [--json out.json]
//
// Run it against `next start` after `next build` (or `next dev`, slowly).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blocks } from '../lib/showcase.ts'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args.splice(i, 2)[1]
}
const only = flag('--only')?.split(',')
const jsonOut = flag('--json')
const BASE = args[0] ?? 'http://127.0.0.1:3100'
const WIDTH = 1280
const HEIGHT = 800
/** The share of sampled points that may keep a theme of their own before an item counts as partial. */
const PARTIAL = 0.15
/** Mean per-channel difference (0–255) below which two thumbnails count as the same picture: a re-render of one theme measures 0. */
const SAME = 0.05

/** Every block, by `<kind>/<slug>`, with the story it opens on (its first, when it has several). */
const manifest: Record<string, { story?: string }> = Object.fromEntries(blocks().map((e) => [`${e.kind}/${e.slug}`, { story: e.stories.length > 1 ? e.stories[0]!.id : undefined }]))
const THEMES = readFileSync(join(ROOT, 'packages/core/src/lib/youj/theme/themes/index.ts'), 'utf8')
const PRESETS = THEMES.match(/export const themes = \[([^\]]+)\]/)![1]!
  .split(',')
  .map((s) => s.trim())

interface Sample {
  /** Share of points whose theme variables differ from <html>'s. */
  off: number
  /** A 160×100 thumbnail, RGB. */
  thumb: number[]
}

type Page = import('playwright').Page

async function measure(page: Page): Promise<Sample> {
  const frame = page.frames()[1]!
  await frame.evaluate(async () => {
    await document.fonts.ready
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  })
  await page.waitForTimeout(250)
  const off = await frame.evaluate(() => {
    const VARS = ['--yj-accent', '--yj-radius', '--yj-neutral-hue', '--yj-font-sans']
    const sig = (el: Element) => {
      const s = getComputedStyle(el)
      return VARS.map((v) => s.getPropertyValue(v).trim()).join('|')
    }
    const root = sig(document.documentElement)
    let total = 0
    let off = 0
    for (let y = 0.05; y < 1; y += 0.1) {
      for (let x = 0.05; x < 1; x += 0.1) {
        const el = document.elementFromPoint(x * innerWidth, y * innerHeight)
        if (!el) continue
        total++
        if (sig(el) !== root) off++
      }
    }
    return total ? off / total : 0
  })
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }, type: 'png' })
  const thumb = await page.evaluate(async (b64) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob())
    const canvas = new OffscreenCanvas(160, 100)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, 160, 100)
    const { data } = ctx.getImageData(0, 0, 160, 100)
    const out: number[] = []
    for (let i = 0; i < data.length; i += 4) out.push(data[i]!, data[i + 1]!, data[i + 2]!)
    return out
  }, png.toString('base64'))
  return { off, thumb }
}

const diff = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + Math.abs(v - b[i]!), 0) / a.length

interface Result {
  key: string
  status: 'ok' | 'partial' | 'stuck' | 'failed'
  notes: string[]
}

async function auditItem(page: Page, key: string, item: { story?: string }): Promise<Result> {
  const src = `/view/${key}${item.story ? `?story=${item.story}` : ''}`
  await page.goto(`${BASE}/llms.txt`)
  const samples: Record<string, Sample> = {}
  let first = true
  for (const mode of ['light', 'dark']) {
    for (const variant of PRESETS) {
      const state = { dark: mode === 'dark', preset: variant, speed: 1, reduced: true }
      if (first) {
        await page.evaluate(
          ({ src, state, width, height }) => {
            const w = window as unknown as { __frame: { state: unknown; ready: boolean; set: (s: unknown) => void } }
            const frame = document.createElement('iframe')
            const post = () => frame.contentWindow?.postMessage({ channel: 'youj:frame', kind: 'state', state: w.__frame.state }, location.origin)
            w.__frame = { state, ready: false, set: (s) => ((w.__frame.state = s), post()) }
            window.addEventListener('message', (e) => {
              if (e.source !== frame.contentWindow || e.data?.channel !== 'youj:frame') return
              if (e.data.kind === 'hello') post()
              if (e.data.kind === 'ready') w.__frame.ready = true
            })
            frame.src = src
            frame.style.cssText = `border:0;display:block;width:${width}px;height:${height}px`
            document.body.style.margin = '0'
            document.body.replaceChildren(frame)
          },
          { src, state, width: WIDTH, height: HEIGHT },
        )
        await page.waitForFunction(() => (window as unknown as { __frame: { ready: boolean } }).__frame.ready, undefined, { timeout: 30_000 })
        await page.waitForTimeout(1200)
        first = false
      } else {
        await page.evaluate((s) => (window as unknown as { __frame: { set: (s: unknown) => void } }).__frame.set(s), state)
      }
      samples[`${variant}-${mode}`] = await measure(page)
    }
  }
  const notes: string[] = []
  let stuck = false
  let partial = false
  for (const mode of ['light', 'dark']) {
    for (const preset of PRESETS) {
      const { off } = samples[`${preset}-${mode}`]!
      if (off > 0.5) (stuck = true), notes.push(`${preset}/${mode}: ${Math.round(off * 100)}% keeps its own theme`)
      else if (off > PARTIAL) (partial = true), notes.push(`${preset}/${mode}: ${Math.round(off * 100)}% keeps its own theme`)
    }
    for (let i = 0; i < PRESETS.length; i++) {
      for (let j = i + 1; j < PRESETS.length; j++) {
        const d = diff(samples[`${PRESETS[i]}-${mode}`]!.thumb, samples[`${PRESETS[j]}-${mode}`]!.thumb)
        if (d < SAME) (stuck = true), notes.push(`${PRESETS[i]} = ${PRESETS[j]} (${mode}, Δ${d.toFixed(3)})`)
      }
    }
  }
  for (const preset of PRESETS) {
    const d = diff(samples[`${preset}-light`]!.thumb, samples[`${preset}-dark`]!.thumb)
    if (d < SAME) (stuck = true), notes.push(`${preset}: light = dark (Δ${d.toFixed(3)})`)
  }
  return { key, status: stuck ? 'stuck' : partial ? 'partial' : 'ok', notes }
}

const { chromium } = await import('playwright')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await context.clock.setFixedTime(new Date('2026-06-15T09:30:00Z'))
const queue = Object.entries(manifest).filter(([key]) => !only || only.includes(key))
const results: Result[] = []
await Promise.all(
  Array.from({ length: 4 }, async () => {
    const page = await context.newPage()
    for (let job = queue.shift(); job; job = queue.shift()) {
      const [key, item] = job
      try {
        results.push(await auditItem(page, key, item))
      } catch (error) {
        results.push({ key, status: 'failed', notes: [(error as Error).message.split('\n')[0]!] })
      }
    }
  }),
)
await browser.close()
results.sort((a, b) => a.key.localeCompare(b.key))
for (const r of results.filter((r) => r.status !== 'ok')) console.log(`${r.status.padEnd(7)} ${r.key}\n  ${r.notes.slice(0, 6).join('\n  ')}`)
const count = (s: Result['status']) => results.filter((r) => r.status === s).length
console.log(`theme-audit: ${results.length} items, ${count('ok')} ok, ${count('partial')} partial, ${count('stuck')} stuck, ${count('failed')} failed`)
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 2))
process.exitCode = count('stuck') || count('failed') ? 1 : 0

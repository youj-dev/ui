/* The miniatures page's thumbnails (/miniatures: the viewfinder's strip and the explorer's cards): a light and a dark
 * WebP of each miniature, the real component as the page's own stage draws it, at rest (reduced motion), framed on its
 * drawing at 4:3 like the objects lab's. Written to public/thumbs/miniatures/ and committed, with
 * components/miniatures/thumbs.json naming each by a hash of its bytes (so a changed one is fetched again). Run it
 * against a dev server after a miniature is added or redrawn:
 *
 *   pnpm -F docs dev                        (or any running docs server)
 *   pnpm -F docs miniatures:thumbs [--base http://localhost:3100] [--only turntable,hourglass] */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(DOCS, 'public/thumbs/miniatures')
const MANIFEST = join(DOCS, 'components/miniatures/thumbs.json')
const SCHEMES = ['light', 'dark'] as const
/** Cards show it at up to ~300 CSS px wide; 560 keeps it sharp on a 2× screen at a card's usual width. */
const THUMB_WIDTH = 560
const CONCURRENCY = 3

const arg = (name: string) => {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const base = arg('--base') ?? 'http://localhost:3100'
const only = arg('--only')?.split(',')

const pkg = JSON.parse(readFileSync(join(DOCS, '../../packages/miniatures/package.json'), 'utf8')) as { exports: Record<string, string> }
const ids = Object.keys(pkg.exports)
  .filter((k) => k !== '.')
  .map((k) => k.slice(2))
  .sort()
const shoot = only ? ids.filter((id) => only.includes(id)) : ids
const fileOf = (id: string, scheme: (typeof SCHEMES)[number]) => `${id}${scheme === 'dark' ? '.dark' : ''}.webp`

/** Runs in the browser: a PNG shot to a WebP of `width`, through a canvas. */
async function encode({ png, width }: { png: string; width: number }) {
  const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob())
  const canvas = new OffscreenCanvas(width, Math.round((bitmap.height * width) / bitmap.width))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/webp', quality: 0.84 })).arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

/** Runs in the browser: the miniature's drawing (what its svg draws), in a 4:3 box with a margin, inside the stage's plate. */
function framing(id: string) {
  const host = document.querySelector(`.yjm-${id}`)
  const svg = host?.shadowRoot?.querySelector('svg')
  const plate = host?.closest('[class*="group/plate"]')?.getBoundingClientRect()
  const ctm = svg?.getScreenCTM()
  if (!svg || !ctm || !plate) return null
  const b = svg.getBBox()
  if (b.width < 20 || b.height < 20) return null
  const a = new DOMPoint(b.x, b.y).matrixTransform(ctm)
  const z = new DOMPoint(b.x + b.width, b.y + b.height).matrixTransform(ctm)
  const inset = 2
  const room = { width: plate.width - 2 * inset, height: plate.height - 2 * inset }
  let width = Math.max(z.x - a.x, ((z.y - a.y) * 4) / 3) * 1.24
  width = Math.min(width, room.width, (room.height * 4) / 3)
  const height = (width * 3) / 4
  const clamp = (v: number, size: number, lo: number, span: number) => Math.max(lo, Math.min(v, lo + span - size))
  return {
    x: clamp((a.x + z.x) / 2 - width / 2, width, plate.left + inset, room.width),
    y: clamp((a.y + z.y) / 2 - height / 2, height, plate.top + inset, room.height),
    width,
    height,
  }
}

const { chromium } = await import('playwright')
const browser = await chromium.launch()
mkdirSync(OUT, { recursive: true })
const queue = shoot.flatMap((id) => SCHEMES.map((scheme) => ({ id, scheme })))
let failed = 0

const worker = async () => {
  for (let next = queue.shift(); next; next = queue.shift()) {
    const { id, scheme } = next
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      await page.goto(`${base}/miniatures?item=${id}`, { waitUntil: 'load' })
      // The stage alone (no toolbar over the paper), the drawing a little smaller than the plate so its margin fits.
      await page.addStyleTag({ content: '[role=toolbar]{visibility:hidden!important} .yjm{scale:0.72}' })
      await page.waitForFunction((id) => Boolean(document.querySelector(`.yjm-${id}`)?.shadowRoot?.querySelector('svg g')?.childElementCount), id, { timeout: 30_000 })
      await page.waitForTimeout(1200)
      const clip = await page.evaluate(framing, id)
      if (!clip) throw new Error('no drawing to frame')
      const png = (await page.screenshot({ type: 'png', clip })).toString('base64')
      const webp = await page.evaluate(encode, { png, width: THUMB_WIDTH })
      writeFileSync(join(OUT, fileOf(id, scheme)), Buffer.from(webp, 'base64'))
      process.stdout.write('.')
    } catch (error) {
      failed++
      console.warn(`\nminiatures:thumbs: ${id} (${scheme}): ${(error as Error).message.split('\n')[0]}`)
    } finally {
      await context.close()
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
await browser.close()
process.stdout.write('\n')

// A miniature that left the package leaves its thumbnails behind; the manifest names each by a hash of its bytes.
for (const f of readdirSync(OUT)) if (!ids.includes(f.split('.')[0]!)) rmSync(join(OUT, f))
const manifest: Record<string, { light?: string; dark?: string }> = {}
for (const id of ids)
  for (const scheme of SCHEMES) {
    const file = join(OUT, fileOf(id, scheme))
    if (!existsSync(file)) continue
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
    ;(manifest[id] ??= {})[scheme] = `/thumbs/miniatures/${fileOf(id, scheme)}?v=${hash}`
  }
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`miniatures:thumbs: ${shoot.length * SCHEMES.length - failed} taken, ${failed} failed → public/thumbs/miniatures`)
if (failed) process.exitCode = 1

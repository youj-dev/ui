// The raster side of the originality check (opt-in; the geometric check runs
// in the test suite as src/components/youj/icons/originality.test.ts).
//
//   node scripts/lucide-overlap.mjs [--min 0.6] [--top 40]
//
// Draws every Youj icon at rest (and each state icon's active pose) and
// every lucide-react icon at 48px with the same 2-unit stroke, in a headless
// browser, and prints the pairs whose ink overlaps most (intersection over
// union of the painted pixels, after a 1px dilation so a half-unit shift
// still counts as the same stroke). Anything near the top deserves a look at
// the two drawings side by side. Needs the workspace's playwright browsers.
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : Number(process.argv[i + 1])
}
const MIN = arg('min', 0.6)
const TOP = arg('top', 40)
const SIZE = 48

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(join(root, 'package.json'))
const { chromium } = createRequire(join(root, '../../package.json'))('playwright')

/* ── Youj: rendered at rest with reduced motion, as the docs render them ── */

const vite = await createServer({
  root,
  configFile: join(root, 'vitest.config.ts'),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
const youj = []
try {
  const { renderToStaticMarkup } = require('react-dom/server')
  const { createElement } = require('react')
  const { icons } = await vite.ssrLoadModule('/src/components/youj/icons/index.ts')
  const { YoujProvider } = await vite.ssrLoadModule('/src/lib/youj/provider.tsx')
  for (const Icon of icons) {
    const poses = Icon.meta.states ? [[Icon.meta.states[0], false], [Icon.meta.states[1], true]] : [['rest', undefined]]
    for (const [pose, active] of poses) {
      const html = renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always' }, createElement(Icon, { trigger: 'none', active })))
      // The provider wraps its children in a div; the image wants the <svg> alone.
      const svg = html.slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + '</svg>'.length)
      youj.push({ name: Icon.meta.states ? `${Icon.meta.name}:${pose}` : Icon.meta.name, svg })
    }
  }
} finally {
  await vite.close()
}

/* ── Lucide: the icon data straight from the installed devDependency ── */

const dir = join(dirname(require.resolve('lucide-react')), '../esm/icons')
const lucide = []
for (const file of readdirSync(dir)) {
  if (!file.endsWith('.mjs')) continue
  const m = readFileSync(join(dir, file), 'utf8').match(/const __iconData = (\{[\s\S]*?\n\});/)
  if (!m) continue
  const data = Function(`return ${m[1]}`)()
  const body = data.node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')
  lucide.push({ name: data.name, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>` })
}

/* ── Raster: one headless page paints every icon and returns its ink as bits ── */

const browser = await chromium.launch()
let masks
try {
  const page = await browser.newPage()
  await page.setContent('<!doctype html><body></body>')
  masks = await page.evaluate(
    async ({ items, size }) => {
      const canvas = new OffscreenCanvas(size, size)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const out = []
      for (const svg of items) {
        // Same pen for both sets: stroke 2 and solid black, so only the drawing differs.
        const source = svg
          .replace(/<svg([^>]*)>/, (_, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, '')} width="${size}" height="${size}">`)
          .replace(/stroke-width="[^"]*"/g, 'stroke-width="2"')
          .replace(/currentColor/g, '#000')
        const img = new Image()
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
        const ok = await img.decode().then(
          () => true,
          () => false,
        )
        if (!ok) {
          out.push(source)
          continue
        }
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        const bits = []
        for (let i = 0; i < size * size; i++) bits.push(data[i * 4 + 3] > 96 ? 1 : 0)
        out.push(bits)
      }
      return out
    },
    { items: [...youj, ...lucide].map((i) => i.svg), size: SIZE },
  )
} finally {
  await browser.close()
}

/* ── Compare: IoU of the dilated masks, every Youj pose against every lucide icon ── */

function dilate(bits) {
  const out = new Uint8Array(bits.length)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!bits[y * SIZE + x]) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) out[ny * SIZE + nx] = 1
        }
      }
    }
  }
  return out
}
const drawn = (m) => Array.isArray(m)
const broken = [...youj, ...lucide].filter((_, i) => !drawn(masks[i])).map((i) => i.name)
if (broken.length) console.log(`could not draw ${broken.length}: ${broken.join(', ')}\nfirst: ${masks.find((m) => !drawn(m))}`)
const kMasks = masks.slice(0, youj.length).map((m) => (drawn(m) ? dilate(m) : new Uint8Array(SIZE * SIZE)))
const lMasks = masks.slice(youj.length).map((m) => (drawn(m) ? dilate(m) : new Uint8Array(SIZE * SIZE)))
const count = (m) => m.reduce((t, v) => t + v, 0)
const lCounts = lMasks.map(count)
const hits = []
kMasks.forEach((k, i) => {
  const kc = count(k)
  lMasks.forEach((l, j) => {
    let inter = 0
    for (let p = 0; p < k.length; p++) inter += k[p] & l[p]
    const iou = inter / (kc + lCounts[j] - inter)
    if (iou >= MIN) hits.push({ youj: youj[i].name, lucide: lucide[j].name, iou })
  })
})
hits.sort((a, b) => b.iou - a.iou)
console.log(`${youj.length} Youj poses × ${lucide.length} lucide icons, ${SIZE}px, IoU ≥ ${MIN}: ${hits.length} pairs`)
for (const h of hits.slice(0, TOP)) console.log(`  ${h.iou.toFixed(3)}  ${h.youj.padEnd(34)} ~ ${h.lucide}`)

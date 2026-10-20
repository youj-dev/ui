// How tall each docs example's demo really is, so its frame can keep that room before the demo mounts
// (components/docs/preview-frame.tsx shows an empty stage until a reader nears it). A page's `height` is a minimum;
// a demo that outgrows it (a phone wraps it, a table has more rows) would push the page down when it arrives. This
// loads every docs page with an example, on a phone (390px) and a desktop (1440px), with reduced motion, wakes each
// frame, and measures its stage with no minimum at all (the demo and its padding), so what's already reserved never
// feeds back in (nor an example's cap, see STAGE_CAP). Every demo taller than its page's `height` somewhere is written to lib/stage-heights.json as [phone, from `sm` up], which
// ComponentPreview reads at build time. Run it against a running site (dev or a build) after a demo changes size:
//
//   node scripts/stage-heights.ts [--url http://localhost:3100] [--chromium /path/to/chrome] [--only /docs/components/table,...]
//
// With --only, just those pages are measured and their examples replace their entries in the file; the rest stay.
//
// A stale entry is harmless: the stage is a little too tall or too short, and the page shifts by the difference.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DOCS = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(DOCS, 'lib/stage-heights.json')
const arg = (name: string) => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 ? process.argv[at + 1] : undefined
}
const BASE = arg('url') ?? 'http://localhost:3100'
/** Phone, then desktop: the two sides of `sm`, where the stage's padding and the column change. */
const WIDTHS = [390, 1440] as const
const PARALLEL = 4

/** Every docs URL whose page shows an example: its file's path, less `(group)` folders and `index`. */
export function examplePages(dir = join(DOCS, 'content/docs')): string[] {
  const urls: string[] = []
  for (const file of readdirSync(dir, { recursive: true }) as string[]) {
    if (!file.endsWith('.mdx') || !readFileSync(join(dir, file), 'utf8').includes('<ComponentPreview')) continue
    const parts = relative(dir, join(dir, file)).replace(/\.mdx$/, '').split(/[\\/]/).filter((p) => !/^\(.+\)$/.test(p))
    if (parts.at(-1) === 'index') parts.pop()
    urls.push(['/docs', ...parts].join('/'))
  }
  return urls.sort()
}

/** The file, one example per line: `"button/demo": [394, 340]`. */
export function format(heights: Record<string, readonly [number, number]>): string {
  const rows = Object.keys(heights)
    .sort()
    .map((name) => `  ${JSON.stringify(name)}: [${heights[name]!.join(', ')}]`)
  return rows.length ? `{\n${rows.join(',\n')}\n}\n` : '{}\n'
}

type Page = import('playwright').Page
interface Seen {
  height: number
  measured: number
}

/** Each example on the page: its page `height` and its demo's own height (the stage with no minimum), once it has mounted and settled. */
async function measurePage(page: Page, url: string): Promise<Record<string, Seen>> {
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 180_000 })
  const frames = await page.$$('[data-example]')
  const seen: Record<string, Seen> = {}
  for (const frame of frames) {
    await frame.scrollIntoViewIfNeeded()
    const stage = await frame.waitForSelector('[data-preview-stage][data-live]', { timeout: 60_000 }).catch(() => null)
    if (!stage) {
      console.warn(`stage heights: ${url}: ${await frame.getAttribute('data-example')} didn't mount`)
      continue
    }
    await page.evaluate(() => document.fonts.ready)
    // The stage is live before its demo is (each demo is a chunk of its own): wait for the demo to draw something
    // and its height to hold for a second, or 20s at most.
    const [name, height, measured] = await frame.evaluate(async (el) => {
      const box = el.querySelector<HTMLElement>('[data-preview-stage][data-live]')!
      const natural = () => {
        const saved = box.getAttribute('style') ?? ''
        box.style.setProperty('--stage-min', '0px')
        box.style.setProperty('--stage-min-sm', '0px')
        // A capped example (components/docs/preview-live.tsx) scrolls inside its stage: measure it uncapped, or its own cap feeds back in.
        const scroller = box.querySelector<HTMLElement>('.stage-scroll')
        const savedScroller = scroller?.getAttribute('style') ?? ''
        scroller?.style.setProperty('max-height', 'none')
        const px = Math.ceil(box.getBoundingClientRect().height)
        box.setAttribute('style', saved)
        scroller?.setAttribute('style', savedScroller)
        return px
      }
      const drawn = () => (box.querySelector(':scope > .relative')?.childElementCount ?? 0) > 0
      let last = -1
      let steady = 0
      let most = 0
      for (let waited = 0; waited < 20_000 && steady < 4; waited += 250) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        const px = natural()
        most = Math.max(most, px)
        steady = drawn() && px === last ? steady + 1 : 0
        last = px
      }
      return [el.getAttribute('data-example')!, Number(el.getAttribute('data-height')), most] as const
    })
    const prev = seen[name]
    seen[name] = { height: Math.min(prev?.height ?? height, height), measured: Math.max(prev?.measured ?? 0, measured) }
  }
  return seen
}

async function main() {
  const { chromium } = createRequire(join(DOCS, '../../package.json'))('playwright') as typeof import('playwright')
  const browser = await chromium.launch({ executablePath: arg('chromium') })
  const only = arg('only')?.split(',')
  const pages = only ?? examplePages()
  // name → per width, the smallest page height it's shown at and the tallest it measured.
  const found = new Map<string, Seen[]>()
  for (const [w, width] of WIDTHS.entries()) {
    const queue = [...pages]
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        const page = await context.newPage()
        for (let url = queue.shift(); url; url = queue.shift()) {
          const seen = await measurePage(page, url).catch((error: Error) => {
            console.warn(`stage heights: ${url} at ${width}px: ${error.message.split('\n')[0]}`)
            return {}
          })
          for (const [name, s] of Object.entries(seen)) {
            const list = found.get(name) ?? []
            const prev = list[w]
            list[w] = prev ? { height: Math.min(prev.height, s.height), measured: Math.max(prev.measured, s.measured) } : s
            found.set(name, list)
          }
        }
        await context.close()
      }),
    )
  }
  await browser.close()
  const heights: Record<string, [number, number]> = only ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
  for (const [name, [phone, wide]] of found) {
    if (only) delete heights[name]
    if (!phone || !wide) continue
    const least = Math.min(phone.height, wide.height)
    if (phone.measured > least || wide.measured > least) heights[name] = [phone.measured, wide.measured]
  }
  writeFileSync(OUT, format(heights))
  console.log(`stage heights: ${found.size} examples on ${pages.length} pages, ${Object.keys(heights).length} taller than their page's height → lib/stage-heights.json`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()

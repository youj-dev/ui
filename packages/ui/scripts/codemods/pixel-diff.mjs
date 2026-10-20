// Pixel-diffs Storybook stories between two states of the code: capture once
// before a change, once after, then compare. Built for the own: codemod, which
// must not move a pixel (the layer order changes who wins only where a className
// and a recipe disagree), and reusable for any refactor that promises the same.
//
//   node scripts/codemods/pixel-diff.mjs capture <dir> [--url http://localhost:6006] [--match <regex>] [--ids a,b]
//        [--styles bezel,classic] [--presets | --looks light:graphite,dark:basalt] [--shard 2/5]
//   node scripts/codemods/pixel-diff.mjs urls <dir> --urls <file> [--site http://localhost:3000]
//   node scripts/codemods/pixel-diff.mjs compare <before-dir> <after-dir> [--tolerance 0]
//
// capture shoots every matching story in light and dark, Bezel and Classic,
// with motion reduced (so nothing is caught mid-flight). --presets repeats it
// in every theme preset (a look is a mode and a preset; file names gain
// `@<preset>`), --looks in the listed looks only. urls shoots the docs pages a
// JSON file lists, in light and dark: [{ "name", "path", "viewport"?: "mobile",
// "steps"?: [{ "click": selector } | { "press": key } | { "wait": ms }] }]. compare reports each
// pair that differs, with its count of differing pixels, and exits 1 if any do.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'http://localhost:6006' },
    match: { type: 'string', default: '^ui-' },
    ids: { type: 'string' },
    // `2/5` shoots every fifth story from the second: run the five side by side into one directory.
    shard: { type: 'string' },
    styles: { type: 'string', default: 'bezel,classic' },
    presets: { type: 'boolean', default: false },
    looks: { type: 'string' },
    urls: { type: 'string' },
    site: { type: 'string', default: 'http://localhost:3000' },
    width: { type: 'string', default: '960' },
    // Differing pixels to ignore per shot: two captures of the same code differ by up to ~15 (a focus halo mid-frame).
    tolerance: { type: 'string', default: '0' },
  },
})
const [command, a, b] = positionals
/** The date every shot is taken at, so calendars, timelines and relative times don't change between a capture and its comparison. */
const FIXED_TIME = new Date('2026-06-15T10:00:00')
const PRESETS = ['basalt', 'brutal', 'graphite', 'iris', 'linen', 'terminal']

/** Every theme x style to shoot, and the file-name suffix of each. No preset is Storybook's own: Basalt, or a block's own theme. */
function looks() {
  const styles = opts.styles.split(',')
  let pairs = ['light', 'dark'].map((theme) => ({ theme, preset: null }))
  if (opts.presets) pairs = ['light', 'dark'].flatMap((theme) => PRESETS.map((preset) => ({ theme, preset })))
  if (opts.looks) pairs = opts.looks.split(',').map((look) => {
    const [theme, preset] = look.split(':')
    return { theme, preset }
  })
  return pairs.flatMap(({ theme, preset }) =>
    styles.map((style) => ({
      globals: `theme:${theme};style:${style};reducedMotion:always${preset ? `;themePreset:${preset}` : ''}`,
      suffix: `${theme}-${style}${preset ? `@${preset}` : ''}`,
    })),
  )
}

async function capture(dir) {
  mkdirSync(dir, { recursive: true })
  const index = await (await fetch(`${opts.url}/index.json`)).json()
  const match = new RegExp(opts.match)
  let ids = opts.ids
    ? opts.ids.split(',')
    : Object.values(index.entries)
        .filter((e) => e.type === 'story' && match.test(e.id))
        .map((e) => e.id)
  if (opts.shard) {
    const [k, n] = opts.shard.split('/').map(Number)
    ids = ids.filter((_, i) => i % n === k - 1)
  }
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: Number(opts.width), height: 720 }, reducedMotion: 'reduce' })
  // Date only: timers keep running, but "today" and "2 minutes ago" stop moving between captures.
  await page.clock.setFixedTime(FIXED_TIME)
  let shots = 0
  for (const id of ids) {
    for (const { globals, suffix } of looks()) {
      await page.goto(`${opts.url}/iframe.html?id=${id}&viewMode=story&globals=${globals}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('#storybook-root > *', { timeout: 15_000 }).catch(() => {})
      await page.evaluate(() => document.fonts.ready)
      // Caret blink and any loop left running.
      await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important;animation-play-state:paused!important;transition:none!important}' })
      await page.waitForTimeout(150)
      await page.screenshot({ path: join(dir, `${id}--${suffix}.png`), fullPage: true })
      shots++
    }
  }
  await browser.close()
  console.log(`captured ${shots} shots of ${ids.length} stories into ${dir}`)
}

/** The docs pages in --urls, each in light and dark (the OS preference, which a first visit follows), against a running site. */
async function urls(dir) {
  mkdirSync(dir, { recursive: true })
  const pages = JSON.parse(readFileSync(opts.urls, 'utf8'))
  const browser = await chromium.launch()
  let shots = 0
  for (const { name, path, viewport, steps = [] } of pages) {
    for (const scheme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 },
        colorScheme: scheme,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      await page.clock.setFixedTime(FIXED_TIME)
      await page.goto(new URL(path, opts.site).href, { waitUntil: 'networkidle', timeout: 120_000 })
      await page.evaluate(() => document.fonts.ready)
      await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important;animation-play-state:paused!important;transition:none!important}' })
      for (const step of steps) {
        if (step.click) await page.click(step.click)
        else if (step.press) await page.keyboard.press(step.press)
        else await page.waitForTimeout(step.wait ?? 300)
      }
      await page.waitForTimeout(400)
      await page.screenshot({ path: join(dir, `${name}--${scheme}.png`), fullPage: !steps.length })
      await context.close()
      shots++
    }
  }
  await browser.close()
  console.log(`captured ${shots} shots of ${pages.length} pages into ${dir}`)
}

async function compare(before, after) {
  const names = readdirSync(before).filter((n) => n.endsWith('.png') && !n.endsWith('.diff.png'))
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const differing = []
  let missing = 0
  for (const name of names) {
    if (!existsSync(join(after, name))) {
      missing++
      continue
    }
    const x = readFileSync(join(before, name))
    const y = readFileSync(join(after, name))
    if (x.equals(y)) continue
    const count = await page.evaluate(
      async ([p, q]) => {
        const load = async (src) => {
          const img = new Image()
          img.src = `data:image/png;base64,${src}`
          await img.decode()
          const c = new OffscreenCanvas(img.width, img.height)
          const ctx = c.getContext('2d')
          ctx.drawImage(img, 0, 0)
          return ctx.getImageData(0, 0, img.width, img.height)
        }
        const [i, j] = [await load(p), await load(q)]
        if (i.width !== j.width || i.height !== j.height) return `size ${i.width}x${i.height} -> ${j.width}x${j.height}`
        let n = 0
        let maxDelta = 0
        const mask = new ImageData(i.width, i.height)
        for (let k = 0; k < i.data.length; k += 4) {
          const d = Math.max(...[0, 1, 2, 3].map((o) => Math.abs(i.data[k + o] - j.data[k + o])))
          mask.data[k + 3] = 255
          mask.data[k] = mask.data[k + 1] = mask.data[k + 2] = i.data[k] / 4
          if (d) {
            n++
            maxDelta = Math.max(maxDelta, d)
            mask.data[k] = 255
            mask.data[k + 1] = mask.data[k + 2] = 0
          }
        }
        if (!n) return 0
        const c = new OffscreenCanvas(i.width, i.height)
        c.getContext('2d').putImageData(mask, 0, 0)
        const blob = await c.convertToBlob()
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let bin = ''
        for (const byte of bytes) bin += String.fromCharCode(byte)
        return { n, maxDelta, mask: btoa(bin) }
      },
      [x.toString('base64'), y.toString('base64')],
    )
    if (typeof count === 'string') differing.push([name, count])
    else if (count && count.n > Number(opts.tolerance)) {
      // A mask beside the after shot: changed pixels in red over the before, dimmed.
      writeFileSync(join(after, name.replace(/\.png$/, '.diff.png')), Buffer.from(count.mask, 'base64'))
      differing.push([name, `${count.n} px (max channel delta ${count.maxDelta})`])
    }
  }
  await browser.close()
  const report = differing.map(([n, c]) => `${n}: ${c}`).join('\n')
  writeFileSync(join(after, 'diff-report.txt'), `${names.length} compared, ${differing.length} differ, ${missing} missing\n${report}\n`)
  console.log(`${names.length} compared, ${differing.length} differ, ${missing} missing${report ? `\n${report}` : ''}`)
  if (differing.length || missing) process.exit(1)
}

if (command === 'capture' && a) await capture(a)
else if (command === 'urls' && a && opts.urls) await urls(a)
else if (command === 'compare' && a && b) await compare(a, b)
else {
  console.error('usage: pixel-diff.mjs capture <dir> [--url] [--match] [--ids] [--styles] [--presets|--looks] | urls <dir> --urls <file> [--site] | compare <before> <after>')
  process.exit(2)
}

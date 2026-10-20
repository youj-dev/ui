// Low-end performance harness over the built Storybook.
//
//   pnpm build-storybook && pnpm perf [options]
//
//   --dir <path>        static Storybook to serve (default storybook-static)
//   --url <url>         measure an already running Storybook instead of serving --dir
//   --port <n>          port for the built-in static server (default 6181)
//   --profile <a,b>     desktop-4x, desktop-6x, mobile-4x (default: all three)
//   --only <a,b>        scenario names from scenarios.mjs (default: all)
//   --runs <n>          runs per scenario; metrics are the median (default 3)
//   --quality <q>       Storybook Quality global: auto | high | low (default auto)
//   --out <file>        results JSON (default scripts/perf/results/latest.json)
//
// Each run opens the story in a fresh context with CDP CPU throttling already
// on (so load, hydration and the motion-budget probe see the slow device),
// lets it settle, then records while the scenario drives it. Chromium runs
// in new headless mode so WebGL uses the real GPU; CPU throttling slows the
// main thread only, so GPU-bound cost (shader fill rate) isn't emulated.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { scenarios } from './scenarios.mjs'
import { environment, summarize } from './stats.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

export const PROFILES = {
  'desktop-4x': { cpu: 4, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  'desktop-6x': { cpu: 6, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  'mobile-4x': { cpu: 4, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}

const args = parseArgs(process.argv.slice(2))
const profiles = (args.profile ?? Object.keys(PROFILES).join(',')).split(',')
const only = args.only?.split(',')
const runs = Number(args.runs ?? 3)
const quality = args.quality ?? 'auto'
const out = resolve(args.out ?? join(here, 'results/latest.json'))
const port = Number(args.port ?? 6181)
const chosen = scenarios.filter((s) => !only || only.includes(s.name))
for (const p of profiles) if (!PROFILES[p]) throw new Error(`unknown profile ${p}`)
if (!chosen.length) throw new Error(`no scenarios match ${args.only}`)

let server
let base = args.url
if (!base) {
  const dir = resolve(args.dir ?? join(root, 'storybook-static'))
  server = spawn(process.execPath, [join(root, 'scripts/serve-static.mjs'), dir, String(port)], { stdio: 'ignore' })
  base = `http://localhost:${port}`
  await waitFor(`${base}/index.json`)
}

const recorder = readFileSync(join(here, 'recorder.js'), 'utf8')
const loadBefore = os.loadavg()
const browser = await chromium.launch({ channel: 'chromium' })
const chromiumVersion = browser.version()
const results = {}
try {
  for (const profileName of profiles) {
    const profile = PROFILES[profileName]
    results[profileName] = {}
    for (const scenario of chosen) {
      const samples = []
      for (let i = 0; i < runs; i++) {
        try {
          samples.push(await measure(profile, scenario))
        } catch (error) {
          console.error(`  ${profileName} ${scenario.name} run ${i + 1} failed: ${error.message.split('\n')[0]}`)
        }
      }
      results[profileName][scenario.name] = summarize(samples)
      console.log(`${profileName.padEnd(11)} ${scenario.name.padEnd(24)} ${format(results[profileName][scenario.name])}`)
    }
  }
} finally {
  await browser.close()
  server?.kill()
}

const report = {
  meta: {
    date: new Date().toISOString(),
    environment: environment(),
    chromium: chromiumVersion,
    quality,
    runs,
    load: { before: loadBefore.map(round), after: os.loadavg().map(round), cpus: os.cpus().length },
  },
  results,
}
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`)
console.log(`\nload average ${report.meta.load.before.join(' ')} → ${report.meta.load.after.join(' ')} on ${report.meta.load.cpus} cpus`)
console.log(`wrote ${out}`)

async function measure(profile, scenario) {
  const { cpu, ...device } = profile
  const context = await browser.newContext({ ...device })
  try {
    const page = await context.newPage()
    await page.addInitScript(recorder)
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    const globals = `theme:dark;quality:${quality};a11y.manual:!true`
    await page.goto(`${base}/iframe.html?id=${scenario.story}&viewMode=story&globals=${globals}`, { waitUntil: 'load', timeout: 90_000 })
    await page.locator('#storybook-root > *').first().waitFor({ timeout: 60_000 })
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.__perf.start())
    const t0 = Date.now()
    await scenario.run(page)
    const raw = await page.evaluate(() => window.__perf.stop())
    raw.wall = Date.now() - t0
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    return raw
  } finally {
    await context.close()
  }
}

function format(m) {
  if (!m) return 'failed'
  const inp = m.inp == null ? '   -  ' : `${String(Math.round(m.inp)).padStart(4)}ms`
  const gpu = m.shadedMPps ? `  gpu ${String(Math.round(m.shadedMPps)).padStart(4)}MP/s` : ''
  return `fps ${String(m.fps).padStart(5)}  p50 ${String(m.p50).padStart(5)}  p95 ${String(m.p95).padStart(6)}  hitch ${String(m.hitches).padStart(2)}  long ${String(m.longTasks).padStart(3)}  tbt ${String(m.tbt).padStart(5)}  inp ${inp}${gpu}`
}

function round(n) {
  return Math.round(n * 100) / 100
}

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`static server did not start at ${url}`)
}

function parseArgs(list) {
  const parsed = {}
  for (let i = 0; i < list.length; i++) {
    const key = list[i].replace(/^--/, '')
    parsed[key] = list[i + 1]?.startsWith('--') || list[i + 1] === undefined ? 'true' : list[++i]
  }
  return parsed
}

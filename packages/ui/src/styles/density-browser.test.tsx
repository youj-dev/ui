import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, firefox, webkit, type BrowserType } from 'playwright'
import { compile } from 'tailwindcss'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '../components/ui/sidebar'

/* A sidebar row's height measured in real browsers, at each density, scale and
 * device: what an app's own Tailwind build of the components gives, laid out.
 * density-compiled.test.ts checks the CSS arithmetic on paper; this catches an
 * engine computing it wrong. Chromium 141 resolved the row's old
 * `calc(C - (C - S) * compact * (1 - touch))` to -S, so compact rows collapsed
 * to their padding there while newer engines drew them right.
 *
 * It runs in every Playwright browser that is installed, plus Chromium 141
 * when it is (`npx playwright@1.56.1 install chromium-headless-shell`, or
 * YJ_CHROMIUM_141=<executable>); CI installs both and requires the old one. */

const here = dirname(fileURLToPath(import.meta.url))
const twDir = dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))

/** Chromium 141 (Playwright 1.56's build 1194) beside the installed browsers, if it's there. */
function chromium141(): string | undefined {
  if (process.env.YJ_CHROMIUM_141) return process.env.YJ_CHROMIUM_141
  const current = chromium.executablePath()
  const at = current.search(/[\\/]chromium(?:_headless_shell)?-\d+[\\/]/)
  if (at < 0) return undefined
  const dir = join(current.slice(0, at), 'chromium_headless_shell-1194')
  const find = (d: string, depth: number): string | undefined => {
    if (!existsSync(d) || depth > 3) return undefined
    for (const name of readdirSync(d)) {
      const path = join(d, name)
      if (/^headless_shell(\.exe)?$/.test(name)) return path
      if (statSync(path).isDirectory()) {
        const found = find(path, depth + 1)
        if (found) return found
      }
    }
  }
  return find(dir, 0)
}

const old = chromium141()
const ENGINES: { name: string; type: BrowserType; executablePath?: string }[] = [
  { name: 'chromium', type: chromium },
  { name: 'firefox', type: firefox },
  { name: 'webkit', type: webkit },
  ...(old ? [{ name: 'chromium 141', type: chromium, executablePath: old }] : []),
].filter((e) => existsSync(e.executablePath ?? e.type.executablePath()))

const SCALES = [0.9, 1, 1.1] as const
type Density = 'compact' | 'roomy'
type Device = 'pointer' | 'touch'
const CASES = (['compact', 'roomy'] as const).flatMap((density) => SCALES.flatMap((scale) => (['pointer', 'touch'] as const).map((device) => ({ density, scale, device }))))

/** The row's height in px: the small control's compact, the control's roomy, both by the scale; on touch the control's, 44px at least. */
function expected(density: Density, scale: number, device: Device) {
  if (device === 'touch') return 44 * Math.max(scale, 1)
  return (density === 'compact' ? 28 : 32) * scale
}

const id = (density: Density, scale: number, device: Device) => `${density}-${Math.round(scale * 100)}-${device}`

function Rows({ id }: { id: string }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton id={id}>
                <svg aria-hidden />
                <span>Deployments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

const scaling = (scale: number) => `${Math.round(scale * 100)}%` as '90%' | '100%' | '110%'

function page(): string {
  const cells: ReactNode[] = CASES.map(({ density, scale, device }) => (
    // What `youj init` writes, at each step.
    <YoujProvider key={id(density, scale, device)} density={density} scaling={scaling(scale)} device={device}>
      <Rows id={id(density, scale, device)} />
    </YoujProvider>
  ))
  // The nearest scope decides, both ways round.
  cells.push(
    <YoujProvider key="nested-roomy" density="compact" scaling="90%" device="pointer">
      <ThemeScope density="roomy">
        <Rows id="nested-roomy" />
      </ThemeScope>
    </YoujProvider>,
    <YoujProvider key="nested-compact" density="roomy" scaling="90%" device="pointer">
      <ThemeScope density="compact">
        <Rows id="nested-compact" />
      </ThemeScope>
    </YoujProvider>,
  )
  return renderToStaticMarkup(<>{cells}</>)
}

let html = ''
beforeAll(async () => {
  const body = page()
  const styles = readdirSync(here).filter((f) => f.endsWith('.css') && f !== 'ui.css')
  const entry = ["@import 'tailwindcss';", "@import '../../../core/src/styles/youj.css';", "@import './ui.css';", ...styles.map((f) => `@import './${f}';`)].join('\n')
  const compiler = await compile(entry, {
    base: here,
    async loadStylesheet(sheet, base) {
      const path = sheet === 'tailwindcss' ? resolve(twDir, 'index.css') : resolve(base, sheet)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  const candidates = [...new Set([...body.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.replaceAll('&amp;', '&').split(/\s+/)))]
  html = `<!doctype html><html><head><style>${compiler.build(candidates)}</style></head><body>${body}</body></html>`
})

test('a browser is installed to measure in', () => {
  expect(ENGINES.length, 'install one with `pnpm exec playwright install chromium`').toBeGreaterThan(0)
  if (process.env.CI) expect(old, 'CI installs Chromium 141: npx playwright@1.56.1 install chromium-headless-shell').toBeDefined()
})

describe.each(ENGINES)('$name', ({ type, executablePath }) => {
  let heights: Record<string, number> = {}
  beforeAll(async () => {
    const browser = await type.launch({ executablePath })
    try {
      const tab = await browser.newPage()
      await tab.setContent(html)
      heights = await tab.$$eval('[data-sidebar="menu-button"]', (rows) => Object.fromEntries(rows.map((r) => [r.id, r.getBoundingClientRect().height])))
    } finally {
      await browser.close()
    }
  }, 60_000)

  test.each(CASES)('a row is its control height: $density, $scale, $device', ({ density, scale, device }) => {
    expect(heights[id(density, scale, device)]).toBeCloseTo(expected(density, scale, device), 1)
  })

  test('a row follows the nearest density scope', () => {
    expect(heights['nested-roomy']).toBeCloseTo(expected('roomy', 0.9, 'pointer'), 1)
    expect(heights['nested-compact']).toBeCloseTo(expected('compact', 0.9, 'pointer'), 1)
  })
})

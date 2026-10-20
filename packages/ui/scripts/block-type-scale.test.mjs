// Display type in blocks stays bounded. Two scales: app-like blocks (app,
// lifestyle, commerce, frame) read at 13px body with 18–24px headings and
// reserve text-5xl/6xl for decorative display (404, 500, countdowns); marketing
// and content go up to a 60px hero. text-7xl and above, or a literal size of
// 4.5rem and above, is for poster blocks only. Fluid type scales with its
// container (cqi) and a cap, never the viewport: a block shown in a preview
// pane or a sidebar layout must not size itself against the window.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const BLOCKS = join(import.meta.dirname, '../src/blocks')

// Blocks whose point is the oversized glyph itself.
const POSTER = [
  'content/blog/cover.tsx', // the cover art's decorative initial
]
// App-like blocks allowed text-5xl/6xl: full-page decorative display.
const APP_DISPLAY = [
  'app/error', // the 500/404 code, the maintenance and launch countdowns
  'app/status-screen', // the 401/403/503 code, the same full-page display
]
const APP_GROUPS = ['app/', 'lifestyle/', 'commerce/', 'frame/']

const POSTER_SIZE = /\btext-(?:[789]xl\b|\[(?:length:)?(?:(?:4\.[5-9]|[5-9](?:\.\d+)?|\d{2,}(?:\.\d+)?)rem|(?:7[2-9]|[89]\d|\d{3,})px)\])/
const VIEWPORT_TYPE = /\btext-\[[^\]\s]*\d[sdl]?vw\b/
const APP_LARGE = /\btext-[56]xl\b/

export function violations(path, code) {
  const out = []
  const poster = POSTER.includes(path)
  const appLike = APP_GROUPS.some((g) => path.startsWith(g))
  const appDisplay = APP_DISPLAY.some((p) => path.startsWith(p))
  code.split('\n').forEach((line, i) => {
    const at = `${path}:${i + 1}`
    if (!poster && POSTER_SIZE.test(line)) out.push(`${at}  poster-size type outside a poster block`)
    if (VIEWPORT_TYPE.test(line)) out.push(`${at}  vw in a type size: use cqi with a cap`)
    if (appLike && !appDisplay && APP_LARGE.test(line)) out.push(`${at}  text-5xl/6xl in an app-like block`)
  })
  return out
}

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(name)) files.push(p)
  }
}
walk(BLOCKS)

describe('block type scale', () => {
  it('keeps display type in blocks within the scale', () => {
    const found = files.flatMap((f) => violations(relative(BLOCKS, f), readFileSync(f, 'utf8')))
    expect(found).toEqual([])
  })

  it('flags poster sizes outside poster blocks', () => {
    for (const cls of ['text-7xl', 'sm:text-9xl', 'text-[5rem]', 'text-[4.5rem]', 'text-[96px]', 'text-[length:6rem]'])
      expect(violations('marketing/x.tsx', `className="${cls}"`)).toHaveLength(1)
    for (const cls of ['text-6xl', 'text-[4rem]', 'text-[0.42em]', 'text-[64px]', 'text-[clamp(3.25rem,22.5cqi,12rem)]'])
      expect(violations('marketing/x.tsx', `className="${cls}"`)).toEqual([])
    expect(violations('content/blog/cover.tsx', 'className="text-7xl"')).toEqual([])
  })

  it('flags viewport units inside a type size', () => {
    for (const cls of ['text-[clamp(3.5rem,11.5vw,10rem)]', 'text-[length:clamp(1.875rem,3.6vw,2.75rem)]', 'text-[max(2rem,5svw)]'])
      expect(violations('marketing/x.tsx', `className="${cls}"`)).toHaveLength(1)
    expect(violations('marketing/x.tsx', 'className="text-[clamp(3.5rem,11.5cqi,7rem)] w-[50vw]"')).toEqual([])
  })

  it('flags text-5xl/6xl in app-like blocks outside the display allowlist', () => {
    expect(violations('app/envelopes.tsx', 'className="text-5xl"')).toHaveLength(1)
    expect(violations('frame/x.tsx', 'className="md:text-6xl"')).toHaveLength(1)
    expect(violations('app/error/launch.tsx', 'className="sm:text-6xl"')).toEqual([])
    expect(violations('marketing/x.tsx', 'className="text-6xl"')).toEqual([])
  })
})

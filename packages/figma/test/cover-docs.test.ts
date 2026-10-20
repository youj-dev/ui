import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { buildKit } from '../src/data/build-kit'
import { applyTheme, run } from '../src/plugin/run'
import { installFakeFigma } from './fake-figma'
import { Preview } from './preview'

/* The docs' Figma page shows the kit's cover as two baked images. This renders
 * them from the plugin's own cover drawing and stamps what they were drawn from;
 * the second test fails when the brand, the cover's code or the kit's counts
 * have moved on since.
 *
 *   pnpm -F @youj/figma cover:docs    re-renders apps/docs/public/figma/kit-cover-{light,dark}.webp and kit-cover.json */

const out = join(import.meta.dirname, '../../../apps/docs/public/figma')
const stampFile = join(out, 'kit-cover.json')
const CROP = ['40', '40', '1434', '1096']
const source = (path: string) => readFileSync(join(import.meta.dirname, path))

/** What the cover is drawn from: the brand, the cover's drawing and the kit (its counts are its own data). */
function coverStamp() {
  const kit = buildKit()
  const sources = createHash('sha256')
    .update(source('../../core/src/docs/brand/logo.ts'))
    .update(source('../src/plugin/sheets/cover.ts'))
    .digest('hex')
    .slice(0, 12)
  return {
    sources,
    kit: kit.hash,
    counts: {
      themes: kit.themes.length,
      variables: kit.colors.length + kit.theme.length + kit.fonts.length + kit.scale.length,
      icons: kit.icons.length,
    },
  }
}

test.runIf(process.env.COVER_DOCS === '1')('renders the docs cover images from the plugin', async () => {
  const { env } = installFakeFigma()
  const kit = buildKit()
  await run(kit, 'build')
  const cover = env.pages.find((p) => p.name.toLowerCase().includes('cover'))!
  const tmp = mkdtempSync(join(tmpdir(), 'kit-cover-'))
  mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const mode of ['light', 'dark'] as const) {
      await (globalThis as unknown as { figma: PluginAPI }).figma.setCurrentPageAsync(cover as unknown as PageNode)
      await applyTheme(kit, kit.defaults.theme, mode)
      const htmlFile = join(tmp, `${mode}.html`)
      writeFileSync(htmlFile, new Preview(env).page(cover, mode === 'dark' ? '#0b0b0d' : '#ffffff'))
      const tab = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
      await tab.goto(`file://${htmlFile}`)
      await tab.evaluate(() => document.fonts.ready)
      const png = join(tmp, `${mode}.png`)
      // The sheet's top: lockup, headline and the four counts (not the dated build log below).
      await tab.screenshot({ path: png, fullPage: true })
      await tab.close()
      execFileSync('cwebp', ['-q', '86', '-m', '6', '-crop', ...CROP, '-resize', '1600', '1223', png, '-o', join(out, `kit-cover-${mode}.webp`), '-quiet'])
    }
  } finally {
    await browser.close()
  }
  writeFileSync(stampFile, `${JSON.stringify(coverStamp(), null, 2)}\n`)
}, 180_000)

test('the docs cover images are drawn from the current brand, cover and counts', () => {
  const stamped = JSON.parse(readFileSync(stampFile, 'utf8')) as ReturnType<typeof coverStamp>
  expect(stamped, 'apps/docs/public/figma is stale: run pnpm -F @youj/figma cover:docs').toEqual(coverStamp())
})

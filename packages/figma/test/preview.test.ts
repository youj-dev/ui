import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { buildKit } from '../src/data/build-kit'
import { applyTheme, run } from '../src/plugin/run'
import { installFakeFigma } from './fake-figma'
import { Preview } from './preview'

/* Renders every page of a fake build to HTML and PNG, for looking at the kit
 * without Figma. Opt-in: PREVIEW_DIR=/some/dir pnpm -F @youj/figma test preview.
 * PREVIEW_PLAN=starter builds with Starter limits; PREVIEW_THEME=terminal:dark
 * applies a theme to every page first; PREVIEW_STYLE=classic draws the components in Classic. */

const dir = process.env.PREVIEW_DIR

test.runIf(Boolean(dir))('preview: render every page', async () => {
  const starter = process.env.PREVIEW_PLAN === 'starter'
  const { env } = installFakeFigma(starter ? { modeLimit: 1, pageLimit: 3 } : {})
  const kit = buildKit()
  await run(kit, process.env.PREVIEW_STYLE ? `look:${process.env.PREVIEW_STYLE}` : 'build')
  const theme = process.env.PREVIEW_THEME
  const browser = await chromium.launch()
  try {
    mkdirSync(dir!, { recursive: true })
    for (const page of env.pages) {
      if (theme) {
        const [t, m] = theme.split(':') as [string, 'light' | 'dark']
        await (globalThis as unknown as { figma: PluginAPI }).figma.setCurrentPageAsync(page as unknown as PageNode)
        await applyTheme(kit, t, m)
      }
      const html = new Preview(env).page(page)
      const name = page.name.toLowerCase().replace(/[^a-z]+/g, '-')
      const file = join(dir!, `${name}.html`)
      writeFileSync(file, html)
      const tab = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
      await tab.goto(`file://${file}`)
      await tab.evaluate(() => document.fonts.ready)
      await tab.screenshot({ path: join(dir!, `${name}.png`), fullPage: true })
      await tab.close()
    }
  } finally {
    await browser.close()
  }
}, 180_000)

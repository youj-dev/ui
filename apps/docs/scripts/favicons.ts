/* Writes the site's tab icons from the brand's geometry (faviconSvg and
 * appIconSvg in packages/core's docs/brand/logo.ts) and the site preset's
 * colours in each mode (lib/site-brand.ts): public/icons/<preset>-<mode>.svg
 * (the mark hinted for 32px) and a 32px PNG of each, then, in the default
 * state (Basalt dark), the apple-touch-icon (180px: the mark full bleed,
 * since the platform rounds it) and favicon.ico (the 16 and 32 hinted
 * designs) for crawlers and older Safari. The PNGs are drawn by
 * Playwright's Chromium.
 * Run after a change to the mark, the word or the preset's ink, accent,
 * canvas or accent contrast: `pnpm -F docs favicons`. lib/site-brand.test.ts
 * fails while the SVGs are stale. */

import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

type Mode = 'dark' | 'light'
type Colors = { ink: string; accent: string; canvas: string; dot: string }
interface BrandModule {
  SITE_MODES: readonly Mode[]
  brandColors: (mode: Mode) => Colors
  iconName: (mode: Mode) => string
  faviconFor: (mode: Mode) => string
}
interface LogoModule {
  faviconSvg: (colors: Colors, size?: 16 | 32) => string
  appIconSvg: (colors: Colors, size?: number) => string
}

const DOCS = fileURLToPath(new URL('..', import.meta.url))
const { chromium } = createRequire(import.meta.url)('playwright') as typeof import('playwright')

const vite = await createServer({
  root: DOCS,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})

let brand: BrandModule
let logo: LogoModule
try {
  brand = (await vite.ssrLoadModule('/lib/site-brand.ts')) as BrandModule
  logo = (await vite.ssrLoadModule('/../../packages/core/src/docs/brand/logo.ts')) as LogoModule
} finally {
  await vite.close()
}

/** A PNG-in-ICO container: one directory entry per PNG, each image stored as the PNG itself. */
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i
    header.writeUInt8(size, at)
    header.writeUInt8(size, at + 1)
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(png.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...images.map((image) => image.png)])
}

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })
async function raster(svg: string, size: number) {
  await page.setViewportSize({ width: size, height: size })
  const sized = svg.replace('<svg ', `<svg style="display:block" width="${size}" height="${size}" `).replace(/ width="\d+" height="\d+"/, '')
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}</style>${sized}`)
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
}

try {
  mkdirSync(`${DOCS}/public/icons`, { recursive: true })
  for (const mode of brand.SITE_MODES) {
    const name = brand.iconName(mode)
    const svg = brand.faviconFor(mode)
    writeFileSync(`${DOCS}/public/icons/${name}.svg`, svg)
    writeFileSync(`${DOCS}/public/icons/${name}-32.png`, await raster(svg, 32))
    console.log(`favicons: public/icons/${name}.svg and -32.png`)
  }
  const [fallback] = brand.SITE_MODES
  const brandColors = brand.brandColors(fallback!)
  const colors = { ...brandColors, accent: brandColors.dot }
  writeFileSync(`${DOCS}/app/apple-icon.png`, await raster(logo.appIconSvg(colors), 180))
  const ico16 = await raster(logo.faviconSvg(colors, 16), 16)
  const ico32 = await raster(logo.faviconSvg(colors, 32), 32)
  writeFileSync(
    `${DOCS}/public/favicon.ico`,
    ico([
      { size: 16, png: ico16 },
      { size: 32, png: ico32 },
    ]),
  )
  console.log(`favicons: app/apple-icon.png and public/favicon.ico in ${brand.iconName(fallback!)}`)
} finally {
  await browser.close()
}

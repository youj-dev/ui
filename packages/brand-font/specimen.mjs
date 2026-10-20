// Specimens for the Youj Display draft, rendered with the built font file.
//   node specimen.mjs OUT_DIR   (OUT_DIR holds youj-display.otf; PLAYWRIGHT=<path to playwright> if not resolvable)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = resolve(process.argv[2] ?? 'build')
const tag = process.argv[3] ? `-${process.argv[3]}` : '' // e.g. v2: specimen-charset-v2-light.png
const variantsFile = join(out, 'variants.json')
const variants = existsSync(variantsFile) ? JSON.parse(readFileSync(variantsFile, 'utf8')) : []
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright')

const LOGO = [
  'M0 8.57H2.19V15.6C2.19 16.4 2.29 16.8 2.74 16.8H7.13C7.58 16.8 7.68 16.4 7.68 15.6V8.57H9.87V20.8C9.87 23.25 8.67 24 7.28 24H4.28V22.05H7.13C7.58 22.05 7.68 21.65 7.68 20.85V18.75H2.59C1.2 18.75 0 18 0 15.55Z',
  'M14.24 8.57H18.93C20.32 8.57 21.52 9.32 21.52 11.77V16.8C21.52 19.25 20.32 20 18.93 20H14.24C12.85 20 11.65 19.25 11.65 16.8V11.77C11.65 9.32 12.85 8.57 14.24 8.57ZM14.39 10.52C13.94 10.52 13.84 10.92 13.84 11.72V16.85C13.84 17.65 13.94 18.05 14.39 18.05H18.78C19.23 18.05 19.33 17.65 19.33 16.85V11.72C19.33 10.92 19.23 10.52 18.78 10.52Z',
  'M23.27 8.57H25.46V16.85C25.46 17.65 25.56 18.05 26.01 18.05H30.4C30.85 18.05 30.95 17.65 30.95 16.85V8.57H33.14V16.8C33.14 19.25 31.94 20 30.55 20H25.86C24.47 20 23.27 19.25 23.27 16.8Z',
  'M35.2 8.57H37.39V20.8C37.39 23.25 36.19 24 34.8 24H31.8V22.05H34.65C35.1 22.05 35.2 21.65 35.2 20.85Z',
].join('')
const TITTLE = '<rect x="35.13" y="4" width="2.33" height="2.33"/>'

const THEMES = {
  light: { bg: '#f6f5f1', fg: '#16161a', muted: '#8a8a90', accent: '#2f6bff', line: '#dddcd6' },
  dark: { bg: '#121214', fg: '#ecebe6', muted: '#7c7c84', accent: '#f2c230', line: '#2a2a2e' },
}

const lower = 'abcdefghijklmnopqrstuvwxyz'
const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const figs = '0123456789'
const punct = '.,:;-–\'’‘!?…@&'

const page = (t, body, width) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: YD; src: url('${pathToFileURL(join(out, 'youj-display.otf'))}'); }
* { box-sizing: border-box; margin: 0 }
body { background: ${t.bg}; color: ${t.fg}; font-family: YD; font-kerning: normal; width: ${width}px; padding: 56px 64px; }
.label { font: 500 13px/1.4 ui-monospace, Menlo, monospace; color: ${t.muted}; letter-spacing: .02em; margin: 0 0 12px }
.grid { display: grid; grid-template-columns: repeat(13, 1fr); border-top: 1px solid ${t.line}; border-left: 1px solid ${t.line}; margin-bottom: 40px }
.cell { border-right: 1px solid ${t.line}; border-bottom: 1px solid ${t.line}; height: 120px; position: relative; display: flex; align-items: center; justify-content: center; font-size: 64px; line-height: 1 }
.cell small { position: absolute; left: 6px; top: 4px; font: 11px ui-monospace, Menlo, monospace; color: ${t.muted} }
.h { line-height: 1.05; margin-bottom: 28px; white-space: nowrap }
.acc { color: ${t.accent} }
p.body { font-size: 30px; line-height: 1.3; max-width: 1200px; margin-bottom: 28px }
</style><body>${body}</body>`

const cells = (s) =>
  [...s].map((c) => `<div class="cell"><small>${c === '&' ? '&amp;' : c}</small>${c === '&' ? '&amp;' : c}</div>`).join('')

const specimens = {
  charset: [
    1600,
    () =>
      `<div class="label">Youj Display (draft): lowercase</div><div class="grid">${cells(lower)}</div>` +
      `<div class="label">capitals</div><div class="grid">${cells(upper)}</div>` +
      `<div class="label">figures (tabular) and punctuation</div><div class="grid">${cells(figs + punct)}</div>`,
  ],
  headlines: [
    1800,
    () =>
      [
        ['youj', 220],
        ['Youj Display', 150],
        ['Build the interface.', 120],
        ['Motion that means something.', 92],
        ['Sound, icons, themes.', 112],
        ['0123456789', 120],
        ['Launch in 03 days 02 hours', 92],
        ['Seeding the canopy…', 100],
        ['Kerning the wordmark…', 100],
      ]
        .map(([s, px]) => `<div class="h" style="font-size:${px}px">${s}</div>`)
        .join(''),
  ],
  paragraph: [
    1400,
    () =>
      `<div class="label">rhythm (display face at text size; no kerning yet)</div>` +
      `<p class="body">Youj is a motion and interface kit: components that move with intent, sound that stays quiet until asked, icons drawn on one grid and themes that hold up in light and dark. Build the interface, then make it feel alive. Every stem, bar and bend here comes from the four letters of the wordmark; the rest of the alphabet is grown from them.</p>` +
      `<p class="body" style="font-size:22px">THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. the quick brown fox jumps over the lazy dog? Sphinx of black quartz, judge my vow! 24 hours, 7 days, 365 nights &amp; 1 launch @ 09:41.</p>` +
      `<p class="body" style="font-size:44px">hamburgefonstiv HAMBURGEFONSTIV nnonnoonn HHOHHOOHH 1234567890</p>`,
  ],
  detail: [
    1800,
    () =>
      `<div class="label">the hard glyphs, large</div>` +
      `<div class="h" style="font-size:240px;letter-spacing:.06em">aegskwxz</div>` +
      `<div class="h" style="font-size:240px;letter-spacing:.06em">RS2358&amp;@</div><div class="h" style="font-size:200px;letter-spacing:.06em">GAPDEFT47</div><div class="h" style="font-size:200px;letter-spacing:.06em">KXYVWZvw</div>` +
      `<div class="h" style="font-size:120px">nanenosnog kaxazawa R2S3 5R8S</div>`,
  ],
  variants: [
    1800,
    () => {
      const samples = { v: 'velvet move', x: 'six boxes', k: 'kink kayak', z: 'fizz zone', V: 'VIVID', X: 'XENON BOX', K: 'KAYAK', Z: 'ZERO ZONE' }
      const letters = [...new Set(variants.map((v) => v.letter))]
      return (
        `<div class="label">judgment calls: each option set in the font (private-use alternates); ● marks the default</div>` +
        letters
          .map((l) => {
            const opts = variants.filter((v) => v.letter === l)
            return (
              `<div style="display:flex;gap:48px;align-items:flex-end;margin:0 0 28px">` +
              opts
                .map((v, i) => {
                  const ch = String.fromCodePoint(v.cp)
                  const word = (samples[l] ?? l).replaceAll(l, ch)
                  return `<div><div class="label">${'AB'[i]} · ${l} ${v.label}${v.default ? ' ●' : ''}</div><div style="display:flex;align-items:baseline;gap:28px"><span style="font-size:150px;line-height:1">${ch}</span><span style="font-size:64px">${word}</span></div></div>`
                })
                .join('') +
              `</div>`
            )
          })
          .join('')
      )
    },
  ],
  small: [
    1100,
    () =>
      [16, 20, 24]
        .map(
          (px) =>
            `<div class="label">${px}px</div><p style="font-size:${px}px;line-height:1.35;margin:0 0 22px;max-width:980px">Youj is a motion and interface kit. Build the interface, then make it feel alive: Sound, icons, themes. Launch in 03 days 02 hours. Seeding the canopy… Kerning the wordmark… Quick wafting zephyrs vex bold Jim; THE FIVE BOXING WIZARDS JUMP QUICKLY. 0123456789</p>`,
        )
        .join(''),
  ],
  compare: [
    1800,
    (t) => {
      const k = 18 // px per grid unit
      const vb = '0 4 37.39 20'
      const svg = (inner, extra = '') =>
        `<svg viewBox="${vb}" width="${37.39 * k}" height="${20 * k}" ${extra}>${inner}</svg>`
      const logo = (fill, acc) => `<path d="${LOGO}" fill="${fill}"/><g fill="${acc}">${TITTLE}</g>`
      const text = (fill) => `<text x="-1.03" y="20" font-family="YD" font-size="20" fill="${fill}">youj</text>`
      const cap = (s) => `<div class="label" style="margin-top:8px">${s}</div>`
      return (
        `<div style="display:flex;gap:56px;align-items:flex-start;flex-wrap:wrap">` +
        `<div>${svg(logo(t.fg, t.accent))}${cap('the wordmark (docs/brand/logo.ts)')}</div>` +
        `<div>${svg(text(t.fg))}${cap('“youj” set in Youj Display')}</div>` +
        `<div style="background:#000">${svg(`<g style="isolation:isolate"><path d="${LOGO}" fill="#fff"/><g fill="#fff">${TITTLE}</g><g style="mix-blend-mode:difference">${text('#fff')}</g></g>`)}${cap('difference (black = identical)')}</div>` +
        `<div>${svg(`${logo('#ff3b30', '#ff3b30')}<g opacity=".55">${text('#00a3ff')}</g>`)}${cap('overlay: red logo, blue font')}</div>` +
        `</div>`
      )
    },
  ],
}

const browser = await chromium.launch()
for (const [mode, t] of Object.entries(THEMES)) {
  for (const [name, [width, body]] of Object.entries(specimens)) {
    const html = join(out, `_${name}-${mode}.html`)
    writeFileSync(html, page(t, body(t), width))
    const p = await browser.newPage({ viewport: { width, height: 400 }, deviceScaleFactor: 1 })
    await p.goto(pathToFileURL(html).href)
    await p.evaluate(() => document.fonts.ready)
    await p.screenshot({ path: join(out, `specimen-${name}${tag}-${mode}.png`), fullPage: true })
    await p.close()
  }
}
await browser.close()
console.log('specimens ->', out)

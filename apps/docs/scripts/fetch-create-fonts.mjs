// Downloads the Latin faces of the families Create offers (the web: rows of
// packages/ui/src/docs/create/fonts.ts, minus the ones the site already
// self-hosts) into public/fonts/create/, one stylesheet per family, so the
// preview never calls Google. Run it again when a family is added:
//   node apps/docs/scripts/fetch-create-fonts.mjs
import { mkdirSync, writeFileSync } from 'node:fs'

const FAMILIES = [
  ['ibm-plex-sans', 'IBM Plex Sans', 'wght@100..700'],
  ['manrope', 'Manrope', 'wght@200..800'],
  ['dm-sans', 'DM Sans', 'opsz,wght@9..40,100..1000'],
  ['plus-jakarta-sans', 'Plus Jakarta Sans', 'wght@200..800'],
  ['outfit', 'Outfit', 'wght@100..900'],
  ['space-grotesk', 'Space Grotesk', 'wght@300..700'],
  ['bricolage-grotesque', 'Bricolage Grotesque', 'opsz,wght@12..96,200..800'],
  ['instrument-serif', 'Instrument Serif', 'wght@400'],
  ['fraunces', 'Fraunces', 'opsz,wght@9..144,100..900'],
  ['newsreader', 'Newsreader', 'opsz,wght@6..72,200..800'],
  ['source-serif-4', 'Source Serif 4', 'opsz,wght@8..60,200..900'],
  ['ibm-plex-serif', 'IBM Plex Serif', 'wght@400;500;600;700'],
  ['ibm-plex-mono', 'IBM Plex Mono', 'wght@400;500;600;700'],
  ['dm-mono', 'DM Mono', 'wght@300;400;500'],
  ['space-mono', 'Space Mono', 'wght@400;700'],
]
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const out = new URL('../public/fonts/create/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

for (const [id, name, axes] of FAMILIES) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:${axes}&display=swap`, { headers: { 'user-agent': UA } })).text()
  const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]*\})/g)].filter((m) => m[1] === 'latin')
  if (!blocks.length) throw new Error(`${id}: no latin face`)
  let n = 0
  const faces = []
  for (const [, , block] of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)[1]
    const file = `${id}-${++n}.woff2`
    writeFileSync(out + file, Buffer.from(await (await fetch(url)).arrayBuffer()))
    faces.push(block.replace(url, `/fonts/create/${file}`))
  }
  writeFileSync(`${out}${id}.css`, faces.join('\n') + '\n')
  console.log(id, blocks.length)
}

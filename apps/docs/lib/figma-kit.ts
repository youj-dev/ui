import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { siteUrl } from './site'
import { zip } from './zip'

/* The Figma kit plugin as a download: the manifest and the bundle it points
 * at, from packages/figma, which `pnpm generate` builds before every dev and
 * build run. Everything sits in one folder, so unzipping doesn't spill. */

export const FIGMA_PLUGIN_ZIP = '/downloads/youj-figma-plugin.zip'

const FOLDER = 'youj-figma-plugin'

const readme = () => `Youj kit: a Figma development plugin
========================================

It builds the Youj design system in a Figma file from the code: variables for
every theme and mode, text and effect styles, all the icons as components, the
foundations pages and the components.

You need the Figma desktop app (development plugins can't be imported in the
browser) and edit access to a design file. Any plan works; see "Plans" below.

Install (about a minute)
1. In Figma desktop, create a new design file in your Drafts.
2. Right-click the canvas (or open the main menu) >
   Plugins > Development > Import plugin from manifest...
   and pick manifest.json in this folder. You only do this once.
3. Plugins > Development > Youj kit > Build or update the kit.
   A panel lists each step. A clean build closes it and lands on the cover;
   if anything fails, the panel stays open with what failed, the page it was
   drawing says why, and every other page is still built.
   A new file is built in the Classic style on Basalt, dark.
4. To switch style: Plugins > Development > Youj kit > Style > Classic (default)
   or Bezel. It rebuilds the kit; the components are redrawn in place.
5. To switch theme: Plugins > Development > Youj kit > Theme > (any preset and mode).

Type is set in Inter and JetBrains Mono (Basalt's families). If Figma can't load
them the kit falls back to Roboto and Roboto Mono and says so on the cover.

Keep this folder where it is: Figma loads dist/code.js from next to manifest.json.
To update, download the plugin again, replace this folder and run step 3 again.
Everything updates in place; your instances stay linked.

Plans
- Professional and up: themes and Light/Dark are modes of the Theme and Color
  collections.
- Starter (free): one mode per collection, so each theme gets its own
  collection and Youj kit > Theme switches the file. A Starter team file
  allows three pages, so the kit folds into Youj, Icons and Components.

Troubleshooting
- "Import plugin from manifest" is missing: you're in the browser. Use the
  desktop app.
- A page says it "isn't built yet" or "didn't build": run step 3 again. It
  carries on in place. Plugins > Development > Show/Hide console has details.
- The build takes a few minutes on a slow machine (tens of thousands of layers, most of them illustrations). Keep
  the file open until the panel says it's done.

Motion lives in code. The docs play it: ${siteUrl()}/docs/figma
`

/** The zip's files: the manifest, the bundle at the path the manifest names, and a README. */
export function figmaPluginFiles(dir = join(process.cwd(), '../../packages/figma')) {
  const manifest = readFileSync(join(dir, 'manifest.json'), 'utf8')
  const main = (JSON.parse(manifest) as { main: string }).main
  const code = join(dir, main)
  if (!existsSync(code)) throw new Error(`${code} is missing: run \`pnpm -F @youj/figma build\` (pnpm generate does)`)
  return [
    { path: `${FOLDER}/manifest.json`, content: manifest },
    { path: `${FOLDER}/${main}`, content: readFileSync(code, 'utf8') },
    { path: `${FOLDER}/README.txt`, content: readme() },
  ]
}

export function figmaPluginZip(): Uint8Array {
  return zip(figmaPluginFiles())
}

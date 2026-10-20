/* Builds the plugin: runs the data step (tokens, themes, icons, logo, blocks,
 * read from the code) and bundles the plugin with that data inlined into
 * dist/code.js, one script for Figma's sandbox. Nothing is fetched at run time.
 *
 *   pnpm -F @youj/figma build */

import { bundlePlugin, loadKit } from './bundle.ts'

const kit = await loadKit()
const code = await bundlePlugin(kit)
console.log(
  `Youj kit ${kit.hash}: ${kit.colors.length} colours, ${kit.text.length} text styles, ${kit.icons.length} icons, ${kit.blocks.length} blocks → dist/code.js (${(code.length / 1024 / 1024).toFixed(1)} MB)`,
)
console.log('In Figma desktop: Plugins → Development → Import plugin from manifest… → packages/figma/manifest.json')

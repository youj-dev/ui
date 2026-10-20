/* Writes THIRD_PARTY_LICENSES.md: the licence of every package bundled into
 * dist/server.mjs (tsdown.config.ts lists them), which the published package
 * must carry. Run after changing the bundled dependencies:
 *   node scripts/licenses.ts */

import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const BUNDLED = ['@modelcontextprotocol/sdk', 'zod', 'zod-to-json-schema', 'ajv', 'ajv-formats', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse']

// pnpm keeps a package's dependencies beside it in its store folder: look
// beside the SDK, then beside ajv, for the copies the bundle actually has.
const sdk = realpathSync(join(pkg, 'node_modules/@modelcontextprotocol/sdk'))
const beside = (dir: string, depth: number) => join(dir, ...Array<string>(depth).fill('..'))
const roots = [beside(sdk, 2), beside(realpathSync(join(beside(sdk, 2), 'ajv')), 1)]
const sections = BUNDLED.map((name) => {
  const dir = name === '@modelcontextprotocol/sdk' ? sdk : roots.map((r) => join(r, name)).find((d) => existsSync(join(d, 'package.json')))
  if (!dir) throw new Error(`Can't find ${name} beside the SDK`)
  const { version, license } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { version: string; license: string }
  const file = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f))
  const text = file ? readFileSync(join(dir, file), 'utf8').trim() : `${license} (no licence file in the package)`
  return `## ${name}@${version} (${license})\n\n\`\`\`\n${text}\n\`\`\``
})
writeFileSync(join(pkg, 'THIRD_PARTY_LICENSES.md'), `# Third-party licences\n\n\`dist/server.mjs\` bundles these packages.\n\n${sections.join('\n\n')}\n`)
console.log(`licences: ${BUNDLED.length} packages → THIRD_PARTY_LICENSES.md`)

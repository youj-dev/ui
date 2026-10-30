// Generates each miniature's entry from its metadata (src/meta/<id>.ts), so
// adding one never touches shared lists by hand:
//
//   src/<id>.tsx                  the component, its handle and key types
//   package.json                  exports and publishConfig.exports
//   src/index.ts                  the catalogue (imports, export list, array)
//
//   node scripts/generate.mjs          write the files
//   node scripts/generate.mjs --check  exit 1 if any is stale
//
// The figure (src/figures), story and test are written by hand, and so are the
// components in HAND_WRITTEN (they do more than render the figure).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readTextIfExists } from '../../../scripts/read-text.mjs'

const pkg = join(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const stale = []

/* The weather station's component adds a `wind` prop that drives the figure. */
const HAND_WRITTEN = new Set(['weather-station'])

const pascal = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

const ids = readdirSync(join(pkg, 'src/meta'))
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.slice(0, -'.ts'.length))
  .sort()

const metas = []
for (const id of ids) {
  const mod = await import(pathToFileURL(join(pkg, `src/meta/${id}.ts`)).href)
  const [exportName, meta] = Object.entries(mod)[0]
  metas.push({ id, exportName, meta })
}

const write = (path, text) => {
  const file = join(pkg, path)
  if (readTextIfExists(file) === text) return
  if (check) stale.push(path)
  else writeFileSync(file, text)
}

const component = ({ id, exportName, meta }) => {
  const Name = 'Miniature' + pascal(id.replace(/^3d/, 'three-d'))
  const handle = meta.progress ? 'MiniatureProgressHandle' : 'MiniatureHandle'
  const props = meta.progress ? 'MiniatureProgressProps' : 'MiniatureProps'
  const keyDoc = meta.keys.map((k) => `${k.caps.join(' ')} ${k.label}`).join(' · ')
  return `import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { ${handle}, MiniatureKeyOf, ${props} } from './engine/types'
import { figure } from './figures/${id}'
import { ${exportName} } from './meta/${id}'

export { ${exportName} }
export type ${Name}Key = MiniatureKeyOf<typeof ${exportName}>
export type ${Name}Handle = ${handle}<${Name}Key>
export interface ${Name}Props extends ${props} {
  ref?: Ref<${Name}Handle>
}

/**
 * ${meta.model}, ${meta.name.toLowerCase()}. ${meta.description}
 *
 * Keys: ${keyDoc}.
 */
export function ${Name}(props: ${Name}Props) {
  return <Miniature {...props} meta={${exportName}} figure={figure} />
}
`
}

for (const m of metas) if (!HAND_WRITTEN.has(m.id)) write(`src/${m.id}.tsx`, component(m))

const manifestPath = join(pkg, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
manifest.exports = {
  '.': manifest.exports['.'],
  ...Object.fromEntries(metas.map(({ id }) => [`./${id}`, `./src/${id}.tsx`])),
}
manifest.publishConfig.exports = {
  '.': manifest.publishConfig.exports['.'],
  ...Object.fromEntries(metas.map(({ id }) => [`./${id}`, { types: `./dist/${id}.d.ts`, default: `./dist/${id}.js` }])),
  './package.json': './package.json',
}
write('package.json', `${JSON.stringify(manifest, null, 2)}\n`)

const names = metas.map((m) => m.exportName)
let index = readFileSync(join(pkg, 'src/index.ts'), 'utf8')
index = index.replace(/^import \{ \w+ \} from '\.\/meta\/[\w-]+'\n/gm, '')
index = index.replace(/^(\/\* MINIATURES \*\/)/m, `${metas.map((m) => `import { ${m.exportName} } from './meta/${m.id}'`).join('\n')}\n$1`)
index = index.replace(/export const miniatures = \[[^\]]*\]/, `export const miniatures = [${names.join(', ')}]`)
index = index.replace(/export \{ [\w, ]+ \}\n/, `export { ${names.join(', ')} }\n`)
write('src/index.ts', index)

if (check && stale.length) {
  console.error(`stale: ${stale.join(', ')}\nrun \`pnpm -F @youj/miniatures generate\``)
  process.exit(1)
}

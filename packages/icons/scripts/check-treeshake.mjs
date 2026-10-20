// Guards tree-shaking of the published build: an app that imports one icon from
// dist/ must bundle that icon and the engine, not the set. Bundles a one-icon,
// a five-icon and a whole-set entry for production and checks the sizes.
// Run after `pnpm build` (verify does). Pass --report to print without failing.
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.js')
if (!existsSync(dist)) {
  console.error('check-treeshake: dist/ is missing, run `pnpm -F @youj/icons build` first')
  process.exit(1)
}

// Budgets in bytes (minified, react, motion and @youj/core left external).
const ONE_ICON_MAX = 8_000
const FIVE_ICONS_MAX = 14_000
const ONE_ICON_SHARE_OF_ALL = 0.05

const bundle = async (entry) => {
  const out = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'entry',
        resolveId: (id) => (id === 'virtual:entry' ? '\0virtual:entry' : null),
        load: (id) => (id === '\0virtual:entry' ? entry : null),
      },
    ],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      minify: true,
      modulePreload: false,
      rollupOptions: { input: 'virtual:entry', external: [/^react(\/|$)/, /^motion(\/|$)/, /^@youj\/core(\/|$)/] },
    },
  })
  const code = [out].flat()[0].output[0].code
  return { bytes: Buffer.byteLength(code), icons: new Set(code.match(/\bname:["`][a-z0-9-]+["`]/g) ?? []).size }
}

const src = (names) => `import { ${names.join(', ')} } from ${JSON.stringify(dist)}\nconsole.log(${names.join(', ')})`
const one = await bundle(src(['BellIcon']))
const five = await bundle(src(['BellIcon', 'HeartIcon', 'StarIcon', 'HomeIcon', 'SearchIcon']))
const all = await bundle(`import * as A from ${JSON.stringify(dist)}\nconsole.log(A)`)

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
console.log(`one icon:   ${kb(one.bytes)} (${one.icons} icons)`)
console.log(`five icons: ${kb(five.bytes)} (${five.icons} icons)`)
console.log(`whole set:  ${kb(all.bytes)} (${all.icons} icons)`)
if (process.argv.includes('--report')) process.exit(0)

const problems = []
if (one.bytes > ONE_ICON_MAX) problems.push(`one icon is ${kb(one.bytes)}, budget ${kb(ONE_ICON_MAX)}`)
if (five.bytes > FIVE_ICONS_MAX) problems.push(`five icons are ${kb(five.bytes)}, budget ${kb(FIVE_ICONS_MAX)}`)
if (one.bytes > all.bytes * ONE_ICON_SHARE_OF_ALL) problems.push('one icon is a large share of the whole set: tree-shaking is not working')
if (one.icons > 1) problems.push(`one icon pulls in ${one.icons} icons`)
if (problems.length) {
  console.error(`check-treeshake failed:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log('check-treeshake: ok')
